import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useCMMS } from '../../context/CMMSContext';
import { TicketPriority } from '../../types/cmms';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  PieChart as PieChartIcon,
  TrendingUp,
} from 'lucide-react';

interface MonthlyTicketsMaintenanceChartProps {
  calendarMonth: { year: number; month: number };
  onShiftMonth: (delta: number) => void;
  onNavigateTab: (tabId: string) => void;
}

interface SeverityDatum {
  priority: TicketPriority;
  shortLabel: string;
  total: number;
  open: number;
  completed: number;
  cancelled: number;
  percent: number;
  color: string;
}

interface MaintenanceTrendDatum {
  label: string;
  fullLabel: string;
  daHoanThanh: number;
  canTheoDoi: number;
  quaHan: number;
  toiHan: number;
  sapToi: number;
  dungHan: number;
  luyKeHoanThanh: number;
  tongTrongKy: number;
}

const SEVERITY_CONFIG: Array<{
  priority: TicketPriority;
  shortLabel: string;
  color: string;
  pillClass: string;
}> = [
  {
    priority: 'Khẩn cấp',
    shortLabel: 'Khẩn cấp',
    color: '#f43f5e',
    pillClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  },
  {
    priority: 'Cao',
    shortLabel: 'Cao',
    color: '#f59e0b',
    pillClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  },
  {
    priority: 'Trung bình',
    shortLabel: 'T.Bình',
    color: '#06b6d4',
    pillClass: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
  },
  {
    priority: 'Bình thường',
    shortLabel: 'B.Thường',
    color: '#6366f1',
    pillClass: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
  },
  {
    priority: 'Thấp',
    shortLabel: 'Thấp',
    color: '#10b981',
    pillClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  },
];

const MAINTENANCE_SERIES = [
  { key: 'daHoanThanh', label: 'Đã hoàn thành', color: '#10b981' },
  { key: 'canTheoDoi', label: 'Cần theo dõi', color: '#a855f7' },
  { key: 'quaHan', label: 'Quá hạn', color: '#f43f5e' },
  { key: 'toiHan', label: 'Tới hạn', color: '#f59e0b' },
  { key: 'sapToi', label: 'Sắp tới', color: '#06b6d4' },
  { key: 'dungHan', label: 'Đúng hạn (Lịch)', color: '#3b82f6' },
] as const;

interface SeverityTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: SeverityDatum }>;
  isLight: boolean;
}

