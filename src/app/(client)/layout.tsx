'use client';

import { useEffect, type ReactNode } from 'react';
import '@/styles/admin-dashboard.css';
import '@/styles/client-portal.css';
import { RequireClient } from '@/components/auth/RequireClient';
import { ClientShell } from '@/components/client/ClientShell';

export default function ClientAreaLayout({ children }: { children: ReactNode }) {
  // Same charcoal dark palette as the admin area; portals/modals inherit it from <html>.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-app', 'client');
    return () => root.removeAttribute('data-app');
  }, []);

  return (
    <RequireClient>
      <ClientShell>{children}</ClientShell>
    </RequireClient>
  );
}
