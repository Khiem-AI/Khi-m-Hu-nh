import React, { useEffect, useRef, useState } from 'react';
import { useCMMS } from '../context/CMMSContext';
import { Equipment, MaintenanceFrequency, RiskLevel, EquipmentStatus } from '../types/cmms';
import { canAssignWork, parseAssigneeNames, resolveAssigneeEmails, isAdminLevel, isPlaceholderEmail, isValidEmailFormat } from '../utils/cmmsLogic';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../utils/firestoreSync';
import { CameraCaptureInput } from './common/CameraCaptureInput';
import { MultiAssigneePicker } from './common/MultiAssigneePicker';
import { GoogleSignInButton } from './common/GoogleSignInButton';
import { X, Cpu, CheckCircle, AlertTriangle, Mail, Settings, RefreshCw } from 'lucide-react';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentToEdit?: Equipment | null;
}

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  isOpen,
  onClose,
  equipmentToEdit,
}) => {
  const {
    addEquipment,
    updateEquipment,
    currentUser,
    employees,
    assignWorkAndNotify,
    connectGmail,
    isGmailConnected,
    emailConfig,
    autoEmailServerStatus,
  } = useCMMS();

  const allowAssignWork = canAssignWork(currentUser);
  const defaultEngineer =
    employees.find((e) => e.chucVu === 'Kỹ sư thiết bị')?.tenNhanVien || currentUser.tenNhanVien;

  const [maThietBi, setMaThietBi] = useState(equipmentToEdit?.maThietBi || '');
  const [tenThietBi, setTenThietBi] = useState(equipmentToEdit?.tenThietBi || '');
  const [heThong, setHeThong] = useState(equipmentToEdit?.heThong || 'Hệ Thống Lạnh');
  const [viTri, setViTri] = useState(equipmentToEdit?.viTri || 'Utility House');
  const [mucDoRuiRo, setMucDoRuiRo] = useState<RiskLevel>(equipmentToEdit?.mucDoRuiRo || 'Medium');
  const [trangThai, setTrangThai] = useState<EquipmentStatus>(equipmentToEdit?.trangThai || 'Hoạt động');
  const [tanSuat, setTanSuat] = useState<MaintenanceFrequency>(equipmentToEdit?.tanSuat || 'Monthly');
  const [hanBaoTriTiepTheo, setHanBaoTriTiepTheo] = useState(
    equipmentToEdit?.hanBaoTriTiepTheo || '2026-11-25'
  );
  const [nguoiPhuTrach, setNguoiPhuTrach] = useState(
    equipmentToEdit?.nguoiPhuTrach ||
      (allowAssignWork ? currentUser.tenNhanVien || employees[0]?.tenNhanVien || '' : currentUser.tenNhanVien)
  );
  const [nguoiGiaoViec, setNguoiGiaoViec] = useState(
    equipmentToEdit ? equipmentToEdit.nguoiGiaoViec || '' : allowAssignWork ? defaultEngineer : ''
  );
  const [email, setEmail] = useState(
    equipmentToEdit?.email || currentUser.email || 'khiemhuynhggs@gmail.com'
  );
  const [thongSoKyThuat, setThongSoKyThuat] = useState(equipmentToEdit?.thongSoKyThuat || '');
  const [hinhAnh, setHinhAnh] = useState(
    equipmentToEdit?.hinhAnh ||
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
  );
  const [sendAssignmentEmail, setSendAssignmentEmail] = useState(false);
  const [error, setError] = useState('');
  const [emailFailure, setEmailFailure] = useState<string | null>(null);

  const initializedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      initializedKeyRef.current = null;
      return;
    }
    const nextKey = equipmentToEdit ? `edit:${equipmentToEdit.maThietBi}` : 'new';
    if (initializedKeyRef.current === nextKey) return;
    initializedKeyRef.current = nextKey;

    if (equipmentToEdit) {
      setMaThietBi(equipmentToEdit.maThietBi);
      setTenThietBi(equipmentToEdit.tenThietBi);
      setHeThong(equipmentToEdit.heThong);
      setViTri(equipmentToEdit.viTri);
      setMucDoRuiRo(equipmentToEdit.mucDoRuiRo);
      setTrangThai(equipmentToEdit.trangThai);
      setTanSuat(equipmentToEdit.tanSuat);
      setHanBaoTriTiepTheo(equipmentToEdit.hanBaoTriTiepTheo);
      setNguoiPhuTrach(equipmentToEdit.nguoiPhuTrach);
      setNguoiGiaoViec(equipmentToEdit.nguoiGiaoViec || (allowAssignWork ? defaultEngineer : ''));
      setEmail(equipmentToEdit.email);
      setThongSoKyThuat(equipmentToEdit.thongSoKyThuat);
      setHinhAnh(equipmentToEdit.hinhAnh || '');
      setSendAssignmentEmail(false);
    } else {
      setMaThietBi('');
      setTenThietBi('');
      setHeThong('Hệ Thống Lạnh');
      setViTri('Utility House');
      setMucDoRuiRo('Medium');
      setTrangThai('Hoạt động');
      setTanSuat('Monthly');
      setHanBaoTriTiepTheo('2026-11-25');
      setNguoiPhuTrach(
        allowAssignWork ? currentUser.tenNhanVien || employees[0]?.tenNhanVien || '' : currentUser.tenNhanVien
      );
      setNguoiGiaoViec(allowAssignWork ? defaultEngineer : '');
      setEmail(currentUser.email || 'khiemhuynhggs@gmail.com');
      setThongSoKyThuat('');
      setHinhAnh(
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
      );
      setSendAssignmentEmail(allowAssignWork);
    }
    setError('');
    setEmailFailure(null);
  }, [isOpen, equipmentToEdit, currentUser, defaultEngineer, employees, allowAssignWork]);

  if (!isOpen) return null;

  const isAutoSendReady = Boolean(
    emailConfig.notificationMode === 'web_only' ||
      isGmailConnected ||
      emailConfig.webhookUrl?.trim() ||
      autoEmailServerStatus.smtpConfigured ||
      autoEmailServerStatus.resendConfigured ||
      autoEmailServerStatus.envWebhookConfigured
  );

  const handleAssigneeChange = (formattedNames: string) => {
    setNguoiPhuTrach(formattedNames);
    if (formattedNames.trim()) {
      const resolved = resolveAssigneeEmails(formattedNames, employees, currentUser.email);
      if (resolved.length > 0) {
        setEmail(resolved.join(', '));
      }
      setError('');
    }
  };

  const sendEquipmentAssignment = async (payloadCode: string, payloadName: string, payloadViTri: string) => {
    const res = await assignWorkAndNotify({
      module: 'THIET_BI',
      targetId: payloadCode,
      targetName: payloadName,
      assigneeName: nguoiPhuTrach,
      assignerName: nguoiGiaoViec || currentUser.tenNhanVien,
      note: `Phân công phụ trách thiết bị tại ${payloadViTri} (Hạn bảo trì: ${hanBaoTriTiepTheo})`,
      sendEmail: true,
      recipientEmailOverride: email.trim() || undefined,
    });
    if (res && !res.success) {
      setEmailFailure(res.message);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maThietBi.trim() || !tenThietBi.trim()) {
      setError('Vui lòng nhập mã thiết bị và tên máy');
      return;
    }
    if (parseAssigneeNames(nguoiPhuTrach).length === 0) {
      setError('Vui lòng chọn ít nhất 1 người phụ trách thiết bị');
      return;
    }

    if (sendAssignmentEmail) {
      const parsedEmails = email
        .split(/[,;]+/)
        .map((s) => s.trim())
        .filter((s) => isValidEmailFormat(s));
      const realEmails = parsedEmails.filter((addr) => !isPlaceholderEmail(addr));
      if (parsedEmails.length === 0 || realEmails.length === 0) {
        setError('Vui lòng nhập Gmail / email thực tế (không dùng @factory.com) để gửi thông báo.');
        return;
      }
      if (!isAutoSendReady && isAdminLevel(currentUser)) {
        const authRes = await connectGmail(true);
        if (!authRes.success) {
          setError(authRes.message);
          return;
        }
      }
    }

    const code = maThietBi.trim().toUpperCase();
    const payload: Equipment = {
      maThietBi: code,
      tenThietBi: tenThietBi.trim(),
      heThong: heThong.trim(),
      viTri: viTri.trim(),
      mucDoRuiRo,
      trangThai,
      tanSuat,
      hanBaoTriTiepTheo,
      nguoiPhuTrach,
      nguoiGiaoViec,
      email,
      thongSoKyThuat,
      hinhAnh,
      qrCode: equipmentToEdit?.qrCode || `FSM://${code}`,
      ngayLapDat: equipmentToEdit?.ngayLapDat || '2023-01-15',
    };

    if (equipmentToEdit) {
      updateEquipment(payload);
    } else {
      addEquipment(payload);
    }

    if (allowAssignWork && sendAssignmentEmail && nguoiPhuTrach) {
      const ok = await sendEquipmentAssignment(code, payload.tenThietBi, payload.viTri);
      if (!ok) return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">
                {equipmentToEdit ? `Sửa Thông Tin Máy [${equipmentToEdit.maThietBi}]` : 'Thêm Máy Móc / Thiết Bị Mới'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Mã Thiết Bị *</label>
              <input
                type="text"
                disabled={!!equipmentToEdit}
                value={maThietBi}
                onChange={(e) => setMaThietBi(e.target.value)}
                placeholder="VD: HVAC-CH-04, CMP-GA75-03..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tên Thiết Bị *</label>
              <input
                type="text"
                value={tenThietBi}
                onChange={(e) => setTenThietBi(e.target.value)}
                placeholder="VD: Chiller số 03, Máy nén khí GA75..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Hệ Thống / Danh Mục</label>
              <input
                type="text"
                value={heThong}
                onChange={(e) => setHeThong(e.target.value)}
                placeholder="Hệ Thống Lạnh, Khí Nén, Hệ thống điện..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Vị Trí Lắp Đặt</label>
              <input
                type="text"
                value={viTri}
                onChange={(e) => setViTri(e.target.value)}
                placeholder="Utility House, AHU Room, Nhà xưởng..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Mức Độ Rủi Ro</label>
              <select
                value={mucDoRuiRo}
                onChange={(e) => setMucDoRuiRo(e.target.value as RiskLevel)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="High">Cao (High)</option>
                <option value="Medium">Trung bình (Medium)</option>
                <option value="Low">Thấp (Low)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Trạng Thái</label>
              <select
                value={trangThai}
                onChange={(e) => setTrangThai(e.target.value as EquipmentStatus)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Hoạt động">Hoạt động</option>
                <option value="Đang sửa chữa">Đang sửa chữa</option>
                <option value="Bảo trì">Bảo trì</option>
                <option value="Tạm dừng">Tạm dừng</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tần Suất Bảo Trì</label>
              <select
                value={tanSuat}
                onChange={(e) => setTanSuat(e.target.value as MaintenanceFrequency)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Daily">Daily (Hàng ngày)</option>
                <option value="Weekly">Weekly (Hàng tuần)</option>
                <option value="Monthly">Monthly (Hàng tháng)</option>
                <option value="Quarterly">Quarterly (Hàng quý)</option>
                <option value="Yearly">Yearly (Hàng năm)</option>
              </select>
            </div>
          </div>

          <div className={`grid grid-cols-1 ${allowAssignWork ? 'sm:grid-cols-2' : ''} gap-4`}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Hạn Bảo Trì Kế Tiếp</label>
              <input
                type="date"
                value={hanBaoTriTiepTheo}
                onChange={(e) => setHanBaoTriTiepTheo(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {allowAssignWork && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Người Giao Việc</label>
                <select
                  value={nguoiGiaoViec}
                  onChange={(e) => setNguoiGiaoViec(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.maNhanVien} value={emp.tenNhanVien}>
                      [{emp.maNhanVien}] {emp.tenNhanVien}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {allowAssignWork ? (
              <MultiAssigneePicker
                employees={employees}
                value={nguoiPhuTrach}
                onChange={(formatted) => handleAssigneeChange(formatted)}
                label="Người Phụ Trách Thiết Bị (Chọn 1 hoặc nhiều người)"
                accentColor="cyan"
                required
              />
            ) : equipmentToEdit ? (
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/70 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="text-slate-400">Phụ trách hiện tại:</span>{' '}
                  <strong className="text-cyan-300">{nguoiPhuTrach || '—'}</strong>
                </span>
                {nguoiGiaoViec && (
                  <span>
                    <span className="text-slate-400">Người giao việc:</span>{' '}
                    <strong className="text-slate-200">{nguoiGiaoViec}</strong>
                  </span>
                )}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Email Phụ Trách (Ngăn cách bằng dấu phẩy khi có nhiều người)
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email1@domain.com, email2@domain.com"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
              />
            </div>
          </div>

          {allowAssignWork && (
            <div className="rounded-xl bg-cyan-950/30 border border-cyan-500/30 p-3 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={sendAssignmentEmail}
                  onChange={(e) => setSendAssignmentEmail(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span className="flex items-center gap-1.5 font-semibold text-cyan-300">
                  <Mail className="w-4 h-4" />
                  Gửi email giao việc tới người phụ trách ({email})
                </span>
              </label>
              {sendAssignmentEmail && !isAutoSendReady && (
                isAdminLevel(currentUser) ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-cyan-500/20 text-[11px] text-amber-200">
                    <span>
                      Chưa bật SMTP/Webhook dùng chung. Admin có thể bấm Sign in with Google ({BOOTSTRAPPED_ADMIN_EMAIL}) để gửi trực tiếp qua Gmail.
                    </span>
                    <GoogleSignInButton
                      compact
                      label="Sign in with Google"
                      onClick={async () => {
                        const res = await connectGmail(true);
                        if (!res.success) setError(res.message);
                      }}
                    />
                  </div>
                ) : (
                  <div className="pt-2 border-t border-cyan-500/20 text-[11px] text-amber-200/90">
                    Email gửi qua 1 tài khoản Admin (<span className="font-mono">{BOOTSTRAPPED_ADMIN_EMAIL}</span>) khi Admin bật SMTP/Webhook dùng chung.
                  </div>
                )
              )}
            </div>
          )}

          {/* Thông số kỹ thuật */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Thông Số Kỹ Thuật (Specs)</label>
            <textarea
              rows={2}
              value={thongSoKyThuat}
              onChange={(e) => setThongSoKyThuat(e.target.value)}
              placeholder="Model, công suất điện, lưu lượng, điện áp, áp suất làm việc..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Camera & Photo Capture */}
          <CameraCaptureInput
            label="Hình Ảnh Thiết Bị (Chụp Trực Tiếp / URL / Drive)"
            value={hinhAnh}
            onChange={setHinhAnh}
            placeholder="Dán link Google Drive, URL ảnh hoặc bấm Chụp Trực Tiếp..."
            previewShape="wide"
          />

          {emailFailure && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-100 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300">
                    Đã lưu thông tin thiết bị, nhưng chưa gửi được email tự động:
                  </p>
                  <p className="text-amber-100/90 mt-0.5">{emailFailure}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {!isAutoSendReady && isAdminLevel(currentUser) ? (
                  <GoogleSignInButton
                    compact
                    label="Sign in with Google & Gửi lại"
                    onClick={async () => {
                      const res = await connectGmail(true);
                      if (res.success) {
                        setEmailFailure(null);
                        const ok = await sendEquipmentAssignment(
                          maThietBi.trim().toUpperCase(),
                          tenThietBi.trim(),
                          viTri.trim()
                        );
                        if (ok) onClose();
                      } else {
                        setEmailFailure(res.message);
                      }
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      setEmailFailure(null);
                      const ok = await sendEquipmentAssignment(
                        maThietBi.trim().toUpperCase(),
                        tenThietBi.trim(),
                        viTri.trim()
                      );
                      if (ok) onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Gửi Lại Email Ngay</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('fsm:navigate-tab', { detail: 'email_alerts' }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Cài Đặt Email</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}

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
              className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm shadow-lg shadow-cyan-900/40 transition flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {equipmentToEdit ? 'Cập Nhật Thiết Bị' : 'Thêm Vào Hệ Thống'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
