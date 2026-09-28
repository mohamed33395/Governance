'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import '@/styles/admin-dashboard.css';
import { RequireAdmin } from '@/components/auth/RequireAdmin';
import { AdminShell } from '@/components/admin/AdminShell';

// guest-only pages — no shell, no guard
const AUTH_PAGES = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (AUTH_PAGES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <RequireAdmin>
      <AdminShell>{children}</AdminShell>
    </RequireAdmin>
  );
}
