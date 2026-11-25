import React, { useMemo, useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import {
  InspectionCategory,
  InspectionCycle,
  InspectionHistoryEntry,
  SafetyInspectionItem,
} from '../../types/cmms';
import {
  calculateNextInspectionDate,
  formatDateVN,
  getInspectionDaysRemaining,
  getInspectionStatus,
  getTodayISODate,
} from '../../utils/cmmsLogic';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  ShieldAlert,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Plus,
  Search,
  Download,
  Mail,
  Edit2,
  Trash2,
  History,
  X,
  AlertTriangle,
  Award,
  MapPin,
  User,
} from 'lucide-react';

const APP_TODAY = getTodayISODate();

const INSPECTION_CATEGORIES: InspectionCategory[] = [
  'Kiểm định an toàn',
  'Hiệu chuẩn đo lường',
  'Kiểm tra PCCC / Môi trường',
];

const INSPECTION_CYCLES: InspectionCycle[] = [
  '3 tháng',
  '6 tháng',
  '12 tháng',
  '24 tháng',
  '36 tháng',
];

export const SafetyInspectionTab: React.FC = () => {
  const {
    safetyInspections,
    equipment,
    employees,
    emailConfig,
    updateEmailConfig,
    addSafetyInspection,
    updateSafetyInspection,
    deleteSafetyInspection,
    completeSafetyInspection,
    triggerInspectionDueAlerts,
  } = useCMMS();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [confirmSendAlert, setConfirmSendAlert] = useState(false);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SafetyInspectionItem | null>(null);
  const [renewItem, setRenewItem] = useState<SafetyInspectionItem | null>(null);
  const [historyItem, setHistoryItem] = useState<SafetyInspectionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<SafetyInspectionItem | null>(null);

  // Add/Edit form fields
  const [maHoSo, setMaHoSo] = useState('');
  const [maThietBi, setMaThietBi] = useState('');
  const [tenThietBi, setTenThietBi] = useState('');
  const [phanLoai, setPhanLoai] = useState<InspectionCategory>('Kiểm định an toàn');
  const [viTri, setViTri] = useState('');
  const [soTemGiayChungNhan, setSoTemGiayChungNhan] = useState('');
  const [donViKiemDinh, setDonViKiemDinh] = useState('');
  const [chuKy, setChuKy] = useState<InspectionCycle>('12 tháng');
  const [ngayKiemDinhGanNhat, setNgayKiemDinhGanNhat] = useState(APP_TODAY);
  const [ngayHetHan, setNgayHetHan] = useState(calculateNextInspectionDate(APP_TODAY, '12 tháng'));
  const [nhacTruocNgay, setNhacTruocNgay] = useState(30);
  const [nguoiPhuTrach, setNguoiPhuTrach] = useState('');
  const [emailCanhBao, setEmailCanhBao] = useState('');
  const [inProgressFlag, setInProgressFlag] = useState(false);
  const [ghiChu, setGhiChu] = useState('');

  // Renew / Complete inspection form fields
  const [renewDate, setRenewDate] = useState(APP_TODAY);
  const [renewUnit, setRenewUnit] = useState('');
  const [renewCert, setRenewCert] = useState('');
  const [renewResult, setRenewResult] = useState<InspectionHistoryEntry['ketQua']>('Đạt');
  const [renewNote, setRenewNote] = useState('');

  const showToast = (msg: string, kind: 'success' | 'warning' = 'success') => {
    setToastType(kind);
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Enrich with real-time status & days remaining
  const enrichedItems = useMemo(() => {
    return safetyInspections.map((item) => {
      const daysLeft = getInspectionDaysRemaining(item.ngayHetHan, APP_TODAY);
      const liveStatus = getInspectionStatus(
        item.ngayHetHan,
        item.nhacTruocNgay ?? 30,
        item.trangThai === 'Đang kiểm định',
        APP_TODAY
      );
      return { ...item, liveStatus, daysLeft };
    });
  }, [safetyInspections]);

  const stats = useMemo(() => {
    const overdue = enrichedItems.filter((i) => i.liveStatus === 'Quá hạn');
    const dueSoon = enrichedItems.filter((i) => i.liveStatus === 'Sắp đến hạn');
    const valid = enrichedItems.filter((i) => i.liveStatus === 'Còn hạn');
    const inProgress = enrichedItems.filter((i) => i.liveStatus === 'Đang kiểm định');
    const reminders = [...overdue, ...dueSoon].sort((a, b) => a.daysLeft - b.daysLeft);
    return { overdue, dueSoon, valid, inProgress, reminders };
  }, [enrichedItems]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return enrichedItems
      .filter((item) => {
        const matchSearch =
          !q ||
          item.maHoSo.toLowerCase().includes(q) ||
          (item.maThietBi || '').toLowerCase().includes(q) ||
          item.tenThietBi.toLowerCase().includes(q) ||
          item.soTemGiayChungNhan.toLowerCase().includes(q) ||
          item.donViKiemDinh.toLowerCase().includes(q) ||
          item.nguoiPhuTrach.toLowerCase().includes(q);
        const matchCat = categoryFilter === 'ALL' || item.phanLoai === categoryFilter;
        const matchStatus = statusFilter === 'ALL' || item.liveStatus === statusFilter;
        return matchSearch && matchCat && matchStatus;
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [enrichedItems, searchTerm, categoryFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    const nextCode = `KD-${new Date().getFullYear()}-${String(safetyInspections.length + 1).padStart(3, '0')}`;
    setMaHoSo(nextCode);
    setMaThietBi('');
    setTenThietBi('');
    setPhanLoai('Kiểm định an toàn');
    setViTri('');
    setSoTemGiayChungNhan('');
    setDonViKiemDinh('Trung tâm Kiểm định Kỹ thuật An toàn Khu vực II');
    setChuKy('12 tháng');
    setNgayKiemDinhGanNhat(APP_TODAY);
    setNgayHetHan(calculateNextInspectionDate(APP_TODAY, '12 tháng'));
    setNhacTruocNgay(30);
    setNguoiPhuTrach(employees[0]?.tenNhanVien || 'Khiêm Huỳnh');
    setEmailCanhBao(employees[0]?.email || emailConfig.primaryRecipient);
    setInProgressFlag(false);
    setGhiChu('');
    setIsFormOpen(true);
  };

  const openEditModal = (item: SafetyInspectionItem) => {
    setEditingItem(item);
    setMaHoSo(item.maHoSo);
    setMaThietBi(item.maThietBi || '');
    setTenThietBi(item.tenThietBi);
    setPhanLoai(item.phanLoai);
    setViTri(item.viTri);
    setSoTemGiayChungNhan(item.soTemGiayChungNhan);
    setDonViKiemDinh(item.donViKiemDinh);
    setChuKy(item.chuKy);
    setNgayKiemDinhGanNhat(item.ngayKiemDinhGanNhat);
    setNgayHetHan(item.ngayHetHan);
    setNhacTruocNgay(item.nhacTruocNgay ?? 30);
    setNguoiPhuTrach(item.nguoiPhuTrach);
    setEmailCanhBao(item.emailCanhBao || '');
    setInProgressFlag(item.trangThai === 'Đang kiểm định');
    setGhiChu(item.ghiChu || '');
    setIsFormOpen(true);
  };

  const handleSelectEquipmentCode = (code: string) => {
    setMaThietBi(code);
    const found = equipment.find((e) => e.maThietBi === code);
    if (found) {
      if (!tenThietBi.trim()) setTenThietBi(found.tenThietBi);
      if (!viTri.trim()) setViTri(found.viTri);
      if (found.nguoiPhuTrach) setNguoiPhuTrach(found.nguoiPhuTrach);
      if (found.email) setEmailCanhBao(found.email);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maHoSo.trim() || !tenThietBi.trim() || !ngayHetHan) return;

    if (editingItem) {
      updateSafetyInspection({
        ...editingItem,
        maHoSo: maHoSo.trim(),
        maThietBi: maThietBi.trim() || undefined,
        tenThietBi: tenThietBi.trim(),
        phanLoai,
        viTri: viTri.trim() || 'Nhà máy',
        soTemGiayChungNhan: soTemGiayChungNhan.trim(),
        donViKiemDinh: donViKiemDinh.trim(),
        chuKy,
        ngayKiemDinhGanNhat,
        ngayHetHan,
        nhacTruocNgay: Math.max(1, Number(nhacTruocNgay) || 30),
        nguoiPhuTrach: nguoiPhuTrach.trim(),
        emailCanhBao: emailCanhBao.trim() || undefined,
        trangThai: inProgressFlag ? 'Đang kiểm định' : editingItem.trangThai,
        ghiChu: ghiChu.trim() || undefined,
      });
      showToast(`Đã cập nhật hồ sơ kiểm định ${maHoSo.trim()}`);
    } else {
      addSafetyInspection({
        maHoSo: maHoSo.trim(),
        maThietBi: maThietBi.trim() || undefined,
        tenThietBi: tenThietBi.trim(),
        phanLoai,
        viTri: viTri.trim() || 'Nhà máy',
        soTemGiayChungNhan: soTemGiayChungNhan.trim() || 'Đang cấp mới',
        donViKiemDinh: donViKiemDinh.trim(),
        chuKy,
        ngayKiemDinhGanNhat,
        ngayHetHan,
        nhacTruocNgay: Math.max(1, Number(nhacTruocNgay) || 30),
        nguoiPhuTrach: nguoiPhuTrach.trim(),
        emailCanhBao: emailCanhBao.trim() || undefined,
        ghiChu: ghiChu.trim() || undefined,
        lichSu: [],
      });
      showToast(`Đã thêm mới hồ sơ kiểm định ${maHoSo.trim()}`);
    }
    setIsFormOpen(false);
  };

  const openRenewModal = (item: SafetyInspectionItem) => {
    setRenewItem(item);
    setRenewDate(APP_TODAY);
    setRenewUnit(item.donViKiemDinh);
    setRenewCert('');
    setRenewResult('Đạt');
    setRenewNote('');
  };

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewItem) return;
    completeSafetyInspection({
      id: renewItem.id,
      ngayThucHien: renewDate,
      donViThucHien: renewUnit.trim() || renewItem.donViKiemDinh,
      soTemChungNhan: renewCert.trim() || renewItem.soTemGiayChungNhan,
      ketQua: renewResult,
      ghiChu: renewNote.trim() || undefined,
    });
    const nextDate =
      renewResult === 'Đạt'
        ? calculateNextInspectionDate(renewDate, renewItem.chuKy)
        : renewItem.ngayHetHan;
    showToast(
      `Đã ghi nhận ${renewItem.phanLoai} (${renewResult}) cho ${renewItem.tenThietBi}. Hạn mới: ${formatDateVN(nextDate)}`
    );
    setRenewItem(null);
  };

  const executeSendAlertNow = async () => {
    setConfirmSendAlert(false);
    setIsSendingAlert(true);
    const res = await triggerInspectionDueAlerts(false, { userConfirmed: true });
    setIsSendingAlert(false);
    if (res.dueCount > 0) {
      if (res.result?.success) {
        showToast(
          `Đã tự động gửi email nhắc lịch kiểm định cho ${res.dueCount} thiết bị đến hạn / quá hạn!`,
          'success'
        );
      } else {
        showToast(
          res.result?.message || 'Chưa kết nối Gmail hoặc Webhook gửi email tự động.',
          'warning'
        );
      }
    } else {
      showToast('Hiện tại không có thiết bị nào quá hạn hoặc sắp đến hạn kiểm định.', 'success');
    }
  };

  const handleSendAlertNow = () => {
    if (stats.reminders.length === 0) {
      showToast('Hiện tại không có thiết bị nào quá hạn hoặc sắp đến hạn kiểm định.', 'success');
      return;
    }
    setConfirmSendAlert(true);
  };

  const handleExportCSV = () => {
    const headers = [
      'Mã hồ sơ',
      'Mã thiết bị',
      'Tên thiết bị',
      'Phân loại',
      'Vị trí',
      'Số tem / Chứng nhận',
      'Đơn vị kiểm định',
      'Chu kỳ',
      'Ngày gần nhất',
      'Ngày hết hạn',
      'Nhắc trước (ngày)',
      'Người phụ trách',
      'Trạng thái',
    ];
    const rows = filteredItems.map((item) => [
      `"${item.maHoSo}"`,
      `"${item.maThietBi || ''}"`,
      `"${item.tenThietBi}"`,
      `"${item.phanLoai}"`,
      `"${item.viTri}"`,
      `"${item.soTemGiayChungNhan}"`,
      `"${item.donViKiemDinh}"`,
      `"${item.chuKy}"`,
      `"${item.ngayKiemDinhGanNhat}"`,
      `"${item.ngayHetHan}"`,
      `"${item.nhacTruocNgay}"`,
      `"${item.nguoiPhuTrach}"`,
      `"${item.liveStatus}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kiem_dinh_hieu_chuan_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const autoReminderEnabled = emailConfig.notifyOnInspectionDue !== false;

  const renderDaysBadge = (daysLeft: number, status: string) => {
    if (status === 'Đang kiểm định') {
      return (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 whitespace-nowrap">
          Đang kiểm định
        </span>
      );
    }
    if (daysLeft < 0) {
      return (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 whitespace-nowrap tabular-nums">
          Quá hạn {Math.abs(daysLeft)} ngày
        </span>
      );
    }
    if (daysLeft === 0) {
      return (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap">
          Đến hạn hôm nay
        </span>
      );
    }
    if (status === 'Sắp đến hạn') {
      return (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap tabular-nums">
          Còn {daysLeft} ngày
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap tabular-nums">
        Còn {daysLeft} ngày
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl text-xs font-semibold max-w-md ${
            toastType === 'warning'
              ? 'bg-amber-950/95 border-amber-500/40 text-amber-100'
              : 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {toastType === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block">
            {UI_TEXTS.tabs.inspectionCalibration.badge}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
            {UI_TEXTS.tabs.inspectionCalibration.title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={autoReminderEnabled}
              onChange={(e) =>
                updateEmailConfig({ notifyOnInspectionDue: e.target.checked })
              }
              className="rounded text-amber-500 focus:ring-0"
            />
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            <span>Nhắc lịch tự động</span>
          </label>

          <button
            type="button"
            disabled={isSendingAlert}
            onClick={handleSendAlertNow}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/35 text-amber-300 border border-amber-500/40 text-xs font-bold transition whitespace-nowrap"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{isSendingAlert ? 'Đang gửi...' : 'Gửi Email Nhắc Lịch'}</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Hồ Sơ Kiểm Định</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Tổng Hồ Sơ Quản Lý</div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono tabular-nums mt-1">
              {enrichedItems.length}
            </div>
          </div>
          <Award className="w-6 h-6 text-cyan-400/80 shrink-0" />
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Quá Hạn Kiểm Định</div>
            <div className="text-2xl font-extrabold text-rose-400 font-mono tabular-nums mt-1">
              {stats.overdue.length}
            </div>
          </div>
          <AlertTriangle className="w-6 h-6 text-rose-400/80 shrink-0" />
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Sắp Đến Hạn (Nhắc Lịch)</div>
            <div className="text-2xl font-extrabold text-amber-400 font-mono tabular-nums mt-1">
              {stats.dueSoon.length}
            </div>
          </div>
          <CalendarClock className="w-6 h-6 text-amber-400/80 shrink-0" />
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Còn Hiệu Lực</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums mt-1">
              {stats.valid.length}
            </div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400/80 shrink-0" />
        </div>
      </div>

      {/* Automatic Reminder Strip */}
      {stats.reminders.length > 0 && (
        <div className="rounded-2xl bg-slate-900 border border-amber-500/35 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <BellRing className="w-4 h-4 shrink-0" />
              <span>
                Nhắc Lịch Tự Động Ngày Đến Hạn Kiểm Định / Hiệu Chuẩn ({stats.reminders.length} thiết bị cần xử lý)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Mốc kiểm tra: {formatDateVN(APP_TODAY)} · Email: {autoReminderEnabled ? 'Bật tự động' : 'Thủ công'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {stats.reminders.slice(0, 6).map((item) => (
              <div
                key={`rem-${item.id}`}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                  item.liveStatus === 'Quá hạn'
                    ? 'bg-rose-950/30 border-rose-500/30'
                    : 'bg-amber-950/25 border-amber-500/30'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="font-mono font-bold text-cyan-400">{item.maHoSo}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{item.phanLoai}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-100 truncate">{item.tenThietBi}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Hạn: {formatDateVN(item.ngayHetHan)} · {item.nguoiPhuTrach}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {renderDaysBadge(item.daysLeft, item.liveStatus)}
                  <button
                    type="button"
                    onClick={() => openRenewModal(item)}
                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition whitespace-nowrap"
                  >
                    Gia Hạn
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Export Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã hồ sơ, mã máy, tên thiết bị, số tem, đơn vị kiểm định..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">Tất cả phân loại</option>
            {INSPECTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Quá hạn">Quá hạn</option>
            <option value="Sắp đến hạn">Sắp đến hạn</option>
            <option value="Còn hạn">Còn hạn</option>
            <option value="Đang kiểm định">Đang kiểm định</option>
          </select>
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

      {/* Mobile Compact Cards */}
      <div className="md:hidden space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
            Không có hồ sơ kiểm định / hiệu chuẩn phù hợp bộ lọc.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={`ins-card-${item.id}`}
              className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                    <span className="font-mono font-bold text-cyan-400">{item.maHoSo}</span>
                    {item.maThietBi && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-300">{item.maThietBi}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{item.phanLoai}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 leading-snug mt-0.5">
                    {item.tenThietBi}
                  </h4>
                </div>
                {renderDaysBadge(item.daysLeft, item.liveStatus)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-500">Hết hạn: </span>
                  <strong className="font-mono tabular-nums text-slate-100">
                    {formatDateVN(item.ngayHetHan)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Chu kỳ: </span>
                  <strong className="text-slate-200">{item.chuKy}</strong>
                </div>
                <div className="col-span-2 truncate">
                  <span className="text-slate-500">Tem/CN: </span>
                  <span className="font-mono text-slate-300">{item.soTemGiayChungNhan}</span>
                  <span className="text-slate-500"> · {item.donViKiemDinh}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2 text-slate-300 truncate">
                  <User className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>{item.nguoiPhuTrach}</span>
                  <span aria-hidden="true">·</span>
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{item.viTri}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => openRenewModal(item)}
                  className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Hoàn Tất / Gia Hạn
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryItem(item)}
                  className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition"
                  title="Lịch sử kiểm định"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingItem(item)}
                  className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                  title="Xóa hồ sơ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <SmartHorizontalScroll>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 whitespace-nowrap">Mã Hồ Sơ</th>
                <th className="py-3 px-4 min-w-[200px]">Thiết Bị / Đối Tượng</th>
                <th className="py-3 px-4 whitespace-nowrap">Phân Loại</th>
                <th className="py-3 px-4 min-w-[170px]">Tem / Đơn Vị Thực Hiện</th>
                <th className="py-3 px-4 whitespace-nowrap">Chu Kỳ</th>
                <th className="py-3 px-4 whitespace-nowrap">Ngày Hết Hạn</th>
                <th className="py-3 px-4 whitespace-nowrap">Nhắc Trước</th>
                <th className="py-3 px-4 whitespace-nowrap">Phụ Trách</th>
                <th className="py-3 px-4 whitespace-nowrap">Trạng Thái</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap align-top">
                    {item.maHoSo}
                    {item.maThietBi && (
                      <span className="block text-[10px] text-slate-400 font-normal">
                        TB: {item.maThietBi}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 align-top">
                    <div className="font-semibold text-slate-100">{item.tenThietBi}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.viTri}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap align-top text-slate-300">
                    {item.phanLoai}
                  </td>
                  <td className="py-3 px-4 align-top">
                    <div className="font-mono text-slate-200">{item.soTemGiayChungNhan}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {item.donViKiemDinh}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap align-top font-mono">
                    {item.chuKy}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap align-top">
                    <div className="font-mono font-bold text-slate-100 tabular-nums">
                      {formatDateVN(item.ngayHetHan)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                      Gần nhất: {formatDateVN(item.ngayKiemDinhGanNhat)}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap align-top font-mono tabular-nums text-slate-300">
                    {item.nhacTruocNgay} ngày
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap align-top text-slate-200">
                    {item.nguoiPhuTrach}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap align-top">
                    {renderDaysBadge(item.daysLeft, item.liveStatus)}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap align-top">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openRenewModal(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                        title="Ghi nhận hoàn tất & Gia hạn chu kỳ mới"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Gia Hạn
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistoryItem(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition"
                        title="Xem lịch sử kiểm định"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Không tìm thấy hồ sơ kiểm định / hiệu chuẩn nào phù hợp bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </SmartHorizontalScroll>
      </div>

      {/* MODAL 1: Add / Edit Inspection Item */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/70">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {editingItem ? 'Cập Nhật Hồ Sơ Kiểm Định / Hiệu Chuẩn' : 'Thêm Hồ Sơ Kiểm Định / Hiệu Chuẩn'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Mã Hồ Sơ *</label>
                  <input
                    type="text"
                    required
                    value={maHoSo}
                    onChange={(e) => setMaHoSo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Liên Kết Mã Thiết Bị (Tùy chọn)
                  </label>
                  <select
                    value={maThietBi}
                    onChange={(e) => handleSelectEquipmentCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    <option value="">-- Thiết bị rời / Không liên kết --</option>
                    {equipment.map((eq) => (
                      <option key={eq.maThietBi} value={eq.maThietBi}>
                        {eq.maThietBi} - {eq.tenThietBi}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Tên Thiết Bị / Đối Tượng *</label>
                  <input
                    type="text"
                    required
                    value={tenThietBi}
                    onChange={(e) => setTenThietBi(e.target.value)}
                    placeholder="VD: Bồn chứa khí nén 2000L & Van an toàn"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Phân Loại *</label>
                  <select
                    value={phanLoai}
                    onChange={(e) => setPhanLoai(e.target.value as InspectionCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {INSPECTION_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Vị Trí Lắp Đặt</label>
                  <input
                    type="text"
                    value={viTri}
                    onChange={(e) => setViTri(e.target.value)}
                    placeholder="VD: Utility House"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Số serial</label>
                  <input
                    type="text"
                    value={soTemGiayChungNhan}
                    onChange={(e) => setSoTemGiayChungNhan(e.target.value)}
                    placeholder="VD: KD2-2611-0842"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Đơn Vị Kiểm Định / Hiệu Chuẩn</label>
                  <input
                    type="text"
                    value={donViKiemDinh}
                    onChange={(e) => setDonViKiemDinh(e.target.value)}
                    placeholder="QUATEST 3 / Kiểm định II..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Chu Kỳ *</label>
                  <select
                    value={chuKy}
                    onChange={(e) => {
                      const nextCycle = e.target.value as InspectionCycle;
                      setChuKy(nextCycle);
                      if (ngayKiemDinhGanNhat) {
                        setNgayHetHan(calculateNextInspectionDate(ngayKiemDinhGanNhat, nextCycle));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {INSPECTION_CYCLES.map((cy) => (
                      <option key={cy} value={cy}>
                        {cy}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Ngày Gần Nhất *</label>
                  <input
                    type="date"
                    required
                    value={ngayKiemDinhGanNhat}
                    onChange={(e) => {
                      setNgayKiemDinhGanNhat(e.target.value);
                      setNgayHetHan(calculateNextInspectionDate(e.target.value, chuKy));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Ngày Hết Hạn *</label>
                  <input
                    type="date"
                    required
                    value={ngayHetHan}
                    onChange={(e) => setNgayHetHan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Nhắc Trước (Ngày)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={nhacTruocNgay}
                    onChange={(e) => setNhacTruocNgay(Number(e.target.value) || 30)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Người Phụ Trách *</label>
                  <select
                    value={nguoiPhuTrach}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNguoiPhuTrach(val);
                      const emp = employees.find((em) => em.tenNhanVien === val);
                      if (emp?.email) setEmailCanhBao(emp.email);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {employees.map((emp) => (
                      <option key={emp.maNhanVien} value={emp.tenNhanVien}>
                        {emp.tenNhanVien} ({emp.chucVu})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Email Nhận Nhắc Lịch</label>
                  <input
                    type="email"
                    value={emailCanhBao}
                    onChange={(e) => setEmailCanhBao(e.target.value)}
                    placeholder="email@factory.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              {editingItem && (
                <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inProgressFlag}
                    onChange={(e) => setInProgressFlag(e.target.checked)}
                    className="rounded text-blue-500 focus:ring-0"
                  />
                  <span>Đang gửi thiết bị đi kiểm định / hiệu chuẩn bên ngoài</span>
                </label>
              )}

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Ghi Chú Kỹ Thuật</label>
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
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow"
                >
                  {editingItem ? 'Lưu Thay Đổi' : 'Thêm Hồ Sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Complete / Renew Inspection */}
      {renewItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/70">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Ghi Nhận Hoàn Tất Kiểm Định / Gia Hạn
                </h3>
                <p className="text-xs text-cyan-400 font-mono mt-0.5">
                  {renewItem.maHoSo} · {renewItem.tenThietBi}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRenewItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Ngày Thực Hiện *</label>
                  <input
                    type="date"
                    required
                    value={renewDate}
                    onChange={(e) => setRenewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Kết Quả *</label>
                  <select
                    value={renewResult}
                    onChange={(e) =>
                      setRenewResult(e.target.value as InspectionHistoryEntry['ketQua'])
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    <option value="Đạt">Đạt (Tự động gia hạn +{renewItem.chuKy})</option>
                    <option value="Cần hiệu chỉnh">Cần hiệu chỉnh</option>
                    <option value="Không đạt">Không đạt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Số Tem / Giấy Chứng Nhận Mới *
                </label>
                <input
                  type="text"
                  required
                  value={renewCert}
                  onChange={(e) => setRenewCert(e.target.value)}
                  placeholder="VD: KD2-2611-2099"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Đơn Vị Thực Hiện</label>
                <input
                  type="text"
                  value={renewUnit}
                  onChange={(e) => setRenewUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Ghi Chú Biên Bản</label>
                <textarea
                  rows={2}
                  value={renewNote}
                  onChange={(e) => setRenewNote(e.target.value)}
                  placeholder="Thông số đo, sai số hiệu chuẩn hoặc kiến nghị..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
                />
              </div>

              {renewResult === 'Đạt' && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                  Hạn kiểm định tiếp theo sẽ tự động cập nhật sang:{' '}
                  <strong className="font-mono">
                    {formatDateVN(calculateNextInspectionDate(renewDate, renewItem.chuKy))}
                  </strong>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRenewItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow"
                >
                  Lưu & Cập Nhật Hạn Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Inspection History */}
      {historyItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/70">
              <div>
                <h3 className="text-base font-bold text-slate-100">Lịch Sử Kiểm Định / Hiệu Chuẩn</h3>
                <p className="text-xs text-cyan-400 mt-0.5">
                  {historyItem.maHoSo} · {historyItem.tenThietBi}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto text-xs">
              {(!historyItem.lichSu || historyItem.lichSu.length === 0) ? (
                <div className="text-center py-6 text-slate-400">
                  Chưa có lần gia hạn nào được ghi nhận trên hệ thống (Đang dùng chứng nhận gốc:{' '}
                  <strong className="font-mono text-slate-200">{historyItem.soTemGiayChungNhan}</strong>{' '}
                  ngày {formatDateVN(historyItem.ngayKiemDinhGanNhat)}).
                </div>
              ) : (
                historyItem.lichSu.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-400">
                        {formatDateVN(h.ngayThucHien)} · Tem: {h.soTemChungNhan}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          h.ketQua === 'Đạt'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {h.ketQua}
                      </span>
                    </div>
                    <div className="text-slate-300">{h.donViThucHien}</div>
                    {h.ghiChu && <div className="text-slate-400">{h.ghiChu}</div>}
                    <div className="text-[11px] text-slate-500">Cập nhật bởi: {h.nguoiCapNhat}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Confirm Delete */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Xác Nhận Xóa Hồ Sơ</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa hồ sơ kiểm định{' '}
              <strong className="text-cyan-400 font-mono">{deletingItem.maHoSo}</strong> (
              <strong className="text-white">{deletingItem.tenThietBi}</strong>)?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSafetyInspection(deletingItem.id);
                  showToast(`Đã xóa hồ sơ ${deletingItem.maHoSo}`);
                  setDeletingItem(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Xóa Hồ Sơ
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 5: Confirm Send Inspection Alert Email */}
      {confirmSendAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Xác Nhận Gửi Email Nhắc Kiểm Định</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hệ thống sẽ gửi email nhắc lịch cho{' '}
              <strong className="text-amber-300">{stats.reminders.length} hồ sơ kiểm định</strong>{' '}
              đang quá hạn hoặc sắp đến hạn tới người phụ trách và quản lý.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSendAlert(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void executeSendAlertNow()}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
              >
                Xác Nhận Gửi Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
