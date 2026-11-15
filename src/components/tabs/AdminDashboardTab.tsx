import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { Equipment, MaintenanceWorkType } from '../../types/cmms';
import { getHistoryWorkType, isAdminLevel } from '../../utils/cmmsLogic';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Download,
  Gauge,
  Hammer,
  Lock,
  QrCode,
  Search,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from 'lucide-react';

interface AdminDashboardTabProps {
  onOpenMaintenanceModal: (eq: Equipment, workType?: MaintenanceWorkType) => void;
  onOpenQR: (eq: Equipment) => void;
}

type PeriodOption = '30D' | '90D' | '180D' | 'ALL';
type SortMetric = 'oee_asc' | 'mttr_desc' | 'repairs_desc' | 'mtbf_asc' | 'code';

const APP_TODAY_STR = '2026-11-10';
const APP_TODAY_MS = new Date(`${APP_TODAY_STR}T23:59:59`).getTime();

interface EquipmentReliabilityRow {
  eq: Equipment;
  plannedCount: number;
  repairCount: number;
  totalEvents: number;
  failureEvents: number;
  totalDowntimeMin: number;
  repairDowntimeMin: number;
  availability: number; // 0..1
  performance: number; // 0..1
  quality: number; // 0..1
  oee: number; // 0..100
  mtbfHours: number;
  mttrMinutes: number;
  overduePlan: boolean;
}

interface MonthlyPoint {
  monthKey: string; // YYYY-MM
  label: string; // MM/YY
  plannedCount: number;
  repairCount: number;
  downtimeMin: number;
  mttrMin: number;
  oee: number;
  availabilityPct: number;
  qualityPct: number;
}

interface SystemPoint {
  system: string;
  equipmentCount: number;
  plannedCount: number;
  repairCount: number;
  downtimeMin: number;
  oee: number;
  mtbfHours: number;
  mttrMinutes: number;
}

