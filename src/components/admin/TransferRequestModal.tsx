'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { transferRequestSchema, type TransferRequestValues } from '@/schemas/bookings';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Button, Modal, Select, Textarea, useToast } from '@/components/ui';
import type { TransferTarget } from '@/types/api';

// Consultant asks an admin to hand this booking to another consultant.
// POST /admin/booking-transfers { booking_id, to_consultant_id, reason } —
// the request stays pending until an admin approves it.
export function TransferRequestModal({
  bookingId,
  onClose,
  onSaved,
}: {
  bookingId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();

  const targetsQuery = useQuery({
    queryKey: ['admin', 'booking-transfers', 'targets'],
    queryFn: () =>
      api.get('/admin/booking-transfers/targets').then((r) => r.data.data as TransferTarget[]),
  });
  const targets = targetsQuery.data ?? [];

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TransferRequestValues>({ resolver: zodResolver(transferRequestSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.post('/admin/booking-transfers', {
        booking_id: bookingId,
        to_consultant_id: Number(values.to_consultant_id),
        reason: values.reason.trim(),
      });
      toast.success(t('transfers.requested'));
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      onSaved();
    } catch (e) {
      if (!isApiError(e)) return;
      if (e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else toast.error(e.message); // TRANSFER_NOT_ALLOWED / TRANSFER_ALREADY_PENDING
    }
  });

  const err = (key?: string) => (key ? t(key) : undefined);

  return (
    <Modal
      open
      onClose={onClose}
      title={t('transfers.requestTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} loading={isSubmitting}>
            {t('transfers.requestTransfer')}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Select
          label={t('transfers.target')}
          required
          placeholder={targetsQuery.isLoading ? t('loading') : t('transfers.targetPlaceholder')}
          options={targets.map((c) => ({
            value: String(c.id),
            label: c.title ? `${c.name} — ${c.title}` : c.name,
          }))}
          error={err(errors.to_consultant_id?.message)}
          {...register('to_consultant_id')}
        />
        <Textarea
          label={t('transfers.reason')}
          required
          rows={3}
          maxLength={500}
          error={err(errors.reason?.message)}
          {...register('reason')}
        />
      </form>
    </Modal>
  );
}
