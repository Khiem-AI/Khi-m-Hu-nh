import React, { useMemo, useRef, useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import {
  UtilityConnectivityItem,
  UtilityConnectivityStatus,
} from '../../types/cmms';
import {
  exportConnectivityCsv,
  inferConnectivityArea,
  normalizeDbAndMsb,
  parseConnectivityCsv,
} from '../../utils/utilityCompressorCsv';
import { canDeleteRecords } from '../../utils/cmmsLogic';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  AlertTriangle,
  Cable,
  CheckCircle2,
  Download,
  Edit2,
  Eye,
  Filter,
  Network,
  Plus,
  PowerOff,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  Wind,
  X,
  Zap,
} from 'lucide-react';

type SubViewMode = 'matrix' | 'panel_loto' | 'utility_impact';
type UtilityFilterKey = 'ALL' | 'air' | 'nitrogen' | 'di' | 'vacuum' | 'exhaust' | 'lan';

const UTILITY_DEFINITIONS: Array<{
  key: Exclude<UtilityFilterKey, 'ALL'>;
  label: string;
  shortLabel: string;
  desc: string;
}> = [
  { key: 'air', label: 'Khí nén (Air)', shortLabel: 'Air', desc: 'Hệ thống máy nén khí GA75 / VSD90' },
  { key: 'nitrogen', label: 'Khí Nito (Nitrogen)', shortLabel: 'N2', desc: 'Máy tạo Nito NPG360-1 & NPG360-2' },
  { key: 'di', label: 'Nước DI (Deionized)', shortLabel: 'DI', desc: 'Hệ thống lọc nước tinh khiết DI' },
  { key: 'vacuum', label: 'Hút chân không (Vacuum)', shortLabel: 'Vacuum', desc: 'Hệ bơm chân không trung tâm' },
  { key: 'exhaust', label: 'Hút khí thải (Exhaust)', shortLabel: 'Exhaust', desc: 'Hệ quạt hút hơi hàn, sơn phủ & lò reflow' },
  { key: 'lan', label: 'Mạng LAN / Dữ liệu', shortLabel: 'LAN', desc: 'Cổng mạng kết nối MES / điều khiển' },
];

const EMPTY_FORM: Omit<UtilityConnectivityItem, 'id'> = {
  tenMay: '',
  khuVuc: 'SMT Line A',
  tenBanVe: '',
  modelManual: '',
  soLuong: 1,
  cableSize: '3x4mm2',
  voltages: ['220V'],
  phase: '1P',
  maxCurrentA: 10,
  dbRaw: 'To DB-FAC-380-1 (DB-P1/380-M2)',
  dbPanel: 'DB-FAC-380-1',
  msbSource: 'MSB 2 (DB-P1/380-M2)',
  utilities: {
    lan: false,
    nitrogen: false,
    air: false,
    vacuum: false,
    di: false,
    exhaust: false,
    exhaustFlowM3h: null,
  },
  trangThai: 'Đang cấp nguồn',
  ghiChu: '',
};

const VOLTAGE_OPTIONS = ['480V', '380V', '208V', '220V', '110V'] as const;

