'use client';

import { useI18n } from '@/lib/i18n/i18n-context';

export function Pagination({
  meta,
  onPage,
  className = '',
}: {
  meta: { current_page: number; last_page: number; total: number };
  onPage: (page: number) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const { current_page, last_page, total } = meta;
  if (last_page <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, Math.min(current_page - 2, last_page - 4));
  for (let p = start; p <= Math.min(last_page, start + 4); p++) pages.push(p);

  const btn = 'px-3 py-1.5 rounded-lg border border-border bg-surface text-text text-[0.82rem] transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:border-accent hover:text-accent';

  return (
    <div className={`flex items-center justify-between gap-4 flex-wrap pt-4 mt-5 border-t border-border text-[0.85rem] text-muted ${className}`}>
      <span>
        {t('common.page')} {current_page} {t('common.of')} {last_page} ({total})
      </span>
      <div className="flex items-center gap-1.5">
        <button className={btn} disabled={current_page <= 1} onClick={() => onPage(current_page - 1)}>
          ‹ {t('common.prev')}
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`${btn} ${p === current_page ? '!bg-primary !text-primary-foreground !border-primary' : ''}`}
            onClick={() => onPage(p)}
          >
            {p}
          </button>
        ))}
        <button className={btn} disabled={current_page >= last_page} onClick={() => onPage(current_page + 1)}>
          {t('common.next')} ›
        </button>
      </div>
    </div>
  );
}
