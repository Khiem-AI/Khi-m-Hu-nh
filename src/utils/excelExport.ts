import * as XLSX from 'xlsx';
import { Equipment, FacilityProject, MaintenanceHistory, MaintenancePlan, Ticket } from '../types/cmms';
import { calculateProjectProgress, formatDateVN, getHistoryWorkType } from './cmmsLogic';

export interface ExcelExportMeta {
  exportedBy?: string;
  includePrintLayout?: boolean;
  filterNote?: string;
}

type CellValue = string | number | boolean | null | undefined;

function getNowFormatted(): { fileDate: string; displayDateTime: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return {
    fileDate: `${y}-${m}-${d}`,
    displayDateTime: `${d}/${m}/${y} ${hh}:${mm}`,
  };
}

function buildEquipmentMap(equipment: Equipment[]): Map<string, Equipment> {
  const map = new Map<string, Equipment>();
  equipment.forEach((eq) => {
    map.set(eq.maThietBi, eq);
  });
  return map;
}

function computeColWidths(
  rows: CellValue[][],
  headerRowIndex: number,
  maxWidth = 44
): XLSX.ColInfo[] {
  if (rows.length === 0) return [];
  const colCount = rows[headerRowIndex]?.length || Math.max(...rows.map((r) => r.length));
  const widths: number[] = Array(colCount).fill(10);

  rows.forEach((row, rIdx) => {
    if (rIdx < headerRowIndex) return; // Do not let merged banner rows skew column widths
    for (let c = 0; c < colCount; c++) {
      const val = row[c];
      if (val === null || val === undefined) continue;
      const str = String(val);
      const longestLine = str
        .split('\n')
        .reduce((max, line) => Math.max(max, line.length), 0);
      const target = Math.min(maxWidth, Math.max(8, longestLine + 3));
      if (target > widths[c]) {
        widths[c] = target;
      }
    }
  });

  return widths.map((wch) => ({ wch }));
}

function buildStyledSheet(params: {
  title: string;
  headers: string[];
  dataRows: CellValue[][];
  summaryRow?: CellValue[];
  exportedBy?: string;
  includePrintLayout?: boolean;
  filterNote?: string;
}): XLSX.WorkSheet {
  const {
    title,
    headers,
    dataRows,
    summaryRow,
    exportedBy = 'Hệ thống',
    includePrintLayout = true,
    filterNote,
  } = params;

  const { displayDateTime } = getNowFormatted();
  const colCount = headers.length;
  const aoa: CellValue[][] = [];
  const merges: XLSX.Range[] = [];
  let headerRowIdx = 0;

  if (includePrintLayout) {
    aoa.push([`FACILITY SYSTEM MANAGEMENT — ${title.toUpperCase()}`]);
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, colCount - 1) } });

    aoa.push([
      `Bộ phận: Kỹ thuật - Bảo trì | Người xuất: ${exportedBy} | Ngày xuất: ${displayDateTime}`,
    ]);
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(0, colCount - 1) } });

    aoa.push([
      `Tổng số bản ghi: ${dataRows.length}${filterNote ? ` | Bộ lọc: ${filterNote}` : ''}`,
    ]);
    merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: Math.max(0, colCount - 1) } });

    aoa.push([]); // Spacer row 4
    headerRowIdx = 4;
  }

  aoa.push(headers);
  dataRows.forEach((row) => aoa.push(row));

  if (summaryRow && summaryRow.length > 0) {
    aoa.push(summaryRow);
  }

  if (includePrintLayout) {
    aoa.push([]);
    const sigRowIdx = aoa.length;
    const midCol = Math.max(1, Math.floor(colCount / 2));
    const rightCol = Math.max(2, colCount - 2);
    const sigRow: CellValue[] = Array(colCount).fill('');
    sigRow[0] = 'NGƯỜI LẬP BIỂU';
    if (midCol < colCount) sigRow[midCol] = 'KỸ SƯ PHỤ TRÁCH';
    if (rightCol < colCount && rightCol !== midCol) sigRow[rightCol] = 'TRƯỞNG BỘ PHẬN DUYỆT';
    aoa.push(sigRow);

    const signHintRow: CellValue[] = Array(colCount).fill('');
    signHintRow[0] = '(Ký, ghi rõ họ tên)';
    if (midCol < colCount) signHintRow[midCol] = '(Ký, ghi rõ họ tên)';
    if (rightCol < colCount && rightCol !== midCol) signHintRow[rightCol] = '(Ký, ghi rõ họ tên)';
    aoa.push(signHintRow);

    // Ensure row height metadata for title & signature blocks
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = merges;
    ws['!cols'] = computeColWidths(aoa, headerRowIdx);
    const rowsMeta: XLSX.RowInfo[] = [];
    rowsMeta[0] = { hpt: 26 };
    rowsMeta[1] = { hpt: 18 };
    rowsMeta[2] = { hpt: 18 };
    rowsMeta[headerRowIdx] = { hpt: 24 };
    rowsMeta[sigRowIdx] = { hpt: 20 };
    ws['!rows'] = rowsMeta;
    ws['!margins'] = { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.25, footer: 0.25 };
    return ws;
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = computeColWidths(aoa, 0);
  ws['!rows'] = [{ hpt: 24 }];
  ws['!margins'] = { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.25, footer: 0.25 };
  return ws;
}

