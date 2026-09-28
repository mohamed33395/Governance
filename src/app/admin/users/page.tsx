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
import { userSchema, userRolesSchema, type UserValues, type UserRolesValues } from '@/schemas/admin';
import {
  ActionsMenu,
  Avatar,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
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
import { RequirePermission } from '@/components/admin/RequirePermission';
import { AVATAR_ACCEPT, AVATAR_MAX_MB } from '@/lib/files';
import type { Paginated, Role, User } from '@/types/api';

// §13.3 — users (USR-01..08)
export default function UsersPage() {
  return (
    <RequirePermission perm="view-users">
      <UsersInner />
    </RequirePermission>
  );
}

function UsersInner() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [rolesOf, setRolesOf] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [toggling, setToggling] = useState<User | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'users', { search, type, roleFilter, activeFilter, page }],
    queryFn: () =>
      api
        .get('/admin/users', {
          params: {
            search: search || undefined,
            type: type || undefined,
            role: roleFilter || undefined,
            is_active: activeFilter || undefined,
            sort: '-created_at',
            page,
          },
        })
        .then((r) => r.data as Paginated<User>),
  });
  const data = query.data;

  // role filter options
  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles', 'all'],
    queryFn: () => api.get('/admin/roles', { params: { per_page: 100 } }).then((r) => (r.data as Paginated<Role>).data),
    staleTime: 60_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.patch(`/admin/users/${id}/status`, { is_active }),
    onSuccess: () => {
      setToggling(null);
      invalidate();
      toast.success(t('profile.saved'));
    },
    onError: (e) => {
      // CANNOT_DELETE_SELF / LAST_ADMIN
      if (isApiError(e)) toast.error(e.message);
      setToggling(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      toast.success(t('users.deleted'));
      setDeleting(null);
      invalidate();
    },
    onError: (e) => {
      // CANNOT_DELETE_SELF / LAST_ADMIN / CONSULTANT_HAS_FUTURE_BOOKINGS (409)
      if (isApiError(e)) toast.error(e.message);
      setDeleting(null);
    },
  });

  return (
    <>
      <PageHeader
        title={t('users.title')}
        actions={
          can('create-users') ? (
            <Button size="sm" onClick={() => setEditing('new')}>
              + {t('users.add')}
            </Button>
          ) : undefined
        }
      />

      <div className="flex gap-3 flex-wrap mb-6">
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
            { value: 'admin', label: t('users.typeAdmin') },
            { value: 'consultant', label: t('users.typeConsultant') },
          ]}
          placeholder={t('users.typeAll')}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 170 }}
        />
        <Select
          options={(rolesQuery.data ?? []).map((r) => ({ value: r.name, label: r.name }))}
          placeholder={t('users.roleAll')}
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 170 }}
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
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={5} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <>
          <Table
            columns={[
              {
                key: 'user',
                header: t('auth.name'),
                render: (u) => (
                  <span className="flex items-center gap-3">
                    <Avatar src={u.avatar_thumb_url} name={u.name} size="sm" />
                    <span>
                      <strong className="block">{u.name}</strong>
                      <span className="text-muted text-[0.8rem]" dir="ltr">
                        {u.email}
                      </span>
                    </span>
                  </span>
                ),
              },
              { key: 'phone', header: t('auth.phone'), render: (u) => (u.phone ? <span dir="ltr">{u.phone}</span> : '—') },
              {
                key: 'type',
                header: t('users.type'),
                render: (u) => (
                  <Badge color={u.type === 'consultant' ? 'blue' : 'purple'}>
                    {u.type === 'consultant' ? t('users.typeConsultant') : t('users.typeAdmin')}
                  </Badge>
                ),
              },
              {
                key: 'roles',
                header: t('users.roles'),
                render: (u) => (
                  <span className="flex gap-1.5 flex-wrap">
                    {u.roles.map((r) => (
                      <Badge key={r} color="gray" dot={false}>
                        {r}
                      </Badge>
                    ))}
                    {can('assign-roles') && (
                      <Button variant="ghost" size="sm" onClick={() => setRolesOf(u)}>
                        {t('common.edit')}
                      </Button>
                    )}
                  </span>
                ),
              },
              {
                key: 'active',
                header: t('common.status'),
                render: (u) => (
                  <Switch
                    checked={u.is_active}
                    disabled={!can('update-users')}
                    onChange={() => (u.is_active ? setToggling(u) : statusMutation.mutate({ id: u.id, is_active: true }))}
                    aria-label={t('common.status')}
                  />
                ),
              },
              {
                key: 'last_login',
                header: t('users.lastLogin'),
                render: (u) => (u.last_login_at ? u.last_login_at.slice(0, 16).replace('T', ' ') : '—'),
              },
              {
                key: 'actions',
                header: t('common.actions'),
                render: (u) => (
                  <ActionsMenu
                    ariaLabel={t('common.actions')}
                    items={[
                      ...(can('update-users')
                        ? [{ key: 'edit', label: t('common.edit'), onClick: () => setEditing(u) }]
                        : []),
                      ...(can('delete-users')
                        ? [
                            {
                              key: 'delete',
                              label: t('common.delete'),
                              danger: true,
                              onClick: () => setDeleting(u),
                            },
                          ]
                        : []),
                    ]}
                  />
                ),
              },
            ]}
            rows={data.data}
            rowKey={(u) => u.id}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}

      {editing && (
        <UserFormModal
          user={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate();
          }}
        />
      )}

      {rolesOf && (
        <UserRolesModal
          user={rolesOf}
          roles={rolesQuery.data ?? []}
          onClose={() => setRolesOf(null)}
          onSaved={() => {
            setRolesOf(null);
            invalidate();
          }}
        />
      )}

      {/* deactivating revokes the user's sessions — confirm */}
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
        body={t('users.deleteConfirm')}
        danger
        loading={deleteMutation.isPending}
      />
    </>
  );
}

