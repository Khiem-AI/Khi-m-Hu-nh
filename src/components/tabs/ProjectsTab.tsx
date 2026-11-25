import React, { useMemo, useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import {
  FacilityProject,
  ProjectCategory,
  ProjectExpense,
  ProjectMilestone,
  ProjectPriority,
  ProjectRisk,
  ProjectRiskLevel,
  ProjectStatus,
  ProjectTask,
  ProjectTaskStatus,
} from '../../types/cmms';
import {
  calculateProjectProgress,
  canDeleteRecords,
  canViewCosts,
  formatDateVN,
  formatVND,
  getTodayISODate,
  matchesAssignee,
  parseAssigneeNames,
  resolveAssigneeEmails,
} from '../../utils/cmmsLogic';
import { exportProjectsWorkbook } from '../../utils/excelExport';
import { MultiAssigneePicker } from '../common/MultiAssigneePicker';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  DollarSign,
  Download,
  Edit3,
  FileSpreadsheet,
  Flag,
  FolderKanban,
  GanttChartSquare,
  Kanban,
  Layers,
  ListChecks,
  Mail,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  UserCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react';

const PROJECT_STATUSES: ProjectStatus[] = [
  'Lập kế hoạch',
  'Đang triển khai',
  'Tạm dừng',
  'Chờ nghiệm thu',
  'Hoàn thành',
  'Hủy',
];

const PROJECT_PRIORITIES: ProjectPriority[] = ['Khẩn cấp', 'Cao', 'Trung bình', 'Thấp'];

const PROJECT_CATEGORIES: ProjectCategory[] = [
  'Nâng cấp hạ tầng',
  'Lắp đặt thiết bị mới',
  'Tiết kiệm năng lượng',
  'An toàn & Môi trường',
  'Cải tạo hệ thống',
];

const TASK_STATUSES: ProjectTaskStatus[] = ['Cần làm', 'Đang làm', 'Chờ duyệt', 'Hoàn thành'];

const TODAY_REF = getTodayISODate();

const getProjectStatusBadge = (status: ProjectStatus) => {
  switch (status) {
    case 'Đang triển khai':
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    case 'Hoàn thành':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'Chờ nghiệm thu':
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    case 'Tạm dừng':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'Hủy':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    default:
      return 'bg-slate-700/40 text-slate-300 border-slate-600/50';
  }
};

const getPriorityBadge = (priority: ProjectPriority) => {
  switch (priority) {
    case 'Khẩn cấp':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    case 'Cao':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'Trung bình':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    default:
      return 'bg-slate-700/40 text-slate-300 border-slate-600/50';
  }
};

const getTaskStatusBadge = (status: ProjectTaskStatus) => {
  switch (status) {
    case 'Hoàn thành':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'Đang làm':
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    case 'Chờ duyệt':
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    default:
      return 'bg-slate-700/40 text-slate-300 border-slate-600/50';
  }
};

const getRiskLevelBadge = (level: ProjectRiskLevel) => {
  switch (level) {
    case 'Cao':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    case 'Trung bình':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    default:
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  }
};

const parseDateMs = (iso: string): number => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Date.parse(TODAY_REF) : t;
};

