'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { settingsSchema, type SettingsValues } from '@/schemas/admin';
import { Button, ErrorState, Input, LogoLoader, PageHeader, Switch, useToast } from '@/components/ui';
import type { PlatformSettings } from '@/types/api';

// SET-01/02 — global platform fee % + payout automation toggle.
export default function AdminSettingsPage() {
  return (
    <RequirePermission perm="view-settings">
      <SettingsInner />
    </RequirePermission>
  );
}

function SettingsInner() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const editable = can('update-settings');

  const query = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.get('/admin/settings').then((r) => r.data.data as PlatformSettings),
  });
  const settings = query.data;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsValues>({ resolver: zodResolver(settingsSchema), values: settings });

  const onSubmit = handleSubmit(async (formValues) => {
    try {
      const { data } = await api.put('/admin/settings', formValues);
      reset(data.data as PlatformSettings);
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts', 'stats'] }); // auto_transfer flag
      toast.success(t('settingsAdmin.saved'));
    } catch (e) {
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message);
    }
  });

  const err = (key?: string) => (key ? t(key) : undefined);

  return (
    <>
      <PageHeader title={t('nav.settings')} />

      {query.isLoading ? (
        <LogoLoader />
      ) : query.isError || !settings ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <div className="max-w-2xl bg-surface border border-border rounded-2xl p-6">
          <h3 className="text-[1rem] mb-5 pb-3 border-b border-border">{t('settingsAdmin.card')}</h3>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <Input
              label={t('settingsAdmin.platformFee')}
              hint={t('settingsAdmin.platformFeeHint')}
              type="number"
              dir="ltr"
              min={0}
              max={100}
              step="0.01"
              required
              disabled={!editable}
              error={err(errors.platform_fee_percent?.message)}
              {...register('platform_fee_percent')}
            />
            <div>
              <Switch
                label={t('settingsAdmin.payoutAuto')}
                disabled={!editable}
                {...register('payout_auto_transfer')}
              />
              <p className="text-muted text-[0.8rem] mt-1.5">{t('settingsAdmin.payoutAutoHint')}</p>
            </div>
            {editable && (
              <Button type="submit" loading={isSubmitting} className="self-start">
                {t('common.save')}
              </Button>
            )}
          </form>
        </div>
      )}
    </>
  );
}
