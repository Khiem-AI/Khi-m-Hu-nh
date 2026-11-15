import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Check,
  X,
  Trash2,
  Video,
  AlertCircle,
} from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUtils';

interface CameraCaptureInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  previewShape?: 'square' | 'wide';
  compact?: boolean;
}

function compressImageToDataUrl(
  source: HTMLVideoElement | HTMLImageElement,
  srcWidth: number,
  srcHeight: number,
  maxWidth = 960,
  quality = 0.78
): string {
  const scale = srcWidth > maxWidth ? maxWidth / srcWidth : 1;
  const targetW = Math.max(1, Math.round(srcWidth * scale));
  const targetH = Math.max(1, Math.round(srcHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(source, 0, 0, targetW, targetH);
  return canvas.toDataURL('image/jpeg', quality);
}

export const CameraCaptureInput: React.FC<CameraCaptureInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Dán URL ảnh hoặc chụp trực tiếp bằng camera...',
  previewShape = 'wide',
  compact = false,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setCapturedPreview(null);
    setIsStarting(true);
    stopStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsStarting(false);
      setCameraError(
        'Trình duyệt hoặc khung iframe hiện tại không hỗ trợ truy cập camera trực tiếp. Vui lòng dùng nút "Tải / Chụp Từ Tệp" bên cạnh.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      // Fallback without exact facingMode
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err2) {
        const msg = err2 instanceof Error ? err2.message : err instanceof Error ? err.message : '';
        setCameraError(
          `Không thể mở camera thiết bị (${msg || 'chưa cấp quyền'}). Bạn có thể bấm "Tải / Chụp Từ Tệp" để chọn ảnh hoặc chụp bằng app camera mặc định.`
        );
      }
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (isCameraOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
      setCapturedPreview(null);
      setCameraError(null);
    }
    return () => {
      stopStream();
    };
  }, [isCameraOpen]);

  const handleToggleFacing = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  const handleTakeSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const dataUrl = compressImageToDataUrl(video, video.videoWidth, video.videoHeight, 960, 0.78);
    if (dataUrl) {
      setCapturedPreview(dataUrl);
      stopStream();
    }
  };

  const handleConfirmSnapshot = () => {
    if (capturedPreview) {
      onChange(capturedPreview);
      setIsCameraOpen(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const compressed = compressImageToDataUrl(img, img.width, img.height, 960, 0.78);
        onChange(compressed || result);
      };
      img.onerror = () => onChange(result);
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const resolvedPreview = value ? resolveImageUrl(value) : '';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Chụp Trực Tiếp</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>{compact ? 'Tệp/Ảnh' : 'Tải / Chụp Từ Tệp'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* URL / Base64 input + clear */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value.startsWith('data:image/') ? '[Ảnh chụp trực tiếp trên thiết bị]' : value}
          onChange={(e) => {
            if (!value.startsWith('data:image/') || e.target.value === '') {
              onChange(e.target.value);
            }
          }}
          readOnly={value.startsWith('data:image/')}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            title="Xóa ảnh"
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Preview box */}
      {resolvedPreview && (
        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          <img
            src={resolvedPreview}
            alt={label}
            referrerPolicy="no-referrer"
            className={`${
              previewShape === 'square' ? 'w-14 h-14 rounded-full' : 'w-20 h-14 rounded-lg'
            } object-cover border border-slate-700 shrink-0 bg-slate-900`}
          />
          <div className="text-[11px] text-slate-400 min-w-0 flex-1">
            <span className="font-semibold text-slate-200 block truncate">
              {value.startsWith('data:image/') ? 'Đã lưu ảnh chụp trực tiếp' : 'Xem trước hình ảnh'}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              {value.startsWith('data:image/')
                ? `Dung lượng: ~${Math.round((value.length * 0.75) / 1024)} KB`
                : value}
            </span>
          </div>
        </div>
      )}

      {/* Live Camera Capture Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-800/80">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-slate-100">Chụp Ảnh Trực Tiếp — {label}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCameraOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {cameraError ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{cameraError}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCameraOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Chọn / Chụp Từ Thiết Bị
                    </button>
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs"
                    >
                      Thử Lại Camera
                    </button>
                  </div>
                </div>
              ) : capturedPreview ? (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center">
                    <img
                      src={capturedPreview}
                      alt="Ảnh vừa chụp"
                      className="max-h-72 w-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Chụp Lại
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSnapshot}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
                    >
                      <Check className="w-4 h-4" />
                      Sử Dụng Ảnh Này
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                    {isStarting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-slate-200">
                        Đang khởi động camera...
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleToggleFacing}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      Đổi Camera ({facingMode === 'environment' ? 'Sau' : 'Trước'})
                    </button>
                    <button
                      type="button"
                      onClick={handleTakeSnapshot}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg transition"
                    >
                      <Camera className="w-4 h-4" />
                      Chụp Ảnh
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
