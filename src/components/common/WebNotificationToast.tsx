import React from 'react';
import { createPortal } from 'react-dom';
import { useCMMS } from '../../context/CMMSContext';
import { getEmailTemplateTheme } from '../../utils/emailTemplates';
import {
  BellRing,
  X,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  BadgeCheck,
} from 'lucide-react';

interface WebNotificationToastProps {
  onNavigateTab: (tabId: string) => void;
}

export const WebNotificationToast: React.FC<WebNotificationToastProps> = ({ onNavigateTab }) => {
  const { activeWebToast, dismissActiveWebToast, markWebNotificationRead } = useCMMS();

  if (!activeWebToast || typeof document === 'undefined') return null;

  const theme = getEmailTemplateTheme(activeWebToast.type);

  const renderIcon = () => {
    switch (activeWebToast.type) {
      case 'TICKET_MOI':
      case 'BAO_TRI_QUA_HAN':
        return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'BAO_TRI_DEN_HAN':
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'KIEM_DINH_DEN_HAN':
        return <BadgeCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'BAO_CAO_HOAN_THANH':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'GIAO_VIEC':
        return <Wrench className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      default:
        return <BellRing className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    }
  };

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[95] w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in"
    >
      <div
        className="h-1 w-full"
        style={{ backgroundColor: theme.accentColor }}
      />
      <div className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
              {renderIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-[10px] font-extrabold px-1.5 py-0.5 rounded border"
                  style={{
                    backgroundColor: theme.badgeBg,
                    color: theme.badgeTextColor,
                    borderColor: theme.badgeBorder,
                  }}
                >
                  {theme.badgeText}
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 font-mono">
                  Web 0đ
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissActiveWebToast}
            aria-label="Đóng thông báo"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
            {activeWebToast.title}
          </h4>
          {activeWebToast.message && (
            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {activeWebToast.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            {activeWebToast.timestamp.slice(11, 16)}
            {activeWebToast.relatedId ? ` • ${activeWebToast.relatedId}` : ''}
          </span>

          <div className="flex items-center gap-1.5">
            {activeWebToast.targetTab && (
              <button
                type="button"
                onClick={() => {
                  markWebNotificationRead(activeWebToast.id);
                  onNavigateTab(activeWebToast.targetTab!);
                  dismissActiveWebToast();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold transition"
              >
                <span>Xem chi tiết</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
