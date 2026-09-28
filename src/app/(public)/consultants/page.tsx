'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePublicMeta } from '@/lib/meta';
import { Avatar, EmptyState, ErrorState, Pagination, SearchInput } from '@/components/ui';
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
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">{t('consultants.eyebrow')}</span>
          <h2>{t('consultants.title')}</h2>
          <p>{t('consultants.subtitle')}</p>
        </div>

        <div className="flex gap-3 flex-wrap mb-10">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} className="flex-1 min-w-56" />
          <input
            value={specialization}
            onChange={(e) => { setSpecialization(e.target.value); setPage(1); }}
            placeholder={t('consultants.specializationFilter')}
            className="ui-input"
            style={{ maxWidth: 260 }}
          />
        </div>

        {consultantsQuery.isLoading ? (
          <div className="team-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="team-card animate-pulse" style={{ minHeight: 220 }} />
            ))}
          </div>
        ) : consultantsQuery.isError ? (
          <ErrorState onRetry={() => consultantsQuery.refetch()} />
        ) : !result || result.data.length === 0 ? (
          <EmptyState title={t('common.empty')} />
        ) : (
          <>
            <div className="team-grid">
              {result.data.map((c) => (
                <Link key={c.id} href={`/consultants/${c.id}`} className="team-card" style={{ textDecoration: 'none' }}>
                  <Avatar src={c.avatar_thumb_url ?? c.avatar_url} name={c.name} size="lg" className="avatar" />
                  <h4>{c.name}</h4>
                  {c.title && <div className="role">{c.title}</div>}
                  {c.specialization && <div className="field-tag">{c.specialization}</div>}
                  {c.working_days.length > 0 && (
                    <div className="flex gap-1 justify-center flex-wrap mt-3">
                      {c.working_days.map((d) => (
                        <span key={d} className="ui-badge" data-color="green" style={{ fontSize: '.68rem', padding: '3px 9px' }}>
                          {dayName(d)}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
            <Pagination meta={result.meta} onPage={setPage} />
          </>
        )}
      </div>
    </section>
  );
}
