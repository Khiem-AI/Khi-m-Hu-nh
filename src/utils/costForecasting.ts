import {
  CostRecord,
  Equipment,
  MaintenanceHistory,
  MaintenancePlan,
  SafetyInspectionItem,
  SparePart,
  StockTransaction,
} from '../types/cmms';
import { calculateNextMaintenanceDate, getHistoryWorkType } from './cmmsLogic';

export interface MonthlyCostPoint {
  index: number; // 0..11
  monthKey: string; // YYYY-MM
  label: string; // MM/YY
  fullLabel: string; // Tháng MM/YYYY
  isForecast: boolean;
  // Historical breakdown (when !isForecast)
  actualScheduledCost: number;
  actualConsumptionCost: number;
  actualTotal: number | null;
  // Forecast breakdown (when isForecast)
  forecastCycleCost: number;
  forecastInspectionCost: number;
  forecastConsumptionCost: number;
  forecastTotal: number | null;
  confidenceLow: number | null;
  confidenceHigh: number | null;
  // Linear OLS trend line across active points
  trendValue: number;
  // Operational drivers
  plannedTaskCount: number;
  inspectionDueCount: number;
  topDrivers: {
    code: string;
    name: string;
    estimatedCost: number;
    type: 'Bảo trì chu kỳ' | 'Kiểm định an toàn';
  }[];
}

export interface CostForecastSummary {
  timeline: MonthlyCostPoint[]; // 6 historical + 6 forecast months
  forecastMonths: MonthlyCostPoint[];
  total6MonthForecast: number;
  avgMonthlyForecast: number;
  avgMonthlyHistorical: number;
  deltaVsHistoricalPct: number;
  peakForecastMonth: MonthlyCostPoint | null;
  totalCycleSharePct: number;
  totalConsumptionSharePct: number;
  trendSlopePerMonth: number; // Linear slope (VNĐ/month)
  trendDirection: 'up' | 'down' | 'stable';
  activeHistoricalMonthsCount: number;
  avgMonthlyPartsConsumption: number;
  avgMonthlyCorrectiveRepair: number;
}

export interface ForecastOptions {
  anchorMonth?: string; // YYYY-MM, defaults to '2026-11'
  lookbackMonths?: 3 | 6;
  contingencyPct?: number; // 0, 10, 20
  includeSafetyInspections?: boolean;
}

function addMonthsYM(ym: string, offset: number): string {
  const [yStr, mStr] = ym.split('-');
  const d = new Date(Number(yStr), Number(mStr) - 1 + offset, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatShortMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return `${m}/${y.slice(2)}`;
}

function formatFullMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return `Tháng ${m}/${y}`;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeLinearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
} {
  if (points.length < 2) {
    const y0 = points[0]?.y ?? 0;
    return { slope: 0, intercept: y0 };
  }
  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-9) {
    return { slope: 0, intercept: sumY / n };
  }

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function getDefaultCycleUnitCost(frequency: string, heThong?: string): number {
  const f = (frequency || '').toLowerCase();
  const sys = (heThong || '').toLowerCase();
  const isHeavySystem =
    sys.includes('chiller') ||
    sys.includes('lạnh') ||
    sys.includes('khí nén') ||
    sys.includes('điện') ||
    sys.includes('solar');

  if (f === 'daily' || f === 'hàng ngày') return 60000;
  if (f === 'weekly' || f === 'hàng tuần') return 180000;
  if (f === 'quarterly' || f === 'hàng quý') return isHeavySystem ? 2200000 : 1400000;
  if (f === 'yearly' || f === 'hàng năm') return isHeavySystem ? 6500000 : 3800000;
  return isHeavySystem ? 650000 : 450000; // Monthly default aligned with CMMS history
}

