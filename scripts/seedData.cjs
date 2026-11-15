const fs = require('fs');
const path = require('path');

const csvPath = path.resolve('public/assets/aistudio/Qu_n_l__b_o_tr__1111_44b50717.csv');
const raw = fs.readFileSync(csvPath, 'utf8');

function parseCSVLine(text) {
  const p = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      p.push(cur.trim().replace(/^"|"$/g, ''));
      cur = '';
    } else {
      cur += ch;
    }
  }
  p.push(cur.trim().replace(/^"|"$/g, ''));
  return p;
}

const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);

// Real Google Drive machinery photos
const realEquipmentPhotos = {
  'HVAC-CH-01': 'https://drive.google.com/thumbnail?id=1BClKVnAj1bd9yvWVJMuYSamLlPSCt-nj&sz=w1000',
  'HVAC-CH-02': 'https://drive.google.com/thumbnail?id=1LgEHWiRpQBJy7UZ41E1TtowYr-cGdiR7&sz=w1000',
  'HVAC-PAU-01': 'https://drive.google.com/thumbnail?id=1HqQykWFWyenc-K8QFbz808Wi1BhnHOnX&sz=w1000',
  'HVAC-PAU-02': 'https://drive.google.com/thumbnail?id=18JG7VAEceht7nGsXdvXJhKJzVloYZnFJ&sz=w1000',
  'HVAC-AHU-01': 'https://drive.google.com/thumbnail?id=1zXpWhHlX4rKdjIPSeUl7TQ9OE4pqHHwf&sz=w1000',
  'HVAC-AHU-02': 'https://drive.google.com/thumbnail?id=1wnltoRI9AbF88X7NOepsq-Dyle3aBhts&sz=w1000',
  'HVAC-AHU-03': 'https://drive.google.com/thumbnail?id=1fID3KITYvtfRNygk-eYl4nS_h8UVS4wG&sz=w1000',
  'HVAC-AHU-04': 'https://drive.google.com/thumbnail?id=1dQ9Ql71THummyn8xD8zgTX8Obw1ei5rG&sz=w1000',
  'HVAC-AHU-05': 'https://drive.google.com/thumbnail?id=18MtVUhQWpoPWwEdKWbox9aZoqC_Oefho&sz=w1000',
  'HVAC-AHU-06': 'https://drive.google.com/thumbnail?id=1FkM6YTXT5rYLEvFaQUZG0JP0euncpPsp&sz=w1000',
  'HVAC-WAH-01': 'https://drive.google.com/thumbnail?id=1UdJdffFsagM3ULIfKCl6BIGEWEDCCPZ7&sz=w1000',
  'HVAC-WAH-02': 'https://drive.google.com/thumbnail?id=1tw4hfRaWL_E4bcN6wRknk-YsLwRPVP36&sz=w1000',
  'HVAC-AHU-CT': 'https://drive.google.com/thumbnail?id=1JKINS3upC9A_Ai22f6TOaX0vvSbrtor8&sz=w1000',
  'HVAC-CLWP-01': 'https://drive.google.com/thumbnail?id=1dG8cTl71rql1og-awoHRahfd4akiCl_l&sz=w1000',
  'HVAC-CLWP-02': 'https://drive.google.com/thumbnail?id=1FGtQPa_-OpeImauPwnj9XHPHHoi1w9If&sz=w1000',
  'HVAC-CLWP-03': 'https://drive.google.com/thumbnail?id=1ClGiPKjDPHayW4t-W29BYVPRtXyQ4lfw&sz=w1000',
  'HVAC-CHWP-01': 'https://drive.google.com/thumbnail?id=11vGKRf1Ru7zy6ncCWLcDtJBFhOmHva0O&sz=w1000',
  'HVAC-CHWP-02': 'https://drive.google.com/thumbnail?id=1GrrP4Wcbi1qoPHKr05SlC6ENz8yLGtdD&sz=w1000',
  'HVAC-CHWP-03': 'https://drive.google.com/thumbnail?id=1vF9kgv2MQiSpMgfOpMg7K3xXJqycjrQN&sz=w1000',
  'CMP-GA90-01': 'https://drive.google.com/thumbnail?id=14-nlmxcsATcUYB1kCQW6ecpJw9guAyik&sz=w1000',
  'CMP-GA90-02': 'https://drive.google.com/thumbnail?id=1F6D-TYiTewws-oQ_v1t6-pJWpPHTPwr3&sz=w1000',
  'CMP-GA75-01': 'https://drive.google.com/thumbnail?id=17npHMfMCe4OaDO-S_tx43EsCDxZfz2ph&sz=w1000',
  'CMP-GA75-02': 'https://drive.google.com/thumbnail?id=1-zmxv-PoMikHoCoR7DG_da31tZH4cm2o&sz=w1000',
  'CMP-NPG-01': 'https://drive.google.com/thumbnail?id=1IJTeRLLn5XFVLb7jnZo22ZaA45Lli6WO&sz=w1000',
  'CMP-NPG-02': 'https://drive.google.com/thumbnail?id=1AhWm0FCLVVe7y6KqvZi2JIB-Ivv9Zv8g&sz=w1000',
  'CMP-AD300-01': 'https://drive.google.com/thumbnail?id=1Zlv5ktCSS_jc5r7mhgD_o5m5VEYyrJfn&sz=w1000',
  'CMP-AD300-02': 'https://drive.google.com/thumbnail?id=1-C7rhVXKBzh-Qd1reOBZd0NfcXAQr5AU&sz=w1000',
  'CMP-AIR-T': 'https://drive.google.com/thumbnail?id=1DMBFhg5gWPrABcoHOMpJF2XVP3hE_7zE&sz=w1000',
  'CMP-FD220-01': 'https://drive.google.com/thumbnail?id=1vZRXQk9EhcX5rqBE8ZsbXppdLoywwJt0&sz=w1000',
  'CMP-FD220-02': 'https://drive.google.com/thumbnail?id=1-DJ_JQZWTPu4Ni55pM-kPDvEwanDuI0X&sz=w1000',
  'CMP-VACUM': 'https://drive.google.com/thumbnail?id=1D_3t6QDnGZ-uUPF5elRZXr1TYdz5befr&sz=w1000',
  'FFA-FA': 'https://drive.google.com/thumbnail?id=1WMqj-YnjqklnhokI2Tsa2QGJozx_8Yqf&sz=w1000',
};

