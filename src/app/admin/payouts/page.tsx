'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePublicMeta } from '@/lib/meta';
import { usePermissions } from '@/lib/permissions';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { FilterPanel } from '@/components/admin/FilterPanel';
import { KpiCard } from '@/components/admin/KpiCard';
import { PayoutDrawer } from '@/components/admin/PayoutDrawer';
import { FAMILY } from '@/components/admin/registry';
import {
  Badge,
  EmptyState,
  ErrorState,
  Input,
  LogoLoader,
  PageHeader,
  Pagination,
  PriceTag,
  SearchInput,
  Select,
  StatusBadge,
  Table,
} from '@/components/ui';
import type { AdminPayoutsStats, Consultant, Paginated, Payout } from '@/types/api';

const STATUS_FAMILY: Record<string, keyof typeof FAMILY> = { pending: 'sand', released: 'pine', failed: 'clay' };

// PO-01/01b/02/03 — consultant payouts (one per completed booking).
// Consultants only see their own; the consultant filter is hidden for them.
export default function AdminPayoutsPage() {
  return (
    <RequirePermission perm="view-payouts">
      <PayoutsInner />
    </RequirePermission>
  );
}

function PayoutsInner() {
  const { t } = useI18n();
  const meta = usePublicMeta();
  const { can, type } = usePermissions();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [consultantId, setConsultantId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Payout | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'payouts', 'list', { search, status, consultantId, dateFrom, dateTo, page }],
    queryFn: () =>
      api
        .get('/admin/payouts', {
          params: {
            search: search || undefined,
            status: status || undefined,
            consultant_id: type === 'admin' && consultantId ? consultantId : undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            page,
          },
        })
        .then((r) => r.data as Paginated<Payout>),
  });
  const data = query.data;

  const statsQuery = useQuery({
    queryKey: ['admin', 'payouts', 'stats'],
    queryFn: () => api.get('/admin/payouts/stats').then((r) => r.data.data as AdminPayoutsStats),
    enabled: can('view-payouts'),
    staleTime: 60_000,
  });

  const consultantsQuery = useQuery({
    queryKey: ['admin', 'consultants', 'options'],
    queryFn: () =>
      api.get('/admin/consultants', { params: { per_page: 100 } }).then((r) => (r.data as Paginated<Consultant>).data),
    enabled: type === 'admin',
    staleTime: 60_000,
  });

  const resetPage = () => setPage(1);

  const statusLabel = (value: string) =>
    meta.data?.payout_statuses.find((s) => s.value === value)?.label ?? t(`payoutStatus.${value}`);

  return (
    <>
      <PageHeader
        title={t('nav.payouts')}
        actions={
          statsQuery.data ? (
            <Badge color={statsQuery.data.auto_transfer ? 'green' : 'amber'}>
              {statsQuery.data.auto_transfer ? t('payoutsAdmin.autoOn') : t('payoutsAdmin.autoOff')}
            </Badge>
          ) : undefined
        }
      />

      {statsQuery.data && (
        <div className="stat-grid">
          {statsQuery.data.by_status.map((s) => (
            <KpiCard
              key={s.status}
              family={STATUS_FAMILY[s.status] ?? 'sage'}
              label={statusLabel(s.status)}
              value={s.count}
              context={`${s.net_amount_formatted} · ${t('payoutsAdmin.fee')}: ${s.fee_amount_formatted}`}
            />
          ))}
        </div>
      )}

      <FilterPanel>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetPage();
          }}
          placeholder={t('payoutsAdmin.searchPlaceholder')}
          className="flex-1 min-w-[220px]"
        />
        <Select
          options={(meta.data?.payout_statuses ?? []).map((s) => ({ value: s.value, label: s.label }))}
          placeholder={t('common.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 160 }}
        />
        {type === 'admin' && (
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
        <LogoLoader />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('payoutsAdmin.empty')} />
      ) : (
        <>
          <Table
            columns={[
              { key: 'id', header: '#', render: (p) => p.id },
              {
                key: 'booking',
                header: t('admin.reference'),
                render: (p) => <span dir="ltr">{p.booking_reference ?? `#${p.booking_id}`}</span>,
              },
              ...(type === 'admin'
                ? [{ key: 'consultant', header: t('bookings.consultant'), render: (p: Payout) => p.consultant?.name ?? '—' }]
                : []),
              {
                key: 'gross',
                header: t('payoutsAdmin.gross'),
                render: (p) => <PriceTag formatted={p.amount_formatted} />,
              },
              {
                key: 'fee',
                header: t('payoutsAdmin.fee'),
                render: (p) => (
                  <span className="text-muted">
                    <PriceTag formatted={p.fee_amount_formatted} /> <span dir="ltr">({p.fee_percent}%)</span>
                  </span>
                ),
              },
              {
                key: 'net',
                header: t('payoutsAdmin.net'),
                render: (p) => (
                  <strong>
                    <PriceTag formatted={p.net_amount_formatted} />
                  </strong>
                ),
              },
              {
                key: 'status',
                header: t('common.status'),
                render: (p) => <StatusBadge kind="payout" value={p.status} label={statusLabel(p.status)} />,
              },
              {
                key: 'created',
                header: t('bookingsAdmin.createdAt'),
                render: (p) => p.created_at.slice(0, 16).replace('T', ' '),
              },
            ]}
            rows={data.data}
            rowKey={(p) => p.id}
            onRowClick={(p) => setSelected(p)}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}

      <PayoutDrawer
        payout={selected}
        autoTransfer={statsQuery.data?.auto_transfer ?? false}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
