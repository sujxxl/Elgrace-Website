const MEDIA_API_URL = import.meta.env.VITE_UPLOAD_API_URL || 'http://72.61.233.139:8093';

export type MediaRecord = {
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
 * Fetch all media records for a given model from VPS backend
 * @param modelId - The model's user ID
 * @param token - Optional JWT token for authenticated requests
 */
export async function fetchMediaForModel(
  modelId: string,
  token?: string
): Promise<MediaRecord[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${MEDIA_API_URL}/media?model_id=${encodeURIComponent(modelId)}`;
    console.log('🔍 Fetching media from:', url);

    const res = await fetch(url, { headers });

    console.log('📥 Response status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`❌ Failed to fetch media (${res.status}):`, errorText);
      return [];
    }

    const json = await res.json();
    console.log('📦 Raw response:', json);

    // Handle multiple response formats
    let records: MediaRecord[] = [];
    if (Array.isArray(json)) {
      records = json;
    } else if (json.records && Array.isArray(json.records)) {
      records = json.records;
    } else if (json.data && Array.isArray(json.data)) {
      records = json.data;
    }

    console.log(`✅ Parsed ${records.length} media records`);
    return records;
  } catch (err) {
    console.error('💥 fetchMediaForModel error:', err);
    return [];
  }
}

/**
 * Fetch media records filtered by role
 */
export function filterMediaByRole(
  records: MediaRecord[],
  role: 'profile' | 'portfolio' | 'intro_video'
): MediaRecord[] {
  return records.filter((r) => r.media_role === role).sort((a, b) => a.sort_order - b.sort_order);
}
