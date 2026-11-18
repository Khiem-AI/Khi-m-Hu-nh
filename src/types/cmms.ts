export type RiskLevel = 'High' | 'Medium' | 'Low';

export type EquipmentStatus = 'Hoạt động' | 'Đang sửa chữa' | 'Bảo trì' | 'Tạm dừng';

export type MaintenanceFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export type MaintenanceType = 'Định kỳ' | 'Phòng ngừa' | 'Đột xuất' | 'Hiệu chuẩn' | 'Kiểm định';

export type MaintenanceWorkType = 'Bảo trì theo kế hoạch' | 'Sửa chữa';

export type MaintenanceResult = 'Đạt' | 'Cần theo dõi' | 'Chưa đạt' | 'Hoàn thành';

export type TicketPriority = 'Khẩn cấp' | 'Cao' | 'Trung bình' | 'Bình thường' | 'Thấp';

export type TicketStatus = 'Mới tiếp nhận' | 'Chờ xử lý' | 'Đang thực hiện' | 'Đang xử lý' | 'Hoàn thành' | 'Hủy';

export type StockTransactionType = 'Nhập kho' | 'Xuất kho sử dụng' | 'Hoàn kho';

export type CostCategory = 'Bảo trì định kỳ' | 'Sửa chữa đột xuất' | 'Mua vật tư thay thế' | 'Kiểm định an toàn' | 'Dịch vụ ngoài' | 'Khác';

export type CostStatus = 'Đã thanh toán' | 'Chờ duyệt' | 'Đã duyệt';

export type UserRole = 'Owner' | 'Admin' | 'Director' | 'Quản trị viên' | 'Người quản lý' | 'Trưởng phòng Kỹ thuật' | 'Kỹ sư thiết bị' | 'Kỹ thuật viên' | 'Nhân viên vận hành';

// Sheet 1: Danh_sach_thiet_bi
export interface Equipment {
  maThietBi: string;
  tenThietBi: string;
  heThong: string;
  viTri: string;
  mucDoRuiRo: RiskLevel;
  trangThai: EquipmentStatus;
  tanSuat: MaintenanceFrequency;
  hanBaoTriTiepTheo: string; // YYYY-MM-DD
  nguoiPhuTrach: string;
  nguoiGiaoViec?: string;
  email: string;
  thongSoKyThuat: string;
  hinhAnh?: string;
  qrCode?: string;
  ngayLapDat?: string;
}

// Sheet 2: Ke_hoach_bao_tri
export interface MaintenancePlan {
  id: string;
  maThietBi: string;
  tenThietBi: string;
  loaiBaoTri: MaintenanceType;
  tanSuat: MaintenanceFrequency;
  ngayBaoTriGanNhat: string; // YYYY-MM-DD
  ngayBaoTriTiepTheo: string; // YYYY-MM-DD
  nguoiPhuTrach: string;
  nguoiGiaoViec?: string;
  trangThai: 'Quá hạn' | 'Tới hạn' | 'Sắp tới' | 'Đúng hạn';
  ghiChu?: string;
}

// Sheet 3: Lich_su_bao_tri
export interface MaintenanceHistory {
  id: string;
  maThietBi: string;
  tenThietBi: string;
  loaiCongViec?: MaintenanceWorkType;
  ngayThucHien: string; // YYYY-MM-DD
  nguoiThucHien: string;
  nguoiGiaoViec?: string;
  moTaCongViec: string;
  thoiGianDungMay: number; // minutes or hours
  ketQua: MaintenanceResult;
  anhTruocXuLy?: string;
  hinhAnh?: string;
  nguoiLapBaoCao: string;
  chiPhiUocTinh?: number;
}

// Sheet 4: Tickets
export interface Ticket {
  maTicket: string;
  tieuDe: string;
  trangThai: TicketStatus;
  ngayTao: string; // YYYY-MM-DD
  moTaChiTiet: string;
  nguoiPhuTrach: string;
  nguoiGiaoViec?: string;
  ngayHoanThanh?: string;
  ketQua?: string;
  nguoiLap: string;
  mucDoUuTien: TicketPriority;
  anhTruocXuLy?: string;
  anhSauXuLy?: string;
  maThietBi?: string | null;
}

