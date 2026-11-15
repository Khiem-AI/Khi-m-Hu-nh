import React, { useState } from 'react';
import { Equipment, MaintenanceHistory, MaintenanceWorkType, Ticket } from '../types/cmms';
import { useCMMS } from '../context/CMMSContext';
import { formatDateVN, getHistoryWorkType } from '../utils/cmmsLogic';
import { resolveImageUrl, isDirectUploadedImage, getCategoryFallbackImage } from '../utils/imageUtils';
import {
  X,
  QrCode,
  Wrench,
  Hammer,
  AlertTriangle,
  Calendar,
  User,
  MapPin,
  Activity,
  Zap,
  ZoomIn,
  ExternalLink,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sliders,
} from 'lucide-react';

interface EquipmentDetailModalProps {
  equipment: Equipment | null;
  onClose: () => void;
  onOpenQR: (eq: Equipment) => void;
  onOpenMaintenance: (eq: Equipment, workType?: MaintenanceWorkType) => void;
  onOpenTicket: (eq: Equipment) => void;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipment,
  onClose,
  onOpenQR,
  onOpenMaintenance,
  onOpenTicket,
}) => {
  const { maintenanceHistory, tickets } = useCMMS();
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'ALL' | MaintenanceWorkType>('ALL');

  if (!equipment) return null;

  // Linked maintenance history & tickets
  const linkedHistory: MaintenanceHistory[] = maintenanceHistory.filter(
    (h) => h.maThietBi === equipment.maThietBi
  );
  const linkedTickets: Ticket[] = tickets.filter(
    (t) => t.moTaChiTiet?.includes(equipment.maThietBi) || t.tieuDe?.includes(equipment.tenThietBi)
  );

  const rawImg = equipment.hinhAnh?.trim();
  const isReal = isDirectUploadedImage(rawImg);
  const resolved = rawImg ? resolveImageUrl(rawImg) : '';
  const fallback = getCategoryFallbackImage(equipment.heThong);
  const displaySrc = imageError ? fallback : resolved || fallback;

  // Parse structured specifications from semicolon or pipe delimited string
  const rawSpecs = equipment.thongSoKyThuat || '';
  const specItems = rawSpecs
    .split(/[|;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {equipment.maThietBi}
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 flex items-center gap-2">
                  {equipment.tenThietBi}
                  {isReal && !imageError && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Có ảnh thực tế
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">{equipment.heThong}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition"
              title="Đóng modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-300">
            {/* Top Grid: Photo & Primary Info */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Photo Showcase (5 cols) */}
              <div className="md:col-span-5 flex flex-col">
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-4/3 flex items-center justify-center group shadow-inner">
                  {displaySrc ? (
                    <img
                      src={displaySrc}
                      alt={equipment.tenThietBi}
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-500">
                      <Zap className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Chưa có ảnh thực tế</p>
                    </div>
                  )}

                  {/* Badges on image */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                    {isReal && !imageError && (
                      <span className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                        Ảnh thực tế máy móc
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shadow ${
                        equipment.mucDoRuiRo === 'High'
                          ? 'bg-rose-500/90 text-white'
                          : equipment.mucDoRuiRo === 'Medium'
                          ? 'bg-amber-500/90 text-slate-950'
                          : 'bg-emerald-500/90 text-slate-950'
                      }`}
                    >
                      Rủi ro: {equipment.mucDoRuiRo}
                    </span>
                  </div>

                  {/* Zoom Lightbox Trigger */}
                  {displaySrc && (
                    <button
                      onClick={() => setIsZoomed(true)}
                      className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700/80 transition shadow flex items-center gap-1.5 text-xs font-semibold"
                      title="Phóng to ảnh"
                    >
                      <ZoomIn className="w-4 h-4 text-cyan-400" />
                      <span>Xem phóng to</span>
                    </button>
                  )}
                </div>

                {/* Direct image link if available */}
                {rawImg && (
                  <div className="mt-2 text-right">
                    <a
                      href={rawImg}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Mở link gốc (Google Drive)
                    </a>
                  </div>
                )}
              </div>

              {/* Primary Metadata Details (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Vị trí lắp đặt
                    </span>
                    <p className="font-semibold text-slate-100 text-sm">{equipment.viTri}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" /> Trạng thái
                    </span>
                    <p className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          equipment.trangThai === 'Hoạt động'
                            ? 'bg-emerald-400'
                            : equipment.trangThai === 'Đang sửa chữa'
                            ? 'bg-rose-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      {equipment.trangThai}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" /> Tần suất bảo dưỡng
                    </span>
                    <p className="font-semibold text-slate-100 text-sm">{equipment.tanSuat}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-400" /> Hạn bảo trì tiếp theo
                    </span>
                    <p className="font-mono font-bold text-rose-400 text-sm">
                      {formatDateVN(equipment.hanBaoTriTiepTheo)}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1 col-span-2">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" /> Nhân viên phụ trách
                    </span>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-100 text-sm">{equipment.nguoiPhuTrach}</p>
                      <span className="text-slate-400 font-mono text-[11px]">{equipment.email}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenQR(equipment);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 transition"
                  >
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    Mã QR & Thẻ Máy
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenMaintenance(equipment, 'Bảo trì theo kế hoạch');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-900/30 whitespace-nowrap"
                  >
                    <Wrench className="w-4 h-4" />
                    Bảo Trì Kế Hoạch
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenMaintenance(equipment, 'Sửa chữa');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-600/25 hover:bg-amber-600/40 text-amber-200 border border-amber-500/40 font-semibold text-xs transition whitespace-nowrap"
                  >
                    <Hammer className="w-4 h-4 text-amber-400" />
                    Ghi Nhận Sửa Chữa
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTicket(equipment);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/35 text-rose-200 border border-rose-500/30 font-semibold text-xs transition whitespace-nowrap"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Báo Sự Cố / Ticket
                  </button>
                </div>
              </div>
            </div>

            {/* Technical Specifications Section */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Thông Số Kỹ Thuật Chi Tiết (Plate & Specs)
                </h4>
                <span className="text-[11px] text-slate-500">{specItems.length} hạng mục thông số</span>
              </div>

              {specItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {specItems.map((spec, idx) => {
                    // Check if it has a key: value structure
                    const colonIdx = spec.indexOf(':');
                    if (colonIdx > 0 && colonIdx < 30) {
                      const key = spec.slice(0, colonIdx).trim();
                      const val = spec.slice(colonIdx + 1).trim();
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
                        >
                          <span className="text-[11px] text-slate-400 font-medium">{key}</span>
                          <span className="text-xs font-semibold text-slate-100 mt-0.5">{val}</span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium"
                      >
                        {spec}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Chưa có thông số kỹ thuật chi tiết.</p>
              )}
            </div>

            {/* Linked Maintenance History & Tickets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* History */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Lịch Sử Bảo Trì & Sửa Chữa ({linkedHistory.length})
                  </h4>
                  <select
                    value={historyTypeFilter}
                    onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                    className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-200"
                  >
                    <option value="ALL">Tất cả loại</option>
                    <option value="Bảo trì theo kế hoạch">Bảo trì theo kế hoạch</option>
                    <option value="Sửa chữa">Sửa chữa</option>
                  </select>
                </div>
                {linkedHistory.filter(
                  (h) => historyTypeFilter === 'ALL' || getHistoryWorkType(h) === historyTypeFilter
                ).length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {linkedHistory
                      .filter(
                        (h) =>
                          historyTypeFilter === 'ALL' || getHistoryWorkType(h) === historyTypeFilter
                      )
                      .map((h, i) => {
                        const workType = getHistoryWorkType(h);
                        return (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-cyan-400 tabular-nums">
                                  {formatDateVN(h.ngayThucHien)}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span
                                  className={`font-semibold ${
                                    workType === 'Sửa chữa' ? 'text-amber-300' : 'text-emerald-400'
                                  }`}
                                >
                                  {workType}
                                </span>
                              </div>
                              <span className="text-slate-400 truncate">{h.nguoiThucHien}</span>
                            </div>
                            <p className="text-slate-200 line-clamp-2">{h.moTaCongViec}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                              <span>
                                Kết quả: <strong className="text-emerald-400">{h.ketQua}</strong>
                              </span>
                              {h.thoiGianDungMay > 0 && (
                                <span className="tabular-nums">Dừng máy: {h.thoiGianDungMay} phút</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">
                    Chưa có biên bản phù hợp trong lịch sử thiết bị.
                  </p>
                )}
              </div>

              {/* Tickets */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Yêu Cầu / Sự Cố Liên Quan ({linkedTickets.length})
                </h4>
                {linkedTickets.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {linkedTickets.map((t) => (
                      <div
                        key={t.maTicket}
                        className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-amber-400">{t.maTicket}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.trangThai === 'Hoàn thành'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {t.trangThai}
                          </span>
                        </div>
                        <p className="text-slate-200 font-semibold">{t.tieuDe}</p>
                        <p className="text-slate-400 text-[11px] line-clamp-1">{t.moTaChiTiet}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">
                    Không có ticket sự cố nào ghi nhận cho máy này.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {isZoomed && displaySrc && (
        <div
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute -top-12 right-0 p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition"
              title="Đóng phóng to"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={displaySrc}
              alt={equipment.tenThietBi}
              referrerPolicy="no-referrer"
              className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800"
            />
            <div className="mt-3 text-center text-xs text-slate-300 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800">
              <strong className="text-cyan-400 font-mono">{equipment.maThietBi}</strong> - {equipment.tenThietBi} ({equipment.viTri})
              {isReal && <span className="ml-2 text-emerald-400 font-bold">• Ảnh thực tế nhà máy</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
