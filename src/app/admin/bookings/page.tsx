'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePublicMeta } from '@/lib/meta';
import { RequirePermission } from '@/components/admin/RequirePermission';
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatusBadge,
  Table,
  TableSkeleton,
} from '@/components/ui';
import { BarChart, ChartCard, DonutChart, DonutLegend, RankingList } from '@/components/admin/charts';
import { KpiCard } from '@/components/admin/KpiCard';
import { CATEGORY_COLOR, FAMILY, type FamilyKey } from '@/components/admin/registry';
import { FilterPanel } from '@/components/admin/FilterPanel';
import type { AdminBookingsStats, Booking, Consultant, Package, Paginated } from '@/types/api';

const STATUS_FAMILY: Record<string, FamilyKey> = { pending_payment: 'sand', pending: 'gold', completed: 'pine', cancelled: 'clay' };

// §13.7 — bookings (BKG-01)
export default function AdminBookingsPage() {
  return (
    <RequirePermission perm="view-bookings">
      <BookingsInner />
    </RequirePermission>
  );
}

function BookingsInner() {
  const { t } = useI18n();
  const router = useRouter();
  const meta = usePublicMeta();
  const { can, type } = usePermissions();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [reportStatus, setReportStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [consultantId, setConsultantId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: [
      'admin',
      'bookings',
      { search, status, reportStatus, paymentStatus, consultantId, packageId, dateFrom, dateTo, page },
    ],
    queryFn: () =>
      api
        .get('/admin/bookings', {
          params: {
            search: search || undefined,
            status: status || undefined,
            report_status: reportStatus || undefined,
            payment_status: paymentStatus || undefined,
            consultant_id: consultantId || undefined,
            package_id: packageId || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            sort: '-starts_at',
            page,
          },
        })
        .then((r) => r.data as Paginated<Booking>),
  });
  const data = query.data;

  // filter options (consultant filter is admins-only — a consultant sees only himself)
  const consultantsQuery = useQuery({
    queryKey: ['admin', 'consultants', 'options'],
    queryFn: () =>
      api.get('/admin/consultants', { params: { per_page: 100 } }).then((r) => (r.data as Paginated<Consultant>).data),
    enabled: type === 'admin',
    staleTime: 60_000,
  });
  const packagesQuery = useQuery({
    queryKey: ['admin', 'packages', 'options'],
    queryFn: () =>
      api.get('/admin/packages', { params: { per_page: 100 } }).then((r) => (r.data as Paginated<Package>).data),
    staleTime: 60_000,
  });

  const resetPage = () => setPage(1);

  const statsQuery = useQuery({
    queryKey: ['admin', 'bookings', 'stats'],
    queryFn: () => api.get('/admin/bookings/stats').then((r) => r.data.data as AdminBookingsStats),
    enabled: can('view-bookings'),
    staleTime: 60_000,
  });

  return (
    <>
      <PageHeader
        title={t('nav.bookings')}
        actions={
          <Link href="/admin/bookings/calendar">
            <Button variant="outline" size="sm">
              {t('bookingsAdmin.calendarView')}
            </Button>
          </Link>
        }
      />

      {can('view-bookings') && statsQuery.data && (
        <>
          <div className="stat-grid">
            <KpiCard
              family="pine"
              label={t('admin.statsBookings')}
              hint={t('admin.hintBookings')}
              value={statsQuery.data.total}
              context={`${t('admin.statsToday')}: ${statsQuery.data.today}`}
            />
            {statsQuery.data.by_status.map((s) => (
              <KpiCard
                key={s.status}
                family={STATUS_FAMILY[s.status] ?? 'gold'}
                label={s.label}
                value={s.count}
              />
            ))}
          </div>

          <div className="chart-row">
            <ChartCard title={t('admin.bookingsByStatus')} accent="pine">
              {(() => {
                const data = statsQuery.data.by_status.map((s) => ({
                  label: s.label,
                  value: s.count,
                  color: CATEGORY_COLOR[s.status] ?? FAMILY.pine.light,
                }));
                return (
                  <div className="flex items-center gap-8 flex-wrap">
                    <DonutChart data={data} label={t('admin.bookingsByStatus')} />
                    <DonutLegend data={data} />
                  </div>
                );
              })()}
            </ChartCard>
            <ChartCard title={t('admin.bookingsByMonth')} accent="gold">
              <BarChart
                data={statsQuery.data.by_month.map((m) => ({ label: m.month, value: m.count, color: FAMILY.gold.light }))}
                sort="label-asc"
                label={t('admin.bookingsByMonth')}
              />
            </ChartCard>
          </div>

          <div className="chart-row">
            <ChartCard title={t('admin.bookingsByConsultant')} accent="sage">
              <RankingList
                data={statsQuery.data.by_consultant.map((c) => ({
                  label: c.consultant_name,
                  value: c.count,
                  color: FAMILY.sage.light,
                }))}
                limit={8}
                label={t('admin.bookingsByConsultant')}
              />
            </ChartCard>
            <ChartCard title={t('admin.bookingsByPackage')} accent="sand">
              <RankingList
                data={statsQuery.data.by_package.map((p) => ({
                  label: p.package_name,
                  value: p.count,
                  color: FAMILY.sand.light,
                }))}
                limit={8}
                label={t('admin.bookingsByPackage')}
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
          placeholder={t('bookingsAdmin.searchPlaceholder')}
          className="flex-1 min-w-[220px]"
        />
        <Select
          options={(meta.data?.booking_statuses ?? []).map((s) => ({ value: s.value, label: s.label }))}
          placeholder={t('common.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 160 }}
        />
        <Select
          options={(meta.data?.report_statuses ?? []).map((s) => ({ value: s.value, label: s.label }))}
          placeholder={t('bookings.report')}
          value={reportStatus}
          onChange={(e) => {
            setReportStatus(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 150 }}
        />
        <Select
          options={(meta.data?.payment_statuses ?? []).map((s) => ({ value: s.value, label: s.label }))}
          placeholder={t('bookings.payment')}
          value={paymentStatus}
          onChange={(e) => {
            setPaymentStatus(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 150 }}
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
        <Select
          options={(packagesQuery.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
          placeholder={t('bookings.package')}
          value={packageId}
          onChange={(e) => {
            setPackageId(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 170 }}
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
        <TableSkeleton rows={6} cols={7} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('bookings.empty')} />
      ) : (
        <>
          <Table
            columns={[
              { key: 'ref', header: t('admin.reference'), render: (b) => <span dir="ltr" className="font-medium">{b.reference}</span> },
              { key: 'client', header: t('nav.clients'), render: (b) => b.client?.company_name ?? '—' },
              { key: 'consultant', header: t('bookings.consultant'), render: (b) => b.consultant.name },
              {
                key: 'datetime',
                header: `${t('common.date')} / ${t('common.time')}`,
                render: (b) => (
                  <span className="whitespace-nowrap">
                    {b.date} · <bdi dir="ltr">{b.time}</bdi>
                  </span>
                ),
              },
              { key: 'amount', header: t('wizard.total'), render: (b) => <span dir="ltr">{b.amount_formatted}</span> },
              {
                key: 'status',
                header: t('common.status'),
                render: (b) => <StatusBadge kind="booking" value={b.status} label={b.status_label} />,
              },
              {
                key: 'payment',
                header: t('bookings.payment'),
                render: (b) => (
                  <StatusBadge kind="bookingPayment" value={b.payment_status} label={t(`paymentStatus.${b.payment_status}`)} />
                ),
              },
              {
                key: 'report',
                header: t('bookings.report'),
                render: (b) => <StatusBadge kind="report" value={b.report_status} label={t(`reportStatus.${b.report_status}`)} />,
              },
              { key: 'go', header: '', render: () => <span className="text-muted rtl:-scale-x-100 inline-block">›</span> },
            ]}
            rows={data.data}
            rowKey={(b) => b.id}
            onRowClick={(b) => router.push(`/admin/bookings/${b.id}`)}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}
    </>
  );
}
