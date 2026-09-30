'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';

interface FilterPanelProps {
  title?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 680);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export function FilterPanel({ title, children, defaultOpen = true, className = '' }: FilterPanelProps) {
  const { t } = useI18n();
  const isMobile = useMobile();
  const [open, setOpen] = useState(defaultOpen && !isMobile);
  useEffect(() => {
    setOpen((v) => (isMobile ? false : defaultOpen));
  }, [isMobile, defaultOpen]);

  return (
    <div
      className={`filter-panel bg-surface border border-border rounded-lg mb-6 ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-text hover:bg-black/[0.02] transition-colors"
      >
        <span className="font-semibold text-[0.95rem]">{title ?? t('common.filters')}</span>
        <span className="inline-flex items-center gap-2 text-sm text-muted">
          {open ? t('common.hideFilters') : t('common.showFilters')}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 flex gap-3 flex-wrap">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
