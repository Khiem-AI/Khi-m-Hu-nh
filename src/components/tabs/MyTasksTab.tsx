import React, { useMemo, useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { Equipment, Ticket, TicketStatus } from '../../types/cmms';
import { formatDateVN, matchesAssignee } from '../../utils/cmmsLogic';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Cpu,
  Edit,
  QrCode,
  Search,
  Tag,
  User,
  Wrench,
} from 'lucide-react';

interface MyTasksTabProps {
  onOpenMaintenanceModal: (eq: Equipment) => void;
  onOpenQR: (eq: Equipment) => void;
  onOpenEditTicket: (ticket: Ticket) => void;
  onOpenTicketFromEquipment: (eq: Equipment) => void;
}

type TaskSectionFilter = 'ACTION_NEEDED' | 'PLANS' | 'TICKETS' | 'EQUIPMENT' | 'HISTORY';

const PRIORITY_RANK: Record<string, number> = {
  'Khẩn cấp': 0,
  Cao: 1,
  'Trung bình': 2,
  'Bình thường': 3,
  Thấp: 4,
};

const PLAN_STATUS_RANK: Record<string, number> = {
  'Quá hạn': 0,
  'Tới hạn': 1,
  'Sắp tới': 2,
  'Đúng hạn': 3,
};

