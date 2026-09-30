'use client';

import { useBreadcrumbLabel } from '@/components/admin/Breadcrumbs';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { downloadFile, uploadFile, AVATAR_ACCEPT, AVATAR_MAX_MB } from '@/lib/files';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { consultantSchema, type ConsultantValues } from '@/schemas/admin';
import { AvailabilityTab } from '@/components/admin/AvailabilityTab';
import { TimeOffsTab } from '@/components/admin/TimeOffsTab';
import { SlotPreviewTab } from '@/components/admin/SlotPreviewTab';
import { ReportUploadModal } from '@/components/admin/ReportUploadModal';
import { RequirePermission } from '@/components/admin/RequirePermission';
import {
  ActionsMenu,
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  FileDrop,
  Input,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatusBadge,
  Switch,
  Table,
  TableSkeleton,
  Tabs,
  Textarea,
  useToast,
} from '@/components/ui';
import type { Booking, Client, Consultant, Paginated, Report } from '@/types/api';

type ConsultantStats = {
  pending_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  pending_reports: number;
  reports: number;
  clients: number;
  upcoming_bookings: Booking[];
};

// §13.5 — consultant details with tabs
export default function ConsultantDetailsPage() {
  return (
    <RequirePermission perm="view-consultants">
      <DetailsInner />
    </RequirePermission>
  );
}

