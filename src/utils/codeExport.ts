import {
  AuditLog,
  CostRecord,
  EmailConfig,
  EmailLog,
  Employee,
  Equipment,
  FacilityDocument,
  FacilityProject,
  MaintenanceHistory,
  MaintenancePlan,
  MeterReading,
  Power10Days,
  SafetyInspectionItem,
  SparePart,
  StockTransaction,
  Ticket,
  ToolBorrowLog,
  ToolItem,
  WaterMonthly,
} from '../types/cmms';
import { INITIAL_EMPLOYEES } from '../data/initialData';

export interface CodeExportSnapshot {
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
  emailConfig: EmailConfig;
  emailLogs: EmailLog[];
  documents: FacilityDocument[];
  projects: FacilityProject[];
  safetyInspections: SafetyInspectionItem[];
  tools: ToolItem[];
  toolLogs: ToolBorrowLog[];
}

export function generateInitialDataTsSource(data: CodeExportSnapshot): string {
  const initPassByCode = new Map(
    INITIAL_EMPLOYEES.map((e) => [e.maNhanVien.trim().toUpperCase(), e.password])
  );

  const safeEmployees: Employee[] = data.employees.map((emp) => {
    const fallbackPwd = initPassByCode.get(emp.maNhanVien.trim().toUpperCase());
    if (emp.password) return emp;
    if (fallbackPwd) return { ...emp, password: fallbackPwd };
    return emp;
  });

  const safeEmailConfig: EmailConfig = {
    enabled: data.emailConfig.enabled,
    notifyOnNewTicket: data.emailConfig.notifyOnNewTicket,
    notifyOnMaintenanceDue: data.emailConfig.notifyOnMaintenanceDue,
    notifyOnOverdue: data.emailConfig.notifyOnOverdue,
    ...(data.emailConfig.notifyOnInspectionDue !== undefined
      ? { notifyOnInspectionDue: data.emailConfig.notifyOnInspectionDue }
      : {}),
    primaryRecipient: data.emailConfig.primaryRecipient,
    ccRecipients: data.emailConfig.ccRecipients,
    senderName: data.emailConfig.senderName,
    autoDispatchMethod: data.emailConfig.autoDispatchMethod,
  };

  const exportedAt = new Date().toISOString();

  return `// Auto-exported from FACILITY SYSTEM MANAGEMENT at ${exportedAt}
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
  FacilityDocument,
  FacilityProject,
  SafetyInspectionItem,
  ToolItem,
  ToolBorrowLog,
} from '../types/cmms';

// Sheet 1: Danh_sach_thiet_bi
export const INITIAL_EQUIPMENT: Equipment[] = ${JSON.stringify(data.equipment, null, 2)};

// Sheet 2: Ke_hoach_bao_tri
export const INITIAL_MAINTENANCE_PLANS: MaintenancePlan[] = ${JSON.stringify(data.maintenancePlans, null, 2)};

// Sheet 3: Lich_su_bao_tri
export const INITIAL_MAINTENANCE_HISTORY: MaintenanceHistory[] = ${JSON.stringify(data.maintenanceHistory, null, 2)};

// Sheet 4: Su_co_Tickets
export const INITIAL_TICKETS: Ticket[] = ${JSON.stringify(data.tickets, null, 2)};

// Sheet 5: Spare_part
export const INITIAL_SPARE_PARTS: SparePart[] = ${JSON.stringify(data.spareParts, null, 2)};

// Sheet 6: Nhap_Xuat_Kho
export const INITIAL_STOCK_TRANSACTIONS: StockTransaction[] = ${JSON.stringify(data.stockTransactions, null, 2)};

// Sheet 7: Dien_10_Ngay
export const INITIAL_POWER_10DAYS: Power10Days[] = ${JSON.stringify(data.power10Days, null, 2)};

// Sheet 8: Chi_phi
export const INITIAL_COST_RECORDS: CostRecord[] = ${JSON.stringify(data.costRecords, null, 2)};

// Sheet 9: Nuoc_month
export const INITIAL_WATER_MONTHLY: WaterMonthly[] = ${JSON.stringify(data.waterMonthly, null, 2)};

// Sheet 10: Nhan_vien
export const INITIAL_EMPLOYEES: Employee[] = ${JSON.stringify(safeEmployees, null, 2)};

// Sheet 11: Dien_Nuoc
export const INITIAL_METER_READINGS: MeterReading[] = ${JSON.stringify(data.meterReadings, null, 2)};

// Sheet 12: Nhat_ky_he_thong
export const INITIAL_AUDIT_LOGS: AuditLog[] = ${JSON.stringify(data.auditLogs, null, 2)};

// Email Notification Settings
export const INITIAL_EMAIL_CONFIG: EmailConfig = ${JSON.stringify(safeEmailConfig, null, 2)};

// Initial Outbox / Email Logs
export const INITIAL_EMAIL_LOGS: EmailLog[] = ${JSON.stringify(data.emailLogs, null, 2)};

// Initial SOPs, Mobile Checklists & Technical Documents Hub
export const INITIAL_DOCUMENTS: FacilityDocument[] = ${JSON.stringify(data.documents, null, 2)};

// Initial Projects
export const INITIAL_PROJECTS: FacilityProject[] = ${JSON.stringify(data.projects, null, 2)};

// Initial Safety Inspections & Calibration
export const INITIAL_SAFETY_INSPECTIONS: SafetyInspectionItem[] = ${JSON.stringify(data.safetyInspections, null, 2)};

// Initial Tools & Kits
export const INITIAL_TOOLS: ToolItem[] = ${JSON.stringify(data.tools, null, 2)};

// Initial Tool Borrow/Return Logs
export const INITIAL_TOOL_LOGS: ToolBorrowLog[] = ${JSON.stringify(data.toolLogs, null, 2)};
`;
}