// Sheet 5: Spare_part
export interface SparePart {
  maVatTu: string;
  tenVatTu: string;
  thongSo: string;
  maThietBi: string;
  tenThietBiSuDung: string;
  tonToiThieu: number;
  tonThucTe: number;
  donViTinh: string;
  viTriLuu: string;
  ghiChu: string;
  donGia: number; // VNĐ
}

// Sheet 6: Kho_xuat_nhap
export interface StockTransaction {
  transId: string;
  ngay: string; // YYYY-MM-DD
  loaiGD: StockTransactionType;
  maVatTu: string;
  thietBiSuDung: string;
  soLuong: number;
  nguoiThucHien: string;
  ghiChu: string;
  donGiaSnapshot?: number;
}

// Sheet 7: Dien_10_Ngay
export interface Power10Days {
  id: string;
  thoiGianLuu: string;
  chuKy: string;
  tuNgay: string;
  denNgay: string;
  ngayLamViec: number;
  loaiCa: string;
  tbNgayKwh: number;
  evnBT: number;
  evnCD: number;
  evnTD: number;
  solarBT: number;
  solarCD: number;
  pLighting: number;
  pAcmv: number;
  pEquipment: number;
  uChiller: number;
  uMChiller: number;
  uComp: number;
  uPump: number;
  uCooling: number;
  uOther: number;
  oAcmv: number;
  oSocket: number;
  oKit: number;
  oServer: number;
  oLighting: number;
  nguoiChot: string;
}

// Sheet 8: Quan_ly_chi_phi
export interface CostRecord {
  idChiPhi: string;
  ngayGhiNhan: string; // YYYY-MM-DD
  phanLoai: CostCategory;
  thamChieu: string; // Mã TB / Ticket
  soTienVND: number;
  nhaCungCap: string;
  trangThai: CostStatus;
  ghiChu: string;
}

// Sheet 9: Nuoc_month
export interface WaterMonthly {
  month: string; // YYYY-MM
  waterM3: number;
  waterVND: number;
  waterUSD: number;
  sewageVND: number;
  sewageUSD: number;
}

// Sheet 10: Nhan_vien
export interface Employee {
  maNhanVien: string;
  tenNhanVien: string;
  date: string; // YYYY-MM-DD
  chucVu: UserRole;
  ngayVao: string; // YYYY-MM-DD (Ngày vào làm)
  soDienThoai: string;
  email: string;
  username: string;
  password?: string;
  quyenHan?: string[]; // Danh sách quyền (rules)
  allowedViews?: string[]; // Phân quyền view tùy chọn theo phân hệ
  anhDaiDien?: string;
  // Hồ sơ cá nhân & Chế độ nghỉ phép (Profile)
  ngaySinh?: string; // YYYY-MM-DD (Ngày tháng năm sinh)
  gioiTinh?: 'Nam' | 'Nữ' | 'Khác';
  queQuan?: string; // Quê quán
  diaChiThuongTru?: string; // Địa chỉ hiện tại / Thường trú
  soCCCD?: string; // Số CCCD / CMND
  ngayCapCCCD?: string; // YYYY-MM-DD
  noiCapCCCD?: string;
  trinhDoHocVan?: string; // Trình độ học vấn / Bằng cấp
  tinhTrangHonNhan?: 'Độc thân' | 'Đã kết hôn' | 'Khác';
  phongBan?: string; // Phòng ban / Bộ phận
  chuyenMon?: string; // Chuyên môn / Chứng chỉ nghề
  loaiHopDong?: 'Chính thức' | 'Thử việc' | 'Thời vụ' | 'Quản lý';
  caLamViec?: string; // Ca làm việc chính
  ngayNghiPhepNam?: number; // Tổng số ngày nghỉ phép trong năm
  ngayNghiPhepDaDung?: number; // Số ngày nghỉ phép đã sử dụng trong năm
  nguoiLienHeKhanCap?: string; // Họ tên người liên hệ khẩn cấp
  sdtKhanCap?: string; // Số điện thoại liên hệ khẩn cấp
  ghiChuHoSo?: string; // Ghi chú hồ sơ / Kỹ năng
}

// Sheet 11: Dien_Nuoc
export interface MeterReading {
  id: string;
  timestamp: string;
  ngayChot: string; // YYYY-MM-DD
  nguon: 'EVN' | 'Solar' | 'Nước Sinh hoạt' | 'Nước Máy' | 'Nước Tái Sử Dụng' | 'Khí Nén';
  tenDongHo: string;
  chiSoCu: number;
  chiSoMoi: number;
  tieuThu: number; // Mới - Cũ
  donVi: string;
  nguoiGhi: string;
}

