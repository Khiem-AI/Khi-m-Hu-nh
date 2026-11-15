import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Equipment } from '../types/cmms';
import { useCMMS } from '../context/CMMSContext';
import jsQR from 'jsqr';
import { Html5Qrcode } from 'html5-qrcode';
import {
  X,
  QrCode,
  Search,
  CheckCircle,
  ArrowRight,
  Camera,
  Upload,
  RefreshCw,
  AlertCircle,
  Flashlight,
  SwitchCamera,
  ScanLine,
} from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEquipment: (equipment: Equipment) => void;
}

interface BarcodeDetectorResultLike {
  rawValue: string;
  cornerPoints?: Array<{ x: number; y: number }>;
}

interface BarcodeDetectorLike {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResultLike[]>;
}

interface CameraDeviceOption {
  deviceId: string;
  label: string;
}

type QRPoint = { x: number; y: number };

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectEquipment,
}) => {
  const { equipment } = useCMMS();
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [searchTerm, setSearchTerm] = useState('');
  const [scannedEquipment, setScannedEquipment] = useState<Equipment | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [rawScannedText, setRawScannedText] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('Đang dò tìm mã QR theo thời gian thực...');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const workCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastDecodedRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const isDetectingAsyncRef = useRef(false);
  const frameCounterRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sound + haptic feedback on successful scan
  const playBeep = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(80);
      }
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.14);
    } catch {
      // AudioContext unsupported or blocked
    }
  }, []);

  const drawDetectedBox = useCallback((corners: QRPoint[] | null) => {
    const overlay = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!overlay || !video) return;

    const w = video.videoWidth || overlay.width;
    const h = video.videoHeight || overlay.height;
    if (w === 0 || h === 0) return;

    if (overlay.width !== w || overlay.height !== h) {
      overlay.width = w;
      overlay.height = h;
    }

    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    if (!corners || corners.length < 4) return;

    ctx.save();
    ctx.lineWidth = Math.max(3, Math.round(w / 180));
    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, []);

  // Resolve QR payload to an Equipment item
  const resolveEquipmentFromText = useCallback(
    (decodedText: string): Equipment | undefined => {
      const raw = decodedText.trim();
      let candidateCode = raw;

      // 1. JSON payload from QRModal: {"cmms_id":"HVAC-CH-01",...}
      if (raw.startsWith('{') && raw.endsWith('}')) {
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          if (typeof parsed.cmms_id === 'string') candidateCode = parsed.cmms_id.trim();
          else if (typeof parsed.maThietBi === 'string') candidateCode = parsed.maThietBi.trim();
          else if (typeof parsed.id === 'string') candidateCode = parsed.id.trim();
        } catch {
          // Ignore malformed JSON and continue fallback parsing
        }
      }

      // 2. URL query string (?data=..., ?eq=..., ?id=...)
      if (candidateCode.includes('data=') || candidateCode.includes('eq=') || candidateCode.includes('maThietBi=')) {
        const match = candidateCode.match(/(?:data|eq|maThietBi)=([^&]+)/i);
        if (match && match[1]) {
          try {
            candidateCode = decodeURIComponent(match[1]).trim();
          } catch {
            candidateCode = match[1].trim();
          }
        }
      }

      const lowerCandidate = candidateCode.toLowerCase();
      const lowerRaw = raw.toLowerCase();

      return (
        equipment.find((e) => e.maThietBi.toLowerCase() === lowerCandidate) ||
        equipment.find((e) => e.maThietBi.toLowerCase() === lowerRaw) ||
        equipment.find((e) => lowerRaw.includes(e.maThietBi.toLowerCase()))
      );
    },
    [equipment]
  );

  const processDecodedText = useCallback(
    (decodedText: string, corners?: QRPoint[] | null) => {
      const now = Date.now();
      const trimmed = decodedText.trim();
      if (!trimmed) return;

      if (corners) {
        drawDetectedBox(corners);
      }

      // Debounce identical scans for 2.2s so audio/state doesn't spam on consecutive frames
      if (lastDecodedRef.current.text === trimmed && now - lastDecodedRef.current.time < 2200) {
        return;
      }
      lastDecodedRef.current = { text: trimmed, time: now };

      setRawScannedText(trimmed);
      const matched = resolveEquipmentFromText(trimmed);

      if (matched) {
        playBeep();
        setScannedEquipment(matched);
        setScanError(null);
        setScanStatusText(`Đã khóa mã: ${matched.maThietBi}`);
      } else {
        setScanError(`Đã đọc mã QR "${trimmed.slice(0, 80)}", nhưng không khớp mã thiết bị nào trong hệ thống.`);
        setScanStatusText('Không khớp thiết bị — tiếp tục dò tìm...');
      }
    },
    [drawDetectedBox, playBeep, resolveEquipmentFromText]
  );

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    drawDetectedBox(null);
    setIsCameraActive(false);
    setTorchSupported(false);
    setTorchOn(false);
  }, [drawDetectedBox]);

  const decodeWithJsQR = useCallback(
    (
      source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
      srcWidth: number,
      srcHeight: number,
      cropCenterRatio = 1
    ): { data: string; corners: QRPoint[] } | null => {
      if (!workCanvasRef.current) {
        workCanvasRef.current = document.createElement('canvas');
      }
      const canvas = workCanvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx || srcWidth <= 0 || srcHeight <= 0) return null;

      const sx = cropCenterRatio < 1 ? Math.floor((srcWidth * (1 - cropCenterRatio)) / 2) : 0;
      const sy = cropCenterRatio < 1 ? Math.floor((srcHeight * (1 - cropCenterRatio)) / 2) : 0;
      const sw = Math.max(64, Math.floor(srcWidth * cropCenterRatio));
      const sh = Math.max(64, Math.floor(srcHeight * cropCenterRatio));

      // Keep canvas size fast (~560px max) for 30fps smooth decoding without CPU lag
      const maxDim = 560;
      const scale = Math.min(1, maxDim / Math.max(sw, sh));
      const tw = Math.max(64, Math.round(sw * scale));
      const th = Math.max(64, Math.round(sh * scale));

      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw;
        canvas.height = th;
      }

      ctx.drawImage(source, sx, sy, sw, sh, 0, 0, tw, th);
      const imageData = ctx.getImageData(0, 0, tw, th);
      const qr = jsQR(imageData.data, tw, th, { inversionAttempts: 'attemptBoth' });

      if (!qr || !qr.data) return null;

      const invScale = 1 / scale;
      const mapPoint = (pt: { x: number; y: number }): QRPoint => ({
        x: sx + pt.x * invScale,
        y: sy + pt.y * invScale,
      });

      return {
        data: qr.data,
        corners: [
          mapPoint(qr.location.topLeftCorner),
          mapPoint(qr.location.topRightCorner),
          mapPoint(qr.location.bottomRightCorner),
          mapPoint(qr.location.bottomLeftCorner),
        ],
      };
    },
    []
  );

  const runScanLoop = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      frameCounterRef.current += 1;
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      // Engine 1: Native BarcodeDetector (ultra-fast hardware/OS accelerated when supported)
      if (detectorRef.current && !isDetectingAsyncRef.current) {
        isDetectingAsyncRef.current = true;
        detectorRef.current
          .detect(video)
          .then((results) => {
            if (!isMountedRef.current || !streamRef.current) return;
            if (results && results.length > 0 && results[0].rawValue) {
              processDecodedText(results[0].rawValue, results[0].cornerPoints || null);
            }
          })
          .catch(() => {
            // ignore transient frame error
          })
          .finally(() => {
            isDetectingAsyncRef.current = false;
          });
      }

      // Engine 2: jsQR real-time fallback/companion (works on every browser including Firefox/Safari/Desktop)
      // Alternate between full frame and 62% center ROI every other frame so both close & distant QR codes snap instantly
      if (frameCounterRef.current % 2 === 0) {
        const useCenterCrop = frameCounterRef.current % 4 === 0;
        const result = decodeWithJsQR(video, vw, vh, useCenterCrop ? 0.62 : 1);
        if (result) {
          processDecodedText(result.data, result.corners);
        } else if (frameCounterRef.current % 16 === 0 && !lastDecodedRef.current.text) {
          drawDetectedBox(null);
        }
      }
    }

    rafRef.current = requestAnimationFrame(runScanLoop);
  }, [decodeWithJsQR, drawDetectedBox, processDecodedText]);

  const startCamera = useCallback(
    async (explicitDeviceId?: string) => {
      stopCamera();
      setScanError(null);
      setIsCameraStarting(true);
      setScanStatusText('Đang khởi động camera độ phân giải cao...');
      lastDecodedRef.current = { text: '', time: 0 };

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ truy cập camera trực tiếp (MediaDevices API).');
        }

        // Initialize native BarcodeDetector if supported
        const Win = window as unknown as {
          BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
        };
        if (Win.BarcodeDetector && !detectorRef.current) {
          try {
            detectorRef.current = new Win.BarcodeDetector({ formats: ['qr_code'] });
          } catch {
            detectorRef.current = null;
          }
        }

        const targetDeviceId = explicitDeviceId ?? selectedDeviceId;
        const videoConstraints: MediaTrackConstraints = targetDeviceId
          ? {
              deviceId: { exact: targetDeviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        if (!isMountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Enumerate cameras now that permission is granted
        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = allDevices
            .filter((d) => d.kind === 'videoinput')
            .map((d, idx) => ({
              deviceId: d.deviceId,
              label: d.label || `Camera ${idx + 1}`,
            }));
          if (isMountedRef.current) {
            setCameras(videoInputs);
            const activeTrack = stream.getVideoTracks()[0];
            const activeId = activeTrack?.getSettings()?.deviceId;
            if (activeId) setSelectedDeviceId(activeId);
          }
        } catch {
          // ignore device enumeration failure
        }

        // Apply continuous autofocus & detect torch support
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          try {
            const caps = videoTrack.getCapabilities?.() as
              | (MediaTrackCapabilities & { torch?: boolean; focusMode?: string[] })
              | undefined;
            if (caps?.torch) {
              setTorchSupported(true);
            }
            if (caps?.focusMode?.includes('continuous')) {
              await videoTrack.applyConstraints({
                advanced: [{ focusMode: 'continuous' } as unknown as MediaTrackConstraintSet],
              });
            }
          } catch {
            // ignore unsupported constraints
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (isMountedRef.current) {
          setIsCameraActive(true);
          setIsCameraStarting(false);
          setScanStatusText('Đưa mã QR vào khung — tự động nhận diện real-time');
          rafRef.current = requestAnimationFrame(runScanLoop);
        }
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        setIsCameraStarting(false);
        setIsCameraActive(false);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
          setScanError(
            'Quyền truy cập camera bị từ chối hoặc bị chặn bởi trình duyệt. Bạn có thể chuyển sang "Tải Ảnh Mã QR" hoặc "Tra Cứu Mã Nhanh".'
          );
        } else if (errMsg.includes('NotFoundError') || errMsg.includes('Requested device not found')) {
          setScanError('Không tìm thấy thiết bị camera trên máy này. Hãy thử "Tải Ảnh Mã QR" hoặc "Tra Cứu Mã Nhanh".');
        } else {
          setScanError(`Không thể khởi động camera: ${errMsg}`);
        }
      }
    },
    [runScanLoop, selectedDeviceId, stopCamera]
  );

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      // ignore torch toggle failure
    }
  };

  // Handle Mode Change
  useEffect(() => {
    if (isOpen && activeMode === 'camera') {
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen, activeMode]);

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedEquipment(null);
      setScanError(null);
      setRawScannedText(null);
      setSearchTerm('');
      lastDecodedRef.current = { text: '', time: 0 };
    }
  }, [isOpen, stopCamera]);

  // Handle Image Upload Scan (Multi-engine: jsQR + BarcodeDetector + Html5Qrcode fallback)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError(null);
    lastDecodedRef.current = { text: '', time: 0 };

    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = objectUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));
      });

      // 1. Try jsQR on full image & center crop
      const jsQrHit =
        decodeWithJsQR(img, img.naturalWidth, img.naturalHeight, 1) ||
        decodeWithJsQR(img, img.naturalWidth, img.naturalHeight, 0.7);
      URL.revokeObjectURL(objectUrl);

      if (jsQrHit?.data) {
        processDecodedText(jsQrHit.data);
        return;
      }

      // 2. Try native BarcodeDetector
      const Win = window as unknown as {
        BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
      };
      if (Win.BarcodeDetector) {
        try {
          const detector = new Win.BarcodeDetector({ formats: ['qr_code'] });
          const bitmap = await createImageBitmap(file);
          const hits = await detector.detect(bitmap);
          bitmap.close();
          if (hits?.[0]?.rawValue) {
            processDecodedText(hits[0].rawValue);
            return;
          }
        } catch {
          // continue to fallback
        }
      }

      // 3. Fallback to Html5Qrcode.scanFile
      const html5Qr = new Html5Qrcode('cmms-qr-file-dummy');
      const result = await html5Qr.scanFile(file, true);
      html5Qr.clear();
      processDecodedText(result);
    } catch {
      setScanError(
        'Không nhận diện được mã QR trong ảnh. Hãy thử chụp rõ nét hơn, đủ sáng và không bị lóa màn hình.'
      );
    } finally {
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  const filteredEquipment = equipment.filter(
    (e) =>
      e.maThietBi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tenThietBi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.heThong.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.viTri.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = () => {
    if (scannedEquipment) {
      onSelectEquipment(scannedEquipment);
      onClose();
    }
  };

  const handleResetScan = () => {
    setScannedEquipment(null);
    setScanError(null);
    setRawScannedText(null);
    lastDecodedRef.current = { text: '', time: 0 };
    drawDetectedBox(null);
    setScanStatusText('Đưa mã QR vào khung — tự động nhận diện real-time');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md">
              <Camera className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Quét Mã QR Thiết Bị Hiện Trường
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Nhận diện Real-time (Camera kép jsQR + BarcodeDetector), Tải ảnh & Tra cứu nhanh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng modal quét"
            className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Mode Buttons */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/50 p-2 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveMode('camera')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeMode === 'camera'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Camera Trực Tiếp
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeMode === 'upload'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Tải Ảnh Mã QR
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('manual')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeMode === 'manual'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Tra Cứu Nhanh
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* MODE 1: Real-time Dual-Engine Camera Scanner */}
          {activeMode === 'camera' && (
            <div className="space-y-3">
              {/* Camera Device Switcher + Controls */}
              {cameras.length > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <SwitchCamera className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value);
                        startCamera(e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium truncate focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {cameras.map((cam) => (
                        <option key={cam.deviceId} value={cam.deviceId}>
                          {cam.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {torchSupported && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition shrink-0 ${
                        torchOn
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Flashlight className="w-3.5 h-3.5" />
                      {torchOn ? 'Tắt Đèn' : 'Đèn Pin'}
                    </button>
                  )}
                </div>
              )}

              {/* Live Video Viewfinder (Always intentionally dark surface) */}
              <div className="hero-dark-banner relative rounded-2xl border-2 border-cyan-500/50 bg-slate-950 overflow-hidden aspect-[4/3] w-full flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`w-full h-full object-cover ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* Bounding box detection canvas */}
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />

                {/* Viewfinder reticle & scanning line */}
                {isCameraActive && !scannedEquipment && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-52 h-52 sm:w-56 sm:h-56">
                      <span className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-cyan-400 rounded-tl-xl" />
                      <span className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-cyan-400 rounded-tr-xl" />
                      <span className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-cyan-400 rounded-bl-xl" />
                      <span className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-cyan-400 rounded-br-xl" />
                      <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-90 shadow-[0_0_10px_#22d3ee]" />
                    </div>
                  </div>
                )}

                {isCameraStarting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-cyan-300 gap-2.5 p-4 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-semibold">Đang kích hoạt camera thời gian thực...</span>
                  </div>
                )}

                {!isCameraActive && !isCameraStarting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950">
                    <QrCode className="w-14 h-14 text-slate-500" />
                    <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                      Bấm nút bên dưới để cấp quyền và mở camera quét mã QR trực tiếp trên điện thoại hoặc máy tính
                    </p>
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-md"
                    >
                      Bật Camera Quét Mã
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1 gap-2">
                <span className="flex items-center gap-1.5 truncate">
                  <ScanLine className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="truncate">{scanStatusText}</span>
                </span>
                {isCameraActive && (
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="text-cyan-700 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" /> Làm mới
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MODE 2: Upload Image Scan */}
          {activeMode === 'upload' && (
            <div className="space-y-3">
              <div id="cmms-qr-file-dummy" className="hidden" />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-cyan-500/50 hover:border-cyan-600 dark:hover:border-cyan-400 bg-slate-50 dark:bg-slate-950/60 hover:bg-cyan-50/50 dark:hover:bg-slate-900/60 p-8 flex flex-col items-center justify-center text-center transition space-y-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 group-hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-400 flex items-center justify-center transition">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">
                    Bấm để chọn ảnh chứa mã QR
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Hỗ trợ ảnh chụp từ điện thoại, ảnh tải về (.png, .jpg, .jpeg)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* MODE 3: Manual Search */}
          {activeMode === 'manual' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nhập mã (HVAC-CH-01, CMP-GA90...) hoặc tên máy móc..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  autoFocus
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {filteredEquipment.slice(0, 10).map((item) => {
                  const isSelected = scannedEquipment?.maThietBi === item.maThietBi;
                  return (
                    <button
                      key={item.maThietBi}
                      type="button"
                      onClick={() => {
                        setScannedEquipment(item);
                        setScanError(null);
                        playBeep();
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 text-cyan-900 dark:text-cyan-100'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400">
                            {item.maThietBi}
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400">
                            ({item.heThong})
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.tenThietBi}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                          {item.viTri}
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scan Error Notice */}
          {scanError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <span className="font-semibold block">{scanError}</span>
                {activeMode === 'camera' && (
                  <button
                    type="button"
                    onClick={() => setActiveMode('upload')}
                    className="text-cyan-700 dark:text-cyan-400 hover:underline font-bold text-[11px]"
                  >
                    Chuyển sang Tải Ảnh hoặc Tra Cứu Mã →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Successful Scanned Result Card */}
          {scannedEquipment && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/40 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Nhận Diện Thành Công
                  </span>
                </div>
                <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                  {scannedEquipment.maThietBi}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {scannedEquipment.tenThietBi}
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                  Hệ thống: <strong>{scannedEquipment.heThong}</strong> · Vị trí:{' '}
                  <strong>{scannedEquipment.viTri}</strong>
                </p>
                {rawScannedText && (
                  <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-1 truncate">
                    Mã đọc được: {rawScannedText}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-emerald-200 dark:border-emerald-500/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                >
                  Quét Mã Tiếp Theo
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <span>Mở Hồ Sơ & Bảo Trì Thiết Bị</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
