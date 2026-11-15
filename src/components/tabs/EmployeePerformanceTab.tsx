import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import {
  Employee,
  Equipment,
  MaintenanceHistory,
  MaintenancePlan,
  Ticket,
} from '../../types/cmms';
import { formatDateVN, isAdminLevel, parseAssigneeNames } from '../../utils/cmmsLogic';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Cpu,
  Download,
  Eye,
  Filter,
  Lock,
  Search,
  Tag,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  X,
} from 'lucide-react';

type TimeRangeFilter = 'ALL' | '30D' | '90D';
type SortKey = 'efficiency' | 'completed' | 'assigned' | 'overdue' | 'name';

interface EmployeeMetricRow {
  employee: Employee;
  assignedEquipment: Equipment[];
  assignedPlans: MaintenancePlan[];
  overduePlans: MaintenancePlan[];
  dueSoonPlans: MaintenancePlan[];
  onTrackPlans: MaintenancePlan[];
  completedHistory: MaintenanceHistory[];
  passedHistoryCount: number;
  withPhotoHistoryCount: number;
  totalDowntimeMinutes: number;
  assignedTickets: Ticket[];
  completedTickets: Ticket[];
  activeTickets: Ticket[];
  urgentTickets: Ticket[];
  supervisedCount: number;
  auditActionCount: number;
  meterLogCount: number;
  totalAssignedWorkload: number;
  totalCompletedWork: number;
  totalPendingWork: number;
  completionRate: number;
  qualityPassRate: number;
  efficiencyScore: number;
  tierLabel: 'Xuất sắc' | 'Tốt' | 'Đạt yêu cầu' | 'Cần cải thiện' | 'Quản lý';
  tierClass: string;
}

const APP_REF_DATE = new Date('2026-11-10T00:00:00');

