'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { locationSchema, type LocationValues } from '@/schemas/locations';
import { useWizard } from '@/stores/wizard';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Button, EmptyState, ErrorState, Input, useToast } from '@/components/ui';
import type { Location } from '@/types/api';

// §11.2 step 5 — pick a saved location (CLI-LOC-01) or add one inline (CLI-LOC-02)
export function StepLocation() {
  const { t } = useI18n();
  const { location, setLocation } = useWizard();
  const [adding, setAdding] = useState(false);

  const query = useQuery({
    queryKey: ['client', 'locations'],
    queryFn: () => api.get('/client/locations').then((r) => r.data.data as Location[]),
  });
  const locations = query.data;

  // pre-select the default one (first location is auto-default backend-side)
  useEffect(() => {
    if (!location && locations && locations.length > 0) {
      setLocation(locations.find((l) => l.is_default) ?? locations[0]);
    }
  }, [locations, location, setLocation]);

  return (
    <div>
      {query.isLoading ? (
        <div className="page-loader">
          <span className="spinner" />
        </div>
      ) : query.isError || !locations ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <>
          {locations.length === 0 && !adding ? (
            <EmptyState title={t('locations.empty')} body={t('locations.emptyBody')} />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4" role="radiogroup">
              {locations.map((loc) => {
                const active = location?.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setLocation(loc)}
                    className={`rounded-2xl border p-4 text-start transition-all cursor-pointer ${
                      active ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border bg-surface hover:border-accent'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <strong className="text-text">{loc.name}</strong>
                      {loc.is_default && <span className="text-accent" title={t('locations.default')}>★</span>}
                    </span>
                    {loc.city && <span className="block text-muted text-[0.84rem] mt-1">{loc.city}</span>}
                    <span className="block text-muted text-[0.84rem] mt-0.5">{loc.address}</span>
                  </button>
                );
              })}
            </div>
          )}

          {adding ? (
            <AddLocationForm
              onCreated={(loc) => {
                setLocation(loc);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <Button type="button" variant="ghost" size="sm" className="mt-5" onClick={() => setAdding(true)}>
              + {t('wizard.addLocation')}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function AddLocationForm({ onCreated, onCancel }: { onCreated: (loc: Location) => void; onCancel: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LocationValues>({ resolver: zodResolver(locationSchema), defaultValues: { is_default: false } });

  const mutation = useMutation({
    mutationFn: (values: LocationValues) =>
      api.post('/client/locations', values).then((r) => r.data.data as Location),
    onSuccess: (loc) => {
      queryClient.invalidateQueries({ queryKey: ['client', 'locations'] });
      toast.success(t('locations.created'));
      onCreated(loc);
    },
    onError: (e) => {
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message);
    },
  });

  const err = (key?: string) => (key ? t(key) : undefined);

  return (
    <form
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      noValidate
      className="mt-6 rounded-2xl border border-border bg-background p-5 grid sm:grid-cols-2 gap-4"
    >
      <Input label={t('locations.name')} required error={err(errors.name?.message)} {...register('name')} />
      <Input label={t('locations.city')} error={err(errors.city?.message)} {...register('city')} />
      <Input
        label={t('locations.address')}
        required
        className="sm:col-span-2"
        error={err(errors.address?.message)}
        {...register('address')}
      />
      <div className="sm:col-span-2 flex gap-3">
        <Button type="submit" size="sm" loading={mutation.isPending}>
          {t('common.save')}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}
