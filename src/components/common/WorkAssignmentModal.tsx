import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import {
  parseAssigneeNames,
  resolveAssigneeEmailDetails,
  buildGmailComposeUrl,
  isAdminLevel,
  isPlaceholderEmail,
  isValidEmailFormat,
} from '../../utils/cmmsLogic';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../../utils/firestoreSync';
import { MultiAssigneePicker } from './MultiAssigneePicker';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  X,
  UserCheck,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Settings,
  RefreshCw,
} from 'lucide-react';

interface WorkAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: 'THIET_BI' | 'KE_HOACH_BAO_TRI' | 'TICKET';
  targetId: string;
  targetName: string;
  currentAssignee?: string;
  currentAssigner?: string;
  onAssigned?: (message: string) => void;
}

export const WorkAssignmentModal: React.FC<WorkAssignmentModalProps> = ({
  isOpen,
  onClose,
  module,
  targetId,
  targetName,
  currentAssignee,
  currentAssigner,
  onAssigned,
}) => {
  const {
    employees,
    currentUser,
    assignWorkAndNotify,
    emailConfig,
    updateEmailConfig,
    autoEmailServerStatus,
    gmailUser,
    isGmailConnected,
    connectGmail,
  } = useCMMS();

  const [assigneeName, setAssigneeName] = useState('');
  const [assignerName, setAssignerName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [saveEmailToProfile, setSaveEmailToProfile] = useState(true);
  const [note, setNote] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [error, setError] = useState('');
  const [dispatchFailure, setDispatchFailure] = useState<{
    message: string;
    notConfigured?: boolean;
    needsGmailAuth?: boolean;
    gmailUrl: string;
    recipient: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialAssignee = currentAssignee || '';
      const initialAssigner = currentAssigner || currentUser.tenNhanVien || '';
      setAssigneeName(initialAssignee);
      setAssignerName(initialAssigner);
      const details = resolveAssigneeEmailDetails(
        initialAssignee,
        employees,
        emailConfig.primaryRecipient
      );
      setRecipientEmail(details.emails.join(', '));
      setSaveEmailToProfile(true);
      setNote('');
      setSendEmail(true);
      setError('');
      setDispatchFailure(null);
    }
  }, [isOpen, currentAssignee, currentAssigner, currentUser.tenNhanVien, employees, emailConfig.primaryRecipient]);

  if (!isOpen) return null;

  const selectedAssignees = parseAssigneeNames(assigneeName);
  const emailDetails = resolveAssigneeEmailDetails(
    assigneeName,
    employees,
    emailConfig.primaryRecipient
  );

  const adminAuthorized = isAdminLevel(currentUser);
  const isAutoSendReady = Boolean(
    emailConfig.notificationMode === 'web_only' ||
      isGmailConnected ||
      emailConfig.webhookUrl?.trim() ||
      autoEmailServerStatus.smtpConfigured ||
      autoEmailServerStatus.resendConfigured ||
      autoEmailServerStatus.envWebhookConfigured
  );

  const singleSelectedEmp =
    selectedAssignees.length === 1
      ? employees.find(
          (e) =>
            e.tenNhanVien.trim().toLowerCase() === selectedAssignees[0].trim().toLowerCase() ||
            e.maNhanVien.trim().toLowerCase() === selectedAssignees[0].trim().toLowerCase()
        )
      : undefined;
  const emailChangedForSingle =
    Boolean(singleSelectedEmp) &&
    Boolean(recipientEmail.trim()) &&
    !recipientEmail.includes(',') &&
    recipientEmail.trim().toLowerCase() !== (singleSelectedEmp?.email || '').trim().toLowerCase();

  const handleAssigneeChange = (formatted: string) => {
    setAssigneeName(formatted);
    const nextDetails = resolveAssigneeEmailDetails(
      formatted,
      employees,
      emailConfig.primaryRecipient
    );
    setRecipientEmail(nextDetails.emails.join(', '));
    if (formatted) setError('');
  };

  const moduleTitle =
    module === 'THIET_BI'
      ? 'Thiết Bị'
      : module === 'KE_HOACH_BAO_TRI'
      ? 'Kế Hoạch Bảo Trì'
      : 'Ticket Sự Cố';

  const validateRecipientEmails = (): string | null => {
    const parsed = recipientEmail
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter((s) => isValidEmailFormat(s));
    if (parsed.length === 0) {
      return 'Vui lòng nhập ít nhất 1 địa chỉ email hợp lệ (ví dụ: ten@gmail.com).';
    }
    const real = parsed.filter((addr) => !isPlaceholderEmail(addr));
    if (real.length === 0) {
      return `Email "${parsed.join(', ')}" đang là địa chỉ mẫu (@factory.com) không thể gửi đi. Vui lòng nhập Gmail / email thực tế của người nhận ở ô trên.`;
    }
    return null;
  };

  const executeDispatch = async () => {
    setError('');
    setIsSubmitting(true);
    const sendResult = await assignWorkAndNotify({
      module,
      targetId,
      targetName,
      assigneeName,
      assignerName,
      note: note.trim(),
      sendEmail,
      recipientEmailOverride: sendEmail ? recipientEmail.trim() : undefined,
      saveEmailToProfile: sendEmail && emailChangedForSingle ? saveEmailToProfile : false,
    });
    setIsSubmitting(false);

    if (!sendEmail || sendResult?.success) {
      if (onAssigned) {
        if (!sendEmail) {
          onAssigned(`Đã cập nhật phân công ${targetId} cho ${assigneeName}`);
        } else {
          onAssigned(
            `Đã giao việc ${targetId} cho ${assigneeName} (${sendResult?.message || `đã gửi tới ${sendResult?.recipient}`})`
          );
        }
      }
      onClose();
      return;
    }

    const subj = `[FACILITY SYSTEM MANAGEMENT - Giao Việc ${moduleTitle}] ${targetName} (${targetId})`;
    const body = `Kính gửi ${assigneeName},\n\nBạn vừa được giao nhiệm vụ trên hệ thống FACILITY SYSTEM MANAGEMENT:\n- Phân hệ: ${moduleTitle}\n- Đối tượng / Mã: ${targetName} (${targetId})\n- Người giao việc: ${assignerName}\n- Người phụ trách thực hiện: ${assigneeName}\n${note.trim() ? `- Nội dung chỉ đạo: ${note.trim()}\n` : ''}\nVui lòng cập nhật kết quả trên FACILITY SYSTEM MANAGEMENT.\n\nTrân trọng,\n${emailConfig.senderName}`;
    const gmailUrl = buildGmailComposeUrl({
      to: recipientEmail.trim(),
      subject: subj,
      body,
    });

    const failureMsg =
      sendResult?.message ||
      'Chưa kết nối Gmail hoặc chưa cấu hình Webhook gửi mail tự động.';

    if (onAssigned) {
      onAssigned(`Đã lưu phân công ${targetId} cho ${assigneeName}. Chưa gửi được mail tự động: ${failureMsg}`);
    }

    setDispatchFailure({
      message: failureMsg,
      notConfigured: sendResult?.notConfigured,
      needsGmailAuth: sendResult?.needsGmailAuth,
      gmailUrl,
      recipient: recipientEmail.trim(),
    });
  };

  const handleConnectGmail = async (retryAfterConnect: boolean = false) => {
    setIsConnectingGmail(true);
    setError('');
    const res = await connectGmail(true);
    setIsConnectingGmail(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    if (retryAfterConnect) {
      const emailErr = validateRecipientEmails();
      if (emailErr) {
        setError(emailErr);
        return;
      }
      await executeDispatch();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (selectedAssignees.length === 0) {
      setError('Vui lòng chọn ít nhất 1 người thực hiện');
      return;
    }
    if (!assignerName.trim()) {
      setError('Vui lòng chọn người giao việc');
      return;
    }
    if (sendEmail) {
      const emailErr = validateRecipientEmails();
      if (emailErr) {
        setError(emailErr);
        return;
      }
      // Only Admin may trigger direct Gmail OAuth fallback when no shared SMTP/Webhook is configured
      if (!isAutoSendReady && adminAuthorized) {
        setIsConnectingGmail(true);
        setError('');
        const authRes = await connectGmail(true);
        setIsConnectingGmail(false);
        if (!authRes.success) {
          setError(authRes.message);
          return;
        }
      }
    }

    await executeDispatch();
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                {UI_TEXTS.workAssignment.titlePrefix} ({moduleTitle})
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {targetId} — {targetName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {dispatchFailure ? (
          <div className="p-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Đã lưu phân công <strong>{targetId}</strong> cho <strong>{assigneeName}</strong>.
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-100 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-300">Chưa thể tự động gửi email tới {dispatchFailure.recipient}</p>
                  <p className="text-rose-100/90 leading-relaxed">{dispatchFailure.message}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Kiểm tra / sửa email người nhận trước khi gửi lại
              </label>
              <input
                type="text"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="nhap-email-thuc-te@gmail.com"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
              {(!isAutoSendReady || dispatchFailure.needsGmailAuth) && adminAuthorized && (
                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="text-xs text-slate-300">
                    <strong className="text-white block">Kết nối Gmail Admin ({BOOTSTRAPPED_ADMIN_EMAIL}) &amp; gửi lại ngay:</strong>
                    <span className="text-[11px] text-slate-400">
                      Hoặc cấu hình SMTP / Webhook 1 lần để toàn bộ nhân viên tự động gửi chung không cần đăng nhập Google.
                    </span>
                  </div>
                  <GoogleSignInButton
                    compact
                    disabled={isConnectingGmail || isSubmitting}
                    label={
                      isConnectingGmail
                        ? 'Đang kết nối...'
                        : gmailUser
                        ? `Kết nối lại (${gmailUser.email})`
                        : 'Sign in with Google'
                    }
                    onClick={() => void handleConnectGmail(true)}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {isAutoSendReady && !dispatchFailure.needsGmailAuth && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        const emailErr = validateRecipientEmails();
                        if (emailErr) {
                          setError(emailErr);
                          return;
                        }
                        void executeDispatch();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Lại Email Ngay'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent('fsm:navigate-tab', { detail: 'email_alerts' }));
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg transition"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Cài Đặt Thông Báo Email</span>
                  </button>

                  <a
                    href={dispatchFailure.gmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Mở Gmail gửi ngay phiếu này</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <MultiAssigneePicker
            employees={employees}
            value={assigneeName}
            onChange={handleAssigneeChange}
            label={UI_TEXTS.workAssignment.assigneeLabel}
            accentColor="indigo"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              {UI_TEXTS.workAssignment.assignerLabel} *
            </label>
            <select
              value={assignerName}
              onChange={(e) => {
                setAssignerName(e.target.value);
                if (e.target.value) setError('');
              }}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">{UI_TEXTS.workAssignment.assignerPlaceholder}</option>
              {employees.map((emp) => (
                <option key={emp.maNhanVien} value={emp.tenNhanVien}>
                  [{emp.maNhanVien}] {emp.tenNhanVien}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              {UI_TEXTS.workAssignment.noteLabel}
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="rounded-xl bg-cyan-950/30 border border-cyan-500/30 p-3 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {UI_TEXTS.workAssignment.sendEmailLabel}
              </span>
            </label>

            {sendEmail && (
              <div className="space-y-2 pt-1 border-t border-cyan-500/20">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Email người được giao việc (có thể sửa trực tiếp)
                    </label>
                    <span
                      className={`text-[10px] font-bold ${
                        emailConfig.notificationMode === 'web_only' || isGmailConnected
                          ? 'text-emerald-400'
                          : isAutoSendReady
                          ? 'text-amber-300'
                          : 'text-amber-400'
                      }`}
                    >
                      {emailConfig.notificationMode === 'web_only'
                        ? 'Thông báo Web (Miễn phí 0đ)'
                        : isGmailConnected && gmailUser?.email
                        ? `Gmail (${gmailUser.email}) • Gửi trực tiếp`
                        : emailConfig.webhookUrl?.trim()
                        ? 'Đang dự phòng qua Webhook (chưa kết nối Gmail)'
                        : isAutoSendReady
                        ? 'Tự động qua Server SMTP/Resend'
                        : 'Chưa kết nối Gmail'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="nhap-email-thuc-te@gmail.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {!isAutoSendReady && (
                  adminAuthorized ? (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          Chưa có kênh SMTP/Webhook dùng chung. Admin có thể bấm Sign in with Google ({BOOTSTRAPPED_ADMIN_EMAIL}) để gửi trực tiếp, hoặc thiết lập SMTP/Webhook trong mục Thông Báo Email.
                        </span>
                      </div>
                      <GoogleSignInButton
                        compact
                        disabled={isConnectingGmail || isSubmitting}
                        label={
                          isConnectingGmail
                            ? 'Đang kết nối...'
                            : gmailUser
                            ? 'Kết nối lại Gmail'
                            : 'Sign in with Google'
                        }
                        onClick={() => void handleConnectGmail(false)}
                      />
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        Hệ thống dùng 1 tài khoản Admin (<strong className="font-mono">{BOOTSTRAPPED_ADMIN_EMAIL}</strong>) qua SMTP/Webhook để gửi email. Hiện Admin chưa bật kênh tự động — bạn vẫn có thể bấm lưu phân công bình thường.
                      </span>
                    </div>
                  )
                )}

                {(emailDetails.placeholderEmployees.length > 0 ||
                  emailDetails.missingEmployees.length > 0) &&
                  !emailChangedForSingle && (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        {emailDetails.placeholderEmployees.length > 0
                          ? `Nhân sự (${emailDetails.placeholderEmployees
                              .map((p) => `${p.name}: ${p.email}`)
                              .join(', ')}) đang dùng email mẫu (@factory.com). Bạn nên sửa thành Gmail thật ở ô trên.`
                          : `Nhân sự (${emailDetails.missingEmployees.join(
                              ', '
                            )}) chưa có email nên hệ thống tạm dùng email quản lý.`}
                      </span>
                    </div>
                  )}

                {emailChangedForSingle && singleSelectedEmp && (
                  <label className="flex items-center gap-2 text-[11px] text-emerald-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveEmailToProfile}
                      onChange={(e) => setSaveEmailToProfile(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>
                      Lưu email mới này vào hồ sơ của <strong>{singleSelectedEmp.tenNhanVien}</strong>
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isConnectingGmail}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition disabled:opacity-50"
            >
              {sendEmail ? <Send className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {isConnectingGmail
                ? 'Đang kết nối Gmail...'
                : isSubmitting
                ? 'Đang gửi email...'
                : sendEmail
                ? UI_TEXTS.workAssignment.submitEmailButton
                : UI_TEXTS.workAssignment.submitSaveButton}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>,
    document.body
  );
};

