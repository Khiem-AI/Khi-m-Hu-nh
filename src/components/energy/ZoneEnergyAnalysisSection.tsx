import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Power10Days } from '../../types/cmms';
import { formatVND } from '../../utils/cmmsLogic';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  Factory,
  Cpu,
  Building2,
  Layers,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';

export type ZoneKey = 'all' | 'production' | 'utility' | 'office';

interface SubSystemDef {
  field: keyof Pick<
    Power10Days,
    | 'pEquipment'
    | 'pAcmv'
    | 'pLighting'
    | 'uChiller'
    | 'uMChiller'
    | 'uComp'
    | 'uPump'
    | 'uCooling'
    | 'uOther'
    | 'oAcmv'
    | 'oServer'
    | 'oLighting'
    | 'oSocket'
    | 'oKit'
  >;
  code: string;
  label: string;
  zone: Exclude<ZoneKey, 'all'>;
  color: string;
}

const SUBSYSTEM_DEFS: SubSystemDef[] = [
  // Production
  { field: 'pEquipment', code: 'P_Equipment', label: 'Máy Móc & Dây Chuyền Sản Xuất', zone: 'production', color: '#8b5cf6' },
  { field: 'pAcmv', code: 'P_ACMV', label: 'Điều Hòa & Thông Gió Xưởng', zone: 'production', color: '#f59e0b' },
  { field: 'pLighting', code: 'P_Lighting', label: 'Chiếu Sáng Nhà Xưởng', zone: 'production', color: '#a78bfa' },

  // Utility
  { field: 'uChiller', code: 'U_Chiller', label: 'Cụm Chiller Lạnh Chính', zone: 'utility', color: '#06b6d4' },
  { field: 'uComp', code: 'U_Comp', label: 'Hệ Thống Máy Nén Khí', zone: 'utility', color: '#6366f1' },
  { field: 'uPump', code: 'U_Pump', label: 'Hệ Bơm Nước Tuần Hoàn', zone: 'utility', color: '#10b981' },
  { field: 'uCooling', code: 'U_Cooling', label: 'Tháp Giải Nhiệt (Cooling Tower)', zone: 'utility', color: '#14b8a6' },
  { field: 'uMChiller', code: 'U_mChiller', label: 'Mini Chiller Phụ Trợ', zone: 'utility', color: '#38bdf8' },
  { field: 'uOther', code: 'U_Other', label: 'Phụ Tải Utility Khác', zone: 'utility', color: '#64748b' },

  // Office
  { field: 'oAcmv', code: 'O_ACMV', label: 'Điều Hòa Khu Văn Phòng', zone: 'office', color: '#ec4899' },
  { field: 'oServer', code: 'O_Server', label: 'Phòng Server & Hạ Tầng IT', zone: 'office', color: '#fb7185' },
  { field: 'oLighting', code: 'O_Lighting', label: 'Chiếu Sáng Văn Phòng', zone: 'office', color: '#c084fc' },
  { field: 'oSocket', code: 'O_Socket', label: 'Ổ Cắm Thiết Bị Văn Phòng', zone: 'office', color: '#f472b6' },
  { field: 'oKit', code: 'O_Kit', label: 'Bếp & Khu Canteen', zone: 'office', color: '#fb923c' },
];

const ZONE_META: Record<
  Exclude<ZoneKey, 'all'>,
  {
    name: string;
    shortName: string;
    description: string;
    color: string;
    textClass: string;
    borderActiveClass: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  production: {
    name: 'Khu Vực Production (Sản Xuất)',
    shortName: 'Production',
    description: 'Máy móc SX, ACMV nhà xưởng, chiếu sáng xưởng',
    color: '#8b5cf6',
    textClass: 'text-violet-400',
    borderActiveClass: 'border-violet-500/60 bg-violet-950/20',
    icon: Factory,
  },
  utility: {
    name: 'Khu Vực Utility (Phụ Trợ)',
    shortName: 'Utility',
    description: 'Chiller, Mini Chiller, máy nén khí, bơm, tháp giải nhiệt',
    color: '#06b6d4',
    textClass: 'text-cyan-400',
    borderActiveClass: 'border-cyan-500/60 bg-cyan-950/20',
    icon: Cpu,
  },
  office: {
    name: 'Khu Vực Office (Văn Phòng)',
    shortName: 'Office',
    description: 'ACMV văn phòng, Server IT, chiếu sáng, ổ cắm, bếp',
    color: '#ec4899',
    textClass: 'text-pink-400',
    borderActiveClass: 'border-pink-500/60 bg-pink-950/20',
    icon: Building2,
  },
};

