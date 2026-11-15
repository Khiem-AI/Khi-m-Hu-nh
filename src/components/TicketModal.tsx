import React, { useEffect, useState } from 'react';
import { useCMMS } from '../context/CMMSContext';
import { Ticket, TicketPriority, TicketStatus } from '../types/cmms';
import { parseAssigneeNames } from '../utils/cmmsLogic';
import { CameraCaptureInput } from './common/CameraCaptureInput';
import { MultiAssigneePicker } from './common/MultiAssigneePicker';
import { X, Tag, AlertTriangle, CheckCircle, Mail } from 'lucide-react';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketToEdit?: Ticket | null;
  defaultEquipmentCode?: string;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  ticketToEdit,
  defaultEquipmentCode,
}) => {
  const { equipment, currentUser, addTicket, updateTicket, emailConfig, employees } = useCMMS();

  const defaultEngineer =
    employees.find((e) => e.chucVu === 'Kỹ sư thiết bị')?.tenNhanVien || currentUser.tenNhanVien;

  const [tieuDe, setTieuDe] = useState(ticketToEdit?.tieuDe || '');
  const [moTaChiTiet, setMoTaChiTiet] = useState(ticketToEdit?.moTaChiTiet || '');
  const [trangThai, setTrangThai] = useState<TicketStatus>(ticketToEdit?.trangThai || 'Mới tiếp nhận');
  const [mucDoUuTien, setMucDoUuTien] = useState<TicketPriority>(ticketToEdit?.mucDoUuTien || 'Cao');
  const [nguoiPhuTrach, setNguoiPhuTrach] = useState(
    ticketToEdit?.nguoiPhuTrach || employees[0]?.tenNhanVien || currentUser.tenNhanVien
  );
  const [nguoiGiaoViec, setNguoiGiaoViec] = useState(
    ticketToEdit?.nguoiGiaoViec || defaultEngineer
  );
  const [nguoiLap, setNguoiLap] = useState(ticketToEdit?.nguoiLap || currentUser.tenNhanVien);
  const [maThietBi, setMaThietBi] = useState(ticketToEdit?.maThietBi || defaultEquipmentCode || '');
  const [ketQua, setKetQua] = useState(ticketToEdit?.ketQua || '');
  const [ngayHoanThanh, setNgayHoanThanh] = useState(ticketToEdit?.ngayHoanThanh || '');
  const [anhTruocXuLy, setAnhTruocXuLy] = useState(ticketToEdit?.anhTruocXuLy || '');
  const [anhSauXuLy, setAnhSauXuLy] = useState(ticketToEdit?.anhSauXuLy || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (ticketToEdit) {
      setTieuDe(ticketToEdit.tieuDe);
      setMoTaChiTiet(ticketToEdit.moTaChiTiet);
      setTrangThai(ticketToEdit.trangThai);
      setMucDoUuTien(ticketToEdit.mucDoUuTien);
      setNguoiPhuTrach(ticketToEdit.nguoiPhuTrach);
      setNguoiGiaoViec(ticketToEdit.nguoiGiaoViec || defaultEngineer);
      setNguoiLap(ticketToEdit.nguoiLap);
      setMaThietBi(ticketToEdit.maThietBi || '');
      setKetQua(ticketToEdit.ketQua || '');
      setNgayHoanThanh(ticketToEdit.ngayHoanThanh || '');
      setAnhTruocXuLy(ticketToEdit.anhTruocXuLy || '');
      setAnhSauXuLy(ticketToEdit.anhSauXuLy || '');
    } else {
      setTieuDe('');
      setMoTaChiTiet('');
      setTrangThai('Mới tiếp nhận');
      setMucDoUuTien('Cao');
      setNguoiPhuTrach(employees[0]?.tenNhanVien || currentUser.tenNhanVien);
      setNguoiGiaoViec(defaultEngineer);
      setNguoiLap(currentUser.tenNhanVien);
      setMaThietBi(defaultEquipmentCode || '');
      setKetQua('');
      setNgayHoanThanh('');
      setAnhTruocXuLy('');
      setAnhSauXuLy('');
    }
    setError('');
  }, [isOpen, ticketToEdit, defaultEquipmentCode, currentUser, defaultEngineer, employees]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tieuDe.trim()) {
      setError('Vui lòng nhập tiêu đề yêu cầu ticket');
      return;
    }
    if (parseAssigneeNames(nguoiPhuTrach).length === 0) {
      setError('Vui lòng chọn ít nhất 1 người phụ trách thực hiện ticket');
      return;
    }

    if (ticketToEdit) {
      updateTicket({
        ...ticketToEdit,
        tieuDe,
        moTaChiTiet,
        trangThai,
        mucDoUuTien,
        nguoiPhuTrach,
        nguoiGiaoViec,
        nguoiLap,
        maThietBi,
        ketQua,
        ngayHoanThanh: trangThai === 'Hoàn thành' && !ngayHoanThanh ? '2026-11-10' : ngayHoanThanh,
        anhTruocXuLy,
        anhSauXuLy,
      });
    } else {
      addTicket({
        tieuDe,
        moTaChiTiet,
        trangThai,
        mucDoUuTien,
        nguoiPhuTrach,
        nguoiGiaoViec,
        nguoiLap,
        maThietBi,
        ketQua,
        ngayHoanThanh: trangThai === 'Hoàn thành' ? '2026-11-10' : '',
        anhTruocXuLy,
        anhSauXuLy,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Tag className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">
                {ticketToEdit ? `Chỉnh Sửa Ticket [${ticketToEdit.maTicket}]` : 'Tạo Yêu Cầu Bảo Trì / Ticket Mới'}
              </h3>
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

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Tiêu đề yêu cầu / Sự cố *</label>
            <input
              type="text"
              value={tieuDe}
              onChange={(e) => {
                setTieuDe(e.target.value);
                setError('');
              }}
              required
              placeholder="VD: Rò rỉ nước tại mặt bích bơm, máy nén khí rung bất thường..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Mức Độ Ưu Tiên</label>
              <select
                value={mucDoUuTien}
                onChange={(e) => setMucDoUuTien(e.target.value as TicketPriority)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Khẩn cấp">🔴 Khẩn cấp (Dừng chuyền / Nguy cơ cháy nổ)</option>
                <option value="Cao">🟠 Cao (Ảnh hưởng năng suất)</option>
                <option value="Bình thường">🔵 Bình thường (Theo quy chuẩn)</option>
                <option value="Trung bình">🟡 Trung bình (Cần xử lý trong tuần)</option>
                <option value="Thấp">🟢 Thấp (Cải tiến / Vệ sinh)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Trạng Thái Ticket</label>
              <select
                value={trangThai}
                onChange={(e) => setTrangThai(e.target.value as TicketStatus)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Chờ xử lý">Chờ xử lý</option>
                <option value="Đang thực hiện">Đang thực hiện</option>
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Mới tiếp nhận">Mới tiếp nhận</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Hủy">Hủy</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Thiết Bị Liên Quan</label>
              <select
                value={maThietBi}
                onChange={(e) => setMaThietBi(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Không xác định hoặc sự cố chung --</option>
                {equipment.map((eq) => (
                  <option key={eq.maThietBi} value={eq.maThietBi}>
                    {eq.maThietBi} - {eq.tenThietBi} ({eq.viTri})
                  </option>
                ))}
              </select>
            </div>

            <MultiAssigneePicker
              employees={employees}
              value={nguoiPhuTrach}
              onChange={(formatted) => {
                setNguoiPhuTrach(formatted);
                if (formatted) setError('');
              }}
              label="Người Phụ Trách Thực Hiện (Chọn 1 hoặc nhiều người)"
              accentColor="amber"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Mô Tả Chi Tiết Yêu Cầu / Hiện Trạng</label>
            <textarea
              rows={3}
              value={moTaChiTiet}
              onChange={(e) => setMoTaChiTiet(e.target.value)}
              placeholder="Mô tả cụ thể vị trí, hiện tượng, triệu chứng hỏng hóc..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Direct Camera Capture for Before & After Photos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CameraCaptureInput
              label="Ảnh Hiện Trường (Trước Xử Lý)"
              value={anhTruocXuLy}
              onChange={setAnhTruocXuLy}
              placeholder="Chụp hiện trường sự cố..."
              previewShape="wide"
              compact
            />

            <CameraCaptureInput
              label="Ảnh Nghiệm Thu (Sau Xử Lý)"
              value={anhSauXuLy}
              onChange={setAnhSauXuLy}
              placeholder="Chụp nghiệm thu hoàn thành..."
              previewShape="wide"
              compact
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Kết Quả Xử Lý & Đánh Giá</label>
            <input
              type="text"
              value={ketQua}
              onChange={(e) => setKetQua(e.target.value)}
              placeholder="VD: Đã siết cos, thay contactor mới, test chạy ổn định..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Người Giao Việc</label>
              <select
                value={nguoiGiaoViec}
                onChange={(e) => setNguoiGiaoViec(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              >
                {employees.map((emp) => (
                  <option key={emp.maNhanVien} value={emp.tenNhanVien}>
                    [{emp.maNhanVien}] {emp.tenNhanVien}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Người Lập Phiếu</label>
              <select
                value={nguoiLap}
                onChange={(e) => setNguoiLap(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              >
                {employees.map((emp) => (
                  <option key={emp.maNhanVien} value={emp.tenNhanVien}>
                    [{emp.maNhanVien}] {emp.tenNhanVien} - {emp.chucVu}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm shadow-lg shadow-amber-900/40 transition flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {ticketToEdit ? 'Cập Nhật Ticket' : 'Tạo Ticket Mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
