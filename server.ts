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
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  const info = await transporter.sendMail({
    from: params.senderName ? `"${params.senderName}" <${fromAddr}>` : fromAddr,
    to: params.toList.join(', '),
    cc: params.ccList.length > 0 ? params.ccList.join(', ') : undefined,
    subject: params.subject,
    text: params.body,
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
      senderName?: string;
      webhookUrl?: string;
      type?: string;
      relatedId?: string;
      timestamp?: string;
    };

    const rawToList = splitEmails(bodyData.to);
    const toList = rawToList.filter((addr) => !isPlaceholderEmail(addr));
    const ccList = splitEmails(bodyData.cc).filter(
      (addr) => !isPlaceholderEmail(addr) && !toList.includes(addr)
    );
    const subject = (bodyData.subject || '').trim();
    const body = (bodyData.body || '').trim();
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

    const status = getEmailChannelStatus();

    // Priority 1: Configured Webhook (Google Apps Script / Make / Zapier / n8n)
    if (effectiveWebhook) {
      try {
        await dispatchViaWebhook(effectiveWebhook, {
          to: toList.join(', '),
          cc: ccList.join(', '),
          subject,
          body,
          sender: senderName,
          timestamp: bodyData.timestamp || new Date().toISOString(),
          type: bodyData.type,
          relatedId: bodyData.relatedId,
        });
        res.json({
          ok: true,
          channel: 'webhook',
          recipient: toList.join(', '),
          message: `Đã tự động gửi email qua Webhook tới ${toList.join(', ')}`,
        });
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi gửi qua Webhook';
        // Fall through to SMTP / Resend if configured on server; otherwise return error
        if (!status.smtpConfigured && !status.resendConfigured) {
          res.status(502).json({
            ok: false,
            channel: 'webhook',
            message: msg,
          });
          return;
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
          senderName,
        });
        res.json({
          ok: true,
          channel: 'smtp',
          messageId,
          recipient: toList.join(', '),
          message: `Đã tự động gửi email qua SMTP tới ${toList.join(', ')}`,
        });
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi gửi qua SMTP';
        if (!status.resendConfigured) {
          res.status(502).json({
            ok: false,
            channel: 'smtp',
            message: `Lỗi SMTP: ${msg}`,
          });
          return;
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
          senderName,
        });
        res.json({
          ok: true,
          channel: 'resend',
          messageId,
          recipient: toList.join(', '),
          message: `Đã tự động gửi email qua Resend tới ${toList.join(', ')}`,
        });
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi gửi qua Resend';
        res.status(502).json({
          ok: false,
          channel: 'resend',
          message: `Lỗi Resend: ${msg}`,
        });
        return;
      }
    }

    res.status(400).json({
      ok: false,
      notConfigured: true,
      message:
        'Chưa cấu hình kênh gửi tự động (hãy dán link Webhook Google Apps Script miễn phí trong tab Thông Báo Email hoặc thêm SMTP_USER / SMTP_PASS vào Secrets).',
    });
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
