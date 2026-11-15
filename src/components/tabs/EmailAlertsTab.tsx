import React, { useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { EmailLog } from '../../types/cmms';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  Mail,
  Send,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Settings,
  Eye,
  Trash2,
  RefreshCw,
  FileText,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Inbox,
  UserCheck,
} from 'lucide-react';

export const EmailAlertsTab: React.FC = () => {
  const {
    emailConfig,
    emailLogs,
    updateEmailConfig,
    sendEmailNotification,
    triggerMaintenanceDueAlerts,
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

  // UI state
  const [isSaved, setIsSaved] = useState(false);
  const [activePreview, setActivePreview] = useState<'ticket' | 'maintenance'>('ticket');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<EmailLog | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Statistics
  const duePlansCount = maintenancePlans.filter(
    (p) => p.trangThai === 'Quá hạn' || p.trangThai === 'Tới hạn' || p.trangThai === 'Sắp tới'
  ).length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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
    setIsSaved(true);
    showToast('Đã lưu cấu hình dịch vụ gửi email thông báo thành công!');
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Test email trigger
  const handleSendTestEmail = async () => {
    setIsProcessing(true);
    const subj = `[FSM Test] Thử nghiệm hệ thống gửi email thông báo tự động`;
    const body = `Kính gửi ${currentUser.tenNhanVien},\n\nĐây là email kiểm tra tính năng gửi thông báo tự động từ Hệ thống FACILITY SYSTEM MANAGEMENT.\nDịch vụ thông báo email đang hoạt động tốt trên hệ thống.\n\nThông tin kiểm tra:\n- Người gửi: ${senderName}\n- Người nhận: ${primaryRecipient}\n- Danh sách CC: ${ccRecipients}\n- Thời gian: ${new Date().toLocaleString('vi-VN')}\n\nTrân trọng,\n${senderName}`;

    await sendEmailNotification({
      type: 'THU_NGHIEM',
      subject: subj,
      body,
      recipient: primaryRecipient,
      relatedId: 'TEST-PING',
    });

    setIsProcessing(false);
    showToast(`Đã gửi email thử nghiệm thành công tới ${primaryRecipient}!`);
  };

  // Trigger batch maintenance due alert
  const handleTriggerDueAlerts = async () => {
    setIsProcessing(true);
    const result = await triggerMaintenanceDueAlerts();
    setIsProcessing(false);
    if (result.sentCount > 0) {
      showToast(`Đã phát thông báo email cảnh báo cho ${result.dueCount} thiết bị đến hạn tới ${primaryRecipient}!`);
    } else {
      showToast('Hiện tại không có thiết bị nào quá hạn hoặc tới hạn bảo trì.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
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
            onClick={handleTriggerDueAlerts}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-semibold shadow-sm transition"
          >
            <BellRing className="w-4 h-4 text-amber-400" />
            <span>Quét & Gửi Email Đến Hạn ({duePlansCount})</span>
          </button>

          <button
            onClick={handleSendTestEmail}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-cyan-900/30 transition"
          >
            <Send className="w-4 h-4" />
            <span>Gửi Thử Email</span>
          </button>
        </div>
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
            <ShieldCheck className="w-5 h-5" />
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
                  <option value="direct_service">Tự động ngầm (Direct Service / Webhook & Nhật ký)</option>
                  <option value="mailto">Mở Trình Email Máy Khách (mailto: Gmail / Outlook)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Webhook Endpoint (Tùy chọn Resend / Brevo / Apps Script)
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.resend.com/emails hoặc Webhook URL..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

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
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử thông báo email đã gửi?')) {
                  clearEmailLogs();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 text-xs font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Lịch Sử Email</span>
            </button>
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
                {emailLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
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
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3" />
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedLogForDetail(log)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Xem chi tiết toàn văn email"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
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
    </div>
  );
};
