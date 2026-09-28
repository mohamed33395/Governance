'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useClientAuth } from '@/stores/client-auth';
import type { ClientMe } from '@/types/api';

// §6.4 — route protection for the client area
export function RequireClient({ children }: { children: ReactNode }) {
  const { token, setUser } = useClientAuth();
  const router = useRouter();
  const me = useQuery({
    queryKey: ['client', 'me'],
    queryFn: () => api.get('/client/auth/me').then((r) => r.data.data as ClientMe),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  // keep the store fresh (default_location, subscriptions…)
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
