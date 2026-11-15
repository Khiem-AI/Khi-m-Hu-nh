import React, { useState, useMemo } from 'react';
import { Power10Days } from '../../types/cmms';
import { useCMMS } from '../../context/CMMSContext';
import { formatVND } from '../../utils/cmmsLogic';
import { TariffConfigModal } from './TariffConfigModal';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Layers,
  Sun,
  DollarSign,
  Download,
  Search,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpDown,
  RotateCcw,
  Settings,
  Cpu,
  Factory,
  Building2,
} from 'lucide-react';

interface EnergyCompareDashboardProps {
  powerRecords: Power10Days[];
}

interface DonutSlice {
  label: string;
  value: number;
  color: string;
  formattedValue?: string;
  subLabel?: string;
}

const SvgDonutChart: React.FC<{
  slices: DonutSlice[];
  centerLabel: string;
  centerSub: string;
  size?: number;
}> = ({ slices, centerLabel, centerSub, size = 160 }) => {
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  const radius = 58;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 160 160" className="rotate-[-90deg]">
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
            slices.map((slice, i) => {
              const slicePercent = slice.value / total;
              const dashLength = slicePercent * circumference;
              const dashOffset = -accumulatedPercent * circumference;
              accumulatedPercent += slicePercent;

              return (
                <circle
                  key={i}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  className="transition-all duration-500 hover:opacity-85"
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          <span className="text-sm font-extrabold text-slate-100 font-mono tracking-tight leading-tight">
            {centerLabel}
          </span>
          <span className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
            {centerSub}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 space-y-2 w-full min-w-0">
        {slices.map((slice, idx) => {
          const pct = total > 0 ? ((slice.value / total) * 100).toFixed(1) : '0';
          return (
            <div key={idx} className="space-y-0.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-slate-300 font-medium truncate">{slice.label}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono shrink-0">
                  <span className="text-slate-100 font-bold">
                    {slice.formattedValue || slice.value.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-slate-400 text-[11px] w-11 text-right">
                    ({pct}%)
                  </span>
                </div>
              </div>
              {slice.subLabel && (
                <p className="text-[10px] text-slate-500 pl-4 truncate">{slice.subLabel}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

function parseMonthYear(ck: string): { month: number; year: number; periodStr: string } {
  try {
    const parts = ck.split('-');
    const my = parts[0].split('/');
    const month = parseInt(my[0], 10);
    const year = parseInt(my[1], 10);
    const periodStr = parts.slice(1).join('-');
    return { month, year, periodStr };
  } catch {
    return { month: 1, year: 2026, periodStr: '01-10' };
  }
}

function getHoursPerDayFromShift(loaiCa: string): number {
  return loaiCa?.includes('3') ? 24 : 16;
}

function getOperatingHours(r: Power10Days): number {
  return (r.ngayLamViec || 0) * getHoursPerDayFromShift(r.loaiCa);
}

export const EnergyCompareDashboard: React.FC<EnergyCompareDashboardProps> = ({ powerRecords }) => {
  const { tariffConfig } = useCMMS();
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);

  // EVN cost only
  const estimateEvnCost = (bt: number, cd: number, td: number): number => {
    return bt * tariffConfig.evnBT + cd * tariffConfig.evnCD + td * tariffConfig.evnTD;
  };

  // Solar cost calculated at EVN BT & CD rates (no low-peak)
  const estimateSolarCost = (solarBT: number, solarCD: number): number => {
    return solarBT * tariffConfig.evnBT + solarCD * tariffConfig.evnCD;
  };

  // Combined Energy Cost = EVN Cost + Solar Cost (at EVN rates)
  const estimateTotalEnergyCost = (r: Power10Days): number => {
    return estimateEvnCost(r.evnBT, r.evnCD, r.evnTD) + estimateSolarCost(r.solarBT, r.solarCD);
  };

  // Sort descending by date
  const sortedRecords = useMemo(() => {
    return [...powerRecords].sort((a, b) => b.denNgay.localeCompare(a.denNgay));
  }, [powerRecords]);

  // Unique approver names from data
  const approverOptions = useMemo(() => {
    const set = new Set<string>(['Đoàn Quang Hùng', 'Huỳnh Thiện Khiêm', 'Kỹ Sư Thiết Bị', 'Hệ thống Migrate']);
    powerRecords.forEach((r) => {
      if (r.nguoiChot && r.nguoiChot.trim()) {
        set.add(r.nguoiChot.trim());
      }
    });
    return Array.from(set);
  }, [powerRecords]);

  // View modes: 'donut_and_cost' | 'period_vs_period' | 'yearly_yoy' | 'all_filtered'
  const [compareMode, setCompareMode] = useState<
    'donut_and_cost' | 'period_vs_period' | 'yearly_yoy' | 'all_filtered'
  >('donut_and_cost');

  // Period vs Period state
  const [selectedPeriodAId, setSelectedPeriodAId] = useState<string>(() => sortedRecords[0]?.id || '');
  const [selectedPeriodBId, setSelectedPeriodBId] = useState<string>(() => sortedRecords[3]?.id || sortedRecords[1]?.id || '');

  // General Filter state
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterPeriodType, setFilterPeriodType] = useState<string>('ALL');
  const [filterShift, setFilterShift] = useState<string>('ALL');
  const [filterApprover, setFilterApprover] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected periods
  const periodA = useMemo(() => {
    return sortedRecords.find((r) => r.id === selectedPeriodAId) || sortedRecords[0];
  }, [sortedRecords, selectedPeriodAId]);

  const periodB = useMemo(() => {
    return sortedRecords.find((r) => r.id === selectedPeriodBId) || sortedRecords[1] || sortedRecords[0];
  }, [sortedRecords, selectedPeriodBId]);

  // Filtered dataset for all_filtered mode
  const filteredList = useMemo(() => {
    return sortedRecords.filter((r) => {
      const { month, year, periodStr } = parseMonthYear(r.chuKy);

      if (filterYear !== 'ALL' && String(year) !== filterYear) return false;
      if (filterMonth !== 'ALL' && String(month) !== filterMonth) return false;
      if (filterPeriodType !== 'ALL') {
        if (filterPeriodType === 'P1' && !periodStr.includes('01-10')) return false;
        if (filterPeriodType === 'P2' && !periodStr.includes('11-20')) return false;
        if (
          filterPeriodType === 'P3' &&
          !periodStr.includes('21-') &&
          !periodStr.includes('21-31') &&
          !periodStr.includes('21-30') &&
          !periodStr.includes('21-28')
        )
          return false;
      }
      if (filterShift !== 'ALL' && !r.loaiCa.includes(filterShift)) return false;
      if (filterApprover !== 'ALL' && !r.nguoiChot.includes(filterApprover)) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          r.chuKy.toLowerCase().includes(q) ||
          r.nguoiChot.toLowerCase().includes(q) ||
          r.denNgay.includes(q)
        );
      }
      return true;
    });
  }, [sortedRecords, filterYear, filterMonth, filterPeriodType, filterShift, filterApprover, searchTerm]);

  // Aggregate stats for filteredList
  const filteredStats = useMemo(() => {
    const count = filteredList.length;
    const totalEVN = filteredList.reduce((acc, r) => acc + r.evnBT + r.evnCD + r.evnTD, 0);
    const totalEVN_BT = filteredList.reduce((acc, r) => acc + r.evnBT, 0);
    const totalEVN_CD = filteredList.reduce((acc, r) => acc + r.evnCD, 0);
    const totalEVN_TD = filteredList.reduce((acc, r) => acc + r.evnTD, 0);

    const totalSolar = filteredList.reduce((acc, r) => acc + r.solarBT + r.solarCD, 0);
    const totalSolar_BT = filteredList.reduce((acc, r) => acc + r.solarBT, 0);
    const totalSolar_CD = filteredList.reduce((acc, r) => acc + r.solarCD, 0);

    // Combined TOU energy quantities (EVN + Solar)
    const totalAll_BT = totalEVN_BT + totalSolar_BT;
    const totalAll_CD = totalEVN_CD + totalSolar_CD;
    const totalAll_TD = totalEVN_TD; // Solar does not run in low-peak night hours

    const grandTotal = totalEVN + totalSolar;
    const totalWorkDays = filteredList.reduce((acc, r) => acc + r.ngayLamViec, 0);
    const totalOperatingHours = filteredList.reduce((acc, r) => acc + getOperatingHours(r), 0);
    const avgDaily = totalWorkDays > 0 ? grandTotal / totalWorkDays : 0;
    const kwhPerHour = totalOperatingHours > 0 ? grandTotal / totalOperatingHours : 0;
    const evnKwhPerHour = totalOperatingHours > 0 ? totalEVN / totalOperatingHours : 0;
    const solarKwhPerHour = totalOperatingHours > 0 ? totalSolar / totalOperatingHours : 0;
    const solarRatio = grandTotal > 0 ? (totalSolar / grandTotal) * 100 : 0;

    // EVN Cost by TOU
    const costEVN_BT = totalEVN_BT * tariffConfig.evnBT;
    const costEVN_CD = totalEVN_CD * tariffConfig.evnCD;
    const costEVN_TD = totalEVN_TD * tariffConfig.evnTD;
    const totalEvnCost = costEVN_BT + costEVN_CD + costEVN_TD;

    // Solar Cost priced at EVN BT & CD rates (added directly into TOU & Total energy cost)
    const costSolar_BT = totalSolar_BT * tariffConfig.evnBT;
    const costSolar_CD = totalSolar_CD * tariffConfig.evnCD;
    const totalSolarCost = costSolar_BT + costSolar_CD;

    // Combined TOU Cost = EVN + Solar
    const costAll_BT = costEVN_BT + costSolar_BT;
    const costAll_CD = costEVN_CD + costSolar_CD;
    const costAll_TD = costEVN_TD;
    const totalCost = totalEvnCost + totalSolarCost;

    const costPerHourVND = totalOperatingHours > 0 ? totalCost / totalOperatingHours : 0;
    const costPerHourUSD = tariffConfig.usdToVndRate > 0 ? costPerHourVND / tariffConfig.usdToVndRate : 0;
    const avgCostPerKwh = grandTotal > 0 ? totalCost / grandTotal : 0;

    // 3 Vùng Lớn:
    const totalUtility = filteredList.reduce(
      (acc, r) => acc + r.uChiller + r.uMChiller + r.uComp + r.uPump + r.uCooling + r.uOther,
      0
    );
    const totalProduction = filteredList.reduce(
      (acc, r) => acc + r.pLighting + r.pAcmv + r.pEquipment,
      0
    );
    const totalOffice = filteredList.reduce(
      (acc, r) => acc + r.oAcmv + r.oSocket + r.oKit + r.oServer + r.oLighting,
      0
    );

    // Phân tích theo Ca làm việc (Ca 2 vs Ca 3)
    const shift2List = filteredList.filter((r) => r.loaiCa.includes('2'));
    const shift3List = filteredList.filter((r) => r.loaiCa.includes('3'));

    const shift2WorkDays = shift2List.reduce((acc, r) => acc + r.ngayLamViec, 0);
    const shift2Hours = shift2List.reduce((acc, r) => acc + getOperatingHours(r), 0);
    const shift2TotalKwh = shift2List.reduce(
      (acc, r) => acc + r.evnBT + r.evnCD + r.evnTD + r.solarBT + r.solarCD,
      0
    );
    const shift2DailyKwh = shift2WorkDays > 0 ? shift2TotalKwh / shift2WorkDays : 0;
    const shift2KwhPerHour = shift2Hours > 0 ? shift2TotalKwh / shift2Hours : 0;
    const shift2Cost = shift2List.reduce((acc, r) => acc + estimateTotalEnergyCost(r), 0);
    const shift2DailyCost = shift2WorkDays > 0 ? shift2Cost / shift2WorkDays : 0;
    const shift2CostPerHour = shift2Hours > 0 ? shift2Cost / shift2Hours : 0;

    const shift3WorkDays = shift3List.reduce((acc, r) => acc + r.ngayLamViec, 0);
    const shift3Hours = shift3List.reduce((acc, r) => acc + getOperatingHours(r), 0);
    const shift3TotalKwh = shift3List.reduce(
      (acc, r) => acc + r.evnBT + r.evnCD + r.evnTD + r.solarBT + r.solarCD,
      0
    );
    const shift3DailyKwh = shift3WorkDays > 0 ? shift3TotalKwh / shift3WorkDays : 0;
    const shift3KwhPerHour = shift3Hours > 0 ? shift3TotalKwh / shift3Hours : 0;
    const shift3Cost = shift3List.reduce((acc, r) => acc + estimateTotalEnergyCost(r), 0);
    const shift3DailyCost = shift3WorkDays > 0 ? shift3Cost / shift3WorkDays : 0;
    const shift3CostPerHour = shift3Hours > 0 ? shift3Cost / shift3Hours : 0;

    return {
      count,
      totalEVN,
      totalEVN_BT,
      totalEVN_CD,
      totalEVN_TD,
      costEVN_BT,
      costEVN_CD,
      costEVN_TD,
      totalEvnCost,
      totalSolar,
      totalSolar_BT,
      totalSolar_CD,
      costSolar_BT,
      costSolar_CD,
      totalSolarCost,
      totalAll_BT,
      totalAll_CD,
      totalAll_TD,
      costAll_BT,
      costAll_CD,
      costAll_TD,
      grandTotal,
      totalWorkDays,
      totalOperatingHours,
      avgDaily,
      kwhPerHour,
      evnKwhPerHour,
      solarKwhPerHour,
      solarRatio,
      totalCost,
      costPerHourVND,
      costPerHourUSD,
      avgCostPerKwh,
      totalUtility,
      totalProduction,
      totalOffice,
      shift2: {
        count: shift2List.length,
        workDays: shift2WorkDays,
        operatingHours: shift2Hours,
        totalKwh: shift2TotalKwh,
        dailyKwh: shift2DailyKwh,
        kwhPerHour: shift2KwhPerHour,
        cost: shift2Cost,
        dailyCost: shift2DailyCost,
        costPerHour: shift2CostPerHour,
      },
      shift3: {
        count: shift3List.length,
        workDays: shift3WorkDays,
        operatingHours: shift3Hours,
        totalKwh: shift3TotalKwh,
        dailyKwh: shift3DailyKwh,
        kwhPerHour: shift3KwhPerHour,
        cost: shift3Cost,
        dailyCost: shift3DailyCost,
        costPerHour: shift3CostPerHour,
      },
    };
  }, [filteredList, tariffConfig]);

  // Period A calculations
  const statsA = useMemo(() => {
    if (!periodA) return null;
    const evnTot = periodA.evnBT + periodA.evnCD + periodA.evnTD;
    const solarTot = periodA.solarBT + periodA.solarCD;
    const total = evnTot + solarTot;
    const operatingHours = getOperatingHours(periodA);
    const evnCost = estimateEvnCost(periodA.evnBT, periodA.evnCD, periodA.evnTD);
    const solarCost = estimateSolarCost(periodA.solarBT, periodA.solarCD);
    const cost = evnCost + solarCost;
    const kwhPerHour = operatingHours > 0 ? total / operatingHours : 0;
    const costPerHour = operatingHours > 0 ? cost / operatingHours : 0;
    const solarPct = total > 0 ? (solarTot / total) * 100 : 0;

    const utility = periodA.uChiller + periodA.uMChiller + periodA.uComp + periodA.uPump + periodA.uCooling + periodA.uOther;
    const production = periodA.pLighting + periodA.pAcmv + periodA.pEquipment;
    const office = periodA.oAcmv + periodA.oSocket + periodA.oKit + periodA.oServer + periodA.oLighting;

    return {
      evnTot,
      solarTot,
      total,
      operatingHours,
      evnCost,
      solarCost,
      cost,
      kwhPerHour,
      costPerHour,
      solarPct,
      utility,
      production,
      office,
    };
  }, [periodA, tariffConfig]);

  // Period B calculations
  const statsB = useMemo(() => {
    if (!periodB) return null;
    const evnTot = periodB.evnBT + periodB.evnCD + periodB.evnTD;
    const solarTot = periodB.solarBT + periodB.solarCD;
    const total = evnTot + solarTot;
    const operatingHours = getOperatingHours(periodB);
    const evnCost = estimateEvnCost(periodB.evnBT, periodB.evnCD, periodB.evnTD);
    const solarCost = estimateSolarCost(periodB.solarBT, periodB.solarCD);
    const cost = evnCost + solarCost;
    const kwhPerHour = operatingHours > 0 ? total / operatingHours : 0;
    const costPerHour = operatingHours > 0 ? cost / operatingHours : 0;
    const solarPct = total > 0 ? (solarTot / total) * 100 : 0;

    const utility = periodB.uChiller + periodB.uMChiller + periodB.uComp + periodB.uPump + periodB.uCooling + periodB.uOther;
    const production = periodB.pLighting + periodB.pAcmv + periodB.pEquipment;
    const office = periodB.oAcmv + periodB.oSocket + periodB.oKit + periodB.oServer + periodB.oLighting;

    return {
      evnTot,
      solarTot,
      total,
      operatingHours,
      evnCost,
      solarCost,
      cost,
      kwhPerHour,
      costPerHour,
      solarPct,
      utility,
      production,
      office,
    };
  }, [periodB, tariffConfig]);

  // Delta between Period A and Period B
  const deltaAB = useMemo(() => {
    if (!statsA || !statsB || statsB.total === 0) return null;
    const totalDiff = statsA.total - statsB.total;
    const totalPct = ((statsA.total - statsB.total) / statsB.total) * 100;
    const dailyDiff = (periodA?.tbNgayKwh || 0) - (periodB?.tbNgayKwh || 0);
    const dailyPct = periodB?.tbNgayKwh ? (dailyDiff / periodB.tbNgayKwh) * 100 : 0;
    const evnDiff = statsA.evnTot - statsB.evnTot;
    const evnPct = statsB.evnTot ? (evnDiff / statsB.evnTot) * 100 : 0;
    const solarDiff = statsA.solarTot - statsB.solarTot;
    const solarPct = statsB.solarTot ? (solarDiff / statsB.solarTot) * 100 : 0;
    const costDiff = statsA.cost - statsB.cost;
    const costPct = statsB.cost ? (costDiff / statsB.cost) * 100 : 0;
    const kwhHourDiff = statsA.kwhPerHour - statsB.kwhPerHour;
    const costHourDiff = statsA.costPerHour - statsB.costPerHour;

    return {
      totalDiff,
      totalPct,
      dailyDiff,
      dailyPct,
      evnDiff,
      evnPct,
      solarDiff,
      solarPct,
      costDiff,
      costPct,
      kwhHourDiff,
      costHourDiff,
    };
  }, [statsA, statsB, periodA, periodB]);

  // Subsystem comparison list
  const subsystemCompare = useMemo(() => {
    if (!periodA || !periodB) return [];
    const items = [
      { key: 'uChiller', label: 'Chiller Lạnh (U_Chiller)', valA: periodA.uChiller, valB: periodB.uChiller, color: '#38bdf8' },
      { key: 'uMChiller', label: 'Mini Chiller (U_mChiller)', valA: periodA.uMChiller, valB: periodB.uMChiller, color: '#0ea5e9' },
      { key: 'uComp', label: 'Máy Nén Khí (U_Comp)', valA: periodA.uComp, valB: periodB.uComp, color: '#818cf8' },
      { key: 'uPump', label: 'Hệ Bơm Nước (U_Pump)', valA: periodA.uPump, valB: periodB.uPump, color: '#34d399' },
      { key: 'uCooling', label: 'Tháp Giải Nhiệt (U_Cooling)', valA: periodA.uCooling, valB: periodB.uCooling, color: '#2dd4bf' },
      { key: 'pAcmv', label: 'Điều Hòa Xưởng (P_ACMV)', valA: periodA.pAcmv, valB: periodB.pAcmv, color: '#fbbf24' },
      { key: 'pEquipment', label: 'Thiết Bị Sản Xuất (P_Equipment)', valA: periodA.pEquipment, valB: periodB.pEquipment, color: '#f472b6' },
      { key: 'pLighting', label: 'Chiếu Sáng Xưởng (P_Lighting)', valA: periodA.pLighting, valB: periodB.pLighting, color: '#a78bfa' },
      { key: 'oAcmv', label: 'Điều Hòa VP (O_ACMV)', valA: periodA.oAcmv, valB: periodB.oAcmv, color: '#f59e0b' },
      { key: 'oServer', label: 'Phòng Server IT (O_Server)', valA: periodA.oServer, valB: periodB.oServer, color: '#fb7185' },
      { key: 'oKit', label: 'Bếp Canteen (O_Kit)', valA: periodA.oKit, valB: periodB.oKit, color: '#f97316' },
      { key: 'oSocket', label: 'Ổ Cắm Văn Phòng (O_Socket)', valA: periodA.oSocket, valB: periodB.oSocket, color: '#a855f7' },
    ];
    return items;
  }, [periodA, periodB]);

  // Yearly aggregation: 2024 vs 2025 vs 2026
  const yearlyData = useMemo(() => {
    const years = [2024, 2025, 2026];
    return years.map((yr) => {
      const records = sortedRecords.filter((r) => parseMonthYear(r.chuKy).year === yr);
      const totalEVN = records.reduce((acc, r) => acc + r.evnBT + r.evnCD + r.evnTD, 0);
      const totalSolar = records.reduce((acc, r) => acc + r.solarBT + r.solarCD, 0);
      const totalGrand = totalEVN + totalSolar;
      const totalWorkDays = records.reduce((acc, r) => acc + r.ngayLamViec, 0);
      const totalHours = records.reduce((acc, r) => acc + getOperatingHours(r), 0);
      const totalCost = records.reduce((acc, r) => acc + estimateTotalEnergyCost(r), 0);
      const avgDaily = totalWorkDays > 0 ? totalGrand / totalWorkDays : 0;
      const kwhPerHour = totalHours > 0 ? totalGrand / totalHours : 0;
      const costPerHour = totalHours > 0 ? totalCost / totalHours : 0;
      const solarRatio = totalGrand > 0 ? (totalSolar / totalGrand) * 100 : 0;

      // Group by month
      const monthlyTotals: { [m: number]: number } = {};
      for (let m = 1; m <= 12; m++) {
        const mRecords = records.filter((r) => parseMonthYear(r.chuKy).month === m);
        const mTot = mRecords.reduce((acc, r) => acc + r.evnBT + r.evnCD + r.evnTD + r.solarBT + r.solarCD, 0);
        monthlyTotals[m] = mTot;
      }

      return {
        year: yr,
        periodCount: records.length,
        totalEVN,
        totalSolar,
        totalGrand,
        totalHours,
        totalCost,
        avgDaily,
        kwhPerHour,
        costPerHour,
        solarRatio,
        monthlyTotals,
      };
    });
  }, [sortedRecords, tariffConfig]);

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = [
      'Chu kỳ',
      'Từ ngày',
      'Đến ngày',
      'Ngày làm việc',
      'Loại Ca',
      'Tổng giờ vận hành (h)',
      'TB/Ngày (kWh)',
      'Sản lượng / 1h (kWh/h)',
      'Tổng EVN (kWh)',
      'EVN BT',
      'EVN CĐ',
      'EVN TĐ',
      'Tổng Solar (kWh)',
      'Solar BT',
      'Solar CĐ',
      'Tổng Tiêu Thụ (kWh)',
      'Tỷ lệ Solar (%)',
      'Tiền điện EVN (VNĐ)',
      'Tiền điện Solar theo giá EVN (VNĐ)',
      'Tổng chi phí năng lượng EVN+Solar (VNĐ)',
      'Chi phí / 1h vận hành (VNĐ/h)',
      'U_Chiller',
      'U_Comp',
      'U_Pump',
      'P_ACMV',
      'P_Equipment',
      'P_Lighting',
      'O_Server',
      'Người chốt'
    ];

    const rows = filteredList.map((r) => {
      const evnTot = r.evnBT + r.evnCD + r.evnTD;
      const solTot = r.solarBT + r.solarCD;
      const grand = evnTot + solTot;
      const hrs = getOperatingHours(r);
      const pct = grand > 0 ? ((solTot / grand) * 100).toFixed(1) : '0';
      const evnCost = estimateEvnCost(r.evnBT, r.evnCD, r.evnTD);
      const solarCost = estimateSolarCost(r.solarBT, r.solarCD);
      const totalCost = evnCost + solarCost;
      const kwhHour = hrs > 0 ? (grand / hrs).toFixed(2) : '0';
      const costHour = hrs > 0 ? Math.round(totalCost / hrs) : 0;

      return [
        `"${r.chuKy}"`,
        `"${r.tuNgay}"`,
        `"${r.denNgay}"`,
        r.ngayLamViec,
        `"${r.loaiCa}"`,
        hrs,
        r.tbNgayKwh,
        kwhHour,
        evnTot,
        r.evnBT,
        r.evnCD,
        r.evnTD,
        solTot,
        r.solarBT,
        r.solarCD,
        grand,
        `"${pct}%"`,
        evnCost,
        solarCost,
        totalCost,
        costHour,
        r.uChiller,
        r.uComp,
        r.uPump,
        r.pAcmv,
        r.pEquipment,
        r.pLighting,
        r.oServer,
        `"${r.nguoiChot}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FSM_SoSanh_NangLuong_Dien10Ngay_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Mode Switcher */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Zap className="w-4 h-4" />
            </span>
            <span className="font-mono text-xs font-bold text-blue-400">
              CƠ SỞ DỮ LIỆU ĐIỆN 10 NGÀY ({powerRecords.length} CHU KỲ: 2024 - 2026)
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-100">
            Dashboard Phân Tích & So Sánh Tiêu Thụ Điện Năng
          </h3>
          <p className="text-xs text-slate-400">
            Công cụ so sánh đa chiều giữa các chu kỳ 10 ngày, so sánh liên năm (YoY), phân tích tỷ lệ phụ tải và cơ cấu chi phí
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 self-start lg:self-auto">
          <button
            onClick={() => setCompareMode('donut_and_cost')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              compareMode === 'donut_and_cost'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-amber-300" />
            Đồ Thị Donut & Chi Phí Giờ / Ca
          </button>
          <button
            onClick={() => setCompareMode('period_vs_period')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              compareMode === 'period_vs_period'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            So Sánh 2 Kỳ (A vs B)
          </button>
          <button
            onClick={() => setCompareMode('yearly_yoy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              compareMode === 'yearly_yoy'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            So Sánh Theo Năm (YoY)
          </button>
          <button
            onClick={() => setCompareMode('all_filtered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              compareMode === 'all_filtered'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Lọc Đa Chiều ({filteredList.length})
          </button>
          <button
            onClick={() => setIsTariffModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm cursor-pointer ml-1"
            title="Điều chỉnh giá điện EVN, Solar, Nước và Tỷ giá USD/VNĐ"
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            Cài Đặt Đơn Giá
          </button>
        </div>
      </div>

      {/* Smart Quick Filter Bar (Năm - Tháng - Chu Kỳ) - Clean Dropdown <select> UI */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
              <Filter className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Bộ Lọc Thông Minh (Năm • Tháng • Chu Kỳ)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">
              Hiển thị: <strong className="text-cyan-400">{filteredStats.count}</strong> / {powerRecords.length} chu kỳ
            </span>
            {(filterYear !== 'ALL' || filterMonth !== 'ALL' || filterPeriodType !== 'ALL' || filterShift !== 'ALL' || filterApprover !== 'ALL' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setFilterYear('ALL');
                  setFilterMonth('ALL');
                  setFilterPeriodType('ALL');
                  setFilterShift('ALL');
                  setFilterApprover('ALL');
                  setSearchTerm('');
                }}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                Đặt Lại Bộ Lọc
              </button>
            )}
          </div>
        </div>

        {/* Compact Dropdown <select> Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Select Năm */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 block">1. Năm</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">📅 Tất Cả Năm (102 Kỳ)</option>
              <option value="2026">Năm 2026 (28 Kỳ)</option>
              <option value="2025">Năm 2025 (36 Kỳ)</option>
              <option value="2024">Năm 2024 (38 Kỳ)</option>
            </select>
          </div>

          {/* Select Tháng */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 block">2. Tháng</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">🗓️ Cả Năm (T01 - T12)</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={String(m)}>
                  Tháng {m < 10 ? `0${m}` : m}
                </option>
              ))}
            </select>
          </div>

          {/* Select Chu Kỳ */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 block">3. Chu Kỳ 10 Ngày</label>
            <select
              value={filterPeriodType}
              onChange={(e) => setFilterPeriodType(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">⚡ Tất Cả Chu Kỳ</option>
              <option value="P1">Kỳ 1 (Ngày 01 - 10)</option>
              <option value="P2">Kỳ 2 (Ngày 11 - 20)</option>
              <option value="P3">Kỳ 3 (Ngày 21 - Cuối)</option>
            </select>
          </div>

          {/* Select Ca Làm Việc */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 block">4. Loại Ca</label>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">🏭 Tất Cả Ca</option>
              <option value="2">Ca 2 (2 ca/ngày)</option>
              <option value="3">Ca 3 (3 ca/ngày)</option>
            </select>
          </div>

          {/* Select Người Chốt */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 block">5. Người Chốt</label>
            <select
              value={filterApprover}
              onChange={(e) => setFilterApprover(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
            >
              <option value="ALL">👤 Tất Cả</option>
              {approverOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 block">6. Tìm Kiếm</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã kỳ..."
                className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODE 0: ĐỒ THỊ DONUT & PHÂN TÍCH CHI PHÍ GIỜ / CA */}
      {compareMode === 'donut_and_cost' && (
        <div className="space-y-6">
          {/* Top 4 Executive Summary KPI Cards (incl. Per-Hour Output & Cost) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">Tổng Sản Lượng (EVN + Solar)</span>
                <span className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                  <Zap className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-black text-slate-100 font-mono">
                {filteredStats.grandTotal.toLocaleString('vi-VN')}{' '}
                <span className="text-xs font-semibold text-slate-400">kWh</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800 font-mono">
                <span>{filteredStats.totalWorkDays.toLocaleString()} ngày • {filteredStats.totalOperatingHours.toLocaleString()} giờ</span>
                <span className="text-cyan-400 font-bold">{filteredStats.avgDaily.toFixed(0)} kWh/d</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-lg flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-cyan-300">Sản Lượng / 1 Giờ Vận Hành</span>
                <span className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
                  <Activity className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-black text-cyan-400 font-mono">
                {filteredStats.kwhPerHour.toFixed(1)}{' '}
                <span className="text-xs font-semibold text-slate-400">kWh/giờ</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800 font-mono">
                <span>EVN: {filteredStats.evnKwhPerHour.toFixed(1)}/h</span>
                <span className="text-amber-400">Solar: {filteredStats.solarKwhPerHour.toFixed(1)}/h</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-lg flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-emerald-300">Tổng Chi Phí Năng Lượng</span>
                <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                  <DollarSign className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-black text-emerald-400 font-mono">
                {formatVND(filteredStats.totalCost)}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800 font-mono truncate">
                <span>EVN: {formatVND(filteredStats.totalEvnCost)}</span>
                <span className="text-amber-400">+Solar: {formatVND(filteredStats.totalSolarCost)}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-amber-300">Chi Phí / 1 Giờ Vận Hành</span>
                <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-black text-amber-400 font-mono">
                {formatVND(filteredStats.costPerHourVND)}
                <span className="text-xs font-semibold text-slate-400">/giờ</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800 font-mono">
                <span>~${filteredStats.costPerHourUSD.toFixed(2)} USD/h</span>
                <span className="text-slate-300">{Math.round(filteredStats.avgCostPerKwh).toLocaleString()} đ/kWh</span>
              </div>
            </div>
          </div>

          {/* 3 Balanced Donut Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
            {/* Donut 1: Nguồn Năng Lượng & Chi Phí (EVN + Solar tính theo giá EVN) */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between gap-4 h-full">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">Nguồn Điện & Chi Phí (EVN + Solar)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    Solar hạch toán theo đơn giá EVN (BT & CĐ)
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 font-mono shrink-0">
                  {filteredStats.solarRatio.toFixed(1)}% Solar
                </span>
              </div>

              <div className="my-auto">
                <SvgDonutChart
                  slices={[
                    {
                      label: 'Điện Lưới EVN',
                      value: filteredStats.totalEVN,
                      color: '#3b82f6',
                      formattedValue: `${filteredStats.totalEVN.toLocaleString('vi-VN')} kWh`,
                      subLabel: `Chi phí EVN: ${formatVND(filteredStats.totalEvnCost)}`,
                    },
                    {
                      label: 'Mặt Trời Solar',
                      value: filteredStats.totalSolar,
                      color: '#f59e0b',
                      formattedValue: `${filteredStats.totalSolar.toLocaleString('vi-VN')} kWh`,
                      subLabel: `Chi phí Solar (giá EVN): ${formatVND(filteredStats.totalSolarCost)}`,
                    },
                  ]}
                  centerLabel={`${filteredStats.solarRatio.toFixed(1)}%`}
                  centerSub="Tỷ Lệ Solar"
                />
              </div>

              <div className="pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>Tổng chi phí (EVN + Solar):</span>
                <strong className="text-emerald-400 font-bold">{formatVND(filteredStats.totalCost)}</strong>
              </div>
            </div>

            {/* Donut 2: Phụ Tải 3 Vùng (Utility vs Production vs Office) */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between gap-4 h-full">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">Cơ Cấu Phụ Tải 3 Vùng</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    Utility vs Production vs Office
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 font-mono shrink-0">
                  3 Phân Hệ
                </span>
              </div>

              <div className="my-auto">
                <SvgDonutChart
                  slices={[
                    {
                      label: 'Utility Phụ Trợ',
                      value: filteredStats.totalUtility,
                      color: '#06b6d4',
                      formattedValue: `${filteredStats.totalUtility.toLocaleString('vi-VN')} kWh`,
                      subLabel: `${filteredStats.totalOperatingHours > 0 ? (filteredStats.totalUtility / filteredStats.totalOperatingHours).toFixed(1) : '0'} kWh/h • Chiller, Nén khí`,
                    },
                    {
                      label: 'Production Sản Xuất',
                      value: filteredStats.totalProduction,
                      color: '#8b5cf6',
                      formattedValue: `${filteredStats.totalProduction.toLocaleString('vi-VN')} kWh`,
                      subLabel: `${filteredStats.totalOperatingHours > 0 ? (filteredStats.totalProduction / filteredStats.totalOperatingHours).toFixed(1) : '0'} kWh/h • Máy SX, ACMV`,
                    },
                    {
                      label: 'Office Văn Phòng',
                      value: filteredStats.totalOffice,
                      color: '#ec4899',
                      formattedValue: `${filteredStats.totalOffice.toLocaleString('vi-VN')} kWh`,
                      subLabel: `${filteredStats.totalOperatingHours > 0 ? (filteredStats.totalOffice / filteredStats.totalOperatingHours).toFixed(1) : '0'} kWh/h • ACMV, IT, Đèn`,
                    },
                  ]}
                  centerLabel={
                    filteredStats.totalUtility >= filteredStats.totalProduction
                      ? 'Utility'
                      : 'Prod'
                  }
                  centerSub="Tải Trọng Tâm"
                />
              </div>

              <div className="pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>Tổng 3 vùng ({filteredStats.totalOperatingHours.toLocaleString()}h):</span>
                <strong className="text-slate-100">
                  {(filteredStats.totalUtility + filteredStats.totalProduction + filteredStats.totalOffice).toLocaleString('vi-VN')} kWh
                </strong>
              </div>
            </div>

            {/* Donut 3: Khung Giờ Năng Lượng EVN + Solar (BT / CĐ / TĐ) */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between gap-4 h-full">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">Khung Giờ (EVN + Solar)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    Bình Thường (BT) • Cao Điểm (CĐ) • Thấp Điểm (TĐ)
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 font-mono shrink-0">
                  3 Khung Giờ
                </span>
              </div>

              <div className="my-auto">
                <SvgDonutChart
                  slices={[
                    {
                      label: 'Bình Thường (BT)',
                      value: filteredStats.totalAll_BT,
                      color: '#38bdf8',
                      formattedValue: `${filteredStats.totalAll_BT.toLocaleString('vi-VN')} kWh`,
                      subLabel: `Tiền: ${formatVND(filteredStats.costAll_BT)} (${tariffConfig.evnBT.toLocaleString()}đ/kWh)`,
                    },
                    {
                      label: 'Cao Điểm (CĐ)',
                      value: filteredStats.totalAll_CD,
                      color: '#f97316',
                      formattedValue: `${filteredStats.totalAll_CD.toLocaleString('vi-VN')} kWh`,
                      subLabel: `Tiền: ${formatVND(filteredStats.costAll_CD)} (${tariffConfig.evnCD.toLocaleString()}đ/kWh)`,
                    },
                    {
                      label: 'Thấp Điểm (TĐ)',
                      value: filteredStats.totalAll_TD,
                      color: '#10b981',
                      formattedValue: `${filteredStats.totalAll_TD.toLocaleString('vi-VN')} kWh`,
                      subLabel: `Tiền: ${formatVND(filteredStats.costAll_TD)} (${tariffConfig.evnTD.toLocaleString()}đ/kWh)`,
                    },
                  ]}
                  centerLabel={`${filteredStats.kwhPerHour.toFixed(0)}`}
                  centerSub="kWh / Giờ"
                />
              </div>

              <div className="pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>Chi phí / 1 giờ vận hành:</span>
                <strong className="text-cyan-400 font-bold">{formatVND(filteredStats.costPerHourVND)}/h</strong>
              </div>
            </div>
          </div>

          {/* Section: Phân Tích Chi Phí Khung Giờ (EVN + Solar theo giá EVN) & Chi Tiết / 1 Giờ */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Phân Tích Chi Phí Tiền Điện Theo Khung Giờ (EVN + Solar Hạch Toán Giá EVN)
                </h4>
                <p className="text-xs text-slate-400">
                  Điện Solar (BT & CĐ, không có TĐ) được tính theo đơn giá EVN và cộng trực tiếp vào tổng chi phí sử dụng năng lượng từng khung giờ & chi phí / 1 giờ vận hành
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Tổng: {formatVND(filteredStats.totalCost)}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {formatVND(filteredStats.costPerHourVND)}/giờ
                </span>
              </div>
            </div>

            {/* Table of Hours Breakdown */}
            <SmartHorizontalScroll>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5">Khung Giờ (EVN + Solar)</th>
                    <th className="py-3 px-3.5">Khoảng Thời Gian</th>
                    <th className="py-3 px-3.5 text-right">Tổng kWh (EVN+Solar)</th>
                    <th className="py-3 px-3.5 text-right">kWh / 1 Giờ</th>
                    <th className="py-3 px-3.5 text-right">Đơn Giá</th>
                    <th className="py-3 px-3.5 text-right">Thành Tiền (VNĐ)</th>
                    <th className="py-3 px-3.5 text-right">Chi Phí / 1 Giờ</th>
                    <th className="py-3 px-3.5 text-right">Quy Đổi (USD)</th>
                    <th className="py-3 px-3.5 text-right">Tỷ Trọng CP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {/* BT: EVN BT + Solar BT */}
                  <tr className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-3.5">
                      <div className="font-bold text-sky-400 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0"></span>
                        Giờ Bình Thường (BT)
                      </div>
                      <div className="text-[10px] text-slate-400 pl-4 font-mono mt-0.5">
                        EVN: {filteredStats.totalEVN_BT.toLocaleString('vi-VN')} + Solar: {filteredStats.totalSolar_BT.toLocaleString('vi-VN')} kWh
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 font-mono text-slate-300 text-[11px]">
                      <div>T2 - T7: 06h00-17h30 & 22h30-24h00 (13h)</div>
                      <div className="text-slate-400">Chủ Nhật: 06h00-24h00 (18h)</div>
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-bold text-slate-100">
                      {filteredStats.totalAll_BT.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-cyan-300 font-semibold">
                      {filteredStats.totalOperatingHours > 0
                        ? (filteredStats.totalAll_BT / filteredStats.totalOperatingHours).toFixed(1)
                        : '0'}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-cyan-300 font-semibold">
                      {tariffConfig.evnBT.toLocaleString()} đ
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-extrabold text-slate-100">
                      {formatVND(filteredStats.costAll_BT)}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-sky-300 font-bold">
                      {filteredStats.totalOperatingHours > 0
                        ? `${formatVND(filteredStats.costAll_BT / filteredStats.totalOperatingHours)}/h`
                        : '0 đ/h'}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-slate-400">
                      ${Math.round(filteredStats.costAll_BT / tariffConfig.usdToVndRate).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-sky-300 font-bold">
                      {filteredStats.totalCost > 0
                        ? ((filteredStats.costAll_BT / filteredStats.totalCost) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>

                  {/* CD: EVN CD + Solar CD */}
                  <tr className="hover:bg-slate-800/40 transition bg-amber-950/10">
                    <td className="py-3.5 px-3.5">
                      <div className="font-bold text-amber-400 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0"></span>
                        Giờ Cao Điểm (CĐ)
                      </div>
                      <div className="text-[10px] text-amber-400/80 pl-4 font-mono mt-0.5">
                        EVN: {filteredStats.totalEVN_CD.toLocaleString('vi-VN')} + Solar: {filteredStats.totalSolar_CD.toLocaleString('vi-VN')} kWh
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 font-mono text-amber-300 text-[11px]">
                      <div>17h30 - 22h30 (5h/ngày, T2 - T7)</div>
                      <div className="text-amber-400/70">Chủ Nhật: Không có giờ cao điểm</div>
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-bold text-amber-200">
                      {filteredStats.totalAll_CD.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-amber-300 font-semibold">
                      {filteredStats.totalOperatingHours > 0
                        ? (filteredStats.totalAll_CD / filteredStats.totalOperatingHours).toFixed(1)
                        : '0'}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-amber-400 font-bold">
                      {tariffConfig.evnCD.toLocaleString()} đ
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-extrabold text-amber-300">
                      {formatVND(filteredStats.costAll_CD)}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-amber-300 font-bold">
                      {filteredStats.totalOperatingHours > 0
                        ? `${formatVND(filteredStats.costAll_CD / filteredStats.totalOperatingHours)}/h`
                        : '0 đ/h'}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-slate-400">
                      ${Math.round(filteredStats.costAll_CD / tariffConfig.usdToVndRate).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-rose-400 font-bold">
                      {filteredStats.totalCost > 0
                        ? ((filteredStats.costAll_CD / filteredStats.totalCost) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>

                  {/* TD: EVN TD only (Solar has no low-peak) */}
                  <tr className="hover:bg-slate-800/40 transition bg-emerald-950/10">
                    <td className="py-3.5 px-3.5">
                      <div className="font-bold text-emerald-400 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
                        Giờ Thấp Điểm (TĐ)
                      </div>
                      <div className="text-[10px] text-emerald-400/80 pl-4 font-mono mt-0.5">
                        Chỉ tính EVN (Solar không có giờ TĐ)
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 font-mono text-emerald-300 text-[11px]">
                      <div>00h00 - 06h00 (6h/ngày)</div>
                      <div className="text-emerald-400/70">Áp dụng tất cả các ngày (kể cả CN)</div>
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-bold text-emerald-200">
                      {filteredStats.totalAll_TD.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-emerald-300 font-semibold">
                      {filteredStats.totalOperatingHours > 0
                        ? (filteredStats.totalAll_TD / filteredStats.totalOperatingHours).toFixed(1)
                        : '0'}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-emerald-400 font-bold">
                      {tariffConfig.evnTD.toLocaleString()} đ
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-extrabold text-emerald-300">
                      {formatVND(filteredStats.costAll_TD)}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-emerald-300 font-bold">
                      {filteredStats.totalOperatingHours > 0
                        ? `${formatVND(filteredStats.costAll_TD / filteredStats.totalOperatingHours)}/h`
                        : '0 đ/h'}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-slate-400">
                      ${Math.round(filteredStats.costAll_TD / tariffConfig.usdToVndRate).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-emerald-400 font-bold">
                      {filteredStats.totalCost > 0
                        ? ((filteredStats.costAll_TD / filteredStats.totalCost) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>

                  {/* Solar Component Sub-Row (Included in BT & CD above) */}
                  <tr className="hover:bg-slate-800/40 transition bg-yellow-950/20">
                    <td className="py-3 px-3.5 font-bold text-yellow-400 flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                      <span>Trong đó: Điện Solar (đã cộng vào BT & CĐ)</span>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-yellow-300 text-[11px]">
                      <div>BT: {filteredStats.totalSolar_BT.toLocaleString('vi-VN')} kWh • CĐ: {filteredStats.totalSolar_CD.toLocaleString('vi-VN')} kWh</div>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-yellow-300">
                      {filteredStats.totalSolar.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-yellow-300">
                      {filteredStats.solarKwhPerHour.toFixed(1)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-yellow-300 text-[11px]">
                      Giá EVN BT/CĐ
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-400">
                      + {formatVND(filteredStats.totalSolarCost)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-amber-300">
                      {filteredStats.totalOperatingHours > 0
                        ? `${formatVND(filteredStats.totalSolarCost / filteredStats.totalOperatingHours)}/h`
                        : '0 đ/h'}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-amber-300">
                      ${Math.round(filteredStats.totalSolarCost / tariffConfig.usdToVndRate).toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-amber-400 font-bold">
                      {filteredStats.totalCost > 0
                        ? ((filteredStats.totalSolarCost / filteredStats.totalCost) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>

                  {/* Summary Row */}
                  <tr className="bg-slate-800/90 font-bold text-slate-100">
                    <td className="py-3.5 px-3.5" colSpan={2}>
                      TỔNG CỘNG NĂNG LƯỢNG EVN + SOLAR ({filteredStats.count} Chu Kỳ • {filteredStats.totalOperatingHours.toLocaleString()} Giờ)
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-cyan-300 text-sm">
                      {filteredStats.grandTotal.toLocaleString('vi-VN')} kWh
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-cyan-300">
                      {filteredStats.kwhPerHour.toFixed(1)} kWh/h
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-slate-400">
                      {Math.round(filteredStats.avgCostPerKwh).toLocaleString()} đ
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-emerald-400 text-sm">
                      {formatVND(filteredStats.totalCost)}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-amber-400 font-extrabold">
                      {formatVND(filteredStats.costPerHourVND)}/h
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-slate-200">
                      ${Math.round(filteredStats.totalCost / tariffConfig.usdToVndRate).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-cyan-300">100%</td>
                  </tr>
                </tbody>
              </table>
            </SmartHorizontalScroll>
          </div>

          {/* Section: Phân Tích Chi Phí & Hiệu Suất Theo Ca Làm Việc */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Factory className="w-4 h-4 text-indigo-400" />
                  Phân Tích Chi Phí & Sản Lượng Theo Ca & 1 Giờ Vận Hành (Ca 2 vs Ca 3)
                </h4>
                <p className="text-xs text-slate-400">
                  So sánh sản lượng & tổng chi phí năng lượng (EVN + Solar) theo ngày và trung bình trên 1 giờ vận hành giữa Ca 2 (16h/ngày) và Ca 3 (24h/ngày)
                </p>
              </div>
            </div>

            {/* 2 Shift Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shift 2 Card */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Chế Độ Sản Xuất Ca 2 (16h / Ngày)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/20 text-blue-300 font-bold">
                    {filteredStats.shift2.count} kỳ • {filteredStats.shift2.operatingHours.toLocaleString()} giờ
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 block">TB / Ngày:</span>
                    <span className="text-base font-mono font-extrabold text-cyan-400">
                      {filteredStats.shift2.dailyKwh.toFixed(1)} <span className="text-[10px] text-slate-400">kWh/d</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Sản Lượng / 1 Giờ:</span>
                    <span className="text-base font-mono font-extrabold text-sky-400">
                      {filteredStats.shift2.kwhPerHour.toFixed(1)} <span className="text-[10px] text-slate-400">kWh/h</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Chi Phí / Ngày:</span>
                    <span className="text-base font-mono font-extrabold text-emerald-400">
                      {formatVND(filteredStats.shift2.dailyCost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Chi Phí / 1 Giờ:</span>
                    <span className="text-base font-mono font-extrabold text-amber-400">
                      {formatVND(filteredStats.shift2.costPerHour)}<span className="text-[10px] text-slate-400">/h</span>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/60 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Tổng điện tiêu thụ ({filteredStats.shift2.workDays} ngày):</span>
                    <strong>{filteredStats.shift2.totalKwh.toLocaleString('vi-VN')} kWh</strong>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Tổng chi phí (EVN + Solar):</span>
                    <strong className="text-emerald-400">{formatVND(filteredStats.shift2.cost)}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <strong>Đặc điểm Ca 2:</strong> Vận hành 16 giờ/ngày, tắt phụ tải ban đêm giúp giảm tiêu thụ tổng nhưng suất tiêu hao giờ ban ngày cao hơn do không hưởng khung giờ thấp điểm.
                </p>
              </div>

              {/* Shift 3 Card */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-indigo-500/30 space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    Chế Độ Sản Xuất Ca 3 (24h / Ngày)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300 font-bold">
                    {filteredStats.shift3.count} kỳ • {filteredStats.shift3.operatingHours.toLocaleString()} giờ
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 block">TB / Ngày:</span>
                    <span className="text-base font-mono font-extrabold text-cyan-400">
                      {filteredStats.shift3.dailyKwh.toFixed(1)} <span className="text-[10px] text-slate-400">kWh/d</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Sản Lượng / 1 Giờ:</span>
                    <span className="text-base font-mono font-extrabold text-sky-400">
                      {filteredStats.shift3.kwhPerHour.toFixed(1)} <span className="text-[10px] text-slate-400">kWh/h</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Chi Phí / Ngày:</span>
                    <span className="text-base font-mono font-extrabold text-emerald-400">
                      {formatVND(filteredStats.shift3.dailyCost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Chi Phí / 1 Giờ:</span>
                    <span className="text-base font-mono font-extrabold text-amber-400">
                      {formatVND(filteredStats.shift3.costPerHour)}<span className="text-[10px] text-slate-400">/h</span>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/60 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Tổng điện tiêu thụ ({filteredStats.shift3.workDays} ngày):</span>
                    <strong>{filteredStats.shift3.totalKwh.toLocaleString('vi-VN')} kWh</strong>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Tổng chi phí (EVN + Solar):</span>
                    <strong className="text-emerald-400">{formatVND(filteredStats.shift3.cost)}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <strong>Đặc điểm Ca 3:</strong> Vận hành liên tục 24h/ngày, tận dụng 6h thấp điểm (00h00-06h00) chỉ {tariffConfig.evnTD.toLocaleString()} đ/kWh giúp tối ưu chi phí năng lượng bình quân trên mỗi giờ vận hành.
                </p>
              </div>
            </div>

            {/* Shift Comparative Insights */}
            {filteredStats.shift2.dailyKwh > 0 && filteredStats.shift3.dailyKwh > 0 && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-indigo-300 uppercase tracking-wide block">
                    So Sánh Hiệu Suất & Chi Phí Giữa Ca 3 (24h) và Ca 2 (16h):
                  </span>
                  <p className="text-slate-300">
                    Chuyển từ 2 ca sang 3 ca làm tiêu thụ ngày tăng{' '}
                    <strong className="text-cyan-400 font-mono">
                      +{(filteredStats.shift3.dailyKwh - filteredStats.shift2.dailyKwh).toFixed(1)} kWh/ngày
                    </strong>{' '}
                    ({(((filteredStats.shift3.dailyKwh - filteredStats.shift2.dailyKwh) / filteredStats.shift2.dailyKwh) * 100).toFixed(1)}%),
                    còn chi phí/giờ vận hành thay đổi{' '}
                    <strong className="text-amber-400 font-mono">
                      {filteredStats.shift3.costPerHour - filteredStats.shift2.costPerHour >= 0 ? '+' : ''}
                      {formatVND(filteredStats.shift3.costPerHour - filteredStats.shift2.costPerHour)}/giờ
                    </strong>.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 block">Đơn giá điện bình quân Ca 3:</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    {Math.round(filteredStats.shift3.cost / (filteredStats.shift3.totalKwh || 1)).toLocaleString()} đ/kWh
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 1: PERIOD VS PERIOD COMPARISON */}
      {compareMode === 'period_vs_period' && (
        <div className="space-y-6">
          {/* Period Selector Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Period A Select */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-800/40 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  KỲ SO SÁNH A (Kỳ Mốc)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {periodA?.denNgay}
                </span>
              </div>
              <select
                value={selectedPeriodAId}
                onChange={(e) => setSelectedPeriodAId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortedRecords.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.chuKy} ({r.denNgay}) — {r.tbNgayKwh.toLocaleString('vi-VN')} kWh/ngày — {r.loaiCa}
                  </option>
                ))}
              </select>
            </div>

            {/* Period B Select */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-800/40 border border-cyan-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                  KỲ SO SÁNH B (Kỳ Đối Chiếu)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {periodB?.denNgay}
                </span>
              </div>
              <select
                value={selectedPeriodBId}
                onChange={(e) => setSelectedPeriodBId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {sortedRecords.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.chuKy} ({r.denNgay}) — {r.tbNgayKwh.toLocaleString('vi-VN')} kWh/ngày — {r.loaiCa}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparative KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Tổng Tiêu Thụ */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tổng Điện Tiêu Thụ</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-xs text-blue-400 font-bold">Kỳ A: {statsA?.total.toLocaleString('vi-VN')} kWh</div>
                  <div className="text-xs text-cyan-400 font-bold">Kỳ B: {statsB?.total.toLocaleString('vi-VN')} kWh</div>
                </div>
                {deltaAB && (
                  <div className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${
                    deltaAB.totalDiff <= 0
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {deltaAB.totalDiff <= 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                    <span>{deltaAB.totalPct > 0 ? '+' : ''}{deltaAB.totalPct.toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                Chênh lệch: <strong className={deltaAB && deltaAB.totalDiff > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {deltaAB && deltaAB.totalDiff > 0 ? '+' : ''}{deltaAB?.totalDiff.toLocaleString('vi-VN')} kWh
                </strong>
              </div>
            </div>

            {/* Card 2: Sản lượng / Giờ & TB Ngày */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Hiệu Suất / 1 Giờ & Ngày</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-xs text-blue-400 font-bold">
                    Kỳ A: {statsA?.kwhPerHour.toFixed(1)} kWh/h ({periodA?.tbNgayKwh.toLocaleString('vi-VN')}/d)
                  </div>
                  <div className="text-xs text-cyan-400 font-bold">
                    Kỳ B: {statsB?.kwhPerHour.toFixed(1)} kWh/h ({periodB?.tbNgayKwh.toLocaleString('vi-VN')}/d)
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                Chênh lệch / giờ:{' '}
                <strong className={deltaAB && deltaAB.kwhHourDiff > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {deltaAB && deltaAB.kwhHourDiff > 0 ? '+' : ''}{deltaAB?.kwhHourDiff.toFixed(1)} kWh/h
                </strong>
              </div>
            </div>

            {/* Card 3: Năng Lượng Mặt Trời Solar */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Sản Lượng Solar (Giá EVN)</span>
                <Sun className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-xs text-blue-400 font-bold">Kỳ A: {statsA?.solarTot.toLocaleString('vi-VN')} kWh ({statsA?.solarPct.toFixed(1)}%)</div>
                  <div className="text-xs text-cyan-400 font-bold">Kỳ B: {statsB?.solarTot.toLocaleString('vi-VN')} kWh ({statsB?.solarPct.toFixed(1)}%)</div>
                </div>
                {deltaAB && (
                  <div className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${
                    deltaAB.solarDiff >= 0
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {deltaAB.solarDiff >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{deltaAB.solarPct > 0 ? '+' : ''}{deltaAB.solarPct.toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                Chi phí Solar Kỳ A:{' '}
                <strong className="text-amber-400">
                  {statsA ? formatVND(statsA.solarCost) : '0 đ'}
                </strong>
              </div>
            </div>

            {/* Card 4: Tổng Chi Phí EVN + Solar & Chi Phí / 1 Giờ */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tổng Chi Phí (EVN + Solar)</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-blue-400 font-bold">
                  Kỳ A: {statsA ? formatVND(statsA.cost) : '0'} ({statsA ? formatVND(statsA.costPerHour) : '0'}/h)
                </div>
                <div className="text-xs text-cyan-400 font-bold">
                  Kỳ B: {statsB ? formatVND(statsB.cost) : '0'} ({statsB ? formatVND(statsB.costPerHour) : '0'}/h)
                </div>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                Chênh lệch / 1 giờ:{' '}
                <strong className={deltaAB && deltaAB.costHourDiff > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {deltaAB && deltaAB.costHourDiff > 0 ? '+' : ''}
                  {deltaAB ? formatVND(deltaAB.costHourDiff) : '0 đ'}/h
                </strong>
              </div>
            </div>
          </div>

          {/* Card Hàng 2: So Sánh 3 Khu Vực (Utility, Production, Office) Kỳ A vs Kỳ B */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/20 to-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                So Sánh 3 Phân Hệ Phụ Tải (Utility, Production, Office) Giữa 2 Kỳ
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                <strong className="text-blue-400">Kỳ A</strong> vs <strong className="text-cyan-400">Kỳ B</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Utility */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-cyan-500/30 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-400 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" />
                    Khu Vực Utility
                  </span>
                  <span className="font-mono text-[11px] text-cyan-300">
                    {statsA?.utility.toLocaleString()} vs {statsB?.utility.toLocaleString()} kWh
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Chênh lệch:</span>
                  <strong className={(statsA?.utility || 0) - (statsB?.utility || 0) <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {(statsA?.utility || 0) - (statsB?.utility || 0) > 0 ? '+' : ''}
                    {((statsA?.utility || 0) - (statsB?.utility || 0)).toLocaleString()} kWh
                  </strong>
                </div>
              </div>

              {/* Production */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-amber-500/30 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Factory className="w-3.5 h-3.5" />
                    Khu Vực Production
                  </span>
                  <span className="font-mono text-[11px] text-amber-300">
                    {statsA?.production.toLocaleString()} vs {statsB?.production.toLocaleString()} kWh
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Chênh lệch:</span>
                  <strong className={(statsA?.production || 0) - (statsB?.production || 0) <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {(statsA?.production || 0) - (statsB?.production || 0) > 0 ? '+' : ''}
                    {((statsA?.production || 0) - (statsB?.production || 0)).toLocaleString()} kWh
                  </strong>
                </div>
              </div>

              {/* Office */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-purple-500/30 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    Khu Vực Office
                  </span>
                  <span className="font-mono text-[11px] text-purple-300">
                    {statsA?.office.toLocaleString()} vs {statsB?.office.toLocaleString()} kWh
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Chênh lệch:</span>
                  <strong className={(statsA?.office || 0) - (statsB?.office || 0) <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {(statsA?.office || 0) - (statsB?.office || 0) > 0 ? '+' : ''}
                    {((statsA?.office || 0) - (statsB?.office || 0)).toLocaleString()} kWh
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Head-to-Head Source & Tariffs Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: EVN Tariffs Comparison */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Cơ Cấu Nguồn EVN 3 Giá (BT / CĐ / TĐ)
                </span>
                <span className="text-xs text-slate-400 font-mono">Đơn vị: kWh</span>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* EVN Bình Thường */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>1. Giờ Bình Thường (EVN BT)</span>
                    <span className="font-mono">
                      <span className="text-blue-400">{periodA?.evnBT.toLocaleString('vi-VN')}</span> vs{' '}
                      <span className="text-cyan-400">{periodB?.evnBT.toLocaleString('vi-VN')}</span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 flex overflow-hidden">
                    <div
                      style={{ width: `${Math.min(((periodA?.evnBT || 0) / Math.max(periodA?.evnBT || 1, periodB?.evnBT || 1)) * 50, 50)}%` }}
                      className="bg-blue-500 h-full"
                      title={`Kỳ A: ${periodA?.evnBT} kWh`}
                    ></div>
                    <div className="w-1 bg-slate-900"></div>
                    <div
                      style={{ width: `${Math.min(((periodB?.evnBT || 0) / Math.max(periodA?.evnBT || 1, periodB?.evnBT || 1)) * 50, 50)}%` }}
                      className="bg-cyan-500 h-full"
                      title={`Kỳ B: ${periodB?.evnBT} kWh`}
                    ></div>
                  </div>
                </div>

                {/* EVN Cao Điểm */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-rose-400">2. Giờ Cao Điểm (EVN CĐ - {tariffConfig.evnCD.toLocaleString()} đ/kWh)</span>
                    <span className="font-mono">
                      <span className="text-blue-400">{periodA?.evnCD.toLocaleString('vi-VN')}</span> vs{' '}
                      <span className="text-cyan-400">{periodB?.evnCD.toLocaleString('vi-VN')}</span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 flex overflow-hidden">
                    <div
                      style={{ width: `${Math.min(((periodA?.evnCD || 0) / Math.max(periodA?.evnCD || 1, periodB?.evnCD || 1)) * 50, 50)}%` }}
                      className="bg-rose-500 h-full"
                    ></div>
                    <div className="w-1 bg-slate-900"></div>
                    <div
                      style={{ width: `${Math.min(((periodB?.evnCD || 0) / Math.max(periodA?.evnCD || 1, periodB?.evnCD || 1)) * 50, 50)}%` }}
                      className="bg-rose-400 h-full opacity-80"
                    ></div>
                  </div>
                </div>

                {/* EVN Thấp Điểm */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-emerald-400">3. Giờ Thấp Điểm (EVN TĐ - {tariffConfig.evnTD.toLocaleString()} đ/kWh)</span>
                    <span className="font-mono">
                      <span className="text-blue-400">{periodA?.evnTD.toLocaleString('vi-VN')}</span> vs{' '}
                      <span className="text-cyan-400">{periodB?.evnTD.toLocaleString('vi-VN')}</span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 flex overflow-hidden">
                    <div
                      style={{ width: `${Math.min(((periodA?.evnTD || 0) / Math.max(periodA?.evnTD || 1, periodB?.evnTD || 1)) * 50, 50)}%` }}
                      className="bg-emerald-500 h-full"
                    ></div>
                    <div className="w-1 bg-slate-900"></div>
                    <div
                      style={{ width: `${Math.min(((periodB?.evnTD || 0) / Math.max(periodA?.evnTD || 1, periodB?.evnTD || 1)) * 50, 50)}%` }}
                      className="bg-emerald-400 h-full opacity-80"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Solar Energy Generation */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  Điện Mặt Trời Mái Nhà (Solar BT & Solar CĐ)
                </span>
                <span className="text-xs text-emerald-400 font-bold">Tự dùng 100%</span>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Solar BT */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Solar Giờ Bình Thường (Solar BT)</span>
                    <span className="font-mono">
                      <span className="text-blue-400">{periodA?.solarBT.toLocaleString('vi-VN')}</span> vs{' '}
                      <span className="text-cyan-400">{periodB?.solarBT.toLocaleString('vi-VN')}</span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 flex overflow-hidden">
                    <div
                      style={{ width: `${Math.min(((periodA?.solarBT || 0) / Math.max(periodA?.solarBT || 1, periodB?.solarBT || 1)) * 50, 50)}%` }}
                      className="bg-amber-500 h-full"
                    ></div>
                    <div className="w-1 bg-slate-900"></div>
                    <div
                      style={{ width: `${Math.min(((periodB?.solarBT || 0) / Math.max(periodA?.solarBT || 1, periodB?.solarBT || 1)) * 50, 50)}%` }}
                      className="bg-amber-400 h-full opacity-80"
                    ></div>
                  </div>
                </div>

                {/* Solar CĐ */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Solar Giờ Cao Điểm (Solar CĐ - Tiết kiệm tối đa)</span>
                    <span className="font-mono">
                      <span className="text-blue-400">{periodA?.solarCD.toLocaleString('vi-VN')}</span> vs{' '}
                      <span className="text-cyan-400">{periodB?.solarCD.toLocaleString('vi-VN')}</span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 flex overflow-hidden">
                    <div
                      style={{ width: `${Math.min(((periodA?.solarCD || 0) / Math.max(periodA?.solarCD || 1, periodB?.solarCD || 1)) * 50, 50)}%` }}
                      className="bg-orange-500 h-full"
                    ></div>
                    <div className="w-1 bg-slate-900"></div>
                    <div
                      style={{ width: `${Math.min(((periodB?.solarCD || 0) / Math.max(periodA?.solarCD || 1, periodB?.solarCD || 1)) * 50, 50)}%` }}
                      className="bg-orange-400 h-full opacity-80"
                    ></div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Tỷ trọng năng lượng tái tạo:</span>
                  <span className="font-bold font-mono text-cyan-400">
                    Kỳ A: {statsA?.solarPct.toFixed(1)}% | Kỳ B: {statsB?.solarPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subsystems Breakdown Comparison Table & Dual Meter */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  So Sánh Tiêu Thụ Từng Phân Hệ Phụ Tải (Subsystems Delta)
                </h4>
                <p className="text-xs text-slate-400">
                  Phân tích chi tiết mức tiêu thụ giữa Kỳ A ({periodA?.chuKy}) và Kỳ B ({periodB?.chuKy})
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                  <span className="w-3 h-3 rounded-sm bg-blue-500"></span> Kỳ A
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <span className="w-3 h-3 rounded-sm bg-cyan-500"></span> Kỳ B
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subsystemCompare.map((sub) => {
                const maxVal = Math.max(sub.valA, sub.valB, 1);
                const diff = sub.valA - sub.valB;
                const diffPct = sub.valB > 0 ? (diff / sub.valB) * 100 : 0;

                return (
                  <div
                    key={sub.key}
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2 hover:border-slate-600 transition"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-200">{sub.label}</span>
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          diff > 0
                            ? 'bg-rose-500/10 text-rose-400'
                            : diff < 0
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {diff > 0 ? '+' : ''}{diff.toLocaleString('vi-VN')} kWh ({diffPct > 0 ? '+' : ''}{diffPct.toFixed(1)}%)
                      </span>
                    </div>

                    {/* Dual Progress Bars */}
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {/* Bar A */}
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-blue-400 font-bold shrink-0">Kỳ A:</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                          <div
                            style={{ width: `${(sub.valA / maxVal) * 100}%`, backgroundColor: '#3b82f6' }}
                            className="h-full rounded-full transition-all duration-300"
                          ></div>
                        </div>
                        <span className="w-16 text-right text-slate-200 font-bold">
                          {sub.valA.toLocaleString('vi-VN')}
                        </span>
                      </div>

                      {/* Bar B */}
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-cyan-400 font-bold shrink-0">Kỳ B:</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                          <div
                            style={{ width: `${(sub.valB / maxVal) * 100}%`, backgroundColor: '#06b6d4' }}
                            className="h-full rounded-full transition-all duration-300"
                          ></div>
                        </div>
                        <span className="w-16 text-right text-slate-300 font-bold">
                          {sub.valB.toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: YEARLY COMPARISON (2024 vs 2025 vs 2026) */}
      {compareMode === 'yearly_yoy' && (
        <div className="space-y-6">
          {/* Yearly Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {yearlyData.map((yr) => (
              <div
                key={yr.year}
                className={`p-5 rounded-2xl border transition space-y-3 ${
                  yr.year === 2026
                    ? 'bg-gradient-to-b from-indigo-950/40 to-slate-900 border-indigo-500/40 shadow-xl'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-slate-100">
                    NĂM {yr.year}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    {yr.periodCount} chu kỳ 10 ngày
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block">Tổng Điện Tiêu Thụ:</span>
                  <span className="text-xl font-extrabold text-cyan-400 font-mono">
                    {yr.totalGrand.toLocaleString('vi-VN')} <span className="text-xs text-slate-400">kWh</span>
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">EVN Lưới Điện:</span>
                    <strong className="text-slate-200 font-mono">{yr.totalEVN.toLocaleString('vi-VN')} kWh</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Điện Mặt Trời Solar:</span>
                    <strong className="text-amber-400 font-mono">{yr.totalSolar.toLocaleString('vi-VN')} kWh</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tổng Chi Phí (EVN + Solar):</span>
                    <strong className="text-emerald-400 font-mono">{formatVND(yr.totalCost)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Sản Lượng / 1 Giờ:</span>
                    <strong className="text-cyan-400 font-mono">{yr.kwhPerHour.toFixed(1)} kWh/h</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Chi Phí / 1 Giờ:</span>
                    <strong className="text-amber-400 font-mono">{formatVND(yr.costPerHour)}/h</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">TB Ngày / Tỷ lệ Solar:</span>
                    <strong className="text-indigo-400 font-mono">
                      {yr.avgDaily.toFixed(0)} kWh/d • {yr.solarRatio.toFixed(1)}%
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly Comparison Across 3 Years (Months 1 to 12) */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  So Sánh Tổng Năng Lượng Theo Từng Tháng Qua 3 Năm (2024 - 2025 - 2026)
                </h4>
                <p className="text-xs text-slate-400">
                  Biểu đồ so sánh sản lượng tiêu thụ kWh của từng tháng trong 3 năm
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-3 rounded-sm bg-slate-600"></span> 2024
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-3 h-3 rounded-sm bg-cyan-500"></span> 2025
                </span>
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <span className="w-3 h-3 rounded-sm bg-indigo-500"></span> 2026
                </span>
              </div>
            </div>

            {/* Monthly grouped bars */}
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                const val2024 = yearlyData.find((y) => y.year === 2024)?.monthlyTotals[m] || 0;
                const val2025 = yearlyData.find((y) => y.year === 2025)?.monthlyTotals[m] || 0;
                const val2026 = yearlyData.find((y) => y.year === 2026)?.monthlyTotals[m] || 0;
                const maxVal = Math.max(val2024, val2025, val2026, 1);

                return (
                  <div key={m} className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold text-slate-300">
                      <span>Tháng {m < 10 ? `0${m}` : m}</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        2024: <span className="text-slate-300">{val2024 ? val2024.toLocaleString('vi-VN') : '-'}</span> |{' '}
                        2025: <span className="text-cyan-400">{val2025 ? val2025.toLocaleString('vi-VN') : '-'}</span> |{' '}
                        2026: <span className="text-indigo-400">{val2026 ? val2026.toLocaleString('vi-VN') : '-'}</span> kWh
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 h-2.5 rounded-full bg-slate-900 overflow-hidden">
                      {/* 2024 */}
                      <div className="h-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${(val2024 / maxVal) * 100}%` }}
                          className="h-full bg-slate-600 rounded-full"
                          title={`2024 - T${m}: ${val2024.toLocaleString()} kWh`}
                        ></div>
                      </div>
                      {/* 2025 */}
                      <div className="h-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${(val2025 / maxVal) * 100}%` }}
                          className="h-full bg-cyan-500 rounded-full"
                          title={`2025 - T${m}: ${val2025.toLocaleString()} kWh`}
                        ></div>
                      </div>
                      {/* 2026 */}
                      <div className="h-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${(val2026 / maxVal) * 100}%` }}
                          className="h-full bg-indigo-500 rounded-full"
                          title={`2026 - T${m}: ${val2026.toLocaleString()} kWh`}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: MULTI-FILTER & DETAIL COMPARISON TABLE */}
      {compareMode === 'all_filtered' && (
        <div className="space-y-6">
          {/* Filter Bar Controls */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-blue-400" />
                Bộ Lọc Dữ Liệu Theo Nhu Cầu Người Dùng
              </span>
              <button
                type="button"
                onClick={() => {
                  setFilterYear('ALL');
                  setFilterMonth('ALL');
                  setFilterPeriodType('ALL');
                  setFilterShift('ALL');
                  setFilterApprover('ALL');
                  setSearchTerm('');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Đặt Lại Bộ Lọc
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* Filter Year */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Năm</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả năm</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              {/* Filter Month */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tháng</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả tháng</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <option key={m} value={String(m)}>
                      Tháng {m < 10 ? `0${m}` : m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Period Type */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Chu Kỳ</label>
                <select
                  value={filterPeriodType}
                  onChange={(e) => setFilterPeriodType(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả kỳ</option>
                  <option value="P1">Kỳ 1 (01 - 10)</option>
                  <option value="P2">Kỳ 2 (11 - 20)</option>
                  <option value="P3">Kỳ 3 (21 - Cuối)</option>
                </select>
              </div>

              {/* Filter Shift */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Loại Ca</label>
                <select
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả ca</option>
                  <option value="2">Ca 2</option>
                  <option value="3">Ca 3</option>
                </select>
              </div>

              {/* Filter Approver */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Người Chốt</label>
                <select
                  value={filterApprover}
                  onChange={(e) => setFilterApprover(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả</option>
                  {approverOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search text */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Mã chu kỳ..."
                    className="w-full pl-8 pr-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Filter Summary Pill */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3">
              <span className="text-slate-300">
                Tìm thấy <strong className="text-cyan-400">{filteredStats.count}</strong> chu kỳ |
                Tổng: <strong className="text-amber-400 font-mono">{filteredStats.grandTotal.toLocaleString('vi-VN')} kWh</strong> |
                Hiệu suất: <strong className="text-cyan-400 font-mono">{filteredStats.kwhPerHour.toFixed(1)} kWh/h</strong> |
                Chi phí (EVN+Solar): <strong className="text-emerald-400 font-mono">{formatVND(filteredStats.totalCost)} ({formatVND(filteredStats.costPerHourVND)}/h)</strong>
              </span>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow transition"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                Xuất Báo Cáo So Sánh (CSV)
              </button>
            </div>
          </div>

          {/* Filtered Data Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <SmartHorizontalScroll>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5">Chu Kỳ (10 Ngày)</th>
                    <th className="py-3 px-3.5">Thời Gian</th>
                    <th className="py-3 px-3.5">Ca / Giờ</th>
                    <th className="py-3 px-3.5 text-right">kWh / 1 Giờ</th>
                    <th className="py-3 px-3.5 text-right">Tổng EVN</th>
                    <th className="py-3 px-3.5 text-right">Tổng Solar</th>
                    <th className="py-3 px-3.5 text-right">Tổng kWh</th>
                    <th className="py-3 px-3.5 text-right">Tổng Chi Phí (EVN+Solar)</th>
                    <th className="py-3 px-3.5 text-right">Chi Phí / 1 Giờ</th>
                    <th className="py-3 px-3.5">Người Chốt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredList.map((r) => {
                    const evnTot = r.evnBT + r.evnCD + r.evnTD;
                    const solTot = r.solarBT + r.solarCD;
                    const grand = evnTot + solTot;
                    const hrs = getOperatingHours(r);
                    const kwhPerHr = hrs > 0 ? grand / hrs : 0;
                    const totalPeriodCost = estimateTotalEnergyCost(r);
                    const costPerHr = hrs > 0 ? totalPeriodCost / hrs : 0;

                    return (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3.5 font-mono font-bold text-cyan-400 whitespace-nowrap">
                          {r.chuKy}
                        </td>
                        <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                          {r.tuNgay} → {r.denNgay}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {r.loaiCa} ({hrs}h)
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-cyan-300 whitespace-nowrap">
                          {kwhPerHr.toFixed(1)} kWh/h
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono whitespace-nowrap">
                          {evnTot.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono text-amber-400 whitespace-nowrap">
                          {solTot.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                          {grand.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono text-emerald-400 font-bold whitespace-nowrap">
                          {formatVND(totalPeriodCost)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono text-amber-300 font-bold whitespace-nowrap">
                          {formatVND(costPerHr)}/h
                        </td>
                        <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap text-[11px]">
                          {r.nguoiChot}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredList.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                        Không tìm thấy dữ liệu chu kỳ phù hợp với bộ lọc đã chọn.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </SmartHorizontalScroll>
          </div>
        </div>
      )}

      {/* Modal Cài Đặt Đơn Giá & Tỷ Giá */}
      <TariffConfigModal
        isOpen={isTariffModalOpen}
        onClose={() => setIsTariffModalOpen(false)}
      />
    </div>
  );
};
