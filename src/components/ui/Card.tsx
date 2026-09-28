'use client';

import type { ReactNode } from 'react';

export function Card({
  title,
  actions,
  children,
  className = '',
  padded = true,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`bg-surface border border-border rounded-2xl ${padded ? 'p-6 sm:p-7' : ''} ${className}`}
      style={{ boxShadow: 'var(--shadow)' }}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          {typeof title === 'string' ? (
            <h3 className="text-[1.05rem] font-semibold text-text font-sans">{title}</h3>
          ) : (
            title
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
