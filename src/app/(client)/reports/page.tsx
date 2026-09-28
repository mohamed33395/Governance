'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { downloadFile } from '@/lib/files';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Button, EmptyState, ErrorState, Input, PageHeader, SearchInput, Table, TableSkeleton } from '@/components/ui';
import type { Report } from '@/types/api';

// §12.4 — my reports (CLI-RPT-01)
export default function ClientReportsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const query = useQuery({
    queryKey: ['client', 'reports', { search, dateFrom, dateTo }],
    queryFn: () =>
      api
        .get('/client/reports', {
          params: { search: search || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined },
        })
        .then((r) => r.data.data as Report[]),
  });
  const reports = query.data;

  const download = async (report: Report) => {
    await downloadFile(`/client/reports/${report.id}/download`, report.file.name);
    // the first download marks it read
    queryClient.invalidateQueries({ queryKey: ['client', 'reports'] });
    queryClient.invalidateQueries({ queryKey: ['client', 'dashboard'] });
  };

  return (
    <>
      <PageHeader title={t('reports.title')} />

      <div className="flex gap-3 flex-wrap mb-6">
        <SearchInput value={search} onChange={setSearch} className="flex-1 min-w-[220px]" />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label={t('reports.dateFrom')} style={{ maxWidth: 170 }} />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label={t('reports.dateTo')} style={{ maxWidth: 170 }} />
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={4} />
      ) : query.isError || !reports ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : reports.length === 0 ? (
        <EmptyState title={t('reports.empty')} body={t('reports.emptyBody')} />
      ) : (
        <Table
          columns={[
            {
              key: 'title',
              header: t('reports.details'),
              render: (r) => (
                <span className="flex items-center gap-2">
                  {r.first_downloaded_at === null && (
                    <span className="w-2 h-2 rounded-full bg-accent shrink-0" title={t('reports.unread')} aria-label={t('reports.unread')} />
                  )}
                  <strong>{r.title}</strong>
                </span>
              ),
            },
            { key: 'consultant', header: t('reports.consultant'), render: (r) => r.consultant.name },
            {
              key: 'date',
              header: t('common.date'),
              render: (r) => (
                <span>
                  {r.booking.date} · <bdi dir="ltr">{r.booking.time}</bdi>
                </span>
              ),
            },
            { key: 'size', header: t('reports.file'), render: (r) => <span dir="ltr">{r.file.size_human}</span> },
            {
              key: 'actions',
              header: t('common.actions'),
              render: (r) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    download(r);
                  }}
                >
                  {t('reports.download')}
                </Button>
              ),
            },
          ]}
          rows={reports}
          rowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/reports/${r.id}`)}
        />
      )}
    </>
  );
}
