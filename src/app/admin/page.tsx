'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePermissions } from '@/lib/permissions';
import { EmptyState, ErrorState, PageHeader, StatusBadge } from '@/components/ui';
import { ChartCard, DonutChart, DonutLegend, BarChart } from '@/components/admin/charts';
import { KpiCard } from '@/components/admin/KpiCard';
import { CATEGORY_COLOR, FAMILY } from '@/components/admin/registry';
import type { AdminStats } from '@/types/api';

// §13.1 — admin dashboard home (DSH-01). Consultants get no `consultants`/`revenue` keys.
export default function AdminDashboardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { can } = usePermissions();

  const statsQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => api.get('/admin/dashboard/stats').then((r) => r.data.data as AdminStats),
  });
  const stats = statsQuery.data;

  if (!can('view-dashboard')) {
    return <EmptyState title={t('admin.forbidden')} />;
  }
  if (statsQuery.isLoading) {
    return (
      <div className="page-loader">
        <span className="spinner" />
      </div>
    );
  }
  if (statsQuery.isError || !stats) {
    return <ErrorState onRetry={() => statsQuery.refetch()} />;
  }

  const statusData = [
    { label: t('bookingStatus.pending'), value: stats.bookings.pending, color: CATEGORY_COLOR.pending },
    { label: t('bookingStatus.completed'), value: stats.bookings.completed, color: CATEGORY_COLOR.completed },
    { label: t('bookingStatus.cancelled'), value: stats.bookings.cancelled, color: CATEGORY_COLOR.cancelled },
  ];

  return (
    <>
      <PageHeader title={t('nav.dashboard')} />

      <div className="stat-grid">
        <KpiCard
          family="pine"
          label={t('admin.statsBookings')}
          hint={t('admin.hintBookings')}
          value={stats.bookings.total}
          context={`${t('admin.statsToday')}: ${stats.bookings.today} · ${t('admin.statsPending')}: ${stats.bookings.pending}`}
        />
        <KpiCard
          family="gold"
          label={t('admin.statsReports')}
          hint={t('admin.hintReports')}
          value={stats.reports.total}
          context={`${t('admin.statsPendingReports')}: ${stats.reports.pending}`}
          onClick={() => router.push('/admin/reports')}
        />
        <KpiCard
          family="moss"
          label={t('nav.clients')}
          hint={t('admin.hintClients')}
          value={stats.clients.total}
          delta={{ value: stats.clients.new_this_month }}
          context={t('admin.statsNewThisMonth')}
        />
        {/* admins only — the key is absent for consultants */}
        {stats.consultants && (
          <KpiCard
            family="sage"
            label={t('nav.consultants')}
            hint={t('admin.hintConsultants')}
            value={stats.consultants.total}
            context={`${t('admin.statsActive')}: ${stats.consultants.active}`}
          />
        )}
        {stats.revenue && (
          <KpiCard
            family="bronze"
            label={t('admin.statsRevenueMonth')}
            hint={t('admin.hintRevenue')}
            value={stats.revenue.this_month_formatted}
            valueSize="sm"
            context={`${t('admin.statsRevenueTotal')}: ${stats.revenue.total_formatted}`}
          />
        )}
      </div>

      <div className="chart-row">
        <ChartCard title={t('admin.bookingsByStatus')} accent="pine">
          <div className="flex items-center gap-8 flex-wrap">
            <DonutChart data={statusData} label={t('admin.bookingsByStatus')} />
            <DonutLegend data={statusData} />
          </div>
        </ChartCard>
        <ChartCard title={t('admin.revenueOverview')} accent="bronze">
          {stats.revenue ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4">
                <div className="text-muted text-sm">{t('admin.statsRevenueMonth')}</div>
                <div className="text-xl font-bold mt-1 tabular-nums">{stats.revenue.this_month_formatted}</div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="text-muted text-sm">{t('admin.statsRevenueTotal')}</div>
                <div className="text-xl font-bold mt-1 tabular-nums">{stats.revenue.total_formatted}</div>
              </div>
            </div>
          ) : (
            <div className="text-muted text-sm py-8 text-center">{t('admin.chartEmpty')}</div>
          )}
        </ChartCard>
      </div>

      <div className="chart-row">
        <ChartCard title={t('admin.bookingsByMonth')} accent="pine">
          <BarChart
            data={stats.bookings.by_month.map((m) => ({ label: m.month, value: m.count, color: FAMILY.pine.light }))}
            sort="label-asc"
            label={t('admin.bookingsByMonth')}
          />
        </ChartCard>
        <ChartCard title={t('admin.revenueByMonth')} accent="bronze">
          {stats.revenue ? (
            <BarChart
              data={stats.revenue.by_month.map((m) => ({
                label: m.month,
                value: Math.round(m.amount / 100),
                color: FAMILY.bronze.light,
              }))}
              sort="label-asc"
              valueFormatter={(v) => `${v.toLocaleString()} SAR`}
              label={t('admin.revenueByMonth')}
            />
          ) : (
            <div className="text-muted text-sm py-8 text-center">{t('admin.chartEmpty')}</div>
          )}
        </ChartCard>
      </div>

      {/* upcoming bookings mini-table */}
      <section className="panel-card">
        <h3 className="chart-card-title">{t('admin.upcomingBookings')}</h3>
        {stats.upcoming_bookings.length === 0 ? (
          <EmptyState title={t('common.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('admin.reference')}</th>
                  <th>{t('nav.clients')}</th>
                  <th>{t('nav.consultants')}</th>
                  <th>{t('common.date')}</th>
                  <th>{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.upcoming_bookings.map((b) => (
                  <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/bookings/${b.id}`)}>
                    <td>{b.reference}</td>
                    <td>{b.client?.company_name ?? '—'}</td>
                    <td>{b.consultant.name}</td>
                    <td>
                      {b.date} · <bdi dir="ltr">{b.time}</bdi>
                    </td>
                    <td>
                      <StatusBadge kind="booking" value={b.status} label={b.status_label} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
