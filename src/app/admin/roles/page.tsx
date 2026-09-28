'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import {
  ActionsMenu,
  Avatar,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  Drawer,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Table,
  TableSkeleton,
  useToast,
} from '@/components/ui';
import { RequirePermission } from '@/components/admin/RequirePermission';
import type { Paginated, PermissionGroup, Role, User } from '@/types/api';

// §13.2 — roles & permissions (ACL-01..07)
export default function RolesPage() {
  return (
    <RequirePermission perm="view-roles">
      <RolesInner />
    </RequirePermission>
  );
}

function RolesInner() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Role | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [usersOf, setUsersOf] = useState<Role | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'roles', { search, page }],
    queryFn: () =>
      api
        .get('/admin/roles', { params: { search: search || undefined, page } })
        .then((r) => r.data as Paginated<Role>),
  });
  const data = query.data;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/roles/${id}`),
    onSuccess: () => {
      toast.success(t('roles.deleted'));
      setDeleting(null);
      invalidate();
    },
    onError: (e) => {
      // 409 ROLE_HAS_USERS
      if (isApiError(e)) toast.error(e.message);
      setDeleting(null);
    },
  });

  return (
    <>
      <PageHeader
        title={t('roles.title')}
        actions={
          can('create-roles') ? (
            <Button size="sm" onClick={() => setEditing('new')}>
              + {t('roles.add')}
            </Button>
          ) : undefined
        }
      />

      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        className="mb-6 max-w-sm"
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
              { key: 'name', header: t('roles.name'), render: (r) => <code dir="ltr">{r.name}</code> },
              { key: 'perms', header: t('roles.permissions'), render: (r) => r.permissions_count },
              {
                key: 'users',
                header: t('roles.users'),
                render: (r) => (
                  <Button variant="ghost" size="sm" onClick={() => setUsersOf(r)}>
                    {r.users_count}
                  </Button>
                ),
              },
              {
                key: 'protected',
                header: '',
                render: (r) => (r.is_protected ? <Badge color="purple">{t('roles.protected')}</Badge> : null),
              },
              { key: 'created', header: t('common.date'), render: (r) => r.created_at.slice(0, 10) },
              {
                key: 'actions',
                header: t('common.actions'),
                render: (r) => (
                  // the admin role is fully protected; consultant: name locked, permissions editable
                  <ActionsMenu
                    ariaLabel={t('common.actions')}
                    items={[
                      ...(can('update-roles') && r.name !== 'admin'
                        ? [{ key: 'edit', label: t('common.edit'), onClick: () => setEditing(r) }]
                        : []),
                      ...(can('delete-roles') && !r.is_protected
                        ? [
                            {
                              key: 'delete',
                              label: t('common.delete'),
                              danger: true,
                              onClick: () => setDeleting(r),
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
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}

      {editing && (
        <RoleFormModal
          role={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate();
          }}
        />
      )}

      {usersOf && <RoleUsersDrawer role={usersOf} onClose={() => setUsersOf(null)} />}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title={t('roles.delete')}
        body={t('roles.deleteConfirm')}
        danger
        loading={deleteMutation.isPending}
      />
    </>
  );
}

// ---------- create/edit modal with the permissions picker ----------
function RoleFormModal({ role, onClose, onSaved }: { role: Role | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const { can } = usePermissions();
  const isEdit = !!role;
  const nameLocked = isEdit && role.is_protected; // consultant: name locked; admin never reaches here

  const [name, setName] = useState(role?.name ?? '');
  const [nameError, setNameError] = useState<string>();
  const [selected, setSelected] = useState<Set<string> | null>(null); // null = not loaded yet

  // ACL-01 — permissions picker groups
  const groupsQuery = useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: () => api.get('/admin/permissions').then((r) => r.data.data as PermissionGroup[]),
    enabled: can('view-permissions'),
    staleTime: Infinity,
  });

  // editing: load the role's current permissions
  const roleQuery = useQuery({
    queryKey: ['admin', 'roles', role?.id],
    queryFn: () => api.get(`/admin/roles/${role!.id}`).then((r) => r.data.data as Role),
    enabled: isEdit,
  });

  const effectiveSelected =
    selected ?? new Set(roleQuery.data?.permissions?.map((p) => p.name) ?? []);

  const toggle = (permName: string) => {
    const next = new Set(effectiveSelected);
    if (next.has(permName)) next.delete(permName);
    else next.add(permName);
    setSelected(next);
  };

  const toggleGroup = (group: PermissionGroup) => {
    const next = new Set(effectiveSelected);
    const allIn = group.permissions.every((p) => next.has(p.name));
    group.permissions.forEach((p) => (allIn ? next.delete(p.name) : next.add(p.name)));
    setSelected(next);
  };

  const [busy, setBusy] = useState(false);
  const save = async () => {
    setNameError(undefined);
    if (!/^[a-z0-9-]+$/.test(name)) {
      setNameError(t('invalidRoleName'));
      return;
    }
    if (effectiveSelected.size === 0) {
      toast.error(t('roles.permissionsRequired'));
      return;
    }
    setBusy(true);
    try {
      const body = { name, permissions: [...effectiveSelected] };
      if (isEdit) {
        await api.put(`/admin/roles/${role.id}`, body);
        toast.success(t('roles.updated'));
      } else {
        await api.post('/admin/roles', body);
        toast.success(t('roles.created'));
      }
      onSaved();
    } catch (e) {
      if (isApiError(e)) {
        if (e.errors?.name) setNameError(e.errors.name[0]);
        else toast.error(e.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const groups = groupsQuery.data;

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? t('roles.edit') : t('roles.add')}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button onClick={save} loading={busy}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Input
          label={t('roles.name')}
          dir="ltr"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={nameLocked}
          hint={t('roles.nameHint')}
          error={nameError}
        />

        {can('view-permissions') &&
          (groupsQuery.isLoading || (isEdit && roleQuery.isLoading) ? (
            <div className="page-loader">
              <span className="spinner" />
            </div>
          ) : groups ? (
            <div className="flex flex-col gap-5">
              {groups.map((group) => {
                const allIn = group.permissions.every((p) => effectiveSelected.has(p.name));
                return (
                  <div key={group.group} className="rounded-xl border border-border p-4">
                    <Checkbox
                      label={`${group.label} (${group.permissions.length})`}
                      checked={allIn}
                      onChange={() => toggleGroup(group)}
                      className="font-semibold mb-3"
                    />
                    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 ms-6">
                      {group.permissions.map((p) => (
                        <Checkbox
                          key={p.name}
                          label={p.label}
                          checked={effectiveSelected.has(p.name)}
                          onChange={() => toggle(p.name)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null)}
      </div>
    </Modal>
  );
}

// ---------- users drawer (ACL-07) ----------
function RoleUsersDrawer({ role, onClose }: { role: Role; onClose: () => void }) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin', 'roles', role.id, 'users', { search, page }],
    queryFn: () =>
      api
        .get(`/admin/roles/${role.id}/users`, { params: { search: search || undefined, page } })
        .then((r) => r.data as Paginated<User>),
  });
  const data = query.data;

  return (
    <Drawer open onClose={onClose} title={`${role.name} — ${t('roles.users')}`}>
      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        className="mb-4"
      />
      {query.isLoading ? (
        <div className="page-loader">
          <span className="spinner" />
        </div>
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('common.empty')} />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.data.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Avatar src={u.avatar_thumb_url} name={u.name} size="sm" />
                <div className="min-w-0">
                  <strong className="block text-[0.9rem]">{u.name}</strong>
                  <span className="text-muted text-[0.8rem] block truncate" dir="ltr">
                    {u.email}
                  </span>
                </div>
                {!u.is_active && (
                  <Badge color="red" className="ms-auto">
                    {t('users.inactive')}
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <Pagination meta={data.meta} onPage={setPage} className="mt-4" />
        </>
      )}
    </Drawer>
  );
}