function buildHistorySheet(
  history: MaintenanceHistory[],
  equipmentMap: Map<string, Equipment>,
  meta: ExcelExportMeta
): XLSX.WorkSheet {
  const headers = [
    'STT',
    'Mã Biên Bản',
    'Loại Công Việc',
    'Mã Thiết Bị',
    'Tên Thiết Bị',
    'Hệ Thống',
    'Vị Trí',
    'Ngày Thực Hiện',
    'Người Thực Hiện',
    'Người Giao Việc',
    'Mô Tả Công Việc',
    'Dừng Máy (Phút)',
    'Kết Quả',
    'Chi Phí Ước Tính (VNĐ)',
    'Người Lập Báo Cáo',
  ];

  let totalDowntime = 0;
  let totalCost = 0;

  const dataRows: CellValue[][] = history.map((h, idx) => {
    const eq = equipmentMap.get(h.maThietBi);
    const downtime = Number(h.thoiGianDungMay) || 0;
    const cost = Number(h.chiPhiUocTinh) || 0;
    totalDowntime += downtime;
    totalCost += cost;

    return [
      idx + 1,
      h.id,
      getHistoryWorkType(h),
      h.maThietBi,
      h.tenThietBi,
      eq?.heThong || '',
      eq?.viTri || '',
      formatDateVN(h.ngayThucHien),
      h.nguoiThucHien,
      h.nguoiGiaoViec || '',
      h.moTaCongViec,
      downtime,
      h.ketQua,
      cost,
      h.nguoiLapBaoCao,
    ];
  });

  const summaryRow: CellValue[] = [
    '',
    'TỔNG CỘNG',
    '',
    '',
    `${history.length} biên bản`,
    '',
    '',
    '',
    '',
    '',
    '',
    totalDowntime,
    '',
    totalCost,
    '',
  ];

  return buildStyledSheet({
    title: 'Lịch Sử Bảo Trì & Sửa Chữa Thiết Bị',
    headers,
    dataRows,
    summaryRow: history.length > 0 ? summaryRow : undefined,
    exportedBy: meta.exportedBy,
    includePrintLayout: meta.includePrintLayout,
    filterNote: meta.filterNote,
  });
}

