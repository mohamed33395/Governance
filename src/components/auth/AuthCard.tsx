'use client';

import type { ReactNode } from 'react';

// shared auth card (client pages sit in the public layout; admin pages use dark variant)
export function AuthCard({
  title,
  subtitle,
  children,
  dark = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  dark?: boolean;
}) {
  const card = (
    <div className="auth-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo_icon.png" alt="" className="auth-logo" />
      <h1>{title}</h1>
      {subtitle && <p className="sub">{subtitle}</p>}
      <div className="auth-body">{children}</div>
    </div>
  );
  return dark ? <div className="auth-wrap-dark">{card}</div> : <div className="auth-wrap">{card}</div>;
}
