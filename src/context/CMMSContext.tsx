import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Unsubscribe } from 'firebase/firestore';
import {
  Equipment,
  MaintenancePlan,
  MaintenanceHistory,
  Ticket,
  SparePart,
  StockTransaction,
  Power10Days,
  CostRecord,
  WaterMonthly,
  Employee,
  MeterReading,
  AuditLog,
  EmailConfig,
  EmailLog,
  EnergyTariffConfig,
  DEFAULT_ENERGY_TARIFF_CONFIG,
  FacilityDocument,
  FacilityProject,
  SafetyInspectionItem,
  InspectionHistoryEntry,
  ToolItem,
  ToolBorrowLog,
  ToolCondition,
  PendingEmailDispatch,
  EmailSendResult,
  AutoEmailServerStatus,
  WebNotificationItem,
  DailyAreaCheck,
  DailyAreaCheckResult,
  DailyAreaCheckStatus,
  DailyAreaDayReport,
  DailyInspectionArea,
  MorningCheckAreaTemplate,
  MorningCheckTemplatesMap,
  MonthlyBoardReportRecord,
  MonthlyBoardReportsStore,
  PurchaseRequest,
  PurchaseRequestStatus,
} from '../types/cmms';
import { buildProfessionalEmailHtml } from '../utils/emailTemplates';
import {
  INITIAL_EQUIPMENT,
  INITIAL_MAINTENANCE_PLANS,
  INITIAL_MAINTENANCE_HISTORY,
  INITIAL_TICKETS,
  INITIAL_SPARE_PARTS,
  INITIAL_STOCK_TRANSACTIONS,
  INITIAL_POWER_10DAYS,
  INITIAL_COST_RECORDS,
  INITIAL_WATER_MONTHLY,
  INITIAL_EMPLOYEES,
  INITIAL_METER_READINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_EMAIL_CONFIG,
  INITIAL_EMAIL_LOGS,
  INITIAL_DOCUMENTS,
  INITIAL_PROJECTS,
  INITIAL_SAFETY_INSPECTIONS,
  INITIAL_TOOLS,
  INITIAL_TOOL_LOGS,
  INITIAL_DAILY_AREA_CHECKS,
  INITIAL_PURCHASE_REQUESTS,
} from '../data/initialData';
import {
  calculateNextMaintenanceDate,
  getMaintenanceStatus,
  applyStockTransaction,
  calculateMeterConsumption,
  syncPlansWithHistory,
  getLatestMaintenanceForEquipment,
  getHistoryWorkType,
  parseAssigneeNames,
  formatAssigneeNames,
  resolveAssigneeEmails,
  getInspectionStatus,
  calculateNextInspectionDate,
  getInspectionDaysRemaining,
  isPlaceholderEmail,
  isValidEmailFormat,
  isAdminLevel,
  canAccessBackup,
  canDeleteRecords,
  canManageMaintenancePlans,
  canViewCosts,
  canAssignWork,
  canApprovePurchaseRequests,
  DEFAULT_MORNING_CHECK_TEMPLATES,
  getScheduledDatesForAreaCheck,
} from '../utils/cmmsLogic';
import {
  GmailAccountInfo,
  clearGmailAccessToken,
  getGmailAccessToken,
  initGmailAuth,
  sendViaGmailApi,
  signInWithGmail,
  signInWithGoogleAccount,
  signOutGmail,
} from '../utils/gmailAuth';
import { auth } from '../utils/firebaseClient';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  WorkspaceSnapshotData,
  buildAllowedEmails,
  deleteCloudDoc,
  formatFirestoreSyncError,
  propagateAllowedEmails,
  sanitizeAuditLog,
  sanitizeCostRecord,
  sanitizeDocument,
  sanitizeEmailLog,
  sanitizeEmployeePrivate,
  sanitizeEmployeePublic,
  sanitizeEmployeeSelfPrivate,
  sanitizeEmployeeSelfPublic,
  sanitizeEquipment,
  sanitizeMaintenanceHistory,
  sanitizeMaintenancePlan,
  sanitizeMeterReading,
  sanitizePower10Days,
  sanitizeProject,
  sanitizeSafetyInspection,
  sanitizeSparePart,
  sanitizeStockTx,
  sanitizeTicket,
  sanitizeToolItem,
  sanitizeToolLog,
  sanitizeWaterMonthly,
  sanitizeDailyAreaCheck,
  sanitizePurchaseRequest,
  WATER_MONTHLY_SEED_VERSION,
  seedOrPushWorkspaceToFirestore,
  subscribeCloudCollection,
  syncAllowedEmailsIfNeeded,
  syncWaterMonthlySeedToFirestoreIfNeeded,
  upsertCloudDoc,
} from '../utils/firestoreSync';

export type CloudSyncStatus = 'offline' | 'connecting' | 'syncing' | 'synced' | 'error';

export interface CloudAccountInfo {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface CMMSContextType {
  // Data
  equipment: Equipment[];
  maintenancePlans: MaintenancePlan[];
  maintenanceHistory: MaintenanceHistory[];
  tickets: Ticket[];
  spareParts: SparePart[];
  stockTransactions: StockTransaction[];
  power10Days: Power10Days[];
  costRecords: CostRecord[];
  waterMonthly: WaterMonthly[];
  employees: Employee[];
  meterReadings: MeterReading[];
  auditLogs: AuditLog[];
  documents: FacilityDocument[];
  projects: FacilityProject[];
  safetyInspections: SafetyInspectionItem[];
  tools: ToolItem[];
  toolLogs: ToolBorrowLog[];
  dailyAreaChecks: DailyAreaCheck[];
  morningCheckTemplates: MorningCheckTemplatesMap;
  monthlyBoardReports: MonthlyBoardReportsStore;
  purchaseRequests: PurchaseRequest[];
  currentUser: Employee;

  // Equipment Actions
  addEquipment: (item: Equipment) => void;
  updateEquipment: (item: Equipment) => void;
  deleteEquipment: (maThietBi: string) => void;

  // Maintenance Actions
  addMaintenancePlan: (plan: MaintenancePlan) => void;
  updateMaintenancePlan: (plan: MaintenancePlan) => void;
  rescheduleMaintenancePlan: (planId: string, newDate: string) => void;
  completeMaintenance: (
    record: Omit<MaintenanceHistory, 'id'>,
    options?: { userConfirmedEmail?: boolean }
  ) => void;
  updateMaintenanceHistory: (record: MaintenanceHistory) => void;
  deleteMaintenanceHistory: (id: string) => void;

  // Safety Inspection & Calibration Actions
  addSafetyInspection: (item: Omit<SafetyInspectionItem, 'id' | 'trangThai'>) => void;
  updateSafetyInspection: (item: SafetyInspectionItem) => void;
  deleteSafetyInspection: (id: string) => void;
  completeSafetyInspection: (params: {
    id: string;
    ngayThucHien: string;
    donViThucHien: string;
    soTemChungNhan: string;
    ketQua: InspectionHistoryEntry['ketQua'];
    ghiChu?: string;
  }) => void;
  triggerInspectionDueAlerts: (
    isAuto?: boolean,
    options?: { userConfirmed?: boolean }
  ) => Promise<{ sentCount: number; dueCount: number; result?: EmailSendResult }>;

  // Tooling & Equipment Kit Actions
  addTool: (tool: Omit<ToolItem, 'id'>) => void;
  updateTool: (tool: ToolItem) => void;
  deleteTool: (id: string) => void;
  recordToolTransaction: (params: {
    toolId: string;
    loaiGiaoDich: ToolBorrowLog['loaiGiaoDich'];
    soLuong: number;
    nguoiMuon: string;
    ngayGiaoDich: string;
    hanTra?: string;
    tinhTrangKhiTra?: ToolCondition;
    ghiChu?: string;
  }) => { success: boolean; message?: string };

  // Purchase Request Actions ("Yêu Cầu Mua Dụng Cụ & Vật Tư")
  addPurchaseRequest: (
    req: Omit<PurchaseRequest, 'id' | 'maPhieu' | 'trangThai' | 'ngayYeuCau' | 'nguoiYeuCau'> & {
      maPhieu?: string;
      ngayYeuCau?: string;
      nguoiYeuCau?: string;
    }
  ) => PurchaseRequest;
  updatePurchaseRequest: (req: PurchaseRequest) => void;
  updatePurchaseRequestStatus: (params: {
    id: string;
    trangThai: PurchaseRequestStatus;
    ghiChuDuyet?: string;
    autoReceiveToInventory?: boolean;
  }) => { success: boolean; message?: string };
  deletePurchaseRequest: (id: string) => void;

  // Ticket Actions
  addTicket: (
    ticket: Omit<Ticket, 'maTicket' | 'ngayTao'>,
    options?: { userConfirmedEmail?: boolean }
  ) => void;
  updateTicket: (ticket: Ticket, options?: { userConfirmedEmail?: boolean }) => void;
  deleteTicket: (maTicket: string) => void;

  // Spare Parts Actions
  addSparePart: (part: SparePart) => void;
  updateSparePart: (part: SparePart) => void;
  deleteSparePart: (maVatTu: string) => void;

  // Stock Actions
  createStockTransaction: (tx: Omit<StockTransaction, 'transId'>) => void;

  // Power & Water Actions
  addPower10DaysRecord: (record: Omit<Power10Days, 'id'>) => void;
  updatePower10DaysRecord: (record: Power10Days) => void;
  deletePower10DaysRecord: (id: string) => void;
  addWaterMonthlyRecord: (record: WaterMonthly) => void;
  updateWaterMonthlyRecord: (record: WaterMonthly) => void;
  deleteWaterMonthlyRecord: (month: string) => void;
  addMeterReading: (reading: Omit<MeterReading, 'id' | 'tieuThu'>) => void;
  addBatchMeterReadings: (readings: Omit<MeterReading, 'id' | 'tieuThu'>[]) => void;
  updateMeterReading: (reading: MeterReading) => void;
  deleteMeterReading: (id: string) => void;

  // Energy Tariff & Exchange Rates
  tariffConfig: EnergyTariffConfig;
  updateTariffConfig: (cfg: Partial<EnergyTariffConfig>) => void;

  // Cost Actions
  addCostRecord: (cost: Omit<CostRecord, 'idChiPhi'>) => void;
  updateCostRecord: (cost: CostRecord) => void;
  deleteCostRecord: (idChiPhi: string) => void;

  // Employee & RBAC Actions
  setCurrentUser: (emp: Employee) => void;
  addEmployee: (emp: Employee) => void;
  updateEmployee: (emp: Employee) => void;

  // Documents / SOPs / Checklists Actions
  addDocument: (doc: Omit<FacilityDocument, 'id'>) => void;
  updateDocument: (doc: FacilityDocument) => void;
  deleteDocument: (id: string) => void;

  // Project Management Actions
  addProject: (project: Omit<FacilityProject, 'id'>) => void;
  updateProject: (project: FacilityProject) => void;
  deleteProject: (id: string) => void;

  // Daily Start-Of-Day Area Checks ("Công Việc Đầu Ngày")
  updateMorningCheckTemplate: (
    area: DailyInspectionArea,
    template: MorningCheckAreaTemplate,
    applyToPendingChecks?: boolean
  ) => void;
  resetMorningCheckTemplates: () => void;
  addDailyAreaCheck: (check: Omit<DailyAreaCheck, 'id'>) => DailyAreaCheck | null;
  updateDailyAreaCheck: (check: DailyAreaCheck) => void;
  submitDailyAreaCheckReport: (params: {
    id: string;
    ngayBaoCao?: string;
    trangThai: DailyAreaCheckStatus;
    ketQua: DailyAreaCheckResult;
    baoCaoThucTe: string;
    anhHienTruong?: string;
    anhDinhKem?: string[];
  }) => void;
  deleteDailyAreaCheck: (id: string) => void;

  // Monthly Executive Board Reports ("Báo Cáo Tháng BGĐ")
  saveMonthlyBoardReport: (
    record: MonthlyBoardReportRecord,
    defaults?: { defaultBoardRecipients?: string; defaultCcRecipients?: string }
  ) => void;
  deleteMonthlyBoardReport: (month: string) => void;

  // Email & Alert Service
  emailConfig: EmailConfig;
  emailLogs: EmailLog[];
  autoEmailServerStatus: AutoEmailServerStatus;
  refreshAutoEmailStatus: () => Promise<void>;
  gmailUser: GmailAccountInfo | null;
  isGmailConnected: boolean;
  connectGmail: (forceConsent?: boolean) => Promise<{
    success: boolean;
    email?: string;
    message: string;
  }>;
  disconnectGmail: () => Promise<void>;
  pendingEmailDispatch: PendingEmailDispatch | null;
  openEmailDispatchModal: (draft: PendingEmailDispatch) => void;
  closeEmailDispatchModal: () => void;
  markEmailDispatchStatus: (
    logId: string,
    status: EmailLog['status'],
    updatedFields?: { to?: string; cc?: string; subject?: string; body?: string }
  ) => void;
  updateEmailConfig: (cfg: Partial<EmailConfig>) => void;
  sendEmailNotification: (params: {
    type: EmailLog['type'];
    subject: string;
    body: string;
    recipient?: string;
    cc?: string;
    relatedId?: string;
    interactiveFallback?: boolean;
    webhookUrlOverride?: string;
    userConfirmed?: boolean;
    allowDuplicate?: boolean;
  }) => Promise<EmailSendResult>;
  triggerMaintenanceDueAlerts: (options?: { userConfirmed?: boolean }) => Promise<{
    sentCount: number;
    dueCount: number;
    result?: EmailSendResult;
  }>;
  deleteEmailLog: (id: string) => void;
  clearEmailLogs: () => void;

  // Free Web Notification Service (0đ)
  webNotifications: WebNotificationItem[];
  activeWebToast: WebNotificationItem | null;
  browserNotificationPermission: NotificationPermission | 'unsupported';
  requestBrowserNotificationPermission: () => Promise<NotificationPermission | 'unsupported'>;
  triggerWebNotification: (params: {
    type: EmailLog['type'];
    title: string;
    message: string;
    relatedId?: string;
    targetTab?: string;
  }) => WebNotificationItem;
  markWebNotificationRead: (id: string) => void;
  markAllWebNotificationsRead: () => void;
  clearWebNotifications: () => void;
  dismissActiveWebToast: () => void;

  // Theme & Appearance
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;

  // Authentication & Login
  isAuthenticated: boolean;
  login: (username: string, password?: string) => { success: boolean; message?: string };
  changePassword: (
    username: string,
    currentPassword: string,
    newPassword: string
  ) => { success: boolean; message: string };
  logout: () => void;

  // Work Assignment & Completion Reporting
  assignWorkAndNotify: (params: {
    module: 'THIET_BI' | 'KE_HOACH_BAO_TRI' | 'TICKET';
    targetId: string;
    targetName: string;
    assigneeName: string;
    assigneeNames?: string[];
    assignerName: string;
    note?: string;
    sendEmail?: boolean;
    recipientEmailOverride?: string;
    saveEmailToProfile?: boolean;
  }) => Promise<EmailSendResult | null>;
  notifyCompletionReport: (params: {
    module: 'BAO_TRI' | 'TICKET';
    targetId: string;
    targetName: string;
    reporterName: string;
    assignerName?: string;
    result: string;
    details?: string;
    userConfirmed?: boolean;
  }) => Promise<void>;

  // Cloud Real-Time Synchronization
  cloudSyncStatus: CloudSyncStatus;
  cloudUser: CloudAccountInfo | null;
  cloudSyncError: string | null;
  lastSyncedAt: string | null;
  connectCloudWithGoogle: () => Promise<{ success: boolean; message: string }>;
  disconnectCloud: () => Promise<void>;
  forceSyncLocalToCloud: () => Promise<{ success: boolean; message: string }>;

