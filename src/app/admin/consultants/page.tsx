'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { appendFormData } from '@/lib/form-data';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePublicMeta } from '@/lib/meta';
import { consultantSchema, type ConsultantValues } from '@/schemas/admin';
import {
  AvailabilityEditor,
  daysFromApi,
  toAvailabilityPayload,
  validateAvailability,
  type EditorDay,
} from '@/components/admin/AvailabilityEditor';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { FilterPanel } from '@/components/admin/FilterPanel';
import {
  Avatar,
  ActionsMenu,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FileDrop,
  Input,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Switch,
  Table,
  TableSkeleton,
  Textarea,
  useToast,
} from '@/components/ui';
import { AVATAR_ACCEPT, AVATAR_MAX_MB } from '@/lib/files';
import { ChartCard, RankingList } from '@/components/admin/charts';
import { KpiCard } from '@/components/admin/KpiCard';
import { FAMILY } from '@/components/admin/registry';
import type { AdminConsultantsStats, Consultant, Paginated } from '@/types/api';

// §13.4 — consultants (CON-01..07)
export default function ConsultantsPage() {
  return (
    <RequirePermission perm="view-consultants">
      <ConsultantsInner />
    </RequirePermission>
  );
}

function ConsultantsInner() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const meta = usePublicMeta();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Consultant | null>(null);
  const [toggling, setToggling] = useState<Consultant | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'consultants', { search, activeFilter, specialization, page }],
    queryFn: () =>
      api
        .get('/admin/consultants', {
          params: {
            search: search || undefined,
            is_active: activeFilter || undefined,
            specialization: specialization || undefined,
            page,
          },
        })
        .then((r) => r.data as Paginated<Consultant>),
  });
  const data = query.data;

  const statsQuery = useQuery({
    queryKey: ['admin', 'consultants', 'stats'],
    queryFn: () => api.get('/admin/consultants/stats').then((r) => r.data.data as AdminConsultantsStats),
    enabled: can('view-consultants'),
    staleTime: 60_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'consultants'] });

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.patch(`/admin/consultants/${id}/status`, { is_active }),
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
    mutationFn: (id: number) => api.delete(`/admin/consultants/${id}`),
    onSuccess: () => {
      toast.success(t('consultants.deleted'));
      setDeleting(null);
      invalidate();
    },
    onError: (e) => {
      // 409 CONSULTANT_HAS_FUTURE_BOOKINGS → cancel his future bookings first
      if (isApiError(e)) toast.error(e.message);
      setDeleting(null);
    },
  });

  const dayName = (dow: number) => {
    const d = meta.data?.days_of_week.find((x) => x.value === dow);
    return d ? d.name : String(dow); // meta names arrive localized
  };

  return (
    <>
      <PageHeader
        title={t('nav.consultants')}
        actions={
          can('create-consultants') ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              + {t('consultants.add')}
            </Button>
          ) : undefined
        }
      />

      {can('view-consultants') && statsQuery.data && (
        <>
          <div className="stat-grid">
            <KpiCard
              family="pine"
              label={t('nav.consultants')}
              hint={t('admin.hintConsultants')}
              value={statsQuery.data.total}
              context={`${t('admin.statsActive')}: ${statsQuery.data.active}`}
            />
            <KpiCard
              family="gold"
              label={t('admin.statsPendingReports')}
              value={statsQuery.data.top_consultants.reduce((sum, c) => sum + c.pending_reports_count, 0)}
            />
            <KpiCard
              family="sage"
              label={t('consultants.specializationField')}
              value={statsQuery.data.by_specialization.length}
            />
          </div>

          <div className="chart-row">
            <ChartCard title={t('admin.consultantsBySpecialization')} accent="sage">
              <RankingList
                data={statsQuery.data.by_specialization.map((s) => ({
                  label: s.specialization,
                  value: s.count,
                  color: FAMILY.sage.light,
                }))}
                label={t('admin.consultantsBySpecialization')}
              />
            </ChartCard>
            <ChartCard title={t('admin.topConsultants')} accent="pine">
              <RankingList
                data={statsQuery.data.top_consultants
                  .filter((c) => c.bookings_count > 0)
                  .map((c) => ({
                    label: c.consultant_name,
                    value: c.bookings_count,
                    color: FAMILY.pine.light,
                  }))}
                limit={5}
                label={t('admin.topConsultants')}
              />
            </ChartCard>
          </div>
        </>
      )}

      <FilterPanel>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          className="flex-1 min-w-[200px]"
        />
        <Input
          value={specialization}
          onChange={(e) => {
            setSpecialization(e.target.value);
            setPage(1);
          }}
          placeholder={t('consultants.specializationFilter')}
          style={{ maxWidth: 200 }}
        />
        <Select
          options={[
            { value: '1', label: t('users.active') },
            { value: '0', label: t('users.inactive') },
          ]}
          placeholder={t('common.status')}
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 150 }}
        />
      </FilterPanel>

      {query.isLoading ? (
        <TableSkeleton rows={4} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('common.empty')} />
      ) : (
        <>
          <Table
            columns={[
              {
                key: 'consultant',
                header: t('bookings.consultant'),
                render: (c) => (
                  <span className="flex items-center gap-3">
                    <Avatar src={c.avatar_thumb_url} name={c.name} size="sm" />
                    <span>
                      <strong className="block">{c.name}</strong>
                      {c.title && <span className="text-muted text-[0.8rem]">{c.title}</span>}
                    </span>
                  </span>
                ),
              },
              { key: 'spec', header: t('consultants.specializationField'), render: (c) => c.specialization ?? '—' },
              {
                key: 'days',
                header: t('consultants.workingDays'),
                render: (c) => (
                  <span className="flex gap-1 flex-wrap">
                    {(c.working_days ?? []).map((d) => (
                      <span key={d} className="ui-badge" data-color="green">
                        {dayName(d)}
                      </span>
                    ))}
                  </span>
                ),
              },
              {
                key: 'stats',
                header: t('consultants.stats'),
                render: (c) =>
                  c.stats ? (
                    <span className="text-muted text-[0.82rem]">
                      {t('admin.statsPending')}: {c.stats.pending_bookings} · {t('nav.reports')}: {c.stats.reports}
                    </span>
                  ) : (
                    '—'
                  ),
              },
              {
                key: 'active',
                header: t('common.status'),
                render: (c) => (
                  <Switch
                    checked={c.is_active}
                    disabled={!can('update-consultants')}
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
                  <ActionsMenu
                    ariaLabel={t('common.actions')}
                    items={[
                      {
                        key: 'view',
                        label: t('common.view'),
                        onClick: () => router.push(`/admin/consultants/${c.id}`),
                      },
                      ...(can('delete-consultants')
                        ? [
                            {
                              key: 'delete',
                              label: t('common.delete'),
                              danger: true,
                              onClick: () => setDeleting(c),
                            },
                          ]
                        : []),
                    ]}
                  />
                ),
              },
            ]}
            rows={data.data}
            rowKey={(c) => c.id}
            onRowClick={(c) => router.push(`/admin/consultants/${c.id}`)}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}

      {creating && (
        <ConsultantCreateModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            invalidate();
          }}
        />
      )}

      <ConfirmDialog
        open={!!toggling}
        onClose={() => setToggling(null)}
        onConfirm={() => toggling && statusMutation.mutate({ id: toggling.id, is_active: false })}
        title={t('users.deactivate')}
        body={t('users.deactivateConfirm')}
        danger
        loading={statusMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title={t('common.delete')}
        body={t('consultants.deleteConfirm')}
        danger
        loading={deleteMutation.isPending}
      />
    </>
  );
}

