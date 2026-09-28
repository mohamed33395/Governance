'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/stores/admin-auth';
import type { User } from '@/types/api';

// §6.4 — route protection for the admin area (staff + consultants)
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { token, setUser } = useAdminAuth();
  const router = useRouter();
  // zustand persist hydrates async — don't trust `token` until storage is read.
  // `.persist` only exists client-side (storage is unavailable during SSR).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useAdminAuth.persist.onFinishHydration(() => setHydrated(true));
    if (useAdminAuth.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  const me = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: () => api.get('/admin/auth/me').then((r) => r.data.data as User),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (hydrated && !token) router.replace('/admin/login');
  }, [hydrated, token, router]);

  // /me is the source of truth for permissions — keep the store fresh
  useEffect(() => {
    if (me.data) setUser(me.data);
  }, [me.data, setUser]);

  const loader = (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
    </div>
  );

  if (!hydrated) return loader;
  if (!token) return null;
  if (me.isLoading) return loader;
  if (me.isError) return null; // the 401 interceptor already redirected
  return <>{children}</>;
}
