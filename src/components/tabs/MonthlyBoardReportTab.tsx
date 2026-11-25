import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import {
  MonthlyBoardReportRecord,
  MonthlyBoardReportStatus,
  Power10Days,
} from '../../types/cmms';
import {
  calculatePowerRecordCost,
  calculateProjectProgress,
  canExportCSV,
  formatDateVN,
  formatVND,
  getHistoryWorkType,
  getInspectionStatus,
  getSolarDiscountPct,
  isAdminLevel,
  isPlaceholderEmail,
  isValidEmailFormat,
} from '../../utils/cmmsLogic';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  FileBarChart2,
  Send,
  Printer,
  Save,
  Download,
  FileCode2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Droplets,
  Wrench,
  DollarSign,
  FolderKanban,
  Package,
  ShieldAlert,
  Clock,
  Trash2,
  Eye,
  Check,
} from 'lucide-react';

function getPowerRecordMonth(r: Power10Days): string {
  // Prefer chuKy prefix "MM/YYYY-..." if valid
  if (r.chuKy) {
    const match = r.chuKy.match(/^(\d{1,2})\/(\d{4})/);
    if (match) {
      return `${match[2]}-${match[1].padStart(2, '0')}`;
    }
  }
  if (r.denNgay && /^\d{4}-\d{2}/.test(r.denNgay)) {
    return r.denNgay.slice(0, 7);
  }
  if (r.tuNgay && /^\d{4}-\d{2}/.test(r.tuNgay)) {
    return r.tuNgay.slice(0, 7);
  }
  return '';
}

