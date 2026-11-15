import React, { useState, useMemo } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { EVN_DAILY_PANEL_METERS, SOLAR_DAILY_PANEL_METERS, MeterReading } from '../../types/cmms';
import { NumericInput } from '../common/NumericInput';
import {
  X,
  Zap,
  Sun,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  User,
  Activity,
  Calculator,
} from 'lucide-react';

interface DailyPowerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MeterRowState {
  meterName: string;
  source: 'EVN' | 'Solar';
  oldReading: number;
  newReading: number;
}

export const DailyPowerModal: React.FC<DailyPowerModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, meterReadings, addBatchMeterReadings } = useCMMS();

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [ngayChot, setNgayChot] = useState(todayStr);
  const [nguoiGhi, setNguoiGhi] = useState(currentUser.tenNhanVien || 'Khiêm Huỳnh');
  const [activeSystemTab, setActiveSystemTab] = useState<'ALL' | 'EVN' | 'SOLAR'>('ALL');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Helper tìm chỉ số mới nhất của một đồng hồ trong lịch sử
  const getLatestReading = (meterName: string, defaultVal: number): number => {
    const matched = meterReadings.filter((m) => m.tenDongHo === meterName);
    if (matched.length > 0) {
      // Sắp xếp theo timestamp/id mới nhất
      matched.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return matched[0].chiSoMoi;
    }
    return defaultVal;
  };

  // Khởi tạo danh sách đồng hồ ban đầu
  const [meterRows, setMeterRows] = useState<MeterRowState[]>(() => {
    const evnRows: MeterRowState[] = EVN_DAILY_PANEL_METERS.map((name, index) => {
      const old = getLatestReading(name, 125000 + index * 12340);
      return {
        meterName: name,
        source: 'EVN',
        oldReading: old,
        newReading: old, // Mặc định bằng số cũ, người dùng nhập số mới
      };
    });

    const solarRows: MeterRowState[] = SOLAR_DAILY_PANEL_METERS.map((name, index) => {
      const old = getLatestReading(name, 84000 + index * 8500);
      return {
        meterName: name,
        source: 'Solar',
        oldReading: old,
        newReading: old,
      };
    });

    return [...evnRows, ...solarRows];
  });

  if (!isOpen) return null;

  // Cập nhật chỉ số mới cho một đồng hồ
  const handleNewReadingChange = (meterName: string, newVal: number) => {
    setMeterRows((prev) =>
      prev.map((r) => (r.meterName === meterName ? { ...r, newReading: newVal } : r))
    );
  };

  // Cập nhật chỉ số cũ cho một đồng hồ (nếu cần điều chỉnh)
  const handleOldReadingChange = (meterName: string, oldVal: number) => {
    setMeterRows((prev) =>
      prev.map((r) => (r.meterName === meterName ? { ...r, oldReading: oldVal } : r))
    );
  };

  // Tính toán tổng tiêu thụ
  const evnRows = meterRows.filter((r) => r.source === 'EVN');
  const solarRows = meterRows.filter((r) => r.source === 'Solar');

  const totalEvnConsumption = evnRows.reduce(
    (sum, r) => sum + Math.max(0, r.newReading - r.oldReading),
    0
  );

  const totalSolarConsumption = solarRows.reduce(
    (sum, r) => sum + Math.max(0, r.newReading - r.oldReading),
    0
  );

  const totalGrand = totalEvnConsumption + totalSolarConsumption;
  const solarPercentage = totalGrand > 0 ? (totalSolarConsumption / totalGrand) * 100 : 0;

  // Kiểm tra lỗi trước khi lưu
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Kiểm tra có đồng hồ nào số mới < số cũ không
    const invalidRows = meterRows.filter((r) => r.newReading < r.oldReading);
    if (invalidRows.length > 0) {
      setErrorMsg(
        `Phát hiện ${invalidRows.length} đồng hồ có chỉ số mới nhỏ hơn chỉ số cũ (${invalidRows
          .map((r) => r.meterName)
          .slice(0, 3)
          .join(', ')}...). Vui lòng kiểm tra lại!`
      );
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const timestamp = `${ngayChot} ${timeStr}`;

    const batchToSave: Omit<MeterReading, 'id' | 'tieuThu'>[] = meterRows.map((row) => ({
      timestamp,
      ngayChot,
      nguon: row.source,
      tenDongHo: row.meterName,
      chiSoCu: row.oldReading,
      chiSoMoi: row.newReading,
      donVi: 'kWh',
      nguoiGhi,
    }));

    addBatchMeterReadings(batchToSave);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const displayedRows =
    activeSystemTab === 'ALL'
      ? meterRows
      : meterRows.filter((r) => (activeSystemTab === 'EVN' ? r.source === 'EVN' : r.source === 'Solar'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Chốt Chỉ Số Điện Hàng Ngày Theo Tủ (Hệ EVN & Hệ Solar)
              </h3>
              <p className="text-xs text-slate-400">
                Ghi nhận 10 tủ điện EVN và 3 tủ điện Solar - Tự động tính sản lượng tiêu thụ ngày
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Đã lưu thành công chỉ số toàn bộ 13 tủ điện vào hệ thống!</span>
            </div>
          )}

          {/* Meta Info Bar: Ngày chốt & Người ghi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Ngày Chốt Số</span>
              </label>
              <input
                type="date"
                value={ngayChot}
                onChange={(e) => setNgayChot(e.target.value)}
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

          {/* Filter Bar: Xem Tất cả / Chỉ Hệ EVN (10 tủ) / Chỉ Hệ Solar (3 tủ) */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/70 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveSystemTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeSystemTab === 'ALL'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tất Cả 13 Tủ
              </button>
              <button
                type="button"
                onClick={() => setActiveSystemTab('EVN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  activeSystemTab === 'EVN'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-cyan-400/80 hover:text-cyan-200'
                }`}
              >
                <Zap className="w-3 h-3" />
                Hệ EVN (10 tủ)
              </button>
              <button
                type="button"
                onClick={() => setActiveSystemTab('SOLAR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  activeSystemTab === 'SOLAR'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-amber-400/80 hover:text-amber-200'
                }`}
              >
                <Sun className="w-3 h-3" />
                Hệ Solar (3 tủ)
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Đơn vị đo: <strong className="text-slate-200 font-mono">kWh</strong> (Tự động xóa số 0 ở đầu khi nhập)
            </span>
          </div>

          {/* Bảng nhập chỉ số từng tủ */}
          <div className="max-h-[380px] overflow-y-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-800/95 backdrop-blur z-10 border-b border-slate-700 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3.5">Hệ</th>
                  <th className="py-2.5 px-3.5">Tên Tủ Điện / Đồng Hồ</th>
                  <th className="py-2.5 px-3.5 text-right w-36">Chỉ Số Cũ (kWh)</th>
                  <th className="py-2.5 px-3.5 text-right w-44">Chỉ Số Mới (kWh) *</th>
                  <th className="py-2.5 px-3.5 text-right w-32">Tiêu Thụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                {displayedRows.map((row) => {
                  const consumption = row.newReading - row.oldReading;
                  const isNegative = consumption < 0;

                  return (
                    <tr
                      key={row.meterName}
                      className={`hover:bg-slate-800/40 transition ${
                        isNegative ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.source === 'EVN'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {row.source}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-100 font-mono text-xs">
                        {row.meterName}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <NumericInput
                          value={row.oldReading}
                          onChange={(v) => handleOldReadingChange(row.meterName, v)}
                          className="text-right text-xs py-1"
                        />
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <NumericInput
                          value={row.newReading}
                          onChange={(v) => handleNewReadingChange(row.meterName, v)}
                          className={`text-right text-xs py-1 font-bold ${
                            isNegative
                              ? 'border-rose-500 text-rose-300'
                              : 'border-blue-500/60 text-cyan-200'
                          }`}
                        />
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                        {isNegative ? (
                          <span className="text-rose-400 text-xs flex items-center justify-end gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Lỗi ({consumption.toLocaleString()})
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-sm">
                            +{consumption.toLocaleString()}{' '}
                            <span className="text-[10px] text-slate-500 font-normal">kWh</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Dashboard Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[11px] text-cyan-400 font-bold block">Tổng Tiêu Thụ EVN</span>
              <span className="text-lg font-black text-slate-100 font-mono mt-0.5 block">
                {totalEvnConsumption.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">kWh</span>
              </span>
              <span className="text-[10px] text-slate-400">10 tủ lưới điện</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[11px] text-amber-400 font-bold block">Tổng Phát Solar</span>
              <span className="text-lg font-black text-amber-300 font-mono mt-0.5 block">
                {totalSolarConsumption.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">kWh</span>
              </span>
              <span className="text-[10px] text-slate-400">3 tủ Inverter</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[11px] text-emerald-400 font-bold block">Tổng Sản Lượng Ngày</span>
              <span className="text-lg font-black text-emerald-300 font-mono mt-0.5 block">
                {totalGrand.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">kWh</span>
              </span>
              <span className="text-[10px] text-emerald-400/80 font-semibold">
                Solar đóng góp {solarPercentage.toFixed(1)}%
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:brightness-110 text-white shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Lưu Số Chốt Hàng Ngày
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-1.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