// Fallbacks for other equipment categories
const categoryFallbackImages = {
  'Hệ Thống Lạnh':
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  'Thông gió':
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  'Máy nén Khí và Nito - Vacuum':
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
  'Sản xuất nước DI- Drinking':
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
  'Nhà Xưởng':
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
};
const defaultFallback = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';

const equipmentList = [];
for (let i = 1; i < lines.length; i++) {
  const cols = parseCSVLine(lines[i]);
  if (cols.length < 5) continue;
  
  const code = cols[0];
  const sys = cols[2] || 'Hệ Thống Lạnh';
  
  // Prefer direct uploaded Google Drive photo if available
  const img = realEquipmentPhotos[code] || categoryFallbackImages[sys] || defaultFallback;

  equipmentList.push({
    maThietBi: code,
    tenThietBi: cols[1],
    heThong: sys,
    viTri: cols[3],
    mucDoRuiRo: cols[4] || 'Medium',
    trangThai: cols[5] || 'Hoạt động',
    tanSuat: cols[6] || 'Monthly',
    hanBaoTriTiepTheo: cols[7] || '2026-11-20',
    nguoiPhuTrach: cols[8] || 'Huỳnh Khiêm',
    email: cols[9] || 'khiemhuynhggs@gmail.com',
    thongSoKyThuat: cols[10] || '',
    hinhAnh: img,
    qrCode: `CMMS://${code}`,
    ngayLapDat: '2023-01-15'
  });
}

