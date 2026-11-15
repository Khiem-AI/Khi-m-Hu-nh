import React, { useState, useMemo } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { WATER_DAILY_METERS, MeterReading, WaterMonthly } from '../../types/cmms';
import { NumericInput } from '../common/NumericInput';
import { formatVND } from '../../utils/cmmsLogic';
import {
  X,
  Droplet,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  User,
  Calculator,
  Layers,
  ArrowRight,
  TrendingDown,
  DollarSign,
} from 'lucide-react';

interface WaterRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'daily' | 'monthly';
}

interface WaterMeterRow {
  name: string;
  code: string; // P1, P2, CHILLER, DI, UONG, THAI_RA, DI_RUA, DI_XA
  oldReading: number;
  newReading: number;
}

export const WaterRecordingModal: React.FC<WaterRecordingModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'daily',
}) => {
  const {
    currentUser,
    meterReadings,
    addBatchMeterReadings,
    addMeterReading,
    waterMonthly,
    addWaterMonthlyRecord,
    updateWaterMonthlyRecord,
    tariffConfig,
  } = useCMMS();

  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>(initialMode);

  // Ngày chốt hàng ngày
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const [ngayChotDaily, setNgayChotDaily] = useState(todayStr);
  const [nguoiGhiDaily, setNguoiGhiDaily] = useState(currentUser.tenNhanVien || 'Khiêm Huỳnh');
  const [dailyError, setDailyError] = useState('');
  const [dailySuccess, setDailySuccess] = useState(false);

  // Helper tìm chỉ số mới nhất của đồng hồ
  const getLatestReading = (meterName: string, defaultVal: number): number => {
    const matched = meterReadings.filter((m) => m.tenDongHo === meterName);
    if (matched.length > 0) {
      matched.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return matched[0].chiSoMoi;
    }
    return defaultVal;
  };

  // State 8 đồng hồ nước thực tế
  const [meterRows, setMeterRows] = useState<WaterMeterRow[]>(() => {
    return [
      {
        name: 'ĐỒNG HỒ NƯỚC TỔNG (P1) (m3)',
        code: 'P1',
        oldReading: getLatestReading('ĐỒNG HỒ NƯỚC TỔNG (P1) (m3)', 45800),
        newReading: getLatestReading('ĐỒNG HỒ NƯỚC TỔNG (P1) (m3)', 45800),
      },
      {
        name: 'ĐỒNG HỒ NƯỚC TƯỚI CỎ (P2) (m3)',
        code: 'P2',
        oldReading: getLatestReading('ĐỒNG HỒ NƯỚC TƯỚI CỎ (P2) (m3)', 12400),
        newReading: getLatestReading('ĐỒNG HỒ NƯỚC TƯỚI CỎ (P2) (m3)', 12400),
      },
      {
        name: 'ĐỒNG HỒ NƯỚC CHILLER (m3)',
        code: 'CHILLER',
        oldReading: getLatestReading('ĐỒNG HỒ NƯỚC CHILLER (m3)', 8920),
        newReading: getLatestReading('ĐỒNG HỒ NƯỚC CHILLER (m3)', 8920),
      },
      {
        name: 'ĐỒNG HỒ NƯỚC DI (m3)',
        code: 'DI',
        oldReading: getLatestReading('ĐỒNG HỒ NƯỚC DI (m3)', 6540),
        newReading: getLatestReading('ĐỒNG HỒ NƯỚC DI (m3)', 6540),
      },
      {
        name: 'ĐỒNG HỒ NƯỚC HỆ NƯỚC UỐNG (m3)',
        code: 'UONG',
        oldReading: getLatestReading('ĐỒNG HỒ NƯỚC HỆ NƯỚC UỐNG (m3)', 3210),
        newReading: getLatestReading('ĐỒNG HỒ NƯỚC HỆ NƯỚC UỐNG (m3)', 3210),
      },
      {
        name: 'ĐỒNG HỒ NƯỚC THẢI ĐẦU RA (m3)',
        code: 'THAI_RA',
        oldReading: getLatestReading('ĐỒNG HỒ NƯỚC THẢI ĐẦU RA (m3)', 28950),
        newReading: getLatestReading('ĐỒNG HỒ NƯỚC THẢI ĐẦU RA (m3)', 28950),
      },
      {
        name: 'ĐỒNG HỒ NƯỚC THẢI ĐẦU RA DI rửa ngược (m3)',
        code: 'DI_RUA',
        oldReading: getLatestReading('ĐỒNG HỒ NƯỚC THẢI ĐẦU RA DI rửa ngược (m3)', 2100),
        newReading: getLatestReading('ĐỒNG HỒ NƯỚC THẢI ĐẦU RA DI rửa ngược (m3)', 2100),
      },
      {
        name: 'ĐỒNG HỒ NƯỚC THẢI ĐẦU RA DI xả tràn T103 (m3)',
        code: 'DI_XA',
        oldReading: getLatestReading('ĐỒNG HỒ NƯỚC THẢI ĐẦU RA DI xả tràn T103 (m3)', 980),
        newReading: getLatestReading('ĐỒNG HỒ NƯỚC THẢI ĐẦU RA DI xả tràn T103 (m3)', 980),
      },
    ];
  });

  // State Chốt Nước Hàng Tháng
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [monthlyWaterM3, setMonthlyWaterM3] = useState<number>(4750);
  const [monthlySuccess, setMonthlySuccess] = useState(false);

  if (!isOpen) return null;

  // Tính tiêu thụ P1 & P2
  const p1Row = meterRows.find((r) => r.code === 'P1');
  const p2Row = meterRows.find((r) => r.code === 'P2');
  const p1Consumption = p1Row ? Math.max(0, p1Row.newReading - p1Row.oldReading) : 0;
  const p2Consumption = p2Row ? Math.max(0, p2Row.newReading - p2Row.oldReading) : 0;

  // ĐỒNG HỒ NƯỚC SINH HOẠT: lấy kết quả (P1 - P2)
  const domesticWaterConsumption = Math.max(0, p1Consumption - p2Consumption);

  // Xử lý thay đổi số mới của đồng hồ
  const handleMeterNewChange = (code: string, val: number) => {
    setMeterRows((prev) => prev.map((r) => (r.code === code ? { ...r, newReading: val } : r)));
  };

  const handleMeterOldChange = (code: string, val: number) => {
    setMeterRows((prev) => prev.map((r) => (r.code === code ? { ...r, oldReading: val } : r)));
  };

  // Lưu chốt số nước hàng ngày
  const handleSaveDaily = (e: React.FormEvent) => {
    e.preventDefault();
    setDailyError('');

    const invalidRows = meterRows.filter((r) => r.newReading < r.oldReading);
    if (invalidRows.length > 0) {
      setDailyError(
        `Chỉ số mới không được nhỏ hơn chỉ số cũ (${invalidRows
          .map((r) => r.name)
          .slice(0, 2)
          .join(', ')}...)`
      );
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const timestamp = `${ngayChotDaily} ${timeStr}`;

    // Lưu 8 đồng hồ thực tế
    const batch: Omit<MeterReading, 'id' | 'tieuThu'>[] = meterRows.map((r) => ({
      timestamp,
      ngayChot: ngayChotDaily,
      nguon: r.name.includes('THẢI') ? 'Nước Tái Sử Dụng' : 'Nước Sinh hoạt',
      tenDongHo: r.name,
      chiSoCu: r.oldReading,
      chiSoMoi: r.newReading,
      donVi: 'm³',
      nguoiGhi: nguoiGhiDaily,
    }));

    // Bổ sung bản ghi tự động cho "ĐỒNG HỒ NƯỚC SINH HOẠT (P1 - P2)"
    batch.push({
      timestamp,
      ngayChot: ngayChotDaily,
      nguon: 'Nước Sinh hoạt',
      tenDongHo: 'ĐỒNG HỒ NƯỚC SINH HOẠT [Tự Động P1 - P2] (m3)',
      chiSoCu: 0,
      chiSoMoi: domesticWaterConsumption,
      donVi: 'm³',
      nguoiGhi: `${nguoiGhiDaily} (Auto P1-P2)`,
    });

    addBatchMeterReadings(batch);
    setDailySuccess(true);
    setTimeout(() => {
      setDailySuccess(false);
      onClose();
    }, 1000);
  };

  // Tính toán số liệu chốt tháng: Lượng nước thải = 80% Lượng nước sinh hoạt
  const monthlySewageM3 = Math.round(monthlyWaterM3 * 0.8 * 10) / 10;
  const monthlyWaterVND = Math.round(monthlyWaterM3 * tariffConfig.waterVNDPerM3);
  const monthlyWaterUSD = Math.round((monthlyWaterVND / (tariffConfig.usdToVndRate || 25400)) * 100) / 100;
  const monthlySewageVND = Math.round(monthlySewageM3 * tariffConfig.sewageVNDPerM3);
  const monthlySewageUSD = Math.round((monthlySewageVND / (tariffConfig.usdToVndRate || 25400)) * 100) / 100;
  const monthlyTotalVND = monthlyWaterVND + monthlySewageVND;
  const monthlyTotalUSD = monthlyWaterUSD + monthlySewageUSD;

  // Lưu chốt nước hàng tháng
  const handleSaveMonthly = (e: React.FormEvent) => {
    e.preventDefault();

    const record: WaterMonthly = {
      month: selectedMonth,
      waterM3: monthlyWaterM3,
      waterVND: monthlyWaterVND,
      waterUSD: Math.round(monthlyWaterUSD),
      sewageVND: monthlySewageVND,
      sewageUSD: Math.round(monthlySewageUSD),
    };

    const existing = waterMonthly.find((w) => w.month === selectedMonth);
    if (existing) {
      updateWaterMonthlyRecord(record);
    } else {
      addWaterMonthlyRecord(record);
    }

    setMonthlySuccess(true);
    setTimeout(() => {
      setMonthlySuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md">
              <Droplet className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Quản Lý & Chốt Số Nước Cấp - Nước Thải
              </h3>
              <p className="text-xs text-slate-400">
                Chốt 8 đồng hồ hàng ngày (Nước sinh hoạt = P1 - P2) và Chốt nước tháng (Nước thải = 80%)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-xl p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" />
            1. Chốt Số Nước Hàng Ngày (P1, P2, Chiller, DI, Thải...)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'monthly'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            2. Chốt Hóa Đơn Nước Hàng Tháng (Quy Tắc Thải 80%)
          </button>
        </div>

        {/* TAB 1: Chốt hàng ngày */}
        {activeTab === 'daily' && (
          <form onSubmit={handleSaveDaily} className="p-5 sm:p-6 space-y-4">
            {dailyError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{dailyError}</span>
              </div>
            )}

            {dailySuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Đã lưu thành công nhật ký chốt số đồng hồ nước!</span>
              </div>
            )}

            {/* Meta bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ngày Chốt Số Nước</span>
                </label>
                <input
                  type="date"
                  value={ngayChotDaily}
                  onChange={(e) => setNgayChotDaily(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Người Chốt Số (Tài Khoản Đăng Nhập)</span>
                </label>
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-800/90 border border-emerald-500/30 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                    <span className="font-bold text-slate-100">{currentUser.tenNhanVien}</span>
                    <span className="text-[11px] text-slate-400">({currentUser.chucVu})</span>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-700/60 text-cyan-300 font-bold border border-slate-600 shrink-0 ml-2">
                    {currentUser.maNhanVien}
                  </span>
                </div>
              </div>
            </div>

            {/* Highlight Card: ĐỒNG HỒ NƯỚC SINH HOẠT = P1 - P2 */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-slate-900 border border-cyan-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                    <Droplet className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                      ĐỒNG HỒ NƯỚC SINH HOẠT (Tự động tính: P1 - P2)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Nước Sinh Hoạt = [ĐH Nước Tổng (P1)] trừ [ĐH Nước Tưới Cỏ (P2)]
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-cyan-300 font-mono">
                    {domesticWaterConsumption.toLocaleString()}{' '}
                    <span className="text-xs font-semibold text-slate-400">m³</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    ({p1Consumption} - {p2Consumption} m³)
                  </span>
                </div>
              </div>
            </div>

            {/* Bảng nhập 8 đồng hồ */}
            <div className="max-h-[320px] overflow-y-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-800/95 backdrop-blur z-10 border-b border-slate-700 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3.5">Mã</th>
                    <th className="py-2.5 px-3.5">Tên Đồng Hồ Nước (m³)</th>
                    <th className="py-2.5 px-3.5 text-right w-36">Chỉ Số Cũ (m³)</th>
                    <th className="py-2.5 px-3.5 text-right w-44">Chỉ Số Mới (m³) *</th>
                    <th className="py-2.5 px-3.5 text-right w-32">Tiêu Thụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                  {meterRows.map((row) => {
                    const consumption = row.newReading - row.oldReading;
                    const isP = row.code === 'P1' || row.code === 'P2';

                    return (
                      <tr
                        key={row.code}
                        className={`hover:bg-slate-800/40 transition ${
                          isP ? 'bg-blue-500/5' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3.5 font-bold font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              isP
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {row.code}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-100 font-mono text-xs">
                          {row.name}
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <NumericInput
                            value={row.oldReading}
                            onChange={(v) => handleMeterOldChange(row.code, v)}
                            className="text-right text-xs py-1"
                          />
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <NumericInput
                            value={row.newReading}
                            onChange={(v) => handleMeterNewChange(row.code, v)}
                            className="text-right text-xs py-1 font-bold border-cyan-500/60 text-cyan-200"
                          />
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                          {consumption < 0 ? (
                            <span className="text-rose-400 text-xs">Lỗi âm</span>
                          ) : (
                            <span className="text-emerald-400 text-sm">
                              +{consumption.toLocaleString()}{' '}
                              <span className="text-[10px] text-slate-500 font-normal">m³</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Tự động xóa số 0 ở đầu khi nhập và tự động tạo bản ghi Nước Sinh Hoạt (P1-P2).
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 text-white shadow-lg transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Lưu Số Chốt Hàng Ngày
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: Chốt Hóa Đơn Nước Hàng Tháng (Sheet Nuoc_month) */}
        {activeTab === 'monthly' && (
          <form onSubmit={handleSaveMonthly} className="p-5 sm:p-6 space-y-5">
            {monthlySuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Đã lưu thành công dữ liệu nước tháng {selectedMonth} vào Sheet Nuoc_month!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Kỳ Tháng Chốt Số (Month)</span>
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cyan-300 flex items-center justify-between">
                  <span>Lượng Nước Sinh Hoạt Chốt Tháng *</span>
                  <span className="text-[10px] text-slate-400 font-mono">Đơn vị: m³</span>
                </label>
                <NumericInput
                  value={monthlyWaterM3}
                  onChange={(v) => setMonthlyWaterM3(v)}
                  suffix="m³"
                  className="text-cyan-200 font-bold"
                />
              </div>
            </div>

            {/* Quy tắc 80% Nước Thải & Hạch Toán Chi Phí */}
            <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <h4 className="text-xs font-bold text-slate-200">
                    Quy Tắc: Lượng Nước Thải = 80% Lượng Nước Sinh Hoạt Chốt Theo Tháng
                  </h4>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  80% Chuẩn Môi Trường
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Khối 1: Nước cấp sinh hoạt */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-blue-400 block">1. Nước Cấp Sinh Hoạt</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-slate-100 font-mono">
                      {monthlyWaterM3.toLocaleString()} <span className="text-xs text-slate-400 font-normal">m³</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      @{formatVND(tariffConfig.waterVNDPerM3)}/m³
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Thành tiền:</span>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 font-mono">{formatVND(monthlyWaterVND)}</span>
                      <span className="text-[11px] text-slate-500 block font-mono">(${monthlyWaterUSD.toLocaleString()})</span>
                    </div>
                  </div>
                </div>

                {/* Khối 2: Phí xử lý nước thải (80%) */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 block">2. Lượng Nước Thải (80%)</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">= {monthlyWaterM3} × 80%</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-amber-300 font-mono">
                      {monthlySewageM3.toLocaleString()} <span className="text-xs text-slate-400 font-normal">m³</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      @{formatVND(tariffConfig.sewageVNDPerM3)}/m³
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Phí xử lý:</span>
                    <div className="text-right">
                      <span className="font-bold text-amber-400 font-mono">{formatVND(monthlySewageVND)}</span>
                      <span className="text-[11px] text-slate-500 block font-mono">(${monthlySewageUSD.toLocaleString()})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tổng hóa đơn nước tháng */}
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Tổng Hóa Đơn Nước Tháng {selectedMonth} (Cấp + Thải)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Tỷ giá quy đổi: 1 USD = {tariffConfig.usdToVndRate.toLocaleString()} VNĐ
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-300 font-mono">
                    {formatVND(monthlyTotalVND)}
                  </span>
                  <span className="text-xs text-cyan-300 font-mono ml-2 font-bold">
                    (${monthlyTotalUSD.toLocaleString()})
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Dữ liệu sẽ được lưu vào danh sách Nước Tháng (Sheet Nuoc_month).
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-lg transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Lưu Chốt Nước Tháng {selectedMonth}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
