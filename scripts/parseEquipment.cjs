const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/assets/aistudio/Qu_n_l__b_o_tr__1111_f617a209');
const content = fs.readFileSync(filePath, 'utf8');

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(cur.trim());
      cur = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      row.push(cur.trim());
      if (row.some(cell => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur.trim());
    if (row.some(cell => cell.length > 0)) rows.push(row);
  }
  return rows;
}

const parsed = parseCSV(content);
const header = parsed[0];
console.log('Header:', header);
console.log('Rows count:', parsed.length - 1);

const records = parsed.slice(1).map((r, idx) => {
  return {
    id: idx + 1,
    maThietBi: r[0] || `EQ-${idx+1}`,
    tenThietBi: r[1] || 'Thiết bị',
    thongSoKyThuat: r[2] || '',
    heThong: r[3] || 'Hệ Thống Phụ Trợ',
    viTri: r[4] || 'Nhà máy',
    mucDoRuiRo: r[5] || 'Medium',
    trangThai: r[6] || 'Hoạt động',
    tanSuat: r[7] || 'Monthly',
    nguoiPhuTrach: r[8] || 'Huỳnh Khiêm',
    email: r[9] || 'khiemhuynhggs@gmail.com',
    qrCode: r[10] || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(r[0] || '')}`,
    sourceRow: r[11] || '',
    hinhAnh: r[12] || ''
  };
});

fs.writeFileSync(
  path.join(__dirname, '../src/data/equipment_parsed.json'),
  JSON.stringify(records, null, 2),
  'utf8'
);

console.log('Saved', records.length, 'equipment records to src/data/equipment_parsed.json');
const imgCount = records.filter(r => r.hinhAnh && r.hinhAnh.startsWith('http')).length;
console.log('Records with real image URLs:', imgCount);
