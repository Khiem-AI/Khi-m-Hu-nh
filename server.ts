import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

function getEmailChannelStatus() {
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const envWebhookUrl = (process.env.EMAIL_WEBHOOK_URL || '').trim();

  const smtpConfigured = Boolean(smtpUser && smtpPass);
  const resendConfigured = Boolean(resendKey);
  const envWebhookConfigured = Boolean(envWebhookUrl && /^https?:\/\//i.test(envWebhookUrl));

  const activeChannels: string[] = [];
  if (smtpConfigured) activeChannels.push('smtp');
  if (resendConfigured) activeChannels.push('resend');
  if (envWebhookConfigured) activeChannels.push('webhook');

  return {
    smtpConfigured,
    resendConfigured,
    envWebhookConfigured,
    smtpUser: smtpConfigured ? smtpUser : '',
    activeChannels,
  };
}

const PLACEHOLDER_DOMAINS = ['@factory.com', '@example.com', '@test.com', '@demo.com'];

function isPlaceholderEmail(email: string): boolean {
  const lower = email.trim().toLowerCase();
  return PLACEHOLDER_DOMAINS.some((domain) => lower.endsWith(domain));
}

function getVietnamTodayYMD(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}

function normalizeDedupText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function buildEmailDedupKey(params: {
  day: string;
  toList: string[];
  ccList: string[];
  subject: string;
  body: string;
}): string {
  const sortedTo = [...params.toList].map((e) => e.toLowerCase()).sort().join(',');
  const sortedCc = [...params.ccList].map((e) => e.toLowerCase()).sort().join(',');
  return `${params.day}|${sortedTo}|${sortedCc}|${normalizeDedupText(params.subject)}|${normalizeDedupText(params.body)}`;
}

interface DailySentCacheEntry {
  day: string;
  channel: string;
  recipient: string;
  messageId?: string;
  sentAt: string;
}

const sentEmailDailyCache = new Map<string, DailySentCacheEntry>();
const inFlightEmailMap = new Map<
  string,
  Promise<{ status: number; payload: Record<string, unknown> }>
>();

function pruneStaleDailyCache(todayYMD: string) {
  for (const [key, entry] of sentEmailDailyCache.entries()) {
    if (entry.day !== todayYMD) {
      sentEmailDailyCache.delete(key);
    }
  }
}

function splitEmails(raw?: string): string[] {
  if (!raw || typeof raw !== 'string') return [];
  return Array.from(
    new Set(
      raw
        .split(/[,;]+/)
        .map((s) => s.trim())
        .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
    )
  );
}

async function dispatchViaWebhook(
  webhookUrl: string,
  payload: {
    to: string;
    cc: string;
    subject: string;
    body: string;
    htmlBody?: string;
    sender: string;
    timestamp: string;
    type?: string;
    relatedId?: string;
  }
) {
  const trimmedUrl = webhookUrl.trim();
  const lowerUrl = trimmedUrl.toLowerCase();

  if (
    lowerUrl.includes('docs.google.com/') ||
    lowerUrl.includes('drive.google.com/') ||
    lowerUrl.includes('mail.google.com/') ||
    lowerUrl.includes('script.google.com/home') ||
    lowerUrl.includes('/edit')
  ) {
    throw new Error(
      'URL Webhook không hợp lệ (đây là link trình soạn thảo/tài liệu, không phải link Web App /exec). Hãy xóa Webhook để gửi trực tiếp qua Gmail hoặc Deploy Web App đúng cách.'
    );
  }

  const isAppsScript = lowerUrl.includes('script.google.com');
  if (isAppsScript && /\/dev(\?|$)/i.test(trimmedUrl)) {
    throw new Error(
      'Link Google Apps Script đang là link thử nghiệm (/dev). Hãy Deploy → Web App và copy link chính thức kết thúc bằng /exec.'
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(trimmedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': isAppsScript ? 'text/plain;charset=utf-8' : 'application/json',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`Webhook trả về HTTP ${res.status}${text ? `: ${text.slice(0, 140)}` : ''}`);
  }

  if (
    contentType.includes('text/html') ||
    /<!doctype|<html|accounts\.google\.com|ServiceLogin|Script function not found/i.test(text)
  ) {
    throw new Error(
      isAppsScript
        ? 'Webhook Apps Script trả về trang HTML/lỗi (chưa có hàm doPost, chưa chọn quyền "Anyone / Bất kỳ ai" khi Deploy, hoặc script gặp lỗi).'
        : 'Webhook trả về trang HTML thay vì JSON. Vui lòng kiểm tra lại URL Webhook.'
    );
  }

  if (isAppsScript) {
    let parsed: { ok?: boolean; error?: string; sentTo?: string } | null = null;
    try {
      parsed = text ? (JSON.parse(text) as { ok?: boolean; error?: string; sentTo?: string }) : null;
    } catch {
      throw new Error(
        `Webhook Apps Script không trả về JSON xác nhận { "ok": true } (phản hồi nhận được: "${text.slice(0, 80)}"). Hãy kiểm tra lại mã doPost và Deploy phiên bản mới (New version), hoặc xóa Webhook để dùng Gmail trực tiếp.`
      );
    }
    if (!parsed || parsed.ok !== true) {
      throw new Error(
        parsed?.error ||
          'Webhook Apps Script không xác nhận đã gửi mail (thiếu { "ok": true }). Hãy Deploy phiên bản mới hoặc xóa Webhook để dùng Gmail trực tiếp.'
      );
    }
    return;
  }

  if (text) {
    try {
      const json = JSON.parse(text) as { ok?: boolean; success?: boolean; error?: string };
      if (json && (json.ok === false || json.success === false)) {
        throw new Error(json.error || 'Webhook trả về lỗi xử lý');
      }
    } catch (err) {
      if (
        err instanceof Error &&
        !err.message.includes('JSON') &&
        !err.message.includes('Unexpected token')
      ) {
        throw err;
      }
    }
  }
}

async function dispatchViaResend(params: {
  toList: string[];
  ccList: string[];
  subject: string;
  body: string;
  html?: string;
  senderName: string;
}) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const fromEmail = (process.env.RESEND_FROM || 'onboarding@resend.dev').trim();
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.senderName ? `${params.senderName} <${fromEmail}>` : fromEmail,
      to: params.toList,
      cc: params.ccList.length > 0 ? params.ccList : undefined,
      subject: params.subject,
      text: params.body,
      html: params.html || undefined,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { message?: string; id?: string };
  if (!res.ok) {
    throw new Error(data.message || `Resend HTTP ${res.status}`);
  }
  return data.id || 'resend-ok';
}

async function dispatchViaSmtp(params: {
  toList: string[];
  ccList: string[];
  subject: string;
  body: string;
  html?: string;
  senderName: string;
}) {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === 'true'
      : port === 465;
  const user = (process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || '').trim();
  const pass = host.includes('gmail.com') ? rawPass.replace(/\s+/g, '') : rawPass;
  const fromAddr = (process.env.SMTP_FROM || user).trim();

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    family: 4,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  } as Parameters<typeof nodemailer.createTransport>[0]);

  const info = await transporter.sendMail({
    from: params.senderName ? `"${params.senderName}" <${fromAddr}>` : fromAddr,
    to: params.toList.join(', '),
    cc: params.ccList.length > 0 ? params.ccList.join(', ') : undefined,
    subject: params.subject,
    text: params.body,
    html: params.html || undefined,
  });

  return info.messageId || 'smtp-ok';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/email-status', (_req, res) => {
    res.json(getEmailChannelStatus());
  });

  app.post('/api/send-email', async (req, res) => {
    const bodyData = (req.body || {}) as {
      to?: string;
      cc?: string;
      subject?: string;
      body?: string;
      html?: string;
      senderName?: string;
      webhookUrl?: string;
      type?: string;
      relatedId?: string;
      timestamp?: string;
      allowDuplicate?: boolean;
    };

    const rawToList = splitEmails(bodyData.to);
    const toList = rawToList.filter((addr) => !isPlaceholderEmail(addr));
    const ccList = splitEmails(bodyData.cc).filter(
      (addr) => !isPlaceholderEmail(addr) && !toList.includes(addr)
    );
    const subject = (bodyData.subject || '').trim();
    const body = (bodyData.body || '').trim();
    const html = typeof bodyData.html === 'string' && bodyData.html.trim() ? bodyData.html : undefined;
    const senderName = (bodyData.senderName || 'FACILITY SYSTEM MANAGEMENT').trim();
    const requestWebhook = (bodyData.webhookUrl || '').trim();
    const envWebhook = (process.env.EMAIL_WEBHOOK_URL || '').trim();
    const effectiveWebhook = /^https?:\/\//i.test(requestWebhook)
      ? requestWebhook
      : /^https?:\/\//i.test(envWebhook)
      ? envWebhook
      : '';

    if (rawToList.length === 0) {
      res.status(400).json({
        ok: false,
        message: 'Địa chỉ email người nhận không hợp lệ hoặc bị trống.',
      });
      return;
    }

    if (toList.length === 0) {
      res.status(400).json({
        ok: false,
        message: `Địa chỉ người nhận (${rawToList.join(', ')}) là email mẫu (@factory.com) nên không thể gửi thật. Vui lòng nhập Gmail / email thực tế.`,
      });
      return;
    }

    if (!subject || !body) {
      res.status(400).json({
        ok: false,
        message: 'Thiếu tiêu đề hoặc nội dung email.',
      });
      return;
    }

    const todayYMD = getVietnamTodayYMD();
    pruneStaleDailyCache(todayYMD);
    const allowDuplicate = Boolean(bodyData.allowDuplicate);
    const dedupKey = buildEmailDedupKey({
      day: todayYMD,
      toList,
      ccList,
      subject,
      body,
    });

    if (!allowDuplicate) {
      const cached = sentEmailDailyCache.get(dedupKey);
      if (cached) {
        res.json({
          ok: true,
          deduplicated: true,
          channel: cached.channel,
          recipient: cached.recipient,
          messageId: cached.messageId,
          message:
            'Email có nội dung giống hệt đã được gửi trong ngày hôm nay nên hệ thống tự động bỏ qua gửi trùng.',
        });
        return;
      }

      const existingInFlight = inFlightEmailMap.get(dedupKey);
      if (existingInFlight) {
        const result = await existingInFlight;
        res.status(result.status).json(result.payload);
        return;
      }
    }

    const status = getEmailChannelStatus();

    const executeDispatch = async (): Promise<{
      status: number;
      payload: Record<string, unknown>;
    }> => {
      // Priority 1: Configured Webhook (Google Apps Script / Make / Zapier / n8n)
      if (effectiveWebhook) {
        try {
          await dispatchViaWebhook(effectiveWebhook, {
            to: toList.join(', '),
            cc: ccList.join(', '),
            subject,
            body,
            htmlBody: html,
            sender: senderName,
            timestamp: bodyData.timestamp || new Date().toISOString(),
            type: bodyData.type,
            relatedId: bodyData.relatedId,
          });
          if (!allowDuplicate) {
            sentEmailDailyCache.set(dedupKey, {
              day: todayYMD,
              channel: 'webhook',
              recipient: toList.join(', '),
              sentAt: new Date().toISOString(),
            });
          }
          return {
            status: 200,
            payload: {
              ok: true,
              channel: 'webhook',
              recipient: toList.join(', '),
              message: `Đã tự động gửi email qua Webhook tới ${toList.join(', ')}`,
            },
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Lỗi gửi qua Webhook';
          // Fall through to SMTP / Resend if configured on server; otherwise return error
          if (!status.smtpConfigured && !status.resendConfigured) {
            return {
              status: 502,
              payload: {
                ok: false,
                channel: 'webhook',
                message: msg,
              },
            };
          }
        }
      }

      // Priority 2: Server SMTP (Gmail App Password / Custom SMTP)
      if (status.smtpConfigured) {
        try {
          const messageId = await dispatchViaSmtp({
            toList,
            ccList,
            subject,
            body,
            html,
            senderName,
          });
          if (!allowDuplicate) {
            sentEmailDailyCache.set(dedupKey, {
              day: todayYMD,
              channel: 'smtp',
              recipient: toList.join(', '),
              messageId,
              sentAt: new Date().toISOString(),
            });
          }
          return {
            status: 200,
            payload: {
              ok: true,
              channel: 'smtp',
              messageId,
              recipient: toList.join(', '),
              message: `Đã tự động gửi email qua SMTP tới ${toList.join(', ')}`,
            },
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Lỗi gửi qua SMTP';
          const isTimeout = /timeout|ETIMEDOUT|ECONNREFUSED|ENETUNREACH/i.test(msg);
          if (!status.resendConfigured) {
            return {
              status: 502,
              payload: {
                ok: false,
                channel: 'smtp',
                message: isTimeout
                  ? `Lỗi SMTP (${msg}): Gói miễn phí Render.com chặn cổng SMTP 465/587. Hãy dùng Google Apps Script Webhook (dán link /exec vào EMAIL_WEBHOOK_URL trên Render hoặc ô Webhook Endpoint — chạy qua HTTPS 443 hoàn toàn miễn phí).`
                  : `Lỗi SMTP: ${msg}`,
              },
            };
          }
        }
      }

      // Priority 3: Resend API
      if (status.resendConfigured) {
        try {
          const messageId = await dispatchViaResend({
            toList,
            ccList,
            subject,
            body,
            html,
            senderName,
          });
          if (!allowDuplicate) {
            sentEmailDailyCache.set(dedupKey, {
              day: todayYMD,
              channel: 'resend',
              recipient: toList.join(', '),
              messageId,
              sentAt: new Date().toISOString(),
            });
          }
          return {
            status: 200,
            payload: {
              ok: true,
              channel: 'resend',
              messageId,
              recipient: toList.join(', '),
              message: `Đã tự động gửi email qua Resend tới ${toList.join(', ')}`,
            },
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Lỗi gửi qua Resend';
          return {
            status: 502,
            payload: {
              ok: false,
              channel: 'resend',
              message: `Lỗi Resend: ${msg}`,
            },
          };
        }
      }

      return {
        status: 400,
        payload: {
          ok: false,
          notConfigured: true,
          message:
            'Chưa cấu hình kênh gửi tự động (hãy dán link Webhook Google Apps Script miễn phí trong tab Thông Báo Email hoặc thêm SMTP_USER / SMTP_PASS vào Secrets).',
        },
      };
    };

    if (allowDuplicate) {
      const result = await executeDispatch();
      res.status(result.status).json(result.payload);
      return;
    }

    const promise = executeDispatch().finally(() => {
      inFlightEmailMap.delete(dedupKey);
    });
    inFlightEmailMap.set(dedupKey, promise);
    const result = await promise;
    res.status(result.status).json(result.payload);
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FSM Server] Running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
