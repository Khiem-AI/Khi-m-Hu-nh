import React, { useState } from 'react';
import { useCMMS } from '../context/CMMSContext';
import { CostRecord, CostCategory, CostStatus } from '../types/cmms';
import { X, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';

interface CostModalProps {
  isOpen: boolean;
  onClose: () => void;
  costToEdit?: CostRecord | null;
}

export const CostModal: React.FC<CostModalProps> = ({ isOpen, onClose, costToEdit }) => {
  const { addCostRecord, updateCostRecord, equipment, tickets } = useCMMS();

  const [ngayGhiNhan, setNgayGhiNhan] = useState(costToEdit?.ngayGhiNhan || '2026-11-10');
  const [phanLoai, setPhanLoai] = useState<CostCategory>(costToEdit?.phanLoai || 'Bảo trì định kỳ');
  const [thamChieu, setThamChieu] = useState(costToEdit?.thamChieu || '');
  const [soTienVND, setSoTienVND] = useState(costToEdit?.soTienVND || 5000000);
  const [nhaCungCap, setNhaCungCap] = useState(costToEdit?.nhaCungCap || '');
  const [trangThai, setTrangThai] = useState<CostStatus>(costToEdit?.trangThai || 'Chờ duyệt');
  const [ghiChu, setGhiChu] = useState(costToEdit?.ghiChu || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (soTienVND <= 0) {
      setError('Số tiền chi phí phải lớn hơn 0');
      return;
    }
    if (!nhaCungCap.trim()) {
      setError('Vui lòng nhập tên nhà cung cấp hoặc đối tác');
      return;
    }

    if (costToEdit) {
      updateCostRecord({
        ...costToEdit,
        ngayGhiNhan,
        phanLoai,
        thamChieu,
        soTienVND: Number(soTienVND),
        nhaCungCap,
        trangThai,
        ghiChu,
      });
    } else {
      addCostRecord({
        ngayGhiNhan,
        phanLoai,
        thamChieu,
        soTienVND: Number(soTienVND),
        nhaCungCap,
        trangThai,
        ghiChu,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">
                {costToEdit ? `Sửa Chi Phí [${costToEdit.idChiPhi}]` : 'Ghi Nhận Chi Phí Mới'}
              </h3>
              <p className="text-xs text-slate-400">Sheet “Quan_ly_chi_phi” - Theo dõi ngân sách bảo trì & mua sắm</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Ngày Ghi Nhận</label>
              <input
                type="date"
                value={ngayGhiNhan}
                onChange={(e) => setNgayGhiNhan(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Phân Loại Chi Phí</label>
              <select
                value={phanLoai}
                onChange={(e) => setPhanLoai(e.target.value as CostCategory)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Bảo trì định kỳ">Bảo trì định kỳ</option>
                <option value="Sửa chữa đột xuất">Sửa chữa đột xuất</option>
                <option value="Mua vật tư thay thế">Mua vật tư thay thế</option>
                <option value="Kiểm định an toàn">Kiểm định an toàn</option>
                <option value="Dịch vụ ngoài">Dịch vụ ngoài / Thuê gia công</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tham Chiếu (Mã TB / Ticket)</label>
              <input
                type="text"
                value={thamChieu}
                onChange={(e) => setThamChieu(e.target.value)}
                placeholder="VD: HVAC-CH-01 hoặc TK-2026-1101"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Số Tiền (VNĐ) *</label>
              <input
                type="number"
                min="1000"
                step="50000"
                value={soTienVND}
                onChange={(e) => setSoTienVND(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nhà Cung Cấp / Đối Tác *</label>
              <input
                type="text"
                value={nhaCungCap}
                onChange={(e) => setNhaCungCap(e.target.value)}
                placeholder="Atlas Copco, Johnson Controls, Sawaco..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Trạng Thái Thanh Toán</label>
              <select
                value={trangThai}
                onChange={(e) => setTrangThai(e.target.value as CostStatus)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Chờ duyệt">Chờ duyệt</option>
                <option value="Đã duyệt">Đã duyệt</option>
                <option value="Đã thanh toán">Đã thanh toán</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Ghi Chú Chi Tiết</label>
            <textarea
              rows={2}
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="Nội dung hóa đơn, hợp đồng bảo trì, số chứng từ..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

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
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-900/40 transition flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {costToEdit ? 'Cập Nhật Chi Phí' : 'Lưu Chi Phí'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
