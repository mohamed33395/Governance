'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { appendFormData } from '@/lib/form-data';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { teamMemberSchema, type TeamMemberValues } from '@/schemas/team';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { FilterPanel } from '@/components/admin/FilterPanel';
import {
  ActionsMenu,
  Avatar,
  Badge,
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
  useToast,
} from '@/components/ui';
import { AVATAR_ACCEPT, AVATAR_MAX_MB } from '@/lib/files';
import type { Paginated, TeamMember } from '@/types/api';

export default function AdminTeamPage() {
  return (
    <RequirePermission perm="view-team">
      <TeamInner />
    </RequirePermission>
  );
}

function TeamInner() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<TeamMember | 'new' | null>(null);
  const [deleting, setDeleting] = useState<TeamMember | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'team-members', { search, status, page }],
    queryFn: () =>
      api
        .get('/admin/team-members', {
          params: { search: search || undefined, status: status || undefined, page },
        })
        .then((r) => r.data as Paginated<TeamMember>),
  });
  const data = query.data;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'team-members'] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/team-members/${id}`),
    onSuccess: () => {
      toast.success(t('team.deleted'));
      setDeleting(null);
      invalidate();
    },
    onError: (e) => {
      if (isApiError(e)) toast.error(e.message);
      setDeleting(null);
    },
  });

  return (
    <>
      <PageHeader
        title={t('nav.team')}
        subtitle={data ? t('team.total').replace('{count}', String(data.meta.total)) : undefined}
        actions={
          can('create-team') ? (
            <Button size="sm" onClick={() => setEditing('new')}>
              + {t('team.add')}
            </Button>
          ) : undefined
        }
      />

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
          options={[
            { value: 'active', label: t('team.statuses.active') },
            { value: 'inactive', label: t('team.statuses.inactive') },
          ]}
          placeholder={t('team.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 160 }}
        />
      </FilterPanel>

      {query.isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('team.noMembers')} />
      ) : (
        <>
          <Table
            columns={[
              {
                key: 'name',
                header: t('team.name'),
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <Avatar src={row.avatar_thumb_url ?? row.avatar_url} name={row.name} size="sm" />
                    <span className="font-semibold">{row.name}</span>
                  </div>
                ),
              },
              { key: 'job_title', header: t('team.jobTitle'), render: (row) => row.job_title },
              {
                key: 'experience_years',
                header: t('team.experienceYears'),
                render: (row) => `+${row.experience_years}`,
              },
              {
                key: 'sort_order',
                header: t('team.sortOrder'),
                render: (row) => row.sort_order,
              },
              {
                key: 'status',
                header: t('team.status'),
                render: (row) =>
                  row.is_active ? (
                    <Badge color="green">{t('team.statuses.active')}</Badge>
                  ) : (
                    <Badge color="gray">{t('team.statuses.inactive')}</Badge>
                  ),
              },
              {
                key: 'actions',
                header: '',
                render: (row) => (
                  <ActionsMenu
                    ariaLabel={t('common.actions')}
                    items={[
                      ...(can('update-team')
                        ? [{ key: 'edit', label: t('common.edit'), onClick: () => setEditing(row) }]
                        : []),
                      ...(can('delete-team')
                        ? [
                            {
                              key: 'delete',
                              label: t('common.delete'),
                              danger: true,
                              onClick: () => setDeleting(row),
                            },
                          ]
                        : []),
                    ]}
                  />
                ),
              },
            ]}
            rows={data.data}
            rowKey={(row) => row.id}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}

      {editing && (
        <MemberFormModal
          member={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title={t('common.delete')}
        body={t('team.deleteConfirm')}
        danger
        loading={deleteMutation.isPending}
      />
    </>
  );
}

// ---------- create/edit modal ----------
function MemberFormModal({
  member,
  onClose,
  onSaved,
}: {
  member: TeamMember | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const isEdit = !!member;
  const [avatar, setAvatar] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TeamMemberValues>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: member
      ? {
          name: member.name,
          job_title: member.job_title,
          experience_years: member.experience_years,
          sort_order: member.sort_order,
          is_active: member.is_active,
        }
      : { is_active: true, sort_order: 0 },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = teamMemberSchema.parse(values);
      if (avatar) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => appendFormData(fd, v, k));
        appendFormData(fd, avatar, 'avatar');
        await api.post(isEdit ? `/admin/team-members/${member.id}` : '/admin/team-members', fd);
      } else if (isEdit) {
        await api.put(`/admin/team-members/${member.id}`, payload);
      } else {
        await api.post('/admin/team-members', payload);
      }
      toast.success(t(isEdit ? 'team.updated' : 'team.created'));
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
      title={isEdit ? t('team.edit') : t('team.add')}
      size="lg"
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
        <Input label={t('team.name')} required error={err(errors.name?.message)} {...register('name')} />
        <Input
          label={t('team.jobTitle')}
          required
          error={err(errors.job_title?.message)}
          {...register('job_title')}
        />
        <Input
          label={t('team.experienceYears')}
          type="number"
          inputMode="numeric"
          min={0}
          max={60}
          required
          dir="ltr"
          error={err(errors.experience_years?.message)}
          {...register('experience_years')}
        />
        <Input
          label={t('team.sortOrder')}
          type="number"
          inputMode="numeric"
          min={0}
          dir="ltr"
          error={err(errors.sort_order?.message)}
          {...register('sort_order')}
        />

        <div className="sm:col-span-2">
          <span className="text-[0.82rem] text-muted block mb-2">{t('profile.avatar')}</span>
          <FileDrop
            accept={AVATAR_ACCEPT}
            maxMb={AVATAR_MAX_MB}
            onFile={setAvatar}
            label={avatar ? avatar.name : isEdit ? member.avatar_url ?? undefined : undefined}
          />
          <p className="text-[0.76rem] text-muted mt-1.5">{t('team.avatarHint')}</p>
        </div>

        <div className="sm:col-span-2">
          <Switch label={t('team.active')} {...register('is_active')} />
        </div>
      </form>
    </Modal>
  );
}
