'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePublicMeta } from '@/lib/meta';
import { EmptyState, ErrorState, PageHeader, StatusBadge, Switch, Table, TableSkeleton, Tabs } from '@/components/ui';
import type { Booking } from '@/types/api';

// §12.2 — my bookings (CLI-BKG-03)
export default function ClientBookingsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const meta = usePublicMeta();
  const [status, setStatus] = useState('');
  const [upcoming, setUpcoming] = useState(false);

  const query = useQuery({
    queryKey: ['client', 'bookings', { status, upcoming }],
    queryFn: () =>
      api
        .get('/client/bookings', {
          params: { status: status || undefined, upcoming: upcoming ? 1 : undefined, sort: '-starts_at' },
        })
        .then((r) => r.data.data as Booking[]),
  });
  const bookings = query.data;

  const statusTabs = [
    { key: '', label: t('common.all') },
    ...(meta.data?.booking_statuses ?? []).map((s) => ({ key: s.value, label: s.label })),
  ];

  return (
    <>
      <PageHeader title={t('bookings.title')} />

      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <Tabs tabs={statusTabs} active={status} onChange={setStatus} />
        <Switch
          label={t('bookings.upcomingOnly')}
          checked={upcoming}
          onChange={(e) => setUpcoming(e.target.checked)}
        />
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={5} />
      ) : query.isError || !bookings ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : bookings.length === 0 ? (
        <EmptyState title={t('bookings.empty')} />
      ) : (
        <Table
          columns={[
            { key: 'reference', header: t('admin.reference'), render: (b) => <span dir="ltr" className="font-medium">{b.reference}</span> },
            {
              key: 'datetime',
              header: `${t('common.date')} / ${t('common.time')}`,
              render: (b) => (
                <span>
                  {b.date} · <bdi dir="ltr">{b.time}</bdi>
                </span>
              ),
            },
            { key: 'consultant', header: t('bookings.consultant'), render: (b) => b.consultant.name },
            { key: 'package', header: t('bookings.package'), render: (b) => b.package.name },
            {
              key: 'status',
              header: t('common.status'),
              render: (b) => <StatusBadge kind="booking" value={b.status} label={b.status_label} />,
            },
            { key: 'amount', header: t('wizard.total'), render: (b) => <span dir="ltr">{b.amount_formatted}</span> },
          ]}
          rows={bookings}
          rowKey={(b) => b.id}
          onRowClick={(b) => router.push(`/bookings/${b.id}`)}
        />
      )}
    </>
  );
}
