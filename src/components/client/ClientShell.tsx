'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Boxes,
  CalendarDays,
  CreditCard,
  FileText,
  Headset,
  LayoutDashboard,
  MapPin,
  Menu,
  Star,
  UserRound,
} from 'lucide-react';
import { api } from '@/lib/api';
import { disconnectEcho } from '@/lib/echo';
import { useClientAuth } from '@/stores/client-auth';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Avatar } from '@/components/ui';
import { BreadcrumbProvider } from '@/components/admin/Breadcrumbs';
import { FAMILY } from '@/components/admin/registry';
import type { ClientDashboard } from '@/types/api';

// §9.2 — client area nav, same visual system as the admin sidebar.
// Reports carries the unread badge (CLI-DSH-01).
const NAV_ITEMS = [
  { key: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard, family: 'pine' },
  { key: 'nav.bookings', href: '/bookings', icon: CalendarDays, family: 'gold' },
  { key: 'nav.reports', href: '/reports', icon: FileText, family: 'sage', badge: 'reports' },
  { key: 'nav.my_packages', href: '/my-packages', icon: Boxes, family: 'sand' },
  { key: 'nav.support', href: '/support-tickets', icon: Headset, family: 'bronze' },
  { key: 'nav.reviews', href: '/reviews', icon: Star, family: 'gold' },
  { key: 'nav.locations', href: '/locations', icon: MapPin, family: 'moss' },
  { key: 'nav.payment_methods', href: '/payment-methods', icon: CreditCard, family: 'moss' },
  { key: 'nav.profile', href: '/profile', icon: UserRound, family: 'sage' },
] as const;

type NavItem = (typeof NAV_ITEMS)[number];

const NAV_GROUPS: { key: string; family: keyof typeof FAMILY; hrefs: NavItem['href'][] }[] = [
  { key: 'navGroup.overview', family: 'pine', hrefs: ['/dashboard'] },
  { key: 'navGroup.operations', family: 'gold', hrefs: ['/bookings', '/reports', '/my-packages'] },
  { key: 'navGroup.support', family: 'bronze', hrefs: ['/support-tickets', '/reviews'] },
  { key: 'navGroup.account', family: 'sage', hrefs: ['/locations', '/payment-methods', '/profile'] },
];

export function ClientShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useClientAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // close the user menu on outside click / Escape / route change (same as AdminShell)
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);
  useEffect(() => setMenuOpen(false), [pathname]);

  const dashboard = useQuery({
    queryKey: ['client', 'dashboard'],
    queryFn: () => api.get('/client/dashboard').then((r) => r.data.data as ClientDashboard),
  });
  const unreadReports = dashboard.data?.reports.unread ?? 0;

  const logout = useMutation({
    mutationFn: () => api.post('/client/auth/logout'),
    onSettled: () => {
      disconnectEcho('client');
      clear();
      router.replace('/login');
    },
  });

  // longest-prefix wins so /bookings/12 lights the bookings item
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);
  const activeItem = [...NAV_ITEMS].reverse().find((i) => isActive(i.href));

  return (
    <div className="client-shell" id="clientShell">
      <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} id="clientSidebar">
        <Link href="/dashboard" className="dash-brand" onClick={() => setSidebarOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon.png" alt="" />
          <span>{t('auth.clientArea')}</span>
        </Link>
        <nav className="dash-nav" aria-label={t('auth.clientArea')}>
          {NAV_GROUPS.map((group) => {
            const items = group.hrefs
              .map((href) => NAV_ITEMS.find((i) => i.href === href))
              .filter((i): i is NavItem => !!i);
            if (items.length === 0) return null;
            return (
              <div key={group.key} className="dash-nav-group">
                <div className="group-label">
                  <span className="group-dot" style={{ background: FAMILY[group.family].light }} aria-hidden="true" />
                  {t(group.key)}
                </div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`dash-nav-link${active ? ' active' : ''}`}
                      style={{ ['--route-light' as string]: FAMILY[item.family].light }}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon size={18} strokeWidth={2.25} aria-hidden="true" className="dash-nav-icon" />
                      <span style={{ flex: 1 }}>{t(item.key)}</span>
                      {'badge' in item && unreadReports > 0 && (
                        <span className="notif-badge" style={{ position: 'static' }}>
                          {unreadReports}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="client-back">
          <Link href="/">← {t('home')}</Link>
        </div>
      </aside>
      <div
        className={`dash-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <main className="client-main">
        <div className="client-topbar">
          <div className="client-topbar-left">
            <button
              type="button"
              className="menu-toggle client-menu-toggle"
              aria-label={t('menu')}
              aria-expanded={sidebarOpen}
              aria-controls="clientSidebar"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <Menu size={20} strokeWidth={2.25} aria-hidden="true" />
            </button>
            <h2>{activeItem ? t(activeItem.key) : t('nav.dashboard')}</h2>
          </div>
          <div className="client-topbar-right">
            <NotificationBell guard="client" />
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
        <div className="client-body">
          <BreadcrumbProvider base="" homeHref="/dashboard">
            {children}
          </BreadcrumbProvider>
        </div>
      </main>
    </div>
  );
}
