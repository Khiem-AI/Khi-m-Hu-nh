import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebaseClient';
import {
  AuditLog,
  CostRecord,
  DailyAreaCheck,
  EmailConfig,
  EmailLog,
  Employee,
  EnergyTariffConfig,
  Equipment,
  FacilityDocument,
  FacilityProject,
  MaintenanceHistory,
  MaintenancePlan,
  MeterReading,
  MonthlyBoardReportsStore,
  MorningCheckTemplatesMap,
  Power10Days,
  PurchaseRequest,
  SafetyInspectionItem,
  SparePart,
  StockTransaction,
  Ticket,
  ToolBorrowLog,
  ToolItem,
  WaterMonthly,
} from '../types/cmms';
import { isPlaceholderEmail, isValidEmailFormat } from './cmmsLogic';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'khiemhuynhggs@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function formatFirestoreSyncError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  if (raw.includes('Free daily read units per project')) {
    return 'Dự án Firebase đã vượt hạn mức đọc miễn phí trong ngày (Free tier quota). Vui lòng nâng cấp lên gói Blaze trong Firebase Console để tiếp tục đồng bộ.';
  }
  if (/permission-denied|Missing or insufficient permissions/i.test(raw)) {
    let rejectedEmail = auth.currentUser?.email || '';
    try {
      const parsed = JSON.parse(raw) as { authInfo?: { email?: string | null } };
      if (parsed?.authInfo?.email) rejectedEmail = parsed.authInfo.email;
    } catch {
      // ignore
    }
    const who = rejectedEmail ? ` (${rejectedEmail})` : '';
    return `Tài khoản Google${who} chưa được cấp quyền truy cập Cloud. Nếu dùng mô hình 1 tài khoản Admin, hãy ngắt kết nối tài khoản này và đăng nhập bằng Admin (${BOOTSTRAPPED_ADMIN_EMAIL}).`;
  }
  if (/unavailable|offline|network/i.test(raw)) {
    return 'Mất kết nối tới máy chủ Cloud Firestore. Dữ liệu vẫn được lưu tạm trên máy và sẽ đồng bộ khi có mạng.';
  }
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed?.error) return parsed.error;
  } catch {
    // not JSON
  }
  return raw || 'Lỗi đồng bộ dữ liệu Cloud.';
}

export function toFirestoreDocId(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '_');
  const safe = cleaned || `DOC_${Date.now()}`;
  return safe.slice(0, 128);
}

export function buildAllowedEmails(employees: Employee[], currentEmail?: string | null): string[] {
  const set = new Set<string>([BOOTSTRAPPED_ADMIN_EMAIL]);
  if (currentEmail && isValidEmailFormat(currentEmail)) {
    set.add(currentEmail.trim().toLowerCase());
  }
  for (const emp of employees) {
    const mail = (emp.email || '').trim().toLowerCase();
    if (mail && isValidEmailFormat(mail) && !isPlaceholderEmail(mail)) {
      set.add(mail);
    }
    if (set.size >= 50) break;
  }
  return Array.from(set).slice(0, 50);
}

function clampString(val: unknown, maxLen: number): string {
  const str = typeof val === 'string' ? val : String(val ?? '');
  return str.length > maxLen ? str.slice(0, maxLen) : str;
}

