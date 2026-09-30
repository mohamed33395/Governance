'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePublicMeta } from '@/lib/meta';
import { Avatar, EmptyState, ErrorState, Pagination, SearchInput } from '@/components/ui';
import { Container, PageHero } from '@/components/public/Section';
import { PersonCard } from '@/components/public/PersonCard';
import { FIELD, FOCUS } from '@/components/public/tokens';
import type { Paginated, PublicConsultant } from '@/types/api';

// §10.2 — public consultant list (PUB-03). No email/phone is returned.
export default function ConsultantsPage() {
  const { t } = useI18n();
  const meta = usePublicMeta();
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [page, setPage] = useState(1);

  const consultantsQuery = useQuery({
    queryKey: ['public', 'consultants', { search, specialization, page }],
    queryFn: () =>
      api
        .get('/public/consultants', { params: { search: search || undefined, specialization: specialization || undefined, page, per_page: 12 } })
        .then((r) => r.data as Paginated<PublicConsultant>),
    placeholderData: keepPreviousData,
  });

  const dayName = (d: number) =>
    meta.data?.days_of_week.find((x) => x.value === d)?.name ?? String(d);

  const result = consultantsQuery.data;

  return (
    <main>
      <PageHero eyebrow={t('consultants.eyebrow')} title={t('consultants.title')} lead={t('consultants.subtitle')} />
      <section className="py-24">
        <Container>
          <div className="mb-12 flex flex-wrap gap-3">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} className="min-w-64 flex-1" />
            <input
              value={specialization}
              onChange={(e) => { setSpecialization(e.target.value); setPage(1); }}
              placeholder={t('consultants.specializationFilter')}
              aria-label={t('consultants.specializationFilter')}
              className={`${FIELD} max-w-[260px]`}
            />
          </div>

          {consultantsQuery.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-h-[240px] animate-pulse rounded-2xl border border-border bg-surface" />
              ))}
            </div>
          ) : consultantsQuery.isError ? (
            <ErrorState onRetry={() => consultantsQuery.refetch()} />
          ) : !result || result.data.length === 0 ? (
            <EmptyState title={t('common.empty')} />
          ) : (
            <>
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {result.data.map((c) => (
                  <li key={c.id}>
                    <Link href={`/consultants/${c.id}`} className={`block h-full rounded-2xl ${FOCUS}`}>
                      <PersonCard
                        avatar={<Avatar src={c.avatar_thumb_url ?? c.avatar_url} name={c.name} size="lg" />}
                        name={c.name}
                        role={c.title}
                        field={c.specialization}
                        footer={
                          c.working_days.length > 0 ? (
                            <span className="mt-4 flex flex-wrap justify-center gap-1">
                              {c.working_days.map((d) => (
                                <span key={d} className="ui-badge" data-color="green">
                                  {dayName(d)}
                                </span>
                              ))}
                            </span>
                          ) : null
                        }
                      />
                    </Link>
                  </li>
                ))}
              </ul>
              <Pagination meta={result.meta} onPage={setPage} />
            </>
          )}
        </Container>
      </section>
    </main>
  );
}
