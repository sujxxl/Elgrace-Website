export const UPLOAD_API_URL = (import.meta.env.VITE_UPLOAD_API_URL as string) || '';
export const MEDIA_BASE_URL = (import.meta.env.VITE_MEDIA_BASE_URL as string) || '';

if (!UPLOAD_API_URL) {
  // Surface clear error at runtime for missing configuration
  console.warn('VITE_UPLOAD_API_URL is not set. Media uploads will fail.');
}
if (!MEDIA_BASE_URL) {
  console.warn('VITE_MEDIA_BASE_URL is not set. Media preview URLs may be invalid.');
}
