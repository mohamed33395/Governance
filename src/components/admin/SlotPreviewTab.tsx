'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ErrorState, Input, SlotPicker } from '@/components/ui';
import type { Slot } from '@/types/api';

// §13.5 tab 8 / §13.6 — read-only slot preview: what clients see
export function SlotPreviewTab({ basePath }: { basePath: string }) {
  const { t } = useI18n();
  const [date, setDate] = useState(() => dayjs().format('YYYY-MM-DD'));

  const query = useQuery({
    queryKey: ['admin', 'slots', basePath, date],
    queryFn: () =>
      api
        .get(`${basePath}/slots`, { params: { date } })
        .then((r) => r.data.data as { date: string; slots: Slot[] }),
    enabled: !!date,
  });

  return (
    <div>
      <Input
        type="date"
        label={t('common.date')}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        min={dayjs().format('YYYY-MM-DD')}
        style={{ maxWidth: 200 }}
        className="mb-5"
      />
      {query.isLoading ? (
        <div className="page-loader">
          <span className="spinner" />
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <SlotPicker slots={query.data?.slots ?? []} value={null} onSelect={() => {}} />
      )}
    </div>
  );
}
