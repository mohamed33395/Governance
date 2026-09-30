'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { FAMILY, routeForPath } from '@/components/admin/registry';

// One shared page-identity header: accent rail + route icon tile + title/subtitle,
// actions on the opposite side. Routes outside the admin registry keep a plain title.
export function PageHeader({
  title,
  subtitle,
  actions,
  className = '',
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const route = routeForPath(pathname ?? '');
  const Icon = route?.icon;
  const accent = route ? FAMILY[route.family] : null;

  return (
    <div className={`page-identity ${className}`}>
      <div className="page-identity-main">
        {accent && Icon ? (
          <>
            <span className="page-id-rail" style={{ background: accent.strong }} aria-hidden="true" />
            <span
              className="page-id-tile"
              style={{ ['--id-strong' as string]: accent.strong, ['--id-light' as string]: accent.light }}
              aria-hidden="true"
            >
              <Icon size={18} strokeWidth={2.25} />
            </span>
          </>
        ) : null}
        <div className="min-w-0">
          <h1 className="page-id-title">{title}</h1>
          {subtitle && <p className="page-id-sub">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-identity-actions">{actions}</div>}
    </div>
  );
}
