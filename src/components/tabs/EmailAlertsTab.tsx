import React, { useEffect, useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { EmailLog } from '../../types/cmms';
import { isAdminLevel } from '../../utils/cmmsLogic';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../../utils/firestoreSync';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import { GoogleSignInButton } from '../common/GoogleSignInButton';
import {
  Mail,
  Send,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Eye,
  Trash2,
  Sparkles,
  Inbox,
  UserCheck,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  XCircle,
} from 'lucide-react';

const APPS_SCRIPT_SNIPPET = `function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, service: "FSM Email Webhook Ready" })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var to = String(data.to || "").trim();
    var subject = String(data.subject || "").trim();
    var body = String(data.body || "").trim();
    if (!to || !subject || !body) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: "Thiếu to, subject hoặc body" })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    var quota = MailApp.getRemainingDailyQuota();
    if (quota <= 0) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: "Hết hạn mức gửi Gmail miễn phí trong ngày của Apps Script (quota = 0)." })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    var mailOptions = {
      to: to,
      subject: subject,
      body: body,
      name: data.sender || "FACILITY SYSTEM MANAGEMENT"
    };
    if (data.cc && String(data.cc).trim()) {
      mailOptions.cc = String(data.cc).trim();
    }
    MailApp.sendEmail(mailOptions);
    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, sentTo: to, remainingQuota: quota - 1 })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: err && err.message ? err.message : String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const EmailAlertsTab: React.FC = () => {
  const {
    emailConfig,
    emailLogs,
    autoEmailServerStatus,
    refreshAutoEmailStatus,
    gmailUser,
    isGmailConnected,
    connectGmail,
    disconnectGmail,
    updateEmailConfig,
    sendEmailNotification,
    triggerMaintenanceDueAlerts,
    openEmailDispatchModal,
    deleteEmailLog,
    clearEmailLogs,
    maintenancePlans,
    currentUser,
  } = useCMMS();

  // Local form state for settings
  const [enabled, setEnabled] = useState(emailConfig.enabled);
  const [notifyOnNewTicket, setNotifyOnNewTicket] = useState(emailConfig.notifyOnNewTicket);
  const [notifyOnMaintenanceDue, setNotifyOnMaintenanceDue] = useState(emailConfig.notifyOnMaintenanceDue);
  const [notifyOnOverdue, setNotifyOnOverdue] = useState(emailConfig.notifyOnOverdue);
  const [notifyOnInspectionDue, setNotifyOnInspectionDue] = useState(
    emailConfig.notifyOnInspectionDue ?? true
  );
  const [primaryRecipient, setPrimaryRecipient] = useState(emailConfig.primaryRecipient);
  const [ccRecipients, setCcRecipients] = useState(emailConfig.ccRecipients);
  const [senderName, setSenderName] = useState(emailConfig.senderName);
  const [webhookUrl, setWebhookUrl] = useState(emailConfig.webhookUrl || '');
  const [autoDispatchMethod, setAutoDispatchMethod] = useState(emailConfig.autoDispatchMethod);

  useEffect(() => {
    setEnabled(emailConfig.enabled);
    setNotifyOnNewTicket(emailConfig.notifyOnNewTicket);
    setNotifyOnMaintenanceDue(emailConfig.notifyOnMaintenanceDue);
    setNotifyOnOverdue(emailConfig.notifyOnOverdue);
    setNotifyOnInspectionDue(emailConfig.notifyOnInspectionDue ?? true);
    setPrimaryRecipient(emailConfig.primaryRecipient);
    setCcRecipients(emailConfig.ccRecipients);
    setSenderName(emailConfig.senderName);
    setWebhookUrl(emailConfig.webhookUrl || '');
    setAutoDispatchMethod(emailConfig.autoDispatchMethod);
  }, [emailConfig]);

  // UI state
  const [isSaved, setIsSaved] = useState(false);
  const [activePreview, setActivePreview] = useState<'ticket' | 'maintenance'>('ticket');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<EmailLog | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAppsScriptGuide, setShowAppsScriptGuide] = useState(
    () => !emailConfig.webhookUrl?.trim()
  );
  const [copiedScript, setCopiedScript] = useState(false);
  const [confirmClearLogs, setConfirmClearLogs] = useState(false);
  const [confirmSendAction, setConfirmSendAction] = useState<'test' | 'due_alerts' | null>(null);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');

  // Statistics
  const duePlansCount = maintenancePlans.filter(
    (p) => p.trangThai === 'Quá hạn' || p.trangThai === 'Tới hạn' || p.trangThai === 'Sắp tới'
  ).length;

  const adminAuthorized = isAdminLevel(currentUser);
  const isDevAppsScript = Boolean(
    webhookUrl.trim().includes('script.google.com') && /\/dev(\?|$)/i.test(webhookUrl.trim())
  );
  const hasSharedServerChannel = Boolean(
    autoEmailServerStatus.smtpConfigured ||
      autoEmailServerStatus.resendConfigured ||
      autoEmailServerStatus.envWebhookConfigured ||
      (webhookUrl.trim() && !isDevAppsScript) ||
      (emailConfig.webhookUrl?.trim() && !/\/dev(\?|$)/i.test(emailConfig.webhookUrl))
  );

  const isAutoSendReady = Boolean(isGmailConnected || hasSharedServerChannel);

  const showToast = (msg: string, kind: 'success' | 'warning' = 'success') => {
    setToastType(kind);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleCopyAppsScript = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_SNIPPET);
    } catch {
      const el = document.createElement('textarea');
      el.value = APPS_SCRIPT_SNIPPET;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmailConfig({
      enabled,
      notifyOnNewTicket,
      notifyOnMaintenanceDue,
      notifyOnOverdue,
      notifyOnInspectionDue,
      primaryRecipient: primaryRecipient.trim(),
      ccRecipients: ccRecipients.trim(),
      senderName: senderName.trim(),
      webhookUrl: webhookUrl.trim(),
      autoDispatchMethod,
    });
    void refreshAutoEmailStatus();
    setIsSaved(true);
    showToast('Đã lưu cấu hình dịch vụ gửi email thông báo thành công!', 'success');
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    const res = await connectGmail(true);
    setIsConnectingGmail(false);
    showToast(res.message, res.success ? 'success' : 'warning');
  };

  // Test email trigger (executed after explicit confirmation modal)
  const executeSendTestEmail = async () => {
    setConfirmSendAction(null);
    setIsProcessing(true);
    const trimmedWebhook = webhookUrl.trim();
    if (trimmedWebhook !== (emailConfig.webhookUrl || '').trim()) {
      updateEmailConfig({ webhookUrl: trimmedWebhook });
    }
    const subj = `[FSM Test] Thử nghiệm hệ thống gửi email thông báo`;
    const body = `Kính gửi ${currentUser.tenNhanVien},\n\nĐây là email kiểm tra tính năng gửi thông báo tự động từ Hệ thống FACILITY SYSTEM MANAGEMENT.\n\nThông tin kiểm tra:\n- Người gửi: ${senderName}\n- Người nhận: ${primaryRecipient}\n- Danh sách CC: ${ccRecipients}\n- Thời gian: ${new Date().toLocaleString('vi-VN')}\n\nTrân trọng,\n${senderName}`;

    const result = await sendEmailNotification({
      type: 'THU_NGHIEM',
      subject: subj,
      body,
      recipient: primaryRecipient,
      cc: ccRecipients,
      relatedId: 'TEST-PING',
      webhookUrlOverride: trimmedWebhook,
      userConfirmed: true,
    });

    setIsProcessing(false);
    showToast(result.message, result.success ? 'success' : 'warning');
  };

  // Trigger batch maintenance due alert (executed after explicit confirmation modal)
  const executeTriggerDueAlerts = async () => {
    setConfirmSendAction(null);
    setIsProcessing(true);
    const res = await triggerMaintenanceDueAlerts({ userConfirmed: true });
    setIsProcessing(false);
    if (res.sentCount > 0) {
      if (res.result?.success) {
        showToast(
          `Đã tự động gửi email cảnh báo ${res.dueCount} thiết bị đến hạn tới ${primaryRecipient}!`,
          'success'
        );
      } else {
        showToast(
          res.result?.message || 'Chưa kết nối kênh gửi email tự động.',
          'warning'
        );
      }
    } else {
      showToast('Hiện tại không có thiết bị nào quá hạn hoặc tới hạn bảo trì.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 max-w-md ${
            toastType === 'warning'
              ? 'bg-amber-950/95 border-amber-500/40 text-amber-100'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {toastType === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {UI_TEXTS.tabs.emailAlerts.badge}
            </span>
            <span className="text-xs text-slate-400">
              ({emailLogs.length} thông báo đã gửi)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
            {UI_TEXTS.tabs.emailAlerts.title}
          </h2>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              if (duePlansCount === 0) {
                showToast('Hiện tại không có thiết bị nào quá hạn hoặc tới hạn bảo trì.', 'success');
                return;
              }
              setConfirmSendAction('due_alerts');
            }}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-semibold shadow-sm transition"
          >
            <BellRing className="w-4 h-4 text-amber-400" />
            <span>Quét & Gửi Email Đến Hạn ({duePlansCount})</span>
          </button>

          <button
            onClick={() => setConfirmSendAction('test')}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-cyan-900/30 transition"
          >
            <Send className="w-4 h-4" />
            <span>Gửi Thử Email</span>
          </button>
        </div>
      </div>

      {/* 1-Admin Email Channel Status Card */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          hasSharedServerChannel || isGmailConnected
            ? 'bg-emerald-950/30 border-emerald-500/40'
            : 'bg-cyan-950/25 border-cyan-500/40'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              hasSharedServerChannel || isGmailConnected
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-cyan-500/20 text-cyan-400'
            }`}
          >
            <Mail className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                {autoEmailServerStatus.smtpConfigured
                  ? `Kênh Gửi Chung Toàn Nhà Máy: SMTP (${autoEmailServerStatus.smtpUser || BOOTSTRAPPED_ADMIN_EMAIL})`
                  : autoEmailServerStatus.envWebhookConfigured || (webhookUrl.trim() && !isDevAppsScript)
                  ? `Kênh Gửi Chung Toàn Nhà Máy: Webhook Admin (${BOOTSTRAPPED_ADMIN_EMAIL})`
                  : isGmailConnected
                  ? `Đã kết nối Gmail Admin: ${gmailUser?.email}`
                  : `Cấu Hình 1 Tài Khoản Admin Gửi Mail Chung (${BOOTSTRAPPED_ADMIN_EMAIL})`}
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  hasSharedServerChannel || isGmailConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {hasSharedServerChannel
                  ? 'Dùng chung mọi User • Đang hoạt động'
                  : isGmailConnected
                  ? 'Đang hoạt động (Phiên Admin)'
                  : 'Chưa cấu hình kênh chung'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {hasSharedServerChannel
                ? 'Nhân viên đăng nhập bằng Mã NV & Mật khẩu không cần đăng nhập Gmail cá nhân; mọi thông báo Ticket / Bảo trì đều tự động gửi đi từ 1 tài khoản Admin duy nhất.'
                : isGmailConnected
                ? `Phiên Admin (${gmailUser?.email}) đang gửi mail trực tiếp. Để toàn bộ nhân viên cũng gửi tự động không cần đăng nhập Google, Admin nên cấu hình Render SMTP hoặc Webhook dùng chung bên dưới.`
                : `Khuyến nghị cấu hình SMTP_USER=${BOOTSTRAPPED_ADMIN_EMAIL} + SMTP_PASS (Mật khẩu ứng dụng Gmail) trên Render.com hoặc dán Apps Script Webhook để chỉ dùng 1 tài khoản Admin gửi mail cho toàn bộ nhân viên.`}
            </p>
          </div>
        </div>

        {adminAuthorized && (
          <div className="flex items-center gap-2.5 shrink-0">
            {isGmailConnected ? (
              <button
                type="button"
                onClick={() => void disconnectGmail()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
              >
                Ngắt kết nối Gmail
              </button>
            ) : (
              <GoogleSignInButton
                disabled={isConnectingGmail}
                label={
                  isConnectingGmail
                    ? 'Đang kết nối...'
                    : 'Kết nối Gmail Admin (Dự phòng)'
                }
                onClick={handleConnectGmail}
              />
            )}
          </div>
        )}
      </div>

      {/* Service Status KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Trạng Thái Dịch Vụ</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${emailConfig.enabled ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-500'}`}></span>
              <strong className="text-sm font-bold text-white">
                {emailConfig.enabled ? 'Đang Hoạt Động' : 'Đang Tạm Dừng'}
              </strong>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Email Nhận Chính</span>
            <strong className="text-xs sm:text-sm font-bold text-cyan-400 block mt-1 truncate max-w-[160px]">
              {emailConfig.primaryRecipient}
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Thiết Bị Cần Nhắc Hạn</span>
            <div className="flex items-center gap-1.5 mt-1">
              <strong className="text-base font-extrabold text-amber-400">
                {duePlansCount}
              </strong>
              <span className="text-xs text-slate-400 font-medium">máy móc</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Tổng Email Đã Gửi</span>
            <div className="flex items-center gap-1.5 mt-1">
              <strong className="text-base font-extrabold text-white">
                {emailLogs.length}
              </strong>
              <span className="text-xs text-slate-400 font-medium">bản ghi</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Inbox className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Configuration Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Thiết Lập Dịch Vụ Gửi Email
                </h3>
                <p className="text-xs text-slate-400">
                  Cấu hình các sự kiện kích hoạt và danh sách địa chỉ nhận thông báo
                </p>
              </div>
            </div>

            {/* Main Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="text-xs font-bold text-slate-300">
                {enabled ? 'BẬT' : 'TẮT'}
              </span>
            </label>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* Notification Triggers */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Sự Kiện Kích Hoạt Tự Động
              </span>

              <div className="space-y-2.5 text-xs text-slate-300">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnNewTicket}
                    onChange={(e) => setNotifyOnNewTicket(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 focus:ring-cyan-500"
                  />
                  <span>
                    <strong>Khi có Ticket sự cố mới (Sheet 4)</strong>: Tự động gửi email thông báo chi tiết cho Trưởng phòng & Người phụ trách
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnMaintenanceDue}
                    onChange={(e) => setNotifyOnMaintenanceDue(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 focus:ring-cyan-500"
                  />
                  <span>
                    <strong>Khi thiết bị tới hạn bảo trì (Sheet 2)</strong>: Nhắc nhở các thiết bị tới hạn hoặc trong vòng 7 ngày tới
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnOverdue}
                    onChange={(e) => setNotifyOnOverdue(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 focus:ring-cyan-500"
                  />
                  <span>
                    <strong>Cảnh báo khẩn cấp khi quá hạn</strong>: Bắn email cảnh báo đỏ khi máy móc vượt quá ngày bảo trì định kỳ
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnInspectionDue}
                    onChange={(e) => setNotifyOnInspectionDue(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 focus:ring-cyan-500"
                  />
                  <span>
                    <strong>Nhắc lịch kiểm định an toàn & hiệu chuẩn</strong>: Tự động gửi email nhắc trước ngày hết hạn kiểm định/hiệu chuẩn
                  </span>
                </label>
              </div>
            </div>

            {/* Recipient Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Email Người Nhận Chính (Trưởng phòng) *
                </label>
                <input
                  type="email"
                  required
                  value={primaryRecipient}
                  onChange={(e) => setPrimaryRecipient(e.target.value)}
                  placeholder="khiemhuynhggs@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Tên Người Gửi Hiển Thị
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Hệ Thống Quản Lý FACILITY SYSTEM MANAGEMENT"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* CC List */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Danh Sách Email Đồng Kính Gửi (CC - Phân cách bởi dấu phẩy)
              </label>
              <input
                type="text"
                value={ccRecipients}
                onChange={(e) => setCcRecipients(e.target.value)}
                placeholder="doanquanghung@factory.com, truongquangson@factory.com"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[11px] text-slate-500 block">
                Các kỹ sư phụ trách thiết bị và giám sát ca sẽ nhận được bản sao email thông báo.
              </span>
            </div>

            {/* Dispatch Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Phương Thức Chuyển Phát Thông Báo
                </label>
                <select
                  value={autoDispatchMethod}
                  onChange={(e) => setAutoDispatchMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="direct_service">Tự động gửi ngầm 1-chạm (Gmail OAuth / SMTP / Webhook)</option>
                  <option value="gmail_compose">Tự động gửi ngầm qua Gmail OAuth / Webhook (Mặc định)</option>
                  <option value="mailto">Tự động gửi ngầm (Gửi thủ công trong Nhật ký khi cần)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Webhook Endpoint (Tùy chọn nếu không dùng Gmail OAuth)
                  </label>
                  {webhookUrl.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setWebhookUrl('');
                        updateEmailConfig({ webhookUrl: '' });
                        showToast('Đã xóa Webhook. Hãy dùng Sign in with Google để gửi trực tiếp qua Gmail.', 'success');
                      }}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline"
                    >
                      Xóa Webhook
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {isDevAppsScript && (
                  <p className="text-[11px] text-rose-400 font-semibold">
                    Link đang kết thúc bằng <code>/dev</code> (chỉ test nội bộ). Hãy Deploy Web App để lấy link kết thúc bằng <code>/exec</code>.
                  </p>
                )}
              </div>
            </div>

            {isAutoSendReady ? (
              <div className="p-3 rounded-xl bg-emerald-950/35 border border-emerald-500/35 text-xs text-emerald-200 flex items-center justify-between gap-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Đã sẵn sàng gửi mail tự động 1-chạm:</strong> Hệ thống sẽ tự động gửi thư ngầm qua{' '}
                    <strong>
                      {autoEmailServerStatus.envWebhookConfigured
                        ? 'Webhook (Server Proxy)'
                        : autoEmailServerStatus.smtpConfigured
                        ? `SMTP Server (${autoEmailServerStatus.smtpUser || BOOTSTRAPPED_ADMIN_EMAIL})`
                        : (webhookUrl.trim() && !isDevAppsScript)
                        ? 'Google Apps Script Webhook (1 Gmail Admin dùng chung)'
                        : isGmailConnected
                        ? `Gmail OAuth (${gmailUser?.email})`
                        : 'Resend API'}
                    </strong>
                    {hasSharedServerChannel
                      ? ' — mọi nhân viên đều gửi chung không cần đăng nhập Gmail.'
                      : '.'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-950/35 border border-amber-500/35 text-xs text-amber-100 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Chưa kích hoạt kênh 1 tài khoản Admin dùng chung trên Render:</strong> Để nhân viên thông thường KHÔNG cần đăng nhập Gmail cá nhân mà vẫn gửi tự động, Admin chọn 1 trong 2 cách miễn phí:
                      <br />• <strong>Cách 1 (Khuyên dùng trên Render.com — SMTP Gmail):</strong> Trong Render Dashboard → Environment Variables thêm{' '}
                      <code className="text-amber-300">SMTP_HOST=smtp.gmail.com</code>,{' '}
                      <code className="text-amber-300">SMTP_PORT=465</code>,{' '}
                      <code className="text-amber-300">SMTP_USER={BOOTSTRAPPED_ADMIN_EMAIL}</code>,{' '}
                      <code className="text-amber-300">SMTP_PASS=&lt;Mật khẩu ứng dụng Gmail 16 ký tự&gt;</code>.
                      <br />• <strong>Cách 2 (Google Apps Script 30s):</strong> Tạo 1 Web App bằng Gmail Admin rồi dán link <code className="text-cyan-300">/exec</code> vào ô <em>Webhook Endpoint</em> ở trên.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAppsScriptGuide((prev) => !prev)}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] transition"
                  >
                    <span>Hướng dẫn 30s</span>
                    {showAppsScriptGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showAppsScriptGuide && (
                  <div className="pt-2 border-t border-amber-500/20 space-y-2 text-[11px] text-slate-300">
                    <p className="font-semibold text-white">
                      Tạo Webhook gửi mail tự động 100% miễn phí bằng 1 Gmail Admin ({BOOTSTRAPPED_ADMIN_EMAIL}):
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>Mở <strong>script.google.com</strong> bằng Gmail Admin → bấm <strong>Dự án mới</strong>.</li>
                      <li>Dán đoạn mã bên dưới vào file <code className="text-cyan-300">Code.gs</code> rồi bấm Lưu.</li>
                      <li>Bấm <strong>Triển khai (Deploy) → Tùy chọn triển khai mới → Ứng dụng web (Web App)</strong>, chọn Quyền truy cập: <strong>Bất kỳ ai (Anyone)</strong>.</li>
                      <li>Sao chép URL Web App (<code className="text-cyan-300">https://script.google.com/macros/s/.../exec</code>) dán vào ô <strong>Webhook Endpoint</strong> ở trên rồi bấm <strong>Lưu Cấu Hình Dịch Vụ</strong>.</li>
                    </ol>
                    <div className="relative">
                      <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-300 overflow-x-auto">
                        {APPS_SCRIPT_SNIPPET}
                      </pre>
                      <button
                        type="button"
                        onClick={handleCopyAppsScript}
                        className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold"
                      >
                        {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedScript ? 'Đã chép' : 'Sao chép mã'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-900/30 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSaved ? 'Đã Lưu Thiết Lập!' : 'Lưu Cấu Hình Dịch Vụ'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Email Template Preview (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Xem Trước Mẫu Email Gửi Đi</span>
              </div>

              {/* Template Switcher */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800">
                <button
                  onClick={() => setActivePreview('ticket')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                    activePreview === 'ticket'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ticket Mới
                </button>
                <button
                  onClick={() => setActivePreview('maintenance')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                    activePreview === 'maintenance'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bảo Trì Đến Hạn
                </button>
              </div>
            </div>

            {/* Email Container Mockup */}
            <div className="mt-4 rounded-xl border border-slate-700 bg-white text-slate-900 p-4 shadow-xl text-xs space-y-3 font-sans">
              {/* Email Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-extrabold text-[11px]">
                    F
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 block leading-tight">
                      {senderName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Gửi tới: <strong className="text-slate-700">{primaryRecipient}</strong>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Subject */}
              <div className="p-2 rounded bg-slate-100 font-bold text-slate-800 text-[11px]">
                {activePreview === 'ticket'
                  ? '[FACILITY SYSTEM MANAGEMENT - Ticket Mới] Xử lý rung ồn máy nén khí GA90-2 (Ưu tiên: Khẩn cấp) [CMP-GA90-02]'
                  : `[FSM Kế Hoạch] Cảnh báo ${duePlansCount} thiết bị đến hạn bảo trì định kỳ trong tuần`}
              </div>

              {/* Body Content */}
              {activePreview === 'ticket' ? (
                <div className="space-y-2 text-slate-700 leading-relaxed text-[11px]">
                  <p>Kính gửi <strong>Trưởng phòng Kỹ thuật & Kỹ sư Phụ trách</strong>,</p>
                  <p>Hệ thống FACILITY SYSTEM MANAGEMENT vừa ghi nhận phiếu yêu cầu sự cố / công việc phát sinh tại nhà máy:</p>
                  <div className="bg-rose-50 border border-rose-200 rounded p-2.5 space-y-1 text-rose-950">
                    <div><strong>Mã Ticket:</strong> TCK-2026-001</div>
                    <div><strong>Thiết bị:</strong> CMP-GA90-02 (Máy nén khí GA90-2)</div>
                    <div><strong>Mức độ:</strong> <span className="font-bold text-rose-700">Khẩn cấp</span></div>
                    <div><strong>Người lập:</strong> Đoàn Quang Hùng</div>
                    <div><strong>Người phụ trách:</strong> Trương Quang Sơn</div>
                    <div><strong>Mô tả:</strong> Máy có tiếng ồn kim loại lạ ở cụm sinh hàn dầu, nhiệt độ khí xả chạm ngưỡng 105°C. Đã dừng máy để bảo vệ cụm trục vít.</div>
                  </div>
                  <p className="text-slate-500 italic text-[10px]">
                    Vui lòng đăng nhập FACILITY SYSTEM MANAGEMENT để cập nhật tiến độ xử lý và xuất phụ tùng thay thế.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-slate-700 leading-relaxed text-[11px]">
                  <p>Kính gửi <strong>Đội ngũ Kỹ thuật & Quản lý Bảo trì Nhà máy</strong>,</p>
                  <p>Hệ thống FACILITY SYSTEM MANAGEMENT vừa quét kế hoạch bảo dưỡng định kỳ và phát hiện danh sách thiết bị đến hạn:</p>
                  <div className="bg-amber-50 border border-amber-200 rounded p-2 space-y-1.5 text-amber-950">
                    <div className="font-bold text-amber-900 border-b border-amber-200 pb-1">
                      Danh sách thiết bị cần bảo dưỡng:
                    </div>
                    <div>1. <strong>[QUÁ HẠN]</strong> Quạt thông gió nhà điện 1 (HVAC-OAFELC1) - Hạn: 2026-10-23</div>
                    <div>2. <strong>[TỚI HẠN]</strong> Chiller 01 (HVAC-CH-01) - Hạn: 2026-11-10</div>
                    <div>3. <strong>[SẮP TỚI]</strong> PAU 01 (HVAC-PAU-01) - Hạn: 2026-11-19</div>
                    <div>4. <strong>[SẮP TỚI]</strong> PAU 02 (HVAC-PAU-02) - Hạn: 2026-11-19</div>
                  </div>
                  <p className="text-slate-500 italic text-[10px]">
                    Đề nghị các kỹ sư chuẩn bị vật tư lọc túi, dầu bôi trơn và triển khai bảo trì đúng chuẩn.
                  </p>
                </div>
              )}

              {/* Email Footer */}
              <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-400 flex justify-between">
                <span>FACILITY SYSTEM MANAGEMENT - Factory Operations & Maintenance</span>
                <span>Thông báo tự động</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Mẫu email chuẩn HTML phản hồi tương thích với Gmail, Outlook và các ứng dụng duyệt mail trên di động.
            </span>
          </div>
        </div>
      </div>

      {/* Sent Email Outbox / Audit History Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Inbox className="w-4 h-4 text-cyan-400" />
              Nhật Ký Email Đã Gửi (Sent Outbox)
            </h3>
            <p className="text-xs text-slate-400">
              Lưu trữ toàn bộ thông báo email được kích hoạt từ hệ thống theo thời gian thực
            </p>
          </div>

          {emailLogs.length > 0 && (
            confirmClearLogs ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearEmailLogs();
                    setConfirmClearLogs(false);
                    showToast('Đã xóa toàn bộ nhật ký email.');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
                >
                  Xác nhận xóa hết
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearLogs(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearLogs(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Lịch Sử Email</span>
              </button>
            )
          )}
        </div>

        {emailLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Chưa có thông báo email nào được gửi đi. Hãy bấm <strong>"Gửi Thử Email"</strong> hoặc tạo một Ticket mới để kiểm tra!
          </div>
        ) : (
          <SmartHorizontalScroll>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-3">Thời Gian</th>
                  <th className="py-3 px-3">Loại Thông Báo</th>
                  <th className="py-3 px-3">Người Nhận</th>
                  <th className="py-3 px-3">Tiêu Đề Email</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                  <th className="py-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {emailLogs.map((log, index) => (
                  <tr key={`${log.id}-${index}`} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.type === 'TICKET_MOI'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : log.type === 'BAO_TRI_DEN_HAN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : log.type === 'BAO_TRI_QUA_HAN'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : log.type === 'KIEM_DINH_DEN_HAN'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : log.type === 'GIAO_VIEC'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : log.type === 'BAO_CAO_HOAN_THANH'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {log.type === 'TICKET_MOI'
                          ? 'Ticket Mới'
                          : log.type === 'BAO_TRI_DEN_HAN'
                          ? 'Đến Hạn Bảo Trì'
                          : log.type === 'BAO_TRI_QUA_HAN'
                          ? 'Quá Hạn Bảo Trì'
                          : log.type === 'KIEM_DINH_DEN_HAN'
                          ? 'Nhắc Hạn Kiểm Định'
                          : log.type === 'GIAO_VIEC'
                          ? 'Giao Việc'
                          : log.type === 'BAO_CAO_HOAN_THANH'
                          ? 'Báo Cáo Hoàn Thành'
                          : 'Thử Nghiệm'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-200">
                      {log.recipient}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-100 max-w-xs truncate">
                      {log.subject}
                    </td>
                    <td className="py-3 px-3">
                      {log.status === 'Đã gửi' ||
                      log.status === 'Đã gửi (Gmail)' ||
                      log.status === 'Đã gửi (Webhook)' ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3" />
                          {log.status}
                        </span>
                      ) : log.status === 'Thất bại' ? (
                        <div className="space-y-1 max-w-[240px]">
                          <span
                            title={log.errorMessage || 'Gửi thất bại'}
                            className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/60"
                          >
                            <XCircle className="w-3 h-3" />
                            {log.status}
                          </span>
                          {log.errorMessage && (
                            <p className="text-[10px] leading-snug text-rose-300/90 line-clamp-2">
                              {log.errorMessage}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-700/60">
                          <Clock className="w-3 h-3" />
                          {log.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            openEmailDispatchModal({
                              logId: log.id,
                              type: log.type,
                              to: log.recipient,
                              cc: log.cc || emailConfig.ccRecipients || '',
                              subject: log.subject,
                              body: log.fullContent || log.bodySnippet,
                              relatedId: log.relatedId,
                              webhookError: log.errorMessage,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition"
                          title="Mở gửi qua Gmail / Mailto"
                        >
                          <Send className="w-3 h-3" />
                          <span>Gửi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedLogForDetail(log)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Xem chi tiết toàn văn email"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEmailLog(log.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition"
                          title="Xóa nhật ký này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SmartHorizontalScroll>
        )}
      </div>

      {/* Full Email Content Modal */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Toàn Văn Email Thông Báo</h3>
              </div>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Thời gian:</span>
                  <strong className="text-slate-300 font-mono">{selectedLogForDetail.timestamp}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Gửi tới:</span>
                  <strong className="text-cyan-400 truncate block">{selectedLogForDetail.recipient}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Mã tham chiếu:</span>
                  <strong className="text-slate-300">{selectedLogForDetail.relatedId || 'N/A'}</strong>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold mb-1">Tiêu đề email:</span>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold">
                  {selectedLogForDetail.subject}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold mb-1">Nội dung chi tiết:</span>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {selectedLogForDetail.fullContent || selectedLogForDetail.bodySnippet}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explicit Confirmation Modal before sending email */}
      {confirmSendAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-cyan-400">
              <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {confirmSendAction === 'test'
                  ? 'Xác Nhận Gửi Email Thử Nghiệm'
                  : 'Xác Nhận Gửi Email Cảnh Báo Bảo Trì'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmSendAction === 'test' ? (
                <>
                  Hệ thống sẽ gửi 1 email thử nghiệm tới{' '}
                  <strong className="text-cyan-300">{primaryRecipient}</strong>
                  {isGmailConnected && gmailUser?.email
                    ? ` qua tài khoản Gmail ${gmailUser.email}.`
                    : '.'}
                </>
              ) : (
                <>
                  Hệ thống sẽ gửi email cảnh báo danh sách{' '}
                  <strong className="text-amber-300">{duePlansCount} thiết bị</strong> đến hạn/quá hạn bảo trì tới{' '}
                  <strong className="text-cyan-300">{primaryRecipient}</strong>
                  {isGmailConnected && gmailUser?.email
                    ? ` qua tài khoản Gmail ${gmailUser.email}.`
                    : '.'}
                </>
              )}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSendAction(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() =>
                  confirmSendAction === 'test'
                    ? void executeSendTestEmail()
                    : void executeTriggerDueAlerts()
                }
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow"
              >
                Xác Nhận Gửi Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