function parseYMDMs(ymd?: string): number {
  if (!ymd) return NaN;
  return new Date(`${ymd.slice(0, 10)}T00:00:00`).getTime();
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  onOpenMaintenanceModal,
  onOpenQR,
}) => {
  const {
    currentUser,
    equipment,
    maintenanceHistory,
    maintenancePlans,
    theme,
  } = useCMMS();

  const isLight = theme === 'light';
  const adminAllowed = isAdminLevel(currentUser);

  const [period, setPeriod] = useState<PeriodOption>('90D');
  const [selectedSystem, setSelectedSystem] = useState<string>('ALL');
  const [hoursPerDay, setHoursPerDay] = useState<number>(16); // 2 shifts default
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortMetric>('oee_asc');

  // D3 Container Refs & Responsive Widths
  const gaugeRef = useRef<HTMLDivElement | null>(null);
  const trendRef = useRef<HTMLDivElement | null>(null);
  const scatterRef = useRef<HTMLDivElement | null>(null);

  const [widths, setWidths] = useState({ gauge: 320, trend: 560, scatter: 520 });
  const [tooltip, setTooltip] = useState<{
    title: string;
    lines: string[];
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const observers: ResizeObserver[] = [];
    const observe = (el: HTMLDivElement | null, key: keyof typeof widths) => {
      if (!el) return;
      const update = () => {
        const w = Math.max(240, Math.floor(el.clientWidth));
        setWidths((prev) => (prev[key] === w ? prev : { ...prev, [key]: w }));
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      observers.push(ro);
    };
    observe(gaugeRef.current, 'gauge');
    observe(trendRef.current, 'trend');
    observe(scatterRef.current, 'scatter');
    return () => observers.forEach((ro) => ro.disconnect());
  }, []);

  const systems = useMemo(
    () => Array.from(new Set(equipment.map((e) => e.heThong).filter(Boolean))).sort(),
    [equipment]
  );

  // Determine observation window (days)
  const windowDays = useMemo(() => {
    if (period === '30D') return 30;
    if (period === '90D') return 90;
    if (period === '180D') return 180;
    const validTimes = maintenanceHistory
      .map((h) => parseYMDMs(h.ngayThucHien))
      .filter((t) => !Number.isNaN(t) && t <= APP_TODAY_MS);
    if (validTimes.length === 0) return 90;
    const minMs = Math.min(...validTimes);
    return Math.max(30, Math.ceil((APP_TODAY_MS - minMs) / 86400000));
  }, [period, maintenanceHistory]);

  const cutoffMs = useMemo(() => {
    if (period === 'ALL') return 0;
    return APP_TODAY_MS - windowDays * 86400000;
  }, [period, windowDays]);

  const filteredEquipment = useMemo(
    () =>
      selectedSystem === 'ALL'
        ? equipment
        : equipment.filter((e) => e.heThong === selectedSystem),
    [equipment, selectedSystem]
  );

  const filteredEquipmentSet = useMemo(
    () => new Set(filteredEquipment.map((e) => e.maThietBi)),
    [filteredEquipment]
  );

  const scopedHistory = useMemo(() => {
    return maintenanceHistory.filter((h) => {
      if (!filteredEquipmentSet.has(h.maThietBi)) return false;
      const t = parseYMDMs(h.ngayThucHien);
      if (Number.isNaN(t)) return false;
      if (cutoffMs > 0 && t < cutoffMs) return false;
      return true;
    });
  }, [maintenanceHistory, filteredEquipmentSet, cutoffMs]);

  // Core Reliability Metrics per Equipment & Portfolio
  const { portfolioKPIs, equipmentRows, monthlySeries, systemSeries } = useMemo(() => {
    const planByEq = new Map<string, (typeof maintenancePlans)[number]>();
    maintenancePlans.forEach((p) => planByEq.set(p.maThietBi, p));

    const histByEq = new Map<string, typeof scopedHistory>();
    scopedHistory.forEach((h) => {
      const list = histByEq.get(h.maThietBi) || [];
      list.push(h);
      histByEq.set(h.maThietBi, list);
    });

    const eqPlannedWindowHours = Math.max(1, windowDays * hoursPerDay);

    const rows: EquipmentReliabilityRow[] = filteredEquipment.map((eq) => {
      const records = histByEq.get(eq.maThietBi) || [];
      let plannedCount = 0;
      let repairCount = 0;
      let totalDowntimeMin = 0;
      let repairDowntimeMin = 0;
      let qualityPoints = 0;

      records.forEach((r) => {
        const wt = getHistoryWorkType(r);
        const dt = Math.max(0, Number(r.thoiGianDungMay) || 0);
        totalDowntimeMin += dt;

        if (wt === 'Sửa chữa') {
          repairCount += 1;
          repairDowntimeMin += dt;
        } else {
          plannedCount += 1;
        }

        if (r.ketQua === 'Đạt' || r.ketQua === 'Hoàn thành') qualityPoints += 1;
        else if (r.ketQua === 'Cần theo dõi') qualityPoints += 0.75;
      });

      // Failure events = explicit repair records OR records with failed result/unplanned downtime
      const failureEvents = records.filter(
        (r) =>
          getHistoryWorkType(r) === 'Sửa chữa' ||
          r.ketQua === 'Chưa đạt'
      ).length;

      const plan = planByEq.get(eq.maThietBi);
      const overduePlan = plan?.trangThai === 'Quá hạn';

      const downtimeHours = totalDowntimeMin / 60;
      const operatingHours = Math.max(0, eqPlannedWindowHours - downtimeHours);

      const availability = Math.max(
        0,
        Math.min(1, operatingHours / eqPlannedWindowHours)
      );

      // Performance: base 0.96, reduced by overdue PM, ongoing repair state, or repeated repairs
      let performance = 0.96;
      if (eq.trangThai === 'Đang sửa chữa') performance -= 0.16;
      else if (eq.trangThai === 'Bảo trì') performance -= 0.08;
      else if (eq.trangThai === 'Tạm dừng') performance -= 0.18;
      if (overduePlan) performance -= 0.07;
      if (repairCount > 0) performance -= Math.min(0.14, repairCount * 0.035);
      performance = Math.max(0.55, Math.min(1, performance));

      // Quality: first-pass rate from maintenance/repair outcomes (defaults 0.98 when spotless)
      const quality =
        records.length > 0
          ? Math.max(0.5, Math.min(1, qualityPoints / records.length))
          : overduePlan
          ? 0.92
          : 0.985;

      const oee = Math.round(availability * performance * quality * 1000) / 10;
      const mtbfHours =
        failureEvents > 0
          ? Math.round((operatingHours / failureEvents) * 10) / 10
          : Math.round(operatingHours * 10) / 10;

      const repairBasisMin =
        repairDowntimeMin > 0 ? repairDowntimeMin : totalDowntimeMin;
      const repairDivisor =
        repairDowntimeMin > 0
          ? Math.max(1, repairCount)
          : records.filter((r) => (Number(r.thoiGianDungMay) || 0) > 0).length;

      const mttrMinutes =
        repairDivisor > 0 ? Math.round((repairBasisMin / repairDivisor) * 10) / 10 : 0;

      return {
        eq,
        plannedCount,
        repairCount,
        totalEvents: records.length,
        failureEvents,
        totalDowntimeMin,
        repairDowntimeMin,
        availability,
        performance,
        quality,
        oee,
        mtbfHours,
        mttrMinutes,
        overduePlan,
      };
    });

    // Portfolio Aggregation
    const eqCount = Math.max(1, filteredEquipment.length);
    const totalPlannedHours = eqCount * windowDays * hoursPerDay;
    const totalDowntimeMin = rows.reduce((s, r) => s + r.totalDowntimeMin, 0);
    const totalDowntimeHours = totalDowntimeMin / 60;
    const totalOperatingHours = Math.max(0, totalPlannedHours - totalDowntimeHours);

    const totalPlannedJobs = rows.reduce((s, r) => s + r.plannedCount, 0);
    const totalRepairJobs = rows.reduce((s, r) => s + r.repairCount, 0);
    const totalFailureEvents = rows.reduce((s, r) => s + r.failureEvents, 0);

    const avgAvailability =
      totalPlannedHours > 0
        ? Math.max(0, Math.min(1, totalOperatingHours / totalPlannedHours))
        : 1;
    const avgPerformance =
      rows.reduce((s, r) => s + r.performance, 0) / eqCount;

    const totalRecords = scopedHistory.length;
    const totalQualityPoints = scopedHistory.reduce((s, r) => {
      if (r.ketQua === 'Đạt' || r.ketQua === 'Hoàn thành') return s + 1;
      if (r.ketQua === 'Cần theo dõi') return s + 0.75;
      return s;
    }, 0);
    const avgQuality =
      totalRecords > 0 ? Math.max(0.5, totalQualityPoints / totalRecords) : 0.985;

    const overallOEE =
      Math.round(avgAvailability * avgPerformance * avgQuality * 1000) / 10;

    const overallMTBFHours =
      totalFailureEvents > 0
        ? Math.round((totalOperatingHours / totalFailureEvents) * 10) / 10
        : Math.round(totalOperatingHours * 10) / 10;

    const downtimeRecordsCount = scopedHistory.filter(
      (r) => (Number(r.thoiGianDungMay) || 0) > 0
    ).length;
    const repairDowntimeTotalMin = rows.reduce(
      (s, r) => s + r.repairDowntimeMin,
      0
    );

    const overallMTTRMin =
      repairDowntimeTotalMin > 0 && totalRepairJobs > 0
        ? Math.round((repairDowntimeTotalMin / totalRepairJobs) * 10) / 10
        : downtimeRecordsCount > 0
        ? Math.round((totalDowntimeMin / downtimeRecordsCount) * 10) / 10
        : 0;

    // Monthly Trend Series
    const monthBuckets = new Map<string, typeof scopedHistory>();
    scopedHistory.forEach((h) => {
      const mKey = h.ngayThucHien?.slice(0, 7);
      if (!mKey || mKey.length !== 7) return;
      const list = monthBuckets.get(mKey) || [];
      list.push(h);
      monthBuckets.set(mKey, list);
    });

    const sortedMonths = Array.from(monthBuckets.keys()).sort();
    const monthlyPlannedBaseHours = eqCount * 30 * hoursPerDay;
    const monthly: MonthlyPoint[] = sortedMonths.map((mKey) => {
      const list = monthBuckets.get(mKey) || [];
      let pCount = 0;
      let rCount = 0;
      let dMin = 0;
      let rDMin = 0;
      let qPts = 0;
      let dtEvents = 0;

      list.forEach((h) => {
        const wt = getHistoryWorkType(h);
        const dt = Math.max(0, Number(h.thoiGianDungMay) || 0);
        dMin += dt;
        if (dt > 0) dtEvents += 1;
        if (wt === 'Sửa chữa') {
          rCount += 1;
          rDMin += dt;
        } else {
          pCount += 1;
        }
        if (h.ketQua === 'Đạt' || h.ketQua === 'Hoàn thành') qPts += 1;
        else if (h.ketQua === 'Cần theo dõi') qPts += 0.75;
      });

      const avail = Math.max(
        0.5,
        Math.min(1, (monthlyPlannedBaseHours - dMin / 60) / Math.max(1, monthlyPlannedBaseHours))
      );
      const perf = Math.max(
        0.65,
        Math.min(1, 0.96 - (rCount / Math.max(1, list.length)) * 0.14)
      );
      const qual = list.length > 0 ? Math.max(0.5, qPts / list.length) : 0.98;
      const oeeVal = Math.round(avail * perf * qual * 1000) / 10;
      const mttrVal =
        rDMin > 0 && rCount > 0
          ? Math.round((rDMin / rCount) * 10) / 10
          : dtEvents > 0
          ? Math.round((dMin / dtEvents) * 10) / 10
          : 0;

      const [yy, mm] = mKey.split('-');
      return {
        monthKey: mKey,
        label: `${mm}/${yy.slice(2)}`,
        plannedCount: pCount,
        repairCount: rCount,
        downtimeMin: dMin,
        mttrMin: mttrVal,
        oee: oeeVal,
        availabilityPct: Math.round(avail * 1000) / 10,
        qualityPct: Math.round(qual * 1000) / 10,
      };
    });

    // System Breakdown Series
    const sysMap = new Map<string, EquipmentReliabilityRow[]>();
    rows.forEach((r) => {
      const s = r.eq.heThong || 'Khác';
      const arr = sysMap.get(s) || [];
      arr.push(r);
      sysMap.set(s, arr);
    });

    const sysPoints: SystemPoint[] = Array.from(sysMap.entries())
      .map(([system, sysRows]) => {
        const cnt = Math.max(1, sysRows.length);
        const sysPlannedHours = cnt * windowDays * hoursPerDay;
        const sysDowntimeMin = sysRows.reduce((s, r) => s + r.totalDowntimeMin, 0);
        const sysRepairMin = sysRows.reduce((s, r) => s + r.repairDowntimeMin, 0);
        const sysOperatingHours = Math.max(0, sysPlannedHours - sysDowntimeMin / 60);
        const sysFailures = sysRows.reduce((s, r) => s + r.failureEvents, 0);
        const sysRepairs = sysRows.reduce((s, r) => s + r.repairCount, 0);
        const sysPlanned = sysRows.reduce((s, r) => s + r.plannedCount, 0);
        const avgSysOee =
          Math.round((sysRows.reduce((s, r) => s + r.oee, 0) / cnt) * 10) / 10;

        const mtbf =
          sysFailures > 0
            ? Math.round((sysOperatingHours / sysFailures) * 10) / 10
            : Math.round(sysOperatingHours * 10) / 10;

        const mttr =
          sysRepairMin > 0 && sysRepairs > 0
            ? Math.round((sysRepairMin / sysRepairs) * 10) / 10
            : sysDowntimeMin > 0
            ? Math.round((sysDowntimeMin / Math.max(1, sysRows.filter((r) => r.totalDowntimeMin > 0).length)) * 10) / 10
            : 0;

        return {
          system,
          equipmentCount: sysRows.length,
          plannedCount: sysPlanned,
          repairCount: sysRepairs,
          downtimeMin: sysDowntimeMin,
          oee: avgSysOee,
          mtbfHours: mtbf,
          mttrMinutes: mttr,
        };
      })
      .sort((a, b) => a.oee - b.oee);

    return {
      portfolioKPIs: {
        equipmentCount: filteredEquipment.length,
        totalPlannedHours,
        totalOperatingHours: Math.round(totalOperatingHours),
        totalDowntimeMin,
        availabilityPct: Math.round(avgAvailability * 1000) / 10,
        performancePct: Math.round(avgPerformance * 1000) / 10,
        qualityPct: Math.round(avgQuality * 1000) / 10,
        oee: overallOEE,
        mtbfHours: overallMTBFHours,
        mttrMinutes: overallMTTRMin,
        totalPlannedJobs,
        totalRepairJobs,
        totalFailureEvents,
        pmRatioPct:
          totalPlannedJobs + totalRepairJobs > 0
            ? Math.round((totalPlannedJobs / (totalPlannedJobs + totalRepairJobs)) * 1000) / 10
            : 100,
      },
      equipmentRows: rows,
      monthlySeries: monthly,
      systemSeries: sysPoints,
    };
  }, [filteredEquipment, scopedHistory, maintenancePlans, windowDays, hoursPerDay]);

  // D3 CHART 1: OEE Semi-Gauge
  useEffect(() => {
    const container = gaugeRef.current;
    if (!container || !adminAllowed) return;
    d3.select(container).selectAll('*').remove();

    const w = Math.min(360, widths.gauge);
    const h = 195;
    const outerR = Math.min(w * 0.44, 130);
    const innerR = outerR - 24;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', w)
      .attr('height', h)
      .attr('viewBox', `0 0 ${w} ${h}`)
      .style('overflow', 'visible');

    const g = svg
      .append('g')
      .attr('transform', `translate(${w / 2}, ${h - 32})`);

    const startAngle = -Math.PI / 2;
    const endAngle = Math.PI / 2;
    const valueScale = d3.scaleLinear().domain([0, 100]).range([startAngle, endAngle]).clamp(true);

    // Track background
    const bgArc = d3
      .arc<unknown>()
      .innerRadius(innerR)
      .outerRadius(outerR)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(6);

    g.append('path')
      .attr('d', bgArc({}) || '')
      .attr('fill', isLight ? '#e2e8f0' : '#1e293b');

    const oeeColor =
      portfolioKPIs.oee >= 85
        ? '#10b981'
        : portfolioKPIs.oee >= 70
        ? '#f59e0b'
        : '#f43f5e';

    const fgArc = d3
      .arc<unknown>()
      .innerRadius(innerR)
      .outerRadius(outerR)
      .startAngle(startAngle)
      .endAngle(valueScale(portfolioKPIs.oee))
      .cornerRadius(6);

    g.append('path')
      .attr('d', fgArc({}) || '')
      .attr('fill', oeeColor);

    // Target 85% World-Class benchmark tick
    const targetAngle = valueScale(85) - Math.PI / 2;
    const tx1 = Math.cos(targetAngle) * (innerR - 6);
    const ty1 = Math.sin(targetAngle) * (innerR - 6);
    const tx2 = Math.cos(targetAngle) * (outerR + 8);
    const ty2 = Math.sin(targetAngle) * (outerR + 8);

    g.append('line')
      .attr('x1', tx1)
      .attr('y1', ty1)
      .attr('x2', tx2)
      .attr('y2', ty2)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '3,2');

    g.append('text')
      .attr('x', Math.cos(targetAngle) * (outerR + 20))
      .attr('y', Math.sin(targetAngle) * (outerR + 20))
      .attr('text-anchor', 'middle')
      .attr('fill', '#38bdf8')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .text('85%');

    // Center OEE readout
    g.append('text')
      .attr('y', -36)
      .attr('text-anchor', 'middle')
      .attr('fill', isLight ? '#0f172a' : '#f1f5f9')
      .style('font-size', '30px')
      .style('font-weight', '800')
      .style('font-variant-numeric', 'tabular-nums')
      .text(`${portfolioKPIs.oee.toFixed(1)}%`);

    g.append('text')
      .attr('y', -14)
      .attr('text-anchor', 'middle')
      .attr('fill', isLight ? '#475569' : '#94a3b8')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .text('OEE Toàn Nhà Máy (A × P × Q)');

    // 0% and 100% scale labels
    g.append('text')
      .attr('x', -outerR + 10)
      .attr('y', 18)
      .attr('text-anchor', 'middle')
      .attr('fill', isLight ? '#64748b' : '#64748b')
      .style('font-size', '10px')
      .text('0%');

    g.append('text')
      .attr('x', outerR - 10)
      .attr('y', 18)
      .attr('text-anchor', 'middle')
      .attr('fill', isLight ? '#64748b' : '#64748b')
      .style('font-size', '10px')
      .text('100%');
  }, [portfolioKPIs.oee, widths.gauge, isLight, adminAllowed]);

  // D3 CHART 2: Monthly Trend (Downtime/MTTR Bars + OEE % Line)
  useEffect(() => {
    const container = trendRef.current;
    if (!container || !adminAllowed) return;
    d3.select(container).selectAll('*').remove();

    if (monthlySeries.length === 0) return;

    const width = Math.max(320, widths.trend);
    const height = 250;
    const margin = { top: 22, right: 44, bottom: 32, left: 44 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(monthlySeries.map((d) => d.label))
      .range([0, innerW])
      .padding(0.32);

    const maxDowntime = Math.max(60, d3.max(monthlySeries, (d) => d.downtimeMin) || 60);
    const yLeft = d3.scaleLinear().domain([0, maxDowntime * 1.15]).nice().range([innerH, 0]);
    const yRight = d3.scaleLinear().domain([50, 100]).range([innerH, 0]);

    // Gridlines
    g.append('g')
      .selectAll('line')
      .data(yRight.ticks(4))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', (d) => yRight(d))
      .attr('y2', (d) => yRight(d))
      .attr('stroke', isLight ? '#e2e8f0' : '#1e293b')
      .attr('stroke-dasharray', '3,3');

    // X Axis
    g.append('g')
      .attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(x))
      .call((axis) => axis.select('.domain').attr('stroke', isLight ? '#cbd5e1' : '#334155'))
      .selectAll('text')
      .attr('fill', isLight ? '#475569' : '#94a3b8')
      .style('font-size', '10px');

    // Left Axis (Downtime min)
    g.append('g')
      .call(d3.axisLeft(yLeft).ticks(4))
      .call((axis) => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#f59e0b')
      .style('font-size', '10px');

    // Right Axis (OEE %)
    g.append('g')
      .attr('transform', `translate(${innerW}, 0)`)
      .call(d3.axisRight(yRight).ticks(4).tickFormat((d) => `${d}%`))
      .call((axis) => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#22d3ee')
      .style('font-size', '10px');

    // Bars for Total Downtime (minutes)
    g.selectAll('.dt-bar')
      .data(monthlySeries)
      .enter()
      .append('rect')
      .attr('class', 'dt-bar')
      .attr('x', (d) => x(d.label) ?? 0)
      .attr('y', (d) => yLeft(d.downtimeMin))
      .attr('width', x.bandwidth())
      .attr('height', (d) => Math.max(2, innerH - yLeft(d.downtimeMin)))
      .attr('rx', 4)
      .attr('fill', 'rgba(245, 158, 11, 0.35)')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mousemove', (event, d) => {
        const rect = container.getBoundingClientRect();
        setTooltip({
          title: `Tháng ${d.label}`,
          lines: [
            `OEE tháng: ${d.oee.toFixed(1)}% (A: ${d.availabilityPct}% · Q: ${d.qualityPct}%)`,
            `Bảo trì KH: ${d.plannedCount} · Sửa chữa: ${d.repairCount}`,
            `Tổng dừng máy: ${d.downtimeMin} phút · MTTR: ${d.mttrMin} phút`,
          ],
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      })
      .on('mouseleave', () => setTooltip(null));

    // Area + Line for OEE %
    const areaGen = d3
      .area<MonthlyPoint>()
      .x((d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .y0(innerH)
      .y1((d) => yRight(d.oee))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(monthlySeries)
      .attr('d', areaGen)
      .attr('fill', 'rgba(34, 211, 238, 0.12)');

    const lineGen = d3
      .line<MonthlyPoint>()
      .x((d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .y((d) => yRight(d.oee))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(monthlySeries)
      .attr('d', lineGen)
      .attr('fill', 'none')
      .attr('stroke', '#22d3ee')
      .attr('stroke-width', 2.5);

    g.selectAll('.oee-dot')
      .data(monthlySeries)
      .enter()
      .append('circle')
      .attr('cx', (d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .attr('cy', (d) => yRight(d.oee))
      .attr('r', 4.5)
      .attr('fill', '#0891b2')
      .attr('stroke', '#cffafe')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mousemove', (event, d) => {
        const rect = container.getBoundingClientRect();
        setTooltip({
          title: `Tháng ${d.label}`,
          lines: [
            `OEE tháng: ${d.oee.toFixed(1)}%`,
            `Bảo trì KH: ${d.plannedCount} · Sửa chữa: ${d.repairCount}`,
            `Dừng máy: ${d.downtimeMin} phút · MTTR TB: ${d.mttrMin} phút`,
          ],
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      })
      .on('mouseleave', () => setTooltip(null));
  }, [monthlySeries, widths.trend, isLight, adminAllowed]);

  // D3 CHART 3: System Reliability Bubble Matrix (MTBF vs MTTR colored by OEE)
  useEffect(() => {
    const container = scatterRef.current;
    if (!container || !adminAllowed) return;
    d3.select(container).selectAll('*').remove();

    if (systemSeries.length === 0) return;

    const width = Math.max(300, widths.scatter);
    const height = 250;
    const margin = { top: 20, right: 24, bottom: 38, left: 48 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const maxMtbf = Math.max(100, d3.max(systemSeries, (d) => d.mtbfHours) || 100);
    const maxMttr = Math.max(60, d3.max(systemSeries, (d) => d.mttrMinutes) || 60);
    const maxEvents = Math.max(
      1,
      d3.max(systemSeries, (d) => d.plannedCount + d.repairCount) || 1
    );

    const x = d3.scaleLinear().domain([0, maxMtbf * 1.12]).nice().range([0, innerW]);
    const y = d3.scaleLinear().domain([0, maxMttr * 1.2]).nice().range([innerH, 0]);
    const r = d3.scaleSqrt().domain([0, maxEvents]).range([7, 22]);

    g.append('g')
      .selectAll('line')
      .data(y.ticks(4))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', isLight ? '#e2e8f0' : '#1e293b')
      .attr('stroke-dasharray', '3,3');

    g.append('g')
      .attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(x).ticks(5))
      .call((axis) => axis.select('.domain').attr('stroke', isLight ? '#cbd5e1' : '#334155'))
      .selectAll('text')
      .attr('fill', isLight ? '#475569' : '#94a3b8')
      .style('font-size', '10px');

    g.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .call((axis) => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', isLight ? '#475569' : '#94a3b8')
      .style('font-size', '10px');

    // Axis labels
    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 31)
      .attr('text-anchor', 'middle')
      .attr('fill', isLight ? '#475569' : '#94a3b8')
      .style('font-size', '10px')
      .text('MTBF (Giờ giữa các lần hỏng — càng lớn càng tốt)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -36)
      .attr('text-anchor', 'middle')
      .attr('fill', isLight ? '#475569' : '#94a3b8')
      .style('font-size', '10px')
      .text('MTTR (Phút)');

    g.selectAll('.sys-bubble')
      .data(systemSeries)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.mtbfHours))
      .attr('cy', (d) => y(d.mttrMinutes))
      .attr('r', (d) => r(d.plannedCount + d.repairCount))
      .attr('fill', (d) =>
        d.oee >= 85
          ? 'rgba(16, 185, 129, 0.45)'
          : d.oee >= 70
          ? 'rgba(245, 158, 11, 0.45)'
          : 'rgba(244, 63, 94, 0.45)'
      )
      .attr('stroke', (d) =>
        d.oee >= 85 ? '#10b981' : d.oee >= 70 ? '#f59e0b' : '#f43f5e'
      )
      .attr('stroke-width', 1.8)
      .style('cursor', 'pointer')
      .on('click', (_e, d) => {
        setSelectedSystem((prev) => (prev === d.system ? 'ALL' : d.system));
      })
      .on('mousemove', (event, d) => {
        const rect = container.getBoundingClientRect();
        setTooltip({
          title: `${d.system} (${d.equipmentCount} máy)`,
          lines: [
            `OEE TB: ${d.oee.toFixed(1)}% · MTBF: ${d.mtbfHours}h · MTTR: ${d.mttrMinutes}p`,
            `Bảo trì KH: ${d.plannedCount} · Sửa chữa: ${d.repairCount}`,
            `Tổng dừng máy: ${d.downtimeMin} phút (Click để lọc)`,
          ],
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      })
      .on('mouseleave', () => setTooltip(null));

    // Short labels beside bubbles
    g.selectAll('.sys-label')
      .data(systemSeries)
      .enter()
      .append('text')
      .attr('x', (d) => x(d.mtbfHours))
      .attr('y', (d) => y(d.mttrMinutes) - r(d.plannedCount + d.repairCount) - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', isLight ? '#334155' : '#cbd5e1')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .text((d) => (d.system.length > 16 ? `${d.system.slice(0, 14)}…` : d.system));
  }, [systemSeries, widths.scatter, isLight, adminAllowed]);

  // Filtered & Sorted Equipment Rows
  const visibleRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = equipmentRows.filter((r) => {
      if (!q) return true;
      return (
        r.eq.maThietBi.toLowerCase().includes(q) ||
        r.eq.tenThietBi.toLowerCase().includes(q) ||
        r.eq.heThong.toLowerCase().includes(q)
      );
    });
    return filtered.sort((a, b) => {
      if (sortBy === 'oee_asc') return a.oee - b.oee;
      if (sortBy === 'mttr_desc') return b.mttrMinutes - a.mttrMinutes;
      if (sortBy === 'repairs_desc') return b.repairCount - a.repairCount;
      if (sortBy === 'mtbf_asc') return a.mtbfHours - b.mtbfHours;
      return a.eq.maThietBi.localeCompare(b.eq.maThietBi);
    });
  }, [equipmentRows, searchTerm, sortBy]);

  const handleExportCSV = () => {
    const headers = [
      'Mã Thiết Bị',
      'Tên Thiết Bị',
      'Hệ Thống',
      'Bảo Trì Kế Hoạch (PM)',
      'Sửa Chữa (CM)',
      'Tổng Dừng Máy (Phút)',
      'Availability (%)',
      'Performance (%)',
      'Quality (%)',
      'OEE (%)',
      'MTBF (Giờ)',
      'MTTR (Phút)',
    ];
    const rows = visibleRows.map((r) => [
      r.eq.maThietBi,
      `"${r.eq.tenThietBi.replace(/"/g, '""')}"`,
      `"${r.eq.heThong}"`,
      r.plannedCount,
      r.repairCount,
      r.totalDowntimeMin,
      (r.availability * 100).toFixed(1),
      (r.performance * 100).toFixed(1),
      (r.quality * 100).toFixed(1),
      r.oee.toFixed(1),
      r.mtbfHours.toFixed(1),
      r.mttrMinutes.toFixed(1),
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dashboard_Admin_OEE_MTBF_MTTR_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!adminAllowed) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 text-center space-y-3 max-w-lg mx-auto my-8">
        <Lock className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-100">Quyền Truy Cập Giới Hạn</h2>
        <p className="text-xs text-slate-400">
          Trang Dashboard Admin (OEE · MTBF · MTTR) chỉ dành cho tài khoản cấp Admin / Quản trị viên.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Top Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>{UI_TEXTS.tabs.adminDashboard.badge}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            {UI_TEXTS.tabs.adminDashboard.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodOption)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-100 min-h-[38px]"
          >
            <option value="30D">Kỳ phân tích: 30 ngày</option>
            <option value="90D">Kỳ phân tích: 90 ngày</option>
            <option value="180D">Kỳ phân tích: 180 ngày</option>
            <option value="ALL">Kỳ phân tích: Toàn bộ ({windowDays} ngày)</option>
          </select>

          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-100 min-h-[38px]"
          >
            <option value="ALL">Hệ thống: Tất cả ({systems.length})</option>
            {systems.map((sys) => (
              <option key={sys} value={sys}>
                {sys}
              </option>
            ))}
          </select>

          <select
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-100 min-h-[38px]"
          >
            <option value={8}>Vận hành: 8h/ngày (1 ca)</option>
            <option value={16}>Vận hành: 16h/ngày (2 ca)</option>
            <option value={24}>Vận hành: 24h/ngày (3 ca)</option>
          </select>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition min-h-[38px]"
          >
            <Download className="w-4 h-4" />
            <span>Xuất KPI CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Reliability KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>OEE — Hiệu Suất Thiết Bị Tổng Thể</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div
            className={`text-2xl font-bold tabular-nums ${
              portfolioKPIs.oee >= 85
                ? 'text-emerald-400'
                : portfolioKPIs.oee >= 70
                ? 'text-amber-300'
                : 'text-rose-400'
            }`}
          >
            {portfolioKPIs.oee.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 tabular-nums">
            A: {portfolioKPIs.availabilityPct}% · P: {portfolioKPIs.performancePct}% · Q:{' '}
            {portfolioKPIs.qualityPct}%
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>MTBF — TB Giữa Các Lần Hỏng Hóc</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 tabular-nums">
            {portfolioKPIs.mtbfHours.toLocaleString('vi-VN')} giờ
          </div>
          <div className="text-[11px] text-slate-400 tabular-nums">
            {portfolioKPIs.totalOperatingHours.toLocaleString('vi-VN')}h chạy máy ·{' '}
            {portfolioKPIs.totalFailureEvents} sự cố / sửa chữa
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>MTTR — TB Thời Gian Sửa Chữa</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 tabular-nums">
            {portfolioKPIs.mttrMinutes.toFixed(1)} phút
          </div>
          <div className="text-[11px] text-slate-400 tabular-nums">
            {(portfolioKPIs.mttrMinutes / 60).toFixed(2)} giờ/lần · Tổng dừng:{' '}
            {portfolioKPIs.totalDowntimeMin} phút
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tỉ Lệ Bảo Trì Kế Hoạch / Sửa Chữa</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300 tabular-nums">
            {portfolioKPIs.pmRatioPct}% PM
          </div>
          <div className="text-[11px] text-slate-400 tabular-nums">
            {portfolioKPIs.totalPlannedJobs} Bảo trì KH · {portfolioKPIs.totalRepairJobs} Sửa chữa ·{' '}
            {portfolioKPIs.equipmentCount} máy
          </div>
        </div>
      </div>

      {/* D3 CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* D3 Gauge + A/P/Q Breakdown (4 cols) */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Phân Rã Chỉ Số OEE (A · P · Q)</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Chuẩn mục tiêu nhà máy World-Class: 85.0%
            </p>
          </div>

          <div ref={gaugeRef} className="w-full flex justify-center items-center min-h-[195px]" />

          <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs tabular-nums">
            {[
              {
                label: 'Availability (Tính sẵn sàng)',
                val: portfolioKPIs.availabilityPct,
                bar: 'bg-cyan-500',
              },
              {
                label: 'Performance (Hiệu suất chạy máy)',
                val: portfolioKPIs.performancePct,
                bar: 'bg-indigo-500',
              },
              {
                label: 'Quality (Chất lượng đạt chuẩn)',
                val: portfolioKPIs.qualityPct,
                bar: 'bg-emerald-500',
              },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="font-mono font-bold text-slate-100">{item.val}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.bar}`}
                    style={{ width: `${Math.min(100, item.val)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* D3 Monthly Reliability Trend (8 cols) */}
        <div className="lg:col-span-8 p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3 relative">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Biểu Đồ D3 Xu Hướng OEE (%) & Thời Gian Dừng Máy Theo Tháng</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Đường xanh: OEE tháng (%) · Cột cam: Tổng thời gian dừng máy (phút)
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> OEE (%)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-2 rounded bg-amber-500/60 inline-block" /> Dừng máy (phút)
              </span>
            </div>
          </div>

          {monthlySeries.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-xs text-slate-500">
              Chưa có dữ liệu lịch sử trong khoảng thời gian đã chọn.
            </div>
          ) : (
            <div ref={trendRef} className="w-full min-h-[250px] relative" />
          )}

          {tooltip && (
            <div
              className="pointer-events-none absolute z-30 p-2.5 rounded-lg bg-slate-950/95 border border-slate-700 shadow-xl text-[11px] text-slate-200 max-w-xs"
              style={{
                left: Math.min(Math.max(12, tooltip.x + 12), 420),
                top: Math.max(12, tooltip.y - 10),
              }}
            >
              <div className="font-bold text-cyan-300 mb-1">{tooltip.title}</div>
              {tooltip.lines.map((line, i) => (
                <div key={i} className="text-slate-300 tabular-nums">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* D3 CHART 3: System Reliability Bubble Matrix + Formula Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3 relative">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Ma Trận Độ Tin Cậy D3 Theo Hệ Thống (MTBF vs MTTR)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kích thước bong bóng thể hiện tổng số lần bảo trì & sửa chữa · Click bong bóng để
                lọc hệ thống
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> OEE ≥ 85%
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> 70–84.9%
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> &lt; 70%
              </span>
            </div>
          </div>

          {systemSeries.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-xs text-slate-500">
              Chưa có dữ liệu hệ thống.
            </div>
          ) : (
            <div ref={scatterRef} className="w-full min-h-[250px]" />
          )}
        </div>

        {/* Formula & System Ranking Summary */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-100">Xếp Hạng Hệ Thống Theo OEE</h3>
          <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1 text-xs tabular-nums">
            {systemSeries.map((sys) => (
              <button
                key={sys.system}
                type="button"
                onClick={() =>
                  setSelectedSystem((prev) => (prev === sys.system ? 'ALL' : sys.system))
                }
                className={`w-full p-2.5 rounded-lg border text-left transition space-y-1 ${
                  selectedSystem === sys.system
                    ? 'bg-indigo-600/20 border-indigo-500/50'
                    : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-100 truncate">{sys.system}</span>
                  <span
                    className={`font-mono font-bold ${
                      sys.oee >= 85
                        ? 'text-emerald-400'
                        : sys.oee >= 70
                        ? 'text-amber-300'
                        : 'text-rose-400'
                    }`}
                  >
                    {sys.oee.toFixed(1)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>
                    MTBF: {sys.mtbfHours}h · MTTR: {sys.mttrMinutes}p
                  </span>
                  <span>
                    PM {sys.plannedCount} / CM {sys.repairCount}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            Công thức: OEE = A × P × Q · MTBF = Giờ chạy / Số sự cố · MTTR = Tổng phút sửa / Số lần
            sửa chữa.
          </div>
        </div>
      </div>

      {/* EQUIPMENT RELIABILITY TABLE & MOBILE CARDS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 className="text-sm font-bold text-slate-100">
            Chi Tiết KPI Tin Cậy Theo Thiết Bị ({visibleRows.length} thiết bị)
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã hoặc tên thiết bị..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 min-h-[36px]"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortMetric)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 min-h-[36px]"
            >
              <option value="oee_asc">Sắp xếp: OEE thấp nhất trước</option>
              <option value="mttr_desc">Sắp xếp: MTTR cao nhất trước</option>
              <option value="repairs_desc">Sắp xếp: Nhiều lần sửa chữa nhất</option>
              <option value="mtbf_asc">Sắp xếp: MTBF thấp nhất trước</option>
              <option value="code">Sắp xếp: Mã thiết bị A-Z</option>
            </select>
          </div>
        </div>

        {/* Mobile Compact Cards (< md) */}
        <div className="md:hidden space-y-2.5">
          {visibleRows.slice(0, 40).map((row) => (
            <div
              key={row.eq.maThietBi}
              className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-mono font-bold text-cyan-400">
                    {row.eq.maThietBi} · {row.eq.heThong}
                  </div>
                  <div className="text-sm font-bold text-slate-100 truncate">
                    {row.eq.tenThietBi}
                  </div>
                </div>
                <span
                  className={`font-mono font-bold text-sm tabular-nums shrink-0 ${
                    row.oee >= 85
                      ? 'text-emerald-400'
                      : row.oee >= 70
                      ? 'text-amber-300'
                      : 'text-rose-400'
                  }`}
                >
                  OEE {row.oee.toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 tabular-nums">
                <div>
                  MTBF: <strong className="text-slate-200">{row.mtbfHours}h</strong>
                </div>
                <div>
                  MTTR: <strong className="text-amber-300">{row.mttrMinutes}p</strong>
                </div>
                <div className="text-right">
                  PM {row.plannedCount} · CM {row.repairCount}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => onOpenMaintenanceModal(row.eq, 'Bảo trì theo kế hoạch')}
                  className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Bảo trì
                </button>
                <button
                  type="button"
                  onClick={() => onOpenMaintenanceModal(row.eq, 'Sửa chữa')}
                  className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 text-xs font-semibold"
                >
                  <Hammer className="w-3.5 h-3.5" />
                  Sửa chữa
                </button>
                <button
                  type="button"
                  onClick={() => onOpenQR(row.eq)}
                  className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg bg-slate-800 text-cyan-400"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table (>= md) */}
        <div className="hidden md:block rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
          <SmartHorizontalScroll>
            <table className="w-full text-left border-collapse min-w-[1020px] text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-3">Mã TB</th>
                  <th className="py-3 px-3">Tên Thiết Bị & Hệ Thống</th>
                  <th className="py-3 px-3 text-center">Bảo Trì KH (PM)</th>
                  <th className="py-3 px-3 text-center">Sửa Chữa (CM)</th>
                  <th className="py-3 px-3 text-right">Dừng Máy</th>
                  <th className="py-3 px-3 text-right">A / P / Q (%)</th>
                  <th className="py-3 px-3 text-right">OEE (%)</th>
                  <th className="py-3 px-3 text-right">MTBF (Giờ)</th>
                  <th className="py-3 px-3 text-right">MTTR (Phút)</th>
                  <th className="py-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {visibleRows.slice(0, 60).map((row) => (
                  <tr key={row.eq.maThietBi} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {row.eq.maThietBi}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        {row.eq.tenThietBi}
                        {row.overduePlan && (
                          <span
                            title="Đang quá hạn bảo trì định kỳ"
                            className="text-rose-400 inline-flex items-center"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {row.eq.heThong} · {row.eq.trangThai}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400 tabular-nums">
                      {row.plannedCount}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-300 tabular-nums">
                      {row.repairCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300 tabular-nums">
                      {row.totalDowntimeMin} p
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-400 tabular-nums">
                      {(row.availability * 100).toFixed(0)} / {(row.performance * 100).toFixed(0)} /{' '}
                      {(row.quality * 100).toFixed(0)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono font-bold tabular-nums ${
                        row.oee >= 85
                          ? 'text-emerald-400'
                          : row.oee >= 70
                          ? 'text-amber-300'
                          : 'text-rose-400'
                      }`}
                    >
                      {row.oee.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-300 tabular-nums">
                      {row.mtbfHours.toLocaleString('vi-VN')}h
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-300 tabular-nums">
                      {row.mttrMinutes.toFixed(1)}p
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenMaintenanceModal(row.eq, 'Bảo trì theo kế hoạch')}
                          title="Bảo trì theo kế hoạch"
                          className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 transition"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenMaintenanceModal(row.eq, 'Sửa chữa')}
                          title="Ghi nhận sửa chữa"
                          className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 transition"
                        >
                          <Hammer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenQR(row.eq)}
                          title="Xem QR thiết bị"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SmartHorizontalScroll>
        </div>
      </div>
    </div>
  );
};
