import React, { useMemo, useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import {
  DailyAreaCheck,
  DailyAreaCheckResult,
  DailyAreaCheckShift,
  DailyAreaCheckStatus,
  DailyInspectionArea,
} from '../../types/cmms';
import {
  canDeleteRecords,
  canManageMaintenancePlans,
  formatDateVN,
  matchesAssignee,
} from '../../utils/cmmsLogic';
import { resolveImageUrl } from '../../utils/imageUtils';
import { MultiAssigneePicker } from '../common/MultiAssigneePicker';
import { CameraCaptureInput } from '../common/CameraCaptureInput';
import {
  Sunrise,
  ShieldCheck,
  Building2,
  Trees,
  Gauge,
  Plus,
  Edit3,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Users,
  Search,
  Calendar,
  ClipboardEdit,
  X,
  Sparkles,
  Camera,
  Send,
} from 'lucide-react';

const AREAS: DailyInspectionArea[] = ['Vòng trong', 'Vòng Ngoài', 'Phòng Utility'];
const SHIFTS: DailyAreaCheckShift[] = ['Ca Sáng', 'Ca Chiều', 'Ca Đêm'];
const STATUS_OPTIONS: DailyAreaCheckStatus[] = ['Chờ kiểm tra', 'Đang kiểm tra', 'Đã hoàn thành'];
const RESULT_OPTIONS: DailyAreaCheckResult[] = [
  'Chưa đánh giá',
  'Bình thường',
  'Cần theo dõi',
  'Có sự cố',
];

const AREA_META: Record<
  DailyInspectionArea,
  {
    subtitle: string;
    defaultTitle: string;
    defaultDescription: string;
    icon: React.FC<{ className?: string }>;
    badgeClass: string;
    accentBorder: string;
    iconBg: string;
  }
> = {
  'Vòng trong': {
    subtitle: 'Xưởng sản xuất · Kho · Văn phòng · AHU/FCU · Lối thoát hiểm',
    defaultTitle: 'Kiểm tra đầu ngày khu vực sản xuất & văn phòng (Vòng trong)',
    defaultDescription:
      '1. Kiểm tra nhiệt độ & độ ẩm khu vực xưởng sản xuất, kho nguyên liệu và phòng sạch qua màn hình AHU/BMS.\n2. Kiểm tra áp suất chênh áp phòng Coating, phòng IQC và trạng thái hoạt động quạt hút/quạt cấp.\n3. Kiểm tra chiếu sáng nhà xưởng, văn phòng tầng 1–2, đèn Exit & cửa thoát hiểm không bị che chắn.\n4. Kiểm tra rò rỉ nước/dầu sàn nhà xưởng, khu vực FCU và nhà vệ sinh sản xuất.',
    icon: Building2,
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    accentBorder: 'border-cyan-500/30',
    iconBg: 'bg-cyan-500/15 text-cyan-400',
  },
  'Vòng Ngoài': {
    subtitle: 'Khuôn viên ngoài · Trạm bơm · Xử lý nước thải · Nhà bảo vệ · Kho hóa chất',
    defaultTitle: 'Kiểm tra đầu ngày khuôn viên ngoài xưởng & trạm phụ (Vòng Ngoài)',
    defaultDescription:
      '1. Kiểm tra hệ thống bơm nước sinh hoạt (WAT-DBV-01/02), mực nước bể ngầm 200m³ và rò rỉ đường ống cấp thoát nước ngoài trời.\n2. Kiểm tra khu vực trạm xử lý nước thải, đầu ra nước thải DI và hệ thống cống rãnh xung quanh nhà máy.\n3. Kiểm tra tủ điện chiếu sáng ngoài trời, hàng rào an toàn, cổng bảo vệ 1 & 2, hệ thống điều hòa nhà bảo vệ.\n4. Kiểm tra khu vực kho hóa chất, mái che, bảng cảnh báo an toàn & bình chữa cháy vòng ngoài.',
    icon: Trees,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    accentBorder: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
  },
  'Phòng Utility': {
    subtitle: 'Chiller · Cooling Tower · Máy nén khí · Tủ điện MSB · Hệ nước DI',
    defaultTitle: 'Kiểm tra đầu ngày hệ thống trung tâm Phòng Utility',
    defaultDescription:
      '1. Kiểm tra thông số vận hành Chiller 01, Chiller 02, Mini Chiller: nhiệt độ nước cấp/hồi, áp suất gas, độ rung và tiếng ồn bất thường.\n2. Kiểm tra cụm bơm nước lạnh (CHWP), bơm giải nhiệt (CLWP) và tháp giải nhiệt Cooling Tower 01–02.\n3. Kiểm tra cụm máy nén khí GA90-1/2, GA75-1, máy sấy khí FD220 và áp suất khí nén đường ống chính.\n4. Kiểm tra tủ điện phân phối MSB1–MSB5, nhiệt độ thanh cái, điện áp 3 pha, máy phát điện dự phòng & hệ thống nước DI.',
    icon: Gauge,
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    accentBorder: 'border-amber-500/30',
    iconBg: 'bg-amber-500/15 text-amber-400',
  },
};

function getStatusBadgeClass(status: DailyAreaCheckStatus): string {
  switch (status) {
    case 'Đã hoàn thành':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'Đang kiểm tra':
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

function getResultBadgeClass(result: DailyAreaCheckResult): string {
  switch (result) {
    case 'Bình thường':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'Cần theo dõi':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'Có sự cố':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    default:
      return 'bg-slate-800/80 text-slate-400 border-slate-700';
  }
}

export const MorningChecksTab: React.FC = () => {
  const {
    dailyAreaChecks,
    employees,
    currentUser,
    addDailyAreaCheck,
    updateDailyAreaCheck,
    submitDailyAreaCheckReport,
    deleteDailyAreaCheck,
    triggerWebNotification,
  } = useCMMS();

  const canManageAssignments = canManageMaintenancePlans(currentUser);
  const canDelete = canDeleteRecords(currentUser);

  const [selectedArea, setSelectedArea] = useState<'Tất cả' | DailyInspectionArea>('Tất cả');
  const [filterStatus, setFilterStatus] = useState<string>('Tất cả');
  const [filterDate, setFilterDate] = useState<string>('');
  const [onlyMyChecks, setOnlyMyChecks] = useState<boolean>(!canManageAssignments);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Assign / Edit Area Description Modal (Admin/Manager/Engineer)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingCheck, setEditingCheck] = useState<DailyAreaCheck | null>(null);
  const [formArea, setFormArea] = useState<DailyInspectionArea>('Vòng trong');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formShift, setFormShift] = useState<DailyAreaCheckShift>('Ca Sáng');
  const [formDeadline, setFormDeadline] = useState<string>('08:30');
  const [formTitle, setFormTitle] = useState<string>(AREA_META['Vòng trong'].defaultTitle);
  const [formDescription, setFormDescription] = useState<string>(
    AREA_META['Vòng trong'].defaultDescription
  );
  const [formAssignees, setFormAssignees] = useState<string>('');

  // Quick 3-Area Batch Assign Modal (Admin/Manager/Engineer)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchDate, setBatchDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [batchShift, setBatchShift] = useState<DailyAreaCheckShift>('Ca Sáng');
  const [batchAssignees, setBatchAssignees] = useState<Record<DailyInspectionArea, string>>({
    'Vòng trong': 'Trương Quang Sơn',
    'Vòng Ngoài': 'Lê Văn Thắng',
    'Phòng Utility': 'Đỗ Hữu Thịnh',
  });
  const [batchDescriptions, setBatchDescriptions] = useState<Record<DailyInspectionArea, string>>({
    'Vòng trong': AREA_META['Vòng trong'].defaultDescription,
    'Vòng Ngoài': AREA_META['Vòng Ngoài'].defaultDescription,
    'Phòng Utility': AREA_META['Phòng Utility'].defaultDescription,
  });

  // Technician / Assignee Report Modal
  const [reportingCheck, setReportingCheck] = useState<DailyAreaCheck | null>(null);
  const [reportStatus, setReportStatus] = useState<DailyAreaCheckStatus>('Đã hoàn thành');
  const [reportResult, setReportResult] = useState<DailyAreaCheckResult>('Bình thường');
  const [reportText, setReportText] = useState<string>('');
  const [reportPhoto, setReportPhoto] = useState<string>('');

  // Delete Confirmation Modal
  const [checkToDelete, setCheckToDelete] = useState<DailyAreaCheck | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 4000);
  };

  const latestDateInData = useMemo(() => {
    if (dailyAreaChecks.length === 0) return new Date().toISOString().slice(0, 10);
    return [...dailyAreaChecks]
      .map((c) => c.ngayKiemTra)
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))[0];
  }, [dailyAreaChecks]);

  const stats = useMemo(() => {
    const total = dailyAreaChecks.length;
    const completed = dailyAreaChecks.filter((c) => c.trangThai === 'Đã hoàn thành').length;
    const pending = dailyAreaChecks.filter((c) => c.trangThai !== 'Đã hoàn thành').length;
    const issues = dailyAreaChecks.filter(
      (c) => c.ketQua === 'Có sự cố' || c.ketQua === 'Cần theo dõi'
    ).length;
    const myPending = dailyAreaChecks.filter(
      (c) =>
        matchesAssignee(c.nguoiDuocGiao, currentUser) && c.trangThai !== 'Đã hoàn thành'
    ).length;
    return { total, completed, pending, issues, myPending };
  }, [dailyAreaChecks, currentUser]);

  const areaLatestSummary = useMemo(() => {
    return AREAS.map((area) => {
      const items = dailyAreaChecks.filter((c) => c.khuVuc === area);
      const latest = [...items].sort((a, b) => b.ngayKiemTra.localeCompare(a.ngayKiemTra))[0] || null;
      const doneCount = items.filter((c) => c.trangThai === 'Đã hoàn thành').length;
      const pendingCount = items.filter((c) => c.trangThai !== 'Đã hoàn thành').length;
      return { area, latest, total: items.length, doneCount, pendingCount };
    });
  }, [dailyAreaChecks]);

  const filteredChecks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return dailyAreaChecks
      .filter((item) => {
        if (selectedArea !== 'Tất cả' && item.khuVuc !== selectedArea) return false;
        if (filterStatus !== 'Tất cả' && item.trangThai !== filterStatus) return false;
        if (filterDate && item.ngayKiemTra !== filterDate) return false;
        if (onlyMyChecks && !matchesAssignee(item.nguoiDuocGiao, currentUser)) return false;
        if (q) {
          const hay = `${item.khuVuc} ${item.tieuDe} ${item.moTaCongViec} ${item.nguoiDuocGiao} ${item.baoCaoThucTe || ''} ${item.nguoiBaoCao || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const d = (b.ngayKiemTra || '').localeCompare(a.ngayKiemTra || '');
        if (d !== 0) return d;
        return AREAS.indexOf(a.khuVuc) - AREAS.indexOf(b.khuVuc);
      });
  }, [
    dailyAreaChecks,
    selectedArea,
    filterStatus,
    filterDate,
    onlyMyChecks,
    searchTerm,
    currentUser,
  ]);

  const handleOpenCreateModal = (presetArea: DailyInspectionArea = 'Vòng trong') => {
    if (!canManageAssignments) return;
    setEditingCheck(null);
    setFormArea(presetArea);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormShift('Ca Sáng');
    setFormDeadline('08:30');
    setFormTitle(AREA_META[presetArea].defaultTitle);
    setFormDescription(AREA_META[presetArea].defaultDescription);
    setFormAssignees('');
    setIsAssignModalOpen(true);
  };

  const handleOpenEditModal = (item: DailyAreaCheck) => {
    if (!canManageAssignments) return;
    setEditingCheck(item);
    setFormArea(item.khuVuc);
    setFormDate(item.ngayKiemTra);
    setFormShift(item.caLamViec);
    setFormDeadline(item.hanHoanThanh || '08:30');
    setFormTitle(item.tieuDe);
    setFormDescription(item.moTaCongViec);
    setFormAssignees(item.nguoiDuocGiao);
    setIsAssignModalOpen(true);
  };

  const handleAreaChangeInForm = (area: DailyInspectionArea) => {
    setFormArea(area);
    if (!editingCheck) {
      setFormTitle(AREA_META[area].defaultTitle);
      setFormDescription(AREA_META[area].defaultDescription);
    }
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAssignments) return;
    if (!formTitle.trim() || !formDescription.trim() || !formAssignees.trim()) return;

    if (editingCheck) {
      updateDailyAreaCheck({
        ...editingCheck,
        ngayKiemTra: formDate,
        caLamViec: formShift,
        khuVuc: formArea,
        tieuDe: formTitle.trim(),
        moTaCongViec: formDescription.trim(),
        nguoiDuocGiao: formAssignees.trim(),
        hanHoanThanh: formDeadline.trim(),
      });
      showToast(`Đã cập nhật phân công & mô tả công việc khu vực ${formArea}.`);
    } else {
      addDailyAreaCheck({
        ngayKiemTra: formDate,
        caLamViec: formShift,
        khuVuc: formArea,
        tieuDe: formTitle.trim(),
        moTaCongViec: formDescription.trim(),
        nguoiDuocGiao: formAssignees.trim(),
        nguoiPhanQuyen: currentUser.tenNhanVien,
        hanHoanThanh: formDeadline.trim(),
        trangThai: 'Chờ kiểm tra',
        ketQua: 'Chưa đánh giá',
      });
      triggerWebNotification({
        type: 'GIAO_VIEC',
        title: `[Công Việc Đầu Ngày] Phân công ${formArea}`,
        message: `${currentUser.tenNhanVien} đã giao kiểm tra ${formArea} (${formatDateVN(formDate)} - ${formShift}) cho ${formAssignees.trim()}`,
        targetTab: 'morning_checks',
      });
      showToast(`Đã tạo phiếu kiểm tra đầu ngày cho khu vực ${formArea}.`);
    }
    setIsAssignModalOpen(false);
  };

  const handleCreateBatch3Areas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAssignments) return;
    let createdCount = 0;
    AREAS.forEach((area) => {
      const assignee = (batchAssignees[area] || '').trim();
      const desc = (batchDescriptions[area] || AREA_META[area].defaultDescription).trim();
      if (!assignee) return;
      addDailyAreaCheck({
        ngayKiemTra: batchDate,
        caLamViec: batchShift,
        khuVuc: area,
        tieuDe: AREA_META[area].defaultTitle,
        moTaCongViec: desc,
        nguoiDuocGiao: assignee,
        nguoiPhanQuyen: currentUser.tenNhanVien,
        hanHoanThanh: area === 'Vòng Ngoài' ? '08:45' : '08:30',
        trangThai: 'Chờ kiểm tra',
        ketQua: 'Chưa đánh giá',
      });
      createdCount += 1;
    });
    if (createdCount > 0) {
      triggerWebNotification({
        type: 'GIAO_VIEC',
        title: `[Công Việc Đầu Ngày] Giao ${createdCount} khu vực (${formatDateVN(batchDate)})`,
        message: `${currentUser.tenNhanVien} vừa phát hành lịch kiểm tra đầu ngày (${batchShift}) cho Vòng trong, Vòng Ngoài & Phòng Utility.`,
        targetTab: 'morning_checks',
      });
      showToast(`Đã tạo ${createdCount} phiếu kiểm tra đầu ngày cho các khu vực.`);
      setIsBatchModalOpen(false);
    }
  };

  const handleOpenReportModal = (item: DailyAreaCheck) => {
    setReportingCheck(item);
    setReportStatus(item.trangThai === 'Chờ kiểm tra' ? 'Đã hoàn thành' : item.trangThai);
    setReportResult(item.ketQua === 'Chưa đánh giá' ? 'Bình thường' : item.ketQua);
    setReportText(item.baoCaoThucTe || '');
    setReportPhoto(item.anhHienTruong || '');
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingCheck) return;
    submitDailyAreaCheckReport({
      id: reportingCheck.id,
      trangThai: reportStatus,
      ketQua: reportResult,
      baoCaoThucTe: reportText,
      anhHienTruong: reportPhoto,
    });
    showToast(`Đã ghi nhận báo cáo kiểm tra khu vực ${reportingCheck.khuVuc}.`);
    setReportingCheck(null);
  };

  const handleConfirmDelete = () => {
    if (!checkToDelete || !canDelete) return;
    deleteDailyAreaCheck(checkToDelete.id);
    showToast(`Đã xóa phiếu kiểm tra khu vực ${checkToDelete.khuVuc}.`);
    setCheckToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Sunrise className="w-4 h-4" />
              <span>{UI_TEXTS.tabs.morningChecks.badge}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {UI_TEXTS.tabs.morningChecks.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Phân quyền và theo dõi kiểm tra đầu ca tại 3 khu vực trọng điểm:{' '}
              <span className="text-cyan-300 font-semibold">Vòng trong</span>,{' '}
              <span className="text-emerald-300 font-semibold">Vòng Ngoài</span> và{' '}
              <span className="text-amber-300 font-semibold">Phòng Utility</span>. Kỹ thuật viên xem
              mô tả công việc từng khu vực và ghi nhận báo cáo hiện trường trực tiếp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setOnlyMyChecks((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition min-h-[42px] ${
                onlyMyChecks
                  ? 'bg-cyan-600 text-white border-cyan-400/50 shadow-md shadow-cyan-900/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Việc Được Giao Cho Tôi</span>
              {stats.myPending > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-black/25 font-mono text-[11px] tabular-nums">
                  {stats.myPending}
                </span>
              )}
            </button>

            {canManageAssignments && (
              <>
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition min-h-[42px]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Phân Công Nhanh 3 Khu Vực</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal('Vòng trong')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition min-h-[42px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Giao Việc Khu Vực</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {toastMsg && (
        <div className="px-4 py-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button type="button" onClick={() => setToastMsg(null)} className="text-emerald-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Tổng Phiếu Kiểm Tra</div>
          <div className="text-2xl font-extrabold text-white tabular-nums">{stats.total}</div>
          <div className="text-[11px] text-slate-400">Ngày gần nhất: {formatDateVN(latestDateInData)}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Đã Hoàn Thành</div>
          <div className="text-2xl font-extrabold text-emerald-400 tabular-nums">{stats.completed}</div>
          <div className="text-[11px] text-slate-400">Đã có báo cáo hiện trường</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Chờ / Đang Kiểm Tra</div>
          <div className="text-2xl font-extrabold text-cyan-400 tabular-nums">{stats.pending}</div>
          <div className="text-[11px] text-slate-400">Cần hoàn tất đầu ca</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Cảnh Báo / Sự Cố</div>
          <div
            className={`text-2xl font-extrabold tabular-nums ${
              stats.issues > 0 ? 'text-rose-400' : 'text-slate-300'
            }`}
          >
            {stats.issues}
          </div>
          <div className="text-[11px] text-slate-400">Cần theo dõi hoặc xử lý</div>
        </div>
      </div>

      {/* 3 Area Overview Cards (Vòng trong, Vòng Ngoài, Phòng Utility) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {areaLatestSummary.map(({ area, latest, total, doneCount, pendingCount }) => {
          const meta = AREA_META[area];
          const Icon = meta.icon;
          const isSelected = selectedArea === area;
          return (
            <div
              key={area}
              className={`rounded-2xl bg-slate-900/85 border p-4 sm:p-5 flex flex-col justify-between gap-4 transition ${
                isSelected ? 'border-cyan-400 ring-1 ring-cyan-500/40' : `${meta.accentBorder} hover:border-slate-700`
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`p-2.5 rounded-xl shrink-0 ${meta.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-base font-extrabold text-white">{area}</h2>
                      <p className="text-[11px] text-slate-400 leading-snug">{meta.subtitle}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedArea(isSelected ? 'Tất cả' : area)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border shrink-0 transition ${
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {isSelected ? 'Đang lọc' : `Xem (${total})`}
                  </button>
                </div>

                {/* Area Job Description Preview */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Mô tả công việc khu vực:</span>
                  </div>
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed line-clamp-4">
                    {latest?.moTaCongViec || meta.defaultDescription}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-slate-400 tabular-nums">
                  Xong <span className="font-bold text-emerald-400">{doneCount}</span> · Chờ{' '}
                  <span className="font-bold text-amber-300">{pendingCount}</span>
                </div>
                {latest ? (
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getStatusBadgeClass(latest.trangThai)}`}>
                      {latest.trangThai}
                    </span>
                    {canManageAssignments && (
                      <button
                        type="button"
                        onClick={() => handleOpenCreateModal(area)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold transition"
                      >
                        + Giao mới
                      </button>
                    )}
                  </div>
                ) : (
                  canManageAssignments && (
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal(area)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition"
                    >
                      + Tạo phiếu đầu tiên
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['Tất cả', ...AREAS] as const).map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedArea === area
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {area === 'Tất cả' ? 'Tất cả khu vực' : area}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mô tả, người phụ trách, báo cáo..."
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              aria-label="Lọc theo ngày kiểm tra"
              className="px-2.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {filterDate && (
              <button
                type="button"
                onClick={() => setFilterDate('')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                title="Bỏ lọc ngày"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inspection Cards List */}
      {filteredChecks.length === 0 ? (
        <div className="p-10 rounded-2xl bg-slate-900/70 border border-slate-800 text-center space-y-2">
          <Sunrise className="w-8 h-8 text-slate-500 mx-auto" />
          <div className="text-sm font-bold text-slate-200">
            Không có công việc kiểm tra đầu ngày phù hợp
          </div>
          <p className="text-xs text-slate-400">
            {onlyMyChecks
              ? 'Hiện tại bạn không có phiếu kiểm tra nào trong bộ lọc này. Thử tắt nút "Việc Được Giao Cho Tôi" để xem toàn bộ khu vực.'
              : 'Thử thay đổi bộ lọc khu vực/ngày hoặc tạo phân công kiểm tra mới.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChecks.map((item) => {
            const areaMeta = AREA_META[item.khuVuc];
            const AreaIcon = areaMeta.icon;
            const isAssignedToMe = matchesAssignee(item.nguoiDuocGiao, currentUser);
            const photoUrl = item.anhHienTruong ? resolveImageUrl(item.anhHienTruong) : '';

            return (
              <div
                key={item.id}
                className={`rounded-2xl bg-slate-900/85 border p-4 sm:p-5 space-y-4 shadow-lg transition ${
                  item.ketQua === 'Có sự cố'
                    ? 'border-rose-500/40'
                    : isAssignedToMe
                    ? 'border-cyan-500/35'
                    : 'border-slate-800'
                }`}
              >
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold ${areaMeta.badgeClass}`}
                      >
                        <AreaIcon className="w-3.5 h-3.5" />
                        <span>{item.khuVuc}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-200 tabular-nums">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {formatDateVN(item.ngayKiemTra)} · {item.caLamViec}
                      </span>
                      {item.hanHoanThanh && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-slate-300 tabular-nums">
                          <Clock className="w-3 h-3 text-amber-400" />
                          Hạn: {item.hanHoanThanh}
                        </span>
                      )}
                      {isAssignedToMe && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
                          Việc của tôi
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {item.tieuDe}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        Người được giao:{' '}
                        <strong className="text-slate-100">{item.nguoiDuocGiao}</strong>
                      </span>
                      {item.nguoiPhanQuyen && (
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                          Người giao: <span className="text-slate-200">{item.nguoiPhanQuyen}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${getStatusBadgeClass(
                        item.trangThai
                      )}`}
                    >
                      {item.trangThai}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${getResultBadgeClass(
                        item.ketQua
                      )}`}
                    >
                      {item.ketQua}
                    </span>
                  </div>
                </div>

                {/* Two-Column Body: Mô tả công việc & Báo cáo từ người được giao việc */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Mô tả công việc của khu vực */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>Mô Tả Công Việc Kiểm Tra ({item.khuVuc})</span>
                    </div>
                    <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                      {item.moTaCongViec}
                    </div>
                  </div>

                  {/* Right: Ghi nhận báo cáo từ người được giao việc */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <ClipboardEdit className="w-4 h-4" />
                          <span>Báo Cáo Từ Người Được Giao Việc</span>
                        </div>
                        {item.thoiGianBaoCao && (
                          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                            {item.thoiGianBaoCao}
                          </span>
                        )}
                      </div>

                      {item.baoCaoThucTe ? (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-100 whitespace-pre-line leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                            {item.baoCaoThucTe}
                          </p>
                          {item.nguoiBaoCao && (
                            <div className="text-[11px] text-slate-400">
                              Người báo cáo:{' '}
                              <span className="text-slate-200 font-semibold">{item.nguoiBaoCao}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-dashed border-slate-700 text-xs text-slate-400">
                          Chưa có báo cáo hiện trường từ người được giao việc. Bấm nút{' '}
                          <span className="text-cyan-300 font-semibold">"Ghi Nhận Báo Cáo"</span> để
                          cập nhật tình trạng kiểm tra.
                        </div>
                      )}

                      {photoUrl && (
                        <div className="pt-1">
                          <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Ảnh hiện trường đính kèm</span>
                          </div>
                          <img
                            src={photoUrl}
                            alt={`Hiện trường ${item.khuVuc}`}
                            className="max-h-44 rounded-lg border border-slate-700 object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenReportModal(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition min-h-[38px]"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{item.baoCaoThucTe ? 'Cập Nhật Báo Cáo' : 'Ghi Nhận Báo Cáo'}</span>
                      </button>

                      {canManageAssignments && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition min-h-[38px]"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Sửa Phân Công / Mô Tả</span>
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setCheckToDelete(item)}
                          aria-label="Xóa phiếu kiểm tra"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-rose-400 border border-slate-700 transition min-h-[38px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ASSIGN / EDIT AREA CHECK & DESCRIPTION (ADMIN / MANAGER / ENGINEER) */}
      {isAssignModalOpen && canManageAssignments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingCheck
                  ? `Chỉnh Sửa Phân Công & Mô Tả (${editingCheck.khuVuc})`
                  : 'Giao Việc Kiểm Tra Đầu Ngày Theo Khu Vực'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Khu Vực *</label>
                  <select
                    value={formArea}
                    onChange={(e) => handleAreaChangeInForm(e.target.value as DailyInspectionArea)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ngày Kiểm Tra *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ca / Hạn</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={formShift}
                      onChange={(e) => setFormShift(e.target.value as DailyAreaCheckShift)}
                      className="px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                    >
                      {SHIFTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={formDeadline}
                      onChange={(e) => setFormDeadline(e.target.value)}
                      placeholder="08:30"
                      className="px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 tabular-nums"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tiêu Đề Công Việc *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    Mô Tả Công Việc Cho Khu Vực ({formArea}) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormDescription(AREA_META[formArea].defaultDescription)}
                    className="text-[11px] text-cyan-400 hover:underline font-semibold"
                  >
                    Dùng mẫu chuẩn {formArea}
                  </button>
                </div>
                <textarea
                  rows={5}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Liệt kê các hạng mục kỹ thuật viên cần kiểm tra tại khu vực này..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 leading-relaxed"
                />
              </div>

              <MultiAssigneePicker
                employees={employees}
                value={formAssignees}
                onChange={(formatted) => setFormAssignees(formatted)}
                label="Phân Quyền Kỹ Thuật Viên Thực Hiện"
                accentColor="cyan"
                required
              />

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!formAssignees.trim()}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold"
                >
                  {editingCheck ? 'Lưu Thay Đổi' : 'Giao Việc Kiểm Tra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK 3-AREA BATCH ASSIGNMENT (ADMIN / MANAGER / ENGINEER) */}
      {isBatchModalOpen && canManageAssignments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Phân Công Nhanh Kiểm Tra Đầu Ngày (3 Khu Vực)
              </h3>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch3Areas} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ngày Kiểm Tra</label>
                  <input
                    type="date"
                    required
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ca Làm Việc</label>
                  <select
                    value={batchShift}
                    onChange={(e) => setBatchShift(e.target.value as DailyAreaCheckShift)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {SHIFTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {AREAS.map((area) => {
                  const meta = AREA_META[area];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={area}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center gap-2 font-bold text-white">
                        <span className={`p-1.5 rounded-lg ${meta.iconBg}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span>{area}</span>
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Mô tả công việc khu vực {area}
                        </label>
                        <textarea
                          rows={3}
                          value={batchDescriptions[area]}
                          onChange={(e) =>
                            setBatchDescriptions((prev) => ({ ...prev, [area]: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 leading-relaxed"
                        />
                      </div>
                      <MultiAssigneePicker
                        employees={employees}
                        value={batchAssignees[area]}
                        onChange={(formatted) =>
                          setBatchAssignees((prev) => ({ ...prev, [area]: formatted }))
                        }
                        label={`Kỹ thuật viên phụ trách ${area}`}
                        accentColor="emerald"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Tạo Phiếu Cho Các Khu Vực
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FIELD REPORT SUBMISSION BY ASSIGNED TECHNICIAN */}
      {reportingCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Ghi Nhận Báo Cáo Kiểm Tra — {reportingCheck.khuVuc}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {formatDateVN(reportingCheck.ngayKiemTra)} · {reportingCheck.caLamViec} · Người
                  báo cáo: <span className="text-cyan-300 font-semibold">{currentUser.tenNhanVien}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReportingCheck(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Show Area Task Description for reference */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-cyan-300">
                  Mô tả công việc cần kiểm tra:
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {reportingCheck.moTaCongViec}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Trạng Thái Thực Hiện
                  </label>
                  <select
                    value={reportStatus}
                    onChange={(e) => setReportStatus(e.target.value as DailyAreaCheckStatus)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Kết Quả Kiểm Tra Khu Vực
                  </label>
                  <select
                    value={reportResult}
                    onChange={(e) => setReportResult(e.target.value as DailyAreaCheckResult)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {RESULT_OPTIONS.map((rs) => (
                      <option key={rs} value={rs}>
                        {rs}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nội Dung Báo Cáo Hiện Trường *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Ghi rõ các thông số đo được, tình trạng thiết bị/khu vực, phát hiện bất thường (nếu có)..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 leading-relaxed"
                />
              </div>

              <CameraCaptureInput
                label="Ảnh Hiện Trường (Tùy chọn)"
                value={reportPhoto}
                onChange={setReportPhoto}
                compact
              />

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportingCheck(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Lưu Báo Cáo Kiểm Tra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION (NON-TECHNICIANS ONLY) */}
      {checkToDelete && canDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Xác Nhận Xóa Phiếu Kiểm Tra</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa phiếu kiểm tra đầu ngày khu vực{' '}
              <strong className="text-white">{checkToDelete.khuVuc}</strong> (
              {formatDateVN(checkToDelete.ngayKiemTra)} · {checkToDelete.caLamViec})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCheckToDelete(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Xóa Phiếu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