function getOperatingHours(r: Power10Days): number {
  const hoursPerDay = r.loaiCa?.includes('3') ? 24 : 16;
  return (r.ngayLamViec || 0) * hoursPerDay;
}

function getZoneSum(r: Power10Days, zone: Exclude<ZoneKey, 'all'>): number {
  if (zone === 'production') return (r.pEquipment || 0) + (r.pAcmv || 0) + (r.pLighting || 0);
  if (zone === 'utility') {
    return (
      (r.uChiller || 0) +
      (r.uMChiller || 0) +
      (r.uComp || 0) +
      (r.uPump || 0) +
      (r.uCooling || 0) +
      (r.uOther || 0)
    );
  }
  return (r.oAcmv || 0) + (r.oServer || 0) + (r.oLighting || 0) + (r.oSocket || 0) + (r.oKit || 0);
}

interface ZoneTooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
}

interface ZoneChartTooltipProps {
  active?: boolean;
  payload?: ZoneTooltipPayloadItem[];
  label?: string;
  isDark: boolean;
  avgCostPerKwh: number;
  showCosts: boolean;
}

const ZoneChartTooltip: React.FC<ZoneChartTooltipProps> = ({
  active,
  payload,
  label,
  isDark,
  avgCostPerKwh,
  showCosts,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const totalKwh = payload.reduce((acc, item) => acc + (Number(item.value) || 0), 0);

  return (
    <div
      className={`rounded-xl border p-3 shadow-2xl text-xs min-w-[230px] space-y-2 ${
        isDark
          ? 'bg-slate-900/95 border-slate-700 text-slate-100'
          : 'bg-white/95 border-slate-300 text-slate-900'
      }`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-1.5">
        <span className="font-bold font-mono">{label}</span>
        <span className="font-mono font-bold text-cyan-500 tabular-nums">
          {Math.round(totalKwh).toLocaleString('vi-VN')} kWh
        </span>
      </div>
      <div className="space-y-1">
        {payload
          .slice()
          .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
          .map((item, idx) => {
            const val = Number(item.value) || 0;
            const pct = totalKwh > 0 ? (val / totalKwh) * 100 : 0;
            return (
              <div key={idx} className="flex items-center justify-between gap-4 font-mono tabular-nums">
                <span className="flex items-center gap-1.5 font-sans text-slate-500 dark:text-slate-300 truncate max-w-[155px]">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: item.color || '#38bdf8' }}
                  />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-bold text-right shrink-0">
                  {Math.round(val).toLocaleString('vi-VN')}{' '}
                  <span className="text-[10px] font-normal text-slate-400">({pct.toFixed(1)}%)</span>
                </span>
              </div>
            );
          })}
      </div>
      {showCosts && avgCostPerKwh > 0 && (
        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono text-[11px] tabular-nums">
          <span className="font-sans text-slate-400">Chi phí phân bổ:</span>
          <strong className="text-emerald-400">{formatVND(totalKwh * avgCostPerKwh)}</strong>
        </div>
      )}
    </div>
  );
};

interface ZoneEnergyAnalysisSectionProps {
  records: Power10Days[];
  avgCostPerKwh: number;
  usdToVndRate: number;
  showCosts: boolean;
  canExportCsv: boolean;
  theme: 'dark' | 'light';
  initialZone?: ZoneKey;
  onResetFilters?: () => void;
}