  // System Actions
  addAuditLog: (
    action: AuditLog['hanhDong'],
    chucNang: string,
    doiTuong: string,
    details: string,
    actorOverride?: Employee
  ) => void;
  resetToDefaultData: () => void;
  exportDatabaseJSON: () => void;
  restoreFullBackup: (data: any) => boolean;
}

const CMMSContext = createContext<CMMSContextType | undefined>(undefined);

const CMMS_DATA_VERSION = 'v18_calendar_dnd_inspection_tools';

let uniqueIdCounter = 0;

function nextUniqueId(prefix: string): string {
  uniqueIdCounter += 1;
  return `${prefix}-${Date.now()}-${uniqueIdCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

function deduplicateById<T extends { id: string }>(items: T[], prefix: string): T[] {
  const seen = new Set<string>();
  return items.map((item) => {
    const rawId = item.id || nextUniqueId(prefix);
    if (!seen.has(rawId)) {
      seen.add(rawId);
      return item.id ? item : { ...item, id: rawId };
    }
    const fixedId = nextUniqueId(prefix);
    seen.add(fixedId);
    return { ...item, id: fixedId };
  });
}

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const currentVer = localStorage.getItem('cmms_data_version');
    if (currentVer !== CMMS_DATA_VERSION) {
      return fallback;
    }
    const item = localStorage.getItem(`cmms_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(`cmms_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e);
  }
}

export const CMMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('cmms_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('cmms_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
  };

  const [equipment, setEquipment] = useState<Equipment[]>(() => loadStorage('equipment', INITIAL_EQUIPMENT));
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>(() => loadStorage('plans', INITIAL_MAINTENANCE_PLANS));
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceHistory[]>(() => loadStorage('history', INITIAL_MAINTENANCE_HISTORY));
  const [tickets, setTickets] = useState<Ticket[]>(() => loadStorage('tickets', INITIAL_TICKETS));
  const [spareParts, setSpareParts] = useState<SparePart[]>(() => loadStorage('spareParts', INITIAL_SPARE_PARTS));
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(() => loadStorage('stockTransactions', INITIAL_STOCK_TRANSACTIONS));
  const [power10Days, setPower10Days] = useState<Power10Days[]>(() => loadStorage('power10Days', INITIAL_POWER_10DAYS));
  const [costRecords, setCostRecords] = useState<CostRecord[]>(() => loadStorage('costRecords', INITIAL_COST_RECORDS));
  const [waterMonthly, setWaterMonthly] = useState<WaterMonthly[]>(() => {
    try {
      const seedVer = localStorage.getItem('cmms_water_monthly_seed_version');
      if (seedVer !== WATER_MONTHLY_SEED_VERSION) {
        localStorage.setItem('cmms_water_monthly_seed_version', WATER_MONTHLY_SEED_VERSION);
        return INITIAL_WATER_MONTHLY;
      }
    } catch {
      // ignore localStorage access error
    }
    return loadStorage('waterMonthly', INITIAL_WATER_MONTHLY);
  });
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const loaded = loadStorage('employees', INITIAL_EMPLOYEES);
    const initByCode = new Map(
      INITIAL_EMPLOYEES.map((e) => [e.maNhanVien.trim().toUpperCase(), e])
    );
    const hydrated = loaded.map((emp) => {
      const initEmp = initByCode.get(emp.maNhanVien.trim().toUpperCase());
      if (!initEmp) return emp;
      return {
        ...initEmp,
        ...emp,
        ngayNghiPhepNam: emp.ngayNghiPhepNam ?? initEmp.ngayNghiPhepNam,
        ngayNghiPhepDaDung: emp.ngayNghiPhepDaDung ?? initEmp.ngayNghiPhepDaDung,
      };
    });
    const missing = INITIAL_EMPLOYEES.filter(
      (initEmp) =>
        !hydrated.some(
          (e) => e.maNhanVien.trim().toUpperCase() === initEmp.maNhanVien.trim().toUpperCase()
        )
    );
    return missing.length > 0 ? [...hydrated, ...missing] : hydrated;
  });
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>(() => loadStorage('meterReadings', INITIAL_METER_READINGS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    deduplicateById(loadStorage('auditLogs', INITIAL_AUDIT_LOGS), 'LOG')
  );
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => {
    const loaded = loadStorage('emailConfig', INITIAL_EMAIL_CONFIG);
    const merged: EmailConfig = {
      ...INITIAL_EMAIL_CONFIG,
      ...loaded,
    };
    if (merged.senderName === 'Hệ Thống Quản Lý Bảo Trì CMMS PRO') {
      merged.senderName = 'Hệ Thống Quản Lý FACILITY SYSTEM MANAGEMENT';
    }
    return merged;
  });
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() =>
    deduplicateById(loadStorage('emailLogs', INITIAL_EMAIL_LOGS), 'EML')
  );
  const [webNotifications, setWebNotifications] = useState<WebNotificationItem[]>(() =>
    deduplicateById(loadStorage('webNotifications', [] as WebNotificationItem[]), 'WNF')
  );
  const [activeWebToast, setActiveWebToast] = useState<WebNotificationItem | null>(null);
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return window.Notification.permission;
  });
  const [pendingEmailDispatch, setPendingEmailDispatch] = useState<PendingEmailDispatch | null>(null);
  const [gmailUser, setGmailUser] = useState<GmailAccountInfo | null>(null);
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [autoEmailServerStatus, setAutoEmailServerStatus] = useState<AutoEmailServerStatus>({
    smtpConfigured: false,
    resendConfigured: false,
    envWebhookConfigured: false,
    smtpUser: '',
    activeChannels: [],
    loaded: false,
  });

  const refreshAutoEmailStatus = async () => {
    try {
      const res = await fetch('/api/email-status');
      if (res.ok) {
        const data = (await res.json()) as Omit<AutoEmailServerStatus, 'loaded'>;
        setAutoEmailServerStatus({ ...data, loaded: true });
        return;
      }
    } catch {
      // Static fallback or server starting
    }
    setAutoEmailServerStatus((prev) => ({ ...prev, loaded: true }));
  };

  useEffect(() => {
    void refreshAutoEmailStatus();
    const unsub = initGmailAuth(
      (user, token) => {
        setGmailUser({
          email: user.email || '',
          displayName: user.displayName || user.email || 'Google User',
          photoURL: user.photoURL || undefined,
        });
        setIsGmailConnected(Boolean(token));
      },
      (user) => {
        const emailLower = (user?.email || '').trim().toLowerCase();
        if (user && emailLower === BOOTSTRAPPED_ADMIN_EMAIL) {
          setGmailUser({
            email: user.email || '',
            displayName: user.displayName || user.email || 'Google User',
            photoURL: user.photoURL || undefined,
          });
        } else {
          setGmailUser(null);
        }
        setIsGmailConnected(false);
      }
    );
    return () => unsub();
  }, []);

  const connectGmail = async (
    forceConsent: boolean = false
  ): Promise<{
    success: boolean;
    email?: string;
    message: string;
  }> => {
    if (!isAdminLevel(currentUserRef.current)) {
      return {
        success: false,
        message: `Hệ thống chỉ dùng 1 tài khoản Admin (${BOOTSTRAPPED_ADMIN_EMAIL}) để gửi email & sao lưu Cloud. Nhân viên không cần đăng nhập Gmail cá nhân; vui lòng nhờ Admin bật SMTP hoặc Webhook dùng chung.`,
      };
    }
    try {
      const { user, accessToken } = await signInWithGmail(forceConsent);
      const email = (user.email || '').trim();
      if (email.toLowerCase() !== BOOTSTRAPPED_ADMIN_EMAIL) {
        await signOutGmail();
        setGmailUser(null);
        setIsGmailConnected(false);
        return {
          success: false,
          message: `Hệ thống chỉ cho phép dùng 1 tài khoản Admin (${BOOTSTRAPPED_ADMIN_EMAIL}) để gửi email & sao lưu dữ liệu (tài khoản vừa chọn: ${email || 'Không rõ'}).`,
        };
      }
      setGmailUser({
        email,
        displayName: user.displayName || email || 'Google User',
        photoURL: user.photoURL || undefined,
      });
      setIsGmailConnected(Boolean(accessToken));
      return {
        success: true,
        email,
        message: `Đã kết nối Gmail Admin (${email}) sẵn sàng gửi email tự động!`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể kết nối Gmail.';
      return { success: false, message: msg };
    }
  };

  const disconnectGmail = async (): Promise<void> => {
    await signOutGmail();
    setGmailUser(null);
    setIsGmailConnected(false);
  };
  const [tariffConfig, setTariffConfig] = useState<EnergyTariffConfig>(() => ({
    ...DEFAULT_ENERGY_TARIFF_CONFIG,
    ...loadStorage<Partial<EnergyTariffConfig>>('tariffConfig', DEFAULT_ENERGY_TARIFF_CONFIG),
  }));
  const [documents, setDocuments] = useState<FacilityDocument[]>(() => loadStorage('documents', INITIAL_DOCUMENTS));
  const [projects, setProjects] = useState<FacilityProject[]>(() => loadStorage('projects', INITIAL_PROJECTS));
  const [safetyInspections, setSafetyInspections] = useState<SafetyInspectionItem[]>(() =>
    loadStorage('safetyInspections', INITIAL_SAFETY_INSPECTIONS).map((item) => ({
      ...item,
      trangThai: getInspectionStatus(
        item.ngayHetHan,
        item.nhacTruocNgay ?? 30,
        item.trangThai === 'Đang kiểm định'
      ),
    }))
  );
  const [tools, setTools] = useState<ToolItem[]>(() => loadStorage('tools', INITIAL_TOOLS));
  const [toolLogs, setToolLogs] = useState<ToolBorrowLog[]>(() => loadStorage('toolLogs', INITIAL_TOOL_LOGS));
  const [dailyAreaChecks, setDailyAreaChecks] = useState<DailyAreaCheck[]>(() =>
    loadStorage('dailyAreaChecks', INITIAL_DAILY_AREA_CHECKS)
  );
  const [morningCheckTemplates, setMorningCheckTemplates] = useState<MorningCheckTemplatesMap>(() => ({
    ...DEFAULT_MORNING_CHECK_TEMPLATES,
    ...loadStorage<Partial<MorningCheckTemplatesMap>>('morningCheckTemplates', {}),
  }));
  const [monthlyBoardReports, setMonthlyBoardReports] = useState<MonthlyBoardReportsStore>(() => {
    const saved = loadStorage<Partial<MonthlyBoardReportsStore>>('monthlyBoardReports', {});
    return {
      defaultBoardRecipients: typeof saved.defaultBoardRecipients === 'string' ? saved.defaultBoardRecipients : '',
      defaultCcRecipients: typeof saved.defaultCcRecipients === 'string' ? saved.defaultCcRecipients : '',
      reportsByMonth:
        saved.reportsByMonth && typeof saved.reportsByMonth === 'object' ? saved.reportsByMonth : {},
    };
  });
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() =>
    deduplicateById(loadStorage('purchaseRequests', INITIAL_PURCHASE_REQUESTS), 'PR')
  );

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cmms_authenticated') === 'true';
  });

  const [currentUser, setCurrentUserState] = useState<Employee>(() => {
    const authCode =
      typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('cmms_auth_user')?.trim().toUpperCase()
        : '';
    if (authCode) {
      const empList = loadStorage<Employee[]>('employees', INITIAL_EMPLOYEES);
      const matched = empList.find((e) => e.maNhanVien.trim().toUpperCase() === authCode);
      if (matched) return matched;
    }
    const saved = loadStorage<Employee | null>('currentUser', null);
    return saved && saved.maNhanVien ? saved : INITIAL_EMPLOYEES[0];
  });

  // Cloud Sync State & Refs
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('offline');
  const [cloudUser, setCloudUser] = useState<CloudAccountInfo | null>(null);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const cloudUserRef = useRef<CloudAccountInfo | null>(null);
  const knownCloudIdsRef = useRef<Set<string>>(new Set());
  const employeesRef = useRef<Employee[]>(employees);
  const currentUserRef = useRef<Employee>(currentUser);
  const cloudEmpPublicRef = useRef<Record<string, Partial<Employee>>>({});
  const cloudEmpPrivateRef = useRef<Record<string, Partial<Employee>>>({});
  const workspaceReadyRef = useRef<boolean>(false);
  const inFlightEmailSignaturesRef = useRef<Set<string>>(new Set());
  const autoInspectionCheckedDateRef = useRef<string>('');
  const pendingGoogleLoginAuditRef = useRef<boolean>(false);

  const applyCurrentUser = (nextUser: Employee, persistSession = false) => {
    currentUserRef.current = nextUser;
    setCurrentUserState(nextUser);
    saveStorage('currentUser', nextUser);
    if (persistSession) {
      sessionStorage.setItem('cmms_authenticated', 'true');
      sessionStorage.setItem('cmms_auth_user', nextUser.maNhanVien);
    }
  };

  useEffect(() => {
    employeesRef.current = employees;
  }, [employees]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const latestSnapshotRef = useRef<WorkspaceSnapshotData>({
    equipment,
    maintenancePlans,
    maintenanceHistory,
    tickets,
    spareParts,
    stockTransactions,
    power10Days,
    waterMonthly,
    meterReadings,
    costRecords,
    employees,
    documents,
    projects,
    safetyInspections,
    tools,
    toolLogs,
    dailyAreaChecks,
    morningCheckTemplates,
    monthlyBoardReports,
    purchaseRequests,
    emailLogs,
    auditLogs,
    emailConfig,
    tariffConfig,
  });

  useEffect(() => {
    latestSnapshotRef.current = {
      equipment,
      maintenancePlans,
      maintenanceHistory,
      tickets,
      spareParts,
      stockTransactions,
      power10Days,
      waterMonthly,
      meterReadings,
      costRecords,
      employees,
      documents,
      projects,
      safetyInspections,
      tools,
      toolLogs,
      dailyAreaChecks,
      morningCheckTemplates,
      monthlyBoardReports,
      purchaseRequests,
      emailLogs,
      auditLogs,
      emailConfig,
      tariffConfig,
    };
  }, [
    equipment,
    maintenancePlans,
    maintenanceHistory,
    tickets,
    spareParts,
    stockTransactions,
    power10Days,
    waterMonthly,
    meterReadings,
    costRecords,
    employees,
    documents,
    projects,
    safetyInspections,
    tools,
    toolLogs,
    dailyAreaChecks,
    morningCheckTemplates,
    monthlyBoardReports,
    purchaseRequests,
    emailLogs,
    auditLogs,
    emailConfig,
    tariffConfig,
  ]);

  const syncDoc = (
    colName: string,
    rawId: string,
    sanitizedData: Record<string, unknown>,
    employeesOverride?: Employee[]
  ) => {
    const user = cloudUserRef.current;
    if (!user) return;
    const allowed = buildAllowedEmails(employeesOverride || employeesRef.current, user.email);
    void upsertCloudDoc(
      colName,
      rawId,
      sanitizedData,
      user.uid,
      allowed,
      knownCloudIdsRef.current
    )
      .then(() => {
        setLastSyncedAt(new Date().toLocaleTimeString('vi-VN'));
        setCloudSyncError(null);
        setCloudSyncStatus('synced');
      })
      .catch((err) => {
        setCloudSyncError(formatFirestoreSyncError(err));
        setCloudSyncStatus('error');
      });
  };

  const removeDocCloud = (colName: string, rawId: string) => {
    if (!cloudUserRef.current) return;
    void deleteCloudDoc(colName, rawId, knownCloudIdsRef.current)
      .then(() => {
        setLastSyncedAt(new Date().toLocaleTimeString('vi-VN'));
        setCloudSyncError(null);
        setCloudSyncStatus('synced');
      })
      .catch((err) => {
        setCloudSyncError(formatFirestoreSyncError(err));
        setCloudSyncStatus('error');
      });
  };

  const mergeAndApplyEmployees = () => {
    const pubEntries = Object.values(cloudEmpPublicRef.current);
    if (pubEntries.length === 0) return;

    const prevById = new Map(employeesRef.current.map((e) => [e.maNhanVien, e]));
    const initById = new Map(INITIAL_EMPLOYEES.map((e) => [e.maNhanVien, e]));

    const merged = pubEntries.map((pub) => {
      const id = pub.maNhanVien || '';
      const fallback = prevById.get(id) || initById.get(id);
      const priv = cloudEmpPrivateRef.current[id];
      return {
        ...(fallback || {
          maNhanVien: id,
          tenNhanVien: pub.tenNhanVien || id,
          date: '',
          chucVu: pub.chucVu || 'Kỹ thuật viên',
          ngayVao: '',
          soDienThoai: '',
          email: '',
          username: pub.username || id,
        }),
        ...pub,
        ...(priv || {}),
        email: priv?.email !== undefined ? priv.email : fallback?.email || '',
        soDienThoai: priv?.soDienThoai !== undefined ? priv.soDienThoai : fallback?.soDienThoai || '',
        password: fallback?.password,
      } as Employee;
    });

    const sorted = merged.sort((a, b) => a.maNhanVien.localeCompare(b.maNhanVien));
    setEmployees(sorted);

    const activeCode = currentUserRef.current?.maNhanVien;
    if (activeCode) {
      const refreshedCurrent = sorted.find((e) => e.maNhanVien === activeCode);
      if (refreshedCurrent) {
        applyCurrentUser(refreshedCurrent, false);
      }
    }
  };

  const matchOrApplyCloudUser = (fbUser: User, recordLoginAudit = false): boolean => {
    const emailLower = (fbUser.email || '').trim().toLowerCase();
    if (!emailLower) return false;

    const list = employeesRef.current;
    const matched =
      list.find((e) => (e.email || '').trim().toLowerCase() === emailLower) ||
      (emailLower === BOOTSTRAPPED_ADMIN_EMAIL
        ? list.find((e) => e.maNhanVien === 'ID1460' || e.chucVu === 'Admin') || INITIAL_EMPLOYEES[0]
        : undefined);

    if (!matched) {
      return false;
    }

    const prevCode = currentUserRef.current?.maNhanVien;
    const wasAuthed = sessionStorage.getItem('cmms_authenticated') === 'true';
    applyCurrentUser(matched, true);
    setIsAuthenticated(true);
    if (recordLoginAudit && (!wasAuthed || prevCode !== matched.maNhanVien)) {
      addAuditLog(
        'Đăng nhập',
        'Hệ thống',
        matched.maNhanVien,
        `Người dùng ${matched.tenNhanVien} (${matched.maNhanVien} - ${matched.chucVu}) đăng nhập bằng Google thành công`,
        matched
      );
    }
    return true;
  };

  useEffect(() => {
    let unsubs: Unsubscribe[] = [];
    let cancelled = false;

    const cleanupListeners = () => {
      unsubs.forEach((u) => {
        try {
          u();
        } catch {
          // ignore
        }
      });
      unsubs = [];
    };

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      cleanupListeners();

      if (!fbUser || !fbUser.email) {
        cloudUserRef.current = null;
        workspaceReadyRef.current = false;
        setCloudUser(null);
        setCloudSyncStatus('offline');
        setCloudSyncError(null);
        return;
      }

      const emailLower = fbUser.email.trim().toLowerCase();
      const isBootAdmin = emailLower === BOOTSTRAPPED_ADMIN_EMAIL;
      const isAuthorizedInList =
        isBootAdmin ||
        employeesRef.current.some((e) => (e.email || '').trim().toLowerCase() === emailLower);

      if (!isAuthorizedInList) {
        cloudUserRef.current = null;
        workspaceReadyRef.current = false;
        setCloudUser(null);
        // Clear unauthorized cached Google session so internal users never get stuck with Cloud permission errors
        void signOutGmail();
        if (sessionStorage.getItem('cmms_authenticated') === 'true') {
          setCloudSyncStatus('offline');
          setCloudSyncError(null);
        } else {
          setCloudSyncStatus('error');
          setCloudSyncError(
            `Tài khoản Google (${fbUser.email}) chưa được cấp quyền Cloud. Chỉ tài khoản Admin (${BOOTSTRAPPED_ADMIN_EMAIL}) dùng để đồng bộ Cloud; nhân viên vui lòng đăng nhập bằng Mã nhân viên & Mật khẩu bên dưới.`
          );
        }
        return;
      }

      const info: CloudAccountInfo = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email,
        photoURL: fbUser.photoURL || undefined,
      };
      cloudUserRef.current = info;
      setCloudUser(info);
      setCloudSyncStatus('syncing');
      setCloudSyncError(null);

      const wasAuthed = sessionStorage.getItem('cmms_authenticated') === 'true';
      const shouldAuditGoogleLogin = pendingGoogleLoginAuditRef.current || !wasAuthed;
      pendingGoogleLoginAuditRef.current = false;
      if (!wasAuthed || isBootAdmin) {
        matchOrApplyCloudUser(fbUser, shouldAuditGoogleLogin);
      }

      if (isBootAdmin) {
        try {
          await seedOrPushWorkspaceToFirestore(
            fbUser.uid,
            fbUser.email,
            latestSnapshotRef.current,
            { knownCloudIds: knownCloudIdsRef.current }
          );
          await syncAllowedEmailsIfNeeded(
            fbUser.uid,
            fbUser.email,
            latestSnapshotRef.current.employees,
            knownCloudIdsRef.current
          );
          const waterSeedUpdated = await syncWaterMonthlySeedToFirestoreIfNeeded(
            fbUser.uid,
            fbUser.email,
            INITIAL_WATER_MONTHLY,
            latestSnapshotRef.current.employees,
            knownCloudIdsRef.current
          );
          if (waterSeedUpdated && !cancelled) {
            setWaterMonthly([...INITIAL_WATER_MONTHLY].sort((a, b) => b.month.localeCompare(a.month)));
          }
          if (cancelled) return;
          workspaceReadyRef.current = true;
        } catch (err) {
          if (cancelled) return;
          setCloudSyncError(formatFirestoreSyncError(err));
          setCloudSyncStatus('error');
        }
      }

      if (cancelled) return;

      const onSnapError = (err: Error) => {
        const msg = formatFirestoreSyncError(err);
        if (
          !isBootAdmin &&
          !canAccessBackup(currentUserRef.current) &&
          /chưa được cấp quyền|permission-denied/i.test(msg)
        ) {
          // Regular employee using internal account should not be blocked by stale Google cache
          cleanupListeners();
          cloudUserRef.current = null;
          setCloudUser(null);
          setCloudSyncStatus('offline');
          setCloudSyncError(null);
          void signOutGmail();
          return;
        }
        setCloudSyncError(msg);
        setCloudSyncStatus('error');
      };

      const markSynced = (paths: string[]) => {
        paths.forEach((p) => knownCloudIdsRef.current.add(p));
        setLastSyncedAt(new Date().toLocaleTimeString('vi-VN'));
        setCloudSyncStatus('synced');
        setCloudSyncError(null);
      };

      unsubs = [
        subscribeCloudCollection<{ key: string; payload: Record<string, unknown> }>(
          'settings',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            for (const s of items) {
              if (s.key === 'workspace_meta') {
                workspaceReadyRef.current = true;
              } else if (s.key === 'email_config' && s.payload) {
                setEmailConfig((prev) => ({
                  ...INITIAL_EMAIL_CONFIG,
                  ...prev,
                  ...(s.payload as Partial<EmailConfig>),
                }));
              } else if (s.key === 'tariff_config' && s.payload) {
                setTariffConfig((prev) => ({
                  ...DEFAULT_ENERGY_TARIFF_CONFIG,
                  ...prev,
                  ...(s.payload as Partial<EnergyTariffConfig>),
                }));
              } else if (s.key === 'morning_check_templates' && s.payload) {
                setMorningCheckTemplates((prev) => ({
                  ...DEFAULT_MORNING_CHECK_TEMPLATES,
                  ...prev,
                  ...(s.payload as Partial<MorningCheckTemplatesMap>),
                }));
              } else if (s.key === 'monthly_board_reports' && s.payload) {
                const incomingStore = s.payload as Partial<MonthlyBoardReportsStore>;
                setMonthlyBoardReports((prev) => ({
                  defaultBoardRecipients:
                    typeof incomingStore.defaultBoardRecipients === 'string'
                      ? incomingStore.defaultBoardRecipients
                      : prev.defaultBoardRecipients,
                  defaultCcRecipients:
                    typeof incomingStore.defaultCcRecipients === 'string'
                      ? incomingStore.defaultCcRecipients
                      : prev.defaultCcRecipients,
                  reportsByMonth:
                    incomingStore.reportsByMonth && typeof incomingStore.reportsByMonth === 'object'
                      ? incomingStore.reportsByMonth
                      : prev.reportsByMonth,
                }));
              }
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<Equipment>(
          'equipment',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setEquipment([...items].sort((a, b) => a.maThietBi.localeCompare(b.maThietBi)));
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<MaintenancePlan>(
          'maintenance_plans',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setMaintenancePlans(
                [...items].sort((a, b) =>
                  (a.ngayBaoTriTiepTheo || '').localeCompare(b.ngayBaoTriTiepTheo || '')
                )
              );
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<MaintenanceHistory>(
          'maintenance_history',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setMaintenanceHistory(
                [...items].sort((a, b) => (b.ngayThucHien || '').localeCompare(a.ngayThucHien || ''))
              );
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<Ticket>(
          'tickets',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setTickets(
                [...items].sort((a, b) => (b.ngayTao || '').localeCompare(a.ngayTao || ''))
              );
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<SparePart>(
          'spare_parts',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setSpareParts([...items].sort((a, b) => a.maVatTu.localeCompare(b.maVatTu)));
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<StockTransaction>(
          'stock_transactions',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setStockTransactions(
                [...items].sort((a, b) => (b.ngay || '').localeCompare(a.ngay || ''))
              );
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<Power10Days>(
          'power_10days',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setPower10Days(
                [...items].sort((a, b) => (b.tuNgay || '').localeCompare(a.tuNgay || ''))
              );
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<WaterMonthly>(
          'water_monthly',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setWaterMonthly([...items].sort((a, b) => b.month.localeCompare(a.month)));
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<MeterReading>(
          'meter_readings',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setMeterReadings(
                [...items].sort((a, b) => (b.ngayChot || '').localeCompare(a.ngayChot || ''))
              );
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<CostRecord>(
          'cost_records',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setCostRecords(
                [...items].sort((a, b) => (b.ngayGhiNhan || '').localeCompare(a.ngayGhiNhan || ''))
              );
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<Partial<Employee>>(
          'employees_public',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            const map: Record<string, Partial<Employee>> = {};
            items.forEach((emp) => {
              if (emp.maNhanVien) map[emp.maNhanVien] = emp;
            });
            cloudEmpPublicRef.current = map;
            mergeAndApplyEmployees();
          },
          onSnapError
        ),
        subscribeCloudCollection<Partial<Employee>>(
          'employees_private',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            const map: Record<string, Partial<Employee>> = {};
            items.forEach((emp) => {
              if (emp.maNhanVien) map[emp.maNhanVien] = emp;
            });
            cloudEmpPrivateRef.current = map;
            mergeAndApplyEmployees();
          },
          onSnapError,
          'private_employee'
        ),
        subscribeCloudCollection<FacilityDocument>(
          'documents',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setDocuments([...items].sort((a, b) => a.maTaiLieu.localeCompare(b.maTaiLieu)));
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<FacilityProject>(
          'projects',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setProjects(
                [...items].sort((a, b) => (b.ngayCapNhat || '').localeCompare(a.ngayCapNhat || ''))
              );
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<SafetyInspectionItem>(
          'safety_inspections',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setSafetyInspections(
                items.map((item) => ({
                  ...item,
                  trangThai: getInspectionStatus(
                    item.ngayHetHan,
                    item.nhacTruocNgay ?? 30,
                    item.trangThai === 'Đang kiểm định'
                  ),
                }))
              );
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<ToolItem>(
          'tools',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setTools([...items].sort((a, b) => a.maDungCu.localeCompare(b.maDungCu)));
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<ToolBorrowLog>(
          'tool_logs',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setToolLogs(
                [...items].sort((a, b) =>
                  (b.ngayGiaoDich || '').localeCompare(a.ngayGiaoDich || '')
                )
              );
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<DailyAreaCheck>(
          'daily_area_checks',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setDailyAreaChecks(
                [...items].sort((a, b) =>
                  (b.ngayKiemTra || '').localeCompare(a.ngayKiemTra || '')
                )
              );
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<PurchaseRequest>(
          'purchase_requests',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setPurchaseRequests(
                [...items].sort((a, b) =>
                  (b.ngayYeuCau || '').localeCompare(a.ngayYeuCau || '')
                )
              );
            }
          },
          onSnapError
        ),
        subscribeCloudCollection<EmailLog>(
          'email_logs',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setEmailLogs(
                deduplicateById(
                  [...items].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')),
                  'EML'
                )
              );
            }
          },
          onSnapError,
          'email_log'
        ),
        subscribeCloudCollection<AuditLog>(
          'audit_logs',
          fbUser.email,
          fbUser.uid,
          (items, paths) => {
            markSynced(paths);
            if (items.length > 0 || workspaceReadyRef.current) {
              setAuditLogs(
                deduplicateById(
                  [...items].sort((a, b) => (b.thoiGian || '').localeCompare(a.thoiGian || '')),
                  'LOG'
                )
              );
            }
          },
          onSnapError
        ),
      ];
    });

    return () => {
      cancelled = true;
      unsubAuth();
      cleanupListeners();
    };
  }, []);

  const connectCloudWithGoogle = async (): Promise<{ success: boolean; message: string }> => {
    setCloudSyncStatus('connecting');
    setCloudSyncError(null);
    pendingGoogleLoginAuditRef.current = true;
    try {
      const { user } = await signInWithGoogleAccount();
      const emailLower = (user.email || '').trim().toLowerCase();
      const isAuthorized =
        emailLower === BOOTSTRAPPED_ADMIN_EMAIL ||
        employeesRef.current.some((e) => (e.email || '').trim().toLowerCase() === emailLower);
      if (!isAuthorized) {
        pendingGoogleLoginAuditRef.current = false;
        await signOutGmail();
        const msg = `Tài khoản Google (${user.email || ''}) không phải Admin (${BOOTSTRAPPED_ADMIN_EMAIL}) và chưa được cấp quyền Cloud. Vui lòng đăng nhập bằng tài khoản Admin (${BOOTSTRAPPED_ADMIN_EMAIL}).`;
        setCloudSyncStatus('error');
        setCloudSyncError(msg);
        return { success: false, message: msg };
      }
      return {
        success: true,
        message: `Đã kết nối đồng bộ Cloud (${user.email}) thành công!`,
      };
    } catch (err) {
      pendingGoogleLoginAuditRef.current = false;
      const msg = formatFirestoreSyncError(err);
      setCloudSyncError(msg);
      setCloudSyncStatus(cloudUserRef.current ? 'error' : 'offline');
      return { success: false, message: msg };
    }
  };

  const disconnectCloud = async (): Promise<void> => {
    await signOutGmail();
    cloudUserRef.current = null;
    workspaceReadyRef.current = false;
    setCloudUser(null);
    setCloudSyncStatus('offline');
    setCloudSyncError(null);
  };

  const forceSyncLocalToCloud = async (): Promise<{ success: boolean; message: string }> => {
    const user = cloudUserRef.current;
    if (!user) {
      return {
        success: false,
        message: 'Vui lòng kết nối tài khoản Google trước khi đồng bộ lên Cloud.',
      };
    }
    setCloudSyncStatus('syncing');
    setCloudSyncError(null);
    try {
      const res = await seedOrPushWorkspaceToFirestore(
        user.uid,
        user.email,
        latestSnapshotRef.current,
        { forcePushAll: true, knownCloudIds: knownCloudIdsRef.current }
      );
      setCloudSyncStatus('synced');
      setLastSyncedAt(new Date().toLocaleTimeString('vi-VN'));
      return {
        success: true,
        message: `Đã đồng bộ thành công ${res.totalWritten} bản ghi lên Cloud Firestore!`,
      };
    } catch (err) {
      const msg = formatFirestoreSyncError(err);
      setCloudSyncError(msg);
      setCloudSyncStatus('error');
      return { success: false, message: msg };
    }
  };

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('cmms_data_version', CMMS_DATA_VERSION);
  }, []);
  useEffect(() => saveStorage('equipment', equipment), [equipment]);
  useEffect(() => saveStorage('plans', maintenancePlans), [maintenancePlans]);
  useEffect(() => saveStorage('history', maintenanceHistory), [maintenanceHistory]);
  useEffect(() => saveStorage('tickets', tickets), [tickets]);
  useEffect(() => saveStorage('spareParts', spareParts), [spareParts]);
  useEffect(() => saveStorage('stockTransactions', stockTransactions), [stockTransactions]);
  useEffect(() => saveStorage('power10Days', power10Days), [power10Days]);
  useEffect(() => saveStorage('costRecords', costRecords), [costRecords]);
  useEffect(() => saveStorage('waterMonthly', waterMonthly), [waterMonthly]);
  useEffect(() => saveStorage('employees', employees), [employees]);
  useEffect(() => saveStorage('meterReadings', meterReadings), [meterReadings]);
  useEffect(() => saveStorage('auditLogs', auditLogs), [auditLogs]);
  useEffect(() => saveStorage('currentUser', currentUser), [currentUser]);
  useEffect(() => saveStorage('emailConfig', emailConfig), [emailConfig]);
  useEffect(() => saveStorage('emailLogs', emailLogs), [emailLogs]);
  useEffect(() => saveStorage('tariffConfig', tariffConfig), [tariffConfig]);
  useEffect(() => saveStorage('documents', documents), [documents]);
  useEffect(() => saveStorage('projects', projects), [projects]);
  useEffect(() => saveStorage('safetyInspections', safetyInspections), [safetyInspections]);
  useEffect(() => saveStorage('tools', tools), [tools]);
  useEffect(() => saveStorage('toolLogs', toolLogs), [toolLogs]);
  useEffect(() => saveStorage('dailyAreaChecks', dailyAreaChecks), [dailyAreaChecks]);
  useEffect(() => saveStorage('morningCheckTemplates', morningCheckTemplates), [morningCheckTemplates]);
  useEffect(() => saveStorage('monthlyBoardReports', monthlyBoardReports), [monthlyBoardReports]);
  useEffect(() => saveStorage('purchaseRequests', purchaseRequests), [purchaseRequests]);
  useEffect(() => saveStorage('webNotifications', webNotifications), [webNotifications]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const syncPermission = () => {
      setBrowserNotificationPermission(window.Notification.permission);
    };
    window.addEventListener('focus', syncPermission);
    return () => window.removeEventListener('focus', syncPermission);
  }, []);

  useEffect(() => {
    if (!activeWebToast) return;
    const timer = window.setTimeout(() => {
      setActiveWebToast((prev) => (prev?.id === activeWebToast.id ? null : prev));
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [activeWebToast]);

  const addAuditLog = (
    hanhDong: AuditLog['hanhDong'],
    chucNang: string,
    doiTuong: string,
    details: string,
    actorOverride?: Employee
  ) => {
    const actor = actorOverride || currentUserRef.current || currentUser;
    const actorLabel = actor?.maNhanVien
      ? `${actor.tenNhanVien} (${actor.maNhanVien})`
      : actor?.tenNhanVien || 'Hệ thống';
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newLog: AuditLog = {
      id: nextUniqueId('LOG'),
      thoiGian: timeStr,
      nguoiThaoTac: actorLabel,
      hanhDong,
      chucNang,
      doiTuong,
      chiTietNoiDung: details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    syncDoc('audit_logs', newLog.id, sanitizeAuditLog(newLog));
  };

  // Equipment Actions
  const addEquipment = (item: Equipment) => {
    setEquipment((prev) => [item, ...prev]);
    // Also create initial maintenance plan if not exists
    const newPlan: MaintenancePlan = {
      id: nextUniqueId('PLAN'),
      maThietBi: item.maThietBi,
      tenThietBi: item.tenThietBi,
      loaiBaoTri: 'Định kỳ',
      tanSuat: item.tanSuat,
      ngayBaoTriGanNhat: '2026-11-01',
      ngayBaoTriTiepTheo: item.hanBaoTriTiepTheo || calculateNextMaintenanceDate('2026-11-01', item.tanSuat),
      nguoiPhuTrach: item.nguoiPhuTrach,
      trangThai: getMaintenanceStatus(item.hanBaoTriTiepTheo || '2026-11-20'),
      ghiChu: `Tạo tự động cho thiết bị ${item.tenThietBi}`,
    };
    setMaintenancePlans((prev) => [newPlan, ...prev]);
    syncDoc('equipment', item.maThietBi, sanitizeEquipment(item));
    syncDoc('maintenance_plans', newPlan.id, sanitizeMaintenancePlan(newPlan));
    addAuditLog('Thêm', 'Danh sách thiết bị', item.maThietBi, `Thêm thiết bị mới: ${item.tenThietBi} (${item.heThong})`);
  };

  const updateEquipment = (item: Equipment) => {
    setEquipment((prev) => prev.map((e) => (e.maThietBi === item.maThietBi ? item : e)));
    syncDoc('equipment', item.maThietBi, sanitizeEquipment(item));
    // Also sync plan if equipment name / freq / handler changed
    setMaintenancePlans((prev) =>
      prev.map((p) => {
        if (p.maThietBi !== item.maThietBi) return p;
        const updatedPlan: MaintenancePlan = {
          ...p,
          tenThietBi: item.tenThietBi,
          tanSuat: item.tanSuat,
          nguoiPhuTrach: item.nguoiPhuTrach,
          trangThai: getMaintenanceStatus(p.ngayBaoTriTiepTheo),
        };
        syncDoc('maintenance_plans', updatedPlan.id, sanitizeMaintenancePlan(updatedPlan));
        return updatedPlan;
      })
    );
    addAuditLog('Sửa', 'Danh sách thiết bị', item.maThietBi, `Cập nhật thông tin thiết bị: ${item.tenThietBi}`);
  };

  const deleteEquipment = (maThietBi: string) => {
    if (!canDeleteRecords(currentUser)) return;
    const item = equipment.find((e) => e.maThietBi === maThietBi);
    const plansToDelete = maintenancePlans.filter((p) => p.maThietBi === maThietBi);
    setEquipment((prev) => prev.filter((e) => e.maThietBi !== maThietBi));
    setMaintenancePlans((prev) => prev.filter((p) => p.maThietBi !== maThietBi));
    removeDocCloud('equipment', maThietBi);
    plansToDelete.forEach((p) => removeDocCloud('maintenance_plans', p.id));
    addAuditLog('Xóa', 'Danh sách thiết bị', maThietBi, `Xóa thiết bị: ${item?.tenThietBi || maThietBi}`);
  };

  // Maintenance Actions
  const addMaintenancePlan = (plan: MaintenancePlan) => {
    if (!canManageMaintenancePlans(currentUser)) return;
    setMaintenancePlans((prev) => [plan, ...prev]);
    syncDoc('maintenance_plans', plan.id, sanitizeMaintenancePlan(plan));
    addAuditLog('Thêm', 'Kế hoạch bảo trì', plan.maThietBi, `Thêm kế hoạch bảo trì: ${plan.tenThietBi}`);
  };

  const updateMaintenancePlan = (plan: MaintenancePlan) => {
    if (!canManageMaintenancePlans(currentUser)) return;
    setMaintenancePlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)));
    syncDoc('maintenance_plans', plan.id, sanitizeMaintenancePlan(plan));
    addAuditLog('Sửa', 'Kế hoạch bảo trì', plan.maThietBi, `Cập nhật kế hoạch bảo trì: ${plan.tenThietBi}`);
  };

  const rescheduleMaintenancePlan = (planId: string, newDate: string) => {
    if (!canManageMaintenancePlans(currentUser)) return;
    const target = maintenancePlans.find((p) => p.id === planId);
    if (!target || !newDate || target.ngayBaoTriTiepTheo === newDate) return;

    const oldDate = target.ngayBaoTriTiepTheo;
    const nextStatus = getMaintenanceStatus(newDate);
    const updatedPlan: MaintenancePlan = {
      ...target,
      ngayBaoTriTiepTheo: newDate,
      trangThai: nextStatus,
    };

    setMaintenancePlans((prev) =>
      prev.map((p) => (p.id === planId ? updatedPlan : p))
    );
    syncDoc('maintenance_plans', updatedPlan.id, sanitizeMaintenancePlan(updatedPlan));

    const matchingEq = equipment.find((eq) => eq.maThietBi === target.maThietBi);
    if (matchingEq) {
      const updatedEq: Equipment = { ...matchingEq, hanBaoTriTiepTheo: newDate };
      setEquipment((prev) =>
        prev.map((eq) => (eq.maThietBi === target.maThietBi ? updatedEq : eq))
      );
      syncDoc('equipment', updatedEq.maThietBi, sanitizeEquipment(updatedEq));
    }

    addAuditLog(
      'Sửa',
      'Lịch bảo trì',
      target.maThietBi,
      `Dời lịch bảo trì ${target.tenThietBi} từ ${oldDate} sang ${newDate} (Trạng thái mới: ${nextStatus})`
    );
  };

  // COMPLETE MAINTENANCE / REPAIR: Differentiate Planned Maintenance vs Repair
  const completeMaintenance = (
    recordData: Omit<MaintenanceHistory, 'id'>,
    options?: { userConfirmedEmail?: boolean }
  ) => {
    const newId = nextUniqueId('HIST');
    const workType = recordData.loaiCongViec || 'Bảo trì theo kế hoạch';
    const newRecord: MaintenanceHistory = {
      ...recordData,
      loaiCongViec: workType,
      id: newId,
    };
    const matchingPlan = maintenancePlans.find((p) => p.maThietBi === recordData.maThietBi);
    const matchingEq = equipment.find((e) => e.maThietBi === recordData.maThietBi);
    const assignerName = matchingPlan?.nguoiGiaoViec || matchingEq?.nguoiGiaoViec;

    const nextHistory = [newRecord, ...maintenanceHistory];
    setMaintenanceHistory(nextHistory);
    syncDoc('maintenance_history', newRecord.id, sanitizeMaintenanceHistory(newRecord));

    if (workType === 'Bảo trì theo kế hoạch') {
      const freq = matchingPlan?.tanSuat || matchingEq?.tanSuat || 'Monthly';
      const nextDate = calculateNextMaintenanceDate(recordData.ngayThucHien, freq);

      const synced = syncPlansWithHistory(maintenancePlans, nextHistory);
      const hasPlanForEq = synced.some((p) => p.maThietBi === recordData.maThietBi);
      let finalPlans = synced;
      if (!hasPlanForEq) {
        const autoNextPlan: MaintenancePlan = {
          id: nextUniqueId('PLAN'),
          maThietBi: recordData.maThietBi,
          tenThietBi: recordData.tenThietBi,
          loaiBaoTri: 'Định kỳ',
          tanSuat: freq,
          ngayBaoTriGanNhat: recordData.ngayThucHien,
          ngayBaoTriTiepTheo: nextDate,
          nguoiPhuTrach: recordData.nguoiThucHien || matchingEq?.nguoiPhuTrach || '',
          nguoiGiaoViec: recordData.nguoiGiaoViec || matchingEq?.nguoiGiaoViec,
          trangThai: getMaintenanceStatus(nextDate),
          ghiChu: `Tạo tự động sau bảo trì ngày ${recordData.ngayThucHien}`,
        };
        finalPlans = [autoNextPlan, ...synced];
      }
      setMaintenancePlans(finalPlans);
      finalPlans
        .filter((p) => p.maThietBi === recordData.maThietBi)
        .forEach((p) => syncDoc('maintenance_plans', p.id, sanitizeMaintenancePlan(p)));

      if (matchingEq) {
        const eqNextDate = calculateNextMaintenanceDate(recordData.ngayThucHien, matchingEq.tanSuat);
        const updatedEq: Equipment = {
          ...matchingEq,
          hanBaoTriTiepTheo: eqNextDate,
          trangThai: recordData.ketQua === 'Chưa đạt' ? 'Đang sửa chữa' : 'Hoạt động',
        };
        setEquipment((prev) =>
          prev.map((eq) => (eq.maThietBi === recordData.maThietBi ? updatedEq : eq))
        );
        syncDoc('equipment', updatedEq.maThietBi, sanitizeEquipment(updatedEq));
      }

      addAuditLog(
        'Hoàn thành',
        'Lịch sử bảo trì',
        recordData.maThietBi,
        `Hoàn tất bảo trì theo kế hoạch cho ${recordData.tenThietBi} (${recordData.ngayThucHien}). Đã lưu lịch sử và tự động tạo kế hoạch bảo trì tiếp theo (${nextDate}).`
      );
    } else {
      // Sửa chữa: Chỉ ghi nhận vào lịch sử thiết bị, KHÔNG tự tạo hay dịch chuyển kế hoạch bảo trì định kỳ
      if (matchingEq) {
        const updatedEq: Equipment = {
          ...matchingEq,
          trangThai: recordData.ketQua === 'Chưa đạt' ? 'Đang sửa chữa' : 'Hoạt động',
        };
        setEquipment((prev) =>
          prev.map((eq) => (eq.maThietBi === recordData.maThietBi ? updatedEq : eq))
        );
        syncDoc('equipment', updatedEq.maThietBi, sanitizeEquipment(updatedEq));
      }

      addAuditLog(
        'Hoàn thành',
        'Lịch sử sửa chữa',
        recordData.maThietBi,
        `Ghi nhận sửa chữa thiết bị ${recordData.tenThietBi} (${recordData.ngayThucHien}) vào lịch sử thiết bị (giữ nguyên chu kỳ bảo trì định kỳ).`
      );
    }

    if (emailConfig.enabled && options?.userConfirmedEmail !== false) {
      void notifyCompletionReport({
        module: 'BAO_TRI',
        targetId: recordData.maThietBi,
        targetName: recordData.tenThietBi,
        reporterName: recordData.nguoiThucHien,
        assignerName: recordData.nguoiGiaoViec || assignerName,
        result: recordData.ketQua,
        details: `[${workType}] ${recordData.ngayThucHien} • ${recordData.moTaCongViec}`,
        userConfirmed: Boolean(options?.userConfirmedEmail),
      });
    }
  };

  const updateMaintenanceHistory = (updatedRecord: MaintenanceHistory) => {
    const nextHistory = maintenanceHistory.map((h) =>
      h.id === updatedRecord.id ? updatedRecord : h
    );
    const nextPlans = syncPlansWithHistory(maintenancePlans, nextHistory);
    setMaintenanceHistory(nextHistory);
    setMaintenancePlans(nextPlans);
    syncDoc('maintenance_history', updatedRecord.id, sanitizeMaintenanceHistory(updatedRecord));
    nextPlans
      .filter((p) => p.maThietBi === updatedRecord.maThietBi)
      .forEach((p) => syncDoc('maintenance_plans', p.id, sanitizeMaintenancePlan(p)));

    const plannedForEq = nextHistory.filter(
      (h) => h.maThietBi === updatedRecord.maThietBi && getHistoryWorkType(h) === 'Bảo trì theo kế hoạch'
    );
    const latestPlanned = getLatestMaintenanceForEquipment(updatedRecord.maThietBi, plannedForEq);
    if (latestPlanned) {
      const targetEq = equipment.find((eq) => eq.maThietBi === updatedRecord.maThietBi);
      if (targetEq) {
        const updatedEq: Equipment = {
          ...targetEq,
          hanBaoTriTiepTheo: calculateNextMaintenanceDate(
            latestPlanned.ngayThucHien,
            targetEq.tanSuat
          ),
        };
        setEquipment((prevEq) =>
          prevEq.map((eq) => (eq.maThietBi === updatedRecord.maThietBi ? updatedEq : eq))
        );
        syncDoc('equipment', updatedEq.maThietBi, sanitizeEquipment(updatedEq));
      }
    }

    addAuditLog(
      'Sửa',
      'Lịch sử bảo trì',
      updatedRecord.maThietBi,
      `Cập nhật biên bản [${getHistoryWorkType(updatedRecord)}] ${updatedRecord.id} của ${updatedRecord.tenThietBi}`
    );
  };

  const deleteMaintenanceHistory = (id: string) => {
    if (!canDeleteRecords(currentUser)) return;
    const target = maintenanceHistory.find((h) => h.id === id);
    if (!target) return;

    const nextHistory = maintenanceHistory.filter((h) => h.id !== id);
    const nextPlans = syncPlansWithHistory(maintenancePlans, nextHistory);
    setMaintenanceHistory(nextHistory);
    setMaintenancePlans(nextPlans);
    removeDocCloud('maintenance_history', id);
    nextPlans
      .filter((p) => p.maThietBi === target.maThietBi)
      .forEach((p) => syncDoc('maintenance_plans', p.id, sanitizeMaintenancePlan(p)));

    addAuditLog(
      'Xóa',
      'Lịch sử bảo trì',
      target.maThietBi,
      `Xóa biên bản bảo trì ${id} của ${target.tenThietBi}`
    );
  };

  // Ticket Actions
  const addTicket = (
    ticketData: Omit<Ticket, 'maTicket' | 'ngayTao'>,
    options?: { userConfirmedEmail?: boolean }
  ) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newTicket: Ticket = {
      ...ticketData,
      maTicket: nextUniqueId('TK'),
      ngayTao: today,
    };
    setTickets((prev) => [newTicket, ...prev]);
    syncDoc('tickets', newTicket.maTicket, sanitizeTicket(newTicket));
    addAuditLog('Thêm', 'Tickets', newTicket.maTicket, `Tạo ticket mới: ${newTicket.tieuDe} (Ưu tiên: ${newTicket.mucDoUuTien})`);

    const assigneeEmails = resolveAssigneeEmails(newTicket.nguoiPhuTrach, employees);
    const recipientList = Array.from(
      new Set([...assigneeEmails, emailConfig.primaryRecipient].filter((x): x is string => Boolean(x && x.trim())))
    ).join(', ');

    // Tự động gửi thông báo Email khi có ticket mới (nếu bật hoặc người dùng chọn gửi)
    if (
      options?.userConfirmedEmail === true ||
      (options?.userConfirmedEmail !== false && emailConfig.enabled && emailConfig.notifyOnNewTicket)
    ) {
      const equipInfo = newTicket.maThietBi ? ` [${newTicket.maThietBi}]` : '';
      const subj = `[FACILITY SYSTEM MANAGEMENT - Ticket Mới] ${newTicket.tieuDe} (Ưu tiên: ${newTicket.mucDoUuTien})${equipInfo}`;
      const body = `Kính gửi Trưởng phòng Kỹ thuật & Kỹ sư Phụ trách,\n\nHệ thống FACILITY SYSTEM MANAGEMENT vừa ghi nhận phiếu yêu cầu sự cố / công việc mới tại nhà máy:\n- Mã Ticket: ${newTicket.maTicket}\n- Tiêu đề: ${newTicket.tieuDe}\n- Mức độ ưu tiên: ${newTicket.mucDoUuTien}\n- Thiết bị liên quan: ${newTicket.maThietBi || 'Chung'}\n- Người lập phiếu / Giao việc: ${newTicket.nguoiGiaoViec || newTicket.nguoiLap}\n- Người phụ trách: ${newTicket.nguoiPhuTrach}\n- Ngày tạo: ${today}\n- Mô tả chi tiết: ${newTicket.moTaChiTiet}\n\nVui lòng đăng nhập hệ thống FACILITY SYSTEM MANAGEMENT để điều phối và xử lý kịp thời.\n\nTrân trọng,\n${emailConfig.senderName}`;

      void sendEmailNotification({
        type: 'TICKET_MOI',
        subject: subj,
        body,
        recipient: recipientList || emailConfig.primaryRecipient,
        relatedId: newTicket.maTicket,
        userConfirmed: Boolean(options?.userConfirmedEmail),
      });
    }

    if (
      (options?.userConfirmedEmail === true || (options?.userConfirmedEmail !== false && emailConfig.enabled)) &&
      newTicket.trangThai === 'Hoàn thành'
    ) {
      void notifyCompletionReport({
        module: 'TICKET',
        targetId: newTicket.maTicket,
        targetName: newTicket.tieuDe,
        reporterName: newTicket.nguoiPhuTrach || newTicket.nguoiLap,
        assignerName: newTicket.nguoiGiaoViec || newTicket.nguoiLap,
        result: newTicket.ketQua || 'Đã xử lý xong',
        details: newTicket.moTaChiTiet,
        userConfirmed: Boolean(options?.userConfirmedEmail),
      });
    }
  };

  const updateTicket = (ticket: Ticket, options?: { userConfirmedEmail?: boolean }) => {
    const prevTicket = tickets.find((t) => t.maTicket === ticket.maTicket);
    setTickets((prev) => prev.map((t) => (t.maTicket === ticket.maTicket ? ticket : t)));
    syncDoc('tickets', ticket.maTicket, sanitizeTicket(ticket));
    addAuditLog('Sửa', 'Tickets', ticket.maTicket, `Cập nhật trạng thái ticket: ${ticket.trangThai}`);

    const canSend =
      options?.userConfirmedEmail === true ||
      (options?.userConfirmedEmail !== false && emailConfig.enabled);

    if (canSend && prevTicket && prevTicket.nguoiPhuTrach !== ticket.nguoiPhuTrach && ticket.nguoiPhuTrach) {
      const targetEmails = resolveAssigneeEmails(
        ticket.nguoiPhuTrach,
        employees,
        emailConfig.primaryRecipient
      );
      const targetEmail = targetEmails.join(', ') || emailConfig.primaryRecipient;
      void sendEmailNotification({
        type: 'GIAO_VIEC',
        subject: `[FACILITY SYSTEM MANAGEMENT - Giao Việc Ticket] ${ticket.maTicket}: ${ticket.tieuDe}`,
        body: `Kính gửi ${ticket.nguoiPhuTrach},\n\nBạn vừa được phân công phụ trách xử lý Ticket trên hệ thống FACILITY SYSTEM MANAGEMENT:\n- Mã Ticket: ${ticket.maTicket}\n- Tiêu đề: ${ticket.tieuDe}\n- Mức độ ưu tiên: ${ticket.mucDoUuTien}\n- Người giao việc: ${ticket.nguoiGiaoViec || currentUser.tenNhanVien}\n- Nội dung: ${ticket.moTaChiTiet}\n\nTrân trọng,\n${emailConfig.senderName}`,
        recipient: targetEmail,
        relatedId: ticket.maTicket,
        userConfirmed: Boolean(options?.userConfirmedEmail),
      });
    }

    if (canSend && prevTicket && prevTicket.trangThai !== 'Hoàn thành' && ticket.trangThai === 'Hoàn thành') {
      void notifyCompletionReport({
        module: 'TICKET',
        targetId: ticket.maTicket,
        targetName: ticket.tieuDe,
        reporterName: ticket.nguoiPhuTrach || currentUser.tenNhanVien,
        assignerName: ticket.nguoiGiaoViec || ticket.nguoiLap,
        result: ticket.ketQua || 'Hoàn thành xử lý sự cố',
        details: ticket.moTaChiTiet,
        userConfirmed: Boolean(options?.userConfirmedEmail),
      });
    }
  };

  const deleteTicket = (maTicket: string) => {
    if (!canDeleteRecords(currentUser)) return;
    setTickets((prev) => prev.filter((t) => t.maTicket !== maTicket));
    removeDocCloud('tickets', maTicket);
    addAuditLog('Xóa', 'Tickets', maTicket, `Xóa ticket: ${maTicket}`);
  };

  // Spare Parts Actions
  const addSparePart = (part: SparePart) => {
    setSpareParts((prev) => [part, ...prev]);
    syncDoc('spare_parts', part.maVatTu, sanitizeSparePart(part));
    addAuditLog('Thêm', 'Kho vật tư', part.maVatTu, `Thêm vật tư mới: ${part.tenVatTu} (Tồn: ${part.tonThucTe})`);
  };

  const updateSparePart = (part: SparePart) => {
    setSpareParts((prev) => prev.map((p) => (p.maVatTu === part.maVatTu ? part : p)));
    syncDoc('spare_parts', part.maVatTu, sanitizeSparePart(part));
    addAuditLog('Sửa', 'Kho vật tư', part.maVatTu, `Cập nhật thông tin vật tư: ${part.tenVatTu}`);
  };

  const deleteSparePart = (maVatTu: string) => {
    if (!canDeleteRecords(currentUser)) return;
    setSpareParts((prev) => prev.filter((p) => p.maVatTu !== maVatTu));
    removeDocCloud('spare_parts', maVatTu);
    addAuditLog('Xóa', 'Kho vật tư', maVatTu, `Xóa vật tư: ${maVatTu}`);
  };

  // Stock In / Out Actions: Auto deduct / add to spare parts inventory!
  const createStockTransaction = (txData: Omit<StockTransaction, 'transId'>) => {
    const newId = nextUniqueId('TR');
    const newTx: StockTransaction = {
      ...txData,
      transId: newId,
    };
    setStockTransactions((prev) => [newTx, ...prev]);
    syncDoc('stock_transactions', newTx.transId, sanitizeStockTx(newTx));

    const targetPart = spareParts.find((sp) => sp.maVatTu === txData.maVatTu);
    if (targetPart) {
      const updatedPart: SparePart = {
        ...targetPart,
        tonThucTe: applyStockTransaction(targetPart.tonThucTe, txData.loaiGD, txData.soLuong),
      };
      setSpareParts((prev) => prev.map((sp) => (sp.maVatTu === txData.maVatTu ? updatedPart : sp)));
      syncDoc('spare_parts', updatedPart.maVatTu, sanitizeSparePart(updatedPart));
    }

    const actionType = txData.loaiGD === 'Xuất kho sử dụng' ? 'Xuất kho' : 'Nhập kho';
    addAuditLog(
      actionType,
      'Kho xuất nhập',
      txData.maVatTu,
      `${txData.loaiGD} ${txData.soLuong} cái cho thiết bị: ${txData.thietBiSuDung || 'Kho chung'}`
    );
  };

  // Power 10 Days Actions
  const addPower10DaysRecord = (record: Omit<Power10Days, 'id'>) => {
    const newRec: Power10Days = {
      ...record,
      id: nextUniqueId('POW'),
    };
    setPower10Days((prev) => [newRec, ...prev]);
    syncDoc('power_10days', newRec.id, sanitizePower10Days(newRec));
    addAuditLog('Chốt số', 'Điện 10 Ngày', newRec.chuKy, `Ghi nhận dữ liệu điện 10 ngày chu kỳ: ${newRec.chuKy}`);
  };

  const updatePower10DaysRecord = (record: Power10Days) => {
    if (!isAdminLevel(currentUserRef.current)) return;
    setPower10Days((prev) => prev.map((r) => (r.id === record.id ? record : r)));
    syncDoc('power_10days', record.id, sanitizePower10Days(record));
    addAuditLog('Sửa', 'Điện 10 Ngày', record.chuKy, `Cập nhật số liệu điện chu kỳ: ${record.chuKy}`);
  };

  const deletePower10DaysRecord = (id: string) => {
    if (!isAdminLevel(currentUserRef.current)) return;
    const target = power10Days.find((r) => r.id === id);
    setPower10Days((prev) => prev.filter((r) => r.id !== id));
    removeDocCloud('power_10days', id);
    addAuditLog('Xóa', 'Điện 10 Ngày', target?.chuKy || id, `Xóa bản ghi chu kỳ điện 10 ngày: ${target?.chuKy || id}`);
  };

  // Water Monthly Actions
  const addWaterMonthlyRecord = (record: WaterMonthly) => {
    setWaterMonthly((prev) => [record, ...prev]);
    syncDoc('water_monthly', record.month, sanitizeWaterMonthly(record));
    addAuditLog('Chốt số', 'Nước Tháng', record.month, `Ghi nhận số liệu nước tháng: ${record.month}`);
  };

  const updateWaterMonthlyRecord = (record: WaterMonthly) => {
    if (!isAdminLevel(currentUserRef.current)) return;
    setWaterMonthly((prev) => prev.map((r) => (r.month === record.month ? record : r)));
    syncDoc('water_monthly', record.month, sanitizeWaterMonthly(record));
    addAuditLog('Sửa', 'Nước Tháng', record.month, `Cập nhật số liệu nước tháng: ${record.month}`);
  };

  const deleteWaterMonthlyRecord = (month: string) => {
    if (!isAdminLevel(currentUserRef.current)) return;
    setWaterMonthly((prev) => prev.filter((r) => r.month !== month));
    removeDocCloud('water_monthly', month);
    addAuditLog('Xóa', 'Nước Tháng', month, `Xóa bản ghi nước tháng: ${month}`);
  };

  // Meter Reading Actions (auto consumption calculation)
  const addMeterReading = (readingData: Omit<MeterReading, 'id' | 'tieuThu'>) => {
    const consumption = calculateMeterConsumption(readingData.chiSoCu, readingData.chiSoMoi);
    const newReading: MeterReading = {
      ...readingData,
      id: nextUniqueId('MET'),
      tieuThu: consumption,
    };
    setMeterReadings((prev) => [newReading, ...prev]);
    syncDoc('meter_readings', newReading.id, sanitizeMeterReading(newReading));
    addAuditLog(
      'Chốt số',
      'Chốt Điện Nước',
      readingData.tenDongHo,
      `Chốt số đồng hồ ${readingData.tenDongHo}: Tiêu thụ ${consumption} ${readingData.donVi}`
    );
  };

  const addBatchMeterReadings = (readingsData: Omit<MeterReading, 'id' | 'tieuThu'>[]) => {
    if (!readingsData.length) return;
    const newItems: MeterReading[] = readingsData.map((item) => {
      const consumption = calculateMeterConsumption(item.chiSoCu, item.chiSoMoi);
      return {
        ...item,
        id: nextUniqueId('MET'),
        tieuThu: consumption,
      };
    });
    setMeterReadings((prev) => [...newItems, ...prev]);
    newItems.forEach((item) => syncDoc('meter_readings', item.id, sanitizeMeterReading(item)));
    addAuditLog(
      'Chốt số',
      'Chốt Điện Nước',
      `${readingsData.length} đồng hồ`,
      `Chốt số đồng loạt ${readingsData.length} đồng hồ cho ngày ${readingsData[0]?.ngayChot || 'hôm nay'}`
    );
  };

  const updateMeterReading = (reading: MeterReading) => {
    if (!isAdminLevel(currentUserRef.current)) return;
    const consumption = calculateMeterConsumption(reading.chiSoCu, reading.chiSoMoi);
    const normalized: MeterReading = {
      ...reading,
      tieuThu: consumption,
    };
    setMeterReadings((prev) => prev.map((r) => (r.id === normalized.id ? normalized : r)));
    syncDoc('meter_readings', normalized.id, sanitizeMeterReading(normalized));
    addAuditLog(
      'Sửa',
      'Chốt Điện Nước',
      normalized.tenDongHo,
      `Admin cập nhật chỉ số ${normalized.tenDongHo} (${normalized.ngayChot}): Cũ ${normalized.chiSoCu} -> Mới ${normalized.chiSoMoi} (Tiêu thụ ${consumption} ${normalized.donVi})`
    );
  };

  const deleteMeterReading = (id: string) => {
    if (!isAdminLevel(currentUserRef.current)) return;
    const target = meterReadings.find((r) => r.id === id);
    setMeterReadings((prev) => prev.filter((r) => r.id !== id));
    removeDocCloud('meter_readings', id);
    addAuditLog(
      'Xóa',
      'Chốt Điện Nước',
      target?.tenDongHo || id,
      `Admin xóa bản ghi chỉ số ${target?.tenDongHo || id} (${target?.ngayChot || ''})`
    );
  };

  const updateTariffConfig = (cfg: Partial<EnergyTariffConfig>) => {
    const nextCfg: EnergyTariffConfig = {
      ...DEFAULT_ENERGY_TARIFF_CONFIG,
      ...tariffConfig,
      ...cfg,
    };
    setTariffConfig(nextCfg);
    syncDoc('settings', 'tariff_config', {
      key: 'tariff_config',
      payload: nextCfg as unknown as Record<string, unknown>,
    });
    addAuditLog(
      'Sửa',
      'Cấu hình Đơn Giá',
      'Biểu giá Điện - Nước',
      'Cập nhật biểu giá năng lượng hoặc tỷ giá USD/VNĐ'
    );
  };

  // Cost Actions
  const addCostRecord = (costData: Omit<CostRecord, 'idChiPhi'>) => {
    const newCost: CostRecord = {
      ...costData,
      idChiPhi: nextUniqueId('CP'),
    };
    setCostRecords((prev) => [newCost, ...prev]);
    syncDoc('cost_records', newCost.idChiPhi, sanitizeCostRecord(newCost));
    addAuditLog('Thêm', 'Quản lý chi phí', newCost.idChiPhi, `Ghi nhận chi phí: ${newCost.phanLoai} (${newCost.soTienVND.toLocaleString()} đ)`);
  };

  const updateCostRecord = (cost: CostRecord) => {
    setCostRecords((prev) => prev.map((c) => (c.idChiPhi === cost.idChiPhi ? cost : c)));
    syncDoc('cost_records', cost.idChiPhi, sanitizeCostRecord(cost));
    addAuditLog('Sửa', 'Quản lý chi phí', cost.idChiPhi, `Cập nhật chi phí ${cost.idChiPhi}: Trạng thái ${cost.trangThai}`);
  };

  const deleteCostRecord = (idChiPhi: string) => {
    setCostRecords((prev) => prev.filter((c) => c.idChiPhi !== idChiPhi));
    removeDocCloud('cost_records', idChiPhi);
    addAuditLog('Xóa', 'Quản lý chi phí', idChiPhi, `Xóa chi phí: ${idChiPhi}`);
  };

  // Employees & Current User
  const setCurrentUser = (emp: Employee) => {
    applyCurrentUser(emp, true);
    addAuditLog(
      'Đăng nhập',
      'Hệ thống',
      emp.maNhanVien,
      `Người dùng ${emp.tenNhanVien} (${emp.maNhanVien} - ${emp.chucVu}) đăng nhập vào hệ thống`,
      emp
    );
  };

  const addEmployee = (emp: Employee) => {
    const nextEmployees = [...employeesRef.current, emp];
    setEmployees(nextEmployees);
    syncDoc('employees_public', emp.maNhanVien, sanitizeEmployeePublic(emp), nextEmployees);
    syncDoc('employees_private', emp.maNhanVien, sanitizeEmployeePrivate(emp), nextEmployees);
    const mail = (emp.email || '').trim().toLowerCase();
    if (
      cloudUserRef.current?.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL &&
      mail &&
      isValidEmailFormat(mail) &&
      !isPlaceholderEmail(mail)
    ) {
      void propagateAllowedEmails(buildAllowedEmails(nextEmployees, cloudUserRef.current.email));
    }
    addAuditLog('Thêm', 'Nhân viên', emp.maNhanVien, `Thêm nhân sự mới: ${emp.tenNhanVien} (${emp.chucVu})`);
  };

  const updateEmployee = (emp: Employee) => {
    const prevEmp = employeesRef.current.find((e) => e.maNhanVien === emp.maNhanVien);
    const nextEmployees = employeesRef.current.map((e) => (e.maNhanVien === emp.maNhanVien ? emp : e));
    setEmployees(nextEmployees);
    if (currentUserRef.current.maNhanVien === emp.maNhanVien) {
      applyCurrentUser(emp, false);
    }

    const isBootAdmin =
      (cloudUserRef.current?.email || '').trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
    if (!cloudUserRef.current || isBootAdmin) {
      syncDoc('employees_public', emp.maNhanVien, sanitizeEmployeePublic(emp), nextEmployees);
      syncDoc('employees_private', emp.maNhanVien, sanitizeEmployeePrivate(emp), nextEmployees);
    } else if (emp.maNhanVien === currentUser.maNhanVien) {
      syncDoc('employees_public', emp.maNhanVien, sanitizeEmployeeSelfPublic(emp), nextEmployees);
      syncDoc('employees_private', emp.maNhanVien, sanitizeEmployeeSelfPrivate(emp), nextEmployees);
    }

    const oldMail = (prevEmp?.email || '').trim().toLowerCase();
    const newMail = (emp.email || '').trim().toLowerCase();
    if (
      isBootAdmin &&
      oldMail !== newMail &&
      newMail &&
      isValidEmailFormat(newMail) &&
      !isPlaceholderEmail(newMail)
    ) {
      void propagateAllowedEmails(buildAllowedEmails(nextEmployees, cloudUserRef.current?.email));
    }
    addAuditLog('Sửa', 'Nhân viên', emp.maNhanVien, `Cập nhật hồ sơ nhân viên: ${emp.tenNhanVien}`);
  };

  // Documents / SOPs / Checklists Actions
  const addDocument = (docData: Omit<FacilityDocument, 'id'>) => {
    const newDoc: FacilityDocument = {
      ...docData,
      id: nextUniqueId('DOC'),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    syncDoc('documents', newDoc.id, sanitizeDocument(newDoc));
    addAuditLog('Thêm', 'Tài liệu & SOP', newDoc.maTaiLieu, `Thêm tài liệu mới: ${newDoc.tieuDe}`);
  };

  const updateDocument = (docItem: FacilityDocument) => {
    setDocuments((prev) => prev.map((d) => (d.id === docItem.id ? docItem : d)));
    syncDoc('documents', docItem.id, sanitizeDocument(docItem));
    addAuditLog('Sửa', 'Tài liệu & SOP', docItem.maTaiLieu, `Cập nhật tài liệu: ${docItem.tieuDe}`);
  };

  const deleteDocument = (id: string) => {
    if (!canDeleteRecords(currentUserRef.current)) return;
    const target = documents.find((d) => d.id === id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    removeDocCloud('documents', id);
    addAuditLog('Xóa', 'Tài liệu & SOP', target?.maTaiLieu || id, `Xóa tài liệu: ${target?.tieuDe || id}`);
  };

  // Project Management Actions
  const addProject = (projectData: Omit<FacilityProject, 'id'>) => {
    const newProject: FacilityProject = {
      ...projectData,
      id: nextUniqueId('PRJ'),
    };
    setProjects((prev) => [newProject, ...prev]);
    syncDoc('projects', newProject.id, sanitizeProject(newProject));
    addAuditLog('Thêm', 'Quản Lý Dự Án', newProject.maDuAn, `Tạo dự án mới: ${newProject.tenDuAn}`);
  };

  const updateProject = (project: FacilityProject) => {
    setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    syncDoc('projects', project.id, sanitizeProject(project));
    addAuditLog('Sửa', 'Quản Lý Dự Án', project.maDuAn, `Cập nhật dự án: ${project.tenDuAn} (${project.trangThai})`);
  };

  const deleteProject = (id: string) => {
    if (!canDeleteRecords(currentUserRef.current)) return;
    const target = projects.find((p) => p.id === id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    removeDocCloud('projects', id);
    addAuditLog('Xóa', 'Quản Lý Dự Án', target?.maDuAn || id, `Xóa dự án: ${target?.tenDuAn || id}`);
  };

  // Daily Start-Of-Day Area Checks ("Công Việc Đầu Ngày")
  const updateMorningCheckTemplate = (
    area: DailyInspectionArea,
    template: MorningCheckAreaTemplate,
    applyToPendingChecks = false
  ) => {
    if (!canManageMaintenancePlans(currentUserRef.current)) return;
    const normalized: MorningCheckAreaTemplate = {
      khuVuc: area,
      tieuDe: template.tieuDe.trim() || DEFAULT_MORNING_CHECK_TEMPLATES[area].tieuDe,
      moTaCongViec: template.moTaCongViec.trim() || DEFAULT_MORNING_CHECK_TEMPLATES[area].moTaCongViec,
      hanHoanThanh: template.hanHoanThanh.trim() || DEFAULT_MORNING_CHECK_TEMPLATES[area].hanHoanThanh,
      nguoiMacDinh: (template.nguoiMacDinh || '').trim(),
    };
    const nextTemplates: MorningCheckTemplatesMap = {
      ...morningCheckTemplates,
      [area]: normalized,
    };
    setMorningCheckTemplates(nextTemplates);
    syncDoc('settings', 'morning_check_templates', {
      key: 'morning_check_templates',
      payload: nextTemplates as unknown as Record<string, unknown>,
    });

    if (applyToPendingChecks) {
      const updatedDocs: DailyAreaCheck[] = [];
      setDailyAreaChecks((prev) =>
        prev.map((c) => {
          if (c.khuVuc === area && c.trangThai !== 'Đã hoàn thành') {
            const nextItem: DailyAreaCheck = {
              ...c,
              tieuDe: normalized.tieuDe,
              moTaCongViec: normalized.moTaCongViec,
              hanHoanThanh: normalized.hanHoanThanh,
            };
            updatedDocs.push(nextItem);
            return nextItem;
          }
          return c;
        })
      );
      updatedDocs.forEach((docItem) => {
        syncDoc('daily_area_checks', docItem.id, sanitizeDailyAreaCheck(docItem));
      });
    }

    addAuditLog(
      'Sửa',
      'Công Việc Đầu Ngày',
      `Mẫu ${area}`,
      `Cập nhật công việc mẫu khu vực ${area}${applyToPendingChecks ? ' và đồng bộ vào các phiếu đang chờ' : ''}`
    );
  };

  const resetMorningCheckTemplates = () => {
    if (!canManageMaintenancePlans(currentUserRef.current)) return;
    setMorningCheckTemplates(DEFAULT_MORNING_CHECK_TEMPLATES);
    syncDoc('settings', 'morning_check_templates', {
      key: 'morning_check_templates',
      payload: DEFAULT_MORNING_CHECK_TEMPLATES as unknown as Record<string, unknown>,
    });
    addAuditLog(
      'Cập nhật',
      'Công Việc Đầu Ngày',
      'Công việc mẫu',
      'Khôi phục 3 mẫu công việc đầu ngày về thiết lập mặc định'
    );
  };

  const saveMonthlyBoardReport = (
    record: MonthlyBoardReportRecord,
    defaults?: { defaultBoardRecipients?: string; defaultCcRecipients?: string }
  ) => {
    if (!canViewCosts(currentUserRef.current)) return;
    const cleanedRecord: MonthlyBoardReportRecord = {
      ...record,
      month: record.month.trim(),
      reportTitle: record.reportTitle.trim(),
      preparedBy: record.preparedBy.trim() || currentUserRef.current.tenNhanVien,
      reviewerName: record.reviewerName?.trim() || undefined,
      boardRecipients: record.boardRecipients.trim(),
      ccRecipients: record.ccRecipients?.trim() || undefined,
      highlights: record.highlights.slice(0, 6000),
      risksAndIssues: record.risksAndIssues.slice(0, 6000),
      nextMonthPlan: record.nextMonthPlan.slice(0, 6000),
      directorFeedback: record.directorFeedback?.slice(0, 3000) || undefined,
      updatedAt: record.updatedAt || new Date().toISOString(),
    };

    setMonthlyBoardReports((prev) => {
      const nextStore: MonthlyBoardReportsStore = {
        defaultBoardRecipients:
          defaults?.defaultBoardRecipients !== undefined
            ? defaults.defaultBoardRecipients.trim()
            : prev.defaultBoardRecipients,
        defaultCcRecipients:
          defaults?.defaultCcRecipients !== undefined
            ? defaults.defaultCcRecipients.trim()
            : prev.defaultCcRecipients,
        reportsByMonth: {
          ...prev.reportsByMonth,
          [cleanedRecord.month]: cleanedRecord,
        },
      };
      syncDoc('settings', 'monthly_board_reports', {
        key: 'monthly_board_reports',
        payload: nextStore as unknown as Record<string, unknown>,
      });
      return nextStore;
    });

    addAuditLog(
      'Cập nhật',
      'Báo Cáo Tháng BGĐ',
      `Kỳ ${cleanedRecord.month}`,
      `Lưu báo cáo tháng ${cleanedRecord.month} (${cleanedRecord.status})`
    );
  };

  const deleteMonthlyBoardReport = (month: string) => {
    if (!isAdminLevel(currentUserRef.current)) return;
    setMonthlyBoardReports((prev) => {
      const nextReports = { ...prev.reportsByMonth };
      delete nextReports[month];
      const nextStore: MonthlyBoardReportsStore = {
        ...prev,
        reportsByMonth: nextReports,
      };
      syncDoc('settings', 'monthly_board_reports', {
        key: 'monthly_board_reports',
        payload: nextStore as unknown as Record<string, unknown>,
      });
      return nextStore;
    });
    addAuditLog(
      'Xóa',
      'Báo Cáo Tháng BGĐ',
      `Kỳ ${month}`,
      `Xóa bản lưu báo cáo tháng ${month} khỏi lịch sử`
    );
  };

  const addDailyAreaCheck = (checkData: Omit<DailyAreaCheck, 'id'>): DailyAreaCheck | null => {
    if (!canManageMaintenancePlans(currentUserRef.current)) return null;
    const newCheck: DailyAreaCheck = {
      ...checkData,
      id: nextUniqueId('DAC'),
      nguoiPhanQuyen: checkData.nguoiPhanQuyen || currentUserRef.current.tenNhanVien,
    };
    setDailyAreaChecks((prev) => [newCheck, ...prev]);
    syncDoc('daily_area_checks', newCheck.id, sanitizeDailyAreaCheck(newCheck));
    const rangeLabel =
      newCheck.ngayKetThuc && newCheck.ngayKetThuc !== newCheck.ngayKiemTra
        ? `${newCheck.ngayKiemTra} → ${newCheck.ngayKetThuc}`
        : newCheck.ngayKiemTra;
    addAuditLog(
      'Thêm',
      'Công Việc Đầu Ngày',
      newCheck.khuVuc,
      `Phân công kiểm tra ${newCheck.khuVuc} (${rangeLabel} - ${newCheck.caLamViec}) cho ${newCheck.nguoiDuocGiao || 'Chưa phân công'}`
    );
    return newCheck;
  };

  const updateDailyAreaCheck = (check: DailyAreaCheck) => {
    setDailyAreaChecks((prev) => prev.map((item) => (item.id === check.id ? check : item)));
    syncDoc('daily_area_checks', check.id, sanitizeDailyAreaCheck(check));
    const rangeLabel =
      check.ngayKetThuc && check.ngayKetThuc !== check.ngayKiemTra
        ? `${check.ngayKiemTra} → ${check.ngayKetThuc}`
        : check.ngayKiemTra;
    addAuditLog(
      'Sửa',
      'Công Việc Đầu Ngày',
      check.khuVuc,
      `Cập nhật công việc đầu ngày ${check.khuVuc} (${rangeLabel}): ${check.trangThai} - ${check.ketQua}`
    );
  };

  const submitDailyAreaCheckReport = (params: {
    id: string;
    ngayBaoCao?: string;
    trangThai: DailyAreaCheckStatus;
    ketQua: DailyAreaCheckResult;
    baoCaoThucTe: string;
    anhHienTruong?: string;
    anhDinhKem?: string[];
  }) => {
    const existing = dailyAreaChecks.find((c) => c.id === params.id);
    if (!existing) return;
    const actor = currentUserRef.current;
    const now = new Date();
    const nowYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const formattedTime = `${nowYmd} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const scheduledDates = getScheduledDatesForAreaCheck(existing);
    const targetDate = (params.ngayBaoCao || existing.ngayKiemTra || scheduledDates[0] || nowYmd).trim();

    const baseReports: DailyAreaDayReport[] = Array.isArray(existing.baoCaoTheoNgay)
      ? existing.baoCaoTheoNgay.map((r) => ({ ...r }))
      : [];

    // Preserve legacy single-day report under existing.ngayKiemTra if needed
    if (
      baseReports.length === 0 &&
      existing.baoCaoThucTe &&
      existing.ngayKiemTra &&
      targetDate !== existing.ngayKiemTra
    ) {
      baseReports.push({
        ngay: existing.ngayKiemTra,
        trangThai: existing.trangThai,
        ketQua: existing.ketQua,
        baoCaoThucTe: existing.baoCaoThucTe,
        nguoiBaoCao: existing.nguoiBaoCao,
        thoiGianBaoCao: existing.thoiGianBaoCao,
        anhHienTruong: existing.anhHienTruong,
        anhDinhKem: existing.anhHienTruong ? [existing.anhHienTruong] : undefined,
      });
    }

    const existingDayIdx = baseReports.findIndex((r) => r.ngay === targetDate);
    const existingDay = existingDayIdx >= 0 ? baseReports[existingDayIdx] : undefined;

    const hasExplicitPhotos =
      params.anhDinhKem !== undefined || params.anhHienTruong !== undefined;

    let resolvedPhotos: string[] = [];
    if (hasExplicitPhotos) {
      const combined = [
        ...(Array.isArray(params.anhDinhKem) ? params.anhDinhKem : []),
        ...(params.anhHienTruong ? [params.anhHienTruong] : []),
      ]
        .map((u) => (typeof u === 'string' ? u.trim() : ''))
        .filter(Boolean);
      resolvedPhotos = Array.from(new Set(combined)).slice(0, 4);
    } else {
      const prevCombined = [
        ...(Array.isArray(existingDay?.anhDinhKem) ? existingDay.anhDinhKem : []),
        ...(existingDay?.anhHienTruong ? [existingDay.anhHienTruong] : []),
      ]
        .map((u) => (typeof u === 'string' ? u.trim() : ''))
        .filter(Boolean);
      resolvedPhotos = Array.from(new Set(prevCombined)).slice(0, 4);
    }

    const newDayReport: DailyAreaDayReport = {
      ngay: targetDate,
      trangThai: params.trangThai,
      ketQua: params.ketQua,
      baoCaoThucTe: params.baoCaoThucTe.trim(),
      nguoiBaoCao: actor.tenNhanVien,
      thoiGianBaoCao: formattedTime,
      anhHienTruong: resolvedPhotos[0] || undefined,
      anhDinhKem: resolvedPhotos.length > 0 ? resolvedPhotos : undefined,
    };

    if (existingDayIdx >= 0) {
      baseReports[existingDayIdx] = newDayReport;
    } else {
      baseReports.push(newDayReport);
    }
    baseReports.sort((a, b) => a.ngay.localeCompare(b.ngay));

    // Roll up overall weekly/check status and worst-case result across scheduled days
    const reportByDate = new Map(baseReports.map((r) => [r.ngay, r]));
    const allScheduledDone =
      scheduledDates.length > 0 &&
      scheduledDates.every((d) => reportByDate.get(d)?.trangThai === 'Đã hoàn thành');
    const anyStarted = baseReports.some(
      (r) =>
        r.trangThai === 'Đã hoàn thành' ||
        r.trangThai === 'Đang kiểm tra' ||
        Boolean(r.baoCaoThucTe && r.baoCaoThucTe.trim())
    );
    const overallStatus: DailyAreaCheckStatus = allScheduledDone
      ? 'Đã hoàn thành'
      : anyStarted
      ? 'Đang kiểm tra'
      : 'Chờ kiểm tra';

    const severityRank: Record<DailyAreaCheckResult, number> = {
      'Chưa đánh giá': 0,
      'Bình thường': 1,
      'Cần theo dõi': 2,
      'Có sự cố': 3,
    };
    let overallResult: DailyAreaCheckResult = 'Chưa đánh giá';
    for (const r of baseReports) {
      if ((severityRank[r.ketQua] || 0) > (severityRank[overallResult] || 0)) {
        overallResult = r.ketQua;
      }
    }

    const updated: DailyAreaCheck = {
      ...existing,
      trangThai: overallStatus,
      ketQua: overallResult,
      baoCaoThucTe: newDayReport.baoCaoThucTe,
      nguoiBaoCao: actor.tenNhanVien,
      thoiGianBaoCao: formattedTime,
      anhHienTruong: hasExplicitPhotos ? newDayReport.anhHienTruong : existing.anhHienTruong,
      baoCaoTheoNgay: baseReports,
    };
    setDailyAreaChecks((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    syncDoc('daily_area_checks', updated.id, sanitizeDailyAreaCheck(updated));
    addAuditLog(
      params.trangThai === 'Đã hoàn thành' ? 'Hoàn thành' : 'Cập nhật',
      'Công Việc Đầu Ngày',
      updated.khuVuc,
      `${actor.tenNhanVien} ghi nhận báo cáo ${updated.khuVuc} ngày ${targetDate}: ${params.ketQua} — ${newDayReport.baoCaoThucTe || 'Không có ghi chú'}`
    );

    if (params.ketQua === 'Có sự cố' || params.ketQua === 'Cần theo dõi') {
      triggerWebNotification({
        type: 'BAO_CAO_HOAN_THANH',
        title: `[Kiểm Tra Đầu Ngày] ${updated.khuVuc} (${targetDate}) — ${params.ketQua}`,
        message: `${actor.tenNhanVien} vừa báo cáo ${updated.khuVuc} (${targetDate} · ${updated.caLamViec}): ${params.baoCaoThucTe || params.ketQua}`,
        relatedId: updated.id,
        targetTab: 'morning_checks',
      });
    }
  };

  const deleteDailyAreaCheck = (id: string) => {
    if (!canDeleteRecords(currentUserRef.current)) return;
    const target = dailyAreaChecks.find((c) => c.id === id);
    setDailyAreaChecks((prev) => prev.filter((c) => c.id !== id));
    removeDocCloud('daily_area_checks', id);
    addAuditLog(
      'Xóa',
      'Công Việc Đầu Ngày',
      target?.khuVuc || id,
      `Xóa phiếu kiểm tra đầu ngày ${target?.khuVuc || id} (${target?.ngayKiemTra || ''})`
    );
  };

  // Safety Inspection & Calibration Actions
  const addSafetyInspection = (itemData: Omit<SafetyInspectionItem, 'id' | 'trangThai'>) => {
    const computedStatus = getInspectionStatus(itemData.ngayHetHan, itemData.nhacTruocNgay ?? 30, false);
    const newItem: SafetyInspectionItem = {
      ...itemData,
      id: nextUniqueId('INS'),
      trangThai: computedStatus,
    };
    setSafetyInspections((prev) => [newItem, ...prev]);
    syncDoc('safety_inspections', newItem.id, sanitizeSafetyInspection(newItem));
    addAuditLog(
      'Thêm',
      'Kiểm định & Hiệu chuẩn',
      newItem.maHoSo,
      `Thêm hồ sơ ${newItem.phanLoai}: ${newItem.tenThietBi} (Hết hạn: ${newItem.ngayHetHan})`
    );
  };

  const updateSafetyInspection = (item: SafetyInspectionItem) => {
    const computedStatus = getInspectionStatus(
      item.ngayHetHan,
      item.nhacTruocNgay ?? 30,
      item.trangThai === 'Đang kiểm định'
    );
    const normalized: SafetyInspectionItem = { ...item, trangThai: computedStatus };
    setSafetyInspections((prev) => prev.map((x) => (x.id === item.id ? normalized : x)));
    syncDoc('safety_inspections', normalized.id, sanitizeSafetyInspection(normalized));
    addAuditLog(
      'Sửa',
      'Kiểm định & Hiệu chuẩn',
      item.maHoSo,
      `Cập nhật hồ sơ kiểm định ${item.tenThietBi} (Hết hạn: ${item.ngayHetHan}, Trạng thái: ${computedStatus})`
    );
  };

  const deleteSafetyInspection = (id: string) => {
    const target = safetyInspections.find((x) => x.id === id);
    setSafetyInspections((prev) => prev.filter((x) => x.id !== id));
    removeDocCloud('safety_inspections', id);
    addAuditLog(
      'Xóa',
      'Kiểm định & Hiệu chuẩn',
      target?.maHoSo || id,
      `Xóa hồ sơ kiểm định: ${target?.tenThietBi || id}`
    );
  };

  const completeSafetyInspection = (params: {
    id: string;
    ngayThucHien: string;
    donViThucHien: string;
    soTemChungNhan: string;
    ketQua: InspectionHistoryEntry['ketQua'];
    ghiChu?: string;
  }) => {
    const target = safetyInspections.find((x) => x.id === params.id);
    if (!target) return;

    const nextDue =
      params.ketQua === 'Đạt'
        ? calculateNextInspectionDate(params.ngayThucHien, target.chuKy)
        : target.ngayHetHan;
    const nextStatus = getInspectionStatus(nextDue, target.nhacTruocNgay ?? 30, false);

    const historyEntry: InspectionHistoryEntry = {
      id: nextUniqueId('IH'),
      ngayThucHien: params.ngayThucHien,
      donViThucHien: params.donViThucHien,
      soTemChungNhan: params.soTemChungNhan,
      ketQua: params.ketQua,
      ghiChu: params.ghiChu,
      nguoiCapNhat: currentUser.tenNhanVien,
    };

    const updated: SafetyInspectionItem = {
      ...target,
      ngayKiemDinhGanNhat: params.ngayThucHien,
      ngayHetHan: nextDue,
      donViKiemDinh: params.donViThucHien || target.donViKiemDinh,
      soTemGiayChungNhan: params.soTemChungNhan || target.soTemGiayChungNhan,
      trangThai: nextStatus,
      lichSu: [historyEntry, ...(target.lichSu || [])],
    };

    setSafetyInspections((prev) => prev.map((x) => (x.id === params.id ? updated : x)));
    syncDoc('safety_inspections', updated.id, sanitizeSafetyInspection(updated));
    addAuditLog(
      'Hoàn thành',
      'Kiểm định & Hiệu chuẩn',
      target.maHoSo,
      `Ghi nhận ${target.phanLoai} (${params.ketQua}) cho ${target.tenThietBi}. Tem/CN: ${params.soTemChungNhan}. Hạn tiếp theo: ${nextDue}.`
    );
  };

  // Tooling & Maintenance Kit Actions
  const addTool = (toolData: Omit<ToolItem, 'id'>) => {
    const newTool: ToolItem = {
      ...toolData,
      id: nextUniqueId('TL'),
    };
    setTools((prev) => [newTool, ...prev]);
    syncDoc('tools', newTool.id, sanitizeToolItem(newTool));
    addAuditLog(
      'Thêm',
      'Dụng cụ & Đồ nghề',
      newTool.maDungCu,
      `Thêm dụng cụ mới: ${newTool.tenDungCu} (SL: ${newTool.soLuongTong} ${newTool.donViTinh})`
    );
  };

  const updateTool = (tool: ToolItem) => {
    setTools((prev) => prev.map((t) => (t.id === tool.id ? tool : t)));
    syncDoc('tools', tool.id, sanitizeToolItem(tool));
    addAuditLog('Sửa', 'Dụng cụ & Đồ nghề', tool.maDungCu, `Cập nhật dụng cụ: ${tool.tenDungCu}`);
  };

  const deleteTool = (id: string) => {
    if (!canDeleteRecords(currentUser)) return;
    const target = tools.find((t) => t.id === id);
    setTools((prev) => prev.filter((t) => t.id !== id));
    removeDocCloud('tools', id);
    addAuditLog(
      'Xóa',
      'Dụng cụ & Đồ nghề',
      target?.maDungCu || id,
      `Xóa dụng cụ: ${target?.tenDungCu || id}`
    );
  };

  const recordToolTransaction = (params: {
    toolId: string;
    loaiGiaoDich: ToolBorrowLog['loaiGiaoDich'];
    soLuong: number;
    nguoiMuon: string;
    ngayGiaoDich: string;
    hanTra?: string;
    tinhTrangKhiTra?: ToolCondition;
    ghiChu?: string;
  }): { success: boolean; message?: string } => {
    const target = tools.find((t) => t.id === params.toolId);
    if (!target) return { success: false, message: 'Không tìm thấy dụng cụ.' };
    const qty = Math.max(1, Number(params.soLuong) || 1);

    let nextAvail = target.soLuongKhaDung;
    let nextBorrowed = target.soLuongDangMuon;
    let nextCondition: ToolCondition = target.tinhTrang;
    let nextHolder = target.nguoiDangGiu || '';
    let nextDue = target.hanTraDuKien;
    let nextBorrowDate = target.ngayMuonGanNhat;

    if (params.loaiGiaoDich === 'Mượn') {
      if (qty > target.soLuongKhaDung) {
        return {
          success: false,
          message: `Số lượng khả dụng chỉ còn ${target.soLuongKhaDung} ${target.donViTinh}.`,
        };
      }
      nextAvail = target.soLuongKhaDung - qty;
      nextBorrowed = target.soLuongDangMuon + qty;
      const existingHolders = parseAssigneeNames(target.nguoiDangGiu);
      nextHolder = formatAssigneeNames([...existingHolders, params.nguoiMuon]);
      nextBorrowDate = params.ngayGiaoDich;
      nextDue = params.hanTra || target.hanTraDuKien;
      nextCondition = 'Đang sử dụng';
    } else if (params.loaiGiaoDich === 'Trả') {
      if (qty > target.soLuongDangMuon) {
        return {
          success: false,
          message: `Hiện chỉ đang cho mượn ${target.soLuongDangMuon} ${target.donViTinh}.`,
        };
      }
      nextBorrowed = target.soLuongDangMuon - qty;
      nextAvail = Math.min(target.soLuongTong, target.soLuongKhaDung + qty);
      if (nextBorrowed === 0) {
        nextHolder = '';
        nextDue = undefined;
        nextCondition = params.tinhTrangKhiTra || 'Tốt';
      } else {
        const remaining = parseAssigneeNames(target.nguoiDangGiu).filter(
          (name) => name.toLowerCase() !== params.nguoiMuon.trim().toLowerCase()
        );
        nextHolder = formatAssigneeNames(remaining);
        if (params.tinhTrangKhiTra && params.tinhTrangKhiTra !== 'Tốt') {
          nextCondition = params.tinhTrangKhiTra;
        }
      }
    } else if (params.loaiGiaoDich === 'Bảo dưỡng') {
      nextCondition = params.tinhTrangKhiTra || 'Cần bảo dưỡng';
    } else if (params.loaiGiaoDich === 'Kiểm kê') {
      nextCondition = params.tinhTrangKhiTra || target.tinhTrang;
    }

    const updatedTool: ToolItem = {
      ...target,
      soLuongKhaDung: nextAvail,
      soLuongDangMuon: nextBorrowed,
      tinhTrang: nextCondition,
      nguoiDangGiu: nextHolder || undefined,
      ngayMuonGanNhat: nextBorrowDate,
      hanTraDuKien: nextDue,
    };

    const newLog: ToolBorrowLog = {
      id: nextUniqueId('TLG'),
      maDungCu: target.maDungCu,
      tenDungCu: target.tenDungCu,
      loaiGiaoDich: params.loaiGiaoDich,
      soLuong: qty,
      nguoiMuon: params.nguoiMuon,
      nguoiBanGiao: currentUser.tenNhanVien,
      ngayGiaoDich: params.ngayGiaoDich,
      hanTra: params.hanTra,
      tinhTrangKhiTra: params.tinhTrangKhiTra,
      ghiChu: params.ghiChu,
    };

    setTools((prev) => prev.map((t) => (t.id === params.toolId ? updatedTool : t)));
    setToolLogs((prev) => [newLog, ...prev]);
    syncDoc('tools', updatedTool.id, sanitizeToolItem(updatedTool));
    syncDoc('tool_logs', newLog.id, sanitizeToolLog(newLog));

    addAuditLog(
      params.loaiGiaoDich === 'Mượn' ? 'Xuất kho' : params.loaiGiaoDich === 'Trả' ? 'Nhập kho' : 'Cập nhật',
      'Dụng cụ & Đồ nghề',
      target.maDungCu,
      `${params.loaiGiaoDich} ${qty} ${target.donViTinh} ${target.tenDungCu} (${params.nguoiMuon})`
    );
    return { success: true };
  };

  // Purchase Request Actions ("Yêu Cầu Mua Dụng Cụ & Vật Tư")
  const addPurchaseRequest = (
    reqData: Omit<PurchaseRequest, 'id' | 'maPhieu' | 'trangThai' | 'ngayYeuCau' | 'nguoiYeuCau'> & {
      maPhieu?: string;
      ngayYeuCau?: string;
      nguoiYeuCau?: string;
    }
  ): PurchaseRequest => {
    const actor = currentUserRef.current;
    const prefix = reqData.loaiYeuCau === 'DUNG_CU' ? 'PR-DC' : 'PR-VT';
    const existingCount = purchaseRequests.filter((r) => r.loaiYeuCau === reqData.loaiYeuCau).length;
    let candidateCode = (reqData.maPhieu || '').trim();
    if (!candidateCode) {
      let seq = existingCount + 1;
      candidateCode = `${prefix}-${String(seq).padStart(3, '0')}`;
      const usedCodes = new Set(purchaseRequests.map((r) => r.maPhieu.toUpperCase()));
      while (usedCodes.has(candidateCode.toUpperCase())) {
        seq += 1;
        candidateCode = `${prefix}-${String(seq).padStart(3, '0')}`;
      }
    }
    const allowCostField = canViewCosts(actor);
    const parsedPrice =
      allowCostField && typeof reqData.donGiaDuKien === 'number' && Number.isFinite(reqData.donGiaDuKien)
        ? Math.max(0, reqData.donGiaDuKien)
        : undefined;

    const newReq: PurchaseRequest = {
      id: nextUniqueId('PR'),
      maPhieu: candidateCode,
      loaiYeuCau: reqData.loaiYeuCau,
      maMatHang: reqData.maMatHang?.trim() || undefined,
      tenMatHang: reqData.tenMatHang.trim(),
      danhMuc: reqData.danhMuc?.trim() || undefined,
      quyCachThongSo: reqData.quyCachThongSo?.trim() || undefined,
      soLuong: Math.max(1, Number(reqData.soLuong) || 1),
      donViTinh: reqData.donViTinh.trim() || 'Cái',
      donGiaDuKien: parsedPrice,
      nhaCungCapDeXuat: reqData.nhaCungCapDeXuat?.trim() || undefined,
      mucDoUuTien: reqData.mucDoUuTien || 'Bình thường',
      trangThai: 'Chờ duyệt',
      ngayYeuCau: reqData.ngayYeuCau || getVietnamTodayYMD(),
      ngayCanHang: reqData.ngayCanHang?.trim() || undefined,
      nguoiYeuCau: reqData.nguoiYeuCau || actor.tenNhanVien,
      boPhan: reqData.boPhan?.trim() || actor.phongBan || 'Kỹ Thuật & Bảo Trì (O&M)',
      maThietBiLienQuan: reqData.maThietBiLienQuan?.trim() || undefined,
      lyDoYeuCau: reqData.lyDoYeuCau.trim(),
      ghiChu: reqData.ghiChu?.trim() || undefined,
    };

    setPurchaseRequests((prev) => [newReq, ...prev]);
    syncDoc('purchase_requests', newReq.id, sanitizePurchaseRequest(newReq));
    const moduleLabel =
      newReq.loaiYeuCau === 'DUNG_CU' ? 'Yêu cầu mua dụng cụ' : 'Yêu cầu mua vật tư';
    addAuditLog(
      'Thêm',
      moduleLabel,
      newReq.maPhieu,
      `Tạo phiếu ${newReq.maPhieu}: ${newReq.tenMatHang} (${newReq.soLuong} ${newReq.donViTinh}) • Ưu tiên: ${newReq.mucDoUuTien}`
    );
    triggerWebNotification({
      type: 'TICKET_MOI',
      title: `[${moduleLabel}] ${newReq.maPhieu}: ${newReq.tenMatHang}`,
      message: `${newReq.nguoiYeuCau} đề xuất mua ${newReq.soLuong} ${newReq.donViTinh} ${newReq.tenMatHang} (${newReq.mucDoUuTien}). Lý do: ${newReq.lyDoYeuCau}`,
      relatedId: newReq.maPhieu,
      targetTab: newReq.loaiYeuCau === 'DUNG_CU' ? 'tools' : 'spare_parts',
    });
    return newReq;
  };

  const updatePurchaseRequest = (req: PurchaseRequest) => {
    const existing = purchaseRequests.find((r) => r.id === req.id);
    if (!existing) return;
    const actor = currentUserRef.current;
    const allowCostField = canViewCosts(actor);
    const nextPrice = allowCostField
      ? typeof req.donGiaDuKien === 'number' && Number.isFinite(req.donGiaDuKien)
        ? Math.max(0, req.donGiaDuKien)
        : undefined
      : existing.donGiaDuKien;

    const updated: PurchaseRequest = {
      ...existing,
      ...req,
      // Keep immutable metadata untouched for Firestore security rules consistency
      id: existing.id,
      maPhieu: existing.maPhieu,
      loaiYeuCau: existing.loaiYeuCau,
      nguoiYeuCau: existing.nguoiYeuCau,
      ngayYeuCau: existing.ngayYeuCau,
      soLuong: Math.max(1, Number(req.soLuong) || 1),
      donGiaDuKien: nextPrice,
    };

    setPurchaseRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    syncDoc('purchase_requests', updated.id, sanitizePurchaseRequest(updated));
    const moduleLabel =
      updated.loaiYeuCau === 'DUNG_CU' ? 'Yêu cầu mua dụng cụ' : 'Yêu cầu mua vật tư';
    addAuditLog(
      'Sửa',
      moduleLabel,
      updated.maPhieu,
      `Cập nhật phiếu ${updated.maPhieu}: ${updated.tenMatHang} (SL: ${updated.soLuong} ${updated.donViTinh})`
    );
  };

  const updatePurchaseRequestStatus = (params: {
    id: string;
    trangThai: PurchaseRequestStatus;
    ghiChuDuyet?: string;
    autoReceiveToInventory?: boolean;
  }): { success: boolean; message?: string } => {
    const actor = currentUserRef.current;
    if (!canApprovePurchaseRequests(actor)) {
      return {
        success: false,
        message: 'Tài khoản Kỹ thuật viên không có quyền phê duyệt hoặc đổi trạng thái mua hàng.',
      };
    }
    const existing = purchaseRequests.find((r) => r.id === params.id);
    if (!existing) {
      return { success: false, message: 'Không tìm thấy phiếu yêu cầu mua hàng.' };
    }

    const today = getVietnamTodayYMD();
    let stockedInventory = existing.daNhapKho || false;

    if (
      params.trangThai === 'Đã nhận hàng' &&
      params.autoReceiveToInventory &&
      !existing.daNhapKho &&
      existing.maMatHang
    ) {
      const codeLower = existing.maMatHang.trim().toLowerCase();
      if (existing.loaiYeuCau === 'VAT_TU') {
        const matchedPart = spareParts.find((p) => p.maVatTu.trim().toLowerCase() === codeLower);
        if (matchedPart) {
          const newTx: StockTransaction = {
            transId: nextUniqueId('TR'),
            ngay: today,
            loaiGD: 'Nhập kho',
            maVatTu: matchedPart.maVatTu,
            thietBiSuDung: existing.maThietBiLienQuan || matchedPart.tenThietBiSuDung || 'Kho chung',
            soLuong: existing.soLuong,
            nguoiThucHien: actor.tenNhanVien,
            ghiChu: `Nhập kho từ phiếu mua vật tư ${existing.maPhieu}`,
          };
          const updatedPart: SparePart = {
            ...matchedPart,
            tonThucTe: applyStockTransaction(matchedPart.tonThucTe, 'Nhập kho', existing.soLuong),
          };
          setStockTransactions((prev) => [newTx, ...prev]);
          setSpareParts((prev) =>
            prev.map((sp) => (sp.maVatTu === updatedPart.maVatTu ? updatedPart : sp))
          );
          syncDoc('stock_transactions', newTx.transId, sanitizeStockTx(newTx));
          syncDoc('spare_parts', updatedPart.maVatTu, sanitizeSparePart(updatedPart));
          stockedInventory = true;
        }
      } else {
        const matchedTool = tools.find((t) => t.maDungCu.trim().toLowerCase() === codeLower);
        if (matchedTool) {
          const updatedTool: ToolItem = {
            ...matchedTool,
            soLuongTong: matchedTool.soLuongTong + existing.soLuong,
            soLuongKhaDung: matchedTool.soLuongKhaDung + existing.soLuong,
          };
          const newToolLog: ToolBorrowLog = {
            id: nextUniqueId('TLG'),
            maDungCu: matchedTool.maDungCu,
            tenDungCu: matchedTool.tenDungCu,
            loaiGiaoDich: 'Kiểm kê',
            soLuong: existing.soLuong,
            nguoiMuon: existing.nguoiYeuCau,
            nguoiBanGiao: actor.tenNhanVien,
            ngayGiaoDich: today,
            ghiChu: `Bổ sung tồn kho từ phiếu mua dụng cụ ${existing.maPhieu}`,
          };
          setTools((prev) => prev.map((t) => (t.id === updatedTool.id ? updatedTool : t)));
          setToolLogs((prev) => [newToolLog, ...prev]);
          syncDoc('tools', updatedTool.id, sanitizeToolItem(updatedTool));
          syncDoc('tool_logs', newToolLog.id, sanitizeToolLog(newToolLog));
          stockedInventory = true;
        }
      }
    }

    const isApprovalStep =
      params.trangThai === 'Đã duyệt' ||
      params.trangThai === 'Đang đặt hàng' ||
      params.trangThai === 'Từ chối' ||
      params.trangThai === 'Đã nhận hàng';

    const updated: PurchaseRequest = {
      ...existing,
      trangThai: params.trangThai,
      ghiChuDuyet:
        params.ghiChuDuyet !== undefined ? params.ghiChuDuyet.trim() || undefined : existing.ghiChuDuyet,
      nguoiDuyet: isApprovalStep ? existing.nguoiDuyet || actor.tenNhanVien : existing.nguoiDuyet,
      ngayDuyet: isApprovalStep ? existing.ngayDuyet || today : existing.ngayDuyet,
      nguoiNhanHang: params.trangThai === 'Đã nhận hàng' ? actor.tenNhanVien : existing.nguoiNhanHang,
      ngayNhanHang: params.trangThai === 'Đã nhận hàng' ? today : existing.ngayNhanHang,
      daNhapKho: stockedInventory,
    };

    setPurchaseRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    syncDoc('purchase_requests', updated.id, sanitizePurchaseRequest(updated));
    const moduleLabel =
      updated.loaiYeuCau === 'DUNG_CU' ? 'Yêu cầu mua dụng cụ' : 'Yêu cầu mua vật tư';
    addAuditLog(
      params.trangThai === 'Đã nhận hàng' ? 'Hoàn thành' : 'Cập nhật',
      moduleLabel,
      updated.maPhieu,
      `${actor.tenNhanVien} chuyển trạng thái ${updated.maPhieu} (${updated.tenMatHang}) -> ${params.trangThai}${
        stockedInventory ? ' (Đã cộng tồn kho)' : ''
      }`
    );
    triggerWebNotification({
      type: 'BAO_CAO_HOAN_THANH',
      title: `[${moduleLabel}] ${updated.maPhieu} — ${params.trangThai}`,
      message: `${updated.tenMatHang} (${updated.soLuong} ${updated.donViTinh}) đã được ${actor.tenNhanVien} cập nhật trạng thái: ${params.trangThai}.${
        updated.ghiChuDuyet ? ` Ghi chú: ${updated.ghiChuDuyet}` : ''
      }`,
      relatedId: updated.maPhieu,
      targetTab: updated.loaiYeuCau === 'DUNG_CU' ? 'tools' : 'spare_parts',
    });
    return { success: true };
  };

  const deletePurchaseRequest = (id: string) => {
    if (!canDeleteRecords(currentUserRef.current)) return;
    const target = purchaseRequests.find((r) => r.id === id);
    setPurchaseRequests((prev) => prev.filter((r) => r.id !== id));
    removeDocCloud('purchase_requests', id);
    const moduleLabel =
      target?.loaiYeuCau === 'DUNG_CU' ? 'Yêu cầu mua dụng cụ' : 'Yêu cầu mua vật tư';
    addAuditLog(
      'Xóa',
      moduleLabel,
      target?.maPhieu || id,
      `Xóa phiếu yêu cầu mua ${target?.tenMatHang || id}`
    );
  };

  const login = (usernameInput: string, passwordInput?: string): { success: boolean; message?: string } => {
    const cleanUser = usernameInput.trim().toLowerCase();
    if (!cleanUser) {
      return { success: false, message: 'Vui lòng nhập mã nhân viên hoặc tên đăng nhập!' };
    }

    if (!passwordInput || passwordInput.trim() === '') {
      return { success: false, message: 'Vui lòng nhập mật khẩu đăng nhập!' };
    }

    const found = employees.find(
      (e) =>
        e.maNhanVien.toLowerCase() === cleanUser ||
        (e.username && e.username.toLowerCase() === cleanUser) ||
        e.email.toLowerCase() === cleanUser
    );

    if (!found) {
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
    }

    const expectedPass = found.password || '123456';
    if (passwordInput.trim() !== expectedPass) {
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
    }

    applyCurrentUser(found, true);
    setIsAuthenticated(true);
    addAuditLog(
      'Đăng nhập',
      'Hệ thống',
      found.maNhanVien,
      `Người dùng ${found.tenNhanVien} (${found.maNhanVien} - ${found.chucVu}) đăng nhập thành công`,
      found
    );
    return { success: true };
  };

  const changePassword = (
    usernameInput: string,
    currentPasswordInput: string,
    newPasswordInput: string
  ): { success: boolean; message: string } => {
    const cleanUser = usernameInput.trim().toLowerCase();
    if (!cleanUser) {
      return { success: false, message: 'Vui lòng nhập mã nhân viên hoặc tên đăng nhập!' };
    }
    if (!currentPasswordInput.trim() || !newPasswordInput.trim()) {
      return { success: false, message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới!' };
    }
    if (newPasswordInput.trim().length < 4) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự!' };
    }

    const found = employees.find(
      (e) =>
        e.maNhanVien.toLowerCase() === cleanUser ||
        (e.username && e.username.toLowerCase() === cleanUser) ||
        e.email.toLowerCase() === cleanUser
    );

    if (!found) {
      return { success: false, message: 'Thông tin tài khoản hoặc mật khẩu hiện tại không chính xác!' };
    }

    const expectedPass = found.password || '123456';
    if (currentPasswordInput.trim() !== expectedPass) {
      return { success: false, message: 'Thông tin tài khoản hoặc mật khẩu hiện tại không chính xác!' };
    }

    const updatedEmp: Employee = { ...found, password: newPasswordInput.trim() };
    setEmployees((prev) => prev.map((e) => (e.maNhanVien === found.maNhanVien ? updatedEmp : e)));
    if (currentUserRef.current.maNhanVien === found.maNhanVien) {
      applyCurrentUser(updatedEmp, false);
    }

    addAuditLog(
      'Cập nhật',
      'Bảo mật tài khoản',
      found.maNhanVien,
      `Người dùng ${found.tenNhanVien} (${found.maNhanVien}) đã đổi mật khẩu đăng nhập.`,
      found
    );

    return { success: true, message: 'Đổi mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới ngay.' };
  };

  const logout = () => {
    const actor = currentUserRef.current || currentUser;
    addAuditLog(
      'Đăng xuất',
      'Hệ thống',
      actor.maNhanVien,
      `Người dùng ${actor.tenNhanVien} (${actor.maNhanVien} - ${actor.chucVu}) đăng xuất khỏi hệ thống`,
      actor
    );
    setIsAuthenticated(false);
    sessionStorage.removeItem('cmms_authenticated');
    sessionStorage.removeItem('cmms_auth_user');
    void signOutGmail();
  };

  // Email & Alert Service Methods
  const updateEmailConfig = (cfg: Partial<EmailConfig>) => {
    setEmailConfig((prev) => {
      const next = { ...prev, ...cfg };
      syncDoc('settings', 'email_config', {
        key: 'email_config',
        payload: next as unknown as Record<string, unknown>,
      });
      return next;
    });
    addAuditLog('Sửa', 'Cấu hình Email', 'EmailService', 'Cập nhật cài đặt dịch vụ thông báo email');
  };

  const openEmailDispatchModal = (draft: PendingEmailDispatch) => {
    setPendingEmailDispatch(draft);
  };

  const closeEmailDispatchModal = () => {
    setPendingEmailDispatch(null);
  };

  const markEmailDispatchStatus = (
    logId: string,
    status: EmailLog['status'],
    updatedFields?: { to?: string; cc?: string; subject?: string; body?: string }
  ) => {
    setEmailLogs((prev) =>
      prev.map((log) => {
        if (log.id !== logId) return log;
        const nextLog: EmailLog = {
          ...log,
          status,
          recipient: updatedFields?.to !== undefined ? updatedFields.to : log.recipient,
          cc: updatedFields?.cc !== undefined ? updatedFields.cc : log.cc,
          subject: updatedFields?.subject !== undefined ? updatedFields.subject : log.subject,
          fullContent: updatedFields?.body !== undefined ? updatedFields.body : log.fullContent,
          bodySnippet:
            updatedFields?.body !== undefined
              ? updatedFields.body.slice(0, 160) + (updatedFields.body.length > 160 ? '...' : '')
              : log.bodySnippet,
          errorMessage:
            status === 'Đã gửi' || status === 'Đã gửi (Webhook)' || status === 'Đã gửi (Gmail)'
              ? undefined
              : log.errorMessage,
        };
        syncDoc('email_logs', nextLog.id, sanitizeEmailLog(nextLog));
        return nextLog;
      })
    );
  };

  const resolveTargetTabForNotificationType = (
    type: EmailLog['type'],
    relatedId?: string
  ): string => {
    if (type === 'TICKET_MOI') return 'tickets';
    if (type === 'BAO_TRI_DEN_HAN' || type === 'BAO_TRI_QUA_HAN') return 'maintenance';
    if (type === 'KIEM_DINH_DEN_HAN') return 'inspection_calibration';
    if (type === 'GIAO_VIEC' || type === 'BAO_CAO_HOAN_THANH') {
      if (relatedId && relatedId.toUpperCase().startsWith('TK')) return 'tickets';
      return 'my_tasks';
    }
    if (type === 'BAO_CAO_THANG_BGD') return 'monthly_report';
    return 'email_alerts';
  };

  const requestBrowserNotificationPermission = async (): Promise<
    NotificationPermission | 'unsupported'
  > => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBrowserNotificationPermission('unsupported');
      return 'unsupported';
    }
    try {
      const permission = await window.Notification.requestPermission();
      setBrowserNotificationPermission(permission);
      return permission;
    } catch {
      const current = window.Notification.permission;
      setBrowserNotificationPermission(current);
      return current;
    }
  };

  const triggerWebNotification = (params: {
    type: EmailLog['type'];
    title: string;
    message: string;
    relatedId?: string;
    targetTab?: string;
  }): WebNotificationItem => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const item: WebNotificationItem = {
      id: nextUniqueId('WNF'),
      timestamp: timeStr,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedId: params.relatedId,
      targetTab:
        params.targetTab || resolveTargetTabForNotificationType(params.type, params.relatedId),
      read: false,
    };

    setWebNotifications((prev) => [item, ...prev].slice(0, 60));

    if (emailConfig.enableInAppToast !== false) {
      setActiveWebToast(item);
    }

    if (
      emailConfig.enableBrowserNotifications !== false &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      window.Notification.permission === 'granted'
    ) {
      try {
        const browserNote = new window.Notification(params.title, {
          body: params.message.slice(0, 200),
          tag: item.id,
        });
        browserNote.onclick = () => {
          window.focus();
          if (item.targetTab) {
            window.dispatchEvent(new CustomEvent('fsm:navigate-tab', { detail: item.targetTab }));
          }
          browserNote.close();
        };
      } catch {
        // Ignore browser notification restrictions on certain mobile environments
      }
    }

    return item;
  };