const SeverityTooltip: React.FC<SeverityTooltipProps> = ({ active, payload, isLight }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div
      className={`rounded-xl border p-3 shadow-2xl text-xs min-w-[205px] space-y-2 ${
        isLight
          ? 'bg-white/95 border-slate-300 text-slate-900'
          : 'bg-slate-900/95 border-slate-700 text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/40 pb-1.5">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          Mức độ: {item.priority}
        </span>
        <span className="font-mono font-extrabold">{item.percent.toFixed(1)}%</span>
      </div>
      <div className="space-y-1 font-mono text-[11px]">
        <div className="flex justify-between">
          <span className="font-sans text-slate-400">Tổng Ticket:</span>
          <strong className="font-bold">{item.total}</strong>
        </div>
        <div className="flex justify-between">
          <span className="font-sans text-amber-400">Đang mở / Chờ xử lý:</span>
          <strong className="text-amber-300">{item.open}</strong>
        </div>
        <div className="flex justify-between">
          <span className="font-sans text-emerald-400">Hoàn thành:</span>
          <strong className="text-emerald-400">{item.completed}</strong>
        </div>
        {item.cancelled > 0 && (
          <div className="flex justify-between">
            <span className="font-sans text-slate-400">Đã hủy:</span>
            <strong className="text-slate-400">{item.cancelled}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

interface MaintenanceTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: MaintenanceTrendDatum }>;
  isLight: boolean;
}

const MaintenanceTrendTooltip: React.FC<MaintenanceTooltipProps> = ({ active, payload, isLight }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div
      className={`rounded-xl border p-3 shadow-2xl text-xs min-w-[235px] space-y-2 ${
        isLight
          ? 'bg-white/95 border-slate-300 text-slate-900'
          : 'bg-slate-900/95 border-slate-700 text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/40 pb-1.5">
        <span className="font-bold">{item.fullLabel}</span>
        <span className="font-mono text-[11px] text-cyan-400 font-bold">
          {item.tongTrongKy} hạng mục
        </span>
      </div>
      <div className="space-y-1 font-mono text-[11px]">
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5 font-sans text-slate-300">
            <span className="w-2 h-2 rounded-sm bg-[#10b981]" /> Đã hoàn thành:
          </span>
          <strong className="text-emerald-400">{item.daHoanThanh}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5 font-sans text-slate-300">
            <span className="w-2 h-2 rounded-sm bg-[#a855f7]" /> Cần theo dõi:
          </span>
          <strong className="text-purple-400">{item.canTheoDoi}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5 font-sans text-slate-300">
            <span className="w-2 h-2 rounded-sm bg-[#f43f5e]" /> Quá hạn (Theo lịch):
          </span>
          <strong className="text-rose-400">{item.quaHan}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5 font-sans text-slate-300">
            <span className="w-2 h-2 rounded-sm bg-[#f59e0b]" /> Tới hạn:
          </span>
          <strong className="text-amber-300">{item.toiHan}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5 font-sans text-slate-300">
            <span className="w-2 h-2 rounded-sm bg-[#06b6d4]" /> Sắp tới:
          </span>
          <strong className="text-cyan-300">{item.sapToi}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5 font-sans text-slate-300">
            <span className="w-2 h-2 rounded-sm bg-[#3b82f6]" /> Đúng hạn (Theo lịch):
          </span>
          <strong className="text-blue-400">{item.dungHan}</strong>
        </div>
        <div className="flex justify-between gap-4 pt-1.5 border-t border-slate-700/40">
          <span className="flex items-center gap-1.5 font-sans font-semibold text-emerald-300">
            <span className="w-2.5 h-0.5 bg-[#34d399]" /> Lũy kế hoàn thành tháng:
          </span>
          <strong className="text-emerald-300">{item.luyKeHoanThanh}</strong>
        </div>
      </div>
    </div>
  );
};

export const MonthlyTicketsMaintenanceChart: React.FC<MonthlyTicketsMaintenanceChartProps> = ({
  calendarMonth,
  onShiftMonth,
  onNavigateTab,
}) => {
  const { tickets, maintenancePlans, maintenanceHistory, theme } = useCMMS();
  const isLight = theme === 'light';

  const [ticketScope, setTicketScope] = useState<'MONTH' | 'ALL'>('MONTH');
  const [ticketChartMode, setTicketChartMode] = useState<'BAR' | 'PIE'>('BAR');
  const [trendGranularity, setTrendGranularity] = useState<'DAY' | 'WEEK'>('DAY');

  const monthStr = String(calendarMonth.month + 1).padStart(2, '0');
  const targetYearMonth = `${calendarMonth.year}-${monthStr}`;
  const monthLabel = `${monthStr}/${calendarMonth.year}`;

  // 1. Ticket severity breakdown
  const filteredTickets = useMemo(() => {
    if (ticketScope === 'ALL') return tickets;
    return tickets.filter(
      (t) =>
        (t.ngayTao || '').startsWith(targetYearMonth) ||
        (t.ngayHoanThanh || '').startsWith(targetYearMonth)
    );
  }, [tickets, ticketScope, targetYearMonth]);

  const severityData = useMemo<SeverityDatum[]>(() => {
    const totalCount = filteredTickets.length;
    return SEVERITY_CONFIG.map((cfg) => {
      const matched = filteredTickets.filter((t) => t.mucDoUuTien === cfg.priority);
      const completed = matched.filter((t) => t.trangThai === 'Hoàn thành').length;
      const cancelled = matched.filter((t) => t.trangThai === 'Hủy').length;
      const open = matched.length - completed - cancelled;
      return {
        priority: cfg.priority,
        shortLabel: cfg.shortLabel,
        total: matched.length,
        open,
        completed,
        cancelled,
        percent: totalCount > 0 ? (matched.length / totalCount) * 100 : 0,
        color: cfg.color,
      };
    });
  }, [filteredTickets]);

  const nonZeroSeverityData = useMemo(
    () => severityData.filter((d) => d.total > 0),
    [severityData]
  );

  const ticketMetrics = useMemo(() => {
    const total = filteredTickets.length;
    const criticalOrHigh = filteredTickets.filter(
      (t) => t.mucDoUuTien === 'Khẩn cấp' || t.mucDoUuTien === 'Cao'
    ).length;
    const completed = filteredTickets.filter((t) => t.trangThai === 'Hoàn thành').length;
    const open = filteredTickets.filter(
      (t) => t.trangThai !== 'Hoàn thành' && t.trangThai !== 'Hủy'
    ).length;
    return { total, criticalOrHigh, completed, open };
  }, [filteredTickets]);

  // 2. Maintenance status trends for target month
  const daysInMonth = useMemo(
    () => new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate(),
    [calendarMonth]
  );

  const dailyTrendData = useMemo<MaintenanceTrendDatum[]>(() => {
    const dayBuckets: MaintenanceTrendDatum[] = Array.from({ length: daysInMonth }, (_, idx) => {
      const dayNum = idx + 1;
      const dayStr = String(dayNum).padStart(2, '0');
      return {
        label: dayStr,
        fullLabel: `Ngày ${dayStr}/${monthLabel}`,
        daHoanThanh: 0,
        canTheoDoi: 0,
        quaHan: 0,
        toiHan: 0,
        sapToi: 0,
        dungHan: 0,
        luyKeHoanThanh: 0,
        tongTrongKy: 0,
      };
    });

    maintenancePlans.forEach((plan) => {
      const d = plan.ngayBaoTriTiepTheo || '';
      if (!d.startsWith(targetYearMonth)) return;
      const dayNum = Number(d.slice(8, 10));
      if (!Number.isFinite(dayNum) || dayNum < 1 || dayNum > daysInMonth) return;
      const bucket = dayBuckets[dayNum - 1];
      if (plan.trangThai === 'Quá hạn') bucket.quaHan += 1;
      else if (plan.trangThai === 'Tới hạn') bucket.toiHan += 1;
      else if (plan.trangThai === 'Sắp tới') bucket.sapToi += 1;
      else bucket.dungHan += 1;
    });

    maintenanceHistory.forEach((hist) => {
      const d = hist.ngayThucHien || '';
      if (!d.startsWith(targetYearMonth)) return;
      const dayNum = Number(d.slice(8, 10));
      if (!Number.isFinite(dayNum) || dayNum < 1 || dayNum > daysInMonth) return;
      const bucket = dayBuckets[dayNum - 1];
      if (hist.ketQua === 'Đạt' || hist.ketQua === 'Hoàn thành') {
        bucket.daHoanThanh += 1;
      } else {
        bucket.canTheoDoi += 1;
      }
    });

    let runningCompleted = 0;
    dayBuckets.forEach((b) => {
      runningCompleted += b.daHoanThanh;
      b.luyKeHoanThanh = runningCompleted;
      b.tongTrongKy =
        b.daHoanThanh + b.canTheoDoi + b.quaHan + b.toiHan + b.sapToi + b.dungHan;
    });

    return dayBuckets;
  }, [daysInMonth, maintenancePlans, maintenanceHistory, targetYearMonth, monthLabel]);

  const weeklyTrendData = useMemo<MaintenanceTrendDatum[]>(() => {
    const ranges: Array<{ label: string; fullLabel: string; start: number; end: number }> = [
      { label: 'Tuần 1', fullLabel: `Tuần 1 (01–07/${monthStr})`, start: 1, end: 7 },
      { label: 'Tuần 2', fullLabel: `Tuần 2 (08–14/${monthStr})`, start: 8, end: 14 },
      { label: 'Tuần 3', fullLabel: `Tuần 3 (15–21/${monthStr})`, start: 15, end: 21 },
      { label: 'Tuần 4', fullLabel: `Tuần 4 (22–28/${monthStr})`, start: 22, end: 28 },
    ];
    if (daysInMonth > 28) {
      ranges.push({
        label: 'Cuối tháng',
        fullLabel: `Cuối tháng (29–${daysInMonth}/${monthStr})`,
        start: 29,
        end: daysInMonth,
      });
    }

    let runningCompleted = 0;
    return ranges.map((r) => {
      const slice = dailyTrendData.slice(r.start - 1, r.end);
      const sumField = (key: keyof MaintenanceTrendDatum) =>
        slice.reduce((acc, d) => acc + (Number(d[key]) || 0), 0);
      const daHoanThanh = sumField('daHoanThanh');
      const canTheoDoi = sumField('canTheoDoi');
      const quaHan = sumField('quaHan');
      const toiHan = sumField('toiHan');
      const sapToi = sumField('sapToi');
      const dungHan = sumField('dungHan');
      runningCompleted += daHoanThanh;
      return {
        label: r.label,
        fullLabel: r.fullLabel,
        daHoanThanh,
        canTheoDoi,
        quaHan,
        toiHan,
        sapToi,
        dungHan,
        luyKeHoanThanh: runningCompleted,
        tongTrongKy: daHoanThanh + canTheoDoi + quaHan + toiHan + sapToi + dungHan,
      };
    });
  }, [dailyTrendData, daysInMonth, monthStr]);

  const activeTrendData = trendGranularity === 'DAY' ? dailyTrendData : weeklyTrendData;

  const monthlyMaintenanceTotals = useMemo(() => {
    const completed = dailyTrendData.reduce((s, d) => s + d.daHoanThanh, 0);
    const followUp = dailyTrendData.reduce((s, d) => s + d.canTheoDoi, 0);
    const overdue = dailyTrendData.reduce((s, d) => s + d.quaHan, 0);
    const dueOrUpcoming = dailyTrendData.reduce((s, d) => s + d.toiHan + d.sapToi, 0);
    const onTrack = dailyTrendData.reduce((s, d) => s + d.dungHan, 0);
    return {
      completed,
      followUp,
      overdue,
      dueOrUpcoming,
      onTrack,
      total: completed + followUp + overdue + dueOrUpcoming + onTrack,
    };
  }, [dailyTrendData]);

  const gridStroke = isLight ? '#e2e8f0' : '#1e293b';
  const axisStroke = isLight ? '#cbd5e1' : '#334155';
  const tickFill = isLight ? '#475569' : '#94a3b8';

  return (
    <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-5 space-y-5 shadow-xl">
      {/* Section Header & Month Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-bold text-slate-100 text-base">
              Phân Tích Ticket Theo Mức Độ &amp; Xu Hướng Bảo Trì (Tháng {monthLabel})
            </h3>
            <p className="text-xs text-slate-400">
              Theo dõi phân bổ mức độ sự cố và tiến độ hoàn thành / đến hạn bảo trì trong tháng
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onShiftMonth(-1)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-bold font-mono text-slate-100 min-w-[92px] text-center">
              Tháng {monthLabel}
            </span>
            <button
              type="button"
              onClick={() => onShiftMonth(1)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Two-Chart Responsive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* LEFT CARD: Ticket Distribution by Severity */}
        <div className="xl:col-span-5 rounded-xl bg-slate-950/60 border border-slate-800 p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Phân Bổ Ticket Theo Mức Độ
                </h4>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTicketScope('MONTH')}
                    className={`px-2 py-1 rounded-md font-semibold transition ${
                      ticketScope === 'MONTH'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tháng {monthLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketScope('ALL')}
                    className={`px-2 py-1 rounded-md font-semibold transition ${
                      ticketScope === 'ALL'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tất cả
                  </button>
                </div>

                <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTicketChartMode('BAR')}
                    title="Biểu đồ cột"
                    className={`p-1 rounded-md transition ${
                      ticketChartMode === 'BAR'
                        ? 'bg-slate-700 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketChartMode('PIE')}
                    title="Biểu đồ tròn"
                    className={`p-1 rounded-md transition ${
                      ticketChartMode === 'PIE'
                        ? 'bg-slate-700 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <PieChartIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Ticket KPI Mini Strip */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Tổng Ticket</div>
                <div className="font-mono font-extrabold text-base text-slate-100 tabular-nums">
                  {ticketMetrics.total}
                </div>
              </div>
              <div className="px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Khẩn cấp / Cao</div>
                <div className="font-mono font-extrabold text-base text-rose-400 tabular-nums">
                  {ticketMetrics.criticalOrHigh}
                </div>
              </div>
              <div className="px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Đã xong / Mở</div>
                <div className="font-mono font-extrabold text-sm text-emerald-400 tabular-nums mt-0.5">
                  {ticketMetrics.completed}
                  <span className="text-slate-500 mx-0.5">/</span>
                  <span className="text-amber-300">{ticketMetrics.open}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Ticket Chart Area */}
          {ticketMetrics.total === 0 ? (
            <div className="flex-1 min-h-[230px] flex flex-col items-center justify-center text-center space-y-2 rounded-xl bg-slate-900/50 border border-slate-800/70 p-4">
              <AlertTriangle className="w-6 h-6 text-slate-500" />
              <p className="text-xs font-medium text-slate-400">
                Chưa có Ticket nào phát sinh hoặc hoàn thành trong tháng {monthLabel}.
              </p>
              <button
                type="button"
                onClick={() => setTicketScope('ALL')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                Xem thống kê tất cả Ticket →
              </button>
            </div>
          ) : (
            <div className="w-full h-[235px]">
              <ResponsiveContainer width="100%" height="100%">
                {ticketChartMode === 'BAR' ? (
                  <BarChart
                    data={severityData}
                    margin={{ top: 10, right: 12, left: -16, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis
                      dataKey="shortLabel"
                      stroke={axisStroke}
                      tick={{ fill: tickFill, fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: axisStroke }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke={axisStroke}
                      tick={{ fill: tickFill, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<SeverityTooltip isLight={isLight} />}
                      cursor={{ fill: isLight ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="total" name="Số lượng Ticket" radius={[6, 6, 0, 0]} maxBarSize={44}>
                      {severityData.map((entry) => (
                        <Cell key={`sev-bar-${entry.priority}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={nonZeroSeverityData}
                      dataKey="total"
                      nameKey="priority"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={86}
                      paddingAngle={3}
                      stroke={isLight ? '#ffffff' : '#0f172a'}
                      strokeWidth={2}
                    >
                      {nonZeroSeverityData.map((entry) => (
                        <Cell key={`sev-pie-${entry.priority}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<SeverityTooltip isLight={isLight} />} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Severity Breakdown Strip + Link */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5">
              {severityData.map((d) => {
                const cfg = SEVERITY_CONFIG.find((c) => c.priority === d.priority);
                return (
                  <span
                    key={d.priority}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
                      cfg?.pillClass || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span>{d.priority}:</span>
                    <strong className="font-mono">{d.total}</strong>
                  </span>
                );
              })}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onNavigateTab('tickets')}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300"
              >
                Mở Quản lý Tickets
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: Monthly Maintenance Status Trends */}
        <div className="xl:col-span-7 rounded-xl bg-slate-950/60 border border-slate-800 p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Xu Hướng Trạng Thái Bảo Trì Tháng {monthLabel}
                </h4>
              </div>

              <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setTrendGranularity('DAY')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    trendGranularity === 'DAY'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Theo Ngày
                </button>
                <button
                  type="button"
                  onClick={() => setTrendGranularity('WEEK')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    trendGranularity === 'WEEK'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Theo Tuần
                </button>
              </div>
            </div>

            {/* Monthly Maintenance KPI Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Đã hoàn thành</div>
                <div className="font-mono font-extrabold text-base text-emerald-400 tabular-nums">
                  {monthlyMaintenanceTotals.completed}
                </div>
              </div>
              <div className="px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Quá hạn trong tháng</div>
                <div className="font-mono font-extrabold text-base text-rose-400 tabular-nums">
                  {monthlyMaintenanceTotals.overdue}
                </div>
              </div>
              <div className="px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Tới hạn / Sắp tới</div>
                <div className="font-mono font-extrabold text-base text-amber-300 tabular-nums">
                  {monthlyMaintenanceTotals.dueOrUpcoming}
                </div>
              </div>
              <div className="px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Đúng hạn (Theo lịch)</div>
                <div className="font-mono font-extrabold text-base text-cyan-400 tabular-nums">
                  {monthlyMaintenanceTotals.onTrack}
                </div>
              </div>
            </div>
          </div>

          {/* Recharts ComposedChart: Daily/Weekly Maintenance Status Bars + Cumulative Completion Line */}
          {monthlyMaintenanceTotals.total === 0 ? (
            <div className="flex-1 min-h-[235px] flex flex-col items-center justify-center text-center space-y-2 rounded-xl bg-slate-900/50 border border-slate-800/70 p-4">
              <TrendingUp className="w-6 h-6 text-slate-500" />
              <p className="text-xs font-medium text-slate-400">
                Chưa có lịch bảo trì hoặc nhật ký thực hiện nào trong tháng {monthLabel}.
              </p>
            </div>
          ) : (
            <div className="w-full h-[235px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={activeTrendData}
                  margin={{ top: 10, right: 6, left: -16, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke={axisStroke}
                    tick={{ fill: tickFill, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={{ stroke: axisStroke }}
                    tickLine={false}
                    interval={trendGranularity === 'DAY' ? 1 : 0}
                  />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    stroke={axisStroke}
                    tick={{ fill: tickFill, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    stroke={axisStroke}
                    tick={{ fill: '#34d399', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<MaintenanceTrendTooltip isLight={isLight} />}
                    cursor={{ fill: isLight ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="daHoanThanh"
                    name="Đã hoàn thành"
                    stackId="maint"
                    fill="#10b981"
                    maxBarSize={trendGranularity === 'DAY' ? 14 : 36}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="canTheoDoi"
                    name="Cần theo dõi"
                    stackId="maint"
                    fill="#a855f7"
                    maxBarSize={trendGranularity === 'DAY' ? 14 : 36}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="quaHan"
                    name="Quá hạn"
                    stackId="maint"
                    fill="#f43f5e"
                    maxBarSize={trendGranularity === 'DAY' ? 14 : 36}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="toiHan"
                    name="Tới hạn"
                    stackId="maint"
                    fill="#f59e0b"
                    maxBarSize={trendGranularity === 'DAY' ? 14 : 36}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="sapToi"
                    name="Sắp tới"
                    stackId="maint"
                    fill="#06b6d4"
                    maxBarSize={trendGranularity === 'DAY' ? 14 : 36}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="dungHan"
                    name="Đúng hạn (Lịch)"
                    stackId="maint"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={trendGranularity === 'DAY' ? 14 : 36}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="luyKeHoanThanh"
                    name="Lũy kế hoàn thành"
                    stroke="#34d399"
                    strokeWidth={2.25}
                    dot={{ r: trendGranularity === 'DAY' ? 2 : 4, fill: '#34d399', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Custom Compact Legend + Link */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex flex-wrap items-center gap-3">
              {MAINTENANCE_SERIES.map((s) => (
                <span key={s.key} className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                  <span>{s.label}</span>
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold">
                <span className="w-3 h-0.5 bg-[#34d399] inline-block" />
                <span>Lũy kế hoàn thành</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('maintenance')}
              className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 shrink-0"
            >
              Mở Kế hoạch &amp; Lịch sử
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
