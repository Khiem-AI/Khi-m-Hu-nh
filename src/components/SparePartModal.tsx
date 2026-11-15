import React, { useState } from 'react';
import { useCMMS } from '../context/CMMSContext';
import { SparePart } from '../types/cmms';
import { X, Package, CheckCircle, AlertTriangle } from 'lucide-react';

interface SparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  partToEdit?: SparePart | null;
}

export const SparePartModal: React.FC<SparePartModalProps> = ({
  isOpen,
  onClose,
  partToEdit,
}) => {
  const { addSparePart, updateSparePart, equipment } = useCMMS();

  const [maVatTu, setMaVatTu] = useState(partToEdit?.maVatTu || '');
  const [tenVatTu, setTenVatTu] = useState(partToEdit?.tenVatTu || '');
  const [thongSo, setThongSo] = useState(partToEdit?.thongSo || '');
  const [maThietBi, setMaThietBi] = useState(partToEdit?.maThietBi || '');
  const [tenThietBiSuDung, setTenThietBiSuDung] = useState(partToEdit?.tenThietBiSuDung || '');
  const [tonToiThieu, setTonToiThieu] = useState(partToEdit?.tonToiThieu || 2);
  const [tonThucTe, setTonThucTe] = useState(partToEdit?.tonThucTe || 5);
  const [donViTinh, setDonViTinh] = useState(partToEdit?.donViTinh || 'Cái');
  const [viTriLuu, setViTriLuu] = useState(partToEdit?.viTriLuu || 'Kệ A - Kho Phụ Tùng');
  const [ghiChu, setGhiChu] = useState(partToEdit?.ghiChu || '');
  const [donGia, setDonGia] = useState(partToEdit?.donGia || 500000);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleEquipmentChange = (selectedCode: string) => {
    setMaThietBi(selectedCode);
    const matched = equipment.find((e) => e.maThietBi === selectedCode);
    if (matched) {
      setTenThietBiSuDung(matched.tenThietBi);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maVatTu.trim() || !tenVatTu.trim()) {
      setError('Vui lòng nhập mã và tên vật tư');
      return;
    }

    const payload: SparePart = {
      maVatTu: maVatTu.trim().toUpperCase(),
      tenVatTu: tenVatTu.trim(),
      thongSo,
      maThietBi,
      tenThietBiSuDung: tenThietBiSuDung || 'Nhiều thiết bị',
      tonToiThieu: Number(tonToiThieu),
      tonThucTe: Number(tonThucTe),
      donViTinh,
      viTriLuu,
      ghiChu,
      donGia: Number(donGia),
    };

    if (partToEdit) {
      updateSparePart(payload);
    } else {
      addSparePart(payload);
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
              <Package className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">
                {partToEdit ? `Sửa Vật Tư [${partToEdit.maVatTu}]` : 'Thêm Vật Tư / Phụ Tùng Mới'}
              </h3>
              <p className="text-xs text-slate-400">Sheet “Spare_part” - Quản lý tồn kho & cảnh báo an toàn</p>
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
              <label className="text-xs font-semibold text-slate-300">Mã Vật Tư *</label>
              <input
                type="text"
                disabled={!!partToEdit}
                value={maVatTu}
                onChange={(e) => setMaVatTu(e.target.value)}
                placeholder="VD: SP-BELT-2360..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tên Vật Tư *</label>
              <input
                type="text"
                value={tenVatTu}
                onChange={(e) => setTenVatTu(e.target.value)}
                placeholder="VD: Dây đai quạt AHU Bando..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Thông Số Kỹ Thuật</label>
            <input
              type="text"
              value={thongSo}
              onChange={(e) => setThongSo(e.target.value)}
              placeholder="Quy cách, model, kích thước, vật liệu..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Thiết Bị Sử Dụng</label>
              <select
                value={maThietBi}
                onChange={(e) => handleEquipmentChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Dùng chung toàn xưởng --</option>
                {equipment.map((eq) => (
                  <option key={eq.maThietBi} value={eq.maThietBi}>
                    {eq.maThietBi} - {eq.tenThietBi}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Đơn Vị Tính</label>
              <input
                type="text"
                value={donViTinh}
                onChange={(e) => setDonViTinh(e.target.value)}
                placeholder="Cái, Can 20L, Tấm, Bộ..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tồn Tối Thiểu (Min)</label>
              <input
                type="number"
                min="0"
                value={tonToiThieu}
                onChange={(e) => setTonToiThieu(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tồn Thực Tế</label>
              <input
                type="number"
                min="0"
                value={tonThucTe}
                onChange={(e) => setTonThucTe(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Đơn Giá (VNĐ)</label>
              <input
                type="number"
                min="0"
                step="10000"
                value={donGia}
                onChange={(e) => setDonGia(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Vị Trí Lưu Kho</label>
              <input
                type="text"
                value={viTriLuu}
                onChange={(e) => setViTriLuu(e.target.value)}
                placeholder="Kệ A1, Kho Dầu, Pallet 3..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Ghi Chú</label>
              <input
                type="text"
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                placeholder="Nhà cung cấp, mã OEM..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
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
              {partToEdit ? 'Cập Nhật Vật Tư' : 'Lưu Vật Tư'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