  const markWebNotificationRead = (id: string) => {
    setWebNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllWebNotificationsRead = () => {
    setWebNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearWebNotifications = () => {
    setWebNotifications([]);
  };

  const dismissActiveWebToast = () => {
    setActiveWebToast(null);
  };

  const getVietnamTodayYMD = (): string => {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
  };

  const hashEmailSignature = (str: string): string => {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  };

  const normalizeDedupField = (raw: string): string =>
    raw.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();

  const buildClientEmailDedupSignature = (params: {
    dayYMD: string;
    toList: string[];
    ccList: string[];
    subject: string;
    body: string;
  }): string => {
    const sortedTo = [...params.toList].map((e) => e.toLowerCase()).sort().join(',');
    const sortedCc = [...params.ccList].map((e) => e.toLowerCase()).sort().join(',');
    return `${params.dayYMD}|${sortedTo}|${sortedCc}|${normalizeDedupField(params.subject)}|${normalizeDedupField(params.body)}`;
  };

  const getDailyDedupStorageKey = (dayYMD: string) => `cmms_daily_email_dedup_${dayYMD}`;

  const hasDailyDedupHashInStorage = (dayYMD: string, hash: string): boolean => {
    try {
      const raw = localStorage.getItem(getDailyDedupStorageKey(dayYMD));
      if (!raw) return false;
      const arr = JSON.parse(raw) as unknown;
      return Array.isArray(arr) && arr.includes(hash);
    } catch {
      return false;
    }
  };

  const recordDailyDedupHashInStorage = (dayYMD: string, hash: string) => {
    try {
      const activeKey = getDailyDedupStorageKey(dayYMD);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cmms_daily_email_dedup_') && k !== activeKey) {
          localStorage.removeItem(k);
        }
      }
      const raw = localStorage.getItem(activeKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      const arr = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
      if (!arr.includes(hash)) {
        arr.push(hash);
        localStorage.setItem(activeKey, JSON.stringify(arr.slice(-100)));
      }
    } catch {
      // ignore storage errors
    }
  };

  const sendEmailNotification = async (params: {
    type: EmailLog['type'];
    subject: string;
    body: string;
    recipient?: string;
    cc?: string;
    relatedId?: string;
    interactiveFallback?: boolean;
    webhookUrlOverride?: string;
    userConfirmed?: boolean;
    allowDuplicate?: boolean;
  }): Promise<EmailSendResult> => {
    const rawRecipient = (params.recipient || emailConfig.primaryRecipient || '').trim();
    const rawCc = (params.cc !== undefined ? params.cc : emailConfig.ccRecipients || '').trim();

    const parsedTo = Array.from(
      new Set(
        rawRecipient
          .split(/[,;]+/)
          .map((s) => s.trim())
          .filter((s) => isValidEmailFormat(s))
      )
    );
    const deliverableTo = parsedTo.filter((addr) => !isPlaceholderEmail(addr));
    const deliverableCc = Array.from(
      new Set(
        rawCc
          .split(/[,;]+/)
          .map((s) => s.trim())
          .filter((s) => isValidEmailFormat(s) && !isPlaceholderEmail(s) && !deliverableTo.includes(s))
      )
    );

    const targetRecipient = deliverableTo.join(', ') || rawRecipient;
    const targetCc = deliverableCc.join(', ');
    const now = new Date();
    const todayYMD = getVietnamTodayYMD();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const logId = nextUniqueId('EML');
    const webhookUrl = (
      params.webhookUrlOverride !== undefined
        ? params.webhookUrlOverride
        : emailConfig.webhookUrl || ''
    ).trim();

    const deliveryMode = emailConfig.notificationMode || 'both';
    const shouldNotifyWeb = deliveryMode === 'web_only' || deliveryMode === 'both';

    const dedupSignature = buildClientEmailDedupSignature({
      dayYMD: todayYMD,
      toList: deliverableTo,
      ccList: deliverableCc,
      subject: params.subject,
      body: params.body,
    });
    const dedupHash = hashEmailSignature(dedupSignature);
    const shouldCheckDedup =
      deliveryMode !== 'web_only' && !params.allowDuplicate && deliverableTo.length > 0;

    if (shouldCheckDedup) {
      const normalizedSubj = normalizeDedupField(params.subject);
      const normalizedBody = normalizeDedupField(params.body);
      const sortedTargetTo = [...deliverableTo].map((e) => e.toLowerCase()).sort().join(',');

      const alreadySentInLogs = latestSnapshotRef.current.emailLogs.some((log) => {
        if (!log.timestamp || !log.timestamp.startsWith(todayYMD)) return false;
        if (
          log.status === 'Thất bại' ||
          log.status === 'Chờ người dùng gửi' ||
          log.status === 'Thông báo Web'
        ) {
          return false;
        }
        if (
          params.relatedId === 'AUTO-INSPECTION-REMINDER' &&
          log.relatedId === 'AUTO-INSPECTION-REMINDER'
        ) {
          return true;
        }
        const logTo = log.recipient
          .split(/[,;]+/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
          .sort()
          .join(',');
        return (
          logTo === sortedTargetTo &&
          normalizeDedupField(log.subject || '') === normalizedSubj &&
          normalizeDedupField(log.fullContent || '') === normalizedBody
        );
      });

      if (
        inFlightEmailSignaturesRef.current.has(dedupSignature) ||
        hasDailyDedupHashInStorage(todayYMD, dedupHash) ||
        alreadySentInLogs
      ) {
        return {
          success: true,
          method: 'auto',
          deduplicated: true,
          webNotified: false,
          recipient: targetRecipient,
          logId: '',
          message: 'Email cùng nội dung đã được gửi trong ngày hôm nay (hệ thống tự động chặn gửi trùng).',
        };
      }
    }

    // Trigger instant 0đ Web Notification when enabled
    let webNotified = false;
    if (shouldNotifyWeb) {
      const compactSummary = params.body
        .replace(/^Kính gửi[^\n]*\n+/i, '')
        .replace(/\s+/g, ' ')
        .trim();
      triggerWebNotification({
        type: params.type,
        title: params.subject,
        message: compactSummary.slice(0, 180) + (compactSummary.length > 180 ? '...' : ''),
        relatedId: params.relatedId,
        targetTab: resolveTargetTabForNotificationType(params.type, params.relatedId),
      });
      webNotified = true;
    }

    // If user chose Web Only mode (100% free), log and return immediately without requiring email credentials
    if (deliveryMode === 'web_only') {
      const webOnlyLog: EmailLog = {
        id: logId,
        timestamp: timeStr,
        type: params.type,
        recipient: targetRecipient ? `${targetRecipient} (Web)` : 'Thông báo Web (Miễn phí 0đ)',
        cc: targetCc,
        subject: params.subject,
        bodySnippet: params.body.slice(0, 160) + (params.body.length > 160 ? '...' : ''),
        fullContent: params.body,
        status: 'Thông báo Web',
        relatedId: params.relatedId,
      };
      setEmailLogs((prev) => [webOnlyLog, ...prev]);
      syncDoc('email_logs', webOnlyLog.id, sanitizeEmailLog(webOnlyLog));
      addAuditLog('Thêm', 'Thông báo Web', logId, `Đã phát thông báo Web miễn phí: ${params.subject}`);

      return {
        success: true,
        method: 'auto',
        channel: 'web',
        webNotified: true,
        recipient: 'Thông báo Web (Miễn phí 0đ)',
        logId,
        message: 'Đã phát thông báo Web tức thời (miễn phí 100%, không cần SMTP/Email)!',
      };
    }

    const htmlBody = buildProfessionalEmailHtml({
      type: params.type,
      subject: params.subject,
      body: params.body,
      senderName: emailConfig.senderName,
      relatedId: params.relatedId,
      timestamp: timeStr,
    });

    let sentSuccess = false;
    let sentChannel: 'gmail' | 'smtp' | 'resend' | 'webhook' | undefined;
    let serverDeduplicated = false;
    let notConfigured = false;
    let needsGmailAuth = false;
    let errorMessage = '';

    if (shouldCheckDedup) {
      inFlightEmailSignaturesRef.current.add(dedupSignature);
    }

    try {
      if (parsedTo.length === 0) {
        errorMessage = 'Địa chỉ email người nhận đang trống hoặc sai định dạng.';
      } else if (deliverableTo.length === 0) {
        errorMessage = `Địa chỉ người nhận (${parsedTo.join(', ')}) đang là email mẫu (@factory.com). Vui lòng sửa thành Gmail / email thật trước khi gửi.`;
      } else {
        // 1. User-confirmed direct Gmail API dispatch (if signed in with Google)
        const gmailToken = getGmailAccessToken();
        if (params.userConfirmed && gmailToken) {
          try {
            await sendViaGmailApi({
              to: targetRecipient,
              cc: targetCc,
              subject: params.subject,
              body: params.body,
              html: htmlBody,
              senderName: emailConfig.senderName,
              fromEmail: gmailUser?.email,
            });
            sentSuccess = true;
            sentChannel = 'gmail';
          } catch (gmailErr) {
            const gMsg = gmailErr instanceof Error ? gmailErr.message : '';
            if (
              gMsg === '__GMAIL_TOKEN_EXPIRED__' ||
              gMsg === '__GMAIL_NOT_AUTHENTICATED__' ||
              gMsg === '__GMAIL_INSUFFICIENT_SCOPE__'
            ) {
              clearGmailAccessToken();
              setIsGmailConnected(false);
              needsGmailAuth = true;
              errorMessage =
                gMsg === '__GMAIL_INSUFFICIENT_SCOPE__'
                  ? 'Tài khoản Google chưa được cấp quyền gửi Gmail (gmail.send). Hãy bấm "Sign in with Google" và tích chọn ô cấp quyền gửi email.'
                  : 'Phiên kết nối Gmail đã hết hạn. Vui lòng bấm "Sign in with Google" để kết nối lại Gmail.';
            } else if (gMsg.startsWith('__GMAIL_API_DISABLED__:')) {
              errorMessage =
                'Gmail API chưa được bật trên Google Cloud Project của ứng dụng. Bạn vẫn có thể dán Webhook Google Apps Script (miễn phí 30s) hoặc bật Gmail API trong Cloud Console.';
            } else {
              errorMessage = `Lỗi Gmail API: ${gMsg || 'Không thể gửi qua Gmail'}`;
            }
          }
        }

        // 2. Fallback to backend dispatch (Webhook / Server SMTP / Resend) if Gmail API was not used or failed
        if (!sentSuccess) {
          try {
            const apiRes = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: targetRecipient,
                cc: targetCc,
                subject: params.subject,
                body: params.body,
                html: htmlBody,
                senderName: emailConfig.senderName,
                webhookUrl,
                type: params.type,
                relatedId: params.relatedId || '',
                timestamp: timeStr,
                allowDuplicate: Boolean(params.allowDuplicate),
              }),
            });

            const contentType = apiRes.headers.get('content-type') || '';
            if (apiRes.status === 404 || !contentType.includes('application/json')) {
              throw new Error('__API_UNAVAILABLE__');
            }

            const data = (await apiRes.json()) as {
              ok?: boolean;
              deduplicated?: boolean;
              channel?: 'smtp' | 'resend' | 'webhook';
              notConfigured?: boolean;
              message?: string;
            };

            if (apiRes.ok && data.ok) {
              sentSuccess = true;
              serverDeduplicated = Boolean(data.deduplicated);
              sentChannel = data.channel || 'smtp';
            } else {
              notConfigured = Boolean(data.notConfigured);
              if (!errorMessage || !data.notConfigured) {
                errorMessage = data.message || `Không thể gửi email (HTTP ${apiRes.status})`;
              }
            }
        } catch (err) {
          const msg = err instanceof Error ? err.message : '';
          if (msg === '__API_UNAVAILABLE__' && webhookUrl && /^https?:\/\//i.test(webhookUrl)) {
            const lowerWebhook = webhookUrl.toLowerCase();
            const isAppsScript = lowerWebhook.includes('script.google.com');
            if (isAppsScript && /\/dev(\?|$)/i.test(webhookUrl)) {
              errorMessage =
                'Link Google Apps Script đang là link thử nghiệm (/dev). Hãy Deploy → Web App và copy link kết thúc bằng /exec.';
            } else {
              const payload = {
                to: targetRecipient,
                cc: targetCc,
                subject: params.subject,
                body: params.body,
                htmlBody,
                timestamp: timeStr,
                sender: emailConfig.senderName,
                type: params.type,
                relatedId: params.relatedId || '',
              };
              try {
                const directRes = await fetch(webhookUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': isAppsScript ? 'text/plain;charset=utf-8' : 'application/json',
                  },
                  body: JSON.stringify(payload),
                });
                const directText = await directRes.text().catch(() => '');
                if (!directRes.ok) {
                  throw new Error(`Webhook HTTP ${directRes.status}`);
                }
                if (/<!doctype|<html|accounts\.google\.com|ServiceLogin|Script function not found/i.test(directText)) {
                  throw new Error(
                    'Webhook Apps Script trả về HTML/lỗi (chưa chọn quyền "Anyone / Bất kỳ ai" khi Deploy hoặc thiếu doPost).'
                  );
                }
                if (isAppsScript) {
                  let parsed: { ok?: boolean; error?: string } | null = null;
                  try {
                    parsed = directText ? (JSON.parse(directText) as { ok?: boolean; error?: string }) : null;
                  } catch {
                    throw new Error(
                      'Webhook Apps Script không trả về JSON { "ok": true }. Hãy Deploy lại phiên bản mới hoặc xóa Webhook để gửi qua Gmail.'
                    );
                  }
                  if (!parsed || parsed.ok !== true) {
                    throw new Error(parsed?.error || 'Webhook Apps Script không xác nhận đã gửi mail.');
                  }
                } else if (directText) {
                  try {
                    const parsed = JSON.parse(directText) as { ok?: boolean; error?: string };
                    if (parsed && parsed.ok === false) {
                      throw new Error(parsed.error || 'Webhook trả về lỗi xử lý');
                    }
                  } catch (jsonErr) {
                    if (
                      jsonErr instanceof Error &&
                      !jsonErr.message.includes('JSON') &&
                      !jsonErr.message.includes('Unexpected token')
                    ) {
                      throw jsonErr;
                    }
                  }
                }
                sentSuccess = true;
                sentChannel = 'webhook';
              } catch (directErr) {
                errorMessage =
                  directErr instanceof Error
                    ? directErr.message
                    : 'Không thể xác nhận Webhook gửi email (lỗi CORS/kết nối). Hãy bấm "Sign in with Google" để gửi trực tiếp qua Gmail.';
              }
            }
          } else if (msg === '__API_UNAVAILABLE__') {
            notConfigured = true;
            if (!errorMessage) {
              errorMessage =
                'Bạn chưa kết nối Gmail (Sign in with Google) hoặc chưa dán Webhook gửi mail tự động.';
            }
          } else if (!errorMessage) {
            errorMessage = msg || 'Lỗi kết nối máy chủ gửi email.';
          }
        }
      }
    }

    if (sentSuccess) {
      if (shouldCheckDedup && !params.allowDuplicate) {
        recordDailyDedupHashInStorage(todayYMD, dedupHash);
      }
      if (serverDeduplicated) {
        return {
          success: true,
          method: sentChannel === 'webhook' ? 'webhook' : 'auto',
          channel: sentChannel,
          deduplicated: true,
          webNotified,
          recipient: targetRecipient,
          logId: '',
          message:
            'Email cùng nội dung đã được gửi trong ngày hôm nay (máy chủ tự động chặn gửi trùng).',
        };
      }

      const logStatus: EmailLog['status'] = shouldNotifyWeb
        ? 'Đã gửi Web + Email'
        : sentChannel === 'gmail'
        ? 'Đã gửi (Gmail)'
        : sentChannel === 'webhook'
        ? 'Đã gửi (Webhook)'
        : 'Đã gửi';
      const sentLog: EmailLog = {
        id: logId,
        timestamp: timeStr,
        type: params.type,
        recipient: targetRecipient,
        cc: targetCc,
        subject: params.subject,
        bodySnippet: params.body.slice(0, 160) + (params.body.length > 160 ? '...' : ''),
        fullContent: params.body,
        status: logStatus,
        relatedId: params.relatedId,
      };
      setEmailLogs((prev) => [sentLog, ...prev]);
      syncDoc('email_logs', sentLog.id, sanitizeEmailLog(sentLog));
      addAuditLog(
        'Thêm',
        'Thông báo Email',
        logId,
        `Đã tự động gửi ${shouldNotifyWeb ? 'Web + ' : ''}email (${sentChannel || 'auto'}) tới ${targetRecipient}: ${params.subject}`
      );
      let channelLabel = '';
      if (sentChannel === 'gmail') {
        channelLabel = gmailUser?.email ? ` qua Gmail (${gmailUser.email})` : ' qua Gmail';
      } else if (sentChannel === 'webhook') {
        let host = 'Webhook';
        try {
          if (webhookUrl) host = new URL(webhookUrl).hostname;
        } catch {
          // ignore
        }
        channelLabel = ` qua Webhook (${host})`;
      } else if (sentChannel === 'smtp') {
        channelLabel = ' qua SMTP';
      } else if (sentChannel === 'resend') {
        channelLabel = ' qua Resend';
      }

      return {
        success: true,
        method: sentChannel === 'webhook' ? 'webhook' : 'auto',
        channel: sentChannel,
        webNotified,
        recipient: targetRecipient,
        logId,
        message: `${shouldNotifyWeb ? 'Đã phát thông báo Web (0đ) & ' : 'Đã '}gửi email${channelLabel} tới ${targetRecipient}`,
      };
    }

    // 3. Honest failure / unconfigured log
    const finalErrorMsg = webNotified
      ? `Đã phát thông báo Web (0đ), nhưng Email chưa gửi được: ${errorMessage}`
      : errorMessage;
    const failedLog: EmailLog = {
      id: logId,
      timestamp: timeStr,
      type: params.type,
      recipient: targetRecipient,
      cc: targetCc,
      subject: params.subject,
      bodySnippet: params.body.slice(0, 160) + (params.body.length > 160 ? '...' : ''),
      fullContent: params.body,
      status: 'Thất bại',
      relatedId: params.relatedId,
      errorMessage: finalErrorMsg,
    };

    setEmailLogs((prev) => [failedLog, ...prev]);
    syncDoc('email_logs', failedLog.id, sanitizeEmailLog(failedLog));
    addAuditLog(
      'Thêm',
      'Thông báo Email',
      logId,
      `Gửi email tự động tới ${targetRecipient} chưa thành công: ${errorMessage}`
    );

    return {
      success: false,
      method: 'failed',
      webNotified,
      notConfigured,
      needsGmailAuth,
      recipient: targetRecipient,
      logId,
      message: finalErrorMsg,
    };
    } finally {
      if (shouldCheckDedup) {
        inFlightEmailSignaturesRef.current.delete(dedupSignature);
      }
    }
  };

  const assignWorkAndNotify = async (params: {
    module: 'THIET_BI' | 'KE_HOACH_BAO_TRI' | 'TICKET';
    targetId: string;
    targetName: string;
    assigneeName: string;
    assigneeNames?: string[];
    assignerName: string;
    note?: string;
    sendEmail?: boolean;
    recipientEmailOverride?: string;
    saveEmailToProfile?: boolean;
  }): Promise<EmailSendResult | null> => {
    if (!canAssignWork(currentUserRef.current)) {
      return null;
    }
    const parsedList =
      params.assigneeNames && params.assigneeNames.length > 0
        ? Array.from(new Set(params.assigneeNames.map((n) => n.trim()).filter(Boolean)))
        : parseAssigneeNames(params.assigneeName);
    const formattedAssignee = formatAssigneeNames(parsedList) || params.assigneeName;
    const resolvedEmails = resolveAssigneeEmails(
      parsedList.length > 0 ? parsedList : params.assigneeName,
      employees,
      emailConfig.primaryRecipient
    );
    const overrideEmail = (params.recipientEmailOverride || '').trim();
    const targetEmail = overrideEmail || resolvedEmails.join(', ') || emailConfig.primaryRecipient;

    // Optionally persist updated real email to single assignee's employee profile
    let updatedEmployeesList = employeesRef.current;
    if (overrideEmail && params.saveEmailToProfile && parsedList.length === 1 && !overrideEmail.includes(',')) {
      const targetNameLower = parsedList[0].trim().toLowerCase();
      updatedEmployeesList = employeesRef.current.map((emp) => {
        if (
          emp.tenNhanVien.trim().toLowerCase() === targetNameLower ||
          emp.maNhanVien.trim().toLowerCase() === targetNameLower
        ) {
          const nextEmp = { ...emp, email: overrideEmail };
          syncDoc('employees_private', nextEmp.maNhanVien, sanitizeEmployeePrivate(nextEmp), updatedEmployeesList);
          return nextEmp;
        }
        return emp;
      });
      setEmployees(updatedEmployeesList);
      if (
        currentUserRef.current.tenNhanVien.trim().toLowerCase() === targetNameLower ||
        currentUserRef.current.maNhanVien.trim().toLowerCase() === targetNameLower
      ) {
        applyCurrentUser({ ...currentUserRef.current, email: overrideEmail }, false);
      }
      if (cloudUserRef.current?.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL) {
        void propagateAllowedEmails(buildAllowedEmails(updatedEmployeesList, cloudUserRef.current.email));
      }
    }

    if (params.module === 'THIET_BI') {
      setEquipment((prev) =>
        prev.map((eq) => {
          if (eq.maThietBi !== params.targetId) return eq;
          const nextEq: Equipment = {
            ...eq,
            nguoiPhuTrach: formattedAssignee,
            nguoiGiaoViec: params.assignerName,
            email: targetEmail || eq.email,
          };
          syncDoc('equipment', nextEq.maThietBi, sanitizeEquipment(nextEq), updatedEmployeesList);
          return nextEq;
        })
      );
      setMaintenancePlans((prev) =>
        prev.map((p) => {
          if (p.maThietBi !== params.targetId) return p;
          const nextPlan: MaintenancePlan = {
            ...p,
            nguoiPhuTrach: formattedAssignee,
            nguoiGiaoViec: params.assignerName,
          };
          syncDoc('maintenance_plans', nextPlan.id, sanitizeMaintenancePlan(nextPlan), updatedEmployeesList);
          return nextPlan;
        })
      );
    } else if (params.module === 'KE_HOACH_BAO_TRI') {
      setMaintenancePlans((prev) =>
        prev.map((p) => {
          if (p.id !== params.targetId && p.maThietBi !== params.targetId) return p;
          const nextPlan: MaintenancePlan = {
            ...p,
            nguoiPhuTrach: formattedAssignee,
            nguoiGiaoViec: params.assignerName,
          };
          syncDoc('maintenance_plans', nextPlan.id, sanitizeMaintenancePlan(nextPlan), updatedEmployeesList);
          return nextPlan;
        })
      );
    } else if (params.module === 'TICKET') {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.maTicket !== params.targetId) return t;
          const nextTicket: Ticket = {
            ...t,
            nguoiPhuTrach: formattedAssignee,
            nguoiGiaoViec: params.assignerName,
          };
          syncDoc('tickets', nextTicket.maTicket, sanitizeTicket(nextTicket), updatedEmployeesList);
          return nextTicket;
        })
      );
    }

    const moduleLabel =
      params.module === 'THIET_BI'
        ? 'Danh sách thiết bị'
        : params.module === 'KE_HOACH_BAO_TRI'
        ? 'Kế hoạch bảo trì'
        : 'Quản lý Tickets';

    addAuditLog(
      'Cập nhật',
      moduleLabel,
      params.targetId,
      `Giao việc cho ${formattedAssignee} (Người giao: ${params.assignerName})${params.note ? ` - ${params.note}` : ''}`
    );

    if (params.sendEmail !== false) {
      const subj = `[FACILITY SYSTEM MANAGEMENT - Giao Việc ${moduleLabel}] ${params.targetName} (${params.targetId})`;
      const body = `Kính gửi ${formattedAssignee},\n\nBạn vừa được giao nhiệm vụ trên hệ thống FACILITY SYSTEM MANAGEMENT:\n- Phân hệ: ${moduleLabel}\n- Đối tượng / Mã: ${params.targetName} (${params.targetId})\n- Người giao việc: ${params.assignerName}\n- Người phụ trách thực hiện (${parsedList.length || 1} người): ${formattedAssignee}\n${params.note ? `- Nội dung chỉ đạo: ${params.note}\n` : ''}\nSau khi hoàn tất, vui lòng cập nhật kết quả và ảnh trước/sau trên FACILITY SYSTEM MANAGEMENT để hệ thống tự động gửi báo cáo về Admin và Kỹ sư thiết bị.\n\nTrân trọng,\n${emailConfig.senderName}`;

      return await sendEmailNotification({
        type: 'GIAO_VIEC',
        subject: subj,
        body,
        recipient: targetEmail,
        relatedId: params.targetId,
        interactiveFallback: true,
        userConfirmed: true,
      });
    }

    return null;
  };

  const notifyCompletionReport = async (params: {
    module: 'BAO_TRI' | 'TICKET';
    targetId: string;
    targetName: string;
    reporterName: string;
    assignerName?: string;
    result: string;
    details?: string;
    userConfirmed?: boolean;
  }): Promise<void> => {
    const adminEmails = employees
      .filter(
        (e) =>
          e.chucVu === 'Admin' ||
          e.chucVu === 'Quản trị viên' ||
          e.chucVu === 'Owner' ||
          e.maNhanVien === 'ID1460'
      )
      .map((e) => e.email);

    const engineerEmails = employees
      .filter((e) => e.chucVu === 'Kỹ sư thiết bị')
      .map((e) => e.email);

    const assignerEmp = params.assignerName
      ? employees.find((e) => e.tenNhanVien === params.assignerName)
      : undefined;

    const allRecipients = Array.from(
      new Set(
        [...adminEmails, ...engineerEmails, assignerEmp?.email, emailConfig.primaryRecipient].filter(
          (email): email is string => Boolean(email && email.trim())
        )
      )
    );

    const recipientStr = allRecipients.join(', ') || emailConfig.primaryRecipient;
    const modText = params.module === 'BAO_TRI' ? 'Bảo Trì Thiết Bị' : 'Xử Lý Ticket Sự Cố';
    const subj = `[FACILITY SYSTEM MANAGEMENT - Báo Cáo Hoàn Thành] ${modText}: ${params.targetName} (${params.targetId})`;
    const body = `Kính gửi Admin & Kỹ sư thiết bị (${params.assignerName || 'Kỹ sư phụ trách'}),\n\nNhân sự phụ trách vừa báo cáo hoàn thành công việc trên hệ thống FACILITY SYSTEM MANAGEMENT:\n- Phân hệ: ${modText}\n- Mã / Đối tượng: ${params.targetName} (${params.targetId})\n- Người thực hiện báo cáo: ${params.reporterName}\n- Người giao việc: ${params.assignerName || 'Kỹ sư thiết bị'}\n- Kết quả: ${params.result}\n${params.details ? `- Chi tiết công việc: ${params.details}\n` : ''}\nVui lòng kiểm tra hình ảnh trước/sau xử lý và nghiệm thu trên hệ thống FACILITY SYSTEM MANAGEMENT.\n\nTrân trọng,\n${emailConfig.senderName}`;

    await sendEmailNotification({
      type: 'BAO_CAO_HOAN_THANH',
      subject: subj,
      body,
      recipient: recipientStr,
      relatedId: params.targetId,
      userConfirmed: Boolean(params.userConfirmed),
    });
  };

  const triggerMaintenanceDueAlerts = async (options?: {
    userConfirmed?: boolean;
  }): Promise<{
    sentCount: number;
    dueCount: number;
    result?: EmailSendResult;
  }> => {
    const duePlans = maintenancePlans.filter(
      (p) => p.trangThai === 'Quá hạn' || p.trangThai === 'Tới hạn' || p.trangThai === 'Sắp tới'
    );

    if (duePlans.length === 0) {
      return { sentCount: 0, dueCount: 0 };
    }

    const overdueCount = duePlans.filter((p) => p.trangThai === 'Quá hạn').length;
    const dueTodayCount = duePlans.filter((p) => p.trangThai === 'Tới hạn').length;
    const upcomingCount = duePlans.filter((p) => p.trangThai === 'Sắp tới').length;

    const subj = `[FSM Kế Hoạch] Cảnh báo ${duePlans.length} thiết bị đến hạn bảo trì định kỳ (${overdueCount} quá hạn, ${dueTodayCount} tới hạn, ${upcomingCount} sắp tới)`;

    let body = `Kính gửi Đội ngũ Kỹ thuật & Quản lý Bảo trì Nhà máy,\n\n`;
    body += `Hệ thống FACILITY SYSTEM MANAGEMENT vừa quét kế hoạch bảo dưỡng định kỳ và phát hiện ${duePlans.length} thiết bị máy móc đến hạn bảo trì cần triển khai ngay:\n\n`;

    duePlans.slice(0, 20).forEach((p, i) => {
      body += `${i + 1}. [${p.trangThai.toUpperCase()}] ${p.tenThietBi} (${p.maThietBi})\n`;
      body += `   - Tần suất: ${p.tanSuat} | Ngày đến hạn: ${p.ngayBaoTriTiepTheo} | Người phụ trách: ${p.nguoiPhuTrach}\n`;
    });

    if (duePlans.length > 20) {
      body += `\n... và ${duePlans.length - 20} thiết bị khác đang tới hạn. Vui lòng kiểm tra tab Kế Hoạch Bảo Trì trên hệ thống.\n`;
    }

    body += `\nĐề nghị các kỹ sư phụ trách rà soát tồn kho phụ tùng thay thế và triển khai công việc đúng lịch trình.\n\nTrân trọng,\n${emailConfig.senderName}`;

    const result = await sendEmailNotification({
      type: overdueCount > 0 ? 'BAO_TRI_QUA_HAN' : 'BAO_TRI_DEN_HAN',
      subject: subj,
      body,
      recipient: emailConfig.primaryRecipient,
      relatedId: 'BATCH-DUE-ALERT',
      interactiveFallback: true,
      userConfirmed: Boolean(options?.userConfirmed),
    });

    return { sentCount: 1, dueCount: duePlans.length, result };
  };

  const triggerInspectionDueAlerts = async (
    isAuto: boolean = false,
    options?: { userConfirmed?: boolean }
  ): Promise<{ sentCount: number; dueCount: number; result?: EmailSendResult }> => {
    const dueItems = safetyInspections.filter((item) => {
      const status = getInspectionStatus(
        item.ngayHetHan,
        item.nhacTruocNgay ?? 30,
        item.trangThai === 'Đang kiểm định'
      );
      return status === 'Quá hạn' || status === 'Sắp đến hạn';
    });

    if (dueItems.length === 0) {
      return { sentCount: 0, dueCount: 0 };
    }

    const overdueCount = dueItems.filter(
      (i) => getInspectionStatus(i.ngayHetHan, i.nhacTruocNgay ?? 30) === 'Quá hạn'
    ).length;
    const dueSoonCount = dueItems.length - overdueCount;

    const recipientEmails = Array.from(
      new Set(
        [
          emailConfig.primaryRecipient,
          ...dueItems.map((i) => i.emailCanhBao).filter((e): e is string => Boolean(e && e.trim())),
        ].filter(Boolean)
      )
    ).join(', ');

    const subj = `[FSM Kiểm Định & Hiệu Chuẩn] ${isAuto ? 'Nhắc lịch tự động: ' : ''}${dueItems.length} thiết bị đến hạn / quá hạn kiểm định (${overdueCount} quá hạn, ${dueSoonCount} sắp đến hạn)`;

    let body = `Kính gửi Đội ngũ An Toàn, Kỹ Thuật & Quản Lý Nhà Máy,\n\n`;
    body += `Hệ thống FACILITY SYSTEM MANAGEMENT tự động rà soát lịch kiểm định an toàn & hiệu chuẩn đo lường và phát hiện ${dueItems.length} hồ sơ cần xử lý:\n\n`;

    dueItems.slice(0, 20).forEach((item, idx) => {
      const daysLeft = getInspectionDaysRemaining(item.ngayHetHan);
      const dayText =
        daysLeft < 0 ? `QUÁ HẠN ${Math.abs(daysLeft)} NGÀY` : daysLeft === 0 ? 'ĐẾN HẠN HÔM NAY' : `Còn ${daysLeft} ngày`;
      body += `${idx + 1}. [${dayText}] ${item.tenThietBi} (${item.maHoSo})\n`;
      body += `   - Phân loại: ${item.phanLoai} | Hạn: ${item.ngayHetHan} | Phụ trách: ${item.nguoiPhuTrach} | Đơn vị: ${item.donViKiemDinh}\n`;
    });

    body += `\nĐề nghị bộ phận kỹ thuật liên hệ đơn vị kiểm định/hiệu chuẩn để thực hiện đúng quy định an toàn và ISO.\n\nTrân trọng,\n${emailConfig.senderName}`;

    const result = await sendEmailNotification({
      type: 'KIEM_DINH_DEN_HAN',
      subject: subj,
      body,
      recipient: recipientEmails || emailConfig.primaryRecipient,
      relatedId: isAuto ? 'AUTO-INSPECTION-REMINDER' : 'MANUAL-INSPECTION-REMINDER',
      interactiveFallback: !isAuto,
      userConfirmed: Boolean(options?.userConfirmed),
    });

    return { sentCount: 1, dueCount: dueItems.length, result };
  };

  // Automatic daily inspection & calibration reminder check when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!emailConfig.enabled || emailConfig.notifyOnInspectionDue === false) return;
    if (cloudSyncStatus === 'syncing') return;

    const todayYMD = getVietnamTodayYMD();
    if (autoInspectionCheckedDateRef.current === todayYMD) return;

    const autoKey = `cmms_auto_inspection_reminder_${todayYMD}`;
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cmms_auto_inspection_reminder_') && k !== autoKey) {
          localStorage.removeItem(k);
        }
      }
      if (localStorage.getItem(autoKey) === 'sent') {
        autoInspectionCheckedDateRef.current = todayYMD;
        return;
      }
    } catch {
      // ignore storage errors
    }

    const checkAndTrigger = () => {
      if (autoInspectionCheckedDateRef.current === todayYMD) return;
      autoInspectionCheckedDateRef.current = todayYMD;

      const alreadyLoggedAuto = latestSnapshotRef.current.emailLogs.some(
        (log) =>
          log.type === 'KIEM_DINH_DEN_HAN' &&
          log.relatedId === 'AUTO-INSPECTION-REMINDER' &&
          log.timestamp.startsWith(todayYMD) &&
          log.status !== 'Thất bại'
      );
      if (alreadyLoggedAuto) {
        try {
          localStorage.setItem(autoKey, 'sent');
        } catch {
          // ignore
        }
        return;
      }

      const dueItems = latestSnapshotRef.current.safetyInspections.filter((item) => {
        const status = getInspectionStatus(
          item.ngayHetHan,
          item.nhacTruocNgay ?? 30,
          item.trangThai === 'Đang kiểm định'
        );
        return status === 'Quá hạn' || status === 'Sắp đến hạn';
      });

      if (dueItems.length > 0) {
        try {
          localStorage.setItem(autoKey, 'sent');
        } catch {
          // ignore
        }
        void triggerInspectionDueAlerts(true);
      }
    };

    const delayMs = cloudUserRef.current ? 1500 : 100;
    const timer = window.setTimeout(checkAndTrigger, delayMs);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, emailConfig.enabled, emailConfig.notifyOnInspectionDue, cloudSyncStatus]);

  const deleteEmailLog = (id: string) => {
    setEmailLogs((prev) => prev.filter((l) => l.id !== id));
    removeDocCloud('email_logs', id);
  };

  const clearEmailLogs = () => {
    const toRemove = [...emailLogs];
    setEmailLogs([]);
    toRemove.forEach((l) => removeDocCloud('email_logs', l.id));
    addAuditLog('Xóa', 'Thông báo Email', 'All', 'Xóa toàn bộ nhật ký gửi email');
  };

  // Reset to default
  const resetToDefaultData = () => {
    setEquipment(INITIAL_EQUIPMENT);
    setMaintenancePlans(INITIAL_MAINTENANCE_PLANS);
    setMaintenanceHistory(INITIAL_MAINTENANCE_HISTORY);
    setTickets(INITIAL_TICKETS);
    setSpareParts(INITIAL_SPARE_PARTS);
    setStockTransactions(INITIAL_STOCK_TRANSACTIONS);
    setPower10Days(INITIAL_POWER_10DAYS);
    setCostRecords(INITIAL_COST_RECORDS);
    setWaterMonthly(INITIAL_WATER_MONTHLY);
    setEmployees(INITIAL_EMPLOYEES);
    setMeterReadings(INITIAL_METER_READINGS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setEmailConfig(INITIAL_EMAIL_CONFIG);
    setEmailLogs(INITIAL_EMAIL_LOGS);
    setDocuments(INITIAL_DOCUMENTS);
    setProjects(INITIAL_PROJECTS);
    setSafetyInspections(INITIAL_SAFETY_INSPECTIONS);
    setTools(INITIAL_TOOLS);
    setToolLogs(INITIAL_TOOL_LOGS);
    setDailyAreaChecks(INITIAL_DAILY_AREA_CHECKS);
    setMorningCheckTemplates(DEFAULT_MORNING_CHECK_TEMPLATES);
    setPurchaseRequests(INITIAL_PURCHASE_REQUESTS);
    applyCurrentUser(INITIAL_EMPLOYEES[0], false);
    localStorage.clear();
    if (cloudUserRef.current?.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL) {
      void seedOrPushWorkspaceToFirestore(
        cloudUserRef.current.uid,
        cloudUserRef.current.email,
        {
          equipment: INITIAL_EQUIPMENT,
          maintenancePlans: INITIAL_MAINTENANCE_PLANS,
          maintenanceHistory: INITIAL_MAINTENANCE_HISTORY,
          tickets: INITIAL_TICKETS,
          spareParts: INITIAL_SPARE_PARTS,
          stockTransactions: INITIAL_STOCK_TRANSACTIONS,
          power10Days: INITIAL_POWER_10DAYS,
          waterMonthly: INITIAL_WATER_MONTHLY,
          meterReadings: INITIAL_METER_READINGS,
          costRecords: INITIAL_COST_RECORDS,
          employees: INITIAL_EMPLOYEES,
          documents: INITIAL_DOCUMENTS,
          projects: INITIAL_PROJECTS,
          safetyInspections: INITIAL_SAFETY_INSPECTIONS,
          tools: INITIAL_TOOLS,
          toolLogs: INITIAL_TOOL_LOGS,
          dailyAreaChecks: INITIAL_DAILY_AREA_CHECKS,
          morningCheckTemplates: DEFAULT_MORNING_CHECK_TEMPLATES,
          purchaseRequests: INITIAL_PURCHASE_REQUESTS,
          emailLogs: INITIAL_EMAIL_LOGS,
          auditLogs: INITIAL_AUDIT_LOGS,
          emailConfig: INITIAL_EMAIL_CONFIG,
          tariffConfig: DEFAULT_ENERGY_TARIFF_CONFIG,
        },
        { forcePushAll: true, knownCloudIds: knownCloudIdsRef.current }
      );
    }
  };

  // Export full backup
  const exportDatabaseJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      equipment,
      maintenancePlans,
      maintenanceHistory,
      tickets,
      spareParts,
      stockTransactions,
      power10Days,
      costRecords,
      waterMonthly,
      employees,
      meterReadings,
      auditLogs,
      documents,
      projects,
      safetyInspections,
      tools,
      toolLogs,
      dailyAreaChecks,
      morningCheckTemplates,
      monthlyBoardReports,
      purchaseRequests,
      emailConfig,
      emailLogs,
      tariffConfig,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FSM_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreFullBackup = (data: any): boolean => {
    try {
      if (!data || typeof data !== 'object') return false;
      if (Array.isArray(data.equipment)) setEquipment(data.equipment);
      if (Array.isArray(data.maintenancePlans)) setMaintenancePlans(data.maintenancePlans);
      if (Array.isArray(data.maintenanceHistory)) setMaintenanceHistory(data.maintenanceHistory);
      if (Array.isArray(data.tickets)) setTickets(data.tickets);
      if (Array.isArray(data.spareParts)) setSpareParts(data.spareParts);
      if (Array.isArray(data.stockTransactions)) setStockTransactions(data.stockTransactions);
      if (Array.isArray(data.power10Days)) setPower10Days(data.power10Days);
      if (Array.isArray(data.costRecords)) setCostRecords(data.costRecords);
      if (Array.isArray(data.waterMonthly)) setWaterMonthly(data.waterMonthly);
      if (Array.isArray(data.employees)) setEmployees(data.employees);
      if (Array.isArray(data.meterReadings)) setMeterReadings(data.meterReadings);
      if (Array.isArray(data.documents)) setDocuments(data.documents);
      if (Array.isArray(data.projects)) setProjects(data.projects);
      if (Array.isArray(data.safetyInspections)) setSafetyInspections(data.safetyInspections);
      if (Array.isArray(data.tools)) setTools(data.tools);
      if (Array.isArray(data.toolLogs)) setToolLogs(data.toolLogs);
      if (Array.isArray(data.dailyAreaChecks)) setDailyAreaChecks(data.dailyAreaChecks);
      if (Array.isArray(data.purchaseRequests)) setPurchaseRequests(data.purchaseRequests);
      if (data.morningCheckTemplates && typeof data.morningCheckTemplates === 'object') {
        setMorningCheckTemplates({
          ...DEFAULT_MORNING_CHECK_TEMPLATES,
          ...data.morningCheckTemplates,
        });
      }
      if (data.monthlyBoardReports && typeof data.monthlyBoardReports === 'object') {
        setMonthlyBoardReports({
          defaultBoardRecipients: data.monthlyBoardReports.defaultBoardRecipients || '',
          defaultCcRecipients: data.monthlyBoardReports.defaultCcRecipients || '',
          reportsByMonth: data.monthlyBoardReports.reportsByMonth || {},
        });
      }
      if (data.tariffConfig && typeof data.tariffConfig === 'object') {
        setTariffConfig({ ...DEFAULT_ENERGY_TARIFF_CONFIG, ...data.tariffConfig });
      }
      if (data.emailConfig && typeof data.emailConfig === 'object') setEmailConfig(data.emailConfig);
      addAuditLog('Cập nhật', 'Sao Lưu & Khôi Phục', 'Toàn bộ dữ liệu', 'Khôi phục thành công từ file sao lưu');
      if (cloudUserRef.current) {
        const snapToPush: WorkspaceSnapshotData = {
          equipment: Array.isArray(data.equipment) ? data.equipment : equipment,
          maintenancePlans: Array.isArray(data.maintenancePlans) ? data.maintenancePlans : maintenancePlans,
          maintenanceHistory: Array.isArray(data.maintenanceHistory) ? data.maintenanceHistory : maintenanceHistory,
          tickets: Array.isArray(data.tickets) ? data.tickets : tickets,
          spareParts: Array.isArray(data.spareParts) ? data.spareParts : spareParts,
          stockTransactions: Array.isArray(data.stockTransactions) ? data.stockTransactions : stockTransactions,
          power10Days: Array.isArray(data.power10Days) ? data.power10Days : power10Days,
          waterMonthly: Array.isArray(data.waterMonthly) ? data.waterMonthly : waterMonthly,
          meterReadings: Array.isArray(data.meterReadings) ? data.meterReadings : meterReadings,
          costRecords: Array.isArray(data.costRecords) ? data.costRecords : costRecords,
          employees: Array.isArray(data.employees) ? data.employees : employees,
          documents: Array.isArray(data.documents) ? data.documents : documents,
          projects: Array.isArray(data.projects) ? data.projects : projects,
          safetyInspections: Array.isArray(data.safetyInspections) ? data.safetyInspections : safetyInspections,
          tools: Array.isArray(data.tools) ? data.tools : tools,
          toolLogs: Array.isArray(data.toolLogs) ? data.toolLogs : toolLogs,
          dailyAreaChecks: Array.isArray(data.dailyAreaChecks) ? data.dailyAreaChecks : dailyAreaChecks,
          morningCheckTemplates:
            data.morningCheckTemplates && typeof data.morningCheckTemplates === 'object'
              ? { ...DEFAULT_MORNING_CHECK_TEMPLATES, ...data.morningCheckTemplates }
              : morningCheckTemplates,
          monthlyBoardReports:
            data.monthlyBoardReports && typeof data.monthlyBoardReports === 'object'
              ? data.monthlyBoardReports
              : monthlyBoardReports,
          purchaseRequests: Array.isArray(data.purchaseRequests) ? data.purchaseRequests : purchaseRequests,
          emailLogs: Array.isArray(data.emailLogs) ? data.emailLogs : emailLogs,
          auditLogs,
          emailConfig:
            data.emailConfig && typeof data.emailConfig === 'object' ? data.emailConfig : emailConfig,
          tariffConfig:
            data.tariffConfig && typeof data.tariffConfig === 'object'
              ? { ...DEFAULT_ENERGY_TARIFF_CONFIG, ...data.tariffConfig }
              : tariffConfig,
        };
        void seedOrPushWorkspaceToFirestore(
          cloudUserRef.current.uid,
          cloudUserRef.current.email,
          snapToPush,
          { forcePushAll: true, knownCloudIds: knownCloudIdsRef.current }
        );
      }
      return true;
    } catch (err) {
      console.error('Lỗi khôi phục sao lưu:', err);
      return false;
    }
  };

  return (
    <CMMSContext.Provider
      value={{
        equipment,
        maintenancePlans,
        maintenanceHistory,
        tickets,
        spareParts,
        stockTransactions,
        power10Days,
        costRecords,
        waterMonthly,
        employees,
        meterReadings,
        auditLogs,
        documents,
        projects,
        safetyInspections,
        tools,
        toolLogs,
        dailyAreaChecks,
        morningCheckTemplates,
        monthlyBoardReports,
        purchaseRequests,
        currentUser,
        emailConfig,
        emailLogs,
        autoEmailServerStatus,
        refreshAutoEmailStatus,
        gmailUser,
        isGmailConnected,
        connectGmail,
        disconnectGmail,
        pendingEmailDispatch,
        openEmailDispatchModal,
        closeEmailDispatchModal,
        markEmailDispatchStatus,
        updateEmailConfig,
        sendEmailNotification,
        triggerMaintenanceDueAlerts,
        triggerInspectionDueAlerts,
        deleteEmailLog,
        clearEmailLogs,
        webNotifications,
        activeWebToast,
        browserNotificationPermission,
        requestBrowserNotificationPermission,
        triggerWebNotification,
        markWebNotificationRead,
        markAllWebNotificationsRead,
        clearWebNotifications,
        dismissActiveWebToast,
        addEquipment,
        updateEquipment,
        deleteEquipment,
        addMaintenancePlan,
        updateMaintenancePlan,
        rescheduleMaintenancePlan,
        completeMaintenance,
        updateMaintenanceHistory,
        deleteMaintenanceHistory,
        addSafetyInspection,
        updateSafetyInspection,
        deleteSafetyInspection,
        completeSafetyInspection,
        addTool,
        updateTool,
        deleteTool,
        recordToolTransaction,
        addPurchaseRequest,
        updatePurchaseRequest,
        updatePurchaseRequestStatus,
        deletePurchaseRequest,
        addTicket,
        updateTicket,
        deleteTicket,
        addSparePart,
        updateSparePart,
        deleteSparePart,
        createStockTransaction,
        addPower10DaysRecord,
        updatePower10DaysRecord,
        deletePower10DaysRecord,
        addWaterMonthlyRecord,
        updateWaterMonthlyRecord,
        deleteWaterMonthlyRecord,
        addMeterReading,
        addBatchMeterReadings,
        updateMeterReading,
        deleteMeterReading,
        tariffConfig,
        updateTariffConfig,
        addCostRecord,
        updateCostRecord,
        deleteCostRecord,
        setCurrentUser,
        addEmployee,
        updateEmployee,
        addDocument,
        updateDocument,
        deleteDocument,
        addProject,
        updateProject,
        deleteProject,
        updateMorningCheckTemplate,
        resetMorningCheckTemplates,
        addDailyAreaCheck,
        updateDailyAreaCheck,
        submitDailyAreaCheckReport,
        deleteDailyAreaCheck,
        saveMonthlyBoardReport,
        deleteMonthlyBoardReport,
        isAuthenticated,
        theme,
        toggleTheme,
        setTheme,
        login,
        changePassword,
        logout,
        assignWorkAndNotify,
        notifyCompletionReport,
        addAuditLog,
        resetToDefaultData,
        exportDatabaseJSON,
        restoreFullBackup,
        cloudSyncStatus,
        cloudUser,
        cloudSyncError,
        lastSyncedAt,
        connectCloudWithGoogle,
        disconnectCloud,
        forceSyncLocalToCloud,
      }}
    >
      {children}
    </CMMSContext.Provider>
  );
};

export const useCMMS = () => {
  const context = useContext(CMMSContext);
  if (!context) {
    throw new Error('useCMMS must be used within a CMMSProvider');
  }
  return context;
};