function getPreviousMonth(ym: string): string {
  const [yStr, mStr] = ym.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return ym;
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

function getNextMonth(ym: string): string {
  const [yStr, mStr] = ym.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return ym;
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

function formatMonthLabelVN(ym: string): string {
  const [y, m] = ym.split('-');
  if (!y || !m) return ym;
  return `Tháng ${m}/${y}`;
}

function formatShortMonth(ym: string): string {
  const [y, m] = ym.split('-');
  if (!y || !m) return ym;
  return `T${m}/${y.slice(2)}`;
}

function getPowerHours(r: Power10Days): number {
  const hrsPerDay = r.loaiCa?.includes('3') ? 24 : 16;
  return (r.ngayLamViec || 0) * hrsPerDay;
}

function computeDeltaPct(current: number, previous: number): number | null {
  if (!previous || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function formatCompactMillions(vnd: number): string {
  if (Math.abs(vnd) >= 1_000_000_000) {
    return `${(vnd / 1_000_000_000).toFixed(2)} tỷ`;
  }
  if (Math.abs(vnd) >= 1_000_000) {
    return `${(vnd / 1_000_000).toFixed(1)} tr`;
  }
  return `${Math.round(vnd).toLocaleString('vi-VN')} đ`;
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  isDark: boolean;
  unit: 'kWh' | 'VND';
}

const ReportChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  isDark,
  unit,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
  return (
    <div
      className={`rounded-xl border p-3 shadow-xl text-xs min-w-[210px] space-y-1.5 ${
        isDark
          ? 'bg-slate-900 border-slate-700 text-slate-100'
          : 'bg-white border-slate-300 text-slate-900'
      }`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-1.5">
        <span className="font-bold font-mono">{label}</span>
        {unit === 'kWh' && (
          <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
            {Math.round(total).toLocaleString('vi-VN')} kWh
          </span>
        )}
      </div>
      <div className="space-y-1">
        {payload.map((item, idx) => {
          const val = Number(item.value) || 0;
          return (
            <div key={idx} className="flex items-center justify-between gap-4 font-mono tabular-nums">
              <span className="flex items-center gap-1.5 font-sans text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: item.color || '#0284c7' }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="font-bold shrink-0">
                {unit === 'VND' ? formatVND(val) : `${Math.round(val).toLocaleString('vi-VN')} kWh`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MonthlyBoardReportTab: React.FC = () => {
  const {
    equipment,
    maintenancePlans,
    maintenanceHistory,
    tickets,
    spareParts,
    stockTransactions,
    power10Days,
    waterMonthly,
    costRecords,
    projects,
    safetyInspections,
    dailyAreaChecks,
    purchaseRequests,
    employees,
    tariffConfig,
    emailConfig,
    monthlyBoardReports,
    saveMonthlyBoardReport,
    deleteMonthlyBoardReport,
    sendEmailNotification,
    currentUser,
    theme,
  } = useCMMS();

  const isDark = theme === 'dark';
  const adminUser = isAdminLevel(currentUser);
  const allowExportCsv = canExportCSV(currentUser);
  const solarDiscountPct = getSolarDiscountPct(tariffConfig);

  // Collect all available YYYY-MM months across all datasets
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const nowYm = new Date().toISOString().slice(0, 7);
    set.add(nowYm);

    power10Days.forEach((r) => {
      const ym = getPowerRecordMonth(r);
      if (ym) set.add(ym);
    });
    waterMonthly.forEach((w) => {
      if (w.month && /^\d{4}-\d{2}$/.test(w.month)) set.add(w.month);
    });
    maintenanceHistory.forEach((h) => {
      if (h.ngayThucHien && /^\d{4}-\d{2}/.test(h.ngayThucHien)) set.add(h.ngayThucHien.slice(0, 7));
    });
    tickets.forEach((t) => {
      if (t.ngayTao && /^\d{4}-\d{2}/.test(t.ngayTao)) set.add(t.ngayTao.slice(0, 7));
    });
    costRecords.forEach((c) => {
      if (c.ngayGhiNhan && /^\d{4}-\d{2}/.test(c.ngayGhiNhan)) set.add(c.ngayGhiNhan.slice(0, 7));
    });
    dailyAreaChecks.forEach((d) => {
      if (d.ngayKiemTra && /^\d{4}-\d{2}/.test(d.ngayKiemTra)) set.add(d.ngayKiemTra.slice(0, 7));
    });
    Object.keys(monthlyBoardReports.reportsByMonth || {}).forEach((ym) => {
      if (/^\d{4}-\d{2}$/.test(ym)) set.add(ym);
    });

    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [
    power10Days,
    waterMonthly,
    maintenanceHistory,
    tickets,
    costRecords,
    dailyAreaChecks,
    monthlyBoardReports.reportsByMonth,
  ]);

  // Default to the latest month that has energy or maintenance data
  const defaultMonth = useMemo(() => {
    const powerMonths = power10Days
      .map((r) => getPowerRecordMonth(r))
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));
    if (powerMonths.length > 0) return powerMonths[0];
    return availableMonths[0] || new Date().toISOString().slice(0, 7);
  }, [power10Days, availableMonths]);

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const prevMonth = useMemo(() => getPreviousMonth(selectedMonth), [selectedMonth]);

  // Helper to aggregate Energy + Water + Costs + Maintenance + Tickets for any given month
  const computeMonthMetrics = useMemo(() => {
    return (ym: string) => {
      // 1. Power 10-day records
      const powerRows = power10Days.filter((r) => getPowerRecordMonth(r) === ym);
      let evnBT = 0;
      let evnCD = 0;
      let evnTD = 0;
      let solarBT = 0;
      let solarCD = 0;
      let prodKwh = 0;
      let utilKwh = 0;
      let officeKwh = 0;
      let totalHours = 0;
      let totalWorkDays = 0;
      let evnCost = 0;
      let solarGrossCost = 0;
      let solarDiscountAmount = 0;
      let solarCost = 0;

      // Sub-loads
      let pEquipment = 0;
      let pAcmv = 0;
      let pLighting = 0;
      let uChiller = 0;
      let uMChiller = 0;
      let uComp = 0;
      let uPump = 0;
      let uCooling = 0;
      let uOther = 0;
      let oAcmv = 0;
      let oServer = 0;
      let oLighting = 0;
      let oSocket = 0;
      let oKit = 0;

      powerRows.forEach((r) => {
        evnBT += r.evnBT || 0;
        evnCD += r.evnCD || 0;
        evnTD += r.evnTD || 0;
        solarBT += r.solarBT || 0;
        solarCD += r.solarCD || 0;

        pEquipment += r.pEquipment || 0;
        pAcmv += r.pAcmv || 0;
        pLighting += r.pLighting || 0;

        uChiller += r.uChiller || 0;
        uMChiller += r.uMChiller || 0;
        uComp += r.uComp || 0;
        uPump += r.uPump || 0;
        uCooling += r.uCooling || 0;
        uOther += r.uOther || 0;

        oAcmv += r.oAcmv || 0;
        oServer += r.oServer || 0;
        oLighting += r.oLighting || 0;
        oSocket += r.oSocket || 0;
        oKit += r.oKit || 0;

        totalHours += getPowerHours(r);
        totalWorkDays += r.ngayLamViec || 0;

        const cost = calculatePowerRecordCost(r, tariffConfig);
        evnCost += cost.evn.total;
        solarGrossCost += cost.solar.grossTotal;
        solarDiscountAmount += cost.solar.discountAmount;
        solarCost += cost.solar.total;
      });

      prodKwh = pEquipment + pAcmv + pLighting;
      utilKwh = uChiller + uMChiller + uComp + uPump + uCooling + uOther;
      officeKwh = oAcmv + oServer + oLighting + oSocket + oKit;

      const totalEvnKwh = evnBT + evnCD + evnTD;
      const totalSolarKwh = solarBT + solarCD;
      const totalEnergyKwh = totalEvnKwh + totalSolarKwh;
      const totalZoneKwh = prodKwh + utilKwh + officeKwh;
      const solarRatioPct = totalEnergyKwh > 0 ? (totalSolarKwh / totalEnergyKwh) * 100 : 0;
      const totalElectricityCost = evnCost + solarCost;
      const avgCostPerKwh = totalEnergyKwh > 0 ? totalElectricityCost / totalEnergyKwh : 0;

      // 2. Water Monthly
      const waterRec = waterMonthly.find((w) => w.month === ym);
      const waterM3 = waterRec?.waterM3 || 0;
      const waterVND = waterRec?.waterVND || 0;
      const sewageVND = waterRec?.sewageVND || 0;
      const totalWaterCost = waterVND + sewageVND;

      // 3. Maintenance History in Month
      const monthHistory = maintenanceHistory.filter((h) => (h.ngayThucHien || '').startsWith(ym));
      const plannedCount = monthHistory.filter((h) => getHistoryWorkType(h) === 'Bảo trì theo kế hoạch').length;
      const repairCount = monthHistory.filter((h) => getHistoryWorkType(h) === 'Sửa chữa').length;
      const passedCount = monthHistory.filter((h) => h.ketQua === 'Đạt' || h.ketQua === 'Hoàn thành').length;
      const downtimeHours = monthHistory.reduce((acc, h) => acc + (Number(h.thoiGianDungMay) || 0), 0);
      const estimatedHistCost = monthHistory.reduce((acc, h) => acc + (Number(h.chiPhiUocTinh) || 0), 0);

      // 4. Tickets in Month
      const monthTickets = tickets.filter((t) => (t.ngayTao || '').startsWith(ym));
      const monthTicketsCompleted = monthTickets.filter((t) => t.trangThai === 'Hoàn thành').length;
      const monthTicketsUrgent = monthTickets.filter(
        (t) => t.mucDoUuTien === 'Khẩn cấp' || t.mucDoUuTien === 'Cao'
      ).length;
      const openTicketsAll = tickets.filter(
        (t) => t.trangThai !== 'Hoàn thành' && t.trangThai !== 'Hủy'
      );

      // 5. Maintenance & Procurement Cost Records in Month
      const monthCosts = costRecords.filter((c) => (c.ngayGhiNhan || '').startsWith(ym));
      const maintenanceCostVND = monthCosts.reduce((acc, c) => acc + (Number(c.soTienVND) || 0), 0);
      const maintenanceCostPaid = monthCosts
        .filter((c) => c.trangThai === 'Đã thanh toán')
        .reduce((acc, c) => acc + (Number(c.soTienVND) || 0), 0);
      const maintenanceCostPending = monthCosts
        .filter((c) => c.trangThai === 'Chờ duyệt')
        .reduce((acc, c) => acc + (Number(c.soTienVND) || 0), 0);

      const costByCategoryMap = new Map<string, number>();
      monthCosts.forEach((c) => {
        costByCategoryMap.set(c.phanLoai, (costByCategoryMap.get(c.phanLoai) || 0) + (Number(c.soTienVND) || 0));
      });
      const costByCategory = Array.from(costByCategoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      // 6. Stock Transactions in Month
      const monthStockTx = stockTransactions.filter((tx) => (tx.ngay || '').startsWith(ym));
      const stockInCount = monthStockTx.filter((tx) => tx.loaiGD === 'Nhập kho').length;
      const stockOutCount = monthStockTx.filter((tx) => tx.loaiGD === 'Xuất kho sử dụng').length;

      // 7. Morning Checks in Month
      const monthMorningChecks = dailyAreaChecks.filter((d) => (d.ngayKiemTra || '').startsWith(ym));
      const morningCompleted = monthMorningChecks.filter((d) => d.trangThai === 'Đã hoàn thành').length;
      const morningIssues = monthMorningChecks.filter(
        (d) => d.ketQua === 'Có sự cố' || d.ketQua === 'Cần theo dõi'
      ).length;

      // 8. Combined OPEX
      const totalOpexVND = totalElectricityCost + totalWaterCost + maintenanceCostVND;
      const totalOpexUSD = tariffConfig.usdToVndRate > 0 ? totalOpexVND / tariffConfig.usdToVndRate : 0;

      return {
        month: ym,
        powerCycles: powerRows.length,
        totalWorkDays,
        totalHours,
        totalEvnKwh,
        totalSolarKwh,
        totalEnergyKwh,
        solarRatioPct,
        evnCost,
        solarGrossCost,
        solarDiscountAmount,
        solarCost,
        totalElectricityCost,
        avgCostPerKwh,
        prodKwh,
        utilKwh,
        officeKwh,
        totalZoneKwh,
        subLoads: {
          pEquipment,
          pAcmv,
          pLighting,
          uChiller,
          uMChiller,
          uComp,
          uPump,
          uCooling,
          uOther,
          oAcmv,
          oServer,
          oLighting,
          oSocket,
          oKit,
        },
        waterM3,
        waterVND,
        sewageVND,
        totalWaterCost,
        monthHistory,
        plannedCount,
        repairCount,
        passedCount,
        downtimeHours,
        estimatedHistCost,
        monthTickets,
        monthTicketsCompleted,
        monthTicketsUrgent,
        openTicketsAll,
        monthCosts,
        maintenanceCostVND,
        maintenanceCostPaid,
        maintenanceCostPending,
        costByCategory,
        stockInCount,
        stockOutCount,
        monthMorningChecks,
        morningCompleted,
        morningIssues,
        totalOpexVND,
        totalOpexUSD,
      };
    };
  }, [
    power10Days,
    waterMonthly,
    maintenanceHistory,
    tickets,
    costRecords,
    stockTransactions,
    dailyAreaChecks,
    tariffConfig,
  ]);

  const currentMetrics = useMemo(
    () => computeMonthMetrics(selectedMonth),
    [computeMonthMetrics, selectedMonth]
  );
  const previousMetrics = useMemo(
    () => computeMonthMetrics(prevMonth),
    [computeMonthMetrics, prevMonth]
  );

  // Plant-wide live status snapshot (Equipment, PM Plans, Safety Inspections, Projects, Spare Parts, Purchase Requests)
  const plantSnapshot = useMemo(() => {
    const totalEquipment = equipment.length;
    const activeEquipment = equipment.filter((e) => e.trangThai === 'Hoạt động').length;
    const maintenanceEquipment = equipment.filter(
      (e) => e.trangThai === 'Bảo trì' || e.trangThai === 'Đang sửa chữa'
    ).length;
    const availabilityPct = totalEquipment > 0 ? (activeEquipment / totalEquipment) * 100 : 100;

    const overduePlans = maintenancePlans.filter((p) => p.trangThai === 'Quá hạn');
    const duePlans = maintenancePlans.filter((p) => p.trangThai === 'Tới hạn' || p.trangThai === 'Sắp tới');

    const inspectionAlertItems = safetyInspections
      .map((item) => ({
        ...item,
        computedStatus: getInspectionStatus(
          item.ngayHetHan,
          item.nhacTruocNgay ?? 30,
          item.trangThai === 'Đang kiểm định'
        ),
      }))
      .filter((i) => i.computedStatus === 'Quá hạn' || i.computedStatus === 'Sắp đến hạn');

    const lowStockParts = spareParts.filter((p) => p.tonThucTe <= p.tonToiThieu);
    const totalInventoryValue = spareParts.reduce(
      (sum, p) => sum + (Number(p.tonThucTe) || 0) * (Number(p.donGia) || 0),
      0
    );

    const activeProjects = projects.filter(
      (p) => p.trangThai === 'Đang triển khai' || p.trangThai === 'Chờ nghiệm thu' || p.trangThai === 'Lập kế hoạch'
    );
    const completedProjects = projects.filter((p) => p.trangThai === 'Hoàn thành');
    const totalProjectBudget = projects.reduce((sum, p) => sum + (Number(p.nganSachDuKien) || 0), 0);
    const totalProjectActual = projects.reduce((sum, p) => sum + (Number(p.chiPhiThucTe) || 0), 0);

    const pendingPurchases = purchaseRequests.filter((r) => r.trangThai === 'Chờ duyệt');
    const pendingPurchasesValue = pendingPurchases.reduce(
      (sum, r) => sum + (Number(r.soLuong) || 0) * (Number(r.donGiaDuKien) || 0),
      0
    );

    return {
      totalEquipment,
      activeEquipment,
      maintenanceEquipment,
      availabilityPct,
      overduePlans,
      duePlans,
      inspectionAlertItems,
      lowStockParts,
      totalInventoryValue,
      activeProjects,
      completedProjects,
      totalProjectBudget,
      totalProjectActual,
      pendingPurchases,
      pendingPurchasesValue,
    };
  }, [equipment, maintenancePlans, safetyInspections, spareParts, projects, purchaseRequests]);

  // 6-month trend ending at selectedMonth
  const sixMonthEnergyTrend = useMemo(() => {
    const months: string[] = [];
    let cursor = selectedMonth;
    for (let i = 0; i < 6; i++) {
      months.unshift(cursor);
      cursor = getPreviousMonth(cursor);
    }
    return months.map((ym) => {
      const m = computeMonthMetrics(ym);
      return {
        month: ym,
        label: formatShortMonth(ym),
        Production: Math.round(m.prodKwh),
        Utility: Math.round(m.utilKwh),
        Office: Math.round(m.officeKwh),
        total: Math.round(m.totalEnergyKwh),
      };
    });
  }, [selectedMonth, computeMonthMetrics]);

  // Cost comparison chart (Current Month vs Previous Month)
  const costComparisonData = useMemo(
    () => [
      {
        name: 'Điện EVN',
        current: Math.round(currentMetrics.evnCost),
        previous: Math.round(previousMetrics.evnCost),
      },
      {
        name: `Solar (-${solarDiscountPct}%)`,
        current: Math.round(currentMetrics.solarCost),
        previous: Math.round(previousMetrics.solarCost),
      },
      {
        name: 'Nước & Thải',
        current: Math.round(currentMetrics.totalWaterCost),
        previous: Math.round(previousMetrics.totalWaterCost),
      },
      {
        name: 'Bảo Trì & VT',
        current: Math.round(currentMetrics.maintenanceCostVND),
        previous: Math.round(previousMetrics.maintenanceCostVND),
      },
    ],
    [currentMetrics, previousMetrics, solarDiscountPct]
  );

  // Suggest default Board recipients from Director / Manager / Admin emails
  const suggestedBoardEmails = useMemo(() => {
    if (monthlyBoardReports.defaultBoardRecipients?.trim()) {
      return monthlyBoardReports.defaultBoardRecipients.trim();
    }
    const directors = employees
      .filter(
        (e) =>
          (e.chucVu === 'Director' || e.chucVu === 'Owner' || e.chucVu === 'Người quản lý') &&
          e.email &&
          isValidEmailFormat(e.email) &&
          !isPlaceholderEmail(e.email)
      )
      .map((e) => e.email.trim());
    if (directors.length > 0) return Array.from(new Set(directors)).join(', ');
    if (emailConfig.primaryRecipient && !isPlaceholderEmail(emailConfig.primaryRecipient)) {
      return emailConfig.primaryRecipient;
    }
    return emailConfig.primaryRecipient || '';
  }, [monthlyBoardReports.defaultBoardRecipients, employees, emailConfig.primaryRecipient]);

  // Auto-draft executive narrative bullets from real monthly numbers
  const buildAutoDraftContent = () => {
    const m = currentMetrics;
    const p = previousMetrics;
    const energyDelta = computeDeltaPct(m.totalEnergyKwh, p.totalEnergyKwh);
    const opexDelta = computeDeltaPct(m.totalOpexVND, p.totalOpexVND);

    const highlightsLines = [
      `• Độ sẵn sàng thiết bị toàn nhà máy đạt ${plantSnapshot.availabilityPct.toFixed(1)}% (${plantSnapshot.activeEquipment}/${plantSnapshot.totalEquipment} thiết bị vận hành ổn định).`,
      `• Hoàn thành ${m.plannedCount} lượt bảo trì định kỳ và ${m.repairCount} lượt sửa chữa đột xuất trong ${formatMonthLabelVN(selectedMonth)}; tổng thời gian dừng máy: ${m.downtimeHours.toFixed(1)} giờ.`,
      m.totalEnergyKwh > 0
        ? `• Tổng điện năng tiêu thụ đạt ${Math.round(m.totalEnergyKwh).toLocaleString('vi-VN')} kWh (${m.powerCycles} chu kỳ 10 ngày)${
            energyDelta !== null ? `, ${energyDelta >= 0 ? 'tăng' : 'giảm'} ${Math.abs(energyDelta).toFixed(1)}% so với ${formatMonthLabelVN(prevMonth)}` : ''
          }; tỷ lệ điện mặt trời Solar đạt ${m.solarRatioPct.toFixed(1)}%, tiết kiệm ${formatVND(m.solarDiscountAmount)} nhờ chiết khấu ${solarDiscountPct}%.`
        : `• Chưa có dữ liệu chốt điện 10 ngày trong ${formatMonthLabelVN(selectedMonth)}.`,
      `• Tổng chi phí vận hành (OPEX) ghi nhận ${formatVND(m.totalOpexVND)} (~$${Math.round(m.totalOpexUSD).toLocaleString('en-US')})${
        opexDelta !== null ? `, ${opexDelta >= 0 ? 'tăng' : 'giảm'} ${Math.abs(opexDelta).toFixed(1)}% so với tháng trước` : ''
      }.`,
    ];

    const risksLines: string[] = [];
    if (plantSnapshot.overduePlans.length > 0) {
      risksLines.push(
        `• Hiện có ${plantSnapshot.overduePlans.length} hạng mục bảo trì định kỳ quá hạn cần ưu tiên bố trí dừng máy để xử lý dứt điểm.`
      );
    }
    if (m.openTicketsAll.length > 0) {
      const urgentOpen = m.openTicketsAll.filter(
        (t) => t.mucDoUuTien === 'Khẩn cấp' || t.mucDoUuTien === 'Cao'
      ).length;
      risksLines.push(
        `• Còn ${m.openTicketsAll.length} Ticket sự cố đang mở (${urgentOpen} mức độ Khẩn cấp/Cao) đang được đội kỹ thuật theo dõi xử lý.`
      );
    }
    if (plantSnapshot.inspectionAlertItems.length > 0) {
      risksLines.push(
        `• Có ${plantSnapshot.inspectionAlertItems.length} hồ sơ Kiểm định an toàn / Hiệu chuẩn quá hạn hoặc sắp đến hạn cần đặt lịch đơn vị kiểm định.`
      );
    }
    if (plantSnapshot.lowStockParts.length > 0) {
      risksLines.push(
        `• Kho vật tư ghi nhận ${plantSnapshot.lowStockParts.length} mã phụ tùng dưới mức tồn tối thiểu, cần bổ sung sớm để tránh rủi ro chờ vật tư.`
      );
    }
    if (risksLines.length === 0) {
      risksLines.push('• Không ghi nhận rủi ro vận hành nghiêm trọng hoặc tồn đọng quá hạn trong kỳ báo cáo.');
    }

    const nextPlanLines = [
      `• Đẩy nhanh tiến độ bảo trì phòng ngừa cho ${plantSnapshot.overduePlans.length + plantSnapshot.duePlans.length} thiết bị quá hạn & sắp đến hạn trong tháng tới.`,
      plantSnapshot.pendingPurchases.length > 0
        ? `• Kính trình Ban Giám Đốc xem xét phê duyệt ${plantSnapshot.pendingPurchases.length} phiếu yêu cầu mua vật tư/dụng cụ (tổng dự toán ${formatVND(plantSnapshot.pendingPurchasesValue)}).`
        : '• Kiểm soát định mức tiêu hao phụ tùng và tối ưu tồn kho an toàn cho các cụm thiết bị trọng yếu.',
      `• Duy trì kiểm tra đầu ngày 3 khu vực (Vòng trong, Vòng Ngoài, Phòng Utility) và theo dõi sát phụ tải Utility (${
        m.totalZoneKwh > 0 ? ((m.utilKwh / m.totalZoneKwh) * 100).toFixed(1) : '0'
      }%) & Production (${
        m.totalZoneKwh > 0 ? ((m.prodKwh / m.totalZoneKwh) * 100).toFixed(1) : '0'
      }%) nhằm tối ưu chi phí điện giờ cao điểm.`,
    ];

    return {
      highlights: highlightsLines.join('\n'),
      risksAndIssues: risksLines.join('\n'),
      nextMonthPlan: nextPlanLines.join('\n'),
    };
  };

  const savedForSelectedMonth = monthlyBoardReports.reportsByMonth?.[selectedMonth];

  // Editable form state synced to selectedMonth
  const [reportTitle, setReportTitle] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [boardRecipients, setBoardRecipients] = useState('');
  const [ccRecipients, setCcRecipients] = useState('');
  const [highlights, setHighlights] = useState('');
  const [risksAndIssues, setRisksAndIssues] = useState('');
  const [nextMonthPlan, setNextMonthPlan] = useState('');
  const [directorFeedback, setDirectorFeedback] = useState('');
  const [reportStatus, setReportStatus] = useState<MonthlyBoardReportStatus>('Bản nháp');
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isSendingReport, setIsSendingReport] = useState(false);

  // Sync editor whenever selectedMonth or saved report changes
  useEffect(() => {
    const existing = monthlyBoardReports.reportsByMonth?.[selectedMonth];
    if (existing) {
      setReportTitle(
        existing.reportTitle ||
          `Báo Cáo Tổng Hợp Vận Hành, Bảo Trì & Năng Lượng — ${formatMonthLabelVN(selectedMonth)}`
      );
      setPreparedBy(existing.preparedBy || currentUser.tenNhanVien);
      setReviewerName(existing.reviewerName || 'Trưởng phòng Kỹ thuật');
      setBoardRecipients(existing.boardRecipients || suggestedBoardEmails);
      setCcRecipients(existing.ccRecipients ?? monthlyBoardReports.defaultCcRecipients ?? emailConfig.ccRecipients ?? '');
      setHighlights(existing.highlights || '');
      setRisksAndIssues(existing.risksAndIssues || '');
      setNextMonthPlan(existing.nextMonthPlan || '');
      setDirectorFeedback(existing.directorFeedback || '');
      setReportStatus(existing.status || 'Bản nháp');
    } else {
      const autoDraft = buildAutoDraftContent();
      setReportTitle(
        `Báo Cáo Tổng Hợp Vận Hành, Bảo Trì & Năng Lượng — ${formatMonthLabelVN(selectedMonth)}`
      );
      setPreparedBy(currentUser.tenNhanVien);
      setReviewerName('Trưởng phòng Kỹ thuật');
      setBoardRecipients(suggestedBoardEmails);
      setCcRecipients(monthlyBoardReports.defaultCcRecipients || emailConfig.ccRecipients || '');
      setHighlights(autoDraft.highlights);
      setRisksAndIssues(autoDraft.risksAndIssues);
      setNextMonthPlan(autoDraft.nextMonthPlan);
      setDirectorFeedback('');
      setReportStatus('Bản nháp');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, savedForSelectedMonth?.updatedAt]);

  const showTransientNotice = (msg: string) => {
    setSaveToast(msg);
    window.setTimeout(() => {
      setSaveToast((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  const handleSaveReport = (overrideStatus?: MonthlyBoardReportStatus) => {
    const existing = monthlyBoardReports.reportsByMonth?.[selectedMonth];
    const nextRecord: MonthlyBoardReportRecord = {
      month: selectedMonth,
      reportTitle:
        reportTitle.trim() ||
        `Báo Cáo Tổng Hợp Vận Hành, Bảo Trì & Năng Lượng — ${formatMonthLabelVN(selectedMonth)}`,
      preparedBy: preparedBy.trim() || currentUser.tenNhanVien,
      reviewerName: reviewerName.trim() || undefined,
      boardRecipients: boardRecipients.trim(),
      ccRecipients: ccRecipients.trim() || undefined,
      highlights,
      risksAndIssues,
      nextMonthPlan,
      directorFeedback: directorFeedback.trim() || undefined,
      status: overrideStatus || reportStatus,
      updatedAt: new Date().toISOString(),
      sentAt: existing?.sentAt,
      sentBy: existing?.sentBy,
      sentCount: existing?.sentCount,
      lastEmailLogId: existing?.lastEmailLogId,
    };
    saveMonthlyBoardReport(nextRecord, {
      defaultBoardRecipients: boardRecipients.trim(),
      defaultCcRecipients: ccRecipients.trim(),
    });
    if (overrideStatus) setReportStatus(overrideStatus);
    showTransientNotice(`Đã lưu báo cáo ${formatMonthLabelVN(selectedMonth)} thành công.`);
  };

  const handleRegenerateAutoDraft = () => {
    const autoDraft = buildAutoDraftContent();
    setHighlights(autoDraft.highlights);
    setRisksAndIssues(autoDraft.risksAndIssues);
    setNextMonthPlan(autoDraft.nextMonthPlan);
    showTransientNotice('Đã tự động tổng hợp lại nội dung nhận xét từ số liệu thực tế của tháng.');
  };

  // Build formal Board Email body
  const buildBoardEmailPayload = () => {
    const m = currentMetrics;
    const p = previousMetrics;
    const energyDelta = computeDeltaPct(m.totalEnergyKwh, p.totalEnergyKwh);
    const opexDelta = computeDeltaPct(m.totalOpexVND, p.totalOpexVND);

    const subject = `[BÁO CÁO THÁNG ${selectedMonth.split('-').reverse().join('/')}] ${
      reportTitle.trim() || 'Tổng Hợp Vận Hành, Bảo Trì & Năng Lượng Nhà Máy'
    }`;

    const prodPct = m.totalZoneKwh > 0 ? ((m.prodKwh / m.totalZoneKwh) * 100).toFixed(1) : '0.0';
    const utilPct = m.totalZoneKwh > 0 ? ((m.utilKwh / m.totalZoneKwh) * 100).toFixed(1) : '0.0';
    const offPct = m.totalZoneKwh > 0 ? ((m.officeKwh / m.totalZoneKwh) * 100).toFixed(1) : '0.0';

    const body = [
      `Kính gửi Ban Giám Đốc,`,
      ``,
      `Phòng Kỹ Thuật & Bảo Trì (Facility Management) xin trân trọng gửi Báo Cáo Tổng Hợp Vận Hành, Bảo Trì & Năng Lượng kỳ ${formatMonthLabelVN(selectedMonth)} với các chỉ số trọng tâm sau:`,
      ``,
      `I. CHỈ SỐ ĐIỀU HÀNH TRỌNG TÂM (${formatMonthLabelVN(selectedMonth).toUpperCase()})`,
      `- Kỳ báo cáo: ${formatMonthLabelVN(selectedMonth)}`,
      `- Người lập báo cáo: ${preparedBy || currentUser.tenNhanVien}`,
      `- Độ sẵn sàng thiết bị: ${plantSnapshot.availabilityPct.toFixed(1)}% (${plantSnapshot.activeEquipment}/${plantSnapshot.totalEquipment} thiết bị hoạt động bình thường)`,
      `- Bảo trì & Sửa chữa trong tháng: ${m.plannedCount} bảo trì định kỳ · ${m.repairCount} sửa chữa đột xuất · Tổng dừng máy ${m.downtimeHours.toFixed(1)} giờ`,
      `- Tickets sự cố trong tháng: ${m.monthTickets.length} phiếu (${m.monthTicketsCompleted} hoàn thành) · Tổng tồn đọng hiện tại: ${m.openTicketsAll.length} phiếu`,
      `- Kế hoạch bảo trì quá hạn hiện tại: ${plantSnapshot.overduePlans.length} hạng mục`,
      `- Kiểm định an toàn / Hiệu chuẩn cần chú ý: ${plantSnapshot.inspectionAlertItems.length} hồ sơ quá hạn hoặc sắp hết hạn`,
      ``,
      `II. TÌNH HÌNH NĂNG LƯỢNG ĐIỆN - NƯỚC`,
      `- Tổng sản lượng điện (${m.powerCycles} chu kỳ 10 ngày): ${Math.round(m.totalEnergyKwh).toLocaleString('vi-VN')} kWh${
        energyDelta !== null ? ` (${energyDelta >= 0 ? '+' : ''}${energyDelta.toFixed(1)}% so với tháng trước)` : ''
      }`,
      `- Cơ cấu nguồn cấp: EVN ${Math.round(m.totalEvnKwh).toLocaleString('vi-VN')} kWh · Solar ${Math.round(m.totalSolarKwh).toLocaleString('vi-VN')} kWh (${m.solarRatioPct.toFixed(1)}%)`,
      `- Phân bổ 3 khu vực: Production ${Math.round(m.prodKwh).toLocaleString('vi-VN')} kWh (${prodPct}%) · Utility ${Math.round(m.utilKwh).toLocaleString('vi-VN')} kWh (${utilPct}%) · Office ${Math.round(m.officeKwh).toLocaleString('vi-VN')} kWh (${offPct}%)`,
      `- Chi phí điện tháng (đã giảm ${solarDiscountPct}% Solar): ${formatVND(m.totalElectricityCost)} (Tiết kiệm từ chiết khấu Solar: ${formatVND(m.solarDiscountAmount)})`,
      `- Nước tiêu thụ & Xử lý thải: ${m.waterM3.toLocaleString('vi-VN')} m³ · Tổng chi phí nước & thải: ${formatVND(m.totalWaterCost)}`,
      ``,
      `III. TỔNG CHI PHÍ VẬN HÀNH (OPEX) & ĐỀ XUẤT MUA SẮM`,
      `- Chi phí bảo trì, sửa chữa & vật tư phát sinh: ${formatVND(m.maintenanceCostVND)}`,
      `- Tổng OPEX vận hành tháng (Điện + Nước + Bảo trì): ${formatVND(m.totalOpexVND)} (~$${Math.round(m.totalOpexUSD).toLocaleString('en-US')})${
        opexDelta !== null ? ` (${opexDelta >= 0 ? '+' : ''}${opexDelta.toFixed(1)}% so với tháng trước)` : ''
      }`,
      `- Kho phụ tùng dưới tồn tối thiểu: ${plantSnapshot.lowStockParts.length} mã · Giá trị kho hiện tại: ${formatVND(plantSnapshot.totalInventoryValue)}`,
      `- Phiếu yêu cầu mua sắm chờ duyệt: ${plantSnapshot.pendingPurchases.length} phiếu (Dự toán: ${formatVND(plantSnapshot.pendingPurchasesValue)})`,
      `- Dự án hạ tầng đang triển khai: ${plantSnapshot.activeProjects.length} dự án (Ngân sách tổng: ${formatVND(plantSnapshot.totalProjectBudget)} · Thực chi: ${formatVND(plantSnapshot.totalProjectActual)})`,
      ``,
      `IV. ĐIỂM NỔI BẬT TRONG THÁNG`,
      highlights.trim() || '• Duy trì vận hành ổn định các hệ thống kỹ thuật nhà máy.',
      ``,
      `V. SỰ CỐ, RỦI RO & TỒN ĐỌNG CẦN LƯU Ý`,
      risksAndIssues.trim() || '• Không có rủi ro nghiêm trọng phát sinh.',
      ``,
      `VI. KẾ HOẠCH TRỌNG TÂM & ĐỀ XUẤT THÁNG TỚI`,
      nextMonthPlan.trim() || '• Tiếp tục thực hiện bảo trì phòng ngừa đúng tiến độ.',
      ``,
      `Trân trọng!.`,
      `${preparedBy || currentUser.tenNhanVien} — Bộ phận Facility Management`,
    ].join('\n');

    return { subject, body };
  };

  // Send Monthly Report to Board of Directors via CMMS email service
  const handleSendToBoard = async () => {
    setIsSendingReport(true);
    const { subject, body } = buildBoardEmailPayload();
    const res = await sendEmailNotification({
      type: 'BAO_CAO_THANG_BGD',
      subject,
      body,
      recipient: boardRecipients.trim() || suggestedBoardEmails || emailConfig.primaryRecipient,
      cc: ccRecipients.trim(),
      relatedId: `BCT-${selectedMonth}`,
      interactiveFallback: true,
      userConfirmed: true,
      allowDuplicate: true,
    });
    setIsSendingReport(false);

    const existing = monthlyBoardReports.reportsByMonth?.[selectedMonth];
    const nowIso = new Date().toISOString();
    const sentSuccessfully = res.success || res.method === 'interactive';
    const nextStatus: MonthlyBoardReportStatus = sentSuccessfully ? 'Đã gửi BGĐ' : reportStatus;

    saveMonthlyBoardReport(
      {
        month: selectedMonth,
        reportTitle:
          reportTitle.trim() ||
          `Báo Cáo Tổng Hợp Vận Hành, Bảo Trì & Năng Lượng — ${formatMonthLabelVN(selectedMonth)}`,
        preparedBy: preparedBy.trim() || currentUser.tenNhanVien,
        reviewerName: reviewerName.trim() || undefined,
        boardRecipients: boardRecipients.trim(),
        ccRecipients: ccRecipients.trim() || undefined,
        highlights,
        risksAndIssues,
        nextMonthPlan,
        directorFeedback: directorFeedback.trim() || undefined,
        status: nextStatus,
        updatedAt: nowIso,
        sentAt: sentSuccessfully ? nowIso : existing?.sentAt,
        sentBy: sentSuccessfully ? currentUser.tenNhanVien : existing?.sentBy,
        sentCount: sentSuccessfully ? (existing?.sentCount || 0) + 1 : existing?.sentCount,
        lastEmailLogId: res.logId || existing?.lastEmailLogId,
      },
      {
        defaultBoardRecipients: boardRecipients.trim(),
        defaultCcRecipients: ccRecipients.trim(),
      }
    );
    setReportStatus(nextStatus);
    showTransientNotice(
      res.success
        ? `Đã gửi báo cáo ${formatMonthLabelVN(selectedMonth)} đến Ban Giám Đốc.`
        : 'Đã mở hộp thoại gửi Email Báo Cáo BGĐ & cập nhật lịch sử.'
    );
  };

  // Download standalone executive HTML A4 document
  const handleDownloadHtmlReport = () => {
    const m = currentMetrics;
    const prodPct = m.totalZoneKwh > 0 ? ((m.prodKwh / m.totalZoneKwh) * 100).toFixed(1) : '0.0';
    const utilPct = m.totalZoneKwh > 0 ? ((m.utilKwh / m.totalZoneKwh) * 100).toFixed(1) : '0.0';
    const offPct = m.totalZoneKwh > 0 ? ((m.officeKwh / m.totalZoneKwh) * 100).toFixed(1) : '0.0';

    const nl2br = (text: string) =>
      escapeHtml(text || '—')
        .split('\n')
        .map((line) => `<p style="margin:0 0 6px 0;">${line}</p>`)
        .join('');

    const htmlDoc = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(reportTitle)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f8fafc; color:#0f172a; margin:0; padding:24px; line-height:1.5; }
    .sheet { max-width:960px; margin:0 auto; background:#ffffff; border:1px solid #cbd5e1; border-radius:12px; padding:32px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #0f172a; padding-bottom:16px; margin-bottom:24px; }
    .kpi-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin-bottom:24px; }
    .kpi { border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; background:#f8fafc; }
    .kpi-label { font-size:11px; color:#475569; font-weight:600; margin-bottom:4px; }
    .kpi-val { font-size:18px; font-weight:800; font-family:ui-monospace, monospace; color:#0f172a; }
    .kpi-sub { font-size:11px; color:#64748b; margin-top:4px; }
    h2 { font-size:14px; font-weight:800; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:6px; margin:24px 0 12px 0; text-transform:uppercase; letter-spacing:0.03em; }
    table { width:100%; border-collapse:collapse; font-size:12px; margin-bottom:16px; }
    th, td { border:1px solid #e2e8f0; padding:8px 10px; text-align:left; }
    th { background:#f1f5f9; font-weight:700; color:#1e293b; }
    .num { text-align:right; font-family:ui-monospace, monospace; }
    .box { border:1px solid #e2e8f0; border-radius:8px; padding:14px 16px; background:#f8fafc; font-size:13px; }
    .sign-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:24px; margin-top:36px; text-align:center; font-size:12px; }
    .sign-line { margin-top:56px; font-weight:700; color:#0f172a; }
    @media print { body { background:#fff; padding:0; } .sheet { border:none; padding:0; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div style="font-size:11px;font-weight:700;color:#0369a1;letter-spacing:0.06em;">FACILITY SYSTEM MANAGEMENT · BÁO CÁO ĐIỀU HÀNH</div>
        <h1 style="margin:6px 0 4px 0;font-size:20px;font-weight:800;">${escapeHtml(reportTitle)}</h1>
        <div style="font-size:12px;color:#475569;">Kỳ báo cáo: <strong>${escapeHtml(formatMonthLabelVN(selectedMonth))}</strong> · Kính gửi: <strong>Ban Giám Đốc</strong> (${escapeHtml(boardRecipients || 'Ban Giám Đốc')})</div>
      </div>
      <div style="text-align:right;font-size:12px;color:#475569;">
        <div>Trạng thái: <strong>${escapeHtml(reportStatus)}</strong></div>
        <div>Người lập: <strong>${escapeHtml(preparedBy || currentUser.tenNhanVien)}</strong></div>
        <div>Ngày xuất: ${escapeHtml(new Date().toLocaleDateString('vi-VN'))}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-label">Độ Sẵn Sàng Thiết Bị</div>
        <div class="kpi-val">${plantSnapshot.availabilityPct.toFixed(1)}%</div>
        <div class="kpi-sub">${plantSnapshot.activeEquipment}/${plantSnapshot.totalEquipment} thiết bị hoạt động</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Bảo Trì &amp; Sự Cố Tháng</div>
        <div class="kpi-val">${m.plannedCount + m.repairCount} lượt</div>
        <div class="kpi-sub">Định kỳ: ${m.plannedCount} · Sửa chữa: ${m.repairCount} · Dừng máy: ${m.downtimeHours.toFixed(1)}h</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Tổng Điện Năng (EVN + Solar)</div>
        <div class="kpi-val">${Math.round(m.totalEnergyKwh).toLocaleString('vi-VN')} kWh</div>
        <div class="kpi-sub">Solar: ${m.solarRatioPct.toFixed(1)}% · Tiết kiệm -${solarDiscountPct}%: ${escapeHtml(formatVND(m.solarDiscountAmount))}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Tổng OPEX Vận Hành</div>
        <div class="kpi-val">${escapeHtml(formatCompactMillions(m.totalOpexVND))}</div>
        <div class="kpi-sub">${escapeHtml(formatVND(m.totalOpexVND))} (~$${Math.round(m.totalOpexUSD).toLocaleString('en-US')})</div>
      </div>
    </div>

    <h2>1. Cơ Cấu Năng Lượng Điện 3 Khu Vực &amp; Nước</h2>
    <table>
      <thead>
        <tr>
          <th>Khu Vực / Hạng Mục</th>
          <th class="num">Sản Lượng</th>
          <th class="num">Tỷ Trọng</th>
          <th class="num">Chi Phí Phân Bổ (VNĐ)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Khu Vực Production (Sản Xuất)</td><td class="num">${Math.round(m.prodKwh).toLocaleString('vi-VN')} kWh</td><td class="num">${prodPct}%</td><td class="num">${escapeHtml(formatVND(m.prodKwh * m.avgCostPerKwh))}</td></tr>
        <tr><td>Khu Vực Utility (Phụ Trợ)</td><td class="num">${Math.round(m.utilKwh).toLocaleString('vi-VN')} kWh</td><td class="num">${utilPct}%</td><td class="num">${escapeHtml(formatVND(m.utilKwh * m.avgCostPerKwh))}</td></tr>
        <tr><td>Khu Vực Office (Văn Phòng)</td><td class="num">${Math.round(m.officeKwh).toLocaleString('vi-VN')} kWh</td><td class="num">${offPct}%</td><td class="num">${escapeHtml(formatVND(m.officeKwh * m.avgCostPerKwh))}</td></tr>
        <tr><td><strong>Tổng Điện (EVN + Solar giảm ${solarDiscountPct}%)</strong></td><td class="num"><strong>${Math.round(m.totalEnergyKwh).toLocaleString('vi-VN')} kWh</strong></td><td class="num"><strong>100%</strong></td><td class="num"><strong>${escapeHtml(formatVND(m.totalElectricityCost))}</strong></td></tr>
        <tr><td>Nước Sạch &amp; Xử Lý Nước Thải</td><td class="num">${m.waterM3.toLocaleString('vi-VN')} m³</td><td class="num">—</td><td class="num">${escapeHtml(formatVND(m.totalWaterCost))}</td></tr>
        <tr><td>Chi Phí Bảo Trì, Sửa Chữa &amp; Vật Tư</td><td class="num">${m.monthCosts.length} chứng từ</td><td class="num">—</td><td class="num">${escapeHtml(formatVND(m.maintenanceCostVND))}</td></tr>
      </tbody>
    </table>

    <h2>2. Điểm Nổi Bật &amp; Thành Tựu Trong Tháng</h2>
    <div class="box">${nl2br(highlights)}</div>

    <h2>3. Sự Cố, Rủi Ro &amp; Tồn Đọng Cần Lưu Ý</h2>
    <div class="box">${nl2br(risksAndIssues)}</div>

    <h2>4. Kế Hoạch Trọng Tâm &amp; Đề Xuất Phê Duyệt Tháng Tới</h2>
    <div class="box">${nl2br(nextMonthPlan)}</div>

    ${
      directorFeedback.trim()
        ? `<h2>5. Ý Kiến Chỉ Đạo Của Ban Giám Đốc</h2><div class="box">${nl2br(directorFeedback)}</div>`
        : ''
    }

    <div class="sign-grid">
      <div><div><strong>NGƯỜI LẬP BÁO CÁO</strong></div><div style="color:#64748b;">(Ký và ghi rõ họ tên)</div><div class="sign-line">${escapeHtml(preparedBy || currentUser.tenNhanVien)}</div></div>
      <div><div><strong>KIỂM DUYỆT KỸ THUẬT</strong></div><div style="color:#64748b;">(Trưởng phòng Kỹ thuật)</div><div class="sign-line">${escapeHtml(reviewerName || 'Trưởng phòng Kỹ thuật')}</div></div>
      <div><div><strong>BAN GIÁM ĐỐC PHÊ DUYỆT</strong></div><div style="color:#64748b;">(Ký duyệt &amp; đóng dấu)</div><div class="sign-line">Ban Giám Đốc</div></div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BaoCao_Thang_${selectedMonth}_BGD.html`;
    a.click();
    URL.revokeObjectURL(url);
    showTransientNotice(`Đã tải xuống file báo cáo HTML kỳ ${formatMonthLabelVN(selectedMonth)}.`);
  };

  // Export Monthly Executive Summary CSV
  const handleExportCsv = () => {
    if (!allowExportCsv) return;
    const m = currentMetrics;
    const rows = [
      ['Hạng Mục', 'Giá Trị Kỳ Báo Cáo', 'Kỳ Trước', 'Đơn Vị / Ghi Chú'],
      ['Kỳ báo cáo', selectedMonth, prevMonth, reportStatus],
      ['Độ sẵn sàng thiết bị', plantSnapshot.availabilityPct.toFixed(1), '', `% (${plantSnapshot.activeEquipment}/${plantSnapshot.totalEquipment} TB)`],
      ['Bảo trì định kỳ hoàn thành', String(m.plannedCount), String(previousMetrics.plannedCount), 'lượt'],
      ['Sửa chữa đột xuất', String(m.repairCount), String(previousMetrics.repairCount), 'lượt'],
      ['Tổng thời gian dừng máy', m.downtimeHours.toFixed(1), previousMetrics.downtimeHours.toFixed(1), 'giờ'],
      ['Tickets tạo trong tháng', String(m.monthTickets.length), String(previousMetrics.monthTickets.length), `Hoàn thành: ${m.monthTicketsCompleted}`],
      ['Tổng điện tiêu thụ (EVN + Solar)', String(Math.round(m.totalEnergyKwh)), String(Math.round(previousMetrics.totalEnergyKwh)), 'kWh'],
      ['Điện lưới EVN', String(Math.round(m.totalEvnKwh)), String(Math.round(previousMetrics.totalEvnKwh)), 'kWh'],
      ['Điện mặt trời Solar', String(Math.round(m.totalSolarKwh)), String(Math.round(previousMetrics.totalSolarKwh)), `kWh (${m.solarRatioPct.toFixed(1)}%)`],
      ['Khu vực Production', String(Math.round(m.prodKwh)), String(Math.round(previousMetrics.prodKwh)), 'kWh'],
      ['Khu vực Utility', String(Math.round(m.utilKwh)), String(Math.round(previousMetrics.utilKwh)), 'kWh'],
      ['Khu vực Office', String(Math.round(m.officeKwh)), String(Math.round(previousMetrics.officeKwh)), 'kWh'],
      ['Chi phí điện EVN', String(Math.round(m.evnCost)), String(Math.round(previousMetrics.evnCost)), 'VNĐ'],
      [`Chi phí điện Solar (giảm ${solarDiscountPct}%)`, String(Math.round(m.solarCost)), String(Math.round(previousMetrics.solarCost)), `Tiết kiệm: ${Math.round(m.solarDiscountAmount)} VNĐ`],
      ['Nước tiêu thụ', String(m.waterM3), String(previousMetrics.waterM3), 'm3'],
      ['Chi phí Nước & Xử lý thải', String(Math.round(m.totalWaterCost)), String(Math.round(previousMetrics.totalWaterCost)), 'VNĐ'],
      ['Chi phí Bảo trì & Vật tư', String(Math.round(m.maintenanceCostVND)), String(Math.round(previousMetrics.maintenanceCostVND)), 'VNĐ'],
      ['Tổng OPEX Vận hành', String(Math.round(m.totalOpexVND)), String(Math.round(previousMetrics.totalOpexVND)), `VNĐ (~$${Math.round(m.totalOpexUSD)})`],
      ['Kế hoạch bảo trì quá hạn', String(plantSnapshot.overduePlans.length), '', 'hạng mục'],
      ['Hồ sơ kiểm định quá hạn/sắp hạn', String(plantSnapshot.inspectionAlertItems.length), '', 'hồ sơ'],
      ['Vật tư dưới tồn tối thiểu', String(plantSnapshot.lowStockParts.length), '', 'mã phụ tùng'],
      ['Yêu cầu mua sắm chờ duyệt', String(plantSnapshot.pendingPurchases.length), '', `${Math.round(plantSnapshot.pendingPurchasesValue)} VNĐ`],
    ];

    const csv = '\uFEFF' + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BaoCao_Thang_${selectedMonth}_BGD.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Saved report history sorted descending by month
  const savedReportHistory = useMemo(() => {
    return Object.values(monthlyBoardReports.reportsByMonth || {}).sort((a, b) =>
      b.month.localeCompare(a.month)
    );
  }, [monthlyBoardReports.reportsByMonth]);

  const energyDelta = computeDeltaPct(currentMetrics.totalEnergyKwh, previousMetrics.totalEnergyKwh);
  const waterDelta = computeDeltaPct(currentMetrics.waterM3, previousMetrics.waterM3);
  const opexDelta = computeDeltaPct(currentMetrics.totalOpexVND, previousMetrics.totalOpexVND);

  const zoneRows = useMemo(() => {
    const m = currentMetrics;
    const p = previousMetrics;
    const denom = m.totalZoneKwh || 1;
    const hrs = m.totalHours || 1;
    return [
      {
        name: 'Production (Sản Xuất)',
        subDesc: 'Máy móc SX · ACMV xưởng · Chiếu sáng xưởng',
        kwh: m.prodKwh,
        prevKwh: p.prodKwh,
        sharePct: m.totalZoneKwh > 0 ? (m.prodKwh / denom) * 100 : 0,
        kwhPerHour: m.totalHours > 0 ? m.prodKwh / hrs : 0,
        cost: m.prodKwh * m.avgCostPerKwh,
        color: '#8b5cf6',
      },
      {
        name: 'Utility (Phụ Trợ)',
        subDesc: 'Chiller · Máy nén khí · Bơm · Cooling Tower · Mini Chiller',
        kwh: m.utilKwh,
        prevKwh: p.utilKwh,
        sharePct: m.totalZoneKwh > 0 ? (m.utilKwh / denom) * 100 : 0,
        kwhPerHour: m.totalHours > 0 ? m.utilKwh / hrs : 0,
        cost: m.utilKwh * m.avgCostPerKwh,
        color: '#06b6d4',
      },
      {
        name: 'Office (Văn Phòng)',
        subDesc: 'ACMV văn phòng · Server IT · Chiếu sáng · Ổ cắm · Bếp/Canteen',
        kwh: m.officeKwh,
        prevKwh: p.officeKwh,
        sharePct: m.totalZoneKwh > 0 ? (m.officeKwh / denom) * 100 : 0,
        kwhPerHour: m.totalHours > 0 ? m.officeKwh / hrs : 0,
        cost: m.officeKwh * m.avgCostPerKwh,
        color: '#ec4899',
      },
    ];
  }, [currentMetrics, previousMetrics]);

  return (
    <div className="space-y-6 board-report-root">
      {/* Screen Header & Action Toolbar (hidden on print) */}
      <div className="no-print flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
            <FileBarChart2 className="w-4 h-4 shrink-0" />
            <span>{UI_TEXTS.tabs.monthlyReport.badge}</span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="text-slate-500 dark:text-slate-400 font-normal">
              Tổng hợp số liệu vận hành thực tế gửi Ban Giám Đốc
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
            {UI_TEXTS.tabs.monthlyReport.title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Kỳ đang xem: <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatMonthLabelVN(selectedMonth)}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Trạng thái:{' '}
              <strong
                className={
                  reportStatus === 'Đã gửi BGĐ'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : reportStatus === 'Đã duyệt nội bộ'
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-amber-600 dark:text-amber-400'
                }
              >
                {reportStatus}
              </strong>
            </span>
            {savedForSelectedMonth?.sentAt && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono">
                  Gửi lần cuối: {new Date(savedForSelectedMonth.sentAt).toLocaleString('vi-VN')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Period Switcher + Primary Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Month selector stepper */}
          <div className="inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            <button
              type="button"
              onClick={() => setSelectedMonth(getPreviousMonth(selectedMonth))}
              title="Tháng trước"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Chọn tháng báo cáo"
              className="px-2.5 py-1.5 text-xs font-bold font-mono bg-transparent text-slate-900 dark:text-slate-100 border-0 focus:outline-none cursor-pointer"
            >
              {!availableMonths.includes(selectedMonth) && (
                <option value={selectedMonth}>{formatMonthLabelVN(selectedMonth)}</option>
              )}
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthLabelVN(ym)}
                  {monthlyBoardReports.reportsByMonth?.[ym]?.status === 'Đã gửi BGĐ' ? ' (Đã gửi)' : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
              title="Tháng sau"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSaveReport()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-cyan-500" />
            <span>Lưu Báo Cáo</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-500" />
            <span>In / Xuất PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadHtmlReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileCode2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Tải File HTML</span>
          </button>

          {allowExportCsv && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Xuất CSV</span>
            </button>
          )}

          <button
            type="button"
            disabled={isSendingReport}
            onClick={() => void handleSendToBoard()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingReport ? 'Đang soạn gửi...' : 'Gửi Báo Cáo BGĐ'}</span>
          </button>
        </div>
      </div>

      {/* Transient Confirmation Banner */}
      {saveToast && (
        <div className="no-print flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <Check className="w-4 h-4 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Printable Executive Document Masthead (always visible on print, subtle executive header on screen) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 print-break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="text-[11px] font-bold tracking-wider uppercase text-cyan-600 dark:text-cyan-400">
              {UI_TEXTS.brand.appName} · BÁO CÁO ĐIỀU HÀNH ĐỊNH KỲ
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {reportTitle || `Báo Cáo Tổng Hợp Vận Hành, Bảo Trì & Năng Lượng — ${formatMonthLabelVN(selectedMonth)}`}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
              <span>Kính gửi: <strong className="text-slate-900 dark:text-slate-100">Ban Giám Đốc</strong></span>
              <span aria-hidden="true">·</span>
              <span>Kỳ báo cáo: <strong className="font-mono text-slate-900 dark:text-slate-100">{formatMonthLabelVN(selectedMonth)}</strong></span>
              <span aria-hidden="true">·</span>
              <span>So sánh đối chiếu: <span className="font-mono">{formatMonthLabelVN(prevMonth)}</span></span>
            </div>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 sm:text-right space-y-1 shrink-0">
            <div>Người lập: <strong className="text-slate-900 dark:text-slate-100">{preparedBy || currentUser.tenNhanVien}</strong></div>
            <div>Kiểm duyệt: <strong className="text-slate-900 dark:text-slate-100">{reviewerName || 'Trưởng phòng Kỹ thuật'}</strong></div>
            <div className="font-mono text-[11px]">
              Ngày tổng hợp: {new Date().toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>

        {/* 5 Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-4">
          {/* KPI 1: Availability */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Độ Sẵn Sàng Thiết Bị</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {plantSnapshot.availabilityPct.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {plantSnapshot.activeEquipment}/{plantSnapshot.totalEquipment} ổn định · {plantSnapshot.maintenanceEquipment} đang xử lý
            </div>
          </div>

          {/* KPI 2: Maintenance & Tickets */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Bảo Trì &amp; Sự Cố Tháng</span>
              <Wrench className="w-4 h-4 text-blue-500 shrink-0" />
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {currentMetrics.plannedCount + currentMetrics.repairCount}{' '}
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">lượt</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              PM: {currentMetrics.plannedCount} · Sửa: {currentMetrics.repairCount} · Dừng: {currentMetrics.downtimeHours.toFixed(1)}h
            </div>
          </div>

          {/* KPI 3: Electricity */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Tổng Điện Tiêu Thụ</span>
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {Math.round(currentMetrics.totalEnergyKwh).toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">kWh</span>
            </div>
            <div className="text-[11px] font-mono tabular-nums flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
              <span>Solar {currentMetrics.solarRatioPct.toFixed(1)}%</span>
              {energyDelta !== null && (
                <span className={energyDelta > 0 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                  {energyDelta >= 0 ? '+' : ''}{energyDelta.toFixed(1)}% MoM
                </span>
              )}
            </div>
          </div>

          {/* KPI 4: Water */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Nước &amp; Xử Lý Thải</span>
              <Droplets className="w-4 h-4 text-cyan-500 shrink-0" />
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {currentMetrics.waterM3.toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">m³</span>
            </div>
            <div className="text-[11px] font-mono tabular-nums flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
              <span>{formatCompactMillions(currentMetrics.totalWaterCost)}</span>
              {waterDelta !== null && (
                <span className={waterDelta > 0 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                  {waterDelta >= 0 ? '+' : ''}{waterDelta.toFixed(1)}% MoM
                </span>
              )}
            </div>
          </div>

          {/* KPI 5: Total OPEX */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Tổng OPEX Tháng</span>
              <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCompactMillions(currentMetrics.totalOpexVND)}
            </div>
            <div className="text-[11px] font-mono tabular-nums flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
              <span>~${Math.round(currentMetrics.totalOpexUSD).toLocaleString('en-US')}</span>
              {opexDelta !== null && (
                <span className={opexDelta > 0 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                  {opexDelta >= 0 ? '+' : ''}{opexDelta.toFixed(1)}% MoM
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Executive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch print-break-inside-avoid">
        {/* Chart 1: 6-Month Energy Trend by Zone */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                1. Xu Hướng Điện Năng 6 Tháng Theo Khu Vực
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Phân bổ phụ tải Production · Utility · Office (kWh/tháng)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
              {sixMonthEnergyTrend[0]?.label} — {sixMonthEnergyTrend[sixMonthEnergyTrend.length - 1]?.label}
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sixMonthEnergyTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#1e293b' : '#e2e8f0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: isDark ? '#94a3b8' : '#475569', fontSize: 11 }}
                  axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: isDark ? '#94a3b8' : '#475569', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                />
                <Tooltip
                  content={<ReportChartTooltip isDark={isDark} unit="kWh" />}
                  cursor={{ fill: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.04)' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="Utility" stackId="zone" fill="#06b6d4" radius={[0, 0, 0, 0]} maxBarSize={42} />
                <Bar dataKey="Production" stackId="zone" fill="#8b5cf6" radius={[0, 0, 0, 0]} maxBarSize={42} />
                <Bar dataKey="Office" stackId="zone" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly OPEX Breakdown vs Previous Month */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                2. Đối Chiếu Cơ Cấu Chi Phí Vận Hành (OPEX)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {formatMonthLabelVN(selectedMonth)} so với {formatMonthLabelVN(prevMonth)} (VNĐ · Solar đã giảm {solarDiscountPct}%)
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0 tabular-nums">
              {formatVND(currentMetrics.totalOpexVND)}
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costComparisonData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#1e293b' : '#e2e8f0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: isDark ? '#94a3b8' : '#475569', fontSize: 11 }}
                  axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: isDark ? '#94a3b8' : '#475569', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1_000_000 ? `${Math.round(v / 1_000_000)}tr` : String(v))}
                />
                <Tooltip
                  content={<ReportChartTooltip isDark={isDark} unit="VND" />}
                  cursor={{ fill: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.04)' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar
                  dataKey="previous"
                  name={formatMonthLabelVN(prevMonth)}
                  fill={isDark ? '#475569' : '#94a3b8'}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="current"
                  name={formatMonthLabelVN(selectedMonth)}
                  fill="#0284c7"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 3: Detailed Energy (3 Zones) & Water Summary Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 print-break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              3. Chi Tiết Tiêu Thụ Năng Lượng 3 Khu Vực &amp; Nước — {formatMonthLabelVN(selectedMonth)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tổng hợp từ {currentMetrics.powerCycles} chu kỳ điện 10 ngày ({currentMetrics.totalWorkDays} ngày làm việc · {currentMetrics.totalHours.toLocaleString('vi-VN')} giờ vận hành) và dữ liệu nước tháng
            </p>
          </div>
          <div className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold shrink-0 tabular-nums">
            Tiết kiệm Solar (-{solarDiscountPct}%): {formatVND(currentMetrics.solarDiscountAmount)}
          </div>
        </div>

        <SmartHorizontalScroll>
          <table className="w-full text-xs border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <th className="py-2.5 px-3 text-left font-bold">Khu Vực / Nguồn Năng Lượng</th>
                <th className="py-2.5 px-3 text-right font-bold">Sản Lượng Tháng</th>
                <th className="py-2.5 px-3 text-right font-bold">Tỷ Trọng</th>
                <th className="py-2.5 px-3 text-right font-bold">Bình Quân (kWh/h)</th>
                <th className="py-2.5 px-3 text-right font-bold">So Tháng Trước</th>
                <th className="py-2.5 px-3 text-right font-bold">Chi Phí Phân Bổ (VNĐ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {zoneRows.map((row) => {
                const delta = computeDeltaPct(row.kwh, row.prevKwh);
                return (
                  <tr key={row.name}>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{row.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{row.subDesc}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {Math.round(row.kwh).toLocaleString('vi-VN')} kWh
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {row.sharePct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {row.kwhPerHour.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {delta === null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span className={delta > 0 ? 'text-rose-500 font-semibold' : 'text-emerald-500 font-semibold'}>
                          {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatVND(row.cost)}
                    </td>
                  </tr>
                );
              })}

              {/* Summary electricity + water rows */}
              <tr className="bg-slate-50/90 dark:bg-slate-800/40 font-semibold">
                <td className="py-2.5 px-3 text-slate-900 dark:text-slate-100">
                  Tổng Điện Nhà Máy (EVN: {Math.round(currentMetrics.totalEvnKwh).toLocaleString('vi-VN')} · Solar: {Math.round(currentMetrics.totalSolarKwh).toLocaleString('vi-VN')} kWh)
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
                  {Math.round(currentMetrics.totalEnergyKwh).toLocaleString('vi-VN')} kWh
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums">100.0%</td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                  {currentMetrics.totalHours > 0
                    ? (currentMetrics.totalEnergyKwh / currentMetrics.totalHours).toFixed(1)
                    : '0.0'}
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                  {energyDelta !== null ? (
                    <span className={energyDelta > 0 ? 'text-rose-500' : 'text-emerald-500'}>
                      {energyDelta >= 0 ? '+' : ''}{energyDelta.toFixed(1)}%
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatVND(currentMetrics.totalElectricityCost)}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                  Nước Sạch ({formatVND(currentMetrics.waterVND)}) &amp; Xử Lý Nước Thải ({formatVND(currentMetrics.sewageVND)})
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-cyan-600 dark:text-cyan-400">
                  {currentMetrics.waterM3.toLocaleString('vi-VN')} m³
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">—</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">—</td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                  {waterDelta !== null ? (
                    <span className={waterDelta > 0 ? 'text-rose-500 font-semibold' : 'text-emerald-500 font-semibold'}>
                      {waterDelta >= 0 ? '+' : ''}{waterDelta.toFixed(1)}%
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-cyan-600 dark:text-cyan-400">
                  {formatVND(currentMetrics.totalWaterCost)}
                </td>
              </tr>
            </tbody>
          </table>
        </SmartHorizontalScroll>
      </div>

      {/* Section 4: Maintenance, Tickets, Morning Checks & Safety Inspections (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch print-break-inside-avoid">
        {/* Maintenance & Tickets */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-500 shrink-0" />
              <span>4. Hiệu Suất Bảo Trì &amp; Sự Cố (Tickets)</span>
            </h3>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              {currentMetrics.monthTickets.length} ticket tháng · {currentMetrics.openTicketsAll.length} đang mở
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">BT Định Kỳ</div>
              <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                {currentMetrics.plannedCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Sửa Đột Xuất</div>
              <div className="text-lg font-extrabold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
                {currentMetrics.repairCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">BT Quá Hạn</div>
              <div className={`text-lg font-extrabold font-mono tabular-nums mt-0.5 ${plantSnapshot.overduePlans.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {plantSnapshot.overduePlans.length}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Giờ Dừng Máy</div>
              <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                {currentMetrics.downtimeHours.toFixed(1)}h
              </div>
            </div>
          </div>

          {/* Open / Critical Tickets list */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tickets Trọng Điểm Trong Tháng / Đang Xử Lý
            </div>
            {currentMetrics.monthTickets.length === 0 && currentMetrics.openTicketsAll.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
                Không có sự cố tồn đọng hoặc ticket phát sinh trong kỳ báo cáo.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {(currentMetrics.monthTickets.length > 0
                  ? currentMetrics.monthTickets
                  : currentMetrics.openTicketsAll
                )
                  .slice(0, 5)
                  .map((t) => (
                    <div key={t.maTicket} className="px-3 py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          <span className="font-mono text-cyan-600 dark:text-cyan-400 mr-1.5">{t.maTicket}</span>
                          {t.tieuDe}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {t.nguoiPhuTrach} · {formatDateVN(t.ngayTao)} · Ưu tiên: {t.mucDoUuTien}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-bold shrink-0 whitespace-nowrap ${
                          t.trangThai === 'Hoàn thành'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : t.mucDoUuTien === 'Khẩn cấp'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {t.trangThai}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Safety Inspections, Morning Area Checks & Operational Compliance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <span>5. Kiểm Định An Toàn &amp; Kiểm Tra Đầu Ngày</span>
            </h3>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              {plantSnapshot.inspectionAlertItems.length} cảnh báo kiểm định
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Kiểm Tra Đầu Ngày</div>
              <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                {currentMetrics.morningCompleted}/{currentMetrics.monthMorningChecks.length}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Phát Hiện Bất Thường</div>
              <div className={`text-lg font-extrabold font-mono tabular-nums mt-0.5 ${currentMetrics.morningIssues > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {currentMetrics.morningIssues}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">KĐ Quá Hạn / Sắp Hạn</div>
              <div className={`text-lg font-extrabold font-mono tabular-nums mt-0.5 ${plantSnapshot.inspectionAlertItems.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {plantSnapshot.inspectionAlertItems.length}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Hồ Sơ Kiểm Định / Hiệu Chuẩn Cần Chú Ý
            </div>
            {plantSnapshot.inspectionAlertItems.length === 0 ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 py-3">
                Tất cả hồ sơ kiểm định an toàn &amp; hiệu chuẩn thiết bị đều đang còn hạn hợp lệ.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {plantSnapshot.inspectionAlertItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="px-3 py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.tenThietBi}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.phanLoai} · Hết hạn: <span className="font-mono">{formatDateVN(item.ngayHetHan)}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-bold shrink-0 whitespace-nowrap ${
                        item.computedStatus === 'Quá hạn'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {item.computedStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 6: Projects Portfolio, Inventory & Pending Board Purchase Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch print-break-inside-avoid">
        {/* Active Projects */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>6. Tiến Độ Dự Án Hạ Tầng &amp; Cải Tạo</span>
            </h3>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              {plantSnapshot.activeProjects.length} đang chạy · {plantSnapshot.completedProjects.length} hoàn thành
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Tổng Ngân Sách Dự Án</div>
              <div className="text-base font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                {formatVND(plantSnapshot.totalProjectBudget)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Đã Giải Ngân / Thực Chi</div>
              <div className="text-base font-extrabold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-0.5">
                {formatVND(plantSnapshot.totalProjectActual)}
              </div>
            </div>
          </div>

          {projects.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">Chưa có dự án nào được ghi nhận.</p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {projects.slice(0, 5).map((proj) => {
                const progress = calculateProjectProgress(proj);
                return (
                  <div key={proj.id} className="px-3 py-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-1.5">{proj.maDuAn}</span>
                        {proj.tenDuAn}
                      </span>
                      <span className="font-mono font-bold tabular-nums text-slate-700 dark:text-slate-300 shrink-0">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{proj.trangThai} · PM: {proj.quanLyDuAn}</span>
                      <span className="font-mono tabular-nums">
                        {formatCompactMillions(proj.chiPhiThucTe)} / {formatCompactMillions(proj.nganSachDuKien)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inventory & Pending Purchase Requests */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-500 shrink-0" />
              <span>7. Kho Phụ Tùng &amp; Đề Xuất Mua Sắm Chờ Duyệt</span>
            </h3>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              {plantSnapshot.pendingPurchases.length} phiếu chờ duyệt
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Giá Trị Tồn Kho</div>
              <div className="text-base font-extrabold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                {formatCompactMillions(plantSnapshot.totalInventoryValue)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Dưới Tồn Tối Thiểu</div>
              <div className={`text-base font-extrabold font-mono tabular-nums mt-0.5 ${plantSnapshot.lowStockParts.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {plantSnapshot.lowStockParts.length} mã
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Dự Toán Chờ Duyệt</div>
              <div className="text-base font-extrabold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
                {formatCompactMillions(plantSnapshot.pendingPurchasesValue)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Danh Sách Đề Xuất Mua Vật Tư / Dụng Cụ Trình Duyệt
            </div>
            {plantSnapshot.pendingPurchases.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
                Không có phiếu đề xuất mua sắm nào đang chờ phê duyệt.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {plantSnapshot.pendingPurchases.slice(0, 5).map((req) => {
                  const estTotal = (Number(req.soLuong) || 0) * (Number(req.donGiaDuKien) || 0);
                  return (
                    <div key={req.id} className="px-3 py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          <span className="font-mono text-purple-600 dark:text-purple-400 mr-1.5">{req.maPhieu}</span>
                          {req.tenMatHang}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          SL: {req.soLuong} {req.donViTinh} · Người đề xuất: {req.nguoiYeuCau} · Mức: {req.mucDoUuTien}
                        </div>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-slate-800 dark:text-slate-200 shrink-0">
                        {estTotal > 0 ? formatVND(estTotal) : 'Chờ báo giá'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 8: Editable Executive Commentary & Board Dispatch Settings */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 print-break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              8. Nhận Xét Điều Hành, Đề Xuất &amp; Thông Tin Gửi Ban Giám Đốc
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chỉnh sửa nội dung trình ký trước khi gửi email hoặc in PDF nộp Ban Giám Đốc (tự đồng bộ đám mây)
            </p>
          </div>
          <button
            type="button"
            onClick={handleRegenerateAutoDraft}
            className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
            <span>Tạo Nháp Tự Động Từ Số Liệu</span>
          </button>
        </div>

        {/* Metadata inputs (Screen only — printed neatly in header & signature block) */}
        <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">
              Tiêu đề báo cáo tháng
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">
              Người lập báo cáo
            </label>
            <input
              type="text"
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">
              Trạng thái phê duyệt
            </label>
            <select
              value={reportStatus}
              onChange={(e) => setReportStatus(e.target.value as MonthlyBoardReportStatus)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold"
            >
              <option value="Bản nháp">Bản nháp</option>
              <option value="Đã duyệt nội bộ">Đã duyệt nội bộ</option>
              <option value="Đã gửi BGĐ">Đã gửi BGĐ</option>
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">
              Email Ban Giám Đốc (To) — phân cách bằng dấu phẩy
            </label>
            <input
              type="text"
              value={boardRecipients}
              onChange={(e) => setBoardRecipients(e.target.value)}
              placeholder="director@company.com, bgd@company.com"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">
              Đồng kính gửi (CC)
            </label>
            <input
              type="text"
              value={ccRecipients}
              onChange={(e) => setCcRecipients(e.target.value)}
              placeholder="manager@company.com"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">
              Người kiểm duyệt kỹ thuật
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs"
            />
          </div>
        </div>

        {/* 3 Narrative Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200 block">
              A. Thành Tựu &amp; Điểm Nổi Bật Trong Tháng
            </label>
            <textarea
              rows={6}
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              className="no-print w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs leading-relaxed"
            />
            <div className="hidden print:block whitespace-pre-line text-xs text-slate-800 border border-slate-300 rounded-lg p-3 leading-relaxed">
              {highlights || '—'}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200 block">
              B. Sự Cố, Rủi Ro &amp; Tồn Đọng Cần Lưu Ý
            </label>
            <textarea
              rows={6}
              value={risksAndIssues}
              onChange={(e) => setRisksAndIssues(e.target.value)}
              className="no-print w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs leading-relaxed"
            />
            <div className="hidden print:block whitespace-pre-line text-xs text-slate-800 border border-slate-300 rounded-lg p-3 leading-relaxed">
              {risksAndIssues || '—'}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200 block">
              C. Kế Hoạch Trọng Tâm &amp; Đề Xuất Tháng Tới
            </label>
            <textarea
              rows={6}
              value={nextMonthPlan}
              onChange={(e) => setNextMonthPlan(e.target.value)}
              className="no-print w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs leading-relaxed"
            />
            <div className="hidden print:block whitespace-pre-line text-xs text-slate-800 border border-slate-300 rounded-lg p-3 leading-relaxed">
              {nextMonthPlan || '—'}
            </div>
          </div>
        </div>

        {/* Director Feedback Box */}
        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-slate-800 dark:text-slate-200 block">
            D. Ghi Nhận Ý Kiến Chỉ Đạo Của Ban Giám Đốc (tùy chọn)
          </label>
          <textarea
            rows={2}
            value={directorFeedback}
            onChange={(e) => setDirectorFeedback(e.target.value)}
            placeholder="Ghi nhận chỉ đạo / phản hồi của Ban Giám Đốc sau buổi họp giao ban tháng..."
            className="no-print w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs leading-relaxed"
          />
          {directorFeedback.trim() && (
            <div className="hidden print:block whitespace-pre-line text-xs text-slate-800 border border-slate-300 rounded-lg p-3 leading-relaxed">
              {directorFeedback}
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            {!boardRecipients.trim() ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Chưa nhập email người nhận BGĐ — bạn vẫn có thể chỉnh sửa trực tiếp khi bấm Gửi Báo Cáo.</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-cyan-500 shrink-0" />
                <span>Sẵn sàng gửi trực tiếp qua hệ thống email tích hợp hoặc xuất bản PDF/HTML gửi đính kèm.</span>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveReport('Đã duyệt nội bộ')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition whitespace-nowrap cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Lưu &amp; Duyệt Nội Bộ</span>
            </button>
            <button
              type="button"
              disabled={isSendingReport}
              onClick={() => void handleSendToBoard()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi Email Trình Ban Giám Đốc</span>
            </button>
          </div>
        </div>

        {/* Print-Only Formal Signature Block */}
        <div className="hidden print:grid grid-cols-3 gap-8 pt-8 mt-6 border-t border-slate-300 text-center text-xs text-slate-900">
          <div>
            <div className="font-bold uppercase">Người Lập Báo Cáo</div>
            <div className="text-[11px] text-slate-500 mt-0.5">(Ký và ghi rõ họ tên)</div>
            <div className="mt-16 font-bold">{preparedBy || currentUser.tenNhanVien}</div>
          </div>
          <div>
            <div className="font-bold uppercase">Kiểm Duyệt Kỹ Thuật</div>
            <div className="text-[11px] text-slate-500 mt-0.5">(Trưởng phòng Kỹ thuật)</div>
            <div className="mt-16 font-bold">{reviewerName || 'Trưởng phòng Kỹ thuật'}</div>
          </div>
          <div>
            <div className="font-bold uppercase">Ban Giám Đốc Phê Duyệt</div>
            <div className="text-[11px] text-slate-500 mt-0.5">(Ký duyệt &amp; đóng dấu)</div>
            <div className="mt-16 font-bold">Ban Giám Đốc</div>
          </div>
        </div>
      </div>

      {/* Section 9: Saved & Sent Board Report Archive (Screen only) */}
      <div className="no-print p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Lịch Sử Báo Cáo Tháng Đã Lưu &amp; Đã Gửi Ban Giám Đốc
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Lưu trữ các kỳ báo cáo đã lập để tra cứu nhanh hoặc gửi lại khi cần
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            {savedReportHistory.length} kỳ đã lưu
          </span>
        </div>

        {savedReportHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Chưa có kỳ báo cáo nào được lưu trữ. Nhấn <strong>Lưu Báo Cáo</strong> hoặc <strong>Gửi Báo Cáo BGĐ</strong> để lưu bản đầu tiên.
          </div>
        ) : (
          <SmartHorizontalScroll>
            <table className="w-full text-xs border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <th className="py-2.5 px-3 text-left font-bold">Kỳ Báo Cáo</th>
                  <th className="py-2.5 px-3 text-left font-bold">Tiêu Đề</th>
                  <th className="py-2.5 px-3 text-left font-bold">Người Lập</th>
                  <th className="py-2.5 px-3 text-left font-bold">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-left font-bold">Gửi Lần Cuối</th>
                  <th className="py-2.5 px-3 text-right font-bold">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {savedReportHistory.map((item) => (
                  <tr
                    key={item.month}
                    className={
                      item.month === selectedMonth
                        ? 'bg-cyan-50/60 dark:bg-cyan-950/25'
                        : undefined
                    }
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatMonthLabelVN(item.month)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {item.reportTitle}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {item.preparedBy}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          item.status === 'Đã gửi BGĐ'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : item.status === 'Đã duyệt nội bộ'
                            ? 'text-cyan-600 dark:text-cyan-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {item.status}
                        {item.sentCount && item.sentCount > 1 ? ` (${item.sentCount} lần)` : ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {item.sentAt
                        ? new Date(item.sentAt).toLocaleString('vi-VN')
                        : `Lưu ${new Date(item.updatedAt).toLocaleDateString('vi-VN')}`}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedMonth(item.month)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Mở xem</span>
                        </button>
                        {adminUser && (
                          <button
                            type="button"
                            onClick={() => deleteMonthlyBoardReport(item.month)}
                            title="Xóa bản lưu kỳ này"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/15 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SmartHorizontalScroll>
        )}
      </div>
    </div>
  );
};
