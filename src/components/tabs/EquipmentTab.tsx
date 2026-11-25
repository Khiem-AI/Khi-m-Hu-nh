import React, { useState } from 'react';
import { useCMMS } from '../../context/CMMSContext';
import { UI_TEXTS } from '../../config/uiTexts';
import { Equipment, MaintenanceWorkType, RiskLevel, EquipmentStatus } from '../../types/cmms';
import { canAssignWork, canDeleteRecords, formatDateVN } from '../../utils/cmmsLogic';
import { EquipmentImage, isDirectUploadedImage } from '../../utils/imageUtils';
import { EquipmentDetailModal } from '../EquipmentDetailModal';
import { WorkAssignmentModal } from '../common/WorkAssignmentModal';
import { SmartHorizontalScroll } from '../common/SmartHorizontalScroll';
import {
  Search,
  Plus,
  QrCode,
  Wrench,
  Hammer,
  AlertTriangle,
  Edit,
  Trash2,
  Download,
  LayoutGrid,
  List,
  Eye,
  Camera,
  CheckCircle2,
  ShieldAlert,
  Send,
} from 'lucide-react';

interface EquipmentTabProps {
  onOpenQR: (eq: Equipment) => void;
  onOpenMaintenance: (eq: Equipment, workType?: MaintenanceWorkType) => void;
  onOpenTicket: (eq: Equipment) => void;
  onOpenAddEquipment: () => void;
  onOpenEditEquipment: (eq: Equipment) => void;
}

