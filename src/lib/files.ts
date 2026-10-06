'use client';

import { useEffect, useState } from 'react';
import { api } from './api';

// §14.1 — uploads. Never set Content-Type for FormData: the browser adds the boundary.
export async function uploadFile<T = unknown>(
  url: string,
  field: string,
  file: File,
  extra: Record<string, string> = {}
): Promise<T> {
  const fd = new FormData();
  fd.append(field, file);
  Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
  const { data } = await api.post(url, fd);
  return data.data as T;
}

// §14.2 — downloads need the Bearer token: fetch a blob and save under the
// file name from Content-Disposition.
export async function downloadFile(url: string, fallback = 'report.pdf') {
  const res = await api.get(toApiPath(url), { responseType: 'blob' });
  const cd = (res.headers['content-disposition'] as string) ?? '';
  const filename = cd.match(/filename="?([^"]+)"?/)?.[1] ?? fallback;
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(res.data),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export const AVATAR_ACCEPT = '.jpg,.jpeg,.png,.webp';
export const AVATAR_MAX_MB = 2;
export const REPORT_ACCEPT = '.pdf,.doc,.docx';
export const REPORT_MAX_MB = 20;

// Authenticated media endpoints can't be used as <img>/<audio> src directly —
// the Bearer header only goes through axios. Fetch to a blob object URL.
export function toApiPath(url: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  if (base && url.startsWith(base)) return url.slice(base.length);
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\/api\/v1/, '');
  } catch {
    return url;
  }
}

export async function fetchBlobUrl(url: string): Promise<string | null> {
  try {
    const res = await api.get(toApiPath(url), { responseType: 'blob' });
    return URL.createObjectURL(res.data);
  } catch {
    return null;
  }
}

export function useBlobUrl(url: string | null | undefined): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    if (!url) {
      setBlobUrl(null);
      return;
    }

    fetchBlobUrl(url).then((result) => {
      if (cancelled) {
        if (result) URL.revokeObjectURL(result);
        return;
      }
      objectUrl = result;
      setBlobUrl(result);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return blobUrl;
}
