import React, { useMemo, useRef, useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import {
  CompressorConsumableType,
  CompressorMonthlyLog,
  CompressorUnitSpec,
} from '../../types/cmms';
import {
  CONSUMABLE_META,
  ConsumableStatusInfo,
  analyzeCompressorStore,
  calculateNextMonthReadings,
  exportCompressorRuntimeCsv,
  parseCompressorRuntimeCsv,
} from '../../utils/utilityCompressorCsv';
import { canDeleteRecords, formatDateVN, getTodayISODate } from '../../utils/cmmsLogic';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Gauge,
  History,
  Mail,
  Package,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  TrendingUp,
  Upload,
  Wrench,
  X,
} from 'lucide-react';

type SubTab = 'overview' | 'monthly_table' | 'replacements';

function formatMonthVN(yyyyMm: string | null): string {
  if (!yyyyMm || !yyyyMm.includes('-')) return '—';
  const [y, m] = yyyyMm.split('-');
  return `${m}/${y}`;
}

function getNextMonthIso(latestMonth: string | null): string {
  if (!latestMonth || !/^\d{4}-\d{2}$/.test(latestMonth)) {
    return getTodayISODate().slice(0, 7);
  }
  const [y, m] = latestMonth.split('-').map(Number);
  const nextM = m === 12 ? 1 : m + 1;
  const nextY = m === 12 ? y + 1 : y;
  return `${nextY}-${String(nextM).padStart(2, '0')}`;
}

