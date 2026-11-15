import React, { useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { APP_VIEW_OPTIONS, Employee, UserRole } from '../../types/cmms';
import { ADMIN_ONLY_VIEWS, getEffectiveAllowedViews } from '../../utils/cmmsLogic';
import { CameraCaptureInput } from '../common/CameraCaptureInput';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  ShieldCheck,
  Plus,
  CheckCircle2,
  Search,
  Eye,
  EyeOff,
  Edit,
  X,
  LayoutGrid,
} from 'lucide-react';

export const EmployeesTab: React.FC = () => {
  const { employees, currentUser, addEmployee, updateEmployee } = useCMMS();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: string]: boolean }>({});

  // New employee state
  const [maNhanVien, setMaNhanVien] = useState('');
  const [tenNhanVien, setTenNhanVien] = useState('');
  const [chucVu, setChucVu] = useState<UserRole>('Kỹ thuật viên');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [ngayVao, setNgayVao] = useState('2026-11-10');
  const [anhDaiDien, setAnhDaiDien] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  );
  const [newAllowedViews, setNewAllowedViews] = useState<string[]>(
    APP_VIEW_OPTIONS.filter(
      (v) => !['employees', 'logs', 'email_alerts', ...(ADMIN_ONLY_VIEWS as readonly string[])].includes(v.id)
    ).map((v) => v.id)
  );

  // Edit employee state
  const [editPassword, setEditPassword] = useState('');
  const [editChucVu, setEditChucVu] = useState<UserRole>('Kỹ thuật viên');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAnhDaiDien, setEditAnhDaiDien] = useState('');
  const [editRules, setEditRules] = useState<string[]>([]);
  const [editAllowedViews, setEditAllowedViews] = useState<string[]>([]);

  const filtered = employees.filter(
    (e) =>
      e.maNhanVien.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tenNhanVien.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.chucVu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePasswordVisibility = (maNV: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [maNV]: !prev[maNV],
    }));
  };

  const isAdminRole = (role: UserRole, empCode?: string) =>
    role === 'Owner' ||
    role === 'Admin' ||
    role === 'Quản trị viên' ||
    empCode?.trim().toUpperCase() === 'ID1460';

  const getDefaultViewsForRole = (role: UserRole, empCode?: string): string[] => {
    if (isAdminRole(role, empCode)) {
      return APP_VIEW_OPTIONS.map((v) => v.id);
    }
    if (
      role === 'Người quản lý' ||
      role === 'Kỹ sư thiết bị' ||
      role === 'Trưởng phòng Kỹ thuật'
    ) {
      return APP_VIEW_OPTIONS.filter(
        (v) =>
          (role === 'Người quản lý' || v.id !== 'employees') &&
          !(ADMIN_ONLY_VIEWS as readonly string[]).includes(v.id)
      ).map((v) => v.id);
    }
    return [
      'dashboard',
      'my_tasks',
      'equipment',
      'maintenance',
      'tickets',
      'projects',
      'spare_parts',
      'documents',
      'energy',
    ];
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditPassword(emp.password || '123456');
    setEditChucVu(emp.chucVu);
    setEditPhone(emp.soDienThoai);
    setEditEmail(emp.email);
    setEditAnhDaiDien(emp.anhDaiDien || '');
    setEditRules(emp.quyenHan || ['VIEW_EQUIPMENT', 'EXECUTE_PLANS', 'PROCESS_TICKETS']);
    setEditAllowedViews(getEffectiveAllowedViews(emp));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const allowAdminViews = isAdminRole(editChucVu, editingEmployee.maNhanVien);
    const sanitizedViews = allowAdminViews
      ? editAllowedViews
      : editAllowedViews.filter((id) => !(ADMIN_ONLY_VIEWS as readonly string[]).includes(id));

    updateEmployee({
      ...editingEmployee,
      chucVu: editChucVu,
      soDienThoai: editPhone,
      email: editEmail,
      password: editPassword,
      anhDaiDien: editAnhDaiDien || editingEmployee.anhDaiDien,
      quyenHan: editRules,
      allowedViews: sanitizedViews.length > 0 ? sanitizedViews : ['dashboard'],
    });

    setEditingEmployee(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maNhanVien.trim() || !tenNhanVien.trim()) return;

    const defaultRules =
      chucVu === 'Admin' || chucVu === 'Owner'
        ? ['ALL', 'SYSTEM_ADMIN', 'MANAGE_EQUIPMENT', 'MANAGE_PLANS', 'MANAGE_TICKETS', 'MANAGE_SPARE_PARTS', 'MANAGE_EMPLOYEES']
        : chucVu === 'Người quản lý'
        ? ['MANAGE_EQUIPMENT', 'MANAGE_PLANS', 'MANAGE_HISTORY', 'MANAGE_TICKETS', 'MANAGE_SPARE_PARTS', 'MANAGE_WAREHOUSE', 'MANAGE_ENERGY', 'MANAGE_COSTS', 'MANAGE_EMPLOYEES', 'EXPORT_DATA', 'APPROVE_MAINTENANCE']
        : chucVu === 'Kỹ sư thiết bị'
        ? ['MANAGE_EQUIPMENT', 'MANAGE_PLANS', 'MANAGE_TICKETS', 'MANAGE_SPARE_PARTS', 'EXPORT_DATA']
        : ['VIEW_EQUIPMENT', 'EXECUTE_PLANS', 'PROCESS_TICKETS', 'REQUEST_SPARE_PARTS'];

    const allowAdminViews = isAdminRole(chucVu, maNhanVien);
    const sanitizedNewViews = allowAdminViews
      ? newAllowedViews
      : newAllowedViews.filter((id) => !(ADMIN_ONLY_VIEWS as readonly string[]).includes(id));

    addEmployee({
      maNhanVien: maNhanVien.trim().toUpperCase(),
      tenNhanVien: tenNhanVien.trim(),
      date: '2026-11-10',
      chucVu,
      ngayVao,
      soDienThoai,
      email,
      username: maNhanVien.trim().toUpperCase(),
      password: password || '123456',
      quyenHan: defaultRules,
      allowedViews: sanitizedNewViews.length > 0 ? sanitizedNewViews : ['dashboard'],
      anhDaiDien:
        anhDaiDien ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    });

    setMaNhanVien('');
    setTenNhanVien('');
    setSoDienThoai('');
    setEmail('');
    setPassword('123456');
    setAnhDaiDien(
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    );
    setShowAddModal(false);
  };

  const toggleViewPermission = (list: string[], setList: (next: string[]) => void, viewId: string) => {
    if (list.includes(viewId)) {
      if (list.length <= 1) return; // keep at least 1 view
      setList(list.filter((v) => v !== viewId));
    } else {
      setList([...list, viewId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {UI_TEXTS.tabs.employees.badge}
            </span>
            <span className="text-xs text-slate-400">({employees.length} cán bộ kỹ thuật)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
            {UI_TEXTS.tabs.employees.title}
          </h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-900/30 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Thêm Nhân Viên
        </button>
      </div>

      {/* Active User Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={
                currentUser.anhDaiDien ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
              }
              alt={currentUser.tenNhanVien}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-400 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Tài Khoản Đang Đăng Nhập:</span>
              <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                {currentUser.maNhanVien}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-100">{currentUser.tenNhanVien}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-300 font-semibold">{currentUser.chucVu}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {getEffectiveAllowedViews(currentUser).length}/{APP_VIEW_OPTIONS.length} phân hệ hiển thị
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-300 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-slate-100 block">Quyền Hạn Hiện Tại (Rules Active):</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {(currentUser.quyenHan || ['ALL']).slice(0, 4).map((r) => (
                <span key={r} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-400 border border-slate-700 font-mono">
                  {r}
                </span>
              ))}
              {(currentUser.quyenHan?.length || 0) > 4 && (
                <span className="text-[10px] text-slate-400">+{(currentUser.quyenHan?.length || 0) - 4} quyền khác</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Matrix Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            Owner / Admin (ID1460)
          </div>
          <p className="text-[11px] text-slate-400">
            Toàn quyền hệ thống, sao lưu & khôi phục dữ liệu (Backup), phân quyền view cho từng nhân sự.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            Kỹ Sư Thiết Bị
          </div>
          <p className="text-[11px] text-slate-400">
            Giao việc thiết bị, lập kế hoạch bảo trì, tiếp nhận báo cáo hoàn thành qua email, quản lý kho & năng lượng.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            Kỹ Thuật Viên / Vận Hành
          </div>
          <p className="text-[11px] text-slate-400">
            Thực hiện bảo trì, chụp ảnh trước/sau, xử lý sự cố và chỉ nhìn thấy các view được Admin/Owner cấp phép.
          </p>
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã NV, tên, email, vai trò..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <span className="text-xs text-slate-400">Danh sách nhân sự & phân quyền giao diện</span>
        </div>

        <SmartHorizontalScroll>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Mã NV</th>
                <th className="py-3 px-4">Họ Và Tên</th>
                <th className="py-3 px-4">Chức Vụ</th>
                <th className="py-3 px-4">Mật Khẩu</th>
                <th className="py-3 px-4">View Được Phép Xem</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filtered.map((emp) => {
                const isActive = currentUser.maNhanVien === emp.maNhanVien;
                const isPassVisible = visiblePasswords[emp.maNhanVien];
                const empPass = emp.password || '123456';
                const effectiveViews = getEffectiveAllowedViews(emp);

                return (
                  <tr
                    key={emp.maNhanVien}
                    className={`hover:bg-slate-800/40 transition ${isActive ? 'bg-indigo-950/20' : ''}`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400 whitespace-nowrap">
                      {emp.maNhanVien}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            emp.anhDaiDien ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                          }
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <span>{emp.tenNhanVien}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          emp.chucVu === 'Owner' || emp.chucVu === 'Admin' || emp.chucVu === 'Quản trị viên'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : emp.chucVu === 'Người quản lý'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : emp.chucVu === 'Kỹ sư thiết bị' || emp.chucVu === 'Trưởng phòng Kỹ thuật'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {emp.chucVu}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-slate-300">
                        <span>{isPassVisible ? empPass : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(emp.maNhanVien)}
                          className="p-1 text-slate-500 hover:text-slate-300 transition"
                          title={isPassVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono text-[10px] font-bold">
                          <LayoutGrid className="w-3 h-3" />
                          {effectiveViews.length}/{APP_VIEW_OPTIONS.length} views
                        </span>
                        {effectiveViews.slice(0, 2).map((vId) => {
                          const label = APP_VIEW_OPTIONS.find((o) => o.id === vId)?.label || vId;
                          return (
                            <span
                              key={vId}
                              className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700"
                            >
                              {label}
                            </span>
                          );
                        })}
                        {effectiveViews.length > 2 && (
                          <span className="text-[10px] text-slate-400">+{effectiveViews.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{emp.email}</td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          title="Sửa thông tin, ảnh & Phân quyền View"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 text-xs font-semibold"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Sửa / Quyền View
                        </button>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đang dùng
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SmartHorizontalScroll>
      </div>

      {/* Edit Employee / Rules & View Permissions Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Cập Nhật Tài Khoản & Phân Quyền View: {editingEmployee.tenNhanVien}
                </h3>
                <span className="font-mono text-xs text-indigo-400">{editingEmployee.maNhanVien}</span>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <CameraCaptureInput
                label="Ảnh Đại Diện Nhân Viên (Chụp Trực Tiếp / URL)"
                value={editAnhDaiDien}
                onChange={setEditAnhDaiDien}
                previewShape="square"
                compact
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Chức Vụ</label>
                  <select
                    value={editChucVu}
                    onChange={(e) => {
                      const nextRole = e.target.value as UserRole;
                      setEditChucVu(nextRole);
                      if (!isAdminRole(nextRole, editingEmployee.maNhanVien)) {
                        setEditAllowedViews((prev) =>
                          prev.filter((id) => !(ADMIN_ONLY_VIEWS as readonly string[]).includes(id))
                        );
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Owner">Owner (Chủ hệ thống)</option>
                    <option value="Admin">Admin (Toàn quyền)</option>
                    <option value="Người quản lý">Người quản lý</option>
                    <option value="Kỹ sư thiết bị">Kỹ sư thiết bị</option>
                    <option value="Kỹ thuật viên">Kỹ thuật viên</option>
                    <option value="Nhân viên vận hành">Nhân viên vận hành</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Mật khẩu mới</label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Optional User View Permissions */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Phân Quyền Giao Diện (View Permissions - Tùy Chọn)
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        const allowAdmin = isAdminRole(editChucVu, editingEmployee.maNhanVien);
                        setEditAllowedViews(
                          APP_VIEW_OPTIONS.filter(
                            (v) => allowAdmin || !(ADMIN_ONLY_VIEWS as readonly string[]).includes(v.id)
                          ).map((v) => v.id)
                        );
                      }}
                      className="text-cyan-400 hover:underline font-semibold"
                    >
                      Chọn Tất Cả
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditAllowedViews(getDefaultViewsForRole(editChucVu, editingEmployee.maNhanVien))
                      }
                      className="text-indigo-400 hover:underline font-semibold"
                    >
                      Mặc Định Theo Vai Trò
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {APP_VIEW_OPTIONS.map((v) => {
                    const isAdminOnly = (ADMIN_ONLY_VIEWS as readonly string[]).includes(v.id);
                    const lockedForRole =
                      isAdminOnly && !isAdminRole(editChucVu, editingEmployee.maNhanVien);
                    const checked = !lockedForRole && editAllowedViews.includes(v.id);
                    return (
                      <label
                        key={v.id}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition ${
                          lockedForRole
                            ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                            : checked
                            ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-200 font-semibold cursor-pointer'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={lockedForRole}
                            onChange={() =>
                              toggleViewPermission(editAllowedViews, setEditAllowedViews, v.id)
                            }
                            className="rounded text-cyan-600 focus:ring-0 disabled:opacity-40"
                          />
                          <span className="truncate">{v.label}</span>
                        </div>
                        {isAdminOnly && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                            Admin
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Quyền Hạn Thao Tác (Rules)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    'ALL',
                    'MANAGE_EQUIPMENT',
                    'MANAGE_PLANS',
                    'MANAGE_TICKETS',
                    'MANAGE_SPARE_PARTS',
                    'MANAGE_WAREHOUSE',
                    'MANAGE_ENERGY',
                    'MANAGE_COSTS',
                    'MANAGE_EMPLOYEES',
                    'EXECUTE_PLANS',
                    'PROCESS_TICKETS',
                    'REQUEST_SPARE_PARTS',
                  ].map((rule) => {
                    const isChecked = editRules.includes(rule);
                    return (
                      <label
                        key={rule}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                          isChecked
                            ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditRules([...editRules, rule]);
                            } else {
                              setEditRules(editRules.filter((r) => r !== rule));
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span className="font-mono text-[10px] truncate">{rule}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Thêm Nhân Sự Bộ Phận Kỹ Thuật</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <CameraCaptureInput
                label="Ảnh Đại Diện Nhân Viên Mới (Chụp Trực Tiếp / URL)"
                value={anhDaiDien}
                onChange={setAnhDaiDien}
                previewShape="square"
                compact
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Mã NV / Username *</label>
                  <input
                    type="text"
                    value={maNhanVien}
                    onChange={(e) => setMaNhanVien(e.target.value)}
                    placeholder="VD: ID1801"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Họ Và Tên *</label>
                  <input
                    type="text"
                    value={tenNhanVien}
                    onChange={(e) => setTenNhanVien(e.target.value)}
                    placeholder="VD: Trần Văn Bình"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Mật khẩu ban đầu</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu ban đầu..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Chức Vụ</label>
                  <select
                    value={chucVu}
                    onChange={(e) => {
                      const nextRole = e.target.value as UserRole;
                      setChucVu(nextRole);
                      setNewAllowedViews(getDefaultViewsForRole(nextRole));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Admin">Admin</option>
                    <option value="Người quản lý">Người quản lý</option>
                    <option value="Kỹ sư thiết bị">Kỹ sư thiết bị</option>
                    <option value="Kỹ thuật viên">Kỹ thuật viên</option>
                    <option value="Nhân viên vận hành">Nhân viên vận hành</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={soDienThoai}
                    onChange={(e) => setSoDienThoai(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Ngày Vào Làm</label>
                  <input
                    type="date"
                    value={ngayVao}
                    onChange={(e) => setNgayVao(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="binh.tran@factory.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Optional User View Permissions */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Phân Quyền View Tùy Chọn
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const allowAdmin = isAdminRole(chucVu, maNhanVien);
                      setNewAllowedViews(
                        APP_VIEW_OPTIONS.filter(
                          (v) => allowAdmin || !(ADMIN_ONLY_VIEWS as readonly string[]).includes(v.id)
                        ).map((v) => v.id)
                      );
                    }}
                    className="text-[11px] text-cyan-400 hover:underline font-semibold"
                  >
                    Chọn Tất Cả
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {APP_VIEW_OPTIONS.map((v) => {
                    const isAdminOnly = (ADMIN_ONLY_VIEWS as readonly string[]).includes(v.id);
                    const lockedForRole = isAdminOnly && !isAdminRole(chucVu, maNhanVien);
                    const checked = !lockedForRole && newAllowedViews.includes(v.id);
                    return (
                      <label
                        key={v.id}
                        className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border transition ${
                          lockedForRole
                            ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                            : checked
                            ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-200 font-semibold cursor-pointer'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={lockedForRole}
                            onChange={() => toggleViewPermission(newAllowedViews, setNewAllowedViews, v.id)}
                            className="rounded text-cyan-600 focus:ring-0 disabled:opacity-40"
                          />
                          <span className="truncate text-[11px]">{v.label}</span>
                        </div>
                        {isAdminOnly && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                            Admin
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Lưu Nhân Viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
