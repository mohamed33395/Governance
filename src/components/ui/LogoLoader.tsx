'use client';

import { useI18n } from '@/lib/i18n/i18n-context';

export function LogoLoader({ label, className = '' }: { label?: string; className?: string }) {
  const { t } = useI18n();
  const text = label ?? t('common.loading');
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-5 py-16 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo_white_background_transparent.gif" alt="" className="h-28 w-auto" />
      {text ? <span className="text-sm text-muted">{text}</span> : null}
    </div>
  );
}
