import heic2any from 'heic2any';

export type CompressOptions = {
  maxDimension?: number; // Max width/height in pixels
  maxBytes?: number;     // Target max file size in bytes
  qualitySteps?: number[]; // JPEG quality tries (0..1)
};

const defaultOptions: Required<CompressOptions> = {
  maxDimension: 1920,
  maxBytes: 700 * 1024, // ~700KB target to be friendly on free tier
  qualitySteps: [0.82, 0.68, 0.55, 0.4],
};

function scaleToFit(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = Math.min(max / w, max / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function fileNameToJpeg(name: string) {
  const base = name.replace(/\.(png|jpg|jpeg|webp|gif|heic|heif)$/i, '');
  return `${base}.jpg`;
}

async function convertHeicToJpegIfNeeded(file: File): Promise<File> {
  const lower = file.name.toLowerCase();
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    lower.endsWith('.heic') ||
    lower.endsWith('.heif');

  if (!isHeic) return file;

  const converted = (await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })) as Blob | Blob[];
  const blob = Array.isArray(converted) ? converted[0] : converted;
  // Keep original name; we'll normalise to .jpg in compressImageFile
  return new File([blob], file.name, { type: 'image/jpeg' });
}

export async function compressImageFile(file: File, opts?: CompressOptions): Promise<File> {
  const { maxDimension, maxBytes, qualitySteps } = { ...defaultOptions, ...(opts || {}) };

  const sourceFile = await convertHeicToJpegIfNeeded(file);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Failed to load image'));
    i.src = URL.createObjectURL(sourceFile);
  });

  const { width, height } = scaleToFit(img.naturalWidth, img.naturalHeight, maxDimension);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, width, height);

  // Try multiple qualities until under target or we exhaust options
  for (let q of qualitySteps) {
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', q));
    if (!blob) continue;
    if (blob.size <= maxBytes || q === qualitySteps[qualitySteps.length - 1]) {
      const out = new File([blob], fileNameToJpeg(sourceFile.name), { type: 'image/jpeg' });
      URL.revokeObjectURL(img.src);
      return out;
    }
  }

  // Fallback: return the last attempt if earlier checks somehow missed
  const fallback: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', qualitySteps[qualitySteps.length - 1]));
  if (!fallback) throw new Error('Compression failed');
  const out = new File([fallback], fileNameToJpeg(sourceFile.name), { type: 'image/jpeg' });
  URL.revokeObjectURL(img.src);
  return out;
}