const CHART_COLORS = ['#0284c7', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0d9488'];

export const CompressorRuntimeTab: React.FC = () => {
  const {
    compressorRuntime,
    spareParts,
    currentUser,
    upsertCompressorMonthlyLog,
    deleteCompressorMonthlyLog,
    recordCompressorReplacement,
    deleteCompressorReplacementEvent,
    updateCompressorUnitSpec,
    updateCompressorThresholds,
    replaceCompressorRuntimeStore,
    sendEmailNotification,
  } = useCMMS();

  const [subTab, setSubTab] = useState<SubTab>('overview');
  const [chartGroup, setChartGroup] = useState<'main' | 'aux'>('main');
  const [tableGroup, setTableGroup] = useState<'main' | 'aux'>('main');
  const [historyMachineFilter, setHistoryMachineFilter] = useState<string>('ALL');

  // Modals
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const [monthlyFormMonth, setMonthlyFormMonth] = useState<string>('');
  const [monthlyFormDate, setMonthlyFormDate] = useState<string>('');
  const [monthlyFormNote, setMonthlyFormNote] = useState<string>('');
  const [monthlyInputs, setMonthlyInputs] = useState<
    Record<string, { runningHours: string; loadHours: string }>
  >({});

  const [replaceModal, setReplaceModal] = useState<{
    machineKey: string;
    consumable: CompressorConsumableType;
    date: string;
    runningHoursAtChange: string;
    newIntervalH: number;
    sparePartCode: string;
    quantityUsed: number;
    deductStock: boolean;
    createMaintenanceHistory: boolean;
    note: string;
  } | null>(null);

  const [editingSpec, setEditingSpec] = useState<CompressorUnitSpec | null>(null);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const allowDelete = canDeleteRecords(currentUser);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const analytics = useMemo(() => analyzeCompressorStore(compressorRuntime), [compressorRuntime]);

  const sparePartsMap = useMemo(() => {
    const map = new Map<string, (typeof spareParts)[number]>();
    spareParts.forEach((sp) => map.set(sp.maVatTu.toUpperCase(), sp));
    return map;
  }, [spareParts]);

  const mainUnits = useMemo(
    () => analytics.units.filter((u) => u.spec.tracksConsumables),
    [analytics.units]
  );
  const auxUnits = useMemo(
    () => analytics.units.filter((u) => !u.spec.tracksConsumables),
    [analytics.units]
  );

  const sortedLogsDesc = useMemo(
    () => [...compressorRuntime.monthlyLogs].sort((a, b) => b.month.localeCompare(a.month)),
    [compressorRuntime.monthlyLogs]
  );

  const sortedLogsAsc = useMemo(
    () => [...compressorRuntime.monthlyLogs].sort((a, b) => a.month.localeCompare(b.month)),
    [compressorRuntime.monthlyLogs]
  );

  // Open Monthly Reading Entry Modal
  const handleOpenMonthlyModal = (existingLog?: CompressorMonthlyLog) => {
    const baseLog = existingLog || analytics.latestLog;
    const targetMonth = existingLog
      ? existingLog.month
      : getNextMonthIso(analytics.latestLog?.month || null);
    const dayStr = String(compressorRuntime.readingDayOfMonth || 15).padStart(2, '0');

    setMonthlyFormMonth(targetMonth);
    setMonthlyFormDate(existingLog?.recordedDate || `${targetMonth}-${dayStr}`);
    setMonthlyFormNote(existingLog?.note || '');

    const initialInputs: Record<string, { runningHours: string; loadHours: string }> = {};
    for (const spec of compressorRuntime.unitSpecs) {
      const r = existingLog ? existingLog.readings[spec.machineKey] : baseLog?.readings[spec.machineKey];
      initialInputs[spec.machineKey] = {
        runningHours: existingLog && r?.runningHours != null ? String(r.runningHours) : '',
        loadHours: existingLog && r?.loadHours != null ? String(r.loadHours) : '',
      };
    }
    setMonthlyInputs(initialInputs);
    setIsMonthlyModalOpen(true);
  };

  const handleSaveMonthlyReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}-\d{2}$/.test(monthlyFormMonth)) {
      showToast('err', 'Vui lòng chọn tháng chốt hợp lệ (YYYY-MM).');
      return;
    }

    // Find immediately preceding month log for automatic remaining-hour subtraction
    const prevLog =
      sortedLogsAsc
        .filter((l) => l.month < monthlyFormMonth)
        .slice(-1)[0] || null;

    const parsedInputs: Record<string, { runningHours: number | null; loadHours: number | null }> = {};
    for (const spec of compressorRuntime.unitSpecs) {
      const raw = monthlyInputs[spec.machineKey];
      const runVal = raw?.runningHours?.trim() ? Number(raw.runningHours) : null;
      const loadVal = raw?.loadHours?.trim() ? Number(raw.loadHours) : null;
      parsedInputs[spec.machineKey] = {
        runningHours: runVal !== null && Number.isFinite(runVal) ? runVal : null,
        loadHours: loadVal !== null && Number.isFinite(loadVal) ? loadVal : null,
      };
    }

    const readings = calculateNextMonthReadings(prevLog, parsedInputs, compressorRuntime.unitSpecs);
    upsertCompressorMonthlyLog({
      id: `MNK-LOG-${monthlyFormMonth}`,
      month: monthlyFormMonth,
      recordedDate: monthlyFormDate || `${monthlyFormMonth}-15`,
      readings,
      note: monthlyFormNote.trim() || undefined,
      recordedBy: currentUser.tenNhanVien,
    });

    setIsMonthlyModalOpen(false);
    showToast(
      'ok',
      `Đã lưu chỉ số giờ chạy tháng ${formatMonthVN(monthlyFormMonth)} và tự động trừ giờ vật tư còn lại.`
    );
  };

  // Open Replacement Modal
  const handleOpenReplaceModal = (
    machineKey: string,
    consumable: CompressorConsumableType = 'oilFilter'
  ) => {
    const unit = analytics.units.find((u) => u.spec.machineKey === machineKey);
    const spec = unit?.spec;
    let defaultInterval = CONSUMABLE_META[consumable].defaultIntervalH;
    let defaultPartCode = '';
    if (spec) {
      if (consumable === 'oil') {
        defaultInterval = spec.oilIntervalH || 8000;
        defaultPartCode = spec.sparePartCodes?.oil || '';
      } else if (consumable === 'airFilter') {
        defaultInterval = spec.airFilterIntervalH || 4000;
        defaultPartCode = spec.sparePartCodes?.airFilter || '';
      } else if (consumable === 'oilFilter') {
        defaultInterval = spec.oilFilterIntervalH || 8000;
        defaultPartCode = spec.sparePartCodes?.oilFilter || '';
      } else if (consumable === 'oilSeparator') {
        defaultInterval = spec.oilSeparatorIntervalH || 8000;
        defaultPartCode = spec.sparePartCodes?.oilSeparator || '';
      }
    }

    setReplaceModal({
      machineKey,
      consumable,
      date: getTodayISODate(),
      runningHoursAtChange: unit?.runningHours != null ? String(unit.runningHours) : '',
      newIntervalH: defaultInterval,
      sparePartCode: defaultPartCode,
      quantityUsed: consumable === 'oil' ? spec?.oilCapacityLiters || 1 : 1,
      deductStock: Boolean(defaultPartCode),
      createMaintenanceHistory: true,
      note:
        consumable === 'oil' && spec?.oilCapacityLiters
          ? `Thay ${spec.oilCapacityLiters}L dầu máy nén khí`
          : '',
    });
  };

  const handleConfirmReplacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceModal) return;
    recordCompressorReplacement({
      machineKey: replaceModal.machineKey,
      date: replaceModal.date,
      consumable: replaceModal.consumable,
      runningHoursAtChange: replaceModal.runningHoursAtChange.trim()
        ? Number(replaceModal.runningHoursAtChange)
        : null,
      newIntervalH: Number(replaceModal.newIntervalH) || CONSUMABLE_META[replaceModal.consumable].defaultIntervalH,
      sparePartCode: replaceModal.sparePartCode || undefined,
      quantityUsed: replaceModal.quantityUsed,
      deductStock: replaceModal.deductStock,
      createMaintenanceHistory: replaceModal.createMaintenanceHistory,
      note: replaceModal.note,
    });
    showToast(
      'ok',
      `Đã xác nhận thay ${CONSUMABLE_META[replaceModal.consumable].label} cho ${replaceModal.machineKey} và đặt lại mốc ${replaceModal.newIntervalH.toLocaleString('vi-VN')}h.`
    );
    setReplaceModal(null);
  };

  // Send Alert Email
  const handleSendConsumableAlertEmail = async () => {
    const dueList = [...analytics.overdueAlerts, ...analytics.warningAlerts];
    if (dueList.length === 0) {
      showToast('ok', 'Hiện không có vật tư MNK nào dưới ngưỡng cảnh báo.');
      return;
    }
    setIsSendingAlert(true);
    try {
      const lines = dueList.map((a, idx) => {
        const sp = a.item.sparePartCode ? sparePartsMap.get(a.item.sparePartCode.toUpperCase()) : undefined;
        const stockText = sp ? ` | Tồn kho (${sp.maVatTu}): ${sp.tonThucTe} ${sp.donViTinh}` : '';
        const estText = a.item.estimatedDueDate
          ? ` | Dự kiến tới hạn: ${formatDateVN(a.item.estimatedDueDate)} (~${a.item.estimatedDaysLeft} ngày)`
          : '';
        return `${idx + 1}. ${a.displayName} — ${a.item.label}: còn ${a.item.remainingH?.toLocaleString('vi-VN')}h${estText}${stockText}`;
      });
      const subject = `[CẢNH BÁO VẬT TƯ MNK] ${dueList.length} hạng mục sắp/quá hạn thay thế (Kỳ ${formatMonthVN(analytics.latestLog?.month || null)})`;
      const body = [
        `Kính gửi Đội Kỹ Thuật Facility,`,
        ``,
        `Hệ thống quản lý giờ chạy Máy Nén Khí ghi nhận ${dueList.length} hạng mục vật tư đang dưới ngưỡng cảnh báo (< ${compressorRuntime.warningThresholdH.toLocaleString('vi-VN')}h):`,
        ``,
        ...lines,
        ``,
        `Vui lòng kiểm tra tồn kho phụ tùng và lập kế hoạch thay thế kịp thời.`,
      ].join('\n');

      const result = await sendEmailNotification({
        type: 'BAO_TRI_DEN_HAN',
        subject,
        body,
        relatedId: `MNK-${analytics.latestLog?.month || getTodayISODate()}`,
        userConfirmed: true,
        allowDuplicate: true,
      });
      showToast(result.success ? 'ok' : 'err', result.message);
    } finally {
      setIsSendingAlert(false);
    }
  };

  const handleExportCsv = () => {
    const csv = exportCompressorRuntimeCsv(compressorRuntime);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `So_gio_chay_MNK_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const parsed = parseCompressorRuntimeCsv(text);
      if (parsed.monthlyLogs.length === 0) {
        showToast('err', 'Không đọc được dữ liệu kỳ tháng hợp lệ từ file CSV Số giờ chạy MNK.');
        return;
      }
      replaceCompressorRuntimeStore(parsed, file.name);
      showToast(
        'ok',
        `Đã nạp ${parsed.monthlyLogs.length} kỳ tháng và ${parsed.replacementEvents.length} lịch sử thay vật tư từ ${file.name}.`
      );
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // Build SVG trend chart data (last 12 months)
  const chartSeries = useMemo(() => {
    const recentLogs = sortedLogsAsc.slice(-14);
    const keys =
      chartGroup === 'main'
        ? ['GA75-1', 'GA75-2', 'VSD90-1', 'VSD90-2']
        : ['AD300-1', 'AD300-2', 'NPG360-1', 'NPG360-2', 'FD220-1', 'FD220-2'];

    let maxVal = 1000;
    for (const log of recentLogs) {
      for (const k of keys) {
        const v = log.readings[k]?.runningHours;
        if (typeof v === 'number' && v > maxVal) maxVal = v;
      }
    }
    maxVal = Math.ceil(maxVal / 2000) * 2000;

    return { recentLogs, keys, maxVal };
  }, [sortedLogsAsc, chartGroup]);

  const filteredReplacementEvents = useMemo(() => {
    if (historyMachineFilter === 'ALL') return compressorRuntime.replacementEvents;
    return compressorRuntime.replacementEvents.filter((e) => e.machineKey === historyMachineFilter);
  }, [compressorRuntime.replacementEvents, historyMachineFilter]);

  const renderConsumableRow = (machineKey: string, c: ConsumableStatusInfo) => {
    const sp = c.sparePartCode ? sparePartsMap.get(c.sparePartCode.toUpperCase()) : undefined;
    const barColor =
      c.alertLevel === 'qua_han'
        ? 'bg-rose-500'
        : c.alertLevel === 'sap_den_han'
          ? 'bg-amber-500'
          : 'bg-emerald-500';
    const textStatusColor =
      c.alertLevel === 'qua_han'
        ? 'text-rose-600 dark:text-rose-400'
        : c.alertLevel === 'sap_den_han'
          ? 'text-amber-700 dark:text-amber-400'
          : 'text-emerald-700 dark:text-emerald-400';

    return (
      <div
        key={c.type}
        className="py-2.5 border-t border-slate-100 dark:border-[#202d42] first:border-t-0 space-y-1.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-100">{c.label}</span>
              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                ({c.intervalH.toLocaleString('vi-VN')}h)
              </span>
              {c.formulaAnomaly && (
                <span
                  title={c.formulaAnomaly}
                  className="text-[11px] font-medium text-amber-600 dark:text-amber-400"
                >
                  · Cần kiểm tra mốc
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {c.estimatedDueDate && c.remainingH !== null && c.remainingH > 0 && (
                <span>
                  Dự kiến thay: <strong className="text-slate-700 dark:text-slate-200">{formatDateVN(c.estimatedDueDate)}</strong>{' '}
                  (~{c.estimatedDaysLeft} ngày)
                </span>
              )}
              {sp && (
                <span className={sp.tonThucTe <= 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
                  · Kho {sp.maVatTu}: <strong className="font-mono tabular-nums">{sp.tonThucTe}</strong> {sp.donViTinh}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-right">
              <div className={`font-mono text-xs font-bold tabular-nums ${textStatusColor}`}>
                {c.remainingH !== null ? `${c.remainingH.toLocaleString('vi-VN')} h` : '—'}
              </div>
              <div className={`text-[10px] font-semibold ${textStatusColor}`}>
                {c.alertLevel === 'qua_han'
                  ? 'Quá hạn'
                  : c.alertLevel === 'sap_den_han'
                    ? 'Sắp tới hạn'
                    : c.alertLevel === 'an_toan'
                      ? 'An toàn'
                      : 'Chưa có'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenReplaceModal(machineKey, c.type)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-[#223049] hover:bg-sky-600 hover:text-white dark:hover:bg-sky-600 text-slate-700 dark:text-slate-200 transition whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              Thay
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-[#111927] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(4, c.usedPct))}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-sky-700 dark:text-sky-400">
            {UI_TEXTS.tabs.compressorRuntime.badge} · Chốt định kỳ ngày {compressorRuntime.readingDayOfMonth} hàng tháng
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#edf2f9] tracking-tight">
            {UI_TEXTS.tabs.compressorRuntime.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportCsv}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleSendConsumableAlertEmail}
            disabled={isSendingAlert}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-[#172133] border border-slate-200 dark:border-[#2a3952] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1f2c42] disabled:opacity-50 transition whitespace-nowrap shrink-0"
          >
            <Mail className="w-3.5 h-3.5" />
            {isSendingAlert ? 'Đang gửi...' : 'Gửi Mail Nhắc Thay'}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-[#172133] border border-slate-200 dark:border-[#2a3952] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1f2c42] transition whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-[#172133] border border-slate-200 dark:border-[#2a3952] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1f2c42] transition whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất CSV
          </button>
          <button
            type="button"
            onClick={() => handleOpenMonthlyModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Chốt Số Tháng Mới
          </button>
        </div>
      </div>

      {toast && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-medium ${
            toast.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248]">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Kỳ chốt gần nhất</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#edf2f9]">
            {formatMonthVN(analytics.latestLog?.month || null)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {compressorRuntime.monthlyLogs.length} kỳ dữ liệu · 10 thiết bị khí nén
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248]">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Vật tư quá hạn (≤ 0h)</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                analytics.overdueAlerts.length > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {analytics.overdueAlerts.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">hạng mục</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Cần dừng máy thay ngay nếu &gt; 0
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248]">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Sắp tới hạn (&lt; {compressorRuntime.warningThresholdH.toLocaleString('vi-VN')}h)
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                analytics.warningAlerts.length > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {analytics.warningAlerts.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">hạng mục cảnh báo vàng</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Kiểm tra tồn kho & chuẩn bị vật tư
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248]">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Lịch sử thay vật tư</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#edf2f9]">
              {compressorRuntime.replacementEvents.length}
            </span>
            <span className="text-xs text-sky-700 dark:text-sky-400 font-medium">lần thay</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Gần nhất: {compressorRuntime.replacementEvents[0] ? formatDateVN(compressorRuntime.replacementEvents[0].date) : '—'}
          </div>
        </div>
      </div>

      {/* Actionable Alert & Anomaly Center */}
      {(analytics.overdueAlerts.length > 0 ||
        analytics.warningAlerts.length > 0 ||
        analytics.allAnomalies.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(analytics.overdueAlerts.length > 0 || analytics.warningAlerts.length > 0) && (
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/90 dark:border-amber-800/60 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Cần Lập Kế Hoạch Thay Thế Vật Tư ({analytics.overdueAlerts.length + analytics.warningAlerts.length})
                </div>
              </div>
              <div className="divide-y divide-amber-200/60 dark:divide-amber-800/40">
                {[...analytics.overdueAlerts, ...analytics.warningAlerts].map((a) => {
                  const sp = a.item.sparePartCode
                    ? sparePartsMap.get(a.item.sparePartCode.toUpperCase())
                    : undefined;
                  return (
                    <div
                      key={`${a.machineKey}-${a.item.type}`}
                      className="py-2 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-[#edf2f9]">
                          {a.machineKey} · {a.item.label}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Còn{' '}
                          <strong
                            className={`font-mono tabular-nums ${
                              a.item.alertLevel === 'qua_han'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {a.item.remainingH?.toLocaleString('vi-VN')}h
                          </strong>
                          {a.item.estimatedDueDate && a.item.estimatedDaysLeft !== null && (
                            <>
                              {' '}· Dự kiến <strong>{formatDateVN(a.item.estimatedDueDate)}</strong> (~{a.item.estimatedDaysLeft} ngày)
                            </>
                          )}
                          {sp && (
                            <>
                              {' '}· Kho {sp.maVatTu}: <strong className="font-mono">{sp.tonThucTe}</strong> {sp.donViTinh}
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenReplaceModal(a.machineKey, a.item.type)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-600 hover:bg-amber-500 text-white whitespace-nowrap shrink-0 transition"
                      >
                        Xác nhận thay
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {analytics.allAnomalies.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141e30] border border-slate-200 dark:border-[#2a3952] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                Phát Hiện Bất Thường Số Liệu Từ File Excel Gốc ({analytics.allAnomalies.length})
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {analytics.allAnomalies.map((an, i) => (
                  <li key={i} className="leading-relaxed">
                    <strong className="font-mono text-sky-700 dark:text-sky-400">{an.machineKey}:</strong>{' '}
                    {an.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-[#141d2d] border border-slate-200/80 dark:border-[#243248] w-fit">
        <button
          type="button"
          onClick={() => setSubTab('overview')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
            subTab === 'overview'
              ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          Tổng Quan & Tuổi Thọ Vật Tư
        </button>
        <button
          type="button"
          onClick={() => setSubTab('monthly_table')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
            subTab === 'monthly_table'
              ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Bảng Chốt Số Hàng Tháng ({compressorRuntime.monthlyLogs.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('replacements')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
            subTab === 'replacements'
              ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Lịch Sử Thay Vật Tư & Định Mức
        </button>
      </div>

      {/* TAB 1: OVERVIEW + CONSUMABLES + AUXILIARY + TREND CHART */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Main Compressors Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {mainUnits.map((unit) => (
              <div
                key={unit.spec.machineKey}
                className="p-5 rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248] space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <span>{unit.spec.equipmentCode}</span>
                      <span>·</span>
                      <span>Dầu {unit.spec.oilCapacityLiters || 18}L</span>
                      {unit.isMissingLatestReading && (
                        <>
                          <span>·</span>
                          <span className="font-sans text-amber-600 dark:text-amber-400 font-semibold">
                            Đang trống kỳ {formatMonthVN(unit.latestMonth)}
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-[#edf2f9] mt-0.5">
                      {unit.spec.displayName}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingSpec(unit.spec)}
                    title="Cài đặt định mức & liên kết kho phụ tùng"
                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-[#223049] transition"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                {/* Runtime KPIs inline */}
                <div className="grid grid-cols-3 gap-3 py-3 px-3.5 rounded-lg bg-slate-50 dark:bg-[#131c2c] border border-slate-200/70 dark:border-[#202d42]">
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Tổng giờ chạy</div>
                    <div className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-[#edf2f9] tabular-nums mt-0.5">
                      {unit.runningHours !== null ? `${unit.runningHours.toLocaleString('vi-VN')} h` : '—'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {unit.deltaLastMonthH !== null ? `+${unit.deltaLastMonthH.toLocaleString('vi-VN')}h kỳ gần nhất` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Giờ có tải</div>
                    <div className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-[#edf2f9] tabular-nums mt-0.5">
                      {unit.loadHours !== null ? `${unit.loadHours.toLocaleString('vi-VN')} h` : '—'}
                    </div>
                    <div className="text-[10px] text-sky-700 dark:text-sky-400 font-medium tabular-nums">
                      {unit.loadRatioPct !== null ? `Tỷ lệ tải ${unit.loadRatioPct}%` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Cường độ chạy TB</div>
                    <div className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-[#edf2f9] tabular-nums mt-0.5">
                      {unit.avgHoursPerMonth.toLocaleString('vi-VN')} h/th
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                      ~{unit.avgHoursPerDay} giờ/ngày
                    </div>
                  </div>
                </div>

                {/* 4 Consumables Progress List */}
                <div>{unit.consumables.map((c) => renderConsumableRow(unit.spec.machineKey, c))}</div>
              </div>
            ))}
          </div>

          {/* 6 Auxiliary Compressed Air / Nitrogen Units */}
          <div className="rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200/80 dark:border-[#243248] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-[#edf2f9]">
                  Thiết Bị Phụ Trợ Hệ Khí Nén & Khí Nito (6 Máy)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Máy sấy hấp thụ AD300 · Máy tạo Nito NPG360 · Máy sấy tác nhân lạnh FD220
                </p>
              </div>
            </div>

            <SmartHorizontalScroll>
              <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#131c2c] border-b border-slate-200 dark:border-[#243248] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-5">Thiết bị</th>
                    <th className="py-2.5 px-3">Mã tài sản</th>
                    <th className="py-2.5 px-3">Nhóm</th>
                    <th className="py-2.5 px-3 text-right">Tổng giờ chạy</th>
                    <th className="py-2.5 px-3 text-right">Giờ có tải</th>
                    <th className="py-2.5 px-3 text-right">Tăng kỳ gần nhất</th>
                    <th className="py-2.5 px-5 text-right">TB giờ/tháng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#202d42]">
                  {auxUnits.map((u) => (
                    <tr key={u.spec.machineKey} className="hover:bg-slate-50/70 dark:hover:bg-[#1c283d]">
                      <td className="py-3 px-5 font-semibold text-slate-900 dark:text-[#edf2f9]">
                        {u.spec.displayName}
                      </td>
                      <td className="py-3 px-3 font-mono text-sky-700 dark:text-sky-400">
                        {u.spec.equipmentCode}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{u.spec.category}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {u.runningHours !== null ? `${u.runningHours.toLocaleString('vi-VN')} h` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {u.loadHours !== null ? `${u.loadHours.toLocaleString('vi-VN')} h` : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                        {u.deltaLastMonthH !== null ? `+${u.deltaLastMonthH.toLocaleString('vi-VN')} h` : '—'}
                      </td>
                      <td className="py-3 px-5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                        {u.avgHoursPerMonth.toLocaleString('vi-VN')} h/th
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SmartHorizontalScroll>
          </div>

          {/* Trend Line Chart (SVG) */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-[#edf2f9] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Biểu Đồ Lũy Kế Số Giờ Chạy (14 Kỳ Gần Nhất)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Theo dõi tốc độ vận hành và cân bằng tải giữa các tổ máy
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#111927]">
                <button
                  type="button"
                  onClick={() => setChartGroup('main')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                    chartGroup === 'main'
                      ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  4 Máy Nén Khí
                </button>
                <button
                  type="button"
                  onClick={() => setChartGroup('aux')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                    chartGroup === 'aux'
                      ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  6 Máy Sấy & Nito
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {chartSeries.keys.map((key, idx) => (
                <div key={key} className="inline-flex items-center gap-1.5 font-mono font-semibold text-slate-700 dark:text-slate-200">
                  <span
                    className="w-3 h-1 rounded-full inline-block"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  />
                  {key}
                </div>
              ))}
            </div>

            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 880 260" className="w-full min-w-[620px] h-64">
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = 220 - ratio * 190;
                  const val = Math.round(chartSeries.maxVal * ratio);
                  return (
                    <g key={ratio}>
                      <line
                        x1={56}
                        y1={y}
                        x2={860}
                        y2={y}
                        className="stroke-slate-200 dark:stroke-[#243248]"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={50}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-400 text-[10px] font-mono"
                      >
                        {(val / 1000).toFixed(0)}k
                      </text>
                    </g>
                  );
                })}

                {chartSeries.keys.map((key, idx) => {
                  const pts: string[] = [];
                  const circles: Array<{ x: number; y: number; val: number; month: string }> = [];
                  const totalX = Math.max(1, chartSeries.recentLogs.length - 1);
                  chartSeries.recentLogs.forEach((log, i) => {
                    const v = log.readings[key]?.runningHours;
                    if (typeof v === 'number') {
                      const x = 66 + (i / totalX) * 784;
                      const y = 220 - (v / chartSeries.maxVal) * 190;
                      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
                      circles.push({ x, y, val: v, month: formatMonthVN(log.month) });
                    }
                  });
                  const color = CHART_COLORS[idx % CHART_COLORS.length];
                  return (
                    <g key={key}>
                      {pts.length > 1 && (
                        <polyline
                          fill="none"
                          stroke={color}
                          strokeWidth={2.2}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          points={pts.join(' ')}
                        />
                      )}
                      {circles.map((c, ci) => (
                        <circle key={ci} cx={c.x} cy={c.y} r={3} fill={color}>
                          <title>{`${key} (${c.month}): ${c.val.toLocaleString('vi-VN')} h`}</title>
                        </circle>
                      ))}
                    </g>
                  );
                })}

                {chartSeries.recentLogs.map((log, i) => {
                  const totalX = Math.max(1, chartSeries.recentLogs.length - 1);
                  const x = 66 + (i / totalX) * 784;
                  return (
                    <text
                      key={log.month}
                      x={x}
                      y={244}
                      textAnchor="middle"
                      className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
                    >
                      {formatMonthVN(log.month)}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY READING TABLE */}
      {subTab === 'monthly_table' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#141d2d] border border-slate-200/80 dark:border-[#243248]">
              <button
                type="button"
                onClick={() => setTableGroup('main')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  tableGroup === 'main'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                4 Máy Nén Khí (GA75 · VSD90)
              </button>
              <button
                type="button"
                onClick={() => setTableGroup('aux')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  tableGroup === 'aux'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                6 Máy Phụ Trợ (AD300 · NPG360 · FD220)
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenMonthlyModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Ghi Chỉ Số Tháng Mới
            </button>
          </div>

          <div className="rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248] overflow-hidden">
            <SmartHorizontalScroll>
              {tableGroup === 'main' ? (
                <table className="w-full text-left border-collapse min-w-[1160px] text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#131c2c] border-b border-slate-200 dark:border-[#243248] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Kỳ Tháng</th>
                      <th className="py-3 px-2.5 text-right">GA75-1 (h)</th>
                      <th className="py-3 px-2.5 text-right">Lọc gió / Dầu</th>
                      <th className="py-3 px-2.5 text-right">GA75-2 (h)</th>
                      <th className="py-3 px-2.5 text-right">Lọc gió / Dầu</th>
                      <th className="py-3 px-2.5 text-right">VSD90-1 (h)</th>
                      <th className="py-3 px-2.5 text-right">Lọc gió / Dầu</th>
                      <th className="py-3 px-2.5 text-right">VSD90-2 (h)</th>
                      <th className="py-3 px-2.5 text-right">Lọc dầu / Tách</th>
                      <th className="py-3 px-3">Ghi chú</th>
                      <th className="py-3 px-4 text-right">Sửa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#202d42] font-mono tabular-nums">
                    {sortedLogsDesc.map((log) => {
                      const g1 = log.readings['GA75-1'];
                      const g2 = log.readings['GA75-2'];
                      const v1 = log.readings['VSD90-1'];
                      const v2 = log.readings['VSD90-2'];
                      const colorRem = (val: number | null | undefined) =>
                        val == null
                          ? 'text-slate-400'
                          : val <= 0
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : val < compressorRuntime.warningThresholdH
                              ? 'text-amber-600 dark:text-amber-400 font-bold'
                              : 'text-slate-600 dark:text-slate-300';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1c283d]">
                          <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-[#edf2f9]">
                            {formatMonthVN(log.month)}
                          </td>
                          <td className="py-2.5 px-2.5 text-right text-slate-900 dark:text-slate-100 font-semibold">
                            {g1?.runningHours?.toLocaleString('vi-VN') ?? '—'}
                          </td>
                          <td className="py-2.5 px-2.5 text-right text-[11px]">
                            <span className={colorRem(g1?.airFilterRemainingH)}>
                              {g1?.airFilterRemainingH ?? '—'}
                            </span>
                            {' / '}
                            <span className={colorRem(g1?.oilRemainingH)}>
                              {g1?.oilRemainingH ?? '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-right text-slate-900 dark:text-slate-100 font-semibold">
                            {g2?.runningHours?.toLocaleString('vi-VN') ?? '—'}
                          </td>
                          <td className="py-2.5 px-2.5 text-right text-[11px]">
                            <span className={colorRem(g2?.airFilterRemainingH)}>
                              {g2?.airFilterRemainingH ?? '—'}
                            </span>
                            {' / '}
                            <span className={colorRem(g2?.oilRemainingH)}>
                              {g2?.oilRemainingH ?? '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-right text-slate-900 dark:text-slate-100 font-semibold">
                            {v1?.runningHours?.toLocaleString('vi-VN') ?? '—'}
                          </td>
                          <td className="py-2.5 px-2.5 text-right text-[11px]">
                            {v1?.runningHours != null ? (
                              <>
                                <span className={colorRem(v1?.airFilterRemainingH)}>
                                  {v1?.airFilterRemainingH ?? '—'}
                                </span>
                                {' / '}
                                <span className={colorRem(v1?.oilRemainingH)}>
                                  {v1?.oilRemainingH ?? '—'}
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-400 font-sans">Trống số</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 text-right text-slate-900 dark:text-slate-100 font-semibold">
                            {v2?.runningHours?.toLocaleString('vi-VN') ?? '—'}
                          </td>
                          <td className="py-2.5 px-2.5 text-right text-[11px]">
                            <span className={colorRem(v2?.oilFilterRemainingH)}>
                              {v2?.oilFilterRemainingH ?? '—'}
                            </span>
                            {' / '}
                            <span className={colorRem(v2?.oilSeparatorRemainingH)}>
                              {v2?.oilSeparatorRemainingH ?? '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                            {log.note || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right whitespace-nowrap font-sans">
                            <button
                              type="button"
                              onClick={() => handleOpenMonthlyModal(log)}
                              className="text-sky-700 dark:text-sky-400 hover:underline font-semibold mr-2"
                            >
                              Sửa
                            </button>
                            {allowDelete && (
                              <button
                                type="button"
                                onClick={() => deleteCompressorMonthlyLog(log.id)}
                                className="text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                              >
                                Xóa
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left border-collapse min-w-[920px] text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#131c2c] border-b border-slate-200 dark:border-[#243248] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Kỳ Tháng</th>
                      <th className="py-3 px-3 text-right">AD300-1 (h)</th>
                      <th className="py-3 px-3 text-right">AD300-2 (h)</th>
                      <th className="py-3 px-3 text-right">NPG360-1 (h)</th>
                      <th className="py-3 px-3 text-right">NPG360-2 (h)</th>
                      <th className="py-3 px-3 text-right">FD220-1 (h)</th>
                      <th className="py-3 px-3 text-right">FD220-2 (h)</th>
                      <th className="py-3 px-4 text-right">Sửa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#202d42] font-mono tabular-nums">
                    {sortedLogsDesc.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1c283d]">
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-[#edf2f9]">
                          {formatMonthVN(log.month)}
                        </td>
                        {['AD300-1', 'AD300-2', 'NPG360-1', 'NPG360-2', 'FD220-1', 'FD220-2'].map((k) => (
                          <td key={k} className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                            {log.readings[k]?.runningHours?.toLocaleString('vi-VN') ?? '—'}
                          </td>
                        ))}
                        <td className="py-2.5 px-4 text-right font-sans">
                          <button
                            type="button"
                            onClick={() => handleOpenMonthlyModal(log)}
                            className="text-sky-700 dark:text-sky-400 hover:underline font-semibold"
                          >
                            Sửa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SmartHorizontalScroll>
          </div>
        </div>
      )}

      {/* TAB 3: REPLACEMENT HISTORY & THRESHOLD SETTINGS */}
      {subTab === 'replacements' && (
        <div className="space-y-5">
          {/* Threshold Config Row */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248] flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 dark:text-[#edf2f9]">
                Quy tắc cảnh báo & chu kỳ chốt số
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Theo quy định nhà máy: Dầu / Lọc tách dầu 8.000h · Lọc gió 4.000h · Lọc dầu 4.000h hoặc 8.000h
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Cảnh báo vàng dưới (h):</span>
                <input
                  type="number"
                  min={200}
                  step={100}
                  value={compressorRuntime.warningThresholdH}
                  onChange={(e) =>
                    updateCompressorThresholds({ warningThresholdH: Number(e.target.value) || 2000 })
                  }
                  className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] font-mono font-semibold text-slate-900 dark:text-slate-100"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Ngày chốt hàng tháng:</span>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={compressorRuntime.readingDayOfMonth}
                  onChange={(e) =>
                    updateCompressorThresholds({ readingDayOfMonth: Number(e.target.value) || 15 })
                  }
                  className="w-16 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] font-mono font-semibold text-slate-900 dark:text-slate-100"
                />
              </label>
            </div>
          </div>

          {/* Filter & Add Replacement */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'GA75-1', 'GA75-2', 'VSD90-1', 'VSD90-2'].map((mk) => (
                <button
                  key={mk}
                  type="button"
                  onClick={() => setHistoryMachineFilter(mk)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    historyMachineFilter === mk
                      ? 'bg-sky-600 text-white'
                      : 'bg-white dark:bg-[#172133] border border-slate-200 dark:border-[#243248] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {mk === 'ALL' ? 'Tất cả 4 MNK' : mk}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleOpenReplaceModal('VSD90-2', 'oilFilter')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition"
            >
              <Wrench className="w-3.5 h-3.5" />
              Ghi Nhận Thay Vật Tư Mới
            </button>
          </div>

          {/* Replacement History Table */}
          <div className="rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248] overflow-hidden">
            <SmartHorizontalScroll>
              <table className="w-full text-left border-collapse min-w-[780px] text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#131c2c] border-b border-slate-200 dark:border-[#243248] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Ngày thay</th>
                    <th className="py-3 px-3">Máy</th>
                    <th className="py-3 px-3">Hạng mục vật tư</th>
                    <th className="py-3 px-3 text-right">Chu kỳ mới</th>
                    <th className="py-3 px-3">Mã Kho / Ghi chú</th>
                    <th className="py-3 px-3">Người thực hiện</th>
                    {allowDelete && <th className="py-3 px-4 text-right">Xóa</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#202d42]">
                  {filteredReplacementEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/70 dark:hover:bg-[#1c283d]">
                      <td className="py-2.5 px-4 font-mono tabular-nums font-semibold text-slate-900 dark:text-[#edf2f9]">
                        {formatDateVN(ev.date)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-sky-700 dark:text-sky-400">
                        {ev.machineKey}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {CONSUMABLE_META[ev.consumable]?.label || ev.consumable}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {ev.newIntervalH ? `${ev.newIntervalH.toLocaleString('vi-VN')} h` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {[ev.sparePartCode, ev.note].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {ev.performedBy || '—'}
                      </td>
                      {allowDelete && (
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => deleteCompressorReplacementEvent(ev.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500"
                            title="Xóa dòng lịch sử"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </SmartHorizontalScroll>
          </div>
        </div>
      )}

      {/* MODAL 1: MONTHLY READING ENTRY */}
      {isMonthlyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveMonthlyReading}
            className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#172133] border border-slate-200 dark:border-[#2a3952] shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#243248] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-[#edf2f9]">
                  Chốt Số Giờ Chạy Hệ Thống Máy Nén Khí
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hệ thống sẽ tự động lấy hiệu số giờ chạy mới trừ kỳ trước để cập nhật giờ còn lại của Dầu, Lọc gió, Lọc dầu và Tách dầu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMonthlyModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kỳ Tháng (YYYY-MM) *
                  </label>
                  <input
                    type="month"
                    required
                    value={monthlyFormMonth}
                    onChange={(e) => setMonthlyFormMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày ghi nhận
                  </label>
                  <input
                    type="date"
                    value={monthlyFormDate}
                    onChange={(e) => setMonthlyFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ghi chú kỳ chốt
                  </label>
                  <input
                    type="text"
                    value={monthlyFormNote}
                    onChange={(e) => setMonthlyFormNote(e.target.value)}
                    placeholder="VD: Chốt định kỳ ngày 15..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-[#243248] overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#131c2c] border-b border-slate-200 dark:border-[#243248] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-3">Thiết bị</th>
                      <th className="py-2.5 px-3 text-right">Kỳ trước (h)</th>
                      <th className="py-2.5 px-3">Giờ chạy mới (h)</th>
                      <th className="py-2.5 px-3">Giờ có tải mới (h)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#202d42]">
                    {compressorRuntime.unitSpecs.map((spec) => {
                      const prevLog =
                        sortedLogsAsc.filter((l) => l.month < monthlyFormMonth).slice(-1)[0] || null;
                      const prevRun = prevLog?.readings[spec.machineKey]?.runningHours;
                      return (
                        <tr key={spec.machineKey}>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {spec.machineKey}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {spec.category}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            {prevRun != null ? prevRun.toLocaleString('vi-VN') : '—'}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={monthlyInputs[spec.machineKey]?.runningHours || ''}
                              onChange={(e) =>
                                setMonthlyInputs((prev) => ({
                                  ...prev,
                                  [spec.machineKey]: {
                                    ...prev[spec.machineKey],
                                    runningHours: e.target.value,
                                  },
                                }))
                              }
                              placeholder={prevRun != null ? `≥ ${prevRun}` : 'Nhập giờ'}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] font-mono text-slate-900 dark:text-slate-100"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={monthlyInputs[spec.machineKey]?.loadHours || ''}
                              onChange={(e) =>
                                setMonthlyInputs((prev) => ({
                                  ...prev,
                                  [spec.machineKey]: {
                                    ...prev[spec.machineKey],
                                    loadHours: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Tùy chọn"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] font-mono text-slate-900 dark:text-slate-100"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#131c2c] border-t border-slate-200 dark:border-[#243248] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsMonthlyModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#23324b] transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition"
              >
                Lưu Chỉ Số & Cập Nhật Giờ Vật Tư
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: CONFIRM CONSUMABLE REPLACEMENT */}
      {replaceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmReplacement}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#172133] border border-slate-200 dark:border-[#2a3952] shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#243248] flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-[#edf2f9]">
                Xác Nhận Thay Thế Vật Tư MNK
              </h3>
              <button
                type="button"
                onClick={() => setReplaceModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Máy nén khí
                  </label>
                  <select
                    value={replaceModal.machineKey}
                    onChange={(e) =>
                      setReplaceModal((p) => (p ? { ...p, machineKey: e.target.value } : null))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] font-mono font-semibold text-slate-900 dark:text-slate-100"
                  >
                    {mainUnits.map((u) => (
                      <option key={u.spec.machineKey} value={u.spec.machineKey}>
                        {u.spec.machineKey} ({u.spec.equipmentCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hạng mục vật tư
                  </label>
                  <select
                    value={replaceModal.consumable}
                    onChange={(e) => {
                      const nextType = e.target.value as CompressorConsumableType;
                      setReplaceModal((p) =>
                        p
                          ? {
                              ...p,
                              consumable: nextType,
                              newIntervalH: CONSUMABLE_META[nextType].defaultIntervalH,
                            }
                          : null
                      );
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100"
                  >
                    {(Object.keys(CONSUMABLE_META) as CompressorConsumableType[]).map((k) => (
                      <option key={k} value={k}>
                        {CONSUMABLE_META[k].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày thay *
                  </label>
                  <input
                    type="date"
                    required
                    value={replaceModal.date}
                    onChange={(e) =>
                      setReplaceModal((p) => (p ? { ...p, date: e.target.value } : null))
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số giờ máy lúc thay
                  </label>
                  <input
                    type="number"
                    value={replaceModal.runningHoursAtChange}
                    onChange={(e) =>
                      setReplaceModal((p) =>
                        p ? { ...p, runningHoursAtChange: e.target.value } : null
                      )
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Đặt lại chu kỳ (h)
                  </label>
                  <input
                    type="number"
                    required
                    min={500}
                    step={500}
                    value={replaceModal.newIntervalH}
                    onChange={(e) =>
                      setReplaceModal((p) =>
                        p ? { ...p, newIntervalH: Number(e.target.value) || 4000 } : null
                      )
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] font-mono font-bold text-sky-700 dark:text-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Liên kết phụ tùng trong Kho (tùy chọn)
                  </label>
                  <select
                    value={replaceModal.sparePartCode}
                    onChange={(e) =>
                      setReplaceModal((p) =>
                        p
                          ? {
                              ...p,
                              sparePartCode: e.target.value,
                              deductStock: Boolean(e.target.value),
                            }
                          : null
                      )
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Không trừ kho phụ tùng --</option>
                    {spareParts.map((sp) => (
                      <option key={sp.maVatTu} value={sp.maVatTu}>
                        {sp.maVatTu} · {sp.tenVatTu} (Tồn: {sp.tonThucTe} {sp.donViTinh})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số lượng dùng
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={replaceModal.quantityUsed}
                    onChange={(e) =>
                      setReplaceModal((p) =>
                        p ? { ...p, quantityUsed: Math.max(1, Number(e.target.value) || 1) } : null
                      )
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú kỹ thuật (VD: Loại 4000h, 18L/32L dầu...)
                </label>
                <input
                  type="text"
                  value={replaceModal.note}
                  onChange={(e) =>
                    setReplaceModal((p) => (p ? { ...p, note: e.target.value } : null))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2 pt-1">
                {replaceModal.sparePartCode && (
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={replaceModal.deductStock}
                      onChange={(e) =>
                        setReplaceModal((p) => (p ? { ...p, deductStock: e.target.checked } : null))
                      }
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <Package className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    Tự động tạo phiếu xuất kho trừ {replaceModal.quantityUsed} đơn vị ({replaceModal.sparePartCode})
                  </label>
                )}
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={replaceModal.createMaintenanceHistory}
                    onChange={(e) =>
                      setReplaceModal((p) =>
                        p ? { ...p, createMaintenanceHistory: e.target.checked } : null
                      )
                    }
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Tự động lưu biên bản vào Lịch Sử Bảo Trì Thiết Bị
                </label>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#131c2c] border-t border-slate-200 dark:border-[#243248] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplaceModal(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#23324b] transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition"
              >
                Xác Nhận Đã Thay & Đặt Lại Mốc
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: EDIT UNIT SPEC */}
      {editingSpec && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateCompressorUnitSpec(editingSpec);
              showToast('ok', `Đã lưu định mức cho ${editingSpec.displayName}.`);
              setEditingSpec(null);
            }}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#172133] border border-slate-200 dark:border-[#2a3952] shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#243248] flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#edf2f9]">
                Định Mức Vật Tư — {editingSpec.displayName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSpec(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chu kỳ Dầu (h)
                  </label>
                  <input
                    type="number"
                    value={editingSpec.oilIntervalH}
                    onChange={(e) =>
                      setEditingSpec({ ...editingSpec, oilIntervalH: Number(e.target.value) || 8000 })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chu kỳ Lọc gió (h)
                  </label>
                  <input
                    type="number"
                    value={editingSpec.airFilterIntervalH}
                    onChange={(e) =>
                      setEditingSpec({
                        ...editingSpec,
                        airFilterIntervalH: Number(e.target.value) || 4000,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chu kỳ Lọc dầu (h)
                  </label>
                  <input
                    type="number"
                    value={editingSpec.oilFilterIntervalH}
                    onChange={(e) =>
                      setEditingSpec({
                        ...editingSpec,
                        oilFilterIntervalH: Number(e.target.value) || 8000,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chu kỳ Tách dầu (h)
                  </label>
                  <input
                    type="number"
                    value={editingSpec.oilSeparatorIntervalH}
                    onChange={(e) =>
                      setEditingSpec({
                        ...editingSpec,
                        oilSeparatorIntervalH: Number(e.target.value) || 8000,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Định mức dầu thay (Lít)
                </label>
                <input
                  type="number"
                  value={editingSpec.oilCapacityLiters || 18}
                  onChange={(e) =>
                    setEditingSpec({
                      ...editingSpec,
                      oilCapacityLiters: Number(e.target.value) || 18,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#131c2c] border-t border-slate-200 dark:border-[#243248] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSpec(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white"
              >
                Lưu Định Mức
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
