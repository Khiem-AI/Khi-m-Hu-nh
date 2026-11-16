import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCMMS } from '../../context/CMMSContext';
import {
  buildGmailComposeUrl,
  buildMailtoUrl,
  isAdminLevel,
  isPlaceholderEmail,
  isValidEmailFormat,
} from '../../utils/cmmsLogic';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../../utils/firestoreSync';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  Mail,
  ExternalLink,
  Copy,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  Send,
  FileText,
} from 'lucide-react';

export const EmailDispatchModal: React.FC = () => {
  const {
    currentUser,
    pendingEmailDispatch,
    closeEmailDispatchModal,
    markEmailDispatchStatus,
    sendEmailNotification,
    emailConfig,
    autoEmailServerStatus,
    isGmailConnected,
    gmailUser,
    connectGmail,
  } = useCMMS();
  const adminAuthorized = isAdminLevel(currentUser);

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [launchedClient, setLaunchedClient] = useState(false);
  const [isSendingAuto, setIsSendingAuto] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);
  const [directSentMessage, setDirectSentMessage] = useState<string | null>(null);

  useEffect(() => {
    if (pendingEmailDispatch) {
      setTo(pendingEmailDispatch.to);
      setCc(pendingEmailDispatch.cc || '');
      setSubject(pendingEmailDispatch.subject);
      setBody(pendingEmailDispatch.body);
      setCopied(false);
      setLaunchedClient(false);
      setIsSendingAuto(false);
      setIsConnectingGmail(false);
      setDirectError(null);
      setDirectSentMessage(null);
    }
  }, [pendingEmailDispatch]);

  if (!pendingEmailDispatch) return null;

  const toAddresses = to
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter((s) => isValidEmailFormat(s));
  const deliverableToAddresses = toAddresses.filter((addr) => !isPlaceholderEmail(addr));
  const hasPlaceholderTo = toAddresses.length === 0 || deliverableToAddresses.length === 0;

  const isAutoSendReady = Boolean(
    emailConfig.notificationMode === 'web_only' ||
      isGmailConnected ||
      emailConfig.webhookUrl?.trim() ||
      autoEmailServerStatus.smtpConfigured ||
      autoEmailServerStatus.resendConfigured ||
      autoEmailServerStatus.envWebhookConfigured
  );

  const gmailUrl = buildGmailComposeUrl({ to, cc, subject, body });
  const mailtoUrl = buildMailtoUrl({ to, cc, subject, body });

  const handleDirectAutoSend = async () => {
    if (toAddresses.length === 0) {
      setDirectError('Địa chỉ email người nhận đang trống hoặc sai định dạng.');
      return;
    }
    if (deliverableToAddresses.length === 0) {
      setDirectError(
        `Địa chỉ (${toAddresses.join(', ')}) là email mẫu (@factory.com). Vui lòng đổi sang Gmail / email thật trước khi gửi.`
      );
      return;
    }

    setDirectError(null);
    if (!isAutoSendReady) {
      if (!adminAuthorized) {
        setDirectError(
          `Hệ thống dùng 1 tài khoản Admin (${BOOTSTRAPPED_ADMIN_EMAIL}) để gửi email qua SMTP/Webhook. Admin chưa kích hoạt kênh gửi tự động — vui lòng bấm "Mở Gmail Web" hoặc "Sao chép" bên dưới.`
        );
        return;
      }
      setIsConnectingGmail(true);
      const authRes = await connectGmail(true);
      setIsConnectingGmail(false);
      if (!authRes.success) {
        setDirectError(authRes.message);
        return;
      }
    }

    setIsSendingAuto(true);
    const res = await sendEmailNotification({
      type: pendingEmailDispatch.type,
      subject: subject.trim(),
      body,
      recipient: to.trim(),
      cc: cc.trim(),
      relatedId: pendingEmailDispatch.relatedId,
      userConfirmed: true,
    });
    setIsSendingAuto(false);

    if (res.success) {
      const nextStatus =
        res.channel === 'gmail'
          ? 'Đã gửi (Gmail)'
          : res.channel === 'webhook'
          ? 'Đã gửi (Webhook)'
          : 'Đã gửi';
      markEmailDispatchStatus(pendingEmailDispatch.logId, nextStatus, {
        to: to.trim(),
        cc: cc.trim(),
        subject: subject.trim(),
        body,
      });
      setDirectSentMessage(res.message);
    } else {
      setDirectError(res.message);
    }
  };

  const handleOpenedExternal = () => {
    setLaunchedClient(true);
    markEmailDispatchStatus(pendingEmailDispatch.logId, 'Đã gửi', {
      to: to.trim(),
      cc: cc.trim(),
      subject,
      body,
    });
  };

  const handleCopyAll = async () => {
    const fullText = `Người nhận (To): ${to}\n${cc ? `CC: ${cc}\n` : ''}Tiêu đề: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = fullText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleMarkSentAndClose = () => {
    if (!directSentMessage) {
      markEmailDispatchStatus(pendingEmailDispatch.logId, 'Đã gửi', {
        to: to.trim(),
        cc: cc.trim(),
        subject,
        body,
      });
    }
    closeEmailDispatchModal();
  };

  const handleSaveDraftAndClose = () => {
    if (!launchedClient && !directSentMessage) {
      markEmailDispatchStatus(pendingEmailDispatch.logId, 'Đã tạo bản nháp', {
        to: to.trim(),
        cc: cc.trim(),
        subject,
        body,
      });
    }
    closeEmailDispatchModal();
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/90">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Mail className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                Gửi Email Thông Báo Công Việc
              </h3>
              <p className="text-xs text-slate-400">
                {pendingEmailDispatch.relatedId
                  ? `Mã tham chiếu: ${pendingEmailDispatch.relatedId} • `
                  : ''}
                {isGmailConnected && gmailUser?.email
                  ? `Sẵn sàng gửi trực tiếp qua Gmail (${gmailUser.email})`
                  : 'Bấm Gửi Tự Động Ngay hoặc mở trình soạn thảo Gmail'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveDraftAndClose}
            aria-label="Đóng cửa sổ gửi email"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {directSentMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{directSentMessage}</span>
            </div>
          )}

          {(directError || pendingEmailDispatch.webhookError) && !directSentMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="space-y-1">
                <p className="font-bold text-rose-300">
                  {directError ? 'Chưa gửi được email tự động:' : 'Lần gửi trước chưa thành công:'}
                </p>
                <p className="text-rose-200/90">{directError || pendingEmailDispatch.webhookError}</p>
              </div>
            </div>
          )}

          {!isAutoSendReady && !directSentMessage && (
            adminAuthorized ? (
              <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="font-bold block text-white">Kết nối Gmail Admin ({BOOTSTRAPPED_ADMIN_EMAIL}) để gửi trực tiếp:</span>
                  <span className="text-[11px] text-cyan-200/80">
                    Hoặc cấu hình SMTP / Webhook 1 lần trong mục Thông Báo Email để toàn bộ nhân viên tự động gửi chung không cần đăng nhập Google.
                  </span>
                </div>
                <GoogleSignInButton
                  compact
                  disabled={isConnectingGmail || isSendingAuto}
                  label={isConnectingGmail ? 'Đang kết nối...' : 'Sign in with Google'}
                  onClick={async () => {
                    setIsConnectingGmail(true);
                    setDirectError(null);
                    const res = await connectGmail(true);
                    setIsConnectingGmail(false);
                    if (!res.success) setDirectError(res.message);
                  }}
                />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Hệ thống sử dụng 1 tài khoản Admin (<strong className="font-mono">{BOOTSTRAPPED_ADMIN_EMAIL}</strong>) qua SMTP/Webhook để gửi báo cáo. Hiện Admin chưa bật kênh tự động — bạn vẫn có thể dùng <strong>Mở Gmail Web</strong> hoặc <strong>Sao chép</strong> bên dưới.
                </span>
              </div>
            )
          )}

          {/* Placeholder email warning */}
          {hasPlaceholderTo && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-bold text-amber-300">
                  Phát hiện địa chỉ email mẫu (@factory.com) hoặc chưa hợp lệ
                </p>
                <p className="text-amber-100/90 mt-0.5">
                  Vui lòng nhập đúng địa chỉ Gmail / email công ty thực tế ở ô <strong>Người nhận (To)</strong> trước khi gửi.
                </p>
              </div>
            </div>
          )}

          {launchedClient && !directSentMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Đã mở trình soạn thảo email và cập nhật trạng thái <strong>Đã gửi</strong> trong Nhật ký Email.
              </span>
            </div>
          )}

          {/* Editable Recipient, CC, Subject, Body */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Người nhận (To) *
              </label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="email@gmail.com (phân cách bởi dấu phẩy)"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Đồng kính gửi (CC)
              </label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Không bắt buộc..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Tiêu đề Email
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Nội dung Email
            </label>
            <textarea
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Dispatch Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isSendingAuto || isConnectingGmail}
                onClick={() => void handleDirectAutoSend()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isConnectingGmail
                    ? 'Đang kết nối Gmail...'
                    : isSendingAuto
                    ? 'Đang gửi email...'
                    : 'Gửi Tự Động Ngay'}
                </span>
              </button>

              <a
                href={gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenedExternal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/35 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở Gmail Web</span>
              </a>

              <a
                href={mailtoUrl}
                onClick={handleOpenedExternal}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Mailto</span>
              </a>

              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {directSentMessage || launchedClient ? (
                <button
                  type="button"
                  onClick={handleMarkSentAndClose}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hoàn tất &amp; Đóng</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveDraftAndClose}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lưu nháp &amp; Đóng</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
