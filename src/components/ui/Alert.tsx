'use client';

import type { ReactNode } from 'react';

const COLORS = {
  success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  warning: { bg: 'var(--warning-soft)', fg: 'var(--warning)' },
  danger: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
} as const;

export function Alert({
  color = 'info',
  title,
  body,
  className = '',
}: {
  color?: keyof typeof COLORS;
  title?: ReactNode;
  body: ReactNode;
  className?: string;
}) {
  const c = COLORS[color];
  return (
    <div
      role="alert"
      className={`rounded-xl px-4 py-3 text-[0.88rem] leading-relaxed ${className}`}
      style={{ background: c.bg, color: c.fg }}
    >
      {title && <strong className="block font-semibold mb-0.5">{title}</strong>}
      {typeof body === 'string' ? <p>{body}</p> : body}
    </div>
  );
}
