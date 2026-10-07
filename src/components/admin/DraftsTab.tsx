'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import {
  Button,
  EmptyState,
  ErrorState,
  Pagination,
  SearchInput,
  Table,
  TableSkeleton,
  useToast,
  type Column,
} from '@/components/ui';
import type { Paginated } from '@/types/api';

// Drafts (soft-deleted records) + restore — docs/DRAFT_AND_RESTORE_GUIDE.md §2-§3.
// "delete = draft": drafted records keep all their data and can be restored.
export type DraftsResource = 'users' | 'consultants' | 'clients' | 'packages';

interface DraftedRow {
  id: number;
  deleted_at?: string | null;
}

/** Count badge for the tab — meta.total of the trashed endpoint (§3.1). */
export function useTrashedCount(resource: DraftsResource) {
  return useQuery({
    queryKey: ['admin', resource, 'trashed-count'],
    queryFn: () =>
      api
        .get(`/admin/${resource}/trashed`, { params: { per_page: 1 } })
        .then((r) => (r.data as Paginated<{ id: number }>).meta.total),
    staleTime: 30_000,
  });
}

export function DraftsTab<T extends DraftedRow>({
  resource,
  permission,
  columns,
  rowKey,
}: {
  resource: DraftsResource;
  permission: string;            // delete-* — whoever can draft can restore (§1.1)
  columns: Column<T>[];           // resource columns; deleted_at + restore are appended here
  rowKey: (row: T) => string | number;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin', resource, 'trashed', { search, page }],
    queryFn: () =>
      api
        .get(`/admin/${resource}/trashed`, { params: { search: search || undefined, page } })
        .then((r) => r.data as Paginated<T>),
  });
  const data = query.data;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', resource] });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/${resource}/${id}/restore`),
    onSuccess: () => {
      toast.success(t('drafts.restored'));
      invalidate();
    },
    onError: (e) => {
      // NOT_DRAFTED → someone else restored it first: silently refresh the list (§3.1)
      if (isApiError(e) && e.code !== 'NOT_DRAFTED') toast.error(e.message);
      invalidate();
    },
  });

  const allColumns: Column<T>[] = [
    ...columns,
    {
      key: 'deleted_at',
      header: t('drafts.deletedAt'),
      render: (row) =>
        row.deleted_at ? <span dir="ltr">{row.deleted_at.slice(0, 16).replace('T', ' ')}</span> : '—',
    },
    {
      key: 'restore',
      header: t('common.actions'),
      render: (row) =>
        can(permission) ? (
          <Button
            size="sm"
            variant="outline"
            loading={restoreMutation.isPending && restoreMutation.variables === row.id}
            disabled={restoreMutation.isPending}
            onClick={() => restoreMutation.mutate(row.id)}
          >
            {t('drafts.restore')}
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <div className="flex gap-3 flex-wrap mb-6">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] max-w-md"
        />
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={5} cols={allColumns.length} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('drafts.empty')} />
      ) : (
        <>
          <Table columns={allColumns} rows={data.data} rowKey={rowKey} />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}
    </>
  );
}
