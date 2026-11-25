import React, { useState } from 'react';
import { useCMMS } from '../context/CMMSContext';
import { StockTransactionType } from '../types/cmms';
import { applyStockTransaction, getTodayISODate } from '../utils/cmmsLogic';
import { X, ArrowDownRight, ArrowUpRight, RotateCcw, AlertTriangle, CheckCircle, Package } from 'lucide-react';

interface StockTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPartCode?: string;
}

export const StockTransactionModal: React.FC<StockTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultPartCode,
}) => {
  const { spareParts, equipment, currentUser, createStockTransaction, employees } = useCMMS();

  const [loaiGD, setLoaiGD] = useState<StockTransactionType>('Xuất kho sử dụng');
  const [maVatTu, setMaVatTu] = useState(defaultPartCode || spareParts[0]?.maVatTu || '');
  const [thietBiSuDung, setThietBiSuDung] = useState('');
  const [soLuong, setSoLuong] = useState(1);
  const [ngay, setNgay] = useState(() => getTodayISODate());
  const [nguoiThucHien, setNguoiThucHien] = useState(currentUser.tenNhanVien || 'Khiêm Huỳnh');
  const [ghiChu, setGhiChu] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const selectedPart = spareParts.find((p) => p.maVatTu === maVatTu);
  const currentStock = selectedPart?.tonThucTe || 0;
  const newProjectedStock = applyStockTransaction(currentStock, loaiGD, soLuong);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (soLuong <= 0) {
      setError('Số lượng phải lớn hơn 0');
      return;
    }
    if (loaiGD === 'Xuất kho sử dụng' && soLuong > currentStock) {
      setError(`Không đủ tồn kho để xuất! Hiện tại chỉ còn ${currentStock} ${selectedPart?.donViTinh}`);
      return;
    }

    createStockTransaction({
      ngay,
      loaiGD,
      maVatTu,
      thietBiSuDung: thietBiSuDung || selectedPart?.maThietBi || 'Xưởng chung',
      soLuong: Number(soLuong),
      nguoiThucHien,
      ghiChu: ghiChu || `Giao dịch ${loaiGD} cho ${selectedPart?.tenVatTu}`,
      donGiaSnapshot: selectedPart?.donGia,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                loaiGD === 'Xuất kho sử dụng'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {loaiGD === 'Xuất kho sử dụng' ? (
                <ArrowDownRight className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </span>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">Giao Dịch Xuất / Nhập Kho Vật Tư</h3>
              <p className="text-xs text-slate-400">Tự động trừ/cộng tồn kho thực tế Sheet “Spare_part”</p>
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

          {/* Loại giao dịch */}
          <div className="grid grid-cols-3 gap-2">
            {(['Xuất kho sử dụng', 'Nhập kho', 'Hoàn kho'] as StockTransactionType[]).map((type) => {
              const active = loaiGD === type;
              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => {
                    setLoaiGD(type);
                    setError('');
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition text-center ${
                    active
                      ? type === 'Xuất kho sử dụng'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {/* Chọn vật tư */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Vật tư phụ tùng *</label>
            <select
              value={maVatTu}
              onChange={(e) => {
                setMaVatTu(e.target.value);
                setError('');
              }}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {spareParts.map((sp) => (
                <option key={sp.maVatTu} value={sp.maVatTu}>
                  {sp.maVatTu} - {sp.tenVatTu} (Hiện tồn: {sp.tonThucTe} {sp.donViTinh})
                </option>
              ))}
            </select>
          </div>

          {/* Live inventory impact box */}
          {selectedPart && (
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400">Tồn kho hiện tại:</span>
                <div className="font-bold text-slate-100 text-sm">
                  {currentStock} {selectedPart.donViTinh}
                </div>
              </div>
              <div className="text-center">
                <span className="text-slate-400">Số lượng GD:</span>
                <div
                  className={`font-bold text-sm ${
                    loaiGD === 'Xuất kho sử dụng' ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {loaiGD === 'Xuất kho sử dụng' ? `-${soLuong}` : `+${soLuong}`}
                </div>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-slate-400">Tồn sau giao dịch:</span>
                <div
                  className={`font-mono font-bold text-sm ${
                    newProjectedStock <= selectedPart.tonToiThieu ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {newProjectedStock} {selectedPart.donViTinh}
                  {newProjectedStock <= selectedPart.tonToiThieu && ' (Cảnh báo)'}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Số lượng */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Số Lượng *</label>
              <input
                type="number"
                min="1"
                value={soLuong}
                onChange={(e) => {
                  setSoLuong(Math.max(1, Number(e.target.value)));
                  setError('');
                }}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Ngày giao dịch */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Ngày Giao Dịch</label>
              <input
                type="date"
                value={ngay}
                onChange={(e) => setNgay(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Thiết bị sử dụng */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Thiết Bị Sử Dụng / Tham Chiếu
            </label>
            <select
              value={thietBiSuDung}
              onChange={(e) => setThietBiSuDung(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Chọn thiết bị lắp đặt / sử dụng --</option>
              {equipment.map((eq) => (
                <option key={eq.maThietBi} value={`${eq.maThietBi} - ${eq.tenThietBi}`}>
                  {eq.maThietBi} - {eq.tenThietBi} ({eq.heThong})
                </option>
              ))}
            </select>
          </div>

          {/* Người thực hiện */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Người Thực Hiện (Thủ Kho / Kỹ Thuật Viên) *
            </label>
            <select
              value={nguoiThucHien}
              onChange={(e) => setNguoiThucHien(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {employees.map((emp) => (
                <option key={emp.maNhanVien} value={emp.tenNhanVien}>
                  [{emp.maNhanVien}] {emp.tenNhanVien} - {emp.chucVu}
                </option>
              ))}
            </select>
          </div>

          {/* Ghi chú */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Lý do / Ghi chú</label>
            <textarea
              rows={2}
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="VD: Thay thế khẩn cấp máy nén khí GA90-1 đợt bảo dưỡng..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-900/40 transition flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Xác Nhận & Cập Nhật Kho
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
