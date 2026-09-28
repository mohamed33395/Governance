'use client';

import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  body,
  action,
  className = '',
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      {icon ?? (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted mb-4 opacity-60">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
        </svg>
      )}
      <h3 className="text-lg mb-1.5">{title}</h3>
      {body && <p className="text-muted text-[0.9rem] max-w-md">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
