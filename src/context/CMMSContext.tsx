import React, { createContext, useContext, useState, useEffect } from 'react';
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
} from '../types/cmms';
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
} from '../utils/cmmsLogic';

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
  currentUser: Employee;

  // Equipment Actions
  addEquipment: (item: Equipment) => void;
  updateEquipment: (item: Equipment) => void;
  deleteEquipment: (maThietBi: string) => void;

  // Maintenance Actions
  addMaintenancePlan: (plan: MaintenancePlan) => void;
  updateMaintenancePlan: (plan: MaintenancePlan) => void;
  rescheduleMaintenancePlan: (planId: string, newDate: string) => void;
  completeMaintenance: (record: Omit<MaintenanceHistory, 'id'>) => void;
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
  triggerInspectionDueAlerts: (isAuto?: boolean) => Promise<{ sentCount: number; dueCount: number }>;

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

  // Ticket Actions
  addTicket: (ticket: Omit<Ticket, 'maTicket' | 'ngayTao'>) => void;
  updateTicket: (ticket: Ticket) => void;
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
  addWaterMonthlyRecord: (record: WaterMonthly) => void;
  updateWaterMonthlyRecord: (record: WaterMonthly) => void;
  addMeterReading: (reading: Omit<MeterReading, 'id' | 'tieuThu'>) => void;
  addBatchMeterReadings: (readings: Omit<MeterReading, 'id' | 'tieuThu'>[]) => void;

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

  // Email & Alert Service
  emailConfig: EmailConfig;
  emailLogs: EmailLog[];
  updateEmailConfig: (cfg: Partial<EmailConfig>) => void;
  sendEmailNotification: (params: {
    type: EmailLog['type'];
    subject: string;
    body: string;
    recipient?: string;
    relatedId?: string;
  }) => Promise<boolean>;
  triggerMaintenanceDueAlerts: () => Promise<{ sentCount: number; dueCount: number }>;
  deleteEmailLog: (id: string) => void;
  clearEmailLogs: () => void;

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
  }) => Promise<void>;
  notifyCompletionReport: (params: {
    module: 'BAO_TRI' | 'TICKET';
    targetId: string;
    targetName: string;
    reporterName: string;
    assignerName?: string;
    result: string;
    details?: string;
  }) => Promise<void>;

  // System Actions
  addAuditLog: (action: AuditLog['hanhDong'], chucNang: string, doiTuong: string, details: string) => void;
  resetToDefaultData: () => void;
  exportDatabaseJSON: () => void;
  restoreFullBackup: (data: any) => boolean;
}

const CMMSContext = createContext<CMMSContextType | undefined>(undefined);

