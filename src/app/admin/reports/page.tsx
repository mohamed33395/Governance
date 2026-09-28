'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { downloadFile } from '@/lib/files';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { RequirePermission } from '@/components/admin/RequirePermission';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Table,
  TableSkeleton,
  useToast,
} from '@/components/ui';
import type { Client, Consultant, Paginated, Report } from '@/types/api';

// §13.9 — reports (RPT-01..06)
export default function AdminReportsPage() {
  return (
    <RequirePermission perm="view-reports">
      <ReportsInner />
    </RequirePermission>
  );
}

function ReportsInner() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can, type } = usePermissions();

  const [search, setSearch] = useState('');
  const [consultantId, setConsultantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<Report | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'reports', { search, consultantId, clientId, dateFrom, dateTo, page }],
    queryFn: () =>
      api
        .get('/admin/reports', {
          params: {
            search: search || undefined,
            consultant_id: consultantId || undefined,
            client_id: clientId || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            sort: '-created_at',
            page,
          },
        })
        .then((r) => r.data as Paginated<Report>),
  });
  const data = query.data;

  const consultantsQuery = useQuery({
    queryKey: ['admin', 'consultants', 'options'],
    queryFn: () =>
      api.get('/admin/consultants', { params: { per_page: 100 } }).then((r) => (r.data as Paginated<Consultant>).data),
    enabled: type === 'admin',
    staleTime: 60_000,
  });
  const clientsQuery = useQuery({
    queryKey: ['admin', 'clients', 'options'],
    queryFn: () =>
      api.get('/admin/clients', { params: { per_page: 100 } }).then((r) => (r.data as Paginated<Client>).data),
    enabled: type === 'admin',
    staleTime: 60_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });

  const resend = useMutation({
    mutationFn: (id: number) => api.post(`/admin/reports/${id}/notify-client`),
    onSuccess: () => toast.success(t('reportsAdmin.resent')),
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/reports/${id}`),
    onSuccess: () => {
      // the booking returns to "awaiting report"
      toast.success(t('reportsAdmin.deleted'));
      setDeleting(null);
      invalidate();
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  const resetPage = () => setPage(1);

  return (
    <>
      <PageHeader title={t('nav.reports')} />

      <div className="flex gap-3 flex-wrap mb-6">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetPage();
          }}
          className="flex-1 min-w-[200px]"
        />
        {type === 'admin' && (
          <>
            <Select
              options={(consultantsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
              placeholder={t('bookings.consultant')}
              value={consultantId}
              onChange={(e) => {
                setConsultantId(e.target.value);
                resetPage();
              }}
              style={{ maxWidth: 180 }}
            />
            <Select
              options={(clientsQuery.data ?? []).map((c) => ({ value: c.id, label: c.company_name }))}
              placeholder={t('nav.clients')}
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                resetPage();
              }}
              style={{ maxWidth: 180 }}
            />
          </>
        )}
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            resetPage();
          }}
          aria-label={t('reports.dateFrom')}
          style={{ maxWidth: 155 }}
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            resetPage();
          }}
          aria-label={t('reports.dateTo')}
          style={{ maxWidth: 155 }}
        />
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('reports.empty')} />
      ) : (
        <>
          <Table
            columns={[
              { key: 'title', header: t('reports.details'), render: (r) => <strong>{r.title}</strong> },
              {
                key: 'booking',
                header: t('reports.booking'),
                render: (r) => (
                  <span>
                    <span dir="ltr">{r.booking.reference}</span> · {r.booking.date}
                  </span>
                ),
              },
              { key: 'consultant', header: t('bookings.consultant'), render: (r) => r.consultant.name },
              { key: 'client', header: t('nav.clients'), render: (r) => r.client.company_name },
              { key: 'size', header: t('reports.file'), render: (r) => <span dir="ltr">{r.file.size_human}</span> },
              {
                key: 'read',
                header: t('reportsAdmin.clientRead'),
                render: (r) =>
                  r.first_downloaded_at ? (
                    <Badge color="green">{r.first_downloaded_at.slice(0, 10)}</Badge>
                  ) : (
                    <Badge color="amber">{t('reportsAdmin.notYet')}</Badge>
                  ),
              },
              {
                key: 'actions',
                header: t('common.actions'),
                render: (r) => (
                  <span className="flex gap-1.5 flex-wrap">
                    {can('download-reports') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadFile(`/admin/reports/${r.id}/download`, r.file.name)}
                      >
                        {t('common.download')}
                      </Button>
                    )}
                    {can('upload-reports') && (
                      <Button variant="ghost" size="sm" onClick={() => resend.mutate(r.id)} loading={resend.isPending}>
                        {t('reportsAdmin.resend')}
                      </Button>
                    )}
                    {can('delete-reports') && (
                      <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleting(r)}>
                        {t('common.delete')}
                      </Button>
                    )}
                  </span>
                ),
              },
            ]}
            rows={data.data}
            rowKey={(r) => r.id}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title={t('common.delete')}
        body={t('reportsAdmin.deleteConfirm')}
        danger
        loading={deleteMutation.isPending}
      />
    </>
  );
}