// Generate maintenance plans
const maintenancePlans = equipmentList.map((eq, idx) => {
  const next = new Date(eq.hanBaoTriTiepTheo);
  const last = new Date(next);
  if (eq.tanSuat === 'Daily') last.setDate(last.getDate() - 1);
  else if (eq.tanSuat === 'Weekly') last.setDate(last.getDate() - 7);
  else if (eq.tanSuat === 'Quarterly') last.setMonth(last.getMonth() - 3);
  else if (eq.tanSuat === 'Yearly') last.setFullYear(last.getFullYear() - 1);
  else last.setMonth(last.getMonth() - 1);

  const lastStr = last.toISOString().split('T')[0];
  
  let status = 'Đúng hạn';
  const diff = (next.getTime() - new Date('2026-11-10').getTime()) / (1000 * 3600 * 24);
  if (diff < 0) status = 'Quá hạn';
  else if (diff === 0) status = 'Tới hạn';
  else if (diff <= 7) status = 'Sắp tới';

  return {
    id: `PLAN-${String(idx + 1).padStart(3, '0')}`,
    maThietBi: eq.maThietBi,
    tenThietBi: eq.tenThietBi,
    loaiBaoTri: 'Định kỳ',
    tanSuat: eq.tanSuat,
    ngayBaoTriGanNhat: lastStr,
    ngayBaoTriTiepTheo: eq.hanBaoTriTiepTheo,
    nguoiPhuTrach: eq.nguoiPhuTrach,
    trangThai: status,
    ghiChu: `Kiểm tra định kỳ tiêu chuẩn theo hướng dẫn vận hành O&M cho ${eq.tenThietBi}`
  };
});

// Seed Maintenance History (Sheet 3)
const maintenanceHistory = [
  {
    id: 'HIST-2026-001',
    maThietBi: 'HVAC-CH-01',
    tenThietBi: 'Chiller 01',
    ngayThucHien: '2026-11-04',
    nguoiThucHien: 'Huỳnh Khiêm',
    moTaCongViec: 'Bảo dưỡng định kỳ tháng 11: Vệ sinh giàn ngưng ống đồng, kiểm tra rò rỉ gas R134a, đo dòng động cơ nén đạt 280A (chuẩn). Thay dầu bôi trơn máy nén lạnh York.',
    thoiGianDungMay: 180,
    ketQua: 'Đạt',
    hinhAnh: 'https://drive.google.com/thumbnail?id=1BClKVnAj1bd9yvWVJMuYSamLlPSCt-nj&sz=w1000',
    nguoiLapBaoCao: 'Huỳnh Khiêm',
    chiPhiUocTinh: 4500000
  },
  {
    id: 'HIST-2026-002',
    maThietBi: 'CMP-GA90-01',
    tenThietBi: 'Máy nén khí GA90-1',
    ngayThucHien: '2026-10-10',
    nguoiThucHien: 'Nguyễn Văn Hùng',
    moTaCongViec: 'Bảo dưỡng mốc 4000 giờ: Thay lọc gió C25860, lọc dầu 1622314200, thay dầu máy nén khí Roto-Inject Fluid 40L, cân chỉnh độ căng dây đai và kiểm tra van hút.',
    thoiGianDungMay: 240,
    ketQua: 'Đạt',
    hinhAnh: 'https://drive.google.com/thumbnail?id=14-nlmxcsATcUYB1kCQW6ecpJw9guAyik&sz=w1000',
    nguoiLapBaoCao: 'Nguyễn Văn Hùng',
    chiPhiUocTinh: 14200000
  },
  {
    id: 'HIST-2026-003',
    maThietBi: 'HVAC-PAU-01',
    tenThietBi: 'PAU 01',
    ngayThucHien: '2026-11-08',
    nguoiThucHien: 'Trần Minh Tuấn',
    moTaCongViec: 'Vệ sinh lưới lọc sơ cấp G4 và túi lọc F8, tra mỡ bạc đạn quạt ly tâm, đo dòng motor đạt 34A chuẩn.',
    thoiGianDungMay: 90,
    ketQua: 'Đạt',
    hinhAnh: 'https://drive.google.com/thumbnail?id=1HqQykWFWyenc-K8QFbz808Wi1BhnHOnX&sz=w1000',
    nguoiLapBaoCao: 'Trần Minh Tuấn',
    chiPhiUocTinh: 1500000
  },
  {
    id: 'HIST-2026-004',
    maThietBi: 'FFA-FA',
    tenThietBi: 'Hệ thống báo cháy',
    ngayThucHien: '2026-11-02',
    nguoiThucHien: 'Huỳnh Khiêm',
    moTaCongViec: 'Kiểm tra 6 loop tủ FireNetLatitude Hochiki, test còi báo khẩn cấp, đo điện áp ắc quy dự phòng đạt 27.4VDC.',
    thoiGianDungMay: 0,
    ketQua: 'Đạt',
    hinhAnh: 'https://drive.google.com/thumbnail?id=1WMqj-YnjqklnhokI2Tsa2QGJozx_8Yqf&sz=w1000',
    nguoiLapBaoCao: 'Huỳnh Khiêm',
    chiPhiUocTinh: 800000
  }
];