function buildPlansSheet(
  plans: MaintenancePlan[],
  equipmentMap: Map<string, Equipment>,
  meta: ExcelExportMeta
): XLSX.WorkSheet {
  const headers = [
    'STT',
    'Mã Kế Hoạch',
    'Mã Thiết Bị',
    'Tên Thiết Bị',
    'Hệ Thống',
    'Vị Trí',
    'Loại Bảo Trì',
    'Tần Suất',
    'Ngày Gần Nhất',
    'Ngày Kế Tiếp',
    'Người Phụ Trách',
    'Người Giao Việc',
    'Trạng Thái',
    'Ghi Chú',
  ];

  const dataRows: CellValue[][] = plans.map((p, idx) => {
    const eq = equipmentMap.get(p.maThietBi);
    return [
      idx + 1,
      p.id,
      p.maThietBi,
      p.tenThietBi,
      eq?.heThong || '',
      eq?.viTri || '',
      p.loaiBaoTri,
      p.tanSuat,
      formatDateVN(p.ngayBaoTriGanNhat),
      formatDateVN(p.ngayBaoTriTiepTheo),
      p.nguoiPhuTrach,
      p.nguoiGiaoViec || '',
      p.trangThai,
      p.ghiChu || '',
    ];
  });

  const overdueCount = plans.filter((p) => p.trangThai === 'Quá hạn').length;
  const dueSoonCount = plans.filter(
    (p) => p.trangThai === 'Tới hạn' || p.trangThai === 'Sắp tới'
  ).length;

  const summaryRow: CellValue[] = [
    '',
    'THỐNG KÊ',
    '',
    `${plans.length} kế hoạch`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    `Quá hạn: ${overdueCount} | Tới hạn/Sắp tới: ${dueSoonCount}`,
    '',
  ];

  return buildStyledSheet({
    title: 'Kế Hoạch Bảo Trì Định Kỳ Thiết Bị',
    headers,
    dataRows,
    summaryRow: plans.length > 0 ? summaryRow : undefined,
    exportedBy: meta.exportedBy,
    includePrintLayout: meta.includePrintLayout,
    filterNote: meta.filterNote,
  });
}

function buildTicketsSheet(
  tickets: Ticket[],
  equipmentMap: Map<string, Equipment>,
  meta: ExcelExportMeta
): XLSX.WorkSheet {
  const headers = [
    'STT',
    'Mã Ticket',
    'Tiêu Đề Sự Cố / Công Việc',
    'Mã Thiết Bị',
    'Tên Thiết Bị',
    'Mức Độ Ưu Tiên',
    'Trạng Thái',
    'Ngày Tạo',
    'Ngày Hoàn Thành',
    'Người Phụ Trách',
    'Người Giao Việc',
    'Người Lập',
    'Mô Tả Chi Tiết',
    'Kết Quả Xử Lý',
  ];

  const dataRows: CellValue[][] = tickets.map((t, idx) => {
    const eq = t.maThietBi ? equipmentMap.get(t.maThietBi) : undefined;
    return [
      idx + 1,
      t.maTicket,
      t.tieuDe,
      t.maThietBi || 'Chung',
      eq?.tenThietBi || '',
      t.mucDoUuTien,
      t.trangThai,
      formatDateVN(t.ngayTao),
      t.ngayHoanThanh ? formatDateVN(t.ngayHoanThanh) : '',
      t.nguoiPhuTrach,
      t.nguoiGiaoViec || '',
      t.nguoiLap,
      t.moTaChiTiet,
      t.ketQua || '',
    ];
  });

  const doneCount = tickets.filter((t) => t.trangThai === 'Hoàn thành').length;
  const openCount = tickets.filter(
    (t) => t.trangThai !== 'Hoàn thành' && t.trangThai !== 'Hủy'
  ).length;

  const summaryRow: CellValue[] = [
    '',
    'THỐNG KÊ',
    `${tickets.length} phiếu sửa chữa / sự cố`,
    '',
    '',
    '',
    `Hoàn thành: ${doneCount} | Đang mở: ${openCount}`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ];

  return buildStyledSheet({
    title: 'Lịch Sử Sửa Chữa & Quản Lý Tickets Sự Cố',
    headers,
    dataRows,
    summaryRow: tickets.length > 0 ? summaryRow : undefined,
    exportedBy: meta.exportedBy,
    includePrintLayout: meta.includePrintLayout,
    filterNote: meta.filterNote,
  });
}

