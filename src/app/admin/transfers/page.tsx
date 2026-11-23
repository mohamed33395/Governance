'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { usePermissions } from '@/lib/permissions';
import { useAdminAuth } from '@/stores/admin-auth';
import { useI18n } from '@/lib/i18n/i18n-context';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { FilterPanel } from '@/components/admin/FilterPanel';
import {
  ActionsMenu,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LogoLoader,
  Modal,
  PageHeader,
  Pagination,
  Select,
  StatusBadge,
  Table,
  Textarea,
  useToast,
} from '@/components/ui';
import type { BookingTransfer, Paginated, TransferStatus } from '@/types/api';

const STATUSES: TransferStatus[] = ['pending', 'approved', 'rejected', 'cancelled'];

export default function AdminTransfersPage() {
  return (
    <RequirePermission perm="view-booking-transfers">
      <TransfersInner />
    </RequirePermission>
  );
}

function TransfersInner() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const me = useAdminAuth((s) => s.user);

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [approving, setApproving] = useState<BookingTransfer | null>(null);
  const [rejecting, setRejecting] = useState<BookingTransfer | null>(null);
  const [cancelling, setCancelling] = useState<BookingTransfer | null>(null);
  const [note, setNote] = useState('');

  const query = useQuery({
    queryKey: ['admin', 'booking-transfers', { status, page }],
    queryFn: () =>
      api
        .get('/admin/booking-transfers', {
          params: { status: status || undefined, page },
        })
        .then((r) => r.data as Paginated<BookingTransfer>),
  });
  const data = query.data;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'booking-transfers'] });

  const onMutationError = (e: unknown) => {
    if (isApiError(e)) toast.error(e.message);
    setApproving(null);
    setRejecting(null);
    setCancelling(null);
    setNote('');
  };

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/booking-transfers/${id}/approve`),
    onSuccess: () => {
      toast.success(t('transfers.approved'));
      setApproving(null);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: onMutationError,
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/booking-transfers/${id}/reject`, { note: note.trim() || undefined }),
    onSuccess: () => {
      toast.success(t('transfers.rejected'));
      setRejecting(null);
      setNote('');
      invalidate();
    },
    onError: onMutationError,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/booking-transfers/${id}/cancel`),
    onSuccess: () => {
      toast.success(t('transfers.cancelled'));
      setCancelling(null);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: onMutationError,
  });

  const canManage = can('manage-booking-transfers');
  const canRequest = can('request-booking-transfers');

  return (
    <>
      <PageHeader
        title={t('nav.transfers')}
        subtitle={data ? t('transfers.total').replace('{count}', String(data.meta.total)) : undefined}
      />

      <FilterPanel>
        <Select
          options={STATUSES.map((s) => ({ value: s, label: t(`transfers.statuses.${s}`) }))}
          placeholder={t('transfers.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 180 }}
        />
      </FilterPanel>

      {query.isLoading ? (
        <LogoLoader />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('transfers.empty')} />
      ) : (
        <>
          <Table
            columns={[
              {
                key: 'booking',
                header: t('transfers.booking'),
                render: (row) =>
                  row.booking ? (
                    <div>
                      <strong dir="ltr" className="block">{row.booking.reference}</strong>
                      <span className="text-muted text-[0.8rem]">
                        {row.booking.date} · <bdi dir="ltr">{row.booking.time}</bdi>
                      </span>
                    </div>
                  ) : (
                    '—'
                  ),
              },
              {
                key: 'client',
                header: t('transfers.client'),
                render: (row) =>
                  row.booking?.client ? (
                    <div>
                      <span className="block">{row.booking.client.company_name || row.booking.client.name}</span>
                      {row.booking.client.company_name && (
                        <span className="text-muted text-[0.8rem]">{row.booking.client.name}</span>
                      )}
                    </div>
                  ) : (
                    '—'
                  ),
              },
              {
                key: 'from',
                header: t('transfers.from'),
                render: (row) => row.from_consultant?.name ?? '—',
              },
              {
                key: 'to',
                header: t('transfers.to'),
                render: (row) => row.to_consultant?.name ?? '—',
              },
              {
                key: 'reason',
                header: t('transfers.reason'),
                minWidth: 220,
                render: (row) => (
                  <div>
                    <span className="block text-[0.86rem]">{row.reason}</span>
                    {row.decision_note && (
                      <span className="text-muted text-[0.78rem] block mt-0.5">
                        {t('transfers.decisionNote')}: {row.decision_note}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: 'status',
                header: t('transfers.status'),
                render: (row) => <StatusBadge kind="transfer" value={row.status} label={row.status_label} />,
              },
              {
                key: 'requested_at',
                header: t('transfers.requestedAt'),
                render: (row) => (
                  <div>
                    <span dir="ltr" className="block text-[0.85rem]">
                      {row.created_at ? row.created_at.slice(0, 16).replace('T', ' ') : '—'}
                    </span>
                    {row.decided_by && (
                      <span className="text-muted text-[0.78rem]">
                        {t('transfers.decidedBy')}: {row.decided_by.name}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: '',
                render: (row) => {
                  if (row.status !== 'pending') return null;
                  const ownRequest = row.requested_by?.id === me?.id;
                  return (
                    <ActionsMenu
                      ariaLabel={t('common.actions')}
                      items={[
                        ...(canManage
                          ? [
                              { key: 'approve', label: t('transfers.approve'), onClick: () => setApproving(row) },
                              { key: 'reject', label: t('transfers.reject'), danger: true, onClick: () => setRejecting(row) },
                            ]
                          : []),
                        ...(canRequest && ownRequest
                          ? [{ key: 'cancel', label: t('transfers.cancel'), danger: true, onClick: () => setCancelling(row) }]
                          : []),
                      ]}
                    />
                  );
                },
              },
            ]}
            rows={data.data}
            rowKey={(row) => row.id}
            onRowClick={(row) => row.booking && router.push(`/admin/bookings/${row.booking.id}`)}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}

      {/* approve — reassigns the booking immediately */}
      <ConfirmDialog
        open={!!approving}
        onClose={() => setApproving(null)}
        onConfirm={() => approving && approveMutation.mutate(approving.id)}
        title={t('transfers.approve')}
        body={t('transfers.approveConfirm')}
        loading={approveMutation.isPending}
      />

      {/* reject — optional note for the requesting consultant */}
      <Modal
        open={!!rejecting}
        onClose={() => {
          setRejecting(null);
          setNote('');
        }}
        title={t('transfers.rejectTitle')}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setRejecting(null);
                setNote('');
              }}
              disabled={rejectMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={() => rejecting && rejectMutation.mutate(rejecting.id)} loading={rejectMutation.isPending}>
              {t('transfers.reject')}
            </Button>
          </>
        }
      >
        <Textarea label={t('transfers.note')} value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} />
      </Modal>

      {/* cancel — consultant withdraws his own pending request */}
      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={() => cancelling && cancelMutation.mutate(cancelling.id)}
        title={t('transfers.cancel')}
        body={t('transfers.cancelConfirm')}
        danger
        loading={cancelMutation.isPending}
      />
    </>
  );
}
