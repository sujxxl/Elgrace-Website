// Media service - Single source of truth from model_media table via /media API
import { fetchMediaForModel, MediaRecord } from './mediaFetch';
import { MEDIA_BASE_URL, UPLOAD_API_URL } from './config';

export type MediaItem = {
  id: string;
  model_id: string;
  media_type: 'image' | 'video';
  media_role: 'profile' | 'portfolio' | 'intro_video';
  media_url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/**
 * Add cache busting to media URL using updated_at timestamp
 */
export function addCacheBuster(url: string, timestamp?: string, id?: string): string {
  if (!url) return url;
  const param = timestamp || id || Date.now().toString();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${param}`;
}

function toAbsoluteMediaUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;

  const base = (MEDIA_BASE_URL || UPLOAD_API_URL || '').replace(/\/$/, '');
  if (!base) return url;

  const trimmed = url.trim();
  const withoutLeadingSlash = trimmed.replace(/^\//, '');

  // Avoid duplicating the "media" path when base already ends with /media
  if (base.toLowerCase().endsWith('/media') && withoutLeadingSlash.toLowerCase().startsWith('media/')) {
    return `${base}/${withoutLeadingSlash.slice('media/'.length)}`;
  }
  if (base.toLowerCase().endsWith('/media') && trimmed.toLowerCase().startsWith('/media/')) {
    return `${base}${trimmed.slice('/media'.length)}`;
  }

  return trimmed.startsWith('/') ? `${base}${trimmed}` : `${base}/${trimmed}`;
}

export function normalizeMediaRecords(records: MediaRecord[]): MediaItem[] {
  return records.map((record) => ({
    id: record.id,
    model_id: record.model_id,
    media_type: record.media_type,
    media_role: record.media_role,
    media_url: addCacheBuster(toAbsoluteMediaUrl(record.media_url), record.updated_at, record.id),
    sort_order: record.sort_order,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }));
}

export type DerivedMedia = {
  profileImage: MediaItem | null;
  introVideo: MediaItem | null;
  portfolio: MediaItem[];
};

// Required UI derivation pattern: find/filter by media_role
export function deriveMedia(records: MediaItem[]): DerivedMedia {
  const profileImage = records.find((m) => m.media_role === 'profile') ?? null;
  const introVideo = records.find((m) => m.media_role === 'intro_video') ?? null;
  const portfolio = records
    .filter((m) => m.media_role === 'portfolio')
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return { profileImage, introVideo, portfolio };
}

/**
 * Group media records by role
 * - profile: single image (most recent if multiple)
 * - intro_video: single video (most recent if multiple)
 * - portfolio: array of images sorted by sort_order
 */
/**
 * Fetch media records for a model from VPS /media endpoint.
 * Single source of truth: model_media.
 */
export async function fetchMediaRecords(modelId: string, accessToken?: string): Promise<MediaItem[]> {
  const records = await fetchMediaForModel(modelId, accessToken);
  return normalizeMediaRecords(records);
}
