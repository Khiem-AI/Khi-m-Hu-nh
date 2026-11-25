import React from 'react';
import { useCMMS } from '../context/CMMSContext';
import { UI_TEXTS } from '../config/uiTexts';
import {
  getEffectiveAllowedViews,
  isAdminLevel,
  canViewCosts,
  matchesAssignee,
  getInspectionStatus,
} from '../utils/cmmsLogic';
import {
  LayoutDashboard,
  ClipboardCheck,
  Cpu,
  CalendarCheck,
  BadgeCheck,
  Hammer,
  Tag,
  Package,
  FolderKanban,
  BookOpen,
  Zap,
  DollarSign,
  Users,
  Award,
  Activity,
  Mail,
  ShieldCheck,
  UserCircle,
  X,
  Pin,
  PinOff,
  PanelLeftClose,
  ChevronRight,
  Sunrise,
  FileBarChart2,
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isDesktopPinned?: boolean;
  onToggleDesktopPin?: () => void;
  isDesktopHoverOpen?: boolean;
  onDesktopHoverChange?: (open: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  isDesktopPinned = true,
  onToggleDesktopPin,
  isDesktopHoverOpen = false,
  onDesktopHoverChange,
}) => {
  const { maintenancePlans, tickets, spareParts, projects, safetyInspections, tools, dailyAreaChecks, currentUser } = useCMMS();
  const hoverCloseTimerRef = React.useRef<number | null>(null);

  const clearHoverTimer = React.useCallback(() => {
    if (hoverCloseTimerRef.current !== null) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  }, []);

  const handleOpenDesktopHover = React.useCallback(() => {
    clearHoverTimer();
    onDesktopHoverChange?.(true);
  }, [clearHoverTimer, onDesktopHoverChange]);

  const handleScheduleCloseDesktopHover = React.useCallback(() => {
    clearHoverTimer();
    hoverCloseTimerRef.current = window.setTimeout(() => {
      onDesktopHoverChange?.(false);
    }, 220);
  }, [clearHoverTimer, onDesktopHoverChange]);

  React.useEffect(() => {
    return () => clearHoverTimer();
  }, [clearHoverTimer]);

  React.useEffect(() => {
    if (isDesktopPinned || !isDesktopHoverOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearHoverTimer();
        onDesktopHoverChange?.(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktopPinned, isDesktopHoverOpen, clearHoverTimer, onDesktopHoverChange]);

  const overdueCount = maintenancePlans.filter((p) => p.trangThai === 'Quá hạn').length;
  const dueInspectionsCount = safetyInspections.filter((item) => {
    const status = getInspectionStatus(
      item.ngayHetHan,
      item.nhacTruocNgay,
      item.trangThai === 'Đang kiểm định'
    );
    return status === 'Quá hạn' || status === 'Sắp đến hạn';
  }).length;
  const borrowedToolsCount = tools.reduce((sum, t) => sum + t.soLuongDangMuon, 0);
  const pendingTicketsCount = tickets.filter(
    (t) =>
      t.trangThai === 'Mới tiếp nhận' ||
      t.trangThai === 'Đang xử lý' ||
      t.trangThai === 'Chờ xử lý' ||
      t.trangThai === 'Đang thực hiện'
  ).length;
  const activeProjectsCount = projects.filter(
    (p) => p.trangThai === 'Đang triển khai' || p.trangThai === 'Chờ nghiệm thu'
  ).length;
  const lowStockCount = spareParts.filter((p) => p.tonThucTe <= p.tonToiThieu).length;

  const myPendingPlansCount = maintenancePlans.filter(
    (p) =>
      matchesAssignee(p.nguoiPhuTrach, currentUser) &&
      (p.trangThai === 'Quá hạn' || p.trangThai === 'Tới hạn' || p.trangThai === 'Sắp tới')
  ).length;
  const myOpenTicketsCount = tickets.filter(
    (t) =>
      matchesAssignee(t.nguoiPhuTrach, currentUser) &&
      t.trangThai !== 'Hoàn thành' &&
      t.trangThai !== 'Hủy'
  ).length;
  const myPendingCount = myPendingPlansCount + myOpenTicketsCount;
  const pendingMorningChecksCount = dailyAreaChecks.filter(
    (c) =>
      c.trangThai !== 'Đã hoàn thành' &&
      (isAdminLevel(currentUser) || matchesAssignee(c.nguoiDuocGiao, currentUser))
  ).length;

  const navItems = [
    {
      id: 'dashboard',
      label: UI_TEXTS.navigation.items.dashboard.label,
      desc: UI_TEXTS.navigation.items.dashboard.desc,
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'admin_dashboard',
      label: UI_TEXTS.navigation.items.admin_dashboard.label,
      desc: UI_TEXTS.navigation.items.admin_dashboard.desc,
      icon: ShieldCheck,
      badge: 'Admin',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      adminOnly: true,
    },
    {
      id: 'monthly_report',
      label: UI_TEXTS.navigation.items.monthly_report.label,
      desc: UI_TEXTS.navigation.items.monthly_report.desc,
      icon: FileBarChart2,
      badge: 'MOM',
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    },
    {
      id: 'my_tasks',
      label: UI_TEXTS.navigation.items.my_tasks.label,
      desc: UI_TEXTS.navigation.items.my_tasks.desc,
      icon: ClipboardCheck,
      badge: myPendingCount > 0 ? `${myPendingCount} việc` : null,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    {
      id: 'morning_checks',
      label: UI_TEXTS.navigation.items.morning_checks.label,
      desc: UI_TEXTS.navigation.items.morning_checks.desc,
      icon: Sunrise,
      badge: pendingMorningChecksCount > 0 ? `${pendingMorningChecksCount} khu` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'profile',
      label: UI_TEXTS.navigation.items.profile.label,
      desc: UI_TEXTS.navigation.items.profile.desc,
      icon: UserCircle,
      badge: null,
    },
    {
      id: 'equipment',
      label: UI_TEXTS.navigation.items.equipment.label,
      desc: UI_TEXTS.navigation.items.equipment.desc,
      icon: Cpu,
      badge: null,
    },
    {
      id: 'maintenance',
      label: UI_TEXTS.navigation.items.maintenance.label,
      desc: UI_TEXTS.navigation.items.maintenance.desc,
      icon: CalendarCheck,
      badge: overdueCount > 0 ? `${overdueCount} trễ` : null,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    },
    {
      id: 'inspection_calibration',
      label: UI_TEXTS.navigation.items.inspection_calibration.label,
      desc: UI_TEXTS.navigation.items.inspection_calibration.desc,
      icon: BadgeCheck,
      badge: dueInspectionsCount > 0 ? `${dueInspectionsCount} hạn` : null,
      badgeColor: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    },
    {
      id: 'tools',
      label: UI_TEXTS.navigation.items.tools.label,
      desc: UI_TEXTS.navigation.items.tools.desc,
      icon: Hammer,
      badge: borrowedToolsCount > 0 ? `${borrowedToolsCount} mượn` : null,
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
    },
    {
      id: 'tickets',
      label: UI_TEXTS.navigation.items.tickets.label,
      desc: UI_TEXTS.navigation.items.tickets.desc,
      icon: Tag,
      badge: pendingTicketsCount > 0 ? pendingTicketsCount : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    {
      id: 'projects',
      label: UI_TEXTS.navigation.items.projects.label,
      desc: UI_TEXTS.navigation.items.projects.desc,
      icon: FolderKanban,
      badge: activeProjectsCount > 0 ? `${activeProjectsCount} DA` : null,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    },
    {
      id: 'spare_parts',
      label: UI_TEXTS.navigation.items.spare_parts.label,
      desc: UI_TEXTS.navigation.items.spare_parts.desc,
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} cạn` : null,
      badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    },
    {
      id: 'documents',
      label: UI_TEXTS.navigation.items.documents.label,
      desc: UI_TEXTS.navigation.items.documents.desc,
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'energy',
      label: UI_TEXTS.navigation.items.energy.label,
      desc: UI_TEXTS.navigation.items.energy.desc,
      icon: Zap,
      badge: null,
    },
    {
      id: 'costs',
      label: UI_TEXTS.navigation.items.costs.label,
      desc: UI_TEXTS.navigation.items.costs.desc,
      icon: DollarSign,
      badge: null,
    },
    {
      id: 'employees',
      label: UI_TEXTS.navigation.items.employees.label,
      desc: UI_TEXTS.navigation.items.employees.desc,
      icon: Users,
      badge: null,
    },
    {
      id: 'employee_performance',
      label: UI_TEXTS.navigation.items.employee_performance.label,
      desc: UI_TEXTS.navigation.items.employee_performance.desc,
      icon: Award,
      badge: 'Admin',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      adminOnly: true,
    },
    {
      id: 'logs',
      label: UI_TEXTS.navigation.items.logs.label,
      desc: UI_TEXTS.navigation.items.logs.desc,
      icon: Activity,
      badge: null,
    },
    {
      id: 'email_alerts',
      label: UI_TEXTS.navigation.items.email_alerts.label,
      desc: UI_TEXTS.navigation.items.email_alerts.desc,
      icon: Mail,
      badge: null,
    },
  ];

  const allowedViewIds = getEffectiveAllowedViews(currentUser);
  const adminAccess = isAdminLevel(currentUser);
  const costAccess = canViewCosts(currentUser);
  const visibleNavItems = navItems.filter(
    (item) =>
      allowedViewIds.includes(item.id) &&
      (!item.adminOnly || adminAccess) &&
      ((item.id !== 'costs' && item.id !== 'monthly_report') || costAccess)
  );

  const handleItemSelect = (tabId: string) => {
    onSelectTab(tabId);
    onCloseMobile();
    if (!isDesktopPinned) {
      clearHoverTimer();
      onDesktopHoverChange?.(false);
    }
  };

  const content = (
    <div className="flex min-h-full flex-col justify-between py-4 px-3 space-y-4">
      {/* Nav List */}
      <div className="space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-bold tracking-wide text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>{UI_TEXTS.navigation.sectionTitle}</span>
          <span className="font-mono text-[10px] tabular-nums">
            {visibleNavItems.length}/{navItems.length}
          </span>
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemSelect(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                isActive
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold shadow-sm shadow-blue-900/15'
                  : 'text-slate-700 dark:text-[#c7d3e4] hover:text-slate-900 dark:hover:text-[#edf2f9] hover:bg-slate-100/90 dark:hover:bg-[#1c2739]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400'
                  }`}
                />
                <div className="truncate">
                  <div
                    className={`text-[13px] leading-snug truncate ${
                      isActive ? 'font-semibold' : 'font-medium'
                    }`}
                  >
                    {item.label}
                  </div>
                  {item.desc && (
                    <div
                      className={`text-[11px] leading-tight truncate mt-0.5 ${
                        isActive ? 'text-sky-50/90' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.desc}
                    </div>
                  )}
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ml-2 tabular-nums ${
                    isActive ? 'bg-white text-slate-800 font-bold' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Status Card - Clickable shortcut to Profile */}
      <button
        type="button"
        onClick={() => handleItemSelect('profile')}
        className="w-full text-left p-3 rounded-xl bg-slate-50/90 dark:bg-[#182233] hover:bg-slate-100 dark:hover:bg-[#1f2c42] border border-slate-200/80 dark:border-[#26344a] text-xs space-y-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        title="Mở Hồ Sơ Cá Nhân (Profile)"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-medium">Hồ sơ của tôi</span>
          <span className="font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300">
            {currentUser.maNhanVien}
          </span>
        </div>
        <div className="font-semibold text-slate-800 dark:text-[#e7edf6] truncate">
          {currentUser.tenNhanVien}
        </div>
        <div className="text-[11px] text-sky-700 dark:text-sky-400 font-medium">
          {currentUser.chucVu}
        </div>
      </button>
    </div>
  );

  const desktopPinHeader = (
    <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#d4e3f4] dark:border-[#243045] bg-[#edf4fc] dark:bg-[#162030]/80 shrink-0">
      <span className="text-[11px] font-semibold text-[#1e3a5f] dark:text-slate-300 truncate">
        {isDesktopPinned ? 'Menu đang ghim' : 'Menu tự động ẩn'}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        {onToggleDesktopPin && (
          <button
            type="button"
            onClick={() => {
              clearHoverTimer();
              onToggleDesktopPin();
            }}
            title={
              isDesktopPinned
                ? 'Bỏ ghim để tự động ẩn menu trái (tối ưu không gian)'
                : 'Ghim cố định menu bên trái'
            }
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
              isDesktopPinned
                ? 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
                : 'bg-sky-600 text-white hover:bg-sky-500 shadow-xs'
            }`}
          >
            {isDesktopPinned ? (
              <>
                <PinOff className="w-3.5 h-3.5" />
                <span>Tự ẩn</span>
              </>
            ) : (
              <>
                <Pin className="w-3.5 h-3.5" />
                <span>Ghim</span>
              </>
            )}
          </button>
        )}
        {!isDesktopPinned && (
          <button
            type="button"
            onClick={() => {
              clearHoverTimer();
              onDesktopHoverChange?.(false);
            }}
            aria-label="Thu gọn menu ngay"
            title="Thu gọn menu ngay"
            className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Pinned Persistent Sidebar */}
      {isDesktopPinned ? (
        <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-slate-200/80 dark:border-[#243045] bg-white dark:bg-[#131b29] sticky top-16 h-[calc(100vh-4rem)]">
          {desktopPinHeader}
          <div className="flex-1 overflow-y-auto">{content}</div>
        </aside>
      ) : (
        <>
          {/* Left-edge hover trigger zone when desktop sidebar is auto-hidden */}
          {!isDesktopHoverOpen && (
            <>
              <div
                onMouseEnter={handleOpenDesktopHover}
                aria-hidden="true"
                className="hidden lg:block fixed left-0 top-16 bottom-0 w-3.5 z-30"
              />
              <button
                type="button"
                onMouseEnter={handleOpenDesktopHover}
                onClick={handleOpenDesktopHover}
                aria-label="Hiện thanh menu bên trái"
                title="Di chuột hoặc bấm để mở thanh menu"
                className="hidden lg:flex fixed left-0 top-28 z-30 items-center justify-center w-6 h-12 rounded-r-xl bg-white/95 dark:bg-[#172030]/95 border border-l-0 border-slate-200 dark:border-[#2d3b54] text-slate-500 dark:text-slate-300 hover:w-7 hover:text-sky-600 dark:hover:text-sky-400 shadow-md transition-[width,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Desktop Auto-Hide Floating Drawer */}
          <aside
            onMouseEnter={handleOpenDesktopHover}
            onMouseLeave={handleScheduleCloseDesktopHover}
            aria-hidden={!isDesktopHoverOpen}
            className={`hidden lg:flex lg:flex-col fixed left-0 top-16 bottom-0 w-64 z-40 border-r border-slate-200/80 dark:border-[#243045] bg-white/95 dark:bg-[#131b29]/95 backdrop-blur-md shadow-2xl transition-transform duration-200 ease-out ${
              isDesktopHoverOpen
                ? 'translate-x-0 pointer-events-auto'
                : '-translate-x-full pointer-events-none'
            }`}
          >
            {desktopPinHeader}
            <div className="flex-1 overflow-y-auto">{content}</div>
          </aside>
        </>
      )}

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#131b29] border-r border-slate-200/80 dark:border-[#243045] flex flex-col z-50 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200/80 dark:border-[#243045]">
              <span className="font-bold text-slate-800 dark:text-[#e7edf6] text-sm">
                FACILITY SYSTEM MANAGEMENT
              </span>
              <button
                onClick={onCloseMobile}
                aria-label="Đóng menu"
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{content}</div>
          </div>
        </div>
      )}
    </>
  );
};