// Seed Tickets (Sheet 4)
const tickets = [
  {
    maTicket: 'TK-2026-1101',
    tieuDe: 'Máy nén khí GA90-2 rung giật và báo nhiệt độ đầu nén cao > 105°C',
    trangThai: 'Đang xử lý',
    ngayTao: '2026-10-28',
    moTaChiTiet: 'Máy nén khí số 2 phát tiếng ồn lạ tại cụm nén trục vít, nhiệt độ dầu lên 108°C gây ngắt an toàn. Cần kiểm tra van điều nhiệt và két làm mát dầu.',
    nguoiPhuTrach: 'Huỳnh Khiêm',
    ngayHoanThanh: '',
    ketQua: 'Đang tháo kiểm tra van hằng nhiệt và súc rửa két dầu giải nhiệt.',
    nguoiLap: 'Nguyễn Văn Hùng (SX)',
    mucDoUuTien: 'Khẩn cấp',
    anhTruocXuLy: 'https://drive.google.com/thumbnail?id=1F6D-TYiTewws-oQ_v1t6-pJWpPHTPwr3&sz=w1000',
    anhSauXuLy: '',
    maThietBi: 'CMP-GA90-02'
  },
  {
    maTicket: 'TK-2026-1102',
    tieuDe: 'Rò rỉ nước tại mặt bích bơm nước giải nhiệt CLWP-01',
    trangThai: 'Mới tiếp nhận',
    ngayTao: '2026-11-09',
    moTaChiTiet: 'Bộ phận vận hành phát hiện rỉ nước tại gioăng làm kín mặt bích DN150 đường hút bơm giải nhiệt số 1, ước tính rỉ 5 giọt/phút.',
    nguoiPhuTrach: 'Trần Minh Tuấn',
    ngayHoanThanh: '',
    ketQua: '',
    nguoiLap: 'Phạm Đức Cường',
    mucDoUuTien: 'Cao',
    anhTruocXuLy: 'https://drive.google.com/thumbnail?id=1dG8cTl71rql1og-awoHRahfd4akiCl_l&sz=w1000',
    anhSauXuLy: '',
    maThietBi: 'HVAC-CLWP-01'
  }
];

