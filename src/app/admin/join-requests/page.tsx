'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePermissions } from '@/lib/permissions';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { FilterPanel } from '@/components/admin/FilterPanel';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Pagination,
  SearchInput,
  Select,
  Table,
  TableSkeleton,
  useToast,
} from '@/components/ui';
import type { JoinRequest, JoinRequestStatus, Paginated } from '@/types/api';

const STATUSES: JoinRequestStatus[] = ['pending', 'approved', 'rejected'];

export default function JoinRequestsPage() {
  return (
    <RequirePermission perm="view-join-requests">
      <JoinRequestsInner />
    </RequirePermission>
  );
}

function JoinRequestsInner() {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<JoinRequestStatus | ''>('');
  const [page, setPage] = useState(1);
  const [actingOn, setActingOn] = useState<JoinRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const query = useQuery({
    queryKey: ['admin', 'join-requests', { search, status, page }],
    queryFn: () =>
      api
        .get('/admin/join-requests', {
          params: {
            search: search || undefined,
            status: status || undefined,
            page,
          },
        })
        .then((r) => r.data as Paginated<JoinRequest>),
  });
  const data = query.data;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'join-requests'] });

  const approve = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/join-requests/${id}/approve`),
    onSuccess: (_, id) => {
      toast.success(t('joinRequests.approved'));
      setActingOn(null);
      invalidate();
      router.push(`/admin/join-requests/${id}`);
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.patch(`/admin/join-requests/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success(t('joinRequests.rejected'));
      setRejectReason('');
      setActingOn(null);
      invalidate();
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  return (
    <>
      <div className="page-identity" style={{ ['--id-strong' as string]: 'var(--green-deep)' }}>
        <div className="page-identity-main">
          <div className="page-id-rail" />
          <div>
            <h1 className="page-id-title">{t('joinRequests.title')}</h1>
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
          options={STATUSES.map((s) => ({ value: s, label: t(`joinRequests.statuses.${s}`) }))}
          placeholder={t('joinRequests.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as JoinRequestStatus | '');
            setPage(1);
          }}
          style={{ maxWidth: 160 }}
        />
      </FilterPanel>

      {query.isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('joinRequests.noRequests')} />
      ) : (
        <>
          <Table
            columns={[
              { key: 'id', header: '#', render: (row) => row.id },
              { key: 'name', header: t('joinRequests.name'), render: (row) => row.name },
              { key: 'email', header: t('joinRequests.email'), render: (row) => <span dir="ltr">{row.email}</span> },
              { key: 'specialization', header: t('joinRequests.specialization'), render: (row) => row.specialization },
              {
                key: 'status',
                header: t('joinRequests.status'),
                render: (row) => (
                  <Badge color={statusColor(row.status)}>
                    {t(`joinRequests.statuses.${row.status}`)}
                  </Badge>
                ),
              },
              {
                key: 'created',
                header: t('common.date'),
                render: (row) => row.created_at.slice(0, 16).replace('T', ' '),
              },
              {
                key: 'actions',
                header: '',
                render: (row) => (
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/join-requests/${row.id}`}>
                      <Button variant="outline" size="sm">
                        {t('details')}
                      </Button>
                    </Link>
                    {row.status === 'pending' && can('manage-join-requests') && (
                      <>
                        <Button size="sm" onClick={() => approve.mutate(row.id)} loading={approve.isPending}>
                          {t('joinRequests.approve')}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setActingOn(row)}
                        >
                          {t('joinRequests.reject')}
                        </Button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
            rows={data.data}
            rowKey={(row) => row.id}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}

      {actingOn && (
        <div className="modal-backdrop open">
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <h3>{t('joinRequests.reject')}</h3>
            <p className="text-sm text-muted mb-4">{t('joinRequests.rejectConfirm')}</p>
            <textarea
              className="ui-input resize-y"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('joinRequests.rejectReason')}
            />
            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setActingOn(null);
                  setRejectReason('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={() => reject.mutate({ id: actingOn.id, reason: rejectReason })}
                loading={reject.isPending}
                disabled={!rejectReason.trim()}
              >
                {t('joinRequests.reject')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function statusColor(status: JoinRequestStatus) {
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
