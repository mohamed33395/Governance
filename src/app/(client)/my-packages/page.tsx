'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePublicMeta } from '@/lib/meta';
import { EmptyState, ErrorState, PageHeader, Pagination, PriceTag, StatusBadge, Tabs } from '@/components/ui';
import type { Paginated, Subscription } from '@/types/api';

// §12.5 — my packages / subscriptions (CLI-SUB-01)
export default function MyPackagesPage() {
  const { t } = useI18n();
  const meta = usePublicMeta();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['client', 'subscriptions', { status, page }],
    queryFn: () =>
      api
        .get('/client/subscriptions', { params: { status: status || undefined, page } })
        .then((r) => r.data as Paginated<Subscription>),
  });
  const data = query.data;

  const tabs = [
    { key: '', label: t('common.all') },
    { key: 'active', label: t('subscriptionStatus.active') },
    { key: 'expired', label: t('subscriptionStatus.expired') },
    { key: 'cancelled', label: t('subscriptionStatus.cancelled') },
  ];

  return (
    <>
      <PageHeader title={t('myPackages.title')} />

      <Tabs
        tabs={tabs}
        active={status}
        onChange={(k) => {
          setStatus(k);
          setPage(1);
        }}
        className="mb-6"
      />

      {query.isLoading ? (
        <div className="page-loader">
          <span className="spinner" />
        </div>
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState
          title={t('myPackages.empty')}
          action={
            <Link href="/packages" className="btn btn-primary btn-sm">
              {t('myPackages.browse')}
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-5">
            {data.data.map((sub) => {
              const pct =
                sub.is_unlimited || sub.consultations_limit === null || sub.consultations_limit === 0
                  ? null
                  : Math.min(100, Math.round((sub.consultations_used / sub.consultations_limit) * 100));
              return (
                <div key={sub.id} className="bg-surface border border-border rounded-2xl p-6" style={{ boxShadow: 'var(--shadow)' }}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="text-lg">{sub.package?.name ?? '—'}</h3>
                    <StatusBadge kind="subscription" value={sub.status} label={sub.status_label ?? t(`subscriptionStatus.${sub.status}`)} />
                  </div>

                  <div className="flex justify-between gap-3 py-1.5 text-[0.9rem]">
                    <span className="text-muted">{t('myPackages.period')}</span>
                    <strong>
                      {dayjs(sub.starts_at).format('YYYY-MM-DD')} ← {dayjs(sub.ends_at).format('YYYY-MM-DD')}
                    </strong>
                  </div>

                  <div className="py-1.5">
                    <div className="flex justify-between gap-3 text-[0.9rem] mb-2">
                      <span className="text-muted">{t('myPackages.usage')}</span>
                      <strong>
                        {sub.is_unlimited || sub.consultations_limit === null
                          ? t('dashboard.unlimited')
                          : `${sub.consultations_used} / ${sub.consultations_limit}`}
                      </strong>
                    </div>
                    {pct !== null && (
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--danger)' : 'var(--accent)' }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between gap-3 py-1.5 text-[0.9rem] mt-2 pt-3 border-t border-border/60">
                    <span className="text-muted">{t('wizard.total')}</span>
                    <PriceTag formatted={sub.price_paid_formatted} />
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}
    </>
  );
}