function buildSummaryOverviewSheet(params: {
  plans: MaintenancePlan[];
  history: MaintenanceHistory[];
  tickets: Ticket[];
  equipment: Equipment[];
  meta: ExcelExportMeta;
}): XLSX.WorkSheet {
  const { plans, history, tickets, equipment, meta } = params;
  const overduePlans = plans.filter((p) => p.trangThai === 'Quá hạn').length;
  const duePlans = plans.filter((p) => p.trangThai === 'Tới hạn').length;
  const upcomingPlans = plans.filter((p) => p.trangThai === 'Sắp tới').length;
  const onTrackPlans = plans.filter((p) => p.trangThai === 'Đúng hạn').length;

  const totalDowntime = history.reduce((s, h) => s + (Number(h.thoiGianDungMay) || 0), 0);
  const totalEstimatedCost = history.reduce((s, h) => s + (Number(h.chiPhiUocTinh) || 0), 0);
  const passedHistory = history.filter(
    (h) => h.ketQua === 'Đạt' || h.ketQua === 'Hoàn thành'
  ).length;

  const completedTickets = tickets.filter((t) => t.trangThai === 'Hoàn thành').length;
  const openTickets = tickets.filter(
    (t) => t.trangThai !== 'Hoàn thành' && t.trangThai !== 'Hủy'
  ).length;

  const headers = ['Hạng Mục Thống Kê', 'Giá Trị', 'Đơn Vị / Ghi Chú'];
  const dataRows: CellValue[][] = [
    ['Tổng số thiết bị quản lý', equipment.length, 'Thiết bị'],
    ['Tổng số kế hoạch bảo trì định kỳ', plans.length, 'Kế hoạch'],
    ['  • Kế hoạch quá hạn', overduePlans, 'Cần xử lý ưu tiên'],
    ['  • Kế hoạch tới hạn hôm nay', duePlans, 'Thực hiện trong ngày'],
    ['  • Kế hoạch sắp tới (≤ 7 ngày)', upcomingPlans, 'Chuẩn bị vật tư / nhân sự'],
    ['  • Kế hoạch đúng hạn', onTrackPlans, 'An toàn'],
    ['Tổng số biên bản lịch sử bảo trì / sửa chữa', history.length, 'Biên bản'],
    ['  • Biên bản đạt chuẩn / hoàn thành', passedHistory, 'Biên bản'],
    ['  • Tổng thời gian dừng máy tích lũy', totalDowntime, 'Phút'],
    ['  • Tổng chi phí bảo trì ước tính', totalEstimatedCost, 'VNĐ'],
    ['Tổng số Tickets sửa chữa / sự cố', tickets.length, 'Phiếu'],
    ['  • Tickets đã hoàn thành', completedTickets, 'Phiếu'],
    ['  • Tickets đang xử lý / chờ xử lý', openTickets, 'Phiếu'],
  ];

  return buildStyledSheet({
    title: 'Tổng Quan Dữ Liệu Bảo Trì & Sửa Chữa',
    headers,
    dataRows,
    exportedBy: meta.exportedBy,
    includePrintLayout: meta.includePrintLayout,
    filterNote: meta.filterNote,
  });
}

export function exportMaintenanceHistoryExcel(
  history: MaintenanceHistory[],
  equipment: Equipment[],
  meta: ExcelExportMeta = {}
): void {
  const wb = XLSX.utils.book_new();
  const eqMap = buildEquipmentMap(equipment);
  const ws = buildHistorySheet(history, eqMap, meta);
  XLSX.utils.book_append_sheet(wb, ws, 'Lich_Su_Bao_Tri');
  const { fileDate } = getNowFormatted();
  XLSX.writeFile(wb, `Lich_su_bao_tri_sua_chua_${fileDate}.xlsx`);
}

export function exportMaintenancePlansExcel(
  plans: MaintenancePlan[],
  equipment: Equipment[],
  meta: ExcelExportMeta = {}
): void {
  const wb = XLSX.utils.book_new();
  const eqMap = buildEquipmentMap(equipment);
  const ws = buildPlansSheet(plans, eqMap, meta);
  XLSX.utils.book_append_sheet(wb, ws, 'Ke_Hoach_Bao_Tri');
  const { fileDate } = getNowFormatted();
  XLSX.writeFile(wb, `Ke_hoach_bao_tri_${fileDate}.xlsx`);
}

