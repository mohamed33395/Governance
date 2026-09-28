'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWizard } from '@/stores/wizard';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Avatar, EmptyState, ErrorState, Pagination, SearchInput } from '@/components/ui';
import type { Paginated, PublicConsultant } from '@/types/api';

// §11.2 step 3 — pick a consultant (PUB-03)
export function StepConsultant() {
  const { t } = useI18n();
  const { consultant, setConsultant } = useWizard();
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['public', 'consultants', { search, specialization, page }],
    queryFn: () =>
      api
        .get('/public/consultants', { params: { search: search || undefined, specialization: specialization || undefined, page } })
        .then((r) => r.data as Paginated<PublicConsultant>),
  });
  const data = query.data;

  return (
    <div>
      <div className="flex gap-3 flex-wrap mb-6">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder={t('consultants.searchPlaceholder')}
          className="flex-1 min-w-[220px]"
        />
        <input
          value={specialization}
          onChange={(e) => {
            setSpecialization(e.target.value);
            setPage(1);
          }}
          placeholder={t('consultants.specializationFilter')}
          className="ui-input"
          style={{ maxWidth: 220 }}
        />
      </div>

      {query.isLoading ? (
        <div className="page-loader">
          <span className="spinner" />
        </div>
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('common.empty')} />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4" role="radiogroup">
            {data.data.map((c) => {
              const active = consultant?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setConsultant(c)}
                  className={`flex items-center gap-4 rounded-2xl border p-4 text-start transition-all cursor-pointer ${
                    active ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border bg-surface hover:border-accent'
                  }`}
                >
                  <Avatar src={c.avatar_thumb_url} name={c.name} size="lg" />
                  <span className="min-w-0">
                    <strong className="block text-text text-[1rem]">{c.name}</strong>
                    {c.title && <span className="block text-muted text-[0.84rem] mt-0.5">{c.title}</span>}
                    {c.specialization && <span className="block text-accent text-[0.8rem] mt-1">{c.specialization}</span>}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`ms-auto w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                      active ? 'border-accent bg-accent' : 'border-border'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}
    </div>
  );
}
