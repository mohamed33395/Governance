'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWizard } from '@/stores/wizard';
import { useI18n } from '@/lib/i18n/i18n-context';
import { DatePicker, ErrorState, SlotPicker } from '@/components/ui';
import type { Slot } from '@/types/api';

// §11.3 step 4 — date & time. Only dates from available-dates are enabled;
// booked/past/time-off slots are simply not returned.
export function StepDateTime() {
  const { t } = useI18n();
  const { consultant, date, time, setDate, setTime } = useWizard();
  const [month, setMonth] = useState(() => dayjs().format('YYYY-MM'));

  // PUB-05 → data { month, dates }
  const datesQuery = useQuery({
    queryKey: ['public', 'consultants', consultant?.id, 'available-dates', month],
    queryFn: () =>
      api
        .get(`/public/consultants/${consultant!.id}/available-dates`, { params: { month } })
        .then((r) => r.data.data as { month: string; dates: string[] }),
    enabled: !!consultant,
  });

  // PUB-06 → data { date, timezone, slot_minutes, duration_minutes, slots }
  const slotsQuery = useQuery({
    queryKey: ['public', 'consultants', consultant?.id, 'slots', date],
    queryFn: () =>
      api
        .get(`/public/consultants/${consultant!.id}/slots`, { params: { date } })
        .then((r) => r.data.data as { date: string; slots: Slot[] }),
    enabled: !!consultant && !!date,
  });

  if (!consultant) return null;

  const enabledDates = datesQuery.data?.dates;
  const slots: Slot[] = slotsQuery.data?.slots ?? [];

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <h4 className="text-[0.95rem] mb-3 text-muted font-medium">{t('wizard.chooseDate')}</h4>
        {datesQuery.isError ? (
          <ErrorState onRetry={() => datesQuery.refetch()} />
        ) : (
          <DatePicker
            value={date}
            onSelect={setDate}
            enabledDates={enabledDates}
            onMonthChange={setMonth}
          />
        )}
        {datesQuery.isLoading && <p className="text-muted text-[0.85rem] mt-2">{t('common.loading')}</p>}
      </div>
      <div>
        <h4 className="text-[0.95rem] mb-3 text-muted font-medium">{t('wizard.chooseTime')}</h4>
        {!date ? (
          <p className="text-muted text-[0.9rem] py-4">{t('wizard.pickDateFirst')}</p>
        ) : slotsQuery.isLoading ? (
          <div className="page-loader">
            <span className="spinner" />
          </div>
        ) : slotsQuery.isError ? (
          <ErrorState onRetry={() => slotsQuery.refetch()} />
        ) : (
          <SlotPicker slots={slots} value={time} onSelect={setTime} />
        )}
      </div>
    </div>
  );
}
