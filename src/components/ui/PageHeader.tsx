'use client';

import type { ReactNode } from 'react';

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
  return (
    <div className={`flex items-start justify-between gap-4 flex-wrap mb-6 ${className}`}>
      <div>
        <h1 className="text-2xl sm:text-[1.7rem]">{title}</h1>
        {subtitle && <p className="text-muted text-[0.92rem] mt-1.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  );
}