// Sheet 12: Log_He_thong
export interface AuditLog {
  id: string;
  thoiGian: string; // ISO / formatted
  nguoiThaoTac: string;
  hanhDong: 'Thêm' | 'Sửa' | 'Xóa' | 'Xuất kho' | 'Nhập kho' | 'Hoàn thành' | 'Chốt số' | 'Đăng nhập' | 'Đăng xuất' | 'Cập nhật';
  chucNang: string;
  doiTuong: string;
  chiTietNoiDung: string;
}

// Email & Web Notifications Service
export type NotificationDeliveryMode = 'both' | 'web_only' | 'email_only';

export interface EmailConfig {
  enabled: boolean;
  notificationMode?: NotificationDeliveryMode;
  enableBrowserNotifications?: boolean;
  enableInAppToast?: boolean;
  notifyOnNewTicket: boolean;
  notifyOnMaintenanceDue: boolean;
  notifyOnOverdue: boolean;
  notifyOnInspectionDue?: boolean;
  primaryRecipient: string; // mặc định: khiemhuynhggs@gmail.com
  ccRecipients: string; // các email kỹ thuật phân cách bởi dấu phẩy
  senderName: string;
  webhookUrl?: string; // Optional webhook endpoint (Google Apps Script, Make, Zapier, Resend proxy, etc.)
  autoDispatchMethod: 'gmail_compose' | 'mailto' | 'direct_service';
}

export interface WebNotificationItem {
  id: string;
  timestamp: string;
  type: EmailLog['type'];
  title: string;
  message: string;
  relatedId?: string;
  targetTab?: string;
  read: boolean;
}

export interface EmailLog {
  id: string;
  timestamp: string;
  type:
    | 'TICKET_MOI'
    | 'BAO_TRI_DEN_HAN'
    | 'BAO_TRI_QUA_HAN'
    | 'KIEM_DINH_DEN_HAN'
    | 'GIAO_VIEC'
    | 'BAO_CAO_HOAN_THANH'
    | 'THU_NGHIEM';
  recipient: string;
  cc?: string;
  subject: string;
  bodySnippet: string;
  fullContent?: string;
  status:
    | 'Đã gửi'
    | 'Đã gửi (Gmail)'
    | 'Đã gửi (Webhook)'
    | 'Thông báo Web'
    | 'Đã gửi Web + Email'
    | 'Chờ người dùng gửi'
    | 'Thất bại'
    | 'Đã tạo bản nháp';
  relatedId?: string; // Mã ticket hoặc mã thiết bị
  errorMessage?: string;
}

export interface PendingEmailDispatch {
  logId: string;
  type: EmailLog['type'];
  to: string;
  cc: string;
  subject: string;
  body: string;
  relatedId?: string;
  webhookError?: string;
}

export interface AutoEmailServerStatus {
  smtpConfigured: boolean;
  resendConfigured: boolean;
  envWebhookConfigured: boolean;
  smtpUser: string;
  activeChannels: string[];
  loaded: boolean;
}

export interface EmailSendResult {
  success: boolean;
  method: 'auto' | 'webhook' | 'interactive' | 'draft' | 'failed';
  channel?: 'web' | 'gmail' | 'smtp' | 'resend' | 'webhook';
  webNotified?: boolean;
  deduplicated?: boolean;
  notConfigured?: boolean;
  needsGmailAuth?: boolean;
  recipient: string;
  logId: string;
  message: string;
}

export interface AppViewOption {
  id: string;
  label: string;
  desc: string;
}

