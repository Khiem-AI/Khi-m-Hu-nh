import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_VIEW_OPTIONS, DEFAULT_ENERGY_TARIFF_CONFIG } from '../src/types/cmms';
import { UI_TEXTS } from '../src/config/uiTexts';
import { ADMIN_ONLY_VIEWS } from '../src/utils/cmmsLogic';
import {
  INITIAL_DAILY_AREA_CHECKS,
  INITIAL_DOCUMENTS,
  INITIAL_EMPLOYEES,
  INITIAL_EQUIPMENT,
  INITIAL_MAINTENANCE_HISTORY,
  INITIAL_MAINTENANCE_PLANS,
  INITIAL_PROJECTS,
  INITIAL_SAFETY_INSPECTIONS,
  INITIAL_SPARE_PARTS,
  INITIAL_TOOLS,
} from '../src/data/initialData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const USER_GUIDE_PATH = path.join(ROOT_DIR, 'HUONG_DAN_SU_DUNG_APP.md');
const DEV_GUIDE_PATH = path.join(ROOT_DIR, 'HUONG_DAN_CHINH_SUA_CODE_VA_NOI_DUNG.md');
const CONTEXT_PATH = path.join(ROOT_DIR, 'src/context/CMMSContext.tsx');
const APP_PATH = path.join(ROOT_DIR, 'src/App.tsx');

