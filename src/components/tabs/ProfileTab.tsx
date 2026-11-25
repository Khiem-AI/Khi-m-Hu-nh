import React, { useEffect, useMemo, useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { Employee } from '../../types/cmms';
import { formatDateVN, isAdminLevel } from '../../utils/cmmsLogic';
import { CameraCaptureInput } from '../common/CameraCaptureInput';
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Edit3,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserCheck,
  Users,
  X,
  AlertTriangle,
} from 'lucide-react';

function calculateAge(dobStr?: string): number | null {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 && age <= 110 ? age : null;
}

function calculateTenureText(joinDateStr?: string): string {
  if (!joinDateStr) return 'Chưa cập nhật';
  const start = new Date(joinDateStr);
  if (Number.isNaN(start.getTime())) return 'Chưa cập nhật';
  const now = new Date();
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) {
    months -= 1;
  }
  if (months < 0) return 'Sắp nhận việc';
  if (months === 0) return 'Dưới 1 tháng';
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years > 0 && remMonths > 0) return `${years} năm ${remMonths} tháng`;
  if (years > 0) return `${years} năm`;
  return `${remMonths} tháng`;
}

function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const ProfileTab: React.FC = () => {
  const { currentUser, employees, updateEmployee, changePassword } = useCMMS();
  const adminMode = isAdminLevel(currentUser);

  const [selectedCode, setSelectedCode] = useState<string>(currentUser.maNhanVien);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Change password inline modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpNotice, setCpNotice] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!adminMode) {
      setSelectedCode(currentUser.maNhanVien);
    }
  }, [adminMode, currentUser.maNhanVien]);

  const targetEmployee: Employee = useMemo(() => {
    if (!adminMode) {
      return employees.find((e) => e.maNhanVien === currentUser.maNhanVien) || currentUser;
    }
    return (
      employees.find((e) => e.maNhanVien === selectedCode) ||
      employees.find((e) => e.maNhanVien === currentUser.maNhanVien) ||
      currentUser
    );
  }, [adminMode, employees, selectedCode, currentUser]);

  const isViewingSelf = targetEmployee.maNhanVien === currentUser.maNhanVien;
  const canEditTarget = adminMode || isViewingSelf;

  // Draft form state
  const [form, setForm] = useState<Employee>(targetEmployee);

  useEffect(() => {
    setForm({
      ...targetEmployee,
      ngayNghiPhepNam: targetEmployee.ngayNghiPhepNam ?? 12,
      ngayNghiPhepDaDung: targetEmployee.ngayNghiPhepDaDung ?? 0,
    });
    setAvatarError(false);
    setIsEditing(false);
    setSaveError('');
  }, [targetEmployee.maNhanVien]);

  const handleStartEdit = () => {
    setForm({
      ...targetEmployee,
      ngayNghiPhepNam: targetEmployee.ngayNghiPhepNam ?? 12,
      ngayNghiPhepDaDung: targetEmployee.ngayNghiPhepDaDung ?? 0,
    });
    setSaveSuccess('');
    setSaveError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setForm({
      ...targetEmployee,
      ngayNghiPhepNam: targetEmployee.ngayNghiPhepNam ?? 12,
      ngayNghiPhepDaDung: targetEmployee.ngayNghiPhepDaDung ?? 0,
    });
    setSaveError('');
    setIsEditing(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (!form.tenNhanVien.trim()) {
      setSaveError('Họ và tên nhân viên không được để trống.');
      return;
    }

    const totalLeave = Math.max(0, Math.min(365, Number(form.ngayNghiPhepNam ?? 12) || 0));
    const usedLeave = Math.max(0, Math.min(365, Number(form.ngayNghiPhepDaDung ?? 0) || 0));

    const updated: Employee = adminMode
      ? {
          ...targetEmployee,
          ...form,
          tenNhanVien: form.tenNhanVien.trim(),
          ngayNghiPhepNam: totalLeave,
          ngayNghiPhepDaDung: usedLeave,
        }
      : {
          ...targetEmployee,
          tenNhanVien: form.tenNhanVien.trim(),
          anhDaiDien: form.anhDaiDien,
          gioiTinh: form.gioiTinh,
          ngaySinh: form.ngaySinh,
          queQuan: form.queQuan,
          diaChiThuongTru: form.diaChiThuongTru,
          soDienThoai: form.soDienThoai,
          soCCCD: form.soCCCD,
          ngayCapCCCD: form.ngayCapCCCD,
          noiCapCCCD: form.noiCapCCCD,
          trinhDoHocVan: form.trinhDoHocVan,
          tinhTrangHonNhan: form.tinhTrangHonNhan,
          chuyenMon: form.chuyenMon,
          nguoiLienHeKhanCap: form.nguoiLienHeKhanCap,
          sdtKhanCap: form.sdtKhanCap,
          ghiChuHoSo: form.ghiChuHoSo,
        };

    updateEmployee(updated);
    setIsEditing(false);
    setSaveSuccess(`Đã lưu hồ sơ của ${updated.tenNhanVien} và đồng bộ hệ thống.`);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpNotice(null);
    if (cpNew.trim() !== cpConfirm.trim()) {
      setCpNotice({ ok: false, text: 'Mật khẩu mới và xác nhận mật khẩu không khớp.' });
      return;
    }
    const res = await changePassword(currentUser.maNhanVien, cpCurrent, cpNew);
    setCpNotice({ ok: res.success, text: res.message });
    if (res.success) {
      setCpCurrent('');
      setCpNew('');
      setCpConfirm('');
    }
  };

  const activeData = isEditing ? form : targetEmployee;
  const age = calculateAge(activeData.ngaySinh);
  const tenureText = calculateTenureText(activeData.ngayVao);
  const totalLeaveDays = Number(activeData.ngayNghiPhepNam ?? 12);
  const usedLeaveDays = Number(activeData.ngayNghiPhepDaDung ?? 0);
  const remainingLeaveDays = Math.max(0, totalLeaveDays - usedLeaveDays);
  const leaveUsagePct =
    totalLeaveDays > 0 ? Math.min(100, Math.round((usedLeaveDays / totalLeaveDays) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
            {UI_TEXTS.tabs.profile.badge}
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
            {UI_TEXTS.tabs.profile.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {adminMode && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <select
                value={targetEmployee.maNhanVien}
                onChange={(e) => setSelectedCode(e.target.value)}
                aria-label="Chọn nhân viên để xem hồ sơ"
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {employees.map((emp) => (
                  <option key={emp.maNhanVien} value={emp.maNhanVien}>
                    {emp.maNhanVien} — {emp.tenNhanVien} ({emp.chucVu})
                  </option>
                ))}
              </select>
            </div>
          )}

          {isViewingSelf && !isEditing && (
            <button
              type="button"
              onClick={() => {
                setCpNotice(null);
                setShowPasswordModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition whitespace-nowrap shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Đổi mật khẩu
            </button>
          )}

          {canEditTarget && !isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm transition whitespace-nowrap shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Chỉnh Sửa Hồ Sơ
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{saveSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess('')}
            className="text-emerald-700 dark:text-emerald-300 hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Profile Form Wrapper */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Identity Summary Band */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
              {activeData.anhDaiDien && !avatarError ? (
                <img
                  src={activeData.anhDaiDien}
                  alt={activeData.tenNhanVien}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl font-extrabold text-cyan-700 dark:text-cyan-400 shrink-0">
                  {getInitials(activeData.tenNhanVien)}
                </div>
              )}

              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400">
                    {activeData.maNhanVien}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {activeData.chucVu}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeData.phongBan || 'Kỹ Thuật & Bảo Trì (O&M)'}</span>
                  {activeData.loaiHopDong && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>HĐ {activeData.loaiHopDong}</span>
                    </>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                  {activeData.tenNhanVien}
                </h2>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {activeData.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {activeData.email}
                    </span>
                  )}
                  {activeData.soDienThoai && (
                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {activeData.soDienThoai}
                    </span>
                  )}
                  {activeData.queQuan && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Quê quán: {activeData.queQuan}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition whitespace-nowrap"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" />
                  Lưu Hồ Sơ
                </button>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
              <CameraCaptureInput
                label="Cập Nhật Ảnh Đại Diện (Chụp Trực Tiếp / Tải Lên / URL)"
                value={form.anhDaiDien || ''}
                onChange={(url) => {
                  setAvatarError(false);
                  setForm((prev) => ({ ...prev, anhDaiDien: url }));
                }}
                previewShape="square"
                compact
              />
            </div>
          )}
        </section>

        {/* 4-Column Key Tenure & Annual Leave Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Ngày Vào Làm</span>
              <CalendarDays className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {activeData.ngayVao ? formatDateVN(activeData.ngayVao) : 'Chưa cập nhật'}
            </div>
            <div className="text-xs font-medium text-cyan-700 dark:text-cyan-400">
              Thâm niên: {tenureText}
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Phép Năm Được Cấp</span>
              <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {totalLeaveDays} ngày / năm
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Theo quy định năm {new Date().getFullYear()}
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Số Ngày Phép Đã Nghỉ</span>
              <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {usedLeaveDays} ngày
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-1">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${leaveUsagePct}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Phép Năm Còn Lại</span>
              <CheckCircle2
                className={`w-4 h-4 ${
                  remainingLeaveDays === 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : remainingLeaveDays <= 3
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              />
            </div>
            <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {remainingLeaveDays} ngày
            </div>
            <div
              className={`text-xs font-semibold ${
                remainingLeaveDays === 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : remainingLeaveDays <= 3
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {remainingLeaveDays === 0
                ? 'Đã sử dụng hết phép năm'
                : remainingLeaveDays <= 3
                ? 'Sắp hết quỹ phép năm'
                : 'Còn quỹ phép sử dụng'}
            </div>
          </div>
        </section>

        {/* Section 01 & Section 02 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 01. Personal Information */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                01. Thông Tin Cá Nhân
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Họ tên, ngày tháng năm sinh, quê quán và giấy tờ tùy thân
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Họ và Tên *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={form.tenNhanVien}
                    onChange={(e) => setForm({ ...form, tenNhanVien: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeData.tenNhanVien}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ngày Tháng Năm Sinh
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={form.ngaySinh || ''}
                    onChange={(e) => setForm({ ...form, ngaySinh: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {activeData.ngaySinh ? (
                      <>
                        {formatDateVN(activeData.ngaySinh)}
                        {age !== null && (
                          <span className="font-sans text-xs font-normal text-slate-500 dark:text-slate-400 ml-1.5">
                            ({age} tuổi)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="font-sans text-slate-400 font-normal">Chưa cập nhật</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Giới Tính
                </label>
                {isEditing ? (
                  <select
                    value={form.gioiTinh || 'Nam'}
                    onChange={(e) =>
                      setForm({ ...form, gioiTinh: e.target.value as Employee['gioiTinh'] })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                ) : (
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeData.gioiTinh || 'Chưa cập nhật'}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Tình Trạng Hôn Nhân
                </label>
                {isEditing ? (
                  <select
                    value={form.tinhTrangHonNhan || 'Độc thân'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tinhTrangHonNhan: e.target.value as Employee['tinhTrangHonNhan'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="Độc thân">Độc thân</option>
                    <option value="Đã kết hôn">Đã kết hôn</option>
                    <option value="Khác">Khác</option>
                  </select>
                ) : (
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeData.tinhTrangHonNhan || 'Chưa cập nhật'}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Quê Quán
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.queQuan || ''}
                    onChange={(e) => setForm({ ...form, queQuan: e.target.value })}
                    placeholder="VD: Bến Tre / Nghệ An / Hà Nội..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeData.queQuan || (
                      <span className="text-slate-400 font-normal">Chưa cập nhật</span>
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Địa Chỉ Hiện Tại / Thường Trú
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.diaChiThuongTru || ''}
                    onChange={(e) => setForm({ ...form, diaChiThuongTru: e.target.value })}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeData.diaChiThuongTru || (
                      <span className="text-slate-400 font-normal">Chưa cập nhật</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Số CCCD / CMND
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.soCCCD || ''}
                    onChange={(e) => setForm({ ...form, soCCCD: e.target.value })}
                    placeholder="12 chữ số CCCD"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {activeData.soCCCD || (
                      <span className="font-sans text-slate-400 font-normal">Chưa cập nhật</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ngày Cấp CCCD
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={form.ngayCapCCCD || ''}
                    onChange={(e) => setForm({ ...form, ngayCapCCCD: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {activeData.ngayCapCCCD ? (
                      formatDateVN(activeData.ngayCapCCCD)
                    ) : (
                      <span className="font-sans text-slate-400 font-normal">Chưa cập nhật</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nơi Cấp CCCD
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.noiCapCCCD || ''}
                    onChange={(e) => setForm({ ...form, noiCapCCCD: e.target.value })}
                    placeholder="Cục Cảnh sát QLHC về TTXH"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeData.noiCapCCCD || (
                      <span className="text-slate-400 font-normal">Chưa cập nhật</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Trình Độ Học Vấn / Bằng Cấp
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.trinhDoHocVan || ''}
                    onChange={(e) => setForm({ ...form, trinhDoHocVan: e.target.value })}
                    placeholder="VD: Kỹ sư Cơ điện tử / Cao đẳng Điện"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeData.trinhDoHocVan || (
                      <span className="text-slate-400 font-normal">Chưa cập nhật</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 02. Employment & Annual Leave Quota */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  02. Công Việc & Chế Độ Nghỉ Phép
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ngày vào làm, thâm niên, ca làm việc và quỹ ngày nghỉ phép năm
                </p>
              </div>
              {!adminMode && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  Admin quản lý định mức
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Mã Nhân Viên
                </label>
                <div className="text-sm font-bold font-mono text-cyan-700 dark:text-cyan-400">
                  {activeData.maNhanVien}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Chức Vụ / Vai Trò
                </label>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {activeData.chucVu}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Phòng Ban / Bộ Phận
                </label>
                {isEditing && adminMode ? (
                  <input
                    type="text"
                    value={form.phongBan || ''}
                    onChange={(e) => setForm({ ...form, phongBan: e.target.value })}
                    placeholder="Kỹ Thuật & Bảo Trì (O&M)"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeData.phongBan || 'Kỹ Thuật & Bảo Trì (O&M)'}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ngày Vào Làm
                </label>
                {isEditing && adminMode ? (
                  <input
                    type="date"
                    value={form.ngayVao || ''}
                    onChange={(e) => setForm({ ...form, ngayVao: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {activeData.ngayVao ? formatDateVN(activeData.ngayVao) : 'Chưa cập nhật'}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Loại Hợp Đồng
                </label>
                {isEditing && adminMode ? (
                  <select
                    value={form.loaiHopDong || 'Chính thức'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        loaiHopDong: e.target.value as Employee['loaiHopDong'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="Chính thức">Chính thức</option>
                    <option value="Quản lý">Quản lý</option>
                    <option value="Thử việc">Thử việc</option>
                    <option value="Thời vụ">Thời vụ</option>
                  </select>
                ) : (
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeData.loaiHopDong || 'Chính thức'}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ca Làm Việc Chính
                </label>
                {isEditing && adminMode ? (
                  <input
                    type="text"
                    value={form.caLamViec || ''}
                    onChange={(e) => setForm({ ...form, caLamViec: e.target.value })}
                    placeholder="VD: Hành chính (08:00 - 17:00)"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeData.caLamViec || 'Hành chính (08:00 - 17:00)'}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Tổng Số Ngày Nghỉ Phép Trong Năm
                </label>
                {isEditing && adminMode ? (
                  <input
                    type="number"
                    min={0}
                    max={365}
                    step={0.5}
                    value={form.ngayNghiPhepNam ?? 12}
                    onChange={(e) =>
                      setForm({ ...form, ngayNghiPhepNam: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {totalLeaveDays} ngày
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Số Ngày Phép Đã Sử Dụng
                </label>
                {isEditing && adminMode ? (
                  <input
                    type="number"
                    min={0}
                    max={365}
                    step={0.5}
                    value={form.ngayNghiPhepDaDung ?? 0}
                    onChange={(e) =>
                      setForm({ ...form, ngayNghiPhepDaDung: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {usedLeaveDays} ngày{' '}
                    <span className="font-sans font-normal text-xs text-emerald-700 dark:text-emerald-400">
                      (Còn lại {remainingLeaveDays} ngày)
                    </span>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Chuyên Môn & Chứng Chỉ Kỹ Thuật
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.chuyenMon || ''}
                    onChange={(e) => setForm({ ...form, chuyenMon: e.target.value })}
                    placeholder="VD: Chiller · Điện công nghiệp · An toàn điện"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeData.chuyenMon || (
                      <span className="text-slate-400 font-normal">Chưa cập nhật</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* 03. Contact & Emergency Contact */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              03. Thông Tin Liên Hệ & Người Thân Khẩn Cấp
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Số điện thoại, email đồng bộ hệ thống và thông tin liên lạc khi có sự cố
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Số Điện Thoại Cá Nhân
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.soDienThoai || ''}
                  onChange={(e) => setForm({ ...form, soDienThoai: e.target.value })}
                  placeholder="0908 xxx xxx"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              ) : (
                <div className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {activeData.soDienThoai || (
                    <span className="font-sans text-slate-400 font-normal">Chưa cập nhật</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Email Công Việc / Cloud
              </label>
              {isEditing && adminMode ? (
                <input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              ) : (
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {activeData.email || (
                    <span className="text-slate-400 font-normal">Chưa cập nhật</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Người Liên Hệ Khẩn Cấp
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.nguoiLienHeKhanCap || ''}
                  onChange={(e) => setForm({ ...form, nguoiLienHeKhanCap: e.target.value })}
                  placeholder="Họ tên & mối quan hệ (VD: Nguyễn Thị B - Vợ)"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              ) : (
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {activeData.nguoiLienHeKhanCap || (
                    <span className="text-slate-400 font-normal">Chưa cập nhật</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                SĐT Liên Hệ Khẩn Cấp
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.sdtKhanCap || ''}
                  onChange={(e) => setForm({ ...form, sdtKhanCap: e.target.value })}
                  placeholder="09xx xxx xxx"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              ) : (
                <div className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {activeData.sdtKhanCap || (
                    <span className="font-sans text-slate-400 font-normal">Chưa cập nhật</span>
                  )}
                </div>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Ghi Chú Hồ Sơ & Kinh Nghiệm
              </label>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={form.ghiChuHoSo || ''}
                  onChange={(e) => setForm({ ...form, ghiChuHoSo: e.target.value })}
                  placeholder="Thông tin bổ sung về chứng chỉ an toàn, kinh nghiệm vận hành thiết bị..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              ) : (
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeData.ghiChuHoSo || (
                    <span className="text-slate-400">Chưa có ghi chú bổ sung.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition"
              >
                <Save className="w-3.5 h-3.5" />
                Lưu Thay Đổi Hồ Sơ
              </button>
            </div>
          )}
        </section>
      </form>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          onClick={() => setShowPasswordModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Đổi Mật Khẩu Đăng Nhập Nội Bộ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cpNotice && (
              <div
                className={`p-3 rounded-xl border text-xs font-medium ${
                  cpNotice.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                }`}
              >
                {cpNotice.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu hiện tại *
                </label>
                <input
                  type="password"
                  required
                  value={cpCurrent}
                  onChange={(e) => setCpCurrent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu mới (tối thiểu 4 ký tự) *
                </label>
                <input
                  type="password"
                  required
                  value={cpNew}
                  onChange={(e) => setCpNew(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Xác nhận mật khẩu mới *
                </label>
                <input
                  type="password"
                  required
                  value={cpConfirm}
                  onChange={(e) => setCpConfirm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Cập Nhật Mật Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