function isWithinDays(dateStr: string | undefined, days: number | null): boolean {
  if (!days || !dateStr) return true;
  const parsed = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return true;
  const diffDays = (APP_REF_DATE.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

function matchesEmployee(rawField: string | undefined | null, emp: Employee): boolean {
  if (!rawField) return false;
  const empName = emp.tenNhanVien.trim().toLowerCase();
  const empCode = emp.maNhanVien.trim().toLowerCase();
  const names = parseAssigneeNames(rawField);
  if (names.length > 0) {
    return names.some((n) => {
      const lower = n.toLowerCase();
      return lower === empName || lower === empCode || lower.includes(empName);
    });
  }
  const lowerRaw = rawField.trim().toLowerCase();
  return lowerRaw === empName || lowerRaw === empCode;
}

export const EmployeePerformanceTab: React.FC = () => {
  const {
    currentUser,
    employees,
    equipment,
    maintenancePlans,
    maintenanceHistory,
    tickets,
    auditLogs,
    meterReadings,
    theme,
  } = useCMMS();

  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('efficiency');
  const [selectedMetric, setSelectedMetric] = useState<EmployeeMetricRow | null>(null);
  const [hoveredEmployeeId, setHoveredEmployeeId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'history' | 'plans' | 'tickets' | 'equipment'>('history');

  const isLight = theme === 'light';
  const adminAuthorized = isAdminLevel(currentUser);

  const rangeDays = timeRange === '30D' ? 30 : timeRange === '90D' ? 90 : null;

  const metrics: EmployeeMetricRow[] = useMemo(() => {
    const filteredHistPool = maintenanceHistory.filter((h) => isWithinDays(h.ngayThucHien, rangeDays));
    const filteredTicketPool = tickets.filter((t) => isWithinDays(t.ngayTao, rangeDays));
    const filteredAuditPool = auditLogs.filter((l) => isWithinDays(l.thoiGian, rangeDays));
    const filteredMeterPool = meterReadings.filter((m) => isWithinDays(m.ngayChot, rangeDays));

    return employees.map((emp) => {
      const assignedEquipment = equipment.filter((eq) => matchesEmployee(eq.nguoiPhuTrach, emp));
      const assignedPlans = maintenancePlans.filter((p) => matchesEmployee(p.nguoiPhuTrach, emp));
      const overduePlans = assignedPlans.filter((p) => p.trangThai === 'Quá hạn');
      const dueSoonPlans = assignedPlans.filter(
        (p) => p.trangThai === 'Tới hạn' || p.trangThai === 'Sắp tới'
      );
      const onTrackPlans = assignedPlans.filter((p) => p.trangThai === 'Đúng hạn');

      const completedHistory = filteredHistPool.filter(
        (h) => matchesEmployee(h.nguoiThucHien, emp) || (!h.nguoiThucHien && matchesEmployee(h.nguoiLapBaoCao, emp))
      );
      const passedHistoryCount = completedHistory.filter(
        (h) => h.ketQua === 'Đạt' || h.ketQua === 'Hoàn thành'
      ).length;
      const withPhotoHistoryCount = completedHistory.filter(
        (h) => Boolean(h.anhTruocXuLy || h.hinhAnh)
      ).length;
      const totalDowntimeMinutes = completedHistory.reduce(
        (sum, h) => sum + (Number(h.thoiGianDungMay) || 0),
        0
      );

      const assignedTickets = filteredTicketPool.filter((t) => matchesEmployee(t.nguoiPhuTrach, emp));
      const completedTickets = assignedTickets.filter((t) => t.trangThai === 'Hoàn thành');
      const activeTickets = assignedTickets.filter(
        (t) => t.trangThai !== 'Hoàn thành' && t.trangThai !== 'Hủy'
      );
      const urgentTickets = assignedTickets.filter(
        (t) => t.mucDoUuTien === 'Khẩn cấp' || t.mucDoUuTien === 'Cao'
      );

      const supervisedCount =
        maintenancePlans.filter((p) => matchesEmployee(p.nguoiGiaoViec, emp)).length +
        filteredTicketPool.filter(
          (t) => matchesEmployee(t.nguoiGiaoViec, emp) || matchesEmployee(t.nguoiLap, emp)
        ).length;

      const auditActionCount = filteredAuditPool.filter((l) =>
        matchesEmployee(l.nguoiThaoTac, emp)
      ).length;
      const meterLogCount = filteredMeterPool.filter((m) =>
        matchesEmployee(m.nguoiGhi, emp)
      ).length;

      const totalCompletedWork = completedHistory.length + completedTickets.length;
      const totalPendingWork = overduePlans.length + dueSoonPlans.length + activeTickets.length;
      const totalAssignedWorkload = assignedPlans.length + assignedTickets.length;
      const totalDenominator = totalCompletedWork + totalPendingWork;

      const completionRate =
        totalDenominator > 0
          ? Math.round((totalCompletedWork / totalDenominator) * 100)
          : assignedPlans.length > 0
          ? 100
          : 0;

      const qualityPassRate =
        completedHistory.length > 0
          ? Math.round((passedHistoryCount / completedHistory.length) * 100)
          : completedTickets.length > 0
          ? 100
          : 0;

      const overduePenaltyRatio =
        assignedPlans.length > 0 ? overduePlans.length / assignedPlans.length : 0;
      const onScheduleScore = Math.max(0, Math.round((1 - overduePenaltyRatio) * 100));

      const hasDirectTasks = totalCompletedWork > 0 || totalAssignedWorkload > 0;
      const efficiencyScore = hasDirectTasks
        ? Math.min(
            100,
            Math.max(
              0,
              Math.round(completionRate * 0.5 + qualityPassRate * 0.3 + onScheduleScore * 0.2)
            )
          )
        : 0;

      let tierLabel: EmployeeMetricRow['tierLabel'] = 'Quản lý';
      let tierClass = 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';

      if (hasDirectTasks) {
        if (efficiencyScore >= 85) {
          tierLabel = 'Xuất sắc';
          tierClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
        } else if (efficiencyScore >= 70) {
          tierLabel = 'Tốt';
          tierClass = 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
        } else if (efficiencyScore >= 50) {
          tierLabel = 'Đạt yêu cầu';
          tierClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
        } else {
          tierLabel = 'Cần cải thiện';
          tierClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
        }
      }

      return {
        employee: emp,
        assignedEquipment,
        assignedPlans,
        overduePlans,
        dueSoonPlans,
        onTrackPlans,
        completedHistory,
        passedHistoryCount,
        withPhotoHistoryCount,
        totalDowntimeMinutes,
        assignedTickets,
        completedTickets,
        activeTickets,
        urgentTickets,
        supervisedCount,
        auditActionCount,
        meterLogCount,
        totalAssignedWorkload,
        totalCompletedWork,
        totalPendingWork,
        completionRate,
        qualityPassRate,
        efficiencyScore,
        tierLabel,
        tierClass,
      };
    });
  }, [employees, equipment, maintenancePlans, maintenanceHistory, tickets, auditLogs, meterReadings, rangeDays]);

  const roles = useMemo(
    () => Array.from(new Set(employees.map((e) => e.chucVu))),
    [employees]
  );

  const visibleRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = metrics.filter((m) => {
      if (roleFilter !== 'ALL' && m.employee.chucVu !== roleFilter) return false;
      if (q) {
        return (
          m.employee.tenNhanVien.toLowerCase().includes(q) ||
          m.employee.maNhanVien.toLowerCase().includes(q) ||
          m.employee.chucVu.toLowerCase().includes(q) ||
          m.employee.email.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'completed':
          return b.totalCompletedWork - a.totalCompletedWork || b.efficiencyScore - a.efficiencyScore;
        case 'assigned':
          return b.totalAssignedWorkload - a.totalAssignedWorkload || b.totalCompletedWork - a.totalCompletedWork;
        case 'overdue':
          return b.overduePlans.length + b.activeTickets.length - (a.overduePlans.length + a.activeTickets.length);
        case 'name':
          return a.employee.tenNhanVien.localeCompare(b.employee.tenNhanVien, 'vi');
        case 'efficiency':
        default:
          return b.efficiencyScore - a.efficiencyScore || b.totalCompletedWork - a.totalCompletedWork;
      }
    });
  }, [metrics, roleFilter, searchTerm, sortBy]);

  // Global KPI summaries
  const summaryStats = useMemo(() => {
    const activeWorkers = metrics.filter((m) => m.totalAssignedWorkload > 0 || m.totalCompletedWork > 0);
    const totalCompleted = metrics.reduce((s, m) => s + m.totalCompletedWork, 0);
    const totalPending = metrics.reduce((s, m) => s + m.totalPendingWork, 0);
    const totalOverduePlans = metrics.reduce((s, m) => s + m.overduePlans.length, 0);
    const totalAssignedPlansAndTickets = metrics.reduce((s, m) => s + m.totalAssignedWorkload, 0);
    const overallCompletionRate =
      totalCompleted + totalPending > 0
        ? Math.round((totalCompleted / (totalCompleted + totalPending)) * 100)
        : 0;
    const avgEfficiency =
      activeWorkers.length > 0
        ? Math.round(activeWorkers.reduce((s, m) => s + m.efficiencyScore, 0) / activeWorkers.length)
        : 0;

    return {
      totalStaff: employees.length,
      activeWorkerCount: activeWorkers.length,
      totalAssignedPlansAndTickets,
      totalCompleted,
      totalPending,
      totalOverduePlans,
      overallCompletionRate,
      avgEfficiency,
    };
  }, [metrics, employees.length]);

  // D3 Stacked Bar Chart geometry
  const chartData = useMemo(() => visibleRows.slice(0, 12), [visibleRows]);

  const workloadChartLayout = useMemo(() => {
    const width = 560;
    const rowHeight = 36;
    const margin = { top: 14, right: 24, bottom: 28, left: 138 };
    const innerHeight = Math.max(160, chartData.length * rowHeight);
    const height = innerHeight + margin.top + margin.bottom;
    const innerWidth = width - margin.left - margin.right;

    const maxTotal = Math.max(
      5,
      d3.max(chartData, (d) =>
        d.completedHistory.length +
        d.completedTickets.length +
        d.activeTickets.length +
        d.dueSoonPlans.length +
        d.overduePlans.length
      ) || 5
    );

    const xScale = d3.scaleLinear().domain([0, maxTotal]).nice().range([0, innerWidth]);
    const yScale = d3
      .scaleBand<string>()
      .domain(chartData.map((d) => d.employee.maNhanVien))
      .range([0, innerHeight])
      .padding(0.32);

    const effXScale = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);

    return {
      width,
      height,
      margin,
      innerWidth,
      innerHeight,
      xScale,
      yScale,
      effXScale,
    };
  }, [chartData]);

  const handleExportCSV = () => {
    const headers = [
      'Mã NV',
      'Họ Tên',
      'Chức Vụ',
      'Thiết Bị Phụ Trách',
      'KH Bảo Trì Được Giao',
      'KH Quá Hạn',
      'Bảo Trì Hoàn Thành',
      'Tỷ Lệ Đạt (%)',
      'Thời Gian Dừng Máy (phút)',
      'Ticket Được Giao',
      'Ticket Hoàn Thành',
      'Ticket Đang Xử Lý',
      'Tỷ Lệ Hoàn Thành (%)',
      'Điểm Hiệu Quả (0-100)',
      'Xếp Loại',
    ];
    const rows = visibleRows.map((r) => [
      r.employee.maNhanVien,
      `"${r.employee.tenNhanVien}"`,
      `"${r.employee.chucVu}"`,
      r.assignedEquipment.length,
      r.assignedPlans.length,
      r.overduePlans.length,
      r.completedHistory.length,
      r.qualityPassRate,
      r.totalDowntimeMinutes,
      r.assignedTickets.length,
      r.completedTickets.length,
      r.activeTickets.length,
      r.completionRate,
      r.efficiencyScore,
      `"${r.tierLabel}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh_Gia_Hieu_Qua_Nhan_Vien_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!adminAuthorized) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-rose-500/30 text-center space-y-3">
        <Lock className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Giới Hạn Quyền Truy Cập</h3>
        <p className="text-xs text-slate-400">
          Phân hệ đánh giá hiệu quả công việc nhân viên chỉ dành cho tài khoản cấp Admin / Owner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Lock className="w-3 h-3" />
              {UI_TEXTS.tabs.employeePerformance.badge}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
            {UI_TEXTS.tabs.employeePerformance.title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            {(
              [
                { id: 'ALL', label: 'Tất cả' },
                { id: '30D', label: '30 ngày' },
                { id: '90D', label: '90 ngày' },
              ] as { id: TimeRangeFilter; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTimeRange(opt.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  timeRange === opt.id
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Xuất Báo Cáo CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Nhân Sự Tham Gia Tác Nghiệp</span>
            <UserCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {summaryStats.activeWorkerCount}{' '}
            <span className="text-sm font-semibold text-slate-400">/ {summaryStats.totalStaff} NV</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tổng Việc Được Giao</span>
            <ClipboardList className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {summaryStats.totalAssignedPlansAndTickets}
            <span className="text-xs font-semibold text-slate-400 ml-2">
              (KH + Ticket)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Công Việc Đã Hoàn Thành</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">
              {summaryStats.totalCompleted}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
              {summaryStats.overallCompletionRate}% tiến độ
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Điểm Hiệu Quả TB Đội Ngũ</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-300 font-mono">
              {summaryStats.avgEfficiency}
              <span className="text-sm text-slate-400">/100</span>
            </span>
            {summaryStats.totalOverduePlans > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono">
                {summaryStats.totalOverduePlans} quá hạn
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên, mã NV, chức vụ..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">Tất cả chức vụ</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="efficiency">Điểm hiệu quả cao nhất</option>
            <option value="completed">Việc hoàn thành nhiều nhất</option>
            <option value="assigned">Khối lượng được giao</option>
            <option value="overdue">Tồn đọng / Quá hạn nhiều nhất</option>
            <option value="name">Tên nhân viên (A-Z)</option>
          </select>
        </div>
      </div>

      {/* D3 Comparative Visualizations */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Left: D3 Stacked Workload Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Phân Bổ Khối Lượng & Trạng Thái Công Việc (D3)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  BT xong
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                  Ticket xong
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  Đang chờ
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  Quá hạn
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${workloadChartLayout.width} ${workloadChartLayout.height}`}
                className="w-full min-w-[460px] h-auto"
              >
                <g transform={`translate(${workloadChartLayout.margin.left},${workloadChartLayout.margin.top})`}>
                  {workloadChartLayout.xScale.ticks(5).map((tick) => {
                    const tx = workloadChartLayout.xScale(tick);
                    return (
                      <g key={tick} transform={`translate(${tx},0)`}>
                        <line
                          y1={0}
                          y2={workloadChartLayout.innerHeight}
                          stroke={isLight ? '#cbd5e1' : '#1e293b'}
                          strokeDasharray="3 3"
                        />
                        <text
                          y={workloadChartLayout.innerHeight + 16}
                          textAnchor="middle"
                          fontSize={10}
                          fill={isLight ? '#475569' : '#94a3b8'}
                        >
                          {tick}
                        </text>
                      </g>
                    );
                  })}

                  {chartData.map((d) => {
                    const y = workloadChartLayout.yScale(d.employee.maNhanVien) ?? 0;
                    const barH = workloadChartLayout.yScale.bandwidth();
                    const isHovered = hoveredEmployeeId === d.employee.maNhanVien;

                    const segments = [
                      { key: 'maintDone', val: d.completedHistory.length, color: '#10b981' },
                      { key: 'ticketDone', val: d.completedTickets.length, color: '#06b6d4' },
                      {
                        key: 'pending',
                        val: d.activeTickets.length + d.dueSoonPlans.length,
                        color: '#f59e0b',
                      },
                      { key: 'overdue', val: d.overduePlans.length, color: '#f43f5e' },
                    ];

                    let acc = 0;
                    const total = segments.reduce((s, seg) => s + seg.val, 0);

                    return (
                      <g
                        key={d.employee.maNhanVien}
                        transform={`translate(0,${y})`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredEmployeeId(d.employee.maNhanVien)}
                        onMouseLeave={() => setHoveredEmployeeId(null)}
                        onClick={() => {
                          setSelectedMetric(d);
                          setDetailTab('history');
                        }}
                      >
                        <text
                          x={-10}
                          y={barH / 2 + 4}
                          textAnchor="end"
                          fontSize={11}
                          fontWeight={isHovered ? 700 : 500}
                          fill={isHovered ? '#22d3ee' : isLight ? '#1e293b' : '#e2e8f0'}
                        >
                          {d.employee.tenNhanVien.length > 18
                            ? `${d.employee.tenNhanVien.slice(0, 17)}…`
                            : d.employee.tenNhanVien}
                        </text>

                        <rect
                          x={0}
                          y={0}
                          width={workloadChartLayout.innerWidth}
                          height={barH}
                          rx={4}
                          fill={isLight ? '#f1f5f9' : '#0f172a'}
                          opacity={0.7}
                        />

                        {segments.map((seg) => {
                          if (seg.val <= 0) return null;
                          const x0 = workloadChartLayout.xScale(acc);
                          const x1 = workloadChartLayout.xScale(acc + seg.val);
                          acc += seg.val;
                          return (
                            <rect
                              key={seg.key}
                              x={x0}
                              y={0}
                              width={Math.max(2, x1 - x0)}
                              height={barH}
                              rx={2}
                              fill={seg.color}
                              opacity={isHovered ? 1 : 0.88}
                            />
                          );
                        })}

                        <text
                          x={workloadChartLayout.xScale(total) + 6}
                          y={barH / 2 + 4}
                          fontSize={10}
                          fontWeight={700}
                          fill={isLight ? '#334155' : '#cbd5e1'}
                        >
                          {total}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          </div>

          {/* Right: D3 Efficiency Score Comparison */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Xếp Hạng Điểm Hiệu Quả Tổng Hợp (0 - 100%)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-amber-300">
                TB Đội Ngũ: {summaryStats.avgEfficiency} điểm
              </span>
            </div>

            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${workloadChartLayout.width} ${workloadChartLayout.height}`}
                className="w-full min-w-[460px] h-auto"
              >
                <g transform={`translate(${workloadChartLayout.margin.left},${workloadChartLayout.margin.top})`}>
                  {[0, 25, 50, 75, 100].map((tick) => {
                    const tx = workloadChartLayout.effXScale(tick);
                    return (
                      <g key={tick} transform={`translate(${tx},0)`}>
                        <line
                          y1={0}
                          y2={workloadChartLayout.innerHeight}
                          stroke={isLight ? '#cbd5e1' : '#1e293b'}
                          strokeDasharray="3 3"
                        />
                        <text
                          y={workloadChartLayout.innerHeight + 16}
                          textAnchor="middle"
                          fontSize={10}
                          fill={isLight ? '#475569' : '#94a3b8'}
                        >
                          {tick}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Average reference line */}
                  {summaryStats.avgEfficiency > 0 && (
                    <line
                      x1={workloadChartLayout.effXScale(summaryStats.avgEfficiency)}
                      x2={workloadChartLayout.effXScale(summaryStats.avgEfficiency)}
                      y1={0}
                      y2={workloadChartLayout.innerHeight}
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                    />
                  )}

                  {chartData.map((d) => {
                    const y = workloadChartLayout.yScale(d.employee.maNhanVien) ?? 0;
                    const barH = workloadChartLayout.yScale.bandwidth();
                    const isHovered = hoveredEmployeeId === d.employee.maNhanVien;
                    const hasWork = d.totalCompletedWork > 0 || d.totalAssignedWorkload > 0;
                    const barColor = !hasWork
                      ? '#6366f1'
                      : d.efficiencyScore >= 85
                      ? '#10b981'
                      : d.efficiencyScore >= 70
                      ? '#06b6d4'
                      : d.efficiencyScore >= 50
                      ? '#f59e0b'
                      : '#f43f5e';

                    return (
                      <g
                        key={d.employee.maNhanVien}
                        transform={`translate(0,${y})`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredEmployeeId(d.employee.maNhanVien)}
                        onMouseLeave={() => setHoveredEmployeeId(null)}
                        onClick={() => {
                          setSelectedMetric(d);
                          setDetailTab('history');
                        }}
                      >
                        <text
                          x={-10}
                          y={barH / 2 + 4}
                          textAnchor="end"
                          fontSize={11}
                          fontWeight={isHovered ? 700 : 500}
                          fill={isHovered ? '#22d3ee' : isLight ? '#1e293b' : '#e2e8f0'}
                        >
                          {d.employee.tenNhanVien.length > 18
                            ? `${d.employee.tenNhanVien.slice(0, 17)}…`
                            : d.employee.tenNhanVien}
                        </text>

                        <rect
                          x={0}
                          y={0}
                          width={workloadChartLayout.innerWidth}
                          height={barH}
                          rx={4}
                          fill={isLight ? '#f1f5f9' : '#0f172a'}
                          opacity={0.7}
                        />

                        {hasWork && (
                          <rect
                            x={0}
                            y={0}
                            width={Math.max(4, workloadChartLayout.effXScale(d.efficiencyScore))}
                            height={barH}
                            rx={4}
                            fill={barColor}
                            opacity={isHovered ? 1 : 0.88}
                          />
                        )}

                        <text
                          x={
                            hasWork
                              ? Math.min(
                                  workloadChartLayout.innerWidth - 36,
                                  workloadChartLayout.effXScale(d.efficiencyScore) + 6
                                )
                              : 8
                          }
                          y={barH / 2 + 4}
                          fontSize={10}
                          fontWeight={700}
                          fill={isLight ? '#334155' : '#e2e8f0'}
                        >
                          {hasWork ? `${d.efficiencyScore}đ (${d.tierLabel})` : 'Quản lý'}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Performance Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-200">
            Bảng Thống Kê Chi Tiết Theo Nhân Sự ({visibleRows.length})
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            Công thức điểm = 50% Tiến độ + 30% Chất lượng Đạt + 20% Đúng hạn
          </span>
        </div>

        <SmartHorizontalScroll>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 whitespace-nowrap">Nhân Viên</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">TB Phụ Trách</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">KH Bảo Trì (Quá Hạn)</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Bảo Trì Đã Xong</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Tickets (Xong / Giao)</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Chất Lượng Đạt</th>
                <th className="py-3 px-3 min-w-[140px]">Tỷ Lệ Hoàn Thành</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Điểm & Xếp Loại</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {visibleRows.map((row) => {
                const { employee: emp } = row;
                const hasDirectTasks = row.totalCompletedWork > 0 || row.totalAssignedWorkload > 0;
                return (
                  <tr
                    key={emp.maNhanVien}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => {
                      setSelectedMetric(row);
                      setDetailTab('history');
                    }}
                  >
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            emp.anhDaiDien ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                          }
                          alt={emp.tenNhanVien}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-100">{emp.tenNhanVien}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {emp.maNhanVien} • {emp.chucVu}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                      {row.assignedEquipment.length}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-200">{row.assignedPlans.length}</span>
                      {row.overduePlans.length > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-[10px] font-bold">
                          {row.overduePlans.length} trễ
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="font-mono font-bold text-emerald-400">{row.completedHistory.length} lượt</div>
                      {row.totalDowntimeMinutes > 0 && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {row.totalDowntimeMinutes} phút dừng
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono">
                      <span className="font-bold text-cyan-400">{row.completedTickets.length}</span>
                      <span className="text-slate-500"> / {row.assignedTickets.length}</span>
                      {row.activeTickets.length > 0 && (
                        <span className="block text-[10px] text-amber-400">
                          {row.activeTickets.length} đang xử lý
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono">
                      {row.completedHistory.length > 0 ? (
                        <span
                          className={`font-bold ${
                            row.qualityPassRate >= 85
                              ? 'text-emerald-400'
                              : row.qualityPassRate >= 60
                              ? 'text-amber-300'
                              : 'text-rose-400'
                          }`}
                        >
                          {row.qualityPassRate}% ({row.passedHistoryCount}/{row.completedHistory.length})
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {hasDirectTasks ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-bold text-slate-200">{row.completionRate}%</span>
                            <span className="text-slate-400">
                              {row.totalCompletedWork}/{row.totalCompletedWork + row.totalPendingWork}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.completionRate >= 80
                                  ? 'bg-emerald-500'
                                  : row.completionRate >= 55
                                  ? 'bg-cyan-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${row.completionRate}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Điều phối: {row.supervisedCount} • Log: {row.auditActionCount}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center gap-0.5">
                        {hasDirectTasks && (
                          <span className="font-mono font-extrabold text-sm text-slate-100">
                            {row.efficiencyScore}đ
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.tierClass}`}>
                          {row.tierLabel}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMetric(row);
                          setDetailTab('history');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-600/20 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem
                      </button>
                    </td>
                  </tr>
                );
              })}

              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Không tìm thấy nhân viên phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </SmartHorizontalScroll>
      </div>

      {/* Employee Detail Inspection Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/70">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedMetric.employee.anhDaiDien ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={selectedMetric.employee.tenNhanVien}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-600"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100">
                      {selectedMetric.employee.tenNhanVien}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedMetric.tierClass}`}>
                      {selectedMetric.tierLabel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {selectedMetric.employee.maNhanVien} • {selectedMetric.employee.chucVu} •{' '}
                    {selectedMetric.employee.email}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMetric(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Employee Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-slate-400">Điểm hiệu quả</div>
                  <div className="text-lg font-extrabold font-mono text-amber-300 mt-0.5">
                    {selectedMetric.efficiencyScore}/100
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-slate-400">Bảo trì xong</div>
                  <div className="text-lg font-extrabold font-mono text-emerald-400 mt-0.5">
                    {selectedMetric.completedHistory.length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-slate-400">Tickets xong</div>
                  <div className="text-lg font-extrabold font-mono text-cyan-400 mt-0.5">
                    {selectedMetric.completedTickets.length}/{selectedMetric.assignedTickets.length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-slate-400">KH quá hạn</div>
                  <div className="text-lg font-extrabold font-mono text-rose-400 mt-0.5">
                    {selectedMetric.overduePlans.length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-slate-400">Ghi số / Log</div>
                  <div className="text-lg font-extrabold font-mono text-indigo-300 mt-0.5">
                    {selectedMetric.meterLogCount} / {selectedMetric.auditActionCount}
                  </div>
                </div>
              </div>

              {/* Detail Sub-tabs */}
              <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 text-xs">
                <button
                  onClick={() => setDetailTab('history')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                    detailTab === 'history'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Bảo Trì Hoàn Thành ({selectedMetric.completedHistory.length})
                </button>
                <button
                  onClick={() => setDetailTab('plans')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                    detailTab === 'plans'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Kế Hoạch Bảo Trì ({selectedMetric.assignedPlans.length})
                </button>
                <button
                  onClick={() => setDetailTab('tickets')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                    detailTab === 'tickets'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  Tickets ({selectedMetric.assignedTickets.length})
                </button>
                <button
                  onClick={() => setDetailTab('equipment')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                    detailTab === 'equipment'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  Thiết Bị Phụ Trách ({selectedMetric.assignedEquipment.length})
                </button>
              </div>

              {/* Detail List */}
              {detailTab === 'history' && (
                <div className="space-y-2">
                  {selectedMetric.completedHistory.map((h) => (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-400">{h.maThietBi}</span>
                          <span className="font-semibold text-slate-100">{h.tenThietBi}</span>
                          <span className="text-[11px] font-mono text-slate-400">
                            ({formatDateVN(h.ngayThucHien)})
                          </span>
                        </div>
                        <p className="text-slate-300">{h.moTaCongViec}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
                          <Clock className="w-3 h-3" />
                          {h.thoiGianDungMay}p
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            h.ketQua === 'Đạt' || h.ketQua === 'Hoàn thành'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {h.ketQua}
                        </span>
                      </div>
                    </div>
                  ))}
                  {selectedMetric.completedHistory.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Chưa có biên bản bảo trì hoàn thành trong khoảng thời gian này.
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'plans' && (
                <div className="space-y-2">
                  {selectedMetric.assignedPlans.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-400">{p.maThietBi}</span>
                          <span className="font-semibold text-slate-100">{p.tenThietBi}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Tần suất: {p.tanSuat} • Kế tiếp: {formatDateVN(p.ngayBaoTriTiepTheo)}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold self-start sm:self-auto ${
                          p.trangThai === 'Quá hạn'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : p.trangThai === 'Tới hạn' || p.trangThai === 'Sắp tới'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {p.trangThai === 'Quá hạn' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                        {p.trangThai}
                      </span>
                    </div>
                  ))}
                  {selectedMetric.assignedPlans.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Chưa có kế hoạch bảo trì nào được phân công cho nhân viên này.
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'tickets' && (
                <div className="space-y-2">
                  {selectedMetric.assignedTickets.map((t) => (
                    <div
                      key={t.maTicket}
                      className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">{t.maTicket}</span>
                          <span className="font-semibold text-slate-100">{t.tieuDe}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Ngày tạo: {formatDateVN(t.ngayTao)} • Ưu tiên: {t.mucDoUuTien}
                          {t.maThietBi ? ` • TB: ${t.maThietBi}` : ''}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold self-start sm:self-auto ${
                          t.trangThai === 'Hoàn thành'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {t.trangThai}
                      </span>
                    </div>
                  ))}
                  {selectedMetric.assignedTickets.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Chưa có ticket nào được giao trong khoảng thời gian này.
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'equipment' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedMetric.assignedEquipment.map((eq) => (
                    <div
                      key={eq.maThietBi}
                      className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-cyan-400">{eq.maThietBi}</div>
                        <div className="font-semibold text-slate-100 truncate">{eq.tenThietBi}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {eq.heThong} • {eq.viTri}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-200 shrink-0">
                        {eq.tanSuat}
                      </span>
                    </div>
                  ))}
                  {selectedMetric.assignedEquipment.length === 0 && (
                    <div className="col-span-full py-6 text-center text-xs text-slate-400">
                      Nhân viên chưa phụ trách trực tiếp thiết bị nào.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