const FILE_DESCRIPTIONS: Record<string, string> = {
  'index.html': 'Tiêu đề trang web (<title>), thẻ meta SEO & font chữ hệ thống',
  'metadata.json': 'Tên, mô tả và quyền truy cập thiết bị (camera)',
  'package.json': 'Danh sách thư viện & lệnh build/dev/start/lint/sync-docs',
  'vite.config.ts': 'Cấu hình Vite, React, Tailwind v4 & cổng dev server 3000',
  'server.ts': 'Express server tích hợp Vite dev middleware, API gửi Email (/api/send-email) & chống gửi trùng trong ngày',
  'firestore.rules': 'Quy tắc bảo mật Cloud Firestore theo RBAC & schema validation',
  'firebase-blueprint.json': 'Bản thiết kế schema toàn bộ collection Firestore',
  '.env.example': 'Mẫu biến môi trường (NODE_ENV, SMTP, RESEND_API_KEY, EMAIL_WEBHOOK_URL...)',
  'src/App.tsx': 'Điều hướng chính giữa các Tab và quản lý các Modal toàn cục',
  'src/index.css': 'Tailwind CSS v4, font chữ, quy tắc Nền Sáng (html.light) & thanh cuộn',
  'src/main.tsx': 'Điểm khởi chạy React Root',
  'src/config/uiTexts.ts': '[QUAN TRỌNG] Toàn bộ nội dung chữ, tên menu & nhãn form giao diện',
  'src/types/cmms.ts': 'Định nghĩa kiểu dữ liệu (Interface), APP_VIEW_OPTIONS, DailyAreaCheck & hằng số điện/nước',
  'src/data/equipment_parsed.json': 'Dữ liệu danh sách thiết bị gốc đã chuẩn hóa JSON',
  'src/data/initialData.ts': 'Dữ liệu mẫu ban đầu (Thiết bị, Nhân viên, Vật tư, Dự án, Kiểm định, Dụng cụ, Công việc đầu ngày...)',
  'src/context/CMMSContext.tsx': 'State trung tâm, LocalStorage, Firestore sync, đăng nhập, phân quyền, Email/Web Notification & Sao lưu',
  'src/utils/cmmsLogic.ts': 'Nghiệp vụ chu kỳ bảo trì/kiểm định, tách người thực hiện, phân quyền RBAC (chi phí/xóa/CSV/kế hoạch) & tiến độ dự án',
  'src/utils/codeExport.ts': 'Tiện ích xuất/tải mã nguồn hoặc cấu hình',
  'src/utils/costForecasting.ts': 'Mô hình dự báo chi phí bảo trì 6 tháng & hồi quy tuyến tính (OLS)',
  'src/utils/emailTemplates.ts': 'Trình dựng mẫu Email HTML chuyên nghiệp chuẩn màu sắc theo loại cảnh báo',
  'src/utils/excelExport.ts': 'Xuất Excel (.xlsx) đa Sheet định dạng đẹp kèm khung ký duyệt',
  'src/utils/firebaseClient.ts': 'Khởi tạo Firebase App, Firestore & Google Auth từ cấu hình dự án',
  'src/utils/firestoreSync.ts': 'Sanitizer payload, đồng bộ snapshot & real-time listener với Cloud Firestore',
  'src/utils/gmailAuth.ts': 'Xác thực OAuth phía client để gửi email qua Gmail API',
  'src/utils/imageUtils.tsx': 'Xử lý ảnh Google Drive, nén ảnh chụp và ảnh dự phòng',
  'src/utils/cmmsLogic.test.ts': 'Unit test kiểm tra logic nghiệp vụ CMMS',
  'src/components/Header.tsx': 'Thanh Header, Quét QR, Nền Sáng/Tối, Chuông cảnh báo, Sao lưu & Tài khoản',
  'src/components/Navigation.tsx': 'Sidebar điều hướng trái, lọc theo phân quyền & huy hiệu đếm thời gian thực',
  'src/components/LoginPage.tsx': 'Màn hình đăng nhập & quy tắc xác thực',
  'src/components/BackupDataModal.tsx': 'Trung tâm Sao lưu JSON/Excel/Google Drive & Khôi phục (ID1460 / Owner)',
  'src/components/CostPredictiveAnalysis.tsx': 'Phân tích & biểu đồ D3 xu hướng dự báo chi phí 6 tháng tới',
  'src/components/MaintenanceExecutionModal.tsx': 'Biên bản hoàn tất bảo trì/sửa chữa, chụp ảnh trước/sau & tự tạo kỳ tiếp',
  'src/components/EquipmentModal.tsx': 'Thêm / Sửa thiết bị và chụp ảnh',
  'src/components/EquipmentDetailModal.tsx': 'Xem chi tiết thông số kỹ thuật & lịch sử thiết bị',
  'src/components/TicketModal.tsx': 'Tạo / Cập nhật phiếu sự cố (chọn nhiều người & ảnh trước/sau)',
  'src/components/SparePartModal.tsx': 'Thêm / Sửa danh mục phụ tùng kho',
  'src/components/StockTransactionModal.tsx': 'Phiếu Nhập kho / Xuất kho sử dụng / Hoàn kho',
  'src/components/CostModal.tsx': 'Ghi nhận / Sửa chứng từ chi phí',
  'src/components/MeterReadingModal.tsx': 'Chốt chỉ số đồng hồ Điện - Nước hàng ngày',
  'src/components/QRModal.tsx': 'Xem & In tem mã QR thiết bị',
  'src/components/QRScannerModal.tsx': 'Quét mã QR bằng camera hoặc nhập tay mã thiết bị',
  'src/components/common/CameraCaptureInput.tsx': 'Component chụp ảnh camera hoặc tải tệp ảnh',
  'src/components/common/EmailDispatchModal.tsx': 'Hộp thoại xem trước nội dung Email HTML và chọn kênh gửi',
  'src/components/common/GoogleSignInButton.tsx': 'Nút đăng nhập / kết nối tài khoản Google đồng bộ Cloud',
  'src/components/common/MultiAssigneePicker.tsx': 'Bộ chọn nhiều nhân viên thực hiện cùng lúc',
  'src/components/common/NumericInput.tsx': 'Ô nhập số định dạng chuẩn',
  'src/components/common/SmartHorizontalScroll.tsx': 'Thanh cuộn ngang đồng bộ đầu/cuối bảng dữ liệu lớn',
  'src/components/common/WebNotificationToast.tsx': 'Hiển thị thông báo nổi trực tiếp trên Web (miễn phí)',
  'src/components/common/WorkAssignmentModal.tsx': 'Form Giao việc nhiều người & gửi Email thông báo',
  'src/components/dashboard/MaintenanceD3Summary.tsx': 'Biểu đồ D3 phân tích quá hạn & lịch trọng điểm trên Dashboard',
  'src/components/energy/EnergyCompareDashboard.tsx': 'Dashboard phân tích & so sánh tiêu thụ điện EVN / Solar theo khung giờ',
  'src/components/energy/DailyReadingsWithAlerts.tsx': 'Bảng chỉ số điện/nước hàng ngày & cảnh báo vượt ngưỡng',
  'src/components/energy/DailyPowerModal.tsx': 'Nhập liệu chỉ số điện hàng ngày',
  'src/components/energy/MeterReadingEditModal.tsx': 'Chỉnh sửa bản ghi chỉ số đồng hồ điện/nước đã chốt',
  'src/components/energy/MonthlyEnergyTrendChart.tsx': 'Biểu đồ xu hướng tiêu thụ điện năng theo tháng',
  'src/components/energy/Power10DaysModal.tsx': 'Nhập liệu điện chu kỳ 10 ngày',
  'src/components/energy/TariffConfigModal.tsx': 'Cấu hình đơn giá điện EVN, Solar, Nước & tỷ giá USD',
  'src/components/energy/WaterCompareDashboard.tsx': 'Dashboard phân tích & so sánh tiêu thụ nước theo kỳ',
  'src/components/energy/WaterRecordingModal.tsx': 'Nhập liệu chỉ số nước tháng',
  'src/components/tabs/DashboardTab.tsx': 'Tổng quan O&M, KPI, công việc của tôi, lịch 30 ngày & nút Download CSV (ẩn với Kỹ thuật viên)',
  'src/components/tabs/AdminDashboardTab.tsx': 'Dashboard Admin D3: OEE, MTBF, MTTR & tỷ lệ PM/CM (Chỉ Admin)',
  'src/components/tabs/MyTasksTab.tsx': 'Danh sách công việc được giao cho tài khoản đang đăng nhập',
  'src/components/tabs/MorningChecksTab.tsx': 'Công việc đầu ngày: phân quyền kiểm tra Vòng trong, Vòng Ngoài, Phòng Utility & ghi nhận báo cáo',
  'src/components/tabs/ProfileTab.tsx': 'Hồ sơ cá nhân, phép năm & đổi mật khẩu',
  'src/components/tabs/EquipmentTab.tsx': 'Danh mục máy móc thiết bị & QR Code (Kỹ thuật viên chỉ sửa, không xóa)',
  'src/components/tabs/MaintenanceTab.tsx': 'Kế hoạch định kỳ (KTV chỉ xem), Lịch sử (Bảo trì vs Sửa chữa), Lịch kéo thả & Xuất Excel',
  'src/components/tabs/SafetyInspectionTab.tsx': 'Quản lý Kiểm định an toàn & Hiệu chuẩn có nhắc lịch & gửi mail tự động',
  'src/components/tabs/ToolsManagementTab.tsx': 'Quản lý Dụng cụ & Đồ nghề, sổ Mượn/Trả & hạn hiệu chuẩn (KTV chỉ sửa, không xóa)',
  'src/components/tabs/TicketsTab.tsx': 'Quản lý Tickets sự cố & sửa chữa (KTV chỉ sửa, không xóa)',
  'src/components/tabs/ProjectsTab.tsx': 'Quản lý Dự án kỹ thuật (WBS, Kanban, Cột mốc, Rủi ro, Ngân sách — ẩn xóa & chi phí với KTV)',
  'src/components/tabs/SparePartsTab.tsx': 'Kho phụ tùng & Nhật ký xuất nhập kho (ẩn giá & xóa với KTV)',
  'src/components/tabs/DocumentsTab.tsx': 'Tra cứu tài liệu SOP, File & Checklist tương tác (ẩn xóa với KTV)',
  'src/components/tabs/EnergyTab.tsx': 'Giám sát & phân tích năng lượng Điện - Nước',
  'src/components/tabs/CostTab.tsx': 'Quản lý chi phí & Phân tích dự báo ngân sách 6 tháng tới (ẩn với KTV)',
  'src/components/tabs/EmployeesTab.tsx': 'Quản lý nhân sự & phân quyền View theo tài khoản',
  'src/components/tabs/EmployeePerformanceTab.tsx': 'Đánh giá hiệu quả nhân viên & biểu đồ D3 (Chỉ Admin)',
  'src/components/tabs/AuditLogTab.tsx': 'Nhật ký tác động toàn hệ thống (hiển thị chính xác ID & tên tài khoản, xuất CSV)',
  'src/components/tabs/EmailAlertsTab.tsx': 'Cấu hình thông báo Web miễn phí & Email tự động, mẫu HTML & nhật ký gửi',
  'scripts/build_real_cmms_data.py': 'Script Python tạo dữ liệu thiết bị & lịch sử thực tế từ CSV',
  'scripts/generate_cmms_dataset.py': 'Script Python sinh bộ dữ liệu mẫu CMMS',
  'scripts/generate_complete_cmms_dataset.py': 'Script Python tổng hợp dữ liệu CMMS đầy đủ',
  'scripts/generate_full_cmms.py': 'Script Python khởi tạo dữ liệu nhà máy đầy đủ',
  'scripts/parseEquipment.cjs': 'Script Node.js phân tích dữ liệu thiết bị từ bảng CSV',
  'scripts/seedData.cjs': 'Script Node.js nạp dữ liệu khởi tạo',
  'scripts/syncDocs.ts': 'Script tự động đồng bộ tài liệu hướng dẫn khi mã nguồn thay đổi',
  'scripts/update_dataset.py': 'Script Python cập nhật bộ dữ liệu CMMS',
  'scripts/updateInitialData.cjs': 'Script Node.js cập nhật src/data/initialData.ts',
};