// Seed Spare Parts (Sheet 5)
const spareParts = [
  {
    maVatTu: 'SP-OIL-GA90',
    tenVatTu: 'Dầu máy nén khí Atlas Copco Roto Inject Fluid',
    thongSo: 'Can 20L | Dầu gốc tổng hợp chuyên dụng cho GA series',
    maThietBi: 'CMP-GA90-01',
    tenThietBiSuDung: 'Máy nén khí GA90-1 & GA90-2',
    tonToiThieu: 4,
    tonThucTe: 2,
    donViTinh: 'Can 20L',
    viTriLuu: 'Kệ A1 - Kho Dầu Utility',
    ghiChu: 'Cần đặt mua thêm 6 can phục vụ đại tu mốc 8000h',
    donGia: 3850000
  },
  {
    maVatTu: 'SP-FILT-AIR-GA90',
    tenVatTu: 'Lọc gió máy nén khí Atlas Copco',
    thongSo: 'Part No: 1622185501 | Cấp lọc 99.9% hạt bụi 3 micron',
    maThietBi: 'CMP-GA90-01',
    tenThietBiSuDung: 'Máy nén khí GA90-1 & GA90-2',
    tonToiThieu: 4,
    tonThucTe: 6,
    donViTinh: 'Cái',
    viTriLuu: 'Kệ B2 - Kho Phụ Tùng',
    ghiChu: 'Chính hãng Atlas Copco',
    donGia: 2450000
  },
  {
    maVatTu: 'SP-OIL-CHILLER',
    tenVatTu: 'Dầu máy nén Chiller York K Oil',
    thongSo: 'York Oil K Part 011-00533-000 | Can 5 Gallon (18.9L)',
    maThietBi: 'HVAC-CH-01',
    tenThietBiSuDung: 'Chiller 01 & Chiller 02',
    tonToiThieu: 2,
    tonThucTe: 3,
    donViTinh: 'Can',
    viTriLuu: 'Kệ A2 - Kho Dầu Lạnh',
    ghiChu: 'Dùng riêng cho Chiller ly tâm York YK',
    donGia: 7600000
  }
];

// Seed Stock Transactions (Sheet 6)
const stockTransactions = [
  {
    transId: 'TR-2026-1001',
    ngay: '2026-10-10',
    loaiGD: 'Xuất kho sử dụng',
    maVatTu: 'SP-OIL-GA90',
    thietBiSuDung: 'CMP-GA90-01',
    soLuong: 2,
    nguoiThucHien: 'Nguyễn Văn Hùng',
    ghiChu: 'Xuất thay dầu máy nén khí GA90-1 đợt bảo dưỡng 4000h',
    donGiaSnapshot: 3850000
  },
  {
    transId: 'TR-2026-11-04',
    ngay: '2026-11-04',
    loaiGD: 'Xuất kho sử dụng',
    maVatTu: 'SP-OIL-CHILLER',
    thietBiSuDung: 'HVAC-CH-01',
    soLuong: 1,
    nguoiThucHien: 'Huỳnh Khiêm',
    ghiChu: 'Châm thêm dầu bôi trơn Chiller 01',
    donGiaSnapshot: 7600000
  }
];

// Seed Power 10 Days (Sheet 7)
const power10Days = [
  {
    id: 'POW-2026-11-1',
    thoiGianLuu: '2026-11-10 18:00',
    chuKy: 'Chu kỳ 1 (01-10/11/2026)',
    tuNgay: '2026-11-01',
    denNgay: '2026-11-10',
    ngayLamViec: 10,
    loaiCa: '3 Ca liên tục',
    tbNgayKwh: 18620,
    evnBT: 83900,
    evnCD: 43200,
    evnTD: 31800,
    solarBT: 19100,
    solarCD: 8200,
    pLighting: 9350,
    pAcmv: 25100,
    pEquipment: 46200,
    uChiller: 49800,
    uMChiller: 6300,
    uComp: 22800,
    uPump: 11400,
    uCooling: 9100,
    uOther: 2850,
    oAcmv: 1870,
    oSocket: 1220,
    oKit: 860,
    oServer: 3600,
    oLighting: 760,
    nguoiChot: 'Huỳnh Khiêm'
  }
];

