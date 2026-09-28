'use client';

import type { ReactNode } from 'react';
import '@/styles/client-portal.css';
import { RequireClient } from '@/components/auth/RequireClient';
import { ClientShell } from '@/components/client/ClientShell';

export default function ClientAreaLayout({ children }: { children: ReactNode }) {
  return (
    <RequireClient>
      <ClientShell>{children}</ClientShell>
    </RequireClient>
  );
}