const CORE_DOCUMENTED_VIEWS = new Set([
  'dashboard',
  'admin_dashboard',
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
  'costs',
  'employees',
  'employee_performance',
  'logs',
  'email_alerts',
]);

function replaceAutoSyncBlock(content: string, blockName: string, body: string): string {
  const startTag = `<!-- AUTO-SYNC:${blockName}:START -->`;
  const endTag = `<!-- AUTO-SYNC:${blockName}:END -->`;
  const startIdx = content.indexOf(startTag);
  const endIdx = content.indexOf(endTag);

  const replacement = `${startTag}\n${body.trim()}\n${endTag}`;
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return content.slice(0, startIdx) + replacement + content.slice(endIdx + endTag.length);
  }
  return `${content.trimEnd()}\n\n${replacement}\n`;
}

function listFilesSorted(relDir: string): string[] {
  const absDir = path.join(ROOT_DIR, relDir);
  if (!fs.existsSync(absDir)) return [];
  return fs
    .readdirSync(absDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => `${relDir}/${entry.name}`.replace(/\\/g, '/'))
    .sort((a, b) => a.localeCompare(b));
}

function extractDataVersion(): string {
  if (!fs.existsSync(CONTEXT_PATH)) return 'unknown';
  const raw = fs.readFileSync(CONTEXT_PATH, 'utf8');
  const match = raw.match(/const\s+CMMS_DATA_VERSION\s*=\s*['"]([^'"]+)['"]/);
  return match ? match[1] : 'unknown';
}

