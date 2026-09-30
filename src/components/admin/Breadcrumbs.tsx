'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, House } from 'lucide-react';
import { useI18n } from '@/lib/i18n/i18n-context';

// Detail pages (/admin/bookings/12) publish a human label ("BK-0012", a client name…)
// for the last crumb instead of the raw id.
const BreadcrumbLabelContext = createContext<(label: string | null) => void>(() => {});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [label, setLabel] = useState<string | null>(null);
  return (
    <BreadcrumbLabelContext.Provider value={setLabel}>
      <BreadcrumbsInner label={label} />
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
  calendar: 'bookingsAdmin.calendarView',
};

function BreadcrumbsInner({ label }: { label: string | null }) {
  const { t } = useI18n();
  const pathname = usePathname() ?? '';

  const items = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean).slice(1); // drop "admin"
    if (segments.length === 0) return [];
    let href = '/admin';
    return segments.map((seg, i) => {
      href += `/${seg}`;
      const isLast = i === segments.length - 1;
      const key = SEGMENT_KEYS[seg];
      const text = key ? t(key) : isLast && label ? label : `#${seg}`;
      return { href, text, isLast, isId: !key };
    });
  }, [pathname, label, t]);

  if (items.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label={t('common.breadcrumb')}>
      <ol>
        <li>
          <Link href="/admin" className="breadcrumb-link">
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
