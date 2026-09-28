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
  const res = await api.get(url, { responseType: 'blob' });
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
