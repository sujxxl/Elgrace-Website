import { UPLOAD_API_URL } from './config';

function getMediaApiBaseUrl(): string {
  const base = (UPLOAD_API_URL || '').replace(/\/$/, '');
  if (!base) throw new Error('UPLOAD_API_URL missing');
  return base;
}

export async function deleteMedia(id: string, token: string) {
  const base = getMediaApiBaseUrl();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  // Required backend contract: DELETE /media?id=MEDIA_ID
  const res = await fetch(`${base}/media?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Delete failed');
    throw new Error(text || `Delete failed with ${res.status}`);
  }

  // Some backends return empty body on delete
  const txt = await res.text().catch(() => '');
  if (!txt) return { ok: true };
  try {
    return JSON.parse(txt);
  } catch {
    return { ok: true };
  }
}
