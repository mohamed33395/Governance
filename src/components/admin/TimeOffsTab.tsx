'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { timeOffSchema, type TimeOffValues } from '@/schemas/availability';
import { useI18n } from '@/lib/i18n/i18n-context';
import { TIME_OPTIONS } from './AvailabilityEditor';
import {
  Alert,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  Select,
  Switch,
  Table,
  TableSkeleton,
  useToast,
} from '@/components/ui';
import type { Paginated, TimeOff } from '@/types/api';

// §13.5 tab 3 / §13.6 — time offs against any base path
export function TimeOffsTab({ basePath }: { basePath: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<TimeOff | null>(null);
  const [conflicts, setConflicts] = useState(0);

  const query = useQuery({
    queryKey: ['admin', 'time-offs', basePath, { page }],
    queryFn: () =>
      api.get(`${basePath}/time-offs`, { params: { page } }).then((r) => r.data as Paginated<TimeOff>),
  });
  const data = query.data;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'time-offs', basePath] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`${basePath}/time-offs/${id}`),
    onSuccess: () => {
      toast.success(t('timeOffs.deleted'));
      setDeleting(null);
      invalidate();
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  return (
    <div>
      {conflicts > 0 && (
        <Alert color="warning" body={t('availability.conflicts').replace('{count}', String(conflicts))} className="mb-4" />
      )}

      <AddTimeOffForm basePath={basePath} onCreated={(c) => setConflicts(c)} />

      <div className="mt-6">
        {query.isLoading ? (
          <TableSkeleton rows={3} />
        ) : query.isError || !data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : data.data.length === 0 ? (
          <EmptyState title={t('timeOffs.empty')} />
        ) : (
          <>
            <Table
              columns={[
                { key: 'date', header: t('common.date'), render: (to) => to.date },
                {
                  key: 'time',
                  header: t('common.time'),
                  render: (to) =>
                    to.is_full_day ? (
                      t('timeOffs.fullDay')
                    ) : (
                      <bdi dir="ltr">
                        {to.start_time} — {to.end_time}
                      </bdi>
                    ),
                },
                { key: 'reason', header: t('timeOffs.reason'), render: (to) => to.reason ?? '—' },
                {
                  key: 'actions',
                  header: t('common.actions'),
                  render: (to) => (
                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleting(to)}>
                      {t('common.delete')}
                    </Button>
                  ),
                },
              ]}
              rows={data.data}
              rowKey={(to) => to.id}
            />
            <Pagination meta={data.meta} onPage={setPage} className="mt-4" />
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title={t('common.delete')}
        body={t('timeOffs.deleteConfirm')}
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function AddTimeOffForm({
  basePath,
  onCreated,
}: {
  basePath: string;
  onCreated: (conflictingBookings: number) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TimeOffValues>({
    resolver: zodResolver(timeOffSchema),
    defaultValues: { full_day: true },
  });

  const fullDay = watch('full_day');
  const timeOptions = TIME_OPTIONS.map((time) => ({ value: time, label: time }));

  const onSubmit = handleSubmit(async (values) => {
    // today-or-later check
    if (values.date < dayjs().format('YYYY-MM-DD')) {
      setError('date', { type: 'manual', message: 'invalidDate' });
      return;
    }
    try {
      const { data } = await api.post(`${basePath}/time-offs`, {
        date: values.date,
        full_day: values.full_day,
        ...(values.full_day ? {} : { start_time: values.start_time, end_time: values.end_time }),
        reason: values.reason || undefined,
      });
      toast.success(t('timeOffs.created'));
      reset({ full_day: true });
      queryClient.invalidateQueries({ queryKey: ['admin', 'time-offs', basePath] });
      // same conflicting-bookings warning on create
      const warnings = (data.data as { warnings?: { conflicting_bookings_count: number } })?.warnings;
      onCreated(warnings?.conflicting_bookings_count ?? 0);
    } catch (e) {
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message);
    }
  });

  const err = (key?: string) => (key ? t(key) : undefined);

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl border border-border bg-background p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
    >
      <Input
        label={t('common.date')}
        type="date"
        required
        min={dayjs().format('YYYY-MM-DD')}
        error={err(errors.date?.message)}
        {...register('date')}
      />
      <div className="flex items-end pb-2">
        <Switch label={t('timeOffs.fullDay')} {...register('full_day')} />
      </div>
      {!fullDay && (
        <>
          <Select
            label={t('availability.from')}
            options={timeOptions}
            placeholder="—"
            error={err(errors.start_time?.message)}
            {...register('start_time')}
          />
          <Select
            label={t('availability.to')}
            options={timeOptions}
            placeholder="—"
            error={err(errors.end_time?.message)}
            {...register('end_time')}
          />
        </>
      )}
      <Input label={t('timeOffs.reason')} error={err(errors.reason?.message)} {...register('reason')} />
      <div>
        <Button type="submit" size="sm" loading={isSubmitting}>
          + {t('common.add')}
        </Button>
      </div>
    </form>
  );
}
