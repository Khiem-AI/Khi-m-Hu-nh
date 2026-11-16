import React, { useState, useEffect } from 'react';
import { Equipment, MaintenanceHistory, MaintenanceResult, MaintenanceWorkType } from '../types/cmms';
import { useCMMS } from '../context/CMMSContext';
import { calculateNextMaintenanceDate, formatDateVN, getHistoryWorkType, isAdminLevel, parseAssigneeNames } from '../utils/cmmsLogic';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../utils/firestoreSync';
import { CameraCaptureInput } from './common/CameraCaptureInput';
import { MultiAssigneePicker } from './common/MultiAssigneePicker';
import { GoogleSignInButton } from './common/GoogleSignInButton';
import { X, Wrench, Hammer, Clock, CheckCircle2, AlertCircle, Calendar, DollarSign, Layers, Mail } from 'lucide-react';

interface MaintenanceExecutionModalProps {
  isOpen?: boolean;
  equipment?: Equipment | null;
  initialRecord?: MaintenanceHistory | null;
  defaultWorkType?: MaintenanceWorkType;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MaintenanceExecutionModal: React.FC<MaintenanceExecutionModalProps> = ({
  isOpen,
  equipment: propEquipment,
  initialRecord,
  defaultWorkType = 'Bảo trì theo kế hoạch',
  onClose,
  onSuccess,
}) => {
  const {
    equipment: allEquipment,
    completeMaintenance,
    updateMaintenanceHistory,
    currentUser,
    employees,
    emailConfig,
    isGmailConnected,
    gmailUser,
    connectGmail,
    autoEmailServerStatus,
  } = useCMMS();

  const isEditMode = Boolean(initialRecord && initialRecord.id);
  const shouldOpen = isOpen !== undefined ? isOpen : Boolean(propEquipment || initialRecord);

  const defaultEngineer =
    employees.find((e) => e.chucVu === 'Kỹ sư thiết bị')?.tenNhanVien || currentUser.tenNhanVien;

  const initialEquipCode =
    initialRecord?.maThietBi || propEquipment?.maThietBi || allEquipment[0]?.maThietBi || '';
  const [selectedCode, setSelectedCode] = useState<string>(initialEquipCode);

  const activeEquipment =
    allEquipment.find((e) => e.maThietBi === selectedCode) || propEquipment || allEquipment[0];

  const today = '2026-11-10';
  const [loaiCongViec, setLoaiCongViec] = useState<MaintenanceWorkType>(
    initialRecord ? getHistoryWorkType(initialRecord) : defaultWorkType
  );
  const [ngayThucHien, setNgayThucHien] = useState(initialRecord?.ngayThucHien || today);
  const [nguoiThucHien, setNguoiThucHien] = useState(
    initialRecord?.nguoiThucHien || propEquipment?.nguoiPhuTrach || ''
  );
  const [nguoiGiaoViec, setNguoiGiaoViec] = useState(
    initialRecord?.nguoiGiaoViec || propEquipment?.nguoiGiaoViec || defaultEngineer
  );
  const [moTaCongViec, setMoTaCongViec] = useState(initialRecord?.moTaCongViec || '');
  const [thoiGianDungMay, setThoiGianDungMay] = useState<number>(initialRecord?.thoiGianDungMay ?? 60);
  const [ketQua, setKetQua] = useState<MaintenanceResult>(initialRecord?.ketQua || 'Đạt');
  const [anhTruocXuLy, setAnhTruocXuLy] = useState(initialRecord?.anhTruocXuLy || '');
  const [hinhAnh, setHinhAnh] = useState(
    initialRecord?.hinhAnh ||
      activeEquipment?.hinhAnh ||
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
  );
  const [nguoiLapBaoCao, setNguoiLapBaoCao] = useState(
    initialRecord?.nguoiLapBaoCao || currentUser.tenNhanVien || 'Khiêm Huỳnh'
  );
  const [chiPhiUocTinh, setChiPhiUocTinh] = useState<number>(initialRecord?.chiPhiUocTinh ?? 0);
  const [sendCompletionEmail, setSendCompletionEmail] = useState<boolean>(Boolean(emailConfig.enabled));
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shouldOpen) return;
    setError('');
    setSendCompletionEmail(Boolean(emailConfig.enabled));
    if (initialRecord) {
      setSelectedCode(initialRecord.maThietBi);
      setLoaiCongViec(getHistoryWorkType(initialRecord));
      setNgayThucHien(initialRecord.ngayThucHien);
      setNguoiThucHien(initialRecord.nguoiThucHien || '');
      setNguoiGiaoViec(initialRecord.nguoiGiaoViec || defaultEngineer);
      setMoTaCongViec(initialRecord.moTaCongViec);
      setThoiGianDungMay(initialRecord.thoiGianDungMay);
      setKetQua(initialRecord.ketQua);
      setAnhTruocXuLy(initialRecord.anhTruocXuLy || '');
      setHinhAnh(initialRecord.hinhAnh || '');
      setNguoiLapBaoCao(initialRecord.nguoiLapBaoCao);
      setChiPhiUocTinh(initialRecord.chiPhiUocTinh ?? 0);
    } else if (propEquipment) {
      setSelectedCode(propEquipment.maThietBi);
      setLoaiCongViec(defaultWorkType);
      setNgayThucHien(today);
      setNguoiThucHien(propEquipment.nguoiPhuTrach || '');
      setNguoiGiaoViec(propEquipment.nguoiGiaoViec || defaultEngineer);
      setMoTaCongViec('');
      setAnhTruocXuLy('');
      setChiPhiUocTinh(0);
      if (propEquipment.hinhAnh) setHinhAnh(propEquipment.hinhAnh);
    } else {
      setLoaiCongViec(defaultWorkType);
      setNgayThucHien(today);
      setNguoiThucHien('');
      setNguoiGiaoViec(defaultEngineer);
      setMoTaCongViec('');
      setAnhTruocXuLy('');
      setChiPhiUocTinh(0);
    }
  }, [shouldOpen, initialRecord, propEquipment, defaultEngineer, defaultWorkType]);

  if (!shouldOpen || !activeEquipment) return null;

  const calculatedNextDate = calculateNextMaintenanceDate(ngayThucHien, activeEquipment.tanSuat);

  const adminAuthorized = isAdminLevel(currentUser);
  const isAutoSendReady = Boolean(
    emailConfig.notificationMode === 'web_only' ||
      isGmailConnected ||
      emailConfig.webhookUrl?.trim() ||
      autoEmailServerStatus.smtpConfigured ||
      autoEmailServerStatus.resendConfigured ||
      autoEmailServerStatus.envWebhookConfigured
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseAssigneeNames(nguoiThucHien).length === 0) {
      setError('Vui lòng chọn ít nhất 1 người thực hiện');
      return;
    }
    if (!moTaCongViec.trim()) {
      setError('Vui lòng nhập mô tả chi tiết nội dung công việc đã thực hiện');
      return;
    }

    if (!isEditMode && sendCompletionEmail && !isAutoSendReady && adminAuthorized) {
      setIsConnectingGmail(true);
      setError('');
      const authRes = await connectGmail(true);
      setIsConnectingGmail(false);
      if (!authRes.success) {
        setError(authRes.message);
        return;
      }
    }

    if (isEditMode && initialRecord) {
      updateMaintenanceHistory({
        id: initialRecord.id,
        maThietBi: activeEquipment.maThietBi,
        tenThietBi: activeEquipment.tenThietBi,
        loaiCongViec,
        ngayThucHien,
        nguoiThucHien,
        nguoiGiaoViec,
        moTaCongViec,
        thoiGianDungMay: Number(thoiGianDungMay) || 0,
        ketQua,
        anhTruocXuLy,
        hinhAnh,
        nguoiLapBaoCao,
        chiPhiUocTinh: Number(chiPhiUocTinh) || 0,
      });
    } else {
      completeMaintenance(
        {
          maThietBi: activeEquipment.maThietBi,
          tenThietBi: activeEquipment.tenThietBi,
          loaiCongViec,
          ngayThucHien,
          nguoiThucHien,
          nguoiGiaoViec,
          moTaCongViec,
          thoiGianDungMay: Number(thoiGianDungMay) || 0,
          ketQua,
          anhTruocXuLy,
          hinhAnh,
          nguoiLapBaoCao,
          chiPhiUocTinh: Number(chiPhiUocTinh) || 0,
        },
        { userConfirmedEmail: sendCompletionEmail }
      );
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Wrench className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">
                {isEditMode ? 'Cập Nhật Biên Bản Bảo Trì' : 'Ghi Nhận Hoàn Tất Bảo Trì / Sửa Chữa'}
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

        {!propEquipment && !isEditMode ? (
          <div className="px-6 py-3.5 bg-slate-800/50 border-b border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Chọn Thiết Bị Cần Ghi Nhận Bảo Trì *
            </label>
            <select
              value={selectedCode}
              onChange={(e) => {
                setSelectedCode(e.target.value);
                const found = allEquipment.find((item) => item.maThietBi === e.target.value);
                if (found && found.hinhAnh) setHinhAnh(found.hinhAnh);
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {allEquipment.map((eq) => (
                <option key={eq.maThietBi} value={eq.maThietBi}>
                  {eq.maThietBi} - {eq.tenThietBi} ({eq.heThong} • {eq.tanSuat})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {activeEquipment.hinhAnh && (
                <img
                  src={
                    activeEquipment.hinhAnh.includes('drive.google.com')
                      ? activeEquipment.hinhAnh.replace(/.*[?&]id=([a-zA-Z0-9_-]+).*/, 'https://lh3.googleusercontent.com/d/$1=w200')
                      : activeEquipment.hinhAnh
                  }
                  alt={activeEquipment.tenThietBi}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0 bg-slate-900"
                />
              )}
              <div>
                <div>
                  <span className="text-slate-400">Thiết bị:</span>{' '}
                  <strong className="text-cyan-400 font-mono">{activeEquipment.maThietBi}</strong> -{' '}
                  <span className="text-slate-100 font-medium">{activeEquipment.tenThietBi}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {activeEquipment.heThong} • Vị trí: {activeEquipment.viTri}
                </div>
              </div>
            </div>
            <span className="text-slate-400">
              Tần suất: <strong className="text-cyan-400">{activeEquipment.tanSuat}</strong>
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Phân loại công việc: Bảo trì theo kế hoạch vs Sửa chữa */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Loại Công Việc Thực Hiện *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setLoaiCongViec('Bảo trì theo kế hoạch')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  loaiCongViec === 'Bảo trì theo kế hoạch'
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-100'
                    : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Wrench
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    loaiCongViec === 'Bảo trì theo kế hoạch' ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold">Bảo trì theo kế hoạch</div>
                  <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                    Lưu lịch sử & tự động tạo/cập nhật kế hoạch bảo trì tiếp theo
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLoaiCongViec('Sửa chữa')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  loaiCongViec === 'Sửa chữa'
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-100'
                    : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Hammer
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    loaiCongViec === 'Sửa chữa' ? 'text-amber-400' : 'text-slate-400'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold">Sửa chữa thiết bị</div>
                  <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                    Chỉ ghi nhận vào lịch sử thiết bị, giữ nguyên chu kỳ định kỳ
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Ngày Thực Hiện *
              </label>
              <input
                type="date"
                value={ngayThucHien}
                onChange={(e) => setNgayThucHien(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Người Giao Việc
              </label>
              <select
                value={nguoiGiaoViec}
                onChange={(e) => setNguoiGiaoViec(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {employees.map((emp) => (
                  <option key={emp.maNhanVien} value={emp.tenNhanVien}>
                    [{emp.maNhanVien}] {emp.tenNhanVien}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <MultiAssigneePicker
            employees={employees}
            value={nguoiThucHien}
            onChange={(formatted) => {
              setNguoiThucHien(formatted);
              if (formatted && error) setError('');
            }}
            label="Người Thực Hiện"
            accentColor="emerald"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Mô Tả Chi Tiết Công Việc Đã Thực Hiện *
            </label>
            <textarea
              rows={3}
              value={moTaCongViec}
              onChange={(e) => {
                setMoTaCongViec(e.target.value);
                if (error) setError('');
              }}
              required
              placeholder="VD: Kiểm tra phốt cơ khí, thay dầu máy nén, vệ sinh tấm lọc gió, đo dòng động cơ, siết ốc chân máy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Thời Gian Dừng Máy (Phút)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={thoiGianDungMay}
                onChange={(e) => setThoiGianDungMay(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Kết Quả *</label>
              <select
                value={ketQua}
                onChange={(e) => setKetQua(e.target.value as MaintenanceResult)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Hoàn thành">Hoàn thành (Đạt tiêu chuẩn)</option>
                <option value="Đạt">Đạt (Hoạt động tốt)</option>
                <option value="Cần theo dõi">Cần theo dõi thêm</option>
                <option value="Chưa đạt">Chưa đạt (Cần sửa tiếp)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Chi Phí Ước Tính (VNĐ)
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                value={chiPhiUocTinh}
                onChange={(e) => setChiPhiUocTinh(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Direct Camera Capture: Before & After Photos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CameraCaptureInput
              label="Ảnh Trước Khi Bảo Trì"
              value={anhTruocXuLy}
              onChange={setAnhTruocXuLy}
              placeholder="Chụp hiện trạng trước bảo trì..."
              previewShape="wide"
              compact
            />

            <CameraCaptureInput
              label="Ảnh Sau Khi Hoàn Thành"
              value={hinhAnh}
              onChange={setHinhAnh}
              placeholder="Chụp nghiệm thu sau bảo trì..."
              previewShape="wide"
              compact
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Người Lập Báo Cáo *</label>
            <select
              value={nguoiLapBaoCao}
              onChange={(e) => setNguoiLapBaoCao(e.target.value)}
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

          {loaiCongViec === 'Bảo trì theo kế hoạch' ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-slate-300">
                <p className="font-semibold text-emerald-400">
                  Bảo Trì Theo Kế Hoạch — Tự Động Tạo / Cập Nhật Lịch Kế Tiếp:
                </p>
                <p>
                  Lưu vào lịch sử thiết bị và tự động đặt ngày bảo trì tiếp theo:{' '}
                  <span className="font-mono font-bold text-emerald-300 text-sm bg-emerald-900/60 px-2 py-0.5 rounded tabular-nums">
                    {formatDateVN(calculatedNextDate)}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-950/35 border border-amber-500/30 flex items-start gap-3">
              <Hammer className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-slate-300">
                <p className="font-semibold text-amber-300">
                  Công Việc Sửa Chữa — Chỉ Ghi Nhận Lịch Sử Thiết Bị:
                </p>
                <p>
                  Biên bản sửa chữa sẽ lưu vào lịch sử thiết bị (tính vào chỉ số MTTR / MTBF) và{' '}
                  <strong className="text-slate-100">không</strong> tạo mới hoặc thay đổi hạn bảo trì định kỳ hiện tại (
                  <span className="font-mono text-amber-300 tabular-nums">
                    {formatDateVN(activeEquipment.hanBaoTriTiepTheo)}
                  </span>
                  ).
                </p>
              </div>
            </div>
          )}

          {!isEditMode && (
            <div className="rounded-xl bg-cyan-950/30 border border-cyan-500/30 p-3 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={sendCompletionEmail}
                    onChange={(e) => setSendCompletionEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    Tự động gửi email báo cáo hoàn thành về Quản lý
                  </span>
                </label>

                {sendCompletionEmail && (
                  <span className={`text-[10px] font-bold ${emailConfig.notificationMode === 'web_only' || isGmailConnected ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {emailConfig.notificationMode === 'web_only'
                      ? 'Thông báo Web (Miễn phí 0đ)'
                      : isGmailConnected && gmailUser?.email
                      ? `Gmail (${gmailUser.email})`
                      : emailConfig.webhookUrl?.trim()
                      ? 'Đang dự phòng qua Webhook (chưa kết nối Gmail)'
                      : isAutoSendReady
                      ? 'Sẵn sàng gửi tự động'
                      : 'Chưa kết nối Gmail'}
                  </span>
                )}
              </div>

              {sendCompletionEmail && !isAutoSendReady && (
                adminAuthorized ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-cyan-500/20 text-[11px] text-amber-200">
                    <span>
                      Chưa bật kênh SMTP/Webhook dùng chung. Admin có thể bấm Sign in with Google ({BOOTSTRAPPED_ADMIN_EMAIL}) để gửi trực tiếp qua Gmail.
                    </span>
                    <GoogleSignInButton
                      compact
                      disabled={isConnectingGmail}
                      label={isConnectingGmail ? 'Đang kết nối...' : 'Sign in with Google'}
                      onClick={async () => {
                        setIsConnectingGmail(true);
                        const res = await connectGmail(true);
                        setIsConnectingGmail(false);
                        if (!res.success) setError(res.message);
                      }}
                    />
                  </div>
                ) : (
                  <div className="pt-2 border-t border-cyan-500/20 text-[11px] text-amber-200/90">
                    Báo cáo hoàn thành gửi tự động qua 1 tài khoản Admin (<span className="font-mono">{BOOTSTRAPPED_ADMIN_EMAIL}</span>) khi Admin cấu hình SMTP/Webhook. Biên bản vẫn sẽ được lưu bình thường.
                  </div>
                )
              )}
            </div>
          )}

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
              disabled={isConnectingGmail}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-900/40 transition flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isConnectingGmail
                ? 'Đang kết nối Gmail...'
                : isEditMode
                ? 'Lưu Thay Đổi'
                : 'Lưu & Gửi Báo Cáo Hoàn Thành'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
