'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePublicMeta } from '@/lib/meta';
import { EmptyState, ErrorState } from '@/components/ui';
import type { PublicConsultant } from '@/types/api';

// §10.2 — public consultant profile (PUB-04)
export default function ConsultantProfilePage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const meta = usePublicMeta();

  const consultantQuery = useQuery({
    queryKey: ['public', 'consultants', params.id],
    queryFn: () => api.get(`/public/consultants/${params.id}`).then((r) => r.data.data as PublicConsultant),
  });

  const dayName = (d: number) =>
    meta.data?.days_of_week.find((x) => x.value === d)?.name ?? String(d);

  return (
    <section className="section">
      <div className="wrap">
        {consultantQuery.isLoading ? (
          <div className="expert-card animate-pulse" style={{ minHeight: 380 }} />
        ) : consultantQuery.isError ? (
          <ErrorState onRetry={() => consultantQuery.refetch()} />
        ) : !consultantQuery.data ? (
          <EmptyState title={t('common.empty')} />
        ) : (
          <div className="expert-grid">
            <article className="expert-card">
              <div className="expert-photo">
                <div className="expert-frame">
                  {consultantQuery.data.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={consultantQuery.data.avatar_url} alt={consultantQuery.data.name} />
                  ) : (
                    <span className="ph" style={{ fontFamily: 'Amiri, serif', fontSize: '4rem', color: 'var(--gold)' }}>
                      {consultantQuery.data.name.trim()[0]}
                    </span>
                  )}
                </div>
              </div>
              <div className="expert-info">
                <span className="eyebrow">{t('consultants.eyebrow')}</span>
                <h2>{consultantQuery.data.name}</h2>
                {consultantQuery.data.title && (
                  <span className="expert-role">{consultantQuery.data.title}</span>
                )}
                {consultantQuery.data.specialization && (
                  <span className="expert-name-en">{consultantQuery.data.specialization}</span>
                )}
                {consultantQuery.data.bio && <p>{consultantQuery.data.bio}</p>}
                {consultantQuery.data.working_days.length > 0 && (
                  <>
                    <div className="divider" style={{ margin: '26px 0 16px' }} />
                    <div className="flex gap-2 flex-wrap">
                      {consultantQuery.data.working_days.map((d) => (
                        <span key={d} className="ui-badge" data-color="green">
                          {dayName(d)}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                <div className="hero-actions" style={{ marginTop: 30 }}>
                  <Link href="/packages" className="btn btn-primary">
                    {t('bookConsultation')}
                  </Link>
                  <Link href="/consultants" className="btn btn-outline">
                    {t('common.back')}
                  </Link>
                </div>
              </div>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}
