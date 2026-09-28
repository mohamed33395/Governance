'use client';

import { Button } from './Button';
import { useI18n } from '@/lib/i18n/i18n-context';

// query error fallback
export function ErrorState({
  onRetry,
  message,
  className = '',
}: {
  onRetry: () => void;
  message?: string;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-danger mb-4 opacity-70">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <h3 className="text-lg mb-1.5">{t('common.errorTitle')}</h3>
      <p className="text-muted text-[0.9rem] max-w-md mb-5">{message ?? t('common.errorBody')}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t('common.retry')}
      </Button>
    </div>
  );
}
