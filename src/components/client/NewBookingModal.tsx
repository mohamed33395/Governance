'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Avatar, EmptyState, ErrorState, LogoLoader, Modal, Pagination, SearchInput } from '@/components/ui';
import type { Paginated, PublicConsultant } from '@/types/api';

// "New booking" from the client portal: pick a consultant → continue in the
// direct-booking wizard (/book/consultant/[id]). Only consultants with a
// consultation_price are bookable (same rule as the public listing cards).
export function NewBookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['public', 'consultants', { search, page }],
    queryFn: () =>
      api
        .get('/public/consultants', { params: { search: search || undefined, page } })
        .then((r) => r.data as Paginated<PublicConsultant>),
    enabled: open,
  });
  const consultants = query.data;

  const pick = (c: PublicConsultant) => {
    onClose();
    router.push(`/book/consultant/${c.id}`);
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={t('newBooking.pickConsultant')}>
      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder={t('consultants.searchPlaceholder')}
        className="mb-5"
      />

      {query.isLoading ? (
        <LogoLoader />
      ) : query.isError || !consultants ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : consultants.data.length === 0 ? (
        <EmptyState title={t('newBooking.empty')} />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            {consultants.data.map((c) => {
              const hasPrice = c.consultation_price != null && !!c.consultation_price_formatted;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={!hasPrice}
                  onClick={() => pick(c)}
                  className={`flex items-center gap-3 rounded-2xl border p-3.5 text-start transition-all ${
                    hasPrice
                      ? 'border-border bg-surface hover:border-accent cursor-pointer'
                      : 'border-border/60 bg-surface/50 opacity-55 cursor-not-allowed'
                  }`}
                >
                  <Avatar src={c.avatar_thumb_url} name={c.name} size="md" />
                  <span className="min-w-0">
                    <strong className="block text-text text-[0.95rem] truncate">{c.name}</strong>
                    {c.specialization && (
                      <span className="block text-accent text-[0.8rem] mt-0.5 truncate">{c.specialization}</span>
                    )}
                  </span>
                  <span className="ms-auto shrink-0">
                    {hasPrice ? (
                      <span className="ui-badge" data-color="green">
                        {c.consultation_price_formatted}
                      </span>
                    ) : (
                      <span className="ui-badge" data-color="gray">
                        {t('newBooking.notBookable')}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <Pagination meta={consultants.meta} onPage={setPage} className="mt-5" />
        </>
      )}
    </Modal>
  );
}