// Seed Cost Records (Sheet 8)
const costRecords = [
  {
    idChiPhi: 'CP-2026-11-01',
    ngayGhiNhan: '2026-11-02',
    phanLoai: 'Sửa chữa đột xuất',
    thamChieu: 'TK-2026-1101',
    soTienVND: 8600000,
    nhaCungCap: 'Dịch Vụ Cơ Điện Lạnh Nam Phát',
    trangThai: 'Chờ duyệt',
    ghiChu: 'Chi phí gia công két dầu và thay van nhiệt máy nén khí GA90-2'
  },
  {
    idChiPhi: 'CP-2026-11-02',
    ngayGhiNhan: '2026-11-04',
    phanLoai: 'Bảo trì định kỳ',
    thamChieu: 'HVAC-CH-01',
    soTienVND: 4500000,
    nhaCungCap: 'Johnson Controls - York Service',
    trangThai: 'Đã duyệt',
    ghiChu: 'Vệ sinh giàn ngưng và thay dầu máy nén York K Oil'
  }
];

// Seed Water Monthly (Sheet 9)
const waterMonthly = [
  {
    month: '2026-10',
    waterM3: 4620,
    waterVND: 66990000,
    waterUSD: 2679.6,
    sewageVND: 34500000,
    sewageUSD: 1380.0
  }
];

// Seed Employees (Sheet 10)
const employees = [
  {
    maNhanVien: 'NV-ENG-001',
    tenNhanVien: 'Huỳnh Khiêm',
    date: '2026-11-10',
    chucVu: 'Trưởng phòng Kỹ thuật',
    ngayVao: '2020-03-15',
    soDienThoai: '0908 123 456',
    email: 'khiemhuynhggs@gmail.com',
    anhDaiDien: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  },
  {
    maNhanVien: 'NV-ENG-002',
    tenNhanVien: 'Nguyễn Văn Hùng',
    date: '2026-11-10',
    chucVu: 'Kỹ thuật viên',
    ngayVao: '2021-06-01',
    soDienThoai: '0912 345 678',
    email: 'hung.nguyen@factory.com',
    anhDaiDien: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  },
  {
    maNhanVien: 'NV-ENG-003',
    tenNhanVien: 'Trần Minh Tuấn',
    date: '2026-11-10',
    chucVu: 'Kỹ thuật viên',
    ngayVao: '2022-01-10',
    soDienThoai: '0988 765 432',
    email: 'tuan.tran@factory.com',
    anhDaiDien: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
  }
];

// Seed Meter Readings (Sheet 11) - Note: ngayChot is required on all
const meterReadings = [
  {
    id: 'MET-001',
    timestamp: '2026-11-10 07:30',
    ngayChot: '2026-11-10',
    nguon: 'EVN',
    tenDongHo: 'Đồng hồ Trạm Trung thế 1 (ELC-MV-01)',
    chiSoCu: 142350,
    chiSoMoi: 145120,
    tieuThu: 2770,
    donVi: 'kWh',
    nguoiGhi: 'Phạm Đức Cường'
  },
  {
    id: 'MET-002',
    timestamp: '2026-11-10 07:35',
    ngayChot: '2026-11-10',
    nguon: 'EVN',
    tenDongHo: 'Đồng hồ Trạm Trung thế 2 (ELC-MV-02)',
    chiSoCu: 138900,
    chiSoMoi: 141540,
    tieuThu: 2640,
    donVi: 'kWh',
    nguoiGhi: 'Phạm Đức Cường'
  },
  {
    id: 'MET-003',
    timestamp: '2026-11-10 07:40',
    ngayChot: '2026-11-10',
    nguon: 'Solar',
    tenDongHo: 'Tổng phát Solar Rooftop Inverter 500kWp',
    chiSoCu: 88400,
    chiSoMoi: 90250,
    tieuThu: 1850,
    donVi: 'kWh',
    nguoiGhi: 'Phạm Đức Cường'
  },
  {
    id: 'MET-004',
    timestamp: '2026-11-10 07:45',
    ngayChot: '2026-11-10',
    nguon: 'Nước Máy',
    tenDongHo: 'Đồng hồ nước đầu nguồn tổng Sawaco',
    chiSoCu: 24820,
    chiSoMoi: 24965,
    tieuThu: 145,
    donVi: 'm³',
    nguoiGhi: 'Phạm Đức Cường'
  },
  {
    id: 'MET-005',
    timestamp: '2026-11-10 07:50',
    ngayChot: '2026-11-10',
    nguon: 'Khí Nén',
    tenDongHo: 'Lưu lượng kế tổng khí nén trạm GA90',
    chiSoCu: 785400,
    chiSoMoi: 791200,
    tieuThu: 5800,
    donVi: 'Nm³',
    nguoiGhi: 'Nguyễn Văn Hùng'
  }
];

