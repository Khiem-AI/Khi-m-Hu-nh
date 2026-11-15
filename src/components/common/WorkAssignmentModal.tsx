import React, { useEffect, useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { parseAssigneeNames, resolveAssigneeEmails } from '../../utils/cmmsLogic';
import { MultiAssigneePicker } from './MultiAssigneePicker';
import { X, UserCheck, Mail, Send, CheckCircle2, AlertTriangle } from 'lucide-react';

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
  onAssigned,
}) => {
  const { employees, assignWorkAndNotify, emailConfig } = useCMMS();

  const [assigneeName, setAssigneeName] = useState('');
  const [assignerName, setAssignerName] = useState('');
  const [note, setNote] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAssigneeName('');
      setAssignerName('');
      setNote('');
      setSendEmail(true);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedAssignees = parseAssigneeNames(assigneeName);
  const targetEmails = resolveAssigneeEmails(
    assigneeName,
    employees,
    emailConfig.primaryRecipient
  );
  const targetEmailDisplay = targetEmails.join(', ');

  const moduleTitle =
    module === 'THIET_BI'
      ? 'Thiết Bị'
      : module === 'KE_HOACH_BAO_TRI'
      ? 'Kế Hoạch Bảo Trì'
      : 'Ticket Sự Cố';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAssignees.length === 0) {
      setError('Vui lòng chọn ít nhất 1 người thực hiện');
      return;
    }
    if (!assignerName.trim()) {
      setError('Vui lòng chọn người giao việc');
      return;
    }
    setError('');
    setIsSubmitting(true);
    await assignWorkAndNotify({
      module,
      targetId,
      targetName,
      assigneeName,
      assignerName,
      note: note.trim(),
      sendEmail,
    });
    setIsSubmitting(false);
    if (onAssigned) {
      onAssigned(
        sendEmail
          ? `Đã giao việc ${targetId} cho ${selectedAssignees.length} nhân sự (${assigneeName}) và gửi email tới ${targetEmailDisplay}`
          : `Đã cập nhật phân công ${targetId} cho ${assigneeName}`
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
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
            onChange={(formatted) => {
              setAssigneeName(formatted);
              if (formatted) setError('');
            }}
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

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 cursor-pointer text-xs text-slate-300">
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition disabled:opacity-50"
            >
              {sendEmail ? <Send className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {isSubmitting
                ? 'Đang gửi...'
                : sendEmail
                ? UI_TEXTS.workAssignment.submitEmailButton
                : UI_TEXTS.workAssignment.submitSaveButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
