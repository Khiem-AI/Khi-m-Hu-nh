import React, { useState, useEffect } from 'react';
import { MeterReading } from '../../types/cmms';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Settings,
  Download,
  Zap,
  Droplet,
  Calendar,
  User,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Gauge,
  SlidersHorizontal,
} from 'lucide-react';

interface DailyThresholds {
  evnKwh: number;
  solarKwh: number;
  waterM3: number;
  enableZeroAlert: boolean;
}

const DEFAULT_THRESHOLDS: DailyThresholds = {
  evnKwh: 1200,
  solarKwh: 600,
  waterM3: 45,
  enableZeroAlert: true,
};

interface DailyReadingsWithAlertsProps {
  readings: MeterReading[];
  onOpenDailyPowerModal: () => void;
  onOpenDailyWaterModal: () => void;
}

export const DailyReadingsWithAlerts: React.FC<DailyReadingsWithAlertsProps> = ({
  readings,
  onOpenDailyPowerModal,
  onOpenDailyWaterModal,
}) => {
  // Thresholds state with localStorage persistence
  const [thresholds, setThresholds] = useState<DailyThresholds>(() => {
    try {
      const saved = localStorage.getItem('cmms_daily_energy_thresholds');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return DEFAULT_THRESHOLDS;
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempThresholds, setTempThresholds] = useState<DailyThresholds>(thresholds);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | string>('ALL');
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  const saveThresholds = () => {
    setThresholds(tempThresholds);
    localStorage.setItem('cmms_daily_energy_thresholds', JSON.stringify(tempThresholds));
    setIsConfigOpen(false);
  };

  const resetThresholds = () => {
    setTempThresholds(DEFAULT_THRESHOLDS);
  };

  // Check if a reading is abnormal
  const checkReadingStatus = (r: MeterReading) => {
    const isWater = r.donVi.toLowerCase().includes('m3') || r.nguon.includes('Nước');
    const isSolar = r.nguon === 'Solar' || r.tenDongHo.includes('INVT');
    const threshold = isWater
      ? thresholds.waterM3
      : isSolar
      ? thresholds.solarKwh
      : thresholds.evnKwh;

    const isExceeded = r.tieuThu > threshold;
    const isZero = thresholds.enableZeroAlert && r.tieuThu === 0;
    const excessPct = threshold > 0 ? ((r.tieuThu - threshold) / threshold) * 100 : 0;

    return {
      isAbnormal: isExceeded || isZero,
      isExceeded,
      isZero,
      threshold,
      excessPct,
    };
  };

  // Filtered readings
  const filteredReadings = readings
    .filter((r) => {
      const matchSearch =
        r.tenDongHo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.nguoiGhi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.nguon.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSource =
        sourceFilter === 'ALL' ||
        r.nguon === sourceFilter ||
        (sourceFilter === 'Nước Sinh hoạt' && r.nguon === 'Nước Máy');
      const matchDate = !dateFilter || r.ngayChot === dateFilter;

      const status = checkReadingStatus(r);
      const matchAbnormal = !onlyAbnormal || status.isAbnormal;

      return matchSearch && matchSource && matchDate && matchAbnormal;
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Summary counters
  const totalLogs = readings.length;
  const abnormalLogs = readings.filter((r) => checkReadingStatus(r).isAbnormal).length;
  const evnLogs = readings.filter((r) => r.nguon === 'EVN').length;
  const waterLogs = readings.filter((r) => r.donVi.includes('m3') || r.nguon.includes('Nước')).length;

  const handleExportCSV = () => {
    const headers = [
      'Thời gian',
      'Ngày chốt',
      'Nguồn',
      'Tên đồng hồ / Tủ điện',
      'Chỉ số cũ',
      'Chỉ số mới',
      'Sản lượng tiêu thụ',
      'Đơn vị',
      'Ngưỡng cài đặt',
      'Trạng thái cảnh báo',
      'Người ghi nhận',
    ];

    const rows = filteredReadings.map((r) => {
      const st = checkReadingStatus(r);
      const statusText = st.isExceeded
        ? `VƯỢT NGƯỠNG (+${st.excessPct.toFixed(1)}%)`
        : st.isZero
        ? 'TIÊU THỤ BẰNG 0'
        : 'Bình thường';
      return [
        `"${r.timestamp}"`,
        `"${r.ngayChot}"`,
        `"${r.nguon === 'Nước Máy' ? 'Nước Sinh hoạt' : r.nguon}"`,
        `"${r.tenDongHo}"`,
        r.chiSoCu,
        r.chiSoMoi,
        r.tieuThu,
        `"${r.donVi}"`,
        st.threshold,
        `"${statusText}"`,
        `"${r.nguoiGhi}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Canh_Bao_Dien_Nuoc_Hang_Ngay_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Overview Alert Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
                Hệ Thống Giám Sát Chỉ Số Hàng Ngày
              </span>
              {abnormalLogs > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  ⚠️ Có {abnormalLogs} bản ghi bất thường
                </span>
              )}
            </div>
            <h3 className="text-base font-extrabold text-slate-100 tracking-tight mt-1">
              Dữ Liệu Số Điện & Nước Hàng Ngày Kèm Cảnh Báo Vượt Ngưỡng
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Tự động đối chiếu mức tiêu thụ từng tủ điện (EVN/Solar) và đồng hồ nước với ngưỡng an toàn cài đặt trước
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setTempThresholds(thresholds);
              setIsConfigOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs shadow-sm transition"
            title="Cài đặt ngưỡng sản lượng cảnh báo"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Cài Ngưỡng Cảnh Báo</span>
          </button>

          <button
            onClick={onOpenDailyPowerModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm transition"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Chốt Điện Tủ</span>
          </button>

          <button
            onClick={onOpenDailyWaterModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>Chốt Số Nước</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tổng Nhật Ký Ghi</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {totalLogs.toLocaleString()} <span className="text-xs text-slate-400 font-normal">lần ghi</span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            Bao gồm {evnLogs} tủ điện & {waterLogs} đồng hồ nước
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cảnh Báo Vượt Ngưỡng</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className={`text-2xl font-black font-mono ${abnormalLogs > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {abnormalLogs} <span className="text-xs text-slate-400 font-normal">bản ghi</span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            {abnormalLogs > 0 ? 'Cần kỹ thuật kiểm tra rò rỉ / quá tải' : 'Tất cả trong ngưỡng an toàn'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ngưỡng Tủ Điện EVN</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            {thresholds.evnKwh.toLocaleString()} <span className="text-xs text-slate-400 font-normal">kWh/lần</span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            Solar: {thresholds.solarKwh.toLocaleString()} kWh/lần
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ngưỡng Đồng Hồ Nước</span>
            <Droplet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {thresholds.waterM3.toLocaleString()} <span className="text-xs text-slate-400 font-normal">m³/lần</span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            Cảnh báo rò rỉ đường ống hoặc thất thoát
          </span>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tủ điện, đồng hồ nước, người chốt..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả nguồn ({readings.length})</option>
            <option value="EVN">⚡ Tủ Điện EVN</option>
            <option value="Solar">☀️ Tủ Điện Solar</option>
            <option value="Nước Sinh hoạt">💧 Nước Sinh hoạt</option>
            <option value="Nước Tái Sử Dụng">♻️ Nước Tái Sử Dụng / Thải</option>
            <option value="Khí Nén">💨 Khí Nén</option>
          </select>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[10px] text-slate-400 hover:text-slate-200 ml-1"
              >
                ✕
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={onlyAbnormal}
              onChange={(e) => setOnlyAbnormal(e.target.checked)}
              className="rounded bg-slate-700 border-slate-600 text-rose-500 focus:ring-rose-500"
            />
            <span className="font-semibold text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Chỉ xem Bất Thường ({abnormalLogs})
            </span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            {filteredReadings.length} / {readings.length} bản ghi
          </span>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Xuất CSV
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <SmartHorizontalScroll>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Thời Gian & Ngày Chốt</th>
                <th className="py-3 px-4">Nguồn</th>
                <th className="py-3 px-4">Tên Tủ / Đồng Hồ</th>
                <th className="py-3 px-4 text-right">Chỉ Số Cũ</th>
                <th className="py-3 px-4 text-right">Chỉ Số Mới</th>
                <th className="py-3 px-4 text-right">Sản Lượng Tiêu Thụ</th>
                <th className="py-3 px-4 text-center">Ngưỡng An Toàn</th>
                <th className="py-3 px-4">Trạng Thái Đánh Giá</th>
                <th className="py-3 px-4">Người Ghi Nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredReadings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Không tìm thấy bản ghi số điện/nước nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredReadings.map((r) => {
                  const status = checkReadingStatus(r);
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-800/40 transition ${
                        status.isAbnormal ? 'bg-rose-950/15' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-200 font-bold">{r.ngayChot}</div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {r.timestamp}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                            r.nguon === 'EVN'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : r.nguon === 'Solar'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {r.nguon === 'EVN' && <Zap className="w-2.5 h-2.5" />}
                          {r.nguon === 'Solar' && <Zap className="w-2.5 h-2.5" />}
                          {r.nguon.includes('Nước') && <Droplet className="w-2.5 h-2.5" />}
                          {r.nguon === 'Nước Máy' ? 'Nước Sinh hoạt' : r.nguon}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-100 max-w-[220px] truncate">
                        {r.tenDongHo}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                        {r.chiSoCu.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-200 font-semibold">
                        {r.chiSoMoi.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                        <span
                          className={
                            status.isExceeded
                              ? 'text-rose-400'
                              : status.isZero
                              ? 'text-amber-400'
                              : 'text-cyan-300'
                          }
                        >
                          {r.tieuThu.toLocaleString()}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400 font-normal">{r.donVi}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs">
                        ≤ {status.threshold.toLocaleString()} {r.donVi}
                      </td>

                      <td className="py-3.5 px-4">
                        {status.isExceeded ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Vượt ngưỡng (+{status.excessPct.toFixed(0)}%)</span>
                          </div>
                        ) : status.isZero ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Tiêu thụ = 0 (Kẹt/Dừng)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Bình thường</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-300">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{r.nguoiGhi || 'Kỹ thuật viên'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </SmartHorizontalScroll>
      </div>

      {/* Threshold Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Cài Đặt Ngưỡng Cảnh Báo Tiêu Thụ Bất Thường
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hệ thống sẽ gắn cờ đỏ cảnh báo khi mức tiêu thụ mỗi lần ghi vượt ngưỡng này
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Ngưỡng Tủ Điện EVN Hàng Ngày (kWh / lần ghi)
                </label>
                <input
                  type="number"
                  value={tempThresholds.evnKwh}
                  onChange={(e) =>
                    setTempThresholds({
                      ...tempThresholds,
                      evnKwh: Math.max(0, Number(e.target.value.replace(/^0+/, '') || 0)),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-[11px] text-slate-400 block">
                  Mặc định: 1,200 kWh. Nếu tủ ghi vượt mức này, cờ cảnh báo đỏ sẽ hiển thị.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Ngưỡng Tủ Điện Solar Hàng Ngày (kWh / lần ghi)
                </label>
                <input
                  type="number"
                  value={tempThresholds.solarKwh}
                  onChange={(e) =>
                    setTempThresholds({
                      ...tempThresholds,
                      solarKwh: Math.max(0, Number(e.target.value.replace(/^0+/, '') || 0)),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[11px] text-slate-400 block">
                  Mặc định: 600 kWh.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5" />
                  Ngưỡng Đồng Hồ Nước Hàng Ngày (m³ / lần ghi)
                </label>
                <input
                  type="number"
                  value={tempThresholds.waterM3}
                  onChange={(e) =>
                    setTempThresholds({
                      ...tempThresholds,
                      waterM3: Math.max(0, Number(e.target.value.replace(/^0+/, '') || 0)),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 block">
                  Mặc định: 45 m³. Cảnh báo nguy cơ rò rỉ hoặc thất thoát đường ống.
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-slate-800/40 border border-slate-700">
                <input
                  type="checkbox"
                  checked={tempThresholds.enableZeroAlert}
                  onChange={(e) =>
                    setTempThresholds({
                      ...tempThresholds,
                      enableZeroAlert: e.target.checked,
                    })
                  }
                  className="rounded bg-slate-700 border-slate-600 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-300">
                  Cảnh báo khi chỉ số tiêu thụ bằng 0 (nghi vấn đồng hồ chết/kẹt chỉ số)
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={resetThresholds}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Khôi phục mặc định
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={saveThresholds}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg"
                >
                  Lưu Cài Đặt Ngưỡng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
