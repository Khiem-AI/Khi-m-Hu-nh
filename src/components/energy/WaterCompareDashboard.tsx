import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { WaterMonthly, MeterReading, WATER_DAILY_METERS } from '../../types/cmms';
import { useCMMS } from '../../context/CMMSContext';
import { canViewCosts, formatVND } from '../../utils/cmmsLogic';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  Droplet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Download,
  Plus,
  Table2,
  Gauge,
} from 'lucide-react';

interface WaterCompareDashboardProps {
  waterMonthly: WaterMonthly[];
  meterReadings: MeterReading[];
  onOpenWaterModal: (mode: 'daily' | 'monthly') => void;
  onGoToWaterTable: () => void;
}

interface SvgDonutSlice {
  label: string;
  value: number;
  color: string;
  formattedValue: string;
  subLabel?: string;
}

const WaterDonutChart: React.FC<{
  slices: SvgDonutSlice[];
  centerLabel: string;
  centerSub: string;
}> = ({ slices, centerLabel, centerSub }) => {
  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const size = 160;
  const radius = 58;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 160 160" className="-rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            className="donut-track"
          />
          {total > 0 &&
            slices.map((slice, idx) => {
              const pct = Math.max(0, slice.value) / total;
              const dashLen = pct * circumference;
              const dashOffset = -accumulated * circumference;
              accumulated += pct;
              return (
                <circle
                  key={idx}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  className="transition-opacity duration-200 hover:opacity-85"
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          <span className="text-sm font-extrabold text-slate-100 font-mono tabular-nums leading-tight">
            {centerLabel}
          </span>
          <span className="text-[11px] text-slate-400 font-medium mt-0.5">{centerSub}</span>
        </div>
      </div>

      <div className="flex-1 w-full min-w-0 space-y-2.5">
        {slices.map((slice, idx) => {
          const pct = total > 0 ? ((slice.value / total) * 100).toFixed(1) : '0.0';
          return (
            <div key={idx} className="space-y-0.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-slate-200 font-medium truncate">{slice.label}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono tabular-nums shrink-0">
                  <span className="text-slate-100 font-bold">{slice.formattedValue}</span>
                  <span className="text-slate-400 text-[11px] w-12 text-right">({pct}%)</span>
                </div>
              </div>
              {slice.subLabel && (
                <p className="text-[11px] text-slate-400 pl-4.5 truncate">{slice.subLabel}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

function formatDeltaBadge(curr: number, prev: number) {
  if (!prev || prev === 0) {
    return { label: 'Không có kỳ gốc', pctText: '—', direction: 'flat' as const };
  }
  const diff = curr - prev;
  const pct = (diff / prev) * 100;
  const sign = diff > 0 ? '+' : '';
  return {
    label: `${sign}${pct.toFixed(1)}%`,
    pctText: `${sign}${pct.toFixed(1)}%`,
    direction: diff > 0 ? ('up' as const) : diff < 0 ? ('down' as const) : ('flat' as const),
  };
}

function isWaterReading(r: MeterReading): boolean {
  const unit = (r.donVi || '').toLowerCase();
  const src = (r.nguon || '').toLowerCase();
  return unit.includes('m3') || unit.includes('m³') || src.includes('nước') || src.includes('nuoc');
}

function shortMeterLabel(name: string): string {
  if (name.includes('(P1)')) return 'P1 - Nước Tổng';
  if (name.includes('(P2)')) return 'P2 - Tưới Cỏ';
  if (name.includes('CHILLER')) return 'Nước Chiller';
  if (name.includes('rửa ngược')) return 'DI Rửa Ngược';
  if (name.includes('xả tràn')) return 'DI Xả Tràn T103';
  if (name.includes('HỆ NƯỚC UỐNG')) return 'Hệ Nước Uống';
  if (name.includes('THẢI ĐẦU RA')) return 'Nước Thải Đầu Ra';
  if (name.includes('NƯỚC DI')) return 'Hệ Nước DI';
  return name.replace(/\s*\(m3\)\s*/gi, '').trim();
}

export const WaterCompareDashboard: React.FC<WaterCompareDashboardProps> = ({
  waterMonthly,
  meterReadings,
  onOpenWaterModal,
  onGoToWaterTable,
}) => {
  const { theme, tariffConfig, currentUser } = useCMMS();
  const isDark = theme === 'dark';
  const showCosts = canViewCosts(currentUser);

  const [viewMode, setViewMode] = useState<
    'overview_cost' | 'month_vs_month' | 'yearly_yoy' | 'daily_meters'
  >('overview_cost');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [overviewMetric, setOverviewMetric] = useState<'volume' | 'costVND' | 'costUSD'>('volume');
  const [yoyMetric, setYoyMetric] = useState<'waterM3' | 'totalCostVND' | 'totalCostUSD'>('waterM3');

  // Sort monthly records descending (newest first) & ascending (chronological)
  const sortedDesc = useMemo(
    () => [...waterMonthly].sort((a, b) => b.month.localeCompare(a.month)),
    [waterMonthly]
  );
  const sortedAsc = useMemo(
    () => [...waterMonthly].sort((a, b) => a.month.localeCompare(b.month)),
    [waterMonthly]
  );

  const availableYears = useMemo(() => {
    const set = new Set<string>();
    sortedDesc.forEach((w) => {
      const y = w.month.slice(0, 4);
      if (/^\d{4}$/.test(y)) set.add(y);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [sortedDesc]);

  const filteredAsc = useMemo(() => {
    if (yearFilter === 'ALL') return sortedAsc;
    return sortedAsc.filter((w) => w.month.startsWith(yearFilter));
  }, [sortedAsc, yearFilter]);

  // Aggregate KPI totals for selected filter
  const kpi = useMemo(() => {
    const count = filteredAsc.length;
    const totalWaterM3 = filteredAsc.reduce((s, w) => s + w.waterM3, 0);
    const totalSewageM3 = Math.round(totalWaterM3 * 0.8 * 10) / 10;
    const totalWaterVND = filteredAsc.reduce((s, w) => s + w.waterVND, 0);
    const totalWaterUSD = filteredAsc.reduce((s, w) => s + w.waterUSD, 0);
    const totalSewageVND = filteredAsc.reduce((s, w) => s + w.sewageVND, 0);
    const totalSewageUSD = filteredAsc.reduce((s, w) => s + w.sewageUSD, 0);
    const totalCombinedVND = totalWaterVND + totalSewageVND;
    const totalCombinedUSD = totalWaterUSD + totalSewageUSD;
    const avgM3 = count > 0 ? Math.round(totalWaterM3 / count) : 0;
    const avgCostPerM3VND = totalWaterM3 > 0 ? Math.round(totalCombinedVND / totalWaterM3) : 0;

    let peak: WaterMonthly | null = null;
    let trough: WaterMonthly | null = null;
    for (const w of filteredAsc) {
      if (!peak || w.waterM3 > peak.waterM3) peak = w;
      if (!trough || w.waterM3 < trough.waterM3) trough = w;
    }

    const latest = filteredAsc[filteredAsc.length - 1] || null;
    const prev = filteredAsc[filteredAsc.length - 2] || null;

    return {
      count,
      totalWaterM3,
      totalSewageM3,
      totalWaterVND,
      totalWaterUSD,
      totalSewageVND,
      totalSewageUSD,
      totalCombinedVND,
      totalCombinedUSD,
      avgM3,
      avgCostPerM3VND,
      peak,
      trough,
      latest,
      prev,
    };
  }, [filteredAsc]);

  // Month A vs Month B selection
  const [monthAKey, setMonthAKey] = useState<string>(() => sortedDesc[0]?.month || '');
  const [monthBKey, setMonthBKey] = useState<string>(
    () => sortedDesc[1]?.month || sortedDesc[0]?.month || ''
  );

  const monthA = useMemo(
    () => sortedDesc.find((w) => w.month === monthAKey) || sortedDesc[0] || null,
    [sortedDesc, monthAKey]
  );
  const monthB = useMemo(
    () => sortedDesc.find((w) => w.month === monthBKey) || sortedDesc[1] || sortedDesc[0] || null,
    [sortedDesc, monthBKey]
  );

  const applyPresetMoM = () => {
    if (sortedDesc[0]) setMonthAKey(sortedDesc[0].month);
    if (sortedDesc[1]) setMonthBKey(sortedDesc[1].month);
  };

  const applyPresetYoY = () => {
    const latest = sortedDesc[0];
    if (!latest) return;
    setMonthAKey(latest.month);
    const [y, m] = latest.month.split('-');
    const prevYearMonth = `${Number(y) - 1}-${m}`;
    const match = sortedDesc.find((w) => w.month === prevYearMonth);
    setMonthBKey(match ? match.month : sortedDesc[1]?.month || latest.month);
  };

  const applyPresetPeakVsLow = () => {
    if (sortedDesc.length === 0) return;
    let hi = sortedDesc[0];
    let lo = sortedDesc[0];
    sortedDesc.forEach((w) => {
      if (w.waterM3 > hi.waterM3) hi = w;
      if (w.waterM3 < lo.waterM3) lo = w;
    });
    setMonthAKey(hi.month);
    setMonthBKey(lo.month);
  };

  // Overview monthly chart data
  const overviewChartData = useMemo(() => {
    return filteredAsc.map((w) => {
      const [y, m] = w.month.split('-');
      return {
        month: w.month,
        label: m && y ? `${m}/${y.slice(2)}` : w.month,
        fullLabel: m && y ? `Tháng ${m}/${y}` : w.month,
        waterM3: w.waterM3,
        sewageM3: Math.round(w.waterM3 * 0.8 * 10) / 10,
        waterVNDMil: Math.round((w.waterVND / 1_000_000) * 100) / 100,
        sewageVNDMil: Math.round((w.sewageVND / 1_000_000) * 100) / 100,
        totalVNDMil: Math.round(((w.waterVND + w.sewageVND) / 1_000_000) * 100) / 100,
        waterUSD: w.waterUSD,
        sewageUSD: w.sewageUSD,
        totalUSD: w.waterUSD + w.sewageUSD,
        waterVND: w.waterVND,
        sewageVND: w.sewageVND,
      };
    });
  }, [filteredAsc]);

  // Month A vs Month B comparison bar chart data
  const monthCompareBarData = useMemo(() => {
    if (!monthA || !monthB) return [];
    const totalA = monthA.waterVND + monthA.sewageVND;
    const totalB = monthB.waterVND + monthB.sewageVND;
    const volumeRows = [
      {
        metric: 'Nước Cấp (m³)',
        A: monthA.waterM3,
        B: monthB.waterM3,
      },
      {
        metric: 'Nước Thải 80% (m³)',
        A: Math.round(monthA.waterM3 * 0.8),
        B: Math.round(monthB.waterM3 * 0.8),
      },
    ];
    if (!showCosts) return volumeRows;
    return [
      ...volumeRows,
      {
        metric: 'Tiền Nước (Tr.đ)',
        A: Math.round((monthA.waterVND / 1_000_000) * 10) / 10,
        B: Math.round((monthB.waterVND / 1_000_000) * 10) / 10,
      },
      {
        metric: 'Phí Thải (Tr.đ)',
        A: Math.round((monthA.sewageVND / 1_000_000) * 10) / 10,
        B: Math.round((monthB.sewageVND / 1_000_000) * 10) / 10,
      },
      {
        metric: 'Tổng Chi Phí (Tr.đ)',
        A: Math.round((totalA / 1_000_000) * 10) / 10,
        B: Math.round((totalB / 1_000_000) * 10) / 10,
      },
    ];
  }, [monthA, monthB, showCosts]);

  // Yearly YoY (Month 01..12 overlaid for 2024, 2025, 2026)
  const { yoyChartData, yearlySummary } = useMemo(() => {
    const byYear = new Map<
      string,
      {
        year: string;
        months: number;
        totalM3: number;
        totalSewageM3: number;
        waterVND: number;
        sewageVND: number;
        waterUSD: number;
        sewageUSD: number;
        peak: WaterMonthly | null;
      }
    >();

    const lookup = new Map<string, WaterMonthly>();
    waterMonthly.forEach((w) => {
      lookup.set(w.month, w);
      const y = w.month.slice(0, 4);
      const curr = byYear.get(y) || {
        year: y,
        months: 0,
        totalM3: 0,
        totalSewageM3: 0,
        waterVND: 0,
        sewageVND: 0,
        waterUSD: 0,
        sewageUSD: 0,
        peak: null,
      };
      curr.months += 1;
      curr.totalM3 += w.waterM3;
      curr.totalSewageM3 += w.waterM3 * 0.8;
      curr.waterVND += w.waterVND;
      curr.sewageVND += w.sewageVND;
      curr.waterUSD += w.waterUSD;
      curr.sewageUSD += w.sewageUSD;
      if (!curr.peak || w.waterM3 > curr.peak.waterM3) curr.peak = w;
      byYear.set(y, curr);
    });

    const yearsSortedAsc = Array.from(byYear.keys()).sort((a, b) => a.localeCompare(b));
    const yoyData = Array.from({ length: 12 }, (_, idx) => {
      const mm = String(idx + 1).padStart(2, '0');
      const row: Record<string, string | number | null> = {
        monthNum: mm,
        label: `T${mm}`,
      };
      yearsSortedAsc.forEach((y) => {
        const rec = lookup.get(`${y}-${mm}`);
        if (!rec) {
          row[`y${y}`] = null;
        } else if (!showCosts || yoyMetric === 'waterM3') {
          row[`y${y}`] = rec.waterM3;
        } else if (yoyMetric === 'totalCostVND') {
          row[`y${y}`] = Math.round(((rec.waterVND + rec.sewageVND) / 1_000_000) * 100) / 100;
        } else {
          row[`y${y}`] = rec.waterUSD + rec.sewageUSD;
        }
      });
      return row;
    });

    const summaries = yearsSortedAsc.map((y, idx) => {
      const s = byYear.get(y)!;
      const prevYear = idx > 0 ? byYear.get(yearsSortedAsc[idx - 1]) : undefined;
      const avgM3 = s.months > 0 ? Math.round(s.totalM3 / s.months) : 0;
      const prevAvgM3 = prevYear && prevYear.months > 0 ? Math.round(prevYear.totalM3 / prevYear.months) : 0;
      const avgDeltaPct =
        prevAvgM3 > 0 ? ((avgM3 - prevAvgM3) / prevAvgM3) * 100 : null;
      return {
        ...s,
        avgM3,
        combinedVND: s.waterVND + s.sewageVND,
        combinedUSD: s.waterUSD + s.sewageUSD,
        avgDeltaPct,
      };
    });

    return { yoyChartData: yoyData, yearlySummary: summaries.reverse() };
  }, [waterMonthly, yoyMetric, showCosts]);

  // Daily water meters (P1 - P8) from meterReadings
  const waterDailyReadings = useMemo(
    () =>
      meterReadings
        .filter(isWaterReading)
        .sort((a, b) => (b.ngayChot || '').localeCompare(a.ngayChot || '')),
    [meterReadings]
  );

  const availableDailyDates = useMemo(() => {
    const dates = new Set<string>();
    waterDailyReadings.forEach((r) => {
      if (r.ngayChot) dates.add(r.ngayChot);
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [waterDailyReadings]);

  const [selectedDailyDate, setSelectedDailyDate] = useState<string>(
    () => availableDailyDates[0] || 'ALL'
  );

  const effectiveDailyDate =
    selectedDailyDate === 'ALL'
      ? 'ALL'
      : availableDailyDates.includes(selectedDailyDate)
      ? selectedDailyDate
      : availableDailyDates[0] || 'ALL';

  const dailyMeterBreakdown = useMemo(() => {
    const scoped =
      effectiveDailyDate === 'ALL'
        ? waterDailyReadings
        : waterDailyReadings.filter((r) => r.ngayChot === effectiveDailyDate);

    const byMeter = new Map<string, number>();
    scoped.forEach((r) => {
      byMeter.set(r.tenDongHo, (byMeter.get(r.tenDongHo) || 0) + (r.tieuThu || 0));
    });

    const p1 = byMeter.get('ĐỒNG HỒ NƯỚC TỔNG (P1) (m3)') || 0;
    const p2 = byMeter.get('ĐỒNG HỒ NƯỚC TƯỚI CỎ (P2) (m3)') || 0;
    const domesticNet = Math.max(0, p1 - p2);
    const chiller = byMeter.get('ĐỒNG HỒ NƯỚC CHILLER (m3)') || 0;
    const di = byMeter.get('ĐỒNG HỒ NƯỚC DI (m3)') || 0;
    const drinking = byMeter.get('ĐỒNG HỒ NƯỚC HỆ NƯỚC UỐNG (m3)') || 0;
    const sewageOut = byMeter.get('ĐỒNG HỒ NƯỚC THẢI ĐẦU RA (m3)') || 0;
    const diBackwash = byMeter.get('ĐỒNG HỒ NƯỚC THẢI ĐẦU RA DI rửa ngược (m3)') || 0;
    const diOverflow = byMeter.get('ĐỒNG HỒ NƯỚC THẢI ĐẦU RA DI xả tràn T103 (m3)') || 0;

    const bars = [
      { name: 'P1 Tổng', value: p1, group: 'Cấp' },
      { name: 'Sinh Hoạt (P1-P2)', value: domesticNet, group: 'Cấp' },
      { name: 'P2 Tưới Cỏ', value: p2, group: 'Cấp' },
      { name: 'Chiller', value: chiller, group: 'Sản xuất' },
      { name: 'Hệ Nước DI', value: di, group: 'Sản xuất' },
      { name: 'Nước Uống', value: drinking, group: 'Sinh hoạt' },
      { name: 'Thải Đầu Ra', value: sewageOut, group: 'Thải' },
      { name: 'DI Rửa Ngược', value: diBackwash, group: 'Thải' },
      { name: 'DI Xả Tràn', value: diOverflow, group: 'Thải' },
    ];

    // Also include any custom meter names not in standard 8
    WATER_DAILY_METERS.forEach((name) => {
      if (!byMeter.has(name)) return;
    });
    const extraMeters: { name: string; value: number }[] = [];
    byMeter.forEach((val, key) => {
      if (!(WATER_DAILY_METERS as readonly string[]).includes(key)) {
        extraMeters.push({ name: shortMeterLabel(key), value: val });
      }
    });

    const sewageActualPct = domesticNet > 0 ? (sewageOut / domesticNet) * 100 : null;

    return {
      recordCount: scoped.length,
      p1,
      p2,
      domesticNet,
      chiller,
      di,
      drinking,
      sewageOut,
      diBackwash,
      diOverflow,
      sewageActualPct,
      bars: [...bars, ...extraMeters.map((e) => ({ ...e, group: 'Khác' }))],
    };
  }, [waterDailyReadings, effectiveDailyDate]);

  const handleExportComparisonCSV = () => {
    const headers = [
      'Thang',
      'Nuoc Cap (m3)',
      'Nuoc Thai 80% (m3)',
      ...(showCosts
        ? [
            'Tien Nuoc (VND)',
            'Tien Nuoc (USD)',
            'Phi Thai (VND)',
            'Phi Thai (USD)',
            'Tong Chi Phi (VND)',
            'Tong Chi Phi (USD)',
          ]
        : []),
    ];
    const rows = filteredAsc.map((w) => [
      w.month,
      w.waterM3,
      Math.round(w.waterM3 * 0.8 * 10) / 10,
      ...(showCosts
        ? [
            w.waterVND,
            w.waterUSD,
            w.sewageVND,
            w.sewageUSD,
            w.waterVND + w.sewageVND,
            w.waterUSD + w.sewageUSD,
          ]
        : []),
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dashboard_So_Sanh_Nuoc_${yearFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const axisStroke = isDark ? '#94a3b8' : '#475569';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderColor: isDark ? '#334155' : '#cbd5e1',
    borderRadius: '12px',
    fontSize: '12px',
    color: isDark ? '#f1f5f9' : '#0f172a',
  };

  const latestVsPrevDelta =
    kpi.latest && kpi.prev ? formatDeltaBadge(kpi.latest.waterM3, kpi.prev.waterM3) : null;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-100">
            Dashboard &amp; Biểu Đồ So Sánh Hệ Thống Quản Lý Nước
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>Sheet Nuoc_month: {waterMonthly.length} tháng</span>
            <span aria-hidden="true">·</span>
            <span>Nhật ký P1–P8: {waterDailyReadings.length} bản ghi</span>
            {showCosts && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  Đơn giá cấp {formatVND(tariffConfig.waterVNDPerM3)}/m³ · thải{' '}
                  {formatVND(tariffConfig.sewageVNDPerM3)}/m³ (80%)
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenWaterModal('daily')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition whitespace-nowrap shrink-0"
          >
            <Droplet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chốt Đồng Hồ P1–P8</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenWaterModal('monthly')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Chốt Nước Tháng</span>
          </button>
          <button
            type="button"
            onClick={onGoToWaterTable}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition whitespace-nowrap shrink-0"
          >
            <Table2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Bảng Nuoc_month</span>
          </button>
          <button
            type="button"
            onClick={handleExportComparisonCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Strip (Single-Elevation, Tabular Numerals) */}
      <div className={`grid grid-cols-1 ${showCosts ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'} gap-4`}>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-400">
            Tổng Nước Cấp ({kpi.count} tháng)
          </span>
          <div className="text-xl font-extrabold text-cyan-400 font-mono tabular-nums">
            {kpi.totalWaterM3.toLocaleString('vi-VN')}{' '}
            <span className="text-xs font-normal text-slate-400">m³</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
            TB {kpi.avgM3.toLocaleString('vi-VN')} m³/tháng
            {kpi.peak ? ` · Đỉnh ${kpi.peak.month} (${kpi.peak.waterM3.toLocaleString()} m³)` : ''}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-400">
            Nước Thải Quy Chuẩn (80%)
          </span>
          <div className="text-xl font-extrabold text-amber-300 font-mono tabular-nums">
            {Math.round(kpi.totalSewageM3).toLocaleString('vi-VN')}{' '}
            <span className="text-xs font-normal text-slate-400">m³</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
            {showCosts ? `Suất chi phí: ${formatVND(kpi.avgCostPerM3VND)}/m³ cấp` : 'Tính theo 80% lượng nước cấp'}
          </div>
        </div>

        {showCosts && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs font-medium text-slate-400">
              Tổng Chi Phí Nước &amp; Thải
            </span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono tabular-nums">
              {formatVND(kpi.totalCombinedVND)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono tabular-nums">
              ${kpi.totalCombinedUSD.toLocaleString('vi-VN')} USD · Cấp{' '}
              {kpi.totalCombinedVND > 0
                ? ((kpi.totalWaterVND / kpi.totalCombinedVND) * 100).toFixed(1)
                : '0.0'}
              %
            </div>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-400">
            Tháng Gần Nhất ({kpi.latest?.month || '—'})
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-slate-100 font-mono tabular-nums">
              {kpi.latest ? kpi.latest.waterM3.toLocaleString('vi-VN') : 0}{' '}
              <span className="text-xs font-normal text-slate-400">m³</span>
            </span>
            {latestVsPrevDelta && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-bold font-mono tabular-nums ${
                  latestVsPrevDelta.direction === 'up'
                    ? 'text-rose-400'
                    : latestVsPrevDelta.direction === 'down'
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                {latestVsPrevDelta.direction === 'up' ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : latestVsPrevDelta.direction === 'down' ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : null}
                {latestVsPrevDelta.pctText} vs {kpi.prev?.month}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
            {kpi.latest
              ? showCosts
                ? `${formatVND(kpi.latest.waterVND + kpi.latest.sewageVND)} ($${(
                    kpi.latest.waterUSD + kpi.latest.sewageUSD
                  ).toLocaleString()} USD)`
                : `Nước thải 80%: ${Math.round(kpi.latest.waterM3 * 0.8).toLocaleString('vi-VN')} m³`
              : 'Chưa có bản ghi'}
          </div>
        </div>
      </div>

      {/* Sub-mode Segmented Switcher & Year Filter */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode('overview_cost')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === 'overview_cost'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {showCosts ? 'Tổng Quan & Chi Phí' : 'Tổng Quan Sản Lượng'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month_vs_month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === 'month_vs_month'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            So Sánh Tháng A vs B
          </button>
          <button
            type="button"
            onClick={() => setViewMode('yearly_yoy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === 'yearly_yoy'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            So Sánh Theo Năm (YoY)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('daily_meters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === 'daily_meters'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            Đồng Hồ P1–P8 ({waterDailyReadings.length})
          </button>
        </div>

        {/* Year Filter */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700 self-start xl:self-auto">
          <button
            type="button"
            onClick={() => setYearFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
              yearFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Tất Cả ({waterMonthly.length})
          </button>
          {availableYears.map((y) => {
            const cnt = waterMonthly.filter((w) => w.month.startsWith(y)).length;
            return (
              <button
                key={y}
                type="button"
                onClick={() => setYearFilter(y)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  yearFilter === y
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {y} ({cnt})
              </button>
            );
          })}
        </div>
      </div>

      {/* MODE 1: OVERVIEW & COST STRUCTURE */}
      {viewMode === 'overview_cost' && (
        <div className="space-y-6">
          {/* Monthly Water Volume / Cost Comparison Chart */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  Biểu Đồ So Sánh Nước Cấp &amp; Nước Thải Theo Tháng ({overviewChartData.length} Tháng)
                </h4>
                <p className="text-xs text-slate-400">
                  {showCosts
                    ? 'So sánh trực quan sản lượng cấp/thải (m³) hoặc cơ cấu chi phí VNĐ / USD từng tháng'
                    : 'So sánh trực quan sản lượng nước cấp và nước thải 80% (m³) từng tháng'}
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/80 border border-slate-700 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setOverviewMetric('volume')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
                    !showCosts || overviewMetric === 'volume'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Thể Tích (m³)
                </button>
                {showCosts && (
                  <>
                    <button
                      type="button"
                      onClick={() => setOverviewMetric('costVND')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
                        overviewMetric === 'costVND'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      Chi Phí (Tr. VNĐ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverviewMetric('costUSD')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
                        overviewMetric === 'costUSD'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      Chi Phí (USD)
                    </button>
                  </>
                )}
              </div>
            </div>

            {overviewChartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-xs text-slate-400">
                <p>Chưa có dữ liệu nước tháng cho bộ lọc đã chọn.</p>
                <button
                  type="button"
                  onClick={() => onOpenWaterModal('monthly')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
                >
                  Chốt Nước Tháng Đầu Tiên
                </button>
              </div>
            ) : (
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  {!showCosts || overviewMetric === 'volume' ? (
                    <ComposedChart
                      data={overviewChartData}
                      margin={{ top: 10, right: 16, left: 4, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke={axisStroke}
                        tick={{ fill: axisStroke, fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={axisStroke}
                        tick={{ fill: axisStroke, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `${v.toLocaleString('vi-VN')}`}
                      />
                      <RechartsTooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                      <Bar
                        dataKey="waterM3"
                        name="Nước Cấp (m³)"
                        fill="#06b6d4"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={26}
                      />
                      <Bar
                        dataKey="sewageM3"
                        name="Nước Thải 80% (m³)"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={26}
                      />
                    </ComposedChart>
                  ) : overviewMetric === 'costVND' ? (
                    <BarChart
                      data={overviewChartData}
                      margin={{ top: 10, right: 16, left: 4, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke={axisStroke}
                        tick={{ fill: axisStroke, fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={axisStroke}
                        tick={{ fill: axisStroke, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `${v} Tr`}
                      />
                      <RechartsTooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                      <Bar
                        dataKey="waterVNDMil"
                        name="Tiền Nước Cấp (Tr. VNĐ)"
                        stackId="costVND"
                        fill="#10b981"
                        maxBarSize={28}
                      />
                      <Bar
                        dataKey="sewageVNDMil"
                        name="Phí Nước Thải (Tr. VNĐ)"
                        stackId="costVND"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  ) : (
                    <BarChart
                      data={overviewChartData}
                      margin={{ top: 10, right: 16, left: 4, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke={axisStroke}
                        tick={{ fill: axisStroke, fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={axisStroke}
                        tick={{ fill: axisStroke, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `$${v.toLocaleString('vi-VN')}`}
                      />
                      <RechartsTooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                      <Bar
                        dataKey="waterUSD"
                        name="Tiền Nước Cấp (USD)"
                        stackId="costUSD"
                        fill="#3b82f6"
                        maxBarSize={28}
                      />
                      <Bar
                        dataKey="sewageUSD"
                        name="Phí Nước Thải (USD)"
                        stackId="costUSD"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Donut Breakdown Cards */}
          <div className={`grid grid-cols-1 ${showCosts ? 'lg:grid-cols-2' : ''} gap-6`}>
            {showCosts && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="text-sm font-bold text-slate-100">
                    Tỷ Trọng Chi Phí Nước Cấp vs Phí Xử Lý Nước Thải
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    {yearFilter === 'ALL' ? 'Toàn kỳ' : `Năm ${yearFilter}`}
                  </span>
                </div>

                <WaterDonutChart
                  centerLabel={`${Math.round(kpi.totalCombinedVND / 1_000_000).toLocaleString()} Tr`}
                  centerSub={`$${kpi.totalCombinedUSD.toLocaleString()} USD`}
                  slices={[
                    {
                      label: 'Tiền Nước Cấp',
                      value: kpi.totalWaterVND,
                      color: '#10b981',
                      formattedValue: `${(kpi.totalWaterVND / 1_000_000).toFixed(1)} Tr`,
                      subLabel: `${formatVND(kpi.totalWaterVND)} · $${kpi.totalWaterUSD.toLocaleString()} USD`,
                    },
                    {
                      label: 'Phí Nước Thải (80%)',
                      value: kpi.totalSewageVND,
                      color: '#f59e0b',
                      formattedValue: `${(kpi.totalSewageVND / 1_000_000).toFixed(1)} Tr`,
                      subLabel: `${formatVND(kpi.totalSewageVND)} · $${kpi.totalSewageUSD.toLocaleString()} USD`,
                    },
                  ]}
                />
              </div>
            )}

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="text-sm font-bold text-slate-100">
                  Phân Bổ Theo Đồng Hồ Hàng Ngày (P1–P8)
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  {effectiveDailyDate === 'ALL' ? 'Tất cả ngày' : effectiveDailyDate || 'Chưa có'}
                </span>
              </div>

              {dailyMeterBreakdown.p1 === 0 &&
              dailyMeterBreakdown.chiller === 0 &&
              dailyMeterBreakdown.di === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-center text-xs text-slate-400">
                  <p>Chưa có bản ghi đồng hồ nước hàng ngày (P1–P8) để phân bổ tỷ trọng.</p>
                  <button
                    type="button"
                    onClick={() => onOpenWaterModal('daily')}
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 text-white font-semibold text-xs"
                  >
                    Chốt 8 Đồng Hồ Nước Ngay
                  </button>
                </div>
              ) : (
                <WaterDonutChart
                  centerLabel={`${dailyMeterBreakdown.p1.toLocaleString()} m³`}
                  centerSub="P1 Nước Tổng"
                  slices={[
                    {
                      label: 'Nước Sinh Hoạt (P1 - P2)',
                      value: dailyMeterBreakdown.domesticNet,
                      color: '#06b6d4',
                      formattedValue: `${dailyMeterBreakdown.domesticNet.toLocaleString()} m³`,
                    },
                    {
                      label: 'Nước Tưới Cỏ (P2)',
                      value: dailyMeterBreakdown.p2,
                      color: '#10b981',
                      formattedValue: `${dailyMeterBreakdown.p2.toLocaleString()} m³`,
                    },
                    {
                      label: 'Nước Chiller',
                      value: dailyMeterBreakdown.chiller,
                      color: '#6366f1',
                      formattedValue: `${dailyMeterBreakdown.chiller.toLocaleString()} m³`,
                    },
                    {
                      label: 'Hệ Nước DI & Nước Uống',
                      value: dailyMeterBreakdown.di + dailyMeterBreakdown.drinking,
                      color: '#f59e0b',
                      formattedValue: `${(
                        dailyMeterBreakdown.di + dailyMeterBreakdown.drinking
                      ).toLocaleString()} m³`,
                    },
                  ]}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: MONTH A VS MONTH B */}
      {viewMode === 'month_vs_month' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  So Sánh Trực Tiếp Hai Tháng Bất Kỳ (Tháng A vs Tháng B)
                </h4>
                <p className="text-xs text-slate-400">
                  {showCosts
                    ? 'Chọn nhanh hoặc chọn 2 tháng để đối chiếu chênh lệch lượng nước cấp, nước thải 80% và chi phí VNĐ/USD'
                    : 'Chọn nhanh hoặc chọn 2 tháng để đối chiếu chênh lệch lượng nước cấp và nước thải 80% (m³)'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={applyPresetMoM}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition whitespace-nowrap shrink-0"
                >
                  Tháng Mới vs Tháng Trước
                </button>
                <button
                  type="button"
                  onClick={applyPresetYoY}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition whitespace-nowrap shrink-0"
                >
                  Cùng Kỳ Năm Trước (YoY)
                </button>
                <button
                  type="button"
                  onClick={applyPresetPeakVsLow}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition whitespace-nowrap shrink-0"
                >
                  Tháng Cao Điểm vs Thấp Điểm
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cyan-400">Tháng A (Mục tiêu)</label>
                <select
                  value={monthA?.month || ''}
                  onChange={(e) => setMonthAKey(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-100"
                >
                  {sortedDesc.map((w) => (
                    <option key={w.month} value={w.month}>
                      {w.month} — {w.waterM3.toLocaleString()} m³{showCosts ? ` (${formatVND(w.waterVND + w.sewageVND)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-400">Tháng B (Đối chiếu)</label>
                <select
                  value={monthB?.month || ''}
                  onChange={(e) => setMonthBKey(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-100"
                >
                  {sortedDesc.map((w) => (
                    <option key={w.month} value={w.month}>
                      {w.month} — {w.waterM3.toLocaleString()} m³{showCosts ? ` (${formatVND(w.waterVND + w.sewageVND)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {monthA && monthB && (
              <>
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${showCosts ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4 pt-2`}>
                  {[
                    {
                      title: 'Nước Cấp (m³)',
                      aVal: `${monthA.waterM3.toLocaleString()} m³`,
                      bVal: `${monthB.waterM3.toLocaleString()} m³`,
                      delta: formatDeltaBadge(monthA.waterM3, monthB.waterM3),
                    },
                    {
                      title: 'Nước Thải 80% (m³)',
                      aVal: `${(Math.round(monthA.waterM3 * 0.8 * 10) / 10).toLocaleString()} m³`,
                      bVal: `${(Math.round(monthB.waterM3 * 0.8 * 10) / 10).toLocaleString()} m³`,
                      delta: formatDeltaBadge(monthA.waterM3 * 0.8, monthB.waterM3 * 0.8),
                    },
                    ...(showCosts
                      ? [
                          {
                            title: 'Tổng Chi Phí (VNĐ)',
                            aVal: formatVND(monthA.waterVND + monthA.sewageVND),
                            bVal: formatVND(monthB.waterVND + monthB.sewageVND),
                            delta: formatDeltaBadge(
                              monthA.waterVND + monthA.sewageVND,
                              monthB.waterVND + monthB.sewageVND
                            ),
                          },
                          {
                            title: 'Tổng Quy Đổi (USD)',
                            aVal: `$${(monthA.waterUSD + monthA.sewageUSD).toLocaleString()} USD`,
                            bVal: `$${(monthB.waterUSD + monthB.sewageUSD).toLocaleString()} USD`,
                            delta: formatDeltaBadge(
                              monthA.waterUSD + monthA.sewageUSD,
                              monthB.waterUSD + monthB.sewageUSD
                            ),
                          },
                        ]
                      : []),
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-300">{item.title}</span>
                        <span
                          className={`text-xs font-bold font-mono tabular-nums ${
                            item.delta.direction === 'up'
                              ? 'text-rose-400'
                              : item.delta.direction === 'down'
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.delta.pctText}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs font-mono tabular-nums">
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-400">A ({monthA.month}):</span>
                          <strong className="text-slate-100">{item.aVal}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400">B ({monthB.month}):</span>
                          <span className="text-slate-300">{item.bVal}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grouped Bar Chart comparing Month A vs Month B */}
                <div className="w-full h-[300px] pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthCompareBarData}
                      margin={{ top: 10, right: 16, left: 4, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis
                        dataKey="metric"
                        stroke={axisStroke}
                        tick={{ fill: axisStroke, fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={axisStroke}
                        tick={{ fill: axisStroke, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                      <Bar
                        dataKey="A"
                        name={`Tháng A (${monthA.month})`}
                        fill="#06b6d4"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        dataKey="B"
                        name={`Tháng B (${monthB.month})`}
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODE 3: YEARLY YOY COMPARISON */}
      {viewMode === 'yearly_yoy' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  Biểu Đồ So Sánh Cùng Kỳ Giữa Các Năm (2024 vs 2025 vs 2026)
                </h4>
                <p className="text-xs text-slate-400">
                  Đối chiếu biến động từng tháng từ T01 đến T12 giữa các năm vận hành
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/80 border border-slate-700 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setYoyMetric('waterM3')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
                    !showCosts || yoyMetric === 'waterM3'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Nước Cấp (m³)
                </button>
                {showCosts && (
                  <>
                    <button
                      type="button"
                      onClick={() => setYoyMetric('totalCostVND')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
                        yoyMetric === 'totalCostVND'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      Tổng Tiền (Tr. VNĐ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setYoyMetric('totalCostUSD')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
                        yoyMetric === 'totalCostUSD'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      Tổng Tiền (USD)
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={yoyChartData}
                  margin={{ top: 10, right: 16, left: 4, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke={axisStroke}
                    tick={{ fill: axisStroke, fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={axisStroke}
                    tick={{ fill: axisStroke, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v.toLocaleString('vi-VN')}`}
                  />
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                  <Line
                    type="monotone"
                    dataKey="y2024"
                    name="Năm 2024"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="y2025"
                    name="Năm 2025"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 3.5 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="y2026"
                    name="Năm 2026"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Annual Summary Comparison Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-100">
                Bảng Tổng Hợp So Sánh Theo Từng Năm
              </h4>
              <span className="text-xs text-slate-400">
                So sánh bình quân tháng để loại trừ sai lệch số tháng chưa đủ 12 tháng
              </span>
            </div>
            <SmartHorizontalScroll>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Năm</th>
                    <th className="py-3 px-4 text-right">Số Tháng</th>
                    <th className="py-3 px-4 text-right">Tổng Nước Cấp (m³)</th>
                    <th className="py-3 px-4 text-right">TB / Tháng (m³)</th>
                    <th className="py-3 px-4 text-right">So Với Năm Trước</th>
                    <th className="py-3 px-4 text-right">Tháng Cao Điểm</th>
                    {showCosts && (
                      <>
                        <th className="py-3 px-4 text-right">Tổng Tiền Nước + Thải (VNĐ)</th>
                        <th className="py-3 px-4 text-right">Tổng (USD)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 font-mono tabular-nums">
                  {yearlySummary.map((row) => (
                    <tr key={row.year} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-cyan-400">Năm {row.year}</td>
                      <td className="py-3.5 px-4 text-right">{row.months} tháng</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                        {row.totalM3.toLocaleString('vi-VN')} m³
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-blue-300">
                        {row.avgM3.toLocaleString('vi-VN')} m³/tháng
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {row.avgDeltaPct === null ? (
                          <span className="text-slate-400">Năm gốc</span>
                        ) : (
                          <span
                            className={`font-bold ${
                              row.avgDeltaPct > 0
                                ? 'text-rose-400'
                                : row.avgDeltaPct < 0
                                ? 'text-emerald-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {row.avgDeltaPct > 0 ? '+' : ''}
                            {row.avgDeltaPct.toFixed(1)}% TB/tháng
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-amber-300">
                        {row.peak
                          ? `${row.peak.month} (${row.peak.waterM3.toLocaleString()} m³)`
                          : '—'}
                      </td>
                      {showCosts && (
                        <>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                            {formatVND(row.combinedVND)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-200">
                            ${row.combinedUSD.toLocaleString('vi-VN')}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </SmartHorizontalScroll>
          </div>
        </div>
      )}

      {/* MODE 4: DAILY 8 WATER METERS (P1-P8) */}
      {viewMode === 'daily_meters' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  Biểu Đồ Đối Chiếu 8 Đồng Hồ Nước Hàng Ngày (P1 – P8)
                </h4>
                <p className="text-xs text-slate-400">
                  Kiểm tra cân bằng nước sinh hoạt (P1 - P2), nước tưới cỏ, Chiller, DI và tỷ lệ nước thải đầu ra thực tế
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={effectiveDailyDate}
                  onChange={(e) => setSelectedDailyDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
                >
                  <option value="ALL">Tổng Hợp Tất Cả Ngày ({waterDailyReadings.length} dòng)</option>
                  {availableDailyDates.map((d) => (
                    <option key={d} value={d}>
                      Ngày {d}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onOpenWaterModal('daily')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ghi Chỉ Số Mới</span>
                </button>
              </div>
            </div>

            {dailyMeterBreakdown.recordCount === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center text-xs text-slate-400">
                <p>Chưa có dữ liệu chốt đồng hồ nước hàng ngày (P1–P8).</p>
                <button
                  type="button"
                  onClick={() => onOpenWaterModal('daily')}
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-semibold text-xs"
                >
                  Chốt 8 Đồng Hồ Nước Đầu Tiên
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-[11px] text-slate-400">Đồng Hồ Tổng (P1)</span>
                    <div className="text-lg font-extrabold text-cyan-400 font-mono tabular-nums">
                      {dailyMeterBreakdown.p1.toLocaleString('vi-VN')} m³
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-[11px] text-slate-400">Sinh Hoạt Thực (P1 - P2)</span>
                    <div className="text-lg font-extrabold text-emerald-400 font-mono tabular-nums">
                      {dailyMeterBreakdown.domesticNet.toLocaleString('vi-VN')} m³
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-[11px] text-slate-400">Tưới Cỏ (P2) &amp; Chiller/DI</span>
                    <div className="text-lg font-extrabold text-indigo-300 font-mono tabular-nums">
                      {(
                        dailyMeterBreakdown.p2 +
                        dailyMeterBreakdown.chiller +
                        dailyMeterBreakdown.di
                      ).toLocaleString('vi-VN')}{' '}
                      m³
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-[11px] text-slate-400">Thải Đầu Ra vs Quy Chuẩn 80%</span>
                    <div className="text-lg font-extrabold text-amber-300 font-mono tabular-nums">
                      {dailyMeterBreakdown.sewageOut.toLocaleString('vi-VN')} m³
                      {dailyMeterBreakdown.sewageActualPct !== null
                        ? ` (${dailyMeterBreakdown.sewageActualPct.toFixed(1)}%)`
                        : ''}
                    </div>
                  </div>
                </div>

                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dailyMeterBreakdown.bars}
                      margin={{ top: 10, right: 16, left: 4, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke={axisStroke}
                        tick={{ fill: axisStroke, fontSize: 11 }}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={52}
                      />
                      <YAxis
                        stroke={axisStroke}
                        tick={{ fill: axisStroke, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip contentStyle={tooltipStyle} />
                      <Bar
                        dataKey="value"
                        name="Sản lượng (m³)"
                        fill="#06b6d4"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
