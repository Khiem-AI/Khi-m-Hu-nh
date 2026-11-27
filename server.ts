import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
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
  const defaultJsonParser = express.json({ limit: '2mb' });
  app.use((req, res, next) => {
    if (
      req.path === '/api/workspace/sync' ||
      req.path === '/api/workspace/pending-cloud-op'
    ) {
      next();
      return;
    }
    defaultJsonParser(req, res, next);
  });

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

  // --- Real-Time Online User Presence API ---
  interface PresenceSessionRecord {
    sessionId: string;
    maNhanVien: string;
    tenNhanVien: string;
    chucVu: string;
    phongBan?: string;
    currentTab: string;
    currentTabLabel: string;
    deviceType: 'Desktop' | 'Mobile';
    lastActiveAt: number;
  }

  const PRESENCE_TTL_MS = 65_000;
  const MAX_PRESENCE_SESSIONS = 500;
  const presenceSessions = new Map<string, PresenceSessionRecord>();

  const pruneAndAggregateOnlineUsers = () => {
    const now = Date.now();
    for (const [sid, session] of presenceSessions.entries()) {
      if (now - session.lastActiveAt > PRESENCE_TTL_MS) {
        presenceSessions.delete(sid);
      }
    }

    const byUser = new Map<
      string,
      {
        maNhanVien: string;
        tenNhanVien: string;
        chucVu: string;
        phongBan?: string;
        currentTab: string;
        currentTabLabel: string;
        deviceType: 'Desktop' | 'Mobile';
        lastActiveAt: number;
        sessionCount: number;
        source: 'server';
      }
    >();

    for (const s of presenceSessions.values()) {
      const key = s.maNhanVien.trim().toUpperCase();
      const existing = byUser.get(key);
      if (!existing) {
        byUser.set(key, {
          maNhanVien: s.maNhanVien,
          tenNhanVien: s.tenNhanVien,
          chucVu: s.chucVu,
          phongBan: s.phongBan,
          currentTab: s.currentTab,
          currentTabLabel: s.currentTabLabel,
          deviceType: s.deviceType,
          lastActiveAt: s.lastActiveAt,
          sessionCount: 1,
          source: 'server',
        });
      } else {
        existing.sessionCount += 1;
        if (s.lastActiveAt >= existing.lastActiveAt) {
          existing.lastActiveAt = s.lastActiveAt;
          existing.currentTab = s.currentTab;
          existing.currentTabLabel = s.currentTabLabel;
          existing.deviceType = s.deviceType;
          existing.tenNhanVien = s.tenNhanVien;
          existing.chucVu = s.chucVu;
          existing.phongBan = s.phongBan;
        }
      }
    }

    return Array.from(byUser.values()).sort((a, b) => b.lastActiveAt - a.lastActiveAt);
  };

  const safeClip = (val: unknown, maxLen: number): string =>
    typeof val === 'string' ? val.trim().slice(0, maxLen) : '';

  let getWorkspaceSyncMeta = (): {
    cloudHydrated: boolean;
    workspaceRevision: number;
    pendingCloudCount: number;
  } => ({
    cloudHydrated: false,
    workspaceRevision: 0,
    pendingCloudCount: 0,
  });

  app.post('/api/presence/heartbeat', (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const sessionId = safeClip(body.sessionId, 80);
    const maNhanVien = safeClip(body.maNhanVien, 40);
    const tenNhanVien = safeClip(body.tenNhanVien, 120);

    if (!sessionId || !maNhanVien || !tenNhanVien) {
      res.status(400).json({ ok: false, message: 'Thiếu thông tin phiên người dùng.' });
      return;
    }

    const chucVu = safeClip(body.chucVu, 80) || 'Nhân viên';
    const phongBan = safeClip(body.phongBan, 120) || undefined;
    const currentTab = safeClip(body.currentTab, 60) || 'dashboard';
    const currentTabLabel = safeClip(body.currentTabLabel, 100) || 'Tổng quan';
    const deviceType: 'Desktop' | 'Mobile' = body.deviceType === 'Mobile' ? 'Mobile' : 'Desktop';

    if (presenceSessions.size >= MAX_PRESENCE_SESSIONS && !presenceSessions.has(sessionId)) {
      pruneAndAggregateOnlineUsers();
    }

    presenceSessions.set(sessionId, {
      sessionId,
      maNhanVien,
      tenNhanVien,
      chucVu,
      phongBan,
      currentTab,
      currentTabLabel,
      deviceType,
      lastActiveAt: Date.now(),
    });

    const onlineUsers = pruneAndAggregateOnlineUsers();
    res.json({ ok: true, serverNow: Date.now(), onlineUsers, ...getWorkspaceSyncMeta() });
  });

  app.post(
    '/api/presence/leave',
    express.text({ type: 'text/plain', limit: '16kb' }),
    (req, res) => {
      let body: Record<string, unknown> = {};
      if (typeof req.body === 'string') {
        try {
          body = JSON.parse(req.body) as Record<string, unknown>;
        } catch {
          body = {};
        }
      } else if (req.body && typeof req.body === 'object') {
        body = req.body as Record<string, unknown>;
      }

      const sessionId = safeClip(body.sessionId, 80);
      if (sessionId) {
        presenceSessions.delete(sessionId);
      }

      const onlineUsers = pruneAndAggregateOnlineUsers();
      res.json({ ok: true, serverNow: Date.now(), onlineUsers });
    }
  );

  app.get('/api/presence/online', (_req, res) => {
    const onlineUsers = pruneAndAggregateOnlineUsers();
    res.json({ ok: true, serverNow: Date.now(), onlineUsers, ...getWorkspaceSyncMeta() });
  });

  // --- Shared Authenticated Workspace Sync Hub (Real-Time SSE + Cloud Bridge for Internal & Cloud Users) ---
  const BOOTSTRAPPED_ADMIN_EMAIL = 'khiemhuynhggs@gmail.com';
  const configuredDataDir = (process.env.CMMS_DATA_DIR || '').trim();
  const SERVER_DATA_DIR = configuredDataDir
    ? path.resolve(configuredDataDir)
    : path.resolve(__dirname, '.cmms-server-data');
  const SESSION_COOKIE_NAME = 'cmms_sync_sid';
  const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;
  const MAX_ACTIVE_SESSIONS = 1000;
  const MAX_SSE_CLIENTS = 500;
  const MAX_PENDING_CLOUD_OPS = 500;

  const ALLOWED_CLOUD_COLLECTIONS = new Set<string>([
    'settings',
    'equipment',
    'maintenance_plans',
    'maintenance_history',
    'tickets',
    'spare_parts',
    'stock_transactions',
    'power_10days',
    'water_monthly',
    'meter_readings',
    'cost_records',
    'employees_public',
    'employees_private',
    'documents',
    'projects',
    'safety_inspections',
    'tools',
    'tool_logs',
    'daily_area_checks',
    'purchase_requests',
    'email_logs',
    'audit_logs',
  ]);

  let firebaseProjectId = 'gen-lang-client-0762337637';
  try {
    const cfgPath = path.resolve(__dirname, 'firebase-applet-config.json');
    if (cfgPath.startsWith(path.resolve(__dirname) + path.sep)) {
      const cfgRaw = await fs.readFile(cfgPath, 'utf8');
      const cfg = JSON.parse(cfgRaw) as { projectId?: string };
      if (typeof cfg.projectId === 'string' && cfg.projectId.trim()) {
        firebaseProjectId = cfg.projectId.trim();
      }
    }
  } catch {
    // Use default projectId if config file is unavailable
  }

  function resolveServerDataFile(fileName: string): string {
    const safeName = path.basename(fileName);
    const resolved = path.resolve(SERVER_DATA_DIR, safeName);
    if (!resolved.startsWith(SERVER_DATA_DIR + path.sep)) {
      throw new Error('Invalid server data file path');
    }
    return resolved;
  }

  interface StoredCredential {
    salt: string;
    hash: string;
    userModified?: boolean;
    updatedAt: string;
  }

  interface WorkspaceStoreState {
    revision: number;
    updatedAt: string | null;
    updatedBy: string | null;
    cloudHydrated: boolean;
    snapshot: Record<string, unknown> | null;
  }

  interface PendingCloudOp {
    opId: string;
    colName: string;
    docId: string;
    action: 'upsert' | 'delete';
    sanitizedData?: Record<string, unknown>;
    updatedAt: string;
    updatedBy: string;
  }

  interface AuthSessionRecord {
    token: string;
    maNhanVien: string;
    tenNhanVien: string;
    chucVu: string;
    email: string;
    isAdmin: boolean;
    authType: 'cloud' | 'internal';
    expiresAt: number;
  }

  const activeSessions = new Map<string, AuthSessionRecord>();
  const credentialsStore = new Map<string, StoredCredential>();
  const pendingCloudOps = new Map<string, PendingCloudOp>();
  const sseClients = new Set<express.Response>();
  let seedEmployeesDirectory: Record<string, unknown>[] = [];
  const workspaceStore: WorkspaceStoreState = {
    revision: 0,
    updatedAt: null,
    updatedBy: null,
    cloudHydrated: false,
    snapshot: null,
  };

  getWorkspaceSyncMeta = () => ({
    cloudHydrated: workspaceStore.cloudHydrated,
    workspaceRevision: workspaceStore.revision,
    pendingCloudCount: pendingCloudOps.size,
  });

  function hashPasswordScrypt(password: string, existingSalt?: string): { salt: string; hash: string } {
    const salt = existingSalt || crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return { salt, hash: derived };
  }

  function verifyPasswordScrypt(password: string, record: StoredCredential): boolean {
    try {
      const candidate = crypto.scryptSync(password, record.salt, 64);
      const expected = Buffer.from(record.hash, 'hex');
      if (candidate.length !== expected.length) return false;
      return crypto.timingSafeEqual(candidate, expected);
    } catch {
      return false;
    }
  }

  function stripEmployeePasswords(snapshot: Record<string, unknown>): Record<string, unknown> {
    const copy: Record<string, unknown> = { ...snapshot };
    if (Array.isArray(copy.employees)) {
      copy.employees = copy.employees.map((raw) => {
        if (!raw || typeof raw !== 'object') return raw;
        const { password: _removed, ...rest } = raw as Record<string, unknown>;
        return rest;
      });
    }
    return copy;
  }

  function isRoleAdmin(chucVu: unknown, maNhanVien?: unknown, email?: unknown): boolean {
    const role = String(chucVu || '').trim().toLowerCase();
    const code = String(maNhanVien || '').trim().toUpperCase();
    const mail = String(email || '').trim().toLowerCase();
    return (
      mail === BOOTSTRAPPED_ADMIN_EMAIL ||
      code === 'ID1460' ||
      role.includes('admin') ||
      role.includes('giám đốc') ||
      role.includes('director') ||
      role.includes('trưởng phòng') ||
      role.includes('manager')
    );
  }

  async function atomicWriteJson(fileName: string, data: unknown): Promise<void> {
    await fs.mkdir(SERVER_DATA_DIR, { recursive: true });
    const target = resolveServerDataFile(fileName);
    const tmp = resolveServerDataFile(`${fileName}.${crypto.randomBytes(6).toString('hex')}.tmp`);
    await fs.writeFile(tmp, JSON.stringify(data), 'utf8');
    await fs.rename(tmp, target);
  }

  async function persistCredentials(): Promise<void> {
    const obj: Record<string, StoredCredential> = {};
    for (const [key, val] of credentialsStore.entries()) {
      obj[key] = val;
    }
    try {
      await atomicWriteJson('credentials.json', obj);
    } catch {
      // Non-fatal on read-only environments
    }
  }

  async function persistWorkspace(): Promise<void> {
    try {
      await atomicWriteJson('workspace.json', {
        revision: workspaceStore.revision,
        updatedAt: workspaceStore.updatedAt,
        updatedBy: workspaceStore.updatedBy,
        cloudHydrated: workspaceStore.cloudHydrated,
        snapshot: workspaceStore.snapshot,
      });
    } catch {
      // Non-fatal on read-only environments
    }
  }

  async function persistPendingCloudOps(): Promise<void> {
    try {
      await atomicWriteJson('pending-cloud-ops.json', Array.from(pendingCloudOps.values()));
    } catch {
      // Non-fatal on read-only environments
    }
  }

  async function bootstrapSeedEmployeesFromInitialData(): Promise<void> {
    try {
      const initPath = path.resolve(__dirname, 'src', 'data', 'initialData.ts');
      if (!initPath.startsWith(path.resolve(__dirname) + path.sep)) return;
      const content = await fs.readFile(initPath, 'utf8');
      const marker = 'export const INITIAL_EMPLOYEES: Employee[] = [';
      const startIdx = content.indexOf(marker);
      if (startIdx === -1) return;
      const arrayStart = startIdx + marker.length - 1;
      const endIdx = content.indexOf('\n];', arrayStart);
      if (endIdx === -1) return;
      const jsonText = content.slice(arrayStart, endIdx + 2);
      const parsed = JSON.parse(jsonText) as Record<string, unknown>[];
      if (!Array.isArray(parsed)) return;

      let addedAnyHash = false;
      const safeDir: Record<string, unknown>[] = [];
      for (const raw of parsed) {
        if (!raw || typeof raw !== 'object') continue;
        const code = String(raw.maNhanVien || '').trim();
        if (!code) continue;
        const codeKey = code.toUpperCase();
        const rawPass = typeof raw.password === 'string' && raw.password.trim() ? raw.password.trim() : '123456';
        if (!credentialsStore.has(codeKey)) {
          const hashed = hashPasswordScrypt(rawPass);
          credentialsStore.set(codeKey, {
            salt: hashed.salt,
            hash: hashed.hash,
            userModified: false,
            updatedAt: new Date().toISOString(),
          });
          addedAnyHash = true;
        }
        const { password: _stripped, ...safeEmp } = raw;
        safeDir.push(safeEmp);
      }
      seedEmployeesDirectory = safeDir;
      if (addedAnyHash) {
        await persistCredentials();
      }
    } catch {
      // Optional cold-start bootstrap; server still works via Cloud sync
    }
  }

  async function loadPersistedWorkspaceState(): Promise<void> {
    try {
      const wsRaw = await fs.readFile(resolveServerDataFile('workspace.json'), 'utf8');
      const parsed = JSON.parse(wsRaw) as Partial<WorkspaceStoreState>;
      if (typeof parsed.revision === 'number' && parsed.snapshot && typeof parsed.snapshot === 'object') {
        workspaceStore.revision = parsed.revision;
        workspaceStore.updatedAt = typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null;
        workspaceStore.updatedBy = typeof parsed.updatedBy === 'string' ? parsed.updatedBy : null;
        workspaceStore.cloudHydrated = Boolean(parsed.cloudHydrated);
        workspaceStore.snapshot = stripEmployeePasswords(parsed.snapshot as Record<string, unknown>);
      }
    } catch {
      // Fresh server start — workspace will populate on first sync
    }

    try {
      const credRaw = await fs.readFile(resolveServerDataFile('credentials.json'), 'utf8');
      const parsed = JSON.parse(credRaw) as Record<string, StoredCredential>;
      if (parsed && typeof parsed === 'object') {
        for (const [key, val] of Object.entries(parsed)) {
          if (val && typeof val.salt === 'string' && typeof val.hash === 'string') {
            credentialsStore.set(key.toUpperCase(), val);
          }
        }
      }
    } catch {
      // Fresh server start — seed hashes loaded below
    }

    try {
      const opsRaw = await fs.readFile(resolveServerDataFile('pending-cloud-ops.json'), 'utf8');
      const parsed = JSON.parse(opsRaw) as PendingCloudOp[];
      if (Array.isArray(parsed)) {
        for (const op of parsed) {
          if (op && op.opId && op.colName && op.docId && ALLOWED_CLOUD_COLLECTIONS.has(op.colName)) {
            pendingCloudOps.set(`${op.colName}/${op.docId}`, op);
          }
        }
      }
    } catch {
      // No queued Cloud ops
    }

    if (workspaceStore.snapshot && pendingCloudOps.size > 0) {
      let mergedAny = false;
      for (const op of pendingCloudOps.values()) {
        if (applyDocOpToWorkspaceSnapshot(workspaceStore.snapshot, op)) {
          mergedAny = true;
        }
      }
      if (mergedAny) {
        workspaceStore.revision = Math.max(workspaceStore.revision, 1);
      }
    }

    await bootstrapSeedEmployeesFromInitialData();
  }

  const CLOUD_COLLECTION_TO_SNAPSHOT_ARRAY: Record<
    string,
    { key: string; idField: string; prepend?: boolean; maxItems?: number }
  > = {
    equipment: { key: 'equipment', idField: 'maThietBi' },
    maintenance_plans: { key: 'maintenancePlans', idField: 'id' },
    maintenance_history: { key: 'maintenanceHistory', idField: 'id', prepend: true },
    tickets: { key: 'tickets', idField: 'maTicket', prepend: true },
    spare_parts: { key: 'spareParts', idField: 'maVatTu' },
    stock_transactions: { key: 'stockTransactions', idField: 'transId', prepend: true },
    power_10days: { key: 'power10Days', idField: 'id', prepend: true },
    water_monthly: { key: 'waterMonthly', idField: 'month', prepend: true },
    meter_readings: { key: 'meterReadings', idField: 'id', prepend: true },
    cost_records: { key: 'costRecords', idField: 'idChiPhi', prepend: true },
    documents: { key: 'documents', idField: 'id', prepend: true },
    projects: { key: 'projects', idField: 'id', prepend: true },
    safety_inspections: { key: 'safetyInspections', idField: 'id' },
    tools: { key: 'tools', idField: 'id' },
    tool_logs: { key: 'toolLogs', idField: 'id', prepend: true },
    daily_area_checks: { key: 'dailyAreaChecks', idField: 'id', prepend: true },
    purchase_requests: { key: 'purchaseRequests', idField: 'id', prepend: true },
    email_logs: { key: 'emailLogs', idField: 'id', prepend: true, maxItems: 2000 },
    audit_logs: { key: 'auditLogs', idField: 'id', prepend: true, maxItems: 2000 },
  };

  function applyDocOpToWorkspaceSnapshot(
    snapshot: Record<string, unknown>,
    op: Pick<PendingCloudOp, 'colName' | 'docId' | 'action' | 'sanitizedData'>
  ): boolean {
    const arrayMeta = CLOUD_COLLECTION_TO_SNAPSHOT_ARRAY[op.colName];
    if (arrayMeta) {
      const currentArr = Array.isArray(snapshot[arrayMeta.key])
        ? [...(snapshot[arrayMeta.key] as Record<string, unknown>[])]
        : [];
      const targetId = op.docId.trim();
      const idx = currentArr.findIndex((item) => {
        if (!item || typeof item !== 'object') return false;
        return String(item[arrayMeta.idField] || '').trim() === targetId;
      });

      if (op.action === 'delete') {
        if (idx === -1) return false;
        currentArr.splice(idx, 1);
        snapshot[arrayMeta.key] = currentArr;
        return true;
      }

      if (!op.sanitizedData) return false;
      const { password: _removed, ...safeDoc } = op.sanitizedData;
      if (idx >= 0) {
        currentArr[idx] = { ...currentArr[idx], ...safeDoc };
      } else if (arrayMeta.prepend) {
        currentArr.unshift(safeDoc);
      } else {
        currentArr.push(safeDoc);
      }
      if (arrayMeta.maxItems && currentArr.length > arrayMeta.maxItems) {
        currentArr.length = arrayMeta.maxItems;
      }
      snapshot[arrayMeta.key] = currentArr;
      return true;
    }

    if (op.colName === 'employees_public' || op.colName === 'employees_private') {
      const currentArr = Array.isArray(snapshot.employees)
        ? [...(snapshot.employees as Record<string, unknown>[])]
        : [];
      const targetCode = op.docId.trim().toUpperCase();
      const idx = currentArr.findIndex(
        (item) => item && typeof item === 'object' && String(item.maNhanVien || '').trim().toUpperCase() === targetCode
      );
      if (op.action === 'delete') {
        if (idx === -1) return false;
        currentArr.splice(idx, 1);
        snapshot.employees = currentArr;
        return true;
      }
      if (!op.sanitizedData) return false;
      const { password: _removed, ...safeEmp } = op.sanitizedData;
      if (idx >= 0) {
        currentArr[idx] = { ...currentArr[idx], ...safeEmp };
      } else {
        currentArr.push(safeEmp);
      }
      snapshot.employees = currentArr;
      return true;
    }

    if (op.colName === 'settings' && op.action === 'upsert' && op.sanitizedData) {
      const payload = op.sanitizedData.payload;
      if (payload && typeof payload === 'object') {
        if (op.docId === 'email_config') {
          snapshot.emailConfig = payload;
          return true;
        }
        if (op.docId === 'tariff_config') {
          snapshot.tariffConfig = payload;
          return true;
        }
        if (op.docId === 'morning_check_templates') {
          snapshot.morningCheckTemplates = payload;
          return true;
        }
        if (op.docId === 'monthly_board_reports') {
          snapshot.monthlyBoardReports = payload;
          return true;
        }
      }
    }

    return false;
  }

  function mergeAppendOnlyLogArrays(
    existingVal: unknown,
    incomingVal: unknown,
    timeField: string,
    maxItems = 2000
  ): Record<string, unknown>[] {
    const byId = new Map<string, Record<string, unknown>>();
    const addItems = (arr: unknown) => {
      if (!Array.isArray(arr)) return;
      for (const item of arr) {
        if (!item || typeof item !== 'object') continue;
        const rec = item as Record<string, unknown>;
        const id = String(rec.id || '').trim();
        if (!id) continue;
        byId.set(id, rec);
      }
    };
    addItems(existingVal);
    addItems(incomingVal);
    return Array.from(byId.values())
      .sort((a, b) => String(b[timeField] || '').localeCompare(String(a[timeField] || '')))
      .slice(0, maxItems);
  }

  await loadPersistedWorkspaceState();

  function parseCookieValue(req: express.Request, name: string): string | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    const parts = cookieHeader.split(';');
    for (const part of parts) {
      const eqIdx = part.indexOf('=');
      if (eqIdx === -1) continue;
      const key = part.slice(0, eqIdx).trim();
      if (key === name) {
        try {
          return decodeURIComponent(part.slice(eqIdx + 1).trim());
        } catch {
          return part.slice(eqIdx + 1).trim();
        }
      }
    }
    return null;
  }

  function setSessionCookie(res: express.Response, token: string): void {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned; Max-Age=${SESSION_MAX_AGE_SEC}`
    );
  }

  function clearSessionCookie(res: express.Response): void {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=None; Secure; Partitioned; Max-Age=0`
    );
  }

  function isCsrfSafeMutation(req: express.Request): boolean {
    if (String(req.headers['x-requested-with'] || '').toLowerCase() === 'xmlhttprequest') {
      return true;
    }
    const origin = req.headers.origin;
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '') as string;
    if (origin && host) {
      try {
        const originHost = new URL(origin).host.toLowerCase();
        const expectedHost = host.split(',')[0].trim().toLowerCase();
        if (originHost === expectedHost) return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  function pruneExpiredSessions(): void {
    const now = Date.now();
    for (const [tok, rec] of activeSessions.entries()) {
      if (rec.expiresAt <= now) {
        activeSessions.delete(tok);
      }
    }
  }

  function createAuthSession(info: Omit<AuthSessionRecord, 'token' | 'expiresAt'>): AuthSessionRecord {
    pruneExpiredSessions();
    if (activeSessions.size >= MAX_ACTIVE_SESSIONS) {
      const oldestKey = activeSessions.keys().next().value;
      if (oldestKey) activeSessions.delete(oldestKey);
    }
    const token = crypto.randomBytes(32).toString('hex');
    const record: AuthSessionRecord = {
      ...info,
      token,
      expiresAt: Date.now() + SESSION_TTL_MS,
    };
    activeSessions.set(token, record);
    return record;
  }

  function authenticateRequest(req: express.Request, requireCsrf = false): AuthSessionRecord | null {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) {
        const session = activeSessions.get(token);
        if (session) {
          if (session.expiresAt <= Date.now()) {
            activeSessions.delete(token);
            return null;
          }
          return session;
        }
      }
    }

    const cookieToken = parseCookieValue(req, SESSION_COOKIE_NAME);
    if (!cookieToken) return null;
    if (requireCsrf && !isCsrfSafeMutation(req)) {
      return null;
    }
    const session = activeSessions.get(cookieToken);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      activeSessions.delete(cookieToken);
      return null;
    }
    return session;
  }

  function broadcastWorkspaceEvent(payload: Record<string, unknown>): void {
    const frame = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(frame);
      } catch {
        sseClients.delete(client);
      }
    }
  }

  // Google Firebase ID Token verification using Google's public x509 certificates
  let googleCertCache: { certs: Record<string, string>; expiresAt: number } | null = null;

  async function getFirebasePublicCerts(forceRefresh = false): Promise<Record<string, string>> {
    const now = Date.now();
    if (!forceRefresh && googleCertCache && googleCertCache.expiresAt > now) {
      return googleCertCache.certs;
    }
    const resp = await fetch(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
    );
    if (!resp.ok) {
      throw new Error(`Không thể tải chứng chỉ xác thực Google (HTTP ${resp.status})`);
    }
    const certs = (await resp.json()) as Record<string, string>;
    const cc = resp.headers.get('cache-control') || '';
    const maxAgeMatch = cc.match(/max-age=(\d+)/i);
    const maxAgeMs = maxAgeMatch ? Math.max(60, Number(maxAgeMatch[1])) * 1000 : 3600 * 1000;
    googleCertCache = { certs, expiresAt: now + maxAgeMs };
    return certs;
  }

  async function verifyFirebaseIdToken(
    idToken: string
  ): Promise<{ uid: string; email: string; name?: string }> {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Token xác thực Google không hợp lệ.');
    }
    const [headerB64, payloadB64, sigB64] = parts;
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8')) as {
      alg?: string;
      kid?: string;
    };
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      aud?: string;
      iss?: string;
      sub?: string;
      exp?: number;
      iat?: number;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };

    if (header.alg !== 'RS256' || !header.kid) {
      throw new Error('Thuật toán chữ ký token không hợp lệ.');
    }

    let certs = await getFirebasePublicCerts(false);
    let certPem = certs[header.kid];
    if (!certPem) {
      certs = await getFirebasePublicCerts(true);
      certPem = certs[header.kid];
    }
    if (!certPem) {
      throw new Error('Không tìm thấy khóa công khai Google phù hợp.');
    }

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();
    const signature = Buffer.from(sigB64, 'base64url');
    if (!verifier.verify(certPem, signature)) {
      throw new Error('Chữ ký token Google không hợp lệ.');
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const expectedIss = `https://securetoken.google.com/${firebaseProjectId}`;
    if (
      payload.aud !== firebaseProjectId ||
      payload.iss !== expectedIss ||
      !payload.sub ||
      typeof payload.exp !== 'number' ||
      payload.exp <= nowSec ||
      typeof payload.iat !== 'number' ||
      payload.iat > nowSec + 300 ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      throw new Error('Phiên Google không hợp lệ hoặc đã hết hạn.');
    }

    return {
      uid: payload.sub,
      email: payload.email.trim().toLowerCase(),
      name: payload.name,
    };
  }

  function getServerEmployeesList(): Record<string, unknown>[] {
    const snap = workspaceStore.snapshot;
    if (snap && Array.isArray(snap.employees) && snap.employees.length > 0) {
      return snap.employees.filter((e): e is Record<string, unknown> => Boolean(e && typeof e === 'object'));
    }
    return seedEmployeesDirectory;
  }

  app.get('/api/auth/session', (req, res) => {
    const session = authenticateRequest(req, false);
    if (!session) {
      res.status(401).json({ ok: false, authenticated: false });
      return;
    }
    res.json({
      ok: true,
      authenticated: true,
      token: session.token,
      expiresAt: session.expiresAt,
      employee: {
        maNhanVien: session.maNhanVien,
        tenNhanVien: session.tenNhanVien,
        chucVu: session.chucVu,
        email: session.email,
      },
      workspaceRevision: workspaceStore.revision,
      updatedAt: workspaceStore.updatedAt,
      cloudHydrated: workspaceStore.cloudHydrated,
      pendingCloudCount: pendingCloudOps.size,
    });
  });

  app.post('/api/auth/cloud-session', async (req, res) => {
    const body = (req.body || {}) as { idToken?: unknown };
    if (typeof body.idToken !== 'string' || body.idToken.length < 20) {
      res.status(400).json({ ok: false, message: 'Thiếu token xác thực Google.' });
      return;
    }

    try {
      const verified = await verifyFirebaseIdToken(body.idToken);
      const emailLower = verified.email;
      const employeesList = getServerEmployeesList();
      const matched = employeesList.find(
        (e) => String(e.email || '').trim().toLowerCase() === emailLower
      );
      const isBootAdmin = emailLower === BOOTSTRAPPED_ADMIN_EMAIL;

      if (!isBootAdmin && employeesList.length > 0 && !matched) {
        res.status(403).json({
          ok: false,
          message: `Tài khoản Google (${emailLower}) chưa có trong danh sách nhân viên được cấp quyền.`,
        });
        return;
      }

      const maNhanVien = String(matched?.maNhanVien || (isBootAdmin ? 'ID1460' : verified.uid)).trim();
      const tenNhanVien = String(matched?.tenNhanVien || verified.name || emailLower).trim();
      const chucVu = String(matched?.chucVu || (isBootAdmin ? 'Admin' : 'Kỹ thuật viên')).trim();
      const session = createAuthSession({
        maNhanVien,
        tenNhanVien,
        chucVu,
        email: emailLower,
        isAdmin: isRoleAdmin(chucVu, maNhanVien, emailLower),
        authType: 'cloud',
      });

      setSessionCookie(res, session.token);
      res.json({
        ok: true,
        token: session.token,
        expiresAt: session.expiresAt,
        workspaceRevision: workspaceStore.revision,
        updatedAt: workspaceStore.updatedAt,
        cloudHydrated: workspaceStore.cloudHydrated,
        pendingCloudCount: pendingCloudOps.size,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xác thực Google thất bại.';
      res.status(401).json({ ok: false, message: msg });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const body = (req.body || {}) as { username?: unknown; password?: unknown };
    const cleanUser = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password.trim() : '';

    if (!cleanUser || !password) {
      res.status(400).json({ ok: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!' });
      return;
    }

    const employeesList = getServerEmployeesList();
    if (employeesList.length === 0) {
      res.status(404).json({
        ok: false,
        serverNotInitialized: true,
        message: 'Máy chủ chưa có dữ liệu đồng bộ.',
      });
      return;
    }

    const found = employeesList.find((e) => {
      const code = String(e.maNhanVien || '').trim().toLowerCase();
      const uname = String(e.username || '').trim().toLowerCase();
      const email = String(e.email || '').trim().toLowerCase();
      return code === cleanUser || (uname && uname === cleanUser) || (email && email === cleanUser);
    });

    if (!found) {
      res.status(401).json({ ok: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' });
      return;
    }

    const empCode = String(found.maNhanVien || '').trim();
    const empCodeKey = empCode.toUpperCase();
    const storedCred = credentialsStore.get(empCodeKey);
    if (!storedCred || !verifyPasswordScrypt(password, storedCred)) {
      res.status(401).json({ ok: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' });
      return;
    }

    const tenNhanVien = String(found.tenNhanVien || empCode);
    const chucVu = String(found.chucVu || 'Kỹ thuật viên');
    const email = String(found.email || '').trim().toLowerCase();
    const session = createAuthSession({
      maNhanVien: empCode,
      tenNhanVien,
      chucVu,
      email,
      isAdmin: isRoleAdmin(chucVu, empCode, email),
      authType: 'internal',
    });

    setSessionCookie(res, session.token);
    const { password: _removed, ...safeEmployee } = found;
    res.json({
      ok: true,
      token: session.token,
      expiresAt: session.expiresAt,
      employee: safeEmployee,
      workspaceRevision: workspaceStore.revision,
      updatedAt: workspaceStore.updatedAt,
      cloudHydrated: workspaceStore.cloudHydrated,
      pendingCloudCount: pendingCloudOps.size,
    });
  });

  app.post('/api/auth/change-password', async (req, res) => {
    const session = authenticateRequest(req, true);
    const body = (req.body || {}) as {
      username?: unknown;
      currentPassword?: unknown;
      newPassword?: unknown;
    };
    const cleanUser = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';

    if (!cleanUser || !newPassword || newPassword.length < 4) {
      res.status(400).json({
        ok: false,
        message: 'Mật khẩu mới phải có ít nhất 4 ký tự!',
      });
      return;
    }

    const employeesList = getServerEmployeesList();
    if (employeesList.length === 0) {
      res.status(404).json({ ok: false, serverNotInitialized: true });
      return;
    }

    const found = employeesList.find((e) => {
      const code = String(e.maNhanVien || '').trim().toLowerCase();
      const uname = String(e.username || '').trim().toLowerCase();
      const email = String(e.email || '').trim().toLowerCase();
      return code === cleanUser || (uname && uname === cleanUser) || (email && email === cleanUser);
    });

    if (!found) {
      res.status(401).json({
        ok: false,
        message: 'Thông tin tài khoản hoặc mật khẩu hiện tại không chính xác!',
      });
      return;
    }

    const empCodeKey = String(found.maNhanVien || '').trim().toUpperCase();
    const existingCred = credentialsStore.get(empCodeKey);
    const isAdminReset = Boolean(session?.isAdmin && session.maNhanVien.toUpperCase() !== empCodeKey);

    if (!isAdminReset) {
      if (!currentPassword || !existingCred || !verifyPasswordScrypt(currentPassword, existingCred)) {
        res.status(401).json({
          ok: false,
          message: 'Thông tin tài khoản hoặc mật khẩu hiện tại không chính xác!',
        });
        return;
      }
    }

    const hashed = hashPasswordScrypt(newPassword);
    credentialsStore.set(empCodeKey, {
      salt: hashed.salt,
      hash: hashed.hash,
      userModified: true,
      updatedAt: new Date().toISOString(),
    });
    await persistCredentials();
    res.json({
      ok: true,
      message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật cho tất cả thiết bị.',
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      activeSessions.delete(authHeader.slice(7).trim());
    }
    const cookieToken = parseCookieValue(req, SESSION_COOKIE_NAME);
    if (cookieToken) {
      activeSessions.delete(cookieToken);
    }
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.get('/api/workspace/stream', (req, res) => {
    const session = authenticateRequest(req, false);
    if (!session) {
      res.status(401).json({ ok: false, message: 'Phiên đồng bộ chưa xác thực.' });
      return;
    }
    if (sseClients.size >= MAX_SSE_CLIENTS) {
      res.status(503).json({ ok: false, message: 'Quá nhiều kết nối đồng bộ cùng lúc.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    sseClients.add(res);
    res.write(
      `data: ${JSON.stringify({
        type: 'connected',
        revision: workspaceStore.revision,
        updatedAt: workspaceStore.updatedAt,
        updatedBy: workspaceStore.updatedBy,
        cloudHydrated: workspaceStore.cloudHydrated,
        pendingCloudCount: pendingCloudOps.size,
      })}\n\n`
    );

    const pingTimer = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(pingTimer);
        sseClients.delete(res);
      }
    }, 25_000);

    req.on('close', () => {
      clearInterval(pingTimer);
      sseClients.delete(res);
    });
  });

  app.get('/api/workspace/state', (req, res) => {
    const session = authenticateRequest(req, false);
    if (!session) {
      res.status(401).json({ ok: false, message: 'Phiên đồng bộ đã hết hạn hoặc chưa xác thực.' });
      return;
    }
    const since = Number(req.query.since) || 0;
    if (workspaceStore.revision === 0 || !workspaceStore.snapshot) {
      res.json({
        ok: true,
        updated: false,
        revision: 0,
        updatedAt: null,
        cloudHydrated: workspaceStore.cloudHydrated,
        pendingCloudCount: pendingCloudOps.size,
      });
      return;
    }
    if (since >= workspaceStore.revision) {
      res.json({
        ok: true,
        updated: false,
        revision: workspaceStore.revision,
        updatedAt: workspaceStore.updatedAt,
        updatedBy: workspaceStore.updatedBy,
        cloudHydrated: workspaceStore.cloudHydrated,
        pendingCloudCount: pendingCloudOps.size,
      });
      return;
    }
    res.json({
      ok: true,
      updated: true,
      revision: workspaceStore.revision,
      updatedAt: workspaceStore.updatedAt,
      updatedBy: workspaceStore.updatedBy,
      cloudHydrated: workspaceStore.cloudHydrated,
      pendingCloudCount: pendingCloudOps.size,
      snapshot: workspaceStore.snapshot,
    });
  });

  app.post(
    '/api/workspace/pending-cloud-op',
    express.json({ limit: '5mb' }),
    async (req, res) => {
      const session = authenticateRequest(req, true);
      if (!session) {
        res.status(401).json({ ok: false, message: 'Phiên đồng bộ chưa xác thực.' });
        return;
      }

      const body = (req.body || {}) as {
        colName?: unknown;
        docId?: unknown;
        action?: unknown;
        sanitizedData?: unknown;
        alreadySyncedToCloud?: unknown;
      };
      const colName = typeof body.colName === 'string' ? body.colName.trim() : '';
      const docId = typeof body.docId === 'string' ? body.docId.trim().slice(0, 128) : '';
      const action = body.action === 'delete' ? 'delete' : 'upsert';
      const alreadySyncedToCloud = body.alreadySyncedToCloud === true;

      if (!ALLOWED_CLOUD_COLLECTIONS.has(colName) || !docId) {
        res.status(400).json({ ok: false, message: 'Yêu cầu đồng bộ Cloud không hợp lệ.' });
        return;
      }

      if (
        !session.isAdmin &&
        (colName === 'employees_private' ||
          colName === 'employees_public' ||
          colName === 'settings' ||
          action === 'delete')
      ) {
        res.json({
          ok: true,
          skipped: true,
          revision: workspaceStore.revision,
          pendingCloudCount: pendingCloudOps.size,
        });
        return;
      }

      let cleanData: Record<string, unknown> | undefined;
      if (action === 'upsert') {
        if (!body.sanitizedData || typeof body.sanitizedData !== 'object' || Array.isArray(body.sanitizedData)) {
          res.status(400).json({ ok: false, message: 'Thiếu dữ liệu bản ghi cần đồng bộ.' });
          return;
        }
        const { password: _removed, ...rest } = body.sanitizedData as Record<string, unknown>;
        cleanData = rest;
      }

      const nowIso = new Date().toISOString();
      const actorLabel = `${session.tenNhanVien} (${session.maNhanVien})`;
      const op: PendingCloudOp = {
        opId: `${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`,
        colName,
        docId,
        action,
        sanitizedData: cleanData,
        updatedAt: nowIso,
        updatedBy: actorLabel,
      };

      // Queue for Cloud Firestore bridge if this mutation came from a non-Cloud (internal) user
      if (!alreadySyncedToCloud) {
        if (pendingCloudOps.size >= MAX_PENDING_CLOUD_OPS) {
          const oldestKey = pendingCloudOps.keys().next().value;
          if (oldestKey) pendingCloudOps.delete(oldestKey);
        }
        pendingCloudOps.set(`${colName}/${docId}`, op);
        await persistPendingCloudOps();
      }

      // Immediately merge this document mutation into workspaceStore.snapshot so ALL online devices
      // see the update (e.g. login audit logs, new tickets, equipment edits) in real time and never lose it on refresh!
      let snapshotUpdated = false;
      if (workspaceStore.snapshot) {
        snapshotUpdated = applyDocOpToWorkspaceSnapshot(workspaceStore.snapshot, op);
        if (snapshotUpdated) {
          workspaceStore.revision += 1;
          workspaceStore.updatedAt = nowIso;
          workspaceStore.updatedBy = actorLabel;
          await persistWorkspace();
        }
      }

      broadcastWorkspaceEvent({
        type: snapshotUpdated ? 'workspace_updated' : 'pending_cloud_op',
        revision: workspaceStore.revision,
        updatedAt: nowIso,
        updatedBy: actorLabel,
        cloudHydrated: workspaceStore.cloudHydrated,
        pendingCloudCount: pendingCloudOps.size,
      });

      res.json({
        ok: true,
        opId: op.opId,
        revision: workspaceStore.revision,
        snapshotUpdated,
        cloudHydrated: workspaceStore.cloudHydrated,
        pendingCloudCount: pendingCloudOps.size,
      });
    }
  );

  app.get('/api/workspace/pending-cloud-ops', (req, res) => {
    const session = authenticateRequest(req, false);
    if (!session) {
      res.status(401).json({ ok: false, message: 'Phiên đồng bộ chưa xác thực.' });
      return;
    }
    res.json({
      ok: true,
      ops: Array.from(pendingCloudOps.values()),
    });
  });

  app.post('/api/workspace/pending-cloud-ops/ack', async (req, res) => {
    const session = authenticateRequest(req, true);
    if (!session) {
      res.status(401).json({ ok: false, message: 'Phiên đồng bộ chưa xác thực.' });
      return;
    }
    const body = (req.body || {}) as { opIds?: unknown };
    const opIds = Array.isArray(body.opIds)
      ? new Set(body.opIds.filter((x): x is string => typeof x === 'string'))
      : new Set<string>();
    if (opIds.size > 0) {
      let removed = false;
      for (const [key, op] of pendingCloudOps.entries()) {
        if (opIds.has(op.opId)) {
          pendingCloudOps.delete(key);
          removed = true;
        }
      }
      if (removed) {
        await persistPendingCloudOps();
        broadcastWorkspaceEvent({
          type: 'pending_cloud_ack',
          revision: workspaceStore.revision,
          updatedAt: new Date().toISOString(),
          cloudHydrated: workspaceStore.cloudHydrated,
          pendingCloudCount: pendingCloudOps.size,
        });
      }
    }
    res.json({ ok: true, cloudHydrated: workspaceStore.cloudHydrated, pendingCloudCount: pendingCloudOps.size });
  });

  app.post(
    '/api/workspace/sync',
    express.json({ limit: '50mb' }),
    async (req, res) => {
      const session = authenticateRequest(req, true);
      if (!session) {
        res.status(401).json({ ok: false, message: 'Phiên đồng bộ đã hết hạn hoặc chưa xác thực.' });
        return;
      }

      const body = (req.body || {}) as {
        snapshot?: unknown;
        baseRevision?: unknown;
        source?: unknown;
        hasVerifiedRealData?: unknown;
        credentialSeeds?: unknown;
      };

      if (!body.snapshot || typeof body.snapshot !== 'object' || Array.isArray(body.snapshot)) {
        res.status(400).json({ ok: false, message: 'Dữ liệu đồng bộ không hợp lệ.' });
        return;
      }

      const incomingRaw = body.snapshot as Record<string, unknown>;
      const hasKnownCollections =
        Array.isArray(incomingRaw.equipment) && Array.isArray(incomingRaw.employees);
      if (!hasKnownCollections) {
        res.status(400).json({ ok: false, message: 'Thiếu danh mục thiết bị hoặc nhân sự trong gói đồng bộ.' });
        return;
      }

      const source = body.source === 'cloud' ? 'cloud' : 'local';
      const hasVerifiedRealData = body.hasVerifiedRealData === true;
      const baseRevision = typeof body.baseRevision === 'number' ? body.baseRevision : 0;

      // Guard: prevent a brand-new / seed-only browser from seeding a freshly restarted server before
      // either Cloud Firestore or a client holding verified real synced data hydrates it.
      if (
        !workspaceStore.cloudHydrated &&
        workspaceStore.revision === 0 &&
        source !== 'cloud' &&
        !hasVerifiedRealData
      ) {
        res.json({
          ok: true,
          skipped: true,
          waitingForCloudHydration: true,
          revision: workspaceStore.revision,
          cloudHydrated: workspaceStore.cloudHydrated,
          pendingCloudCount: pendingCloudOps.size,
        });
        return;
      }

      // Guard: prevent stale local device from overwriting newer server workspace
      if (
        workspaceStore.revision > 0 &&
        source !== 'cloud' &&
        baseRevision < workspaceStore.revision
      ) {
        res.status(409).json({
          ok: false,
          conflict: true,
          revision: workspaceStore.revision,
          updatedAt: workspaceStore.updatedAt,
          message: 'Máy chủ đã có phiên bản dữ liệu mới hơn.',
        });
        return;
      }

      // Preserve existing private fields (email / phone) if a non-admin client sends partial employee docs
      const existingByCode = new Map<string, Record<string, unknown>>();
      for (const emp of getServerEmployeesList()) {
        const code = String(emp.maNhanVien || '').trim().toUpperCase();
        if (code) existingByCode.set(code, emp);
      }

      const cleanSnapshot = stripEmployeePasswords(incomingRaw);
      if (!session.isAdmin && Array.isArray(cleanSnapshot.employees)) {
        cleanSnapshot.employees = cleanSnapshot.employees.map((raw) => {
          if (!raw || typeof raw !== 'object') return raw;
          const empObj = raw as Record<string, unknown>;
          const code = String(empObj.maNhanVien || '').trim().toUpperCase();
          const prev = existingByCode.get(code);
          if (!prev) return empObj;
          return {
            ...empObj,
            email:
              typeof empObj.email === 'string' && empObj.email.trim()
                ? empObj.email
                : prev.email || '',
            soDienThoai:
              typeof empObj.soDienThoai === 'string' && empObj.soDienThoai.trim()
                ? empObj.soDienThoai
                : prev.soDienThoai || '',
          };
        });
      }

      // Allow Admin sessions to seed initial scrypt password hashes for employees without overwriting user-changed passwords
      let credentialsChanged = false;
      if (session.isAdmin && Array.isArray(body.credentialSeeds)) {
        for (const seed of body.credentialSeeds) {
          if (!seed || typeof seed !== 'object') continue;
          const s = seed as { maNhanVien?: unknown; password?: unknown; force?: unknown };
          const codeKey = typeof s.maNhanVien === 'string' ? s.maNhanVien.trim().toUpperCase() : '';
          const rawPass = typeof s.password === 'string' ? s.password.trim() : '';
          if (!codeKey || rawPass.length < 4) continue;
          const existing = credentialsStore.get(codeKey);
          if (!existing || (Boolean(s.force) && !existing.userModified)) {
            const hashed = hashPasswordScrypt(rawPass);
            credentialsStore.set(codeKey, {
              salt: hashed.salt,
              hash: hashed.hash,
              userModified: false,
              updatedAt: new Date().toISOString(),
            });
            credentialsChanged = true;
          }
        }
      }

      // Preserve union of append-only auditLogs & emailLogs across concurrent users so no login/activity log is ever lost
      if (workspaceStore.snapshot) {
        cleanSnapshot.auditLogs = mergeAppendOnlyLogArrays(
          workspaceStore.snapshot.auditLogs,
          cleanSnapshot.auditLogs,
          'thoiGian',
          2000
        );
        cleanSnapshot.emailLogs = mergeAppendOnlyLogArrays(
          workspaceStore.snapshot.emailLogs,
          cleanSnapshot.emailLogs,
          'timestamp',
          2000
        );
      }

      // Replay any still-pending Cloud ops onto cleanSnapshot so in-flight internal user edits are never overwritten
      if (pendingCloudOps.size > 0) {
        for (const op of pendingCloudOps.values()) {
          applyDocOpToWorkspaceSnapshot(cleanSnapshot, op);
        }
      }

      workspaceStore.revision += 1;
      workspaceStore.updatedAt = new Date().toISOString();
      workspaceStore.updatedBy = `${session.tenNhanVien} (${session.maNhanVien})`;
      if (source === 'cloud') {
        workspaceStore.cloudHydrated = true;
      }
      workspaceStore.snapshot = cleanSnapshot;

      await persistWorkspace();
      if (credentialsChanged) {
        await persistCredentials();
      }

      broadcastWorkspaceEvent({
        type: 'workspace_updated',
        revision: workspaceStore.revision,
        updatedAt: workspaceStore.updatedAt,
        updatedBy: workspaceStore.updatedBy,
        cloudHydrated: workspaceStore.cloudHydrated,
        pendingCloudCount: pendingCloudOps.size,
      });

      res.json({
        ok: true,
        revision: workspaceStore.revision,
        updatedAt: workspaceStore.updatedAt,
        updatedBy: workspaceStore.updatedBy,
        cloudHydrated: workspaceStore.cloudHydrated,
        pendingCloudCount: pendingCloudOps.size,
      });
    }
  );

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
