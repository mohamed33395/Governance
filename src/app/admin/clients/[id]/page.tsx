'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { downloadFile } from '@/lib/files';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { clientProfileSchema, type ClientProfileValues } from '@/schemas/profile';
import { RequirePermission } from '@/components/admin/RequirePermission';
import {
  ActionsMenu,
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Pagination,
  PriceTag,
  StatusBadge,
  Table,
  TableSkeleton,
  Tabs,
  useToast,
} from '@/components/ui';
import type { Booking, Client, Location, Paginated, Report, Subscription } from '@/types/api';

type ClientDetails = Client & { locations: Location[] };

// §13.10 — client details with tabs
export default function AdminClientDetailsPage() {
  return (
    <RequirePermission perm="view-clients">
      <DetailsInner />
    </RequirePermission>
  );
}

function DetailsInner() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState('overview');

  const query = useQuery({
    queryKey: ['admin', 'clients', params.id],
    queryFn: () => api.get(`/admin/clients/${params.id}`).then((r) => r.data.data as ClientDetails),
  });
  const client = query.data;

  if (query.isLoading) {
    return (
      <div className="page-loader">
        <span className="spinner" />
      </div>
    );
  }
  if (query.isError || !client) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <>
      {/* header */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6" style={{ boxShadow: 'var(--shadow)' }}>
        <div className="flex items-center gap-5 flex-wrap">
          <Avatar src={client.avatar_url} name={client.name} size="xl" />
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl">{client.name}</h1>
              <Badge color={client.is_active ? 'green' : 'red'}>
                {client.is_active ? t('users.active') : t('users.inactive')}
              </Badge>
            </div>
            <p className="text-muted mt-1">{client.company_name}</p>
            <p className="text-muted text-[0.85rem] mt-0.5" dir="ltr">
              {client.email} · {client.phone}
            </p>
          </div>
          {client.active_subscription && (
            <Badge color="green">{client.active_subscription.package.name}</Badge>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border">
          {[
            [t('nav.bookings'), client.bookings_count ?? 0],
            [t('nav.reports'), client.reports_count ?? 0],
            [t('nav.locations'), client.locations.length],
            [t('users.lastLogin'), client.last_login_at ? client.last_login_at.slice(0, 10) : '—'],
          ].map(([label, value]) => (
            <div key={String(label)} className="text-center">
              <span className="block font-serif text-xl" style={{ color: 'var(--primary)' }}>
                {value}
              </span>
              <span className="text-muted text-[0.75rem]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <Tabs
        tabs={[
          { key: 'overview', label: t('clientsAdmin.tabOverview') },
          { key: 'bookings', label: t('nav.bookings') },
          { key: 'reports', label: t('nav.reports') },
          { key: 'subscriptions', label: t('nav.my_packages') },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />

      {tab === 'overview' && <OverviewTab client={client} />}
      {tab === 'bookings' && <ClientBookingsTab clientId={client.id} />}
      {tab === 'reports' && <ClientReportsTab clientId={client.id} />}
      {tab === 'subscriptions' && <ClientSubscriptionsTab clientId={client.id} />}
    </>
  );
}

// ---------- overview: locations + edit modal ----------
function OverviewTab({ client }: { client: ClientDetails }) {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [editOpen, setEditOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClientProfileValues>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      name: client.name,
      email: client.email,
      phone: client.phone,
      company_name: client.company_name,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.put(`/admin/clients/${client.id}`, values);
      toast.success(t('profile.saved'));
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] });
    } catch (e) {
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message);
    }
  });

  const err = (key?: string) => (key ? t(key) : undefined);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[1rem]">{t('nav.locations')}</h3>
        {can('update-clients') && (
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            {t('common.edit')}
          </Button>
        )}
      </div>
      {client.locations.length === 0 ? (
        <EmptyState title={t('locations.empty')} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {client.locations.map((loc) => (
            <div key={loc.id} className="bg-surface border border-border rounded-2xl p-4">
              <strong className="flex items-center gap-2">
                {loc.name}
                {loc.is_default && <span className="text-accent">★</span>}
              </strong>
              {loc.city && <span className="block text-muted text-[0.84rem] mt-1">{loc.city}</span>}
              <span className="block text-muted text-[0.84rem] mt-0.5">{loc.address}</span>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('common.edit')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button onClick={onSubmit} loading={isSubmitting}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Input label={t('auth.name')} required error={err(errors.name?.message)} {...register('name')} />
          <Input label={t('auth.email')} type="email" dir="ltr" required error={err(errors.email?.message)} {...register('email')} />
          <Input label={t('auth.phone')} dir="ltr" required placeholder="05XXXXXXXX" error={err(errors.phone?.message)} {...register('phone')} />
          <Input label={t('auth.companyName')} required error={err(errors.company_name?.message)} {...register('company_name')} />
        </form>
      </Modal>
    </div>
  );
}

// ---------- bookings (ADM-CL-06) ----------
function ClientBookingsTab({ clientId }: { clientId: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin', 'clients', clientId, 'bookings', { page }],
    queryFn: () => api.get(`/admin/clients/${clientId}/bookings`, { params: { page } }).then((r) => r.data as Paginated<Booking>),
  });
  const data = query.data;

  if (query.isLoading) return <TableSkeleton rows={3} />;
  if (query.isError || !data) return <ErrorState onRetry={() => query.refetch()} />;
  if (data.data.length === 0) return <EmptyState title={t('bookings.empty')} />;

  return (
    <>
      <Table
        columns={[
          { key: 'ref', header: t('admin.reference'), render: (b) => <span dir="ltr">{b.reference}</span> },
          { key: 'consultant', header: t('bookings.consultant'), render: (b) => b.consultant.name },
          {
            key: 'datetime',
            header: `${t('common.date')} / ${t('common.time')}`,
            render: (b) => (
              <span>
                {b.date} · <bdi dir="ltr">{b.time}</bdi>
              </span>
            ),
          },
          { key: 'package', header: t('bookings.package'), render: (b) => b.package.name },
          {
            key: 'status',
            header: t('common.status'),
            render: (b) => <StatusBadge kind="booking" value={b.status} label={b.status_label} />,
          },
        ]}
        rows={data.data}
        rowKey={(b) => b.id}
        onRowClick={(b) => router.push(`/admin/bookings/${b.id}`)}
      />
      <Pagination meta={data.meta} onPage={setPage} className="mt-4" />
    </>
  );
}

// ---------- reports (ADM-CL-07) ----------
function ClientReportsTab({ clientId }: { clientId: number }) {
  const { t } = useI18n();
  const { can } = usePermissions();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin', 'clients', clientId, 'reports', { page }],
    queryFn: () => api.get(`/admin/clients/${clientId}/reports`, { params: { page } }).then((r) => r.data as Paginated<Report>),
  });
  const data = query.data;

  if (query.isLoading) return <TableSkeleton rows={3} />;
  if (query.isError || !data) return <ErrorState onRetry={() => query.refetch()} />;
  if (data.data.length === 0) return <EmptyState title={t('reports.empty')} />;

  return (
    <>
      <Table
        columns={[
          { key: 'title', header: t('reports.details'), render: (r) => <strong>{r.title}</strong> },
          { key: 'consultant', header: t('reports.consultant'), render: (r) => r.consultant.name },
          { key: 'date', header: t('common.date'), render: (r) => r.booking.date },
          { key: 'size', header: t('reports.file'), render: (r) => <span dir="ltr">{r.file.size_human}</span> },
          {
            key: 'actions',
            header: t('common.actions'),
            render: (r) => (
              <ActionsMenu
                ariaLabel={t('common.actions')}
                items={[
                  ...(can('download-reports')
                    ? [
                        {
                          key: 'download',
                          label: t('common.download'),
                          onClick: () => downloadFile(`/admin/reports/${r.id}/download`, r.file.name),
                        },
                      ]
                    : []),
                ]}
              />
            ),
          },
        ]}
        rows={data.data}
        rowKey={(r) => r.id}
      />
      <Pagination meta={data.meta} onPage={setPage} className="mt-4" />
    </>
  );
}

// ---------- subscriptions (ADM-CL-08) ----------
function ClientSubscriptionsTab({ clientId }: { clientId: number }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin', 'clients', clientId, 'subscriptions', { page }],
    queryFn: () =>
      api.get(`/admin/clients/${clientId}/subscriptions`, { params: { page } }).then((r) => r.data as Paginated<Subscription>),
  });
  const data = query.data;

  if (query.isLoading) return <TableSkeleton rows={3} />;
  if (query.isError || !data) return <ErrorState onRetry={() => query.refetch()} />;
  if (data.data.length === 0) return <EmptyState title={t('myPackages.empty')} />;

  return (
    <>
      <Table
        columns={[
          { key: 'package', header: t('bookings.package'), render: (s) => <strong>{s.package.name}</strong> },
          {
            key: 'status',
            header: t('common.status'),
            render: (s) => <StatusBadge kind="subscription" value={s.status} label={s.status_label ?? t(`subscriptionStatus.${s.status}`)} />,
          },
          {
            key: 'period',
            header: t('myPackages.period'),
            render: (s) => `${dayjs(s.starts_at).format('YYYY-MM-DD')} ← ${dayjs(s.ends_at).format('YYYY-MM-DD')}`,
          },
          {
            key: 'usage',
            header: t('myPackages.usage'),
            render: (s) =>
              s.is_unlimited || s.consultations_limit === null
                ? t('dashboard.unlimited')
                : `${s.consultations_used} / ${s.consultations_limit}`,
          },
          { key: 'price', header: t('wizard.total'), render: (s) => <PriceTag formatted={s.price_paid_formatted} /> },
        ]}
        rows={data.data}
        rowKey={(s) => s.id}
      />
      <Pagination meta={data.meta} onPage={setPage} className="mt-4" />
    </>
  );
}