function DetailsInner() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const { can } = usePermissions();
  const [tab, setTab] = useState('profile');
  const basePath = `/admin/consultants/${params.id}`;

  const consultantQuery = useQuery({
    queryKey: ['admin', 'consultants', params.id],
    queryFn: () => api.get(basePath).then((r) => r.data.data as Consultant),
  });
  const statsQuery = useQuery({
    queryKey: ['admin', 'consultants', params.id, 'stats'],
    queryFn: () => api.get(`${basePath}/stats`).then((r) => r.data.data as ConsultantStats),
  });

  const consultant = consultantQuery.data;
  useBreadcrumbLabel(consultant?.name);
  const stats = statsQuery.data;

  if (consultantQuery.isLoading) {
    return (
      <div className="page-loader">
        <span className="spinner" />
      </div>
    );
  }
  if (consultantQuery.isError || !consultant) return <ErrorState onRetry={() => consultantQuery.refetch()} />;

  const tabs = [
    { key: 'profile', label: t('consultants.tabProfile') },
    ...(can('view-availability')
      ? [
          { key: 'availability', label: t('consultants.tabAvailability') },
          { key: 'timeoffs', label: t('consultants.tabTimeOffs') },
        ]
      : []),
    ...(can('view-clients') ? [{ key: 'clients', label: t('consultants.tabClients') }] : []),
    ...(can('view-bookings') ? [{ key: 'bookings', label: t('consultants.tabBookings') }] : []),
    ...(can('view-reports')
      ? [
          { key: 'pending', label: t('consultants.tabPendingReports'), count: stats?.pending_reports },
          { key: 'reports', label: t('consultants.tabReports') },
        ]
      : []),
    ...(can('view-availability') ? [{ key: 'slots', label: t('consultants.tabSlots') }] : []),
  ];

  const statItems: [string, number | undefined][] = [
    ['admin.statsPending', stats?.pending_bookings],
    ['dashboard.completed', stats?.completed_bookings],
    ['dashboard.cancelled', stats?.cancelled_bookings],
    ['admin.statsPendingReports', stats?.pending_reports],
    ['nav.reports', stats?.reports],
    ['nav.clients', stats?.clients],
  ];

  return (
    <>
      {/* header */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6" style={{ boxShadow: 'var(--shadow)' }}>
        <div className="flex items-center gap-5 flex-wrap">
          <Avatar src={consultant.avatar_url} name={consultant.name} size="xl" />
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl">{consultant.name}</h1>
              <Badge color={consultant.is_active ? 'green' : 'red'}>
                {consultant.is_active ? t('users.active') : t('users.inactive')}
              </Badge>
            </div>
            <p className="text-muted mt-1">
              {[consultant.title, consultant.specialization].filter(Boolean).join(' · ')}
            </p>
            <p className="text-muted text-[0.85rem] mt-0.5" dir="ltr">
              {consultant.email}
            </p>
          </div>
        </div>
        {stats && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-6 pt-5 border-t border-border">
            {statItems.map(([labelKey, value]) => (
              <div key={labelKey} className="text-center">
                <span className="block font-serif text-xl" style={{ color: 'var(--primary)' }}>
                  {value ?? '—'}
                </span>
                <span className="text-muted text-[0.75rem]">{t(labelKey)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'profile' && <ProfileTab consultant={consultant} />}
      {tab === 'availability' && <AvailabilityTab basePath={basePath} />}
      {tab === 'timeoffs' && <TimeOffsTab basePath={basePath} />}
      {tab === 'clients' && <ClientsTab basePath={basePath} />}
      {tab === 'bookings' && <BookingsTab basePath={basePath} />}
      {tab === 'pending' && <PendingReportsTab basePath={basePath} />}
      {tab === 'reports' && <ReportsTab basePath={basePath} />}
      {tab === 'slots' && <SlotPreviewTab basePath={basePath} />}
    </>
  );
}

// ---------- tab 1: profile + edit + photo ----------
function ProfileTab({ consultant }: { consultant: Consultant }) {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [photo, setPhoto] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ConsultantValues>({
    resolver: zodResolver(consultantSchema),
    defaultValues: {
      name: consultant.name,
      email: consultant.email,
      phone: consultant.phone ?? '',
      title: consultant.title ?? '',
      specialization: consultant.specialization ?? '',
      bio: consultant.bio ?? '',
      is_active: consultant.is_active,
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'consultants'] });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { password, ...rest } = values;
      await api.put(`/admin/consultants/${consultant.id}`, rest); // JSON; no password on edit
      toast.success(t('profile.saved'));
      invalidate();
    } catch (e) {
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message);
    }
  });

  const uploadPhoto = async () => {
    if (!photo) return;
    try {
      await uploadFile(`/admin/consultants/${consultant.id}/photo`, 'photo', photo);
      toast.success(t('profile.avatarUpdated'));
      setPhoto(null);
      invalidate();
    } catch (e) {
      if (isApiError(e)) toast.error(e.message);
    }
  };

  const err = (key?: string) => (key ? t(key) : undefined);

  if (!can('update-consultants')) {
    // read-only profile
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 grid sm:grid-cols-2 gap-4">
        {[
          [t('auth.name'), consultant.name],
          [t('auth.email'), consultant.email],
          [t('auth.phone'), consultant.phone ?? '—'],
          [t('consultants.titleField'), consultant.title ?? '—'],
          [t('consultants.specializationField'), consultant.specialization ?? '—'],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="text-muted text-[0.82rem] block">{label}</span>
            <strong className="text-[0.95rem]">{value}</strong>
          </div>
        ))}
        {consultant.bio && (
          <div className="sm:col-span-2">
            <span className="text-muted text-[0.82rem] block">{t('consultants.bio')}</span>
            <p className="text-[0.92rem] leading-relaxed">{consultant.bio}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
      <form
        onSubmit={onSubmit}
        noValidate
        className="bg-surface border border-border rounded-2xl p-6 grid sm:grid-cols-2 gap-4"
      >
        <Input label={t('auth.name')} required error={err(errors.name?.message)} {...register('name')} />
        <Input label={t('auth.email')} type="email" dir="ltr" required error={err(errors.email?.message)} {...register('email')} />
        <Input label={t('auth.phone')} dir="ltr" error={err(errors.phone?.message)} {...register('phone')} />
        <Input label={t('consultants.titleField')} error={err(errors.title?.message)} {...register('title')} />
        <Input
          label={t('consultants.specializationField')}
          error={err(errors.specialization?.message)}
          {...register('specialization')}
        />
        <div className="flex items-end pb-1">
          <Switch label={t('users.active')} {...register('is_active')} />
        </div>
        <Textarea
          label={t('consultants.bio')}
          className="sm:col-span-2"
          rows={4}
          error={err(errors.bio?.message)}
          {...register('bio')}
        />
        <div className="sm:col-span-2">
          <Button type="submit" loading={isSubmitting}>
            {t('common.save')}
          </Button>
        </div>
      </form>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <h3 className="text-[0.95rem] mb-4 pb-3 border-b border-border">{t('consultants.photo')}</h3>
        <div className="flex flex-col items-center gap-4">
          <Avatar src={consultant.avatar_url} name={consultant.name} size="xl" />
          <FileDrop accept={AVATAR_ACCEPT} maxMb={AVATAR_MAX_MB} onFile={setPhoto} label={photo?.name} />
          <Button size="sm" variant="outline" onClick={uploadPhoto} disabled={!photo}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- tab 4: clients who booked him (CON-14) ----------
function ClientsTab({ basePath }: { basePath: string }) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin', 'consultant-clients', basePath, { search, page }],
    queryFn: () =>
      api
        .get(`${basePath}/clients`, { params: { search: search || undefined, page } })
        .then((r) => r.data as Paginated<Client & { bookings_count: number; last_booking_at: string | null }>),
  });
  const data = query.data;

  return (
    <div>
      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        className="mb-5 max-w-sm"
      />
      {query.isLoading ? (
        <TableSkeleton rows={3} />
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
                header: t('nav.clients'),
                render: (c) => (
                  <span className="flex items-center gap-3">
                    <Avatar src={c.avatar_url} name={c.name} size="sm" />
                    <span>
                      <strong className="block">{c.name}</strong>
                      <span className="text-muted text-[0.8rem]">{c.company_name}</span>
                    </span>
                  </span>
                ),
              },
              { key: 'count', header: t('consultants.bookingsCount'), render: (c) => c.bookings_count },
              {
                key: 'last',
                header: t('consultants.lastBooking'),
                render: (c) => (c.last_booking_at ? c.last_booking_at.slice(0, 10) : '—'),
              },
            ]}
            rows={data.data}
            rowKey={(c) => c.id}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-4" />
        </>
      )}
    </div>
  );
}

