'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useClientAuth } from '@/stores/client-auth';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Avatar } from '@/components/ui';
import type { ClientDashboard } from '@/types/api';

// §9.2 — client area nav. Reports carries the unread badge (CLI-DSH-01).
const NAV_ITEMS = [
  { key: 'nav.dashboard', href: '/dashboard' },
  { key: 'nav.bookings', href: '/bookings' },
  { key: 'nav.reports', href: '/reports', badge: 'reports' },
  { key: 'nav.my_packages', href: '/my-packages' },
  { key: 'nav.locations', href: '/locations' },
  { key: 'nav.payment_methods', href: '/payment-methods' },
  { key: 'nav.profile', href: '/profile' },
] as const;

export function ClientShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useClientAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboard = useQuery({
    queryKey: ['client', 'dashboard'],
    queryFn: () => api.get('/client/dashboard').then((r) => r.data.data as ClientDashboard),
  });
  const unreadReports = dashboard.data?.reports.unread ?? 0;

  const logout = useMutation({
    mutationFn: () => api.post('/client/auth/logout'),
    onSettled: () => {
      clear();
      router.replace('/login');
    },
  });

  const isActive = (href: string) => pathname.startsWith(href);
  const activeItem = [...NAV_ITEMS].reverse().find((i) => isActive(i.href));

  return (
    <div className="client-shell" id="clientShell">
      <aside className={`client-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="client-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon.png" alt="" />
          <span>{t('auth.clientArea')}</span>
        </div>
        <nav className="client-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={isActive(item.href) ? 'active' : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 12px',
                borderRadius: 3,
                fontSize: '.9rem',
                marginBottom: 4,
                borderRight: '2px solid transparent',
                color: 'inherit',
              }}
            >
              <span style={{ flex: 1 }}>{t(item.key)}</span>
              {'badge' in item && unreadReports > 0 && (
                <span className="notif-badge" style={{ position: 'static' }}>
                  {unreadReports}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="client-back">
          <Link href="/">← {t('home')}</Link>
        </div>
      </aside>
      <main className="client-main">
        <div className="client-topbar">
          <div className="client-topbar-left">
            <button
              className="client-menu-toggle"
              aria-label={t('menu')}
              onClick={() => setSidebarOpen((v) => !v)}
              style={{ display: 'inline-flex' }}
            >
              ☰
            </button>
            <h2>{activeItem ? t(activeItem.key) : t('nav.dashboard')}</h2>
          </div>
          <div className="client-topbar-right">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="client-user-menu">
              <button
                type="button"
                className="client-user-menu-btn"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <Avatar src={user?.avatar_url} name={user?.name ?? '?'} size="sm" />
              </button>
              <div className={`client-user-dropdown${menuOpen ? ' open' : ''}`}>
                <div className="client-dropdown-header">
                  <Avatar src={user?.avatar_url} name={user?.name ?? '?'} size="sm" />
                  <span>{user?.name}</span>
                </div>
                <Link href="/profile" onClick={() => setMenuOpen(false)}>
                  {t('nav.profile')}
                </Link>
                <button type="button" disabled={logout.isPending} onClick={() => logout.mutate()}>
                  {t('common.logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="client-body">{children}</div>
      </main>
    </div>
  );
}