export function exportTicketsRepairExcel(
  tickets: Ticket[],
  equipment: Equipment[],
  meta: ExcelExportMeta = {}
): void {
  const wb = XLSX.utils.book_new();
  const eqMap = buildEquipmentMap(equipment);
  const ws = buildTicketsSheet(tickets, eqMap, meta);
  XLSX.utils.book_append_sheet(wb, ws, 'Lich_Su_Sua_Chua');
  const { fileDate } = getNowFormatted();
  XLSX.writeFile(wb, `Lich_su_sua_chua_Tickets_${fileDate}.xlsx`);
}

export function exportCombinedMaintenanceWorkbook(params: {
  plans: MaintenancePlan[];
  history: MaintenanceHistory[];
  tickets: Ticket[];
  equipment: Equipment[];
  meta?: ExcelExportMeta;
}): void {
  const { plans, history, tickets, equipment, meta = {} } = params;
  const wb = XLSX.utils.book_new();
  const eqMap = buildEquipmentMap(equipment);

  const wsSummary = buildSummaryOverviewSheet({ plans, history, tickets, equipment, meta });
  const wsHistory = buildHistorySheet(history, eqMap, meta);
  const wsPlans = buildPlansSheet(plans, eqMap, meta);
  const wsTickets = buildTicketsSheet(tickets, eqMap, meta);

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Tong_Hop_KPI');
  XLSX.utils.book_append_sheet(wb, wsHistory, 'Lich_Su_Bao_Tri');
  XLSX.utils.book_append_sheet(wb, wsPlans, 'Ke_Hoach_Bao_Tri');
  XLSX.utils.book_append_sheet(wb, wsTickets, 'Sua_Chua_Tickets');

  const { fileDate } = getNowFormatted();
  XLSX.writeFile(wb, `Bao_cao_Bao_tri_va_Sua_chua_${fileDate}.xlsx`);
}