// ---------- tab 5: his bookings (CON-15) ----------
function BookingsTab({ basePath }: { basePath: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin', 'consultant-bookings', basePath, { status, search, page }],
    queryFn: () =>
      api
        .get(`${basePath}/bookings`, { params: { status: status || undefined, search: search || undefined, page } })
        .then((r) => r.data as Paginated<Booking>),
  });
  const data = query.data;

  return (
    <div>
      <div className="flex gap-3 flex-wrap mb-5">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          className="flex-1 min-w-[200px]"
        />
        <Select
          options={[
            { value: 'pending_payment', label: t('bookingStatus.pending_payment') },
            { value: 'pending', label: t('bookingStatus.pending') },
            { value: 'completed', label: t('bookingStatus.completed') },
            { value: 'cancelled', label: t('bookingStatus.cancelled') },
          ]}
          placeholder={t('common.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 180 }}
        />
      </div>
      {query.isLoading ? (
        <TableSkeleton rows={4} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('bookings.empty')} />
      ) : (
        <>
          <Table
            columns={[
              { key: 'ref', header: t('admin.reference'), render: (b) => <span dir="ltr">{b.reference}</span> },
              { key: 'client', header: t('nav.clients'), render: (b) => b.client?.company_name ?? '—' },
              {
                key: 'datetime',
                header: `${t('common.date')} / ${t('common.time')}`,
                render: (b) => (
                  <span>
                    {b.date} · <bdi dir="ltr">{b.time}</bdi>
                  </span>
                ),
              },
              {
                key: 'status',
                header: t('common.status'),
                render: (b) => <StatusBadge kind="booking" value={b.status} label={b.status_label} />,
              },
              {
                key: 'report',
                header: t('bookings.report'),
                render: (b) => (
                  <StatusBadge kind="report" value={b.report_status} label={t(`reportStatus.${b.report_status}`)} />
                ),
              },
            ]}
            rows={data.data}
            rowKey={(b) => b.id}
            onRowClick={(b) => router.push(`/admin/bookings/${b.id}`)}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-4" />
        </>
      )}
    </div>
  );
}

// ---------- tab 6: completed bookings awaiting a report (CON-16) ----------
function PendingReportsTab({ basePath }: { basePath: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [uploadFor, setUploadFor] = useState<Booking | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'consultant-pending-reports', basePath],
    queryFn: () => api.get(`${basePath}/pending-reports`).then((r) => r.data as Paginated<Booking>),
  });
  const data = query.data;

  return (
    <div>
      {query.isLoading ? (
        <TableSkeleton rows={3} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('reportsAdmin.noPending')} />
      ) : (
        <>
          <Table
            columns={[
              { key: 'ref', header: t('admin.reference'), render: (b) => <span dir="ltr">{b.reference}</span> },
              { key: 'client', header: t('nav.clients'), render: (b) => b.client?.company_name ?? '—' },
              {
                key: 'datetime',
                header: `${t('common.date')} / ${t('common.time')}`,
                render: (b) => (
                  <span>
                    {b.date} · <bdi dir="ltr">{b.time}</bdi>
                  </span>
                ),
              },
              {
                key: 'actions',
                header: t('common.actions'),
                render: (b) => (
                  <ActionsMenu
                    ariaLabel={t('common.actions')}
                    items={[
                      ...(can('upload-reports')
                        ? [
                            {
                              key: 'upload',
                              label: t('reportsAdmin.upload'),
                              onClick: () => setUploadFor(b),
                            },
                          ]
                        : []),
                    ]}
                  />
                ),
              },
            ]}
            rows={data.data}
            rowKey={(b) => b.id}
          />
          <Pagination meta={data.meta} onPage={() => {}} className="mt-4" />
        </>
      )}

      {uploadFor && (
        <ReportUploadModal
          bookingId={uploadFor.id}
          hasExistingReport={!!uploadFor.report}
          onClose={() => setUploadFor(null)}
          onSaved={() => {
            setUploadFor(null);
            queryClient.invalidateQueries({ queryKey: ['admin'] });
          }}
        />
      )}
    </div>
  );
}

// ---------- tab 7: his reports (CON-17) ----------
function ReportsTab({ basePath }: { basePath: string }) {
  const { t } = useI18n();
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin', 'consultant-reports', basePath, { search, page }],
    queryFn: () =>
      api
        .get(`${basePath}/reports`, { params: { search: search || undefined, page } })
        .then((r) => r.data as Paginated<Report>),
  });
  const data = query.data;

  return (
    <div>
      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        className="mb-5 max-w-sm"
      />
      {query.isLoading ? (
        <TableSkeleton rows={3} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('reports.empty')} />
      ) : (
        <>
          <Table
            columns={[
              { key: 'title', header: t('reports.details'), render: (r) => <strong>{r.title}</strong> },
              { key: 'client', header: t('nav.clients'), render: (r) => r.client.company_name },
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
      )}
    </div>
  );
}