function clampDataUrl(val: unknown): string | undefined {
  const str = typeof val === 'string' ? val : '';
  if (!str) return undefined;
  if (str.length <= 440000) return str;
  // Omit oversized data URL so document remains safely under Firestore 1MB limit
  return undefined;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      if (Array.isArray(v)) {
        out[k] = v.map((item) =>
          item && typeof item === 'object' && !Array.isArray(item)
            ? stripUndefined(item as Record<string, unknown>)
            : item
        );
      } else if (v && typeof v === 'object' && !(v instanceof Date)) {
        out[k] = stripUndefined(v as Record<string, unknown>);
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}

export function sanitizeEquipment(item: Equipment): Record<string, unknown> {
  return stripUndefined({
    maThietBi: clampString(item.maThietBi, 80),
    tenThietBi: clampString(item.tenThietBi, 200),
    thongSoKyThuat: clampString(item.thongSoKyThuat || '', 4000),
    heThong: clampString(item.heThong || 'Khác', 120),
    viTri: clampString(item.viTri || 'Nhà máy', 160),
    mucDoRuiRo: item.mucDoRuiRo || 'Medium',
    trangThai: item.trangThai || 'Hoạt động',
    tanSuat: item.tanSuat || 'Monthly',
    hanBaoTriTiepTheo: clampString(item.hanBaoTriTiepTheo || '', 32),
    nguoiPhuTrach: clampString(item.nguoiPhuTrach || '', 300),
    nguoiGiaoViec: item.nguoiGiaoViec ? clampString(item.nguoiGiaoViec, 160) : undefined,
    email: clampString(item.email || '', 500),
    qrCode: item.qrCode ? clampString(item.qrCode, 500) : undefined,
    hinhAnh: clampDataUrl(item.hinhAnh),
    ngayLapDat: item.ngayLapDat ? clampString(item.ngayLapDat, 32) : undefined,
  });
}

export function sanitizeMaintenancePlan(plan: MaintenancePlan): Record<string, unknown> {
  return stripUndefined({
    id: clampString(plan.id, 128),
    maThietBi: clampString(plan.maThietBi, 80),
    tenThietBi: clampString(plan.tenThietBi, 200),
    loaiBaoTri: clampString(plan.loaiBaoTri || 'Định kỳ', 80),
    tanSuat: plan.tanSuat || 'Monthly',
    ngayBaoTriGanNhat: plan.ngayBaoTriGanNhat ? clampString(plan.ngayBaoTriGanNhat, 32) : undefined,
    ngayBaoTriTiepTheo: clampString(plan.ngayBaoTriTiepTheo || '', 32),
    nguoiPhuTrach: clampString(plan.nguoiPhuTrach || '', 300),
    nguoiGiaoViec: plan.nguoiGiaoViec ? clampString(plan.nguoiGiaoViec, 160) : undefined,
    trangThai: plan.trangThai || 'Đúng hạn',
    ghiChu: plan.ghiChu ? clampString(plan.ghiChu, 1500) : undefined,
  });
}

export function sanitizeMaintenanceHistory(item: MaintenanceHistory): Record<string, unknown> {
  return stripUndefined({
    id: clampString(item.id, 128),
    maThietBi: clampString(item.maThietBi, 80),
    tenThietBi: clampString(item.tenThietBi, 200),
    loaiCongViec: item.loaiCongViec ? clampString(item.loaiCongViec, 80) : undefined,
    ngayThucHien: clampString(item.ngayThucHien || '', 32),
    nguoiThucHien: clampString(item.nguoiThucHien || '', 300),
    nguoiGiaoViec: item.nguoiGiaoViec ? clampString(item.nguoiGiaoViec, 160) : undefined,
    moTaCongViec: clampString(item.moTaCongViec || '', 3000),
    thoiGianDungMay: Number(item.thoiGianDungMay) || 0,
    ketQua: item.ketQua || 'Hoàn thành',
    anhTruocXuLy: clampDataUrl(item.anhTruocXuLy),
    hinhAnh: clampDataUrl(item.hinhAnh),
    nguoiLapBaoCao: clampString(item.nguoiLapBaoCao || '', 160),
    chiPhiUocTinh: typeof item.chiPhiUocTinh === 'number' ? item.chiPhiUocTinh : undefined,
  });
}

export function sanitizeTicket(t: Ticket): Record<string, unknown> {
  return stripUndefined({
    maTicket: clampString(t.maTicket, 80),
    tieuDe: clampString(t.tieuDe, 300),
    moTaChiTiet: clampString(t.moTaChiTiet || '', 4000),
    mucDoUuTien: t.mucDoUuTien || 'Trung bình',
    trangThai: t.trangThai || 'Mới tiếp nhận',
    nguoiLap: clampString(t.nguoiLap || '', 160),
    nguoiGiaoViec: t.nguoiGiaoViec ? clampString(t.nguoiGiaoViec, 160) : undefined,
    nguoiPhuTrach: clampString(t.nguoiPhuTrach || '', 300),
    ngayTao: clampString(t.ngayTao || '', 32),
    maThietBi: t.maThietBi ? clampString(t.maThietBi, 80) : undefined,
    ketQua: t.ketQua ? clampString(t.ketQua, 2000) : undefined,
    ngayHoanThanh: t.ngayHoanThanh ? clampString(t.ngayHoanThanh, 32) : undefined,
    anhTruocXuLy: clampDataUrl(t.anhTruocXuLy),
    anhSauXuLy: clampDataUrl(t.anhSauXuLy),
  });
}

export function sanitizeSparePart(p: SparePart): Record<string, unknown> {
  return stripUndefined({
    maVatTu: clampString(p.maVatTu, 80),
    tenVatTu: clampString(p.tenVatTu, 200),
    thongSo: clampString(p.thongSo || '', 1000),
    maThietBi: clampString(p.maThietBi || '', 80),
    tenThietBiSuDung: clampString(p.tenThietBiSuDung || '', 300),
    tonThucTe: Number(p.tonThucTe) || 0,
    tonToiThieu: Number(p.tonToiThieu) || 0,
    donViTinh: clampString(p.donViTinh || 'Cái', 40),
    viTriLuu: clampString(p.viTriLuu || '', 120),
    ghiChu: clampString(p.ghiChu || '', 1000),
    donGia: Number(p.donGia) || 0,
  });
}

export function sanitizeStockTx(tx: StockTransaction): Record<string, unknown> {
  return stripUndefined({
    transId: clampString(tx.transId, 80),
    ngay: clampString(tx.ngay || '', 32),
    loaiGD: tx.loaiGD,
    maVatTu: clampString(tx.maVatTu, 80),
    thietBiSuDung: clampString(tx.thietBiSuDung || '', 200),
    soLuong: Number(tx.soLuong) || 0,
    nguoiThucHien: clampString(tx.nguoiThucHien || '', 160),
    ghiChu: clampString(tx.ghiChu || '', 1000),
    donGiaSnapshot: typeof tx.donGiaSnapshot === 'number' ? tx.donGiaSnapshot : undefined,
  });
}

export function sanitizePower10Days(p: Power10Days): Record<string, unknown> {
  return stripUndefined({
    id: clampString(p.id, 80),
    thoiGianLuu: clampString(p.thoiGianLuu || '', 40),
    chuKy: clampString(p.chuKy || '', 80),
    tuNgay: clampString(p.tuNgay || '', 32),
    denNgay: clampString(p.denNgay || '', 32),
    ngayLamViec: Number(p.ngayLamViec) || 0,
    loaiCa: clampString(p.loaiCa || '', 40),
    tbNgayKwh: Number(p.tbNgayKwh) || 0,
    evnBT: Number(p.evnBT) || 0,
    evnCD: Number(p.evnCD) || 0,
    evnTD: Number(p.evnTD) || 0,
    solarBT: Number(p.solarBT) || 0,
    solarCD: Number(p.solarCD) || 0,
    pLighting: Number(p.pLighting) || 0,
    pAcmv: Number(p.pAcmv) || 0,
    pEquipment: Number(p.pEquipment) || 0,
    uChiller: Number(p.uChiller) || 0,
    uMChiller: Number(p.uMChiller) || 0,
    uComp: Number(p.uComp) || 0,
    uPump: Number(p.uPump) || 0,
    uCooling: Number(p.uCooling) || 0,
    uOther: Number(p.uOther) || 0,
    oAcmv: Number(p.oAcmv) || 0,
    oSocket: Number(p.oSocket) || 0,
    oKit: Number(p.oKit) || 0,
    oServer: Number(p.oServer) || 0,
    oLighting: Number(p.oLighting) || 0,
    nguoiChot: clampString(p.nguoiChot || '', 160),
  });
}

export function sanitizeWaterMonthly(w: WaterMonthly): Record<string, unknown> {
  return stripUndefined({
    month: clampString(w.month, 32),
    waterM3: Number(w.waterM3) || 0,
    waterVND: Number(w.waterVND) || 0,
    waterUSD: Number(w.waterUSD) || 0,
    sewageVND: Number(w.sewageVND) || 0,
    sewageUSD: Number(w.sewageUSD) || 0,
  });
}

export function sanitizeMeterReading(m: MeterReading): Record<string, unknown> {
  return stripUndefined({
    id: clampString(m.id, 80),
    timestamp: clampString(m.timestamp || '', 40),
    ngayChot: clampString(m.ngayChot || '', 32),
    nguon: clampString(m.nguon || 'EVN', 60),
    tenDongHo: clampString(m.tenDongHo || '', 160),
    chiSoCu: Number(m.chiSoCu) || 0,
    chiSoMoi: Number(m.chiSoMoi) || 0,
    tieuThu: Number(m.tieuThu) || 0,
    donVi: clampString(m.donVi || 'kWh', 32),
    nguoiGhi: clampString(m.nguoiGhi || '', 160),
  });
}

export function sanitizeCostRecord(c: CostRecord): Record<string, unknown> {
  return stripUndefined({
    idChiPhi: clampString(c.idChiPhi, 80),
    ngayGhiNhan: clampString(c.ngayGhiNhan || '', 32),
    phanLoai: clampString(c.phanLoai || '', 120),
    thamChieu: clampString(c.thamChieu || '', 160),
    soTienVND: Number(c.soTienVND) || 0,
    nhaCungCap: clampString(c.nhaCungCap || '', 200),
    trangThai: clampString(c.trangThai || 'Chờ duyệt', 60),
    ghiChu: clampString(c.ghiChu || '', 1000),
  });
}

export function sanitizeEmployeePublic(emp: Employee): Record<string, unknown> {
  return stripUndefined({
    maNhanVien: clampString(emp.maNhanVien, 60),
    tenNhanVien: clampString(emp.tenNhanVien, 160),
    date: emp.date ? clampString(emp.date, 32) : undefined,
    chucVu: clampString(emp.chucVu || '', 120),
    ngayVao: emp.ngayVao ? clampString(emp.ngayVao, 32) : undefined,
    username: emp.username ? clampString(emp.username, 120) : undefined,
    quyenHan: Array.isArray(emp.quyenHan) ? emp.quyenHan.slice(0, 30) : undefined,
    allowedViews: Array.isArray(emp.allowedViews) ? emp.allowedViews.slice(0, 30) : undefined,
    anhDaiDien: clampDataUrl(emp.anhDaiDien),
    gioiTinh: emp.gioiTinh,
    phongBan: emp.phongBan ? clampString(emp.phongBan, 120) : undefined,
    chuyenMon: emp.chuyenMon ? clampString(emp.chuyenMon, 300) : undefined,
    loaiHopDong: emp.loaiHopDong,
    caLamViec: emp.caLamViec ? clampString(emp.caLamViec, 120) : undefined,
    ngayNghiPhepNam:
      typeof emp.ngayNghiPhepNam === 'number'
        ? Math.min(365, Math.max(0, emp.ngayNghiPhepNam))
        : undefined,
    ngayNghiPhepDaDung:
      typeof emp.ngayNghiPhepDaDung === 'number'
        ? Math.min(365, Math.max(0, emp.ngayNghiPhepDaDung))
        : undefined,
    ghiChuHoSo: emp.ghiChuHoSo ? clampString(emp.ghiChuHoSo, 1500) : undefined,
  });
}

export function sanitizeEmployeePrivate(emp: Employee): Record<string, unknown> {
  return stripUndefined({
    maNhanVien: clampString(emp.maNhanVien, 60),
    email: clampString((emp.email || '').trim().toLowerCase(), 200),
    soDienThoai: emp.soDienThoai ? clampString(emp.soDienThoai, 40) : undefined,
    ngaySinh: emp.ngaySinh ? clampString(emp.ngaySinh, 32) : undefined,
    queQuan: emp.queQuan ? clampString(emp.queQuan, 200) : undefined,
    diaChiThuongTru: emp.diaChiThuongTru ? clampString(emp.diaChiThuongTru, 300) : undefined,
    soCCCD: emp.soCCCD ? clampString(emp.soCCCD, 32) : undefined,
    ngayCapCCCD: emp.ngayCapCCCD ? clampString(emp.ngayCapCCCD, 32) : undefined,
    noiCapCCCD: emp.noiCapCCCD ? clampString(emp.noiCapCCCD, 200) : undefined,
    trinhDoHocVan: emp.trinhDoHocVan ? clampString(emp.trinhDoHocVan, 200) : undefined,
    tinhTrangHonNhan: emp.tinhTrangHonNhan,
    nguoiLienHeKhanCap: emp.nguoiLienHeKhanCap
      ? clampString(emp.nguoiLienHeKhanCap, 160)
      : undefined,
    sdtKhanCap: emp.sdtKhanCap ? clampString(emp.sdtKhanCap, 40) : undefined,
  });
}

export function sanitizeEmployeeSelfPublic(emp: Employee): Record<string, unknown> {
  return stripUndefined({
    tenNhanVien: clampString(emp.tenNhanVien, 160),
    anhDaiDien: clampDataUrl(emp.anhDaiDien),
    gioiTinh: emp.gioiTinh,
    chuyenMon: emp.chuyenMon ? clampString(emp.chuyenMon, 300) : undefined,
    ghiChuHoSo: emp.ghiChuHoSo ? clampString(emp.ghiChuHoSo, 1500) : undefined,
  });
}

export function sanitizeEmployeeSelfPrivate(emp: Employee): Record<string, unknown> {
  return stripUndefined({
    soDienThoai: emp.soDienThoai ? clampString(emp.soDienThoai, 40) : undefined,
    ngaySinh: emp.ngaySinh ? clampString(emp.ngaySinh, 32) : undefined,
    queQuan: emp.queQuan ? clampString(emp.queQuan, 200) : undefined,
    diaChiThuongTru: emp.diaChiThuongTru ? clampString(emp.diaChiThuongTru, 300) : undefined,
    soCCCD: emp.soCCCD ? clampString(emp.soCCCD, 32) : undefined,
    ngayCapCCCD: emp.ngayCapCCCD ? clampString(emp.ngayCapCCCD, 32) : undefined,
    noiCapCCCD: emp.noiCapCCCD ? clampString(emp.noiCapCCCD, 200) : undefined,
    trinhDoHocVan: emp.trinhDoHocVan ? clampString(emp.trinhDoHocVan, 200) : undefined,
    tinhTrangHonNhan: emp.tinhTrangHonNhan,
    nguoiLienHeKhanCap: emp.nguoiLienHeKhanCap
      ? clampString(emp.nguoiLienHeKhanCap, 160)
      : undefined,
    sdtKhanCap: emp.sdtKhanCap ? clampString(emp.sdtKhanCap, 40) : undefined,
  });
}

export function sanitizeDocument(d: FacilityDocument): Record<string, unknown> {
  return stripUndefined({
    id: clampString(d.id, 80),
    maTaiLieu: clampString(d.maTaiLieu || d.id, 80),
    tieuDe: clampString(d.tieuDe || '', 300),
    phanLoai: clampString(d.phanLoai || '', 120),
    heThong: d.heThong ? clampString(d.heThong, 120) : undefined,
    maThietBi: d.maThietBi ? clampString(d.maThietBi, 80) : undefined,
    loaiNguon: d.loaiNguon ? clampString(d.loaiNguon, 40) : undefined,
    duongDanUrl: d.duongDanUrl ? clampString(d.duongDanUrl, 2000) : undefined,
    fileDataUrl: clampDataUrl(d.fileDataUrl),
    fileName: d.fileName ? clampString(d.fileName, 260) : undefined,
    fileType: d.fileType ? clampString(d.fileType, 120) : undefined,
    fileSizeKb: typeof d.fileSizeKb === 'number' ? d.fileSizeKb : undefined,
    noiDung: d.noiDung ? clampString(d.noiDung, 30000) : undefined,
    moTaNgan: d.moTaNgan ? clampString(d.moTaNgan, 2000) : undefined,
    nguoiTao: d.nguoiTao ? clampString(d.nguoiTao, 160) : undefined,
    ngayCapNhat: d.ngayCapNhat ? clampString(d.ngayCapNhat, 32) : undefined,
    mobileFriendly: Boolean(d.mobileFriendly),
    checklistSteps: Array.isArray(d.checklistSteps) ? d.checklistSteps.slice(0, 100) : undefined,
  });
}

export function sanitizeProject(p: FacilityProject): Record<string, unknown> {
  return stripUndefined({
    id: clampString(p.id, 80),
    maDuAn: clampString(p.maDuAn || p.id, 80),
    tenDuAn: clampString(p.tenDuAn || '', 300),
    danhMuc: p.danhMuc ? clampString(p.danhMuc, 120) : undefined,
    moTa: p.moTa ? clampString(p.moTa, 4000) : undefined,
    mucTieu: p.mucTieu ? clampString(p.mucTieu, 2000) : undefined,
    phamVi: p.phamVi ? clampString(p.phamVi, 2000) : undefined,
    trangThai: clampString(p.trangThai || 'Lập kế hoạch', 60),
    uuTien: p.uuTien ? clampString(p.uuTien, 40) : undefined,
    quanLyDuAn: p.quanLyDuAn ? clampString(p.quanLyDuAn, 160) : undefined,
    thanhVien: p.thanhVien ? clampString(p.thanhVien, 600) : undefined,
    ngayBatDau: p.ngayBatDau ? clampString(p.ngayBatDau, 32) : undefined,
    ngayKetThucDuKien: p.ngayKetThucDuKien ? clampString(p.ngayKetThucDuKien, 32) : undefined,
    ngayHoanThanhThucTe: p.ngayHoanThanhThucTe ? clampString(p.ngayHoanThanhThucTe, 32) : undefined,
    ngayCapNhat: p.ngayCapNhat ? clampString(p.ngayCapNhat, 32) : undefined,
    nganSachDuKien: Number(p.nganSachDuKien) || 0,
    chiPhiThucTe: Number(p.chiPhiThucTe) || 0,
    tienDoThuCong: typeof p.tienDoThuCong === 'number' ? p.tienDoThuCong : undefined,
    maThietBiLienQuan: Array.isArray(p.maThietBiLienQuan) ? p.maThietBiLienQuan.slice(0, 100) : undefined,
    congViec: Array.isArray(p.congViec) ? p.congViec.slice(0, 200) : undefined,
    cotMoc: Array.isArray(p.cotMoc) ? p.cotMoc.slice(0, 100) : undefined,
    khoanChi: Array.isArray(p.khoanChi) ? p.khoanChi.slice(0, 200) : undefined,
    ruiRo: Array.isArray(p.ruiRo) ? p.ruiRo.slice(0, 100) : undefined,
  });
}

export function sanitizeSafetyInspection(s: SafetyInspectionItem): Record<string, unknown> {
  return stripUndefined({
    id: clampString(s.id, 80),
    maHoSo: clampString(s.maHoSo || s.id, 80),
    maThietBi: s.maThietBi ? clampString(s.maThietBi, 80) : undefined,
    tenThietBi: clampString(s.tenThietBi || '', 300),
    phanLoai: s.phanLoai ? clampString(s.phanLoai, 120) : undefined,
    viTri: s.viTri ? clampString(s.viTri, 160) : undefined,
    soTemGiayChungNhan: s.soTemGiayChungNhan ? clampString(s.soTemGiayChungNhan, 120) : undefined,
    donViKiemDinh: s.donViKiemDinh ? clampString(s.donViKiemDinh, 200) : undefined,
    chuKy: s.chuKy ? clampString(s.chuKy, 40) : undefined,
    ngayKiemDinhGanNhat: s.ngayKiemDinhGanNhat ? clampString(s.ngayKiemDinhGanNhat, 32) : undefined,
    ngayHetHan: clampString(s.ngayHetHan || '', 32),
    nhacTruocNgay: Number(s.nhacTruocNgay) || 30,
    nguoiPhuTrach: s.nguoiPhuTrach ? clampString(s.nguoiPhuTrach, 300) : undefined,
    emailCanhBao: s.emailCanhBao ? clampString(s.emailCanhBao, 300) : undefined,
    trangThai: s.trangThai ? clampString(s.trangThai, 60) : undefined,
    ghiChu: s.ghiChu ? clampString(s.ghiChu, 1500) : undefined,
    lichSu: Array.isArray(s.lichSu) ? s.lichSu.slice(0, 100) : undefined,
  });
}

export function sanitizeToolItem(t: ToolItem): Record<string, unknown> {
  return stripUndefined({
    id: clampString(t.id, 80),
    maDungCu: clampString(t.maDungCu || t.id, 80),
    tenDungCu: clampString(t.tenDungCu || '', 200),
    danhMuc: t.danhMuc ? clampString(t.danhMuc, 120) : undefined,
    thuongHieu: t.thuongHieu ? clampString(t.thuongHieu, 160) : undefined,
    serialNumber: t.serialNumber ? clampString(t.serialNumber, 160) : undefined,
    soLuongTong: Number(t.soLuongTong) || 0,
    soLuongKhaDung: Number(t.soLuongKhaDung) || 0,
    soLuongDangMuon: Number(t.soLuongDangMuon) || 0,
    donViTinh: t.donViTinh ? clampString(t.donViTinh, 40) : undefined,
    viTriLuu: t.viTriLuu ? clampString(t.viTriLuu, 160) : undefined,
    tinhTrang: t.tinhTrang ? clampString(t.tinhTrang, 80) : undefined,
    nguoiDangGiu: t.nguoiDangGiu ? clampString(t.nguoiDangGiu, 300) : undefined,
    ngayMuonGanNhat: t.ngayMuonGanNhat ? clampString(t.ngayMuonGanNhat, 32) : undefined,
    hanTraDuKien: t.hanTraDuKien ? clampString(t.hanTraDuKien, 32) : undefined,
    canHieuChuan: typeof t.canHieuChuan === 'boolean' ? t.canHieuChuan : undefined,
    hanHieuChuan: t.hanHieuChuan ? clampString(t.hanHieuChuan, 32) : undefined,
    ghiChu: t.ghiChu ? clampString(t.ghiChu, 1000) : undefined,
  });
}

export function sanitizeToolLog(l: ToolBorrowLog): Record<string, unknown> {
  return stripUndefined({
    id: clampString(l.id, 80),
    maDungCu: clampString(l.maDungCu || '', 80),
    tenDungCu: l.tenDungCu ? clampString(l.tenDungCu, 200) : undefined,
    loaiGiaoDich: l.loaiGiaoDich,
    soLuong: Number(l.soLuong) || 0,
    nguoiMuon: clampString(l.nguoiMuon || '', 160),
    nguoiBanGiao: l.nguoiBanGiao ? clampString(l.nguoiBanGiao, 160) : undefined,
    ngayGiaoDich: clampString(l.ngayGiaoDich || '', 32),
    hanTra: l.hanTra ? clampString(l.hanTra, 32) : undefined,
    tinhTrangKhiTra: l.tinhTrangKhiTra ? clampString(l.tinhTrangKhiTra, 200) : undefined,
    ghiChu: l.ghiChu ? clampString(l.ghiChu, 1000) : undefined,
  });
}

export function sanitizeEmailLog(l: EmailLog): Record<string, unknown> {
  return stripUndefined({
    id: clampString(l.id, 80),
    timestamp: clampString(l.timestamp || '', 40),
    type: clampString(l.type || 'THU_NGHIEM', 40),
    recipient: clampString(l.recipient || '', 500),
    cc: l.cc ? clampString(l.cc, 500) : undefined,
    subject: clampString(l.subject || '', 500),
    bodySnippet: l.bodySnippet ? clampString(l.bodySnippet, 500) : undefined,
    fullContent: l.fullContent ? clampString(l.fullContent, 20000) : undefined,
    status: clampString(l.status || '', 60),
    relatedId: l.relatedId ? clampString(l.relatedId, 80) : undefined,
    errorMessage: l.errorMessage ? clampString(l.errorMessage, 1000) : undefined,
  });
}

export function sanitizeAuditLog(a: AuditLog): Record<string, unknown> {
  return stripUndefined({
    id: clampString(a.id, 80),
    thoiGian: clampString(a.thoiGian || '', 40),
    nguoiThaoTac: clampString(a.nguoiThaoTac || '', 160),
    hanhDong: clampString(a.hanhDong || '', 60),
    chucNang: clampString(a.chucNang || '', 120),
    doiTuong: clampString(a.doiTuong || '', 160),
    chiTietNoiDung: clampString(a.chiTietNoiDung || '', 2000),
  });
}

export function sanitizeDailyAreaCheck(c: DailyAreaCheck): Record<string, unknown> {
  const seenPhotoKeys = new Set<string>();
  let remainingPhotoBudget = 650000;

  const takePhotoWithinBudget = (raw?: string): string | undefined => {
    const candidate = clampDataUrl(raw);
    if (!candidate) return undefined;
    if (seenPhotoKeys.has(candidate)) {
      return candidate;
    }
    if (candidate.length <= remainingPhotoBudget) {
      seenPhotoKeys.add(candidate);
      remainingPhotoBudget -= candidate.length;
      return candidate;
    }
    return undefined;
  };

  const sanitizedDailyReports = Array.isArray(c.baoCaoTheoNgay)
    ? c.baoCaoTheoNgay.slice(0, 31).map((r) => {
        const rawCandidates: string[] = [];
        if (Array.isArray(r.anhDinhKem)) {
          rawCandidates.push(...r.anhDinhKem);
        }
        if (r.anhHienTruong) {
          rawCandidates.push(r.anhHienTruong);
        }
        const dayPhotos: string[] = [];
        for (const item of rawCandidates) {
          const accepted = takePhotoWithinBudget(item);
          if (accepted && !dayPhotos.includes(accepted)) {
            dayPhotos.push(accepted);
            if (dayPhotos.length >= 4) break;
          }
        }
        return stripUndefined({
          ngay: clampString(r.ngay || '', 32),
          trangThai: r.trangThai || 'Chờ kiểm tra',
          ketQua: r.ketQua || 'Chưa đánh giá',
          baoCaoThucTe: clampString(r.baoCaoThucTe || '', 4000),
          nguoiBaoCao: r.nguoiBaoCao ? clampString(r.nguoiBaoCao, 160) : undefined,
          thoiGianBaoCao: r.thoiGianBaoCao ? clampString(r.thoiGianBaoCao, 40) : undefined,
          anhHienTruong: dayPhotos[0],
          anhDinhKem: dayPhotos.length > 0 ? dayPhotos : undefined,
        });
      })
    : undefined;

  const topPhoto = takePhotoWithinBudget(c.anhHienTruong);

  const sanitizedWeekdays = Array.isArray(c.ngayTrongTuan)
    ? Array.from(
        new Set(
          c.ngayTrongTuan
            .map((n) => Number(n))
            .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
        )
      ).slice(0, 7)
    : undefined;

  return stripUndefined({
    id: clampString(c.id, 80),
    ngayKiemTra: clampString(c.ngayKiemTra || '', 32),
    ngayKetThuc: c.ngayKetThuc ? clampString(c.ngayKetThuc, 32) : undefined,
    ngayTrongTuan: sanitizedWeekdays && sanitizedWeekdays.length > 0 ? sanitizedWeekdays : undefined,
    caLamViec: c.caLamViec || 'Ca Sáng',
    khuVuc: c.khuVuc || 'Vòng trong',
    tieuDe: clampString((c.tieuDe || '').trim() || 'Kiểm tra khu vực', 300),
    moTaCongViec: clampString(c.moTaCongViec || '', 4000),
    nguoiDuocGiao: clampString(c.nguoiDuocGiao || '', 300),
    nguoiPhanQuyen: c.nguoiPhanQuyen ? clampString(c.nguoiPhanQuyen, 160) : undefined,
    hanHoanThanh: c.hanHoanThanh ? clampString(c.hanHoanThanh, 32) : undefined,
    trangThai: c.trangThai || 'Chờ kiểm tra',
    ketQua: c.ketQua || 'Chưa đánh giá',
    baoCaoThucTe: c.baoCaoThucTe ? clampString(c.baoCaoThucTe, 4000) : undefined,
    nguoiBaoCao: c.nguoiBaoCao ? clampString(c.nguoiBaoCao, 160) : undefined,
    thoiGianBaoCao: c.thoiGianBaoCao ? clampString(c.thoiGianBaoCao, 40) : undefined,
    anhHienTruong: topPhoto,
    baoCaoTheoNgay: sanitizedDailyReports,
  });
}

const IMMUTABLE_KEYS_BY_COL: Record<string, Set<string>> = {
  settings: new Set(['key']),
  equipment: new Set(['maThietBi']),
  maintenance_plans: new Set(['id']),
  maintenance_history: new Set(['id']),
  tickets: new Set(['maTicket', 'ngayTao', 'nguoiLap']),
  spare_parts: new Set(['maVatTu']),
  stock_transactions: new Set([
    'transId',
    'ngay',
    'loaiGD',
    'maVatTu',
    'soLuong',
    'nguoiThucHien',
    'thietBiSuDung',
  ]),
  power_10days: new Set(['id']),
  water_monthly: new Set(['month']),
  meter_readings: new Set(['id']),
  cost_records: new Set(['idChiPhi']),
  employees_public: new Set(['maNhanVien']),
  employees_private: new Set(['maNhanVien']),
  documents: new Set(['id', 'nguoiTao']),
  projects: new Set(['id']),
  safety_inspections: new Set(['id']),
  tools: new Set(['id']),
  tool_logs: new Set([
    'id',
    'maDungCu',
    'loaiGiaoDich',
    'soLuong',
    'nguoiMuon',
    'nguoiBanGiao',
    'ngayGiaoDich',
  ]),
  email_logs: new Set(['id', 'timestamp', 'type', 'relatedId']),
  audit_logs: new Set([
    'id',
    'thoiGian',
    'nguoiThaoTac',
    'hanhDong',
    'chucNang',
    'doiTuong',
    'chiTietNoiDung',
  ]),
  daily_area_checks: new Set(['id']),
  purchase_requests: new Set(['id', 'maPhieu', 'loaiYeuCau', 'nguoiYeuCau', 'ngayYeuCau']),
};

export function sanitizePurchaseRequest(p: PurchaseRequest): Record<string, unknown> {
  return stripUndefined({
    id: clampString(p.id, 80),
    maPhieu: clampString(p.maPhieu || p.id, 80),
    loaiYeuCau: p.loaiYeuCau === 'DUNG_CU' ? 'DUNG_CU' : 'VAT_TU',
    maMatHang: p.maMatHang ? clampString(p.maMatHang, 80) : undefined,
    tenMatHang: clampString(p.tenMatHang || '', 240),
    quyCachThongSo: p.quyCachThongSo ? clampString(p.quyCachThongSo, 1000) : undefined,
    danhMuc: p.danhMuc ? clampString(p.danhMuc, 160) : undefined,
    soLuong: Math.max(1, Number(p.soLuong) || 1),
    donViTinh: clampString((p.donViTinh || '').trim() || 'Cái', 40),
    donGiaDuKien:
      typeof p.donGiaDuKien === 'number' && !isNaN(p.donGiaDuKien)
        ? Math.max(0, p.donGiaDuKien)
        : undefined,
    nhaCungCapDeXuat: p.nhaCungCapDeXuat ? clampString(p.nhaCungCapDeXuat, 200) : undefined,
    lyDoYeuCau: clampString(p.lyDoYeuCau || '', 2000),
    mucDoUuTien: p.mucDoUuTien || 'Bình thường',
    ngayYeuCau: clampString(p.ngayYeuCau || '', 32),
    ngayCanHang: p.ngayCanHang ? clampString(p.ngayCanHang, 32) : undefined,
    nguoiYeuCau: clampString((p.nguoiYeuCau || '').trim() || 'Kỹ thuật viên', 160),
    boPhan: p.boPhan ? clampString(p.boPhan, 160) : undefined,
    maThietBiLienQuan: p.maThietBiLienQuan ? clampString(p.maThietBiLienQuan, 80) : undefined,
    trangThai: p.trangThai || 'Chờ duyệt',
    nguoiDuyet: p.nguoiDuyet ? clampString(p.nguoiDuyet, 160) : undefined,
    ngayDuyet: p.ngayDuyet ? clampString(p.ngayDuyet, 32) : undefined,
    ghiChuDuyet: p.ghiChuDuyet ? clampString(p.ghiChuDuyet, 1000) : undefined,
    ngayNhanHang: p.ngayNhanHang ? clampString(p.ngayNhanHang, 32) : undefined,
    nguoiNhanHang: p.nguoiNhanHang ? clampString(p.nguoiNhanHang, 160) : undefined,
    daNhapKho: typeof p.daNhapKho === 'boolean' ? p.daNhapKho : undefined,
    ghiChu: p.ghiChu ? clampString(p.ghiChu, 1500) : undefined,
  });
}

function buildUpdatePayload(
  colName: string,
  sanitizedData: Record<string, unknown>,
  allowedEmails: string[],
  includeAllowedEmails: boolean
): Record<string, unknown> {
  const immutableKeys = IMMUTABLE_KEYS_BY_COL[colName] || new Set<string>();
  const updatePayload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (includeAllowedEmails) {
    updatePayload.allowedEmails = allowedEmails;
  }
  for (const [k, v] of Object.entries(sanitizedData)) {
    if (!immutableKeys.has(k)) {
      updatePayload[k] = v;
    }
  }
  return updatePayload;
}

export async function upsertCloudDoc(
  colName: string,
  rawId: string,
  sanitizedData: Record<string, unknown>,
  uid: string,
  allowedEmails: string[],
  knownCloudIds?: Set<string>
): Promise<void> {
  const docId = toFirestoreDocId(rawId);
  const path = `${colName}/${docId}`;
  const docRef = doc(db, colName, docId);
  const existsLocally = knownCloudIds?.has(path);

  try {
    let existsOnServer = Boolean(existsLocally);
    if (!existsOnServer) {
      const snap = await getDoc(docRef);
      existsOnServer = snap.exists();
    }

    if (existsOnServer) {
      const isBootAdmin = (auth.currentUser?.email || '').toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
      const includeAllowed =
        (colName !== 'employees_private' && colName !== 'employees_public') || isBootAdmin;
      const updatePayload = buildUpdatePayload(colName, sanitizedData, allowedEmails, includeAllowed);
      await updateDoc(docRef, updatePayload);
      knownCloudIds?.add(path);
    } else {
      await setDoc(docRef, {
        ...sanitizedData,
        ownerUid: uid,
        allowedEmails,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      knownCloudIds?.add(path);
    }
  } catch (error) {
    handleFirestoreError(error, existsLocally ? OperationType.UPDATE : OperationType.WRITE, path);
  }
}

export async function deleteCloudDoc(
  colName: string,
  rawId: string,
  knownCloudIds?: Set<string>
): Promise<void> {
  const docId = toFirestoreDocId(rawId);
  const path = `${colName}/${docId}`;
  try {
    await deleteDoc(doc(db, colName, docId));
    knownCloudIds?.delete(path);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeCloudCollection<T>(
  colName: string,
  userEmail: string,
  uid: string,
  onData: (items: T[], docPaths: string[]) => void,
  onError: (err: Error) => void,
  mode: 'standard' | 'private_employee' | 'email_log' = 'standard'
): Unsubscribe {
  const normalizedEmail = userEmail.trim().toLowerCase();
  const isBootAdmin = normalizedEmail === BOOTSTRAPPED_ADMIN_EMAIL;

  let q;
  if (isBootAdmin) {
    q = collection(db, colName);
  } else if (mode === 'private_employee') {
    q = query(collection(db, colName), where('email', '==', normalizedEmail));
  } else if (mode === 'email_log') {
    q = query(collection(db, colName), where('ownerUid', '==', uid));
  } else {
    q = query(collection(db, colName), where('allowedEmails', 'array-contains', normalizedEmail));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const items: T[] = [];
      const paths: string[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const {
          ownerUid: _o,
          allowedEmails: _a,
          createdAt: _c,
          updatedAt: _u,
          ...clean
        } = data;
        items.push(clean as unknown as T);
        paths.push(`${colName}/${docSnap.id}`);
      });
      onData(items, paths);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colName);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export interface WorkspaceSnapshotData {
  equipment: Equipment[];
  maintenancePlans: MaintenancePlan[];
  maintenanceHistory: MaintenanceHistory[];
  tickets: Ticket[];
  spareParts: SparePart[];
  stockTransactions: StockTransaction[];
  power10Days: Power10Days[];
  waterMonthly: WaterMonthly[];
  meterReadings: MeterReading[];
  costRecords: CostRecord[];
  employees: Employee[];
  documents: FacilityDocument[];
  projects: FacilityProject[];
  safetyInspections: SafetyInspectionItem[];
  tools: ToolItem[];
  toolLogs: ToolBorrowLog[];
  dailyAreaChecks: DailyAreaCheck[];
  purchaseRequests?: PurchaseRequest[];
  emailLogs: EmailLog[];
  auditLogs: AuditLog[];
  emailConfig: EmailConfig;
  tariffConfig: EnergyTariffConfig;
  morningCheckTemplates?: MorningCheckTemplatesMap;
  monthlyBoardReports?: MonthlyBoardReportsStore;
}

export async function seedOrPushWorkspaceToFirestore(
  uid: string,
  userEmail: string,
  snapshotData: WorkspaceSnapshotData,
  options: { forcePushAll?: boolean; knownCloudIds?: Set<string> } = {}
): Promise<{ seeded: boolean; totalWritten: number }> {
  const allowedEmails = buildAllowedEmails(snapshotData.employees, userEmail);
  const metaRef = doc(db, 'settings', 'workspace_meta');

  let metaExists = false;
  try {
    const metaSnap = await getDoc(metaRef);
    metaExists = metaSnap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'settings/workspace_meta');
  }

  if (metaExists && !options.forcePushAll) {
    return { seeded: false, totalWritten: 0 };
  }

  const ops: { col: string; id: string; data: Record<string, unknown> }[] = [];

  for (const item of snapshotData.equipment) {
    ops.push({ col: 'equipment', id: item.maThietBi, data: sanitizeEquipment(item) });
  }
  for (const item of snapshotData.maintenancePlans) {
    ops.push({ col: 'maintenance_plans', id: item.id, data: sanitizeMaintenancePlan(item) });
  }
  for (const item of snapshotData.maintenanceHistory) {
    ops.push({ col: 'maintenance_history', id: item.id, data: sanitizeMaintenanceHistory(item) });
  }
  for (const item of snapshotData.tickets) {
    ops.push({ col: 'tickets', id: item.maTicket, data: sanitizeTicket(item) });
  }
  for (const item of snapshotData.spareParts) {
    ops.push({ col: 'spare_parts', id: item.maVatTu, data: sanitizeSparePart(item) });
  }
  for (const item of snapshotData.stockTransactions) {
    ops.push({ col: 'stock_transactions', id: item.transId, data: sanitizeStockTx(item) });
  }
  for (const item of snapshotData.power10Days) {
    ops.push({ col: 'power_10days', id: item.id, data: sanitizePower10Days(item) });
  }
  for (const item of snapshotData.waterMonthly) {
    ops.push({ col: 'water_monthly', id: item.month, data: sanitizeWaterMonthly(item) });
  }
  for (const item of snapshotData.meterReadings) {
    ops.push({ col: 'meter_readings', id: item.id, data: sanitizeMeterReading(item) });
  }
  for (const item of snapshotData.costRecords) {
    ops.push({ col: 'cost_records', id: item.idChiPhi, data: sanitizeCostRecord(item) });
  }
  for (const item of snapshotData.employees) {
    ops.push({ col: 'employees_public', id: item.maNhanVien, data: sanitizeEmployeePublic(item) });
    ops.push({ col: 'employees_private', id: item.maNhanVien, data: sanitizeEmployeePrivate(item) });
  }
  for (const item of snapshotData.documents) {
    ops.push({ col: 'documents', id: item.id, data: sanitizeDocument(item) });
  }
  for (const item of snapshotData.projects) {
    ops.push({ col: 'projects', id: item.id, data: sanitizeProject(item) });
  }
  for (const item of snapshotData.safetyInspections) {
    ops.push({ col: 'safety_inspections', id: item.id, data: sanitizeSafetyInspection(item) });
  }
  for (const item of snapshotData.tools) {
    ops.push({ col: 'tools', id: item.id, data: sanitizeToolItem(item) });
  }
  for (const item of snapshotData.toolLogs) {
    ops.push({ col: 'tool_logs', id: item.id, data: sanitizeToolLog(item) });
  }
  for (const item of snapshotData.dailyAreaChecks) {
    ops.push({ col: 'daily_area_checks', id: item.id, data: sanitizeDailyAreaCheck(item) });
  }
  for (const item of snapshotData.purchaseRequests || []) {
    ops.push({ col: 'purchase_requests', id: item.id, data: sanitizePurchaseRequest(item) });
  }
  for (const item of snapshotData.emailLogs) {
    ops.push({ col: 'email_logs', id: item.id, data: sanitizeEmailLog(item) });
  }
  for (const item of snapshotData.auditLogs) {
    ops.push({ col: 'audit_logs', id: item.id, data: sanitizeAuditLog(item) });
  }

  ops.push({
    col: 'settings',
    id: 'email_config',
    data: { key: 'email_config', payload: stripUndefined(snapshotData.emailConfig as unknown as Record<string, unknown>) },
  });
  ops.push({
    col: 'settings',
    id: 'tariff_config',
    data: { key: 'tariff_config', payload: stripUndefined(snapshotData.tariffConfig as unknown as Record<string, unknown>) },
  });
  if (snapshotData.morningCheckTemplates) {
    ops.push({
      col: 'settings',
      id: 'morning_check_templates',
      data: {
        key: 'morning_check_templates',
        payload: stripUndefined(snapshotData.morningCheckTemplates as unknown as Record<string, unknown>),
      },
    });
  }
  if (snapshotData.monthlyBoardReports) {
    ops.push({
      col: 'settings',
      id: 'monthly_board_reports',
      data: {
        key: 'monthly_board_reports',
        payload: stripUndefined(snapshotData.monthlyBoardReports as unknown as Record<string, unknown>),
      },
    });
  }
  ops.push({
    col: 'settings',
    id: 'workspace_meta',
    data: {
      key: 'workspace_meta',
      payload: {
        initializedBy: userEmail,
        initializedAt: new Date().toISOString(),
        schemaVersion: '1.1',
      },
    },
  });
  ops.push({
    col: 'settings',
    id: 'water_monthly_seed_meta',
    data: {
      key: 'water_monthly_seed_meta',
      payload: {
        seedVersion: WATER_MONTHLY_SEED_VERSION,
        count: snapshotData.waterMonthly.length,
        updatedBy: userEmail,
        updatedAtIso: new Date().toISOString(),
      },
    },
  });

  // Check existing IDs in Firestore when pushing onto an already-initialized workspace
  const existingPaths = new Set<string>(options.knownCloudIds || []);
  if (metaExists) {
    existingPaths.add('settings/workspace_meta');
    const uniqueCols = Array.from(new Set(ops.map((o) => o.col)));
    for (const colName of uniqueCols) {
      try {
        const snap = await getDocs(collection(db, colName));
        snap.forEach((d) => existingPaths.add(`${colName}/${d.id}`));
      } catch {
        // Fallback: proceed with knownCloudIds
      }
    }
  }

  const BATCH_SIZE = 400;
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const chunk = ops.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const op of chunk) {
      const docId = toFirestoreDocId(op.id);
      const path = `${op.col}/${docId}`;
      const ref = doc(db, op.col, docId);
      if (existingPaths.has(path)) {
        const updatePayload = buildUpdatePayload(op.col, op.data, allowedEmails, true);
        batch.update(ref, updatePayload);
      } else {
        batch.set(ref, {
          ...op.data,
          ownerUid: uid,
          allowedEmails,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        options.knownCloudIds?.add(path);
      }
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, chunk[0]?.col || 'batch');
    }
  }

  return { seeded: true, totalWritten: ops.length };
}

export const WATER_MONTHLY_SEED_VERSION = 'nuoc_month_2026_11_v1';

export async function syncWaterMonthlySeedToFirestoreIfNeeded(
  uid: string,
  userEmail: string,
  waterRecords: WaterMonthly[],
  employees: Employee[],
  knownCloudIds?: Set<string>
): Promise<boolean> {
  const metaDocId = 'water_monthly_seed_meta';
  const metaPath = `settings/${metaDocId}`;
  const metaRef = doc(db, 'settings', metaDocId);

  let metaExists = false;
  try {
    const metaSnap = await getDoc(metaRef);
    metaExists = metaSnap.exists();
    if (metaExists) {
      const data = metaSnap.data() as { payload?: { seedVersion?: string } } | undefined;
      if (data?.payload?.seedVersion === WATER_MONTHLY_SEED_VERSION) {
        return false;
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, metaPath);
  }

  const allowedEmails = buildAllowedEmails(employees, userEmail);
  const existingDocIds = new Set<string>();
  try {
    const snap = await getDocs(collection(db, 'water_monthly'));
    snap.forEach((d) => {
      existingDocIds.add(d.id);
      knownCloudIds?.add(`water_monthly/${d.id}`);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'water_monthly');
  }

  const batch = writeBatch(db);
  for (const item of waterRecords) {
    const docId = toFirestoreDocId(item.month);
    const sanitized = sanitizeWaterMonthly(item);
    const ref = doc(db, 'water_monthly', docId);
    if (existingDocIds.has(docId)) {
      batch.update(ref, buildUpdatePayload('water_monthly', sanitized, allowedEmails, true));
    } else {
      batch.set(ref, {
        ...sanitized,
        ownerUid: uid,
        allowedEmails,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      knownCloudIds?.add(`water_monthly/${docId}`);
    }
  }

  const metaData = {
    key: metaDocId,
    payload: {
      seedVersion: WATER_MONTHLY_SEED_VERSION,
      count: waterRecords.length,
      updatedBy: userEmail,
      updatedAtIso: new Date().toISOString(),
    },
  };
  if (metaExists) {
    batch.update(metaRef, buildUpdatePayload('settings', metaData, allowedEmails, true));
  } else {
    batch.set(metaRef, {
      ...metaData,
      ownerUid: uid,
      allowedEmails,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    knownCloudIds?.add(metaPath);
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'water_monthly');
  }

  return true;
}

export async function propagateAllowedEmails(allowedEmails: string[]): Promise<void> {
  const collections = [
    'settings',
    'equipment',
    'maintenance_plans',
    'maintenance_history',
    'tickets',
    'spare_parts',
    'stock_transactions',
    'power_10days',
    'water_monthly',
    'meter_readings',
    'cost_records',
    'employees_public',
    'employees_private',
    'documents',
    'projects',
    'safety_inspections',
    'tools',
    'tool_logs',
    'daily_area_checks',
    'purchase_requests',
    'email_logs',
    'audit_logs',
  ];

  const pendingRefs: ReturnType<typeof doc>[] = [];
  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      snap.forEach((docSnap) => {
        pendingRefs.push(docSnap.ref);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colName);
    }
  }

  const BATCH_SIZE = 400;
  for (let i = 0; i < pendingRefs.length; i += BATCH_SIZE) {
    const chunk = pendingRefs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const ref of chunk) {
      batch.update(ref, {
        allowedEmails,
        updatedAt: serverTimestamp(),
      });
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'allowedEmails_sync');
    }
  }
}

export async function syncAllowedEmailsIfNeeded(
  uid: string,
  userEmail: string,
  employees: Employee[],
  knownCloudIds?: Set<string>
): Promise<boolean> {
  const normalizedUserEmail = userEmail.trim().toLowerCase();
  if (normalizedUserEmail !== BOOTSTRAPPED_ADMIN_EMAIL) return false;

  const targetAllowed = buildAllowedEmails(employees, userEmail);
  const metaRef = doc(db, 'settings', 'workspace_meta');
  let currentAllowed: string[] = [];
  try {
    const snap = await getDoc(metaRef);
    if (!snap.exists()) return false;
    const data = snap.data() as { allowedEmails?: unknown } | undefined;
    if (Array.isArray(data?.allowedEmails)) {
      currentAllowed = data.allowedEmails.map((v) => String(v).trim().toLowerCase());
    }
  } catch {
    return false;
  }

  const currentSet = new Set(currentAllowed);
  const hasNewEmails = targetAllowed.some((email) => !currentSet.has(email));
  if (!hasNewEmails) return false;

  // Also ensure employee public/private docs exist & reflect current emails
  for (const emp of employees) {
    const mail = (emp.email || '').trim().toLowerCase();
    if (mail && isValidEmailFormat(mail) && !isPlaceholderEmail(mail)) {
      await upsertCloudDoc(
        'employees_public',
        emp.maNhanVien,
        sanitizeEmployeePublic(emp),
        uid,
        targetAllowed,
        knownCloudIds
      );
      await upsertCloudDoc(
        'employees_private',
        emp.maNhanVien,
        sanitizeEmployeePrivate(emp),
        uid,
        targetAllowed,
        knownCloudIds
      );
    }
  }

  await propagateAllowedEmails(targetAllowed);
  return true;
}
