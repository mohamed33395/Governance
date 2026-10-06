'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Star } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { FilterPanel } from '@/components/admin/FilterPanel';
import { Badge, EmptyState, ErrorState, Pagination, SearchInput, Select, Table, TableSkeleton } from '@/components/ui';
import type { Paginated, Review, ReviewStatus } from '@/types/api';

const STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected'];

export default function AdminReviewsPage() {
  return (
    <RequirePermission perm="view-reviews">
      <ReviewsInner />
    </RequirePermission>
  );
}

function ReviewsInner() {
  const { t } = useI18n();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReviewStatus | ''>('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin', 'reviews', { search, status, page }],
    queryFn: () =>
      api
        .get('/admin/reviews', {
          params: { search: search || undefined, status: status || undefined, page },
        })
        .then((r) => r.data as Paginated<Review>),
  });
  const data = query.data;

  return (
    <>
      <div className="page-identity" style={{ ['--id-strong' as string]: 'var(--green-deep)' }}>
        <div className="page-identity-main">
          <div className="page-id-rail" />
          <div>
            <h1 className="page-id-title">{t('nav.reviews')}</h1>
            {data && (
              <p className="page-id-sub">
                {t('reviews.total').replace('{count}', String(data.meta.total))}
              </p>
            )}
          </div>
        </div>
      </div>

      <FilterPanel>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          className="flex-1 min-w-[220px]"
        />
        <Select
          options={STATUSES.map((s) => ({ value: s, label: t(`reviews.statuses.${s}`) }))}
          placeholder={t('reviews.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ReviewStatus | '');
            setPage(1);
          }}
          style={{ maxWidth: 160 }}
        />
      </FilterPanel>

      {query.isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('reviews.noReviews')} />
      ) : (
        <>
          <Table
            columns={[
              { key: 'id', header: '#', render: (row) => row.id },
              {
                key: 'name',
                header: t('reviews.name'),
                render: (row) => (
                  <div>
                    <span className="block">{row.name}</span>
                    {row.client?.company_name && (
                      <span className="text-muted text-[0.8rem] block">{row.client.company_name}</span>
                    )}
                  </div>
                ),
              },
              {
                key: 'rating',
                header: t('reviews.rating'),
                render: (row) => <Stars value={row.rating} />,
              },
              {
                key: 'comment',
                header: t('reviews.comment'),
                minWidth: 220,
                render: (row) => (
                  <div>
                    {row.title && <strong className="block text-[0.88rem]">{row.title}</strong>}
                    <span className="text-muted text-[0.85rem] line-clamp-2">{row.comment}</span>
                  </div>
                ),
              },
              {
                key: 'status',
                header: t('reviews.status'),
                render: (row) => (
                  <Badge color={statusColor(row.status)}>
                    {row.status_label ?? t(`reviews.statuses.${row.status}`)}
                  </Badge>
                ),
              },
              {
                key: 'created',
                header: t('common.date'),
                render: (row) => row.created_at.slice(0, 16).replace('T', ' '),
              },
              { key: 'go', header: '', render: () => <span className="text-muted rtl:-scale-x-100 inline-block">›</span> },
            ]}
            rows={data.data}
            rowKey={(row) => row.id}
            onRowClick={(row) => router.push(`/admin/reviews/${row.id}`)}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}
    </>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={15}
          weight={n <= value ? 'fill' : 'regular'}
          className={n <= value ? 'text-accent' : 'text-border'}
        />
      ))}
    </span>
  );
}

function statusColor(status: ReviewStatus) {
  switch (status) {
    case 'pending':
      return 'amber';
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    default:
      return 'gray';
  }
}
