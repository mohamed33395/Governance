'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { useClientAuth } from '@/stores/client-auth';
import { Avatar, EmptyState, ErrorState, StatusBadge } from '@/components/ui';
import type { ClientDashboard } from '@/types/api';

// §12.1 — client dashboard home (CLI-DSH-01)
export default function DashboardPage() {
  const { t } = useI18n();
  const user = useClientAuth((s) => s.user);

  const dashboardQuery = useQuery({
    queryKey: ['client', 'dashboard'],
    queryFn: () => api.get('/client/dashboard').then((r) => r.data.data as ClientDashboard),
  });
  const data = dashboardQuery.data;

  if (dashboardQuery.isLoading) {
    return (
      <div className="page-loader">
        <span className="spinner" />
      </div>
    );
  }
  if (dashboardQuery.isError || !data) {
    return <ErrorState onRetry={() => dashboardQuery.refetch()} />;
  }

  const next = data.next_booking;

  return (
    <>
      {/* next booking hero */}
      <div className="client-welcome">
        <h2>{t('dashboard.welcome').replace('{name}', user?.name ?? '')}</h2>
        {next ? (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <strong style={{ fontSize: '1.05rem' }}>{next.package.name}</strong>
                <StatusBadge kind="booking" value={next.status} label={next.status_label} />
              </div>
              <p className="mt-2" style={{ color: 'rgba(255,255,255,.85)' }}>
                {next.consultant.name} · {next.date} · <bdi dir="ltr">{next.time}</bdi>
              </p>
            </div>
            {next.meeting.status === 'created' && next.meeting.url && (
              <a
                href={next.meeting.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-gold btn-sm"
                style={{ marginInlineStart: 'auto' }}
              >
                {t('dashboard.joinMeeting')}
              </a>
            )}
            {next.meeting.status === 'pending' && (
              <span style={{ marginInlineStart: 'auto', color: 'var(--gold-light)', fontSize: '.85rem' }}>
                {t('dashboard.meetingPending')}
              </span>
            )}
          </div>
        ) : (
          <p>
            {t('dashboard.noNextBooking')}{' '}
            <Link href="/packages" style={{ color: 'var(--gold-light)', textDecoration: 'underline' }}>
              {t('bookConsultation')}
            </Link>
          </p>
        )}
      </div>

      {/* stat cards */}
      <div className="client-card-grid">
        <div className="client-stat-card">
          <div className="num">{data.bookings.upcoming}</div>
          <div className="label">{t('dashboard.upcoming')}</div>
        </div>
        <div className="client-stat-card">
          <div className="num">{data.bookings.completed}</div>
          <div className="label">{t('dashboard.completed')}</div>
        </div>
        <div className="client-stat-card">
          <div className="num">{data.reports.total}</div>
          <div className="label">{t('nav.reports')}</div>
        </div>
      </div>

      {/* active subscriptions */}
      <h3 style={{ marginBottom: 18, fontSize: '1.15rem' }}>{t('dashboard.activePackages')}</h3>
      {data.active_subscriptions.length === 0 ? (
        <EmptyState
          title={t('dashboard.noPackages')}
          action={
            <Link href="/packages" className="btn btn-primary btn-sm">
              {t('nav.packages')}
            </Link>
          }
        />
      ) : (
        <div className="client-packages">
          {data.active_subscriptions.map((sub) => (
            <div key={sub.id} className="client-package-card">
              <h4>{sub.package?.name ?? '—'}</h4>
              <div className="mt-2 mb-3">
                <StatusBadge kind="subscription" value={sub.status} label={sub.status_label ?? sub.status} />
              </div>
              <ul>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('dashboard.consultationsRemaining')}</span>
                  <strong>
                    {sub.is_unlimited || sub.consultations_remaining === null
                      ? t('dashboard.unlimited')
                      : sub.consultations_remaining}
                  </strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('dashboard.endsAt')}</span>
                  <strong>{sub.ends_at}</strong>
                </li>
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
