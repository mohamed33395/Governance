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
import { certificateSchema, type CertificateValues } from '@/schemas/certificate';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { FilterPanel } from '@/components/admin/FilterPanel';
import {
  ActionsMenu,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FileDrop,
  Input,
  LogoLoader,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Switch,
  Table,
  useToast,
} from '@/components/ui';
import type { Certificate, Paginated } from '@/types/api';

const CERT_ACCEPT = '.jpg,.jpeg,.png,.webp';
const CERT_MAX_MB = 5;

export default function AdminCertificatesPage() {
  return (
    <RequirePermission perm="view-certificates">
      <CertificatesInner />
    </RequirePermission>
  );
}

function CertificatesInner() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Certificate | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Certificate | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'certificates', { search, status, page }],
    queryFn: () =>
      api
        .get('/admin/certificates', {
          params: { search: search || undefined, status: status || undefined, page },
        })
        .then((r) => r.data as Paginated<Certificate>),
  });
  const data = query.data;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'certificates'] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/certificates/${id}`),
    onSuccess: () => {
      toast.success(t('certificates.deleted'));
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
        title={t('nav.certificates')}
        subtitle={data ? t('certificates.total').replace('{count}', String(data.meta.total)) : undefined}
        actions={
          can('create-certificates') ? (
            <Button size="sm" onClick={() => setEditing('new')}>
              + {t('certificates.add')}
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
            { value: 'active', label: t('certificates.statuses.active') },
            { value: 'inactive', label: t('certificates.statuses.inactive') },
          ]}
          placeholder={t('certificates.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 160 }}
        />
      </FilterPanel>

      {query.isLoading ? (
        <LogoLoader />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('certificates.empty')} />
      ) : (
        <>
          <Table
            columns={[
              {
                key: 'name',
                header: t('certificates.name'),
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <CertThumb url={row.image_thumb_url ?? row.image_url} name={row.name} />
                    <span className="font-semibold">{row.name}</span>
                  </div>
                ),
              },
              { key: 'issuer', header: t('certificates.issuer'), render: (row) => row.issuer ?? '—' },
              {
                key: 'sort_order',
                header: t('certificates.sortOrder'),
                render: (row) => row.sort_order,
              },
              {
                key: 'status',
                header: t('certificates.status'),
                render: (row) =>
                  row.is_active ? (
                    <Badge color="green">{t('certificates.statuses.active')}</Badge>
                  ) : (
                    <Badge color="gray">{t('certificates.statuses.inactive')}</Badge>
                  ),
              },
              {
                key: 'actions',
                header: '',
                render: (row) => (
                  <ActionsMenu
                    ariaLabel={t('common.actions')}
                    items={[
                      ...(can('update-certificates')
                        ? [{ key: 'edit', label: t('common.edit'), onClick: () => setEditing(row) }]
                        : []),
                      ...(can('delete-certificates')
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
        <CertificateFormModal
          certificate={editing === 'new' ? null : editing}
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
        body={t('certificates.deleteConfirm')}
        danger
        loading={deleteMutation.isPending}
      />
    </>
  );
}

// Logo tile used in the table row — keeps transparent PNGs readable.
function CertThumb({ url, name }: { url: string | null; name: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="size-full object-contain p-1" />
      ) : (
        <span className="text-sm font-bold text-primary" aria-hidden="true">
          {name.trim()[0]}
        </span>
      )}
    </span>
  );
}

// ---------- create/edit modal ----------
function CertificateFormModal({
  certificate,
  onClose,
  onSaved,
}: {
  certificate: Certificate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const isEdit = !!certificate;
  const [image, setImage] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CertificateValues>({
    resolver: zodResolver(certificateSchema),
    defaultValues: certificate
      ? {
          name: certificate.name,
          issuer: certificate.issuer ?? '',
          sort_order: certificate.sort_order,
          is_active: certificate.is_active,
        }
      : { is_active: true, sort_order: 0 },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = certificateSchema.parse(values);
      if (image) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => appendFormData(fd, v, k));
        appendFormData(fd, image, 'image');
        await api.post(isEdit ? `/admin/certificates/${certificate.id}` : '/admin/certificates', fd);
      } else if (isEdit) {
        await api.put(`/admin/certificates/${certificate.id}`, payload);
      } else {
        await api.post('/admin/certificates', payload);
      }
      toast.success(t(isEdit ? 'certificates.updated' : 'certificates.created'));
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
      title={isEdit ? t('certificates.edit') : t('certificates.add')}
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
        <Input label={t('certificates.name')} required error={err(errors.name?.message)} {...register('name')} />
        <Input
          label={t('certificates.issuer')}
          error={err(errors.issuer?.message)}
          {...register('issuer')}
        />
        <Input
          label={t('certificates.sortOrder')}
          type="number"
          inputMode="numeric"
          min={0}
          dir="ltr"
          error={err(errors.sort_order?.message)}
          {...register('sort_order')}
        />

        <div className="sm:col-span-2">
          <span className="text-[0.82rem] text-muted block mb-2">{t('certificates.image')}</span>
          <FileDrop
            accept={CERT_ACCEPT}
            maxMb={CERT_MAX_MB}
            onFile={setImage}
            label={image ? image.name : isEdit ? certificate.image_url ?? undefined : undefined}
          />
          <p className="text-[0.76rem] text-muted mt-1.5">{t('certificates.imageHint')}</p>
        </div>

        <div className="sm:col-span-2">
          <Switch label={t('certificates.active')} {...register('is_active')} />
        </div>
      </form>
    </Modal>
  );
}
