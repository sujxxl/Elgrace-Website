import { UPLOAD_API_URL } from './config';

export type UploadResponse = {
  media_url: string; // Full URL returned by backend
};

export type UploadOptions = {
  token: string;
  mediaRole: 'profile' | 'portfolio' | 'intro_video' | 'portfolio_video';
  modelId?: string; // optional: backend can derive from JWT if omitted
  onProgress?: (pct: number) => void;
};

export function uploadFile(file: File, opts: UploadOptions): Promise<UploadResponse> {
  if (!UPLOAD_API_URL) return Promise.reject(new Error('UPLOAD_API_URL missing'));
  if (!opts?.token) return Promise.reject(new Error('Missing auth token'));

  const form = new FormData();
  form.append('media_role', opts.mediaRole);
  if (opts.modelId) form.append('model_id', opts.modelId);
  form.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${UPLOAD_API_URL.replace(/\/$/, '')}/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${opts.token}`);

    xhr.upload.onprogress = (e) => {
      if (opts.onProgress && e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        opts.onProgress(pct);
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json as UploadResponse);
        } catch (err) {
          reject(new Error('Invalid upload response'));
        }
      } else {
        reject(new Error(xhr.responseText || `Upload failed with ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(form);
  });
}
