import { useCallback, useMemo, useState } from 'react';
import { uploadFile } from '../services/upload';
import { deleteMedia } from '../services/mediaApi';

export type MediaRole = 'profile' | 'portfolio' | 'intro_video' | 'portfolio_video';
export type MediaType = 'image' | 'video';

export type MediaItem = {
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  recordId?: string;
  progress: number;
  status: 'idle' | 'uploading' | 'done' | 'error';
  error?: string;
  sortOrder: number;
};

export type UseMediaUploadOptions = {
  modelId: string;
  mediaRole: MediaRole;
  mediaType: MediaType;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB: number;
  acceptMimes: string[]; // e.g., ['image/jpeg','image/png'] or ['video/mp4']
};

export function useMediaUpload(opts: UseMediaUploadOptions) {
  const [items, setItems] = useState<MediaItem[]>([]);

  const canAddMore = useMemo(
    () => (opts.multiple ? (opts.maxFiles ?? Infinity) : 1) - items.length,
    [items.length, opts.multiple, opts.maxFiles]
  );

  const validate = useCallback(
    (file: File): string | null => {
      if (!opts.acceptMimes.some((m) => file.type === m || file.type.startsWith(m.replace('/*','/')))) {
        return `Invalid file type: ${file.type}`;
      }
      const maxBytes = opts.maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        return `File too large. Max ${opts.maxSizeMB}MB`;
      }
      return null;
    },
    [opts.acceptMimes, opts.maxSizeMB]
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files as File[]);
      if (!opts.multiple && arr.length > 1) arr.length = 1;

      const next: MediaItem[] = [];
      for (const f of arr) {
        if (canAddMore <= next.length) break;
        const err = validate(f);
        if (err) {
          next.push({ file: f as File, previewUrl: '', progress: 0, status: 'error', error: err, sortOrder: items.length + next.length });
          continue;
        }
        const previewUrl = URL.createObjectURL(f as File);
        next.push({ file: f as File, previewUrl, progress: 0, status: 'idle', sortOrder: items.length + next.length });
      }
      setItems((prev) => [...prev, ...next]);
    },
    [canAddMore, items.length, opts.multiple, validate]
  );

  const removeAt = useCallback((idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sortOrder: i })));
  }, []);

  const deleteAt = useCallback(async (idx: number, token: string) => {
    const target = items[idx];
    if (!target) return;
    // If we have a DB record id, delete it; otherwise just remove locally.
    if (target.recordId) {
      await deleteMedia(target.recordId, token);
    }
    removeAt(idx);
  }, [items, removeAt]);

  const replaceAt = useCallback((idx: number, file: File) => {
    const err = validate(file);
    const build = (old: MediaItem): MediaItem =>
      err
        ? { ...old, file, previewUrl: '', status: 'error', error: err, progress: 0 }
        : { ...old, file, previewUrl: URL.createObjectURL(file), status: 'idle', error: undefined, progress: 0 };
    setItems((prev) => prev.map((it, i) => (i === idx ? build(it) : it)));
  }, [validate]);

  const move = useCallback((from: number, to: number) => {
    setItems((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((it, i) => ({ ...it, sortOrder: i }));
    });
  }, []);

  const uploadOne = useCallback(
    async (idx: number, token: string) => {
      const target = items[idx];
      if (!target) return;
      setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, status: 'uploading', progress: 0, error: undefined } : it)));
      try {
        const { media_url } = await uploadFile(target.file, {
          token,
          mediaRole: opts.mediaRole,
          modelId: opts.modelId,
          onProgress: (pct) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, progress: pct } : it))),
        });
        // Single source of truth: backend writes model_media on upload.
        // Frontend must not create/record media rows.
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, uploadedUrl: media_url, status: 'done', progress: 100 } : it)));
      } catch (err: any) {
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, status: 'error', error: err?.message || 'Upload failed' } : it)));
        throw err;
      }
    },
    [items, opts.mediaRole, opts.mediaType, opts.modelId]
  );

  const uploadAll = useCallback(async (token: string) => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === 'done') continue;
      // eslint-disable-next-line no-await-in-loop
      await uploadOne(i, token);
    }
  }, [items, uploadOne]);

  return {
    items,
    setItems,
    canAddMore,
    addFiles,
    removeAt,
    deleteAt,
    replaceAt,
    move,
    uploadOne,
    uploadAll,
  };
}
