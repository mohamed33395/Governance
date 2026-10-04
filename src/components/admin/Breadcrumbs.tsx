'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, House } from 'lucide-react';
import { useI18n } from '@/lib/i18n/i18n-context';

// Detail pages (/admin/bookings/12) publish a human label ("BK-0012", a client name…)
// for the last crumb instead of the raw id.
const BreadcrumbLabelContext = createContext<(label: string | null) => void>(() => {});

export function BreadcrumbProvider({
  children,
  base = '/admin',
  homeHref = '/admin',
}: {
  children: ReactNode;
  base?: string;      // url prefix dropped from crumbs ('/admin' or '')
  homeHref?: string;  // root crumb target
}) {
  const [label, setLabel] = useState<string | null>(null);
  return (
    <BreadcrumbLabelContext.Provider value={setLabel}>
      <BreadcrumbsInner label={label} base={base} homeHref={homeHref} />
      {children}
    </BreadcrumbLabelContext.Provider>
  );
}

export function useBreadcrumbLabel(label: string | null | undefined) {
  const setLabel = useContext(BreadcrumbLabelContext);
  useEffect(() => {
    setLabel(label ?? null);
    return () => setLabel(null);
  }, [label, setLabel]);
}

// url segment -> translation key
const SEGMENT_KEYS: Record<string, string> = {
  dashboard: 'nav.dashboard',
  bookings: 'nav.bookings',
  reports: 'nav.reports',
  payments: 'nav.payments',
  clients: 'nav.clients',
  consultants: 'nav.consultants',
  packages: 'nav.packages',
  users: 'nav.users',
  roles: 'nav.roles',
  profile: 'nav.profile',
  'my-availability': 'nav.my_availability',
  'my-packages': 'nav.my_packages',
  'support-tickets': 'nav.support',
  'join-requests': 'nav.join_requests',
  reviews: 'nav.reviews',
  locations: 'nav.locations',
  'payment-methods': 'nav.payment_methods',
  'payment-callback': 'nav.payments',
  create: 'supportTickets.create',
  calendar: 'bookingsAdmin.calendarView',
};

function BreadcrumbsInner({
  label,
  base,
  homeHref,
}: {
  label: string | null;
  base: string;
  homeHref: string;
}) {
  const { t } = useI18n();
  const pathname = usePathname() ?? '';

  const items = useMemo(() => {
    if (pathname === homeHref) return []; // home itself — nothing to trail
    const skip = base ? base.split('/').filter(Boolean).length : 0;
    const segments = pathname.split('/').filter(Boolean).slice(skip); // drop the base prefix
    if (segments.length === 0) return [];
    let href = base;
    return segments.map((seg, i) => {
      href += `/${seg}`;
      const isLast = i === segments.length - 1;
      const key = SEGMENT_KEYS[seg];
      const text = key ? t(key) : isLast && label ? label : `#${seg}`;
      return { href, text, isLast, isId: !key };
    });
  }, [pathname, label, t, base, homeHref]);

  if (items.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label={t('common.breadcrumb')}>
      <ol>
        <li>
          <Link href={homeHref} className="breadcrumb-link">
            <House size={14} strokeWidth={2.25} aria-hidden="true" />
            <span>{t('nav.dashboard')}</span>
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.href}>
            <ChevronRight size={14} strokeWidth={2.25} className="breadcrumb-sep rtl:-scale-x-100" aria-hidden="true" />
            {item.isLast ? (
              <span className="breadcrumb-current" aria-current="page" dir={item.isId ? 'auto' : undefined}>
                {item.text}
              </span>
            ) : (
              <Link href={item.href} className="breadcrumb-link">
                {item.text}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
