'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/stores/admin-auth';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Avatar } from '@/components/ui';

// §9.2 — admin sidebar items, each hidden without its permission
const NAV_ITEMS = [
  { key: 'nav.dashboard', href: '/admin', perm: 'view-dashboard' },
  { key: 'nav.bookings', href: '/admin/bookings', perm: 'view-bookings' },
  { key: 'nav.reports', href: '/admin/reports', perm: 'view-reports' },
  { key: 'nav.clients', href: '/admin/clients', perm: 'view-clients' },
  { key: 'nav.consultants', href: '/admin/consultants', perm: 'view-consultants' },
  { key: 'nav.my_availability', href: '/admin/my-availability', perm: 'view-availability', consultantOnly: true },
  { key: 'nav.packages', href: '/admin/packages', perm: 'view-packages' },
  { key: 'nav.payments', href: '/admin/payments', perm: 'view-payments' },
  { key: 'nav.users', href: '/admin/users', perm: 'view-users' },
  { key: 'nav.roles', href: '/admin/roles', perm: 'view-roles' },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useAdminAuth();
  const { can, type } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = useMutation({
    mutationFn: () => api.post('/admin/auth/logout'),
    onSettled: () => {
      clear();
      router.replace('/admin/login');
    },
  });

  const items = NAV_ITEMS.filter((item) => {
    if ('consultantOnly' in item && item.consultantOnly && type !== 'consultant') return false;
    return can(item.perm);
  });

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const activeItem = [...items].reverse().find((i) => isActive(i.href));

  return (
    <div className="dash-shell" id="dashShell">
      <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} id="dashSidebar">
        <div className="dash-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon.png" alt="" />
          <span>{t('auth.adminArea')}</span>
        </div>
        <nav className="dash-nav">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? 'active' : undefined}
              onClick={() => setSidebarOpen(false)}
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
              {t(item.key)}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="dash-main">
        <div className="dash-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              className="menu-toggle"
              style={{ display: 'inline-flex', color: 'var(--green-deep)' }}
              aria-label={t('menu')}
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <span className="icon">
                <svg viewBox="0 0 24 24">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </span>
            </button>
            <h2 id="dashTitle">{activeItem ? t(activeItem.key) : t('nav.dashboard')}</h2>
          </div>
          <div className="topbar-right header-actions">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="admin-user-menu">
              <div
                className="admin-chip"
                role="button"
                tabIndex={0}
                aria-haspopup="true"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) setMenuOpen(false);
                }}
              >
                <Avatar src={user?.avatar_thumb_url ?? user?.avatar_url} name={user?.name ?? '?'} size="sm" />
                <div className="who">
                  {user?.name}
                  <span>{user?.type === 'consultant' ? t('nav.consultants') : t('auth.adminArea')}</span>
                </div>
              </div>
              <div className={`admin-menu${menuOpen ? ' open' : ''}`} role="menu">
                <div className="menu-head">
                  <strong>{user?.name}</strong>
                  <span dir="ltr">{user?.email}</span>
                </div>
                <button type="button" onClick={() => router.push('/admin/profile')}>
                  {t('nav.profile')}
                </button>
                <button
                  type="button"
                  className="danger"
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                >
                  {t('common.logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="dash-body">{children}</div>
      </div>
    </div>
  );
}
