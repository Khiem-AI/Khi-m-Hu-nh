import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera,
  Upload,
  RefreshCw,
  Check,
  X,
  Trash2,
  Video,
  AlertCircle,
  Loader2,
  Maximize2,
} from 'lucide-react';
import {
  compressImageFile,
  compressImageSource,
  estimateDataUrlKb,
  resolveImageUrl,
} from '../../utils/imageUtils';

interface CameraCaptureInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onPickMultiple?: (vals: string[]) => void;
  placeholder?: string;
  previewShape?: 'square' | 'wide';
  compact?: boolean;
  maxDimension?: number;
  maxBytes?: number;
  hidePreview?: boolean;
  hideUrlInput?: boolean;
  disabled?: boolean;
}

export const CameraCaptureInput: React.FC<CameraCaptureInputProps> = ({
  label,
  value,
  onChange,
  onPickMultiple,
  placeholder = 'Dán URL ảnh hoặc chọn / chụp trực tiếp...',
  previewShape = 'wide',
  compact = false,
  maxDimension,
  maxBytes,
  hidePreview = false,
  hideUrlInput = false,
  disabled = false,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resolvedMaxDim = maxDimension ?? (previewShape === 'square' ? 420 : 800);
  const resolvedMaxBytes = maxBytes ?? (previewShape === 'square' ? 45 * 1024 : 85 * 1024);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const attachStreamToVideo = async (stream: MediaStream) => {
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
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
        'Trình duyệt hoặc khung hiển thị hiện tại không hỗ trợ truy cập camera trực tiếp. Vui lòng dùng nút "Tệp/Ảnh" để chọn từ thư viện hoặc ứng dụng máy ảnh.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1600 },
          height: { ideal: 1200 },
        },
        audio: false,
      });
      await attachStreamToVideo(stream);
    } catch (err) {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        await attachStreamToVideo(fallbackStream);
      } catch (err2) {
        const msg = err2 instanceof Error ? err2.message : err instanceof Error ? err.message : '';
        setCameraError(
          `Không thể mở camera thiết bị (${msg || 'chưa cấp quyền'}). Bạn có thể bấm "Chọn Từ Thư Viện / Tệp" bên dưới để chọn ảnh.`
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOpen]);

  // Re-attach stream if video element re-mounts after clearing capturedPreview
  useEffect(() => {
    if (isCameraOpen && !capturedPreview && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isCameraOpen, capturedPreview]);

  const handleToggleFacing = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  const handleTakeSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const compressed = compressImageSource(video, video.videoWidth, video.videoHeight, {
      maxDimension: resolvedMaxDim,
      maxBytes: resolvedMaxBytes,
      initialQuality: 0.72,
    });
    if (compressed.dataUrl) {
      setCapturedPreview(compressed.dataUrl);
      stopStream();
    }
  };

  const handleConfirmSnapshot = () => {
    if (capturedPreview) {
      if (onPickMultiple) {
        onPickMultiple([capturedPreview]);
      } else {
        onChange(capturedPreview);
      }
      setIsCameraOpen(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setIsCompressing(true);
    try {
      const results: string[] = [];
      const targetFiles = onPickMultiple ? files.slice(0, 4) : [files[0]];
      for (const file of targetFiles) {
        try {
          const compressed = await compressImageFile(file, {
            maxDimension: resolvedMaxDim,
            maxBytes: resolvedMaxBytes,
            initialQuality: 0.72,
          });
          if (compressed.dataUrl) {
            results.push(compressed.dataUrl);
          }
        } catch {
          // Skip invalid/corrupt image files safely
        }
      }

      if (results.length > 0) {
        if (onPickMultiple) {
          onPickMultiple(results);
        } else {
          onChange(results[0]);
        }
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const resolvedPreview = value ? resolveImageUrl(value) : '';
  const approxKb = value.startsWith('data:image/') ? estimateDataUrlKb(value) : 0;

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
            disabled={disabled || isCompressing}
            onClick={() => setIsCameraOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 disabled:opacity-50 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition min-h-[34px]"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Chụp Trực Tiếp</span>
          </button>

          <button
            type="button"
            disabled={disabled || isCompressing}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 text-xs font-semibold transition min-h-[34px]"
          >
            {isCompressing ? (
              <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>
              {isCompressing ? 'Đang nén...' : compact ? 'Tệp/Ảnh' : 'Chọn Tệp / Thư Viện'}
            </span>
          </button>

          {/* NOTE: No capture attribute here so mobile opens the native file/gallery picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={Boolean(onPickMultiple)}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* URL / Base64 input + clear */}
      {!hideUrlInput && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            disabled={disabled}
            value={value.startsWith('data:image/') ? '[Ảnh đã nén nhẹ & lưu trên thiết bị]' : value}
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
              disabled={disabled}
              onClick={() => onChange('')}
              title="Xóa ảnh"
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Preview box */}
      {!hidePreview && resolvedPreview && (
        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            title="Phóng to ảnh"
            className="relative group shrink-0"
          >
            <img
              src={resolvedPreview}
              alt={label}
              referrerPolicy="no-referrer"
              className={`${
                previewShape === 'square' ? 'w-14 h-14 rounded-full' : 'w-20 h-14 rounded-lg'
              } object-cover border border-slate-700 bg-slate-900`}
            />
            <span className="absolute inset-0 rounded-lg bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Maximize2 className="w-4 h-4 text-white" />
            </span>
          </button>
          <div className="text-[11px] text-slate-400 min-w-0 flex-1">
            <span className="font-semibold text-slate-200 block truncate">
              {value.startsWith('data:image/') ? 'Đã nén & lưu ảnh hiện trường' : 'Xem trước hình ảnh'}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              {value.startsWith('data:image/')
                ? `Dung lượng tối ưu: ~${approxKb} KB`
                : value}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 shrink-0"
          >
            Xem lớn
          </button>
        </div>
      )}

      {/* Fullscreen Portal Live Camera Capture Overlay */}
      {isCameraOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[120] bg-black flex flex-col sm:bg-black/90 sm:backdrop-blur-sm sm:p-4 sm:items-center sm:justify-center">
            <div className="w-full h-full sm:h-[88vh] sm:max-h-[820px] sm:max-w-2xl sm:rounded-2xl bg-slate-950 sm:border sm:border-slate-700 shadow-2xl overflow-hidden flex flex-col">
              {/* Top Camera Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-sm font-bold text-slate-100 truncate">
                    Chụp Ảnh — {label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(false)}
                  aria-label="Đóng camera"
                  className="p-2 rounded-xl bg-slate-800/80 text-slate-200 hover:text-white hover:bg-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Viewfinder / Preview Body */}
              {cameraError ? (
                <div className="flex-1 flex items-center justify-center p-5">
                  <div className="w-full max-w-md p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs sm:text-sm space-y-4">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{cameraError}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCameraOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <Upload className="w-4 h-4" />
                        Chọn Từ Thư Viện / Tệp
                      </button>
                      <button
                        type="button"
                        onClick={() => startCamera(facingMode)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs"
                      >
                        Thử Lại Camera
                      </button>
                    </div>
                  </div>
                </div>
              ) : capturedPreview ? (
                <>
                  <div className="flex-1 min-h-0 bg-black flex items-center justify-center p-2 relative">
                    <img
                      src={capturedPreview}
                      alt="Ảnh vừa chụp"
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-black/75 border border-slate-700 text-[11px] font-semibold text-emerald-300 tabular-nums">
                      Đã nén tối ưu: ~{estimateDataUrlKb(capturedPreview)} KB
                    </div>
                  </div>
                  <div className="px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Chụp Lại</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSnapshot}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Sử Dụng Ảnh Này</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 min-h-0 relative bg-black flex items-center justify-center overflow-hidden">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                    {isStarting && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-sm text-slate-200">
                        <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                        <span>Đang khởi động camera...</span>
                      </div>
                    )}
                    <div className="pointer-events-none absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-[11px] text-slate-200">
                      {facingMode === 'environment' ? 'Camera Sau' : 'Camera Trước'}
                    </div>
                  </div>

                  {/* Ergonomic Mobile Camera Bottom Bar */}
                  <div className="px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-950/95 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleFacing}
                      className="inline-flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] sm:text-xs font-semibold border border-slate-700 transition min-w-[78px]"
                    >
                      <RefreshCw className="w-4 h-4 text-cyan-400" />
                      <span>Đổi Cam</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTakeSnapshot}
                      disabled={isStarting}
                      aria-label="Chụp ảnh"
                      className="w-16 h-16 rounded-full bg-white hover:bg-cyan-50 active:scale-95 disabled:opacity-50 text-slate-900 ring-4 ring-cyan-400/70 shadow-xl flex items-center justify-center transition"
                    >
                      <Camera className="w-7 h-7 text-slate-900" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCameraOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] sm:text-xs font-semibold border border-slate-700 transition min-w-[78px]"
                    >
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>Tệp/Ảnh</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Lightbox Fullscreen Photo Inspection */}
      {isLightboxOpen &&
        resolvedPreview &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[130] bg-black/92 backdrop-blur-sm flex flex-col p-3 sm:p-6"
            onClick={() => setIsLightboxOpen(false)}
          >
            <div className="flex items-center justify-between pb-3 text-white">
              <span className="text-sm font-bold truncate">{label}</span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
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
                src={resolvedPreview}
                alt={label}
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