export const ZoneEnergyAnalysisSection: React.FC<ZoneEnergyAnalysisSectionProps> = ({
  records,
  avgCostPerKwh,
  usdToVndRate,
  showCosts,
  canExportCsv,
  theme,
  initialZone = 'all',
  onResetFilters,
}) => {
  const isDark = theme === 'dark';
  const [selectedZone, setSelectedZone] = useState<ZoneKey>(initialZone);
  const [trendGranularity, setTrendGranularity] = useState<'monthly' | 'period'>('monthly');
  const [subSearch, setSubSearch] = useState('');

  // Chronological ascending copy for trend & latest-vs-previous comparison
  const chronoRecords = useMemo(
    () => [...records].sort((a, b) => a.denNgay.localeCompare(b.denNgay)),
    [records]
  );

  // Core aggregate metrics across all 3 zones & 14 sub-systems
  const analytics = useMemo(() => {
    const totalWorkDays = chronoRecords.reduce((acc, r) => acc + (r.ngayLamViec || 0), 0);
    const totalHours = chronoRecords.reduce((acc, r) => acc + getOperatingHours(r), 0);

    const shift2Records = chronoRecords.filter((r) => r.loaiCa?.includes('2'));
    const shift3Records = chronoRecords.filter((r) => r.loaiCa?.includes('3'));
    const shift2Hours = shift2Records.reduce((acc, r) => acc + getOperatingHours(r), 0);
    const shift3Hours = shift3Records.reduce((acc, r) => acc + getOperatingHours(r), 0);

    const latestRec = chronoRecords[chronoRecords.length - 1];
    const prevRec = chronoRecords[chronoRecords.length - 2];

    const zoneTotals: Record<Exclude<ZoneKey, 'all'>, number> = {
      production: 0,
      utility: 0,
      office: 0,
    };

    const subTotals = new Map<SubSystemDef['field'], number>();
    const subShift2 = new Map<SubSystemDef['field'], number>();
    const subShift3 = new Map<SubSystemDef['field'], number>();

    SUBSYSTEM_DEFS.forEach((def) => {
      subTotals.set(def.field, 0);
      subShift2.set(def.field, 0);
      subShift3.set(def.field, 0);
    });

    chronoRecords.forEach((r) => {
      zoneTotals.production += getZoneSum(r, 'production');
      zoneTotals.utility += getZoneSum(r, 'utility');
      zoneTotals.office += getZoneSum(r, 'office');

      const isShift3 = r.loaiCa?.includes('3');
      const isShift2 = r.loaiCa?.includes('2');
      SUBSYSTEM_DEFS.forEach((def) => {
        const v = Number(r[def.field]) || 0;
        subTotals.set(def.field, (subTotals.get(def.field) || 0) + v);
        if (isShift2) subShift2.set(def.field, (subShift2.get(def.field) || 0) + v);
        if (isShift3) subShift3.set(def.field, (subShift3.get(def.field) || 0) + v);
      });
    });

    const totalAllZones = zoneTotals.production + zoneTotals.utility + zoneTotals.office;

    const latestHours = latestRec ? getOperatingHours(latestRec) : 0;

    const subRows = SUBSYSTEM_DEFS.map((def) => {
      const kwh = subTotals.get(def.field) || 0;
      const zTot = zoneTotals[def.zone] || 0;
      const pctOfZone = zTot > 0 ? (kwh / zTot) * 100 : 0;
      const pctOfPlant = totalAllZones > 0 ? (kwh / totalAllZones) * 100 : 0;
      const kwhPerHour = totalHours > 0 ? kwh / totalHours : 0;
      const avgPerPeriod = chronoRecords.length > 0 ? kwh / chronoRecords.length : 0;
      const shift2KwhPerHr = shift2Hours > 0 ? (subShift2.get(def.field) || 0) / shift2Hours : 0;
      const shift3KwhPerHr = shift3Hours > 0 ? (subShift3.get(def.field) || 0) / shift3Hours : 0;
      const latestVal = latestRec ? Number(latestRec[def.field]) || 0 : 0;
      const latestKwhPerHr = latestHours > 0 ? latestVal / latestHours : 0;
      const deltaVsAvgPct =
        kwhPerHour > 0 && latestHours > 0 ? ((latestKwhPerHr - kwhPerHour) / kwhPerHour) * 100 : null;
      const allocatedCost = kwh * avgCostPerKwh;
      const allocatedCostPerHr = totalHours > 0 ? allocatedCost / totalHours : 0;

      return {
        ...def,
        kwh,
        pctOfZone,
        pctOfPlant,
        kwhPerHour,
        avgPerPeriod,
        shift2KwhPerHr,
        shift3KwhPerHr,
        latestVal,
        latestKwhPerHr,
        deltaVsAvgPct,
        allocatedCost,
        allocatedCostPerHr,
      };
    });

    const buildZoneSummary = (zone: Exclude<ZoneKey, 'all'>) => {
      const kwh = zoneTotals[zone];
      const pctOfPlant = totalAllZones > 0 ? (kwh / totalAllZones) * 100 : 0;
      const dailyKwh = totalWorkDays > 0 ? kwh / totalWorkDays : 0;
      const kwhPerHour = totalHours > 0 ? kwh / totalHours : 0;
      const allocatedCost = kwh * avgCostPerKwh;
      const allocatedCostPerHr = totalHours > 0 ? allocatedCost / totalHours : 0;
      const latestZoneKwh = latestRec ? getZoneSum(latestRec, zone) : 0;
      const prevZoneKwh = prevRec ? getZoneSum(prevRec, zone) : 0;
      const latestDeltaPct =
        prevZoneKwh > 0 ? ((latestZoneKwh - prevZoneKwh) / prevZoneKwh) * 100 : null;
      const subs = subRows.filter((s) => s.zone === zone).sort((a, b) => b.kwh - a.kwh);
      const topSub = subs[0] || null;

      return {
        zone,
        kwh,
        pctOfPlant,
        dailyKwh,
        kwhPerHour,
        allocatedCost,
        allocatedCostPerHr,
        latestZoneKwh,
        latestDeltaPct,
        topSub,
        subs,
      };
    };

    return {
      totalWorkDays,
      totalHours,
      totalAllZones,
      latestRec,
      zones: {
        production: buildZoneSummary('production'),
        utility: buildZoneSummary('utility'),
        office: buildZoneSummary('office'),
      },
      subRows,
    };
  }, [chronoRecords, avgCostPerKwh]);

  // Build Recharts trend dataset
  const trendData = useMemo(() => {
    if (trendGranularity === 'monthly') {
      const byMonth = new Map<string, Record<string, number | string>>();
      chronoRecords.forEach((r) => {
        const ym = (r.denNgay || r.tuNgay || '').slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(ym)) return;
        const [y, m] = ym.split('-');
        let bucket = byMonth.get(ym);
        if (!bucket) {
          bucket = {
            key: ym,
            label: `${m}/${y.slice(2)}`,
            production: 0,
            utility: 0,
            office: 0,
          };
          SUBSYSTEM_DEFS.forEach((d) => {
            bucket![d.field] = 0;
          });
          byMonth.set(ym, bucket);
        }
        bucket.production = Number(bucket.production) + getZoneSum(r, 'production');
        bucket.utility = Number(bucket.utility) + getZoneSum(r, 'utility');
        bucket.office = Number(bucket.office) + getZoneSum(r, 'office');
        SUBSYSTEM_DEFS.forEach((d) => {
          bucket![d.field] = Number(bucket![d.field]) + (Number(r[d.field]) || 0);
        });
      });
      return Array.from(byMonth.values()).slice(-12);
    }

    // Per 10-day cycle (last 18 cycles for crisp legibility)
    return chronoRecords.slice(-18).map((r) => {
      const row: Record<string, number | string> = {
        key: r.id,
        label: r.chuKy.split('(')[0].trim(),
        production: getZoneSum(r, 'production'),
        utility: getZoneSum(r, 'utility'),
        office: getZoneSum(r, 'office'),
      };
      SUBSYSTEM_DEFS.forEach((d) => {
        row[d.field] = Number(r[d.field]) || 0;
      });
      return row;
    });
  }, [chronoRecords, trendGranularity]);

  // Active series definitions for the trend chart
  const activeChartSeries = useMemo(() => {
    if (selectedZone === 'all') {
      return [
        { dataKey: 'utility', name: 'Utility (Phụ Trợ)', color: ZONE_META.utility.color },
        { dataKey: 'production', name: 'Production (Sản Xuất)', color: ZONE_META.production.color },
        { dataKey: 'office', name: 'Office (Văn Phòng)', color: ZONE_META.office.color },
      ];
    }
    return SUBSYSTEM_DEFS.filter((d) => d.zone === selectedZone).map((d) => ({
      dataKey: d.field,
      name: `${d.label} (${d.code})`,
      color: d.color,
    }));
  }, [selectedZone]);

  // Filtered sub-system rows for ranked chart & table
  const visibleSubRows = useMemo(() => {
    const q = subSearch.trim().toLowerCase();
    return analytics.subRows
      .filter((row) => (selectedZone === 'all' ? true : row.zone === selectedZone))
      .filter((row) => {
        if (!q) return true;
        return (
          row.label.toLowerCase().includes(q) ||
          row.code.toLowerCase().includes(q) ||
          ZONE_META[row.zone].shortName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.kwh - a.kwh);
  }, [analytics.subRows, selectedZone, subSearch]);

  const visibleTotalKwh = visibleSubRows.reduce((acc, r) => acc + r.kwh, 0);
  const visibleTotalCost = visibleSubRows.reduce((acc, r) => acc + r.allocatedCost, 0);
  const maxSubKwh = Math.max(...visibleSubRows.map((r) => r.kwh), 1);

  const handleExportZoneCsv = () => {
    const headers = [
      'Khu Vực',
      'Mã Phụ Tải',
      'Tên Hệ Thống / Phụ Tải',
      'Tổng Tiêu Thụ (kWh)',
      'Tỷ Trọng Khu Vực (%)',
      'Tỷ Trọng Nhà Máy (%)',
      'Suất Tiêu Thụ TB (kWh/h)',
      'TB Ca 2 (kWh/h)',
      'TB Ca 3 (kWh/h)',
      'Kỳ Gần Nhất (kWh)',
      ...(showCosts ? ['Chi Phí Phân Bổ (VNĐ)', 'Chi Phí / 1 Giờ (VNĐ/h)', 'Quy Đổi (USD)'] : []),
    ];

    const rows = visibleSubRows.map((r) => [
      `"${ZONE_META[r.zone].shortName}"`,
      `"${r.code}"`,
      `"${r.label}"`,
      Math.round(r.kwh),
      r.pctOfZone.toFixed(1),
      r.pctOfPlant.toFixed(1),
      r.kwhPerHour.toFixed(2),
      r.shift2KwhPerHr.toFixed(2),
      r.shift3KwhPerHr.toFixed(2),
      Math.round(r.latestVal),
      ...(showCosts
        ? [
            Math.round(r.allocatedCost),
            Math.round(r.allocatedCostPerHr),
            usdToVndRate > 0 ? Math.round(r.allocatedCost / usdToVndRate) : 0,
          ]
        : []),
    ]);

    const csv = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Phan_Tich_Nang_Luong_Khu_Vuc_${selectedZone}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const axisStroke = isDark ? '#94a3b8' : '#475569';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';

  if (records.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
        <Layers className="w-8 h-8 text-slate-500 mx-auto" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-100">
            Chưa có dữ liệu năng lượng khu vực phù hợp với bộ lọc
          </h4>
          <p className="text-xs text-slate-400">
            Thay đổi điều kiện năm, tháng, chu kỳ hoặc đặt lại bộ lọc để xem chi tiết Production, Utility và Office.
          </p>
        </div>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition whitespace-nowrap"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      {/* Header & Interactive Zone Filter Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-100 tracking-tight">
            Phân Tích Năng Lượng Chi Tiết Theo Khu Vực (Production · Utility · Office)
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
            <span>{records.length} chu kỳ</span>
            <span aria-hidden="true">·</span>
            <span>{analytics.totalWorkDays.toLocaleString('vi-VN')} ngày làm việc</span>
            <span aria-hidden="true">·</span>
            <span>{analytics.totalHours.toLocaleString('vi-VN')} giờ vận hành</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400 font-semibold">
              Tổng 3 khu vực: {analytics.totalAllZones.toLocaleString('vi-VN')} kWh
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zone Segmented Control */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/70 border border-slate-800">
            {(
              [
                { id: 'all', label: 'Tất cả 3 khu vực' },
                { id: 'production', label: 'Production' },
                { id: 'utility', label: 'Utility' },
                { id: 'office', label: 'Office' },
              ] as const
            ).map((tab) => {
              const isActive = selectedZone === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedZone(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {canExportCsv && (
            <button
              type="button"
              onClick={handleExportZoneCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Xuất CSV Khu Vực</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Zone Executive Summary Grid (Click any zone to drill down) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(['production', 'utility', 'office'] as const).map((zKey) => {
          const meta = ZONE_META[zKey];
          const z = analytics.zones[zKey];
          const Icon = meta.icon;
          const isSelected = selectedZone === zKey;

          return (
            <button
              key={zKey}
              type="button"
              onClick={() => setSelectedZone(isSelected ? 'all' : zKey)}
              className={`text-left p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isSelected
                  ? meta.borderActiveClass
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2.5 w-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 shrink-0 ${meta.textClass}`} />
                      <h4 className="text-sm font-bold text-slate-100 truncate">
                        {meta.shortName}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{meta.description}</p>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className={`text-sm font-extrabold ${meta.textClass}`}>
                      {z.pctOfPlant.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500">tỷ trọng</div>
                  </div>
                </div>

                {/* Primary Value & Trend */}
                <div className="flex items-baseline justify-between gap-2 pt-1">
                  <div className="font-mono tabular-nums">
                    <span className="text-xl font-black text-slate-100">
                      {Math.round(z.kwh).toLocaleString('vi-VN')}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">kWh</span>
                  </div>
                  {z.latestDeltaPct !== null && (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold tabular-nums ${
                        z.latestDeltaPct > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {z.latestDeltaPct > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {z.latestDeltaPct > 0 ? '+' : ''}
                      {z.latestDeltaPct.toFixed(1)}% kỳ mới
                    </span>
                  )}
                </div>

                {/* Stacked Proportion Bar of Sub-loads */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                  {z.subs.map((sub) => (
                    <div
                      key={sub.code}
                      style={{
                        width: `${Math.max(sub.pctOfZone, 0)}%`,
                        backgroundColor: sub.color,
                      }}
                      title={`${sub.label}: ${Math.round(sub.kwh).toLocaleString('vi-VN')} kWh (${sub.pctOfZone.toFixed(1)}%)`}
                    />
                  ))}
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono tabular-nums">
                  <div>
                    <span className="text-slate-500 font-sans block">Suất tiêu thụ</span>
                    <span className="text-slate-200 font-bold">
                      {z.kwhPerHour.toFixed(1)} kWh/h
                    </span>
                    <span className="text-slate-500 block text-[10px]">
                      {Math.round(z.dailyKwh).toLocaleString('vi-VN')} kWh/ngày
                    </span>
                  </div>
                  <div className="text-right">
                    {showCosts ? (
                      <>
                        <span className="text-slate-500 font-sans block">Chi phí phân bổ</span>
                        <span className="text-emerald-400 font-bold">
                          {formatVND(z.allocatedCost)}
                        </span>
                        <span className="text-amber-400/90 block text-[10px]">
                          {formatVND(z.allocatedCostPerHr)}/h
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-500 font-sans block">Phụ tải chính</span>
                        <span className="text-slate-200 font-bold truncate block">
                          {z.topSub?.code || '-'}
                        </span>
                        <span className="text-slate-500 block text-[10px]">
                          {z.topSub ? `${z.topSub.pctOfZone.toFixed(1)}% khu vực` : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Lead Sub-load & Click Hint */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-400 w-full">
                <span className="truncate">
                  Lớn nhất:{' '}
                  <strong className="text-slate-200 font-semibold">
                    {z.topSub ? `${z.topSub.label} (${z.topSub.pctOfZone.toFixed(0)}%)` : '—'}
                  </strong>
                </span>
                <span className={`font-semibold whitespace-nowrap shrink-0 ${meta.textClass}`}>
                  {isSelected ? 'Đang lọc' : 'Xem chi tiết'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2-Column Visual Analytics: Stacked Trend Chart + Ranked Sub-load Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left: Trend Stacked Bar Chart */}
        <div className="xl:col-span-7 p-4 sm:p-5 rounded-xl bg-slate-950/45 border border-slate-800 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  {selectedZone === 'all'
                    ? 'Diễn Biến Tiêu Thụ 3 Khu Vực (Utility · Production · Office)'
                    : `Diễn Biến Phụ Tải Thành Phần — ${ZONE_META[selectedZone].shortName}`}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                {trendGranularity === 'monthly'
                  ? 'Tổng hợp sản lượng kWh theo 12 tháng gần nhất trong tập dữ liệu lọc'
                  : 'Chi tiết 18 chu kỳ 10 ngày gần nhất trong tập dữ liệu lọc'}
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTrendGranularity('monthly')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition whitespace-nowrap cursor-pointer ${
                  trendGranularity === 'monthly'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Theo Tháng
              </button>
              <button
                type="button"
                onClick={() => setTrendGranularity('period')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition whitespace-nowrap cursor-pointer ${
                  trendGranularity === 'period'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Chu Kỳ 10 Ngày
              </button>
            </div>
          </div>

          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke={axisStroke}
                  tick={{ fill: axisStroke, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: gridStroke }}
                />
                <YAxis
                  stroke={axisStroke}
                  tick={{ fill: axisStroke, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                  }
                />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.05)' }}
                  content={
                    <ZoneChartTooltip
                      isDark={isDark}
                      avgCostPerKwh={avgCostPerKwh}
                      showCosts={showCosts}
                    />
                  }
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="square" />
                {activeChartSeries.map((series, idx) => (
                  <Bar
                    key={series.dataKey}
                    dataKey={series.dataKey}
                    name={series.name}
                    stackId="zoneStack"
                    fill={series.color}
                    radius={
                      idx === activeChartSeries.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
                    }
                    maxBarSize={42}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Ranked Sub-System Breakdown */}
        <div className="xl:col-span-5 p-4 sm:p-5 rounded-xl bg-slate-950/45 border border-slate-800 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="space-y-0.5 min-w-0">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">
                  {selectedZone === 'all'
                    ? 'Xếp Hạng 14 Phụ Tải Toàn Nhà Máy'
                    : `Cơ Cấu Phụ Tải ${ZONE_META[selectedZone].shortName} (${visibleSubRows.length} Hệ)`}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Sắp xếp giảm dần theo tổng sản lượng kWh tiêu thụ
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-200 tabular-nums shrink-0">
              {Math.round(visibleTotalKwh).toLocaleString('vi-VN')} kWh
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
            {visibleSubRows.map((sub) => {
              const barWidth = Math.max(2, (sub.kwh / maxSubKwh) * 100);
              return (
                <div key={sub.code} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span className="font-semibold text-slate-200 truncate">{sub.label}</span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {sub.code}
                      </span>
                    </div>
                    <div className="font-mono tabular-nums text-right shrink-0">
                      <span className="font-bold text-slate-100">
                        {Math.round(sub.kwh).toLocaleString('vi-VN')}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({(selectedZone === 'all' ? sub.pctOfPlant : sub.pctOfZone).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${barWidth}%`, backgroundColor: sub.color }}
                      className="h-full rounded-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                    <span>
                      {ZONE_META[sub.zone].shortName} · {sub.kwhPerHour.toFixed(1)} kWh/h
                    </span>
                    {showCosts ? (
                      <span className="text-emerald-400/90">
                        {formatVND(sub.allocatedCost)} ({formatVND(sub.allocatedCostPerHr)}/h)
                      </span>
                    ) : (
                      <span>Kỳ mới: {Math.round(sub.latestVal).toLocaleString('vi-VN')} kWh</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* High-Density Detailed Sub-System Table (Includes Ca 2 vs Ca 3 Comparison) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Bảng Đối Soát Chi Tiết Phụ Tải Từng Khu Vực &amp; Hiệu Suất Ca 2 / Ca 3
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              So sánh suất tiêu thụ kWh/giờ theo chế độ ca vận hành và mức biến động kỳ gần nhất (
              {analytics.latestRec?.chuKy || '—'}) so với trung bình giai đoạn lọc
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              placeholder="Tìm tên hệ thống, mã phụ tải..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <SmartHorizontalScroll>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-y border-slate-800 bg-slate-800/50 text-slate-400 font-semibold text-[11px]">
                <th className="py-3 px-3">Khu Vực</th>
                <th className="py-3 px-3">Hệ Thống / Phụ Tải</th>
                <th className="py-3 px-3 text-right">Tổng Tiêu Thụ (kWh)</th>
                <th className="py-3 px-3 text-right">% Khu Vực</th>
                <th className="py-3 px-3 text-right">% Nhà Máy</th>
                <th className="py-3 px-3 text-right">TB Giờ (kWh/h)</th>
                <th className="py-3 px-3 text-right">Ca 2 (kWh/h)</th>
                <th className="py-3 px-3 text-right">Ca 3 (kWh/h)</th>
                <th className="py-3 px-3 text-right">Kỳ Mới vs TB</th>
                {showCosts && (
                  <>
                    <th className="py-3 px-3 text-right">Chi Phí Phân Bổ</th>
                    <th className="py-3 px-3 text-right">Chi Phí / Giờ</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono tabular-nums">
              {visibleSubRows.map((row) => {
                const zMeta = ZONE_META[row.zone];
                return (
                  <tr key={row.code} className="hover:bg-slate-800/35 transition-colors">
                    <td className="py-2.5 px-3 font-sans whitespace-nowrap">
                      <span className={`font-semibold ${zMeta.textClass}`}>
                        {zMeta.shortName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans whitespace-nowrap">
                      <div className="font-semibold text-slate-100">{row.label}</div>
                      <div className="text-[10px] font-mono text-slate-500">{row.code}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-100 whitespace-nowrap">
                      {Math.round(row.kwh).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 whitespace-nowrap">
                      {row.pctOfZone.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 whitespace-nowrap">
                      {row.pctOfPlant.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-cyan-300 whitespace-nowrap">
                      {row.kwhPerHour.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 whitespace-nowrap">
                      {row.shift2KwhPerHr > 0 ? row.shift2KwhPerHr.toFixed(1) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 whitespace-nowrap">
                      {row.shift3KwhPerHr > 0 ? row.shift3KwhPerHr.toFixed(1) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {row.deltaVsAvgPct !== null ? (
                        <span
                          className={`font-bold ${
                            row.deltaVsAvgPct > 10
                              ? 'text-rose-400'
                              : row.deltaVsAvgPct < -10
                              ? 'text-emerald-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {row.deltaVsAvgPct > 0 ? '+' : ''}
                          {row.deltaVsAvgPct.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    {showCosts && (
                      <>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400 whitespace-nowrap">
                          {formatVND(row.allocatedCost)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-300 whitespace-nowrap">
                          {formatVND(row.allocatedCostPerHr)}/h
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}

              {visibleSubRows.length === 0 && (
                <tr>
                  <td
                    colSpan={showCosts ? 11 : 9}
                    className="py-8 text-center font-sans text-slate-500"
                  >
                    Không tìm thấy phụ tải phù hợp với từ khóa "{subSearch}".
                  </td>
                </tr>
              )}

              {visibleSubRows.length > 0 && (
                <tr className="bg-slate-800/75 font-bold text-slate-100">
                  <td colSpan={2} className="py-3 px-3 font-sans">
                    Tổng cộng ({visibleSubRows.length} phụ tải
                    {selectedZone !== 'all' ? ` · ${ZONE_META[selectedZone].shortName}` : ''})
                  </td>
                  <td className="py-3 px-3 text-right text-cyan-300 whitespace-nowrap">
                    {Math.round(visibleTotalKwh).toLocaleString('vi-VN')} kWh
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    {selectedZone === 'all' ? '—' : '100%'}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    {analytics.totalAllZones > 0
                      ? `${((visibleTotalKwh / analytics.totalAllZones) * 100).toFixed(1)}%`
                      : '0%'}
                  </td>
                  <td className="py-3 px-3 text-right text-cyan-300 whitespace-nowrap">
                    {analytics.totalHours > 0
                      ? (visibleTotalKwh / analytics.totalHours).toFixed(1)
                      : '0.0'}
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-right font-sans text-[11px] font-normal text-slate-400">
                    Đơn giá TB giai đoạn:{' '}
                    {showCosts ? `${Math.round(avgCostPerKwh).toLocaleString('vi-VN')} đ/kWh` : '—'}
                  </td>
                  {showCosts && (
                    <>
                      <td className="py-3 px-3 text-right text-emerald-400 whitespace-nowrap">
                        {formatVND(visibleTotalCost)}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-400 whitespace-nowrap">
                        {analytics.totalHours > 0
                          ? `${formatVND(visibleTotalCost / analytics.totalHours)}/h`
                          : '0 đ/h'}
                      </td>
                    </>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </SmartHorizontalScroll>
      </div>
    </section>
  );
};
