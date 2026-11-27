import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import {
  DailyAreaCheck,
  DailyAreaCheckResult,
  DailyAreaCheckShift,
  DailyAreaCheckStatus,
  DailyAreaDayReport,
  DailyInspectionArea,
  MorningCheckAreaTemplate,
} from '../../types/cmms';
import {
  canDeleteRecords,
  canManageMaintenancePlans,
  DEFAULT_MORNING_CHECK_TEMPLATES,
  formatDateVN,
  getScheduledDatesForAreaCheck,
  getWeekdayLabelVN,
  getWeekMonToSatRange,
  matchesAssignee,
  WEEK_DAYS_MON_SAT,
} from '../../utils/cmmsLogic';
import { estimateDataUrlKb, resolveImageUrl } from '../../utils/imageUtils';
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
  CalendarRange,
  ClipboardEdit,
  X,
  Sparkles,
  Camera,
  Send,
  RotateCcw,
  SlidersHorizontal,
  Maximize2,
  ImagePlus,
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

const WEEKDAY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 0, label: 'CN' },
];

const AREA_STYLE_META: Record<
  DailyInspectionArea,
  {
    subtitle: string;
    icon: React.FC<{ className?: string }>;
    badgeClass: string;
    accentBorder: string;
    iconBg: string;
  }
> = {
  'Vòng trong': {
    subtitle: 'Xưởng sản xuất · Kho · Văn phòng · AHU/FCU · Lối thoát hiểm',
    icon: Building2,
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    accentBorder: 'border-cyan-500/30',
    iconBg: 'bg-cyan-500/15 text-cyan-400',
  },
  'Vòng Ngoài': {
    subtitle: 'Khuôn viên ngoài · Trạm bơm · Xử lý nước thải · Nhà bảo vệ · Kho hóa chất',
    icon: Trees,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    accentBorder: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
  },
  'Phòng Utility': {
    subtitle: 'Chiller · Cooling Tower · Máy nén khí · Tủ điện MSB · Hệ nước DI',
    icon: Gauge,
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    accentBorder: 'border-amber-500/30',
    iconBg: 'bg-amber-500/15 text-amber-400',
  },
};

