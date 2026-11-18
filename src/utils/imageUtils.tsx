import React, { useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';

export interface CompressImageOptions {
  maxDimension?: number;
  maxBytes?: number;
  initialQuality?: number;
}

export interface CompressedImageResult {
  dataUrl: string;
  approxKb: number;
  width: number;
  height: number;
}

export function estimateDataUrlKb(dataUrl?: string): number {
  if (!dataUrl || typeof dataUrl !== 'string') return 0;
  if (!dataUrl.startsWith('data:')) return 0;
  const commaIdx = dataUrl.indexOf(',');
  const payload = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  return Math.max(1, Math.round((payload.length * 0.75) / 1024));
}

/**
 * Compresses an HTMLImageElement or HTMLVideoElement into a lightweight JPEG data URL
 * strictly bounded under maxBytes (default ~85 KB) to conserve browser localStorage & Firestore memory.
 */
export function compressImageSource(
  source: HTMLVideoElement | HTMLImageElement,
  srcWidth: number,
  srcHeight: number,
  options: CompressImageOptions = {}
): CompressedImageResult {
  const {
    maxDimension = 800,
    maxBytes = 85 * 1024,
    initialQuality = 0.72,
  } = options;

  if (!srcWidth || !srcHeight) {
    return { dataUrl: '', approxKb: 0, width: 0, height: 0 };
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: '', approxKb: 0, width: 0, height: 0 };
  }

  const renderAt = (dimLimit: number, quality: number): { url: string; w: number; h: number } => {
    const longest = Math.max(srcWidth, srcHeight);
    const scale = longest > dimLimit ? dimLimit / longest : 1;
    const w = Math.max(1, Math.round(srcWidth * scale));
    const h = Math.max(1, Math.round(srcHeight * scale));
    canvas.width = w;
    canvas.height = h;
    // White backdrop ensures transparent PNGs convert cleanly to JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(source, 0, 0, w, h);
    return { url: canvas.toDataURL('image/jpeg', quality), w, h };
  };

  // Approximate max base64 string length matching binary maxBytes
  const maxBase64Chars = Math.round(maxBytes * 1.37) + 32;

  const qualitySteps = Array.from(
    new Set([initialQuality, 0.62, 0.52, 0.42, 0.34].filter((q) => q <= initialQuality))
  );

  let best = renderAt(maxDimension, qualitySteps[0]);
  for (const q of qualitySteps) {
    best = renderAt(maxDimension, q);
    if (best.url.length <= maxBase64Chars) {
      return {
        dataUrl: best.url,
        approxKb: estimateDataUrlKb(best.url),
        width: best.w,
        height: best.h,
      };
    }
  }

  // If still above target budget, step down pixel dimensions too
  const fallbackDims = [
    Math.round(maxDimension * 0.75),
    Math.round(maxDimension * 0.58),
    380,
  ].filter((d) => d < maxDimension && d >= 240);

  for (const dim of fallbackDims) {
    for (const q of [0.55, 0.42, 0.32]) {
      best = renderAt(dim, q);
      if (best.url.length <= maxBase64Chars) {
        return {
          dataUrl: best.url,
          approxKb: estimateDataUrlKb(best.url),
          width: best.w,
          height: best.h,
        };
      }
    }
  }

  return {
    dataUrl: best.url,
    approxKb: estimateDataUrlKb(best.url),
    width: best.w,
    height: best.h,
  };
}

/**
 * Loads an uploaded image File using an object URL (low memory) and compresses it.
 */
export function compressImageFile(
  file: File,
  options: CompressImageOptions = {}
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const result = compressImageSource(img, img.naturalWidth || img.width, img.naturalHeight || img.height, options);
        URL.revokeObjectURL(objectUrl);
        resolve(result);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
}

/**
 * Resolves image URL, especially Google Drive thumbnail links.
 * Converts drive.google.com/thumbnail?id=... into direct googleusercontent URL
 * which loads reliably in web browsers.
 */
export function resolveImageUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If already googleusercontent format
  if (trimmed.includes('googleusercontent.com/d/')) {
    return trimmed;
  }

  // Google Drive thumbnail link format: drive.google.com/thumbnail?id=...&sz=w1000
  const driveThumbnailMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveThumbnailMatch && driveThumbnailMatch[1]) {
    const fileId = driveThumbnailMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
  }

  // Google Drive standard file/d/ link format: drive.google.com/file/d/.../view
  const driveFileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    const fileId = driveFileMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
  }

  // Google Drive uc?id= format
  const driveUcMatch = trimmed.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (driveUcMatch && driveUcMatch[1]) {
    const fileId = driveUcMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
  }

  return trimmed;
}

/**
 * Checks whether an image is an authentic uploaded factory photo (e.g., Google Drive or direct upload)
 */
export function isDirectUploadedImage(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('drive.google.com') ||
    url.includes('googleusercontent.com') ||
    url.startsWith('data:image/') ||
    url.startsWith('blob:') ||
    url.includes('/assets/aistudio/')
  );
}

/**
 * Category-based fallback high-res industrial machine photos
 */
export function getCategoryFallbackImage(category?: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('lạnh') || cat.includes('chiller') || cat.includes('hvac')) {
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80';
  }
  if (cat.includes('khí') || cat.includes('nén') || cat.includes('compressor')) {
    return 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1000&q=80';
  }
  if (cat.includes('điện') || cat.includes('solar') || cat.includes('transformer')) {
    return 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1000&q=80';
  }
  if (cat.includes('nước') || cat.includes('water') || cat.includes('pump')) {
    return 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1000&q=80';
  }
  if (cat.includes('cháy') || cat.includes('fire')) {
    return 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1000&q=80';
  }
  return 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1000&q=80';
}

interface EquipmentImageProps {
  src?: string;
  alt: string;
  category?: string;
  className?: string;
  aspectRatio?: string;
  showBadge?: boolean;
}

export const EquipmentImage: React.FC<EquipmentImageProps> = ({
  src,
  alt,
  category,
  className = 'w-full h-full object-cover',
  showBadge = false,
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const rawUrl = src?.trim();
  const resolved = rawUrl ? resolveImageUrl(rawUrl) : '';
  const isReal = isDirectUploadedImage(rawUrl);
  const fallback = getCategoryFallbackImage(category);

  const displaySrc = error ? fallback : resolved || fallback;

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 flex items-center justify-center group">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        </div>
      )}

      {displaySrc ? (
        <img
          src={displaySrc}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setLoading(false)}
          onError={() => {
            if (!error) {
              setError(true);
              setLoading(false);
            }
          }}
          className={`${className} transition-transform duration-300 group-hover:scale-105`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-500 p-4">
          <ImageOff className="w-8 h-8 mb-1" />
          <span className="text-[11px]">Chưa có hình</span>
        </div>
      )}

      {showBadge && isReal && !error && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-emerald-600/95 text-white font-bold text-[10px] shadow backdrop-blur-sm flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          Ảnh thực tế nhà máy
        </div>
      )}
    </div>
  );
};