function extractAppRoutes(): Record<string, string> {
  if (!fs.existsSync(APP_PATH)) return {};
  const raw = fs.readFileSync(APP_PATH, 'utf8');
  const map: Record<string, string> = {};
  const regex = /activeTab\s*===\s*['"]([a-zA-Z0-9_]+)['"][^]*?<([A-Z][a-zA-Z0-9]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    if (!map[match[1]]) {
      map[match[1]] = match[2];
    }
  }
  return map;
}

function getAccessScopeLabel(viewId: string): string {
  if ((ADMIN_ONLY_VIEWS as readonly string[]).includes(viewId)) {
    return 'Chỉ Admin / Owner (`ID1460`)';
  }
  if (viewId === 'costs') {
    return 'Quản lý / Kỹ sư / Admin (ẩn với Kỹ thuật viên & NV vận hành)';
  }
  if (['employees', 'logs', 'email_alerts'].includes(viewId)) {
    return 'Quản lý / Kỹ sư / Admin (hoặc cấp quyền View)';
  }
  if (viewId === 'profile') {
    return 'Tất cả nhân sự (tự xem/sửa hồ sơ cá nhân; Admin xem toàn bộ)';
  }
  return 'Tất cả nhân sự (tùy chỉnh theo View)';
}

function buildMenuCatalogMarkdown(routesMap: Record<string, string>): string {
  const navItems = UI_TEXTS.navigation.items as Record<string, { label: string; desc: string }>;
  const rows = APP_VIEW_OPTIONS.map((opt, index) => {
    const label = navItems[opt.id]?.label || opt.label;
    const componentName = routesMap[opt.id] || 'Đang cập nhật';
    const access = getAccessScopeLabel(opt.id);
    return `| ${index + 1} | \`${opt.id}\` | **${label}** | ${opt.desc} | ${access} | \`${componentName}\` |`;
  });

  return [
    `> *Bảng này được script \`scripts/syncDocs.ts\` tự động sinh từ \`APP_VIEW_OPTIONS\` & \`UI_TEXTS\` (${APP_VIEW_OPTIONS.length} phân hệ đang hoạt động).*`,
    '',
    '| STT | Mã View (`id`) | Tên Menu Hiển Thị | Chức Năng Chính | Phạm Vi Truy Cập | Component |',
    '| :---: | :--- | :--- | :--- | :--- | :--- |',
    ...rows,
  ].join('\n');
}

