'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/stores/admin-auth';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Avatar } from '@/components/ui';
import { FAMILY, NAV_GROUPS, ROUTES, routeForPath } from '@/components/admin/registry';

export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useAdminAuth();
  const { can, type } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = useMutation({
    mutationFn: () => api.post('/admin/auth/logout'),
    onSettled: () => {
      clear();
      router.replace('/admin/login');
    },
  });

  // §9.2 — each sidebar item is hidden without its permission
  const allowed = ROUTES.filter((r) => {
    if (r.consultantOnly && type !== 'consultant') return false;
    return can(r.perm);
  });

  const activeHref = routeForPath(pathname ?? '')?.href;

  return (
    <div className={`dash-shell${desktopCollapsed ? ' sidebar-collapsed' : ''}`} id="dashShell">
      <aside className={`dash-sidebar${mobileOpen ? ' open' : ''}`} id="dashSidebar">
        <div className="dash-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon.png" alt="" />
          <span>{t('auth.adminArea')}</span>
        </div>
        <nav className="dash-nav" aria-label={t('auth.adminArea')}>
          {NAV_GROUPS.map((group) => {
            const items = group.hrefs
              .map((href) => allowed.find((r) => r.href === href))
              .filter((r): r is NonNullable<typeof r> => !!r);
            if (items.length === 0) return null;
            return (
              <div key={group.key} className="dash-nav-group">
                <div className="group-label">
                  <span className="group-dot" style={{ background: FAMILY[group.family].light }} aria-hidden="true" />
                  {t(group.key)}
                </div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = item.href === activeHref;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`dash-nav-link${active ? ' active' : ''}`}
                      style={{ ['--route-light' as string]: FAMILY[item.family].light }}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon size={18} strokeWidth={2.25} aria-hidden="true" className="dash-nav-icon" />
                      <span>{t(item.key)}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>
      <div
        className={`dash-sidebar-overlay${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <div className="dash-main">
        <div className="dash-topbar">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="menu-toggle"
              aria-label={t('menu')}
              aria-expanded={mobileOpen || !desktopCollapsed}
              aria-controls="dashSidebar"
              onClick={() => {
                setMobileOpen((v) => !v);
                setDesktopCollapsed((v) => !v);
              }}
            >
              <Menu size={20} strokeWidth={2.25} aria-hidden="true" />
            </button>
            <span className="dash-topbar-title">{t('auth.adminArea')}</span>
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
        <div className="dash-body">
          <div className="dash-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
