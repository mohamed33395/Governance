'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { REPORT_ACCEPT, REPORT_MAX_MB } from '@/lib/files';
import { reportUploadSchema, type ReportUploadValues } from '@/schemas/bookings';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Alert, Button, FileDrop, Input, Modal, Switch, Textarea, useToast } from '@/components/ui';

// §13.9 — upload a report for a completed booking.
// POST /admin/bookings/{booking}/report (FormData). 201 = created,
// 200 = replaced (uploading again replaces the file).
export function ReportUploadModal({
  bookingId,
  hasExistingReport,
  onClose,
  onSaved,
}: {
  bookingId: number;
  hasExistingReport: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReportUploadValues>({
    resolver: zodResolver(reportUploadSchema),
    defaultValues: { notify_client: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFileError(undefined);
    if (!file) {
      setFileError(t('required'));
      return;
    }
    try {
      const fd = new FormData();
      fd.append('title', values.title);
      if (values.summary) fd.append('summary', values.summary);
      fd.append('file', file);
      fd.append('notify_client', values.notify_client ? '1' : '0');
      await api.post(`/admin/bookings/${bookingId}/report`, fd);
      toast.success(hasExistingReport ? t('reportsAdmin.replaced') : t('reportsAdmin.uploaded'));
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      onSaved();
    } catch (e) {
      if (!isApiError(e)) return;
      if (e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (e.code === 'REPORT_NOT_ALLOWED') toast.error(t('reportsAdmin.notAllowed')); // booking not completed
      else toast.error(e.message);
    }
  });

  const err = (key?: string) => (key ? t(key) : undefined);

  return (
    <Modal
      open
      onClose={onClose}
      title={t('reportsAdmin.upload')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} loading={isSubmitting}>
            {t('reportsAdmin.upload')}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {hasExistingReport && <Alert color="warning" body={t('reportsAdmin.replaceNotice')} />}
        <Input label={t('reportsAdmin.titleField')} required maxLength={191} error={err(errors.title?.message)} {...register('title')} />
        <Textarea
          label={t('reports.summary')}
          rows={4}
          maxLength={5000}
          error={err(errors.summary?.message)}
          {...register('summary')}
        />
        <div>
          <span className="text-[0.82rem] text-muted block mb-2">
            {t('reports.file')} <span className="text-danger">*</span>
          </span>
          <FileDrop
            accept={REPORT_ACCEPT}
            maxMb={REPORT_MAX_MB}
            onFile={(f) => {
              setFile(f);
              setFileError(undefined);
            }}
            label={file?.name}
            error={fileError}
          />
          {fileError && <p className="text-[0.78rem] text-danger mt-1.5">{fileError}</p>}
        </div>
        <Switch label={t('reportsAdmin.notifyClient')} {...register('notify_client')} />
      </form>
    </Modal>
  );
}
