import {
  MaintenanceFrequency,
  StockTransactionType,
  MaintenancePlan,
  MaintenanceHistory,
  MaintenanceWorkType,
  Employee,
  APP_VIEW_OPTIONS,
  FacilityProject,
  InspectionCycle,
  InspectionStatus,
  DailyAreaCheck,
  MorningCheckTemplatesMap,
  EnergyTariffConfig,
  DEFAULT_ENERGY_TARIFF_CONFIG,
  Power10Days,
} from '../types/cmms';

/**
 * Calculates the next maintenance date given the base date and maintenance frequency.
 * Preserves ISO YYYY-MM-DD formatting.
 */
export function calculateNextMaintenanceDate(
  baseDateStr: string,
  frequency: MaintenanceFrequency | string
): string {
  if (!baseDateStr) return '';
  const date = new Date(baseDateStr);
  if (isNaN(date.getTime())) return baseDateStr;

  const normalizedFreq = (frequency || '').trim().toLowerCase();

  switch (normalizedFreq) {
    case 'daily':
    case 'hàng ngày':
      date.setDate(date.getDate() + 1);
      break;

    case 'weekly':
    case 'hàng tuần':
      date.setDate(date.getDate() + 7);
      break;

    case 'monthly':
    case 'hàng tháng':
      date.setMonth(date.getMonth() + 1);
      break;

    case 'quarterly':
    case 'hàng quý':
      date.setMonth(date.getMonth() + 3);
      break;

    case 'yearly':
    case 'hàng năm':
      date.setFullYear(date.getFullYear() + 1);
      break;

    default:
      // Default to 30 days if unknown
      date.setDate(date.getDate() + 30);
      break;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the user's current local date formatted as YYYY-MM-DD.
 */
export function getTodayISODate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Determines maintenance status relative to a reference date (defaulting to today)
 */
export function getMaintenanceStatus(
  nextDateStr: string,
  referenceDateStr: string = getTodayISODate()
): 'Quá hạn' | 'Tới hạn' | 'Sắp tới' | 'Đúng hạn' {
  if (!nextDateStr) return 'Đúng hạn';

  const next = new Date(nextDateStr);
  const ref = new Date(referenceDateStr);
  if (isNaN(next.getTime()) || isNaN(ref.getTime())) return 'Đúng hạn';

  // Normalize to start of day UTC
  const nextTime = new Date(next.getFullYear(), next.getMonth(), next.getDate()).getTime();
  const refTime = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();

  const diffDays = Math.round((nextTime - refTime) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'Quá hạn';
  } else if (diffDays === 0) {
    return 'Tới hạn';
  } else if (diffDays <= 7) {
    return 'Sắp tới';
  } else {
    return 'Đúng hạn';
  }
}

/**
 * Calculates updated stock quantity based on transaction type.
 */
export function applyStockTransaction(
  currentStock: number,
  type: StockTransactionType | string,
  quantity: number
): number {
  const safeQty = Math.max(0, quantity || 0);
  const safeStock = Math.max(0, currentStock || 0);

  if (type === 'Xuất kho sử dụng') {
    return Math.max(0, safeStock - safeQty);
  } else if (type === 'Nhập kho' || type === 'Hoàn kho') {
    return safeStock + safeQty;
  }
  return safeStock;
}

/**
 * Calculates consumption difference from meter readings.
 */
export function calculateMeterConsumption(chiSoCu: number, chiSoMoi: number): number {
  const cu = Number(chiSoCu) || 0;
  const moi = Number(chiSoMoi) || 0;
  return Math.max(0, moi - cu);
}

/**
 * Format currency in VNĐ
 */
export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date display DD/MM/YYYY
 */
export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Finds the latest maintenance history record for a given equipment code.
 */
export function getLatestMaintenanceForEquipment(
  maThietBi: string,
  history: MaintenanceHistory[]
): MaintenanceHistory | undefined {
  const matches = history.filter((h) => h.maThietBi === maThietBi);
  if (matches.length === 0) return undefined;
  return matches.sort((a, b) => new Date(b.ngayThucHien).getTime() - new Date(a.ngayThucHien).getTime())[0];
}

/**
 * Classifies a maintenance history entry as either Planned Maintenance or Repair.
 */
export function getHistoryWorkType(record: MaintenanceHistory): MaintenanceWorkType {
  if (record.loaiCongViec === 'Sửa chữa' || record.loaiCongViec === 'Bảo trì theo kế hoạch') {
    return record.loaiCongViec;
  }
  const desc = (record.moTaCongViec || '').toLowerCase();
  if (
    record.ketQua === 'Chưa đạt' ||
    /(sửa chữa|\bsửa\b|khắc phục|sự cố|hỏng|rò rỉ|cháy|\bđứt\b|bất thường|thay khẩn|xử lý lỗi)/.test(
      desc
    )
  ) {
    return 'Sửa chữa';
  }
  return 'Bảo trì theo kế hoạch';
}

/**
 * Automatically synchronizes maintenance plans with planned maintenance history (Lich_su_bao_tri).
 * Repair records ('Sửa chữa') only log into equipment history and do NOT shift preventive maintenance schedules.
 */
export function syncPlansWithHistory(
  plans: MaintenancePlan[],
  history: MaintenanceHistory[]
): MaintenancePlan[] {
  // Map of maThietBi -> latest PLANNED maintenance history item
  const latestHistoryMap = new Map<string, MaintenanceHistory>();
  for (const h of history) {
    if (getHistoryWorkType(h) === 'Sửa chữa') continue;
    const existing = latestHistoryMap.get(h.maThietBi);
    if (!existing || new Date(h.ngayThucHien).getTime() > new Date(existing.ngayThucHien).getTime()) {
      latestHistoryMap.set(h.maThietBi, h);
    }
  }

  return plans.map((plan) => {
    const latest = latestHistoryMap.get(plan.maThietBi);
    if (latest) {
      const nextDate = calculateNextMaintenanceDate(latest.ngayThucHien, plan.tanSuat);
      const newStatus = getMaintenanceStatus(nextDate);
      return {
        ...plan,
        ngayBaoTriGanNhat: latest.ngayThucHien,
        ngayBaoTriTiepTheo: nextDate,
        trangThai: newStatus,
      };
    }
    const status = getMaintenanceStatus(plan.ngayBaoTriTiepTheo);
    return {
      ...plan,
      trangThai: status,
    };
  });
}

/**
 * Only ID1460 or Owner role is allowed to access data backup / export / reset features.
 */
export function canAccessBackup(user?: Employee | null): boolean {
  if (!user) return false;
  return (
    user.maNhanVien?.trim().toUpperCase() === 'ID1460' ||
    user.username?.trim().toUpperCase() === 'ID1460' ||
    user.chucVu === 'Owner'
  );
}

export const ADMIN_ONLY_VIEWS = ['admin_dashboard', 'employee_performance'] as const;
export const COST_RESTRICTED_VIEWS = ['costs', 'monthly_report'] as const;

/**
 * Only Admin-level users (Owner, Admin, Quản trị viên, ID1460) can access admin-only views.
 */
export function isAdminLevel(user?: Employee | null): boolean {
  if (!user) return false;
  return (
    user.chucVu === 'Owner' ||
    user.chucVu === 'Admin' ||
    user.chucVu === 'Quản trị viên' ||
    user.maNhanVien?.trim().toUpperCase() === 'ID1460' ||
    user.username?.trim().toUpperCase() === 'ID1460'
  );
}

/**
 * Technicians ('Kỹ thuật viên') and Operators ('Nhân viên vận hành') cannot view or export any cost-related data.
 */
export function canViewCosts(user?: Employee | null): boolean {
  if (!user) return false;
  if (isAdminLevel(user)) return true;
  if (user.chucVu === 'Kỹ thuật viên' || user.chucVu === 'Nhân viên vận hành') {
    return false;
  }
  return true;
}

/**
 * Technicians ('Kỹ thuật viên') and Operators ('Nhân viên vận hành') can edit operational records
 * (equipment, tickets, tools, spare parts, maintenance history) but cannot delete them.
 */
export function canDeleteRecords(user?: Employee | null): boolean {
  if (!user) return false;
  if (isAdminLevel(user)) return true;
  if (user.chucVu === 'Kỹ thuật viên' || user.chucVu === 'Nhân viên vận hành') {
    return false;
  }
  return true;
}

/**
 * Technicians ('Kỹ thuật viên') and Operators ('Nhân viên vận hành') have read-only access
 * to maintenance plans (cannot edit, reschedule, assign, or delete plans).
 */
export function canManageMaintenancePlans(user?: Employee | null): boolean {
  if (!user) return false;
  if (isAdminLevel(user)) return true;
  if (user.chucVu === 'Kỹ thuật viên' || user.chucVu === 'Nhân viên vận hành') {
    return false;
  }
  return true;
}

/**
 * Technicians ('Kỹ thuật viên') and Operators ('Nhân viên vận hành') cannot export CSV reports on Dashboard.
 */
export function canExportCSV(user?: Employee | null): boolean {
  if (!user) return false;
  if (isAdminLevel(user)) return true;
  if (user.chucVu === 'Kỹ thuật viên' || user.chucVu === 'Nhân viên vận hành') {
    return false;
  }
  return true;
}

/**
 * Work Assignment ("Giao Việc") permission:
 * - Admin-level users always have it.
 * - Explicitly denied if 'DENY_ASSIGN_WORK' rule is set.
 * - Technicians ('Kỹ thuật viên') & Operators ('Nhân viên vận hành') have it OFF by default,
 *   unless explicitly granted 'ASSIGN_WORK' by Admin in EmployeesTab.
 * - Engineers / Managers / Directors have it ON by default unless explicitly revoked.
 */
export function canAssignWork(user?: Employee | null): boolean {
  if (!user) return false;
  if (isAdminLevel(user)) return true;
  if (Array.isArray(user.quyenHan) && user.quyenHan.includes('DENY_ASSIGN_WORK')) {
    return false;
  }
  if (Array.isArray(user.quyenHan) && user.quyenHan.includes('ASSIGN_WORK')) {
    return true;
  }
  if (user.chucVu === 'Kỹ thuật viên' || user.chucVu === 'Nhân viên vận hành') {
    return false;
  }
  return true;
}

/**
 * Only Admin/Owner/Director/Manager/Chief Engineer/Equipment Engineer can approve, reject,
 * place orders, or confirm receipt on Purchase Requests.
 */
export function canApprovePurchaseRequests(user?: Employee | null): boolean {
  if (!user) return false;
  if (isAdminLevel(user)) return true;
  if (user.chucVu === 'Kỹ thuật viên' || user.chucVu === 'Nhân viên vận hành') {
    return false;
  }
  return true;
}

/**
 * Returns the effective list of tab/view IDs an employee is authorized to see.
 */
export function getEffectiveAllowedViews(user?: Employee | null): string[] {
  const allViewIds = APP_VIEW_OPTIONS.map((v) => v.id);
  const adminAccess = isAdminLevel(user);
  const costAccess = canViewCosts(user);
  const filterRestrictedViews = (views: string[]) =>
    views.filter(
      (id) =>
        (adminAccess || !(ADMIN_ONLY_VIEWS as readonly string[]).includes(id)) &&
        (costAccess || !(COST_RESTRICTED_VIEWS as readonly string[]).includes(id))
    );

  if (!user) return ['dashboard'];
  if (adminAccess) {
    return allViewIds;
  }
  if (Array.isArray(user.allowedViews) && user.allowedViews.length > 0) {
    const resolved = user.allowedViews.includes('profile')
      ? [...user.allowedViews]
      : [...user.allowedViews, 'profile'];
    if (
      !resolved.includes('morning_checks') &&
      !(user.quyenHan || []).includes('DENY_MORNING_CHECKS')
    ) {
      resolved.push('morning_checks');
    }
    if (
      costAccess &&
      !resolved.includes('monthly_report') &&
      !(user.quyenHan || []).includes('DENY_MONTHLY_REPORT')
    ) {
      resolved.push('monthly_report');
    }
    return filterRestrictedViews(resolved);
  }
  if (
    user.chucVu === 'Director' ||
    user.chucVu === 'Người quản lý' ||
    user.chucVu === 'Trưởng phòng Kỹ thuật' ||
    user.chucVu === 'Kỹ sư thiết bị' ||
    user.quyenHan?.includes('ALL')
  ) {
    return filterRestrictedViews(allViewIds);
  }
  return filterRestrictedViews([
    'dashboard',
    'my_tasks',
    'morning_checks',
    'profile',
    'equipment',
    'maintenance',
    'inspection_calibration',
    'tools',
    'tickets',
    'projects',
    'spare_parts',
    'documents',
    'energy',
  ]);
}

/**
 * Computes overall progress percentage (0-100) for a project from its WBS tasks or manual override.
 */
export function calculateProjectProgress(project: FacilityProject): number {
  if (project.trangThai === 'Hoàn thành') return 100;
  if (Array.isArray(project.congViec) && project.congViec.length > 0) {
    const total = project.congViec.reduce((sum, task) => {
      const pct = task.trangThai === 'Hoàn thành' ? 100 : Math.min(100, Math.max(0, Number(task.tienDo) || 0));
      return sum + pct;
    }, 0);
    return Math.round(total / project.congViec.length);
  }
  return Math.min(100, Math.max(0, Number(project.tienDoThuCong) || 0));
}

/**
 * Splits a multi-assignee string (e.g. "Nguyễn Văn A, Trần Văn B") into clean unique names.
 */
export function parseAssigneeNames(raw?: string | null): string[] {
  if (!raw || typeof raw !== 'string') return [];
  const parts = raw
    .split(/[,;/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

/**
 * Formats an array of assignee names into a canonical comma-separated string.
 */
export function formatAssigneeNames(names: string[]): string {
  return Array.from(new Set(names.map((n) => n.trim()).filter(Boolean))).join(', ');
}

const PLACEHOLDER_EMAIL_DOMAINS = ['@factory.com', '@example.com', '@test.com', '@demo.com'];

/**
 * Checks whether an email address looks valid in basic syntax.
 */
export function isValidEmailFormat(email?: string | null): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Checks whether an email is a non-deliverable demo/placeholder address (e.g. @factory.com).
 */
export function isPlaceholderEmail(email?: string | null): boolean {
  if (!email || !email.trim()) return true;
  const lower = email.trim().toLowerCase();
  if (!isValidEmailFormat(lower)) return true;
  return PLACEHOLDER_EMAIL_DOMAINS.some((domain) => lower.endsWith(domain));
}

/**
 * Resolves all email addresses for one or multiple assignees.
 */
export function resolveAssigneeEmails(
  rawOrNames: string | string[],
  employees: Employee[],
  fallbackEmail?: string
): string[] {
  const names = Array.isArray(rawOrNames)
    ? Array.from(new Set(rawOrNames.map((n) => n.trim()).filter(Boolean)))
    : parseAssigneeNames(rawOrNames);

  const emails: string[] = [];
  names.forEach((name) => {
    const normalized = name.trim().toLowerCase();
    const match = employees.find(
      (e) =>
        e.tenNhanVien.trim().toLowerCase() === normalized ||
        e.maNhanVien.trim().toLowerCase() === normalized
    );
    if (match?.email && match.email.trim()) {
      emails.push(match.email.trim());
    }
  });

  if (emails.length === 0 && fallbackEmail && fallbackEmail.trim()) {
    emails.push(fallbackEmail.trim());
  }

  return Array.from(new Set(emails));
}

/**
 * Returns detailed email resolution metadata including missing or placeholder (@factory.com) addresses.
 */
export function resolveAssigneeEmailDetails(
  rawOrNames: string | string[],
  employees: Employee[],
  fallbackEmail?: string
): {
  emails: string[];
  resolvedPairs: { name: string; email: string; isPlaceholder: boolean; employeeCode?: string }[];
  missingEmployees: string[];
  placeholderEmployees: { name: string; email: string; employeeCode?: string }[];
  usedFallback: boolean;
} {
  const names = Array.isArray(rawOrNames)
    ? Array.from(new Set(rawOrNames.map((n) => n.trim()).filter(Boolean)))
    : parseAssigneeNames(rawOrNames);

  const emails: string[] = [];
  const resolvedPairs: { name: string; email: string; isPlaceholder: boolean; employeeCode?: string }[] = [];
  const missingEmployees: string[] = [];
  const placeholderEmployees: { name: string; email: string; employeeCode?: string }[] = [];

  names.forEach((name) => {
    const normalized = name.trim().toLowerCase();
    const match = employees.find(
      (e) =>
        e.tenNhanVien.trim().toLowerCase() === normalized ||
        e.maNhanVien.trim().toLowerCase() === normalized
    );
    const email = match?.email?.trim() || '';
    if (email) {
      emails.push(email);
      const placeholder = isPlaceholderEmail(email);
      resolvedPairs.push({
        name: match?.tenNhanVien || name,
        email,
        isPlaceholder: placeholder,
        employeeCode: match?.maNhanVien,
      });
      if (placeholder) {
        placeholderEmployees.push({
          name: match?.tenNhanVien || name,
          email,
          employeeCode: match?.maNhanVien,
        });
      }
    } else {
      missingEmployees.push(match?.tenNhanVien || name);
    }
  });

  let usedFallback = false;
  if (emails.length === 0 && fallbackEmail && fallbackEmail.trim()) {
    emails.push(fallbackEmail.trim());
    usedFallback = true;
  }

  return {
    emails: Array.from(new Set(emails)),
    resolvedPairs,
    missingEmployees,
    placeholderEmployees,
    usedFallback,
  };
}

/**
 * Builds a pre-filled Gmail Web compose URL (safe in iframes via direct <a target="_blank"> click).
 */
export function buildGmailComposeUrl(params: {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}): string {
  const query = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: params.to.trim(),
    su: params.subject,
    body: params.body,
  });
  if (params.cc && params.cc.trim()) {
    query.set('cc', params.cc.trim());
  }
  return `https://mail.google.com/mail/?${query.toString()}`;
}

/**
 * Builds a standard mailto: URI for native desktop/mobile email clients.
 */
export function buildMailtoUrl(params: {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}): string {
  const cleanTo = params.to
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(',');
  const queryParts: string[] = [];
  if (params.cc && params.cc.trim()) {
    queryParts.push(`cc=${encodeURIComponent(params.cc.trim())}`);
  }
  queryParts.push(`subject=${encodeURIComponent(params.subject)}`);
  queryParts.push(`body=${encodeURIComponent(params.body)}`);
  return `mailto:${encodeURIComponent(cleanTo).replace(/%2C/g, ',')}?${queryParts.join('&')}`;
}

/**
 * Checks whether a single or comma-separated assignee field includes the given employee.
 */
export function matchesAssignee(rawField?: string | null, user?: Employee | null): boolean {
  if (!rawField || !user) return false;
  const empName = user.tenNhanVien.trim().toLowerCase();
  const empCode = user.maNhanVien.trim().toLowerCase();
  const names = parseAssigneeNames(rawField);
  if (names.length > 0) {
    return names.some((n) => {
      const lower = n.toLowerCase();
      return lower === empName || lower === empCode || lower.includes(empName);
    });
  }
  const rawLower = rawField.trim().toLowerCase();
  return rawLower === empName || rawLower === empCode;
}

/**
 * Calculates the remaining days until an inspection/calibration due date (negative = overdue).
 */
export function getInspectionDaysRemaining(
  dueDateStr: string,
  referenceDateStr: string = getTodayISODate()
): number {
  if (!dueDateStr) return 999;
  const due = new Date(dueDateStr);
  const ref = new Date(referenceDateStr);
  if (isNaN(due.getTime()) || isNaN(ref.getTime())) return 999;
  const dueMs = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const refMs = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
  return Math.round((dueMs - refMs) / (1000 * 60 * 60 * 24));
}

/**
 * Computes safety inspection / calibration status from expiration date & reminder lead days.
 */
export function getInspectionStatus(
  dueDateStr: string,
  leadDays: number = 30,
  isInProgress: boolean = false,
  referenceDateStr: string = getTodayISODate()
): InspectionStatus {
  if (isInProgress) return 'Đang kiểm định';
  const diff = getInspectionDaysRemaining(dueDateStr, referenceDateStr);
  if (diff < 0) return 'Quá hạn';
  if (diff <= Math.max(1, leadDays)) return 'Sắp đến hạn';
  return 'Còn hạn';
}

/**
 * Calculates next inspection / calibration due date from completion date and cycle.
 */
export function calculateNextInspectionDate(
  baseDateStr: string,
  cycle: InspectionCycle | string
): string {
  if (!baseDateStr) return '';
  const dt = new Date(baseDateStr);
  if (isNaN(dt.getTime())) return baseDateStr;
  const monthsMap: Record<string, number> = {
    '3 tháng': 3,
    '6 tháng': 6,
    '12 tháng': 12,
    '24 tháng': 24,
    '36 tháng': 36,
  };
  const monthsToAdd = monthsMap[cycle] ?? 12;
  dt.setMonth(dt.getMonth() + monthsToAdd);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DEFAULT_MORNING_CHECK_TEMPLATES: MorningCheckTemplatesMap = {
  'Vòng trong': {
    khuVuc: 'Vòng trong',
    tieuDe: 'Kiểm tra đầu ngày khu vực sản xuất & văn phòng (Vòng trong)',
    moTaCongViec:
      '1. Kiểm tra nhiệt độ & độ ẩm khu vực xưởng sản xuất, kho nguyên liệu và phòng sạch qua màn hình AHU/BMS.\n2. Kiểm tra áp suất chênh áp phòng Coating, phòng IQC và trạng thái hoạt động quạt hút/quạt cấp.\n3. Kiểm tra chiếu sáng nhà xưởng, văn phòng tầng 1–2, đèn Exit & cửa thoát hiểm không bị che chắn.\n4. Kiểm tra rò rỉ nước/dầu sàn nhà xưởng, khu vực FCU và nhà vệ sinh sản xuất.',
    hanHoanThanh: '08:30',
    nguoiMacDinh: 'Trương Quang Sơn',
  },
  'Vòng Ngoài': {
    khuVuc: 'Vòng Ngoài',
    tieuDe: 'Kiểm tra đầu ngày khuôn viên ngoài xưởng & trạm phụ (Vòng Ngoài)',
    moTaCongViec:
      '1. Kiểm tra hệ thống bơm nước sinh hoạt (WAT-DBV-01/02), mực nước bể ngầm 200m³ và rò rỉ đường ống cấp thoát nước ngoài trời.\n2. Kiểm tra khu vực trạm xử lý nước thải, đầu ra nước thải DI và hệ thống cống rãnh xung quanh nhà máy.\n3. Kiểm tra tủ điện chiếu sáng ngoài trời, hàng rào an toàn, cổng bảo vệ 1 & 2, hệ thống điều hòa nhà bảo vệ.\n4. Kiểm tra khu vực kho hóa chất, mái che, bảng cảnh báo an toàn & bình chữa cháy vòng ngoài.',
    hanHoanThanh: '08:45',
    nguoiMacDinh: 'Lê Văn Thắng',
  },
  'Phòng Utility': {
    khuVuc: 'Phòng Utility',
    tieuDe: 'Kiểm tra đầu ngày hệ thống trung tâm Phòng Utility',
    moTaCongViec:
      '1. Kiểm tra thông số vận hành Chiller 01, Chiller 02, Mini Chiller: nhiệt độ nước cấp/hồi, áp suất gas, độ rung và tiếng ồn bất thường.\n2. Kiểm tra cụm bơm nước lạnh (CHWP), bơm giải nhiệt (CLWP) và tháp giải nhiệt Cooling Tower 01–02.\n3. Kiểm tra cụm máy nén khí GA90-1/2, GA75-1, máy sấy khí FD220 và áp suất khí nén đường ống chính.\n4. Kiểm tra tủ điện phân phối MSB1–MSB5, nhiệt độ thanh cái, điện áp 3 pha, máy phát điện dự phòng & hệ thống nước DI.',
    hanHoanThanh: '08:30',
    nguoiMacDinh: 'Đỗ Hữu Thịnh, Trương Quang Sơn',
  },
};

export const WEEK_DAYS_MON_SAT = [1, 2, 3, 4, 5, 6] as const;

function parseYmdUtc(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((ymd || '').trim());
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatUtcYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getWeekdayLabelVN(ymd: string): string {
  const d = parseYmdUtc(ymd);
  if (!d) return '';
  const day = d.getUTCDay();
  return day === 0 ? 'CN' : `T${day + 1}`;
}

export function getWeekMonToSatRange(
  offsetWeeks: number = 0,
  referenceDate: Date = new Date()
): { start: string; end: string } {
  const baseUtc = new Date(
    Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  );
  const dow = baseUtc.getUTCDay(); // 0=Sun..6=Sat
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(baseUtc.getTime());
  mon.setUTCDate(baseUtc.getUTCDate() + diffToMon + offsetWeeks * 7);
  const sat = new Date(mon.getTime());
  sat.setUTCDate(mon.getUTCDate() + 5);
  return {
    start: formatUtcYmd(mon),
    end: formatUtcYmd(sat),
  };
}

export function getScheduledDatesForAreaCheck(
  check: Pick<DailyAreaCheck, 'ngayKiemTra' | 'ngayKetThuc' | 'ngayTrongTuan'>
): string[] {
  const start = parseYmdUtc(check.ngayKiemTra);
  if (!start) return check.ngayKiemTra ? [check.ngayKiemTra] : [];
  const endRaw = check.ngayKetThuc ? parseYmdUtc(check.ngayKetThuc) : null;
  if (!endRaw || endRaw.getTime() <= start.getTime()) {
    return [formatUtcYmd(start)];
  }
  const allowedWeekdays =
    Array.isArray(check.ngayTrongTuan) && check.ngayTrongTuan.length > 0
      ? new Set(check.ngayTrongTuan)
      : new Set<number>([1, 2, 3, 4, 5, 6]);
  const dates: string[] = [];
  const cur = new Date(start.getTime());
  let guard = 0;
  while (cur.getTime() <= endRaw.getTime() && guard < 31) {
    if (allowedWeekdays.has(cur.getUTCDay())) {
      dates.push(formatUtcYmd(cur));
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
    guard += 1;
  }
  return dates.length > 0 ? dates : [formatUtcYmd(start)];
}

/**
 * Returns the clamped Solar discount percentage (default 5% off total Solar electricity cost).
 */
export function getSolarDiscountPct(tariff?: Partial<EnergyTariffConfig> | null): number {
  const raw = tariff?.solarDiscountPct;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return DEFAULT_ENERGY_TARIFF_CONFIG.solarDiscountPct;
  }
  return Math.min(100, Math.max(0, raw));
}

/**
 * Calculates EVN grid electricity cost across Normal (BT), Peak (CD), and Off-Peak (TD) tiers.
 */
export function calculateEvnEnergyCost(
  evnBT: number,
  evnCD: number,
  evnTD: number,
  tariff: EnergyTariffConfig
): { costBT: number; costCD: number; costTD: number; total: number } {
  const costBT = (evnBT || 0) * (tariff.evnBT || 0);
  const costCD = (evnCD || 0) * (tariff.evnCD || 0);
  const costTD = (evnTD || 0) * (tariff.evnTD || 0);
  return {
    costBT,
    costCD,
    costTD,
    total: costBT + costCD + costTD,
  };
}

/**
 * Calculates Solar electricity cost based on EVN BT & CD tariffs with the configured discount
 * (default 5% off total Solar cost).
 */
export function calculateSolarEnergyCost(
  solarBT: number,
  solarCD: number,
  tariff: EnergyTariffConfig
): {
  discountPct: number;
  factor: number;
  effectiveRateBT: number;
  effectiveRateCD: number;
  grossBT: number;
  grossCD: number;
  grossTotal: number;
  discountAmount: number;
  costBT: number;
  costCD: number;
  total: number;
} {
  const discountPct = getSolarDiscountPct(tariff);
  const factor = (100 - discountPct) / 100;
  const baseBT = tariff.evnBT || 0;
  const baseCD = tariff.evnCD || 0;
  const grossBT = (solarBT || 0) * baseBT;
  const grossCD = (solarCD || 0) * baseCD;
  const grossTotal = grossBT + grossCD;
  const costBT = grossBT * factor;
  const costCD = grossCD * factor;
  const total = grossTotal * factor;
  const discountAmount = grossTotal - total;

  return {
    discountPct,
    factor,
    effectiveRateBT: baseBT * factor,
    effectiveRateCD: baseCD * factor,
    grossBT,
    grossCD,
    grossTotal,
    discountAmount,
    costBT,
    costCD,
    total,
  };
}

/**
 * Calculates combined EVN + discounted Solar electricity cost for a 10-day power record.
 */
export function calculatePowerRecordCost(
  record: Pick<Power10Days, 'evnBT' | 'evnCD' | 'evnTD' | 'solarBT' | 'solarCD'>,
  tariff: EnergyTariffConfig
): {
  evn: ReturnType<typeof calculateEvnEnergyCost>;
  solar: ReturnType<typeof calculateSolarEnergyCost>;
  totalCost: number;
} {
  const evn = calculateEvnEnergyCost(record.evnBT, record.evnCD, record.evnTD, tariff);
  const solar = calculateSolarEnergyCost(record.solarBT, record.solarCD, tariff);
  return {
    evn,
    solar,
    totalCost: evn.total + solar.total,
  };
}
