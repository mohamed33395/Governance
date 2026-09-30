'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePermissions } from '@/lib/permissions';
import { EmptyState, ErrorState, StatusBadge } from '@/components/ui';
import { ChartCard, DonutChart, DonutLegend, BarChart } from '@/components/admin/charts';
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

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="top">
            <span className="ic">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </span>
          </div>
          <div className="label">{t('admin.statsBookings')}</div>
          <div className="num">{stats.bookings.total}</div>
          <div className="trend flat">
            {t('admin.statsToday')}: {stats.bookings.today} · {t('admin.statsPending')}: {stats.bookings.pending}
          </div>
        </div>

        <div className="stat-card" role="link" style={{ cursor: 'pointer' }} onClick={() => router.push('/admin/reports')}>
          <div className="top">
            <span className="ic">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8" />
              </svg>
            </span>
          </div>
          <div className="label">{t('admin.statsReports')}</div>
          <div className="num">{stats.reports.total}</div>
          <div className="trend flat">
            {t('admin.statsPendingReports')}: {stats.reports.pending}
          </div>
        </div>

        <div className="stat-card">
          <div className="top">
            <span className="ic">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
          </div>
          <div className="label">{t('nav.clients')}</div>
          <div className="num">{stats.clients.total}</div>
          <div className="trend up">
            +{stats.clients.new_this_month} {t('admin.statsNewThisMonth')}
          </div>
        </div>

        {/* admins only — the key is absent for consultants */}
        {stats.consultants && (
          <div className="stat-card">
            <div className="top">
              <span className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
                </svg>
              </span>
            </div>
            <div className="label">{t('nav.consultants')}</div>
            <div className="num">{stats.consultants.total}</div>
            <div className="trend flat">
              {t('admin.statsActive')}: {stats.consultants.active}
            </div>
          </div>
        )}

        {stats.revenue && (
          <div className="stat-card">
            <div className="top">
              <span className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
            </div>
            <div className="label">{t('admin.statsRevenueMonth')}</div>
            <div className="num" style={{ fontSize: '1.5rem' }}>{stats.revenue.this_month_formatted}</div>
            <div className="trend flat">
              {t('admin.statsRevenueTotal')}: {stats.revenue.total_formatted}
            </div>
          </div>
        )}
      </div>

      {/* charts row */}
      <div className="chart-row">
        <ChartCard title={t('admin.bookingsByStatus')}>
          {(() => {
            const data = [
              { label: t('bookingStatus.pending'), value: stats.bookings.pending, color: 'var(--warning)' },
              { label: t('bookingStatus.completed'), value: stats.bookings.completed, color: 'var(--success)' },
              { label: t('bookingStatus.cancelled'), value: stats.bookings.cancelled, color: 'var(--danger)' },
            ];
            return (
              <div className="flex items-center gap-8 flex-wrap">
                <DonutChart data={data} />
                <DonutLegend data={data} />
              </div>
            );
          })()}
        </ChartCard>
        <ChartCard title={t('admin.revenueOverview')}>
          {stats.revenue ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-success-soft rounded-xl p-4 text-center">
                <div className="text-muted text-sm">{t('admin.statsRevenueMonth')}</div>
                <div className="font-serif text-xl mt-1" style={{ color: 'var(--success)' }}>
                  {stats.revenue.this_month_formatted}
                </div>
              </div>
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <div className="text-muted text-sm">{t('admin.statsRevenueTotal')}</div>
                <div className="font-serif text-xl mt-1" style={{ color: 'var(--primary)' }}>
                  {stats.revenue.total_formatted}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted text-sm py-8 text-center">{t('admin.chartEmpty')}</div>
          )}
        </ChartCard>
      </div>

      {/* monthly trends */}
      <div className="chart-row">
        <ChartCard title={t('admin.bookingsByMonth')}>
          <BarChart
            data={stats.bookings.by_month.map((m) => ({ label: m.month, value: m.count, color: 'var(--primary)' }))}
            sort="label-asc"
          />
        </ChartCard>
        <ChartCard title={t('admin.revenueByMonth')}>
          {stats.revenue ? (
            <BarChart
              data={stats.revenue.by_month.map((m) => ({
                label: m.month,
                value: Math.round(m.amount / 100),
                color: 'var(--gold)',
              }))}
              sort="label-asc"
              valueFormatter={(v) => `${v.toLocaleString()} SAR`}
            />
          ) : (
            <div className="text-muted text-sm py-8 text-center">{t('admin.chartEmpty')}</div>
          )}
        </ChartCard>
      </div>

      {/* upcoming bookings mini-table */}
      <div className="panel-card">
        <h3>{t('admin.upcomingBookings')}</h3>
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
      </div>
    </>
  );
}