export const EquipmentTab: React.FC<EquipmentTabProps> = ({
  onOpenQR,
  onOpenMaintenance,
  onOpenTicket,
  onOpenAddEquipment,
  onOpenEditEquipment,
}) => {
  const { equipment, deleteEquipment, currentUser } = useCMMS();
  const canDelete = canDeleteRecords(currentUser);
  const allowAssignWork = canAssignWork(currentUser);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [onlyWithRealPhotos, setOnlyWithRealPhotos] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedEquipmentForDetail, setSelectedEquipmentForDetail] = useState<Equipment | null>(null);
  const [equipmentToAssign, setEquipmentToAssign] = useState<Equipment | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Distinct systems list
  const systems = Array.from(new Set(equipment.map((e) => e.heThong))).filter(Boolean);

  // Filtering
  const filtered = equipment.filter((item) => {
    const matchSearch =
      item.maThietBi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tenThietBi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.viTri.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.thongSoKyThuat.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSystem = selectedSystem === 'ALL' || item.heThong === selectedSystem;
    const matchRisk = selectedRisk === 'ALL' || item.mucDoRuiRo === selectedRisk;
    const matchStatus = selectedStatus === 'ALL' || item.trangThai === selectedStatus;
    const matchPhoto = !onlyWithRealPhotos || isDirectUploadedImage(item.hinhAnh);

    return matchSearch && matchSystem && matchRisk && matchStatus && matchPhoto;
  });

  const totalWithRealPhotos = equipment.filter((e) => isDirectUploadedImage(e.hinhAnh)).length;

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Mã thiết bị',
      'Tên thiết bị',
      'Hệ thống/danh mục',
      'Vị trí',
      'Mức độ rủi ro',
      'Trạng thái',
      'Tần suất',
      'Hạn bảo trì tiếp theo',
      'Người phụ trách',
      'Email',
      'Thông số kỹ thuật',
      'Hình ảnh URL',
    ];

    const rows = filtered.map((e) => [
      `"${e.maThietBi}"`,
      `"${e.tenThietBi}"`,
      `"${e.heThong}"`,
      `"${e.viTri}"`,
      `"${e.mucDoRuiRo}"`,
      `"${e.trangThai}"`,
      `"${e.tanSuat}"`,
      `"${e.hanBaoTriTiepTheo}"`,
      `"${e.nguoiPhuTrach}"`,
      `"${e.email}"`,
      `"${e.thongSoKyThuat.replace(/"/g, '""')}"`,
      `"${e.hinhAnh || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh_sach_thiet_bi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMsg}</span>
        </div>
      )}
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">({equipment.length} máy móc thiết bị)</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Camera className="w-3 h-3" />
              {totalWithRealPhotos} có ảnh thực tế
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mt-1">
            {UI_TEXTS.tabs.equipment.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Xuất Excel/CSV
          </button>
          <button
            onClick={onOpenAddEquipment}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-cyan-900/30 transition"
          >
            <Plus className="w-4 h-4" />
            Thêm Thiết Bị
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã máy, tên thiết bị, vị trí, model..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* System filter */}
          <div>
            <select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">Tất cả hệ thống ({systems.length})</option>
              {systems.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Risk filter */}
          <div>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">Mức độ rủi ro (Tất cả)</option>
              <option value="High">Rủi ro: High (Cao)</option>
              <option value="Medium">Rủi ro: Medium (Trung bình)</option>
              <option value="Low">Rủi ro: Low (Thấp)</option>
            </select>
          </div>

          {/* Status filter & View mode */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">Trạng thái (Tất cả)</option>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Đang sửa chữa">Đang sửa chữa</option>
              <option value="Bảo trì">Bảo trì</option>
              <option value="Tạm dừng">Tạm dừng</option>
            </select>

            <div className="flex rounded-xl bg-slate-800 border border-slate-700 p-0.5">
              <button
                onClick={() => setViewMode('table')}
                aria-label="Dạng bảng"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Dạng thẻ"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-500 font-medium">Lọc nhanh:</span>
          <button
            onClick={() => setOnlyWithRealPhotos(!onlyWithRealPhotos)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
              onlyWithRealPhotos
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Có ảnh thực tế ({totalWithRealPhotos})
          </button>

          <button
            onClick={() => setSelectedRisk(selectedRisk === 'High' ? 'ALL' : 'High')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
              selectedRisk === 'High'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Rủi ro cao (High)
          </button>

          <button
            onClick={() =>
              setSelectedStatus(selectedStatus === 'Đang sửa chữa' ? 'ALL' : 'Đang sửa chữa')
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
              selectedStatus === 'Đang sửa chữa'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Đang sửa chữa
          </button>

          {/* Counter */}
          <div className="text-xs text-slate-400 ml-auto flex items-center gap-2">
            <span>
              Hiển thị <strong className="text-cyan-400">{filtered.length}</strong> / {equipment.length} thiết bị
            </span>
            {(searchTerm ||
              selectedSystem !== 'ALL' ||
              selectedRisk !== 'ALL' ||
              selectedStatus !== 'ALL' ||
              onlyWithRealPhotos) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSystem('ALL');
                  setSelectedRisk('ALL');
                  setSelectedStatus('ALL');
                  setOnlyWithRealPhotos(false);
                }}
                className="text-cyan-400 hover:underline"
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
          <SmartHorizontalScroll>
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-center">Hình Ảnh</th>
                  <th className="py-3 px-4">Mã Thiết Bị</th>
                  <th className="py-3 px-4">Tên Thiết Bị & Hệ Thống</th>
                  <th className="py-3 px-4">Vị Trí Lắp Đặt</th>
                  <th className="py-3 px-4">Rủi Ro</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Tần Suất</th>
                  <th className="py-3 px-4">Hạn Bảo Trì Kế Tiếp</th>
                  <th className="py-3 px-4">Phụ Trách</th>
                  <th className="py-3 px-4 text-center">QR Code</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filtered.map((item, idx) => {
                  const hasReal = isDirectUploadedImage(item.hinhAnh);
                  return (
                    <tr
                      key={`${item.maThietBi}-${item.viTri}-${idx}`}
                      className="hover:bg-slate-800/40 transition group cursor-pointer"
                      onClick={() => setSelectedEquipmentForDetail(item)}
                    >
                      {/* Image Thumbnail Column */}
                      <td
                        className="py-2.5 px-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEquipmentForDetail(item);
                        }}
                      >
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-800 mx-auto shadow bg-slate-950 group-hover:border-cyan-500/60 transition">
                          <EquipmentImage
                            src={item.hinhAnh}
                            alt={item.tenThietBi}
                            category={item.heThong}
                            className="w-full h-full object-cover"
                          />
                          {hasReal && (
                            <span
                              title="Ảnh chụp thực tế nhà máy"
                              className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950"
                            />
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                        {item.maThietBi}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                          {item.tenThietBi}
                          {hasReal && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Ảnh thật
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{item.heThong}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{item.viTri}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.mucDoRuiRo === 'High'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : item.mucDoRuiRo === 'Medium'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {item.mucDoRuiRo}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                            item.trangThai === 'Hoạt động'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : item.trangThai === 'Đang sửa chữa'
                              ? 'bg-rose-500/10 text-rose-400 font-bold'
                              : 'bg-amber-500/10 text-amber-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.trangThai === 'Hoạt động'
                                ? 'bg-emerald-400'
                                : item.trangThai === 'Đang sửa chữa'
                                ? 'bg-rose-400 animate-ping'
                                : 'bg-amber-400'
                            }`}
                          ></span>
                          {item.trangThai}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-300">
                        {item.tanSuat}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-200">
                        {formatDateVN(item.hanBaoTriTiepTheo)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200">{item.nguoiPhuTrach}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {item.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenQR(item);
                          }}
                          title="Xem & in mã QR"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">QR</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setSelectedEquipmentForDetail(item)}
                            title="Xem chi tiết & ảnh máy"
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {allowAssignWork && (
                            <button
                              onClick={() => setEquipmentToAssign(item)}
                              title="Giao việc & Gửi email tới người phụ trách"
                              className="p-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-400 transition"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onOpenMaintenance(item, 'Bảo trì theo kế hoạch')}
                            title="Bảo trì theo kế hoạch (lưu lịch sử & tạo lịch kế tiếp)"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenMaintenance(item, 'Sửa chữa')}
                            title="Ghi nhận sửa chữa thiết bị (chỉ lưu vào lịch sử thiết bị)"
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition"
                          >
                            <Hammer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenTicket(item)}
                            title="Tạo ticket báo sự cố"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenEditEquipment(item)}
                            title="Sửa thông tin"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => {
                                deleteEquipment(item.maThietBi);
                              }}
                              title="Xóa máy"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-4 h-4" />
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
      ) : (
        /* Grid Cards View with Photo Banners */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, idx) => {
            const hasReal = isDirectUploadedImage(item.hinhAnh);
            return (
              <div
                key={`${item.maThietBi}-${item.viTri}-${idx}`}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-cyan-500/50 transition flex flex-col justify-between shadow-lg group"
              >
                <div>
                  {/* Photo Header Banner */}
                  <div
                    onClick={() => setSelectedEquipmentForDetail(item)}
                    className="relative w-full h-44 bg-slate-950 overflow-hidden cursor-pointer"
                  >
                    <EquipmentImage
                      src={item.hinhAnh}
                      alt={item.tenThietBi}
                      category={item.heThong}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      showBadge={true}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded shadow ${
                          item.mucDoRuiRo === 'High'
                            ? 'bg-rose-500 text-white'
                            : item.mucDoRuiRo === 'Medium'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        {item.mucDoRuiRo}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenQR(item);
                        }}
                        className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-900 text-cyan-300 backdrop-blur-sm border border-slate-700/80 transition"
                        title="Mã QR máy"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom machine badge */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between z-10">
                      <span className="font-mono text-xs font-bold text-cyan-300 bg-slate-950/80 border border-cyan-500/40 px-2 py-0.5 rounded backdrop-blur-sm">
                        {item.maThietBi}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEquipmentForDetail(item);
                        }}
                        className="text-[11px] font-semibold text-slate-200 bg-slate-950/70 hover:bg-slate-900 px-2 py-0.5 rounded border border-slate-700/80 flex items-center gap-1 backdrop-blur-sm"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        Chi tiết
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3
                        onClick={() => setSelectedEquipmentForDetail(item)}
                        className="text-base font-bold text-slate-100 hover:text-cyan-400 transition cursor-pointer leading-snug"
                      >
                        {item.tenThietBi}
                      </h3>
                      <p className="text-xs text-slate-400">{item.heThong}</p>
                    </div>

                    <div className="text-xs space-y-1.5 text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vị trí:</span>
                        <span className="font-medium text-slate-200">{item.viTri}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tần suất bảo trì:</span>
                        <span className="font-medium text-slate-200">{item.tanSuat}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hạn bảo trì:</span>
                        <span className="font-mono font-bold text-rose-400">
                          {formatDateVN(item.hanBaoTriTiepTheo)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phụ trách:</span>
                        <span className="font-medium text-slate-200">{item.nguoiPhuTrach}</span>
                      </div>
                    </div>

                    {item.thongSoKyThuat && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                        {item.thongSoKyThuat}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 pt-0 border-t border-slate-800/80 flex items-center justify-between">
                  <span
                    className={`text-[11px] font-medium flex items-center gap-1.5 ${
                      item.trangThai === 'Hoạt động'
                        ? 'text-emerald-400'
                        : item.trangThai === 'Đang sửa chữa'
                        ? 'text-rose-400 font-bold'
                        : 'text-amber-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.trangThai === 'Hoạt động'
                          ? 'bg-emerald-400'
                          : item.trangThai === 'Đang sửa chữa'
                          ? 'bg-rose-400 animate-ping'
                          : 'bg-amber-400'
                      }`}
                    />
                    {item.trangThai}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {allowAssignWork && (
                      <button
                        onClick={() => setEquipmentToAssign(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/30 font-semibold text-xs transition"
                        title="Giao việc & Gửi email"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Giao Việc
                      </button>
                    )}
                    <button
                      onClick={() => onOpenMaintenance(item, 'Bảo trì theo kế hoạch')}
                      title="Bảo trì theo kế hoạch (lưu lịch sử & tạo lịch kế tiếp)"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Bảo Trì
                    </button>
                    <button
                      onClick={() => onOpenMaintenance(item, 'Sửa chữa')}
                      title="Ghi nhận sửa chữa (chỉ lưu vào lịch sử thiết bị)"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/35 text-amber-300 border border-amber-500/30 font-semibold text-xs transition"
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      Sửa Chữa
                    </button>
                    <button
                      onClick={() => onOpenTicket(item)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition"
                      title="Báo sự cố (Ticket)"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenEditEquipment(item)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Sửa thông tin"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Equipment Detail Modal */}
      {selectedEquipmentForDetail && (
        <EquipmentDetailModal
          equipment={selectedEquipmentForDetail}
          onClose={() => setSelectedEquipmentForDetail(null)}
          onOpenQR={onOpenQR}
          onOpenMaintenance={onOpenMaintenance}
          onOpenTicket={onOpenTicket}
        />
      )}

      {/* Work Assignment & Email Dispatch Modal */}
      {equipmentToAssign && allowAssignWork && (
        <WorkAssignmentModal
          isOpen={Boolean(equipmentToAssign)}
          onClose={() => setEquipmentToAssign(null)}
          module="THIET_BI"
          targetId={equipmentToAssign.maThietBi}
          targetName={equipmentToAssign.tenThietBi}
          currentAssignee={equipmentToAssign.nguoiPhuTrach}
          currentAssigner={equipmentToAssign.nguoiGiaoViec}
          onAssigned={showToast}
        />
      )}
    </div>
  );
};
