import React, { useState } from 'react';
import { useCMMS } from '../context/CMMSContext';
import { calculateMeterConsumption } from '../utils/cmmsLogic';
import { NumericInput } from './common/NumericInput';
import {
  EVN_DAILY_PANEL_METERS,
  SOLAR_DAILY_PANEL_METERS,
  WATER_DAILY_METERS,
} from '../types/cmms';
import { X, Gauge, Zap, Droplet, Wind, CheckCircle, AlertTriangle } from 'lucide-react';

interface MeterReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MeterSourceOption = 'EVN' | 'Solar' | 'Nước Sinh hoạt' | 'Nước Tái Sử Dụng' | 'Khí Nén';

const WATER_METER_SELECT_LIST: string[] = [
  ...WATER_DAILY_METERS,
  'ĐỒNG HỒ NƯỚC SINH HOẠT [Tự Động P1 - P2] (m3)',
];

const COMPRESSED_AIR_METERS: string[] = ['Lưu lượng kế tổng khí nén trạm GA90'];

const CUSTOM_METER_VALUE = '__CUSTOM__';

export const MeterReadingModal: React.FC<MeterReadingModalProps> = ({ isOpen, onClose }) => {
  const { addMeterReading, currentUser, meterReadings } = useCMMS();

  const getLatestReadingForMeter = (meterName: string, fallbackOld: number): number => {
    const matched = meterReadings.filter((m) => m.tenDongHo === meterName);
    if (matched.length > 0) {
      const sorted = [...matched].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return sorted[0].chiSoMoi;
    }
    return fallbackOld;
  };

  const getMetersBySource = (source: MeterSourceOption): string[] => {
    if (source === 'EVN') return [...EVN_DAILY_PANEL_METERS];
    if (source === 'Solar') return [...SOLAR_DAILY_PANEL_METERS];
    if (source === 'Nước Sinh hoạt' || source === 'Nước Tái Sử Dụng') return WATER_METER_SELECT_LIST;
    return COMPRESSED_AIR_METERS;
  };

  const [ngayChot, setNgayChot] = useState('2026-11-12');
  const [nguon, setNguon] = useState<MeterSourceOption>('EVN');
  const [tenDongHo, setTenDongHo] = useState<string>(EVN_DAILY_PANEL_METERS[0]);
  const [isCustomMeter, setIsCustomMeter] = useState(false);
  const [chiSoCu, setChiSoCu] = useState(145120);
  const [chiSoMoi, setChiSoMoi] = useState(147890);
  const [donVi, setDonVi] = useState('kWh');
  const [nguoiGhi, setNguoiGhi] = useState(currentUser.tenNhanVien || 'Khiêm Huỳnh');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const tieuThu = calculateMeterConsumption(chiSoCu, chiSoMoi);
  const availableMeters = getMetersBySource(nguon);

  const applyMeterDefaults = (meterName: string, source: MeterSourceOption) => {
    const fallbackOld =
      source === 'EVN'
        ? 145120
        : source === 'Solar'
        ? 90250
        : source === 'Nước Sinh hoạt' || source === 'Nước Tái Sử Dụng'
        ? 24965
        : 791200;
    const latestOld = getLatestReadingForMeter(meterName, fallbackOld);
    setChiSoCu(latestOld);
    setChiSoMoi(latestOld);
  };

  const handleSourceChange = (newSource: MeterSourceOption) => {
    setNguon(newSource);
    setIsCustomMeter(false);
    setError('');
    if (newSource === 'EVN') {
      const defaultMeter = EVN_DAILY_PANEL_METERS[0];
      setTenDongHo(defaultMeter);
      setDonVi('kWh');
      applyMeterDefaults(defaultMeter, newSource);
    } else if (newSource === 'Solar') {
      const defaultMeter = SOLAR_DAILY_PANEL_METERS[0];
      setTenDongHo(defaultMeter);
      setDonVi('kWh');
      applyMeterDefaults(defaultMeter, newSource);
    } else if (newSource === 'Nước Sinh hoạt') {
      const defaultMeter = WATER_DAILY_METERS[0];
      setTenDongHo(defaultMeter);
      setDonVi('m³');
      applyMeterDefaults(defaultMeter, newSource);
    } else if (newSource === 'Nước Tái Sử Dụng') {
      const wastewaterMeter =
        WATER_DAILY_METERS.find((m) => m.includes('THẢI')) || WATER_DAILY_METERS[5] || WATER_DAILY_METERS[0];
      setTenDongHo(wastewaterMeter);
      setDonVi('m³');
      applyMeterDefaults(wastewaterMeter, newSource);
    } else {
      const defaultMeter = COMPRESSED_AIR_METERS[0];
      setTenDongHo(defaultMeter);
      setDonVi('Nm³');
      applyMeterDefaults(defaultMeter, newSource);
    }
  };

  const handleMeterSelectChange = (value: string) => {
    setError('');
    if (value === CUSTOM_METER_VALUE) {
      setIsCustomMeter(true);
      setTenDongHo('');
      return;
    }
    setIsCustomMeter(false);
    setTenDongHo(value);
    applyMeterDefaults(value, nguon);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenDongHo.trim()) {
      setError('Vui lòng chọn hoặc nhập tên đồng hồ / điểm đo!');
      return;
    }
    if (chiSoMoi < chiSoCu) {
      setError('Chỉ số mới không được nhỏ hơn chỉ số cũ (trừ trường hợp quay vòng đồng hồ)!');
      return;
    }

    const now = new Date();
    const timestamp = `${ngayChot} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    addMeterReading({
      timestamp,
      ngayChot,
      nguon,
      tenDongHo: tenDongHo.trim(),
      chiSoCu: Number(chiSoCu),
      chiSoMoi: Number(chiSoMoi),
      donVi,
      nguoiGhi,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
              <Gauge className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">Ghi Nhận Chốt Chỉ Số Đồng Hồ</h3>
              <p className="text-xs text-slate-400">Sheet “Dien_Nuoc” - Tự động tính Tiêu thụ = Chỉ số mới - Chỉ số cũ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng form"
            className="rounded-lg p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nguồn đo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Nguồn Năng Lượng / Tiện Ích</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(['EVN', 'Solar', 'Nước Sinh hoạt', 'Nước Tái Sử Dụng', 'Khí Nén'] as const).map((source) => (
                <button
                  type="button"
                  key={source}
                  onClick={() => handleSourceChange(source)}
                  className={`py-2 px-1 text-[11px] font-semibold rounded-lg border transition text-center truncate ${
                    nguon === source
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          {/* Tên đồng hồ */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Tên Đồng Hồ / Điểm Đo *
              </label>
              <span className="text-[10px] text-slate-400">
                {availableMeters.length} điểm đo thuộc nguồn {nguon}
              </span>
            </div>
            <select
              value={isCustomMeter ? CUSTOM_METER_VALUE : tenDongHo}
              onChange={(e) => handleMeterSelectChange(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            >
              {availableMeters.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value={CUSTOM_METER_VALUE}>+ Khác (Nhập tên đồng hồ thủ công)...</option>
            </select>
            {isCustomMeter && (
              <input
                type="text"
                value={tenDongHo}
                onChange={(e) => setTenDongHo(e.target.value)}
                placeholder="Nhập tên đồng hồ / tủ điện..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-blue-500/60 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono mt-2"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Ngày chốt */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Ngày Chốt Số</label>
              <input
                type="date"
                value={ngayChot}
                onChange={(e) => setNgayChot(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Đơn vị */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Đơn Vị Đo</label>
              <input
                type="text"
                value={donVi}
                onChange={(e) => setDonVi(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Chỉ số cũ */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Chỉ Số Cũ</label>
              <NumericInput
                value={chiSoCu}
                onChange={(v) => setChiSoCu(v)}
                suffix={donVi}
              />
            </div>

            {/* Chỉ số mới */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Chỉ Số Mới *</label>
              <NumericInput
                value={chiSoMoi}
                onChange={(v) => {
                  setChiSoMoi(v);
                  setError('');
                }}
                suffix={donVi}
                className="border-blue-500/60 font-bold"
              />
            </div>
          </div>

          {/* Auto calculated consumption preview */}
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-blue-400 font-bold">
                Lượng Tiêu Thụ Tính Tự Động:
              </span>
              <p className="text-xs text-slate-400">Chỉ số mới ({chiSoMoi}) - Chỉ số cũ ({chiSoCu})</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-2xl font-bold text-blue-300">
                {tieuThu.toLocaleString()}
              </span>{' '}
              <span className="text-xs font-bold text-slate-400">{donVi}</span>
            </div>
          </div>

          {/* Người ghi: Tự động lấy tài khoản đăng nhập */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Người Ghi Nhận (Tài Khoản Đăng Nhập)</label>
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

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-900/40 transition flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Lưu Chỉ Số
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
