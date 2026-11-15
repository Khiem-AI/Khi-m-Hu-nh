import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface SmartHorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
}

export const SmartHorizontalScroll: React.FC<SmartHorizontalScrollProps> = ({
  children,
  className = '',
}) => {
  const topBarRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const syncingSource = useRef<'top' | 'bottom' | null>(null);

  const [metrics, setMetrics] = useState({
    hasOverflow: false,
    scrollWidth: 0,
    clientWidth: 0,
    scrollLeft: 0,
  });

  const measure = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const sw = el.scrollWidth;
    const cw = el.clientWidth;
    const sl = el.scrollLeft;
    setMetrics({
      hasOverflow: sw > cw + 3,
      scrollWidth: sw,
      clientWidth: cw,
      scrollLeft: sl,
    });
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    if (el.firstElementChild) {
      ro.observe(el.firstElementChild);
    }

    const mo = new MutationObserver(() => measure());
    mo.observe(el, { childList: true, subtree: true });

    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  const handleTopScroll = () => {
    if (syncingSource.current === 'bottom') {
      syncingSource.current = null;
      return;
    }
    const topEl = topBarRef.current;
    const contentEl = contentRef.current;
    if (!topEl || !contentEl) return;
    syncingSource.current = 'top';
    contentEl.scrollLeft = topEl.scrollLeft;
    setMetrics((prev) => ({ ...prev, scrollLeft: topEl.scrollLeft }));
  };

  const handleBottomScroll = () => {
    if (syncingSource.current === 'top') {
      syncingSource.current = null;
      return;
    }
    const topEl = topBarRef.current;
    const contentEl = contentRef.current;
    if (!contentEl) return;
    if (topEl) {
      syncingSource.current = 'bottom';
      topEl.scrollLeft = contentEl.scrollLeft;
    }
    setMetrics((prev) => ({ ...prev, scrollLeft: contentEl.scrollLeft }));
  };

  const scrollByAmount = (delta: number) => {
    const el = contentRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const scrollToEdge = (edge: 'start' | 'end') => {
    const el = contentRef.current;
    if (!el) return;
    el.scrollTo({
      left: edge === 'start' ? 0 : el.scrollWidth - el.clientWidth,
      behavior: 'smooth',
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = contentRef.current;
    if (!el || !metrics.hasOverflow) return;
    if (e.shiftKey && Math.abs(e.deltaY) > 0) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  const maxScroll = Math.max(1, metrics.scrollWidth - metrics.clientWidth);
  const progressPct = Math.min(100, Math.max(0, Math.round((metrics.scrollLeft / maxScroll) * 100)));
  const atStart = metrics.scrollLeft <= 2;
  const atEnd = metrics.scrollLeft >= maxScroll - 2;

  return (
    <div className={`w-full ${className}`}>
      {metrics.hasOverflow && (
        <div className="bg-slate-900/95 border-b border-slate-800 px-3 pt-2 pb-1.5 space-y-1.5 select-none">
          <div className="flex items-center justify-end gap-2 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="font-mono text-[10px] text-slate-400 mr-1.5 tabular-nums">
                {progressPct}%
              </span>
              <button
                type="button"
                onClick={() => scrollToEdge('start')}
                disabled={atStart}
                aria-label="Về đầu bảng"
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-35 transition"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount(-280)}
                disabled={atStart}
                aria-label="Cuộn sang trái"
                className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-35 font-semibold transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trái</span>
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount(280)}
                disabled={atEnd}
                aria-label="Cuộn sang phải"
                className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-35 font-semibold transition"
              >
                <span className="hidden sm:inline">Phải</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollToEdge('end')}
                disabled={atEnd}
                aria-label="Tới cuối bảng"
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-35 transition"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Synced Top Scrollbar Track */}
          <div
            ref={topBarRef}
            onScroll={handleTopScroll}
            className="overflow-x-auto overflow-y-hidden h-3 rounded bg-slate-950/60 border border-slate-800"
          >
            <div style={{ width: `${metrics.scrollWidth}px`, height: '1px' }} />
          </div>
        </div>
      )}

      <div
        ref={contentRef}
        onScroll={handleBottomScroll}
        onWheel={handleWheel}
        className="overflow-x-auto"
      >
        {children}
      </div>
    </div>
  );
};