export const APP_VIEW_OPTIONS: AppViewOption[] = [
  { id: 'dashboard', label: 'Tổng Quan O&M', desc: 'Bảng điều hành nhà máy' },
  { id: 'admin_dashboard', label: 'Dashboard Admin', desc: 'OEE, MTBF, MTTR & KPI vận hành' },
  { id: 'my_tasks', label: 'Việc Được Giao', desc: 'Nhiệm vụ của tôi' },
  { id: 'morning_checks', label: 'Công Việc Đầu Ngày', desc: 'Kiểm tra Vòng trong, Vòng Ngoài & Phòng Utility' },
  { id: 'profile', label: 'Hồ Sơ Cá Nhân', desc: 'Thông tin & Phép năm' },
  { id: 'equipment', label: 'Danh Sách Thiết Bị', desc: 'Máy móc & Mã QR' },
  { id: 'maintenance', label: 'Kế Hoạch & Lịch Sử', desc: 'Bảo trì định kỳ' },
  { id: 'inspection_calibration', label: 'Kiểm Định & Hiệu Chuẩn', desc: 'An toàn, hiệu chuẩn & nhắc hạn' },
  { id: 'tools', label: 'Dụng Cụ & Đồ Nghề', desc: 'Cấp phát, mượn trả & kiểm kê' },
  { id: 'tickets', label: 'Quản Lý Tickets', desc: 'Yêu cầu & sự cố' },
  { id: 'projects', label: 'Quản Lý Dự Án', desc: 'Tiến độ, WBS, Kanban & Ngân sách' },
  { id: 'spare_parts', label: 'Kho Phụ Tùng', desc: 'Xuất nhập tồn kho' },
  { id: 'documents', label: 'Tra Cứu Tài Liệu', desc: 'SOP & Checklist' },
  { id: 'energy', label: 'Năng Lượng Điện - Nước', desc: 'EVN, Solar & Đồng hồ' },
  { id: 'costs', label: 'Quản Lý Chi Phí', desc: 'Mua sắm & Sửa chữa' },
  { id: 'employees', label: 'Nhân Viên & Phân Quyền', desc: 'Tài khoản & Chức vụ' },
  { id: 'employee_performance', label: 'Đánh Giá Hiệu Quả NV', desc: 'Khối lượng & hiệu suất (Admin)' },
  { id: 'logs', label: 'Nhật Ký Hệ Thống', desc: 'Lịch sử thao tác' },
  { id: 'email_alerts', label: 'Thông Báo Email', desc: 'Cấu hình thông báo' },
];

export type ProjectStatus =
  | 'Lập kế hoạch'
  | 'Đang triển khai'
  | 'Tạm dừng'
  | 'Chờ nghiệm thu'
  | 'Hoàn thành'
  | 'Hủy';

export type ProjectPriority = 'Khẩn cấp' | 'Cao' | 'Trung bình' | 'Thấp';

export type ProjectTaskStatus = 'Cần làm' | 'Đang làm' | 'Chờ duyệt' | 'Hoàn thành';

export type ProjectRiskLevel = 'Cao' | 'Trung bình' | 'Thấp';

export type ProjectCategory =
  | 'Nâng cấp hạ tầng'
  | 'Lắp đặt thiết bị mới'
  | 'Tiết kiệm năng lượng'
  | 'An toàn & Môi trường'
  | 'Cải tạo hệ thống';

export interface ProjectMilestone {
  id: string;
  tenMoc: string;
  hanHoanThanh: string; // YYYY-MM-DD
  daDat: boolean;
  ghiChu?: string;
}

export interface ProjectTask {
  id: string;
  maCongViec: string;
  tieuDe: string;
  moTa?: string;
  giaiDoan?: string;
  nguoiPhuTrach: string; // Comma-separated assignees
  trangThai: ProjectTaskStatus;
  uuTien: ProjectPriority;
  ngayBatDau: string; // YYYY-MM-DD
  hanHoanThanh: string; // YYYY-MM-DD
  tienDo: number; // 0-100
  gioDuKien?: number;
  gioThucTe?: number;
}

export interface ProjectRisk {
  id: string;
  moTa: string;
  mucDo: ProjectRiskLevel;
  giaiPhap: string;
  trangThai: 'Đang theo dõi' | 'Đã xử lý';
  nguoiPhuTrach: string;
}

export interface ProjectExpense {
  id: string;
  ngay: string; // YYYY-MM-DD
  hangMuc: string;
  nhaCungCap?: string;
  soTienVND: number;
  trangThai: 'Dự toán' | 'Đã duyệt' | 'Đã chi';
}

export interface FacilityProject {
  id: string;
  maDuAn: string;
  tenDuAn: string;
  danhMuc: ProjectCategory;
  moTa: string;
  mucTieu: string;
  phamVi?: string;
  trangThai: ProjectStatus;
  uuTien: ProjectPriority;
  quanLyDuAn: string;
  thanhVien: string; // Comma-separated team members
  ngayBatDau: string; // YYYY-MM-DD
  ngayKetThucDuKien: string; // YYYY-MM-DD
  ngayHoanThanhThucTe?: string;
  nganSachDuKien: number;
  chiPhiThucTe: number;
  tienDoThuCong?: number;
  maThietBiLienQuan?: string[];
  congViec: ProjectTask[];
  cotMoc: ProjectMilestone[];
  ruiRo: ProjectRisk[];
  khoanChi: ProjectExpense[];
  ngayCapNhat: string;
}