function getTodayYmd(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

function formatShortDate(ymd: string): string {
  const parts = (ymd || '').split('-');
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}`;
}

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

function getDayReportMap(item: DailyAreaCheck): Map<string, DailyAreaDayReport> {
  const map = new Map<string, DailyAreaDayReport>();
  if (Array.isArray(item.baoCaoTheoNgay)) {
    for (const r of item.baoCaoTheoNgay) {
      if (r?.ngay) map.set(r.ngay, r);
    }
  }
  // Backwards compatibility for legacy single-day items without baoCaoTheoNgay
  if (map.size === 0 && item.baoCaoThucTe && item.ngayKiemTra) {
    map.set(item.ngayKiemTra, {
      ngay: item.ngayKiemTra,
      trangThai: item.trangThai,
      ketQua: item.ketQua,
      baoCaoThucTe: item.baoCaoThucTe,
      nguoiBaoCao: item.nguoiBaoCao,
      thoiGianBaoCao: item.thoiGianBaoCao,
      anhHienTruong: item.anhHienTruong,
    });
  }
  return map;
}

function getDayPhotos(report?: DailyAreaDayReport | null, fallbackTopPhoto?: string): string[] {
  const combined: string[] = [];
  if (report) {
    if (Array.isArray(report.anhDinhKem)) {
      combined.push(...report.anhDinhKem);
    }
    if (report.anhHienTruong) {
      combined.push(report.anhHienTruong);
    }
  }
  if (combined.length === 0 && fallbackTopPhoto) {
    combined.push(fallbackTopPhoto);
  }
  return Array.from(
    new Set(combined.map((u) => (typeof u === 'string' ? u.trim() : '')).filter(Boolean))
  ).slice(0, 4);
}

export const MorningChecksTab: React.FC = () => {
  const {
    dailyAreaChecks,
    morningCheckTemplates,
    employees,
    currentUser,
    updateMorningCheckTemplate,
    resetMorningCheckTemplates,
    addDailyAreaCheck,
    updateDailyAreaCheck,
    submitDailyAreaCheckReport,
    deleteDailyAreaCheck,
    triggerWebNotification,
  } = useCMMS();

  const canManageAssignments = canManageMaintenancePlans(currentUser);
  const canDelete = canDeleteRecords(currentUser);
  const todayYmd = getTodayYmd();

  const [selectedArea, setSelectedArea] = useState<'Tất cả' | DailyInspectionArea>('Tất cả');
  const [filterStatus, setFilterStatus] = useState<string>('Tất cả');
  const [filterDate, setFilterDate] = useState<string>('');
  const [onlyMyChecks, setOnlyMyChecks] = useState<boolean>(!canManageAssignments);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedPreviewDayByCheck, setSelectedPreviewDayByCheck] = useState<Record<string, string>>({});

  // Modal 0: Edit Job Templates ("Sửa công việc mẫu")
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateArea, setTemplateArea] = useState<DailyInspectionArea>('Vòng trong');
  const [templateDraft, setTemplateDraft] = useState<MorningCheckAreaTemplate>(
    morningCheckTemplates['Vòng trong']
  );
  const [applyTemplateToPending, setApplyTemplateToPending] = useState<boolean>(false);

  // Modal 1: Assign / Edit Area Check (with Mon-Sat weekly range)
  const initialWeek = getWeekMonToSatRange(0);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingCheck, setEditingCheck] = useState<DailyAreaCheck | null>(null);
  const [formArea, setFormArea] = useState<DailyInspectionArea>('Vòng trong');
  const [formScheduleMode, setFormScheduleMode] = useState<'range' | 'single'>('range');
  const [formStartDate, setFormStartDate] = useState<string>(initialWeek.start);
  const [formEndDate, setFormEndDate] = useState<string>(initialWeek.end);
  const [formWeekdays, setFormWeekdays] = useState<number[]>([...WEEK_DAYS_MON_SAT]);
  const [formShift, setFormShift] = useState<DailyAreaCheckShift>('Ca Sáng');
  const [formDeadline, setFormDeadline] = useState<string>(
    morningCheckTemplates['Vòng trong'].hanHoanThanh
  );
  const [formTitle, setFormTitle] = useState<string>(morningCheckTemplates['Vòng trong'].tieuDe);
  const [formDescription, setFormDescription] = useState<string>(
    morningCheckTemplates['Vòng trong'].moTaCongViec
  );
  const [formAssignees, setFormAssignees] = useState<string>(
    morningCheckTemplates['Vòng trong'].nguoiMacDinh || ''
  );

  // Modal 2: Quick 3-Area Batch Assign (with Mon-Sat weekly range)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchScheduleMode, setBatchScheduleMode] = useState<'range' | 'single'>('range');
  const [batchStartDate, setBatchStartDate] = useState<string>(initialWeek.start);
  const [batchEndDate, setBatchEndDate] = useState<string>(initialWeek.end);
  const [batchWeekdays, setBatchWeekdays] = useState<number[]>([...WEEK_DAYS_MON_SAT]);
  const [batchShift, setBatchShift] = useState<DailyAreaCheckShift>('Ca Sáng');
  const [batchAssignees, setBatchAssignees] = useState<Record<DailyInspectionArea, string>>({
    'Vòng trong': morningCheckTemplates['Vòng trong'].nguoiMacDinh || '',
    'Vòng Ngoài': morningCheckTemplates['Vòng Ngoài'].nguoiMacDinh || '',
    'Phòng Utility': morningCheckTemplates['Phòng Utility'].nguoiMacDinh || '',
  });
  const [batchDescriptions, setBatchDescriptions] = useState<Record<DailyInspectionArea, string>>({
    'Vòng trong': morningCheckTemplates['Vòng trong'].moTaCongViec,
    'Vòng Ngoài': morningCheckTemplates['Vòng Ngoài'].moTaCongViec,
    'Phòng Utility': morningCheckTemplates['Phòng Utility'].moTaCongViec,
  });

  // Modal 3: Technician / Assignee Per-Day Report Modal
  const [reportingCheck, setReportingCheck] = useState<DailyAreaCheck | null>(null);
  const [reportDate, setReportDate] = useState<string>(todayYmd);
  const [reportStatus, setReportStatus] = useState<DailyAreaCheckStatus>('Đã hoàn thành');
  const [reportResult, setReportResult] = useState<DailyAreaCheckResult>('Bình thường');
  const [reportText, setReportText] = useState<string>('');
  const [reportPhotos, setReportPhotos] = useState<string[]>([]);
  const [reportPhotoDraft, setReportPhotoDraft] = useState<string>('');
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; title: string } | null>(null);

  // Modal 4: Delete Confirmation Modal
  const [checkToDelete, setCheckToDelete] = useState<DailyAreaCheck | null>(null);

  const lastTemplatesJsonRef = useRef<string>(JSON.stringify(morningCheckTemplates));

  useEffect(() => {
    const serialized = JSON.stringify(morningCheckTemplates);
    if (isBatchModalOpen || serialized === lastTemplatesJsonRef.current) return;
    lastTemplatesJsonRef.current = serialized;
    setBatchAssignees({
      'Vòng trong': morningCheckTemplates['Vòng trong'].nguoiMacDinh || '',
      'Vòng Ngoài': morningCheckTemplates['Vòng Ngoài'].nguoiMacDinh || '',
      'Phòng Utility': morningCheckTemplates['Phòng Utility'].nguoiMacDinh || '',
    });
    setBatchDescriptions({
      'Vòng trong': morningCheckTemplates['Vòng trong'].moTaCongViec,
      'Vòng Ngoài': morningCheckTemplates['Vòng Ngoài'].moTaCongViec,
      'Phòng Utility': morningCheckTemplates['Phòng Utility'].moTaCongViec,
    });
  }, [morningCheckTemplates, isBatchModalOpen]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 4000);
  };

  const formScheduledPreview = useMemo(() => {
    return getScheduledDatesForAreaCheck({
      ngayKiemTra: formStartDate,
      ngayKetThuc: formScheduleMode === 'range' ? formEndDate : formStartDate,
      ngayTrongTuan: formScheduleMode === 'range' ? formWeekdays : undefined,
    });
  }, [formStartDate, formEndDate, formScheduleMode, formWeekdays]);

  const batchScheduledPreview = useMemo(() => {
    return getScheduledDatesForAreaCheck({
      ngayKiemTra: batchStartDate,
      ngayKetThuc: batchScheduleMode === 'range' ? batchEndDate : batchStartDate,
      ngayTrongTuan: batchScheduleMode === 'range' ? batchWeekdays : undefined,
    });
  }, [batchStartDate, batchEndDate, batchScheduleMode, batchWeekdays]);

  const latestDateInData = useMemo(() => {
    if (dailyAreaChecks.length === 0) return todayYmd;
    return [...dailyAreaChecks]
      .map((c) => c.ngayKetThuc || c.ngayKiemTra)
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))[0];
  }, [dailyAreaChecks, todayYmd]);

  const stats = useMemo(() => {
    const total = dailyAreaChecks.length;
    const completed = dailyAreaChecks.filter((c) => c.trangThai === 'Đã hoàn thành').length;
    const pending = dailyAreaChecks.filter((c) => c.trangThai !== 'Đã hoàn thành').length;
    const issues = dailyAreaChecks.filter(
      (c) => c.ketQua === 'Có sự cố' || c.ketQua === 'Cần theo dõi'
    ).length;
    const myPending = dailyAreaChecks.filter(
      (c) => matchesAssignee(c.nguoiDuocGiao, currentUser) && c.trangThai !== 'Đã hoàn thành'
    ).length;
    return { total, completed, pending, issues, myPending };
  }, [dailyAreaChecks, currentUser]);

  const areaLatestSummary = useMemo(() => {
    return AREAS.map((area) => {
      const items = dailyAreaChecks.filter((c) => c.khuVuc === area);
      const latest =
        [...items].sort((a, b) =>
          (b.ngayKetThuc || b.ngayKiemTra).localeCompare(a.ngayKetThuc || a.ngayKiemTra)
        )[0] || null;
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
        if (filterDate) {
          const scheduled = getScheduledDatesForAreaCheck(item);
          if (!scheduled.includes(filterDate) && item.ngayKiemTra !== filterDate) return false;
        }
        if (onlyMyChecks && !matchesAssignee(item.nguoiDuocGiao, currentUser)) return false;
        if (q) {
          const dailyNotes = (item.baoCaoTheoNgay || [])
            .map((r) => `${r.ngay} ${r.baoCaoThucTe} ${r.nguoiBaoCao || ''}`)
            .join(' ');
          const hay =
            `${item.khuVuc} ${item.tieuDe} ${item.moTaCongViec} ${item.nguoiDuocGiao} ${item.baoCaoThucTe || ''} ${item.nguoiBaoCao || ''} ${dailyNotes}`.toLowerCase();
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

  // Template Modal Handlers
  const handleOpenTemplateModal = (area: DailyInspectionArea = 'Vòng trong') => {
    if (!canManageAssignments) return;
    setTemplateArea(area);
    setTemplateDraft({ ...morningCheckTemplates[area] });
    setApplyTemplateToPending(false);
    setIsTemplateModalOpen(true);
  };

  const handleSwitchTemplateArea = (area: DailyInspectionArea) => {
    setTemplateArea(area);
    setTemplateDraft({ ...morningCheckTemplates[area] });
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAssignments) return;
    updateMorningCheckTemplate(templateArea, templateDraft, applyTemplateToPending);
    showToast(
      `Đã lưu công việc mẫu khu vực ${templateArea}${
        applyTemplateToPending ? ' và cập nhật các phiếu chưa hoàn thành.' : '.'
      }`
    );
    setIsTemplateModalOpen(false);
  };

  const handleResetCurrentAreaTemplate = () => {
    setTemplateDraft({ ...DEFAULT_MORNING_CHECK_TEMPLATES[templateArea] });
  };

  const handleResetAllTemplates = () => {
    if (!canManageAssignments) return;
    resetMorningCheckTemplates();
    setTemplateDraft({ ...DEFAULT_MORNING_CHECK_TEMPLATES[templateArea] });
    showToast('Đã khôi phục 3 mẫu công việc đầu ngày về mặc định.');
  };

  // Assign / Edit Modal Handlers
  const handleOpenCreateModal = (presetArea: DailyInspectionArea = 'Vòng trong') => {
    if (!canManageAssignments) return;
    const tpl = morningCheckTemplates[presetArea];
    const week = getWeekMonToSatRange(0);
    setEditingCheck(null);
    setFormArea(presetArea);
    setFormScheduleMode('range');
    setFormStartDate(week.start);
    setFormEndDate(week.end);
    setFormWeekdays([...WEEK_DAYS_MON_SAT]);
    setFormShift('Ca Sáng');
    setFormDeadline(tpl.hanHoanThanh || '08:30');
    setFormTitle(tpl.tieuDe);
    setFormDescription(tpl.moTaCongViec);
    setFormAssignees(tpl.nguoiMacDinh || '');
    setIsAssignModalOpen(true);
  };

  const handleOpenEditModal = (item: DailyAreaCheck) => {
    if (!canManageAssignments) return;
    const isRange = Boolean(item.ngayKetThuc && item.ngayKetThuc !== item.ngayKiemTra);
    setEditingCheck(item);
    setFormArea(item.khuVuc);
    setFormScheduleMode(isRange ? 'range' : 'single');
    setFormStartDate(item.ngayKiemTra);
    setFormEndDate(item.ngayKetThuc || item.ngayKiemTra);
    setFormWeekdays(
      Array.isArray(item.ngayTrongTuan) && item.ngayTrongTuan.length > 0
        ? item.ngayTrongTuan
        : [...WEEK_DAYS_MON_SAT]
    );
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
      const tpl = morningCheckTemplates[area];
      setFormTitle(tpl.tieuDe);
      setFormDescription(tpl.moTaCongViec);
      setFormDeadline(tpl.hanHoanThanh || '08:30');
      setFormAssignees(tpl.nguoiMacDinh || '');
    }
  };

  const toggleWeekday = (list: number[], setList: (next: number[]) => void, dayVal: number) => {
    if (list.includes(dayVal)) {
      if (list.length <= 1) return; // Keep at least 1 weekday selected
      setList(list.filter((d) => d !== dayVal));
    } else {
      const order = [1, 2, 3, 4, 5, 6, 0];
      setList([...list, dayVal].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
    }
  };

  const applyWeekPreset = (
    offsetWeeks: number,
    setStart: (v: string) => void,
    setEnd: (v: string) => void,
    setDays: (v: number[]) => void,
    setMode: (m: 'range' | 'single') => void
  ) => {
    const range = getWeekMonToSatRange(offsetWeeks);
    setMode('range');
    setStart(range.start);
    setEnd(range.end);
    setDays([...WEEK_DAYS_MON_SAT]);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAssignments) return;
    if (!formTitle.trim() || !formDescription.trim() || !formAssignees.trim()) return;

    const effectiveEnd =
      formScheduleMode === 'range'
        ? formEndDate >= formStartDate
          ? formEndDate
          : formStartDate
        : undefined;
    const effectiveWeekdays =
      formScheduleMode === 'range' ? [...formWeekdays] : undefined;

    if (editingCheck) {
      updateDailyAreaCheck({
        ...editingCheck,
        ngayKiemTra: formStartDate,
        ngayKetThuc: effectiveEnd,
        ngayTrongTuan: effectiveWeekdays,
        caLamViec: formShift,
        khuVuc: formArea,
        tieuDe: formTitle.trim(),
        moTaCongViec: formDescription.trim(),
        nguoiDuocGiao: formAssignees.trim(),
        hanHoanThanh: formDeadline.trim(),
      });
      showToast(`Đã cập nhật lịch & mô tả công việc khu vực ${formArea}.`);
    } else {
      addDailyAreaCheck({
        ngayKiemTra: formStartDate,
        ngayKetThuc: effectiveEnd,
        ngayTrongTuan: effectiveWeekdays,
        caLamViec: formShift,
        khuVuc: formArea,
        tieuDe: formTitle.trim(),
        moTaCongViec: formDescription.trim(),
        nguoiDuocGiao: formAssignees.trim(),
        nguoiPhanQuyen: currentUser.tenNhanVien,
        hanHoanThanh: formDeadline.trim(),
        trangThai: 'Chờ kiểm tra',
        ketQua: 'Chưa đánh giá',
        baoCaoTheoNgay: [],
      });
      const rangeText = effectiveEnd
        ? `${formatDateVN(formStartDate)} → ${formatDateVN(effectiveEnd)} (${formScheduledPreview.length} ngày)`
        : formatDateVN(formStartDate);
      triggerWebNotification({
        type: 'GIAO_VIEC',
        title: `[Công Việc Đầu Ngày] Phân công ${formArea}`,
        message: `${currentUser.tenNhanVien} đã giao kiểm tra ${formArea} (${rangeText} - ${formShift}) cho ${formAssignees.trim()}`,
        targetTab: 'morning_checks',
      });
      showToast(`Đã tạo lịch kiểm tra khu vực ${formArea} (${rangeText}).`);
    }
    setIsAssignModalOpen(false);
  };

  // Batch 3-Area Modal Handlers
  const handleOpenBatchModal = () => {
    if (!canManageAssignments) return;
    const week = getWeekMonToSatRange(0);
    setBatchScheduleMode('range');
    setBatchStartDate(week.start);
    setBatchEndDate(week.end);
    setBatchWeekdays([...WEEK_DAYS_MON_SAT]);
    setBatchShift('Ca Sáng');
    setBatchAssignees({
      'Vòng trong': morningCheckTemplates['Vòng trong'].nguoiMacDinh || '',
      'Vòng Ngoài': morningCheckTemplates['Vòng Ngoài'].nguoiMacDinh || '',
      'Phòng Utility': morningCheckTemplates['Phòng Utility'].nguoiMacDinh || '',
    });
    setBatchDescriptions({
      'Vòng trong': morningCheckTemplates['Vòng trong'].moTaCongViec,
      'Vòng Ngoài': morningCheckTemplates['Vòng Ngoài'].moTaCongViec,
      'Phòng Utility': morningCheckTemplates['Phòng Utility'].moTaCongViec,
    });
    setIsBatchModalOpen(true);
  };

  const handleCreateBatch3Areas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAssignments) return;
    const effectiveEnd =
      batchScheduleMode === 'range'
        ? batchEndDate >= batchStartDate
          ? batchEndDate
          : batchStartDate
        : undefined;
    const effectiveWeekdays =
      batchScheduleMode === 'range' ? [...batchWeekdays] : undefined;

    let createdCount = 0;
    AREAS.forEach((area) => {
      const tpl = morningCheckTemplates[area];
      const assignee = (batchAssignees[area] || '').trim();
      const desc = (batchDescriptions[area] || tpl.moTaCongViec).trim();
      if (!assignee) return;
      addDailyAreaCheck({
        ngayKiemTra: batchStartDate,
        ngayKetThuc: effectiveEnd,
        ngayTrongTuan: effectiveWeekdays,
        caLamViec: batchShift,
        khuVuc: area,
        tieuDe: tpl.tieuDe,
        moTaCongViec: desc,
        nguoiDuocGiao: assignee,
        nguoiPhanQuyen: currentUser.tenNhanVien,
        hanHoanThanh: tpl.hanHoanThanh || (area === 'Vòng Ngoài' ? '08:45' : '08:30'),
        trangThai: 'Chờ kiểm tra',
        ketQua: 'Chưa đánh giá',
        baoCaoTheoNgay: [],
      });
      createdCount += 1;
    });
    if (createdCount > 0) {
      const rangeText = effectiveEnd
        ? `${formatDateVN(batchStartDate)} → ${formatDateVN(effectiveEnd)}`
        : formatDateVN(batchStartDate);
      triggerWebNotification({
        type: 'GIAO_VIEC',
        title: `[Công Việc Đầu Ngày] Giao ${createdCount} khu vực (${rangeText})`,
        message: `${currentUser.tenNhanVien} vừa phát hành lịch kiểm tra đầu ngày (${batchShift}, ${rangeText}) cho Vòng trong, Vòng Ngoài & Phòng Utility.`,
        targetTab: 'morning_checks',
      });
      showToast(`Đã tạo ${createdCount} lịch kiểm tra (${rangeText}) cho 3 khu vực.`);
      setIsBatchModalOpen(false);
    }
  };

  // Per-day Report Modal Handlers
  const loadDayFieldsIntoReportModal = (item: DailyAreaCheck, targetDay: string) => {
    const dayMap = getDayReportMap(item);
    const dayEntry = dayMap.get(targetDay);
    setReportDate(targetDay);
    setReportStatus(
      dayEntry
        ? dayEntry.trangThai === 'Chờ kiểm tra'
          ? 'Đã hoàn thành'
          : dayEntry.trangThai
        : 'Đã hoàn thành'
    );
    setReportResult(
      dayEntry
        ? dayEntry.ketQua === 'Chưa đánh giá'
          ? 'Bình thường'
          : dayEntry.ketQua
        : 'Bình thường'
    );
    setReportText(dayEntry?.baoCaoThucTe || '');
    setReportPhotos(getDayPhotos(dayEntry));
    setReportPhotoDraft('');
  };

  const handleOpenReportModal = (item: DailyAreaCheck, specificDay?: string) => {
    const scheduled = getScheduledDatesForAreaCheck(item);
    const dayMap = getDayReportMap(item);
    const defaultDay =
      specificDay ||
      selectedPreviewDayByCheck[item.id] ||
      (scheduled.includes(todayYmd) ? todayYmd : undefined) ||
      scheduled.find((d) => dayMap.get(d)?.trangThai !== 'Đã hoàn thành') ||
      scheduled[0] ||
      item.ngayKiemTra;

    setReportingCheck(item);
    loadDayFieldsIntoReportModal(item, defaultDay);
  };

  const handleSwitchReportDateInModal = (targetDay: string) => {
    if (!reportingCheck) return;
    loadDayFieldsIntoReportModal(reportingCheck, targetDay);
  };

  const handleAppendReportPhotos = (incoming: string[]) => {
    const clean = incoming.map((u) => u.trim()).filter(Boolean);
    if (clean.length === 0) return;
    setReportPhotos((prev) => Array.from(new Set([...prev, ...clean])).slice(0, 4));
    setReportPhotoDraft('');
  };

  const handleRemoveReportPhoto = (idx: number) => {
    setReportPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingCheck) return;
    const finalPhotos = Array.from(
      new Set([
        ...reportPhotos,
        ...(reportPhotoDraft.trim() ? [reportPhotoDraft.trim()] : []),
      ])
    ).slice(0, 4);

    submitDailyAreaCheckReport({
      id: reportingCheck.id,
      ngayBaoCao: reportDate,
      trangThai: reportStatus,
      ketQua: reportResult,
      baoCaoThucTe: reportText,
      anhHienTruong: finalPhotos[0] || '',
      anhDinhKem: finalPhotos,
    });
    setSelectedPreviewDayByCheck((prev) => ({ ...prev, [reportingCheck.id]: reportDate }));
    showToast(
      `Đã ghi nhận báo cáo ngày ${formatDateVN(reportDate)} (${getWeekdayLabelVN(
        reportDate
      )}) — ${reportingCheck.khuVuc}.`
    );
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
              Quản lý công việc mẫu, giao lịch kiểm tra theo tuần (Thứ 2 – Thứ 7) tại 3 khu vực:{' '}
              <span className="text-cyan-300 font-semibold">Vòng trong</span>,{' '}
              <span className="text-emerald-300 font-semibold">Vòng Ngoài</span> và{' '}
              <span className="text-amber-300 font-semibold">Phòng Utility</span>. Người phụ trách
              chọn từng ngày để cập nhật báo cáo hiện trường.
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
                  onClick={() => handleOpenTemplateModal('Vòng trong')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold shadow-md transition min-h-[42px]"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Sửa Công Việc Mẫu</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenBatchModal}
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
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Tổng Lịch Kiểm Tra</div>
          <div className="text-2xl font-extrabold text-white tabular-nums">{stats.total}</div>
          <div className="text-[11px] text-slate-400">
            Đến ngày: {formatDateVN(latestDateInData)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Đã Hoàn Thành Đủ Ngày</div>
          <div className="text-2xl font-extrabold text-emerald-400 tabular-nums">
            {stats.completed}
          </div>
          <div className="text-[11px] text-slate-400">Hoàn tất toàn bộ lịch tuần/ngày</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Chờ / Đang Kiểm Tra</div>
          <div className="text-2xl font-extrabold text-cyan-400 tabular-nums">{stats.pending}</div>
          <div className="text-[11px] text-slate-400">Cần cập nhật báo cáo theo ngày</div>
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
          const styleMeta = AREA_STYLE_META[area];
          const tpl = morningCheckTemplates[area];
          const Icon = styleMeta.icon;
          const isSelected = selectedArea === area;
          return (
            <div
              key={area}
              className={`rounded-2xl bg-slate-900/85 border p-4 sm:p-5 flex flex-col justify-between gap-4 transition ${
                isSelected
                  ? 'border-cyan-400 ring-1 ring-cyan-500/40'
                  : `${styleMeta.accentBorder} hover:border-slate-700`
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`p-2.5 rounded-xl shrink-0 ${styleMeta.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-base font-extrabold text-white">{area}</h2>
                      <p className="text-[11px] text-slate-400 leading-snug">{styleMeta.subtitle}</p>
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

                {/* Area Job Template Preview */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Công việc mẫu ({tpl.hanHoanThanh}):</span>
                    </div>
                    {canManageAssignments && (
                      <button
                        type="button"
                        onClick={() => handleOpenTemplateModal(area)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Sửa mẫu</span>
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-cyan-200 line-clamp-1">
                    {tpl.tieuDe}
                  </div>
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed line-clamp-3">
                    {tpl.moTaCongViec}
                  </p>
                  {tpl.nguoiMacDinh && (
                    <div className="text-[11px] text-slate-400 pt-0.5">
                      Mặc định: <span className="text-slate-200 font-medium">{tpl.nguoiMacDinh}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-slate-400 tabular-nums">
                  Xong <span className="font-bold text-emerald-400">{doneCount}</span> · Chờ{' '}
                  <span className="font-bold text-amber-300">{pendingCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {latest && (
                    <span
                      className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getStatusBadgeClass(
                        latest.trangThai
                      )}`}
                    >
                      {latest.trangThai}
                    </span>
                  )}
                  {canManageAssignments && (
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal(area)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold transition"
                    >
                      + Giao tuần/ngày
                    </button>
                  )}
                </div>
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
            const areaStyle = AREA_STYLE_META[item.khuVuc];
            const AreaIcon = areaStyle.icon;
            const isAssignedToMe = matchesAssignee(item.nguoiDuocGiao, currentUser);
            const scheduledDates = getScheduledDatesForAreaCheck(item);
            const dayMap = getDayReportMap(item);
            const isWeeklyOrMulti =
              scheduledDates.length > 1 ||
              Boolean(item.ngayKetThuc && item.ngayKetThuc !== item.ngayKiemTra);
            const completedDaysCount = scheduledDates.filter(
              (d) => dayMap.get(d)?.trangThai === 'Đã hoàn thành'
            ).length;

            const activePreviewDay =
              (selectedPreviewDayByCheck[item.id] &&
              scheduledDates.includes(selectedPreviewDayByCheck[item.id])
                ? selectedPreviewDayByCheck[item.id]
                : undefined) ||
              (scheduledDates.includes(todayYmd) ? todayYmd : undefined) ||
              [...scheduledDates].reverse().find((d) => dayMap.has(d)) ||
              scheduledDates[0] ||
              item.ngayKiemTra;

            const activeDayReport = dayMap.get(activePreviewDay);
            const displayReportText =
              activeDayReport?.baoCaoThucTe ||
              (!isWeeklyOrMulti ? item.baoCaoThucTe : undefined) ||
              '';
            const displayReporter =
              activeDayReport?.nguoiBaoCao ||
              (!isWeeklyOrMulti ? item.nguoiBaoCao : undefined);
            const displayReportTime =
              activeDayReport?.thoiGianBaoCao ||
              (!isWeeklyOrMulti ? item.thoiGianBaoCao : undefined);
            const displayPhotos = getDayPhotos(
              activeDayReport,
              !isWeeklyOrMulti ? item.anhHienTruong : undefined
            );

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
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold ${areaStyle.badgeClass}`}
                      >
                        <AreaIcon className="w-3.5 h-3.5" />
                        <span>{item.khuVuc}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-200 tabular-nums">
                        {isWeeklyOrMulti ? (
                          <CalendarRange className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Calendar className="w-3 h-3 text-cyan-400" />
                        )}
                        {isWeeklyOrMulti
                          ? `${formatDateVN(item.ngayKiemTra)} → ${formatDateVN(
                              item.ngayKetThuc || scheduledDates[scheduledDates.length - 1]
                            )} (${scheduledDates.length} ngày) · ${item.caLamViec}`
                          : `${formatDateVN(item.ngayKiemTra)} (${getWeekdayLabelVN(
                              item.ngayKiemTra
                            )}) · ${item.caLamViec}`}
                      </span>

                      {item.hanHoanThanh && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-slate-300 tabular-nums">
                          <Clock className="w-3 h-3 text-amber-400" />
                          Hạn: {item.hanHoanThanh}
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 text-[11px] font-bold text-emerald-300 tabular-nums">
                        {completedDaysCount}/{scheduledDates.length} ngày xong
                      </span>

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
                        Người phụ trách:{' '}
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

                {/* Two-Column Body: Mô tả công việc & Báo cáo theo ngày */}
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

                  {/* Right: Báo cáo theo ngày từ người phụ trách */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between gap-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <ClipboardEdit className="w-4 h-4" />
                          <span>Báo Cáo Theo Ngày (Người Phụ Trách)</span>
                        </div>
                        {displayReportTime && (
                          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                            {displayReportTime}
                          </span>
                        )}
                      </div>

                      {/* Scheduled Days Selector Grid (T2 - T7) */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {scheduledDates.map((d) => {
                          const rep = dayMap.get(d);
                          const dayPhotosCount = getDayPhotos(rep).length;
                          const isDayActive = d === activePreviewDay;
                          const isDone = rep?.trangThai === 'Đã hoàn thành';
                          const isProgress = rep?.trangThai === 'Đang kiểm tra';
                          const hasIssue =
                            rep?.ketQua === 'Có sự cố' || rep?.ketQua === 'Cần theo dõi';
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() =>
                                setSelectedPreviewDayByCheck((prev) => ({
                                  ...prev,
                                  [item.id]: d,
                                }))
                              }
                              onDoubleClick={() => handleOpenReportModal(item, d)}
                              title={`Xem hoặc báo cáo ngày ${formatDateVN(d)} (${
                                rep?.trangThai || 'Chờ kiểm tra'
                              })`}
                              className={`px-2 py-1.5 rounded-lg border text-left transition ${
                                isDayActive
                                  ? 'bg-cyan-600/25 border-cyan-400 ring-1 ring-cyan-400/50'
                                  : isDone
                                  ? 'bg-emerald-950/40 border-emerald-500/35 hover:border-emerald-400'
                                  : isProgress
                                  ? 'bg-cyan-950/40 border-cyan-500/35 hover:border-cyan-400'
                                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[11px] font-bold text-white tabular-nums">
                                  {getWeekdayLabelVN(d)}
                                </span>
                                <div className="flex items-center gap-1">
                                  {dayPhotosCount > 0 && (
                                    <Camera
                                      className="w-2.5 h-2.5 text-cyan-300"
                                      aria-label={`${dayPhotosCount} ảnh đính kèm`}
                                    />
                                  )}
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      rep?.ketQua === 'Có sự cố'
                                        ? 'bg-rose-400'
                                        : rep?.ketQua === 'Cần theo dõi'
                                        ? 'bg-amber-400'
                                        : isDone
                                        ? 'bg-emerald-400'
                                        : isProgress
                                        ? 'bg-cyan-400'
                                        : 'bg-slate-600'
                                    }`}
                                  />
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-300 tabular-nums">
                                {formatShortDate(d)}
                              </div>
                              <div
                                className={`text-[9px] font-semibold truncate ${
                                  hasIssue
                                    ? 'text-amber-300'
                                    : isDone
                                    ? 'text-emerald-300'
                                    : isProgress
                                    ? 'text-cyan-300'
                                    : 'text-slate-500'
                                }`}
                              >
                                {rep ? (isDone ? 'Xong' : 'Đang làm') : 'Chưa BC'}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected Day Detail Box */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] font-bold text-cyan-200 tabular-nums">
                            Chi tiết ngày {getWeekdayLabelVN(activePreviewDay)} ·{' '}
                            {formatDateVN(activePreviewDay)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusBadgeClass(
                                activeDayReport?.trangThai || 'Chờ kiểm tra'
                              )}`}
                            >
                              {activeDayReport?.trangThai || 'Chờ kiểm tra'}
                            </span>
                            {activeDayReport && (
                              <span
                                className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getResultBadgeClass(
                                  activeDayReport.ketQua
                                )}`}
                              >
                                {activeDayReport.ketQua}
                              </span>
                            )}
                          </div>
                        </div>

                        {displayReportText ? (
                          <div className="space-y-1.5">
                            <p className="text-xs text-slate-100 whitespace-pre-line leading-relaxed">
                              {displayReportText}
                            </p>
                            {displayReporter && (
                              <div className="text-[11px] text-slate-400">
                                Người báo cáo:{' '}
                                <span className="text-slate-200 font-semibold">
                                  {displayReporter}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">
                            Chưa có báo cáo cho ngày {formatDateVN(activePreviewDay)}. Bấm nút{' '}
                            <span className="text-cyan-300 font-semibold">
                              "Báo Cáo Ngày {formatShortDate(activePreviewDay)}"
                            </span>{' '}
                            để cập nhật.
                          </p>
                        )}

                        {displayPhotos.length > 0 && (
                          <div className="pt-1.5 space-y-1.5">
                            <div className="text-[11px] text-slate-400 flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1">
                                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                                <span>
                                  Ảnh đính kèm ngày {formatShortDate(activePreviewDay)} (
                                  {displayPhotos.length})
                                </span>
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {displayPhotos.map((rawUrl, photoIdx) => {
                                const resolved = resolveImageUrl(rawUrl);
                                return (
                                  <button
                                    key={`${activePreviewDay}-photo-${photoIdx}`}
                                    type="button"
                                    onClick={() =>
                                      setLightboxPhoto({
                                        url: resolved,
                                        title: `${item.khuVuc} · ${formatDateVN(
                                          activePreviewDay
                                        )} (Ảnh ${photoIdx + 1})`,
                                      })
                                    }
                                    className="group relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 aspect-[4/3] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                  >
                                    <img
                                      src={resolved}
                                      alt={`Hiện trường ${item.khuVuc} ngày ${activePreviewDay} (${
                                        photoIdx + 1
                                      })`}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover group-hover:scale-105 transition"
                                    />
                                    <span className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                      <Maximize2 className="w-4 h-4 text-white" />
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenReportModal(item, activePreviewDay)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/35 text-xs font-semibold transition min-h-[38px]"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>
                          {displayPhotos.length > 0
                            ? `Ảnh Báo Cáo (${displayPhotos.length}/4)`
                            : 'Đính Kèm Ảnh'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReportModal(item, activePreviewDay)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition min-h-[38px]"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {activeDayReport
                            ? `Cập Nhật Báo Cáo (${formatShortDate(activePreviewDay)})`
                            : `Báo Cáo Ngày ${formatShortDate(activePreviewDay)}`}
                        </span>
                      </button>

                      {canManageAssignments && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition min-h-[38px]"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Sửa Lịch / Mô Tả</span>
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

      {/* MODAL 0: EDIT MORNING CHECK AREA TEMPLATES ("SỬA CÔNG VIỆC MẪU") */}
      {isTemplateModalOpen && canManageAssignments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Sửa Công Việc Mẫu Theo Khu Vực
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {AREAS.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => handleSwitchTemplateArea(area)}
                      className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                        templateArea === area
                          ? 'bg-amber-600 text-white border-amber-400/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleResetAllTemplates}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục cả 3 mẫu gốc</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tiêu Đề Mẫu ({templateArea}) *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateDraft.tieuDe}
                    onChange={(e) =>
                      setTemplateDraft((prev) => ({ ...prev, tieuDe: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Hạn Hoàn Thành
                  </label>
                  <input
                    type="text"
                    value={templateDraft.hanHoanThanh}
                    onChange={(e) =>
                      setTemplateDraft((prev) => ({ ...prev, hanHoanThanh: e.target.value }))
                    }
                    placeholder="08:30"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    Nội Dung Mô Tả Công Việc Mẫu ({templateArea}) *
                  </label>
                  <button
                    type="button"
                    onClick={handleResetCurrentAreaTemplate}
                    className="text-[11px] text-cyan-400 hover:underline font-semibold"
                  >
                    Nạp lại nội dung mặc định {templateArea}
                  </button>
                </div>
                <textarea
                  rows={6}
                  required
                  value={templateDraft.moTaCongViec}
                  onChange={(e) =>
                    setTemplateDraft((prev) => ({ ...prev, moTaCongViec: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 leading-relaxed"
                />
              </div>

              <MultiAssigneePicker
                employees={employees}
                value={templateDraft.nguoiMacDinh || ''}
                onChange={(formatted) =>
                  setTemplateDraft((prev) => ({ ...prev, nguoiMacDinh: formatted }))
                }
                label={`Người Phụ Trách Mặc Định (${templateArea})`}
                accentColor="amber"
              />

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyTemplateToPending}
                  onChange={(e) => setApplyTemplateToPending(e.target.checked)}
                  className="mt-0.5 rounded border-slate-600 bg-slate-800 text-amber-500"
                />
                <span className="text-slate-300 leading-relaxed">
                  Đồng bộ tiêu đề, mô tả công việc & hạn hoàn thành mới vào các phiếu{' '}
                  <strong className="text-white">{templateArea}</strong> chưa hoàn thành hiện tại.
                </span>
              </label>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Lưu Công Việc Mẫu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: ASSIGN / EDIT AREA CHECK (WEEKLY MON-SAT RANGE SUPPORT) */}
      {isAssignModalOpen && canManageAssignments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingCheck
                  ? `Chỉnh Sửa Lịch & Mô Tả (${editingCheck.khuVuc})`
                  : 'Giao Việc Kiểm Tra Đầu Ngày (Theo Tuần / Ngày)'}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
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
                  <label className="block text-slate-300 font-semibold mb-1">Ca Làm Việc</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as DailyAreaCheckShift)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {SHIFTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hạn Hàng Ngày</label>
                  <input
                    type="text"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    placeholder="08:30"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 tabular-nums"
                  />
                </div>
              </div>

              {/* Date Range / Mon-Sat Selector */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormScheduleMode('range')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        formScheduleMode === 'range'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Khoảng ngày / Theo tuần (T2–T7)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormScheduleMode('single')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        formScheduleMode === 'single'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      1 ngày cụ thể
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        applyWeekPreset(
                          0,
                          setFormStartDate,
                          setFormEndDate,
                          setFormWeekdays,
                          setFormScheduleMode
                        )
                      }
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold"
                    >
                      Tuần này (T2–T7)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyWeekPreset(
                          1,
                          setFormStartDate,
                          setFormEndDate,
                          setFormWeekdays,
                          setFormScheduleMode
                        )
                      }
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-semibold"
                    >
                      Tuần sau (T2–T7)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {formScheduleMode === 'range' ? 'Từ Ngày *' : 'Ngày Kiểm Tra *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormStartDate(v);
                        if (formEndDate < v) setFormEndDate(v);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                    />
                  </div>
                  {formScheduleMode === 'range' && (
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Đến Ngày *</label>
                      <input
                        type="date"
                        required
                        min={formStartDate}
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                      />
                    </div>
                  )}
                </div>

                {formScheduleMode === 'range' && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-400 mr-1">Các thứ thực hiện:</span>
                      {WEEKDAY_OPTIONS.map((wd) => {
                        const active = formWeekdays.includes(wd.value);
                        return (
                          <button
                            key={wd.value}
                            type="button"
                            onClick={() => toggleWeekday(formWeekdays, setFormWeekdays, wd.value)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition ${
                              active
                                ? 'bg-cyan-600/30 text-cyan-200 border-cyan-500/60'
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {wd.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Sẽ tạo lịch kiểm tra cho{' '}
                      <strong className="text-cyan-300">{formScheduledPreview.length} ngày</strong>:{' '}
                      <span className="text-slate-400">
                        {formScheduledPreview
                          .map((d) => `${getWeekdayLabelVN(d)} ${formatShortDate(d)}`)
                          .join(', ')}
                      </span>
                    </div>
                  </div>
                )}
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
                    onClick={() => {
                      const tpl = morningCheckTemplates[formArea];
                      setFormTitle(tpl.tieuDe);
                      setFormDescription(tpl.moTaCongViec);
                      setFormDeadline(tpl.hanHoanThanh);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline font-semibold"
                  >
                    Nạp từ công việc mẫu {formArea}
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

      {/* MODAL 2: QUICK 3-AREA BATCH ASSIGNMENT (WEEKLY MON-SAT RANGE) */}
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
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBatchScheduleMode('range')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        batchScheduleMode === 'range'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Theo tuần / Khoảng ngày (T2–T7)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchScheduleMode('single')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        batchScheduleMode === 'single'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      1 ngày
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        applyWeekPreset(
                          0,
                          setBatchStartDate,
                          setBatchEndDate,
                          setBatchWeekdays,
                          setBatchScheduleMode
                        )
                      }
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold"
                    >
                      Tuần này (T2–T7)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyWeekPreset(
                          1,
                          setBatchStartDate,
                          setBatchEndDate,
                          setBatchWeekdays,
                          setBatchScheduleMode
                        )
                      }
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-semibold"
                    >
                      Tuần sau (T2–T7)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {batchScheduleMode === 'range' ? 'Từ Ngày' : 'Ngày Kiểm Tra'}
                    </label>
                    <input
                      type="date"
                      required
                      value={batchStartDate}
                      onChange={(e) => {
                        const v = e.target.value;
                        setBatchStartDate(v);
                        if (batchEndDate < v) setBatchEndDate(v);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                    />
                  </div>
                  {batchScheduleMode === 'range' && (
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Đến Ngày</label>
                      <input
                        type="date"
                        required
                        min={batchStartDate}
                        value={batchEndDate}
                        onChange={(e) => setBatchEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                      />
                    </div>
                  )}
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

                {batchScheduleMode === 'range' && (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-400 mr-1">Các thứ thực hiện:</span>
                      {WEEKDAY_OPTIONS.map((wd) => {
                        const active = batchWeekdays.includes(wd.value);
                        return (
                          <button
                            key={wd.value}
                            type="button"
                            onClick={() => toggleWeekday(batchWeekdays, setBatchWeekdays, wd.value)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition ${
                              active
                                ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/60'
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {wd.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Áp dụng cho{' '}
                      <strong className="text-emerald-300">
                        {batchScheduledPreview.length} ngày
                      </strong>
                      :{' '}
                      <span className="text-slate-400">
                        {batchScheduledPreview
                          .map((d) => `${getWeekdayLabelVN(d)} ${formatShortDate(d)}`)
                          .join(', ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {AREAS.map((area) => {
                  const styleMeta = AREA_STYLE_META[area];
                  const Icon = styleMeta.icon;
                  return (
                    <div
                      key={area}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span className={`p-1.5 rounded-lg ${styleMeta.iconBg}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span>{area}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Hạn mẫu: {morningCheckTemplates[area].hanHoanThanh}
                        </span>
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
                  Tạo Lịch Cho Các Khu Vực
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PER-DAY FIELD REPORT SUBMISSION BY ASSIGNED TECHNICIAN */}
      {reportingCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Báo Cáo Theo Ngày — {reportingCheck.khuVuc}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {getWeekdayLabelVN(reportDate)} {formatDateVN(reportDate)} ·{' '}
                  {reportingCheck.caLamViec} · Người báo cáo:{' '}
                  <span className="text-cyan-300 font-semibold">{currentUser.tenNhanVien}</span>
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
              {/* Day Strip Selector */}
              {(() => {
                const scheduled = getScheduledDatesForAreaCheck(reportingCheck);
                const dayMap = getDayReportMap(reportingCheck);
                return (
                  <div className="space-y-1.5">
                    <label className="block text-slate-300 font-semibold">
                      Chọn Ngày Cập Nhật Báo Cáo:
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {scheduled.map((d) => {
                        const existingDay = dayMap.get(d);
                        const isSelected = d === reportDate;
                        const isDone = existingDay?.trangThai === 'Đã hoàn thành';
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => handleSwitchReportDateInModal(d)}
                            className={`px-2 py-1.5 rounded-lg border text-left transition ${
                              isSelected
                                ? 'bg-cyan-600 text-white border-cyan-400 shadow'
                                : isDone
                                ? 'bg-emerald-950/40 text-emerald-200 border-emerald-500/40 hover:border-emerald-400'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 font-bold text-[11px]">
                              <span>{getWeekdayLabelVN(d)}</span>
                              {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                            </div>
                            <div className="text-[10px] opacity-90 tabular-nums">
                              {formatShortDate(d)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

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
                    Trạng Thái Ngày {formatShortDate(reportDate)}
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
                  Nội Dung Báo Cáo Hiện Trường ({getWeekdayLabelVN(reportDate)}{' '}
                  {formatDateVN(reportDate)}) *
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

              {/* Image Attachments for Morning Report (Up to 4 compressed photos) */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <ImagePlus className="w-4 h-4" />
                    <span>Đính Kèm Hình Ảnh Báo Cáo ({reportPhotos.length}/4 ảnh)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Tự động giảm dung lượng
                  </span>
                </div>

                {reportPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {reportPhotos.map((rawUrl, idx) => {
                      const resolved = resolveImageUrl(rawUrl);
                      const kb = rawUrl.startsWith('data:image/') ? estimateDataUrlKb(rawUrl) : 0;
                      return (
                        <div
                          key={`report-photo-thumb-${idx}`}
                          className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-[4/3]"
                        >
                          <img
                            src={resolved}
                            alt={`Ảnh báo cáo ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            onClick={() =>
                              setLightboxPhoto({
                                url: resolved,
                                title: `${reportingCheck.khuVuc} · ${formatDateVN(
                                  reportDate
                                )} (Ảnh ${idx + 1})`,
                              })
                            }
                            className="w-full h-full object-cover cursor-pointer"
                          />
                          {kb > 0 && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-emerald-300">
                              ~{kb}KB
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveReportPhoto(idx)}
                            aria-label={`Xóa ảnh ${idx + 1}`}
                            className="absolute top-1 right-1 p-1 rounded-lg bg-black/75 hover:bg-rose-600 text-white transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {reportPhotos.length < 4 ? (
                  <CameraCaptureInput
                    label={
                      reportPhotos.length === 0
                        ? 'Chụp trực tiếp hoặc chọn ảnh từ thiết bị'
                        : 'Thêm ảnh khác (tối đa 4 ảnh)'
                    }
                    value={reportPhotoDraft}
                    onChange={(val) => {
                      if (!val) {
                        setReportPhotoDraft('');
                        return;
                      }
                      if (val.startsWith('data:image/')) {
                        handleAppendReportPhotos([val]);
                      } else {
                        setReportPhotoDraft(val);
                      }
                    }}
                    onPickMultiple={(urls) => handleAppendReportPhotos(urls)}
                    hidePreview
                    compact
                    placeholder="Hoặc dán URL ảnh rồi bấm Lưu báo cáo..."
                  />
                ) : (
                  <div className="text-[11px] text-amber-300 font-medium">
                    Đã đạt tối đa 4 ảnh đính kèm cho ngày {formatShortDate(reportDate)}. Xóa bớt ảnh nếu muốn thay thế.
                  </div>
                )}
              </div>

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
                  Lưu Báo Cáo Ngày {formatShortDate(reportDate)}
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
              <h3 className="text-base font-bold text-white">Xác Nhận Xóa Lịch Kiểm Tra</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa phiếu kiểm tra đầu ngày khu vực{' '}
              <strong className="text-white">{checkToDelete.khuVuc}</strong> (
              {formatDateVN(checkToDelete.ngayKiemTra)}
              {checkToDelete.ngayKetThuc && checkToDelete.ngayKetThuc !== checkToDelete.ngayKiemTra
                ? ` → ${formatDateVN(checkToDelete.ngayKetThuc)}`
                : ''}{' '}
              · {checkToDelete.caLamViec})?
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
      {/* LIGHTBOX FOR REPORT ATTACHED PHOTOS */}
      {lightboxPhoto &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[130] bg-black/92 backdrop-blur-sm flex flex-col p-3 sm:p-6"
            onClick={() => setLightboxPhoto(null)}
          >
            <div className="flex items-center justify-between pb-3 text-white">
              <span className="text-sm font-bold truncate">{lightboxPhoto.title}</span>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              className="flex-1 min-h-0 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.title}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain rounded-xl border border-slate-800 shadow-2xl"
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
