'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { downloadFile } from '@/lib/files';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { FilterPanel } from '@/components/admin/FilterPanel';
import {
  ActionsMenu,
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
import { ChartCard, BarChart, RankingList } from '@/components/admin/charts';
import { KpiCard } from '@/components/admin/KpiCard';
import { FAMILY } from '@/components/admin/registry';
import type { AdminReportsStats, Client, Consultant, Paginated, Report } from '@/types/api';

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

  const statsQuery = useQuery({
    queryKey: ['admin', 'reports', 'stats'],
    queryFn: () => api.get('/admin/reports/stats').then((r) => r.data.data as AdminReportsStats),
    enabled: can('view-reports'),
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

      {can('view-reports') && statsQuery.data && (
        <>
          <div className="stat-grid">
            <KpiCard
              family="sage"
              label={t('nav.reports')}
              hint={t('admin.hintReports')}
              value={statsQuery.data.total}
            />
            <KpiCard family="sand" label={t('reportStatus.pending')} value={statsQuery.data.pending} />
            <KpiCard family="pine" label={t('reportStatus.uploaded')} value={statsQuery.data.uploaded} />
          </div>

          <div className="chart-row">
            <ChartCard title={t('admin.reportsByMonth')} accent="sage">
              <BarChart
                data={statsQuery.data.by_month.map((m) => ({ label: m.month, value: m.count, color: FAMILY.sage.light }))}
                sort="label-asc"
                label={t('admin.reportsByMonth')}
              />
            </ChartCard>
            <ChartCard title={t('admin.reportsByConsultant')} accent="pine">
              <RankingList
                data={statsQuery.data.by_consultant.map((c) => ({
                  label: c.consultant_name,
                  value: c.count,
                  color: FAMILY.pine.light,
                }))}
                limit={8}
                label={t('admin.reportsByConsultant')}
              />
            </ChartCard>
          </div>
        </>
      )}

      <FilterPanel>
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
      </FilterPanel>

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
                  <ActionsMenu
                    ariaLabel={t('common.actions')}
                    items={[
                      ...(can('download-reports')
                        ? [
                            {
                              key: 'download',
                              label: t('common.download'),
                              onClick: () => downloadFile(`/admin/reports/${r.id}/download`, r.file.name),
                            },
                          ]
                        : []),
                      ...(can('upload-reports')
                        ? [
                            {
                              key: 'resend',
                              label: t('reportsAdmin.resend'),
                              disabled: resend.isPending,
                              onClick: () => resend.mutate(r.id),
                            },
                          ]
                        : []),
                      ...(can('delete-reports')
                        ? [
                            {
                              key: 'delete',
                              label: t('common.delete'),
                              danger: true,
                              onClick: () => setDeleting(r),
                            },
                          ]
                        : []),
                    ]}
                  />
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
