import React, { useMemo, useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { MaintenancePlan, MaintenanceHistory, Equipment, MaintenanceWorkType } from '../../types/cmms';
import { formatDateVN, formatVND, getHistoryWorkType, parseAssigneeNames } from '../../utils/cmmsLogic';
import { resolveImageUrl } from '../../utils/imageUtils';
import {
  exportMaintenanceHistoryExcel,
  exportMaintenancePlansExcel,
  exportTicketsRepairExcel,
  exportCombinedMaintenanceWorkbook,
} from '../../utils/excelExport';
import { MaintenanceExecutionModal } from '../MaintenanceExecutionModal';
import { WorkAssignmentModal } from '../common/WorkAssignmentModal';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  Wrench,
  Calendar,
  CalendarDays,
  History,
  CheckCircle2,
  Search,
  Plus,
  Download,
  FileSpreadsheet,
  Printer,
  AlertTriangle,
  Table,
  LayoutGrid,
  Edit2,
  Trash2,
  Eye,
  X,
  Sparkles,
  Mail,
  Send,
  ChevronLeft,
  ChevronRight,
  QrCode,
  User,
  GripVertical,
  RotateCcw,
  CalendarClock,
} from 'lucide-react';

interface MaintenanceTabProps {
  onOpenMaintenanceModal: (eq: Equipment) => void;
  onOpenQR: (eq: Equipment) => void;
}

const APP_TODAY = '2026-11-10';

