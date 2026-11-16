import React, { useState, useEffect } from 'react';
import { MeterReading } from '../../types/cmms';
import { useCMMS } from '../../context/CMMSContext';
import { calculateMeterConsumption, isAdminLevel } from '../../utils/cmmsLogic';
import { NumericInput } from '../common/NumericInput';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Gauge,
  Calendar,
  User,
} from 'lucide-react';

interface MeterReadingEditModalProps {
  isOpen: boolean;
  record: MeterReading | null;
  onClose: () => void;
}

export const MeterReadingEditModal: React.FC<MeterReadingEditModalProps> = ({
  isOpen,
  record,
  onClose,
}) => {
  const { currentUser, updateMeterReading } = useCMMS();
  const isAdmin = isAdminLevel(currentUser);

  const [ngayChot, setNgayChot] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [nguon, setNguon] = useState<MeterReading['nguon']>('EVN');
  const [tenDongHo, setTenDongHo] = useState('');
  const [chiSoCu, setChiSoCu] = useState<number>(0);
  const [chiSoMoi, setChiSoMoi] = useState<number>(0);
  const [donVi, setDonVi] = useState('kWh');
  const [nguoiGhi, setNguoiGhi] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !record) return;
    setNgayChot(record.ngayChot);
    setTimestamp(record.timestamp);
    setNguon(record.nguon);
    setTenDongHo(record.tenDongHo);
    setChiSoCu(record.chiSoCu);
    setChiSoMoi(record.chiSoMoi);
    setDonVi(record.donVi || 'kWh');
    setNguoiGhi(record.nguoiGhi || '');
    setErrorMsg('');
    setSavedSuccess(false);
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  const previewTieuThu = calculateMeterConsumption(chiSoCu, chiSoMoi);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isAdmin) {
      setErrorMsg('Chỉ tài khoản Admin mới có quyền chỉnh sửa bản ghi chỉ số điện - nước.');
      return;
    }

    if (!tenDongHo.trim()) {
      setErrorMsg('Vui lòng nhập tên tủ điện / đồng hồ.');
      return;
    }

    if (chiSoMoi < chiSoCu) {
      setErrorMsg('Chỉ số mới không được nhỏ hơn chỉ số cũ.');
      return;
    }

    updateMeterReading({
      ...record,
      ngayChot,
      timestamp: timestamp.trim() || `${ngayChot} 08:00`,
      nguon,
      tenDongHo: tenDongHo.trim(),
      chiSoCu,
      chiSoMoi,
      tieuThu: previewTieuThu,
      donVi: donVi.trim() || 'kWh',
      nguoiGhi: nguoiGhi.trim() || currentUser.tenNhanVien,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Gauge className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Chỉnh Sửa Chỉ Số Hàng Ngày
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  Admin Only
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Mã bản ghi: {record.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Đã cập nhật bản ghi thành công!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Ngày Chốt
              </label>
              <input
                type="date"
                value={ngayChot}
                onChange={(e) => setNgayChot(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Nguồn</label>
              <select
                value={nguon}
                onChange={(e) => setNguon(e.target.value as MeterReading['nguon'])}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="EVN">EVN</option>
                <option value="Solar">Solar</option>
                <option value="Nước Sinh hoạt">Nước Sinh hoạt</option>
                <option value="Nước Tái Sử Dụng">Nước Tái Sử Dụng</option>
                <option value="Khí Nén">Khí Nén</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Tên Tủ Điện / Đồng Hồ
              </label>
              <input
                type="text"
                value={tenDongHo}
                onChange={(e) => setTenDongHo(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Đơn Vị</label>
              <input
                type="text"
                value={donVi}
                onChange={(e) => setDonVi(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Chỉ Số Cũ</label>
              <NumericInput
                value={chiSoCu}
                onChange={setChiSoCu}
                className="text-right font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Chỉ Số Mới</label>
              <NumericInput
                value={chiSoMoi}
                onChange={setChiSoMoi}
                className="text-right font-mono text-xs"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between">
            <span className="text-slate-400 font-medium">Tiêu thụ tính lại (Mới − Cũ):</span>
            <span
              className={`font-mono font-extrabold text-sm ${
                chiSoMoi < chiSoCu ? 'text-rose-400' : 'text-cyan-400'
              }`}
            >
              {previewTieuThu.toLocaleString('vi-VN')} {donVi}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Người Ghi Nhận
              </label>
              <input
                type="text"
                value={nguoiGhi}
                onChange={(e) => setNguoiGhi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Thời Gian Ghi</label>
              <input
                type="text"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                placeholder="YYYY-MM-DD HH:mm"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!isAdmin}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold shadow transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
