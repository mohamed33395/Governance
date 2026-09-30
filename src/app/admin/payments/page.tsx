'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePublicMeta } from '@/lib/meta';
import { usePermissions } from '@/lib/permissions';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { FilterPanel } from '@/components/admin/FilterPanel';
import { ChartCard, DonutChart, DonutLegend, BarChart } from '@/components/admin/charts';
import {
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  PriceTag,
  SearchInput,
  Select,
  StatusBadge,
  Table,
  TableSkeleton,
} from '@/components/ui';
import type { AdminPaymentsStats, Booking, Paginated, Payment } from '@/types/api';

// §13.12 — payments (PAY-01/02). gateway_response is never returned.
export default function AdminPaymentsPage() {
  return (
    <RequirePermission perm="view-payments">
      <PaymentsInner />
    </RequirePermission>
  );
}

function PaymentsInner() {
  const { t } = useI18n();
  const meta = usePublicMeta();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Payment | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'payments', { search, status, dateFrom, dateTo, page }],
    queryFn: () =>
      api
        .get('/admin/payments', {
          params: {
            search: search || undefined,
            status: status || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            page,
          },
        })
        .then((r) => r.data as Paginated<Payment>),
  });
  const data = query.data;

  const resetPage = () => setPage(1);

  const statsQuery = useQuery({
    queryKey: ['admin', 'payments', 'stats'],
    queryFn: () => api.get('/admin/payments/stats').then((r) => r.data.data as AdminPaymentsStats),
    enabled: can('view-payments'),
    staleTime: 60_000,
  });

  return (
    <>
      <PageHeader title={t('nav.payments')} />

      {can('view-payments') && statsQuery.data && (
        <>
          <div className="stat-grid mb-6">
            <div className="stat-card">
              <div className="label">{t('admin.totalAmount')}</div>
              <div className="num" style={{ fontSize: '1.5rem' }}>{statsQuery.data.total_amount_formatted}</div>
            </div>
            {statsQuery.data.by_status.map((s) => (
              <div key={s.status} className="stat-card">
                <div className="label">{t(`paymentStatus.${s.status}`)}</div>
                <div className="num">{s.count}</div>
                <div className="trend flat">{s.amount_formatted}</div>
              </div>
            ))}
          </div>

          <div className="chart-row mb-6">
            <ChartCard title={t('admin.paymentsByStatus')}>
              {(() => {
                const data = statsQuery.data.by_status
                  .filter((s) => s.count > 0)
                  .map((s) => ({ label: t(`paymentStatus.${s.status}`), value: s.count, color: 'var(--primary)' }));
                return (
                  <div className="flex items-center gap-8 flex-wrap">
                    <DonutChart data={data} />
                    <DonutLegend data={data} />
                  </div>
                );
              })()}
            </ChartCard>
            <ChartCard title={t('admin.paymentsByGateway')}>
              <BarChart
                data={statsQuery.data.by_gateway.map((g) => ({ label: g.gateway, value: g.count, color: 'var(--gold)' }))}
                sort="value-desc"
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
          placeholder={t('paymentsAdmin.searchPlaceholder')}
          className="flex-1 min-w-[220px]"
        />
        <Select
          options={(meta.data?.payment_statuses ?? []).map((s) => ({ value: s.value, label: s.label }))}
          placeholder={t('common.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 160 }}
        />
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
        <EmptyState title={t('common.empty')} />
      ) : (
        <>
          <Table
            columns={[
              { key: 'id', header: '#', render: (p) => p.id },
              {
                key: 'booking',
                header: t('admin.reference'),
                render: (p) => <span dir="ltr">{p.booking_reference ?? p.booking_id}</span>,
              },
              { key: 'client', header: t('nav.clients'), render: (p) => p.client?.company_name ?? '—' },
              { key: 'amount', header: t('wizard.total'), render: (p) => <PriceTag formatted={p.amount_formatted} /> },
              {
                key: 'card',
                header: t('paymentMethods.title'),
                render: (p) =>
                  p.card_brand ? (
                    <span dir="ltr">
                      {p.card_brand} •••• {p.card_last_four}
                    </span>
                  ) : (
                    '—'
                  ),
              },
              {
                key: 'status',
                header: t('common.status'),
                render: (p) => <StatusBadge kind="payment" value={p.status} label={p.status_label ?? t(`paymentStatus.${p.status}`)} />,
              },
              { key: 'paid', header: t('bookingsAdmin.paidAt'), render: (p) => (p.paid_at ? p.paid_at.slice(0, 16).replace('T', ' ') : '—') },
              { key: 'created', header: t('bookingsAdmin.createdAt'), render: (p) => p.created_at.slice(0, 16).replace('T', ' ') },
            ]}
            rows={data.data}
            rowKey={(p) => p.id}
            onRowClick={(p) => setSelected(p)}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}

      <PaymentDrawer payment={selected} onClose={() => setSelected(null)} />
    </>
  );
}

// ---------- details drawer (PAY-02) ----------
function PaymentDrawer({ payment, onClose }: { payment: Payment | null; onClose: () => void }) {
  const { t } = useI18n();

  const query = useQuery({
    queryKey: ['admin', 'payments', payment?.id],
    queryFn: () =>
      api.get(`/admin/payments/${payment!.id}`).then((r) => r.data.data as Payment & { booking?: Booking }),
    enabled: !!payment,
  });
  const details = query.data ?? payment;

  const row = 'flex justify-between gap-3 py-2 border-b border-border/60 text-[0.9rem]';

  return (
    <Drawer open={!!payment} onClose={onClose} title={`${t('nav.payments')} #${payment?.id ?? ''}`}>
      {details && (
        <div className="flex flex-col gap-1">
          <div className={row}>
            <span className="text-muted">{t('common.status')}</span>
            <StatusBadge kind="payment" value={details.status} label={details.status_label ?? t(`paymentStatus.${details.status}`)} />
          </div>
          <div className={row}>
            <span className="text-muted">{t('wizard.total')}</span>
            <PriceTag formatted={details.amount_formatted} />
          </div>
          <div className={row}>
            <span className="text-muted">{t('paymentsAdmin.gateway')}</span>
            <span dir="ltr">{details.gateway}</span>
          </div>
          {details.card_brand && (
            <div className={row}>
              <span className="text-muted">{t('paymentMethods.title')}</span>
              <span dir="ltr">
                {details.card_brand} •••• {details.card_last_four}
              </span>
            </div>
          )}
          {details.failure_reason && (
            <div className={row}>
              <span className="text-muted">{t('paymentsAdmin.failureReason')}</span>
              <span>{details.failure_reason}</span>
            </div>
          )}
          <div className={row}>
            <span className="text-muted">{t('bookingsAdmin.paidAt')}</span>
            <span dir="ltr">{details.paid_at ? details.paid_at.slice(0, 16).replace('T', ' ') : '—'}</span>
          </div>
          <div className={row}>
            <span className="text-muted">{t('bookingsAdmin.createdAt')}</span>
            <span dir="ltr">{details.created_at.slice(0, 16).replace('T', ' ')}</span>
          </div>

          {/* booking summary card */}
          <div className="mt-5 rounded-xl border border-border p-4">
            <span className="text-muted text-[0.82rem] block mb-2">{t('reports.booking')}</span>
            <strong dir="ltr" className="block">
              {details.booking_reference ?? `#${details.booking_id}`}
            </strong>
            {details.client && <span className="text-muted text-[0.85rem]">{details.client.company_name}</span>}
            <div className="mt-3">
              <Link href={`/admin/bookings/${details.booking_id}`}>
                <Button variant="outline" size="sm">
                  {t('wizard.viewBooking')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
