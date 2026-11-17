import React, { useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { SparePart, StockTransaction } from '../../types/cmms';
import { canViewCosts, formatVND, formatDateVN } from '../../utils/cmmsLogic';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  Package,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Search,
  Filter,
  Download,
  History,
  Layers,
  Edit,
  Trash2,
} from 'lucide-react';

interface SparePartsTabProps {
  onOpenStockModal: (partCode?: string) => void;
  onOpenAddPart: () => void;
  onOpenEditPart: (part: SparePart) => void;
}

export const SparePartsTab: React.FC<SparePartsTabProps> = ({
  onOpenStockModal,
  onOpenAddPart,
  onOpenEditPart,
}) => {
  const { spareParts, stockTransactions, deleteSparePart, currentUser } = useCMMS();
  const showCosts = canViewCosts(currentUser);

  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'transactions'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Filter inventory
  const filteredParts = spareParts.filter((p) => {
    const matchSearch =
      p.maVatTu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tenVatTu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tenThietBiSuDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.viTriLuu.toLowerCase().includes(searchTerm.toLowerCase());

    const matchLowStock = filterLowStockOnly ? p.tonThucTe <= p.tonToiThieu : true;

    return matchSearch && matchLowStock;
  });

  // Filter transactions
  const filteredTransactions = stockTransactions.filter((t) => {
    return (
      t.transId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.maVatTu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.thietBiSuDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nguoiThucHien.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Metrics
  const lowStockCount = spareParts.filter((p) => p.tonThucTe <= p.tonToiThieu).length;
  const totalInventoryValuation = spareParts.reduce(
    (acc, p) => acc + p.tonThucTe * p.donGia,
    0
  );

  // Export CSV
  const handleExportPartsCSV = () => {
    const headers = [
      'Mã vật tư',
      'Tên vật tư',
      'Thông số',
      'Mã thiết bị',
      'Tên thiết bị sử dụng',
      'Tồn tối thiểu',
      'Tồn thực tế',
      'Đơn vị tính',
      'Vị trí lưu',
      'Ghi chú',
      ...(showCosts ? ['Đơn giá (VNĐ)'] : []),
    ];
    const rows = filteredParts.map((p) => [
      `"${p.maVatTu}"`,
      `"${p.tenVatTu}"`,
      `"${p.thongSo}"`,
      `"${p.maThietBi}"`,
      `"${p.tenThietBiSuDung}"`,
      `"${p.tonToiThieu}"`,
      `"${p.tonThucTe}"`,
      `"${p.donViTinh}"`,
      `"${p.viTriLuu}"`,
      `"${p.ghiChu}"`,
      ...(showCosts ? [`"${p.donGia}"`] : []),
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh_muc_vat_tu_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTransactionsCSV = () => {
    const headers = [
      'TransID',
      'Ngày',
      'Loại GD',
      'Mã vật tư',
      'Thiết bị sử dụng',
      'Số lượng',
      'Người thực hiện',
      'Ghi chú',
    ];
    const rows = filteredTransactions.map((t) => [
      `"${t.transId}"`,
      `"${t.ngay}"`,
      `"${t.loaiGD}"`,
      `"${t.maVatTu}"`,
      `"${t.thietBiSuDung}"`,
      `"${t.soLuong}"`,
      `"${t.nguoiThucHien}"`,
      `"${t.ghiChu}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kho_xuat_nhap_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            {UI_TEXTS.tabs.spareParts.title}
          </h2>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-tab switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveSubTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'inventory'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Tồn Kho ({spareParts.length})
            </button>
            <button
              onClick={() => setActiveSubTab('transactions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'transactions'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Xuất Nhập ({stockTransactions.length})
            </button>
          </div>

          <button
            onClick={() => onOpenStockModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm"
          >
            <ArrowDownRight className="w-4 h-4" />
            Xuất / Nhập Kho
          </button>

          <button
            onClick={onOpenAddPart}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm Vật Tư
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className={`grid grid-cols-1 ${showCosts ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
        {showCosts && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Tổng Giá Trị Kho</span>
              <div className="text-xl font-extrabold text-slate-100 font-mono mt-0.5">
                {formatVND(totalInventoryValuation)}
              </div>
            </div>
            <span className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <Package className="w-5 h-5" />
            </span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Cảnh Báo Tồn Thấp (≤ Min)</span>
            <div
              className={`text-xl font-extrabold font-mono mt-0.5 ${
                lowStockCount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {lowStockCount} mặt hàng
            </div>
          </div>
          <span
            className={`p-3 rounded-xl ${
              lowStockCount > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Giao Dịch Gần Nhất</span>
            <div className="text-xl font-extrabold text-cyan-300 font-mono mt-0.5">
              {stockTransactions.length} lượt
            </div>
          </div>
          <span className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <History className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Control bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã vật tư, tên, vị trí kho, thiết bị..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {activeSubTab === 'inventory' && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer bg-slate-800 px-3 py-2 rounded-xl border border-slate-700">
              <input
                type="checkbox"
                checked={filterLowStockOnly}
                onChange={(e) => setFilterLowStockOnly(e.target.checked)}
                className="rounded accent-purple-600"
              />
              <span>Chỉ hiện vật tư tồn thấp ({lowStockCount})</span>
            </label>
          )}
        </div>

        <button
          onClick={activeSubTab === 'inventory' ? handleExportPartsCSV : handleExportTransactionsCSV}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <Download className="w-3.5 h-3.5 text-purple-400" />
          Xuất File CSV
        </button>
      </div>

      {/* Sub-tab 1: Inventory Table (Sheet 5) */}
      {activeSubTab === 'inventory' ? (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          <SmartHorizontalScroll>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Mã Vật Tư</th>
                  <th className="py-3 px-4">Tên Vật Tư & Thông Số</th>
                  <th className="py-3 px-4">Thiết Bị Sử Dụng</th>
                  <th className="py-3 px-4 text-center">Tồn Tối Thiểu</th>
                  <th className="py-3 px-4 text-center">Tồn Thực Tế</th>
                  <th className="py-3 px-4">Đơn Vị</th>
                  <th className="py-3 px-4">Vị Trí Lưu Kho</th>
                  {showCosts && <th className="py-3 px-4 text-right">Đơn Giá</th>}
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredParts.map((part) => {
                  const isLow = part.tonThucTe <= part.tonToiThieu;
                  return (
                    <tr key={part.maVatTu} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-400 whitespace-nowrap">
                        {part.maVatTu}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100">{part.tenVatTu}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{part.thongSo}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        {part.tenThietBiSuDung}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                        {part.tonToiThieu}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`font-mono font-extrabold px-2.5 py-1 rounded text-xs inline-block ${
                            isLow
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {part.tonThucTe} {isLow && '⚠️'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{part.donViTinh}</td>
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">{part.viTriLuu}</td>
                      {showCosts && (
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-200 whitespace-nowrap">
                          {formatVND(part.donGia)}
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenStockModal(part.maVatTu)}
                            title="Xuất/Nhập kho ngay"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                          >
                            <ArrowDownRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenEditPart(part)}
                            title="Sửa vật tư"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc chắn muốn xóa vật tư ${part.tenVatTu}?`)) {
                                deleteSparePart(part.maVatTu);
                              }
                            }}
                            title="Xóa vật tư"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </SmartHorizontalScroll>
        </div>
      ) : (
        /* Sub-tab 2: Stock Transactions Table (Sheet 6) */
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          <SmartHorizontalScroll>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">TransID</th>
                  <th className="py-3 px-4">Ngày GD</th>
                  <th className="py-3 px-4">Loại GD</th>
                  <th className="py-3 px-4">Mã Vật Tư</th>
                  <th className="py-3 px-4">Thiết Bị Sử Dụng</th>
                  <th className="py-3 px-4 text-center">Số Lượng</th>
                  <th className="py-3 px-4">Người Thực Hiện</th>
                  <th className="py-3 px-4">Ghi Chú & Lý Do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.transId} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {tx.transId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {formatDateVN(tx.ngay)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          tx.loaiGD === 'Xuất kho sử dụng'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {tx.loaiGD === 'Xuất kho sử dụng' ? (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                        {tx.loaiGD}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-300 whitespace-nowrap">
                      {tx.maVatTu}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{tx.thietBiSuDung}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-extrabold text-sm text-slate-100">
                      {tx.soLuong}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 whitespace-nowrap">
                      {tx.nguoiThucHien}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{tx.ghiChu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SmartHorizontalScroll>
        </div>
      )}
    </div>
  );
};