export type DocumentCategory =
  | 'Hướng dẫn công việc (SOP)'
  | 'Checklist kiểm tra'
  | 'Tài liệu kỹ thuật'
  | 'An toàn & Biểu mẫu';

export type DocumentSourceType = 'link' | 'upload' | 'checklist';

export interface DocumentStep {
  id: string;
  title: string;
  detail?: string;
  checked?: boolean;
}

export interface FacilityDocument {
  id: string;
  maTaiLieu: string;
  tieuDe: string;
  phanLoai: DocumentCategory;
  heThong?: string;
  maThietBi?: string;
  loaiNguon: DocumentSourceType;
  duongDanUrl?: string;
  fileDataUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSizeKb?: number;
  noiDung?: string;
  checklistSteps?: DocumentStep[];
  mobileFriendly: boolean;
  nguoiTao: string;
  ngayCapNhat: string;
  moTaNgan?: string;
}

// Cấu hình đơn giá năng lượng và tỷ giá USD/VNĐ
export interface EnergyTariffConfig {
  evnBT: number; // VNĐ / kWh (Giờ Bình Thường) - mặc định 1.738
  evnCD: number; // VNĐ / kWh (Giờ Cao Điểm) - mặc định 3.171
  evnTD: number; // VNĐ / kWh (Giờ Thấp Điểm) - mặc định 1.133
  solarBT: number; // VNĐ / kWh (Solar Bình Thường) - mặc định 1.738
  solarCD: number; // VNĐ / kWh (Solar Cao Điểm) - mặc định 3.171
  waterVNDPerM3: number; // VNĐ / m³ (Nước sinh hoạt) - mặc định 15.000
  sewageVNDPerM3: number; // VNĐ / m³ (Phí xử lý nước thải) - mặc định 7.500
  usdToVndRate: number; // VNĐ / USD - mặc định 25.400
}

export const DEFAULT_ENERGY_TARIFF_CONFIG: EnergyTariffConfig = {
  evnBT: 1738,
  evnCD: 3171,
  evnTD: 1133,
  solarBT: 1738,
  solarCD: 3171,
  waterVNDPerM3: 15000,
  sewageVNDPerM3: 7500,
  usdToVndRate: 25400,
};

// 1. Hệ EVN bao gồm 10 đồng hồ theo tủ hàng ngày
export const EVN_DAILY_PANEL_METERS = [
  'MSB 1 - TĐT 1',
  'MSB 2 - TĐT 2',
  'MSB 3 - TĐT 1',
  'MSB 4 - TĐT 1',
  'MSB 5 - TĐT 1',
  'DB - COOLING TOWER',
  'DB - CHILLER WATER PUMP',
  'DB - CHILLER',
  'MCC-GE-CH',
  'PP-1000A',
] as const;

// 2. Hệ Solar bao gồm 3 đồng hồ theo tủ hàng ngày
export const SOLAR_DAILY_PANEL_METERS = [
  'MSB 1 - DB - INVT',
  'MSB 2 - DB - INVT',
  'MSB 3 - DB - INVT',
] as const;

// 3. Số nước hàng ngày bao gồm các đồng hồ
export const WATER_DAILY_METERS = [
  'ĐỒNG HỒ NƯỚC TỔNG (P1) (m3)',
  'ĐỒNG HỒ NƯỚC TƯỚI CỎ (P2) (m3)',
  'ĐỒNG HỒ NƯỚC CHILLER (m3)',
  'ĐỒNG HỒ NƯỚC DI (m3)',
  'ĐỒNG HỒ NƯỚC HỆ NƯỚC UỐNG (m3)',
  'ĐỒNG HỒ NƯỚC THẢI ĐẦU RA (m3)',
  'ĐỒNG HỒ NƯỚC THẢI ĐẦU RA DI rửa ngược (m3)',
  'ĐỒNG HỒ NƯỚC THẢI ĐẦU RA DI xả tràn T103 (m3)',
] as const;

// Kiểm định an toàn & Hiệu chuẩn thiết bị
export type InspectionCategory =
  | 'Kiểm định an toàn'
  | 'Hiệu chuẩn đo lường'
  | 'Kiểm tra PCCC / Môi trường';

