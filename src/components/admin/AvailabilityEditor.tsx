'use client';

import { useI18n } from '@/lib/i18n/i18n-context';
import { usePublicMeta } from '@/lib/meta';
import { Button, Select, Switch } from '@/components/ui';
import type { AvailabilityDay } from '@/types/api';

// §13.5 — weekly availability editor. Seven rows, Sunday first
// (day_of_week 0→6, matches JS Date.getDay()). Used in consultant
// create/edit, consultant details tab, and My availability.

export type EditorRange = { start_time: string; end_time: string };
export type EditorDay = { day_of_week: number; is_working: boolean; ranges: EditorRange[] };

// HH:MM options in 30-minute steps
export const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  return `${h}:${i % 2 === 0 ? '00' : '30'}`;
});

// API days → full 7-row editor state (missing days become non-working)
export function daysFromApi(days: AvailabilityDay[]): EditorDay[] {
  return Array.from({ length: 7 }, (_, dow) => {
    const found = days.find((d) => d.day_of_week === dow);
    return {
      day_of_week: dow,
      is_working: found?.is_working ?? false,
      ranges: found?.ranges.map((r) => ({ start_time: r.start_time, end_time: r.end_time })) ?? [],
    };
  });
}

// editor state → PUT body: only working days; omitted days are cleared backend-side
export function toAvailabilityPayload(days: EditorDay[]) {
  return {
    days: days
      .filter((d) => d.is_working && d.ranges.length > 0)
      .map((d) => ({
        day_of_week: d.day_of_week,
        ranges: d.ranges.map((r) => ({ start_time: r.start_time, end_time: r.end_time })),
      })),
  };
}

// client-side checks mirroring the backend: end > start, ≥ 30 min, no overlap
// (touching is OK). Returns a map of "dayIndex-rangeIndex-field" → message key.
export function validateAvailability(days: EditorDay[]): Record<string, string> {
  const errors: Record<string, string> = {};
  days.forEach((day, di) => {
    if (!day.is_working) return;
    const sorted = [...day.ranges].sort((a, b) => a.start_time.localeCompare(b.start_time));
    sorted.forEach((r, ri) => {
      if (r.end_time <= r.start_time) {
        errors[`${di}-${day.ranges.indexOf(r)}-end_time`] = 'endAfterStart';
      }
      const next = sorted[ri + 1];
      if (next && next.start_time < r.end_time) {
        errors[`${di}-${day.ranges.indexOf(next)}-start_time`] = 'overlap';
      }
    });
  });
  return errors;
}

// 422 AVAILABILITY_OVERLAP keys look like "days.0.ranges.1.end_time" — remap
// them onto editor rows (the payload only contains working days, so the day
// index in the error refers to the position within the *sent* days).
export function mapServerErrors(
  serverErrors: Record<string, string[]>,
  sentDays: EditorDay[],
  allDays: EditorDay[]
): Record<string, string> {
  const mapped: Record<string, string> = {};
  Object.entries(serverErrors).forEach(([key, messages]) => {
    const m = key.match(/^days\.(\d+)\.ranges\.(\d+)(?:\.(\w+))?/);
    if (!m) return;
    const sentDay = sentDays[Number(m[1])];
    if (!sentDay) return;
    const editorDayIndex = allDays.findIndex((d) => d.day_of_week === sentDay.day_of_week);
    mapped[`${editorDayIndex}-${m[2]}-${m[3] ?? 'range'}`] = messages[0];
  });
  return mapped;
}

export function AvailabilityEditor({
  value,
  onChange,
  errors = {},
  className = '',
}: {
  value: EditorDay[];
  onChange: (days: EditorDay[]) => void;
  errors?: Record<string, string>;
  className?: string;
}) {
  const { t } = useI18n();
  const meta = usePublicMeta();
  const dayNames = meta.data?.days_of_week ?? [];

  const update = (di: number, patch: Partial<EditorDay>) => {
    onChange(value.map((d, i) => (i === di ? { ...d, ...patch } : d)));
  };

  const timeOptions = TIME_OPTIONS.map((time) => ({ value: time, label: time }));

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {value.map((day, di) => {
        const meta_day = dayNames.find((d) => d.value === day.day_of_week);
        const dayLabel = meta_day?.name ?? String(day.day_of_week); // meta names arrive localized
        return (
          <div key={day.day_of_week} className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Switch
                label={dayLabel}
                checked={day.is_working}
                onChange={(e) =>
                  update(di, {
                    is_working: e.target.checked,
                    ranges: e.target.checked && day.ranges.length === 0 ? [{ start_time: '09:00', end_time: '17:00' }] : day.ranges,
                  })
                }
                className="font-semibold min-w-[130px]"
              />
              {day.is_working && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => update(di, { ranges: [...day.ranges, { start_time: '09:00', end_time: '12:00' }] })}
                >
                  + {t('availability.addRange')}
                </Button>
              )}
            </div>

            {day.is_working && (
              <div className="flex flex-col gap-2.5 mt-3">
                {day.ranges.map((range, ri) => {
                  const startErr = errors[`${di}-${ri}-start_time`];
                  const endErr = errors[`${di}-${ri}-end_time`];
                  const rangeErr = errors[`${di}-${ri}-range`];
                  return (
                    <div key={ri} className="flex items-center gap-2.5 flex-wrap">
                      <Select
                        options={timeOptions}
                        value={range.start_time}
                        onChange={(e) =>
                          update(di, {
                            ranges: day.ranges.map((r, i) => (i === ri ? { ...r, start_time: e.target.value } : r)),
                          })
                        }
                        aria-label={t('availability.from')}
                        style={{ maxWidth: 110 }}
                        dir="ltr"
                      />
                      <span className="text-muted">—</span>
                      <Select
                        options={timeOptions}
                        value={range.end_time}
                        onChange={(e) =>
                          update(di, {
                            ranges: day.ranges.map((r, i) => (i === ri ? { ...r, end_time: e.target.value } : r)),
                          })
                        }
                        aria-label={t('availability.to')}
                        style={{ maxWidth: 110 }}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => update(di, { ranges: day.ranges.filter((_, i) => i !== ri) })}
                        className="w-8 h-8 rounded-full border border-border text-danger hover:bg-danger hover:text-white transition-colors cursor-pointer bg-transparent"
                        aria-label={t('common.delete')}
                      >
                        ×
                      </button>
                      {(startErr || endErr || rangeErr) && (
                        <span className="text-danger text-[0.78rem] w-full">{t(startErr ?? endErr ?? rangeErr ?? '')}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
