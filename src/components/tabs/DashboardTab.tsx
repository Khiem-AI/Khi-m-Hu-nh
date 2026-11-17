import React, { useMemo, useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { MaintenanceD3Summary } from '../dashboard/MaintenanceD3Summary';
import { canViewCosts, formatVND, formatDateVN, getHistoryWorkType, matchesAssignee } from '../../utils/cmmsLogic';
import {
  Cpu,
  Wrench,
  AlertTriangle,
  Package,
  Zap,
  DollarSign,
  QrCode,
  Plus,
  Clock,
  ArrowRight,
  Activity,
  Gauge,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ClipboardCheck,
  User,
  Download,
} from 'lucide-react';
import { Equipment, MaintenancePlan, TicketStatus } from '../../types/cmms';

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

function addDaysYMD(dateStr: string, days: number): string {
  const dt = parseYMD(dateStr);
  dt.setDate(dt.getDate() + days);
  return formatYMD(dt);
}

const END_30D = addDaysYMD(APP_TODAY, 30);

const STATUS_BADGE_MAP: Record<
  MaintenancePlan['trangThai'],
  { pill: string; badge: string; dot: string }
> = {
  'Quá hạn': {
    pill: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
    badge: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    dot: 'bg-rose-400',
  },
  'Tới hạn': {
    pill: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    dot: 'bg-amber-400',
  },
  'Sắp tới': {
    pill: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
    badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    dot: 'bg-cyan-400',
  },
  'Đúng hạn': {
    pill: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
};

const WEEKDAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

interface DashboardTabProps {
  onOpenScanner: () => void;
  onOpenQR: (eq: Equipment) => void;
  onOpenMaintenanceModal: (eq: Equipment) => void;
  onOpenTicketModal: () => void;
  onOpenStockModal: () => void;
  onOpenMeterModal: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  onOpenScanner,
  onOpenQR,
  onOpenMaintenanceModal,
  onOpenTicketModal,
  onOpenStockModal,
  onOpenMeterModal,
  onNavigateTab,
}) => {
  const {
    currentUser,
    equipment,
    maintenancePlans,
    maintenanceHistory,
    tickets,
    spareParts,
    power10Days,
    costRecords,
    auditLogs,
  } = useCMMS();
  const showCosts = canViewCosts(currentUser);

  // Metrics calculation
  const totalEquipment = equipment.length;
  const activeEquipment = equipment.filter((e) => e.trangThai === 'Hoạt động').length;
  const repairingEquipment = equipment.filter(
    (e) => e.trangThai === 'Đang sửa chữa' || e.trangThai === 'Bảo trì'
  ).length;

  const overduePlans = maintenancePlans.filter((p) => p.trangThai === 'Quá hạn');
  const dueTodayPlans = maintenancePlans.filter((p) => p.trangThai === 'Tới hạn');
  const upcomingPlans = maintenancePlans.filter((p) => p.trangThai === 'Sắp tới');

  const pendingTickets = tickets.filter(
    (t) => t.trangThai === 'Mới tiếp nhận' || t.trangThai === 'Đang xử lý'
  );
  const urgentTickets = pendingTickets.filter((t) => t.mucDoUuTien === 'Khẩn cấp');

  const lowStockParts = spareParts.filter((p) => p.tonThucTe <= p.tonToiThieu);

  // Power metrics
  const latestPower = power10Days[power10Days.length - 1];
  const totalSolar = latestPower ? latestPower.solarBT + latestPower.solarCD : 0;
  const totalEVN = latestPower
    ? latestPower.evnBT + latestPower.evnCD + latestPower.evnTD
    : 0;
  const solarRatio = totalEVN + totalSolar > 0 ? (totalSolar / (totalEVN + totalSolar)) * 100 : 0;

  // Cost metrics
  const totalCost = costRecords.reduce((acc, c) => acc + c.soTienVND, 0);

  // 30-Day Preventive Maintenance Calendar state
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>({
    year: 2026,
    month: 10, // November 2026 (0-indexed)
  });
  const [selectedDate, setSelectedDate] = useState<string>(APP_TODAY);

  const plansByDate = useMemo(() => {
    const map: Record<string, MaintenancePlan[]> = {};
    maintenancePlans.forEach((plan) => {
      const d = plan.ngayBaoTriTiepTheo;
      if (!d) return;
      if (!map[d]) map[d] = [];
      map[d].push(plan);
    });
    return map;
  }, [maintenancePlans]);

  const next30DaysPlans = useMemo(
    () =>
      maintenancePlans
        .filter((p) => p.ngayBaoTriTiepTheo >= APP_TODAY && p.ngayBaoTriTiepTheo <= END_30D)
        .sort((a, b) => a.ngayBaoTriTiepTheo.localeCompare(b.ngayBaoTriTiepTheo)),
    [maintenancePlans]
  );

  const monthCells = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstOfMonth = new Date(year, month, 1);
    const startWeekdayMon0 = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - startWeekdayMon0);
    return Array.from({ length: 42 }, (_, idx) => {
      const dt = new Date(gridStart);
      dt.setDate(gridStart.getDate() + idx);
      const ymd = formatYMD(dt);
      const inCurrentMonth = dt.getMonth() === month;
      const inNext30Window = ymd >= APP_TODAY && ymd <= END_30D;
      const plans = plansByDate[ymd] || [];
      return {
        dt,
        ymd,
        dayNumber: dt.getDate(),
        inCurrentMonth,
        inNext30Window,
        isToday: ymd === APP_TODAY,
        plans,
      };
    });
  }, [calendarMonth, plansByDate]);

  const selectedDayPlans = plansByDate[selectedDate] || [];

  const handleShiftMonth = (delta: number) => {
    setCalendarMonth((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const monthTitle = `Tháng ${String(calendarMonth.month + 1).padStart(2, '0')}/${calendarMonth.year}`;

  const myAssignedPlans = useMemo(
    () =>
      maintenancePlans.filter(
        (p) =>
          matchesAssignee(p.nguoiPhuTrach, currentUser) &&
          (p.trangThai === 'Quá hạn' || p.trangThai === 'Tới hạn' || p.trangThai === 'Sắp tới')
      ),
    [maintenancePlans, currentUser]
  );

  const myAssignedTickets = useMemo(
    () =>
      tickets.filter(
        (t) =>
          matchesAssignee(t.nguoiPhuTrach, currentUser) &&
          t.trangThai !== 'Hoàn thành' &&
          t.trangThai !== 'Hủy'
      ),
    [tickets, currentUser]
  );

  const myTotalAssignedCount = useMemo(
    () =>
      maintenancePlans.filter((p) => matchesAssignee(p.nguoiPhuTrach, currentUser)).length +
      tickets.filter((t) => matchesAssignee(t.nguoiPhuTrach, currentUser)).length,
    [maintenancePlans, tickets, currentUser]
  );

  const handleDownloadMonthlyCSV = () => {
    const monthStr = String(calendarMonth.month + 1).padStart(2, '0');
    const targetYearMonth = `${calendarMonth.year}-${monthStr}`;
    const targetMonthDisplay = `${monthStr}/${calendarMonth.year}`;

    const escapeCsvCell = (value: string | number | null | undefined): string => {
      const str = String(value ?? '');
      if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rowToCsv = (cells: Array<string | number | null | undefined>): string =>
      cells.map(escapeCsvCell).join(',');

    // Monthly Maintenance Plans (scheduled in target month)
    const monthlyPlans = maintenancePlans
      .filter((p) => (p.ngayBaoTriTiepTheo || '').startsWith(targetYearMonth))
      .sort((a, b) => a.ngayBaoTriTiepTheo.localeCompare(b.ngayBaoTriTiepTheo));

    const planStatusOrder: MaintenancePlan['trangThai'][] = [
      'Quá hạn',
      'Tới hạn',
      'Sắp tới',
      'Đúng hạn',
    ];

    // Monthly Executed Maintenance History
    const monthlyHistory = maintenanceHistory
      .filter((h) => (h.ngayThucHien || '').startsWith(targetYearMonth))
      .sort((a, b) => a.ngayThucHien.localeCompare(b.ngayThucHien));

    const monthlyPmCount = monthlyHistory.filter(
      (h) => getHistoryWorkType(h) === 'Bảo trì theo kế hoạch'
    ).length;
    const monthlyRepairCount = monthlyHistory.filter(
      (h) => getHistoryWorkType(h) === 'Sửa chữa'
    ).length;
    const monthlyPassCount = monthlyHistory.filter(
      (h) => h.ketQua === 'Đạt' || h.ketQua === 'Hoàn thành'
    ).length;
    const monthlyFollowUpCount = monthlyHistory.filter(
      (h) => h.ketQua === 'Cần theo dõi' || h.ketQua === 'Chưa đạt'
    ).length;
    const monthlyDowntimeMinutes = monthlyHistory.reduce(
      (sum, h) => sum + (Number(h.thoiGianDungMay) || 0),
      0
    );

    // Monthly Tickets (created or completed in target month)
    const monthlyTickets = tickets
      .filter(
        (t) =>
          (t.ngayTao || '').startsWith(targetYearMonth) ||
          (t.ngayHoanThanh || '').startsWith(targetYearMonth)
      )
      .sort((a, b) => a.ngayTao.localeCompare(b.ngayTao));

    const ticketStatusOrder: TicketStatus[] = [
      'Mới tiếp nhận',
      'Chờ xử lý',
      'Đang thực hiện',
      'Đang xử lý',
      'Hoàn thành',
      'Hủy',
    ];

    const lines: string[] = [];
    lines.push(
      rowToCsv([
        `BÁO CÁO TỔNG HỢP CÔNG VIỆC BẢO TRÌ & TRẠNG THÁI TICKET - THÁNG ${targetMonthDisplay}`,
      ])
    );
    lines.push(
      rowToCsv([
        'Tháng báo cáo',
        targetMonthDisplay,
        'Ngày xuất',
        formatDateVN(formatYMD(new Date())),
        'Người xuất',
        currentUser.tenNhanVien,
      ])
    );
    lines.push('');

    // Section 1: Maintenance Summary
    lines.push(rowToCsv([`1. TỔNG HỢP CÔNG VIỆC BẢO TRÌ (THÁNG ${targetMonthDisplay})`]));
    lines.push(rowToCsv(['Hạng mục', `Trong tháng ${targetMonthDisplay}`, 'Toàn hệ thống hiện tại']));
    lines.push(rowToCsv(['Tổng kế hoạch bảo trì đến lịch', monthlyPlans.length, maintenancePlans.length]));
    planStatusOrder.forEach((status) => {
      lines.push(
        rowToCsv([
          `Kế hoạch - ${status}`,
          monthlyPlans.filter((p) => p.trangThai === status).length,
          maintenancePlans.filter((p) => p.trangThai === status).length,
        ])
      );
    });
    lines.push(rowToCsv(['Công việc bảo trì đã thực hiện (Tổng lượt)', monthlyHistory.length, maintenanceHistory.length]));
    lines.push(rowToCsv(['- Bảo trì theo kế hoạch (PM)', monthlyPmCount, maintenanceHistory.filter((h) => getHistoryWorkType(h) === 'Bảo trì theo kế hoạch').length]));
    lines.push(rowToCsv(['- Sửa chữa khắc phục (CM)', monthlyRepairCount, maintenanceHistory.filter((h) => getHistoryWorkType(h) === 'Sửa chữa').length]));
    lines.push(rowToCsv(['- Kết quả Đạt / Hoàn thành', monthlyPassCount, maintenanceHistory.filter((h) => h.ketQua === 'Đạt' || h.ketQua === 'Hoàn thành').length]));
    lines.push(rowToCsv(['- Kết quả Cần theo dõi / Chưa đạt', monthlyFollowUpCount, maintenanceHistory.filter((h) => h.ketQua === 'Cần theo dõi' || h.ketQua === 'Chưa đạt').length]));
    lines.push(
      rowToCsv([
        '- Tổng thời gian dừng máy (Phút)',
        monthlyDowntimeMinutes,
        maintenanceHistory.reduce((sum, h) => sum + (Number(h.thoiGianDungMay) || 0), 0),
      ])
    );
    lines.push('');

    // Section 2: Ticket Status Summary
    lines.push(rowToCsv([`2. TỔNG HỢP TRẠNG THÁI TICKET (THÁNG ${targetMonthDisplay})`]));
    lines.push(rowToCsv(['Trạng thái / Mức độ ưu tiên', `Trong tháng ${targetMonthDisplay}`, 'Toàn hệ thống hiện tại']));
    lines.push(rowToCsv(['Tổng số Ticket', monthlyTickets.length, tickets.length]));
    ticketStatusOrder.forEach((status) => {
      lines.push(
        rowToCsv([
          `Trạng thái - ${status}`,
          monthlyTickets.filter((t) => t.trangThai === status).length,
          tickets.filter((t) => t.trangThai === status).length,
        ])
      );
    });
    lines.push(
      rowToCsv([
        'Ticket Khẩn cấp',
        monthlyTickets.filter((t) => t.mucDoUuTien === 'Khẩn cấp').length,
        tickets.filter((t) => t.mucDoUuTien === 'Khẩn cấp').length,
      ])
    );
    lines.push('');

    // Section 3: Detailed Monthly Maintenance Plans
    lines.push(rowToCsv([`3. CHI TIẾT KẾ HOẠCH BẢO TRÌ TRONG THÁNG ${targetMonthDisplay} (${monthlyPlans.length} mục)`]));
    lines.push(
      rowToCsv([
        'Mã Kế Hoạch',
        'Mã Thiết Bị',
        'Tên Thiết Bị',
        'Loại Bảo Trì',
        'Tần Suất',
        'Ngày Bảo Trì Tiếp Theo',
        'Trạng Thái',
        'Người Phụ Trách',
      ])
    );
    monthlyPlans.forEach((p) => {
      lines.push(
        rowToCsv([
          p.id,
          p.maThietBi,
          p.tenThietBi,
          p.loaiBaoTri,
          p.tanSuat,
          p.ngayBaoTriTiepTheo,
          p.trangThai,
          p.nguoiPhuTrach,
        ])
      );
    });
    lines.push('');

    // Section 4: Detailed Monthly Maintenance History
    lines.push(rowToCsv([`4. CHI TIẾT CÔNG VIỆC BẢO TRÌ ĐÃ THỰC HIỆN TRONG THÁNG ${targetMonthDisplay} (${monthlyHistory.length} mục)`]));
    lines.push(
      rowToCsv([
        'Mã Lịch Sử',
        'Mã Thiết Bị',
        'Tên Thiết Bị',
        'Loại Công Việc',
        'Ngày Thực Hiện',
        'Người Thực Hiện',
        'Thời Gian Dừng Máy (Phút)',
        'Kết Quả',
        'Mô Tả Công Việc',
      ])
    );
    monthlyHistory.forEach((h) => {
      lines.push(
        rowToCsv([
          h.id,
          h.maThietBi,
          h.tenThietBi,
          getHistoryWorkType(h),
          h.ngayThucHien,
          h.nguoiThucHien,
          h.thoiGianDungMay,
          h.ketQua,
          h.moTaCongViec,
        ])
      );
    });
    lines.push('');

    // Section 5: Detailed Monthly Tickets
    lines.push(rowToCsv([`5. CHI TIẾT TICKET TRONG THÁNG ${targetMonthDisplay} (${monthlyTickets.length} mục)`]));
    lines.push(
      rowToCsv([
        'Mã Ticket',
        'Tiêu Đề',
        'Mã Thiết Bị',
        'Mức Độ Ưu Tiên',
        'Trạng Thái',
        'Ngày Tạo',
        'Ngày Hoàn Thành',
        'Người Phụ Trách',
        'Người Lập',
      ])
    );
    monthlyTickets.forEach((t) => {
      lines.push(
        rowToCsv([
          t.maTicket,
          t.tieuDe,
          t.maThietBi || '',
          t.mucDoUuTien,
          t.trangThai,
          t.ngayTao,
          t.ngayHoanThanh || '',
          t.nguoiPhuTrach,
          t.nguoiLap,
        ])
      );
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dashboard_BaoTri_Ticket_Thang_${monthStr}_${calendarMonth.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero with Quick Actions */}
      <div className="hero-dark-banner relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/80 p-6 shadow-xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-balance">
              {UI_TEXTS.dashboard.heroTitle}
            </h2>
            {UI_TEXTS.dashboard.heroDescription && (
              <p className="text-sm text-slate-300 leading-relaxed">
                {UI_TEXTS.dashboard.heroDescription}
              </p>
            )}
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenScanner}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-cyan-900/30 transition border border-cyan-400/40 whitespace-nowrap"
            >
              <QrCode className="w-4 h-4" />
              Quét Mã QR Máy
            </button>
            <button
              onClick={onOpenTicketModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-amber-900/30 transition border border-amber-400/40 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Tạo Ticket
            </button>
            <button
              onClick={onOpenStockModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition border border-emerald-400/40 whitespace-nowrap"
            >
              <Package className="w-4 h-4" />
              Xuất / Nhập Kho
            </button>
            <button
              onClick={onOpenMeterModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-900/30 transition border border-blue-400/40 whitespace-nowrap"
            >
              <Gauge className="w-4 h-4" />
              Chốt Đồng Hồ
            </button>
            <button
              type="button"
              onClick={handleDownloadMonthlyCSV}
              title={`Tải xuống báo cáo CSV tổng hợp bảo trì & ticket tháng ${String(calendarMonth.month + 1).padStart(2, '0')}/${calendarMonth.year}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-900/30 transition border border-indigo-400/40 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>
        </div>
      </div>

      {/* Personalized Assigned Work Banner for Logged-In User */}
      <div className="rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-4 sm:p-5 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-100">
                  Công Việc Được Giao Cho: <span className="text-cyan-400">{currentUser.tenNhanVien}</span>
                </h3>
                <span className="font-mono text-[11px] font-semibold text-slate-400">
                  · {currentUser.maNhanVien}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {myAssignedPlans.length + myAssignedTickets.length > 0 ? (
                  <>
                    Bạn có{' '}
                    <strong className="text-emerald-400 tabular-nums">{myAssignedPlans.length}</strong> lịch bảo trì cần thực hiện &{' '}
                    <strong className="text-amber-400 tabular-nums">{myAssignedTickets.length}</strong> tickets đang xử lý (Tổng cộng{' '}
                    {myTotalAssignedCount} đầu việc được giao).
                  </>
                ) : (
                  <>Hiện chưa có công việc tồn đọng nào cần xử lý gấp ({myTotalAssignedCount} đầu việc được giao).</>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('my_tasks')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition self-start sm:self-auto shrink-0 whitespace-nowrap"
          >
            <span>Xem Việc Được Giao</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {(myAssignedPlans.length > 0 || myAssignedTickets.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            {myAssignedTickets.slice(0, 2).map((t) => (
              <div
                key={t.maTicket}
                onClick={() => onNavigateTab('my_tasks')}
                className="cursor-pointer p-3 rounded-xl bg-slate-950/60 border border-amber-500/30 hover:border-amber-400/60 transition flex items-start justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-amber-400">{t.maTicket}</span>
                    <span className="text-[10px] font-semibold text-amber-300">
                      · {t.mucDoUuTien}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-100 truncate mt-0.5">{t.tieuDe}</div>
                </div>
                <span className="text-[11px] font-medium text-slate-400 shrink-0">{t.trangThai}</span>
              </div>
            ))}

            {myAssignedPlans.slice(0, Math.max(1, 3 - Math.min(2, myAssignedTickets.length))).map((p) => {
              const eq = equipment.find((e) => e.maThietBi === p.maThietBi);
              return (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-cyan-400">{p.maThietBi}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          p.trangThai === 'Quá hạn'
                            ? 'text-rose-400'
                            : 'text-amber-300'
                        }`}
                      >
                        · {p.trangThai}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-100 truncate mt-0.5">{p.tenThietBi}</div>
                  </div>
                  {eq && (
                    <button
                      type="button"
                      onClick={() => onOpenMaintenanceModal(eq)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shrink-0 transition"
                    >
                      Làm ngay
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Thiết bị */}
        <div
          onClick={() => onNavigateTab('equipment')}
          className="group cursor-pointer rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 p-4 sm:p-5 transition shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tổng Thiết Bị</span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition">
              <Cpu className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tabular-nums">
              {totalEquipment}
            </span>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400 tabular-nums">{activeEquipment} chạy</span>
              {repairingEquipment > 0 && (
                <span className="text-xs font-bold text-amber-400 block tabular-nums">
                  {repairingEquipment} sửa chữa
                </span>
              )}
            </div>
          </div>
          <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800">
            <span>Sheet Danh_sach_thiet_bi</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Card 2: Bảo trì */}
        <div
          onClick={() => onNavigateTab('maintenance')}
          className="group cursor-pointer rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 sm:p-5 transition shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Kế Hoạch Bảo Trì</span>
            <span
              className={`p-2 rounded-xl transition group-hover:scale-110 ${
                overduePlans.length > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tabular-nums">
              {maintenancePlans.length}
            </span>
            <div className="text-right">
              {overduePlans.length > 0 && (
                <span className="text-xs font-bold text-rose-400 block tabular-nums">
                  {overduePlans.length} quá hạn!
                </span>
              )}
              <span className="text-xs font-medium text-amber-300 tabular-nums">
                {dueTodayPlans.length + upcomingPlans.length} sắp tới hạn
              </span>
            </div>
          </div>
          <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800">
            <span>Tự động tính ngày tiếp theo</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Card 3: Tickets */}
        <div
          onClick={() => onNavigateTab('tickets')}
          className="group cursor-pointer rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 p-4 sm:p-5 transition shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tickets Sự Cố</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tabular-nums">
              {pendingTickets.length}
            </span>
            <div className="text-right">
              {urgentTickets.length > 0 && (
                <span className="text-xs font-bold text-rose-400 block tabular-nums">
                  {urgentTickets.length} khẩn cấp
                </span>
              )}
              <span className="text-xs text-slate-400">Đang chờ xử lý</span>
            </div>
          </div>
          <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800">
            <span>Liên kết các bộ phận</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Card 4: Kho phụ tùng */}
        <div
          onClick={() => onNavigateTab('spare_parts')}
          className="group cursor-pointer rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 p-4 sm:p-5 transition shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Kho Phụ Tùng</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tabular-nums">
              {spareParts.length}
            </span>
            <div className="text-right">
              {lowStockParts.length > 0 ? (
                <span className="text-xs font-bold text-rose-400 block tabular-nums">
                  {lowStockParts.length} dưới mức min!
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-400">Đầy đủ tồn an toàn</span>
              )}
            </div>
          </div>
          <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800">
            <span>Tự trừ/cộng khi xuất nhập</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* Energy & Cost Quick Highlights */}
      <div className={showCosts ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'grid grid-cols-1 gap-4'}>
        {/* Power Card */}
        <div
          onClick={() => onNavigateTab('energy')}
          className="cursor-pointer rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 p-5 transition space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <Zap className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Điện Năng 10 Ngày (EVN & Solar)</h4>
                <p className="text-xs text-slate-400">{latestPower?.chuKy || 'Chu kỳ gần nhất'}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-400 bg-blue-950/60 border border-blue-800 px-2.5 py-1 rounded-lg">
              {solarRatio.toFixed(1)}% Solar
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">TB Ngày (kWh)</span>
              <span className="font-mono font-bold text-base text-slate-100">
                {latestPower?.tbNgayKwh.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Lưới EVN (kWh)</span>
              <span className="font-mono font-bold text-base text-cyan-300">
                {totalEVN.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Mái Solar (kWh)</span>
              <span className="font-mono font-bold text-base text-amber-300">
                {totalSolar.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Cost Card */}
        {showCosts && (
          <div
            onClick={() => onNavigateTab('costs')}
            className="cursor-pointer rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-5 transition space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Chi Phí Bảo Trì & Mua Sắm</h4>
                  <p className="text-xs text-slate-400">{costRecords.length} giao dịch ghi nhận</p>
                </div>
              </div>
              <span className="font-mono font-extrabold text-emerald-400 text-lg">
                {formatVND(totalCost)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Định Kỳ</span>
                <span className="font-mono font-bold text-xs text-slate-200">
                  {formatVND(
                    costRecords
                      .filter((c) => c.phanLoai === 'Bảo trì định kỳ')
                      .reduce((a, b) => a + b.soTienVND, 0)
                  )}
                </span>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Đột Xuất</span>
                <span className="font-mono font-bold text-xs text-amber-300">
                  {formatVND(
                    costRecords
                      .filter((c) => c.phanLoai === 'Sửa chữa đột xuất')
                      .reduce((a, b) => a + b.soTienVND, 0)
                  )}
                </span>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Mua Phụ Tùng</span>
                <span className="font-mono font-bold text-xs text-cyan-300">
                  {formatVND(
                    costRecords
                      .filter((c) => c.phanLoai === 'Mua vật tư thay thế')
                      .reduce((a, b) => a + b.soTienVND, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Summary View: Overdue & Critical Upcoming Schedules (D3) */}
      <MaintenanceD3Summary
        onOpenMaintenanceModal={onOpenMaintenanceModal}
        onNavigateTab={onNavigateTab}
      />

      {/* 30-Day Preventive Maintenance Monthly Calendar */}
      <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <CalendarDays className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-100 text-base">
                {UI_TEXTS.dashboard.calendarTitle} ({formatDateVN(APP_TODAY)} → {formatDateVN(END_30D)})
              </h3>
            </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold font-mono">
              30 ngày tới: {next30DaysPlans.length} hạng mục
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-bold font-mono">
              Quá hạn: {overduePlans.length}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold font-mono">
              Tới hạn hôm nay: {dueTodayPlans.length}
            </span>
          </div>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleShiftMonth(-1)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 font-bold text-sm text-slate-100 min-w-[140px] text-center">
              {monthTitle}
            </div>
            <button
              type="button"
              onClick={() => handleShiftMonth(1)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setCalendarMonth({ year: 2026, month: 10 });
                setSelectedDate(APP_TODAY);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold border transition ${
                calendarMonth.year === 2026 && calendarMonth.month === 10
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Tháng 11/2026
            </button>
            <button
              type="button"
              onClick={() => {
                setCalendarMonth({ year: 2026, month: 11 });
                setSelectedDate('2026-12-01');
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold border transition ${
                calendarMonth.year === 2026 && calendarMonth.month === 11
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Tháng 12/2026
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('maintenance')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-semibold transition"
            >
              Mở Lịch Bảo Trì Đầy Đủ
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid + Selected Day Details */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Monthly Grid */}
          <div className="xl:col-span-8 space-y-2">
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {WEEKDAY_HEADERS.map((day) => (
                <div key={day} className="py-1.5 rounded-lg bg-slate-800/50 border border-slate-800">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {monthCells.map((cell) => {
                const isSelected = cell.ymd === selectedDate;
                return (
                  <button
                    key={cell.ymd}
                    type="button"
                    onClick={() => setSelectedDate(cell.ymd)}
                    className={`min-h-[82px] sm:min-h-[92px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500 ring-2 ring-cyan-500/40'
                        : cell.isToday
                        ? 'bg-emerald-950/30 border-emerald-500/60 hover:border-emerald-400'
                        : cell.inNext30Window && cell.inCurrentMonth
                        ? 'bg-slate-900 border-slate-700/80 hover:border-cyan-500/50'
                        : cell.inCurrentMonth
                        ? 'bg-slate-950/50 border-slate-800/70 opacity-75 hover:opacity-100'
                        : 'bg-slate-950/30 border-slate-800/40 opacity-45 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span
                        className={`font-mono text-xs font-bold ${
                          cell.isToday
                            ? 'text-emerald-400'
                            : isSelected
                            ? 'text-cyan-300'
                            : 'text-slate-200'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {cell.isToday && (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                          Nay
                        </span>
                      )}
                      {!cell.isToday && cell.plans.length > 0 && (
                        <span className="font-mono text-[10px] font-bold px-1.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                          {cell.plans.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 w-full mt-1">
                      {cell.plans.slice(0, 2).map((p) => {
                        const sty = STATUS_BADGE_MAP[p.trangThai];
                        return (
                          <div
                            key={p.id}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold truncate ${sty.pill}`}
                            title={`${p.maThietBi} — ${p.tenThietBi}`}
                          >
                            {p.maThietBi}
                          </div>
                        );
                      })}
                      {cell.plans.length > 2 && (
                        <div className="text-[9px] text-slate-400 font-semibold pl-0.5">
                          +{cell.plans.length - 2} máy khác
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Quá hạn
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Tới hạn
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Sắp tới
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Đúng hạn
              </span>
            </div>
          </div>

          {/* Right Panel: Selected Date Details + Upcoming 30-Day List */}
          <div className="xl:col-span-4 rounded-2xl bg-slate-950/60 border border-slate-800 p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                    Chi Tiết Ngày {formatDateVN(selectedDate)}
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">
                    {selectedDayPlans.length} Hạng Mục Bảo Trì Theo Lịch
                  </h4>
                </div>
                {selectedDate === APP_TODAY && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    Hôm Nay
                  </span>
                )}
              </div>

              {selectedDayPlans.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto opacity-80" />
                  <p className="text-xs font-semibold text-slate-300">
                    Không có lịch bảo trì định kỳ vào ngày này.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {selectedDayPlans.map((plan) => {
                    const eq = equipment.find((e) => e.maThietBi === plan.maThietBi);
                    const sty = STATUS_BADGE_MAP[plan.trangThai];
                    return (
                      <div
                        key={plan.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400">
                            {plan.maThietBi}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sty.badge}`}>
                            {plan.trangThai}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-100">{plan.tenThietBi}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{plan.nguoiPhuTrach}</span>
                        </div>
                        {eq && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => onOpenMaintenanceModal(eq)}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition"
                            >
                              <Wrench className="w-3 h-3" />
                              Bảo Trì
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenQR(eq)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                              title="Mã QR thiết bị"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming 30-day condensed agenda */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Mốc Bảo Trì 30 Ngày Tới ({next30DaysPlans.length})
              </div>
              <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-1">
                {next30DaysPlans.slice(0, 8).map((p) => (
                  <button
                    key={`agenda-${p.id}`}
                    type="button"
                    onClick={() => {
                      const dt = parseYMD(p.ngayBaoTriTiepTheo);
                      setCalendarMonth({ year: dt.getFullYear(), month: dt.getMonth() });
                      setSelectedDate(p.ngayBaoTriTiepTheo);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-[11px] transition"
                  >
                    <span className="font-mono font-bold text-cyan-400 shrink-0">
                      {formatDateVN(p.ngayBaoTriTiepTheo)}
                    </span>
                    <span className="text-slate-200 truncate flex-1 font-medium">
                      {p.maThietBi} — {p.tenThietBi}
                    </span>
                  </button>
                ))}
                {next30DaysPlans.length === 0 && (
                  <div className="text-xs text-slate-500 py-2">
                    Không có lịch bảo trì phát sinh trong 30 ngày tới.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Urgent Maintenance Plans & Critical Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent & Overdue Plans */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-slate-100 text-sm">
                Thiết Bị Cần Bảo Trì Ngay (Quá Hạn & Sắp Tới)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('maintenance')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Xem tất cả ({maintenancePlans.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {maintenancePlans
              .filter((p) => p.trangThai === 'Quá hạn' || p.trangThai === 'Tới hạn' || p.trangThai === 'Sắp tới')
              .slice(0, 5)
              .map((plan) => {
                const eq = equipment.find((e) => e.maThietBi === plan.maThietBi);
                return (
                  <div
                    key={plan.id}
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-3 hover:bg-slate-800 transition"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {plan.maThietBi}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            plan.trangThai === 'Quá hạn'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : plan.trangThai === 'Tới hạn'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {plan.trangThai} ({formatDateVN(plan.ngayBaoTriTiepTheo)})
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 truncate font-medium">{plan.tenThietBi}</p>
                      <p className="text-[11px] text-slate-400">
                        Phụ trách: {plan.nguoiPhuTrach} • Tần suất: {plan.tanSuat}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {eq && (
                        <button
                          onClick={() => onOpenQR(eq)}
                          title="Xem mã QR"
                          className="p-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}
                      {eq && (
                        <button
                          onClick={() => onOpenMaintenanceModal(eq)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition flex items-center gap-1"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          Bảo Trì
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Tickets Board */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-slate-100 text-sm">Tickets Yêu Cầu Cần Xử Lý</h3>
            </div>
            <button
              onClick={() => onNavigateTab('tickets')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              Xem tất cả ({tickets.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingTickets.slice(0, 5).map((t) => (
              <div
                key={t.maTicket}
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2 hover:bg-slate-800 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">{t.maTicket}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        t.mucDoUuTien === 'Khẩn cấp'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : t.mucDoUuTien === 'Cao'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {t.mucDoUuTien}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">{t.trangThai}</span>
                </div>
                <p className="text-xs font-medium text-slate-200 leading-snug">{t.tieuDe}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                  <span>Phụ trách: {t.nguoiPhuTrach}</span>
                  <span>Người lập: {t.nguoiLap}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Audit Log preview */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              {UI_TEXTS.dashboard.auditSectionTitle}
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('logs')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            Toàn bộ nhật ký ({auditLogs.length})
          </button>
        </div>

        <div className="divide-y divide-slate-800">
          {auditLogs.slice(0, 4).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-slate-500 text-[11px] shrink-0">
                  {log.thoiGian.split(' ')[1] || log.thoiGian}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    log.hanhDong === 'Thêm'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : log.hanhDong === 'Hoàn thành'
                      ? 'bg-blue-500/20 text-blue-300'
                      : log.hanhDong === 'Xuất kho'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {log.hanhDong}
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-slate-300 mr-2">[{log.chucNang}]</span>
                  <span className="text-slate-400 truncate">{log.chiTietNoiDung}</span>
                </div>
              </div>
              <span className="text-slate-400 shrink-0 font-medium">{log.nguoiThaoTac}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
