'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { useI18n } from '@/lib/i18n/i18n-context';

// month grid; only enabledDates are selectable. Weeks start Sunday (matches day_of_week 0).
export function DatePicker({
  value,
  onSelect,
  enabledDates,
  minDate,
  onMonthChange,
  className = '',
}: {
  value: string | null;                    // YYYY-MM-DD
  onSelect: (date: string) => void;
  enabledDates?: string[];                 // only these selectable
  minDate?: string;
  onMonthChange?: (month: string) => void; // YYYY-MM of the visible month
  className?: string;
}) {
  const { lang } = useI18n();
  const [month, setMonth] = useState(() => dayjs().format('YYYY-MM'));

  const first = dayjs(`${month}-01`);
  const daysInMonth = first.daysInMonth();
  const startOffset = first.day(); // 0 = Sunday
  const enabled = enabledDates ? new Set(enabledDates) : null;
  const today = dayjs().format('YYYY-MM-DD');
  const min = minDate ?? today;

  const changeMonth = (delta: number) => {
    const next = first.add(delta, 'month').format('YYYY-MM');
    setMonth(next);
    onMonthChange?.(next);
  };

  const weekDays =
    lang === 'ar'
      ? ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
      : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const cells: (string | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => first.date(i + 1).format('YYYY-MM-DD')),
  ];

  return (
    <div className={`rounded-xl border border-border bg-surface p-4 select-none ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="previous month"
          className="w-8 h-8 rounded-lg border border-border bg-background text-text hover:border-accent cursor-pointer"
        >
          <span className="inline-block rtl:-scale-x-100">‹</span>
        </button>
        <strong className="text-[0.95rem] text-text">{first.locale(lang).format('MMMM YYYY')}</strong>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="next month"
          className="w-8 h-8 rounded-lg border border-border bg-background text-text hover:border-accent cursor-pointer"
        >
          <span className="inline-block rtl:-scale-x-100">›</span>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[0.72rem] text-muted mb-1.5">
        {weekDays.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={`e${i}`} />;
          const isEnabled = (enabled ? enabled.has(date) : true) && date >= min;
          const isSelected = value === date;
          const isToday = date === today;
          return (
            <button
              key={date}
              type="button"
              disabled={!isEnabled}
              onClick={() => onSelect(date)}
              className={`aspect-square rounded-lg text-[0.84rem] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'hover:bg-accent-soft text-text'
              }`}
              style={isToday && !isSelected ? { boxShadow: 'inset 0 0 0 1px var(--accent)' } : undefined}
            >
              {dayjs(date).date()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
