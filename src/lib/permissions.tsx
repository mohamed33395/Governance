import { useAdminAuth } from '@/stores/admin-auth';
import type { ReactNode } from 'react';

// §7 — permissions in the admin area. The backend enforces everything;
// hidden UI is for UX only.
export const usePermissions = () => {
  const user = useAdminAuth((s) => s.user);
  const perms = new Set(user?.permissions ?? []);
  return {
    type: user?.type,                       // 'admin' | 'consultant'
    can: (p: string) => perms.has(p),
    canAny: (...ps: string[]) => ps.some((p) => perms.has(p)),
  };
};

export function Can({ perm, children }: { perm: string; children: ReactNode }) {
  const { can } = usePermissions();
  return can(perm) ? <>{children}</> : null;
}
