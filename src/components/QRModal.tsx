import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Equipment } from '../types/cmms';
import { resolveImageUrl, isDirectUploadedImage, getCategoryFallbackImage } from '../utils/imageUtils';
import { X, Printer, Wrench, AlertTriangle, ExternalLink, Camera } from 'lucide-react';

interface QRModalProps {
  equipment: Equipment | null;
  onClose: () => void;
  onOpenMaintenance?: (equipment: Equipment) => void;
  onOpenTicket?: (equipment: Equipment) => void;
}

export const QRModal: React.FC<QRModalProps> = ({
  equipment,
  onClose,
  onOpenMaintenance,
  onOpenTicket,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (equipment && canvasRef.current) {
      // Generate QR Code containing the equipment payload or CMMS URL
      const qrData = JSON.stringify({
        cmms_id: equipment.maThietBi,
        name: equipment.tenThietBi,
        system: equipment.heThong,
        loc: equipment.viTri,
      });

      QRCode.toCanvas(canvasRef.current, qrData, {
        width: 170,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    }
  }, [equipment]);

  if (!equipment) return null;

  const handlePrint = () => {
    window.print();
  };

  const rawImg = equipment.hinhAnh?.trim();
  const hasRealPhoto = isDirectUploadedImage(rawImg);
  const resolvedImg = rawImg ? resolveImageUrl(rawImg) : getCategoryFallbackImage(equipment.heThong);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-sm">
              QR
            </span>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">Thẻ Nhãn Thiết Bị & Mã QR</h3>
              <p className="text-xs text-slate-400">Dán trực tiếp tại máy để quét kiểm tra hiện trường</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng modal"
            className="rounded-lg p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable QR Card Body */}
        <div className="p-6 space-y-6">
          <div
            id="printable-qr-tag"
            className="bg-white text-slate-900 p-5 rounded-2xl border-2 border-dashed border-slate-300 shadow-inner space-y-4"
          >
            {/* Top row with photo, QR canvas, and basic info */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow-sm border border-slate-200 shrink-0">
                <canvas ref={canvasRef} className="rounded" />
                <span className="mt-1 font-mono text-[11px] font-extrabold tracking-wider text-slate-900">
                  {equipment.maThietBi}
                </span>
              </div>

              {/* Photo & Identity */}
              <div className="space-y-2 flex-1 text-center sm:text-left w-full">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span
                    className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded ${
                      equipment.mucDoRuiRo === 'High'
                        ? 'bg-rose-100 text-rose-700'
                        : equipment.mucDoRuiRo === 'Medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    Rủi ro: {equipment.mucDoRuiRo}
                  </span>
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {equipment.tanSuat}
                  </span>
                  {hasRealPhoto && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Ảnh thực tế
                    </span>
                  )}
                </div>

                <h4 className="text-lg font-extrabold text-slate-950 leading-tight">
                  {equipment.tenThietBi}
                </h4>

                <div className="text-xs space-y-1 text-slate-700">
                  <p>
                    <strong className="text-slate-900">Hệ thống:</strong> {equipment.heThong}
                  </p>
                  <p>
                    <strong className="text-slate-900">Vị trí:</strong> {equipment.viTri}
                  </p>
                  <p>
                    <strong className="text-slate-900">Phụ trách:</strong> {equipment.nguoiPhuTrach}
                  </p>
                  <p>
                    <strong className="text-slate-900">Hạn bảo trì:</strong>{' '}
                    <span className="font-semibold text-rose-700">{equipment.hanBaoTriTiepTheo}</span>
                  </p>
                </div>
              </div>

              {/* Equipment Photo Box on Tag */}
              {resolvedImg && (
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-sm hidden sm:block">
                  <img
                    src={resolvedImg}
                    alt={equipment.tenThietBi}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 text-center sm:text-left">
              Quét mã QR bằng App FACILITY SYSTEM MANAGEMENT để cập nhật biên bản bảo trì hoặc tra cứu tài liệu O&M
            </p>
          </div>

          {/* Technical Specs box */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 font-semibold border-b border-slate-700 pb-1.5">
              <span>Thông Số Kỹ Thuật (Specs)</span>
              <span className="font-mono text-emerald-400">{equipment.trangThai}</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
              {equipment.thongSoKyThuat || 'Chưa cập nhật thông số chi tiết.'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition border border-slate-700"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              In Nhãn QR Thẻ Máy
            </button>

            <div className="flex items-center gap-2">
              {onOpenTicket && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenTicket(equipment);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium text-xs border border-amber-500/30 transition"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Báo Ticket Sự Cố
                </button>
              )}
              {onOpenMaintenance && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenMaintenance(equipment);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-900/30"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Bảo Trì Máy Này
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
