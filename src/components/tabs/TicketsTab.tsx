import React, { useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { Ticket, TicketStatus, TicketPriority } from '../../types/cmms';
import { canAssignWork, canDeleteRecords, formatDateVN, parseAssigneeNames } from '../../utils/cmmsLogic';
import { resolveImageUrl } from '../../utils/imageUtils';
import { exportTicketsRepairExcel } from '../../utils/excelExport';
import { WorkAssignmentModal } from '../common/WorkAssignmentModal';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  Plus,
  Search,
  CheckCircle,
  User,
  Edit,
  Trash2,
  Download,
  FileSpreadsheet,
  LayoutGrid,
  Table as TableIcon,
  Send,
  AlertTriangle,
  X,
} from 'lucide-react';

interface TicketsTabProps {
  onOpenCreateTicket: () => void;
  onOpenEditTicket: (ticket: Ticket) => void;
}

export const TicketsTab: React.FC<TicketsTabProps> = ({
  onOpenCreateTicket,
  onOpenEditTicket,
}) => {
  const { tickets, equipment, currentUser, updateTicket, deleteTicket, employees, addAuditLog } = useCMMS();
  const canDelete = canDeleteRecords(currentUser);
  const allowAssignWork = canAssignWork(currentUser);

  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [ticketToAssign, setTicketToAssign] = useState<Ticket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const filteredTickets = tickets.filter((t) => {
    const matchSearch =
      t.maTicket.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tieuDe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nguoiPhuTrach.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nguoiLap.toLowerCase().includes(searchTerm.toLowerCase());

    const matchPriority = priorityFilter === 'ALL' || t.mucDoUuTien === priorityFilter;
    const matchStatus = statusFilter === 'ALL' || t.trangThai === statusFilter;
    const matchAssignee =
      assigneeFilter === 'ALL' ||
      t.nguoiPhuTrach === assigneeFilter ||
      parseAssigneeNames(t.nguoiPhuTrach).some(
        (n) => n.toLowerCase() === assigneeFilter.toLowerCase()
      ) ||
      t.nguoiPhuTrach.toLowerCase().includes(assigneeFilter.toLowerCase());

    return matchSearch && matchPriority && matchStatus && matchAssignee;
  });

  const handleQuickStatusChange = (ticket: Ticket, newStatus: TicketStatus) => {
    updateTicket({
      ...ticket,
      trangThai: newStatus,
      ngayHoanThanh: newStatus === 'Hoàn thành' ? '2026-11-10' : ticket.ngayHoanThanh,
    });
  };

  const handleExportCSV = () => {
    const headers = [
      'Mã ticket',
      'Tiêu đề',
      'Trạng thái',
      'Ngày tạo',
      'Mô tả chi tiết',
      'Người phụ trách',
      'Ngày hoàn thành',
      'Kết quả',
      'Người lập',
      'Mức độ ưu tiên',
      'Ảnh trước xử lý',
      'Ảnh sau xử lý',
    ];
    const rows = filteredTickets.map((t) => [
      `"${t.maTicket}"`,
      `"${t.tieuDe.replace(/"/g, '""')}"`,
      `"${t.trangThai}"`,
      `"${t.ngayTao}"`,
      `"${t.moTaChiTiet.replace(/"/g, '""')}"`,
      `"${t.nguoiPhuTrach}"`,
      `"${t.ngayHoanThanh || ''}"`,
      `"${(t.ketQua || '').replace(/"/g, '""')}"`,
      `"${t.nguoiLap}"`,
      `"${t.mucDoUuTien}"`,
      `"${t.anhTruocXuLy || ''}"`,
      `"${t.anhSauXuLy || ''}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tickets_Su_Co_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const filterParts: string[] = [];
    if (searchTerm.trim()) filterParts.push(`Tìm="${searchTerm.trim()}"`);
    if (priorityFilter !== 'ALL') filterParts.push(`Ưu tiên=${priorityFilter}`);
    if (statusFilter !== 'ALL') filterParts.push(`Trạng thái=${statusFilter}`);
    if (assigneeFilter !== 'ALL') filterParts.push(`Phụ trách=${assigneeFilter}`);

    exportTicketsRepairExcel(filteredTickets, equipment, {
      exportedBy: currentUser.tenNhanVien,
      includePrintLayout: true,
      filterNote: filterParts.length > 0 ? filterParts.join(', ') : 'Toàn bộ Tickets đang hiển thị',
    });
    addAuditLog(
      'Cập nhật',
      'Xuất Excel Sửa Chữa',
      'Quản lý Tickets',
      `Xuất ${filteredTickets.length} phiếu sửa chữa / sự cố ra file Excel (.xlsx)`
    );
    showToast(`Đã xuất ${filteredTickets.length} phiếu sửa chữa ra file Excel (.xlsx)!`);
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl text-xs font-semibold max-w-md ${
            /Chưa gửi được|Thất bại|Lỗi/i.test(toastMsg)
              ? 'bg-amber-950/95 border-amber-500/40 text-amber-100'
              : 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {/Chưa gửi được|Thất bại|Lỗi/i.test(toastMsg) ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMsg}</span>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">({tickets.length} yêu cầu công việc)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
            {UI_TEXTS.tabs.tickets.title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 text-xs sm:text-sm font-bold border border-emerald-500/40 transition"
            title="Xuất danh sách Tickets / lịch sử sửa chữa ra file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Xuất Excel (.xlsx)
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-amber-400" />
            Xuất File CSV
          </button>
          <button
            onClick={onOpenCreateTicket}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-amber-900/30 transition"
          >
            <Plus className="w-4 h-4" />
            Tạo Ticket Mới
          </button>
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
              placeholder="Tìm theo mã ticket, tiêu đề, người phụ trách..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">Tất cả ưu tiên</option>
            <option value="Khẩn cấp">🔴 Khẩn cấp</option>
            <option value="Cao">🟠 Cao</option>
            <option value="Trung bình">🟡 Trung bình</option>
            <option value="Bình thường">🔵 Bình thường</option>
            <option value="Thấp">🟢 Thấp</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Đang thực hiện">Đang thực hiện</option>
            <option value="Chờ xử lý">Chờ xử lý</option>
            <option value="Đang xử lý">Đang xử lý</option>
            <option value="Mới tiếp nhận">Mới tiếp nhận</option>
            <option value="Hủy">Hủy</option>
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 max-w-[200px] truncate"
            title="Lọc theo người phụ trách"
          >
            <option value="ALL">👤 Tất cả kỹ thuật viên</option>
            {employees.map((emp) => (
              <option key={emp.maNhanVien} value={emp.tenNhanVien}>
                {emp.tenNhanVien} ({emp.maNhanVien})
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle Button Group (Desktop / Tablet) */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'card'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Hiển thị dạng thẻ (Card Grid)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Dạng Thẻ</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Hiển thị dạng bảng (Table View)"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Dạng Bảng</span>
          </button>
        </div>
      </div>

      {/* Summary counter bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Hiển thị <strong className="text-amber-400 font-mono tabular-nums">{filteredTickets.length}</strong> /{' '}
          <span className="font-mono tabular-nums">{tickets.length}</span> yêu cầu công việc
        </span>
        <span className="md:hidden text-[11px] text-slate-500">Chế độ thẻ thu gọn</span>
      </div>

      {/* Tickets List: Compact Card View (Always shown on mobile < md, and on desktop when viewMode === 'card') */}
      <div
        className={
          viewMode === 'table'
            ? 'md:hidden space-y-2.5'
            : 'grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4'
        }
      >
        {filteredTickets.length === 0 ? (
          <div className="md:col-span-2 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
            Không tìm thấy ticket nào phù hợp với điều kiện lọc.
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const assignees = parseAssigneeNames(ticket.nguoiPhuTrach);
            return (
              <div
                key={`card-ticket-${ticket.maTicket}`}
                className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 sm:p-4 space-y-2.5 hover:border-amber-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  {/* Top row: Code · Priority · Date | Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                        <span className="font-mono font-bold text-amber-400 tabular-nums">
                          {ticket.maTicket}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            ticket.mucDoUuTien === 'Khẩn cấp'
                              ? 'text-rose-400'
                              : ticket.mucDoUuTien === 'Cao'
                              ? 'text-amber-300'
                              : 'text-sky-300'
                          }`}
                        >
                          {ticket.mucDoUuTien}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-slate-400">
                          {formatDateVN(ticket.ngayTao)}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-snug">
                        {ticket.tieuDe}
                      </h3>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                        ticket.trangThai === 'Hoàn thành'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : ticket.trangThai === 'Đang thực hiện' || ticket.trangThai === 'Đang xử lý'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : ticket.trangThai === 'Chờ xử lý' || ticket.trangThai === 'Mới tiếp nhận'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {ticket.trangThai}
                    </span>
                  </div>

                  {/* Description + Compact Inline Thumbnails */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {ticket.moTaChiTiet}
                      </p>
                      {ticket.ketQua && (
                        <p className="text-[11px] text-emerald-400 line-clamp-1 font-medium">
                          ✓ {ticket.ketQua}
                        </p>
                      )}
                    </div>

                    {(ticket.anhTruocXuLy || ticket.anhSauXuLy) && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ticket.anhTruocXuLy && (
                          <button
                            type="button"
                            onClick={() => setSelectedPhoto(ticket.anhTruocXuLy!)}
                            className="relative w-12 h-11 rounded-lg overflow-hidden border border-rose-500/40 bg-slate-950 hover:border-rose-400 transition"
                            title="Ảnh trước xử lý"
                          >
                            <img
                              src={resolveImageUrl(ticket.anhTruocXuLy)}
                              alt="Trước xử lý"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-rose-300 font-semibold text-center leading-tight py-0.5">
                              Trước
                            </span>
                          </button>
                        )}
                        {ticket.anhSauXuLy && (
                          <button
                            type="button"
                            onClick={() => setSelectedPhoto(ticket.anhSauXuLy!)}
                            className="relative w-12 h-11 rounded-lg overflow-hidden border border-emerald-500/40 bg-slate-950 hover:border-emerald-400 transition"
                            title="Ảnh sau xử lý"
                          >
                            <img
                              src={resolveImageUrl(ticket.anhSauXuLy)}
                              alt="Sau xử lý"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-emerald-300 font-semibold text-center leading-tight py-0.5">
                              Sau
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Compact Meta + Actions Footer */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1 text-cyan-300 font-medium">
                      <User className="w-3 h-3 text-slate-500 shrink-0" />
                      {assignees.length > 0 ? assignees.join(', ') : ticket.nguoiPhuTrach}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Lập: {ticket.nguoiLap}</span>
                    {ticket.ngayHoanThanh && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-emerald-400">
                          Xong {formatDateVN(ticket.ngayHoanThanh)}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      {ticket.trangThai === 'Mới tiếp nhận' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(ticket, 'Đang xử lý')}
                          className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-semibold transition whitespace-nowrap"
                        >
                          Bắt Đầu Xử Lý
                        </button>
                      )}
                      {(ticket.trangThai === 'Đang xử lý' || ticket.trangThai === 'Đang thực hiện') && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(ticket, 'Hoàn thành')}
                          className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition whitespace-nowrap"
                        >
                          Hoàn Thành
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      {allowAssignWork && (
                        <button
                          type="button"
                          onClick={() => setTicketToAssign(ticket)}
                          className="min-h-[38px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition whitespace-nowrap"
                          title="Giao việc & Gửi email tới người phụ trách"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Giao Việc
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenEditTicket(ticket)}
                        className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Sửa ticket"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeletingTicket(ticket)}
                          className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                          title="Xóa ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tickets List: Dạng Bảng (Table View on Desktop md+) */}
      {viewMode === 'table' && (
        <div className="hidden md:block rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <SmartHorizontalScroll>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Mã Ticket</th>
                  <th className="py-3 px-4">Tiêu Đề & Nội Dung Yêu Cầu</th>
                  <th className="py-3 px-4">Mức Độ Ưu Tiên</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Kỹ Thuật Phụ Trách</th>
                  <th className="py-3 px-4">Người Lập</th>
                  <th className="py-3 px-4">Ngày Tạo / Hoàn Thành</th>
                  <th className="py-3 px-4 text-center">Ảnh</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      Không tìm thấy ticket nào phù hợp với điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.maTicket} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {ticket.maTicket}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-100 truncate">{ticket.tieuDe}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {ticket.moTaChiTiet}
                        </p>
                        {ticket.ketQua && (
                          <div className="text-[10px] text-emerald-400 font-mono mt-0.5 truncate">
                            ✓ {ticket.ketQua}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block ${
                            ticket.mucDoUuTien === 'Khẩn cấp'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : ticket.mucDoUuTien === 'Cao'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : ticket.mucDoUuTien === 'Bình thường'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {ticket.mucDoUuTien}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold inline-block ${
                            ticket.trangThai === 'Hoàn thành'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : ticket.trangThai === 'Đang thực hiện' || ticket.trangThai === 'Đang xử lý'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : ticket.trangThai === 'Chờ xử lý' || ticket.trangThai === 'Mới tiếp nhận'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {ticket.trangThai}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{ticket.nguoiPhuTrach}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 text-xs">
                        {ticket.nguoiLap}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="text-slate-300">{formatDateVN(ticket.ngayTao)}</div>
                        {ticket.ngayHoanThanh && (
                          <div className="text-emerald-400 text-[10px]">
                            Xong: {formatDateVN(ticket.ngayHoanThanh)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {ticket.anhTruocXuLy ? (
                            <button
                              type="button"
                              onClick={() => setSelectedPhoto(ticket.anhTruocXuLy!)}
                              className="w-7 h-7 rounded-lg overflow-hidden border border-rose-500/40 relative group"
                              title="Xem ảnh trước xử lý"
                            >
                              <img
                                src={resolveImageUrl(ticket.anhTruocXuLy)}
                                alt="Trước"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-110 transition"
                              />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-600">-</span>
                          )}
                          {ticket.anhSauXuLy && (
                            <button
                              type="button"
                              onClick={() => setSelectedPhoto(ticket.anhSauXuLy!)}
                              className="w-7 h-7 rounded-lg overflow-hidden border border-emerald-500/40 relative group"
                              title="Xem ảnh sau xử lý"
                            >
                              <img
                                src={resolveImageUrl(ticket.anhSauXuLy)}
                                alt="Sau"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-110 transition"
                              />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {ticket.trangThai === 'Mới tiếp nhận' && (
                            <button
                              onClick={() => handleQuickStatusChange(ticket, 'Đang xử lý')}
                              className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-[10px] font-bold transition whitespace-nowrap"
                            >
                              Bắt Đầu
                            </button>
                          )}
                          {ticket.trangThai === 'Đang xử lý' && (
                            <button
                              onClick={() => handleQuickStatusChange(ticket, 'Hoàn thành')}
                              className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition whitespace-nowrap"
                            >
                              Hoàn Thành
                            </button>
                          )}
                          {allowAssignWork && (
                            <button
                              onClick={() => setTicketToAssign(ticket)}
                              className="p-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 transition"
                              title="Giao việc & Gửi email"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onOpenEditTicket(ticket)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Sửa ticket"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => setDeletingTicket(ticket)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                              title="Xóa ticket"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SmartHorizontalScroll>
        </div>
      )}

      {/* Lightbox Modal for Photos */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={resolveImageUrl(selectedPhoto)}
              alt="Phóng to"
              referrerPolicy="no-referrer"
              className="max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white"
              aria-label="Đóng ảnh"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Delete Ticket Modal */}
      {deletingTicket && canDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Xác Nhận Xóa Ticket</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa ticket{' '}
              <strong className="text-amber-400 font-mono">{deletingTicket.maTicket}</strong> —{' '}
              <strong className="text-white">{deletingTicket.tieuDe}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTicket(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTicket(deletingTicket.maTicket);
                  showToast(`Đã xóa ticket ${deletingTicket.maTicket}`);
                  setDeletingTicket(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow"
              >
                Xóa Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Work Assignment & Email Modal */}
      {ticketToAssign && allowAssignWork && (
        <WorkAssignmentModal
          isOpen={Boolean(ticketToAssign)}
          onClose={() => setTicketToAssign(null)}
          module="TICKET"
          targetId={ticketToAssign.maTicket}
          targetName={ticketToAssign.tieuDe}
          currentAssignee={ticketToAssign.nguoiPhuTrach}
          currentAssigner={ticketToAssign.nguoiGiaoViec || ticketToAssign.nguoiLap}
          onAssigned={showToast}
        />
      )}
    </div>
  );
};
