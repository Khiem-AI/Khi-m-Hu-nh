const fs = require('fs');
const path = require('path');

const parsedEquipment = require('../src/data/equipment_parsed.json');

// Category fallback images for machinery without direct photos
const categoryFallbackImages = {
  'Hệ Thống Lạnh':
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  'Thông gió':
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  'Máy nén Khí và Nito - Vacuum':
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
  'Sản xuât nước DI- Drinking':
    'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?auto=format&fit=crop&w=800&q=80',
  'Xử lý nước thải':
    'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
  'Hệ thống điện':
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
  'Hệ thống báo cháy, chữa cháy':
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
  'Hệ thống cấp thoát nước':
    'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80',
  'Hệ thống an ninh - PA':
    'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
  'Thiết bị bếp - Nội thất':
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
  'Nhà Xưởng':
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
  'Hệ Thống Phụ Trợ':
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
};

const defaultFallback = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';

// Map equipment into clean Equipment objects
const equipmentList = parsedEquipment.map((eq, i) => {
  const tanSuat = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'].includes(eq.tanSuat)
    ? eq.tanSuat
    : 'Monthly';

  let hanBaoTri = '2026-11-20';
  if (i % 7 === 0) hanBaoTri = '2026-11-05'; // Quá hạn
  else if (i % 5 === 0) hanBaoTri = '2026-11-12'; // Tới hạn
  else if (i % 3 === 0) hanBaoTri = '2026-11-18'; // Sắp tới
  else hanBaoTri = `2026-12-0${(i % 8) + 1}`; // Đúng hạn

  const risk = ['High', 'Medium', 'Low'].includes(eq.mucDoRuiRo) ? eq.mucDoRuiRo : 'Medium';
  const status = ['Hoạt động', 'Đang sửa chữa', 'Bảo trì', 'Tạm dừng'].includes(eq.trangThai)
    ? eq.trangThai
    : 'Hoạt động';

  const finalImg = eq.hinhAnh && eq.hinhAnh.startsWith('http')
    ? eq.hinhAnh
    : (categoryFallbackImages[eq.heThong] || defaultFallback);

  return {
    maThietBi: eq.maThietBi,
    tenThietBi: eq.tenThietBi,
    heThong: eq.heThong || 'Hệ Thống Lạnh',
    viTri: eq.viTri || 'Utility House',
    mucDoRuiRo: risk,
    trangThai: status,
    tanSuat: tanSuat,
    hanBaoTriTiepTheo: hanBaoTri,
    nguoiPhuTrach: eq.nguoiPhuTrach || 'Huỳnh Khiêm',
    email: eq.email || 'khiemhuynhggs@gmail.com',
    thongSoKyThuat: eq.thongSoKyThuat || '',
    hinhAnh: finalImg,
    qrCode: `CMMS://${eq.maThietBi}`,
    ngayLapDat: '2023-01-15',
  };
});

// Generate Maintenance Plans for all equipment
const maintenancePlans = equipmentList.map((eq, idx) => {
  let trangThai = 'Đúng hạn';
  const dueDate = eq.hanBaoTriTiepTheo;
  if (dueDate <= '2026-11-08') trangThai = 'Quá hạn';
  else if (dueDate <= '2026-11-12') trangThai = 'Tới hạn';
  else if (dueDate <= '2026-11-18') trangThai = 'Sắp tới';

  return {
    id: `PLAN-${String(idx + 1).padStart(3, '0')}`,
    maThietBi: eq.maThietBi,
    tenThietBi: eq.tenThietBi,
    loaiBaoTri: 'Định kỳ',
    tanSuat: eq.tanSuat,
    ngayBaoTriGanNhat: '2026-10-15',
    ngayBaoTriTiepTheo: eq.hanBaoTriTiepTheo,
    nguoiPhuTrach: eq.nguoiPhuTrach,
    trangThai: trangThai,
    ghiChu: `Kiểm tra định kỳ ${eq.heThong} theo tiêu chuẩn vận hành O&M`,
  };
});

// Read existing initialData.ts to preserve tickets, costs, power, employees, logs
const oldInitialDataPath = path.join(__dirname, '../src/data/initialData.ts');
const oldContent = fs.readFileSync(oldInitialDataPath, 'utf8');

// Find where INITIAL_MAINTENANCE_HISTORY starts
const historyMarker = 'export const INITIAL_MAINTENANCE_HISTORY: MaintenanceHistory[] = [';
const historyIndex = oldContent.indexOf(historyMarker);
if (historyIndex === -1) {
  throw new Error('Could not find INITIAL_MAINTENANCE_HISTORY marker');
}

const restOfFile = oldContent.slice(historyIndex);

// Compose new content
const newContent = `import {
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
  AuditLog
} from '../types/cmms';

export const INITIAL_EQUIPMENT: Equipment[] = ${JSON.stringify(equipmentList, null, 2)};

export const INITIAL_MAINTENANCE_PLANS: MaintenancePlan[] = ${JSON.stringify(maintenancePlans, null, 2)};

${restOfFile}`;

fs.writeFileSync(oldInitialDataPath, newContent, 'utf8');
console.log('Successfully updated src/data/initialData.ts with', equipmentList.length, 'equipment and', maintenancePlans.length, 'maintenance plans.');