// ---------- create modal (CON-02): always FormData because of the photo ----------
function ConsultantCreateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [photo, setPhoto] = useState<File | null>(null);
  const [days, setDays] = useState<EditorDay[]>(daysFromApi([]));
  const [availErrors, setAvailErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ConsultantValues>({
    resolver: zodResolver(consultantSchema),
    defaultValues: { is_active: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    const vErrors = validateAvailability(days);
    setAvailErrors(vErrors);
    if (Object.keys(vErrors).length > 0) return;

    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (k === 'password' && !v) return; // empty → set-password email
        appendFormData(fd, v, k);
      });
      // backend requires confirmation whenever a password is sent
      if (values.password) appendFormData(fd, values.password, 'password_confirmation');
      if (photo) appendFormData(fd, photo, 'photo');
      // optional availability — serialized as bracket-notation fields (§14.3)
      const payload = toAvailabilityPayload(days);
      if (payload.days.length > 0) appendFormData(fd, payload.days, 'availability[days]');

      await api.post('/admin/consultants', fd);
      toast.success(t('consultants.created'));
      onSaved();
    } catch (e) {
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message);
    }
  });

  const err = (key?: string) => (key ? t(key) : undefined);

  return (
    <Modal
      open
      onClose={onClose}
      title={t('consultants.add')}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} loading={isSubmitting}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid sm:grid-cols-2 gap-4">
        <Input label={t('auth.name')} required error={err(errors.name?.message)} {...register('name')} />
        <Input label={t('auth.email')} type="email" dir="ltr" required error={err(errors.email?.message)} {...register('email')} />
        <Input label={t('auth.phone')} dir="ltr" error={err(errors.phone?.message)} {...register('phone')} />
        <Input
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          hint={t('users.passwordHint')}
          error={err(errors.password?.message)}
          {...register('password')}
        />
        <Input label={t('consultants.titleField')} error={err(errors.title?.message)} {...register('title')} />
        <Input
          label={t('consultants.specializationField')}
          error={err(errors.specialization?.message)}
          {...register('specialization')}
        />
        <Textarea
          label={t('consultants.bio')}
          className="sm:col-span-2"
          rows={3}
          error={err(errors.bio?.message)}
          {...register('bio')}
        />
        <div className="sm:col-span-2">
          <span className="text-[0.82rem] text-muted block mb-2">{t('consultants.photo')}</span>
          <FileDrop accept={AVATAR_ACCEPT} maxMb={AVATAR_MAX_MB} onFile={setPhoto} label={photo?.name} />
        </div>
        <div className="sm:col-span-2">
          <Switch label={t('users.active')} {...register('is_active')} />
        </div>
        <div className="sm:col-span-2">
          <span className="text-[0.82rem] text-muted block mb-2">{t('availability.title')}</span>
          <AvailabilityEditor value={days} onChange={setDays} errors={availErrors} />
        </div>
      </form>
    </Modal>
  );
}