const CMMS_DATA_VERSION = 'v18_calendar_dnd_inspection_tools';

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
  const [waterMonthly, setWaterMonthly] = useState<WaterMonthly[]>(() => loadStorage('waterMonthly', INITIAL_WATER_MONTHLY));
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const loaded = loadStorage('employees', INITIAL_EMPLOYEES);
    const missing = INITIAL_EMPLOYEES.filter(
      (initEmp) =>
        !loaded.some(
          (e) => e.maNhanVien.trim().toUpperCase() === initEmp.maNhanVien.trim().toUpperCase()
        )
    );
    return missing.length > 0 ? [...loaded, ...missing] : loaded;
  });
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>(() => loadStorage('meterReadings', INITIAL_METER_READINGS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStorage('auditLogs', INITIAL_AUDIT_LOGS));
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => {
    const loaded = loadStorage('emailConfig', INITIAL_EMAIL_CONFIG);
    if (loaded.senderName === 'Hệ Thống Quản Lý Bảo Trì CMMS PRO') {
      return { ...loaded, senderName: 'Hệ Thống Quản Lý FACILITY SYSTEM MANAGEMENT' };
    }
    return loaded;
  });
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => loadStorage('emailLogs', INITIAL_EMAIL_LOGS));
  const [tariffConfig, setTariffConfig] = useState<EnergyTariffConfig>(() => loadStorage('tariffConfig', DEFAULT_ENERGY_TARIFF_CONFIG));
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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cmms_authenticated') === 'true';
  });

  const [currentUser, setCurrentUserState] = useState<Employee>(() => {
    const saved = loadStorage<Employee | null>('currentUser', null);
    return saved && saved.maNhanVien ? saved : INITIAL_EMPLOYEES[0];
  });

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

  const addAuditLog = (
    hanhDong: AuditLog['hanhDong'],
    chucNang: string,
    doiTuong: string,
    details: string
  ) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      thoiGian: timeStr,
      nguoiThaoTac: currentUser.tenNhanVien,
      hanhDong,
      chucNang,
      doiTuong,
      chiTietNoiDung: details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Equipment Actions
  const addEquipment = (item: Equipment) => {
    setEquipment((prev) => [item, ...prev]);
    // Also create initial maintenance plan if not exists
    const newPlan: MaintenancePlan = {
      id: `PLAN-${Date.now().toString().slice(-4)}`,
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
    addAuditLog('Thêm', 'Danh sách thiết bị', item.maThietBi, `Thêm thiết bị mới: ${item.tenThietBi} (${item.heThong})`);
  };

  const updateEquipment = (item: Equipment) => {
    setEquipment((prev) => prev.map((e) => (e.maThietBi === item.maThietBi ? item : e)));
    // Also sync plan if equipment name / freq / handler changed
    setMaintenancePlans((prev) =>
      prev.map((p) =>
        p.maThietBi === item.maThietBi
          ? {
              ...p,
              tenThietBi: item.tenThietBi,
              tanSuat: item.tanSuat,
              nguoiPhuTrach: item.nguoiPhuTrach,
              trangThai: getMaintenanceStatus(p.ngayBaoTriTiepTheo),
            }
          : p
      )
    );
    addAuditLog('Sửa', 'Danh sách thiết bị', item.maThietBi, `Cập nhật thông tin thiết bị: ${item.tenThietBi}`);
  };

  const deleteEquipment = (maThietBi: string) => {
    const item = equipment.find((e) => e.maThietBi === maThietBi);
    setEquipment((prev) => prev.filter((e) => e.maThietBi !== maThietBi));
    setMaintenancePlans((prev) => prev.filter((p) => p.maThietBi !== maThietBi));
    addAuditLog('Xóa', 'Danh sách thiết bị', maThietBi, `Xóa thiết bị: ${item?.tenThietBi || maThietBi}`);
  };

  // Maintenance Actions
  const addMaintenancePlan = (plan: MaintenancePlan) => {
    setMaintenancePlans((prev) => [plan, ...prev]);
    addAuditLog('Thêm', 'Kế hoạch bảo trì', plan.maThietBi, `Thêm kế hoạch bảo trì: ${plan.tenThietBi}`);
  };

  const updateMaintenancePlan = (plan: MaintenancePlan) => {
    setMaintenancePlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)));
    addAuditLog('Sửa', 'Kế hoạch bảo trì', plan.maThietBi, `Cập nhật kế hoạch bảo trì: ${plan.tenThietBi}`);
  };

  const rescheduleMaintenancePlan = (planId: string, newDate: string) => {
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

    const matchingEq = equipment.find((eq) => eq.maThietBi === target.maThietBi);
    if (matchingEq) {
      const updatedEq: Equipment = { ...matchingEq, hanBaoTriTiepTheo: newDate };
      setEquipment((prev) =>
        prev.map((eq) => (eq.maThietBi === target.maThietBi ? updatedEq : eq))
      );
    }

    addAuditLog(
      'Sửa',
      'Lịch bảo trì',
      target.maThietBi,
      `Dời lịch bảo trì ${target.tenThietBi} từ ${oldDate} sang ${newDate} (Trạng thái mới: ${nextStatus})`
    );
  };

  // COMPLETE MAINTENANCE / REPAIR: Differentiate Planned Maintenance vs Repair
  const completeMaintenance = (recordData: Omit<MaintenanceHistory, 'id'>) => {
    const newId = `HIST-${Date.now().toString().slice(-6)}`;
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

    if (workType === 'Bảo trì theo kế hoạch') {
      const freq = matchingPlan?.tanSuat || matchingEq?.tanSuat || 'Monthly';
      const nextDate = calculateNextMaintenanceDate(recordData.ngayThucHien, freq);

      const synced = syncPlansWithHistory(maintenancePlans, nextHistory);
      const hasPlanForEq = synced.some((p) => p.maThietBi === recordData.maThietBi);
      let finalPlans = synced;
      if (!hasPlanForEq) {
        const autoNextPlan: MaintenancePlan = {
          id: `PLAN-${Date.now().toString().slice(-5)}`,
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
      }

      addAuditLog(
        'Hoàn thành',
        'Lịch sử sửa chữa',
        recordData.maThietBi,
        `Ghi nhận sửa chữa thiết bị ${recordData.tenThietBi} (${recordData.ngayThucHien}) vào lịch sử thiết bị (giữ nguyên chu kỳ bảo trì định kỳ).`
      );
    }

    if (emailConfig.enabled) {
      void notifyCompletionReport({
        module: 'BAO_TRI',
        targetId: recordData.maThietBi,
        targetName: recordData.tenThietBi,
        reporterName: recordData.nguoiThucHien,
        assignerName: recordData.nguoiGiaoViec || assignerName,
        result: recordData.ketQua,
        details: `[${workType}] ${recordData.ngayThucHien} • ${recordData.moTaCongViec}`,
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
    const target = maintenanceHistory.find((h) => h.id === id);
    if (!target) return;

    const nextHistory = maintenanceHistory.filter((h) => h.id !== id);
    const nextPlans = syncPlansWithHistory(maintenancePlans, nextHistory);
    setMaintenanceHistory(nextHistory);
    setMaintenancePlans(nextPlans);

    addAuditLog(
      'Xóa',
      'Lịch sử bảo trì',
      target.maThietBi,
      `Xóa biên bản bảo trì ${id} của ${target.tenThietBi}`
    );
  };

  // Ticket Actions
  const addTicket = (ticketData: Omit<Ticket, 'maTicket' | 'ngayTao'>) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newTicket: Ticket = {
      ...ticketData,
      maTicket: `TK-${Date.now().toString().slice(-6)}`,
      ngayTao: today,
    };
    setTickets((prev) => [newTicket, ...prev]);
    addAuditLog('Thêm', 'Tickets', newTicket.maTicket, `Tạo ticket mới: ${newTicket.tieuDe} (Ưu tiên: ${newTicket.mucDoUuTien})`);

    const assigneeEmails = resolveAssigneeEmails(newTicket.nguoiPhuTrach, employees);
    const recipientList = Array.from(
      new Set([...assigneeEmails, emailConfig.primaryRecipient].filter((x): x is string => Boolean(x && x.trim())))
    ).join(', ');

    // Tự động gửi thông báo Email khi có ticket mới
    if (emailConfig.enabled && emailConfig.notifyOnNewTicket) {
      const equipInfo = newTicket.maThietBi ? ` [${newTicket.maThietBi}]` : '';
      const subj = `[FACILITY SYSTEM MANAGEMENT - Ticket Mới] ${newTicket.tieuDe} (Ưu tiên: ${newTicket.mucDoUuTien})${equipInfo}`;
      const body = `Kính gửi Trưởng phòng Kỹ thuật & Kỹ sư Phụ trách,\n\nHệ thống FACILITY SYSTEM MANAGEMENT vừa ghi nhận phiếu yêu cầu sự cố / công việc mới tại nhà máy:\n- Mã Ticket: ${newTicket.maTicket}\n- Tiêu đề: ${newTicket.tieuDe}\n- Mức độ ưu tiên: ${newTicket.mucDoUuTien}\n- Thiết bị liên quan: ${newTicket.maThietBi || 'Chung'}\n- Người lập phiếu / Giao việc: ${newTicket.nguoiGiaoViec || newTicket.nguoiLap}\n- Người phụ trách: ${newTicket.nguoiPhuTrach}\n- Ngày tạo: ${today}\n- Mô tả chi tiết: ${newTicket.moTaChiTiet}\n\nVui lòng đăng nhập hệ thống FACILITY SYSTEM MANAGEMENT để điều phối và xử lý kịp thời.\n\nTrân trọng,\n${emailConfig.senderName}`;

      void sendEmailNotification({
        type: 'TICKET_MOI',
        subject: subj,
        body,
        recipient: recipientList || emailConfig.primaryRecipient,
        relatedId: newTicket.maTicket,
      });
    }

    if (emailConfig.enabled && newTicket.trangThai === 'Hoàn thành') {
      void notifyCompletionReport({
        module: 'TICKET',
        targetId: newTicket.maTicket,
        targetName: newTicket.tieuDe,
        reporterName: newTicket.nguoiPhuTrach || newTicket.nguoiLap,
        assignerName: newTicket.nguoiGiaoViec || newTicket.nguoiLap,
        result: newTicket.ketQua || 'Đã xử lý xong',
        details: newTicket.moTaChiTiet,
      });
    }
  };

  const updateTicket = (ticket: Ticket) => {
    const prevTicket = tickets.find((t) => t.maTicket === ticket.maTicket);
    setTickets((prev) => prev.map((t) => (t.maTicket === ticket.maTicket ? ticket : t)));
    addAuditLog('Sửa', 'Tickets', ticket.maTicket, `Cập nhật trạng thái ticket: ${ticket.trangThai}`);

    if (emailConfig.enabled && prevTicket && prevTicket.nguoiPhuTrach !== ticket.nguoiPhuTrach && ticket.nguoiPhuTrach) {
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
      });
    }

    if (emailConfig.enabled && prevTicket && prevTicket.trangThai !== 'Hoàn thành' && ticket.trangThai === 'Hoàn thành') {
      void notifyCompletionReport({
        module: 'TICKET',
        targetId: ticket.maTicket,
        targetName: ticket.tieuDe,
        reporterName: ticket.nguoiPhuTrach || currentUser.tenNhanVien,
        assignerName: ticket.nguoiGiaoViec || ticket.nguoiLap,
        result: ticket.ketQua || 'Hoàn thành xử lý sự cố',
        details: ticket.moTaChiTiet,
      });
    }
  };

  const deleteTicket = (maTicket: string) => {
    setTickets((prev) => prev.filter((t) => t.maTicket !== maTicket));
    addAuditLog('Xóa', 'Tickets', maTicket, `Xóa ticket: ${maTicket}`);
  };

  // Spare Parts Actions
  const addSparePart = (part: SparePart) => {
    setSpareParts((prev) => [part, ...prev]);
    addAuditLog('Thêm', 'Kho vật tư', part.maVatTu, `Thêm vật tư mới: ${part.tenVatTu} (Tồn: ${part.tonThucTe})`);
  };

  const updateSparePart = (part: SparePart) => {
    setSpareParts((prev) => prev.map((p) => (p.maVatTu === part.maVatTu ? part : p)));
    addAuditLog('Sửa', 'Kho vật tư', part.maVatTu, `Cập nhật thông tin vật tư: ${part.tenVatTu}`);
  };

  const deleteSparePart = (maVatTu: string) => {
    setSpareParts((prev) => prev.filter((p) => p.maVatTu !== maVatTu));
    addAuditLog('Xóa', 'Kho vật tư', maVatTu, `Xóa vật tư: ${maVatTu}`);
  };

  // Stock In / Out Actions: Auto deduct / add to spare parts inventory!
  const createStockTransaction = (txData: Omit<StockTransaction, 'transId'>) => {
    const newId = `TR-${Date.now().toString().slice(-6)}`;
    const newTx: StockTransaction = {
      ...txData,
      transId: newId,
    };
    setStockTransactions((prev) => [newTx, ...prev]);

    const targetPart = spareParts.find((sp) => sp.maVatTu === txData.maVatTu);
    if (targetPart) {
      const updatedPart: SparePart = {
        ...targetPart,
        tonThucTe: applyStockTransaction(targetPart.tonThucTe, txData.loaiGD, txData.soLuong),
      };
      setSpareParts((prev) => prev.map((sp) => (sp.maVatTu === txData.maVatTu ? updatedPart : sp)));
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
      id: `POW-${Date.now().toString().slice(-6)}`,
    };
    setPower10Days((prev) => [newRec, ...prev]);
    addAuditLog('Chốt số', 'Điện 10 Ngày', newRec.chuKy, `Ghi nhận dữ liệu điện 10 ngày chu kỳ: ${newRec.chuKy}`);
  };

  const updatePower10DaysRecord = (record: Power10Days) => {
    setPower10Days((prev) => prev.map((r) => (r.id === record.id ? record : r)));
    addAuditLog('Sửa', 'Điện 10 Ngày', record.chuKy, `Cập nhật số liệu điện chu kỳ: ${record.chuKy}`);
  };

  // Water Monthly Actions
  const addWaterMonthlyRecord = (record: WaterMonthly) => {
    setWaterMonthly((prev) => [record, ...prev]);
    addAuditLog('Chốt số', 'Nước Tháng', record.month, `Ghi nhận số liệu nước tháng: ${record.month}`);
  };

  const updateWaterMonthlyRecord = (record: WaterMonthly) => {
    setWaterMonthly((prev) => prev.map((r) => (r.month === record.month ? record : r)));
    addAuditLog('Sửa', 'Nước Tháng', record.month, `Cập nhật số liệu nước tháng: ${record.month}`);
  };

  // Meter Reading Actions (auto consumption calculation)
  const addMeterReading = (readingData: Omit<MeterReading, 'id' | 'tieuThu'>) => {
    const consumption = calculateMeterConsumption(readingData.chiSoCu, readingData.chiSoMoi);
    const newReading: MeterReading = {
      ...readingData,
      id: `MET-${Date.now().toString().slice(-6)}`,
      tieuThu: consumption,
    };
    setMeterReadings((prev) => [newReading, ...prev]);
    addAuditLog(
      'Chốt số',
      'Chốt Điện Nước',
      readingData.tenDongHo,
      `Chốt số đồng hồ ${readingData.tenDongHo}: Tiêu thụ ${consumption} ${readingData.donVi}`
    );
  };

  const addBatchMeterReadings = (readingsData: Omit<MeterReading, 'id' | 'tieuThu'>[]) => {
    if (!readingsData.length) return;
    const nowTs = Date.now().toString().slice(-6);
    const newItems: MeterReading[] = readingsData.map((item, idx) => {
      const consumption = calculateMeterConsumption(item.chiSoCu, item.chiSoMoi);
      return {
        ...item,
        id: `MET-${nowTs}-${idx}`,
        tieuThu: consumption,
      };
    });
    setMeterReadings((prev) => [...newItems, ...prev]);
    addAuditLog(
      'Chốt số',
      'Chốt Điện Nước',
      `${readingsData.length} đồng hồ`,
      `Chốt số đồng loạt ${readingsData.length} đồng hồ cho ngày ${readingsData[0]?.ngayChot || 'hôm nay'}`
    );
  };

  const updateTariffConfig = (cfg: Partial<EnergyTariffConfig>) => {
    const nextCfg = { ...tariffConfig, ...cfg };
    setTariffConfig(nextCfg);
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
      idChiPhi: `CP-${Date.now().toString().slice(-6)}`,
    };
    setCostRecords((prev) => [newCost, ...prev]);
    addAuditLog('Thêm', 'Quản lý chi phí', newCost.idChiPhi, `Ghi nhận chi phí: ${newCost.phanLoai} (${newCost.soTienVND.toLocaleString()} đ)`);
  };

  const updateCostRecord = (cost: CostRecord) => {
    setCostRecords((prev) => prev.map((c) => (c.idChiPhi === cost.idChiPhi ? cost : c)));
    addAuditLog('Sửa', 'Quản lý chi phí', cost.idChiPhi, `Cập nhật chi phí ${cost.idChiPhi}: Trạng thái ${cost.trangThai}`);
  };

  const deleteCostRecord = (idChiPhi: string) => {
    setCostRecords((prev) => prev.filter((c) => c.idChiPhi !== idChiPhi));
    addAuditLog('Xóa', 'Quản lý chi phí', idChiPhi, `Xóa chi phí: ${idChiPhi}`);
  };

  // Employees & Current User
  const setCurrentUser = (emp: Employee) => {
    setCurrentUserState(emp);
    addAuditLog('Đăng nhập', 'Hệ thống', emp.maNhanVien, `Người dùng ${emp.tenNhanVien} (${emp.chucVu}) đăng nhập vào hệ thống`);
  };

  const addEmployee = (emp: Employee) => {
    setEmployees((prev) => [...prev, emp]);
    addAuditLog('Thêm', 'Nhân viên', emp.maNhanVien, `Thêm nhân sự mới: ${emp.tenNhanVien} (${emp.chucVu})`);
  };

  const updateEmployee = (emp: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.maNhanVien === emp.maNhanVien ? emp : e)));
    if (currentUser.maNhanVien === emp.maNhanVien) {
      setCurrentUserState(emp);
    }
    addAuditLog('Sửa', 'Nhân viên', emp.maNhanVien, `Cập nhật thông tin nhân viên: ${emp.tenNhanVien}`);
  };

  // Documents / SOPs / Checklists Actions
  const addDocument = (docData: Omit<FacilityDocument, 'id'>) => {
    const newDoc: FacilityDocument = {
      ...docData,
      id: `DOC-${Date.now().toString().slice(-6)}`,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    addAuditLog('Thêm', 'Tài liệu & SOP', newDoc.maTaiLieu, `Thêm tài liệu mới: ${newDoc.tieuDe}`);
  };

  const updateDocument = (docItem: FacilityDocument) => {
    setDocuments((prev) => prev.map((d) => (d.id === docItem.id ? docItem : d)));
    addAuditLog('Sửa', 'Tài liệu & SOP', docItem.maTaiLieu, `Cập nhật tài liệu: ${docItem.tieuDe}`);
  };

  const deleteDocument = (id: string) => {
    const target = documents.find((d) => d.id === id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    addAuditLog('Xóa', 'Tài liệu & SOP', target?.maTaiLieu || id, `Xóa tài liệu: ${target?.tieuDe || id}`);
  };

  // Project Management Actions
  const addProject = (projectData: Omit<FacilityProject, 'id'>) => {
    const newProject: FacilityProject = {
      ...projectData,
      id: `PRJ-${Date.now().toString().slice(-6)}`,
    };
    setProjects((prev) => [newProject, ...prev]);
    addAuditLog('Thêm', 'Quản Lý Dự Án', newProject.maDuAn, `Tạo dự án mới: ${newProject.tenDuAn}`);
  };

  const updateProject = (project: FacilityProject) => {
    setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    addAuditLog('Sửa', 'Quản Lý Dự Án', project.maDuAn, `Cập nhật dự án: ${project.tenDuAn} (${project.trangThai})`);
  };

  const deleteProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    addAuditLog('Xóa', 'Quản Lý Dự Án', target?.maDuAn || id, `Xóa dự án: ${target?.tenDuAn || id}`);
  };

  // Safety Inspection & Calibration Actions
  const addSafetyInspection = (itemData: Omit<SafetyInspectionItem, 'id' | 'trangThai'>) => {
    const computedStatus = getInspectionStatus(itemData.ngayHetHan, itemData.nhacTruocNgay ?? 30, false);
    const newItem: SafetyInspectionItem = {
      ...itemData,
      id: `INS-${Date.now().toString().slice(-6)}`,
      trangThai: computedStatus,
    };
    setSafetyInspections((prev) => [newItem, ...prev]);
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
      id: `IH-${Date.now().toString().slice(-6)}`,
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
      id: `TL-${Date.now().toString().slice(-6)}`,
    };
    setTools((prev) => [newTool, ...prev]);
    addAuditLog(
      'Thêm',
      'Dụng cụ & Đồ nghề',
      newTool.maDungCu,
      `Thêm dụng cụ mới: ${newTool.tenDungCu} (SL: ${newTool.soLuongTong} ${newTool.donViTinh})`
    );
  };

  const updateTool = (tool: ToolItem) => {
    setTools((prev) => prev.map((t) => (t.id === tool.id ? tool : t)));
    addAuditLog('Sửa', 'Dụng cụ & Đồ nghề', tool.maDungCu, `Cập nhật dụng cụ: ${tool.tenDungCu}`);
  };

  const deleteTool = (id: string) => {
    const target = tools.find((t) => t.id === id);
    setTools((prev) => prev.filter((t) => t.id !== id));
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
      id: `TLG-${Date.now().toString().slice(-6)}`,
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

    addAuditLog(
      params.loaiGiaoDich === 'Mượn' ? 'Xuất kho' : params.loaiGiaoDich === 'Trả' ? 'Nhập kho' : 'Cập nhật',
      'Dụng cụ & Đồ nghề',
      target.maDungCu,
      `${params.loaiGiaoDich} ${qty} ${target.donViTinh} ${target.tenDungCu} (${params.nguoiMuon})`
    );
    return { success: true };
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

    setCurrentUserState(found);
    setIsAuthenticated(true);
    sessionStorage.setItem('cmms_authenticated', 'true');
    sessionStorage.setItem('cmms_auth_user', found.maNhanVien);
    saveStorage('currentUser', found);
    addAuditLog('Đăng nhập', 'Hệ thống', found.maNhanVien, `Người dùng ${found.tenNhanVien} (${found.chucVu}) đăng nhập thành công`);
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
    if (currentUser.maNhanVien === found.maNhanVien) {
      setCurrentUserState(updatedEmp);
      saveStorage('currentUser', updatedEmp);
    }

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const logItem: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      thoiGian: timeStr,
      nguoiThaoTac: found.tenNhanVien,
      hanhDong: 'Cập nhật',
      chucNang: 'Bảo mật tài khoản',
      doiTuong: found.maNhanVien,
      chiTietNoiDung: `Người dùng ${found.tenNhanVien} (${found.maNhanVien}) đã đổi mật khẩu đăng nhập.`,
    };
    setAuditLogs((prev) => [logItem, ...prev]);

    return { success: true, message: 'Đổi mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới ngay.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('cmms_authenticated');
    sessionStorage.removeItem('cmms_auth_user');
    addAuditLog('Đăng xuất' as any, 'Hệ thống', currentUser.maNhanVien, `Người dùng ${currentUser.tenNhanVien} đăng xuất khỏi hệ thống`);
  };

  // Email & Alert Service Methods
  const updateEmailConfig = (cfg: Partial<EmailConfig>) => {
    setEmailConfig((prev) => ({ ...prev, ...cfg }));
    addAuditLog('Sửa', 'Cấu hình Email', 'EmailService', 'Cập nhật cài đặt dịch vụ thông báo email');
  };

  const sendEmailNotification = async (params: {
    type: EmailLog['type'];
    subject: string;
    body: string;
    recipient?: string;
    relatedId?: string;
  }): Promise<boolean> => {
    const targetRecipient = params.recipient || emailConfig.primaryRecipient;
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // If Webhook configured, attempt trigger
    if (emailConfig.webhookUrl && emailConfig.webhookUrl.trim().startsWith('http')) {
      try {
        await fetch(emailConfig.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetRecipient,
            cc: emailConfig.ccRecipients,
            subject: params.subject,
            body: params.body,
            timestamp: timeStr,
            sender: emailConfig.senderName,
          }),
        });
      } catch (err) {
        console.warn('Webhook email notification failed, logging locally:', err);
      }
    }

    // If mailto method selected, open mail client
    if (emailConfig.autoDispatchMethod === 'mailto') {
      try {
        const mailtoUrl = `mailto:${encodeURIComponent(targetRecipient)}?subject=${encodeURIComponent(params.subject)}&body=${encodeURIComponent(params.body)}`;
        window.open(mailtoUrl, '_blank');
      } catch (e) {
        console.error('Failed to open mail client', e);
      }
    }

    const newLog: EmailLog = {
      id: `EML-${Date.now().toString().slice(-6)}`,
      timestamp: timeStr,
      type: params.type,
      recipient: targetRecipient,
      subject: params.subject,
      bodySnippet: params.body.slice(0, 160) + (params.body.length > 160 ? '...' : ''),
      fullContent: params.body,
      status: 'Đã gửi',
      relatedId: params.relatedId,
    };

    setEmailLogs((prev) => [newLog, ...prev]);
    addAuditLog('Thêm', 'Thông báo Email', newLog.id, `Gửi email thông báo: ${params.subject} tới ${targetRecipient}`);
    return true;
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
  }): Promise<void> => {
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
    const targetEmail = resolvedEmails.join(', ') || emailConfig.primaryRecipient;

    if (params.module === 'THIET_BI') {
      setEquipment((prev) =>
        prev.map((eq) =>
          eq.maThietBi === params.targetId
            ? {
                ...eq,
                nguoiPhuTrach: formattedAssignee,
                nguoiGiaoViec: params.assignerName,
                email: resolvedEmails.length > 0 ? resolvedEmails.join(', ') : eq.email,
              }
            : eq
        )
      );
      setMaintenancePlans((prev) =>
        prev.map((p) =>
          p.maThietBi === params.targetId
            ? { ...p, nguoiPhuTrach: formattedAssignee, nguoiGiaoViec: params.assignerName }
            : p
        )
      );
    } else if (params.module === 'KE_HOACH_BAO_TRI') {
      setMaintenancePlans((prev) =>
        prev.map((p) =>
          p.id === params.targetId || p.maThietBi === params.targetId
            ? { ...p, nguoiPhuTrach: formattedAssignee, nguoiGiaoViec: params.assignerName }
            : p
        )
      );
    } else if (params.module === 'TICKET') {
      setTickets((prev) =>
        prev.map((t) =>
          t.maTicket === params.targetId
            ? { ...t, nguoiPhuTrach: formattedAssignee, nguoiGiaoViec: params.assignerName }
            : t
        )
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

      await sendEmailNotification({
        type: 'GIAO_VIEC',
        subject: subj,
        body,
        recipient: targetEmail,
        relatedId: params.targetId,
      });
    }
  };

  const notifyCompletionReport = async (params: {
    module: 'BAO_TRI' | 'TICKET';
    targetId: string;
    targetName: string;
    reporterName: string;
    assignerName?: string;
    result: string;
    details?: string;
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
    });
  };

  const triggerMaintenanceDueAlerts = async (): Promise<{ sentCount: number; dueCount: number }> => {
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

    await sendEmailNotification({
      type: overdueCount > 0 ? 'BAO_TRI_QUA_HAN' : 'BAO_TRI_DEN_HAN',
      subject: subj,
      body,
      recipient: emailConfig.primaryRecipient,
      relatedId: 'BATCH-DUE-ALERT',
    });

    return { sentCount: 1, dueCount: duePlans.length };
  };

  const triggerInspectionDueAlerts = async (
    isAuto: boolean = false
  ): Promise<{ sentCount: number; dueCount: number }> => {
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

    await sendEmailNotification({
      type: 'KIEM_DINH_DEN_HAN',
      subject: subj,
      body,
      recipient: recipientEmails || emailConfig.primaryRecipient,
      relatedId: isAuto ? 'AUTO-INSPECTION-REMINDER' : 'MANUAL-INSPECTION-REMINDER',
    });

    return { sentCount: 1, dueCount: dueItems.length };
  };

  // Automatic daily inspection & calibration reminder check when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!emailConfig.enabled || emailConfig.notifyOnInspectionDue === false) return;
    const autoKey = 'cmms_auto_inspection_reminder_2026-11-10';
    if (sessionStorage.getItem(autoKey) === 'sent') return;

    const alreadyLoggedAuto = emailLogs.some(
      (log) =>
        log.type === 'KIEM_DINH_DEN_HAN' &&
        log.relatedId === 'AUTO-INSPECTION-REMINDER' &&
        log.timestamp.startsWith('2026-11-10')
    );
    if (alreadyLoggedAuto) {
      sessionStorage.setItem(autoKey, 'sent');
      return;
    }

    const dueItems = safetyInspections.filter((item) => {
      const status = getInspectionStatus(
        item.ngayHetHan,
        item.nhacTruocNgay ?? 30,
        item.trangThai === 'Đang kiểm định'
      );
      return status === 'Quá hạn' || status === 'Sắp đến hạn';
    });

    if (dueItems.length > 0) {
      sessionStorage.setItem(autoKey, 'sent');
      void triggerInspectionDueAlerts(true);
    }
  }, [isAuthenticated, emailConfig.enabled, emailConfig.notifyOnInspectionDue]);

  const deleteEmailLog = (id: string) => {
    setEmailLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const clearEmailLogs = () => {
    setEmailLogs([]);
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
    setCurrentUserState(INITIAL_EMPLOYEES[0]);
    localStorage.clear();
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
      if (data.tariffConfig && typeof data.tariffConfig === 'object') setTariffConfig(data.tariffConfig);
      if (data.emailConfig && typeof data.emailConfig === 'object') setEmailConfig(data.emailConfig);
      addAuditLog('Cập nhật', 'Sao Lưu & Khôi Phục', 'Toàn bộ dữ liệu', 'Khôi phục thành công từ file sao lưu');
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
        currentUser,
        emailConfig,
        emailLogs,
        updateEmailConfig,
        sendEmailNotification,
        triggerMaintenanceDueAlerts,
        triggerInspectionDueAlerts,
        deleteEmailLog,
        clearEmailLogs,
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
        addTicket,
        updateTicket,
        deleteTicket,
        addSparePart,
        updateSparePart,
        deleteSparePart,
        createStockTransaction,
        addPower10DaysRecord,
        updatePower10DaysRecord,
        addWaterMonthlyRecord,
        updateWaterMonthlyRecord,
        addMeterReading,
        addBatchMeterReadings,
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
