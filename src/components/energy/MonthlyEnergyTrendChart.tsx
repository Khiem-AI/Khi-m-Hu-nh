import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Power10Days, WaterMonthly } from '../../types/cmms';
import { TrendingUp, TrendingDown, Zap, Droplet, Sun, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface MonthlyEnergyTrendChartProps {
  power10Days: Power10Days[];
  waterMonthly: WaterMonthly[];
  theme: 'dark' | 'light';
}

interface MonthlyEnergyPoint {
  month: string; // YYYY-MM
  label: string; // MM/YYYY
  totalPowerKwh: number | null;
  evnKwh: number | null;
  solarKwh: number | null;
  waterM3: number | null;
  sewageM3: number | null;
  powerPeriodCount: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    value?: number | string | null;
    color?: string;
    payload?: MonthlyEnergyPoint;
  }>;
  label?: string;
  isDark: boolean;
}

const CustomTrendTooltip: React.FC<CustomTooltipProps> = ({ active, payload, isDark }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const solarPct =
    point.totalPowerKwh && point.totalPowerKwh > 0 && point.solarKwh !== null
      ? ((point.solarKwh / point.totalPowerKwh) * 100).toFixed(1)
      : null;

  return (
    <div
      className={`rounded-2xl border p-3.5 shadow-2xl text-xs min-w-[230px] space-y-2 ${
        isDark
          ? 'bg-slate-900/95 border-slate-700 text-slate-100'
          : 'bg-white/95 border-slate-300 text-slate-900'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
        <span className="font-extrabold text-sm font-mono">Tháng {point.label}</span>
        {point.powerPeriodCount > 0 && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
            {point.powerPeriodCount} kỳ điện
          </span>
        )}
      </div>

      <div className="space-y-1.5 font-mono">
        {point.totalPowerKwh !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-sans text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
              Tổng Điện:
            </span>
            <strong className="text-cyan-700 dark:text-cyan-300">
              {point.totalPowerKwh.toLocaleString('vi-VN')} kWh
            </strong>
          </div>
        )}
        {point.evnKwh !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-sans text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
              EVN Lưới:
            </span>
            <strong className="text-indigo-700 dark:text-indigo-300">
              {point.evnKwh.toLocaleString('vi-VN')} kWh
            </strong>
          </div>
        )}
        {point.solarKwh !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-sans text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              Solar{solarPct ? ` (${solarPct}%)` : ''}:
            </span>
            <strong className="text-amber-700 dark:text-amber-300">
              {point.solarKwh.toLocaleString('vi-VN')} kWh
            </strong>
          </div>
        )}
        {point.waterM3 !== null && (
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-200 dark:border-slate-800">
            <span className="flex items-center gap-1.5 font-sans text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              Nước Cấp:
            </span>
            <strong className="text-emerald-700 dark:text-emerald-300">
              {point.waterM3.toLocaleString('vi-VN')} m³
            </strong>
          </div>
        )}
      </div>
    </div>
  );
};

export const MonthlyEnergyTrendChart: React.FC<MonthlyEnergyTrendChartProps> = ({
  power10Days,
  waterMonthly,
  theme,
}) => {
  const isDark = theme === 'dark';

  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [rangeLimit, setRangeLimit] = useState<'6' | '12' | 'ALL'>('12');
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleLines, setVisibleLines] = useState({
    totalPowerKwh: true,
    evnKwh: false,
    solarKwh: true,
    waterM3: true,
  });

  // Aggregate power10Days + waterMonthly by YYYY-MM
  const { allMonthlyPoints, availableYears } = useMemo(() => {
    const map = new Map<string, MonthlyEnergyPoint>();

    const ensureMonth = (ym: string) => {
      let existing = map.get(ym);
      if (!existing) {
        const [y, m] = ym.split('-');
        existing = {
          month: ym,
          label: m && y ? `${m}/${y}` : ym,
          totalPowerKwh: null,
          evnKwh: null,
          solarKwh: null,
          waterM3: null,
          sewageM3: null,
          powerPeriodCount: 0,
        };
        map.set(ym, existing);
      }
      return existing;
    };

    power10Days.forEach((p) => {
      const ym = (p.denNgay || p.tuNgay || '').slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(ym)) return;
      const entry = ensureMonth(ym);
      const evn = (p.evnBT || 0) + (p.evnCD || 0) + (p.evnTD || 0);
      const solar = (p.solarBT || 0) + (p.solarCD || 0);
      entry.evnKwh = (entry.evnKwh || 0) + evn;
      entry.solarKwh = (entry.solarKwh || 0) + solar;
      entry.totalPowerKwh = (entry.totalPowerKwh || 0) + evn + solar;
      entry.powerPeriodCount += 1;
    });

    waterMonthly.forEach((w) => {
      const ym = (w.month || '').slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(ym)) return;
      const entry = ensureMonth(ym);
      entry.waterM3 = w.waterM3;
      entry.sewageM3 = Math.round(w.waterM3 * 0.8 * 10) / 10;
    });

    const sorted = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
    const years = Array.from(new Set(sorted.map((item) => item.month.slice(0, 4)))).sort((a, b) =>
      b.localeCompare(a)
    );

    return { allMonthlyPoints: sorted, availableYears: years };
  }, [power10Days, waterMonthly]);

  const chartData = useMemo(() => {
    const byYear =
      selectedYear === 'ALL'
        ? allMonthlyPoints
        : allMonthlyPoints.filter((pt) => pt.month.startsWith(selectedYear));

    if (rangeLimit === '6') return byYear.slice(-6);
    if (rangeLimit === '12') return byYear.slice(-12);
    return byYear;
  }, [allMonthlyPoints, selectedYear, rangeLimit]);

  // Latest vs previous month comparison
  const stats = useMemo(() => {
    const withPower = chartData.filter((d) => d.totalPowerKwh !== null);
    const withWater = chartData.filter((d) => d.waterM3 !== null);

    const latestP = withPower[withPower.length - 1];
    const prevP = withPower[withPower.length - 2];
    const powerDeltaPct =
      latestP?.totalPowerKwh && prevP?.totalPowerKwh
        ? ((latestP.totalPowerKwh - prevP.totalPowerKwh) / prevP.totalPowerKwh) * 100
        : null;

    const latestW = withWater[withWater.length - 1];
    const prevW = withWater[withWater.length - 2];
    const waterDeltaPct =
      latestW?.waterM3 && prevW?.waterM3
        ? ((latestW.waterM3 - prevW.waterM3) / prevW.waterM3) * 100
        : null;

    const solarSharePct =
      latestP?.totalPowerKwh && latestP.solarKwh !== null && latestP.totalPowerKwh > 0
        ? (latestP.solarKwh / latestP.totalPowerKwh) * 100
        : null;

    return { latestP, powerDeltaPct, latestW, waterDeltaPct, solarSharePct };
  }, [chartData]);

  const toggleLine = (key: keyof typeof visibleLines) => {
    setVisibleLines((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Ensure at least one series stays visible
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  };

  const axisStroke = isDark ? '#94a3b8' : '#475569';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-100">
              Xu Hướng Tiêu Thụ Điện &amp; Nước Hàng Tháng (Recharts)
            </h3>
            <p className="text-xs text-slate-400">
              Tổng hợp dữ liệu Điện 10 ngày theo tháng (kWh — trục trái) &amp; Nước cấp hàng tháng (m³ — trục phải)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 ml-1.5 mr-0.5" />
            <button
              type="button"
              onClick={() => setSelectedYear('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                selectedYear === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả
            </button>
            {availableYears.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  selectedYear === yr ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* Range selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            {(['6', '12', 'ALL'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setRangeLimit(opt)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  rangeLimit === opt ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt === 'ALL' ? 'Toàn bộ' : `${opt} Tháng`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title={isExpanded ? 'Thu gọn biểu đồ' : 'Mở rộng biểu đồ'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Summary MoM KPI Pills + Interactive Series Toggles */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {stats.latestP && stats.latestP.totalPowerKwh !== null && (
                <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-300">
                    Điện T.{stats.latestP.label}:{' '}
                    <strong className="font-mono text-cyan-300">
                      {stats.latestP.totalPowerKwh.toLocaleString('vi-VN')} kWh
                    </strong>
                  </span>
                  {stats.powerDeltaPct !== null && (
                    <span
                      className={`inline-flex items-center gap-0.5 font-mono font-bold text-[11px] ${
                        stats.powerDeltaPct > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {stats.powerDeltaPct > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {stats.powerDeltaPct > 0 ? '+' : ''}
                      {stats.powerDeltaPct.toFixed(1)}%
                    </span>
                  )}
                </div>
              )}

              {stats.latestW && stats.latestW.waterM3 !== null && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                  <Droplet className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">
                    Nước T.{stats.latestW.label}:{' '}
                    <strong className="font-mono text-emerald-300">
                      {stats.latestW.waterM3.toLocaleString('vi-VN')} m³
                    </strong>
                  </span>
                  {stats.waterDeltaPct !== null && (
                    <span
                      className={`inline-flex items-center gap-0.5 font-mono font-bold text-[11px] ${
                        stats.waterDeltaPct > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {stats.waterDeltaPct > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {stats.waterDeltaPct > 0 ? '+' : ''}
                      {stats.waterDeltaPct.toFixed(1)}%
                    </span>
                  )}
                </div>
              )}

              {stats.solarSharePct !== null && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-300">
                    Tỷ trọng Solar:{' '}
                    <strong className="font-mono text-amber-300">{stats.solarSharePct.toFixed(1)}%</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Interactive line visibility toggles */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => toggleLine('totalPowerKwh')}
                className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition ${
                  visibleLines.totalPowerKwh
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-500 opacity-60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
                Tổng Điện (kWh)
              </button>
              <button
                type="button"
                onClick={() => toggleLine('evnKwh')}
                className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition ${
                  visibleLines.evnKwh
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-500 opacity-60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
                EVN Lưới (kWh)
              </button>
              <button
                type="button"
                onClick={() => toggleLine('solarKwh')}
                className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition ${
                  visibleLines.solarKwh
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-500 opacity-60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                Solar (kWh)
              </button>
              <button
                type="button"
                onClick={() => toggleLine('waterM3')}
                className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition ${
                  visibleLines.waterM3
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-500 opacity-60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                Nước Cấp (m³)
              </button>
            </div>
          </div>

          {/* Recharts Dual-Axis Line Chart */}
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              Chưa có dữ liệu tiêu thụ điện/nước trong khoảng thời gian đã chọn.
            </div>
          ) : (
            <div className="w-full h-[320px] sm:h-[360px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 16, left: 4, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke={axisStroke}
                    tick={{ fill: axisStroke, fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                  />
                  <YAxis
                    yAxisId="power"
                    orientation="left"
                    stroke="#06b6d4"
                    tick={{ fill: axisStroke, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                    }
                    label={{
                      value: 'Điện (kWh)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: '#06b6d4', fontSize: 11, fontWeight: 700 },
                    }}
                  />
                  <YAxis
                    yAxisId="water"
                    orientation="right"
                    stroke="#10b981"
                    tick={{ fill: axisStroke, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                    }
                    label={{
                      value: 'Nước (m³)',
                      angle: 90,
                      position: 'insideRight',
                      style: { fill: '#10b981', fontSize: 11, fontWeight: 700 },
                    }}
                  />
                  <Tooltip content={<CustomTrendTooltip isDark={isDark} />} />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                    iconType="circle"
                  />

                  {visibleLines.totalPowerKwh && (
                    <Line
                      yAxisId="power"
                      type="monotone"
                      dataKey="totalPowerKwh"
                      name="Tổng Điện (kWh)"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ r: 3.5, strokeWidth: 2, fill: isDark ? '#0f172a' : '#ffffff' }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  )}
                  {visibleLines.evnKwh && (
                    <Line
                      yAxisId="power"
                      type="monotone"
                      dataKey="evnKwh"
                      name="EVN Lưới (kWh)"
                      stroke="#6366f1"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={{ r: 2.5 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  )}
                  {visibleLines.solarKwh && (
                    <Line
                      yAxisId="power"
                      type="monotone"
                      dataKey="solarKwh"
                      name="Solar Mặt Trời (kWh)"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 3, strokeWidth: 1.5, fill: isDark ? '#0f172a' : '#ffffff' }}
                      activeDot={{ r: 5.5 }}
                      connectNulls
                    />
                  )}
                  {visibleLines.waterM3 && (
                    <Line
                      yAxisId="water"
                      type="monotone"
                      dataKey="waterM3"
                      name="Nước Cấp (m³)"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 3.5, strokeWidth: 2, fill: isDark ? '#0f172a' : '#ffffff' }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
};
