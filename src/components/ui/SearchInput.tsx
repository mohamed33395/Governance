'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';

// debounced 400 ms
export function SearchInput({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [inner, setInner] = useState(value);

  useEffect(() => setInner(value), [value]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (inner !== value) onChange(inner);
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inner]);

  return (
    <div
      className={`flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3 ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted shrink-0">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={inner}
        onChange={(e) => setInner(e.target.value)}
        placeholder={placeholder ?? t('common.search')}
        className="bg-transparent border-none outline-none w-full text-sm text-text placeholder:text-muted"
      />
    </div>
  );
}
