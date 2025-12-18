// Utility helpers to work with Google Drive links for images

// Extracts a Google Drive file ID from various share URL formats
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    // Patterns:
    // - https://drive.google.com/file/d/<id>/view?usp=sharing
    // - https://drive.google.com/uc?export=view&id=<id>
    // - https://drive.google.com/open?id=<id>
    // - https://drive.google.com/thumbnail?id=<id>
    const pathParts = u.pathname.split('/').filter(Boolean);
    const dIndex = pathParts.indexOf('d');
    if (pathParts[0] === 'file' && dIndex !== -1 && pathParts[dIndex + 1]) {
      return pathParts[dIndex + 1];
    }
    const idParam = u.searchParams.get('id');
    if (idParam) return idParam;
  } catch {
    // fallthrough
  }
  // Fallback regex for pasted strings
  const m = url.match(/(?:file\/d\/|id=)([a-zA-Z0-9_-]{10,})/);
  return m ? m[1] : null;
}

// Returns an embeddable image URL for <img src>, or null if not recognized
export function normalizeDriveImageLink(url: string): string | null {
  const id = extractDriveFileId(url);
  if (!id) return null;
  // Use the lightweight viewer endpoint suitable for direct <img>
  return `https://drive.google.com/uc?export=view&id=${id}`;
}

// Provide multiple candidate URLs to improve reliability on <img>
export function buildDriveImageUrls(url: string): string[] {
  const id = extractDriveFileId(url);
  if (!id) return [];
  return [
    // viewer endpoint (often works)
    `https://drive.google.com/uc?export=view&id=${id}`,
    // thumbnail endpoint (stable, supports size)
    `https://drive.google.com/thumbnail?id=${id}&sz=w2000`,
    // download endpoint (may render image directly)
    `https://drive.google.com/uc?export=download&id=${id}`,
    // googleusercontent direct (commonly works for public files)
    `https://lh3.googleusercontent.com/d/${id}=s2000`,
    `https://drive.googleusercontent.com/uc?id=${id}&export=view`,
    `https://lh3.googleusercontent.com/u/0/d/${id}=s2000`,
  ];
}

// Splits freeform text (newlines/commas/spaces) into distinct URLs
export function splitLinks(text: string | undefined | null): string[] {
  if (!text) return [];
  return text
    .split(/\s|,|\n|\r/)
    .map(s => s.trim())
    .filter(Boolean);
}
