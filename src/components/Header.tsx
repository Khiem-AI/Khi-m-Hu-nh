import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useCMMS } from '../context/CMMSContext';
import { UI_TEXTS } from '../config/uiTexts';
import { canAccessBackup, getEffectiveAllowedViews, getInspectionStatus, getInspectionDaysRemaining } from '../utils/cmmsLogic';
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
  UserCircle,
  PanelLeftClose,
  PanelLeftOpen,
  BellRing,
  CheckCheck,
  Users,
  Monitor,
  Smartphone,
  ArrowRight,
} from 'lucide-react';

interface HeaderProps {
  onOpenScanner: () => void;
  onOpenBackup: () => void;
  onToggleMobileNav: () => void;
  isMobileNavOpen: boolean;
  onNavigateTab: (tabId: string) => void;
  isDesktopSidebarPinned?: boolean;
  onToggleDesktopSidebarPin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenScanner,
  onOpenBackup,
  onToggleMobileNav,
  isMobileNavOpen,
  onNavigateTab,
  isDesktopSidebarPinned = true,
  onToggleDesktopSidebarPin,
}) => {
  const {
    currentUser,
    employees,
    onlineUsers,
    refreshOnlineUsers,
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
    serverSyncStatus,
    lastServerSyncedAt,
    hasServerSyncSession,
    isRealtimeStreamConnected,
    pendingCloudOpsCount,
    connectCloudWithGoogle,
    disconnectCloud,
    forceSyncLocalToCloud,
    pullLatestFromCloud,
    pullLatestFromServer,
    webNotifications,
    browserNotificationPermission,
    requestBrowserNotificationPermission,
    markWebNotificationRead,
    markAllWebNotificationsRead,
    clearWebNotifications,
  } = useCMMS();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCloudPopover, setShowCloudPopover] = useState(false);
  const [showOnlinePopover, setShowOnlinePopover] = useState(false);
  const [isRefreshingOnline, setIsRefreshingOnline] = useState(false);
  const [isCloudActionLoading, setIsCloudActionLoading] = useState(false);
  const [quickSyncPassword, setQuickSyncPassword] = useState('');
  const [showQuickSyncPass, setShowQuickSyncPass] = useState(false);
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
  const canViewEmployeesTab = getEffectiveAllowedViews(currentUser).includes('employees');

  const formatPresenceAgo = (ts: number) => {
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diffSec < 12) return 'Đang hoạt động';
    if (diffSec < 60) return `${diffSec} giây trước`;
    const mins = Math.floor(diffSec / 60);
    return `${mins} phút trước`;
  };

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
  const unreadWebCount = webNotifications.filter((n) => !n.read).length;
  const totalBellCount = totalAlerts + unreadWebCount;

  const handleLoginFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccessMessage('');

    if (!inputUsername.trim()) {
      setLoginError('Vui lòng nhập mã nhân viên hoặc tên đăng nhập!');
      return;
    }

    const res = await login(inputUsername.trim(), inputPassword.trim());
    if (res.success) {
      setLoginSuccessMessage('Đăng nhập và đồng bộ dữ liệu thành công!');
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

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
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

    const res = await changePassword(currentUser.maNhanVien, cpCurrentPass, cpNewPass);
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
    <header className="sticky top-0 z-40 w-full border-t-[3px] border-t-sky-600 dark:border-t-sky-500 border-b border-[#cfe0f5] dark:border-[#243045] bg-gradient-to-r from-[#eaf2fd] via-[#f5f9ff] to-[#ecf3fc] dark:from-[#131b29] dark:via-[#151f30] dark:to-[#131b29] backdrop-blur-md transition-colors shadow-[0_2px_6px_rgba(15,45,82,0.05)]">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6 gap-4">
        {/* Left: Mobile hamburger, Desktop sidebar toggle & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleMobileNav}
            aria-label="Mở menu điều hướng"
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800 transition shrink-0"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {onToggleDesktopSidebarPin && (
            <button
              type="button"
              onClick={onToggleDesktopSidebarPin}
              aria-label={
                isDesktopSidebarPinned
                  ? 'Bật tự động ẩn thanh menu trái'
                  : 'Ghim cố định thanh menu trái'
              }
              title={
                isDesktopSidebarPinned
                  ? 'Tự động ẩn menu trái (tối ưu không gian)'
                  : 'Đang tự động ẩn menu • Bấm để ghim cố định'
              }
              className={`hidden lg:inline-flex items-center justify-center p-2 rounded-xl border transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                isDesktopSidebarPinned
                  ? 'bg-white/75 dark:bg-transparent text-slate-600 dark:text-slate-300 border-[#c9dcf2] dark:border-[#2a3850] hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
                  : 'text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60'
              }`}
            >
              {isDesktopSidebarPinned ? (
                <PanelLeftClose className="w-5 h-5" />
              ) : (
                <PanelLeftOpen className="w-5 h-5" />
              )}
            </button>
          )}

          <div
            onClick={() => onNavigateTab('dashboard')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-600/25 group-hover:scale-105 transition shrink-0">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-[#0f2d52] dark:text-[#e7edf6] text-sm sm:text-base lg:text-[17px] truncate">
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
            className="h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-slate-50 dark:bg-[#1c2739] hover:bg-slate-100 dark:hover:bg-[#243248] text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-[#2e3e59] text-xs font-semibold transition whitespace-nowrap shrink-0"
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

          {/* Live Online Users Pill & Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const nextOpen = !showOnlinePopover;
                setShowOnlinePopover(nextOpen);
                setShowCloudPopover(false);
                setShowNotifications(false);
                setShowUserDropdown(false);
                if (nextOpen) {
                  void refreshOnlineUsers();
                }
              }}
              aria-label={`Người dùng đang online: ${onlineUsers.length}`}
              title={`Xem danh sách người dùng đang online (${onlineUsers.length})`}
              className="h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 text-xs font-semibold transition whitespace-nowrap shrink-0"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 hidden sm:inline" />
              <span className="font-mono font-bold tabular-nums">{onlineUsers.length}</span>
              <span className="hidden xl:inline">Online</span>
            </button>

            {showOnlinePopover && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
                        Đang Online ({onlineUsers.length})
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Cập nhật tự động theo thời gian thực
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isRefreshingOnline}
                    onClick={async () => {
                      setIsRefreshingOnline(true);
                      await refreshOnlineUsers();
                      setIsRefreshingOnline(false);
                    }}
                    title="Làm mới danh sách đang online"
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOnline ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {onlineUsers.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                      Chưa ghi nhận người dùng nào đang trực tuyến.
                    </div>
                  ) : (
                    onlineUsers.map((u) => {
                      const empMatch = employees.find(
                        (e) => e.maNhanVien.trim().toUpperCase() === u.maNhanVien.trim().toUpperCase()
                      );
                      const isMe =
                        currentUser.maNhanVien.trim().toUpperCase() === u.maNhanVien.trim().toUpperCase();
                      const avatarUrl =
                        empMatch?.anhDaiDien ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

                      return (
                        <div
                          key={u.maNhanVien}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition ${
                            isMe
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/35'
                              : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="relative shrink-0 mt-0.5">
                            <img
                              src={avatarUrl}
                              alt={u.tenNhanVien}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {u.tenNhanVien}
                                </span>
                                {isMe && (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[10px] font-bold shrink-0">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                {u.maNhanVien}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                              <span className="px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold text-[10px]">
                                {u.chucVu}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                                {u.deviceType === 'Mobile' ? (
                                  <Smartphone className="w-3 h-3" />
                                ) : (
                                  <Monitor className="w-3 h-3" />
                                )}
                                {u.deviceType}
                                {u.sessionCount > 1 ? ` • ${u.sessionCount} phiên` : ''}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="text-slate-700 dark:text-slate-300 truncate">
                                Đang xem:{' '}
                                <strong className="text-cyan-700 dark:text-cyan-300 font-semibold">
                                  {u.currentTabLabel}
                                </strong>
                              </span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                                {formatPresenceAgo(u.lastActiveAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {canViewEmployeesTab && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOnlinePopover(false);
                        onNavigateTab('employees');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      <span>Xem danh sách nhân sự</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cloud & Multi-Device Real-Time Sync Status Button & Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowCloudPopover(!showCloudPopover);
                setShowOnlinePopover(false);
                setShowNotifications(false);
                setShowUserDropdown(false);
                setCloudActionNotice(null);
              }}
              title={
                cloudSyncStatus === 'synced'
                  ? `Đã đồng bộ Cloud trực tiếp (${cloudUser?.email || ''})`
                  : cloudSyncStatus === 'syncing' || cloudSyncStatus === 'connecting' || serverSyncStatus === 'syncing'
                  ? 'Đang đồng bộ dữ liệu theo thời gian thực...'
                  : cloudSyncStatus === 'error'
                  ? 'Lỗi đồng bộ Cloud — nhấn để xem chi tiết'
                  : hasServerSyncSession || serverSyncStatus === 'synced' || isRealtimeStreamConnected
                  ? `Đang đồng bộ trực tiếp theo thời gian thực${lastServerSyncedAt ? ` (${lastServerSyncedAt})` : ''}`
                  : 'Nhấn để kích hoạt đồng bộ trực tiếp hoặc kết nối Google Cloud'
              }
              className={`h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                cloudSyncStatus === 'synced' || hasServerSyncSession || serverSyncStatus === 'synced' || isRealtimeStreamConnected
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40'
                  : cloudSyncStatus === 'syncing' || cloudSyncStatus === 'connecting' || serverSyncStatus === 'syncing'
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
              ) : cloudSyncStatus === 'syncing' || cloudSyncStatus === 'connecting' || serverSyncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
                  <span className="hidden xl:inline">Đang đồng bộ...</span>
                </>
              ) : cloudSyncStatus === 'error' ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span className="hidden xl:inline">Lỗi Cloud</span>
                </>
              ) : hasServerSyncSession || serverSyncStatus === 'synced' || isRealtimeStreamConnected ? (
                <>
                  <span className="relative flex h-2 w-2 shrink-0">
                    {isRealtimeStreamConnected && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden xl:inline">Đồng bộ trực tiếp</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="hidden xl:inline">Đồng bộ</span>
                </>
              )}
            </button>

            {showCloudPopover && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-cyan-500" />
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Đồng Bộ Trực Tiếp
                    </span>
                  </div>
                  <span
                    className={`font-bold text-[11px] px-2 py-0.5 rounded-lg ${
                      cloudSyncStatus === 'synced' || hasServerSyncSession || serverSyncStatus === 'synced' || isRealtimeStreamConnected
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        : cloudSyncStatus === 'syncing' || cloudSyncStatus === 'connecting' || serverSyncStatus === 'syncing'
                        ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300'
                        : cloudSyncStatus === 'error'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                    }`}
                  >
                    {cloudSyncStatus === 'synced'
                      ? 'Cloud trực tuyến'
                      : cloudSyncStatus === 'syncing' || serverSyncStatus === 'syncing'
                      ? 'Đang đồng bộ'
                      : cloudSyncStatus === 'connecting'
                      ? 'Đang kết nối'
                      : cloudSyncStatus === 'error'
                      ? 'Gặp lỗi'
                      : hasServerSyncSession || serverSyncStatus === 'synced' || isRealtimeStreamConnected
                      ? 'Trực tuyến'
                      : 'Chưa kích hoạt'}
                  </span>
                </div>

                {cloudUser ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-500/30 space-y-1">
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                      Đang kết nối Google Cloud trực tiếp:
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {cloudUser.email}
                    </div>
                    {lastSyncedAt && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Đồng bộ Cloud lúc: <span className="font-mono">{lastSyncedAt}</span>
                      </div>
                    )}
                    {lastServerSyncedAt && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Đồng bộ đa thiết bị lúc: <span className="font-mono">{lastServerSyncedAt}</span>
                      </div>
                    )}
                    {pendingCloudOpsCount > 0 && (
                      <div className="text-[11px] text-cyan-700 dark:text-cyan-300 font-semibold pt-0.5">
                        Đang chuyển tiếp {pendingCloudOpsCount} cập nhật từ nhân viên lên Cloud...
                      </div>
                    )}
                  </div>
                ) : hasServerSyncSession || serverSyncStatus === 'synced' || isRealtimeStreamConnected ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-500/30 space-y-1.5">
                    <p className="text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium">
                      Đang bật đồng bộ trực tiếp theo thời gian thực. Mọi dữ liệu bạn nhập sẽ tự động cập nhật ngay sang các máy tính khác và chuyển tiếp lên Cloud.
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      {lastServerSyncedAt && (
                        <span>
                          Cập nhật lúc: <span className="font-mono font-semibold">{lastServerSyncedAt}</span>
                        </span>
                      )}
                      {pendingCloudOpsCount > 0 ? (
                        <span className="text-cyan-700 dark:text-cyan-300 font-semibold">
                          • {pendingCloudOpsCount} thay đổi đang chờ lên Cloud
                        </span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                          • Đã đồng bộ mới nhất
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      Xác nhận mật khẩu 1 lần cho tài khoản{' '}
                      <strong className="font-mono text-cyan-700 dark:text-cyan-300">
                        {currentUser.maNhanVien}
                      </strong>{' '}
                      để bật đồng bộ trực tiếp (tự duy trì 7 ngày ngay cả khi tải lại trang):
                    </p>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!quickSyncPassword.trim()) {
                          setCloudActionNotice({
                            ok: false,
                            text: 'Vui lòng nhập mật khẩu của tài khoản hiện tại.',
                          });
                          return;
                        }
                        setIsCloudActionLoading(true);
                        setCloudActionNotice(null);
                        const res = await login(currentUser.maNhanVien, quickSyncPassword.trim());
                        setIsCloudActionLoading(false);
                        if (res.success) {
                          setQuickSyncPassword('');
                          setCloudActionNotice({
                            ok: true,
                            text: 'Đã kích hoạt đồng bộ trực tiếp và tải dữ liệu mới nhất thành công!',
                          });
                        } else {
                          setCloudActionNotice({
                            ok: false,
                            text: res.message || 'Mật khẩu không chính xác.',
                          });
                        }
                      }}
                      className="space-y-2"
                    >
                      <div className="relative">
                        <input
                          type={showQuickSyncPass ? 'text' : 'password'}
                          value={quickSyncPassword}
                          onChange={(e) => setQuickSyncPassword(e.target.value)}
                          placeholder="Nhập mật khẩu đăng nhập..."
                          className="w-full px-3 py-2 pr-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowQuickSyncPass(!showQuickSyncPass)}
                          aria-label={showQuickSyncPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showQuickSyncPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={isCloudActionLoading}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCloudActionLoading ? 'animate-spin' : ''}`} />
                        <span>Bật đồng bộ trực tiếp ngay</span>
                      </button>
                    </form>
                  </div>
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
                  {cloudUser && cloudSyncStatus !== 'offline' ? (
                    <>
                      <button
                        type="button"
                        disabled={isCloudActionLoading}
                        onClick={async () => {
                          setIsCloudActionLoading(true);
                          setCloudActionNotice(null);
                          const res = await pullLatestFromCloud();
                          setIsCloudActionLoading(false);
                          setCloudActionNotice({ ok: res.success, text: res.message });
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải dữ liệu mới nhất từ Cloud</span>
                      </button>

                      {hasBackupAccess && (
                        <div className="space-y-1">
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
                            <span>Đẩy dữ liệu máy này lên Cloud</span>
                          </button>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 px-1">
                            Chỉ bấm khi máy này đang giữ dữ liệu mới hơn Cloud.
                          </p>
                        </div>
                      )}

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

                      <button
                        type="button"
                        disabled={isCloudActionLoading}
                        onClick={async () => {
                          setIsCloudActionLoading(true);
                          setCloudActionNotice(null);
                          await disconnectCloud();
                          setIsCloudActionLoading(false);
                          setCloudActionNotice({
                            ok: true,
                            text: 'Đã ngắt kết nối Google Cloud khỏi trình duyệt này.',
                          });
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        <CloudOff className="w-3.5 h-3.5" />
                        <span>Ngắt kết nối Google Cloud</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {(hasServerSyncSession || serverSyncStatus === 'synced' || isRealtimeStreamConnected) && (
                        <button
                          type="button"
                          disabled={isCloudActionLoading}
                          onClick={async () => {
                            setIsCloudActionLoading(true);
                            setCloudActionNotice(null);
                            const res = await pullLatestFromServer();
                            setIsCloudActionLoading(false);
                            setCloudActionNotice({ ok: res.success, text: res.message });
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${isCloudActionLoading ? 'animate-spin' : ''}`}
                          />
                          <span>Tải dữ liệu mới nhất ngay</span>
                        </button>
                      )}

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
                        <span>Liên kết Google Cloud trực tiếp</span>
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
                setShowOnlinePopover(false);
                setShowUserDropdown(false);
                setShowCloudPopover(false);
              }}
              aria-label="Thông báo hệ thống"
              className="relative h-9 w-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalBellCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow tabular-nums">
                  {totalBellCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
                      Trung Tâm Thông Báo ({totalBellCount})
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Web Miễn Phí (0đ) &amp; Cảnh báo vận hành
                    </span>
                  </div>
                  {browserNotificationPermission === 'default' && (
                    <button
                      type="button"
                      onClick={() => void requestBrowserNotificationPermission()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold transition shrink-0"
                    >
                      <BellRing className="w-3 h-3" />
                      <span>Bật Popup</span>
                    </button>
                  )}
                  {browserNotificationPermission === 'granted' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Popup Bật
                    </span>
                  )}
                </div>

                {/* Web Notifications Feed */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                      Thông Báo Web ({unreadWebCount} mới)
                    </span>
                    {webNotifications.length > 0 && (
                      <div className="flex items-center gap-2">
                        {unreadWebCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllWebNotificationsRead}
                            className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 font-semibold"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>Đọc hết</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={clearWebNotifications}
                          className="text-slate-400 hover:text-rose-500 font-semibold"
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>

                  {webNotifications.length > 0 ? (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 text-xs">
                      {webNotifications.slice(0, 12).map((wn) => (
                        <div
                          key={wn.id}
                          onClick={() => {
                            markWebNotificationRead(wn.id);
                            if (wn.targetTab) onNavigateTab(wn.targetTab);
                            setShowNotifications(false);
                          }}
                          className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2 ${
                            wn.read
                              ? 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                              : 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-500/40 text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          <span
                            className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                              wn.read ? 'bg-slate-300 dark:bg-slate-700' : 'bg-cyan-500'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <strong className="block text-slate-900 dark:text-slate-100 line-clamp-1">
                              {wn.title}
                            </strong>
                            {wn.message && (
                              <span className="block text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                                {wn.message}
                              </span>
                            )}
                            <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                              {wn.timestamp}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-center">
                      Chưa có thông báo sự kiện Web mới. Khi có Ticket, Giao việc hoặc Báo cáo hoàn thành, tin sẽ hiện tại đây.
                    </div>
                  )}
                </div>

                {/* Operational Alerts Feed */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Cảnh Báo Vận Hành ({totalAlerts})
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">Thời gian thực</span>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1 text-xs">
                    {overduePlans.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onNavigateTab('maintenance');
                          setShowNotifications(false);
                        }}
                        className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 cursor-pointer flex items-start gap-2.5 transition"
                      >
                        <Clock className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                        <div>
                          <strong className="block text-slate-900 dark:text-slate-100">{p.tenThietBi} ({p.maThietBi})</strong>
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
                            ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                            : 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-500/20'
                        }`}
                      >
                        <BadgeCheck
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            status === 'Quá hạn' ? 'text-rose-600 dark:text-rose-400' : 'text-orange-600 dark:text-orange-400'
                          }`}
                        />
                        <div>
                          <strong className="block text-slate-900 dark:text-slate-100">
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
                        className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 cursor-pointer flex items-start gap-2.5 transition"
                      >
                        <Package className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div>
                          <strong className="block text-slate-900 dark:text-slate-100">{sp.tenVatTu} ({sp.maVatTu})</strong>
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
                        className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 cursor-pointer flex items-start gap-2.5 transition"
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                        <div>
                          <strong className="block text-slate-900 dark:text-slate-100">{t.tieuDe}</strong>
                          <span>Sự cố khẩn cấp: {t.maTicket}</span>
                        </div>
                      </div>
                    ))}

                    {totalAlerts === 0 && (
                      <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                        Tất cả thiết bị và kho phụ tùng đều ở trạng thái an toàn!
                      </div>
                    )}
                  </div>
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
                setShowOnlinePopover(false);
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
                      onNavigateTab('profile');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-cyan-600/15 hover:bg-cyan-600/25 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <UserCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Hồ Sơ Cá Nhân (Profile)</span>
                  </button>

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