export type InspectionCycle = '3 tháng' | '6 tháng' | '12 tháng' | '24 tháng' | '36 tháng';

export type InspectionStatus = 'Quá hạn' | 'Sắp đến hạn' | 'Còn hạn' | 'Đang kiểm định';

export interface InspectionHistoryEntry {
  id: string;
  ngayThucHien: string; // YYYY-MM-DD
  donViThucHien: string;
  soTemChungNhan: string;
  ketQua: 'Đạt' | 'Không đạt' | 'Cần hiệu chỉnh';
  ghiChu?: string;
  nguoiCapNhat: string;
}

export interface SafetyInspectionItem {
  id: string;
  maHoSo: string;
  maThietBi?: string;
  tenThietBi: string;
  phanLoai: InspectionCategory;
  viTri: string;
  soTemGiayChungNhan: string;
  donViKiemDinh: string;
  chuKy: InspectionCycle;
  ngayKiemDinhGanNhat: string; // YYYY-MM-DD
  ngayHetHan: string; // YYYY-MM-DD
  nhacTruocNgay: number; // Số ngày nhắc trước hạn (mặc định 30)
  nguoiPhuTrach: string;
  emailCanhBao?: string;
  trangThai: InspectionStatus;
  ghiChu?: string;
  lichSu?: InspectionHistoryEntry[];
}

// Quản lý Dụng cụ & Đồ nghề
export type ToolCategory =
  | 'Dụng cụ cầm tay'
  | 'Thiết bị đo kiểm'
  | 'Dụng cụ điện / pin'
  | 'Thiết bị nâng hạ & An toàn'
  | 'Dụng cụ chuyên dụng HVAC/Điện';

export type ToolCondition = 'Tốt' | 'Đang sử dụng' | 'Cần bảo dưỡng' | 'Hư hỏng' | 'Thất lạc';

export interface ToolItem {
  id: string;
  maDungCu: string;
  tenDungCu: string;
  danhMuc: ToolCategory;
  thuongHieu?: string;
  serialNumber?: string;
  soLuongTong: number;
  soLuongKhaDung: number;
  soLuongDangMuon: number;
  donViTinh: string;
  viTriLuu: string;
  tinhTrang: ToolCondition;
  nguoiDangGiu?: string;
  ngayMuonGanNhat?: string;
  hanTraDuKien?: string;
  canHieuChuan?: boolean;
  hanHieuChuan?: string;
  ghiChu?: string;
}

export interface ToolBorrowLog {
  id: string;
  maDungCu: string;
  tenDungCu: string;
  loaiGiaoDich: 'Mượn' | 'Trả' | 'Bảo dưỡng' | 'Kiểm kê';
  soLuong: number;
  nguoiMuon: string;
  nguoiBanGiao: string;
  ngayGiaoDich: string; // YYYY-MM-DD
  hanTra?: string; // YYYY-MM-DD
  tinhTrangKhiTra?: ToolCondition;
  ghiChu?: string;
}

// Công Việc Đầu Ngày (Kiểm tra 3 khu vực: Vòng trong, Vòng Ngoài, Phòng Utility)
export type DailyInspectionArea = 'Vòng trong' | 'Vòng Ngoài' | 'Phòng Utility';

export type DailyAreaCheckShift = 'Ca Sáng' | 'Ca Chiều' | 'Ca Đêm';

export type DailyAreaCheckStatus = 'Chờ kiểm tra' | 'Đang kiểm tra' | 'Đã hoàn thành';

export type DailyAreaCheckResult = 'Chưa đánh giá' | 'Bình thường' | 'Cần theo dõi' | 'Có sự cố';

export interface DailyAreaCheck {
  id: string;
  ngayKiemTra: string; // YYYY-MM-DD
  caLamViec: DailyAreaCheckShift;
  khuVuc: DailyInspectionArea;
  tieuDe: string;
  moTaCongViec: string;
  nguoiDuocGiao: string;
  nguoiPhanQuyen?: string;
  hanHoanThanh?: string; // e.g., '08:30'
  trangThai: DailyAreaCheckStatus;
  ketQua: DailyAreaCheckResult;
  baoCaoThucTe?: string;
  nguoiBaoCao?: string;
  thoiGianBaoCao?: string;
  anhHienTruong?: string;
}



