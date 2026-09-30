'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import '@/styles/admin-dashboard.css';
import { RequireAdmin } from '@/components/auth/RequireAdmin';
import { AdminShell } from '@/components/admin/AdminShell';

// guest-only pages — no shell, no guard
const AUTH_PAGES = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Scopes the neutral (charcoal) dark palette to the admin area; portals/modals inherit it from <html>.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-app', 'admin');
    return () => root.removeAttribute('data-app');
  }, []);

  if (AUTH_PAGES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <RequireAdmin>
      <AdminShell>{children}</AdminShell>
    </RequireAdmin>
  );
}
