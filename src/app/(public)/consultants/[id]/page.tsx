'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePublicMeta } from '@/lib/meta';
import { EmptyState, ErrorState } from '@/components/ui';
import { Container } from '@/components/public/Section';
import { ExpertCard } from '@/components/public/ExpertCard';
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

  const c = consultantQuery.data;

  return (
    <main className="py-24">
      <Container>
        {consultantQuery.isLoading ? (
          <div className="min-h-[380px] animate-pulse rounded-3xl border border-border bg-surface" aria-busy="true" />
        ) : consultantQuery.isError ? (
          <ErrorState onRetry={() => consultantQuery.refetch()} />
        ) : !c ? (
          <EmptyState title={t('common.empty')} />
        ) : (
          <ExpertCard
            eyebrow={t('consultants.eyebrow')}
            name={c.name}
            role={c.title}
            sub={c.specialization}
            bio={c.bio}
            photo={c.avatar_url}
            photoAlt={c.name}
          >
            {c.working_days.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2 border-t border-border pt-6">
                {c.working_days.map((d) => (
                  <li key={d} className="ui-badge" data-color="green">
                    {dayName(d)}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/packages" className="btn btn-primary">
                {t('bookConsultation')}
              </Link>
              <Link href="/consultants" className="btn btn-outline">
                {t('common.back')}
              </Link>
            </div>
          </ExpertCard>
        )}
      </Container>
    </main>
  );
}
