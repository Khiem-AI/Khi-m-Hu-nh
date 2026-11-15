import React, { useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { CostRecord } from '../../types/cmms';
import { formatVND, formatDateVN } from '../../utils/cmmsLogic';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import { CostPredictiveAnalysis } from '../CostPredictiveAnalysis';
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface CostTabProps {
  onOpenAddCost: () => void;
  onOpenEditCost: (cost: CostRecord) => void;
}

export const CostTab: React.FC<CostTabProps> = ({ onOpenAddCost, onOpenEditCost }) => {
  const { costRecords, deleteCostRecord } = useCMMS();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [pendingDeleteCost, setPendingDeleteCost] = useState<CostRecord | null>(null);

  const filteredCosts = costRecords.filter((c) => {
    const matchSearch =
      c.idChiPhi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.thamChieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nhaCungCap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ghiChu.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCat = categoryFilter === 'ALL' || c.phanLoai === categoryFilter;
    const matchStatus = statusFilter === 'ALL' || c.trangThai === statusFilter;

    return matchSearch && matchCat && matchStatus;
  });

  // Analytics
  const totalCost = costRecords.reduce((a, b) => a + b.soTienVND, 0);
  const paidCost = costRecords
    .filter((c) => c.trangThai === 'Đã thanh toán')
    .reduce((a, b) => a + b.soTienVND, 0);
  const pendingCost = costRecords
    .filter((c) => c.trangThai === 'Chờ duyệt')
    .reduce((a, b) => a + b.soTienVND, 0);
  const approvedCost = costRecords
    .filter((c) => c.trangThai === 'Đã duyệt')
    .reduce((a, b) => a + b.soTienVND, 0);

  const handleExportCSV = () => {
    const headers = [
      'ID Chi Phí',
      'Ngày ghi nhận',
      'Phân loại',
      'Tham chiếu (Mã TB/Ticket)',
      'Số tiền (VNĐ)',
      'Nhà cung cấp / Đối tác',
      'Trạng thái',
      'Ghi chú',
    ];
    const rows = filteredCosts.map((c) => [
      `"${c.idChiPhi}"`,
      `"${c.ngayGhiNhan}"`,
      `"${c.phanLoai}"`,
      `"${c.thamChieu}"`,
      `"${c.soTienVND}"`,
      `"${c.nhaCungCap.replace(/"/g, '""')}"`,
      `"${c.trangThai}"`,
      `"${c.ghiChu.replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quan_ly_chi_phi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">({costRecords.length} khoản chi phí)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
            {UI_TEXTS.tabs.costs.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Xuất File CSV
          </button>
          <button
            onClick={onOpenAddCost}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-900/30 transition"
          >
            <Plus className="w-4 h-4" />
            Ghi Nhận Chi Phí
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Tổng Ngân Sách Đã Chi</span>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {formatVND(totalCost)}
          </div>
          <span className="text-[11px] text-slate-500">Toàn bộ các phân loại</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Đã Thanh Toán</span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {formatVND(paidCost)}
          </div>
          <span className="text-[11px] text-slate-500">Đã hoàn tất chứng từ</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Chờ Phê Duyệt</span>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            {formatVND(pendingCost)}
          </div>
          <span className="text-[11px] text-slate-500">Cần Trưởng phòng duyệt</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Đã Duyệt (Chờ giải ngân)</span>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono tabular-nums">
            {formatVND(approvedCost)}
          </div>
          <span className="text-[11px] text-slate-500">Sẵn sàng chuyển khoản</span>
        </div>
      </div>

      {/* Predictive Cost Analysis Module (Next 6 Months Trend-Line) */}
      <CostPredictiveAnalysis />

      {/* Control bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã chi phí, mã máy, đối tác, ghi chú..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tất cả phân loại</option>
            <option value="Bảo trì định kỳ">Bảo trì định kỳ</option>
            <option value="Sửa chữa đột xuất">Sửa chữa đột xuất</option>
            <option value="Mua vật tư thay thế">Mua vật tư thay thế</option>
            <option value="Kiểm định an toàn">Kiểm định an toàn</option>
            <option value="Dịch vụ ngoài">Dịch vụ ngoài / Thuê gia công</option>
            <option value="Khác">Khác</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Đã thanh toán">Đã thanh toán</option>
            <option value="Đã duyệt">Đã duyệt</option>
            <option value="Chờ duyệt">Chờ duyệt</option>
          </select>
        </div>
      </div>

      {/* Cost Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <SmartHorizontalScroll>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">ID Chi Phí</th>
                <th className="py-3 px-4">Ngày Ghi Nhận</th>
                <th className="py-3 px-4">Phân Loại</th>
                <th className="py-3 px-4">Tham Chiếu</th>
                <th className="py-3 px-4 text-right">Số Tiền (VNĐ)</th>
                <th className="py-3 px-4">Nhà Cung Cấp / Đối Tác</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4">Ghi Chú</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredCosts.map((cost) => (
                <tr key={cost.idChiPhi} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                    {cost.idChiPhi}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {formatDateVN(cost.ngayGhiNhan)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200 whitespace-nowrap">
                    {cost.phanLoai}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-cyan-300 whitespace-nowrap">
                    {cost.thamChieu}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-slate-100 whitespace-nowrap">
                    {formatVND(cost.soTienVND)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-[200px] truncate">
                    {cost.nhaCungCap}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold ${
                        cost.trangThai === 'Đã thanh toán'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : cost.trangThai === 'Đã duyệt'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {cost.trangThai}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{cost.ghiChu}</td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenEditCost(cost)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Sửa chi phí"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPendingDeleteCost(cost)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                        title="Xóa chi phí"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCosts.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 px-4 text-center text-slate-500 text-xs">
                    Không tìm thấy khoản chi phí nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </SmartHorizontalScroll>
      </div>

      {/* Confirm Delete Modal */}
      {pendingDeleteCost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-100">Xác nhận xóa chứng từ chi phí</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bạn có chắc chắn muốn xóa khoản chi phí{' '}
                  <strong className="font-mono text-slate-200">{pendingDeleteCost.idChiPhi}</strong> (
                  {formatVND(pendingDeleteCost.soTienVND)}) không?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingDeleteCost(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCostRecord(pendingDeleteCost.idChiPhi);
                  setPendingDeleteCost(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
