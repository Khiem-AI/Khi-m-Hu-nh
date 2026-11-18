import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import {
  DocumentCategory,
  DocumentSourceType,
  DocumentStep,
  FacilityDocument,
} from '../../types/cmms';
import { canDeleteRecords, formatDateVN } from '../../utils/cmmsLogic';
import { compressImageFile } from '../../utils/imageUtils';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  ExternalLink,
  Upload,
  Link2,
  ListChecks,
  QrCode,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Smartphone,
  Download,
  Edit,
  Trash2,
  X,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  Cpu,
  AlertTriangle,
  Eye,
} from 'lucide-react';

interface DocumentsTabProps {
  initialDocId?: string | null;
  onClearInitialDoc?: () => void;
}

const CATEGORIES: DocumentCategory[] = [
  'Hướng dẫn công việc (SOP)',
  'Checklist kiểm tra',
  'Tài liệu kỹ thuật',
  'An toàn & Biểu mẫu',
];

const CATEGORY_BADGE: Record<DocumentCategory, string> = {
  'Hướng dẫn công việc (SOP)': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Checklist kiểm tra': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Tài liệu kỹ thuật': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'An toàn & Biểu mẫu': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const SOURCE_LABEL: Record<DocumentSourceType, string> = {
  checklist: 'Checklist Di Động',
  link: 'Link / Google Drive',
  upload: 'Tài Liệu Đã Tải Lên',
};

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  initialDocId,
  onClearInitialDoc,
}) => {
  const {
    documents,
    equipment,
    currentUser,
    addDocument,
    updateDocument,
    deleteDocument,
  } = useCMMS();
  const canDelete = canDeleteRecords(currentUser);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Reader + QR Modal state
  const [activeDoc, setActiveDoc] = useState<FacilityDocument | null>(null);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Create / Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<FacilityDocument | null>(null);
  const [maTaiLieu, setMaTaiLieu] = useState('');
  const [tieuDe, setTieuDe] = useState('');
  const [phanLoai, setPhanLoai] = useState<DocumentCategory>('Hướng dẫn công việc (SOP)');
  const [loaiNguon, setLoaiNguon] = useState<DocumentSourceType>('link');
  const [heThong, setHeThong] = useState('Toàn nhà máy');
  const [maThietBi, setMaThietBi] = useState('');
  const [moTaNgan, setMoTaNgan] = useState('');
  const [noiDung, setNoiDung] = useState('');
  const [duongDanUrl, setDuongDanUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileDataUrl, setFileDataUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileSizeKb, setFileSizeKb] = useState<number | undefined>(undefined);
  const [steps, setSteps] = useState<DocumentStep[]>([]);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDetail, setNewStepDetail] = useState('');
  const [mobileFriendly, setMobileFriendly] = useState(true);
  const [formError, setFormError] = useState('');
  const [uploadNotice, setUploadNotice] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<FacilityDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Sync activeDoc with updated state in context
  useEffect(() => {
    if (!activeDoc) return;
    const latest = documents.find((d) => d.id === activeDoc.id);
    if (latest) {
      setActiveDoc(latest);
    }
  }, [documents, activeDoc]);

  // Open deep-linked document if provided (?doc=DOC-001)
  useEffect(() => {
    if (!initialDocId) return;
    const target = documents.find(
      (d) => d.id === initialDocId || d.maTaiLieu === initialDocId
    );
    if (target) {
      setActiveDoc(target);
      if (onClearInitialDoc) onClearInitialDoc();
    }
  }, [initialDocId, documents, onClearInitialDoc]);

  // Render QR Code for currently opened document inside Reader Modal
  useEffect(() => {
    if (!activeDoc || !qrCanvasRef.current) return;
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const shareUrl = `${baseUrl}?doc=${encodeURIComponent(activeDoc.id)}`;
    QRCode.toCanvas(
      qrCanvasRef.current,
      shareUrl,
      {
        width: 148,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      () => {}
    );
  }, [activeDoc]);

  const systemOptions = useMemo(() => {
    const fromEq = equipment.map((e) => e.heThong).filter((s): s is string => Boolean(s));
    const fromDocs = documents.map((d) => d.heThong).filter((s): s is string => Boolean(s));
    return Array.from(new Set(['Toàn nhà máy', ...fromEq, ...fromDocs]));
  }, [equipment, documents]);

  const filteredDocs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchSearch =
        !q ||
        doc.id.toLowerCase().includes(q) ||
        doc.maTaiLieu.toLowerCase().includes(q) ||
        doc.tieuDe.toLowerCase().includes(q) ||
        (doc.moTaNgan || '').toLowerCase().includes(q) ||
        (doc.heThong || '').toLowerCase().includes(q) ||
        (doc.maThietBi || '').toLowerCase().includes(q) ||
        doc.nguoiTao.toLowerCase().includes(q);
      const matchCat = categoryFilter === 'ALL' || doc.phanLoai === categoryFilter;
      const matchSource = sourceFilter === 'ALL' || doc.loaiNguon === sourceFilter;
      const matchEq = equipmentFilter === 'ALL' || doc.maThietBi === equipmentFilter;
      return matchSearch && matchCat && matchSource && matchEq;
    });
  }, [documents, searchTerm, categoryFilter, sourceFilter, equipmentFilter]);

  const stats = useMemo(() => {
    return {
      total: documents.length,
      checklists: documents.filter(
        (d) => d.loaiNguon === 'checklist' || (d.checklistSteps?.length || 0) > 0
      ).length,
      links: documents.filter((d) => d.loaiNguon === 'link').length,
      uploads: documents.filter((d) => d.loaiNguon === 'upload').length,
    };
  }, [documents]);

  const getShareUrl = (doc: FacilityDocument) => {
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}?doc=${encodeURIComponent(doc.id)}`;
  };

  const handleCopyShareLink = (doc: FacilityDocument) => {
    const url = getShareUrl(doc);
    navigator.clipboard.writeText(url);
    setCopiedDocId(doc.id);
    showToast(`Đã sao chép đường dẫn mở nhanh trên điện thoại cho "${doc.tieuDe}"`);
    setTimeout(() => setCopiedDocId(null), 2200);
  };

  const openCreateModal = (presetSource?: DocumentSourceType) => {
    setEditingDoc(null);
    setMaTaiLieu(`SOP-${String(documents.length + 1).padStart(3, '0')}`);
    setTieuDe('');
    setPhanLoai(
      presetSource === 'checklist'
        ? 'Checklist kiểm tra'
        : 'Hướng dẫn công việc (SOP)'
    );
    setLoaiNguon(presetSource || 'upload');
    setHeThong('Toàn nhà máy');
    setMaThietBi('');
    setMoTaNgan('');
    setNoiDung('');
    setDuongDanUrl('');
    setFileName('');
    setFileDataUrl('');
    setFileType('');
    setFileSizeKb(undefined);
    setSteps(
      presetSource === 'checklist'
        ? [
            {
              id: `S-${Date.now()}-1`,
              title: 'Kiểm tra an toàn khu vực & PPE trước khi vận hành',
              checked: false,
            },
            {
              id: `S-${Date.now()}-2`,
              title: 'Đo kiểm thông số vận hành thực tế theo quy chuẩn',
              checked: false,
            },
          ]
        : []
    );
    setNewStepTitle('');
    setNewStepDetail('');
    setMobileFriendly(true);
    setFormError('');
    setUploadNotice('');
    setIsFormOpen(true);
  };

  const openEditModal = (doc: FacilityDocument) => {
    setEditingDoc(doc);
    setMaTaiLieu(doc.maTaiLieu || doc.id);
    setTieuDe(doc.tieuDe);
    setPhanLoai(doc.phanLoai);
    setLoaiNguon(doc.loaiNguon);
    setHeThong(doc.heThong || 'Toàn nhà máy');
    setMaThietBi(doc.maThietBi || '');
    setMoTaNgan(doc.moTaNgan || '');
    setNoiDung(doc.noiDung || '');
    setDuongDanUrl(doc.duongDanUrl || '');
    setFileName(doc.fileName || '');
    setFileDataUrl(doc.fileDataUrl || '');
    setFileType(doc.fileType || '');
    setFileSizeKb(doc.fileSizeKb);
    setSteps(doc.checklistSteps ? doc.checklistSteps.map((s) => ({ ...s })) : []);
    setNewStepTitle('');
    setNewStepDetail('');
    setMobileFriendly(doc.mobileFriendly);
    setFormError('');
    setUploadNotice('');
    setIsFormOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');
    setUploadNotice('');

    if (file.type.startsWith('image/')) {
      try {
        const compressed = await compressImageFile(file, {
          maxDimension: 1200,
          maxBytes: 120 * 1024,
          initialQuality: 0.74,
        });
        if (compressed.dataUrl) {
          const origKb = Math.max(1, Math.round(file.size / 1024));
          setFileName(file.name.replace(/\.[^/.]+$/, '') + '.jpg');
          setFileType('image/jpeg');
          setFileSizeKb(compressed.approxKb);
          setFileDataUrl(compressed.dataUrl);
          setLoaiNguon('upload');
          if (!tieuDe.trim()) {
            setTieuDe(file.name.replace(/\.[^/.]+$/, ''));
          }
          setUploadNotice(
            `Đã nén ảnh "${file.name}" từ ${origKb} KB xuống ~${compressed.approxKb} KB sẵn sàng lưu trữ.`
          );
          return;
        }
      } catch {
        // Fallback below if image decode fails
      }
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadNotice(
        `File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) vượt quá giới hạn lưu trữ trình duyệt 2MB. Vui lòng nén nhỏ hoặc tải lên Google Drive và dán đường dẫn URL vào mục Đường Dẫn.`
      );
      return;
    }

    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setFileName(file.name);
      setFileType(file.type || 'application/octet-stream');
      setFileSizeKb(sizeKb);
      setFileDataUrl(result);
      setLoaiNguon('upload');
      if (!tieuDe.trim()) {
        setTieuDe(file.name.replace(/\.[^/.]+$/, ''));
      }
      setUploadNotice(`Đã nạp file "${file.name}" (${sizeKb} KB) sẵn sàng lưu trữ.`);
    };
    reader.readAsDataURL(file);
  };

  const handleAddStep = () => {
    const trimmed = newStepTitle.trim();
    if (!trimmed) return;
    setSteps((prev) => [
      ...prev,
      {
        id: `STEP-${Date.now()}-${prev.length + 1}`,
        title: trimmed,
        detail: newStepDetail.trim() || undefined,
        checked: false,
      },
    ]);
    setNewStepTitle('');
    setNewStepDetail('');
  };

  const handleRemoveStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tieuDe.trim()) {
      setFormError('Vui lòng nhập tiêu đề tài liệu / hướng dẫn công việc.');
      return;
    }
    if (loaiNguon === 'link' && !duongDanUrl.trim()) {
      setFormError('Vui lòng nhập đường dẫn tài liệu (Google Drive / SharePoint / URL).');
      return;
    }
    if (loaiNguon === 'upload' && !fileDataUrl) {
      setFormError('Vui lòng chọn file từ máy tính / điện thoại để tải lên.');
      return;
    }
    if (loaiNguon === 'checklist' && steps.length === 0 && !noiDung.trim()) {
      setFormError('Vui lòng thêm ít nhất 1 bước checklist hoặc nội dung hướng dẫn.');
      return;
    }

    const payloadBase: Omit<FacilityDocument, 'id'> = {
      maTaiLieu: maTaiLieu.trim().toUpperCase() || `SOP-${Date.now().toString().slice(-4)}`,
      tieuDe: tieuDe.trim(),
      phanLoai,
      loaiNguon,
      heThong: heThong.trim() || 'Toàn nhà máy',
      maThietBi: maThietBi.trim() || undefined,
      moTaNgan: moTaNgan.trim() || 'Tài liệu hướng dẫn vận hành & bảo trì tiêu chuẩn nhà máy.',
      noiDung: noiDung.trim() || undefined,
      duongDanUrl: duongDanUrl.trim() || undefined,
      fileName: fileName || undefined,
      fileDataUrl: fileDataUrl || undefined,
      fileType: fileType || undefined,
      fileSizeKb,
      checklistSteps: steps.length > 0 ? steps : undefined,
      nguoiTao: editingDoc?.nguoiTao || currentUser.tenNhanVien,
      ngayCapNhat: '2026-11-10',
      mobileFriendly,
    };

    if (editingDoc) {
      updateDocument({
        ...editingDoc,
        ...payloadBase,
      });
      showToast(`Đã cập nhật tài liệu "${payloadBase.tieuDe}"`);
    } else {
      addDocument(payloadBase);
      showToast(`Đã tải lên tài liệu mới "${payloadBase.tieuDe}"`);
    }
    setIsFormOpen(false);
  };

  const handleToggleChecklistStep = (doc: FacilityDocument, stepId: string) => {
    if (!doc.checklistSteps) return;
    const nextSteps = doc.checklistSteps.map((s) =>
      s.id === stepId ? { ...s, checked: !s.checked } : s
    );
    const updated: FacilityDocument = {
      ...doc,
      checklistSteps: nextSteps,
      ngayCapNhat: '2026-11-10',
    };
    updateDocument(updated);
    setActiveDoc(updated);
  };

  const handleResetChecklist = (doc: FacilityDocument) => {
    if (!doc.checklistSteps) return;
    const nextSteps = doc.checklistSteps.map((s) => ({ ...s, checked: false }));
    const updated: FacilityDocument = {
      ...doc,
      checklistSteps: nextSteps,
      ngayCapNhat: '2026-11-10',
    };
    updateDocument(updated);
    setActiveDoc(updated);
    showToast('Đã đặt lại toàn bộ bước checklist cho ca làm việc mới.');
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {UI_TEXTS.tabs.documents.badge}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
            {UI_TEXTS.tabs.documents.title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openCreateModal('checklist')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-900/30 transition min-h-[44px]"
          >
            <ListChecks className="w-4 h-4" />
            Tạo Checklist
          </button>
          <button
            type="button"
            onClick={() => openCreateModal('upload')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-cyan-900/30 transition min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Upload Tài Liệu / Thêm Link
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Tổng Tài Liệu & SOP</span>
          <div className="text-2xl font-extrabold font-mono text-slate-100">{stats.total}</div>
        </div>
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Checklist Kiểm Tra</span>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">{stats.checklists}</div>
        </div>
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Đường Dẫn Cloud / Drive</span>
          <div className="text-2xl font-extrabold font-mono text-indigo-400">{stats.links}</div>
        </div>
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium">File Đính Kèm Offline</span>
          <div className="text-2xl font-extrabold font-mono text-amber-400">{stats.uploads}</div>
          <span className="text-[11px] text-slate-400">PDF, ảnh sơ đồ, text</span>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative min-w-[230px] flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã tài liệu, tiêu đề SOP, mã thiết bị, hệ thống..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[42px]"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[42px]"
            >
              <option value="ALL">Tất cả danh mục</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[42px]"
            >
              <option value="ALL">Tất cả định dạng</option>
              <option value="checklist">Checklist / Hướng dẫn di động</option>
              <option value="link">Đường dẫn URL / Drive</option>
              <option value="upload">File Upload trực tiếp</option>
            </select>

            <select
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[42px] max-w-[200px]"
            >
              <option value="ALL">Tất cả thiết bị</option>
              {equipment.map((eq) => (
                <option key={eq.maThietBi} value={eq.maThietBi}>
                  {eq.maThietBi} — {eq.tenThietBi}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition min-h-[36px] ${
                viewMode === 'card'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Dạng Thẻ
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition min-h-[36px] ${
                viewMode === 'table'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Dạng Bảng
            </button>
          </div>
        </div>
      </div>

      {/* View Mode: Cards (Mobile & Desktop Friendly) */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocs.length === 0 ? (
            <div className="col-span-full py-12 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
              Không tìm thấy tài liệu hoặc checklist nào phù hợp với bộ lọc.
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const totalSteps = doc.checklistSteps?.length || 0;
              const doneSteps = doc.checklistSteps?.filter((s) => s.checked).length || 0;
              const progressPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
              const isCopied = copiedDocId === doc.id;

              return (
                <div
                  key={doc.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 p-5 flex flex-col justify-between gap-4 shadow-lg transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/50 border border-cyan-800/60 px-2 py-0.5 rounded">
                          {doc.maTaiLieu || doc.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${CATEGORY_BADGE[doc.phanLoai]}`}
                        >
                          {doc.phanLoai}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal(doc)}
                          title="Chỉnh sửa tài liệu"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDocToDelete(doc)}
                            title="Xóa tài liệu"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-snug">
                        {doc.tieuDe}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {doc.moTaNgan || doc.noiDung || 'Hướng dẫn tiêu chuẩn O&M'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {doc.loaiNguon === 'checklist' ? (
                          <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
                        ) : doc.loaiNguon === 'link' ? (
                          <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        {SOURCE_LABEL[doc.loaiNguon]}
                      </span>

                      {doc.heThong && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          {doc.heThong}
                        </span>
                      )}

                      {doc.maThietBi && (
                        <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/50">
                          <Cpu className="w-3 h-3" />
                          {doc.maThietBi}
                        </span>
                      )}
                    </div>

                    {totalSteps > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-400 font-semibold">
                            Tiến độ checklist: {doneSteps}/{totalSteps} bước
                          </span>
                          <span className="font-mono font-bold text-slate-300">{progressPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Touch-Friendly Actions (44px min height) */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Cập nhật: {formatDateVN(doc.ngayCapNhat)}</span>
                      <span>Đăng bởi: {doc.nguoiTao}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveDoc(doc)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition min-h-[44px]"
                      >
                        <BookOpen className="w-4 h-4" />
                        Mở Đọc & QR Di Động
                      </button>

                      {doc.duongDanUrl && (
                        <a
                          href={doc.duongDanUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Mở đường dẫn tài liệu"
                          className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition min-h-[44px]"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyShareLink(doc)}
                        title="Sao chép link xem trên điện thoại"
                        className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition min-h-[44px]"
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* View Mode: Table with SmartHorizontalScroll */
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          <SmartHorizontalScroll>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Mã TL</th>
                  <th className="py-3 px-4 min-w-[240px]">Tiêu Đề & Mô Tả</th>
                  <th className="py-3 px-4">Danh Mục</th>
                  <th className="py-3 px-4">Nguồn Dữ Liệu</th>
                  <th className="py-3 px-4">Hệ Thống / Thiết Bị</th>
                  <th className="py-3 px-4">Checklist</th>
                  <th className="py-3 px-4">Người Tải / Cập Nhật</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      Không tìm thấy tài liệu nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => {
                    const totalSteps = doc.checklistSteps?.length || 0;
                    const doneSteps = doc.checklistSteps?.filter((s) => s.checked).length || 0;
                    return (
                      <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                          {doc.maTaiLieu || doc.id}
                        </td>
                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="font-bold text-slate-100">{doc.tieuDe}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {doc.moTaNgan || doc.noiDung}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${CATEGORY_BADGE[doc.phanLoai]}`}
                          >
                            {doc.phanLoai}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                          {SOURCE_LABEL[doc.loaiNguon]}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-200">{doc.heThong || 'Toàn nhà máy'}</div>
                          {doc.maThietBi && (
                            <span className="font-mono text-[11px] text-cyan-400">
                              {doc.maThietBi}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                          {totalSteps > 0 ? `${doneSteps}/${totalSteps} bước` : '—'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-200">{doc.nguoiTao}</div>
                          <div className="text-[11px] text-slate-400">
                            {formatDateVN(doc.ngayCapNhat)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveDoc(doc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Mở / QR
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(doc)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setDocToDelete(doc)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                                title="Xóa tài liệu"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </SmartHorizontalScroll>
        </div>
      )}

      {/* MOBILE-FRIENDLY READER + CHECKLIST + QR MODAL */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-4 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-800/80 shrink-0">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                    {activeDoc.maTaiLieu || activeDoc.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${CATEGORY_BADGE[activeDoc.phanLoai]}`}
                  >
                    {activeDoc.phanLoai}
                  </span>
                  {activeDoc.maThietBi && (
                    <span className="font-mono text-[11px] font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-700/50 px-2 py-0.5 rounded">
                      {activeDoc.maThietBi}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-100 leading-snug">
                  {activeDoc.tieuDe}
                </h3>
                {activeDoc.moTaNgan && (
                  <p className="text-xs text-slate-400">{activeDoc.moTaNgan}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveDoc(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Mobile Quick Access + QR Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wide">
                    <Smartphone className="w-4 h-4" />
                    Mở Nhanh Trên Điện Thoại / Máy Tính Bảng
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Quét mã QR bên cạnh bằng camera điện thoại hoặc sao chép liên kết dưới đây để truy cập trực tiếp vào tài liệu / checklist này tại vị trí máy.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyShareLink(activeDoc)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition min-h-[44px]"
                    >
                      {copiedDocId === activeDoc.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copiedDocId === activeDoc.id
                        ? 'Đã Sao Chép Link Di Động'
                        : 'Sao Chép Link Mở Trên Điện Thoại'}
                    </button>

                    {activeDoc.duongDanUrl && (
                      <a
                        href={activeDoc.duongDanUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition min-h-[44px]"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Mở Đường Dẫn Tài Liệu Gốc
                      </a>
                    )}

                    {activeDoc.fileDataUrl && (
                      <a
                        href={activeDoc.fileDataUrl}
                        download={activeDoc.fileName || `${activeDoc.id}_document`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition min-h-[44px]"
                      >
                        <Download className="w-4 h-4" />
                        Tải File ({activeDoc.fileName || 'Đính kèm'})
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white text-slate-900 border border-slate-200 mx-auto">
                  <canvas ref={qrCanvasRef} className="rounded" />
                  <span className="mt-1.5 text-[10px] font-bold font-mono text-slate-700 flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-cyan-700" />
                    {activeDoc.maTaiLieu || activeDoc.id} • Quét mở ĐT
                  </span>
                </div>
              </div>

              {/* Uploaded File Preview */}
              {activeDoc.fileDataUrl && (
                <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      Nội Dung File Đính Kèm: {activeDoc.fileName}
                    </h4>
                    {activeDoc.fileSizeKb && (
                      <span className="font-mono text-[11px] text-slate-400">
                        {activeDoc.fileSizeKb} KB
                      </span>
                    )}
                  </div>
                  {activeDoc.fileType?.startsWith('image/') ? (
                    <img
                      src={activeDoc.fileDataUrl}
                      alt={activeDoc.tieuDe}
                      className="max-h-[440px] w-full object-contain rounded-xl bg-slate-950 border border-slate-800"
                    />
                  ) : activeDoc.fileType === 'application/pdf' ? (
                    <iframe
                      src={activeDoc.fileDataUrl}
                      title={activeDoc.tieuDe}
                      className="w-full h-[460px] rounded-xl border border-slate-800 bg-white"
                    />
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
                      <span>
                        Định dạng tệp <strong>{activeDoc.fileName}</strong> đã sẵn sàng tải xuống để mở bằng ứng dụng chuyên dụng trên điện thoại/máy tính.
                      </span>
                      <a
                        href={activeDoc.fileDataUrl}
                        download={activeDoc.fileName || 'tai-lieu'}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      >
                        <Download className="w-4 h-4" />
                        Mở / Tải File
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* SOP / Instruction Text */}
              {activeDoc.noiDung && (
                <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 sm:p-5 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Hướng Dẫn Công Việc & Thông Số Chuẩn (SOP)
                  </h4>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-relaxed">
                    {activeDoc.noiDung}
                  </pre>
                </div>
              )}

              {/* Interactive Mobile Checklist */}
              {activeDoc.checklistSteps && activeDoc.checklistSteps.length > 0 && (
                <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <ListChecks className="w-4 h-4" />
                        Checklist Kiểm Tra Thực Tế (
                        {activeDoc.checklistSteps.filter((s) => s.checked).length}/
                        {activeDoc.checklistSteps.length} Hoàn Thành)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Chạm từng mục trên điện thoại để đánh dấu hoàn tất tại hiện trường (tự động lưu trạng thái).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResetChecklist(activeDoc)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold min-h-[40px]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Đặt lại ca mới
                    </button>
                  </div>

                  <div className="space-y-2">
                    {activeDoc.checklistSteps.map((step, index) => (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => handleToggleChecklistStep(activeDoc, step.id)}
                        className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition min-h-[54px] ${
                          step.checked
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 hover:border-cyan-500/40 text-slate-200'
                        }`}
                      >
                        {step.checked ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5 min-w-0">
                          <div
                            className={`text-sm font-semibold leading-snug ${
                              step.checked ? 'line-through opacity-80' : ''
                            }`}
                          >
                            <span className="font-mono text-xs text-cyan-400 mr-1.5">
                              {String(index + 1).padStart(2, '0')}.
                            </span>
                            {step.title}
                          </div>
                          {step.detail && (
                            <div className="text-xs text-slate-400 leading-snug">
                              {step.detail}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DOCUMENT & CHECKLIST MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-6">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-100">
                    {editingDoc
                      ? `Chỉnh Sửa Tài Liệu [${editingDoc.maTaiLieu || editingDoc.id}]`
                      : 'Upload Tài Liệu, Đường Dẫn & Tạo Checklist Công Việc'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hỗ trợ tải tệp trực tiếp (PDF/Ảnh/Text), đường dẫn Drive và checklist thao tác trên di động
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Mã Tài Liệu</label>
                  <input
                    type="text"
                    value={maTaiLieu}
                    onChange={(e) => setMaTaiLieu(e.target.value)}
                    placeholder="SOP-007"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Tiêu Đề Tài Liệu / Hướng Dẫn Công Việc *
                  </label>
                  <input
                    type="text"
                    value={tieuDe}
                    onChange={(e) => {
                      setTieuDe(e.target.value);
                      setFormError('');
                    }}
                    placeholder="VD: SOP Bảo Dưỡng AHU Phòng Sạch, Checklist Chiller..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Danh Mục</label>
                  <select
                    value={phanLoai}
                    onChange={(e) => setPhanLoai(e.target.value as DocumentCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Kiểu Tài Liệu</label>
                  <select
                    value={loaiNguon}
                    onChange={(e) => {
                      setLoaiNguon(e.target.value as DocumentSourceType);
                      setFormError('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="upload">Upload File Trực Tiếp (PDF, Ảnh, Văn bản)</option>
                    <option value="link">Đường Dẫn URL / Google Drive / Cloud</option>
                    <option value="checklist">Checklist & Hướng Dẫn Công Việc Di Động</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Hệ Thống Áp Dụng</label>
                  <select
                    value={heThong}
                    onChange={(e) => setHeThong(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {systemOptions.map((sys) => (
                      <option key={sys} value={sys}>
                        {sys}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Thiết Bị Liên Kết (Nếu có)</label>
                  <select
                    value={maThietBi}
                    onChange={(e) => setMaThietBi(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">-- Dùng chung toàn hệ thống --</option>
                    {equipment.map((eq) => (
                      <option key={eq.maThietBi} value={eq.maThietBi}>
                        {eq.maThietBi} — {eq.tenThietBi}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Mô Tả Tóm Tắt</label>
                <input
                  type="text"
                  value={moTaNgan}
                  onChange={(e) => setMoTaNgan(e.target.value)}
                  placeholder="Phạm vi công việc, đối tượng thực hiện, chu kỳ kiểm tra..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Upload File Box */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Upload className="w-4 h-4" />
                    Tải File Từ Máy Tính / Điện Thoại (PDF, PNG/JPG, TXT, CSV - Tối đa 2MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition"
                  >
                    Chọn File Upload
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv,.doc,.docx,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                {fileName && (
                  <div className="text-xs text-emerald-400 font-mono flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                    <span>✓ File đang gắn: {fileName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFileName('');
                        setFileDataUrl('');
                        setFileType('');
                        setFileSizeKb(undefined);
                      }}
                      className="text-rose-400 hover:underline font-sans font-semibold"
                    >
                      Gỡ file
                    </button>
                  </div>
                )}
                {uploadNotice && (
                  <div className="text-[11px] text-cyan-300 leading-relaxed">{uploadNotice}</div>
                )}
              </div>

              {/* URL / Cloud Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                  Đường Dẫn Tài Liệu (Google Drive / SharePoint / Web Link)
                </label>
                <input
                  type="url"
                  value={duongDanUrl}
                  onChange={(e) => setDuongDanUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* SOP Content Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Nội Dung Hướng Dẫn Công Việc / Ghi Chú Kỹ Thuật (Hiển thị đọc trực tiếp trên ĐT)
                </label>
                <textarea
                  rows={4}
                  value={noiDung}
                  onChange={(e) => setNoiDung(e.target.value)}
                  placeholder="Nhập các bước hướng dẫn an toàn, thông số chuẩn cần đạt..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Dynamic Checklist Steps Builder */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4" />
                    Các Bước Checklist Kiểm Tra ({steps.length} bước)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={newStepTitle}
                    onChange={(e) => setNewStepTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStep();
                      }
                    }}
                    placeholder="Tên bước kiểm tra..."
                    className="sm:col-span-6 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={newStepDetail}
                    onChange={(e) => setNewStepDetail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStep();
                      }
                    }}
                    placeholder="Ghi chú thông số (tuỳ chọn)..."
                    className="sm:col-span-4 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0"
                  >
                    + Thêm
                  </button>
                </div>

                {steps.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {steps.map((s, idx) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-semibold">
                            <strong className="font-mono text-emerald-400 mr-1.5">
                              {idx + 1}.
                            </strong>
                            {s.title}
                          </div>
                          {s.detail && (
                            <div className="text-[11px] text-slate-400 truncate">{s.detail}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(s.id)}
                          className="text-slate-400 hover:text-rose-400 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mobileFriendly}
                  onChange={(e) => setMobileFriendly(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600"
                />
                <span>Ưu tiên hiển thị dạng thẻ & Checklist cảm ứng trên điện thoại di động</span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingDoc ? 'Lưu Thay Đổi' : 'Lưu Tài Liệu Lên Hệ Thống'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (No window.alert / window.confirm) */}
      {docToDelete && canDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Xác Nhận Xóa Tài Liệu</h3>
                <p className="text-xs text-slate-400">
                  Bạn có chắc muốn xóa{' '}
                  <strong>
                    [{docToDelete.maTaiLieu || docToDelete.id}] {docToDelete.tieuDe}
                  </strong>
                  ?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDocument(docToDelete.id);
                  if (activeDoc?.id === docToDelete.id) setActiveDoc(null);
                  showToast(`Đã xóa tài liệu "${docToDelete.tieuDe}"`);
                  setDocToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Xóa Tài Liệu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
