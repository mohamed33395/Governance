'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { packageSchema, type PackageValues } from '@/schemas/packages';
import { RequirePermission } from '@/components/admin/RequirePermission';
import {
  ActionsMenu,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  Pagination,
  PriceTag,
  SearchInput,
  Select,
  Switch,
  Textarea,
  useToast,
} from '@/components/ui';
import type { Package, Paginated } from '@/types/api';

// §13.11 — packages (PKG-01..06)
export default function AdminPackagesPage() {
  return (
    <RequirePermission perm="view-packages">
      <PackagesInner />
    </RequirePermission>
  );
}

function PackagesInner() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Package | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Package | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'packages', { search, activeFilter, page }],
    queryFn: () =>
      api
        .get('/admin/packages', {
          params: { search: search || undefined, is_active: activeFilter || undefined, page },
        })
        .then((r) => r.data as Paginated<Package>),
  });
  const data = query.data;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'packages'] });

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.patch(`/admin/packages/${id}/status`, { is_active }),
    onSuccess: () => {
      invalidate();
      toast.success(t('profile.saved'));
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/packages/${id}`),
    onSuccess: () => {
      toast.success(t('packagesAdmin.deleted'));
      setDeleting(null);
      invalidate();
    },
    onError: (e) => {
      // 409 PACKAGE_HAS_SUBSCRIPTIONS
      if (isApiError(e)) toast.error(e.message);
      setDeleting(null);
    },
  });

  return (
    <>
      <PageHeader
        title={t('nav.packages')}
        actions={
          can('create-packages') ? (
            <Button size="sm" onClick={() => setEditing('new')}>
              + {t('packagesAdmin.add')}
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
        <div className="page-loader">
          <span className="spinner" />
        </div>
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('common.empty')} />
      ) : (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {data.data.map((pkg) => (
              <div key={pkg.id} className="bg-surface border border-border rounded-2xl p-5" style={{ boxShadow: 'var(--shadow)' }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <strong className="block text-[1.02rem]">{pkg.name}</strong>
                    <span className="text-muted text-[0.8rem]" dir="ltr">
                      {pkg.name_en}
                    </span>
                  </div>
                  {pkg.is_featured && <Badge color="amber">{t('packages.mostFeatured')}</Badge>}
                </div>

                <PriceTag formatted={pkg.price_formatted} className="text-xl block mb-3" />

                <div className="text-muted text-[0.84rem] flex flex-col gap-1 mb-4">
                  <span>
                    {t('packagesAdmin.consultations')}:{' '}
                    {pkg.consultations_limit === null ? t('dashboard.unlimited') : pkg.consultations_limit}
                  </span>
                  <span>
                    {t('packagesAdmin.documents')}:{' '}
                    {pkg.documents_limit === null ? t('dashboard.unlimited') : pkg.documents_limit}
                  </span>
                  <span dir="ltr">
                    {t('packagesAdmin.billingDays')}: {pkg.billing_period_days} · sort: {pkg.sort_order}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border/60 flex-wrap">
                  <Switch
                    checked={pkg.is_active}
                    disabled={!can('update-packages')}
                    onChange={(e) => statusMutation.mutate({ id: pkg.id, is_active: e.target.checked })}
                    aria-label={t('common.status')}
                  />
                  <span className="ms-auto">
                    <ActionsMenu
                      ariaLabel={t('common.actions')}
                      items={[
                        ...(can('update-packages')
                          ? [{ key: 'edit', label: t('common.edit'), onClick: () => setEditing(pkg) }]
                          : []),
                        ...(can('delete-packages')
                          ? [
                              {
                                key: 'delete',
                                label: t('common.delete'),
                                danger: true,
                                onClick: () => setDeleting(pkg),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}

      {editing && (
        <PackageFormModal
          pkg={editing === 'new' ? null : editing}
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
        body={t('packagesAdmin.deleteConfirm')}
        danger
        loading={deleteMutation.isPending}
      />
    </>
  );
}

// ---------- create/edit modal ----------
function PackageFormModal({
  pkg,
  onClose,
  onSaved,
}: {
  pkg: Package | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const isEdit = !!pkg;

  const {
    register,
    handleSubmit,
    setError,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PackageValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: pkg
      ? {
          slug: pkg.slug,
          name_ar: pkg.name_ar,
          name_en: pkg.name_en,
          description_ar: pkg.description_ar ?? '',
          description_en: pkg.description_en ?? '',
          features: pkg.features,
          price_sar: pkg.price / 100, // halalas → SAR for the form
          billing_period_days: pkg.billing_period_days,
          consultations_unlimited: pkg.consultations_limit === null,
          consultations_limit: pkg.consultations_limit,
          documents_unlimited: pkg.documents_limit === null,
          documents_limit: pkg.documents_limit,
          is_featured: pkg.is_featured,
          is_active: pkg.is_active,
          sort_order: pkg.sort_order,
        }
      : {
          features: [],
          billing_period_days: 30,
          is_active: true,
          sort_order: 0,
          consultations_unlimited: false,
          documents_unlimited: false,
        },
  });

  const features = useFieldArray({ control, name: 'features' });
  const consultationsUnlimited = watch('consultations_unlimited');
  const documentsUnlimited = watch('documents_unlimited');

  const onSubmit = handleSubmit(async (values) => {
    const body = {
      slug: values.slug,
      name_ar: values.name_ar,
      name_en: values.name_en,
      description_ar: values.description_ar || undefined,
      description_en: values.description_en || undefined,
      features: values.features,
      price: Math.round(Number(values.price_sar) * 100), // SAR → halalas
      billing_period_days: Number(values.billing_period_days),
      consultations_limit: values.consultations_unlimited ? null : values.consultations_limit,
      documents_limit: values.documents_unlimited ? null : values.documents_limit,
      is_featured: values.is_featured,
      is_active: values.is_active,
      sort_order: Number(values.sort_order),
    };
    try {
      if (isEdit) {
        await api.put(`/admin/packages/${pkg.id}`, body);
        toast.success(t('packagesAdmin.updated'));
      } else {
        await api.post('/admin/packages', body);
        toast.success(t('packagesAdmin.created'));
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
      title={isEdit ? t('packagesAdmin.edit') : t('packagesAdmin.add')}
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
        <Input
          label={t('packagesAdmin.slug')}
          dir="ltr"
          required
          hint={t('packagesAdmin.slugHint')}
          error={err(errors.slug?.message)}
          {...register('slug')}
        />
        <Input
          label={t('packagesAdmin.priceSar')}
          dir="ltr"
          type="number"
          step="0.01"
          min="0"
          required
          error={err(errors.price_sar?.message)}
          {...register('price_sar')}
        />
        <Input label={t('packagesAdmin.nameAr')} required error={err(errors.name_ar?.message)} {...register('name_ar')} />
        <Input label={t('packagesAdmin.nameEn')} dir="ltr" required error={err(errors.name_en?.message)} {...register('name_en')} />
        <Textarea label={t('packagesAdmin.descAr')} rows={2} error={err(errors.description_ar?.message)} {...register('description_ar')} />
        <Textarea label={t('packagesAdmin.descEn')} dir="ltr" rows={2} error={err(errors.description_en?.message)} {...register('description_en')} />

        {/* features editor — {ar, en} pairs */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.82rem] text-muted">{t('packagesAdmin.features')}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => features.append({ ar: '', en: '' })}>
              + {t('common.add')}
            </Button>
          </div>
          <div className="flex flex-col gap-2.5">
            {features.fields.map((field, i) => (
              <div key={field.id} className="flex gap-2.5 items-start">
                <Input placeholder={t('packagesAdmin.featureAr')} error={err(errors.features?.[i]?.ar?.message)} {...register(`features.${i}.ar`)} />
                <Input
                  placeholder={t('packagesAdmin.featureEn')}
                  dir="ltr"
                  error={err(errors.features?.[i]?.en?.message)}
                  {...register(`features.${i}.en`)}
                />
                <button
                  type="button"
                  onClick={() => features.remove(i)}
                  className="w-9 h-9 rounded-full border border-border text-danger hover:bg-danger hover:text-white transition-colors cursor-pointer bg-transparent shrink-0"
                  aria-label={t('common.delete')}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <Input
          label={t('packagesAdmin.billingDays')}
          dir="ltr"
          type="number"
          min="1"
          required
          error={err(errors.billing_period_days?.message)}
          {...register('billing_period_days')}
        />
        <Input
          label={t('packagesAdmin.sortOrder')}
          dir="ltr"
          type="number"
          min="0"
          error={err(errors.sort_order?.message)}
          {...register('sort_order')}
        />

        {/* limits with "unlimited" checkboxes (null) */}
        <div>
        <Checkbox label={t('packagesAdmin.unlimitedConsultations')} {...register('consultations_unlimited')} />
          {!consultationsUnlimited && (
            <Input
              className="mt-2"
              dir="ltr"
              type="number"
              min="1"
              placeholder={t('packagesAdmin.consultations')}
              error={err(errors.consultations_limit?.message)}
              {...register('consultations_limit', {
                setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
              })}
            />
          )}
        </div>
        <div>
          <Checkbox label={t('packagesAdmin.unlimitedDocuments')} {...register('documents_unlimited')} />
          {!documentsUnlimited && (
            <Input
              className="mt-2"
              dir="ltr"
              type="number"
              min="0"
              placeholder={t('packagesAdmin.documents')}
              error={err(errors.documents_limit?.message)}
              {...register('documents_limit', {
                setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
              })}
            />
          )}
        </div>

        <div className="sm:col-span-2 flex gap-6">
          <Switch label={t('packagesAdmin.featured')} {...register('is_featured')} />
          <Switch label={t('users.active')} {...register('is_active')} />
        </div>
      </form>
    </Modal>
  );
}
