'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  icon,
  href,
  className = '',
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  href?: string;
  className?: string;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <span
          className="w-10 h-10 rounded-xl inline-flex items-center justify-center"
          style={{ background: 'rgba(26,65,46,.08)', color: 'var(--primary)' }}
        >
          {icon}
        </span>
      </div>
      <span className="block text-muted text-[0.84rem] mt-4">{label}</span>
      <span className="block font-serif text-[2rem] leading-snug" style={{ color: 'var(--primary)' }}>
        {value}
      </span>
    </>
  );
  const cls = `block bg-surface border border-border rounded-2xl p-6 transition-transform hover:-translate-y-0.5 ${className}`;
  const style = { boxShadow: 'var(--shadow)' } as const;
  return href ? (
    <Link href={href} className={cls} style={style}>
      {inner}
    </Link>
  ) : (
    <div className={cls} style={style}>
      {inner}
    </div>
  );
}