export const ProjectsTab: React.FC = () => {
  const {
    projects,
    equipment,
    employees,
    currentUser,
    emailConfig,
    addProject,
    updateProject,
    deleteProject,
    sendEmailNotification,
  } = useCMMS();
  const showCosts = canViewCosts(currentUser);
  const canDelete = canDeleteRecords(currentUser);

  // Portfolio Filters & View State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Tất cả');
  const [filterCategory, setFilterCategory] = useState<string>('Tất cả');
  const [filterPriority, setFilterPriority] = useState<string>('Tất cả');
  const [onlyMyProjects, setOnlyMyProjects] = useState(false);
  const [portfolioView, setPortfolioView] = useState<'cards' | 'table' | 'charts'>('cards');

  // Selected Project Workspace
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<
    'overview' | 'tasks' | 'gantt' | 'budget' | 'risks'
  >('overview');
  const [tasksViewMode, setTasksViewMode] = useState<'kanban' | 'list'>('kanban');

  // Feedback banner
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackKind, setFeedbackKind] = useState<'success' | 'warning'>('success');
  const [pendingTaskEmail, setPendingTaskEmail] = useState<{
    task: ProjectTask;
    recipientStr: string;
  } | null>(null);

  // Project Create / Edit Modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<FacilityProject | null>(null);
  const [prjForm, setPrjForm] = useState({
    maDuAn: '',
    tenDuAn: '',
    danhMuc: 'Nâng cấp hạ tầng' as ProjectCategory,
    moTa: '',
    mucTieu: '',
    phamVi: '',
    trangThai: 'Lập kế hoạch' as ProjectStatus,
    uuTien: 'Trung bình' as ProjectPriority,
    quanLyDuAn: currentUser.tenNhanVien,
    thanhVien: currentUser.tenNhanVien,
    ngayBatDau: TODAY_REF,
    ngayKetThucDuKien: '2026-12-30',
    nganSachDuKien: 100000000,
    chiPhiThucTe: 0,
    maThietBiLienQuan: [] as string[],
  });

  // Delete confirmation modal
  const [projectToDelete, setProjectToDelete] = useState<FacilityProject | null>(null);

  // WBS Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [taskForm, setTaskForm] = useState({
    maCongViec: '',
    tieuDe: '',
    moTa: '',
    giaiDoan: 'Giai đoạn 1: Khảo sát & Chuẩn bị',
    nguoiPhuTrach: '',
    trangThai: 'Cần làm' as ProjectTaskStatus,
    uuTien: 'Trung bình' as ProjectPriority,
    ngayBatDau: TODAY_REF,
    hanHoanThanh: '2026-11-25',
    tienDo: 0,
    gioDuKien: 8,
    gioThucTe: 0,
  });

  // Inline Forms inside Workspace (Milestones, Expenses, Risks)
  const [newMilestone, setNewMilestone] = useState({
    tenMoc: '',
    hanHoanThanh: '2026-11-30',
    ghiChu: '',
  });
  const [newExpense, setNewExpense] = useState({
    ngay: TODAY_REF,
    hangMuc: '',
    nhaCungCap: '',
    soTienVND: 0,
    trangThai: 'Dự toán' as ProjectExpense['trangThai'],
  });
  const [newRisk, setNewRisk] = useState({
    moTa: '',
    mucDo: 'Trung bình' as ProjectRiskLevel,
    giaiPhap: '',
    nguoiPhuTrach: currentUser.tenNhanVien,
  });

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const showToast = (msg: string, kind: 'success' | 'warning' = 'success') => {
    setFeedbackKind(kind);
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return projects.filter((p) => {
      if (filterStatus !== 'Tất cả' && p.trangThai !== filterStatus) return false;
      if (filterCategory !== 'Tất cả' && p.danhMuc !== filterCategory) return false;
      if (filterPriority !== 'Tất cả' && p.uuTien !== filterPriority) return false;
      if (onlyMyProjects) {
        const isPM = matchesAssignee(p.quanLyDuAn, currentUser);
        const isMember = matchesAssignee(p.thanhVien, currentUser);
        const hasTask = p.congViec.some((t) => matchesAssignee(t.nguoiPhuTrach, currentUser));
        if (!isPM && !isMember && !hasTask) return false;
      }
      if (q) {
        const hay = `${p.maDuAn} ${p.tenDuAn} ${p.danhMuc} ${p.quanLyDuAn} ${p.thanhVien} ${p.moTa} ${(p.maThietBiLienQuan || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [projects, searchTerm, filterStatus, filterCategory, filterPriority, onlyMyProjects, currentUser]);

  // Portfolio KPI Metrics
  const portfolioStats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(
      (p) => p.trangThai === 'Đang triển khai' || p.trangThai === 'Chờ nghiệm thu'
    ).length;
    const completed = projects.filter((p) => p.trangThai === 'Hoàn thành').length;

    const avgProgress =
      total > 0
        ? Math.round(projects.reduce((sum, p) => sum + calculateProjectProgress(p), 0) / total)
        : 0;

    const allTasks = projects.flatMap((p) => p.congViec);
    const doneTasks = allTasks.filter((t) => t.trangThai === 'Hoàn thành').length;
    const overdueTasks = allTasks.filter(
      (t) => t.trangThai !== 'Hoàn thành' && t.hanHoanThanh < TODAY_REF
    ).length;
    const overdueMilestones = projects
      .flatMap((p) => p.cotMoc)
      .filter((m) => !m.daDat && m.hanHoanThanh < TODAY_REF).length;

    const totalBudget = projects.reduce((sum, p) => sum + (p.nganSachDuKien || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.chiPhiThucTe || 0), 0);
    const budgetRatio = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    return {
      total,
      active,
      completed,
      avgProgress,
      totalTasks: allTasks.length,
      doneTasks,
      overdueTasks,
      overdueMilestones,
      totalBudget,
      totalSpent,
      budgetRatio,
    };
  }, [projects]);

  // Open Create Project
  const handleOpenCreateProject = () => {
    const nextCode = `DA-${new Date().getFullYear().toString().slice(-2)}-${String(projects.length + 1).padStart(3, '0')}`;
    setEditingProject(null);
    setPrjForm({
      maDuAn: nextCode,
      tenDuAn: '',
      danhMuc: 'Nâng cấp hạ tầng',
      moTa: '',
      mucTieu: '',
      phamVi: '',
      trangThai: 'Lập kế hoạch',
      uuTien: 'Trung bình',
      quanLyDuAn: currentUser.tenNhanVien,
      thanhVien: currentUser.tenNhanVien,
      ngayBatDau: TODAY_REF,
      ngayKetThucDuKien: '2026-12-30',
      nganSachDuKien: 100000000,
      chiPhiThucTe: 0,
      maThietBiLienQuan: [],
    });
    setIsProjectModalOpen(true);
  };

  // Open Edit Project
  const handleOpenEditProject = (p: FacilityProject) => {
    setEditingProject(p);
    setPrjForm({
      maDuAn: p.maDuAn,
      tenDuAn: p.tenDuAn,
      danhMuc: p.danhMuc,
      moTa: p.moTa,
      mucTieu: p.mucTieu,
      phamVi: p.phamVi || '',
      trangThai: p.trangThai,
      uuTien: p.uuTien,
      quanLyDuAn: p.quanLyDuAn,
      thanhVien: p.thanhVien,
      ngayBatDau: p.ngayBatDau,
      ngayKetThucDuKien: p.ngayKetThucDuKien,
      nganSachDuKien: p.nganSachDuKien,
      chiPhiThucTe: p.chiPhiThucTe,
      maThietBiLienQuan: p.maThietBiLienQuan || [],
    });
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prjForm.maDuAn.trim() || !prjForm.tenDuAn.trim()) return;

    const plannedBudget = showCosts
      ? Number(prjForm.nganSachDuKien) || 0
      : editingProject
      ? editingProject.nganSachDuKien
      : 0;
    const actualSpent = showCosts
      ? Number(prjForm.chiPhiThucTe) || 0
      : editingProject
      ? editingProject.chiPhiThucTe
      : 0;

    if (editingProject) {
      updateProject({
        ...editingProject,
        ...prjForm,
        nganSachDuKien: plannedBudget,
        chiPhiThucTe: actualSpent,
        ngayCapNhat: TODAY_REF,
      });
      showToast(`Đã cập nhật dự án ${prjForm.maDuAn}.`);
    } else {
      addProject({
        ...prjForm,
        nganSachDuKien: plannedBudget,
        chiPhiThucTe: actualSpent,
        congViec: [],
        cotMoc: [],
        ruiRo: [],
        khoanChi: [],
        ngayCapNhat: TODAY_REF,
      });
      showToast(`Đã tạo dự án mới ${prjForm.maDuAn}.`);
    }
    setIsProjectModalOpen(false);
  };

  const handleConfirmDeleteProject = () => {
    if (!projectToDelete || !canDelete) return;
    if (selectedProjectId === projectToDelete.id) {
      setSelectedProjectId(null);
    }
    deleteProject(projectToDelete.id);
    showToast(`Đã xóa dự án ${projectToDelete.maDuAn}.`);
    setProjectToDelete(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Mã Dự Án',
      'Tên Dự Án',
      'Danh Mục',
      'Trạng Thái',
      'Ưu Tiên',
      'PM',
      'Thành Viên',
      'Ngày Bắt Đầu',
      'Hạn Hoàn Thành',
      'Tiến Độ (%)',
      ...(showCosts ? ['Ngân Sách (VNĐ)', 'Thực Chi (VNĐ)'] : []),
    ];
    const rows = filteredProjects.map((p) => [
      p.maDuAn,
      `"${p.tenDuAn.replace(/"/g, '""')}"`,
      `"${p.danhMuc}"`,
      p.trangThai,
      p.uuTien,
      `"${p.quanLyDuAn}"`,
      `"${p.thanhVien}"`,
      p.ngayBatDau,
      p.ngayKetThucDuKien,
      calculateProjectProgress(p),
      ...(showCosts ? [p.nganSachDuKien, p.chiPhiThucTe] : []),
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quan_ly_Du_an_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export Excel
  const handleExportExcel = () => {
    const activeFilters = [
      filterStatus !== 'Tất cả' ? `Trạng thái: ${filterStatus}` : '',
      filterCategory !== 'Tất cả' ? `Danh mục: ${filterCategory}` : '',
      onlyMyProjects ? 'Dự án của tôi' : '',
    ]
      .filter(Boolean)
      .join(', ');
    exportProjectsWorkbook(filteredProjects, {
      exportedBy: currentUser.tenNhanVien,
      includePrintLayout: true,
      includeCosts: showCosts,
      filterNote: activeFilters || undefined,
    });
    showToast(`Đã xuất file Excel (${filteredProjects.length} dự án).`);
  };

  // Workspace Helpers for Selected Project
  const handleOpenAddTask = (defaultStatus: ProjectTaskStatus = 'Cần làm') => {
    if (!selectedProject) return;
    const nextWbs = `WBS-${selectedProject.congViec.length + 1}.0`;
    setEditingTask(null);
    setTaskForm({
      maCongViec: nextWbs,
      tieuDe: '',
      moTa: '',
      giaiDoan: 'Giai đoạn 2: Thi công & Lắp đặt',
      nguoiPhuTrach: '',
      trangThai: defaultStatus,
      uuTien: 'Trung bình',
      ngayBatDau: selectedProject.ngayBatDau || TODAY_REF,
      hanHoanThanh: selectedProject.ngayKetThucDuKien || '2026-12-15',
      tienDo: defaultStatus === 'Hoàn thành' ? 100 : defaultStatus === 'Đang làm' ? 30 : 0,
      gioDuKien: 16,
      gioThucTe: 0,
    });
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: ProjectTask) => {
    setEditingTask(task);
    setTaskForm({
      maCongViec: task.maCongViec,
      tieuDe: task.tieuDe,
      moTa: task.moTa || '',
      giaiDoan: task.giaiDoan || 'Giai đoạn 1',
      nguoiPhuTrach: task.nguoiPhuTrach,
      trangThai: task.trangThai,
      uuTien: task.uuTien,
      ngayBatDau: task.ngayBatDau,
      hanHoanThanh: task.hanHoanThanh,
      tienDo: task.tienDo,
      gioDuKien: task.gioDuKien ?? 8,
      gioThucTe: task.gioThucTe ?? 0,
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !taskForm.tieuDe.trim()) return;
    const normalizedProgress =
      taskForm.trangThai === 'Hoàn thành'
        ? 100
        : taskForm.trangThai === 'Cần làm' && taskForm.tienDo === 100
        ? 0
        : Math.min(100, Math.max(0, Number(taskForm.tienDo) || 0));

    let updatedTasks: ProjectTask[];
    if (editingTask) {
      updatedTasks = selectedProject.congViec.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              ...taskForm,
              tienDo: normalizedProgress,
              gioDuKien: Number(taskForm.gioDuKien) || 0,
              gioThucTe: Number(taskForm.gioThucTe) || 0,
            }
          : t
      );
      showToast(`Đã cập nhật đầu việc ${taskForm.maCongViec}.`);
    } else {
      const newTask: ProjectTask = {
        id: `TSK-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...taskForm,
        tienDo: normalizedProgress,
        gioDuKien: Number(taskForm.gioDuKien) || 0,
        gioThucTe: Number(taskForm.gioThucTe) || 0,
      };
      updatedTasks = [...selectedProject.congViec, newTask];
      showToast(`Đã thêm đầu việc ${newTask.maCongViec}.`);
    }

    updateProject({
      ...selectedProject,
      congViec: updatedTasks,
      ngayCapNhat: TODAY_REF,
    });
    setIsTaskModalOpen(false);
  };

  const handleChangeTaskStatus = (taskId: string, nextStatus: ProjectTaskStatus) => {
    if (!selectedProject) return;
    const updatedTasks = selectedProject.congViec.map((t) => {
      if (t.id !== taskId) return t;
      const nextProgress =
        nextStatus === 'Hoàn thành'
          ? 100
          : nextStatus === 'Chờ duyệt'
          ? Math.max(t.tienDo, 90)
          : nextStatus === 'Đang làm'
          ? Math.max(t.tienDo, 25)
          : 0;
      return { ...t, trangThai: nextStatus, tienDo: nextProgress };
    });
    updateProject({ ...selectedProject, congViec: updatedTasks, ngayCapNhat: TODAY_REF });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!selectedProject || !canDelete) return;
    updateProject({
      ...selectedProject,
      congViec: selectedProject.congViec.filter((t) => t.id !== taskId),
      ngayCapNhat: TODAY_REF,
    });
    showToast('Đã xóa đầu việc WBS.');
  };

  const handleNotifyTaskAssignees = (task: ProjectTask) => {
    if (!selectedProject) return;
    const names = parseAssigneeNames(task.nguoiPhuTrach);
    const emails = resolveAssigneeEmails(names, employees, emailConfig.primaryRecipient);
    const recipientStr = emails.join(', ') || emailConfig.primaryRecipient;
    setPendingTaskEmail({ task, recipientStr });
  };

  const executeNotifyTaskAssignees = async () => {
    if (!selectedProject || !pendingTaskEmail) return;
    const { task, recipientStr } = pendingTaskEmail;
    setPendingTaskEmail(null);
    const result = await sendEmailNotification({
      type: 'GIAO_VIEC',
      subject: `[Dự Án ${selectedProject.maDuAn}] Giao việc ${task.maCongViec}: ${task.tieuDe}`,
      body: `Kính gửi ${task.nguoiPhuTrach || 'Nhóm dự án'},\n\nBạn được phân công đầu việc thuộc dự án "${selectedProject.tenDuAn}" (${selectedProject.maDuAn}):\n- Mã đầu việc: ${task.maCongViec}\n- Nội dung: ${task.tieuDe}\n- Giai đoạn: ${task.giaiDoan || '-'}\n- Thời gian: ${formatDateVN(task.ngayBatDau)} → ${formatDateVN(task.hanHoanThanh)}\n- Người giao: ${currentUser.tenNhanVien}\n\nVui lòng cập nhật tiến độ trên hệ thống FACILITY SYSTEM MANAGEMENT.`,
      recipient: recipientStr,
      relatedId: `${selectedProject.maDuAn}-${task.maCongViec}`,
      interactiveFallback: true,
      userConfirmed: true,
    });
    showToast(
      result.success
        ? `Đã tự động gửi email thông báo đầu việc ${task.maCongViec} tới ${result.recipient}.`
        : `Chưa gửi được email đầu việc ${task.maCongViec}: ${result.message}`,
      result.success ? 'success' : 'warning'
    );
  };

  // Milestones
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newMilestone.tenMoc.trim()) return;
    const created: ProjectMilestone = {
      id: `MS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenMoc: newMilestone.tenMoc.trim(),
      hanHoanThanh: newMilestone.hanHoanThanh,
      daDat: false,
      ghiChu: newMilestone.ghiChu.trim(),
    };
    updateProject({
      ...selectedProject,
      cotMoc: [...selectedProject.cotMoc, created],
      ngayCapNhat: TODAY_REF,
    });
    setNewMilestone({ tenMoc: '', hanHoanThanh: selectedProject.ngayKetThucDuKien || '2026-12-01', ghiChu: '' });
  };

  const handleToggleMilestone = (msId: string) => {
    if (!selectedProject) return;
    updateProject({
      ...selectedProject,
      cotMoc: selectedProject.cotMoc.map((m) => (m.id === msId ? { ...m, daDat: !m.daDat } : m)),
      ngayCapNhat: TODAY_REF,
    });
  };

  const handleDeleteMilestone = (msId: string) => {
    if (!selectedProject || !canDelete) return;
    updateProject({
      ...selectedProject,
      cotMoc: selectedProject.cotMoc.filter((m) => m.id !== msId),
      ngayCapNhat: TODAY_REF,
    });
  };

  // Expenses (sync chiPhiThucTe automatically with sum of 'Đã chi')
  const recomputeSpentCost = (expenses: ProjectExpense[], fallback: number): number => {
    if (expenses.length === 0) return fallback;
    return expenses
      .filter((item) => item.trangThai === 'Đã chi')
      .reduce((sum, item) => sum + (item.soTienVND || 0), 0);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newExpense.hangMuc.trim() || newExpense.soTienVND <= 0) return;
    const item: ProjectExpense = {
      id: `EXP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ngay: newExpense.ngay,
      hangMuc: newExpense.hangMuc.trim(),
      nhaCungCap: newExpense.nhaCungCap.trim(),
      soTienVND: Number(newExpense.soTienVND) || 0,
      trangThai: newExpense.trangThai,
    };
    const nextExpenses = [item, ...selectedProject.khoanChi];
    updateProject({
      ...selectedProject,
      khoanChi: nextExpenses,
      chiPhiThucTe: recomputeSpentCost(nextExpenses, selectedProject.chiPhiThucTe),
      ngayCapNhat: TODAY_REF,
    });
    setNewExpense({ ngay: TODAY_REF, hangMuc: '', nhaCungCap: '', soTienVND: 0, trangThai: 'Dự toán' });
  };

  const handleCycleExpenseStatus = (expId: string) => {
    if (!selectedProject) return;
    const order: ProjectExpense['trangThai'][] = ['Dự toán', 'Đã duyệt', 'Đã chi'];
    const nextExpenses = selectedProject.khoanChi.map((ex) => {
      if (ex.id !== expId) return ex;
      const nextIdx = (order.indexOf(ex.trangThai) + 1) % order.length;
      return { ...ex, trangThai: order[nextIdx] };
    });
    updateProject({
      ...selectedProject,
      khoanChi: nextExpenses,
      chiPhiThucTe: recomputeSpentCost(nextExpenses, selectedProject.chiPhiThucTe),
      ngayCapNhat: TODAY_REF,
    });
  };

  const handleDeleteExpense = (expId: string) => {
    if (!selectedProject || !canDelete) return;
    const nextExpenses = selectedProject.khoanChi.filter((ex) => ex.id !== expId);
    updateProject({
      ...selectedProject,
      khoanChi: nextExpenses,
      chiPhiThucTe: recomputeSpentCost(nextExpenses, 0),
      ngayCapNhat: TODAY_REF,
    });
  };

  // Risks (RAID)
  const handleAddRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newRisk.moTa.trim()) return;
    const risk: ProjectRisk = {
      id: `RSK-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      moTa: newRisk.moTa.trim(),
      mucDo: newRisk.mucDo,
      giaiPhap: newRisk.giaiPhap.trim() || 'Đang lập phương án ứng phó',
      trangThai: 'Đang theo dõi',
      nguoiPhuTrach: newRisk.nguoiPhuTrach.trim() || selectedProject.quanLyDuAn,
    };
    updateProject({
      ...selectedProject,
      ruiRo: [risk, ...selectedProject.ruiRo],
      ngayCapNhat: TODAY_REF,
    });
    setNewRisk({
      moTa: '',
      mucDo: 'Trung bình',
      giaiPhap: '',
      nguoiPhuTrach: currentUser.tenNhanVien,
    });
  };

  const handleToggleRiskStatus = (riskId: string) => {
    if (!selectedProject) return;
    updateProject({
      ...selectedProject,
      ruiRo: selectedProject.ruiRo.map((r) =>
        r.id === riskId
          ? { ...r, trangThai: r.trangThai === 'Đang theo dõi' ? 'Đã xử lý' : 'Đang theo dõi' }
          : r
      ),
      ngayCapNhat: TODAY_REF,
    });
  };

  const handleDeleteRisk = (riskId: string) => {
    if (!selectedProject || !canDelete) return;
    updateProject({
      ...selectedProject,
      ruiRo: selectedProject.ruiRo.filter((r) => r.id !== riskId),
      ngayCapNhat: TODAY_REF,
    });
  };

  // Gantt Timeline computation for selected project
  const ganttBounds = useMemo(() => {
    if (!selectedProject) return null;
    const dates = [
      selectedProject.ngayBatDau,
      selectedProject.ngayKetThucDuKien,
      TODAY_REF,
      ...selectedProject.congViec.flatMap((t) => [t.ngayBatDau, t.hanHoanThanh]),
      ...selectedProject.cotMoc.map((m) => m.hanHoanThanh),
    ].filter(Boolean);

    const msList = dates.map(parseDateMs);
    const minMs = Math.min(...msList);
    const maxMs = Math.max(...msList);
    const spanMs = Math.max(86400000 * 7, maxMs - minMs);
    const todayPct = Math.min(100, Math.max(0, ((parseDateMs(TODAY_REF) - minMs) / spanMs) * 100));

    return { minMs, maxMs, spanMs, todayPct };
  }, [selectedProject]);

  // Render Workspace if a project is selected
  const renderProjectWorkspace = (project: FacilityProject) => {
    const progress = calculateProjectProgress(project);
    const doneTasks = project.congViec.filter((t) => t.trangThai === 'Hoàn thành').length;
    const budgetPlanned = project.nganSachDuKien || 0;
    const budgetApproved = project.khoanChi
      .filter((k) => k.trangThai === 'Đã duyệt' || k.trangThai === 'Đã chi')
      .reduce((s, k) => s + k.soTienVND, 0);
    const budgetSpent = project.chiPhiThucTe || 0;
    const budgetPct = budgetPlanned > 0 ? Math.min(150, Math.round((budgetSpent / budgetPlanned) * 100)) : 0;
    const openRisks = project.ruiRo.filter((r) => r.trangThai === 'Đang theo dõi').length;

    return (
      <div className="space-y-5">
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition min-h-[36px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Danh mục dự án</span>
              </button>
              <span className="font-mono font-bold text-indigo-300">{project.maDuAn}</span>
              <span>·</span>
              <span>{project.danhMuc}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 leading-snug">
                {project.tenDuAn}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${getProjectStatusBadge(
                  project.trangThai
                )}`}
              >
                {project.trangThai}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${getPriorityBadge(
                  project.uuTien
                )}`}
              >
                Ưu tiên: {project.uuTien}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={project.trangThai}
              onChange={(e) =>
                updateProject({
                  ...project,
                  trangThai: e.target.value as ProjectStatus,
                  ngayCapNhat: TODAY_REF,
                })
              }
              aria-label="Cập nhật trạng thái dự án"
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[38px]"
            >
              {PROJECT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  Trạng thái: {st}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleOpenEditProject(project)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition min-h-[38px]"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sửa Dự Án</span>
            </button>

            {canDelete && (
              <button
                type="button"
                onClick={() => setProjectToDelete(project)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-semibold transition min-h-[38px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            )}
          </div>
        </div>

        {/* Project Summary Strip */}
        <div className={`grid ${showCosts ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'} gap-3`}>
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Tiến Độ Hoàn Thành</span>
              <span className="font-mono font-bold text-cyan-300 tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  progress >= 100
                    ? 'bg-emerald-500'
                    : progress >= 50
                    ? 'bg-cyan-500'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 tabular-nums">
              {doneTasks}/{project.congViec.length} đầu việc WBS hoàn tất
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Khung Thời Gian</span>
            </div>
            <div className="text-sm font-bold text-slate-100 tabular-nums">
              {formatDateVN(project.ngayBatDau)} → {formatDateVN(project.ngayKetThucDuKien)}
            </div>
            <div className="text-[11px] text-slate-400">
              Cột mốc: {project.cotMoc.filter((m) => m.daDat).length}/{project.cotMoc.length} đã đạt
            </div>
          </div>

          {showCosts && (
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Thực Chi / Ngân Sách</span>
              </div>
              <div className="text-sm font-bold text-slate-100 tabular-nums">
                {formatVND(budgetSpent)}
              </div>
              <div className="text-[11px] text-slate-400 tabular-nums">
                Dự toán: {formatVND(budgetPlanned)} ({budgetPct}%)
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Nhân Sự & Rủi Ro</span>
            </div>
            <div className="text-sm font-bold text-slate-100 truncate">
              PM: {project.quanLyDuAn}
            </div>
            <div className="text-[11px] text-slate-400">
              {parseAssigneeNames(project.thanhVien).length} thành viên · {openRisks} rủi ro đang mở
            </div>
          </div>
        </div>

        {/* Workspace Sub-Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          {[
            { id: 'overview', label: 'Tổng Quan & Cột Mốc', icon: Target },
            {
              id: 'tasks',
              label: `Công Việc WBS & Kanban (${project.congViec.length})`,
              icon: Kanban,
            },
            { id: 'gantt', label: 'Timeline / Gantt', icon: GanttChartSquare },
            ...(showCosts
              ? [
                  {
                    id: 'budget',
                    label: `Ngân Sách & Chi Phí (${project.khoanChi.length})`,
                    icon: DollarSign,
                  },
                ]
              : []),
            {
              id: 'risks',
              label: `Rủi Ro RAID (${openRisks}/${project.ruiRo.length})`,
              icon: ShieldAlert,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = workspaceTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setWorkspaceTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition min-h-[38px] ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900/70 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* SUB-TAB 1: OVERVIEW & MILESTONES */}
        {workspaceTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Hồ Sơ Dự Án (Project Charter)</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="text-slate-400 font-semibold mb-1">Mục tiêu chính</div>
                    <p className="text-slate-200 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                      {project.mucTieu || 'Chưa cập nhật mục tiêu.'}
                    </p>
                  </div>
                  <div>
                    <div className="text-slate-400 font-semibold mb-1">Phạm vi triển khai</div>
                    <p className="text-slate-200 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                      {project.phamVi || 'Chưa xác định phạm vi.'}
                    </p>
                  </div>
                  <div>
                    <div className="text-slate-400 font-semibold mb-1">Mô tả chi tiết</div>
                    <p className="text-slate-300 leading-relaxed">
                      {project.moTa || 'Không có mô tả bổ sung.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Team & Linked Equipment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Ban Quản Lý & Nhóm Dự Án</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Quản lý dự án (PM):{' '}
                    <span className="font-bold text-slate-100">{project.quanLyDuAn}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {parseAssigneeNames(project.thanhVien).map((member) => (
                      <span
                        key={member}
                        className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-200"
                      >
                        {member}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>Thiết Bị & Hệ Thống Liên Quan</span>
                  </div>
                  {project.maThietBiLienQuan && project.maThietBiLienQuan.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {project.maThietBiLienQuan.map((code) => {
                        const eq = equipment.find((e) => e.maThietBi === code);
                        return (
                          <div
                            key={code}
                            className="p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-xs flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="font-mono font-bold text-cyan-400">{code}</span>
                              {eq && (
                                <span className="text-slate-300 ml-2 truncate">
                                  {eq.tenThietBi}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Chưa gắn mã thiết bị cụ thể.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Milestones Checklist */}
            <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-emerald-400" />
                  <span>Cột Mốc Quan Trọng (Milestones)</span>
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                  {project.cotMoc.filter((m) => m.daDat).length}/{project.cotMoc.length}
                </span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {project.cotMoc.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Chưa có cột mốc nào. Thêm cột mốc bên dưới.
                  </p>
                ) : (
                  project.cotMoc.map((ms) => {
                    const isLate = !ms.daDat && ms.hanHoanThanh < TODAY_REF;
                    return (
                      <div
                        key={ms.id}
                        className={`p-3 rounded-lg border flex items-start justify-between gap-2 transition ${
                          ms.daDat
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : isLate
                            ? 'bg-rose-950/20 border-rose-500/30'
                            : 'bg-slate-950/50 border-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleMilestone(ms.id)}
                          className="flex items-start gap-2.5 text-left flex-1 min-w-0"
                        >
                          {ms.daDat ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <div
                              className={`text-xs font-semibold ${
                                ms.daDat ? 'line-through text-slate-400' : 'text-slate-100'
                              }`}
                            >
                              {ms.tenMoc}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                              Hạn: {formatDateVN(ms.hanHoanThanh)}
                              {isLate && (
                                <span className="text-rose-400 font-bold ml-1.5">· Quá hạn</span>
                              )}
                              {ms.ghiChu && <span className="ml-1.5">· {ms.ghiChu}</span>}
                            </div>
                          </div>
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMilestone(ms.id)}
                            aria-label="Xóa cột mốc"
                            className="p-1 text-slate-500 hover:text-rose-400 transition shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={handleAddMilestone}
                className="pt-3 border-t border-slate-800 space-y-2"
              >
                <div className="text-xs font-semibold text-slate-300">Thêm cột mốc mới</div>
                <input
                  type="text"
                  value={newMilestone.tenMoc}
                  onChange={(e) => setNewMilestone({ ...newMilestone, tenMoc: e.target.value })}
                  placeholder="Tên cột mốc (VD: Nghiệm thu chạy thử 72h)..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={newMilestone.hanHoanThanh}
                    onChange={(e) =>
                      setNewMilestone({ ...newMilestone, hanHoanThanh: e.target.value })
                    }
                    className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition min-h-[36px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Mốc</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-TAB 2: WBS TASKS & KANBAN BOARD */}
        {workspaceTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTasksViewMode('kanban')}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition min-h-[38px] ${
                    tasksViewMode === 'kanban'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Bảng Kanban</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTasksViewMode('list')}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition min-h-[38px] ${
                    tasksViewMode === 'list'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  <span>Danh Sách WBS</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddTask('Cần làm')}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition min-h-[38px]"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Đầu Việc WBS</span>
              </button>
            </div>

            {tasksViewMode === 'kanban' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {TASK_STATUSES.map((colStatus) => {
                  const colTasks = project.congViec.filter((t) => t.trangThai === colStatus);
                  return (
                    <div
                      key={colStatus}
                      className="rounded-xl bg-slate-900/70 border border-slate-800 p-3 flex flex-col gap-2.5 min-h-[260px]"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span
                          className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${getTaskStatusBadge(
                            colStatus
                          )}`}
                        >
                          {colStatus}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-slate-400 tabular-nums">
                            {colTasks.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenAddTask(colStatus)}
                            aria-label={`Thêm việc vào ${colStatus}`}
                            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2.5 flex-1">
                        {colTasks.length === 0 ? (
                          <div className="py-8 text-center text-[11px] text-slate-500">
                            Chưa có đầu việc
                          </div>
                        ) : (
                          colTasks.map((task) => {
                            const isLate =
                              task.trangThai !== 'Hoàn thành' && task.hanHoanThanh < TODAY_REF;
                            return (
                              <div
                                key={task.id}
                                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="text-[11px] font-mono font-bold text-indigo-400">
                                      {task.maCongViec}
                                      {task.giaiDoan && (
                                        <span className="font-sans text-slate-500 font-normal ml-1.5">
                                          · {task.giaiDoan}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs font-bold text-slate-100 mt-0.5 leading-snug">
                                      {task.tieuDe}
                                    </div>
                                  </div>
                                  <span
                                    className={`px-1.5 py-0.5 rounded border text-[10px] font-bold shrink-0 ${getPriorityBadge(
                                      task.uuTien
                                    )}`}
                                  >
                                    {task.uuTien}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-400 space-y-1">
                                  <div className="truncate">
                                    Phụ trách:{' '}
                                    <span className="text-slate-200 font-medium">
                                      {task.nguoiPhuTrach || 'Chưa phân công'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between tabular-nums">
                                    <span className={isLate ? 'text-rose-400 font-bold' : ''}>
                                      Hạn: {formatDateVN(task.hanHoanThanh)}
                                    </span>
                                    <span className="font-mono font-bold text-cyan-400">
                                      {task.tienDo}%
                                    </span>
                                  </div>
                                </div>

                                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      task.trangThai === 'Hoàn thành'
                                        ? 'bg-emerald-500'
                                        : isLate
                                        ? 'bg-rose-500'
                                        : 'bg-cyan-500'
                                    }`}
                                    style={{ width: `${task.tienDo}%` }}
                                  />
                                </div>

                                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                                  <select
                                    value={task.trangThai}
                                    onChange={(e) =>
                                      handleChangeTaskStatus(
                                        task.id,
                                        e.target.value as ProjectTaskStatus
                                      )
                                    }
                                    aria-label="Chuyển trạng thái công việc"
                                    className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-[11px] text-slate-200 focus:outline-none"
                                  >
                                    {TASK_STATUSES.map((st) => (
                                      <option key={st} value={st}>
                                        {st}
                                      </option>
                                    ))}
                                  </select>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleNotifyTaskAssignees(task)}
                                      title="Gửi email giao việc"
                                      className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-cyan-400 transition"
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditTask(task)}
                                      title="Sửa đầu việc"
                                      className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    {canDelete && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTask(task.id)}
                                        title="Xóa đầu việc"
                                        className="p-1.5 rounded-md bg-slate-900 hover:bg-rose-950/60 text-rose-400 transition"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                {/* Mobile Card View (< md) */}
                <div className="md:hidden space-y-2.5">
                  {project.congViec.map((task) => {
                    const isLate =
                      task.trangThai !== 'Hoàn thành' && task.hanHoanThanh < TODAY_REF;
                    return (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[11px] font-mono font-bold text-indigo-400">
                              {task.maCongViec} · {task.giaiDoan}
                            </div>
                            <div className="text-sm font-bold text-slate-100 leading-snug">
                              {task.tieuDe}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[11px] font-bold shrink-0 ${getTaskStatusBadge(
                              task.trangThai
                            )}`}
                          >
                            {task.trangThai}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 space-y-0.5 tabular-nums">
                          <div>Phụ trách: {task.nguoiPhuTrach || 'Chưa phân công'}</div>
                          <div className={isLate ? 'text-rose-400 font-semibold' : ''}>
                            Thời gian: {formatDateVN(task.ngayBatDau)} →{' '}
                            {formatDateVN(task.hanHoanThanh)} · Tiến độ: {task.tienDo}%
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                          <select
                            value={task.trangThai}
                            onChange={(e) =>
                              handleChangeTaskStatus(task.id, e.target.value as ProjectTaskStatus)
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100"
                          >
                            {TASK_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleNotifyTaskAssignees(task)}
                              className="p-2 rounded-lg bg-slate-800 text-cyan-400"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditTask(task)}
                              className="p-2 rounded-lg bg-slate-800 text-slate-200"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-2 rounded-lg bg-rose-950/60 text-rose-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop WBS Table (>= md) */}
                <div className="hidden md:block rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
                  <SmartHorizontalScroll>
                    <table className="w-full text-left border-collapse min-w-[920px]">
                      <thead>
                        <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                          <th className="py-3 px-3">Mã WBS</th>
                          <th className="py-3 px-3">Tên Đầu Việc & Giai Đoạn</th>
                          <th className="py-3 px-3">Người Thực Hiện</th>
                          <th className="py-3 px-3">Thời Gian</th>
                          <th className="py-3 px-3">Trạng Thái</th>
                          <th className="py-3 px-3">Tiến Độ</th>
                          <th className="py-3 px-3">Giờ Công</th>
                          <th className="py-3 px-3 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70 text-xs">
                        {project.congViec.map((task) => {
                          const isLate =
                            task.trangThai !== 'Hoàn thành' && task.hanHoanThanh < TODAY_REF;
                          return (
                            <tr key={task.id} className="hover:bg-slate-800/30 transition">
                              <td className="py-3 px-3 font-mono font-bold text-indigo-300">
                                {task.maCongViec}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-100">{task.tieuDe}</div>
                                {task.giaiDoan && (
                                  <div className="text-[11px] text-slate-400">{task.giaiDoan}</div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-slate-300">
                                {task.nguoiPhuTrach || '-'}
                              </td>
                              <td
                                className={`py-3 px-3 tabular-nums ${
                                  isLate ? 'text-rose-400 font-semibold' : 'text-slate-300'
                                }`}
                              >
                                {formatDateVN(task.ngayBatDau)} → {formatDateVN(task.hanHoanThanh)}
                              </td>
                              <td className="py-3 px-3">
                                <select
                                  value={task.trangThai}
                                  onChange={(e) =>
                                    handleChangeTaskStatus(
                                      task.id,
                                      e.target.value as ProjectTaskStatus
                                    )
                                  }
                                  className={`px-2 py-1 rounded-md border text-[11px] font-bold bg-slate-900 ${getTaskStatusBadge(
                                    task.trangThai
                                  )}`}
                                >
                                  {TASK_STATUSES.map((st) => (
                                    <option key={st} value={st}>
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 px-3 tabular-nums">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                      className="h-full bg-cyan-500 rounded-full"
                                      style={{ width: `${task.tienDo}%` }}
                                    />
                                  </div>
                                  <span className="font-mono font-bold text-cyan-300">
                                    {task.tienDo}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-300 tabular-nums">
                                {task.gioThucTe ?? 0}/{task.gioDuKien ?? 0}h
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleNotifyTaskAssignees(task)}
                                    title="Gửi email giao việc"
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditTask(task)}
                                    title="Sửa đầu việc"
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {canDelete && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTask(task.id)}
                                      title="Xóa đầu việc"
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-400 transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </SmartHorizontalScroll>
                </div>
              </>
            )}
          </div>
        )}

        {/* SUB-TAB 3: TIMELINE / GANTT CHART */}
        {workspaceTab === 'gantt' && ganttBounds && (
          <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <GanttChartSquare className="w-4 h-4 text-cyan-400" />
                  <span>Biểu Đồ Tiến Độ Gantt & Cột Mốc</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                  Khung thời gian: {formatDateVN(new Date(ganttBounds.minMs).toISOString().slice(0, 10))}{' '}
                  → {formatDateVN(new Date(ganttBounds.maxMs).toISOString().slice(0, 10))} · Mốc hiện
                  tại ({formatDateVN(TODAY_REF)})
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded bg-emerald-500 inline-block" /> Hoàn thành
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded bg-cyan-500 inline-block" /> Đang làm
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded bg-rose-500 inline-block" /> Quá hạn
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rotate-45 bg-amber-400 inline-block" /> Cột mốc
                </span>
              </div>
            </div>

            <SmartHorizontalScroll>
              <div className="min-w-[780px] space-y-2 pb-2">
                {/* Timeline Header Ruler */}
                <div className="grid grid-cols-12 gap-3 items-center pb-2 border-b border-slate-800 text-[11px] font-bold text-slate-400">
                  <div className="col-span-4">Đầu Việc WBS / Cột Mốc</div>
                  <div className="col-span-8 relative h-5 flex items-center justify-between px-1 tabular-nums">
                    <span>{formatDateVN(new Date(ganttBounds.minMs).toISOString().slice(0, 10))}</span>
                    <span>
                      {formatDateVN(
                        new Date(ganttBounds.minMs + ganttBounds.spanMs / 2)
                          .toISOString()
                          .slice(0, 10)
                      )}
                    </span>
                    <span>{formatDateVN(new Date(ganttBounds.maxMs).toISOString().slice(0, 10))}</span>
                  </div>
                </div>

                {/* WBS Task Bars */}
                {project.congViec.map((task) => {
                  const startMs = parseDateMs(task.ngayBatDau);
                  const endMs = Math.max(startMs + 86400000, parseDateMs(task.hanHoanThanh));
                  const leftPct = Math.max(
                    0,
                    Math.min(96, ((startMs - ganttBounds.minMs) / ganttBounds.spanMs) * 100)
                  );
                  const widthPct = Math.max(
                    4,
                    Math.min(100 - leftPct, ((endMs - startMs) / ganttBounds.spanMs) * 100)
                  );
                  const isLate = task.trangThai !== 'Hoàn thành' && task.hanHoanThanh < TODAY_REF;
                  const barBg =
                    task.trangThai === 'Hoàn thành'
                      ? 'bg-emerald-500/25 border-emerald-500/50'
                      : isLate
                      ? 'bg-rose-500/25 border-rose-500/50'
                      : 'bg-cyan-500/20 border-cyan-500/40';
                  const fillBg =
                    task.trangThai === 'Hoàn thành'
                      ? 'bg-emerald-500'
                      : isLate
                      ? 'bg-rose-500'
                      : 'bg-cyan-500';

                  return (
                    <div
                      key={task.id}
                      className="grid grid-cols-12 gap-3 items-center py-1.5 hover:bg-slate-800/30 rounded-lg px-1"
                    >
                      <div className="col-span-4 min-w-0 pr-2">
                        <div className="text-xs font-semibold text-slate-100 truncate">
                          <span className="font-mono text-indigo-400 mr-1.5">{task.maCongViec}</span>
                          {task.tieuDe}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate tabular-nums">
                          {task.nguoiPhuTrach || '-'} · {formatDateVN(task.ngayBatDau)} →{' '}
                          {formatDateVN(task.hanHoanThanh)}
                        </div>
                      </div>
                      <div className="col-span-8 relative h-7 bg-slate-950/60 rounded-md border border-slate-800/80">
                        {/* Today marker */}
                        <div
                          className="absolute top-0 bottom-0 w-px bg-amber-400/70 z-10"
                          style={{ left: `${ganttBounds.todayPct}%` }}
                          title={`Hôm nay (${formatDateVN(TODAY_REF)})`}
                        />
                        {/* Task bar */}
                        <div
                          onClick={() => handleOpenEditTask(task)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleOpenEditTask(task);
                          }}
                          title={`${task.tieuDe}: ${task.tienDo}%`}
                          className={`absolute top-1 bottom-1 rounded border overflow-hidden cursor-pointer ${barBg}`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        >
                          <div
                            className={`h-full ${fillBg} opacity-80`}
                            style={{ width: `${task.tienDo}%` }}
                          />
                          <span className="absolute inset-0 flex items-center px-1.5 text-[10px] font-bold text-white drop-shadow tabular-nums">
                            {task.tienDo}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Milestones Row */}
                {project.cotMoc.length > 0 && (
                  <div className="grid grid-cols-12 gap-3 items-center pt-2 border-t border-slate-800">
                    <div className="col-span-4 text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Flag className="w-3.5 h-3.5" />
                      <span>Cột Mốc Dự Án ({project.cotMoc.length})</span>
                    </div>
                    <div className="col-span-8 relative h-8 bg-slate-950/60 rounded-md border border-slate-800/80">
                      <div
                        className="absolute top-0 bottom-0 w-px bg-amber-400/70 z-10"
                        style={{ left: `${ganttBounds.todayPct}%` }}
                      />
                      {project.cotMoc.map((ms) => {
                        const pct = Math.max(
                          2,
                          Math.min(
                            98,
                            ((parseDateMs(ms.hanHoanThanh) - ganttBounds.minMs) /
                              ganttBounds.spanMs) *
                              100
                          )
                        );
                        return (
                          <div
                            key={ms.id}
                            style={{ left: `${pct}%` }}
                            title={`${ms.tenMoc} (${formatDateVN(ms.hanHoanThanh)}) - ${
                              ms.daDat ? 'Đã đạt' : 'Chưa đạt'
                            }`}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
                          >
                            <div
                              className={`w-3.5 h-3.5 rotate-45 border-2 ${
                                ms.daDat
                                  ? 'bg-emerald-400 border-emerald-200'
                                  : 'bg-amber-400 border-amber-200'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </SmartHorizontalScroll>
          </div>
        )}

        {/* SUB-TAB 4: BUDGET & EXPENSES */}
        {workspaceTab === 'budget' && showCosts && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-xs text-slate-400">Ngân Sách Dự Toán</div>
                <div className="text-lg font-bold text-slate-100 mt-1 tabular-nums">
                  {formatVND(budgetPlanned)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-xs text-slate-400">Đã Duyệt & Cam Kết</div>
                <div className="text-lg font-bold text-cyan-300 mt-1 tabular-nums">
                  {formatVND(budgetApproved)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-xs text-slate-400">Đã Thực Chi ({budgetPct}%)</div>
                <div
                  className={`text-lg font-bold mt-1 tabular-nums ${
                    budgetSpent > budgetPlanned ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatVND(budgetSpent)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Expense Table / Cards */}
              <div className="lg:col-span-8 rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100">Bảng Kê Khoản Chi Dự Án</h3>
                  <span className="text-[11px] text-slate-400">
                    Bấm vào trạng thái để chuyển: Dự toán → Đã duyệt → Đã chi
                  </span>
                </div>
                {project.khoanChi.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-500">
                    Chưa có khoản chi phí nào được ghi nhận.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-800/70">
                    {project.khoanChi.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-800/30 transition"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-100">{exp.hangMuc}</div>
                          <div className="text-[11px] text-slate-400 tabular-nums">
                            {formatDateVN(exp.ngay)} · NCC: {exp.nhaCungCap || 'Nội bộ'}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                          <span className="text-xs font-bold text-emerald-300 tabular-nums">
                            {formatVND(exp.soTienVND)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCycleExpenseStatus(exp.id)}
                            className={`px-2.5 py-1 rounded-md border text-[11px] font-bold transition ${
                              exp.trangThai === 'Đã chi'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : exp.trangThai === 'Đã duyệt'
                                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {exp.trangThai}
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Expense Form */}
              <form
                onSubmit={handleAddExpense}
                className="lg:col-span-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3 h-fit"
              >
                <h3 className="text-sm font-bold text-slate-100">Ghi Nhận Khoản Chi</h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Hạng mục chi phí *</label>
                    <input
                      type="text"
                      required
                      value={newExpense.hangMuc}
                      onChange={(e) => setNewExpense({ ...newExpense, hangMuc: e.target.value })}
                      placeholder="VD: Mua biến tần 55kW..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Nhà cung cấp / Đơn vị</label>
                    <input
                      type="text"
                      value={newExpense.nhaCungCap}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, nhaCungCap: e.target.value })
                      }
                      placeholder="Tên NCC / Nhà thầu..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Số tiền (VNĐ) *</label>
                      <input
                        type="number"
                        min={1000}
                        step={10000}
                        required
                        value={newExpense.soTienVND || ''}
                        onChange={(e) =>
                          setNewExpense({ ...newExpense, soTienVND: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Ngày</label>
                      <input
                        type="date"
                        value={newExpense.ngay}
                        onChange={(e) => setNewExpense({ ...newExpense, ngay: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Trạng thái</label>
                    <select
                      value={newExpense.trangThai}
                      onChange={(e) =>
                        setNewExpense({
                          ...newExpense,
                          trangThai: e.target.value as ProjectExpense['trangThai'],
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                    >
                      <option value="Dự toán">Dự toán</option>
                      <option value="Đã duyệt">Đã duyệt</option>
                      <option value="Đã chi">Đã chi</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition min-h-[38px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Khoản Chi</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SUB-TAB 5: RAID RISK REGISTER */}
        {workspaceTab === 'risks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-2.5">
              {project.ruiRo.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-900/70 border border-slate-800 text-center text-xs text-slate-500">
                  Chưa ghi nhận rủi ro nào cho dự án này.
                </div>
              ) : (
                project.ruiRo.map((risk) => (
                  <div
                    key={risk.id}
                    className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${getRiskLevelBadge(
                            risk.mucDo
                          )}`}
                        >
                          Mức độ: {risk.mucDo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${
                            risk.trangThai === 'Đã xử lý'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {risk.trangThai}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleRiskStatus(risk.id)}
                          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 transition"
                        >
                          {risk.trangThai === 'Đang theo dõi' ? 'Đánh dấu đã xử lý' : 'Mở lại'}
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRisk(risk.id)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-100">{risk.moTa}</div>
                    <div className="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 font-semibold">Phương án ứng phó: </span>
                      {risk.giaiPhap}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Phụ trách kiểm soát: <span className="text-slate-200">{risk.nguoiPhuTrach}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleAddRisk}
              className="lg:col-span-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3 h-fit"
            >
              <h3 className="text-sm font-bold text-slate-100">Thêm Rủi Ro / Vấn Đề (RAID)</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Mô tả rủi ro *</label>
                  <textarea
                    required
                    rows={2}
                    value={newRisk.moTa}
                    onChange={(e) => setNewRisk({ ...newRisk, moTa: e.target.value })}
                    placeholder="VD: Trễ lịch giao vật tư, gián đoạn nguồn điện..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Mức độ ảnh hưởng</label>
                  <select
                    value={newRisk.mucDo}
                    onChange={(e) =>
                      setNewRisk({ ...newRisk, mucDo: e.target.value as ProjectRiskLevel })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    <option value="Cao">Cao</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Thấp">Thấp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Giải pháp phòng ngừa / ứng phó</label>
                  <textarea
                    rows={2}
                    value={newRisk.giaiPhap}
                    onChange={(e) => setNewRisk({ ...newRisk, giaiPhap: e.target.value })}
                    placeholder="Biện pháp giảm thiểu..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Người phụ trách</label>
                  <select
                    value={newRisk.nguoiPhuTrach}
                    onChange={(e) => setNewRisk({ ...newRisk, nguoiPhuTrach: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {employees.map((emp) => (
                      <option key={emp.maNhanVien} value={emp.tenNhanVien}>
                        {emp.tenNhanVien} ({emp.chucVu})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition min-h-[38px]"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi Nhận Rủi Ro</span>
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
            <FolderKanban className="w-4 h-4" />
            <span>{UI_TEXTS.tabs.projects.badge}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            {UI_TEXTS.tabs.projects.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition min-h-[38px]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition min-h-[38px]"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreateProject}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-900/30 min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Dự Án Mới</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
            feedbackKind === 'warning'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackKind === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{feedbackMsg}</span>
          </div>
          <button type="button" onClick={() => setFeedbackMsg(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selected Project Workspace OR Portfolio Overview */}
      {selectedProject ? (
        renderProjectWorkspace(selectedProject)
      ) : (
        <>
          {/* Portfolio KPI Cards */}
          <div className={`grid ${showCosts ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'} gap-3.5`}>
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Danh Mục Dự Án</span>
                <FolderKanban className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 tabular-nums">
                {portfolioStats.total} Dự án
              </div>
              <div className="text-[11px] text-slate-400 tabular-nums">
                {portfolioStats.active} đang triển khai · {portfolioStats.completed} hoàn thành
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tiến Độ TB & Đầu Việc WBS</span>
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-300 tabular-nums">
                {portfolioStats.avgProgress}%
              </div>
              <div className="text-[11px] text-slate-400 tabular-nums">
                Hoàn thành {portfolioStats.doneTasks}/{portfolioStats.totalTasks} đầu việc WBS
              </div>
            </div>

            {showCosts && (
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Ngân Sách vs Thực Chi</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-emerald-300 tabular-nums">
                  {formatVND(portfolioStats.totalSpent)}
                </div>
                <div className="text-[11px] text-slate-400 tabular-nums">
                  Dự toán: {formatVND(portfolioStats.totalBudget)} ({portfolioStats.budgetRatio}%)
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Cảnh Báo Quá Hạn</span>
                <AlertTriangle
                  className={`w-4 h-4 ${
                    portfolioStats.overdueTasks + portfolioStats.overdueMilestones > 0
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }`}
                />
              </div>
              <div
                className={`text-2xl font-bold tabular-nums ${
                  portfolioStats.overdueTasks + portfolioStats.overdueMilestones > 0
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
              >
                {portfolioStats.overdueTasks + portfolioStats.overdueMilestones}
              </div>
              <div className="text-[11px] text-slate-400 tabular-nums">
                {portfolioStats.overdueTasks} đầu việc · {portfolioStats.overdueMilestones} cột mốc trễ
              </div>
            </div>
          </div>

          {/* Search, Filters & View Switcher */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm mã dự án, tên dự án, PM, thiết bị..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[38px]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 min-h-[38px]"
                >
                  <option value="Tất cả">Trạng thái: Tất cả</option>
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 min-h-[38px]"
                >
                  <option value="Tất cả">Danh mục: Tất cả</option>
                  {PROJECT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 min-h-[38px]"
                >
                  <option value="Tất cả">Ưu tiên: Tất cả</option>
                  {PROJECT_PRIORITIES.map((pr) => (
                    <option key={pr} value={pr}>
                      {pr}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setOnlyMyProjects(!onlyMyProjects)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition min-h-[38px] ${
                    onlyMyProjects
                      ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Dự án của tôi</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <div className="text-xs text-slate-400">
                Hiển thị <span className="font-bold text-slate-100">{filteredProjects.length}</span>{' '}
                / {projects.length} dự án
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPortfolioView('cards')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    portfolioView === 'cards'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>Thẻ Dự Án</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPortfolioView('table')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    portfolioView === 'table'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  <span>Bảng Dữ Liệu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPortfolioView('charts')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    portfolioView === 'charts'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>{showCosts ? 'Biểu Đồ Ngân Sách' : 'Biểu Đồ Tiến Độ'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* PORTFOLIO CONTENT */}
          {filteredProjects.length === 0 ? (
            <div className="p-10 rounded-xl bg-slate-900/70 border border-slate-800 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-300">
                Không có dự án nào khớp bộ lọc hiện tại.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('Tất cả');
                  setFilterCategory('Tất cả');
                  setFilterPriority('Tất cả');
                  setOnlyMyProjects(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-400 text-xs font-semibold"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : portfolioView === 'charts' ? (
            <div className={`grid ${showCosts ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-4`}>
              {/* Progress vs Budget Chart */}
              {showCosts && (
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-100">
                  So Sánh Ngân Sách Dự Toán vs Thực Chi
                </h3>
                <div className="space-y-3.5">
                  {filteredProjects.map((p) => {
                    const maxVal = Math.max(
                      1,
                      ...filteredProjects.map((x) => Math.max(x.nganSachDuKien, x.chiPhiThucTe))
                    );
                    const planPct = Math.round((p.nganSachDuKien / maxVal) * 100);
                    const spentPct = Math.round((p.chiPhiThucTe / maxVal) * 100);
                    const over = p.chiPhiThucTe > p.nganSachDuKien;
                    return (
                      <div key={p.id} className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProjectId(p.id);
                              setWorkspaceTab('budget');
                            }}
                            className="font-bold text-slate-100 hover:text-cyan-300 truncate text-left"
                          >
                            {p.maDuAn} · {p.tenDuAn}
                          </button>
                          <span className="font-mono text-[11px] text-slate-400 shrink-0 tabular-nums">
                            {formatVND(p.chiPhiThucTe)} / {formatVND(p.nganSachDuKien)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500/70 rounded-full"
                              style={{ width: `${planPct}%` }}
                            />
                          </div>
                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                over ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${spentPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-2 rounded bg-indigo-500/70 inline-block" /> Dự toán
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-2 rounded bg-emerald-500 inline-block" /> Thực chi trong
                    hạn mức
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-2 rounded bg-rose-500 inline-block" /> Vượt dự toán
                  </span>
                </div>
              </div>
              )}

              {/* Progress Overview */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-100">Tiến Độ Hoàn Thành Từng Dự Án</h3>
                <div className="space-y-3.5">
                  {filteredProjects.map((p) => {
                    const prog = calculateProjectProgress(p);
                    const doneWbs = p.congViec.filter((t) => t.trangThai === 'Hoàn thành').length;
                    return (
                      <div key={p.id} className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProjectId(p.id);
                              setWorkspaceTab('gantt');
                            }}
                            className="font-bold text-slate-100 hover:text-cyan-300 truncate text-left"
                          >
                            {p.maDuAn} · {p.tenDuAn}
                          </button>
                          <span className="font-mono font-bold text-cyan-300 shrink-0 tabular-nums">
                            {prog}% ({doneWbs}/{p.congViec.length})
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              prog >= 100
                                ? 'bg-emerald-500'
                                : prog >= 50
                                ? 'bg-cyan-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : portfolioView === 'table' ? (
            <>
              {/* Compact Card View on < md even when table selected */}
              <div className="md:hidden space-y-3">
                {filteredProjects.map((p) => {
                  const prog = calculateProjectProgress(p);
                  const doneTasks = p.congViec.filter((t) => t.trangThai === 'Hoàn thành').length;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setWorkspaceTab('overview');
                      }}
                      className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono font-bold text-indigo-400">
                            {p.maDuAn} · {p.danhMuc}
                          </div>
                          <div className="text-sm font-bold text-slate-100 leading-snug">
                            {p.tenDuAn}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md border text-[11px] font-bold shrink-0 ${getProjectStatusBadge(
                            p.trangThai
                          )}`}
                        >
                          {p.trangThai}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 tabular-nums">
                        PM: {p.quanLyDuAn} · Hạn: {formatDateVN(p.ngayKetThucDuKien)} · {doneTasks}/
                        {p.congViec.length} việc ({prog}%)
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${prog}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
                <SmartHorizontalScroll>
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                        <th className="py-3 px-3">Mã DA</th>
                        <th className="py-3 px-3">Tên Dự Án & Danh Mục</th>
                        <th className="py-3 px-3">PM / Nhóm</th>
                        <th className="py-3 px-3">Trạng Thái</th>
                        <th className="py-3 px-3">Ưu Tiên</th>
                        <th className="py-3 px-3">Thời Gian</th>
                        <th className="py-3 px-3">Tiến Độ</th>
                        {showCosts && <th className="py-3 px-3">Thực Chi / Dự Toán</th>}
                        <th className="py-3 px-3 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 text-xs">
                      {filteredProjects.map((p) => {
                        const prog = calculateProjectProgress(p);
                        const doneTasks = p.congViec.filter((t) => t.trangThai === 'Hoàn thành').length;
                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-slate-800/30 transition cursor-pointer"
                            onClick={() => {
                              setSelectedProjectId(p.id);
                              setWorkspaceTab('overview');
                            }}
                          >
                            <td className="py-3 px-3 font-mono font-bold text-indigo-300">
                              {p.maDuAn}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-100">{p.tenDuAn}</div>
                              <div className="text-[11px] text-slate-400">{p.danhMuc}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-200">{p.quanLyDuAn}</div>
                              <div className="text-[11px] text-slate-400">
                                {parseAssigneeNames(p.thanhVien).length} thành viên
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${getProjectStatusBadge(
                                  p.trangThai
                                )}`}
                              >
                                {p.trangThai}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${getPriorityBadge(
                                  p.uuTien
                                )}`}
                              >
                                {p.uuTien}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-300 tabular-nums">
                              {formatDateVN(p.ngayBatDau)} → {formatDateVN(p.ngayKetThucDuKien)}
                            </td>
                            <td className="py-3 px-3 tabular-nums">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full bg-cyan-500 rounded-full"
                                    style={{ width: `${prog}%` }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-cyan-300">
                                  {prog}% ({doneTasks}/{p.congViec.length})
                                </span>
                              </div>
                            </td>
                            {showCosts && (
                              <td className="py-3 px-3 tabular-nums">
                                <div className="font-semibold text-emerald-300">
                                  {formatVND(p.chiPhiThucTe)}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  / {formatVND(p.nganSachDuKien)}
                                </div>
                              </td>
                            )}
                            <td
                              className="py-3 px-3 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProject(p)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={() => setProjectToDelete(p)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-400 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </SmartHorizontalScroll>
              </div>
            </>
          ) : (
            /* PORTFOLIO CARDS GRID */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredProjects.map((p) => {
                const prog = calculateProjectProgress(p);
                const doneTasks = p.congViec.filter((t) => t.trangThai === 'Hoàn thành').length;
                const openRisks = p.ruiRo.filter((r) => r.trangThai === 'Đang theo dõi').length;
                const budgetPct =
                  p.nganSachDuKien > 0
                    ? Math.round((p.chiPhiThucTe / p.nganSachDuKien) * 100)
                    : 0;

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition flex flex-col justify-between gap-3.5"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono font-bold text-indigo-400">
                            {p.maDuAn}
                            <span className="font-sans text-slate-400 font-normal ml-1.5">
                              · {p.danhMuc}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProjectId(p.id);
                              setWorkspaceTab('overview');
                            }}
                            className="text-base font-bold text-slate-100 hover:text-cyan-300 text-left leading-snug mt-0.5 transition"
                          >
                            {p.tenDuAn}
                          </button>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-md border text-[11px] font-bold shrink-0 ${getProjectStatusBadge(
                            p.trangThai
                          )}`}
                        >
                          {p.trangThai}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {p.moTa}
                      </p>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs tabular-nums">
                          <span className="text-slate-400">
                            Tiến độ WBS ({doneTasks}/{p.congViec.length} việc)
                          </span>
                          <span className="font-mono font-bold text-cyan-300">{prog}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              prog >= 100
                                ? 'bg-emerald-500'
                                : prog >= 50
                                ? 'bg-cyan-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                      </div>

                      {/* Clean Metadata */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 tabular-nums">
                        <div className="text-slate-400 truncate">
                          PM: <span className="text-slate-200 font-semibold">{p.quanLyDuAn}</span>
                        </div>
                        <div className="text-slate-400 text-right">
                          Hạn:{' '}
                          <span className="text-slate-200 font-semibold">
                            {formatDateVN(p.ngayKetThucDuKien)}
                          </span>
                        </div>
                        {showCosts && (
                          <div className="text-slate-400">
                            Thực chi:{' '}
                            <span className="text-emerald-300 font-semibold">
                              {formatVND(p.chiPhiThucTe)}
                            </span>{' '}
                            ({budgetPct}%)
                          </div>
                        )}
                        <div className="text-slate-400 text-right">
                          Rủi ro mở:{' '}
                          <span
                            className={`font-semibold ${
                              openRisks > 0 ? 'text-amber-300' : 'text-emerald-300'
                            }`}
                          >
                            {openRisks}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProjectId(p.id);
                            setWorkspaceTab('tasks');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition min-h-[34px]"
                        >
                          <Kanban className="w-3.5 h-3.5" />
                          <span>Kanban & WBS</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProjectId(p.id);
                            setWorkspaceTab('gantt');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition min-h-[34px]"
                        >
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Gantt</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProject(p)}
                          aria-label="Sửa dự án"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setProjectToDelete(p)}
                            aria-label="Xóa dự án"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* CREATE / EDIT PROJECT MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                {editingProject ? `Chỉnh Sửa Dự Án (${editingProject.maDuAn})` : 'Tạo Dự Án Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mã Dự Án *</label>
                  <input
                    type="text"
                    required
                    value={prjForm.maDuAn}
                    onChange={(e) => setPrjForm({ ...prjForm, maDuAn: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Tên Dự Án *</label>
                  <input
                    type="text"
                    required
                    value={prjForm.tenDuAn}
                    onChange={(e) => setPrjForm({ ...prjForm, tenDuAn: e.target.value })}
                    placeholder="VD: Cải tạo hệ thống làm mát Chiller..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Danh Mục</label>
                  <select
                    value={prjForm.danhMuc}
                    onChange={(e) =>
                      setPrjForm({ ...prjForm, danhMuc: e.target.value as ProjectCategory })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {PROJECT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Trạng Thái</label>
                  <select
                    value={prjForm.trangThai}
                    onChange={(e) =>
                      setPrjForm({ ...prjForm, trangThai: e.target.value as ProjectStatus })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mức Ưu Tiên</label>
                  <select
                    value={prjForm.uuTien}
                    onChange={(e) =>
                      setPrjForm({ ...prjForm, uuTien: e.target.value as ProjectPriority })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {PROJECT_PRIORITIES.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Quản Lý Dự Án (PM)
                  </label>
                  <select
                    value={prjForm.quanLyDuAn}
                    onChange={(e) => setPrjForm({ ...prjForm, quanLyDuAn: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {employees.map((emp) => (
                      <option key={emp.maNhanVien} value={emp.tenNhanVien}>
                        {emp.tenNhanVien} ({emp.chucVu})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ngày Bắt Đầu</label>
                  <input
                    type="date"
                    value={prjForm.ngayBatDau}
                    onChange={(e) => setPrjForm({ ...prjForm, ngayBatDau: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Hạn Hoàn Thành Dự Kiến
                  </label>
                  <input
                    type="date"
                    value={prjForm.ngayKetThucDuKien}
                    onChange={(e) =>
                      setPrjForm({ ...prjForm, ngayKetThucDuKien: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              {showCosts && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Ngân Sách Dự Kiến (VNĐ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={100000}
                      value={prjForm.nganSachDuKien}
                      onChange={(e) =>
                        setPrjForm({ ...prjForm, nganSachDuKien: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Chi Phí Thực Tế Ban Đầu (VNĐ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={100000}
                      value={prjForm.chiPhiThucTe}
                      onChange={(e) =>
                        setPrjForm({ ...prjForm, chiPhiThucTe: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 tabular-nums"
                    />
                  </div>
                </div>
              )}

              <MultiAssigneePicker
                employees={employees}
                value={prjForm.thanhVien}
                onChange={(formatted) => setPrjForm({ ...prjForm, thanhVien: formatted })}
                label="Thành Viên Tham Gia Dự Án"
                accentColor="indigo"
              />

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mục Tiêu Dự Án</label>
                <input
                  type="text"
                  value={prjForm.mucTieu}
                  onChange={(e) => setPrjForm({ ...prjForm, mucTieu: e.target.value })}
                  placeholder="KPI mục tiêu cần đạt..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phạm Vi & Mô Tả</label>
                <textarea
                  rows={2}
                  value={prjForm.moTa}
                  onChange={(e) => setPrjForm({ ...prjForm, moTa: e.target.value })}
                  placeholder="Mô tả chi tiết phạm vi kỹ thuật, yêu cầu an toàn..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Thiết Bị Nhà Máy Liên Quan (chọn nhiều)
                </label>
                <div className="max-h-28 overflow-y-auto rounded-lg bg-slate-950/60 border border-slate-800 p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {equipment.slice(0, 40).map((eq) => {
                    const checked = prjForm.maThietBiLienQuan.includes(eq.maThietBi);
                    return (
                      <label
                        key={eq.maThietBi}
                        className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer hover:text-white truncate"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? prjForm.maThietBiLienQuan.filter((c) => c !== eq.maThietBi)
                              : [...prjForm.maThietBiLienQuan, eq.maThietBi];
                            setPrjForm({ ...prjForm, maThietBiLienQuan: next });
                          }}
                          className="rounded border-slate-600"
                        />
                        <span className="font-mono text-cyan-400">{eq.maThietBi}</span>
                        <span className="truncate">{eq.tenThietBi}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  {editingProject ? 'Lưu Thay Đổi' : 'Tạo Dự Án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT WBS TASK MODAL */}
      {isTaskModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                {editingTask
                  ? `Cập Nhật Đầu Việc ${editingTask.maCongViec}`
                  : `Thêm Đầu Việc WBS (${selectedProject.maDuAn})`}
              </h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mã WBS *</label>
                  <input
                    type="text"
                    required
                    value={taskForm.maCongViec}
                    onChange={(e) => setTaskForm({ ...taskForm, maCongViec: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tên Công Việc *
                  </label>
                  <input
                    type="text"
                    required
                    value={taskForm.tieuDe}
                    onChange={(e) => setTaskForm({ ...taskForm, tieuDe: e.target.value })}
                    placeholder="VD: Đấu nối tủ phân phối và kiểm tra cách điện..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Giai Đoạn</label>
                  <input
                    type="text"
                    value={taskForm.giaiDoan}
                    onChange={(e) => setTaskForm({ ...taskForm, giaiDoan: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Trạng Thái</label>
                  <select
                    value={taskForm.trangThai}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        trangThai: e.target.value as ProjectTaskStatus,
                        tienDo:
                          e.target.value === 'Hoàn thành'
                            ? 100
                            : e.target.value === 'Cần làm'
                            ? 0
                            : taskForm.tienDo,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {TASK_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ưu Tiên</label>
                  <select
                    value={taskForm.uuTien}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, uuTien: e.target.value as ProjectPriority })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    {PROJECT_PRIORITIES.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bắt Đầu</label>
                  <input
                    type="date"
                    value={taskForm.ngayBatDau}
                    onChange={(e) => setTaskForm({ ...taskForm, ngayBatDau: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hạn Xong</label>
                  <input
                    type="date"
                    value={taskForm.hanHoanThanh}
                    onChange={(e) => setTaskForm({ ...taskForm, hanHoanThanh: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tiến Độ (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={taskForm.tienDo}
                    onChange={(e) => setTaskForm({ ...taskForm, tienDo: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Giờ Dự Kiến</label>
                  <input
                    type="number"
                    min={0}
                    value={taskForm.gioDuKien}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, gioDuKien: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 tabular-nums"
                  />
                </div>
              </div>

              <MultiAssigneePicker
                employees={employees}
                value={taskForm.nguoiPhuTrach}
                onChange={(formatted) => setTaskForm({ ...taskForm, nguoiPhuTrach: formatted })}
                label="Người Thực Hiện (có thể chọn nhiều)"
                accentColor="cyan"
              />

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ghi Chú Kỹ Thuật</label>
                <textarea
                  rows={2}
                  value={taskForm.moTa}
                  onChange={(e) => setTaskForm({ ...taskForm, moTa: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  {editingTask ? 'Lưu Đầu Việc' : 'Thêm Đầu Việc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {projectToDelete && canDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">Xác Nhận Xóa Dự Án</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa dự án{' '}
              <span className="font-bold text-white">
                {projectToDelete.maDuAn} — {projectToDelete.tenDuAn}
              </span>{' '}
              cùng toàn bộ đầu việc WBS, cột mốc và dữ liệu rủi ro liên quan?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProject}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Xóa Dự Án
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingTaskEmail && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Xác Nhận Gửi Email Giao Đầu Việc</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gửi email thông báo đầu việc{' '}
              <strong className="text-white">
                {pendingTaskEmail.task.maCongViec} — {pendingTaskEmail.task.tieuDe}
              </strong>{' '}
              (Dự án {selectedProject.maDuAn}).
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Email người nhận (có thể nhập nhiều email cách nhau dấu phẩy)
              </label>
              <input
                type="text"
                value={pendingTaskEmail.recipientStr}
                onChange={(e) =>
                  setPendingTaskEmail({ ...pendingTaskEmail, recipientStr: e.target.value })
                }
                placeholder="email@gmail.com"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingTaskEmail(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!pendingTaskEmail.recipientStr.trim()}
                onClick={() => void executeNotifyTaskAssignees()}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold"
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
