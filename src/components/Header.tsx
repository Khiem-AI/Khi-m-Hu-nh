import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useCMMS } from '../context/CMMSContext';
import { UI_TEXTS } from '../config/uiTexts';
import { canAccessBackup, getInspectionStatus, getInspectionDaysRemaining } from '../utils/cmmsLogic';
import {
  Wrench,
  QrCode,
  Bell,
  Download,
  RotateCcw,
  BadgeCheck,
  ChevronDown,
  Menu,
  X,
  AlertTriangle,
  Clock,
  Package,
  Sun,
  Moon,
  Lock,
  Key,
  LogIn,
  LogOut,
  CheckCircle2,
  Eye,
  EyeOff,
  Database,
  KeyRound,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  onOpenScanner: () => void;
  onOpenBackup: () => void;
  onToggleMobileNav: () => void;
  isMobileNavOpen: boolean;
  onNavigateTab: (tabId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenScanner,
  onOpenBackup,
  onToggleMobileNav,
  isMobileNavOpen,
  onNavigateTab,
}) => {
  const {
    currentUser,
    maintenancePlans,
    spareParts,
    tickets,
    safetyInspections,
    exportDatabaseJSON,
    resetToDefaultData,
    theme,
    toggleTheme,
    login,
    changePassword,
    logout,
    cloudSyncStatus,
    cloudUser,
    cloudSyncError,
    lastSyncedAt,
    connectCloudWithGoogle,
    forceSyncLocalToCloud,
  } = useCMMS();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCloudPopover, setShowCloudPopover] = useState(false);
  const [isCloudActionLoading, setIsCloudActionLoading] = useState(false);
  const [cloudActionNotice, setCloudActionNotice] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalTab, setModalTab] = useState<'login' | 'change_password'>('login');

  // Login form state
  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccessMessage, setLoginSuccessMessage] = useState('');

  // Change password form state
  const [cpCurrentPass, setCpCurrentPass] = useState('');
  const [cpNewPass, setCpNewPass] = useState('');
  const [cpConfirmPass, setCpConfirmPass] = useState('');

  const hasBackupAccess = canAccessBackup(currentUser);

  // Urgent alerts
  const overduePlans = maintenancePlans.filter((p) => p.trangThai === 'Quá hạn');
  const dueInspections = safetyInspections
    .map((item) => ({
      item,
      status: getInspectionStatus(
        item.ngayHetHan,
        item.nhacTruocNgay,
        item.trangThai === 'Đang kiểm định'
      ),
      daysRemaining: getInspectionDaysRemaining(item.ngayHetHan),
    }))
    .filter((entry) => entry.status === 'Quá hạn' || entry.status === 'Sắp đến hạn');
  const lowStockParts = spareParts.filter((p) => p.tonThucTe <= p.tonToiThieu);
  const urgentTickets = tickets.filter(
    (t) => t.mucDoUuTien === 'Khẩn cấp' && t.trangThai !== 'Hoàn thành' && t.trangThai !== 'Hủy'
  );

  const totalAlerts =
    overduePlans.length + dueInspections.length + lowStockParts.length + urgentTickets.length;

  const handleLoginFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccessMessage('');

    if (!inputUsername.trim()) {
      setLoginError('Vui lòng nhập mã nhân viên hoặc tên đăng nhập!');
      return;
    }

    const res = login(inputUsername.trim(), inputPassword.trim());
    if (res.success) {
      setLoginSuccessMessage('Đăng nhập thành công!');
      setTimeout(() => {
        setShowLoginModal(false);
        setInputUsername('');
        setInputPassword('');
        setLoginSuccessMessage('');
      }, 650);
    } else {
      setLoginError(res.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccessMessage('');

    if (!cpCurrentPass.trim() || !cpNewPass.trim() || !cpConfirmPass.trim()) {
      setLoginError('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới!');
      return;
    }
    if (cpNewPass.trim() !== cpConfirmPass.trim()) {
      setLoginError('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }
    if (cpNewPass.trim() === cpCurrentPass.trim()) {
      setLoginError('Mật khẩu mới phải khác mật khẩu hiện tại!');
      return;
    }

    const res = changePassword(currentUser.maNhanVien, cpCurrentPass, cpNewPass);
    if (res.success) {
      setLoginSuccessMessage(res.message);
      setCpCurrentPass('');
      setCpNewPass('');
      setCpConfirmPass('');
    } else {
      setLoginError(res.message);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md transition-colors shadow-xs">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6 gap-4">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleMobileNav}
            aria-label="Mở menu điều hướng"
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => onNavigateTab('dashboard')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition shrink-0">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-slate-100 text-sm sm:text-base lg:text-lg truncate">
                  {UI_TEXTS.brand.appName}
                </span>
              </div>
              {UI_TEXTS.brand.subtitle && (
                <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {UI_TEXTS.brand.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick actions, Theme Toggle, Notifications, User Auth */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            title={theme === 'dark' ? 'Chuyển sang nền Sáng' : 'Chuyển sang nền Tối'}
            className="h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition whitespace-nowrap shrink-0"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline text-amber-300 font-semibold text-xs">Nền Sáng</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden md:inline text-indigo-700 font-semibold text-xs">Nền Tối</span>
              </>
            )}
          </button>

          {/* Quick QR Scanner Button */}
          <button
            onClick={onOpenScanner}
            className="h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition whitespace-nowrap shrink-0"
            title="Quét mã QR thiết bị hiện trường"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden md:inline">Quét QR</span>
          </button>

          {/* Backup / Restore Button - Strictly restricted to ID1460 or Owner */}
          {hasBackupAccess && (
            <button
              onClick={onOpenBackup}
              className="h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40 text-xs font-semibold transition whitespace-nowrap shrink-0"
              title="Trung tâm sao lưu dữ liệu (Chỉ ID1460 / Owner)"
            >
              <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden lg:inline">Sao Lưu</span>
            </button>
          )}

          {/* Cloud Real-Time Sync Status Button & Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowCloudPopover(!showCloudPopover);
                setShowNotifications(false);
                setShowUserDropdown(false);
                setCloudActionNotice(null);
              }}
              title={
                cloudSyncStatus === 'synced'
                  ? `Đã đồng bộ Cloud (${cloudUser?.email || ''})`
                  : cloudSyncStatus === 'syncing' || cloudSyncStatus === 'connecting'
                  ? 'Đang đồng bộ dữ liệu Cloud...'
                  : cloudSyncStatus === 'error'
                  ? 'Lỗi đồng bộ Cloud — nhấn để xem chi tiết'
                  : 'Chế độ nội bộ — nhấn để bật đồng bộ Cloud'
              }
              className={`h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                cloudSyncStatus === 'synced'
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40'
                  : cloudSyncStatus === 'syncing' || cloudSyncStatus === 'connecting'
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/40'
                  : cloudSyncStatus === 'error'
                  ? 'bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/40'
                  : 'bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/40'
              }`}
            >
              {cloudSyncStatus === 'synced' ? (
                <>
                  <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden xl:inline">Cloud Sync</span>
                </>
              ) : cloudSyncStatus === 'syncing' || cloudSyncStatus === 'connecting' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
                  <span className="hidden xl:inline">Đang đồng bộ...</span>
                </>
              ) : cloudSyncStatus === 'error' ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span className="hidden xl:inline">Lỗi Cloud</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="hidden xl:inline">Bật Cloud</span>
                </>
              )}
            </button>

            {showCloudPopover && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-cyan-500" />
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Đồng Bộ Đám Mây
                    </span>
                  </div>
                  <span
                    className={`font-bold text-[11px] px-2 py-0.5 rounded-lg ${
                      cloudSyncStatus === 'synced'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        : cloudSyncStatus === 'syncing' || cloudSyncStatus === 'connecting'
                        ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300'
                        : cloudSyncStatus === 'error'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                    }`}
                  >
                    {cloudSyncStatus === 'synced'
                      ? 'Trực tuyến'
                      : cloudSyncStatus === 'syncing'
                      ? 'Đang đồng bộ'
                      : cloudSyncStatus === 'connecting'
                      ? 'Đang kết nối'
                      : cloudSyncStatus === 'error'
                      ? 'Gặp lỗi'
                      : 'Chế độ nội bộ'}
                  </span>
                </div>

                {cloudUser ? (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tài khoản Google Cloud:
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {cloudUser.email}
                    </div>
                    {lastSyncedAt && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Cập nhật lúc: <span className="font-mono">{lastSyncedAt}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Hiện đang lưu dữ liệu trên trình duyệt này. Đăng nhập Google để tự động đồng bộ thời gian thực giữa mọi thiết bị và nhân sự.
                  </p>
                )}

                {cloudSyncError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 leading-relaxed">
                    {cloudSyncError}
                  </div>
                )}

                {cloudActionNotice && (
                  <div
                    className={`p-2.5 rounded-xl border leading-relaxed ${
                      cloudActionNotice.ok
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {cloudActionNotice.text}
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  {!cloudUser || cloudSyncStatus === 'offline' ? (
                    <button
                      type="button"
                      disabled={isCloudActionLoading}
                      onClick={async () => {
                        setIsCloudActionLoading(true);
                        setCloudActionNotice(null);
                        const res = await connectCloudWithGoogle();
                        setIsCloudActionLoading(false);
                        setCloudActionNotice({ ok: res.success, text: res.message });
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {isCloudActionLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Cloud className="w-4 h-4" />
                      )}
                      <span>Kết nối Google Cloud Sync</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isCloudActionLoading}
                        onClick={async () => {
                          setIsCloudActionLoading(true);
                          setCloudActionNotice(null);
                          const res = await forceSyncLocalToCloud();
                          setIsCloudActionLoading(false);
                          setCloudActionNotice({ ok: res.success, text: res.message });
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isCloudActionLoading ? 'animate-spin' : ''}`}
                        />
                        <span>Đẩy lại toàn bộ dữ liệu lên Cloud</span>
                      </button>

                      <button
                        type="button"
                        disabled={isCloudActionLoading}
                        onClick={async () => {
                          setIsCloudActionLoading(true);
                          setCloudActionNotice(null);
                          const res = await connectCloudWithGoogle();
                          setIsCloudActionLoading(false);
                          setCloudActionNotice({ ok: res.success, text: res.message });
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        <span>Đổi tài khoản Google Cloud</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserDropdown(false);
                setShowCloudPopover(false);
              }}
              aria-label="Thông báo hệ thống"
              className="relative h-9 w-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow">
                  {totalAlerts}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Cảnh Báo Vận Hành ({totalAlerts})</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Thời gian thực</span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
                  {overduePlans.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onNavigateTab('maintenance');
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 cursor-pointer flex items-start gap-2.5 transition"
                    >
                      <Clock className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      <div>
                        <strong className="block text-slate-100">{p.tenThietBi} ({p.maThietBi})</strong>
                        <span>Quá hạn bảo trì ({p.ngayBaoTriTiepTheo})</span>
                      </div>
                    </div>
                  ))}

                  {dueInspections.map(({ item, status, daysRemaining }) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onNavigateTab('inspection_calibration');
                        setShowNotifications(false);
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer flex items-start gap-2.5 transition border ${
                        status === 'Quá hạn'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                          : 'bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20'
                      }`}
                    >
                      <BadgeCheck
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          status === 'Quá hạn' ? 'text-rose-400' : 'text-orange-400'
                        }`}
                      />
                      <div>
                        <strong className="block text-slate-100">
                          {item.tenThietBi} ({item.maThietBi || item.maHoSo})
                        </strong>
                        <span>
                          {item.phanLoai} —{' '}
                          {daysRemaining < 0
                            ? `Quá hạn ${Math.abs(daysRemaining)} ngày (${item.ngayHetHan})`
                            : daysRemaining === 0
                            ? `Đến hạn hôm nay (${item.ngayHetHan})`
                            : `Còn ${daysRemaining} ngày đến hạn (${item.ngayHetHan})`}
                        </span>
                      </div>
                    </div>
                  ))}

                  {lowStockParts.map((sp) => (
                    <div
                      key={sp.maVatTu}
                      onClick={() => {
                        onNavigateTab('spare_parts');
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 cursor-pointer flex items-start gap-2.5 transition"
                    >
                      <Package className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <strong className="block text-slate-100">{sp.tenVatTu} ({sp.maVatTu})</strong>
                        <span>Tồn thực tế ({sp.tonThucTe}) ≤ Mức tối thiểu ({sp.tonToiThieu})</span>
                      </div>
                    </div>
                  ))}

                  {urgentTickets.map((t) => (
                    <div
                      key={t.maTicket}
                      onClick={() => {
                        onNavigateTab('tickets');
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 cursor-pointer flex items-start gap-2.5 transition"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
                      <div>
                        <strong className="block text-slate-100">{t.tieuDe}</strong>
                        <span>Sự cố khẩn cấp: {t.maTicket}</span>
                      </div>
                    </div>
                  ))}

                  {totalAlerts === 0 && (
                    <div className="text-center py-6 text-slate-500">
                      Tất cả thiết bị và kho phụ tùng đều ở trạng thái an toàn!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Export JSON & Reset - Strictly restricted to ID1460 or Owner */}
          {hasBackupAccess && (
            <>
              <button
                onClick={exportDatabaseJSON}
                title="Sao lưu toàn bộ dữ liệu (JSON)"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition hidden md:block"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                title="Khôi phục dữ liệu ban đầu"
                className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition hidden md:block"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Active User Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowNotifications(false);
                setShowCloudPopover(false);
              }}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition"
            >
              <img
                src={
                  currentUser.anhDaiDien ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                }
                alt=""
                className="w-7 h-7 rounded-lg object-cover border border-slate-300 dark:border-slate-700"
              />
              <div className="hidden sm:block text-left text-xs leading-tight">
                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[110px]">
                  {currentUser.tenNhanVien}
                </span>
                <span className="text-[10px] text-cyan-700 dark:text-cyan-400 block font-semibold">
                  {currentUser.chucVu} ({currentUser.maNhanVien})
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-2.5">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                  <img
                    src={
                      currentUser.anhDaiDien ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                    }
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 truncate">{currentUser.tenNhanVien}</div>
                    <div className="text-[11px] text-cyan-400 font-medium truncate">
                      {currentUser.chucVu} • {currentUser.maNhanVien}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setModalTab('change_password');
                      setLoginError('');
                      setLoginSuccessMessage('');
                      setShowLoginModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    <span>Đổi Mật Khẩu Tài Khoản</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setModalTab('login');
                      setLoginError('');
                      setLoginSuccessMessage('');
                      setShowLoginModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <Key className="w-4 h-4 text-indigo-400" />
                    <span>Đăng Nhập Tài Khoản Khác</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Đăng Xuất Hệ Thống</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACCOUNT & CHANGE PASSWORD MODAL (Portaled to body so header backdrop-blur never clips fixed positioning) */}
      {showLoginModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setShowLoginModal(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 dark:bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 my-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                    {modalTab === 'login' ? <Lock className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {modalTab === 'login' ? 'Đăng Nhập Tài Khoản Khác' : 'Đổi Mật Khẩu Tài Khoản'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Xác thực tài khoản và cập nhật bảo mật FACILITY SYSTEM MANAGEMENT
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  aria-label="Đóng cửa sổ"
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab switcher */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setModalTab('login');
                    setLoginError('');
                    setLoginSuccessMessage('');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    modalTab === 'login'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Đăng Nhập Khác
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalTab('change_password');
                    setLoginError('');
                    setLoginSuccessMessage('');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    modalTab === 'change_password'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Đổi Mật Khẩu
                </button>
              </div>

              {/* Active account banner */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      currentUser.anhDaiDien ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                    }
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover border border-indigo-400/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.tenNhanVien}
                      </span>
                      <span className="font-mono text-[10px] bg-indigo-500/20 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold shrink-0">
                        {currentUser.maNhanVien}
                      </span>
                    </div>
                    <span className="text-xs text-cyan-700 dark:text-cyan-400 font-semibold">
                      {currentUser.chucVu}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đang trực ca
                </span>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{loginSuccessMessage}</span>
                </div>
              )}

              {modalTab === 'login' ? (
                <form onSubmit={handleLoginFormSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Mã nhân viên / Tên đăng nhập *
                    </label>
                    <input
                      type="text"
                      value={inputUsername}
                      onChange={(e) => setInputUsername(e.target.value)}
                      placeholder="Nhập mã nhân viên hoặc email..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Mật khẩu *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={inputPassword}
                        onChange={(e) => setInputPassword(e.target.value)}
                        placeholder="Nhập mật khẩu..."
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-900/20 transition flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Đăng Nhập Tài Khoản
                  </button>
                </form>
              ) : (
                <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Mật khẩu hiện tại *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={cpCurrentPass}
                      onChange={(e) => setCpCurrentPass(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại..."
                      required
                      autoFocus
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Mật khẩu mới (tối thiểu 4 ký tự) *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={cpNewPass}
                      onChange={(e) => setCpNewPass(e.target.value)}
                      placeholder="Nhập mật khẩu mới..."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Xác nhận mật khẩu mới *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={cpConfirmPass}
                      onChange={(e) => setCpConfirmPass(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới..."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-600"
                    />
                    <span>Hiển thị mật khẩu</span>
                  </label>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    Xác Nhận Đổi Mật Khẩu
                  </button>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* RESET DATA CONFIRMATION MODAL */}
      {showResetConfirm &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setShowResetConfirm(false)}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Đặt lại dữ liệu mẫu ban đầu?
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Thao tác này sẽ đưa toàn bộ dữ liệu trên trình duyệt về trạng thái mẫu ban đầu của hệ thống. Hãy chắc chắn bạn đã xuất file sao lưu JSON nếu cần.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetConfirm(false);
                    resetToDefaultData();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow transition"
                >
                  Xác nhận đặt lại
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
