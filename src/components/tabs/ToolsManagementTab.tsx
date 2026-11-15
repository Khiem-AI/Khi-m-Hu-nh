import React, { useMemo, useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import {
  ToolBorrowLog,
  ToolCategory,
  ToolCondition,
  ToolItem,
} from '../../types/cmms';
import { formatDateVN, getInspectionDaysRemaining } from '../../utils/cmmsLogic';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  Wrench,
  Hammer,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  History,
  PackageCheck,
  User,
  MapPin,
} from 'lucide-react';

const APP_TODAY = '2026-11-10';

const TOOL_CATEGORIES: ToolCategory[] = [
  'Dụng cụ cầm tay',
  'Thiết bị đo kiểm',
  'Dụng cụ điện / pin',
  'Thiết bị nâng hạ & An toàn',
  'Dụng cụ chuyên dụng HVAC/Điện',
];

const TOOL_CONDITIONS: ToolCondition[] = [
  'Tốt',
  'Đang sử dụng',
  'Cần bảo dưỡng',
  'Hư hỏng',
  'Thất lạc',
];

export const ToolsManagementTab: React.FC = () => {
  const {
    tools,
    toolLogs,
    employees,
    addTool,
    updateTool,
    deleteTool,
    recordToolTransaction,
  } = useCMMS();

  const [subTab, setSubTab] = useState<'inventory' | 'logs'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals
  const [isToolFormOpen, setIsToolFormOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolItem | null>(null);
  const [deletingTool, setDeletingTool] = useState<ToolItem | null>(null);
  const [txModal, setTxModal] = useState<{
    tool: ToolItem;
    type: ToolBorrowLog['loaiGiaoDich'];
  } | null>(null);

  // Tool Form fields
  const [maDungCu, setMaDungCu] = useState('');
  const [tenDungCu, setTenDungCu] = useState('');
  const [danhMuc, setDanhMuc] = useState<ToolCategory>('Dụng cụ cầm tay');
  const [thuongHieu, setThuongHieu] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [soLuongTong, setSoLuongTong] = useState(1);
  const [donViTinh, setDonViTinh] = useState('Bộ');
  const [viTriLuu, setViTriLuu] = useState('');
  const [tinhTrang, setTinhTrang] = useState<ToolCondition>('Tốt');
  const [canHieuChuan, setCanHieuChuan] = useState(false);
  const [hanHieuChuan, setHanHieuChuan] = useState('');
  const [ghiChu, setGhiChu] = useState('');

  // Borrow / Return Modal fields
  const [txQty, setTxQty] = useState(1);
  const [txPerson, setTxPerson] = useState('');
  const [txDate, setTxDate] = useState(APP_TODAY);
  const [txDueDate, setTxDueDate] = useState('2026-11-12');
  const [txReturnCondition, setTxReturnCondition] = useState<ToolCondition>('Tốt');
  const [txNote, setTxNote] = useState('');
  const [txError, setTxError] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const stats = useMemo(() => {
    const totalKinds = tools.length;
    const totalAvailable = tools.reduce((s, t) => s + t.soLuongKhaDung, 0);
    const totalBorrowed = tools.reduce((s, t) => s + t.soLuongDangMuon, 0);
    const issueOrOverdue = tools.filter(
      (t) =>
        t.tinhTrang === 'Cần bảo dưỡng' ||
        t.tinhTrang === 'Hư hỏng' ||
        t.tinhTrang === 'Thất lạc' ||
        (t.soLuongDangMuon > 0 &&
          t.hanTraDuKien &&
          getInspectionDaysRemaining(t.hanTraDuKien, APP_TODAY) < 0)
    ).length;
    return { totalKinds, totalAvailable, totalBorrowed, issueOrOverdue };
  }, [tools]);

  const filteredTools = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return tools.filter((t) => {
      const matchSearch =
        !q ||
        t.maDungCu.toLowerCase().includes(q) ||
        t.tenDungCu.toLowerCase().includes(q) ||
        (t.thuongHieu || '').toLowerCase().includes(q) ||
        (t.serialNumber || '').toLowerCase().includes(q) ||
        t.viTriLuu.toLowerCase().includes(q) ||
        (t.nguoiDangGiu || '').toLowerCase().includes(q);
      const matchCat = categoryFilter === 'ALL' || t.danhMuc === categoryFilter;
      const matchCond = conditionFilter === 'ALL' || t.tinhTrang === conditionFilter;
      return matchSearch && matchCat && matchCond;
    });
  }, [tools, searchTerm, categoryFilter, conditionFilter]);

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return toolLogs.filter(
      (l) =>
        !q ||
        l.maDungCu.toLowerCase().includes(q) ||
        l.tenDungCu.toLowerCase().includes(q) ||
        l.nguoiMuon.toLowerCase().includes(q) ||
        l.nguoiBanGiao.toLowerCase().includes(q) ||
        (l.ghiChu || '').toLowerCase().includes(q)
    );
  }, [toolLogs, searchTerm]);

  const openCreateToolModal = () => {
    setEditingTool(null);
    setMaDungCu(`TOOL-${String(tools.length + 1).padStart(3, '0')}`);
    setTenDungCu('');
    setDanhMuc('Dụng cụ cầm tay');
    setThuongHieu('');
    setSerialNumber('');
    setSoLuongTong(1);
    setDonViTinh('Bộ');
    setViTriLuu('Tủ Đồ Nghề Phòng Kỹ Thuật');
    setTinhTrang('Tốt');
    setCanHieuChuan(false);
    setHanHieuChuan('');
    setGhiChu('');
    setIsToolFormOpen(true);
  };

  const openEditToolModal = (tool: ToolItem) => {
    setEditingTool(tool);
    setMaDungCu(tool.maDungCu);
    setTenDungCu(tool.tenDungCu);
    setDanhMuc(tool.danhMuc);
    setThuongHieu(tool.thuongHieu || '');
    setSerialNumber(tool.serialNumber || '');
    setSoLuongTong(tool.soLuongTong);
    setDonViTinh(tool.donViTinh);
    setViTriLuu(tool.viTriLuu);
    setTinhTrang(tool.tinhTrang);
    setCanHieuChuan(Boolean(tool.canHieuChuan));
    setHanHieuChuan(tool.hanHieuChuan || '');
    setGhiChu(tool.ghiChu || '');
    setIsToolFormOpen(true);
  };

  const handleSaveTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maDungCu.trim() || !tenDungCu.trim()) return;
    const total = Math.max(1, Number(soLuongTong) || 1);

    if (editingTool) {
      const borrowed = Math.min(total, editingTool.soLuongDangMuon);
      const avail = Math.max(0, total - borrowed);
      updateTool({
        ...editingTool,
        maDungCu: maDungCu.trim(),
        tenDungCu: tenDungCu.trim(),
        danhMuc,
        thuongHieu: thuongHieu.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        soLuongTong: total,
        soLuongDangMuon: borrowed,
        soLuongKhaDung: avail,
        donViTinh: donViTinh.trim() || 'Cái',
        viTriLuu: viTriLuu.trim() || 'Kho Kỹ Thuật',
        tinhTrang,
        canHieuChuan,
        hanHieuChuan: canHieuChuan ? hanHieuChuan || undefined : undefined,
        ghiChu: ghiChu.trim() || undefined,
      });
      showToast(`Đã cập nhật dụng cụ ${maDungCu.trim()}`);
    } else {
      addTool({
        maDungCu: maDungCu.trim(),
        tenDungCu: tenDungCu.trim(),
        danhMuc,
        thuongHieu: thuongHieu.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        soLuongTong: total,
        soLuongKhaDung: tinhTrang === 'Tốt' ? total : 0,
        soLuongDangMuon: 0,
        donViTinh: donViTinh.trim() || 'Cái',
        viTriLuu: viTriLuu.trim() || 'Kho Kỹ Thuật',
        tinhTrang,
        canHieuChuan,
        hanHieuChuan: canHieuChuan ? hanHieuChuan || undefined : undefined,
        ghiChu: ghiChu.trim() || undefined,
      });
      showToast(`Đã thêm dụng cụ mới ${tenDungCu.trim()}`);
    }
    setIsToolFormOpen(false);
  };

  const openTransactionModal = (tool: ToolItem, type: ToolBorrowLog['loaiGiaoDich']) => {
    setTxModal({ tool, type });
    setTxQty(1);
    setTxPerson(
      type === 'Trả' && tool.nguoiDangGiu
        ? tool.nguoiDangGiu.split(',')[0].trim()
        : employees[0]?.tenNhanVien || ''
    );
    setTxDate(APP_TODAY);
    setTxDueDate('2026-11-13');
    setTxReturnCondition('Tốt');
    setTxNote('');
    setTxError('');
  };

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txModal) return;
    if (!txPerson.trim()) {
      setTxError('Vui lòng chọn hoặc nhập tên nhân sự thực hiện.');
      return;
    }

    const res = recordToolTransaction({
      toolId: txModal.tool.id,
      loaiGiaoDich: txModal.type,
      soLuong: txQty,
      nguoiMuon: txPerson.trim(),
      ngayGiaoDich: txDate,
      hanTra: txModal.type === 'Mượn' ? txDueDate : undefined,
      tinhTrangKhiTra: txModal.type !== 'Mượn' ? txReturnCondition : undefined,
      ghiChu: txNote.trim() || undefined,
    });

    if (!res.success) {
      setTxError(res.message || 'Không thể thực hiện giao dịch.');
      return;
    }

    showToast(
      `Đã ghi nhận ${txModal.type.toLowerCase()} ${txQty} ${txModal.tool.donViTinh} ${txModal.tool.tenDungCu} (${txPerson.trim()})`
    );
    setTxModal(null);
  };

  const handleExportCSV = () => {
    if (subTab === 'inventory') {
      const headers = [
        'Mã dụng cụ',
        'Tên dụng cụ',
        'Danh mục',
        'Thương hiệu',
        'Serial',
        'Tổng SL',
        'Khả dụng',
        'Đang mượn',
        'Đơn vị',
        'Vị trí lưu',
        'Tình trạng',
        'Người đang giữ',
        'Hạn trả dự kiến',
      ];
      const rows = filteredTools.map((t) => [
        `"${t.maDungCu}"`,
        `"${t.tenDungCu}"`,
        `"${t.danhMuc}"`,
        `"${t.thuongHieu || ''}"`,
        `"${t.serialNumber || ''}"`,
        `"${t.soLuongTong}"`,
        `"${t.soLuongKhaDung}"`,
        `"${t.soLuongDangMuon}"`,
        `"${t.donViTinh}"`,
        `"${t.viTriLuu}"`,
        `"${t.tinhTrang}"`,
        `"${t.nguoiDangGiu || ''}"`,
        `"${t.hanTraDuKien || ''}"`,
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Danh_muc_dung_cu_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = [
        'Mã GD',
        'Ngày',
        'Loại GD',
        'Mã dụng cụ',
        'Tên dụng cụ',
        'Số lượng',
        'Người mượn/trả',
        'Người bàn giao',
        'Hạn trả',
        'Tình trạng trả',
        'Ghi chú',
      ];
      const rows = filteredLogs.map((l) => [
        `"${l.id}"`,
        `"${l.ngayGiaoDich}"`,
        `"${l.loaiGiaoDich}"`,
        `"${l.maDungCu}"`,
        `"${l.tenDungCu}"`,
        `"${l.soLuong}"`,
        `"${l.nguoiMuon}"`,
        `"${l.nguoiBanGiao}"`,
        `"${l.hanTra || ''}"`,
        `"${l.tinhTrangKhiTra || ''}"`,
        `"${(l.ghiChu || '').replace(/"/g, '""')}"`,
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `So_muon_tra_dung_cu_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderConditionBadge = (condition: ToolCondition) => {
    switch (condition) {
      case 'Tốt':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'Đang sử dụng':
        return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
      case 'Cần bảo dưỡng':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      default:
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 shadow-2xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Sub-tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 inline-block">
            {UI_TEXTS.tabs.tools.badge}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
            {UI_TEXTS.tabs.tools.title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setSubTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                subTab === 'inventory'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              Danh Mục Dụng Cụ ({tools.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                subTab === 'logs'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Sổ Mượn - Trả ({toolLogs.length})
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateToolModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Dụng Cụ</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Đầu Mục Dụng Cụ</div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono tabular-nums mt-1">
              {stats.totalKinds}
            </div>
          </div>
          <Wrench className="w-6 h-6 text-slate-400 shrink-0" />
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Sẵn Sàng Tại Kho</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums mt-1">
              {stats.totalAvailable}
            </div>
          </div>
          <PackageCheck className="w-6 h-6 text-emerald-400/80 shrink-0" />
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Đang Cho Kỹ Thuật Mượn</div>
            <div className="text-2xl font-extrabold text-cyan-400 font-mono tabular-nums mt-1">
              {stats.totalBorrowed}
            </div>
          </div>
          <ArrowUpRight className="w-6 h-6 text-cyan-400/80 shrink-0" />
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Quá Hạn Trả / Bảo Dưỡng</div>
            <div className="text-2xl font-extrabold text-rose-400 font-mono tabular-nums mt-1">
              {stats.issueOrOverdue}
            </div>
          </div>
          <AlertTriangle className="w-6 h-6 text-rose-400/80 shrink-0" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                subTab === 'inventory'
                  ? 'Tìm theo mã dụng cụ, tên, hãng, số serial, người đang giữ...'
                  : 'Tìm theo mã dụng cụ, tên, người mượn, ghi chú...'
              }
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {subTab === 'inventory' && (
            <>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ALL">Tất cả danh mục</option>
                {TOOL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ALL">Tất cả tình trạng</option>
                {TOOL_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-slate-300" />
          Xuất CSV
        </button>
      </div>

      {/* SUB-TAB 1: Inventory */}
      {subTab === 'inventory' && (
        <>
          {/* Mobile Compact Cards */}
          <div className="md:hidden space-y-2.5">
            {filteredTools.map((tool) => {
              const isOverdueReturn =
                tool.soLuongDangMuon > 0 &&
                tool.hanTraDuKien &&
                getInspectionDaysRemaining(tool.hanTraDuKien, APP_TODAY) < 0;
              return (
                <div
                  key={`tool-card-${tool.id}`}
                  className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="font-mono font-bold text-cyan-400">{tool.maDungCu}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{tool.danhMuc}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100 leading-snug mt-0.5">
                        {tool.tenDungCu}
                      </h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${renderConditionBadge(
                        tool.tinhTrang
                      )}`}
                    >
                      {tool.tinhTrang}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-slate-800 font-mono tabular-nums">
                    <div>
                      <span className="text-slate-500 block font-sans">Tổng SL</span>
                      <strong className="text-slate-200">
                        {tool.soLuongTong} {tool.donViTinh}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-sans">Khả dụng</span>
                      <strong className="text-emerald-400">{tool.soLuongKhaDung}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-sans">Đang mượn</span>
                      <strong className="text-cyan-400">{tool.soLuongDangMuon}</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{tool.viTriLuu}</span>
                    </div>
                    {tool.nguoiDangGiu && (
                      <div className="flex items-center gap-1.5 text-cyan-300 flex-wrap">
                        <User className="w-3 h-3 shrink-0" />
                        <span>Đang giữ: {tool.nguoiDangGiu}</span>
                        {tool.hanTraDuKien && (
                          <span className={isOverdueReturn ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                            · Hạn trả: {formatDateVN(tool.hanTraDuKien)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={tool.soLuongKhaDung <= 0}
                      onClick={() => openTransactionModal(tool, 'Mượn')}
                      className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold transition"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Mượn
                    </button>
                    <button
                      type="button"
                      disabled={tool.soLuongDangMuon <= 0}
                      onClick={() => openTransactionModal(tool, 'Trả')}
                      className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 disabled:opacity-40 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      Trả
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditToolModal(tool)}
                      className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingTool(tool)}
                      className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <SmartHorizontalScroll>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 whitespace-nowrap">Mã Dụng Cụ</th>
                    <th className="py-3 px-4 min-w-[210px]">Tên Dụng Cụ / Thiết Bị</th>
                    <th className="py-3 px-4 whitespace-nowrap">Danh Mục</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">Tổng / Khả Dụng / Mượn</th>
                    <th className="py-3 px-4 min-w-[150px]">Vị Trí Lưu</th>
                    <th className="py-3 px-4 min-w-[150px]">Người Đang Giữ & Hạn Trả</th>
                    <th className="py-3 px-4 whitespace-nowrap">Tình Trạng</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredTools.map((tool) => {
                    const isOverdueReturn =
                      tool.soLuongDangMuon > 0 &&
                      tool.hanTraDuKien &&
                      getInspectionDaysRemaining(tool.hanTraDuKien, APP_TODAY) < 0;
                    return (
                      <tr key={tool.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap align-top">
                          {tool.maDungCu}
                          {tool.serialNumber && (
                            <span className="block text-[10px] text-slate-500 font-normal">
                              SN: {tool.serialNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="font-semibold text-slate-100">{tool.tenDungCu}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {[tool.thuongHieu, tool.canHieuChuan && tool.hanHieuChuan ? `HC đến ${formatDateVN(tool.hanHieuChuan)}` : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap align-top text-slate-300">
                          {tool.danhMuc}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap align-top font-mono tabular-nums">
                          <span className="text-slate-200 font-bold">{tool.soLuongTong}</span>
                          <span className="text-slate-500 mx-1">/</span>
                          <span className="text-emerald-400 font-bold">{tool.soLuongKhaDung}</span>
                          <span className="text-slate-500 mx-1">/</span>
                          <span className="text-cyan-400 font-bold">{tool.soLuongDangMuon}</span>
                          <span className="text-slate-500 ml-1 text-[11px] font-sans">
                            {tool.donViTinh}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-top text-slate-300">{tool.viTriLuu}</td>
                        <td className="py-3 px-4 align-top">
                          {tool.nguoiDangGiu ? (
                            <div>
                              <div className="text-cyan-300 font-medium">{tool.nguoiDangGiu}</div>
                              {tool.hanTraDuKien && (
                                <div
                                  className={`text-[11px] font-mono tabular-nums ${
                                    isOverdueReturn ? 'text-rose-400 font-bold' : 'text-slate-400'
                                  }`}
                                >
                                  Hạn trả: {formatDateVN(tool.hanTraDuKien)}
                                  {isOverdueReturn ? ' (Quá hạn)' : ''}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">— Tại tủ đồ nghề</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap align-top">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${renderConditionBadge(
                              tool.tinhTrang
                            )}`}
                          >
                            {tool.tinhTrang}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap align-top">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={tool.soLuongKhaDung <= 0}
                              onClick={() => openTransactionModal(tool, 'Mượn')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              Mượn
                            </button>
                            <button
                              type="button"
                              disabled={tool.soLuongDangMuon <= 0}
                              onClick={() => openTransactionModal(tool, 'Trả')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-300 border border-emerald-500/30 text-xs font-bold transition"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              Trả
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditToolModal(tool)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTool(tool)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTools.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Không tìm thấy dụng cụ / đồ nghề nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </SmartHorizontalScroll>
          </div>
        </>
      )}

      {/* SUB-TAB 2: Borrow / Return Logs */}
      {subTab === 'logs' && (
        <>
          <div className="md:hidden space-y-2.5">
            {filteredLogs.map((log) => (
              <div
                key={`tlg-card-${log.id}`}
                className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono text-cyan-400">
                      {log.maDungCu} · {formatDateVN(log.ngayGiaoDich)}
                    </div>
                    <h4 className="text-sm font-bold text-slate-100">{log.tenDungCu}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                      log.loaiGiaoDich === 'Mượn'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : log.loaiGiaoDich === 'Trả'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {log.loaiGiaoDich} ({log.soLuong})
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>
                    Người thực hiện: <strong className="text-slate-200">{log.nguoiMuon}</strong> · Bàn giao:{' '}
                    {log.nguoiBanGiao}
                  </div>
                  {log.hanTra && (
                    <div className="font-mono">Hạn trả: {formatDateVN(log.hanTra)}</div>
                  )}
                  {log.ghiChu && <p className="text-slate-300 pt-1">{log.ghiChu}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <SmartHorizontalScroll>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 whitespace-nowrap">Ngày GD</th>
                    <th className="py-3 px-4 whitespace-nowrap">Loại GD</th>
                    <th className="py-3 px-4 whitespace-nowrap">Mã Dụng Cụ</th>
                    <th className="py-3 px-4 min-w-[200px]">Tên Dụng Cụ</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">SL</th>
                    <th className="py-3 px-4 whitespace-nowrap">Người Mượn / Trả</th>
                    <th className="py-3 px-4 whitespace-nowrap">Người Bàn Giao</th>
                    <th className="py-3 px-4 whitespace-nowrap">Hạn Trả / Tình Trạng</th>
                    <th className="py-3 px-4 min-w-[200px]">Ghi Chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                        {formatDateVN(log.ngayGiaoDich)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            log.loaiGiaoDich === 'Mượn'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : log.loaiGiaoDich === 'Trả'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {log.loaiGiaoDich}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                        {log.maDungCu}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-100">{log.tenDungCu}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                        {log.soLuong}
                      </td>
                      <td className="py-3 px-4 text-slate-200 whitespace-nowrap">
                        {log.nguoiMuon}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {log.nguoiBanGiao}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                        {log.hanTra ? (
                          <span className="font-mono text-amber-300">
                            Hạn: {formatDateVN(log.hanTra)}
                          </span>
                        ) : log.tinhTrangKhiTra ? (
                          <span className="text-emerald-400 font-semibold">
                            Khi trả: {log.tinhTrangKhiTra}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{log.ghiChu || '—'}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Chưa có giao dịch mượn / trả dụng cụ nào khớp bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </SmartHorizontalScroll>
          </div>
        </>
      )}

      {/* MODAL 1: Add / Edit Tool */}
      {isToolFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/70">
              <div className="flex items-center gap-2.5">
                <Hammer className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {editingTool ? 'Chỉnh Sửa Dụng Cụ / Đồ Nghề' : 'Thêm Dụng Cụ / Đồ Nghề Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsToolFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTool} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Mã Dụng Cụ *</label>
                  <input
                    type="text"
                    required
                    value={maDungCu}
                    onChange={(e) => setMaDungCu(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Danh Mục *</label>
                  <select
                    value={danhMuc}
                    onChange={(e) => setDanhMuc(e.target.value as ToolCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {TOOL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Tên Dụng Cụ / Đồ Nghề *</label>
                <input
                  type="text"
                  required
                  value={tenDungCu}
                  onChange={(e) => setTenDungCu(e.target.value)}
                  placeholder="VD: Ampe kìm đo dòng Fluke 376 FC"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Thương Hiệu</label>
                  <input
                    type="text"
                    value={thuongHieu}
                    onChange={(e) => setThuongHieu(e.target.value)}
                    placeholder="Fluke, Bosch..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Số Serial</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Tình Trạng</label>
                  <select
                    value={tinhTrang}
                    onChange={(e) => setTinhTrang(e.target.value as ToolCondition)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {TOOL_CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Tổng Số Lượng *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={soLuongTong}
                    onChange={(e) => setSoLuongTong(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Đơn Vị Tính *</label>
                  <input
                    type="text"
                    required
                    value={donViTinh}
                    onChange={(e) => setDonViTinh(e.target.value)}
                    placeholder="Bộ / Chiếc / Hộp"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Vị Trí Tủ / Kệ *</label>
                  <input
                    type="text"
                    required
                    value={viTriLuu}
                    onChange={(e) => setViTriLuu(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canHieuChuan}
                    onChange={(e) => setCanHieuChuan(e.target.checked)}
                    className="rounded text-cyan-500 focus:ring-0"
                  />
                  <span>Thiết bị đo cần theo dõi hạn hiệu chuẩn</span>
                </label>
                {canHieuChuan && (
                  <input
                    type="date"
                    value={hanHieuChuan}
                    onChange={(e) => setHanHieuChuan(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Ghi Chú</label>
                <textarea
                  rows={2}
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsToolFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow"
                >
                  {editingTool ? 'Lưu Thay Đổi' : 'Thêm Dụng Cụ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Borrow / Return Tool Transaction */}
      {txModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/70">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {txModal.type === 'Mượn'
                    ? 'Cấp Phát / Cho Mượn Dụng Cụ'
                    : 'Thu Hồi / Trả Dụng Cụ Về Kho'}
                </h3>
                <p className="text-xs text-cyan-400 mt-0.5">
                  {txModal.tool.maDungCu} · {txModal.tool.tenDungCu}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTxModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4 text-xs">
              {txError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-300">
                  {txError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Số Lượng ({txModal.tool.donViTinh}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={
                      txModal.type === 'Mượn'
                        ? txModal.tool.soLuongKhaDung
                        : txModal.tool.soLuongDangMuon
                    }
                    required
                    value={txQty}
                    onChange={(e) => setTxQty(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Tối đa:{' '}
                    {txModal.type === 'Mượn'
                      ? txModal.tool.soLuongKhaDung
                      : txModal.tool.soLuongDangMuon}{' '}
                    {txModal.tool.donViTinh}
                  </span>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Ngày Giao Dịch *</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  {txModal.type === 'Mượn' ? 'Nhân Sự Mượn Dụng Cụ *' : 'Nhân Sự Bàn Giao Trả *'}
                </label>
                <select
                  value={txPerson}
                  onChange={(e) => setTxPerson(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                >
                  <option value="">-- Chọn nhân sự --</option>
                  {employees.map((emp) => (
                    <option key={emp.maNhanVien} value={emp.tenNhanVien}>
                      {emp.tenNhanVien} ({emp.chucVu})
                    </option>
                  ))}
                </select>
              </div>

              {txModal.type === 'Mượn' ? (
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Hạn Trả Dự Kiến</label>
                  <input
                    type="date"
                    value={txDueDate}
                    onChange={(e) => setTxDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Tình Trạng Khi Trả</label>
                  <select
                    value={txReturnCondition}
                    onChange={(e) => setTxReturnCondition(e.target.value as ToolCondition)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    <option value="Tốt">Tốt (Sẵn sàng dùng tiếp)</option>
                    <option value="Cần bảo dưỡng">Cần bảo dưỡng / Thay pin / Vệ sinh</option>
                    <option value="Hư hỏng">Hư hỏng</option>
                    <option value="Thất lạc">Thất lạc</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Ghi Chú Mục Đích / Tình Trạng</label>
                <textarea
                  rows={2}
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  placeholder="VD: Kiểm tra dòng tải tủ điện MSB1..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTxModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-white font-bold shadow ${
                    txModal.type === 'Mượn'
                      ? 'bg-cyan-600 hover:bg-cyan-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {txModal.type === 'Mượn' ? 'Xác Nhận Cho Mượn' : 'Xác Nhận Thu Hồi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirm Delete Tool */}
      {deletingTool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Xác Nhận Xóa Dụng Cụ</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa dụng cụ{' '}
              <strong className="text-cyan-400 font-mono">{deletingTool.maDungCu}</strong> (
              <strong className="text-white">{deletingTool.tenDungCu}</strong>) khỏi danh mục?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTool(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTool(deletingTool.id);
                  showToast(`Đã xóa dụng cụ ${deletingTool.maDungCu}`);
                  setDeletingTool(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Xóa Dụng Cụ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