// Seed Audit Logs (Sheet 12)
const auditLogs = [
  {
    id: 'LOG-001',
    thoiGian: '2026-11-10 07:30:15',
    nguoiThaoTac: 'Phạm Đức Cường',
    hanhDong: 'Chốt số',
    chucNang: 'Chốt chỉ số Điện - Nước',
    doiTuong: 'Đồng hồ ELC-MV-01',
    chiTietNoiDung: 'Ghi nhận chỉ số mới 145120 kWh, tiêu thụ 2770 kWh ca đêm'
  },
  {
    id: 'LOG-002',
    thoiGian: '2026-11-09 16:45:22',
    nguoiThaoTac: 'Trần Minh Tuấn',
    hanhDong: 'Hoàn thành',
    chucNang: 'Lịch sử bảo trì',
    doiTuong: 'WAT-WW',
    chiTietNoiDung: 'Hoàn tất bảo dưỡng hệ thống xử lý nước thải, kiểm tra DO bể hiếu khí'
  },
  {
    id: 'LOG-003',
    thoiGian: '2026-11-04 15:30:00',
    nguoiThaoTac: 'Huỳnh Khiêm',
    hanhDong: 'Xuất kho',
    chucNang: 'Kho xuất nhập vật tư',
    doiTuong: 'SP-OIL-CHILLER',
    chiTietNoiDung: 'Xuất 1 Can dầu York K Oil bảo dưỡng Chiller 01'
  }
];

const tsOutput = `import {
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

export const INITIAL_MAINTENANCE_HISTORY: MaintenanceHistory[] = ${JSON.stringify(maintenanceHistory, null, 2)};

export const INITIAL_TICKETS: Ticket[] = ${JSON.stringify(tickets, null, 2)};

export const INITIAL_SPARE_PARTS: SparePart[] = ${JSON.stringify(spareParts, null, 2)};

export const INITIAL_STOCK_TRANSACTIONS: StockTransaction[] = ${JSON.stringify(stockTransactions, null, 2)};

export const INITIAL_POWER_10DAYS: Power10Days[] = ${JSON.stringify(power10Days, null, 2)};

export const INITIAL_COST_RECORDS: CostRecord[] = ${JSON.stringify(costRecords, null, 2)};

export const INITIAL_WATER_MONTHLY: WaterMonthly[] = ${JSON.stringify(waterMonthly, null, 2)};

export const INITIAL_EMPLOYEES: Employee[] = ${JSON.stringify(employees, null, 2)};

export const INITIAL_METER_READINGS: MeterReading[] = ${JSON.stringify(meterReadings, null, 2)};

export const INITIAL_AUDIT_LOGS: AuditLog[] = ${JSON.stringify(auditLogs, null, 2)};
`;

fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/initialData.ts', tsOutput, 'utf8');
console.log('Successfully wrote src/data/initialData.ts with real Google Drive photos for machinery!');