export const UtilityConnectivityTab: React.FC = () => {
  const {
    utilityConnectivity,
    currentUser,
    addUtilityConnectivity,
    updateUtilityConnectivity,
    deleteUtilityConnectivity,
    replaceUtilityConnectivity,
  } = useCMMS();

  const [subView, setSubView] = useState<SubViewMode>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [voltageFilter, setVoltageFilter] = useState('ALL');
  const [utilityFilter, setUtilityFilter] = useState<UtilityFilterKey>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UtilityConnectivityStatus>('ALL');

  // LOTO / Panel Impact selection
  const [selectedMsbFilter, setSelectedMsbFilter] = useState<string>('ALL');
  const [selectedPanel, setSelectedPanel] = useState<string>('');
  const [lotoActiveOnly, setLotoActiveOnly] = useState<boolean>(true);

  // Utility system impact selection
  const [selectedUtilitySystem, setSelectedUtilitySystem] =
    useState<Exclude<UtilityFilterKey, 'ALL'>>('air');

  // Modals
  const [detailItem, setDetailItem] = useState<UtilityConnectivityItem | null>(null);
  const [editingItem, setEditingItem] = useState<UtilityConnectivityItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<Omit<UtilityConnectivityItem, 'id'>>(EMPTY_FORM);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const allowDelete = canDeleteRecords(currentUser);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setFeedbackBanner({ type, text });
    window.setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Distinct filter lists
  const areas = useMemo(
    () => Array.from(new Set(utilityConnectivity.map((i) => i.khuVuc))).sort(),
    [utilityConnectivity]
  );

  // KPI metrics
  const kpis = useMemo(() => {
    const active = utilityConnectivity.filter((i) => i.trangThai === 'Đang cấp nguồn');
    const disconnected = utilityConnectivity.filter((i) => i.trangThai === 'Đã tháo nguồn / Di dời');
    const uniquePanels = new Set(active.map((i) => i.dbPanel).filter((p) => p && p !== 'Chưa xác định'));
    const airCount = active.filter((i) => i.utilities.air).length;
    const n2Count = active.filter((i) => i.utilities.nitrogen).length;
    const diCount = active.filter((i) => i.utilities.di).length;
    const vacCount = active.filter((i) => i.utilities.vacuum).length;
    const exhaustCount = active.filter((i) => i.utilities.exhaust).length;
    const lanCount = active.filter((i) => i.utilities.lan).length;
    return {
      total: utilityConnectivity.length,
      activeCount: active.length,
      disconnectedCount: disconnected.length,
      panelCount: uniquePanels.size,
      airCount,
      n2Count,
      diCount,
      vacCount,
      exhaustCount,
      lanCount,
    };
  }, [utilityConnectivity]);

  // Filtered matrix rows
  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return utilityConnectivity.filter((item) => {
      if (areaFilter !== 'ALL' && item.khuVuc !== areaFilter) return false;
      if (statusFilter !== 'ALL' && item.trangThai !== statusFilter) return false;
      if (voltageFilter !== 'ALL' && !item.voltages.includes(voltageFilter)) return false;
      if (utilityFilter !== 'ALL' && !item.utilities[utilityFilter]) return false;
      if (q) {
        const hay = [
          item.id,
          item.tenMay,
          item.tenBanVe,
          item.modelManual,
          item.khuVuc,
          item.cableSize,
          item.dbPanel,
          item.msbSource,
          item.dbRaw,
          item.ghiChu,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [utilityConnectivity, searchTerm, areaFilter, statusFilter, voltageFilter, utilityFilter]);

  // Panel / MSB grouping for LOTO Impact View
  const panelGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        dbPanel: string;
        msbGroup: string;
        msbDetails: Set<string>;
        activeItems: UtilityConnectivityItem[];
        disconnectedItems: UtilityConnectivityItem[];
        totalActiveCurrentA: number;
        voltages: Set<string>;
        areas: Set<string>;
      }
    >();

    for (const item of utilityConnectivity) {
      const key = item.dbPanel || 'Chưa xác định';
      const msbTop = item.msbSource.startsWith('MSB ')
        ? item.msbSource.slice(0, 5)
        : item.msbSource.includes('UPS')
          ? 'DB-UPS'
          : item.msbSource.includes('Socket') || item.msbSource.includes('ổ cắm')
            ? 'Socket Grid'
            : 'Khác';

      if (!map.has(key)) {
        map.set(key, {
          dbPanel: key,
          msbGroup: msbTop,
          msbDetails: new Set(),
          activeItems: [],
          disconnectedItems: [],
          totalActiveCurrentA: 0,
          voltages: new Set(),
          areas: new Set(),
        });
      }
      const g = map.get(key)!;
      if (item.msbSource) g.msbDetails.add(item.msbSource);
      item.voltages.forEach((v) => g.voltages.add(v));
      if (item.trangThai === 'Đã tháo nguồn / Di dời') {
        g.disconnectedItems.push(item);
      } else {
        g.activeItems.push(item);
        g.areas.add(item.khuVuc);
        if (typeof item.maxCurrentA === 'number' && item.maxCurrentA > 0) {
          g.totalActiveCurrentA += item.maxCurrentA;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.activeItems.length - a.activeItems.length);
  }, [utilityConnectivity]);

  const msbCategories = useMemo(
    () => Array.from(new Set(panelGroups.map((g) => g.msbGroup))).sort(),
    [panelGroups]
  );

  const visiblePanelGroups = useMemo(() => {
    if (selectedMsbFilter === 'ALL') return panelGroups;
    return panelGroups.filter((g) => g.msbGroup === selectedMsbFilter);
  }, [panelGroups, selectedMsbFilter]);

  const activeSelectedPanelGroup = useMemo(() => {
    const found = visiblePanelGroups.find((g) => g.dbPanel === selectedPanel);
    return found || visiblePanelGroups[0] || null;
  }, [visiblePanelGroups, selectedPanel]);

  // Utility System Impact items
  const utilitySystemImpact = useMemo(() => {
    const active = utilityConnectivity.filter(
      (item) => item.utilities[selectedUtilitySystem] && item.trangThai !== 'Đã tháo nguồn / Di dời'
    );
    const disconnected = utilityConnectivity.filter(
      (item) => item.utilities[selectedUtilitySystem] && item.trangThai === 'Đã tháo nguồn / Di dời'
    );
    const byArea = new Map<string, UtilityConnectivityItem[]>();
    for (const item of active) {
      if (!byArea.has(item.khuVuc)) byArea.set(item.khuVuc, []);
      byArea.get(item.khuVuc)!.push(item);
    }
    return {
      active,
      disconnected,
      byArea: Array.from(byArea.entries()).sort((a, b) => b[1].length - a[1].length),
    };
  }, [utilityConnectivity, selectedUtilitySystem]);

  // Form handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormState(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: UtilityConnectivityItem) => {
    setEditingItem(item);
    setFormState({
      tenMay: item.tenMay,
      khuVuc: item.khuVuc,
      tenBanVe: item.tenBanVe,
      modelManual: item.modelManual,
      soLuong: item.soLuong,
      cableSize: item.cableSize,
      voltages: [...item.voltages],
      phase: item.phase,
      maxCurrentA: item.maxCurrentA,
      dbRaw: item.dbRaw,
      dbPanel: item.dbPanel,
      msbSource: item.msbSource,
      utilities: { ...item.utilities },
      trangThai: item.trangThai,
      ghiChu: item.ghiChu,
    });
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.tenMay.trim()) return;
    const { dbPanel, msbSource } = normalizeDbAndMsb(formState.dbRaw || formState.dbPanel);
    const payload: Omit<UtilityConnectivityItem, 'id'> = {
      ...formState,
      tenMay: formState.tenMay.trim(),
      dbPanel: formState.dbPanel.trim() || dbPanel,
      msbSource: formState.msbSource.trim() || msbSource,
      khuVuc:
        formState.khuVuc.trim() ||
        inferConnectivityArea(formState.tenMay, formState.tenBanVe, dbPanel),
    };

    if (editingItem) {
      updateUtilityConnectivity({ ...payload, id: editingItem.id });
      showToast('ok', `Đã cập nhật thông tin đấu nối cho ${payload.tenMay}.`);
    } else {
      addUtilityConnectivity(payload);
      showToast('ok', `Đã thêm đấu nối Utility mới: ${payload.tenMay}.`);
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleToggleVoltage = (v: string) => {
    setFormState((prev) => ({
      ...prev,
      voltages: prev.voltages.includes(v)
        ? prev.voltages.filter((x) => x !== v)
        : [...prev.voltages, v],
    }));
  };

  const handleExportCsv = () => {
    const csv = exportConnectivityCsv(filteredItems);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Utility_Connectivity_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const parsed = parseConnectivityCsv(text);
      if (parsed.length === 0) {
        showToast('err', 'Không đọc được dòng dữ liệu hợp lệ từ file CSV Connectivity.');
        return;
      }
      replaceUtilityConnectivity(parsed, file.name);
      showToast('ok', `Đã nạp thành công ${parsed.length} thiết bị từ file ${file.name}.`);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const renderUtilityListInline = (u: UtilityConnectivityItem['utilities']) => {
    const activeLabels: string[] = [];
    if (u.air) activeLabels.push('Air');
    if (u.nitrogen) activeLabels.push('N2');
    if (u.di) activeLabels.push('DI');
    if (u.vacuum) activeLabels.push('Vacuum');
    if (u.exhaust) {
      activeLabels.push(u.exhaustFlowM3h ? `Exhaust (${u.exhaustFlowM3h} m³/h)` : 'Exhaust');
    }
    if (u.lan) activeLabels.push('LAN');
    if (activeLabels.length === 0) {
      return <span className="text-slate-400 dark:text-slate-500 text-xs">Chỉ cấp điện</span>;
    }
    return (
      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
        {activeLabels.join(' · ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-sky-700 dark:text-sky-400">
            {UI_TEXTS.tabs.utilityConnectivity.badge}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#edf2f9] tracking-tight">
            {UI_TEXTS.tabs.utilityConnectivity.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportCsvFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-[#172133] border border-slate-200 dark:border-[#2a3952] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1f2c42] transition whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-[#172133] border border-slate-200 dark:border-[#2a3952] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1f2c42] transition whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất CSV
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm Đấu Nối
          </button>
        </div>
      </div>

      {feedbackBanner && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-medium ${
            feedbackBanner.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{feedbackBanner.text}</span>
          <button type="button" onClick={() => setFeedbackBanner(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4-Column KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248]">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng điểm đấu nối</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-[#edf2f9] font-mono tabular-nums">
              {kpis.total}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium tabular-nums">
              {kpis.activeCount} đang cấp nguồn
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {kpis.disconnectedCount} đã tháo nguồn / di dời
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248]">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Tủ phân phối điện (DB)</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-[#edf2f9] font-mono tabular-nums">
              {kpis.panelCount}
            </span>
            <span className="text-xs text-sky-700 dark:text-sky-400 font-medium">tủ nhánh & UPS</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Cấp từ MSB 1 · MSB 2 · MSB 4 · MSB 5
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248]">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Khí nén · Nito · Vacuum</div>
          <div className="mt-1.5 flex items-baseline gap-3 font-mono tabular-nums">
            <span className="text-lg font-bold text-slate-900 dark:text-[#edf2f9]">{kpis.airCount} <span className="text-xs font-sans font-normal text-slate-500">Air</span></span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-lg font-bold text-slate-900 dark:text-[#edf2f9]">{kpis.n2Count} <span className="text-xs font-sans font-normal text-slate-500">N2</span></span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-lg font-bold text-slate-900 dark:text-[#edf2f9]">{kpis.vacCount} <span className="text-xs font-sans font-normal text-slate-500">Vac</span></span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Tính trên thiết bị đang hoạt động
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248]">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Nước DI · Exhaust · LAN</div>
          <div className="mt-1.5 flex items-baseline gap-3 font-mono tabular-nums">
            <span className="text-lg font-bold text-slate-900 dark:text-[#edf2f9]">{kpis.diCount} <span className="text-xs font-sans font-normal text-slate-500">DI</span></span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-lg font-bold text-slate-900 dark:text-[#edf2f9]">{kpis.exhaustCount} <span className="text-xs font-sans font-normal text-slate-500">Exh</span></span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-lg font-bold text-slate-900 dark:text-[#edf2f9]">{kpis.lanCount} <span className="text-xs font-sans font-normal text-slate-500">LAN</span></span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Hỗ trợ phân tích ảnh hưởng khi cắt hệ
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-[#141d2d] border border-slate-200/80 dark:border-[#243248] w-fit">
        <button
          type="button"
          onClick={() => setSubView('matrix')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
            subView === 'matrix'
              ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Cable className="w-3.5 h-3.5" />
          Bảng Tra Cứu Tổng Hợp
        </button>
        <button
          type="button"
          onClick={() => setSubView('panel_loto')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
            subView === 'panel_loto'
              ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Mô Phỏng Cắt Tủ Điện (LOTO)
        </button>
        <button
          type="button"
          onClick={() => setSubView('utility_impact')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
            subView === 'utility_impact'
              ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          Tra Cứu Theo Hệ Utility
        </button>
      </div>

      {/* VIEW 1: FULL MATRIX LOOKUP */}
      {subView === 'matrix' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248] space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên máy, bản vẽ SX, tủ DB/MSB, cỡ cáp, model..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">Tất cả khu vực / Line</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              <select
                value={voltageFilter}
                onChange={(e) => setVoltageFilter(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">Mọi điện áp</option>
                {VOLTAGE_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    Nguồn {v}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | UtilityConnectivityStatus)}
                className="px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">Mọi trạng thái</option>
                <option value="Đang cấp nguồn">Đang cấp nguồn</option>
                <option value="Đã tháo nguồn / Di dời">Đã tháo nguồn / Di dời</option>
                <option value="Cần kiểm tra">Cần kiểm tra</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-[#202d42]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
                  <Filter className="w-3 h-3" /> Hệ Utility:
                </span>
                <button
                  type="button"
                  onClick={() => setUtilityFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    utilityFilter === 'ALL'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 dark:bg-[#1d293d] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#26354e]'
                  }`}
                >
                  Tất cả
                </button>
                {UTILITY_DEFINITIONS.map((u) => (
                  <button
                    key={u.key}
                    type="button"
                    onClick={() => setUtilityFilter(u.key)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      utilityFilter === u.key
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 dark:bg-[#1d293d] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#26354e]'
                    }`}
                  >
                    {u.shortLabel}
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                Hiển thị {filteredItems.length} / {utilityConnectivity.length} thiết bị
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248] overflow-hidden">
            <SmartHorizontalScroll>
              <table className="w-full text-left border-collapse min-w-[1020px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#131c2c] border-b border-slate-200 dark:border-[#243248] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Thiết bị & Bản vẽ SX</th>
                    <th className="py-3 px-3">Khu vực</th>
                    <th className="py-3 px-3">Nguồn Điện & Cáp</th>
                    <th className="py-3 px-3 text-right">Dòng (A)</th>
                    <th className="py-3 px-3">Tủ DB / MSB</th>
                    <th className="py-3 px-3">Hệ Utility Cấp Vào</th>
                    <th className="py-3 px-3">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#202d42] text-xs">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#1c283d] transition-colors ${
                        item.trangThai === 'Đã tháo nguồn / Di dời' ? 'opacity-70' : ''
                      }`}
                    >
                      <td className="py-3 px-4 max-w-[260px]">
                        <div className="font-semibold text-slate-900 dark:text-[#edf2f9] leading-snug">
                          {item.tenMay}
                          {item.soLuong > 1 && (
                            <span className="ml-1.5 font-mono text-[11px] text-sky-700 dark:text-sky-400">
                              ×{item.soLuong}
                            </span>
                          )}
                        </div>
                        {(item.tenBanVe || item.modelManual) && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {[item.tenBanVe, item.modelManual].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {item.khuVuc}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono text-slate-800 dark:text-slate-100 font-medium tabular-nums">
                          {item.voltages.length > 0 ? item.voltages.join(' / ') : '—'}
                          {item.phase !== 'N/A' && (
                            <span className="text-slate-500 dark:text-slate-400"> · {item.phase}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                          {item.cableSize || 'Chưa ghi cỡ cáp'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-100">
                        {item.maxCurrentA !== null ? `${item.maxCurrentA} A` : '—'}
                      </td>
                      <td className="py-3 px-3 max-w-[210px]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPanel(item.dbPanel);
                            setSelectedMsbFilter('ALL');
                            setSubView('panel_loto');
                          }}
                          title="Nhấn để xem toàn bộ máy chung tủ điện này (LOTO)"
                          className="text-left font-mono font-semibold text-sky-700 dark:text-sky-400 hover:underline"
                        >
                          {item.dbPanel}
                        </button>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.msbSource}
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-[200px]">{renderUtilityListInline(item.utilities)}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.trangThai === 'Đang cấp nguồn' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đang cấp nguồn
                          </span>
                        )}
                        {item.trangThai === 'Đã tháo nguồn / Di dời' && (
                          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                            <PowerOff className="w-3.5 h-3.5" />
                            Đã tháo / Di dời
                          </span>
                        )}
                        {item.trangThai === 'Cần kiểm tra' && (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Cần kiểm tra
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailItem(item)}
                            title="Xem chi tiết"
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-[#23324b] transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Chỉnh sửa"
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#23324b] transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {allowDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                deleteUtilityConnectivity(item.id);
                                showToast('ok', `Đã xóa đấu nối ${item.tenMay}.`);
                              }}
                              title="Xóa bản ghi"
                              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-[#23324b] transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        Không tìm thấy thiết bị nào khớp với điều kiện lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </SmartHorizontalScroll>
          </div>
        </div>
      )}

      {/* VIEW 2: ELECTRICAL PANEL LOTO / IMPACT ANALYSIS */}
      {subView === 'panel_loto' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Panel Selector */}
          <div className="lg:col-span-4 rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248] overflow-hidden">
            <div className="p-4 border-b border-slate-200/80 dark:border-[#243248] space-y-2.5">
              <div className="text-sm font-bold text-slate-900 dark:text-[#edf2f9]">
                Chọn Tủ Điện Phân Phối (DB)
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedMsbFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                    selectedMsbFilter === 'ALL'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 dark:bg-[#1d293d] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Tất cả ({panelGroups.length})
                </button>
                {msbCategories.map((msb) => (
                  <button
                    key={msb}
                    type="button"
                    onClick={() => setSelectedMsbFilter(msb)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      selectedMsbFilter === msb
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 dark:bg-[#1d293d] text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {msb}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#202d42] max-h-[600px] overflow-y-auto">
              {visiblePanelGroups.map((group) => {
                const isSelected = activeSelectedPanelGroup?.dbPanel === group.dbPanel;
                return (
                  <button
                    key={group.dbPanel}
                    type="button"
                    onClick={() => setSelectedPanel(group.dbPanel)}
                    className={`w-full text-left px-4 py-3 transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-900 dark:text-white'
                        : 'hover:bg-slate-50 dark:hover:bg-[#1c283d] text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold truncate">{group.dbPanel}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {group.msbGroup} · {Array.from(group.voltages).join('/') || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono tabular-nums">
                      <div className="text-xs font-bold text-sky-700 dark:text-sky-400">
                        {group.activeItems.length} máy
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {group.totalActiveCurrentA > 0 ? `${group.totalActiveCurrentA} A` : '—'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Impact Report */}
          <div className="lg:col-span-8 space-y-4">
            {activeSelectedPanelGroup ? (
              <div className="rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248] overflow-hidden">
                <div className="p-5 border-b border-slate-200/80 dark:border-[#243248] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                      <ShieldAlert className="w-4 h-4" />
                      Đánh giá ảnh hưởng khi cắt nguồn (LOTO)
                    </div>
                    <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-[#edf2f9] mt-1">
                      {activeSelectedPanelGroup.dbPanel}
                    </h2>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Nguồn cấp trên: {Array.from(activeSelectedPanelGroup.msbDetails).join(' · ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 font-mono tabular-nums">
                    <div>
                      <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">Máy bị mất điện</div>
                      <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                        {activeSelectedPanelGroup.activeItems.length}
                      </div>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-[#243248]" />
                    <div>
                      <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">Tổng dòng định mức</div>
                      <div className="text-xl font-bold text-slate-900 dark:text-[#edf2f9]">
                        {activeSelectedPanelGroup.totalActiveCurrentA} A
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50 dark:bg-[#131c2c] border-b border-slate-200/80 dark:border-[#243248] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">Khu vực ảnh hưởng:</span>{' '}
                    {Array.from(activeSelectedPanelGroup.areas).join(' · ') || 'Không có máy đang cấp nguồn'}
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lotoActiveOnly}
                      onChange={(e) => setLotoActiveOnly(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    Chỉ hiện máy đang cấp nguồn ({activeSelectedPanelGroup.disconnectedItems.length} máy đã tháo nguồn)
                  </label>
                </div>

                <SmartHorizontalScroll>
                  <table className="w-full text-left border-collapse min-w-[680px] text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-[#243248] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <th className="py-2.5 px-4">Thiết bị</th>
                        <th className="py-2.5 px-3">Khu vực / Line</th>
                        <th className="py-2.5 px-3">Điện áp · Pha</th>
                        <th className="py-2.5 px-3">Cỡ cáp</th>
                        <th className="py-2.5 px-3 text-right">Max (A)</th>
                        <th className="py-2.5 px-4">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#202d42]">
                      {(lotoActiveOnly
                        ? activeSelectedPanelGroup.activeItems
                        : [...activeSelectedPanelGroup.activeItems, ...activeSelectedPanelGroup.disconnectedItems]
                      ).map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setDetailItem(item)}
                          className="hover:bg-slate-50 dark:hover:bg-[#1c283d] cursor-pointer"
                        >
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-[#edf2f9]">{item.tenMay}</div>
                            {item.modelManual && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.modelManual}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{item.khuVuc}</td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800 dark:text-slate-200">
                            {item.voltages.join('/') || '—'} {item.phase !== 'N/A' ? `· ${item.phase}` : ''}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {item.cableSize || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                            {item.maxCurrentA !== null ? `${item.maxCurrentA} A` : '—'}
                          </td>
                          <td className="py-2.5 px-4">
                            {item.trangThai === 'Đang cấp nguồn' ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Đang cấp nguồn</span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400">{item.trangThai}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </SmartHorizontalScroll>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-white dark:bg-[#172133] border border-slate-200 dark:border-[#243248] text-center text-sm text-slate-500">
                Chọn một tủ điện bên trái để xem danh sách thiết bị phụ thuộc.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: UTILITY SYSTEM IMPACT */}
      {subView === 'utility_impact' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {UTILITY_DEFINITIONS.map((u) => {
              const count = utilityConnectivity.filter(
                (i) => i.utilities[u.key] && i.trangThai !== 'Đã tháo nguồn / Di dời'
              ).length;
              const isSelected = selectedUtilitySystem === u.key;
              return (
                <button
                  key={u.key}
                  type="button"
                  onClick={() => setSelectedUtilitySystem(u.key)}
                  className={`p-3.5 rounded-xl border text-left transition ${
                    isSelected
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'bg-white dark:bg-[#172133] border-slate-200 dark:border-[#243248] text-slate-800 dark:text-slate-200 hover:border-sky-400'
                  }`}
                >
                  <div className={`text-xs font-semibold ${isSelected ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {u.shortLabel}
                  </div>
                  <div className="mt-1 text-xl font-bold font-mono tabular-nums">{count}</div>
                  <div className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-sky-50' : 'text-slate-500 dark:text-slate-400'}`}>
                    {u.label}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl bg-white dark:bg-[#172133] border border-slate-200/90 dark:border-[#243248] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-[#243248]">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-[#edf2f9] flex items-center gap-2">
                  <Network className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Thiết bị đang sử dụng: {UTILITY_DEFINITIONS.find((u) => u.key === selectedUtilitySystem)?.label}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {UTILITY_DEFINITIONS.find((u) => u.key === selectedUtilitySystem)?.desc} —{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                    {utilitySystemImpact.active.length}
                  </strong>{' '}
                  thiết bị đang hoạt động tại {utilitySystemImpact.byArea.length} khu vực
                  {utilitySystemImpact.disconnected.length > 0
                    ? ` (${utilitySystemImpact.disconnected.length} thiết bị đã tháo nguồn)`
                    : ''}
                  .
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {utilitySystemImpact.byArea.map(([areaName, items]) => (
                <div
                  key={areaName}
                  className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#131c2c] border border-slate-200/70 dark:border-[#243248] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-[#edf2f9]">{areaName}</span>
                    <span className="text-xs font-mono font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
                      {items.length} máy
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200/60 dark:divide-[#202d42]">
                    {items.map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => setDetailItem(it)}
                        className="w-full py-2 text-left flex items-center justify-between gap-2 hover:text-sky-600 dark:hover:text-sky-400 transition"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {it.tenMay}
                            {it.soLuong > 1 ? ` (×${it.soLuong})` : ''}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {it.dbPanel}
                            {selectedUtilitySystem === 'exhaust' && it.utilities.exhaustFlowM3h
                              ? ` · Lưu lượng: ${it.utilities.exhaustFlowM3h} m³/h`
                              : ''}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                          {it.voltages.join('/') || '—'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#172133] border border-slate-200 dark:border-[#2a3952] shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#243248] flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono text-sky-700 dark:text-sky-400">
                  {detailItem.id} · {detailItem.khuVuc}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-[#edf2f9]">{detailItem.tenMay}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Tên theo bản vẽ SX</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {detailItem.tenBanVe || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Model / Manual</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {detailItem.modelManual || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Điện áp · Số pha · Dòng tối đa</div>
                  <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                    {detailItem.voltages.join(' / ') || '—'} · {detailItem.phase} ·{' '}
                    {detailItem.maxCurrentA !== null ? `${detailItem.maxCurrentA} A` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Cỡ cáp cấp nguồn (Cable size)</div>
                  <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {detailItem.cableSize || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Tủ điện nhánh (DB)</div>
                  <div className="font-mono font-semibold text-sky-700 dark:text-sky-400 mt-0.5">
                    {detailItem.dbPanel}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Nguồn tủ tổng (MSB)</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {detailItem.msbSource}
                  </div>
                </div>
              </div>

              {detailItem.dbRaw && (
                <div className="pt-3 border-t border-slate-100 dark:border-[#243248]">
                  <div className="text-slate-500 dark:text-slate-400">Ghi nhận tủ DB-MSB nguyên bản</div>
                  <div className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">{detailItem.dbRaw}</div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-[#243248]">
                <div className="text-slate-500 dark:text-slate-400 mb-1.5">Các hệ Utility cung cấp</div>
                <div>{renderUtilityListInline(detailItem.utilities)}</div>
              </div>

              {detailItem.ghiChu && (
                <div className="pt-3 border-t border-slate-100 dark:border-[#243248]">
                  <div className="text-slate-500 dark:text-slate-400">Ghi chú hiện trường</div>
                  <div className="text-amber-700 dark:text-amber-300 font-medium mt-0.5">{detailItem.ghiChu}</div>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#131c2c] border-t border-slate-200 dark:border-[#243248] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = detailItem;
                  setDetailItem(null);
                  handleOpenEdit(target);
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition"
              >
                Chỉnh Sửa
              </button>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-[#23324b] text-slate-700 dark:text-slate-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveForm}
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#172133] border border-slate-200 dark:border-[#2a3952] shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#243248] flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-[#edf2f9]">
                {editingItem ? `Cập nhật đấu nối: ${editingItem.tenMay}` : 'Thêm Điểm Đấu Nối Utility Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên thiết bị / Máy *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.tenMay}
                    onChange={(e) => setFormState((p) => ({ ...p, tenMay: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Khu vực / Line
                  </label>
                  <input
                    type="text"
                    value={formState.khuVuc}
                    onChange={(e) => setFormState((p) => ({ ...p, khuVuc: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên theo bản vẽ sản xuất
                  </label>
                  <input
                    type="text"
                    value={formState.tenBanVe}
                    onChange={(e) => setFormState((p) => ({ ...p, tenBanVe: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Model / Manual
                  </label>
                  <input
                    type="text"
                    value={formState.modelManual}
                    onChange={(e) => setFormState((p) => ({ ...p, modelManual: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cỡ cáp (Cable size)
                  </label>
                  <input
                    type="text"
                    value={formState.cableSize}
                    onChange={(e) => setFormState((p) => ({ ...p, cableSize: e.target.value }))}
                    placeholder="VD: 50mm2 / 25mm2 PE"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số pha</label>
                    <select
                      value={formState.phase}
                      onChange={(e) =>
                        setFormState((p) => ({ ...p, phase: e.target.value as '1P' | '3P' | 'N/A' }))
                      }
                      className="w-full px-2 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100"
                    >
                      <option value="1P">1P</option>
                      <option value="3P">3P</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max (A)</label>
                    <input
                      type="number"
                      value={formState.maxCurrentA ?? ''}
                      onChange={(e) =>
                        setFormState((p) => ({
                          ...p,
                          maxCurrentA: e.target.value === '' ? null : Number(e.target.value),
                        }))
                      }
                      className="w-full px-2 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">SL (#)</label>
                    <input
                      type="number"
                      min={1}
                      value={formState.soLuong}
                      onChange={(e) =>
                        setFormState((p) => ({ ...p, soLuong: Math.max(1, Number(e.target.value) || 1) }))
                      }
                      className="w-full px-2 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Voltages */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Điện áp cấp nguồn
                </label>
                <div className="flex flex-wrap gap-2">
                  {VOLTAGE_OPTIONS.map((v) => {
                    const checked = formState.voltages.includes(v);
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleToggleVoltage(v)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition ${
                          checked
                            ? 'bg-sky-600 border-sky-600 text-white'
                            : 'bg-slate-50 dark:bg-[#111927] border-slate-200 dark:border-[#2a3952] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DB-MSB */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chuỗi DB-MSB (nhập sẽ tự tách Tủ nhánh & MSB)
                  </label>
                  <input
                    type="text"
                    value={formState.dbRaw}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = normalizeDbAndMsb(val);
                      setFormState((p) => ({
                        ...p,
                        dbRaw: val,
                        dbPanel: parsed.dbPanel,
                        msbSource: parsed.msbSource,
                      }));
                    }}
                    placeholder="VD: To DB-FAC-380-1 (DB-P1/380-M2)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trạng thái đấu nối
                  </label>
                  <select
                    value={formState.trangThai}
                    onChange={(e) =>
                      setFormState((p) => ({
                        ...p,
                        trangThai: e.target.value as UtilityConnectivityStatus,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100"
                  >
                    <option value="Đang cấp nguồn">Đang cấp nguồn</option>
                    <option value="Đã tháo nguồn / Di dời">Đã tháo nguồn / Di dời</option>
                    <option value="Cần kiểm tra">Cần kiểm tra</option>
                  </select>
                </div>
              </div>

              {/* Utilities checkboxes */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hệ thống Utility cấp vào
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {UTILITY_DEFINITIONS.map((u) => (
                    <label
                      key={u.key}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formState.utilities[u.key]}
                        onChange={(e) =>
                          setFormState((p) => ({
                            ...p,
                            utilities: { ...p.utilities, [u.key]: e.target.checked },
                          }))
                        }
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{u.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú hiện trường
                </label>
                <input
                  type="text"
                  value={formState.ghiChu}
                  onChange={(e) => setFormState((p) => ({ ...p, ghiChu: e.target.value }))}
                  placeholder="VD: Đã tháo nguồn ngày..., cần bổ sung bản vẽ..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111927] border border-slate-200 dark:border-[#2a3952] text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#131c2c] border-t border-slate-200 dark:border-[#243248] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#23324b] transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition"
              >
                {editingItem ? 'Lưu Thay Đổi' : 'Lưu Đấu Nối'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
