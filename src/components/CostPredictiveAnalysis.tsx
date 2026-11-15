import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useCMMS } from '../context/CMMSContext';
import { buildSixMonthCostForecast, MonthlyCostPoint } from '../utils/costForecasting';
import { formatVND } from '../utils/cmmsLogic';
import { SmartHorizontalScroll } from './common/SmartHorizontalScroll';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  CalendarClock,
  SlidersHorizontal,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

function formatCompactVND(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(0)} tr`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)} k`;
  }
  return `${value}`;
}

export const CostPredictiveAnalysis: React.FC = () => {
  const {
    costRecords,
    maintenanceHistory,
    maintenancePlans,
    equipment,
    spareParts,
    stockTransactions,
    safetyInspections,
    theme,
  } = useCMMS();

  const isLight = theme === 'light';

  // Interactive scenario parameters
  const [lookbackMonths, setLookbackMonths] = useState<3 | 6>(6);
  const [contingencyPct, setContingencyPct] = useState<number>(10);
  const [includeSafetyInspections, setIncludeSafetyInspections] = useState<boolean>(true);
  const [selectedForecastKey, setSelectedForecastKey] = useState<string | null>(null);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(720);
  const [hoverInfo, setHoverInfo] = useState<{
    point: MonthlyCostPoint;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const next = Math.max(320, Math.floor(el.clientWidth));
      setChartWidth((prev) => (prev === next ? prev : next));
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const forecast = useMemo(
    () =>
      buildSixMonthCostForecast(
        {
          costRecords,
          maintenanceHistory,
          maintenancePlans,
          equipment,
          spareParts,
          stockTransactions,
          safetyInspections,
        },
        {
          anchorMonth: '2026-11',
          lookbackMonths,
          contingencyPct,
          includeSafetyInspections,
        }
      ),
    [
      costRecords,
      maintenanceHistory,
      maintenancePlans,
      equipment,
      spareParts,
      stockTransactions,
      safetyInspections,
      lookbackMonths,
      contingencyPct,
      includeSafetyInspections,
    ]
  );

  // Default selected forecast month to peak or first forecast month
  const activeSelectedMonth = useMemo(() => {
    if (selectedForecastKey) {
      const found = forecast.forecastMonths.find((m) => m.monthKey === selectedForecastKey);
      if (found) return found;
    }
    return forecast.peakForecastMonth || forecast.forecastMonths[0] || null;
  }, [selectedForecastKey, forecast.forecastMonths, forecast.peakForecastMonth]);

  // Draw D3 Historical + 6-Month Predictive Trend-Line Chart
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;
    d3.select(container).selectAll('*').remove();

    const data = forecast.timeline;
    if (data.length === 0) return;

    const width = Math.max(320, chartWidth);
    const height = 290;
    const margin = { top: 28, right: 24, bottom: 38, left: 64 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('display', 'block');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerW])
      .padding(0.28);

    const maxVal =
      d3.max(data, (d) =>
        Math.max(
          d.actualTotal || 0,
          d.confidenceHigh || 0,
          d.forecastTotal || 0,
          d.trendValue || 0
        )
      ) || 10_000_000;

    const y = d3
      .scaleLinear()
      .domain([0, maxVal * 1.15])
      .nice()
      .range([innerH, 0]);

    // Forecast zone background shading (starting at index 6 = first forecast month)
    const firstForecast = data.find((d) => d.isForecast);
    if (firstForecast) {
      const dividerX = (x(firstForecast.label) ?? innerW / 2) - x.step() * 0.14;
      g.append('rect')
        .attr('x', dividerX)
        .attr('y', 0)
        .attr('width', Math.max(0, innerW - dividerX))
        .attr('height', innerH)
        .attr('rx', 6)
        .attr('fill', isLight ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.06)');

      g.append('line')
        .attr('x1', dividerX)
        .attr('x2', dividerX)
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', isLight ? '#94a3b8' : '#475569')
        .attr('stroke-width', 1.25)
        .attr('stroke-dasharray', '4,4');

      g.append('text')
        .attr('x', dividerX + 8)
        .attr('y', 12)
        .attr('fill', isLight ? '#047857' : '#34d399')
        .style('font-size', '10px')
        .style('font-weight', '700')
        .text('Vùng dự báo 6 tháng tới');

      g.append('text')
        .attr('x', dividerX - 8)
        .attr('y', 12)
        .attr('text-anchor', 'end')
        .attr('fill', isLight ? '#475569' : '#94a3b8')
        .style('font-size', '10px')
        .style('font-weight', '600')
        .text('Lịch sử thực tế');
    }

    // Horizontal Gridlines
    g.append('g')
      .selectAll('line')
      .data(y.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', isLight ? '#e2e8f0' : '#1e293b')
      .attr('stroke-dasharray', '3,3');

    // X Axis
    g.append('g')
      .attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(x))
      .call((axis) => axis.select('.domain').attr('stroke', isLight ? '#cbd5e1' : '#334155'))
      .selectAll('text')
      .attr('fill', (label) => {
        const pt = data.find((d) => d.label === label);
        if (pt?.isForecast) return isLight ? '#047857' : '#6ee7b7';
        return isLight ? '#475569' : '#94a3b8';
      })
      .style('font-size', '10px')
      .style('font-weight', '600');

    // Y Axis
    g.append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((d) => formatCompactVND(Number(d)))
      )
      .call((axis) => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', isLight ? '#475569' : '#94a3b8')
      .style('font-size', '10px')
      .style('font-variant-numeric', 'tabular-nums');

    // Subtle Bars: Historical vs Forecast Stacked Components (Cycle vs Consumption)
    const barW = Math.min(26, x.bandwidth() * 0.72);
    const barOffset = (x.bandwidth() - barW) / 2;

    data.forEach((pt) => {
      const bx = (x(pt.label) ?? 0) + barOffset;
      if (!pt.isForecast) {
        const total = pt.actualTotal || 0;
        if (total > 0) {
          g.append('rect')
            .attr('x', bx)
            .attr('y', y(total))
            .attr('width', barW)
            .attr('height', Math.max(2, innerH - y(total)))
            .attr('rx', 3)
            .attr('fill', isLight ? 'rgba(14, 165, 233, 0.22)' : 'rgba(56, 189, 248, 0.22)')
            .attr('stroke', isLight ? 'rgba(14, 165, 233, 0.5)' : 'rgba(56, 189, 248, 0.45)')
            .attr('stroke-width', 1);
        }
      } else {
        const cyclePlusInsp = pt.forecastCycleCost + pt.forecastInspectionCost;
        const consumption = pt.forecastConsumptionCost;
        const total = cyclePlusInsp + consumption;

        // Bottom stack: Scheduled Cycle + Inspection
        if (cyclePlusInsp > 0) {
          g.append('rect')
            .attr('x', bx)
            .attr('y', y(cyclePlusInsp))
            .attr('width', barW)
            .attr('height', Math.max(2, innerH - y(cyclePlusInsp)))
            .attr('rx', 2)
            .attr('fill', isLight ? 'rgba(16, 185, 129, 0.26)' : 'rgba(16, 185, 129, 0.28)');
        }
        // Top stack: Consumption & Reactive Repair
        if (consumption > 0) {
          g.append('rect')
            .attr('x', bx)
            .attr('y', y(total))
            .attr('width', barW)
            .attr('height', Math.max(2, y(cyclePlusInsp) - y(total)))
            .attr('rx', 2)
            .attr('fill', isLight ? 'rgba(99, 102, 241, 0.22)' : 'rgba(129, 140, 248, 0.25)');
        }
      }
    });

    // Confidence Interval Band for Forecast Months
    const forecastWithAnchor = data.filter((d, idx) => d.isForecast || idx === 5);
    const bandArea = d3
      .area<MonthlyCostPoint>()
      .x((d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .y0((d) => y(d.isForecast ? d.confidenceLow ?? 0 : d.actualTotal ?? 0))
      .y1((d) => y(d.isForecast ? d.confidenceHigh ?? 0 : d.actualTotal ?? 0))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(forecastWithAnchor)
      .attr('d', bandArea)
      .attr('fill', isLight ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.14)');

    // 1. Historical Actual Line (solid cyan/blue)
    const historicalData = data.filter((d) => !d.isForecast);
    const actualLine = d3
      .line<MonthlyCostPoint>()
      .x((d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .y((d) => y(d.actualTotal ?? 0))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(historicalData)
      .attr('d', actualLine)
      .attr('fill', 'none')
      .attr('stroke', isLight ? '#0284c7' : '#38bdf8')
      .attr('stroke-width', 2.5);

    // 2. Forecast Total Line (dashed emerald connecting from last historical month)
    const forecastLine = d3
      .line<MonthlyCostPoint>()
      .x((d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .y((d) => y(d.isForecast ? d.forecastTotal ?? 0 : d.actualTotal ?? 0))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(forecastWithAnchor)
      .attr('d', forecastLine)
      .attr('fill', 'none')
      .attr('stroke', isLight ? '#059669' : '#10b981')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '6,4');

    // 3. Linear Regression Trend Line across all 12 months (amber)
    const trendLine = d3
      .line<MonthlyCostPoint>()
      .x((d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .y((d) => y(d.trendValue));

    g.append('path')
      .datum(data)
      .attr('d', trendLine)
      .attr('fill', 'none')
      .attr('stroke', isLight ? '#d97706' : '#f59e0b')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '2,3');

    // Data point nodes
    g.selectAll('.cost-node')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .attr('cy', (d) => y(d.isForecast ? d.forecastTotal ?? 0 : d.actualTotal ?? 0))
      .attr('r', (d) =>
        d.isForecast && activeSelectedMonth?.monthKey === d.monthKey ? 6 : 4.2
      )
      .attr('fill', (d) =>
        d.isForecast
          ? isLight
            ? '#059669'
            : '#10b981'
          : isLight
          ? '#0284c7'
          : '#38bdf8'
      )
      .attr('stroke', isLight ? '#ffffff' : '#0f172a')
      .attr('stroke-width', 2);

    // Invisible hover hit-targets per band column for smooth interactive tooltips & click selection
    g.selectAll('.hover-band')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d.label) ?? 0)
      .attr('y', 0)
      .attr('width', x.bandwidth())
      .attr('height', innerH)
      .attr('fill', 'transparent')
      .style('cursor', (d) => (d.isForecast ? 'pointer' : 'default'))
      .on('mousemove', (event, d) => {
        const rect = container.getBoundingClientRect();
        setHoverInfo({
          point: d,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      })
      .on('mouseleave', () => setHoverInfo(null))
      .on('click', (_event, d) => {
        if (d.isForecast) {
          setSelectedForecastKey(d.monthKey);
        }
      });
  }, [forecast.timeline, chartWidth, isLight, activeSelectedMonth]);

  const handleExportForecastCSV = () => {
    const headers = [
      'Tháng',
      'Loại Dữ Liệu',
      'Chi Phí Chu Kỳ Bảo Trì (VNĐ)',
      'Chi Phí Kiểm Định An Toàn (VNĐ)',
      'Chi Phí Tiêu Hao & Sửa Chữa (VNĐ)',
      'Tổng Chi Phí (VNĐ)',
      'Đường Xu Hướng Tuyến Tính (VNĐ)',
      'Biên Độ Thấp (VNĐ)',
      'Biên Độ Cao (VNĐ)',
      'Lượt Bảo Trì Chu Kỳ',
    ];
    const rows = forecast.timeline.map((p) => {
      const total = p.isForecast ? p.forecastTotal || 0 : p.actualTotal || 0;
      const cycle = p.isForecast ? p.forecastCycleCost : p.actualScheduledCost;
      const insp = p.isForecast ? p.forecastInspectionCost : 0;
      const cons = p.isForecast ? p.forecastConsumptionCost : p.actualConsumptionCost;
      return [
        `"${p.fullLabel}"`,
        `"${p.isForecast ? 'Dự báo' : 'Lịch sử thực tế'}"`,
        cycle,
        insp,
        cons,
        total,
        p.trendValue,
        p.confidenceLow ?? '',
        p.confidenceHigh ?? '',
        p.plannedTaskCount,
      ];
    });
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Du_bao_chi_phi_bao_tri_6_thang_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      aria-label="Phân tích dự báo chi phí bảo trì 6 tháng tới"
      className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5"
    >
      {/* Top Header & Scenario Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-emerald-400">Phân Tích Dự Báo 6 Tháng</span>
            <span aria-hidden="true">·</span>
            <span>Dữ liệu lịch sử tiêu hao &amp; chu kỳ {maintenancePlans.length} thiết bị</span>
            <span aria-hidden="true">·</span>
            <span>Hồi quy tuyến tính (OLS)</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
            Ước Tính Ngân Sách &amp; Xu Hướng Chi Phí Bảo Trì (12/2026 – 05/2027)
          </h3>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Lookback Window Switcher */}
          <div
            className="inline-flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800"
            role="group"
            aria-label="Chuỗi lịch sử tham chiếu"
          >
            <button
              type="button"
              onClick={() => setLookbackMonths(3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                lookbackMonths === 3
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3 tháng gần nhất
            </button>
            <button
              type="button"
              onClick={() => setLookbackMonths(6)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                lookbackMonths === 6
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              6 tháng gần nhất
            </button>
          </div>

          {/* Contingency Buffer Selector */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <label htmlFor="forecast-contingency" className="text-xs text-slate-400 whitespace-nowrap">
              Dự phòng:
            </label>
            <select
              id="forecast-contingency"
              value={contingencyPct}
              onChange={(e) => setContingencyPct(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={0}>0% (Cơ sở)</option>
              <option value={10}>+10% (Khuyến nghị)</option>
              <option value={20}>+20% (Biến động cao)</option>
            </select>
          </div>

          {/* Safety Inspection Toggle */}
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-300 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={includeSafetyInspections}
              onChange={(e) => setIncludeSafetyInspections(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500"
            />
            <span>Kèm kiểm định an toàn</span>
          </label>

          {/* Export Forecast CSV */}
          <button
            type="button"
            onClick={handleExportForecastCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 whitespace-nowrap shrink-0 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Xuất Dự Báo CSV
          </button>
        </div>
      </div>

      {/* 4-Metric Hairline Summary Strip (No Nested Card Bloat) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 border-b border-slate-800 pb-4">
        <div className="py-2 sm:pr-5 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Tổng Dự Báo 6 Tháng Tới</div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
            {formatVND(forecast.total6MonthForecast)}
          </div>
          <div className="text-[11px] text-slate-500">
            Chu kỳ {forecast.totalCycleSharePct}% · Tiêu hao &amp; SC {forecast.totalConsumptionSharePct}%
          </div>
        </div>

        <div className="py-2 sm:px-5 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Trung Bình / Tháng (Dự Báo)</div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100 font-mono tabular-nums">
            {formatVND(forecast.avgMonthlyForecast)}
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums">
            {forecast.deltaVsHistoricalPct >= 0 ? '+' : ''}
            {forecast.deltaVsHistoricalPct}% so với TB lịch sử ({formatVND(forecast.avgMonthlyHistorical)})
          </div>
        </div>

        <div className="py-2 sm:px-5 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Tháng Cao Điểm Dự Kiến</div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono tabular-nums">
            {forecast.peakForecastMonth
              ? formatVND(forecast.peakForecastMonth.forecastTotal || 0)
              : '—'}
          </div>
          <div className="text-[11px] text-slate-500">
            {forecast.peakForecastMonth
              ? `${forecast.peakForecastMonth.fullLabel} · ${forecast.peakForecastMonth.plannedTaskCount} lượt PM${
                  forecast.peakForecastMonth.inspectionDueCount > 0
                    ? ` · ${forecast.peakForecastMonth.inspectionDueCount} kiểm định`
                    : ''
                }`
              : 'Chưa có dữ liệu'}
          </div>
        </div>

        <div className="py-2 sm:pl-5 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Độ Dốc Xu Hướng (Trend Line)</div>
          <div className="flex items-center gap-2">
            {forecast.trendDirection === 'up' ? (
              <TrendingUp className="w-5 h-5 text-amber-400 shrink-0" />
            ) : forecast.trendDirection === 'down' ? (
              <TrendingDown className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <Minus className="w-5 h-5 text-cyan-400 shrink-0" />
            )}
            <span className="text-xl sm:text-2xl font-extrabold text-slate-100 font-mono tabular-nums">
              {forecast.trendSlopePerMonth >= 0 ? '+' : ''}
              {formatCompactVND(forecast.trendSlopePerMonth)}/tháng
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            {forecast.trendDirection === 'up'
              ? 'Xu hướng tăng nhẹ theo chu kỳ & tiêu hao'
              : forecast.trendDirection === 'down'
              ? 'Xu hướng giảm dần chi phí vận hành'
              : 'Xu hướng ổn định trong 6 tháng tới'}
          </div>
        </div>
      </div>

      {/* Main Chart + Legend */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-0.5 bg-sky-400 inline-block" aria-hidden="true" />
              <span>Thực tế (Lịch sử)</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="w-4 h-0.5 border-t-2 border-dashed border-emerald-400 inline-block"
                aria-hidden="true"
              />
              <span>Dự báo 6 tháng tới</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="w-4 h-0.5 border-t-2 border-dotted border-amber-400 inline-block"
                aria-hidden="true"
              />
              <span>Đường xu hướng tuyến tính</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="w-3 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/40 inline-block"
                aria-hidden="true"
              />
              <span>Biên độ tin cậy</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Nhấp vào cột tháng dự báo để xem thiết bị phát sinh chi phí trọng điểm
          </span>
        </div>

        {/* D3 Trend-Line Canvas */}
        <div ref={chartContainerRef} className="relative w-full min-h-[290px]">
          {hoverInfo && (
            <div
              className={`pointer-events-none absolute z-30 w-64 rounded-xl border p-3 text-xs shadow-xl ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-slate-950 border-slate-700 text-slate-100'
              }`}
              style={{
                left: Math.min(Math.max(12, hoverInfo.x + 14), Math.max(12, chartWidth - 270)),
                top: Math.max(8, hoverInfo.y - 40),
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                <strong className="font-bold">{hoverInfo.point.fullLabel}</strong>
                <span
                  className={`text-[10px] font-semibold ${
                    hoverInfo.point.isForecast ? 'text-emerald-400' : 'text-cyan-400'
                  }`}
                >
                  {hoverInfo.point.isForecast ? 'Dự báo' : 'Lịch sử'}
                </span>
              </div>

              {hoverInfo.point.isForecast ? (
                <div className="space-y-1 font-mono tabular-nums text-[11px]">
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-400">Tổng dự báo:</span>
                    <strong className="text-emerald-400">
                      {formatVND(hoverInfo.point.forecastTotal || 0)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-400">
                      Chu kỳ PM ({hoverInfo.point.plannedTaskCount} lượt):
                    </span>
                    <span>{formatVND(hoverInfo.point.forecastCycleCost)}</span>
                  </div>
                  {hoverInfo.point.forecastInspectionCost > 0 && (
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">
                        Kiểm định ({hoverInfo.point.inspectionDueCount}):
                      </span>
                      <span>{formatVND(hoverInfo.point.forecastInspectionCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-400">Tiêu hao &amp; SC:</span>
                    <span>{formatVND(hoverInfo.point.forecastConsumptionCost)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1 mt-1">
                    <span className="font-sans text-slate-400">Đường xu hướng:</span>
                    <span className="text-amber-400">{formatVND(hoverInfo.point.trendValue)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span className="font-sans">Biên độ:</span>
                    <span>
                      {formatCompactVND(hoverInfo.point.confidenceLow || 0)} –{' '}
                      {formatCompactVND(hoverInfo.point.confidenceHigh || 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 font-mono tabular-nums text-[11px]">
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-400">Tổng thực tế:</span>
                    <strong className="text-cyan-400">
                      {formatVND(hoverInfo.point.actualTotal || 0)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-400">Bảo trì &amp; Kiểm định:</span>
                    <span>{formatVND(hoverInfo.point.actualScheduledCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-400">Tiêu hao VT &amp; SC:</span>
                    <span>{formatVND(hoverInfo.point.actualConsumptionCost)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1 mt-1">
                    <span className="font-sans text-slate-400">Đường xu hướng:</span>
                    <span className="text-amber-400">{formatVND(hoverInfo.point.trendValue)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Split: 6-Month Breakdown Table + Selected Month Cost Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2 border-t border-slate-800">
        {/* 6-Month Forecast Breakdown Table (8 cols) */}
        <div className="lg:col-span-8 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Bảng Phân Bổ Dự Toán 6 Tháng Tới
            </h4>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums">
              TB tiêu hao vật tư: {formatVND(forecast.avgMonthlyPartsConsumption)}/tháng
            </span>
          </div>

          <SmartHorizontalScroll>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Tháng</th>
                  <th className="py-2.5 px-3 text-right">Lượt PM</th>
                  <th className="py-2.5 px-3 text-right">Theo Chu Kỳ</th>
                  <th className="py-2.5 px-3 text-right">Tiêu Hao &amp; SC</th>
                  <th className="py-2.5 px-3 text-right">Tổng Dự Báo</th>
                  <th className="py-2.5 px-3 text-right">Xu Hướng (OLS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {forecast.forecastMonths.map((m) => {
                  const isSelected = activeSelectedMonth?.monthKey === m.monthKey;
                  const cycleWithInsp = m.forecastCycleCost + m.forecastInspectionCost;
                  return (
                    <tr
                      key={m.monthKey}
                      onClick={() => setSelectedForecastKey(m.monthKey)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-emerald-500/10 text-slate-100'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                        <span>{m.fullLabel}</span>
                        {m.inspectionDueCount > 0 && (
                          <span className="ml-1.5 text-[10px] text-amber-400 font-normal">
                            (+{m.inspectionDueCount} KĐ)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-400">
                        {m.plannedTaskCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {formatVND(cycleWithInsp)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {formatVND(m.forecastConsumptionCost)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-400">
                        {formatVND(m.forecastTotal || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-400">
                        {formatVND(m.trendValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </SmartHorizontalScroll>
        </div>

        {/* Selected Month Cost Drivers & Methodology Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-3 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <CalendarClock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hạng Mục Trọng Điểm · {activeSelectedMonth?.fullLabel || ''}</span>
            </div>
          </div>

          {activeSelectedMonth && activeSelectedMonth.topDrivers.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {activeSelectedMonth.topDrivers.map((drv) => (
                <div
                  key={`${drv.type}-${drv.code}`}
                  className="py-2.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {drv.type === 'Kiểm định an toàn' ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <Wrench className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-200 truncate">{drv.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono">{drv.code}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{drv.type}</span>
                    </div>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-slate-200 shrink-0">
                    {formatVND(drv.estimatedCost)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-xs text-slate-500">
              Chưa có hạng mục bảo trì chu kỳ hoặc kiểm định phát sinh trong tháng này.
            </div>
          )}

          {activeSelectedMonth && (
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between font-mono tabular-nums">
                <span>Khoảng tin cậy tháng này:</span>
                <span className="text-slate-300">
                  {formatCompactVND(activeSelectedMonth.confidenceLow || 0)} –{' '}
                  {formatCompactVND(activeSelectedMonth.confidenceHigh || 0)}
                </span>
              </div>
              <p className="leading-relaxed">
                Mô hình kết hợp tổng xuất kho vật tư, chi phí sửa chữa lịch sử ({lookbackMonths} tháng) và lịch bảo trì định kỳ.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