function buildNewFeaturesAutoSection(routesMap: Record<string, string>): string {
  const navItems = UI_TEXTS.navigation.items as Record<string, { label: string; desc: string }>;
  const unmappedViews = APP_VIEW_OPTIONS.filter((opt) => !CORE_DOCUMENTED_VIEWS.has(opt.id));
  const tabFiles = listFilesSorted('src/components/tabs').map((p) => path.basename(p, '.tsx'));
  const mappedComponents = new Set(Object.values(routesMap));
  const extraTabs = tabFiles.filter((name) => !mappedComponents.has(name));

  const lines: string[] = [];
  if (unmappedViews.length === 0 && extraTabs.length === 0) {
    lines.push(
      `- Trạng thái đồng bộ: Toàn bộ **${APP_VIEW_OPTIONS.length} phân hệ** và **${tabFiles.length} module Tab** hiện tại đã có hướng dẫn chi tiết ở các mục trên.`
    );
  } else {
    lines.push('### Tính Năng Mới Tự Động Phát Hiện');
    unmappedViews.forEach((opt) => {
      const label = navItems[opt.id]?.label || opt.label;
      const comp = routesMap[opt.id] || 'Tab mới';
      lines.push(
        `- **${label}** (\`${opt.id}\` · Component \`${comp}\`): ${opt.desc || 'Phân hệ mới được bổ sung vào menu điều hướng.'} *(Phạm vi: ${getAccessScopeLabel(opt.id)})*`
      );
    });
    extraTabs.forEach((tab) => {
      lines.push(`- Module giao diện mới phát hiện tại \`src/components/tabs/${tab}.tsx\`.`);
    });
  }

  return lines.join('\n');
}

function buildSystemSnapshotMarkdown(dataVersion: string): string {
  const managersAndAdmins = INITIAL_EMPLOYEES.filter((e) =>
    ['Owner', 'Admin', 'Quản trị viên', 'Người quản lý', 'Trưởng phòng Kỹ thuật'].includes(
      e.chucVu
    )
  )
    .map((e) => `\`${e.maNhanVien}\` (${e.tenNhanVien} — ${e.chucVu})`)
    .join(', ');

  return [
    `- **Phiên bản dữ liệu (\`CMMS_DATA_VERSION\`)**: \`${dataVersion}\``,
    `- **Số liệu mẫu tích hợp sẵn**: ${INITIAL_EQUIPMENT.length} thiết bị · ${INITIAL_MAINTENANCE_PLANS.length} kế hoạch bảo trì · ${INITIAL_MAINTENANCE_HISTORY.length} biên bản lịch sử · ${INITIAL_SAFETY_INSPECTIONS.length} hồ sơ kiểm định/hiệu chuẩn · ${INITIAL_TOOLS.length} bộ dụng cụ & đồ nghề · ${INITIAL_PROJECTS.length} dự án kỹ thuật · ${INITIAL_SPARE_PARTS.length} mã phụ tùng · ${INITIAL_DOCUMENTS.length} tài liệu SOP/Checklist · ${INITIAL_DAILY_AREA_CHECKS.length} phiếu công việc đầu ngày · ${INITIAL_EMPLOYEES.length} nhân sự.`,
    `- **Tài khoản quản lý & quản trị mẫu**: ${managersAndAdmins}.`,
  ].join('\n');
}

function buildRepoTreeMarkdown(): string {
  const sections: { title: string; files: string[] }[] = [
    {
      title: 'Tệp gốc & Cấu hình',
      files: [
        'index.html',
        'metadata.json',
        'package.json',
        'vite.config.ts',
        'server.ts',
        'firestore.rules',
        'firebase-blueprint.json',
        '.env.example',
      ].filter((f) => fs.existsSync(path.join(ROOT_DIR, f))),
    },
    { title: 'Cấu hình UI (`src/config`)', files: listFilesSorted('src/config') },
    { title: 'Kiểu dữ liệu (`src/types`)', files: listFilesSorted('src/types') },
    { title: 'Dữ liệu mẫu (`src/data`)', files: listFilesSorted('src/data') },
    { title: 'State & Context (`src/context`)', files: listFilesSorted('src/context') },
    { title: 'Nghiệp vụ & Tính toán (`src/utils`)', files: listFilesSorted('src/utils') },
    { title: 'Layout & Modals (`src/components`)', files: listFilesSorted('src/components') },
    { title: 'Component dùng chung (`src/components/common`)', files: listFilesSorted('src/components/common') },
    { title: 'Biểu đồ Dashboard (`src/components/dashboard`)', files: listFilesSorted('src/components/dashboard') },
    { title: 'Phân hệ Năng lượng (`src/components/energy`)', files: listFilesSorted('src/components/energy') },
    { title: 'Các Tab chức năng (`src/components/tabs`)', files: listFilesSorted('src/components/tabs') },
    { title: 'Scripts tự động hóa (`scripts`)', files: listFilesSorted('scripts') },
  ];

  const out: string[] = [];
  sections.forEach((sec) => {
    if (sec.files.length === 0) return;
    out.push(`#### ${sec.title}`);
    sec.files.forEach((file) => {
      const desc = FILE_DESCRIPTIONS[file] || 'Module mới được phát hiện tự động trong mã nguồn';
      out.push(`- \`${file}\`: ${desc}`);
    });
    out.push('');
  });
  return out.join('\n').trim();
}

