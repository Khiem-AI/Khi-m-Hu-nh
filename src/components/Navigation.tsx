import React from 'react';
import { useCMMS } from '../context/CMMSContext';
import { UI_TEXTS } from '../config/uiTexts';
import { getEffectiveAllowedViews, isAdminLevel, matchesAssignee, getInspectionStatus } from '../utils/cmmsLogic';
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
  X,
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { maintenancePlans, tickets, spareParts, projects, safetyInspections, tools, currentUser } = useCMMS();

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
      id: 'my_tasks',
      label: UI_TEXTS.navigation.items.my_tasks.label,
      desc: UI_TEXTS.navigation.items.my_tasks.desc,
      icon: ClipboardCheck,
      badge: myPendingCount > 0 ? `${myPendingCount} việc` : null,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
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
  const visibleNavItems = navItems.filter(
    (item) => allowedViewIds.includes(item.id) && (!item.adminOnly || adminAccess)
  );

  const content = (
    <div className="flex h-full flex-col justify-between py-4 px-3 space-y-4">
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
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-md shadow-cyan-900/20'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/90'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
                  }`}
                />
                <div className="truncate">
                  <div className="text-xs font-bold leading-tight truncate">{item.label}</div>
                  {item.desc && (
                    <div
                      className={`text-[10px] leading-tight truncate mt-0.5 ${
                        isActive ? 'text-cyan-50/90' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.desc}
                    </div>
                  )}
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ml-2 tabular-nums ${
                    isActive ? 'bg-white text-slate-900 font-extrabold' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Status Card */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-medium">Tài khoản đang trực</span>
          <span className="font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300">
            {currentUser.maNhanVien}
          </span>
        </div>
        <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
          {currentUser.tenNhanVien}
        </div>
        <div className="text-[11px] text-cyan-700 dark:text-cyan-400 font-semibold">
          {currentUser.chucVu}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
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
