'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { locationSchema, type LocationValues } from '@/schemas/locations';
import { useI18n } from '@/lib/i18n/i18n-context';
import {
  ActionsMenu,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  Switch,
  useToast,
} from '@/components/ui';
import type { Location } from '@/types/api';

// §12.6 — locations CRUD (CLI-LOC-01..06)
export default function LocationsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Location | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Location | null>(null);

  const query = useQuery({
    queryKey: ['client', 'locations'],
    queryFn: () => api.get('/client/locations').then((r) => r.data.data as Location[]),
  });
  const locations = query.data;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['client', 'locations'] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/client/locations/${id}`),
    onSuccess: () => {
      toast.success(t('locations.deleted'));
      setDeleting(null);
      invalidate(); // if it was default, the backend promotes the newest remaining
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  const setDefault = useMutation({
    mutationFn: (id: number) => api.patch(`/client/locations/${id}/default`),
    onSuccess: () => {
      invalidate();
      toast.success(t('profile.saved'));
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title={t('locations.title')}
        actions={
          <Button size="sm" onClick={() => setEditing('new')}>
            + {t('locations.add')}
          </Button>
        }
      />

      {query.isLoading ? (
        <div className="page-loader">
          <span className="spinner" />
        </div>
      ) : query.isError || !locations ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : locations.length === 0 ? (
        <EmptyState title={t('locations.empty')} body={t('locations.emptyBody')} />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {locations.map((loc) => (
            <div key={loc.id} className="bg-surface border border-border rounded-2xl p-5" style={{ boxShadow: 'var(--shadow)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="flex items-center gap-2 text-[1.02rem]">
                    {loc.name}
                    {loc.is_default && (
                      <span className="text-accent" title={t('locations.default')}>
                        ★
                      </span>
                    )}
                  </strong>
                  {loc.city && <span className="block text-muted text-[0.86rem] mt-1">{loc.city}</span>}
                  <span className="block text-muted text-[0.86rem] mt-0.5">{loc.address}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-border/60 flex-wrap">
                <span className="ms-auto">
                  <ActionsMenu
                    ariaLabel={t('common.actions')}
                    items={[
                      { key: 'edit', label: t('common.edit'), onClick: () => setEditing(loc) },
                      ...(!loc.is_default
                        ? [
                            {
                              key: 'default',
                              label: t('locations.setDefault'),
                              onClick: () => setDefault.mutate(loc.id),
                              disabled: setDefault.isPending,
                            },
                          ]
                        : []),
                      {
                        key: 'delete',
                        label: t('common.delete'),
                        danger: true,
                        onClick: () => setDeleting(loc),
                      },
                    ]}
                  />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <LocationFormModal
          location={editing === 'new' ? null : editing}
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
        body={t('locations.deleteConfirm')}
        danger
        loading={deleteMutation.isPending}
      />
    </>
  );
}

function LocationFormModal({
  location,
  onClose,
  onSaved,
}: {
  location: Location | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const isEdit = !!location;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LocationValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: location
      ? {
          name: location.name,
          city: location.city ?? '',
          address: location.address,
          latitude: location.latitude ?? '',
          longitude: location.longitude ?? '',
          is_default: location.is_default,
        }
      : { is_default: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit) {
        await api.put(`/client/locations/${location.id}`, values);
        toast.success(t('locations.updated'));
      } else {
        await api.post('/client/locations', values);
        toast.success(t('locations.created'));
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
      title={isEdit ? t('locations.edit') : t('locations.add')}
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
        <Input label={t('locations.name')} required error={err(errors.name?.message)} {...register('name')} />
        <Input label={t('locations.city')} error={err(errors.city?.message)} {...register('city')} />
        <Input
          label={t('locations.address')}
          required
          className="sm:col-span-2"
          error={err(errors.address?.message)}
          {...register('address')}
        />
        <Input label={t('locations.latitude')} dir="ltr" error={err(errors.latitude?.message)} {...register('latitude')} />
        <Input label={t('locations.longitude')} dir="ltr" error={err(errors.longitude?.message)} {...register('longitude')} />
        <div className="sm:col-span-2">
          <Switch label={t('locations.default')} {...register('is_default')} />
        </div>
      </form>
    </Modal>
  );
}