function parseYMD(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMondayOfWeek(dateStr: string): Date {
  const dt = parseYMD(dateStr);
  const day = dt.getDay(); // 0=Sun .. 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return dt;
}

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({
  onOpenMaintenanceModal,
  onOpenQR,
}) => {
  const {
    maintenancePlans,
    maintenanceHistory,
    equipment,
    tickets,
    currentUser,
    deleteMaintenanceHistory,
    rescheduleMaintenancePlan,
    triggerMaintenanceDueAlerts,
    emailConfig,
    addAuditLog,
  } = useCMMS();

  const [activeSubTab, setActiveSubTab] = useState<'plans' | 'history' | 'calendar'>('history');
  const [historyViewMode, setHistoryViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [freqFilter, setFreqFilter] = useState<string>('ALL');
  const [resultFilter, setResultFilter] = useState<string>('ALL');
  const [workTypeFilter, setWorkTypeFilter] = useState<'ALL' | MaintenanceWorkType>('ALL');

  // Calendar states
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month');
  const [calendarRefDate, setCalendarRefDate] = useState<string>(APP_TODAY);
  const [selectedDate, setSelectedDate] = useState<string>(APP_TODAY);
  const [draggingPlanId, setDraggingPlanId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [rescheduleDrafts, setRescheduleDrafts] = useState<Record<string, string>>({});
  const [undoMove, setUndoMove] = useState<{
    planId: string;
    oldDate: string;
    newDate: string;
    label: string;
  } | null>(null);

  // Modal states & toast
  const [isCreateHistoryOpen, setIsCreateHistoryOpen] = useState(false);
  const [editingHistoryRecord, setEditingHistoryRecord] = useState<MaintenanceHistory | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<MaintenanceHistory | null>(null);
  const [planToAssign, setPlanToAssign] = useState<MaintenancePlan | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelIncludePrintLayout, setExcelIncludePrintLayout] = useState(true);
  const [excelOnlyFiltered, setExcelOnlyFiltered] = useState(true);
  const [confirmDueAlertEmail, setConfirmDueAlertEmail] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  // Filter plans
  const filteredPlans = maintenancePlans.filter((p) => {
    const matchSearch =
      p.maThietBi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tenThietBi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nguoiPhuTrach.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || p.trangThai === statusFilter;
    const matchFreq = freqFilter === 'ALL' || p.tanSuat === freqFilter;

    return matchSearch && matchStatus && matchFreq;
  });

  // Filter history
  const filteredHistory = maintenanceHistory.filter((h) => {
    const matchSearch =
      h.maThietBi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.tenThietBi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.nguoiThucHien.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.moTaCongViec.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.nguoiLapBaoCao.toLowerCase().includes(searchTerm.toLowerCase());

    const matchResult = resultFilter === 'ALL' || h.ketQua === resultFilter;
    const matchWorkType =
      workTypeFilter === 'ALL' || getHistoryWorkType(h) === workTypeFilter;

    return matchSearch && matchResult && matchWorkType;
  });

  // Calendar maps
  const plansByDate = useMemo(() => {
    const map: Record<string, MaintenancePlan[]> = {};
    filteredPlans.forEach((p) => {
      const key = p.ngayBaoTriTiepTheo;
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [filteredPlans]);

  const historyByDate = useMemo(() => {
    const map: Record<string, MaintenanceHistory[]> = {};
    maintenanceHistory.forEach((h) => {
      const key = h.ngayThucHien;
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(h);
    });
    return map;
  }, [maintenanceHistory]);

  const calendarDays = useMemo(() => {
    if (calendarMode === 'week') {
      const monday = getMondayOfWeek(calendarRefDate);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return { dateStr: formatYMD(d), dateObj: d, inCurrentMonth: true };
      });
    }

    const ref = parseYMD(calendarRefDate);
    const year = ref.getFullYear();
    const month = ref.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstDayIdx = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1; // 0=Mon..6=Sun
    const startGrid = new Date(year, month, 1 - firstDayIdx);

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startGrid);
      d.setDate(startGrid.getDate() + i);
      return {
        dateStr: formatYMD(d),
        dateObj: d,
        inCurrentMonth: d.getMonth() === month,
      };
    });
  }, [calendarMode, calendarRefDate]);

  const handleCalendarNavigate = (direction: -1 | 1) => {
    const ref = parseYMD(calendarRefDate);
    if (calendarMode === 'month') {
      ref.setMonth(ref.getMonth() + direction);
    } else {
      ref.setDate(ref.getDate() + direction * 7);
    }
    const nextStr = formatYMD(ref);
    setCalendarRefDate(nextStr);
  };

  const handleJumpToday = () => {
    setCalendarRefDate(APP_TODAY);
    setSelectedDate(APP_TODAY);
  };

  const calendarHeading = useMemo(() => {
    if (calendarMode === 'month') {
      const dt = parseYMD(calendarRefDate);
      return `Tháng ${dt.getMonth() + 1} / ${dt.getFullYear()}`;
    }
    const mon = getMondayOfWeek(calendarRefDate);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return `Tuần ${formatDateVN(formatYMD(mon))} – ${formatDateVN(formatYMD(sun))}`;
  }, [calendarMode, calendarRefDate]);

  const selectedDatePlans = plansByDate[selectedDate] || [];
  const selectedDateHistory = historyByDate[selectedDate] || [];

  const activeMonthPrefix = useMemo(() => {
    const dt = parseYMD(calendarRefDate);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  }, [calendarRefDate]);

  const monthSummary = useMemo(() => {
    const inMonthPlans = filteredPlans.filter((p) =>
      (p.ngayBaoTriTiepTheo || '').startsWith(activeMonthPrefix)
    );
    const overdueAll = filteredPlans.filter((p) => p.trangThai === 'Quá hạn');
    const dueOrUpcomingInMonth = inMonthPlans.filter(
      (p) => p.trangThai === 'Quá hạn' || p.trangThai === 'Tới hạn' || p.trangThai === 'Sắp tới'
    );
    const completedInMonth = maintenanceHistory.filter(
      (h) =>
        (h.ngayThucHien || '').startsWith(activeMonthPrefix) &&
        getHistoryWorkType(h) === 'Bảo trì theo kế hoạch'
    );
    // Queue of uncompleted tasks in viewed month + overdue backlog for drag-to-schedule
    const draggableBacklog = [
      ...overdueAll,
      ...inMonthPlans.filter((p) => p.trangThai !== 'Quá hạn'),
    ].slice(0, 24);

    return {
      totalInMonth: inMonthPlans.length,
      dueInMonth: dueOrUpcomingInMonth.length,
      overdueCount: overdueAll.length,
      completedInMonth: completedInMonth.length,
      draggableBacklog,
    };
  }, [filteredPlans, maintenanceHistory, activeMonthPrefix]);

  const handleMovePlanToDate = (planId: string, newDate: string) => {
    const plan = maintenancePlans.find((p) => p.id === planId);
    if (!plan || !newDate || plan.ngayBaoTriTiepTheo === newDate) return;
    const oldDate = plan.ngayBaoTriTiepTheo;
    rescheduleMaintenancePlan(planId, newDate);
    setSelectedDate(newDate);
    setUndoMove({
      planId,
      oldDate,
      newDate,
      label: `${plan.maThietBi} (${plan.tenThietBi})`,
    });
    showToast(`Đã dời lịch ${plan.maThietBi} từ ${formatDateVN(oldDate)} sang ${formatDateVN(newDate)}`);
  };

  const handleUndoLastMove = () => {
    if (!undoMove) return;
    rescheduleMaintenancePlan(undoMove.planId, undoMove.oldDate);
    setSelectedDate(undoMove.oldDate);
    showToast(`Đã hoàn tác lịch ${undoMove.label} về ${formatDateVN(undoMove.oldDate)}`);
    setUndoMove(null);
  };

  const handleConfirmDelete = () => {
    if (deletingRecord) {
      deleteMaintenanceHistory(deletingRecord.id);
      setDeletingRecord(null);
    }
  };

  // Export CSV for Sheet 2
  const handleExportPlansCSV = () => {
    const headers = [
      'Mã thiết bị',
      'Tên thiết bị',
      'Loại bảo trì',
      'Tần suất',
      'Ngày bảo trì gần nhất',
      'Ngày bảo trì tiếp theo',
      'Người phụ trách',
      'Trạng thái',
    ];
    const rows = filteredPlans.map((p) => [
      `"${p.maThietBi}"`,
      `"${p.tenThietBi}"`,
      `"${p.loaiBaoTri}"`,
      `"${p.tanSuat}"`,
      `"${p.ngayBaoTriGanNhat}"`,
      `"${p.ngayBaoTriTiepTheo}"`,
      `"${p.nguoiPhuTrach}"`,
      `"${p.trangThai}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ke_hoach_bao_tri_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV for Sheet 3
  const handleExportHistoryCSV = () => {
    const headers = [
      'Mã thiết bị',
      'Tên thiết bị',
      'Loại công việc',
      'Ngày thực hiện',
      'Người thực hiện',
      'Mô tả công việc',
      'Thời gian dừng máy (phút)',
      'Kết quả',
      'Ảnh trước xử lý',
      'Ảnh sau xử lý',
      'Người lập báo cáo',
    ];
    const rows = filteredHistory.map((h) => [
      `"${h.maThietBi}"`,
      `"${h.tenThietBi}"`,
      `"${getHistoryWorkType(h)}"`,
      `"${h.ngayThucHien}"`,
      `"${h.nguoiThucHien}"`,
      `"${(h.moTaCongViec || '').replace(/"/g, '""')}"`,
      `"${h.thoiGianDungMay}"`,
      `"${h.ketQua}"`,
      `"${h.anhTruocXuLy || ''}"`,
      `"${h.hinhAnh || ''}"`,
      `"${h.nguoiLapBaoCao}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lich_su_bao_tri_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildFilterSummary = () => {
    if (!excelOnlyFiltered) return 'Toàn bộ dữ liệu hệ thống';
    const parts: string[] = [];
    if (searchTerm.trim()) parts.push(`Tìm="${searchTerm.trim()}"`);
    if (statusFilter !== 'ALL') parts.push(`Trạng thái=${statusFilter}`);
    if (freqFilter !== 'ALL') parts.push(`Tần suất=${freqFilter}`);
    if (resultFilter !== 'ALL') parts.push(`Kết quả=${resultFilter}`);
    return parts.length > 0 ? parts.join(', ') : 'Toàn bộ dữ liệu đang hiển thị';
  };

  const handleRunExcelExport = (mode: 'combined' | 'history' | 'plans' | 'tickets') => {
    const targetPlans = excelOnlyFiltered ? filteredPlans : maintenancePlans;
    const targetHistory = excelOnlyFiltered ? filteredHistory : maintenanceHistory;
    const meta = {
      exportedBy: currentUser.tenNhanVien,
      includePrintLayout: excelIncludePrintLayout,
      filterNote: buildFilterSummary(),
    };

    if (mode === 'combined') {
      exportCombinedMaintenanceWorkbook({
        plans: targetPlans,
        history: targetHistory,
        tickets,
        equipment,
        meta,
      });
      addAuditLog(
        'Cập nhật',
        'Xuất Excel Bảo Trì',
        'Tổng hợp 4 sheet',
        `Xuất báo cáo Excel tổng hợp (${targetHistory.length} lịch sử, ${targetPlans.length} kế hoạch, ${tickets.length} ticket)`
      );
      showToast('Đã xuất file Excel tổng hợp (4 sheet) thành công!');
    } else if (mode === 'history') {
      exportMaintenanceHistoryExcel(targetHistory, equipment, meta);
      addAuditLog(
        'Cập nhật',
        'Xuất Excel Bảo Trì',
        'Lịch sử bảo trì & sửa chữa',
        `Xuất ${targetHistory.length} biên bản lịch sử bảo trì ra Excel (.xlsx)`
      );
      showToast(`Đã xuất ${targetHistory.length} biên bản lịch sử ra Excel (.xlsx)!`);
    } else if (mode === 'plans') {
      exportMaintenancePlansExcel(targetPlans, equipment, meta);
      addAuditLog(
        'Cập nhật',
        'Xuất Excel Bảo Trì',
        'Kế hoạch bảo trì định kỳ',
        `Xuất ${targetPlans.length} kế hoạch bảo trì ra Excel (.xlsx)`
      );
      showToast(`Đã xuất ${targetPlans.length} kế hoạch bảo trì ra Excel (.xlsx)!`);
    } else {
      exportTicketsRepairExcel(tickets, equipment, meta);
      addAuditLog(
        'Cập nhật',
        'Xuất Excel Sửa Chữa',
        'Tickets sự cố & sửa chữa',
        `Xuất ${tickets.length} phiếu sửa chữa Tickets ra Excel (.xlsx)`
      );
      showToast(`Đã xuất ${tickets.length} phiếu sửa chữa Tickets ra Excel (.xlsx)!`);
    }

    setIsExcelModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-xs font-semibold max-w-md ${
            /Chưa gửi được|Thất bại|Lỗi/i.test(toastMsg)
              ? 'bg-amber-950/95 border-amber-500/40 text-amber-100'
              : 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {/Chưa gửi được|Thất bại|Lỗi/i.test(toastMsg) ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMsg}</span>
          {undoMove && activeSubTab === 'calendar' && (
            <button
              type="button"
              onClick={handleUndoLastMove}
              className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-bold transition"
            >
              <RotateCcw className="w-3 h-3" />
              Hoàn tác
            </button>
          )}
        </div>
      )}

      {/* Header and Sub-tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {activeSubTab === 'history'
                ? UI_TEXTS.tabs.maintenance.historyBadge
                : activeSubTab === 'calendar'
                ? UI_TEXTS.tabs.maintenance.calendarBadge
                : UI_TEXTS.tabs.maintenance.plansBadge}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
            {activeSubTab === 'history'
              ? UI_TEXTS.tabs.maintenance.historyTitle
              : activeSubTab === 'calendar'
              ? UI_TEXTS.tabs.maintenance.calendarTitle
              : UI_TEXTS.tabs.maintenance.plansTitle}
          </h2>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start lg:self-auto">
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Lịch Sử ({maintenanceHistory.length})
          </button>
          <button
            onClick={() => setActiveSubTab('plans')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'plans'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Kế Hoạch ({maintenancePlans.length})
          </button>
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'calendar'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Lịch Bảo Trì
          </button>
        </div>
      </div>

      {/* Control bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeSubTab === 'history'
                  ? 'Tìm theo mã máy, tên thiết bị, người làm, mô tả công việc...'
                  : 'Tìm theo mã máy, tên thiết bị, người phụ trách...'
              }
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {activeSubTab === 'plans' || activeSubTab === 'calendar' ? (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Quá hạn">🔴 Quá hạn</option>
                <option value="Tới hạn">🟡 Tới hạn</option>
                <option value="Sắp tới">🔵 Sắp tới hạn (≤7 ngày)</option>
                <option value="Đúng hạn">🟢 Đúng hạn</option>
              </select>

              <select
                value={freqFilter}
                onChange={(e) => setFreqFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Tất cả tần suất</option>
                <option value="Daily">Daily (Hàng ngày)</option>
                <option value="Weekly">Weekly (Hàng tuần)</option>
                <option value="Monthly">Monthly (Hàng tháng)</option>
                <option value="Quarterly">Quarterly (Hàng quý)</option>
                <option value="Yearly">Yearly (Hàng năm)</option>
              </select>
            </>
          ) : (
            <>
              <select
                value={workTypeFilter}
                onChange={(e) => setWorkTypeFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Tất cả loại công việc</option>
                <option value="Bảo trì theo kế hoạch">Bảo trì theo kế hoạch</option>
                <option value="Sửa chữa">Sửa chữa thiết bị</option>
              </select>

              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Tất cả kết quả</option>
                <option value="Đạt">Đạt chuẩn</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Cần theo dõi">Cần theo dõi</option>
                <option value="Chưa đạt">Chưa đạt</option>
              </select>

              <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-800 border border-slate-700">
                <button
                  onClick={() => setHistoryViewMode('table')}
                  title="Dạng Bảng"
                  className={`p-1.5 rounded-lg transition ${
                    historyViewMode === 'table'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Table className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setHistoryViewMode('cards')}
                  title="Dạng Thẻ Chi Tiết"
                  className={`p-1.5 rounded-lg transition ${
                    historyViewMode === 'cards'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {(activeSubTab === 'plans' || activeSubTab === 'calendar') && (
            <button
              onClick={() => setConfirmDueAlertEmail(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition whitespace-nowrap"
              title="Gửi email cảnh báo thiết bị đến hạn bảo trì"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>Gửi Cảnh Báo Email</span>
            </button>
          )}

          {activeSubTab === 'history' && (
            <button
              onClick={() => setIsCreateHistoryOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi Nhận Bảo Trì Mới</span>
            </button>
          )}

          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition whitespace-nowrap"
            title="Xuất dữ liệu bảo trì & sửa chữa ra file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={activeSubTab === 'history' ? handleExportHistoryCSV : handleExportPlansCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            Xuất CSV
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Kế hoạch bảo trì */}
      {activeSubTab === 'plans' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px] px-1">
            <span className="md:hidden text-slate-500">Chế độ thẻ thu gọn</span>
            <span className="font-mono tabular-nums ml-auto">
              Hiển thị: {filteredPlans.length}/{maintenancePlans.length} kế hoạch
            </span>
          </div>

          {/* Small-screen Compact Card View */}
          <div className="md:hidden space-y-2.5">
            {filteredPlans.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                Không tìm thấy kế hoạch nào phù hợp với bộ lọc.
              </div>
            ) : (
              filteredPlans.map((plan) => {
                const eq = equipment.find((e) => e.maThietBi === plan.maThietBi);
                const assignees = parseAssigneeNames(plan.nguoiPhuTrach);
                return (
                  <div
                    key={`card-plan-${plan.id}`}
                    className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                          <span className="font-mono font-bold text-cyan-400 tabular-nums">
                            {plan.maThietBi}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-slate-300">{plan.tanSuat}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{plan.loaiBaoTri}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-100 leading-snug">
                          {plan.tenThietBi}
                        </h4>
                      </div>

                      <span
                        className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-bold ${
                          plan.trangThai === 'Quá hạn'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : plan.trangThai === 'Tới hạn'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : plan.trangThai === 'Sắp tới'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {plan.trangThai}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                      <div>
                        <span className="text-slate-500">Kế tiếp: </span>
                        <strong className="font-mono tabular-nums text-slate-100">
                          {formatDateVN(plan.ngayBaoTriTiepTheo)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Gần nhất: </span>
                        <span className="font-mono tabular-nums text-slate-300">
                          {formatDateVN(plan.ngayBaoTriGanNhat)}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 truncate">
                        <User className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="text-slate-200 font-medium truncate">
                          {assignees.length > 0 ? assignees.join(', ') : plan.nguoiPhuTrach}
                        </span>
                        {plan.nguoiGiaoViec && (
                          <span className="text-slate-500 shrink-0">
                            · Giao: {plan.nguoiGiaoViec}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setPlanToAssign(plan)}
                        className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/30 font-semibold text-xs transition whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Giao Việc
                      </button>
                      {eq ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenMaintenanceModal(eq)}
                            className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition whitespace-nowrap"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            Bảo Trì Ngay
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenQR(eq)}
                            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition"
                            title="Xem mã QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-500 text-xs italic px-2">Đã xóa máy</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <SmartHorizontalScroll>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Mã Thiết Bị</th>
                    <th className="py-3 px-4">Tên Thiết Bị</th>
                    <th className="py-3 px-4">Loại Bảo Trì</th>
                    <th className="py-3 px-4">Tần Suất</th>
                    <th className="py-3 px-4">Ngày Gần Nhất</th>
                    <th className="py-3 px-4">Ngày Kế Tiếp</th>
                    <th className="py-3 px-4">Người Phụ Trách</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredPlans.map((plan) => {
                    const eq = equipment.find((e) => e.maThietBi === plan.maThietBi);
                    return (
                      <tr key={plan.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                          {plan.maThietBi}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-100">
                          {plan.tenThietBi}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{plan.loaiBaoTri}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {plan.tanSuat}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {formatDateVN(plan.ngayBaoTriGanNhat)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-100 whitespace-nowrap">
                          {formatDateVN(plan.ngayBaoTriTiepTheo)}
                        </td>
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          <div>{plan.nguoiPhuTrach}</div>
                          {plan.nguoiGiaoViec && (
                            <div className="text-[10px] text-slate-500">Giao bởi: {plan.nguoiGiaoViec}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold ${
                              plan.trangThai === 'Quá hạn'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : plan.trangThai === 'Tới hạn'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : plan.trangThai === 'Sắp tới'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {plan.trangThai}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPlanToAssign(plan)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/30 font-semibold text-xs transition"
                              title="Giao việc & Gửi email tới người phụ trách"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Giao Việc
                            </button>
                            {eq ? (
                              <button
                                onClick={() => onOpenMaintenanceModal(eq)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                Bảo Trì Ngay
                              </button>
                            ) : (
                              <span className="text-slate-500 text-xs italic">Đã xóa máy</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPlans.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Không tìm thấy kế hoạch nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </SmartHorizontalScroll>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Lịch sử bảo trì */}
      {activeSubTab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Tổng số biên bản lịch sử:{' '}
              <strong className="text-emerald-400 font-mono tabular-nums">{filteredHistory.length}</strong> /{' '}
              <span className="font-mono tabular-nums">{maintenanceHistory.length}</span>
            </span>
            <span className="md:hidden text-[11px] text-slate-500">Chế độ thẻ thu gọn</span>
          </div>

          {historyViewMode === 'table' && (
            <div className="hidden md:block rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
              <SmartHorizontalScroll>
                <table className="w-full table-auto text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3 whitespace-nowrap w-[110px]">Mã Thiết Bị</th>
                      <th className="py-3 px-3 min-w-[155px] max-w-[210px]">Tên Thiết Bị</th>
                      <th className="py-3 px-3 whitespace-nowrap w-[108px]">Ngày Thực Hiện</th>
                      <th className="py-3 px-3 whitespace-nowrap w-[155px] min-w-[130px] max-w-[175px]">Người Thực Hiện</th>
                      <th className="py-3 px-3 min-w-[230px]">Mô Tả Công Việc</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap w-[88px]">Dừng Máy</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap w-[100px]">Kết Quả</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap w-[105px]">Ảnh Trước / Sau</th>
                      <th className="py-3 px-3 whitespace-nowrap min-w-[125px]">Người Lập Báo Cáo</th>
                      <th className="py-3 px-3 text-right whitespace-nowrap w-[84px]">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredHistory.map((item, idx) => {
                      const beforeImg = resolveImageUrl(item.anhTruocXuLy);
                      const displayImg = resolveImageUrl(item.hinhAnh);
                      const assignees = parseAssigneeNames(item.nguoiThucHien);
                      return (
                        <tr key={`${item.id}-${item.maThietBi}-${idx}`} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap align-top">
                            {item.maThietBi}
                            <span className="block font-mono text-[10px] text-slate-500 font-normal">
                              {item.id}
                            </span>
                          </td>

                          <td className="py-3 px-3 font-semibold text-slate-100 align-top max-w-[210px]">
                            {item.tenThietBi}
                          </td>

                          <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap align-top">
                            {formatDateVN(item.ngayThucHien)}
                          </td>

                          <td className="py-3 px-3 font-medium text-slate-200 align-top w-[155px] min-w-[130px] max-w-[175px]">
                            {assignees.length > 1 ? (
                              <div className="flex flex-col gap-0.5 leading-snug">
                                {assignees.map((name) => (
                                  <span key={name} className="block text-slate-200">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="leading-snug">{item.nguoiThucHien}</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-slate-300 leading-relaxed align-top min-w-[230px]">
                            <div className="mb-1 text-[11px] font-semibold">
                              <span
                                className={
                                  getHistoryWorkType(item) === 'Sửa chữa'
                                    ? 'text-amber-300'
                                    : 'text-emerald-400'
                                }
                              >
                                {getHistoryWorkType(item)}
                              </span>
                            </div>
                            <p className="line-clamp-2 hover:line-clamp-none transition-all duration-200">
                              {item.moTaCongViec}
                            </p>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap align-top">
                            <span className="font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
                              {item.thoiGianDungMay} p
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap align-top">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                item.ketQua === 'Đạt' || item.ketQua === 'Hoàn thành'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : item.ketQua === 'Cần theo dõi'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {item.ketQua}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap align-top">
                            <div className="flex items-center justify-center gap-1.5">
                              {beforeImg && (
                                <button
                                  onClick={() =>
                                    setLightboxImage({
                                      url: beforeImg,
                                      title: `[Trước bảo trì] ${item.maThietBi} - ${item.tenThietBi}`,
                                      subtitle: `${item.ngayThucHien} • ${item.nguoiThucHien}`,
                                    })
                                  }
                                  className="group relative w-10 h-9 rounded-lg overflow-hidden border border-rose-500/40 bg-slate-950 inline-block hover:border-rose-400 transition"
                                  title="Ảnh trước bảo trì"
                                >
                                  <img
                                    src={beforeImg}
                                    alt="Trước bảo trì"
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              )}
                              {displayImg ? (
                                <button
                                  onClick={() =>
                                    setLightboxImage({
                                      url: displayImg,
                                      title: `[Sau bảo trì] ${item.maThietBi} - ${item.tenThietBi}`,
                                      subtitle: `${item.ngayThucHien} • ${item.nguoiThucHien} • ${item.moTaCongViec}`,
                                    })
                                  }
                                  className="group relative w-12 h-9 rounded-lg overflow-hidden border border-emerald-500/40 bg-slate-950 inline-block hover:border-emerald-400 transition"
                                  title="Ảnh sau bảo trì"
                                >
                                  <img
                                    src={displayImg}
                                    alt={item.tenThietBi}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                    <Eye className="w-3.5 h-3.5 text-white" />
                                  </div>
                                </button>
                              ) : (
                                !beforeImg && <span className="text-slate-600 text-[11px] italic">Không có</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-400 whitespace-nowrap align-top">
                            {item.nguoiLapBaoCao}
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap align-top">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingHistoryRecord(item)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                title="Chỉnh sửa biên bản"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingRecord(item)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                                title="Xóa biên bản"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredHistory.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400">
                          Không tìm thấy biên bản lịch sử bảo trì nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </SmartHorizontalScroll>
            </div>
          )}

          {/* Compact Card View: Always shown on small screens (< md), and on desktop when 'cards' selected */}
          <div
            className={
              historyViewMode === 'table'
                ? 'md:hidden space-y-2.5'
                : 'grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4'
            }
          >
            {filteredHistory.length === 0 ? (
              <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                Không tìm thấy biên bản lịch sử bảo trì nào phù hợp với bộ lọc.
              </div>
            ) : (
              filteredHistory.map((item, idx) => {
                const beforeImg = resolveImageUrl(item.anhTruocXuLy);
                const displayImg = resolveImageUrl(item.hinhAnh);
                const assignees = parseAssigneeNames(item.nguoiThucHien);
                return (
                  <div
                    key={`card-hist-${item.id}-${item.maThietBi}-${idx}`}
                    className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 sm:p-4 space-y-2.5 hover:border-emerald-500/40 transition flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      {/* Header line: ID + Date + Result */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                            <span className="font-mono font-bold text-cyan-400 tabular-nums">
                              {item.maThietBi}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-slate-400">
                              {formatDateVN(item.ngayThucHien)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-semibold ${
                                getHistoryWorkType(item) === 'Sửa chữa'
                                  ? 'text-amber-300'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {getHistoryWorkType(item)}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100 leading-snug">
                            {item.tenThietBi}
                          </h4>
                        </div>

                        <span
                          className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.ketQua === 'Đạt' || item.ketQua === 'Hoàn thành'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : item.ketQua === 'Cần theo dõi'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {item.ketQua}
                        </span>
                      </div>

                      {/* Work summary + compact inline photo thumbnails */}
                      <div className="flex items-start justify-between gap-2.5">
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 flex-1">
                          {item.moTaCongViec}
                        </p>

                        {(beforeImg || displayImg) && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {beforeImg && (
                              <button
                                type="button"
                                onClick={() =>
                                  setLightboxImage({
                                    url: beforeImg,
                                    title: `[Trước bảo trì] ${item.maThietBi} - ${item.tenThietBi}`,
                                    subtitle: `${item.ngayThucHien} • ${item.nguoiThucHien}`,
                                  })
                                }
                                className="relative w-12 h-11 rounded-lg overflow-hidden border border-rose-500/40 bg-slate-950 hover:border-rose-400 transition"
                                title="Ảnh trước xử lý"
                              >
                                <img
                                  src={beforeImg}
                                  alt="Trước xử lý"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-rose-300 font-semibold text-center leading-tight py-0.5">
                                  Trước
                                </span>
                              </button>
                            )}
                            {displayImg && (
                              <button
                                type="button"
                                onClick={() =>
                                  setLightboxImage({
                                    url: displayImg,
                                    title: `[Sau bảo trì] ${item.maThietBi} - ${item.tenThietBi}`,
                                    subtitle: `${item.ngayThucHien} • ${item.nguoiThucHien} • ${item.moTaCongViec}`,
                                  })
                                }
                                className="relative w-12 h-11 rounded-lg overflow-hidden border border-emerald-500/40 bg-slate-950 hover:border-emerald-400 transition"
                                title="Ảnh sau xử lý"
                              >
                                <img
                                  src={displayImg}
                                  alt={item.tenThietBi}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-emerald-300 font-semibold text-center leading-tight py-0.5">
                                  Sau
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Compact Footer Meta + Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                      <div className="min-w-0 text-[11px] text-slate-400 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-slate-200 font-medium">
                            <User className="w-3 h-3 text-slate-500 shrink-0" />
                            {assignees.length > 0 ? assignees.join(', ') : item.nguoiThucHien}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-amber-400 font-semibold">
                            Dừng {item.thoiGianDungMay}p
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 truncate">
                          <span>Báo cáo: {item.nguoiLapBaoCao}</span>
                          {item.chiPhiUocTinh ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-400 font-mono tabular-nums font-semibold">
                                {formatVND(item.chiPhiUocTinh)}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingHistoryRecord(item)}
                          className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Chỉnh sửa biên bản"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRecord(item)}
                          className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                          title="Xóa biên bản"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Sub-tab 3: Interactive Drag-and-Drop Calendar View (Month / Week) */}
      {activeSubTab === 'calendar' && (
        <div className="space-y-4">
          {/* Monthly Workload Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Chưa thực hiện trong tháng</div>
                <div className="text-xl font-extrabold text-cyan-400 font-mono tabular-nums mt-0.5">
                  {monthSummary.totalInMonth}
                </div>
              </div>
              <CalendarDays className="w-5 h-5 text-cyan-400/80 shrink-0" />
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Tới hạn / Sắp tới</div>
                <div className="text-xl font-extrabold text-amber-400 font-mono tabular-nums mt-0.5">
                  {monthSummary.dueInMonth}
                </div>
              </div>
              <CalendarClock className="w-5 h-5 text-amber-400/80 shrink-0" />
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Quá hạn cần dời / xử lý</div>
                <div className="text-xl font-extrabold text-rose-400 font-mono tabular-nums mt-0.5">
                  {monthSummary.overdueCount}
                </div>
              </div>
              <AlertTriangle className="w-5 h-5 text-rose-400/80 shrink-0" />
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Đã hoàn thành trong tháng</div>
                <div className="text-xl font-extrabold text-emerald-400 font-mono tabular-nums mt-0.5">
                  {monthSummary.completedInMonth}
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400/80 shrink-0" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* Calendar Grid Column (8 cols) */}
            <div className="xl:col-span-8 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-4 shadow-xl">
              {/* Calendar Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleCalendarNavigate(-1)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    title={calendarMode === 'month' ? 'Tháng trước' : 'Tuần trước'}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-100 min-w-[160px] text-center">
                    {calendarHeading}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCalendarNavigate(1)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    title={calendarMode === 'month' ? 'Tháng sau' : 'Tuần sau'}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleJumpToday}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/35 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition whitespace-nowrap"
                  >
                    Hôm nay (10/11/2026)
                  </button>
                </div>

                {/* Month / Week Toggle */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setCalendarMode('month')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      calendarMode === 'month'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Theo Tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarMode('week')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      calendarMode === 'week'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Theo Tuần
                  </button>
                </div>
              </div>

              {/* Legend & Drag Hint */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Quá hạn
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    Tới hạn
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    Sắp tới (≤7 ngày)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    Đúng hạn
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold">
                    <GripVertical className="w-3.5 h-3.5" />
                    Kéo thẻ công việc sang ngày khác để dời lịch
                  </span>
                  {undoMove && (
                    <button
                      type="button"
                      onClick={handleUndoLastMove}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Hoàn tác
                    </button>
                  )}
                </div>
              </div>

              {/* Day of Week Header */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1">
                <div>Thứ 2</div>
                <div>Thứ 3</div>
                <div>Thứ 4</div>
                <div>Thứ 5</div>
                <div>Thứ 6</div>
                <div>Thứ 7</div>
                <div className="text-rose-400">Chủ Nhật</div>
              </div>

              {/* Calendar Drop Cells */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map(({ dateStr, dateObj, inCurrentMonth }) => {
                  const dayPlans = plansByDate[dateStr] || [];
                  const dayHist = historyByDate[dateStr] || [];
                  const isSelected = selectedDate === dateStr;
                  const isToday = dateStr === APP_TODAY;
                  const isDragTarget = dragOverDate === dateStr;

                  return (
                    <div
                      key={dateStr}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDate(dateStr)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedDate(dateStr);
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverDate !== dateStr) setDragOverDate(dateStr);
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setDragOverDate((prev) => (prev === dateStr ? null : prev));
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const droppedPlanId = e.dataTransfer.getData('text/plain') || draggingPlanId;
                        setDragOverDate(null);
                        setDraggingPlanId(null);
                        if (droppedPlanId) {
                          handleMovePlanToDate(droppedPlanId, dateStr);
                        }
                      }}
                      className={`text-left rounded-xl p-1.5 sm:p-2 border transition flex flex-col justify-between cursor-pointer select-none ${
                        calendarMode === 'week' ? 'min-h-[200px]' : 'min-h-[94px] sm:min-h-[114px]'
                      } ${
                        isDragTarget
                          ? 'bg-cyan-950/45 border-dashed border-cyan-400 ring-2 ring-cyan-400/50 scale-[1.01]'
                          : isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/40'
                          : inCurrentMonth
                          ? 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
                          : 'bg-slate-950/20 border-slate-800/50 opacity-45 hover:opacity-85'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span
                          className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded tabular-nums ${
                            isToday
                              ? 'bg-cyan-500 text-slate-950 font-extrabold'
                              : isSelected
                              ? 'text-emerald-300'
                              : 'text-slate-300'
                          }`}
                        >
                          {dateObj.getDate()}
                          {calendarMode === 'week' && `/${dateObj.getMonth() + 1}`}
                        </span>
                        {dayPlans.length > 0 && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700 tabular-nums">
                            {dayPlans.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 w-full overflow-hidden">
                        {(calendarMode === 'week' ? dayPlans : dayPlans.slice(0, 3)).map((p) => {
                          const isBeingDragged = draggingPlanId === p.id;
                          return (
                            <div
                              key={p.id}
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation();
                                e.dataTransfer.setData('text/plain', p.id);
                                e.dataTransfer.effectAllowed = 'move';
                                setDraggingPlanId(p.id);
                              }}
                              onDragEnd={() => {
                                setDraggingPlanId(null);
                                setDragOverDate(null);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(dateStr);
                              }}
                              className={`group/chip flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border cursor-grab active:cursor-grabbing transition ${
                                isBeingDragged ? 'opacity-40 scale-95' : 'hover:brightness-110'
                              } ${
                                p.trangThai === 'Quá hạn'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/35'
                                  : p.trangThai === 'Tới hạn'
                                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/35'
                                  : p.trangThai === 'Sắp tới'
                                  ? 'bg-blue-500/20 text-blue-200 border-blue-500/35'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
                              }`}
                              title={`Kéo để dời lịch: ${p.maThietBi} - ${p.tenThietBi} (${p.trangThai})`}
                            >
                              <GripVertical className="w-2.5 h-2.5 shrink-0 opacity-60 group-hover/chip:opacity-100 hidden sm:inline" />
                              <span className="truncate font-mono">{p.maThietBi}</span>
                            </div>
                          );
                        })}
                        {calendarMode === 'month' && dayPlans.length > 3 && (
                          <div className="text-[10px] font-bold text-slate-400 px-1">
                            +{dayPlans.length - 3} lịch khác
                          </div>
                        )}
                        {isDragTarget && (
                          <div className="text-[10px] font-bold text-cyan-300 px-1 truncate">
                            Thả vào {dateObj.getDate()}/{dateObj.getMonth() + 1}
                          </div>
                        )}
                        {!isDragTarget && dayPlans.length === 0 && dayHist.length > 0 && (
                          <div className="text-[10px] text-emerald-400/80 truncate px-1 font-medium">
                            ✓ {dayHist.length} đã làm
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Date Panel + Draggable Backlog Queue (4 cols) */}
            <div className="xl:col-span-4 space-y-4">
              {/* Selected Date Detail Panel */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block">
                      Chi Tiết Ngày Chọn
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-100 font-mono tabular-nums">
                      {formatDateVN(selectedDate)}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700 tabular-nums">
                    {selectedDatePlans.length} kế hoạch
                  </span>
                </div>

                {selectedDatePlans.length === 0 ? (
                  <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                    <Calendar className="w-7 h-7 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">
                      Chưa có lịch bảo trì vào ngày <strong>{formatDateVN(selectedDate)}</strong>. Kéo một thẻ công việc từ lịch hoặc danh sách chờ bên dưới thả vào ngày này để xếp lịch.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {selectedDatePlans.map((plan) => {
                      const eq = equipment.find((e) => e.maThietBi === plan.maThietBi);
                      const draftDate = rescheduleDrafts[plan.id] ?? plan.ngayBaoTriTiepTheo;
                      return (
                        <div
                          key={plan.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', plan.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggingPlanId(plan.id);
                          }}
                          onDragEnd={() => {
                            setDraggingPlanId(null);
                            setDragOverDate(null);
                          }}
                          className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 space-y-2.5 cursor-grab active:cursor-grabbing transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <GripVertical className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-mono text-xs font-bold text-cyan-400">
                                  {plan.maThietBi}
                                </span>
                                <h4 className="text-sm font-bold text-slate-100 leading-snug">
                                  {plan.tenThietBi}
                                </h4>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                plan.trangThai === 'Quá hạn'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : plan.trangThai === 'Tới hạn'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : plan.trangThai === 'Sắp tới'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {plan.trangThai}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span>Tần suất / Loại:</span>
                              <strong className="text-slate-200">
                                {plan.tanSuat} · {plan.loaiBaoTri}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Phụ trách:
                              </span>
                              <strong className="text-cyan-300 truncate">{plan.nguoiPhuTrach}</strong>
                            </div>
                          </div>

                          {/* Quick date reschedule fallback (touch/keyboard friendly) */}
                          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                            <input
                              type="date"
                              value={draftDate}
                              onChange={(e) =>
                                setRescheduleDrafts((prev) => ({
                                  ...prev,
                                  [plan.id]: e.target.value,
                                }))
                              }
                              className="flex-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            <button
                              type="button"
                              disabled={!draftDate || draftDate === plan.ngayBaoTriTiepTheo}
                              onClick={() => handleMovePlanToDate(plan.id, draftDate)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 disabled:opacity-40 disabled:cursor-not-allowed text-cyan-300 border border-cyan-500/35 text-[11px] font-bold transition whitespace-nowrap"
                            >
                              Dời ngày
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
                            {eq && (
                              <button
                                type="button"
                                onClick={() => onOpenMaintenanceModal(eq)}
                                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition whitespace-nowrap"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                Bảo Trì Ngay
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setPlanToAssign(plan)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition whitespace-nowrap"
                              title="Giao việc & Gửi email"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Giao Việc
                            </button>
                            {eq && (
                              <button
                                type="button"
                                onClick={() => onOpenQR(eq)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition"
                                title="Mã QR thiết bị"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedDateHistory.length > 0 && (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Đã Hoàn Thành Trong Ngày ({selectedDateHistory.length})
                    </span>
                    {selectedDateHistory.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 rounded-xl bg-emerald-950/25 border border-emerald-800/40 text-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-100">{h.tenThietBi}</strong>
                          <span className="font-mono text-[10px] text-emerald-400">{h.ketQua}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Thực hiện: {h.nguoiThucHien} · Dừng máy: {h.thoiGianDungMay}p
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Draggable Queue: Uncompleted tasks in month / Overdue backlog */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">
                      Việc Chưa Thực Hiện Cần Sắp Xếp ({monthSummary.draggableBacklog.length})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Kéo thả thẻ bên dưới vào một ô ngày trên lịch
                    </p>
                  </div>
                </div>

                {monthSummary.draggableBacklog.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    Không còn công việc quá hạn hay chưa thực hiện trong tháng này.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                    {monthSummary.draggableBacklog.map((plan) => (
                      <div
                        key={`queue-${plan.id}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', plan.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggingPlanId(plan.id);
                        }}
                        onDragEnd={() => {
                          setDraggingPlanId(null);
                          setDragOverDate(null);
                        }}
                        onClick={() => {
                          setSelectedDate(plan.ngayBaoTriTiepTheo);
                          setCalendarRefDate(plan.ngayBaoTriTiepTheo);
                        }}
                        className={`flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/60 border cursor-grab active:cursor-grabbing hover:border-cyan-500/40 transition ${
                          draggingPlanId === plan.id ? 'opacity-50 border-cyan-500' : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-100 truncate">
                              <span className="font-mono text-cyan-400 mr-1.5">{plan.maThietBi}</span>
                              {plan.tenThietBi}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                              {formatDateVN(plan.ngayBaoTriTiepTheo)} · {plan.nguoiPhuTrach}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            plan.trangThai === 'Quá hạn'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : plan.trangThai === 'Tới hạn'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : plan.trangThai === 'Sắp tới'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {plan.trangThai}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Create new maintenance history */}
      <MaintenanceExecutionModal
        isOpen={isCreateHistoryOpen}
        onClose={() => setIsCreateHistoryOpen(false)}
        onSuccess={() => setIsCreateHistoryOpen(false)}
      />

      {/* MODAL 2: Edit existing maintenance history */}
      <MaintenanceExecutionModal
        isOpen={Boolean(editingHistoryRecord)}
        initialRecord={editingHistoryRecord}
        onClose={() => setEditingHistoryRecord(null)}
        onSuccess={() => setEditingHistoryRecord(null)}
      />

      {/* MODAL 3: Confirm Delete Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Xác Nhận Xóa Biên Bản</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa biên bản bảo trì{' '}
              <strong className="text-cyan-400 font-mono">{deletingRecord.id}</strong> của thiết bị{' '}
              <strong className="text-white">{deletingRecord.tenThietBi}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow"
              >
                Xóa Biên Bản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Work Assignment & Email Notification */}
      {planToAssign && (
        <WorkAssignmentModal
          isOpen={Boolean(planToAssign)}
          onClose={() => setPlanToAssign(null)}
          module="KE_HOACH_BAO_TRI"
          targetId={planToAssign.id}
          targetName={`${planToAssign.maThietBi} - ${planToAssign.tenThietBi}`}
          currentAssignee={planToAssign.nguoiPhuTrach}
          currentAssigner={planToAssign.nguoiGiaoViec}
          onAssigned={showToast}
        />
      )}

      {/* MODAL 5: Image Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{lightboxImage.title}</h3>
                {lightboxImage.subtitle && (
                  <p className="text-xs text-slate-400 mt-0.5">{lightboxImage.subtitle}</p>
                )}
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[70vh] bg-slate-950">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setLightboxImage(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Export Excel (.xlsx) Archive & Print Options */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/70">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Xuất File Excel (.xlsx) — Lưu Trữ & In Ấn
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExcelModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Print & Filter options */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={excelIncludePrintLayout}
                    onChange={(e) => setExcelIncludePrintLayout(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-0"
                  />
                  <Printer className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Kèm tiêu đề báo cáo, tổng hợp số liệu & khung ký duyệt in ấn</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={excelOnlyFiltered}
                    onChange={(e) => setExcelOnlyFiltered(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-0"
                  />
                  <span>
                    Áp dụng bộ lọc đang hiển thị (
                    <strong className="text-emerald-400">{filteredHistory.length}</strong> lịch sử •{' '}
                    <strong className="text-cyan-400">{filteredPlans.length}</strong> kế hoạch)
                  </span>
                </label>
              </div>

              {/* Export Targets */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleRunExcelExport('combined')}
                  className="w-full p-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-left transition flex items-center justify-between gap-3 group"
                >
                  <div>
                    <div className="text-sm font-bold text-emerald-300 group-hover:text-emerald-200">
                      Báo Cáo Tổng Hợp Đầy Đủ (4 Sheets .xlsx)
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Gồm: Tổng hợp KPI + Lịch sử bảo trì + Kế hoạch bảo trì + Lịch sử sửa chữa Tickets
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-emerald-400 shrink-0" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRunExcelExport('history')}
                    className="p-3.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center justify-between gap-2 group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300">
                        Lịch Sử Bảo Trì & Sửa Chữa
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {(excelOnlyFiltered ? filteredHistory : maintenanceHistory).length} biên bản
                      </div>
                    </div>
                    <FileSpreadsheet className="w-4 h-4 text-cyan-400 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRunExcelExport('plans')}
                    className="p-3.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center justify-between gap-2 group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300">
                        Kế Hoạch Bảo Trì Định Kỳ
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {(excelOnlyFiltered ? filteredPlans : maintenancePlans).length} kế hoạch
                      </div>
                    </div>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleRunExcelExport('tickets')}
                  className="w-full p-3.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center justify-between gap-2 group"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300">
                      Lịch Sử Sửa Chữa Sự Cố (Tickets)
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {tickets.length} phiếu yêu cầu sửa chữa & kết quả xử lý
                    </div>
                  </div>
                  <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDueAlertEmail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Xác Nhận Gửi Cảnh Báo Bảo Trì</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hệ thống sẽ tổng hợp các thiết bị quá hạn/tới hạn bảo trì và gửi email thông báo tới{' '}
              <strong className="text-cyan-300">{emailConfig.primaryRecipient}</strong>.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDueAlertEmail(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmDueAlertEmail(false);
                  const res = await triggerMaintenanceDueAlerts({ userConfirmed: true });
                  if (res.sentCount > 0) {
                    showToast(
                      res.result?.success
                        ? `Đã tự động gửi email cảnh báo ${res.dueCount} thiết bị đến hạn tới: ${emailConfig.primaryRecipient}`
                        : `Chưa gửi được email cảnh báo: ${res.result?.message || 'Chưa kết nối kênh gửi email'}`
                    );
                  } else {
                    showToast('Hiện tại không có thiết bị nào quá hạn hoặc tới hạn bảo trì.');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow"
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
