'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/stores/admin-auth';
import type { User } from '@/types/api';

// §6.4 — route protection for the admin area (staff + consultants)
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { token, setUser } = useAdminAuth();
  const router = useRouter();
  const me = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: () => api.get('/admin/auth/me').then((r) => r.data.data as User),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (!token) router.replace('/admin/login');
  }, [token, router]);

  // /me is the source of truth for permissions — keep the store fresh
  useEffect(() => {
    if (me.data) setUser(me.data);
  }, [me.data, setUser]);

  if (!token) return null;
  if (me.isLoading) {
    return (
      <div className="page-loader" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
      </div>
    );
  }
  if (me.isError) return null; // the 401 interceptor already redirected
  return <>{children}</>;
}