// ---------- create/edit modal ----------
function UserFormModal({ user, onClose, onSaved }: { user: User | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const isEdit = !!user;
  const [avatar, setAvatar] = useState<File | null>(null);

  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles', 'all'],
    queryFn: () => api.get('/admin/roles', { params: { per_page: 100 } }).then((r) => (r.data as Paginated<Role>).data),
    staleTime: 60_000,
  });

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: user
      ? {
          name: user.name,
          email: user.email,
          phone: user.phone ?? '',
          type: user.type,
          roles: user.roles,
          is_active: user.is_active,
          title: user.title ?? '',
          specialization: user.specialization ?? '',
          bio: user.bio ?? '',
        }
      : { type: 'admin', is_active: true, roles: [] },
  });

  const watchType = watch('type');
  const watchRoles = watch('roles') ?? [];

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload: Record<string, unknown> = { ...values };
      // empty password → the user gets a set-password email
      if (!payload.password) {
        delete payload.password;
        delete payload.password_confirmation;
      }
      if (isEdit) {
        // edit: no roles here (they have their own modal)
        delete payload.roles;
        await api.put(`/admin/users/${user.id}`, payload);
        if (avatar) {
          const fd = new FormData();
          appendFormData(fd, avatar, 'avatar');
          await api.post(`/admin/users/${user.id}/avatar`, fd);
        }
        toast.success(t('users.updated'));
      } else if (avatar) {
        // create with avatar → FormData
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => appendFormData(fd, v, k));
        appendFormData(fd, avatar, 'avatar');
        await api.post('/admin/users', fd);
        toast.success(t('users.created'));
      } else {
        await api.post('/admin/users', payload);
        toast.success(t('users.created'));
      }
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
      title={isEdit ? t('users.edit') : t('users.add')}
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
        <Input label={t('auth.name')} required error={err(errors.name?.message)} {...register('name')} />
        <Input label={t('auth.email')} type="email" dir="ltr" required error={err(errors.email?.message)} {...register('email')} />
        <Input label={t('auth.phone')} dir="ltr" error={err(errors.phone?.message)} {...register('phone')} />
        <Select
          label={t('users.type')}
          options={[
            { value: 'admin', label: t('users.typeAdmin') },
            { value: 'consultant', label: t('users.typeConsultant') },
          ]}
          value={watchType}
          onChange={(e) => setValue('type', e.target.value as 'admin' | 'consultant')}
        />
        <Input
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          hint={t('users.passwordHint')}
          error={err(errors.password?.message)}
          {...register('password')}
        />
        <Input
          label={t('auth.passwordConfirmation')}
          type="password"
          autoComplete="new-password"
          error={err(errors.password_confirmation?.message)}
          {...register('password_confirmation')}
        />

        {/* roles — create only; edit uses the dedicated roles modal */}
        {!isEdit && (
          <div className="sm:col-span-2">
            <span className="text-[0.82rem] text-muted block mb-2">
              {t('users.roles')} <span className="text-danger">*</span>
            </span>
            <div className="flex gap-4 flex-wrap rounded-xl border border-border p-3.5" data-invalid={!!errors.roles}>
              {(rolesQuery.data ?? []).map((r) => (
                <Checkbox
                  key={r.name}
                  label={r.name}
                  checked={watchRoles.includes(r.name)}
                  onChange={(e) => {
                    const next = e.target.checked ? [...watchRoles, r.name] : watchRoles.filter((x) => x !== r.name);
                    setValue('roles', next, { shouldValidate: true });
                  }}
                />
              ))}
            </div>
            {errors.roles?.message && <p className="text-[0.78rem] text-danger mt-1.5">{t(errors.roles.message)}</p>}
          </div>
        )}

        {/* consultant fields */}
        {watchType === 'consultant' && (
          <>
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
          </>
        )}

        <div className="sm:col-span-2">
          <span className="text-[0.82rem] text-muted block mb-2">{t('profile.avatar')}</span>
          <FileDrop
            accept={AVATAR_ACCEPT}
            maxMb={AVATAR_MAX_MB}
            onFile={setAvatar}
            label={avatar ? avatar.name : undefined}
          />
        </div>

        <div className="sm:col-span-2">
          <Switch label={t('users.active')} {...register('is_active')} />
        </div>
      </form>
    </Modal>
  );
}

// ---------- roles modal (assign-roles) ----------
function UserRolesModal({
  user,
  roles,
  onClose,
  onSaved,
}: {
  user: User;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>(user.roles);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const parsed = userRolesSchema.safeParse({ roles: selected });
    if (!parsed.success) {
      toast.error(t('required'));
      return;
    }
    setBusy(true);
    try {
      await api.put(`/admin/users/${user.id}/roles`, { roles: selected });
      toast.success(t('profile.saved'));
      onSaved();
    } catch (e) {
      if (isApiError(e)) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${user.name} — ${t('users.roles')}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button onClick={save} loading={busy} disabled={selected.length === 0}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {roles.map((r) => (
          <Checkbox
            key={r.name}
            label={`${r.name} (${r.users_count})`}
            checked={selected.includes(r.name)}
            onChange={(e) =>
              setSelected(e.target.checked ? [...selected, r.name] : selected.filter((x) => x !== r.name))
            }
          />
        ))}
      </div>
    </Modal>
  );
}
