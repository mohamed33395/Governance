'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { RequirePermission } from '@/components/admin/RequirePermission';
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Switch,
  Table,
  TableSkeleton,
  useToast,
} from '@/components/ui';
import type { Client, Consultant, Paginated } from '@/types/api';

// §13.10 — clients (ADM-CL-01..08)
export default function AdminClientsPage() {
  return (
    <RequirePermission perm="view-clients">
      <ClientsInner />
    </RequirePermission>
  );
}

function ClientsInner() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can, type } = usePermissions();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [consultantId, setConsultantId] = useState('');
  const [hasSub, setHasSub] = useState('');
  const [page, setPage] = useState(1);
  const [toggling, setToggling] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'clients', { search, activeFilter, consultantId, hasSub, page }],
    queryFn: () =>
      api
        .get('/admin/clients', {
          params: {
            search: search || undefined,
            is_active: activeFilter || undefined,
            consultant_id: consultantId || undefined,
            has_active_subscription: hasSub || undefined,
            page,
          },
        })
        .then((r) => r.data as Paginated<Client>),
  });
  const data = query.data;

  const consultantsQuery = useQuery({
    queryKey: ['admin', 'consultants', 'options'],
    queryFn: () =>
      api.get('/admin/consultants', { params: { per_page: 100 } }).then((r) => (r.data as Paginated<Consultant>).data),
    enabled: type === 'admin',
    staleTime: 60_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] });

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.patch(`/admin/clients/${id}/status`, { is_active }),
    onSuccess: () => {
      setToggling(null);
      invalidate();
      toast.success(t('profile.saved'));
    },
    onError: (e) => {
      if (isApiError(e)) toast.error(e.message);
      setToggling(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/clients/${id}`),
    onSuccess: () => {
      toast.success(t('clientsAdmin.deleted'));
      setDeleting(null);
      invalidate();
    },
    onError: (e) => {
      // 409 CLIENT_HAS_FUTURE_BOOKINGS
      if (isApiError(e)) toast.error(e.message);
      setDeleting(null);
    },
  });

  const resetPage = () => setPage(1);

  return (
    <>
      <PageHeader title={t('nav.clients')} />

      <div className="flex gap-3 flex-wrap mb-6">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetPage();
          }}
          className="flex-1 min-w-[200px]"
        />
        {type === 'admin' && (
          <Select
            options={(consultantsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            placeholder={t('bookings.consultant')}
            value={consultantId}
            onChange={(e) => {
              setConsultantId(e.target.value);
              resetPage();
            }}
            style={{ maxWidth: 180 }}
          />
        )}
        <Select
          options={[
            { value: '1', label: t('users.active') },
            { value: '0', label: t('users.inactive') },
          ]}
          placeholder={t('common.status')}
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 150 }}
        />
        <Select
          options={[
            { value: '1', label: t('clientsAdmin.hasSubscription') },
            { value: '0', label: t('clientsAdmin.noSubscription') },
          ]}
          placeholder={t('clientsAdmin.subscription')}
          value={hasSub}
          onChange={(e) => {
            setHasSub(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 170 }}
        />
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('common.empty')} />
      ) : (
        <>
          <Table
            columns={[
              {
                key: 'client',
                header: t('auth.name'),
                render: (c) => (
                  <span className="flex items-center gap-3">
                    <Avatar src={c.avatar_thumb_url ?? c.avatar_url} name={c.name} size="sm" />
                    <span>
                      <strong className="block">{c.name}</strong>
                      <span className="text-muted text-[0.8rem]">{c.company_name}</span>
                    </span>
                  </span>
                ),
              },
              { key: 'email', header: t('auth.email'), render: (c) => <span dir="ltr">{c.email}</span> },
              { key: 'phone', header: t('auth.phone'), render: (c) => <span dir="ltr">{c.phone}</span> },
              { key: 'bookings', header: t('nav.bookings'), render: (c) => c.bookings_count ?? 0 },
              { key: 'reports', header: t('nav.reports'), render: (c) => c.reports_count ?? 0 },
              {
                key: 'subscription',
                header: t('clientsAdmin.subscription'),
                render: (c) =>
                  c.active_subscription ? (
                    <Badge color="green">{c.active_subscription.package.name}</Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  ),
              },
              {
                key: 'active',
                header: t('common.status'),
                render: (c) => (
                  <Switch
                    checked={c.is_active}
                    disabled={!can('update-clients')}
                    onChange={() =>
                      c.is_active
                        ? setToggling(c)
                        : statusMutation.mutate({ id: c.id, is_active: true })
                    }
                    aria-label={t('common.status')}
                  />
                ),
              },
              {
                key: 'actions',
                header: t('common.actions'),
                render: (c) => (
                  <span className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/clients/${c.id}`)}>
                      {t('common.view')}
                    </Button>
                    {can('delete-clients') && (
                      <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleting(c)}>
                        {t('common.delete')}
                      </Button>
                    )}
                  </span>
                ),
              },
            ]}
            rows={data.data}
            rowKey={(c) => c.id}
            onRowClick={(c) => router.push(`/admin/clients/${c.id}`)}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}

      {/* deactivating revokes the client's tokens */}
      <ConfirmDialog
        open={!!toggling}
        onClose={() => setToggling(null)}
        onConfirm={() => toggling && statusMutation.mutate({ id: toggling.id, is_active: false })}
        title={t('clientsAdmin.deactivate')}
        body={t('clientsAdmin.deactivateConfirm')}
        danger
        loading={statusMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title={t('common.delete')}
        body={t('clientsAdmin.deleteConfirm')}
        danger
        loading={deleteMutation.isPending}
      />
    </>
  );
}