export const MyTasksTab: React.FC<MyTasksTabProps> = ({
  onOpenMaintenanceModal,
  onOpenQR,
  onOpenEditTicket,
  onOpenTicketFromEquipment,
}) => {
  const {
    currentUser,
    equipment,
    maintenancePlans,
    maintenanceHistory,
    tickets,
    updateTicket,
  } = useCMMS();

  const [activeFilter, setActiveFilter] = useState<TaskSectionFilter>('ACTION_NEEDED');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const myPlans = useMemo(
    () =>
      maintenancePlans
        .filter((p) => matchesAssignee(p.nguoiPhuTrach, currentUser))
        .sort(
          (a, b) =>
            (PLAN_STATUS_RANK[a.trangThai] ?? 9) - (PLAN_STATUS_RANK[b.trangThai] ?? 9) ||
            a.ngayBaoTriTiepTheo.localeCompare(b.ngayBaoTriTiepTheo)
        ),
    [maintenancePlans, currentUser]
  );

  const myTickets = useMemo(
    () =>
      tickets
        .filter((t) => matchesAssignee(t.nguoiPhuTrach, currentUser))
        .sort((a, b) => {
          const aDone = a.trangThai === 'Hoàn thành' || a.trangThai === 'Hủy' ? 1 : 0;
          const bDone = b.trangThai === 'Hoàn thành' || b.trangThai === 'Hủy' ? 1 : 0;
          if (aDone !== bDone) return aDone - bDone;
          return (
            (PRIORITY_RANK[a.mucDoUuTien] ?? 9) - (PRIORITY_RANK[b.mucDoUuTien] ?? 9) ||
            b.ngayTao.localeCompare(a.ngayTao)
          );
        }),
    [tickets, currentUser]
  );

  const myEquipment = useMemo(
    () => equipment.filter((eq) => matchesAssignee(eq.nguoiPhuTrach, currentUser)),
    [equipment, currentUser]
  );

  const myHistory = useMemo(
    () =>
      maintenanceHistory
        .filter((h) => matchesAssignee(h.nguoiThucHien, currentUser))
        .sort((a, b) => b.ngayThucHien.localeCompare(a.ngayThucHien)),
    [maintenanceHistory, currentUser]
  );

  const urgentPlans = useMemo(
    () =>
      myPlans.filter(
        (p) => p.trangThai === 'Quá hạn' || p.trangThai === 'Tới hạn' || p.trangThai === 'Sắp tới'
      ),
    [myPlans]
  );

  const openTickets = useMemo(
    () => myTickets.filter((t) => t.trangThai !== 'Hoàn thành' && t.trangThai !== 'Hủy'),
    [myTickets]
  );

  const completedTickets = useMemo(
    () => myTickets.filter((t) => t.trangThai === 'Hoàn thành'),
    [myTickets]
  );

  const q = searchTerm.trim().toLowerCase();

  const filteredPlans = useMemo(() => {
    const base = activeFilter === 'ACTION_NEEDED' ? urgentPlans : myPlans;
    if (!q) return base;
    return base.filter(
      (p) =>
        p.maThietBi.toLowerCase().includes(q) ||
        p.tenThietBi.toLowerCase().includes(q) ||
        (p.nguoiGiaoViec || '').toLowerCase().includes(q)
    );
  }, [activeFilter, urgentPlans, myPlans, q]);

  const filteredTickets = useMemo(() => {
    const base = activeFilter === 'ACTION_NEEDED' ? openTickets : myTickets;
    if (!q) return base;
    return base.filter(
      (t) =>
        t.maTicket.toLowerCase().includes(q) ||
        t.tieuDe.toLowerCase().includes(q) ||
        t.moTaChiTiet.toLowerCase().includes(q) ||
        (t.maThietBi || '').toLowerCase().includes(q)
    );
  }, [activeFilter, openTickets, myTickets, q]);

  const filteredEquipment = useMemo(() => {
    if (!q) return myEquipment;
    return myEquipment.filter(
      (eq) =>
        eq.maThietBi.toLowerCase().includes(q) ||
        eq.tenThietBi.toLowerCase().includes(q) ||
        eq.heThong.toLowerCase().includes(q) ||
        eq.viTri.toLowerCase().includes(q)
    );
  }, [myEquipment, q]);

  const filteredHistory = useMemo(() => {
    if (!q) return myHistory;
    return myHistory.filter(
      (h) =>
        h.maThietBi.toLowerCase().includes(q) ||
        h.tenThietBi.toLowerCase().includes(q) ||
        h.moTaCongViec.toLowerCase().includes(q)
    );
  }, [myHistory, q]);

  const handleQuickTicketStatus = (ticket: Ticket, nextStatus: TicketStatus) => {
    updateTicket({
      ...ticket,
      trangThai: nextStatus,
      ngayHoanThanh: nextStatus === 'Hoàn thành' ? '2026-11-10' : ticket.ngayHoanThanh,
      ketQua:
        nextStatus === 'Hoàn thành' && !ticket.ketQua
          ? `Đã hoàn thành xử lý bởi ${currentUser.tenNhanVien}`
          : ticket.ketQua,
    });
    showToast(`Đã cập nhật Ticket ${ticket.maTicket} → ${nextStatus}`);
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 shadow-2xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <ClipboardCheck className="w-3.5 h-3.5" />
              {UI_TEXTS.tabs.myTasks.badge}
            </span>
            <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-800/60">
              {currentUser.maNhanVien} • {currentUser.tenNhanVien} ({currentUser.chucVu})
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
            {UI_TEXTS.tabs.myTasks.title}
          </h2>
        </div>

        {/* Sub-filter switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start lg:self-auto text-xs">
          <button
            onClick={() => setActiveFilter('ACTION_NEEDED')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeFilter === 'ACTION_NEEDED'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cần Xử Lý ({urgentPlans.length + openTickets.length})
          </button>
          <button
            onClick={() => setActiveFilter('PLANS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeFilter === 'PLANS'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bảo Trì ({myPlans.length})
          </button>
          <button
            onClick={() => setActiveFilter('TICKETS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeFilter === 'TICKETS'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tickets ({myTickets.length})
          </button>
          <button
            onClick={() => setActiveFilter('EQUIPMENT')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeFilter === 'EQUIPMENT'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Thiết Bị ({myEquipment.length})
          </button>
          <button
            onClick={() => setActiveFilter('HISTORY')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeFilter === 'HISTORY'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đã Làm ({myHistory.length + completedTickets.length})
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveFilter('ACTION_NEEDED')}
          className="cursor-pointer p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 transition space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Việc Cần Làm Ngay</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-100">
            {urgentPlans.length + openTickets.length}
          </div>
          <div className="text-[11px] text-slate-400">
            {urgentPlans.length} bảo trì đến/quá hạn • {openTickets.length} ticket mở
          </div>
        </div>

        <div
          onClick={() => setActiveFilter('PLANS')}
          className="cursor-pointer p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Kế Hoạch Bảo Trì</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            {myPlans.length}
          </div>
          <div className="text-[11px] text-slate-400">
            {myPlans.filter((p) => p.trangThai === 'Quá hạn').length} quá hạn •{' '}
            {myPlans.filter((p) => p.trangThai === 'Đúng hạn').length} đúng hạn
          </div>
        </div>

        <div
          onClick={() => setActiveFilter('TICKETS')}
          className="cursor-pointer p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tickets Sự Cố Được Giao</span>
            <Tag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">
            {myTickets.length}
          </div>
          <div className="text-[11px] text-slate-400">
            {openTickets.length} đang mở • {completedTickets.length} hoàn thành
          </div>
        </div>

        <div
          onClick={() => setActiveFilter('HISTORY')}
          className="cursor-pointer p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Đã Hoàn Thành</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-cyan-400">
            {myHistory.length + completedTickets.length}
          </div>
          <div className="text-[11px] text-slate-400">
            {myHistory.length} bảo trì • {completedTickets.length} ticket
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm nhanh theo mã thiết bị, tên máy, mã ticket, nội dung công việc..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Tickets Section (shown in ACTION_NEEDED & TICKETS) */}
      {(activeFilter === 'ACTION_NEEDED' || activeFilter === 'TICKETS') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" />
              {activeFilter === 'ACTION_NEEDED'
                ? `Tickets Sự Cố Cần Xử Lý (${filteredTickets.length})`
                : `Tất Cả Tickets Được Giao (${filteredTickets.length})`}
            </h3>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 text-center text-xs text-slate-400">
              Không có ticket nào cần xử lý được giao cho bạn.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredTickets.map((t) => {
                const isDone = t.trangThai === 'Hoàn thành';
                return (
                  <div
                    key={t.maTicket}
                    className={`p-3.5 sm:p-4 rounded-xl border space-y-2.5 transition flex flex-col justify-between ${
                      isDone
                        ? 'bg-slate-900/60 border-slate-800 opacity-85'
                        : 'bg-slate-900 border-slate-800 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                            <span className="font-mono font-bold text-amber-400 tabular-nums">
                              {t.maTicket}
                            </span>
                            {t.maThietBi && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono font-bold text-cyan-400 tabular-nums">
                                  {t.maThietBi}
                                </span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-semibold ${
                                t.mucDoUuTien === 'Khẩn cấp'
                                  ? 'text-rose-400'
                                  : t.mucDoUuTien === 'Cao'
                                  ? 'text-amber-300'
                                  : 'text-slate-300'
                              }`}
                            >
                              {t.mucDoUuTien}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100 leading-snug">{t.tieuDe}</h4>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {t.trangThai}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {t.moTaChiTiet}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span className="font-mono tabular-nums">Tạo: {formatDateVN(t.ngayTao)}</span>
                        <span>
                          Giao:{' '}
                          <strong className="text-slate-200">{t.nguoiGiaoViec || t.nguoiLap}</strong>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEditTicket(t)}
                          className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition whitespace-nowrap"
                        >
                          <Edit className="w-3.5 h-3.5 text-cyan-400" />
                          Cập Nhật / Ảnh
                        </button>

                        {!isDone && (
                          <>
                            {t.trangThai !== 'Đang thực hiện' && (
                              <button
                                type="button"
                                onClick={() => handleQuickTicketStatus(t, 'Đang thực hiện')}
                                className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/35 text-amber-300 border border-amber-500/40 text-xs font-semibold transition whitespace-nowrap"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                Bắt Đầu
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleQuickTicketStatus(t, 'Hoàn thành')}
                              className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition ml-auto whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Hoàn Thành
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Maintenance Plans Section (shown in ACTION_NEEDED & PLANS) */}
      {(activeFilter === 'ACTION_NEEDED' || activeFilter === 'PLANS') && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            {activeFilter === 'ACTION_NEEDED'
              ? `Kế Hoạch Bảo Trì Cần Thực Hiện (${filteredPlans.length})`
              : `Tất Cả Kế Hoạch Bảo Trì Được Giao (${filteredPlans.length})`}
          </h3>

          {filteredPlans.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 text-center text-xs text-slate-400">
              Không có kế hoạch bảo trì nào phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {filteredPlans.map((plan) => {
                const eq = equipment.find((e) => e.maThietBi === plan.maThietBi);
                return (
                  <div
                    key={plan.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                            <span className="font-mono font-bold text-cyan-400 tabular-nums">
                              {plan.maThietBi}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{plan.tanSuat}</span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{plan.loaiBaoTri}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100 leading-snug">
                            {plan.tenThietBi}
                          </h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                            plan.trangThai === 'Quá hạn'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : plan.trangThai === 'Tới hạn'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : plan.trangThai === 'Sắp tới'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {plan.trangThai}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <span>Hạn kế tiếp:</span>
                          <strong className="font-mono tabular-nums text-slate-100">
                            {formatDateVN(plan.ngayBaoTriTiepTheo)}
                          </strong>
                        </div>
                        {eq && (
                          <div className="flex items-center justify-between gap-2">
                            <span>Vị trí:</span>
                            <strong className="text-slate-300 truncate">{eq.viTri}</strong>
                          </div>
                        )}
                        {plan.nguoiGiaoViec && (
                          <div className="flex items-center justify-between gap-2">
                            <span>Người giao:</span>
                            <strong className="text-indigo-300">{plan.nguoiGiaoViec}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      {eq && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenMaintenanceModal(eq)}
                            className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition whitespace-nowrap"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            Thực Hiện Bảo Trì
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenQR(eq)}
                            className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition"
                            title="Xem mã QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Equipment Section */}
      {activeFilter === 'EQUIPMENT' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            Thiết Bị Phụ Trách Chính ({filteredEquipment.length})
          </h3>
          {filteredEquipment.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 text-center text-xs text-slate-400">
              Bạn chưa được gán phụ trách trực tiếp thiết bị nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {filteredEquipment.map((eq) => (
                <div
                  key={eq.maThietBi}
                  className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="font-mono font-bold text-cyan-400 tabular-nums">
                          {eq.maThietBi}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{eq.tanSuat}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100 leading-snug">{eq.tenThietBi}</h4>
                      <div className="text-[11px] text-slate-400 truncate">
                        {eq.heThong} · {eq.viTri}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => onOpenMaintenanceModal(eq)}
                      className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition whitespace-nowrap"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Bảo Trì
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenTicketFromEquipment(eq)}
                      className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/35 text-amber-300 border border-amber-500/40 text-xs font-bold transition whitespace-nowrap"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      Báo Sự Cố
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenQR(eq)}
                      className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700"
                      title="Xem mã QR"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History / Completed Section */}
      {activeFilter === 'HISTORY' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            Công Việc Đã Thực Hiện ({filteredHistory.length} bảo trì · {completedTickets.length} ticket)
          </h3>

          <div className="space-y-2.5">
            {filteredHistory.map((h) => (
              <div
                key={h.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400">
                    <span className="font-mono font-bold text-cyan-400 tabular-nums">{h.maThietBi}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{formatDateVN(h.ngayThucHien)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-amber-400">Dừng {h.thoiGianDungMay}p</span>
                  </div>
                  <div className="font-bold text-sm text-slate-100 leading-snug">{h.tenThietBi}</div>
                  <p className="text-slate-300 line-clamp-2">{h.moTaCongViec}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <User className="w-3 h-3 shrink-0" />
                    <span>{h.nguoiThucHien}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-center shrink-0">
                  {h.ketQua}
                </span>
              </div>
            ))}

            {completedTickets.map((t) => (
              <div
                key={t.maTicket}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400">
                    <span className="font-mono font-bold text-amber-400 tabular-nums">{t.maTicket}</span>
                    {t.ngayHoanThanh && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">Xong {formatDateVN(t.ngayHoanThanh)}</span>
                      </>
                    )}
                  </div>
                  <div className="font-bold text-sm text-slate-100 leading-snug">{t.tieuDe}</div>
                  {t.ketQua && <p className="text-slate-300 line-clamp-2">Kết quả: {t.ketQua}</p>}
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-center shrink-0">
                  Ticket Hoàn Thành
                </span>
              </div>
            ))}

            {filteredHistory.length === 0 && completedTickets.length === 0 && (
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 text-center text-xs text-slate-400">
                Chưa có công việc hoàn thành nào được ghi nhận cho tài khoản này.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
