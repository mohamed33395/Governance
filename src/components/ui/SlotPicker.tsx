'use client';

import type { Slot } from '@/types/api';
import { useI18n } from '@/lib/i18n/i18n-context';

// one button per slot time
export function SlotPicker({
  slots,
  value,
  onSelect,
  className = '',
}: {
  slots: Slot[];
  value: string | null;
  onSelect: (time: string) => void;
  className?: string;
}) {
  const { t } = useI18n();
  if (slots.length === 0) {
    return <p className="text-muted text-[0.9rem] py-4">{t('wizard.noSlots')}</p>;
  }
  return (
    <div className={`flex flex-wrap gap-2.5 ${className}`} role="radiogroup">
      {slots.map((slot) => (
        <button
          key={slot.time}
          type="button"
          role="radio"
          aria-checked={value === slot.time}
          onClick={() => onSelect(slot.time)}
          className={`px-5 py-2.5 rounded-xl border text-[0.9rem] font-medium transition-all cursor-pointer ${
            value === slot.time
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-surface text-text border-border hover:border-accent hover:text-accent'
          }`}
        >
          <bdi dir="ltr">{slot.time}</bdi>
        </button>
      ))}
    </div>
  );
}
