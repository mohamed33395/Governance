'use client';

import type { ReactNode } from 'react';

// wraps label + control + error + hint
export function Field({
  label,
  error,
  hint,
  required,
  children,
  className = '',
}: {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[0.82rem] text-muted">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[0.78rem] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[0.78rem] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
