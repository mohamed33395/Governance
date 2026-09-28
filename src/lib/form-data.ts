// §14.3 — PHP parses bracket notation into nested arrays.
// appendFormData(fd, { days: [...] }, 'availability')
//   → availability[days][0][day_of_week]=0 …
export function appendFormData(fd: FormData, value: unknown, key: string) {
  if (value === null || value === undefined) return;
  if (value instanceof File) {
    fd.append(key, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => appendFormData(fd, v, `${key}[${i}]`));
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => appendFormData(fd, v, `${key}[${k}]`));
    return;
  }
  fd.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
}
