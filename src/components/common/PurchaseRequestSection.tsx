import React, { useEffect, useMemo, useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import {
  PurchaseRequest,
  PurchaseRequestPriority,
  PurchaseRequestStatus,
  PurchaseRequestType,
} from '../../types/cmms';
import {
  canApprovePurchaseRequests,
  canDeleteRecords,
  canViewCosts,
  formatDateVN,
  formatVND,
} from '../../utils/cmmsLogic';
import { SmartHorizontalScroll } from './SmartHorizontalScroll';
import {
  ShoppingCart,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  PackageCheck,
  AlertTriangle,
  X,
} from 'lucide-react';

export interface PurchaseRequestDraft {
  maMatHang?: string;
  tenMatHang: string;
  danhMuc?: string;
  quyCachThongSo?: string;
  donViTinh: string;
  donGiaDuKien?: number;
  maThietBiLienQuan?: string;
  triggerKey: number;
}

interface PurchaseRequestSectionProps {
  type: PurchaseRequestType;
  preselectedDraft?: PurchaseRequestDraft | null;
  onClearPreselected?: () => void;
  openCreateSignal?: number;
}

const PRIORITY_OPTIONS: PurchaseRequestPriority[] = ['Bình thường', 'Gấp', 'Khẩn cấp'];
const STATUS_OPTIONS: PurchaseRequestStatus[] = [
  'Chờ duyệt',
  'Đã duyệt',
  'Đang đặt hàng',
  'Đã nhận hàng',
  'Từ chối',
];

export const PurchaseRequestSection: React.FC<PurchaseRequestSectionProps> = ({
  type,
  preselectedDraft,
  onClearPreselected,
  openCreateSignal = 0,
}) => {
  const {
    purchaseRequests,
    tools,
    spareParts,
    equipment,
    currentUser,
    addPurchaseRequest,
    updatePurchaseRequest,
    updatePurchaseRequestStatus,
    deletePurchaseRequest,
  } = useCMMS();

  const showCosts = canViewCosts(currentUser);
  const canApprove = canApprovePurchaseRequests(currentUser);
  const canDelete = canDeleteRecords(currentUser);

  const isToolType = type === 'DUNG_CU';
  const itemLabel = isToolType ? 'Dụng Cụ / Đồ Nghề' : 'Vật Tư / Phụ Tùng';
  const accentBtn = isToolType
    ? 'bg-cyan-600 hover:bg-cyan-500'
    : 'bg-purple-600 hover:bg-purple-500';
  const accentRing = isToolType ? 'focus:ring-cyan-500' : 'focus:ring-purple-500';
  const accentCodeText = isToolType ? 'text-cyan-400' : 'text-purple-400';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Create / Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<PurchaseRequest | null>(null);
  const [selectedCatalogCode, setSelectedCatalogCode] = useState<string>('');
  const [maMatHang, setMaMatHang] = useState('');
  const [tenMatHang, setTenMatHang] = useState('');
  const [danhMuc, setDanhMuc] = useState('');
  const [quyCachThongSo, setQuyCachThongSo] = useState('');
  const [soLuong, setSoLuong] = useState<number>(1);
  const [donViTinh, setDonViTinh] = useState(isToolType ? 'Bộ' : 'Cái');
  const [donGiaDuKien, setDonGiaDuKien] = useState<string>('');
  const [nhaCungCapDeXuat, setNhaCungCapDeXuat] = useState('');
  const [mucDoUuTien, setMucDoUuTien] = useState<PurchaseRequestPriority>('Bình thường');
  const [ngayCanHang, setNgayCanHang] = useState('');
  const [maThietBiLienQuan, setMaThietBiLienQuan] = useState('');
  const [lyDoYeuCau, setLyDoYeuCau] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [formError, setFormError] = useState('');

  // Status / Approval modal state
  const [statusModalReq, setStatusModalReq] = useState<PurchaseRequest | null>(null);
  const [nextStatus, setNextStatus] = useState<PurchaseRequestStatus>('Đã duyệt');
  const [ghiChuDuyet, setGhiChuDuyet] = useState('');
  const [autoReceiveToInventory, setAutoReceiveToInventory] = useState(true);
  const [statusError, setStatusError] = useState('');

  // Delete confirmation modal state
  const [deletingReq, setDeletingReq] = useState<PurchaseRequest | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const resetFormFields = () => {
    setSelectedCatalogCode('');
    setMaMatHang('');
    setTenMatHang('');
    setDanhMuc(isToolType ? 'Dụng cụ cầm tay' : 'Vật tư bảo trì');
    setQuyCachThongSo('');
    setSoLuong(1);
    setDonViTinh(isToolType ? 'Bộ' : 'Cái');
    setDonGiaDuKien('');
    setNhaCungCapDeXuat('');
    setMucDoUuTien('Bình thường');
    setNgayCanHang('');
    setMaThietBiLienQuan('');
    setLyDoYeuCau('');
    setGhiChu('');
    setFormError('');
  };

  const openCreateModal = () => {
    setEditingReq(null);
    resetFormFields();
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (openCreateSignal > 0) {
      setEditingReq(null);
      resetFormFields();
      setIsFormOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCreateSignal]);

  useEffect(() => {
    if (!preselectedDraft) return;
    setEditingReq(null);
    setSelectedCatalogCode(preselectedDraft.maMatHang || '');
    setMaMatHang(preselectedDraft.maMatHang || '');
    setTenMatHang(preselectedDraft.tenMatHang);
    setDanhMuc(preselectedDraft.danhMuc || (isToolType ? 'Dụng cụ cầm tay' : 'Vật tư bảo trì'));
    setQuyCachThongSo(preselectedDraft.quyCachThongSo || '');
    setSoLuong(1);
    setDonViTinh(preselectedDraft.donViTinh || (isToolType ? 'Bộ' : 'Cái'));
    setDonGiaDuKien(
      showCosts && typeof preselectedDraft.donGiaDuKien === 'number' && preselectedDraft.donGiaDuKien > 0
        ? String(preselectedDraft.donGiaDuKien)
        : ''
    );
    setNhaCungCapDeXuat('');
    setMucDoUuTien('Gấp');
    setNgayCanHang('');
    setMaThietBiLienQuan(preselectedDraft.maThietBiLienQuan || '');
    setLyDoYeuCau(
      isToolType
        ? `Bổ sung ${preselectedDraft.tenMatHang} phục vụ công tác bảo trì, sửa chữa`
        : `Đề xuất mua bổ sung tồn kho ${preselectedDraft.tenMatHang}`
    );
    setGhiChu('');
    setFormError('');
    setIsFormOpen(true);
    onClearPreselected?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedDraft?.triggerKey]);

  const openEditModal = (req: PurchaseRequest) => {
    setEditingReq(req);
    setSelectedCatalogCode(req.maMatHang || '');
    setMaMatHang(req.maMatHang || '');
    setTenMatHang(req.tenMatHang);
    setDanhMuc(req.danhMuc || '');
    setQuyCachThongSo(req.quyCachThongSo || '');
    setSoLuong(req.soLuong);
    setDonViTinh(req.donViTinh);
    setDonGiaDuKien(
      showCosts && typeof req.donGiaDuKien === 'number' ? String(req.donGiaDuKien) : ''
    );
    setNhaCungCapDeXuat(req.nhaCungCapDeXuat || '');
    setMucDoUuTien(req.mucDoUuTien);
    setNgayCanHang(req.ngayCanHang || '');
    setMaThietBiLienQuan(req.maThietBiLienQuan || '');
    setLyDoYeuCau(req.lyDoYeuCau);
    setGhiChu(req.ghiChu || '');
    setFormError('');
    setIsFormOpen(true);
  };

  const openStatusModal = (req: PurchaseRequest) => {
    if (!canApprove) return;
    setStatusModalReq(req);
    const defaultNext: PurchaseRequestStatus =
      req.trangThai === 'Chờ duyệt'
        ? 'Đã duyệt'
        : req.trangThai === 'Đã duyệt'
        ? 'Đang đặt hàng'
        : req.trangThai === 'Đang đặt hàng'
        ? 'Đã nhận hàng'
        : req.trangThai;
    setNextStatus(defaultNext);
    setGhiChuDuyet(req.ghiChuDuyet || '');
    setAutoReceiveToInventory(true);
    setStatusError('');
  };

  const requestsOfType = useMemo(
    () => purchaseRequests.filter((r) => r.loaiYeuCau === type),
    [purchaseRequests, type]
  );

  const stats = useMemo(() => {
    const total = requestsOfType.length;
    const pending = requestsOfType.filter((r) => r.trangThai === 'Chờ duyệt').length;
    const active = requestsOfType.filter(
      (r) => r.trangThai === 'Đã duyệt' || r.trangThai === 'Đang đặt hàng'
    ).length;
    const received = requestsOfType.filter((r) => r.trangThai === 'Đã nhận hàng').length;
    const estimatedBudget = requestsOfType
      .filter((r) => r.trangThai !== 'Từ chối')
      .reduce((sum, r) => sum + r.soLuong * (r.donGiaDuKien || 0), 0);
    return { total, pending, active, received, estimatedBudget };
  }, [requestsOfType]);

  const filteredRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return requestsOfType.filter((r) => {
      const matchSearch =
        !q ||
        r.maPhieu.toLowerCase().includes(q) ||
        (r.maMatHang || '').toLowerCase().includes(q) ||
        r.tenMatHang.toLowerCase().includes(q) ||
        (r.quyCachThongSo || '').toLowerCase().includes(q) ||
        r.nguoiYeuCau.toLowerCase().includes(q) ||
        (r.nhaCungCapDeXuat || '').toLowerCase().includes(q) ||
        r.lyDoYeuCau.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || r.trangThai === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || r.mucDoUuTien === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [requestsOfType, searchTerm, statusFilter, priorityFilter]);

  const handleCatalogSelect = (code: string) => {
    setSelectedCatalogCode(code);
    if (!code) return;
    if (isToolType) {
      const found = tools.find((t) => t.maDungCu === code);
      if (found) {
        setMaMatHang(found.maDungCu);
        setTenMatHang(found.tenDungCu);
        setDanhMuc(found.danhMuc);
        setQuyCachThongSo(
          [found.thuongHieu ? `Hãng: ${found.thuongHieu}` : null, found.ghiChu].filter(Boolean).join(' · ')
        );
        setDonViTinh(found.donViTinh || 'Bộ');
      }
    } else {
      const found = spareParts.find((p) => p.maVatTu === code);
      if (found) {
        setMaMatHang(found.maVatTu);
        setTenMatHang(found.tenVatTu);
        setDanhMuc('Phụ tùng bảo trì');
        setQuyCachThongSo(found.thongSo || '');
        setDonViTinh(found.donViTinh || 'Cái');
        setMaThietBiLienQuan(found.maThietBi || '');
        if (showCosts && found.donGia > 0) {
          setDonGiaDuKien(String(found.donGia));
        }
      }
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenMatHang.trim()) {
      setFormError(`Vui lòng nhập tên ${itemLabel.toLowerCase()} cần mua.`);
      return;
    }
    if (!lyDoYeuCau.trim()) {
      setFormError('Vui lòng nhập lý do / mục đích đề xuất mua.');
      return;
    }
    const qty = Math.max(1, Number(soLuong) || 0);
    if (qty <= 0) {
      setFormError('Số lượng đề xuất phải lớn hơn 0.');
      return;
    }
    const parsedPrice =
      showCosts && donGiaDuKien.trim() !== '' && !isNaN(Number(donGiaDuKien))
        ? Math.max(0, Number(donGiaDuKien))
        : undefined;

    if (editingReq) {
      updatePurchaseRequest({
        ...editingReq,
        maMatHang: maMatHang.trim() || undefined,
        tenMatHang: tenMatHang.trim(),
        danhMuc: danhMuc.trim() || undefined,
        quyCachThongSo: quyCachThongSo.trim() || undefined,
        soLuong: qty,
        donViTinh: donViTinh.trim() || 'Cái',
        donGiaDuKien: showCosts ? parsedPrice : editingReq.donGiaDuKien,
        nhaCungCapDeXuat: nhaCungCapDeXuat.trim() || undefined,
        mucDoUuTien,
        ngayCanHang: ngayCanHang || undefined,
        maThietBiLienQuan: maThietBiLienQuan.trim() || undefined,
        lyDoYeuCau: lyDoYeuCau.trim(),
        ghiChu: ghiChu.trim() || undefined,
      });
      showToast(`Đã cập nhật phiếu ${editingReq.maPhieu}`);
    } else {
      const created = addPurchaseRequest({
        loaiYeuCau: type,
        maMatHang: maMatHang.trim() || undefined,
        tenMatHang: tenMatHang.trim(),
        danhMuc: danhMuc.trim() || undefined,
        quyCachThongSo: quyCachThongSo.trim() || undefined,
        soLuong: qty,
        donViTinh: donViTinh.trim() || 'Cái',
        donGiaDuKien: showCosts ? parsedPrice : undefined,
        nhaCungCapDeXuat: nhaCungCapDeXuat.trim() || undefined,
        mucDoUuTien,
        ngayCanHang: ngayCanHang || undefined,
        maThietBiLienQuan: maThietBiLienQuan.trim() || undefined,
        lyDoYeuCau: lyDoYeuCau.trim(),
        ghiChu: ghiChu.trim() || undefined,
      });
      showToast(`Đã gửi phiếu yêu cầu mua ${created.maPhieu} (${created.tenMatHang})`);
    }
    setIsFormOpen(false);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalReq) return;
    const res = updatePurchaseRequestStatus({
      id: statusModalReq.id,
      trangThai: nextStatus,
      ghiChuDuyet,
      autoReceiveToInventory: nextStatus === 'Đã nhận hàng' ? autoReceiveToInventory : false,
    });
    if (!res.success) {
      setStatusError(res.message || 'Không thể cập nhật trạng thái.');
      return;
    }
    showToast(`Đã cập nhật trạng thái ${statusModalReq.maPhieu} → ${nextStatus}`);
    setStatusModalReq(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'Mã phiếu',
      'Ngày yêu cầu',
      'Ngày cần hàng',
      'Mã mặt hàng',
      'Tên mặt hàng',
      'Danh mục',
      'Quy cách / Thông số',
      'Số lượng',
      'Đơn vị tính',
      ...(showCosts ? ['Đơn giá dự kiến (VNĐ)', 'Thành tiền dự kiến (VNĐ)'] : []),
      'Mức độ ưu tiên',
      'Thiết bị liên quan',
      'Nhà cung cấp đề xuất',
      'Người yêu cầu',
      'Lý do yêu cầu',
      'Trạng thái',
      'Người duyệt',
      'Ngày duyệt',
      'Ghi chú duyệt',
    ];
    const rows = filteredRequests.map((r) => [
      `"${r.maPhieu}"`,
      `"${r.ngayYeuCau}"`,
      `"${r.ngayCanHang || ''}"`,
      `"${r.maMatHang || ''}"`,
      `"${r.tenMatHang.replace(/"/g, '""')}"`,
      `"${(r.danhMuc || '').replace(/"/g, '""')}"`,
      `"${(r.quyCachThongSo || '').replace(/"/g, '""')}"`,
      `"${r.soLuong}"`,
      `"${r.donViTinh}"`,
      ...(showCosts
        ? [
            `"${r.donGiaDuKien ?? ''}"`,
            `"${typeof r.donGiaDuKien === 'number' ? r.soLuong * r.donGiaDuKien : ''}"`,
          ]
        : []),
      `"${r.mucDoUuTien}"`,
      `"${r.maThietBiLienQuan || ''}"`,
      `"${(r.nhaCungCapDeXuat || '').replace(/"/g, '""')}"`,
      `"${r.nguoiYeuCau}"`,
      `"${r.lyDoYeuCau.replace(/"/g, '""')}"`,
      `"${r.trangThai}"`,
      `"${r.nguoiDuyet || ''}"`,
      `"${r.ngayDuyet || ''}"`,
      `"${(r.ghiChuDuyet || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${isToolType ? 'Yeu_cau_mua_dung_cu' : 'Yeu_cau_mua_vat_tu'}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStatusBadge = (status: PurchaseRequestStatus) => {
    switch (status) {
      case 'Đã duyệt':
        return 'bg-sky-500/20 text-sky-300 border border-sky-500/35';
      case 'Đang đặt hàng':
        return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/35';
      case 'Đã nhận hàng':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35';
      case 'Từ chối':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/35';
      default:
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/35';
    }
  };

  const renderPriorityBadge = (priority: PurchaseRequestPriority) => {
    switch (priority) {
      case 'Khẩn cấp':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/35';
      case 'Gấp':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/35';
      default:
        return 'bg-slate-700/70 text-slate-300 border border-slate-600/60';
    }
  };

  const matchesCatalogForReceive = (req: PurchaseRequest | null): boolean => {
    if (!req || !req.maMatHang || req.daNhapKho) return false;
    const code = req.maMatHang.trim().toLowerCase();
    return isToolType
      ? tools.some((t) => t.maDungCu.trim().toLowerCase() === code)
      : spareParts.some((p) => p.maVatTu.trim().toLowerCase() === code);
  };

  return (
    <div className="space-y-4">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 shadow-2xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI Strip */}
      <div className={`grid grid-cols-2 ${showCosts ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3`}>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Tổng Phiếu Đề Xuất</div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono tabular-nums mt-1">
              {stats.total}
            </div>
          </div>
          <ShoppingCart className={`w-6 h-6 ${accentCodeText} opacity-80 shrink-0`} />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Chờ Phê Duyệt</div>
            <div className="text-2xl font-extrabold text-amber-300 font-mono tabular-nums mt-1">
              {stats.pending}
            </div>
          </div>
          <Clock className="w-6 h-6 text-amber-400/80 shrink-0" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Đã Duyệt / Đang Đặt</div>
            <div className="text-2xl font-extrabold text-sky-300 font-mono tabular-nums mt-1">
              {stats.active}
            </div>
          </div>
          <Truck className="w-6 h-6 text-sky-400/80 shrink-0" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Đã Nhận Hàng</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums mt-1">
              {stats.received}
            </div>
          </div>
          <PackageCheck className="w-6 h-6 text-emerald-400/80 shrink-0" />
        </div>

        {showCosts && (
          <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-xs text-slate-400 font-medium">Dự Toán Chi Phí</div>
              <div className="text-lg font-extrabold text-emerald-300 font-mono tabular-nums mt-1 truncate">
                {formatVND(stats.estimatedBudget)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Tìm theo mã phiếu, tên ${itemLabel.toLowerCase()}, người đề xuất, NCC...`}
              className={`w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 ${accentRing}`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 ${accentRing}`}
          >
            <option value="ALL">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 ${accentRing}`}
          >
            <option value="ALL">Tất cả mức ưu tiên</option>
            {PRIORITY_OPTIONS.map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            Xuất CSV
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl ${accentBtn} text-white text-xs font-bold shadow transition whitespace-nowrap`}
          >
            <Plus className="w-4 h-4" />
            <span>{isToolType ? 'Tạo Yêu Cầu Mua Dụng Cụ' : 'Tạo Yêu Cầu Mua Vật Tư'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Compact Cards */}
      <div className="md:hidden space-y-2.5">
        {filteredRequests.map((req) => {
          const canEditThis = canApprove || req.trangThai === 'Chờ duyệt';
          return (
            <div
              key={`pr-card-${req.id}`}
              className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                    <span className={`font-mono font-bold ${accentCodeText}`}>{req.maPhieu}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{formatDateVN(req.ngayYeuCau)}</span>
                    {req.maMatHang && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-300">{req.maMatHang}</span>
                      </>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 leading-snug mt-0.5">
                    {req.tenMatHang}
                  </h4>
                </div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${renderStatusBadge(req.trangThai)}`}>
                  {req.trangThai}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-slate-800">
                <div className="font-mono tabular-nums">
                  SL: <strong className="text-slate-100">{req.soLuong} {req.donViTinh}</strong>
                  {showCosts && typeof req.donGiaDuKien === 'number' && (
                    <span className="text-emerald-400 ml-2">
                      ({formatVND(req.soLuong * req.donGiaDuKien)})
                    </span>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${renderPriorityBadge(req.mucDoUuTien)}`}>
                  {req.mucDoUuTien}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1">
                <div>
                  <span className="text-slate-500">Đề xuất:</span> {req.nguoiYeuCau}
                  {req.ngayCanHang && (
                    <span className="text-slate-400 font-mono"> · Cần ngày: {formatDateVN(req.ngayCanHang)}</span>
                  )}
                </div>
                <p className="text-slate-400 line-clamp-2">{req.lyDoYeuCau}</p>
                {req.ghiChuDuyet && (
                  <p className="text-sky-300 text-[11px]">Duyệt: {req.ghiChuDuyet}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                {canApprove && (
                  <button
                    type="button"
                    onClick={() => openStatusModal(req)}
                    className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/35 text-sky-300 border border-sky-500/30 text-xs font-bold transition"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    Duyệt / Trạng Thái
                  </button>
                )}
                {canEditThis && (
                  <button
                    type="button"
                    onClick={() => openEditModal(req)}
                    className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Chỉnh sửa phiếu"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setDeletingReq(req)}
                    className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400"
                    title="Xóa phiếu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filteredRequests.length === 0 && (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
            Chưa có phiếu yêu cầu mua {itemLabel.toLowerCase()} nào khớp bộ lọc.
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <SmartHorizontalScroll>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 whitespace-nowrap">Mã Phiếu / Ngày</th>
                <th className="py-3 px-4 min-w-[230px]">{itemLabel} &amp; Quy Cách</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Số Lượng</th>
                {showCosts && <th className="py-3 px-4 text-right whitespace-nowrap">Dự Toán</th>}
                <th className="py-3 px-4 whitespace-nowrap">Ưu Tiên</th>
                <th className="py-3 px-4 min-w-[210px]">Người Đề Xuất &amp; Lý Do</th>
                <th className="py-3 px-4 whitespace-nowrap">Trạng Thái</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredRequests.map((req) => {
                const canEditThis = canApprove || req.trangThai === 'Chờ duyệt';
                const totalAmount =
                  typeof req.donGiaDuKien === 'number' ? req.soLuong * req.donGiaDuKien : null;
                return (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <div className={`font-mono font-bold ${accentCodeText}`}>{req.maPhieu}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5 tabular-nums">
                        {formatDateVN(req.ngayYeuCau)}
                      </div>
                      {req.ngayCanHang && (
                        <div className="text-[10px] font-mono text-amber-300 mt-0.5 tabular-nums">
                          Cần: {formatDateVN(req.ngayCanHang)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5 flex-wrap">
                        <span>{req.tenMatHang}</span>
                        {req.daNhapKho && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            Đã nhập kho
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 space-x-1.5">
                        {req.maMatHang && <span className="font-mono text-slate-300">[{req.maMatHang}]</span>}
                        {req.danhMuc && <span>{req.danhMuc}</span>}
                        {req.maThietBiLienQuan && (
                          <span className="font-mono text-cyan-300">· TB: {req.maThietBiLienQuan}</span>
                        )}
                      </div>
                      {req.quyCachThongSo && (
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {req.quyCachThongSo}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 align-top text-center whitespace-nowrap font-mono tabular-nums">
                      <span className="text-slate-100 font-extrabold text-sm">{req.soLuong}</span>{' '}
                      <span className="text-slate-400 font-sans">{req.donViTinh}</span>
                    </td>

                    {showCosts && (
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap font-mono tabular-nums">
                        {totalAmount !== null ? (
                          <div>
                            <div className="text-emerald-300 font-bold">{formatVND(totalAmount)}</div>
                            <div className="text-[10px] text-slate-400">
                              {formatVND(req.donGiaDuKien || 0)}/{req.donViTinh}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    )}

                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${renderPriorityBadge(
                          req.mucDoUuTien
                        )}`}
                      >
                        {req.mucDoUuTien}
                      </span>
                    </td>

                    <td className="py-3 px-4 align-top max-w-xs">
                      <div className="font-semibold text-slate-200">{req.nguoiYeuCau}</div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{req.lyDoYeuCau}</p>
                      {req.nhaCungCapDeXuat && (
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                          NCC đề xuất: {req.nhaCungCapDeXuat}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${renderStatusBadge(
                          req.trangThai
                        )}`}
                      >
                        {req.trangThai}
                      </span>
                      {req.nguoiDuyet && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          Duyệt: {req.nguoiDuyet}
                        </div>
                      )}
                      {req.ghiChuDuyet && (
                        <div className="text-[10px] text-sky-300 mt-0.5 max-w-[170px] truncate" title={req.ghiChuDuyet}>
                          {req.ghiChuDuyet}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {canApprove && (
                          <button
                            type="button"
                            onClick={() => openStatusModal(req)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/35 text-sky-300 border border-sky-500/30 text-xs font-bold transition"
                            title="Phê duyệt & Cập nhật trạng thái mua hàng"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Duyệt</span>
                          </button>
                        )}
                        {canEditThis && (
                          <button
                            type="button"
                            onClick={() => openEditModal(req)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Chỉnh sửa phiếu đề xuất"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeletingReq(req)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                            title="Xóa phiếu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={showCosts ? 8 : 7} className="py-10 text-center text-slate-400">
                    Chưa có phiếu yêu cầu mua {itemLabel.toLowerCase()} nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </SmartHorizontalScroll>
      </div>

      {/* Create / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/70">
              <div className="flex items-center gap-2.5">
                <ShoppingCart className={`w-5 h-5 ${accentCodeText}`} />
                <h3 className="text-base font-bold text-slate-100">
                  {editingReq
                    ? `Chỉnh Sửa Phiếu Yêu Cầu [${editingReq.maPhieu}]`
                    : isToolType
                    ? 'Tạo Yêu Cầu Mua Dụng Cụ, Đồ Nghề'
                    : 'Tạo Yêu Cầu Mua Vật Tư, Phụ Tùng'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs max-h-[78vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-300 flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Chọn Nhanh Từ Danh Mục Hiện Có (Hoặc bỏ trống để đề xuất mua mới)
                </label>
                <select
                  value={selectedCatalogCode}
                  onChange={(e) => handleCatalogSelect(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 ${accentRing}`}
                >
                  <option value="">-- Ngoài danh mục / Đề xuất mặt hàng mới --</option>
                  {isToolType
                    ? tools.map((t) => (
                        <option key={t.id} value={t.maDungCu}>
                          [{t.maDungCu}] {t.tenDungCu} (Khả dụng: {t.soLuongKhaDung}/{t.soLuongTong} {t.donViTinh})
                        </option>
                      ))
                    : spareParts.map((p) => (
                        <option key={p.maVatTu} value={p.maVatTu}>
                          [{p.maVatTu}] {p.tenVatTu} (Tồn: {p.tonThucTe}/{p.tonToiThieu} {p.donViTinh})
                        </option>
                      ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Mã Mặt Hàng (nếu có)</label>
                  <input
                    type="text"
                    value={maMatHang}
                    onChange={(e) => setMaMatHang(e.target.value)}
                    placeholder={isToolType ? 'VD: TOOL-ELC-01' : 'VD: SP-CH-001'}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:ring-2 ${accentRing}`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-300 block mb-1">
                    Tên {itemLabel} Cần Mua *
                  </label>
                  <input
                    type="text"
                    required
                    value={tenMatHang}
                    onChange={(e) => setTenMatHang(e.target.value)}
                    placeholder={
                      isToolType
                        ? 'VD: Ampe kìm Fluke 376 FC hoặc Bộ lục giác cách điện 1000V'
                        : 'VD: Lọc tách dầu máy nén khí GA75 / Phốt cơ khí...'
                    }
                    className={`w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 ${accentRing}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Danh Mục / Phân Nhóm</label>
                  <input
                    type="text"
                    value={danhMuc}
                    onChange={(e) => setDanhMuc(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 ${accentRing}`}
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Quy Cách / Model / Thông Số Kỹ Thuật
                  </label>
                  <input
                    type="text"
                    value={quyCachThongSo}
                    onChange={(e) => setQuyCachThongSo(e.target.value)}
                    placeholder="Hãng SX, kích thước, điện áp, part number..."
                    className={`w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 ${accentRing}`}
                  />
                </div>
              </div>

              <div className={`grid grid-cols-2 ${showCosts ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3.5`}>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Số Lượng *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={soLuong}
                    onChange={(e) => setSoLuong(Math.max(1, Number(e.target.value) || 1))}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:ring-2 ${accentRing}`}
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Đơn Vị Tính *</label>
                  <input
                    type="text"
                    required
                    value={donViTinh}
                    onChange={(e) => setDonViTinh(e.target.value)}
                    placeholder="Bộ / Cái / Hộp"
                    className={`w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 ${accentRing}`}
                  />
                </div>
                {showCosts && (
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Đơn Giá Dự Kiến (VNĐ)</label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={donGiaDuKien}
                      onChange={(e) => setDonGiaDuKien(e.target.value)}
                      placeholder="VD: 1500000"
                      className={`w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:ring-2 ${accentRing}`}
                    />
                  </div>
                )}
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Mức Độ Ưu Tiên</label>
                  <select
                    value={mucDoUuTien}
                    onChange={(e) => setMucDoUuTien(e.target.value as PurchaseRequestPriority)}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 ${accentRing}`}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Ngày Cần Hàng</label>
                  <input
                    type="date"
                    value={ngayCanHang}
                    onChange={(e) => setNgayCanHang(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:ring-2 ${accentRing}`}
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Thiết Bị Liên Quan</label>
                  <select
                    value={maThietBiLienQuan}
                    onChange={(e) => setMaThietBiLienQuan(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 ${accentRing}`}
                  >
                    <option value="">-- Dùng chung / Không gắn máy --</option>
                    {equipment.map((eq) => (
                      <option key={eq.maThietBi} value={eq.maThietBi}>
                        {eq.maThietBi} - {eq.tenThietBi}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Nhà Cung Cấp Đề Xuất</label>
                  <input
                    type="text"
                    value={nhaCungCapDeXuat}
                    onChange={(e) => setNhaCungCapDeXuat(e.target.value)}
                    placeholder="Tên NCC (nếu có)..."
                    className={`w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 ${accentRing}`}
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Lý Do / Mục Đích Đề Xuất Mua *
                </label>
                <textarea
                  rows={2}
                  required
                  value={lyDoYeuCau}
                  onChange={(e) => setLyDoYeuCau(e.target.value)}
                  placeholder="Nêu rõ tình trạng thiếu hụt, hư hỏng hoặc kế hoạch bảo trì cần dùng..."
                  className={`w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 ${accentRing}`}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Ghi Chú Bổ Sung</label>
                <input
                  type="text"
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 ${accentRing}`}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl ${accentBtn} text-white font-bold shadow`}
                >
                  {editingReq ? 'Lưu Thay Đổi' : 'Gửi Phiếu Đề Xuất Mua'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval / Status Modal */}
      {statusModalReq && canApprove && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/70">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Phê Duyệt &amp; Cập Nhật Mua Hàng
                </h3>
                <p className={`text-xs font-mono mt-0.5 ${accentCodeText}`}>
                  {statusModalReq.maPhieu} · {statusModalReq.tenMatHang} ({statusModalReq.soLuong}{' '}
                  {statusModalReq.donViTinh})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalReq(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="p-6 space-y-4 text-xs">
              {statusError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-300">
                  {statusError}
                </div>
              )}

              <div className="space-y-2">
                <label className="font-semibold text-slate-300 block">Trạng Thái Tiếp Theo *</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNextStatus(st)}
                      className={`px-3 py-2 rounded-xl border text-left font-bold transition flex items-center gap-1.5 ${
                        nextStatus === st
                          ? 'bg-sky-600/25 border-sky-400 text-sky-200'
                          : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st === 'Từ chối' ? (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      ) : st === 'Đã nhận hàng' ? (
                        <PackageCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <ClipboardCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      )}
                      <span>{st}</span>
                    </button>
                  ))}
                </div>
              </div>

              {nextStatus === 'Đã nhận hàng' && matchesCatalogForReceive(statusModalReq) && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/35 border border-emerald-500/35 text-emerald-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoReceiveToInventory}
                    onChange={(e) => setAutoReceiveToInventory(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-500 focus:ring-0"
                  />
                  <span>
                    Tự động cộng{' '}
                    <strong>
                      +{statusModalReq.soLuong} {statusModalReq.donViTinh}
                    </strong>{' '}
                    vào tồn kho danh mục ({statusModalReq.maMatHang}) và ghi sổ nhập kho
                  </span>
                </label>
              )}

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Ý Kiến Phê Duyệt / Ghi Chú Mua Hàng
                </label>
                <textarea
                  rows={3}
                  value={ghiChuDuyet}
                  onChange={(e) => setGhiChuDuyet(e.target.value)}
                  placeholder="VD: Đã duyệt mua từ NCC..., dự kiến giao ngày..., hoặc lý do từ chối..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatusModalReq(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow"
                >
                  Lưu Trạng Thái
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirm Delete Modal */}
      {deletingReq && canDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Xác Nhận Xóa Phiếu Đề Xuất</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa phiếu{' '}
              <strong className={`${accentCodeText} font-mono`}>{deletingReq.maPhieu}</strong> (
              <strong className="text-white">{deletingReq.tenMatHang}</strong>)?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReq(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePurchaseRequest(deletingReq.id);
                  showToast(`Đã xóa phiếu ${deletingReq.maPhieu}`);
                  setDeletingReq(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
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
