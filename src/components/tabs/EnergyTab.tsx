import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { formatVND } from '../../utils/cmmsLogic';
import { EnergyCompareDashboard } from '../energy/EnergyCompareDashboard';
import { MonthlyEnergyTrendChart } from '../energy/MonthlyEnergyTrendChart';
import { DailyPowerModal } from '../energy/DailyPowerModal';
import { Power10DaysModal } from '../energy/Power10DaysModal';
import { WaterRecordingModal } from '../energy/WaterRecordingModal';
import { TariffConfigModal } from '../energy/TariffConfigModal';
import { DailyReadingsWithAlerts } from '../energy/DailyReadingsWithAlerts';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  Zap,
  Droplet,
  Plus,
  Layers,
  TrendingUp,
  BarChart3,
  Settings,
  Cpu,
  Factory,
  Building2,
  Filter,
  ShieldAlert,
} from 'lucide-react';

interface EnergyTabProps {
  onOpenMeterModal: () => void;
}

export const EnergyTab: React.FC<EnergyTabProps> = ({ onOpenMeterModal: _onOpenMeterModal }) => {
  const { power10Days, waterMonthly, meterReadings, tariffConfig, theme } = useCMMS();

  const [activeSubTab, setActiveSubTab] = useState<
    'compareDashboard' | 'dailyReadings' | 'power10' | 'waterMonth'
  >('compareDashboard');

  // Modal states
  const [isDailyPowerModalOpen, setIsDailyPowerModalOpen] = useState(false);
  const [isPower10DaysModalOpen, setIsPower10DaysModalOpen] = useState(false);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [waterModalMode, setWaterModalMode] = useState<'daily' | 'monthly'>('daily');
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);

  // Water month year filter
  const [waterYearFilter, setWaterYearFilter] = useState<'ALL' | '2026' | '2025' | '2024'>('ALL');

  // Filtered water months
  const filteredWaterMonthly = waterMonthly.filter((w) => {
    if (waterYearFilter === 'ALL') return true;
    return w.month.startsWith(waterYearFilter);
  });

  const waterTotals = filteredWaterMonthly.reduce(
    (acc, w) => {
      acc.totalWaterM3 += w.waterM3;
      acc.totalSewageM3 += w.waterM3 * 0.8;
      acc.totalWaterVND += w.waterVND;
      acc.totalWaterUSD += w.waterUSD;
      acc.totalSewageVND += w.sewageVND;
      acc.totalSewageUSD += w.sewageUSD;
      return acc;
    },
    {
      totalWaterM3: 0,
      totalSewageM3: 0,
      totalWaterVND: 0,
      totalWaterUSD: 0,
      totalSewageVND: 0,
      totalSewageUSD: 0,
    }
  );

  const avgWaterM3PerMonth =
    filteredWaterMonthly.length > 0
      ? Math.round(waterTotals.totalWaterM3 / filteredWaterMonthly.length)
      : 0;

  const waterLineChartData = useMemo(() => {
    return [...filteredWaterMonthly]
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((w) => {
        const [y, m] = w.month.split('-');
        return {
          month: w.month,
          label: m && y ? `${m}/${y}` : w.month,
          waterM3: w.waterM3,
          sewageM3: Math.round(w.waterM3 * 0.8 * 10) / 10,
        };
      });
  }, [filteredWaterMonthly]);

  // Latest 10-day power record (sorted by date descending)
  const sortedPower = [...power10Days].sort((a, b) => b.denNgay.localeCompare(a.denNgay));
  const latest10 = sortedPower[0];
  const evnTotal = latest10 ? latest10.evnBT + latest10.evnCD + latest10.evnTD : 0;
  const solarTotal = latest10 ? latest10.solarBT + latest10.solarCD : 0;
  const grandTotal = evnTotal + solarTotal;
  const solarPct = grandTotal > 0 ? (solarTotal / grandTotal) * 100 : 0;
  const latestHours = latest10
    ? (latest10.ngayLamViec || 0) * (latest10.loaiCa?.includes('3') ? 24 : 16)
    : 0;
  const latestKwhPerHour = latestHours > 0 ? grandTotal / latestHours : 0;
  const latestEvnCost = latest10
    ? latest10.evnBT * tariffConfig.evnBT +
      latest10.evnCD * tariffConfig.evnCD +
      latest10.evnTD * tariffConfig.evnTD
    : 0;
  const latestSolarCost = latest10
    ? latest10.solarBT * tariffConfig.evnBT + latest10.solarCD * tariffConfig.evnCD
    : 0;
  const latestTotalCost = latestEvnCost + latestSolarCost;
  const latestCostPerHour = latestHours > 0 ? latestTotalCost / latestHours : 0;
  const recent8 = sortedPower.slice(0, 8).reverse();
  const maxRecentBar = Math.max(
    ...recent8.map((rec) =>
      Math.max(rec.evnBT + rec.evnCD + rec.evnTD, rec.solarBT + rec.solarCD)
    ),
    1
  );

  // 3 Phân Vùng Lớn của chu kỳ gần nhất:
  // Utility = U_Chiller + U_mChiller + U_Comp + U_Pump + U_Cooling + U_Other
  const latestUtility = latest10
    ? latest10.uChiller +
      latest10.uMChiller +
      latest10.uComp +
      latest10.uPump +
      latest10.uCooling +
      latest10.uOther
    : 0;

  // Production = P_Lighting + P_ACMV + P_Equipment
  const latestProduction = latest10
    ? latest10.pLighting + latest10.pAcmv + latest10.pEquipment
    : 0;

  // Office = O_ACMV + O_Socket + O_Kit + O_Server + O_Lighting
  const latestOffice = latest10
    ? latest10.oAcmv +
      latest10.oSocket +
      latest10.oKit +
      latest10.oServer +
      latest10.oLighting
    : 0;

  // Breakdown items for latest period
  const plantBreakdown = latest10
    ? [
        { label: 'Chiller Lạnh (U_Chiller)', value: latest10.uChiller, color: '#38bdf8' },
        { label: 'Máy Nén Khí (U_Comp)', value: latest10.uComp, color: '#818cf8' },
        { label: 'Bơm Nước (U_Pump)', value: latest10.uPump, color: '#34d399' },
        { label: 'ACMV Điều Hòa Xưởng (P_ACMV)', value: latest10.pAcmv, color: '#fbbf24' },
        { label: 'Thiết Bị SX (P_Equipment)', value: latest10.pEquipment, color: '#f472b6' },
        { label: 'Chiếu Sáng (P_Lighting)', value: latest10.pLighting, color: '#a78bfa' },
        { label: 'Tháp Giải Nhiệt (U_Cooling)', value: latest10.uCooling, color: '#2dd4bf' },
        { label: 'Phòng Server IT (O_Server)', value: latest10.oServer, color: '#fb7185' },
      ]
    : [];

  const maxVal = Math.max(...plantBreakdown.map((b) => b.value), 1);



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            {UI_TEXTS.tabs.energy.title}
          </h2>
        </div>

        {/* Action Button Toolbar: Chốt Điện Hàng Ngày, Chốt Chu Kỳ, Chốt Nước, Đơn Giá */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsDailyPowerModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-sm"
            title="Ghi nhận 10 tủ điện EVN và 3 tủ điện Solar hàng ngày"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-200" />
            <span>Chốt Điện Tủ (13 Tủ)</span>
          </button>

          <button
            onClick={() => setIsPower10DaysModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-sm"
            title="Chốt số điện chu kỳ 10 ngày (3 giá EVN/Solar + 3 khu vực)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Chốt Điện 10 Ngày</span>
          </button>

          <button
            onClick={() => {
              setWaterModalMode('daily');
              setIsWaterModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm"
            title="Chốt 8 đồng hồ nước hàng ngày (Nước sinh hoạt = P1 - P2) và Chốt nước tháng"
          >
            <Droplet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Chốt Số Nước</span>
          </button>

          <button
            onClick={() => setIsTariffModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition shadow-sm"
            title="Cài đặt giá điện 3 giá, giá nước và tỷ giá USD"
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span>Đơn Giá & Tỷ Giá</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveSubTab('compareDashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'compareDashboard'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-300" />
            So Sánh Tiêu Thụ ({power10Days.length} Kỳ)
          </button>

          <button
            onClick={() => setActiveSubTab('dailyReadings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'dailyReadings'
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
            Số Điện - Nước Hàng Ngày & Cảnh Báo ({meterReadings.length})
          </button>

          <button
            onClick={() => setActiveSubTab('power10')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'power10'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Kỳ Gần Nhất & 3 Phân Hệ
          </button>

          <button
            onClick={() => setActiveSubTab('waterMonth')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'waterMonth'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" />
            Nước Tháng ({waterMonthly.length})
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Tỷ giá: 1 USD = {tariffConfig.usdToVndRate.toLocaleString()} đ</span>
          <span>•</span>
          <span className="text-cyan-400">EVN BT: {formatVND(tariffConfig.evnBT)}</span>
        </div>
      </div>

      {/* Sub-tab 0: Biểu Đồ Xu Hướng Điện & Nước Hàng Tháng (Recharts) + Dashboard So Sánh */}
      {activeSubTab === 'compareDashboard' && (
        <div className="space-y-6">
          <MonthlyEnergyTrendChart
            power10Days={power10Days}
            waterMonthly={waterMonthly}
            theme={theme}
          />
          <EnergyCompareDashboard powerRecords={power10Days} />
        </div>
      )}

      {/* Sub-tab: Số Điện - Nước Hàng Ngày & Cảnh Báo Bất Thường */}
      {activeSubTab === 'dailyReadings' && (
        <DailyReadingsWithAlerts
          readings={meterReadings}
          onOpenDailyPowerModal={() => setIsDailyPowerModalOpen(true)}
          onOpenDailyWaterModal={() => {
            setWaterModalMode('daily');
            setIsWaterModalOpen(true);
          }}
        />
      )}

      {/* Sub-tab 1: Điện 10 ngày & 3 Phân Hệ */}
      {activeSubTab === 'power10' && (
        <div className="space-y-6">
          {/* Key Metrics Chu kỳ gần nhất */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Tổng Tiêu Thụ & Giờ Vận Hành</span>
              <div className="text-xl font-extrabold text-slate-100 font-mono mt-0.5">
                {grandTotal.toLocaleString()} <span className="text-xs text-slate-400">kWh</span>
              </div>
              <span className="text-[11px] text-cyan-400 font-mono block font-semibold">
                {latestKwhPerHour.toFixed(1)} kWh/giờ ({latestHours}h • {latest10?.ngayLamViec} ngày)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Lưới Điện EVN & Solar (kWh)</span>
              <div className="text-xl font-extrabold text-cyan-400 font-mono mt-0.5">
                {evnTotal.toLocaleString()}{' '}
                <span className="text-xs text-amber-400">+ {solarTotal.toLocaleString()}</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                Solar đóng góp {solarPct.toFixed(1)}% ({latest10?.loaiCa})
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-1">
              <span className="text-xs text-emerald-300 font-medium">Tổng Chi Phí (EVN + Solar)</span>
              <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
                {formatVND(latestTotalCost)}
              </div>
              <span className="text-[11px] text-amber-400 font-semibold mt-1 block font-mono">
                {formatVND(latestCostPerHour)}/giờ vận hành
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Chu Kỳ Gần Nhất / Người Chốt</span>
              <div className="text-sm font-bold text-slate-200 mt-0.5 truncate">
                {latest10?.chuKy} • {latest10?.nguoiChot || 'Khiêm Huỳnh'}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                EVN: {formatVND(latestEvnCost)} + Solar: {formatVND(latestSolarCost)}
              </span>
            </div>
          </div>

          {/* KPI 3 Phân Vùng Lớn (Utility, Production, Office) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900 border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
                  <Layers className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-100 text-sm">
                  Cơ Cấu Tiêu Thụ Điện Theo 3 Khu Vực Chính (Chu Kỳ {latest10?.chuKy})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Tổng 3 khu vực: {(latestUtility + latestProduction + latestOffice).toLocaleString()} kWh
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-cyan-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    Khu Vực Utility (Phụ Trợ)
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {((latestUtility / (grandTotal || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-lg font-black text-slate-100 font-mono">
                  {latestUtility.toLocaleString()} <span className="text-xs text-slate-400 font-normal">kWh</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  Chiller ({latest10?.uChiller.toLocaleString()}) • Nén khí ({latest10?.uComp.toLocaleString()}) • Bơm ({latest10?.uPump.toLocaleString()})
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5" />
                    Khu Vực Production (Sản Xuất)
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {((latestProduction / (grandTotal || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-lg font-black text-slate-100 font-mono">
                  {latestProduction.toLocaleString()} <span className="text-xs text-slate-400 font-normal">kWh</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  Máy móc ({latest10?.pEquipment.toLocaleString()}) • ACMV SX ({latest10?.pAcmv.toLocaleString()}) • Đèn ({latest10?.pLighting.toLocaleString()})
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-purple-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Khu Vực Office (Văn Phòng)
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-300">
                    {((latestOffice / (grandTotal || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-lg font-black text-slate-100 font-mono">
                  {latestOffice.toLocaleString()} <span className="text-xs text-slate-400 font-normal">kWh</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  ACMV VP ({latest10?.oAcmv.toLocaleString()}) • Server IT ({latest10?.oServer.toLocaleString()}) • Ổ cắm ({latest10?.oSocket.toLocaleString()})
                </p>
              </div>
            </div>
          </div>

          {/* Visual Chart: 8 Chu Kỳ Gần Nhất */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  Biểu Đồ Xu Hướng 8 Chu Kỳ Điện Gần Nhất (EVN vs Solar)
                </h3>
                <p className="text-xs text-slate-400">
                  Xem toàn bộ 102 chu kỳ và bộ lọc nâng cao tại tab "So Sánh Tiêu Thụ"
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-3 h-3 rounded bg-cyan-500"></span> EVN Lưới
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-3 h-3 rounded bg-amber-500"></span> Solar Mặt Trời
                </span>
              </div>
            </div>

            <div className="h-64 flex items-end gap-4 pt-6 px-2 border-b border-slate-800 overflow-x-auto">
              {recent8.map((rec) => {
                const eTotal = rec.evnBT + rec.evnCD + rec.evnTD;
                const sTotal = rec.solarBT + rec.solarCD;
                const evnHeight = Math.max(4, Math.min(210, (eTotal / maxRecentBar) * 210));
                const solarHeight = Math.max(4, Math.min(210, (sTotal / maxRecentBar) * 210));

                return (
                  <div key={rec.id} className="flex-1 flex flex-col items-center gap-2 group min-w-[70px]">
                    <div className="w-full flex items-end justify-center gap-1.5 h-[220px]">
                      {/* EVN bar */}
                      <div
                        style={{ height: `${evnHeight}px` }}
                        className="w-1/2 max-w-[40px] rounded-t-lg bg-gradient-to-t from-cyan-600 to-cyan-400 transition hover:brightness-110 relative"
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-cyan-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                          {eTotal.toLocaleString()}
                        </span>
                      </div>
                      {/* Solar bar */}
                      <div
                        style={{ height: `${solarHeight}px` }}
                        className="w-1/2 max-w-[40px] rounded-t-lg bg-gradient-to-t from-amber-600 to-amber-400 transition hover:brightness-110 relative"
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-amber-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                          {sTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium text-center truncate max-w-[120px]">
                      {rec.chuKy.split('(')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plant Sub-systems Consumption Breakdown */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-100 text-sm">
              Cơ Cấu Tiêu Thụ Điện Theo Từng Phân Hệ Máy Móc (Chu Kỳ Gần Nhất)
            </h3>

            <div className="space-y-3">
              {plantBreakdown.map((item) => {
                const pct = grandTotal > 0 ? (item.value / grandTotal) * 100 : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">{item.label}</span>
                      <div className="space-x-3">
                        <span className="font-mono font-bold text-slate-100">
                          {item.value.toLocaleString()} kWh
                        </span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          ({pct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${(item.value / maxVal) * 100}%`, backgroundColor: item.color }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Nước hàng tháng (Sheet 9 - Nuoc_month toàn bộ 34 tháng) */}
      {activeSubTab === 'waterMonth' && (
        <div className="space-y-6">
          {/* Banner Quy Tắc 80% & Nút Thao Tác */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-300">
                Lượng nước thải được tính quy chuẩn bằng <strong className="text-emerald-400 font-bold">80%</strong> lượng nước sinh hoạt chốt theo tháng. Đơn giá: Cấp {formatVND(tariffConfig.waterVNDPerM3)}/m³ • Thải {formatVND(tariffConfig.sewageVNDPerM3)}/m³.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setWaterModalMode('daily');
                  setIsWaterModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs shadow-sm transition"
              >
                <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                Chốt Số Hàng Ngày (P1-P2)
              </button>
              <button
                onClick={() => {
                  setWaterModalMode('monthly');
                  setIsWaterModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Chốt Nước Tháng Mới
              </button>
            </div>
          </div>

          {/* Quick Filter Year Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-400" />
                Lọc Theo Năm:
              </span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setWaterYearFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    waterYearFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tất Cả ({waterMonthly.length} Tháng)
                </button>
                <button
                  type="button"
                  onClick={() => setWaterYearFilter('2026')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    waterYearFilter === '2026'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Năm 2026 (10 Tháng)
                </button>
                <button
                  type="button"
                  onClick={() => setWaterYearFilter('2025')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    waterYearFilter === '2025'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Năm 2025 (12 Tháng)
                </button>
                <button
                  type="button"
                  onClick={() => setWaterYearFilter('2024')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    waterYearFilter === '2024'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Năm 2024 (12 Tháng)
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Hiển thị: <strong className="text-cyan-400 font-bold">{filteredWaterMonthly.length}</strong> / {waterMonthly.length} tháng
            </div>
          </div>

          {/* 4 KPI Summary Cards for Water */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Tổng Nước Cấp Tiêu Thụ</span>
              <div className="text-xl font-extrabold text-cyan-400 font-mono">
                {waterTotals.totalWaterM3.toLocaleString()} <span className="text-xs text-slate-400">m³</span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                TB {avgWaterM3PerMonth.toLocaleString()} m³/tháng ({filteredWaterMonthly.length} tháng)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Lượng Nước Thải Quy Chuẩn (80%)</span>
              <div className="text-xl font-extrabold text-amber-300 font-mono">
                {Math.round(waterTotals.totalSewageM3).toLocaleString()} <span className="text-xs text-slate-400">m³</span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                Áp dụng quy tắc 80% thể tích nước cấp
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Tổng Tiền Nước Cấp</span>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">
                {formatVND(waterTotals.totalWaterVND)}
              </div>
              <span className="text-[11px] text-slate-400 block font-mono">
                Tương đương ${waterTotals.totalWaterUSD.toLocaleString()} USD
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Tổng Phí Xử Lý Nước Thải</span>
              <div className="text-xl font-extrabold text-amber-400 font-mono">
                {formatVND(waterTotals.totalSewageVND)}
              </div>
              <span className="text-[11px] text-slate-400 block font-mono">
                Tương đương ${waterTotals.totalSewageUSD.toLocaleString()} USD
              </span>
            </div>
          </div>

          {/* Monthly Water Recharts Line Chart */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Biểu Đồ Đường Xu Hướng Nước Cấp &amp; Nước Thải 80% Theo Tháng (m³)
                </h4>
                <span className="text-[11px] text-slate-400">
                  Dữ liệu trực quan theo chuỗi thời gian ({waterLineChartData.length} tháng hiển thị)
                </span>
              </div>
            </div>

            {waterLineChartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-slate-500">
                Chưa có dữ liệu nước tháng trong năm đã chọn.
              </div>
            ) : (
              <div className="w-full h-[280px] pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={waterLineChartData}
                    margin={{ top: 10, right: 16, left: 4, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      stroke={theme === 'dark' ? '#94a3b8' : '#475569'}
                      tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={theme === 'dark' ? '#94a3b8' : '#475569'}
                      tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v.toLocaleString('vi-VN')}`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                        borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} iconType="circle" />
                    <Line
                      type="monotone"
                      dataKey="waterM3"
                      name="Nước Cấp (m³)"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ r: 3.5 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sewageM3"
                      name="Nước Thải 80% (m³)"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      strokeDasharray="5 4"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Full Table */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Bảng Dữ Liệu Chi Tiết Sheet Nuoc_month ({filteredWaterMonthly.length} Bản Ghi)
                </h3>
                <p className="text-xs text-slate-400">
                  Đầy đủ dữ liệu nước cấp, nước thải quy chuẩn 80%, thành tiền VNĐ và quy đổi USD
                </p>
              </div>
            </div>

            <SmartHorizontalScroll>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Tháng (Month)</th>
                    <th className="py-3 px-4 text-right">Lượng Nước Cấp (m³)</th>
                    <th className="py-3 px-4 text-right">Lượng Nước Thải (80%)</th>
                    <th className="py-3 px-4 text-right">Tiền Nước (VNĐ)</th>
                    <th className="py-3 px-4 text-right">Tiền Nước (USD)</th>
                    <th className="py-3 px-4 text-right">Phí Nước Thải (VNĐ)</th>
                    <th className="py-3 px-4 text-right">Phí Nước Thải (USD)</th>
                    <th className="py-3 px-4 text-right">Tổng Chi Phí Nước (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredWaterMonthly.map((w) => {
                    const estSewageM3 = Math.round(w.waterM3 * 0.8 * 10) / 10;
                    const totalMonthCost = w.waterVND + w.sewageVND;
                    return (
                      <tr key={w.month} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                          {w.month}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100 text-sm">
                          {w.waterM3.toLocaleString()} m³
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-amber-300 font-semibold">
                          {estSewageM3.toLocaleString()} m³
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                          {formatVND(w.waterVND)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          ${w.waterUSD.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-amber-400 font-semibold">
                          {formatVND(w.sewageVND)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          ${w.sewageUSD.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-300">
                          {formatVND(totalMonthCost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </SmartHorizontalScroll>
          </div>
        </div>
      )}

      {/* ALL MODALS */}
      <DailyPowerModal
        isOpen={isDailyPowerModalOpen}
        onClose={() => setIsDailyPowerModalOpen(false)}
      />

      <Power10DaysModal
        isOpen={isPower10DaysModalOpen}
        onClose={() => setIsPower10DaysModalOpen(false)}
      />

      <WaterRecordingModal
        isOpen={isWaterModalOpen}
        initialMode={waterModalMode}
        onClose={() => setIsWaterModalOpen(false)}
      />

      <TariffConfigModal
        isOpen={isTariffModalOpen}
        onClose={() => setIsTariffModalOpen(false)}
      />
    </div>
  );
};
