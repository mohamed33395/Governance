'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useClientAuth } from '@/stores/client-auth';
import type { ClientMe } from '@/types/api';

// §6.4 — route protection for the client area
export function RequireClient({ children }: { children: ReactNode }) {
  const { token, setUser } = useClientAuth();
  const router = useRouter();
  // zustand persist hydrates async — don't trust `token` until storage is read.
  // `.persist` only exists client-side (storage is unavailable during SSR).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useClientAuth.persist.onFinishHydration(() => setHydrated(true));
    if (useClientAuth.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  const me = useQuery({
    queryKey: ['client', 'me'],
    queryFn: () => api.get('/client/auth/me').then((r) => r.data.data as ClientMe),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (hydrated && !token) router.replace('/login');
  }, [hydrated, token, router]);

  // keep the store fresh (default_location, subscriptions…)
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