export function exportProjectsWorkbook(
  projects: FacilityProject[],
  meta: ExcelExportMeta = {}
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Danh mục Dự án
  const projectHeaders = [
    'STT',
    'Mã Dự Án',
    'Tên Dự Án',
    'Danh Mục',
    'Trạng Thái',
    'Ưu Tiên',
    'Quản Lý Dự Án (PM)',
    'Thành Viên Tham Gia',
    'Ngày Bắt Đầu',
    'Hạn Hoàn Thành',
    'Tiến Độ (%)',
    'Số Đầu Việc (Xong/Tổng)',
    'Ngân Sách Dự Kiến (VNĐ)',
    'Chi Phí Thực Tế (VNĐ)',
    'Thiết Bị Liên Quan',
  ];

  const projectRows: CellValue[][] = projects.map((p, idx) => {
    const doneTasks = p.congViec.filter((t) => t.trangThai === 'Hoàn thành').length;
    const progress = calculateProjectProgress(p);
    return [
      idx + 1,
      p.maDuAn,
      p.tenDuAn,
      p.danhMuc,
      p.trangThai,
      p.uuTien,
      p.quanLyDuAn,
      p.thanhVien,
      formatDateVN(p.ngayBatDau),
      formatDateVN(p.ngayKetThucDuKien),
      progress,
      `${doneTasks}/${p.congViec.length}`,
      p.nganSachDuKien,
      p.chiPhiThucTe,
      (p.maThietBiLienQuan || []).join(', '),
    ];
  });

  const totalBudget = projects.reduce((acc, p) => acc + (p.nganSachDuKien || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + (p.chiPhiThucTe || 0), 0);

  const wsProjects = buildStyledSheet({
    title: 'Danh Mục Dự Án Kỹ Thuật & Hạ Tầng',
    headers: projectHeaders,
    dataRows: projectRows,
    summaryRow: [
      '',
      'TỔNG CỘNG',
      `${projects.length} dự án`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      totalBudget,
      totalSpent,
      '',
    ],
    exportedBy: meta.exportedBy,
    includePrintLayout: meta.includePrintLayout,
    filterNote: meta.filterNote,
  });

  // Sheet 2: Chi tiết Công Việc WBS
  const taskHeaders = [
    'STT',
    'Mã Dự Án',
    'Tên Dự Án',
    'Mã Đầu Việc',
    'Giai Đoạn',
    'Tên Công Việc',
    'Người Thực Hiện',
    'Trạng Thái',
    'Ưu Tiên',
    'Ngày Bắt Đầu',
    'Hạn Hoàn Thành',
    'Tiến Độ (%)',
    'Giờ Dự Kiến',
    'Giờ Thực Tế',
  ];

  const taskRows: CellValue[][] = [];
  let taskIdx = 1;
  projects.forEach((p) => {
    p.congViec.forEach((t) => {
      taskRows.push([
        taskIdx++,
        p.maDuAn,
        p.tenDuAn,
        t.maCongViec,
        t.giaiDoan || '-',
        t.tieuDe,
        t.nguoiPhuTrach,
        t.trangThai,
        t.uuTien,
        formatDateVN(t.ngayBatDau),
        formatDateVN(t.hanHoanThanh),
        t.tienDo,
        t.gioDuKien ?? 0,
        t.gioThucTe ?? 0,
      ]);
    });
  });

  const wsTasks = buildStyledSheet({
    title: 'Bảng Công Việc WBS Theo Dự Án',
    headers: taskHeaders,
    dataRows: taskRows,
    exportedBy: meta.exportedBy,
    includePrintLayout: meta.includePrintLayout,
    filterNote: meta.filterNote,
  });

  // Sheet 3: Cột mốc, Rủi ro & Chi phí
  const detailHeaders = [
    'STT',
    'Mã Dự Án',
    'Phân Loại',
    'Nội Dung / Hạng Mục',
    'Ngày / Hạn',
    'Mức Độ / Trạng Thái',
    'Phụ Trách / NCC',
    'Giá Trị (VNĐ) / Giải Pháp',
  ];

  const detailRows: CellValue[][] = [];
  let detailIdx = 1;
  projects.forEach((p) => {
    p.cotMoc.forEach((m) => {
      detailRows.push([
        detailIdx++,
        p.maDuAn,
        'Cột mốc (Milestone)',
        m.tenMoc,
        formatDateVN(m.hanHoanThanh),
        m.daDat ? 'Đã đạt' : 'Chưa đạt',
        p.quanLyDuAn,
        m.ghiChu || '',
      ]);
    });
    p.khoanChi.forEach((e) => {
      detailRows.push([
        detailIdx++,
        p.maDuAn,
        'Khoản chi phí',
        e.hangMuc,
        formatDateVN(e.ngay),
        e.trangThai,
        e.nhaCungCap || '-',
        e.soTienVND,
      ]);
    });
    p.ruiRo.forEach((r) => {
      detailRows.push([
        detailIdx++,
        p.maDuAn,
        'Rủi ro (RAID)',
        r.moTa,
        '-',
        `${r.mucDo} - ${r.trangThai}`,
        r.nguoiPhuTrach,
        r.giaiPhap,
      ]);
    });
  });

  const wsDetails = buildStyledSheet({
    title: 'Cột Mốc, Chi Phí & Quản Lý Rủi Ro Dự Án',
    headers: detailHeaders,
    dataRows: detailRows,
    exportedBy: meta.exportedBy,
    includePrintLayout: meta.includePrintLayout,
    filterNote: meta.filterNote,
  });

  XLSX.utils.book_append_sheet(wb, wsProjects, 'Danh_Muc_Du_An');
  XLSX.utils.book_append_sheet(wb, wsTasks, 'Cong_Viec_WBS');
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Cot_Moc_Rui_Ro_Chi_Phi');

  const { fileDate } = getNowFormatted();
  XLSX.writeFile(wb, `Quan_ly_Du_an_FSM_${fileDate}.xlsx`);
}