export function buildSixMonthCostForecast(
  params: {
    costRecords: CostRecord[];
    maintenanceHistory: MaintenanceHistory[];
    maintenancePlans: MaintenancePlan[];
    equipment: Equipment[];
    spareParts: SparePart[];
    stockTransactions: StockTransaction[];
    safetyInspections: SafetyInspectionItem[];
  },
  options: ForecastOptions = {}
): CostForecastSummary {
  const {
    costRecords,
    maintenanceHistory,
    maintenancePlans,
    equipment,
    spareParts,
    stockTransactions,
    safetyInspections,
  } = params;

  const anchorMonth = options.anchorMonth || '2026-11';
  const lookbackMonths = options.lookbackMonths ?? 6;
  const contingencyMultiplier = 1 + (options.contingencyPct ?? 10) / 100;
  const includeSafetyInspections = options.includeSafetyInspections ?? true;

  // Lookup maps
  const equipmentMap = new Map<string, Equipment>();
  equipment.forEach((eq) => equipmentMap.set(eq.maThietBi, eq));

  const sparePartPriceMap = new Map<string, number>();
  spareParts.forEach((sp) => sparePartPriceMap.set(sp.maVatTu, sp.donGia || 0));

  // Per-equipment average historical execution cost
  const eqHistoryCostAgg = new Map<string, { sum: number; count: number }>();
  maintenanceHistory.forEach((h) => {
    const cost = Number(h.chiPhiUocTinh) || 0;
    if (cost > 0) {
      const prev = eqHistoryCostAgg.get(h.maThietBi) || { sum: 0, count: 0 };
      eqHistoryCostAgg.set(h.maThietBi, { sum: prev.sum + cost, count: prev.count + 1 });
    }
  });

  // Historical invoice lookup by equipment+month to prevent double-counting same PM event
  const invoicedRefMonths = new Set<string>();
  costRecords.forEach((c) => {
    const ym = (c.ngayGhiNhan || '').slice(0, 7);
    if (ym && c.thamChieu) {
      invoicedRefMonths.add(`${c.thamChieu}::${ym}`);
    }
  });

  // Average inspection cost from historical cost records (fallback 6,200,000 VND)
  const inspectionInvoices = costRecords.filter((c) => c.phanLoai === 'Kiểm định an toàn');
  const avgInspectionCost =
    inspectionInvoices.length > 0
      ? Math.round(
          inspectionInvoices.reduce((s, c) => s + c.soTienVND, 0) / inspectionInvoices.length
        )
      : 6200000;

  // 1. Build 6 historical months: [anchor - 5 .. anchor]
  const historicalMonthKeys: string[] = [];
  for (let i = -5; i <= 0; i++) {
    historicalMonthKeys.push(addMonthsYM(anchorMonth, i));
  }

  const historicalPoints: MonthlyCostPoint[] = historicalMonthKeys.map((ym, idx) => {
    let actualScheduledCost = 0;
    let actualConsumptionCost = 0;
    let plannedTaskCount = 0;

    // A) Cost Records in month
    costRecords.forEach((c) => {
      if ((c.ngayGhiNhan || '').slice(0, 7) !== ym) return;
      if (c.phanLoai === 'Bảo trì định kỳ' || c.phanLoai === 'Kiểm định an toàn') {
        actualScheduledCost += c.soTienVND || 0;
      } else {
        actualConsumptionCost += c.soTienVND || 0;
      }
    });

    // B) Stock Consumption (Xuất kho sử dụng) in month
    stockTransactions.forEach((tx) => {
      if ((tx.ngay || '').slice(0, 7) !== ym) return;
      if (tx.loaiGD === 'Xuất kho sử dụng') {
        const unitPrice = tx.donGiaSnapshot ?? sparePartPriceMap.get(tx.maVatTu) ?? 0;
        actualConsumptionCost += Math.max(0, tx.soLuong || 0) * unitPrice;
      }
    });

    // C) Maintenance History execution estimates (excluding already invoiced ref in same month)
    maintenanceHistory.forEach((h) => {
      if ((h.ngayThucHien || '').slice(0, 7) !== ym) return;
      const workType = getHistoryWorkType(h);
      if (workType === 'Bảo trì theo kế hoạch') {
        plannedTaskCount += 1;
      }
      const alreadyInvoiced = invoicedRefMonths.has(`${h.maThietBi}::${ym}`);
      const est = Number(h.chiPhiUocTinh) || 0;
      if (!alreadyInvoiced && est > 0) {
        if (workType === 'Bảo trì theo kế hoạch') {
          actualScheduledCost += est;
        } else {
          actualConsumptionCost += est;
        }
      }
    });

    const total = actualScheduledCost + actualConsumptionCost;
    return {
      index: idx,
      monthKey: ym,
      label: formatShortMonth(ym),
      fullLabel: formatFullMonth(ym),
      isForecast: false,
      actualScheduledCost: Math.round(actualScheduledCost),
      actualConsumptionCost: Math.round(actualConsumptionCost),
      actualTotal: total > 0 ? Math.round(total) : 0,
      forecastCycleCost: 0,
      forecastInspectionCost: 0,
      forecastConsumptionCost: 0,
      forecastTotal: null,
      confidenceLow: null,
      confidenceHigh: null,
      trendValue: 0,
      plannedTaskCount,
      inspectionDueCount: 0,
      topDrivers: [],
    };
  });

  // Extract active lookback window for consumption baseline
  const lookbackSlice = historicalPoints.slice(Math.max(0, historicalPoints.length - lookbackMonths));
  const activeLookback = lookbackSlice.filter((p) => (p.actualTotal || 0) > 0);
  const activeAllHistorical = historicalPoints.filter((p) => (p.actualTotal || 0) > 0);

  // Separate parts consumption & corrective repair monthly rates
  const monthlyPartsValues: number[] = [];
  const monthlyRepairValues: number[] = [];

  lookbackSlice.forEach((hp) => {
    const ym = hp.monthKey;
    let partsVal = 0;
    let repairVal = 0;

    stockTransactions.forEach((tx) => {
      if ((tx.ngay || '').slice(0, 7) === ym && tx.loaiGD === 'Xuất kho sử dụng') {
        partsVal += (tx.soLuong || 0) * (tx.donGiaSnapshot ?? sparePartPriceMap.get(tx.maVatTu) ?? 0);
      }
    });
    costRecords.forEach((c) => {
      if ((c.ngayGhiNhan || '').slice(0, 7) !== ym) return;
      if (c.phanLoai === 'Mua vật tư thay thế') partsVal += c.soTienVND || 0;
      else if (
        c.phanLoai === 'Sửa chữa đột xuất' ||
        c.phanLoai === 'Dịch vụ ngoài' ||
        c.phanLoai === 'Khác'
      ) {
        repairVal += c.soTienVND || 0;
      }
    });
    maintenanceHistory.forEach((h) => {
      if ((h.ngayThucHien || '').slice(0, 7) !== ym) return;
      if (getHistoryWorkType(h) === 'Sửa chữa' && !invoicedRefMonths.has(`${h.maThietBi}::${ym}`)) {
        repairVal += Number(h.chiPhiUocTinh) || 0;
      }
    });

    if (partsVal > 0 || repairVal > 0 || (hp.actualTotal || 0) > 0) {
      monthlyPartsValues.push(partsVal);
      monthlyRepairValues.push(repairVal);
    }
  });

  // Blended average + median to dampen single-month one-off procurement spikes (e.g. RO membranes)
  const calcRobustMonthly = (vals: number[]): number => {
    const nonZero = vals.filter((v) => v > 0);
    if (nonZero.length === 0) return 0;
    const mean = nonZero.reduce((s, v) => s + v, 0) / nonZero.length;
    const med = median(nonZero);
    return Math.round(0.55 * mean + 0.45 * med);
  };

  const avgMonthlyPartsConsumption = calcRobustMonthly(monthlyPartsValues);
  const avgMonthlyCorrectiveRepair = calcRobustMonthly(monthlyRepairValues);

  const consumptionSeries = activeLookback.map((p) => p.actualConsumptionCost).filter((v) => v > 0);
  const baseMonthlyConsumption =
    consumptionSeries.length > 0
      ? Math.round(
          0.55 * (consumptionSeries.reduce((s, v) => s + v, 0) / consumptionSeries.length) +
            0.45 * median(consumptionSeries)
        )
      : 4500000;

  // Historical consumption slope
  const consumptionRegPoints = activeLookback.map((p, idx) => ({
    x: idx,
    y: p.actualConsumptionCost,
  }));
  const { slope: rawConsumptionSlope } = computeLinearRegression(consumptionRegPoints);
  // Clamp gentle monthly drift to +/- 8% of baseline per step to prevent runaway extrapolation
  const dampenedConsumptionSlope = Math.max(
    -baseMonthlyConsumption * 0.08,
    Math.min(baseMonthlyConsumption * 0.08, rawConsumptionSlope * 0.3)
  );

  // 2. Build 6 forecast months: [anchor + 1 .. anchor + 6]
  const forecastMonthKeys: string[] = [];
  for (let i = 1; i <= 6; i++) {
    forecastMonthKeys.push(addMonthsYM(anchorMonth, i));
  }
  const forecastStartYM = forecastMonthKeys[0];
  const forecastEndYM = forecastMonthKeys[forecastMonthKeys.length - 1];

  // Bucket scheduled PM cycles & safety inspections into future months
  const forecastBuckets = new Map<
    string,
    {
      cycleCost: number;
      inspectionCost: number;
      plannedTaskCount: number;
      inspectionDueCount: number;
      drivers: {
        code: string;
        name: string;
        estimatedCost: number;
        type: 'Bảo trì chu kỳ' | 'Kiểm định an toàn';
      }[];
    }
  >();
  forecastMonthKeys.forEach((ym) => {
    forecastBuckets.set(ym, {
      cycleCost: 0,
      inspectionCost: 0,
      plannedTaskCount: 0,
      inspectionDueCount: 0,
      drivers: [],
    });
  });

  // Walk each MaintenancePlan over the next 6 months using its frequency cycle
  maintenancePlans.forEach((plan) => {
    const eq = equipmentMap.get(plan.maThietBi);
    const agg = eqHistoryCostAgg.get(plan.maThietBi);
    const baseUnitCost = agg
      ? Math.round(agg.sum / agg.count)
      : getDefaultCycleUnitCost(plan.tanSuat, eq?.heThong);

    // Check if there is an invoice baseline specifically for this asset's periodic maintenance
    const assetPMInvoice = costRecords.find(
      (c) => c.thamChieu === plan.maThietBi && c.phanLoai === 'Bảo trì định kỳ'
    );
    const unitCost =
      assetPMInvoice && (plan.tanSuat === 'Quarterly' || plan.tanSuat === 'Yearly')
        ? assetPMInvoice.soTienVND
        : baseUnitCost;

    let cursorDate = plan.ngayBaoTriTiepTheo || `${forecastStartYM}-15`;
    let cursorYM = cursorDate.slice(0, 7);

    // If overdue (< forecastStartYM), pull overdue backlog into the first forecast month
    if (cursorYM < forecastStartYM) {
      cursorDate = `${forecastStartYM}-05`;
      cursorYM = forecastStartYM;
    }

    // Limit daily/weekly iterations safely while accumulating monthly budget
    const freqLower = (plan.tanSuat || '').toLowerCase();
    if (freqLower === 'daily' || freqLower === 'hàng ngày') {
      forecastMonthKeys.forEach((ym) => {
        const b = forecastBuckets.get(ym)!;
        const monthlyDailyCost = unitCost * 26;
        b.cycleCost += monthlyDailyCost;
        b.plannedTaskCount += 26;
        b.drivers.push({
          code: plan.maThietBi,
          name: plan.tenThietBi,
          estimatedCost: monthlyDailyCost,
          type: 'Bảo trì chu kỳ',
        });
      });
      return;
    }

    let guard = 0;
    while (cursorYM <= forecastEndYM && guard < 40) {
      guard += 1;
      const b = forecastBuckets.get(cursorYM);
      if (b) {
        b.cycleCost += unitCost;
        b.plannedTaskCount += 1;
        b.drivers.push({
          code: plan.maThietBi,
          name: plan.tenThietBi,
          estimatedCost: unitCost,
          type: 'Bảo trì chu kỳ',
        });
      }
      const nextDate = calculateNextMaintenanceDate(cursorDate, plan.tanSuat);
      if (!nextDate || nextDate === cursorDate) break;
      cursorDate = nextDate;
      cursorYM = nextDate.slice(0, 7);
    }
  });

  // Walk safety inspections if enabled
  if (includeSafetyInspections) {
    safetyInspections.forEach((ins) => {
      let dueYM = (ins.ngayHetHan || '').slice(0, 7);
      if (!dueYM) return;
      if (dueYM < forecastStartYM) {
        // Overdue inspection scheduled into immediate next month
        dueYM = forecastStartYM;
      }
      const b = forecastBuckets.get(dueYM);
      if (b) {
        b.inspectionCost += avgInspectionCost;
        b.inspectionDueCount += 1;
        b.drivers.push({
          code: ins.maHoSo,
          name: ins.tenThietBi,
          estimatedCost: avgInspectionCost,
          type: 'Kiểm định an toàn',
        });
      }
    });
  }

  // Merge drivers per month by asset code & pick top 4 drivers
  const forecastPoints: MonthlyCostPoint[] = forecastMonthKeys.map((ym, i) => {
    const bucket = forecastBuckets.get(ym)!;
    const step = i + 1;

    const rawConsumption = Math.max(
      1500000,
      Math.round(baseMonthlyConsumption + dampenedConsumptionSlope * step)
    );
    const forecastCycleCost = Math.round(bucket.cycleCost * contingencyMultiplier);
    const forecastInspectionCost = Math.round(bucket.inspectionCost * contingencyMultiplier);
    const forecastConsumptionCost = Math.round(rawConsumption * contingencyMultiplier);
    const forecastTotal = forecastCycleCost + forecastInspectionCost + forecastConsumptionCost;

    // Confidence band widens smoothly from +/-10% in M+1 to +/-22% in M+6
    const bandPct = 0.1 + i * 0.024;
    const confidenceLow = Math.max(0, Math.round(forecastTotal * (1 - bandPct)));
    const confidenceHigh = Math.round(forecastTotal * (1 + bandPct));

    // Aggregate top cost drivers in month
    const driverAgg = new Map<
      string,
      { code: string; name: string; estimatedCost: number; type: 'Bảo trì chu kỳ' | 'Kiểm định an toàn' }
    >();
    bucket.drivers.forEach((d) => {
      const key = `${d.type}::${d.code}`;
      const existing = driverAgg.get(key);
      if (existing) {
        existing.estimatedCost += d.estimatedCost;
      } else {
        driverAgg.set(key, { ...d });
      }
    });
    const topDrivers = Array.from(driverAgg.values())
      .sort((a, b) => b.estimatedCost - a.estimatedCost)
      .slice(0, 4);

    return {
      index: 6 + i,
      monthKey: ym,
      label: formatShortMonth(ym),
      fullLabel: formatFullMonth(ym),
      isForecast: true,
      actualScheduledCost: 0,
      actualConsumptionCost: 0,
      actualTotal: null,
      forecastCycleCost,
      forecastInspectionCost,
      forecastConsumptionCost,
      forecastTotal,
      confidenceLow,
      confidenceHigh,
      trendValue: 0,
      plannedTaskCount: bucket.plannedTaskCount,
      inspectionDueCount: bucket.inspectionDueCount,
      topDrivers,
    };
  });

  const timeline = [...historicalPoints, ...forecastPoints];

  // Fit OLS Linear Trend Line across all active historical + forecast months
  const regressionInputs = timeline
    .map((pt) => ({
      x: pt.index,
      y: pt.isForecast ? pt.forecastTotal || 0 : pt.actualTotal || 0,
    }))
    .filter((pt) => pt.y > 0);

  const { slope, intercept } = computeLinearRegression(regressionInputs);

  timeline.forEach((pt) => {
    pt.trendValue = Math.max(0, Math.round(intercept + slope * pt.index));
  });

  const total6MonthForecast = forecastPoints.reduce((s, p) => s + (p.forecastTotal || 0), 0);
  const avgMonthlyForecast = Math.round(total6MonthForecast / 6);

  const avgMonthlyHistorical =
    activeAllHistorical.length > 0
      ? Math.round(
          activeAllHistorical.reduce((s, p) => s + (p.actualTotal || 0), 0) /
            activeAllHistorical.length
        )
      : 0;

  const deltaVsHistoricalPct =
    avgMonthlyHistorical > 0
      ? Math.round(((avgMonthlyForecast - avgMonthlyHistorical) / avgMonthlyHistorical) * 1000) / 10
      : 0;

  const peakForecastMonth =
    forecastPoints.length > 0
      ? forecastPoints.reduce((best, cur) =>
          (cur.forecastTotal || 0) > (best.forecastTotal || 0) ? cur : best
        )
      : null;

  const totalCycleAndInspection = forecastPoints.reduce(
    (s, p) => s + p.forecastCycleCost + p.forecastInspectionCost,
    0
  );
  const totalCycleSharePct =
    total6MonthForecast > 0
      ? Math.round((totalCycleAndInspection / total6MonthForecast) * 100)
      : 0;
  const totalConsumptionSharePct = total6MonthForecast > 0 ? 100 - totalCycleSharePct : 0;

  const trendThreshold = Math.max(250000, avgMonthlyForecast * 0.015);
  const trendDirection: 'up' | 'down' | 'stable' =
    slope > trendThreshold ? 'up' : slope < -trendThreshold ? 'down' : 'stable';

  return {
    timeline,
    forecastMonths: forecastPoints,
    total6MonthForecast,
    avgMonthlyForecast,
    avgMonthlyHistorical,
    deltaVsHistoricalPct,
    peakForecastMonth,
    totalCycleSharePct,
    totalConsumptionSharePct,
    trendSlopePerMonth: Math.round(slope),
    trendDirection,
    activeHistoricalMonthsCount: activeAllHistorical.length,
    avgMonthlyPartsConsumption,
    avgMonthlyCorrectiveRepair,
  };
}
