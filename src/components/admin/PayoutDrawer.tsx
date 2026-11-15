'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { payoutReleaseSchema, type PayoutReleaseValues } from '@/schemas/admin';
import { Alert, Badge, Button, Drawer, Input, LogoLoader, PriceTag, StatusBadge, Textarea, useToast } from '@/components/ui';
import type { Payout } from '@/types/api';

// PO-02/03 — payout details + release. `autoTransfer` comes from the stats
// endpoint (mirrors the payout_auto_transfer setting) and only changes the hint.
export function PayoutDrawer({
  payout,
  autoTransfer = false,
  onClose,
}: {
  payout: Payout | null;
  autoTransfer?: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can, type } = usePermissions();

  const query = useQuery({
    queryKey: ['admin', 'payouts', payout?.id],
    queryFn: () => api.get(`/admin/payouts/${payout!.id}`).then((r) => r.data.data as Payout),
    enabled: !!payout,
  });
  const details = query.data ?? payout;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PayoutReleaseValues>({ resolver: zodResolver(payoutReleaseSchema) });

  const release = useMutation({
    mutationFn: (values: PayoutReleaseValues) =>
      api.post(`/admin/payouts/${details!.id}/release`, {
        transfer_reference: values.transfer_reference || undefined,
        note: values.note || undefined,
      }),
    onSuccess: () => {
      // PAYOUT_ALREADY_RELEASED is prevented by hiding the form once released
      toast.success(t('payoutsAdmin.released'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
    },
    onError: (e) => {
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message); // PAYOUT_ALREADY_RELEASED / PAYOUT_NOT_RELEASABLE
    },
  });

  const row = 'flex justify-between gap-3 py-2 border-b border-border/60 text-[0.9rem]';
  const err = (key?: string) => (key ? t(key) : undefined);
  const bank = details?.consultant;

  return (
    <Drawer open={!!payout} onClose={onClose} title={`${t('nav.payouts')} #${payout?.id ?? ''}`} width={460}>
      {details ? (
        <div className="flex flex-col gap-1">
          <div className={row}>
            <span className="text-muted">{t('common.status')}</span>
            <StatusBadge kind="payout" value={details.status} label={t(`payoutStatus.${details.status}`)} />
          </div>
          <div className={row}>
            <span className="text-muted">{t('payoutsAdmin.gross')}</span>
            <PriceTag formatted={details.amount_formatted} />
          </div>
          <div className={row}>
            <span className="text-muted">{t('payoutsAdmin.fee')}</span>
            <span>
              <PriceTag formatted={details.fee_amount_formatted} />{' '}
              <span className="text-muted text-[0.8rem]" dir="ltr">
                ({details.fee_percent}%)
              </span>
            </span>
          </div>
          <div className={row}>
            <span className="text-muted">{t('payoutsAdmin.net')}</span>
            <strong>
              <PriceTag formatted={details.net_amount_formatted} />
            </strong>
          </div>
          {details.driver && (
            <div className={row}>
              <span className="text-muted">{t('payoutsAdmin.driver')}</span>
              <span dir="ltr">{details.driver}</span>
            </div>
          )}
          {details.transfer_reference && (
            <div className={row}>
              <span className="text-muted">{t('payoutsAdmin.transferRef')}</span>
              <span dir="ltr">{details.transfer_reference}</span>
            </div>
          )}
          {details.release_note && (
            <div className={row}>
              <span className="text-muted">{t('payoutsAdmin.note')}</span>
              <span>{details.release_note}</span>
            </div>
          )}
          {details.released_by && (
            <div className={row}>
              <span className="text-muted">{t('payoutsAdmin.releasedBy')}</span>
              <span>{details.released_by.name}</span>
            </div>
          )}
          <div className={row}>
            <span className="text-muted">{t('payoutsAdmin.releasedAt')}</span>
            <span dir="ltr">{details.released_at ? details.released_at.slice(0, 16).replace('T', ' ') : '—'}</span>
          </div>
          <div className={row}>
            <span className="text-muted">{t('bookingsAdmin.createdAt')}</span>
            <span dir="ltr">{details.created_at.slice(0, 16).replace('T', ' ')}</span>
          </div>

          {/* booking summary card */}
          <div className="mt-5 rounded-xl border border-border p-4">
            <span className="text-muted text-[0.82rem] block mb-2">{t('payoutsAdmin.booking')}</span>
            <strong dir="ltr" className="block">
              {details.booking_reference ?? `#${details.booking_id}`}
            </strong>
            {bank && <span className="text-muted text-[0.85rem]">{bank.name}</span>}
            <div className="mt-3">
              <Link href={`/admin/bookings/${details.booking_id}`}>
                <Button variant="outline" size="sm">
                  {t('wizard.viewBooking')}
                </Button>
              </Link>
            </div>
          </div>

          {/* bank account for the manual transfer — admins need it on this screen */}
          <div className="mt-4 rounded-xl border border-border p-4">
            <span className="text-muted text-[0.82rem] block mb-3">{t('payoutsAdmin.bankDetails')}</span>
            {bank?.iban || bank?.bank_name || bank?.account_name ? (
              <div className="flex flex-col gap-2 text-[0.9rem]">
                {bank.account_name && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">{t('payoutsAdmin.accountName')}</span>
                    <strong>{bank.account_name}</strong>
                  </div>
                )}
                {bank.bank_name && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">{t('payoutsAdmin.bankName')}</span>
                    <strong>{bank.bank_name}</strong>
                  </div>
                )}
                {bank.iban && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">{t('payoutsAdmin.iban')}</span>
                    <strong dir="ltr">{bank.iban}</strong>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted text-[0.85rem]">{t('payoutsAdmin.noBankDetails')}</p>
            )}
          </div>

          {/* release — pending only; consultants never see it (no release-payouts) */}
          {type === 'admin' && can('release-payouts') && details.status === 'pending' && (
            <form
              onSubmit={handleSubmit((v) => release.mutate(v))}
              noValidate
              className="mt-5 rounded-xl border border-border p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <strong className="text-[0.95rem]">{t('payoutsAdmin.release')}</strong>
                <Badge color={autoTransfer ? 'green' : 'amber'}>
                  {autoTransfer ? t('payoutsAdmin.autoOn') : t('payoutsAdmin.autoOff')}
                </Badge>
              </div>
              <p className="text-muted text-[0.82rem]">
                {autoTransfer ? t('payoutsAdmin.releaseHintAuto') : t('payoutsAdmin.releaseHintManual')}
              </p>
              <Input
                label={t('payoutsAdmin.transferRef')}
                dir="ltr"
                maxLength={150}
                error={err(errors.transfer_reference?.message)}
                {...register('transfer_reference')}
              />
              <Textarea
                label={t('payoutsAdmin.note')}
                rows={2}
                maxLength={1000}
                error={err(errors.note?.message)}
                {...register('note')}
              />
              <Button type="submit" loading={release.isPending || isSubmitting} className="self-start">
                {t('payoutsAdmin.release')}
              </Button>
            </form>
          )}

          {details.status === 'pending' && type === 'admin' && can('release-payouts') && !autoTransfer && !bank?.iban && (
            <Alert color="warning" body={t('payoutsAdmin.noBankDetails')} className="mt-4" />
          )}

          {query.isLoading && <LogoLoader />}
        </div>
      ) : (
        <LogoLoader />
      )}
    </Drawer>
  );
}
