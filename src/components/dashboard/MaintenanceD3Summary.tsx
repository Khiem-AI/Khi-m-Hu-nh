import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { Equipment, MaintenancePlan, RiskLevel } from '../../types/cmms';
import { formatDateVN, getTodayISODate } from '../../utils/cmmsLogic';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Flame,
  ShieldAlert,
  Wrench,
} from 'lucide-react';

const APP_TODAY = getTodayISODate();

function parseYMD(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function diffDays(targetYmd: string, baseYmd: string): number {
  const t = parseYMD(targetYmd).getTime();
  const b = parseYMD(baseYmd).getTime();
  return Math.round((t - b) / 86400000);
}

interface EnrichedPlan {
  plan: MaintenancePlan;
  eq?: Equipment;
  daysDelta: number;
  risk: RiskLevel;
  system: string;
  isCritical: boolean;
}

interface MaintenanceD3SummaryProps {
  onOpenMaintenanceModal: (eq: Equipment) => void;
  onNavigateTab: (tabId: string) => void;
}

type FocusFilter = 'ALL_URGENT' | 'Quá hạn' | 'Tới hạn' | 'Sắp tới' | 'HIGH_RISK';

export const MaintenanceD3Summary: React.FC<MaintenanceD3SummaryProps> = ({
  onOpenMaintenanceModal,
  onNavigateTab,
}) => {
  const { maintenancePlans, equipment, theme } = useCMMS();
  const isLight = theme === 'light';

  const [focusFilter, setFocusFilter] = useState<FocusFilter>('ALL_URGENT');
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    title: string;
    lines: string[];
    x: number;
    y: number;
  } | null>(null);

  const donutRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const systemBarRef = useRef<HTMLDivElement | null>(null);

  const [containerWidths, setContainerWidths] = useState({
    donut: 260,
    timeline: 520,
    system: 420,
  });

  useEffect(() => {
    const observers: ResizeObserver[] = [];
    const bindObserver = (
      el: HTMLDivElement | null,
      key: keyof typeof containerWidths
    ) => {
      if (!el) return;
      const update = () => {
        const w = Math.max(220, Math.floor(el.clientWidth));
        setContainerWidths((prev) => (prev[key] === w ? prev : { ...prev, [key]: w }));
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      observers.push(ro);
    };

    bindObserver(donutRef.current, 'donut');
    bindObserver(timelineRef.current, 'timeline');
    bindObserver(systemBarRef.current, 'system');

    return () => observers.forEach((ro) => ro.disconnect());
  }, []);

  const eqMap = useMemo(() => {
    const map = new Map<string, Equipment>();
    equipment.forEach((e) => map.set(e.maThietBi, e));
    return map;
  }, [equipment]);

  const enrichedPlans = useMemo<EnrichedPlan[]>(() => {
    return maintenancePlans
      .map((plan) => {
        const eq = eqMap.get(plan.maThietBi);
        const daysDelta = plan.ngayBaoTriTiepTheo
          ? diffDays(plan.ngayBaoTriTiepTheo, APP_TODAY)
          : 999;
        const risk: RiskLevel = eq?.mucDoRuiRo || 'Medium';
        const system = eq?.heThong || 'Khác';
        const isCritical =
          plan.trangThai === 'Quá hạn' ||
          plan.trangThai === 'Tới hạn' ||
          plan.trangThai === 'Sắp tới' ||
          (risk === 'High' && daysDelta <= 30);

        return { plan, eq, daysDelta, risk, system, isCritical };
      })
      .sort((a, b) => {
        if (a.daysDelta !== b.daysDelta) return a.daysDelta - b.daysDelta;
        const rank = { High: 0, Medium: 1, Low: 2 };
        return rank[a.risk] - rank[b.risk];
      });
  }, [maintenancePlans, eqMap]);

  const statusCounts = useMemo(() => {
    const counts = {
      'Quá hạn': 0,
      'Tới hạn': 0,
      'Sắp tới': 0,
      'Đúng hạn': 0,
    };
    enrichedPlans.forEach((item) => {
      counts[item.plan.trangThai] = (counts[item.plan.trangThai] || 0) + 1;
    });
    return counts;
  }, [enrichedPlans]);

  const highRiskUrgentCount = useMemo(
    () =>
      enrichedPlans.filter(
        (x) =>
          x.risk === 'High' &&
          (x.plan.trangThai === 'Quá hạn' ||
            x.plan.trangThai === 'Tới hạn' ||
            x.daysDelta <= 30)
      ).length,
    [enrichedPlans]
  );

  const criticalItems = useMemo(() => {
    let list = enrichedPlans.filter((x) => x.isCritical);
    if (focusFilter === 'Quá hạn') {
      list = enrichedPlans.filter((x) => x.plan.trangThai === 'Quá hạn');
    } else if (focusFilter === 'Tới hạn') {
      list = enrichedPlans.filter((x) => x.plan.trangThai === 'Tới hạn');
    } else if (focusFilter === 'Sắp tới') {
      list = enrichedPlans.filter((x) => x.plan.trangThai === 'Sắp tới');
    } else if (focusFilter === 'HIGH_RISK') {
      list = enrichedPlans.filter((x) => x.risk === 'High' && x.daysDelta <= 30);
    }
    return list;
  }, [enrichedPlans, focusFilter]);

  const timelineItems = useMemo(() => criticalItems.slice(0, 10), [criticalItems]);

  const systemBacklogData = useMemo(() => {
    const grouped = new Map<
      string,
      { system: string; overdue: number; dueToday: number; upcoming: number; total: number }
    >();
    enrichedPlans.forEach((item) => {
      if (
        item.plan.trangThai !== 'Quá hạn' &&
        item.plan.trangThai !== 'Tới hạn' &&
        item.plan.trangThai !== 'Sắp tới' &&
        !(item.risk === 'High' && item.daysDelta <= 30)
      ) {
        return;
      }
      const key = item.system;
      const prev = grouped.get(key) || {
        system: key,
        overdue: 0,
        dueToday: 0,
        upcoming: 0,
        total: 0,
      };
      if (item.plan.trangThai === 'Quá hạn') prev.overdue += 1;
      else if (item.plan.trangThai === 'Tới hạn') prev.dueToday += 1;
      else prev.upcoming += 1;
      prev.total += 1;
      grouped.set(key, prev);
    });
    return Array.from(grouped.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [enrichedPlans]);

  // 1. D3 Donut Chart (Status Breakdown)
  useEffect(() => {
    const container = donutRef.current;
    if (!container) return;
    d3.select(container).selectAll('*').remove();

    const width = Math.min(containerWidths.donut, 280);
    const height = 220;
    const radius = Math.min(width, height) / 2 - 12;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    type DonutDatum = {
      key: 'Quá hạn' | 'Tới hạn' | 'Sắp tới' | 'Đúng hạn';
      label: string;
      value: number;
      color: string;
    };

    const rawDataset: DonutDatum[] = [
      { key: 'Quá hạn', label: 'Quá hạn', value: statusCounts['Quá hạn'], color: '#f43f5e' },
      { key: 'Tới hạn', label: 'Tới hạn', value: statusCounts['Tới hạn'], color: '#f59e0b' },
      { key: 'Sắp tới', label: 'Sắp tới', value: statusCounts['Sắp tới'], color: '#06b6d4' },
      { key: 'Đúng hạn', label: 'Đúng hạn', value: statusCounts['Đúng hạn'], color: '#10b981' },
    ];
    const dataset = rawDataset.filter((d) => d.value > 0);

    const totalPlans = maintenancePlans.length || 1;
    const urgentTotal = statusCounts['Quá hạn'] + statusCounts['Tới hạn'] + statusCounts['Sắp tới'];

    if (dataset.length === 0) return;

    const pie = d3
      .pie<DonutDatum>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.03);

    const arc = d3
      .arc<d3.PieArcDatum<DonutDatum>>()
      .innerRadius(radius * 0.62)
      .outerRadius(radius)
      .cornerRadius(5);

    const arcHover = d3
      .arc<d3.PieArcDatum<DonutDatum>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius + 6)
      .cornerRadius(5);

    g.selectAll<SVGPathElement, d3.PieArcDatum<DonutDatum>>('path')
      .data(pie(dataset))
      .join('path')
      .attr('d', (d) => arc(d) ?? '')
      .attr('fill', (d) => d.data.color)
      .attr('stroke', isLight ? '#ffffff' : '#0f172a')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('opacity', (d) => {
        if (focusFilter === 'ALL_URGENT' || focusFilter === 'HIGH_RISK') return 1;
        return d.data.key === focusFilter ? 1 : 0.35;
      })
      .on('mouseenter', function (event, d) {
        d3.select<SVGPathElement, d3.PieArcDatum<DonutDatum>>(this)
          .transition()
          .duration(150)
          .attr('d', (datum) => arcHover(datum) ?? '');
        const pct = ((d.data.value / totalPlans) * 100).toFixed(1);
        setHoveredTooltip({
          title: d.data.label,
          lines: [`${d.data.value} thiết bị (${pct}%)`],
          x: event.clientX,
          y: event.clientY,
        });
      })
      .on('mousemove', (event) => {
        setHoveredTooltip((prev) =>
          prev ? { ...prev, x: event.clientX, y: event.clientY } : null
        );
      })
      .on('mouseleave', function () {
        d3.select<SVGPathElement, d3.PieArcDatum<DonutDatum>>(this)
          .transition()
          .duration(150)
          .attr('d', (datum) => arc(datum) ?? '');
        setHoveredTooltip(null);
      })
      .on('click', (_, d) => {
        const key = d.data.key;
        if (key === 'Đúng hạn') {
          setFocusFilter('ALL_URGENT');
        } else {
          setFocusFilter((prev) => (prev === key ? 'ALL_URGENT' : key));
        }
      });

    // Center KPI text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.25em')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', '26px')
      .style('font-weight', '800')
      .style('fill', urgentTotal > 0 ? '#f43f5e' : isLight ? '#0f172a' : '#f1f5f9')
      .text(String(urgentTotal));

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.25em')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', isLight ? '#475569' : '#94a3b8')
      .text(`Cần xử lý / ${maintenancePlans.length}`);
  }, [containerWidths.donut, statusCounts, maintenancePlans.length, focusFilter, isLight]);

  // 2. D3 Diverging Urgency Timeline Bar Chart (Days Delta from Today)
  useEffect(() => {
    const container = timelineRef.current;
    if (!container) return;
    d3.select(container).selectAll('*').remove();

    const width = Math.max(280, containerWidths.timeline);
    const barRowHeight = 30;
    const margin = { top: 24, right: 44, bottom: 28, left: 102 };
    const innerHeight = Math.max(160, timelineItems.length * barRowHeight);
    const height = innerHeight + margin.top + margin.bottom;
    const innerWidth = Math.max(120, width - margin.left - margin.right);

    if (timelineItems.length === 0) return;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const minDelta = Math.min(-5, d3.min(timelineItems, (d) => d.daysDelta) ?? -5);
    const maxDelta = Math.max(7, d3.max(timelineItems, (d) => d.daysDelta) ?? 7);

    const x = d3
      .scaleLinear()
      .domain([minDelta, maxDelta])
      .nice()
      .range([0, innerWidth]);

    const y = d3
      .scaleBand()
      .domain(timelineItems.map((d) => d.plan.id))
      .range([0, innerHeight])
      .padding(0.28);

    // Grid lines
    const gridColor = isLight ? '#e2e8f0' : '#1e293b';
    const axisTextColor = isLight ? '#475569' : '#94a3b8';

    g.append('g')
      .selectAll('line')
      .data(x.ticks(5))
      .join('line')
      .attr('x1', (d) => x(d))
      .attr('x2', (d) => x(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', gridColor)
      .attr('stroke-dasharray', '3,3');

    // Zero / Today vertical reference line
    const zeroX = x(0);
    g.append('line')
      .attr('x1', zeroX)
      .attr('x2', zeroX)
      .attr('y1', -8)
      .attr('y2', innerHeight)
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1.75);

    g.append('text')
      .attr('x', zeroX)
      .attr('y', -12)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', isLight ? '#b45309' : '#fbbf24')
      .text('Hôm nay');

    // Bottom axis
    const xAxis = d3
      .axisBottom(x)
      .ticks(5)
      .tickFormat((d) => {
        const num = Number(d);
        return num > 0 ? `+${num}n` : `${num}n`;
      });

    const axisG = g
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    axisG.selectAll('path, line').attr('stroke', isLight ? '#cbd5e1' : '#334155');
    axisG
      .selectAll('text')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', '10px')
      .style('fill', axisTextColor);

    // Bars
    const getColor = (item: EnrichedPlan) => {
      if (item.plan.trangThai === 'Quá hạn') return '#f43f5e';
      if (item.plan.trangThai === 'Tới hạn') return '#f59e0b';
      if (item.risk === 'High') return '#a855f7';
      return '#06b6d4';
    };

    g.selectAll('rect.urgency-bar')
      .data(timelineItems)
      .join('rect')
      .attr('class', 'urgency-bar')
      .attr('y', (d) => y(d.plan.id) ?? 0)
      .attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('x', (d) => (d.daysDelta < 0 ? x(d.daysDelta) : zeroX))
      .attr('width', (d) => {
        const w = Math.abs(x(d.daysDelta) - zeroX);
        return Math.max(w, 6);
      })
      .attr('fill', (d) => getColor(d))
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).style('opacity', 0.85);
        const dayText =
          d.daysDelta < 0
            ? `Quá hạn ${Math.abs(d.daysDelta)} ngày`
            : d.daysDelta === 0
            ? 'Tới hạn hôm nay'
            : `Còn ${d.daysDelta} ngày`;
        setHoveredTooltip({
          title: `${d.plan.maThietBi} — ${d.plan.tenThietBi}`,
          lines: [
            `Trạng thái: ${dayText} (${formatDateVN(d.plan.ngayBaoTriTiepTheo)})`,
            `Hệ thống: ${d.system} • Rủi ro: ${d.risk}`,
            `Phụ trách: ${d.plan.nguoiPhuTrach}`,
          ],
          x: event.clientX,
          y: event.clientY,
        });
      })
      .on('mousemove', (event) => {
        setHoveredTooltip((prev) =>
          prev ? { ...prev, x: event.clientX, y: event.clientY } : null
        );
      })
      .on('mouseleave', function () {
        d3.select(this).style('opacity', 1);
        setHoveredTooltip(null);
      })
      .on('click', (_, d) => {
        if (d.eq) onOpenMaintenanceModal(d.eq);
      });

    // Left equipment code labels
    g.selectAll('text.eq-label')
      .data(timelineItems)
      .join('text')
      .attr('class', 'eq-label')
      .attr('x', -8)
      .attr('y', (d) => (y(d.plan.id) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', '11px')
      .style('font-weight', '700')
      .style('fill', (d) =>
        d.plan.trangThai === 'Quá hạn'
          ? isLight
            ? '#be123c'
            : '#fda4af'
          : isLight
          ? '#0f172a'
          : '#e2e8f0'
      )
      .style('cursor', 'pointer')
      .text((d) =>
        d.plan.maThietBi.length > 13
          ? `${d.plan.maThietBi.slice(0, 12)}…`
          : d.plan.maThietBi
      )
      .on('click', (_, d) => {
        if (d.eq) onOpenMaintenanceModal(d.eq);
      });

    // Day delta value labels
    g.selectAll('text.val-label')
      .data(timelineItems)
      .join('text')
      .attr('class', 'val-label')
      .attr('y', (d) => (y(d.plan.id) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('x', (d) => {
        if (d.daysDelta < 0) return x(d.daysDelta) - 4;
        return Math.max(x(d.daysDelta), zeroX + 6) + 5;
      })
      .attr('text-anchor', (d) => (d.daysDelta < 0 ? 'end' : 'start'))
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', (d) => getColor(d))
      .text((d) => {
        if (d.daysDelta < 0) return `${d.daysDelta}n`;
        if (d.daysDelta === 0) return '0n';
        return `+${d.daysDelta}n`;
      });
  }, [containerWidths.timeline, timelineItems, isLight, onOpenMaintenanceModal]);

  // 3. D3 Stacked Horizontal Bar Chart by Plant System
  useEffect(() => {
    const container = systemBarRef.current;
    if (!container) return;
    d3.select(container).selectAll('*').remove();

    const width = Math.max(240, containerWidths.system);
    const margin = { top: 10, right: 32, bottom: 24, left: 112 };
    const rowH = 30;
    const innerHeight = Math.max(130, systemBacklogData.length * rowH);
    const height = innerHeight + margin.top + margin.bottom;
    const innerWidth = Math.max(90, width - margin.left - margin.right);

    if (systemBacklogData.length === 0) return;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const keys = ['overdue', 'dueToday', 'upcoming'] as const;
    const colors: Record<(typeof keys)[number], string> = {
      overdue: '#f43f5e',
      dueToday: '#f59e0b',
      upcoming: '#06b6d4',
    };

    const stacked = d3.stack<(typeof systemBacklogData)[number]>().keys(keys)(
      systemBacklogData
    );

    const maxTotal = Math.max(1, d3.max(systemBacklogData, (d) => d.total) ?? 1);

    const x = d3.scaleLinear().domain([0, maxTotal]).nice().range([0, innerWidth]);
    const y = d3
      .scaleBand()
      .domain(systemBacklogData.map((d) => d.system))
      .range([0, innerHeight])
      .padding(0.32);

    const xAxis = d3.axisBottom(x).ticks(Math.min(5, maxTotal)).tickFormat(d3.format('d'));
    const axisG = g
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    axisG.selectAll('path, line').attr('stroke', isLight ? '#cbd5e1' : '#334155');
    axisG
      .selectAll('text')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', '10px')
      .style('fill', isLight ? '#475569' : '#94a3b8');

    g.selectAll('g.layer')
      .data(stacked)
      .join('g')
      .attr('class', 'layer')
      .attr('fill', (d) => colors[d.key as (typeof keys)[number]])
      .selectAll('rect')
      .data((d) => d)
      .join('rect')
      .attr('y', (d) => y(d.data.system) ?? 0)
      .attr('x', (d) => x(d[0]))
      .attr('width', (d) => Math.max(0, x(d[1]) - x(d[0])))
      .attr('height', y.bandwidth())
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        setHoveredTooltip({
          title: d.data.system,
          lines: [
            `Quá hạn: ${d.data.overdue}`,
            `Tới hạn: ${d.data.dueToday}`,
            `Sắp tới / Rủi ro cao: ${d.data.upcoming}`,
          ],
          x: event.clientX,
          y: event.clientY,
        });
      })
      .on('mousemove', (event) => {
        setHoveredTooltip((prev) =>
          prev ? { ...prev, x: event.clientX, y: event.clientY } : null
        );
      })
      .on('mouseleave', () => setHoveredTooltip(null));

    // Left system labels
    g.selectAll('text.sys-label')
      .data(systemBacklogData)
      .join('text')
      .attr('class', 'sys-label')
      .attr('x', -8)
      .attr('y', (d) => (y(d.system) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', isLight ? '#1e293b' : '#cbd5e1')
      .text((d) => (d.system.length > 16 ? `${d.system.slice(0, 15)}…` : d.system));

    // Right totals
    g.selectAll('text.sys-total')
      .data(systemBacklogData)
      .join('text')
      .attr('class', 'sys-total')
      .attr('x', (d) => x(d.total) + 6)
      .attr('y', (d) => (y(d.system) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', '11px')
      .style('font-weight', '700')
      .style('fill', isLight ? '#0f172a' : '#f1f5f9')
      .text((d) => String(d.total));
  }, [containerWidths.system, systemBacklogData, isLight]);

  return (
    <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-5 space-y-5 shadow-xl relative">
      {/* Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-bold text-slate-100 text-base">
              {UI_TEXTS.dashboard.d3SummaryTitle}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>Quá hạn: <strong className="text-rose-400 font-mono">{statusCounts['Quá hạn']}</strong></span>
              <span>•</span>
              <span>Tới hạn: <strong className="text-amber-300 font-mono">{statusCounts['Tới hạn']}</strong></span>
              <span>•</span>
              <span>Sắp tới: <strong className="text-cyan-400 font-mono">{statusCounts['Sắp tới']}</strong></span>
              <span>•</span>
              <span>Rủi ro cao (30 ngày): <strong className="text-purple-400 font-mono">{highRiskUrgentCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Interactive Focus Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'ALL_URGENT', label: 'Tất cả ưu tiên' },
              { id: 'Quá hạn', label: `Quá hạn (${statusCounts['Quá hạn']})` },
              { id: 'Tới hạn', label: `Tới hạn (${statusCounts['Tới hạn']})` },
              { id: 'Sắp tới', label: `Sắp tới (${statusCounts['Sắp tới']})` },
              { id: 'HIGH_RISK', label: `Rủi ro cao (${highRiskUrgentCount})` },
            ] as { id: FocusFilter; label: string }[]
          ).map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFocusFilter(btn.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                focusFilter === btn.id
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* D3 Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Chart 1: D3 Status Donut */}
        <div className="xl:col-span-3 rounded-xl bg-slate-950/60 border border-slate-800 p-4 flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
            Tỷ Lệ Trạng Thái Kế Hoạch
          </div>
          <div ref={donutRef} className="w-full flex items-center justify-center min-h-[220px]" />
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span>Quá hạn: {statusCounts['Quá hạn']}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>Tới hạn: {statusCounts['Tới hạn']}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
              <span>Sắp tới: {statusCounts['Sắp tới']}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Đúng hạn: {statusCounts['Đúng hạn']}</span>
            </div>
          </div>
        </div>

        {/* Chart 2: D3 Urgency Timeline (Days Delta) */}
        <div className="xl:col-span-5 rounded-xl bg-slate-950/60 border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>Biểu Đồ Độ Trễ & Hạn Sắp Tới (Ngày)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Top {timelineItems.length} thiết bị
            </span>
          </div>
          {timelineItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 min-h-[200px]">
              Không có hạng mục bảo trì nào thuộc nhóm đã chọn.
            </div>
          ) : (
            <div ref={timelineRef} className="w-full min-h-[200px]" />
          )}
        </div>

        {/* Chart 3: D3 Stacked Bar by System */}
        <div className="xl:col-span-4 rounded-xl bg-slate-950/60 border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Phân Bổ Theo Hệ Thống</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-rose-500" /> Trễ
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-amber-500" /> Nay
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-cyan-500" /> Sắp tới
              </span>
            </div>
          </div>
          {systemBacklogData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 min-h-[160px]">
              Tất cả hệ thống đang đúng hạn.
            </div>
          ) : (
            <div ref={systemBarRef} className="w-full min-h-[160px]" />
          )}
        </div>
      </div>

      {/* Critical & Overdue Action Spotlight Strip */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Danh Sách Ưu Tiên Xử Lý ({criticalItems.length})
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab('maintenance')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
          >
            Mở Kế Hoạch Bảo Trì
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {criticalItems.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 text-center">
            Không có thiết bị quá hạn hoặc tới hạn trong bộ lọc hiện tại.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {criticalItems.slice(0, 6).map(({ plan, eq, daysDelta, risk, system }) => (
              <div
                key={`crit-${plan.id}`}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                  plan.trangThai === 'Quá hạn'
                    ? 'bg-rose-950/25 border-rose-500/35'
                    : plan.trangThai === 'Tới hạn'
                    ? 'bg-amber-950/25 border-amber-500/35'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {plan.maThietBi}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        daysDelta < 0
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : daysDelta === 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {daysDelta < 0
                        ? `Quá hạn ${Math.abs(daysDelta)} ngày`
                        : daysDelta === 0
                        ? 'Hôm nay'
                        : `Còn ${daysDelta} ngày`}
                    </span>
                    {risk === 'High' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        High Risk
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {plan.tenThietBi}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {system} • Hạn: {formatDateVN(plan.ngayBaoTriTiepTheo)}
                  </div>
                </div>

                {eq && (
                  <button
                    type="button"
                    onClick={() => onOpenMaintenanceModal(eq)}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow transition"
                  >
                    <Wrench className="w-3 h-3" />
                    Bảo Trì
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating D3 Hover Tooltip */}
      {hoveredTooltip && (
        <div
          style={{
            position: 'fixed',
            left: hoveredTooltip.x + 14,
            top: hoveredTooltip.y + 14,
            zIndex: 60,
            pointerEvents: 'none',
          }}
          className="max-w-xs rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 shadow-2xl text-xs space-y-1"
        >
          <div className="font-bold text-slate-100">{hoveredTooltip.title}</div>
          {hoveredTooltip.lines.map((line, idx) => (
            <div key={idx} className="text-[11px] text-slate-300">
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