function buildFeatureMatrixMarkdown(
  dataVersion: string,
  routesMap: Record<string, string>
): string {
  const navItems = UI_TEXTS.navigation.items as Record<string, { label: string; desc: string }>;
  const rows = APP_VIEW_OPTIONS.map((opt) => {
    const comp = routesMap[opt.id] || 'Chưa gắn vào App.tsx';
    const fileRel = `src/components/tabs/${comp}.tsx`;
    const exists = fs.existsSync(path.join(ROOT_DIR, fileRel));
    const uiLabel = navItems[opt.id]?.label || opt.label;
    return `| \`${opt.id}\` | ${uiLabel} | \`${comp}\` | ${exists ? `\`${fileRel}\`` : 'Xem `src/App.tsx`'} |`;
  });

  return [
    `- **\`CMMS_DATA_VERSION\` hiện hành**: \`${dataVersion}\``,
    `- **\`ADMIN_ONLY_VIEWS\` hiện hành**: ${ADMIN_ONLY_VIEWS.map((v) => `\`${v}\``).join(', ')}`,
    `- **Biểu giá điện/nước mặc định (\`DEFAULT_ENERGY_TARIFF_CONFIG\`)**: EVN BT \`${DEFAULT_ENERGY_TARIFF_CONFIG.evnBT}\` đ · CĐ \`${DEFAULT_ENERGY_TARIFF_CONFIG.evnCD}\` đ · TĐ \`${DEFAULT_ENERGY_TARIFF_CONFIG.evnTD}\` đ · Nước \`${DEFAULT_ENERGY_TARIFF_CONFIG.waterVNDPerM3}\` đ/m³ · Nước thải \`${DEFAULT_ENERGY_TARIFF_CONFIG.sewageVNDPerM3}\` đ/m³ · Tỷ giá \`${DEFAULT_ENERGY_TARIFF_CONFIG.usdToVndRate}\` đ/USD`,
    '',
    '| Mã View (`APP_VIEW_OPTIONS`) | Nhãn Menu (`UI_TEXTS`) | Component | File Nguồn |',
    '| :--- | :--- | :--- | :--- |',
    ...rows,
  ].join('\n');
}

function main() {
  const dataVersion = extractDataVersion();
  const routesMap = extractAppRoutes();

  if (fs.existsSync(USER_GUIDE_PATH)) {
    let userGuide = fs.readFileSync(USER_GUIDE_PATH, 'utf8');
    userGuide = replaceAutoSyncBlock(
      userGuide,
      'SYSTEM-SNAPSHOT',
      buildSystemSnapshotMarkdown(dataVersion)
    );
    userGuide = replaceAutoSyncBlock(
      userGuide,
      'MENU-CATALOG',
      buildMenuCatalogMarkdown(routesMap)
    );
    userGuide = replaceAutoSyncBlock(
      userGuide,
      'NEW-FEATURES',
      buildNewFeaturesAutoSection(routesMap)
    );
    fs.writeFileSync(USER_GUIDE_PATH, userGuide, 'utf8');
  }

  if (fs.existsSync(DEV_GUIDE_PATH)) {
    let devGuide = fs.readFileSync(DEV_GUIDE_PATH, 'utf8');
    devGuide = replaceAutoSyncBlock(devGuide, 'REPO-TREE', buildRepoTreeMarkdown());
    devGuide = replaceAutoSyncBlock(
      devGuide,
      'FEATURE-MATRIX',
      buildFeatureMatrixMarkdown(dataVersion, routesMap)
    );
    fs.writeFileSync(DEV_GUIDE_PATH, devGuide, 'utf8');
  }

  console.log(
    `[syncDocs] Đã đồng bộ tài liệu hướng dẫn (${APP_VIEW_OPTIONS.length} phân hệ, CMMS_DATA_VERSION=${dataVersion}).`
  );
}

main();
