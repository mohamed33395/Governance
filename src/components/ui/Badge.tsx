'use client';

import type { ReactNode } from 'react';

export type BadgeColor = 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'purple';

export function Badge({
  color = 'gray',
  dot = true,
  children,
  className = '',
}: {
  color?: BadgeColor;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`ui-badge ${className}`} data-color={color}>
      {dot && <span className="ui-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
