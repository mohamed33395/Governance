'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePermissions } from '@/lib/permissions';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { FilterPanel } from '@/components/admin/FilterPanel';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  LogoLoader,
  Pagination,
  SearchInput,
  Table,
  Textarea,
  useToast,
} from '@/components/ui';
import { trainingSessionSchema, type TrainingSessionValues } from '@/schemas/training';
import type { Paginated, Trainee, TrainingSession } from '@/types/api';

export default function TrainingPage() {
  return (
    <RequirePermission perm="view-training">
      <TrainingInner />
    </RequirePermission>
  );
}

const fmt = (iso: string | null | undefined) => (iso ? iso.slice(0, 16).replace('T', ' ') : '—');

function TrainingInner() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sessionsFor, setSessionsFor] = useState<number | null>(null);
  const [scheduling, setScheduling] = useState<Trainee | null>(null);
  const [promoting, setPromoting] = useState<Trainee | null>(null);
  const [deleting, setDeleting] = useState<{ traineeId: number; session: TrainingSession } | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'training', { search, page }],
    queryFn: () =>
      api
        .get('/admin/training', { params: { search: search || undefined, page } })
        .then((r) => r.data as Paginated<Trainee>),
  });
  const data = query.data;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'training'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'consultants'] });
  };

  const promote = useMutation({
    mutationFn: (id: number) => api.post(`/admin/training/${id}/promote`),
    onSuccess: () => {
      toast.success(t('training.promoted'));
      setPromoting(null);
      invalidate();
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  const deleteSession = useMutation({
    mutationFn: ({ traineeId, sessionId }: { traineeId: number; sessionId: number }) =>
      api.delete(`/admin/training/${traineeId}/sessions/${sessionId}`),
    onSuccess: () => {
      toast.success(t('training.sessionDeleted'));
      setDeleting(null);
      invalidate();
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  // Re-read the trainee from live data so the modal reflects invalidations.
  const sessionsTrainee = sessionsFor ? data?.data.find((x) => x.id === sessionsFor) ?? null : null;

  return (
    <>
      <div className="page-identity" style={{ ['--id-strong' as string]: 'var(--gold)' }}>
        <div className="page-identity-main">
          <div className="page-id-rail" />
          <div>
            <h1 className="page-id-title">{t('training.title')}</h1>
            <p className="page-id-subtitle">{t('training.subtitle')}</p>
          </div>
        </div>
      </div>

      <FilterPanel>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          className="flex-1 min-w-[220px]"
        />
      </FilterPanel>

      {query.isLoading ? (
        <LogoLoader />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('training.noTrainees')} />
      ) : (
        <>
          <Table
            columns={[
              {
                key: 'trainee',
                header: t('training.trainee'),
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <Avatar src={row.avatar_thumb_url ?? row.avatar_url} name={row.name} size="sm" />
                    <div>
                      <div className="font-semibold">{row.name}</div>
                      <div className="text-xs text-muted" dir="ltr">
                        {row.email}
                      </div>
                    </div>
                  </div>
                ),
              },
              { key: 'specialization', header: t('joinRequests.specialization'), render: (row) => row.specialization ?? '—' },
              {
                key: 'sessions',
                header: t('training.sessions'),
                render: (row) => <Badge color={row.sessions_count > 0 ? 'green' : 'gray'}>{row.sessions_count}</Badge>,
              },
              {
                key: 'next',
                header: t('training.nextSession'),
                render: (row) => (
                  <span dir="ltr" className={row.next_session_at ? '' : 'text-muted'}>
                    {fmt(row.next_session_at)}
                  </span>
                ),
              },
              { key: 'created', header: t('common.date'), render: (row) => fmt(row.created_at) },
              {
                key: 'actions',
                header: '',
                render: (row) => (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSessionsFor(row.id)}>
                      {t('training.sessions')}
                    </Button>
                    <Link href={`/admin/consultants/${row.id}`}>
                      <Button variant="ghost" size="sm">
                        {t('training.viewProfile')}
                      </Button>
                    </Link>
                    {can('manage-training') && (
                      <>
                        <Button size="sm" onClick={() => setScheduling(row)}>
                          {t('training.schedule')}
                        </Button>
                        <Button variant="gold" size="sm" onClick={() => setPromoting(row)}>
                          {t('training.promote')}
                        </Button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
            rows={data.data}
            rowKey={(row) => row.id}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}

      {/* Sessions list */}
      {sessionsTrainee && (
        <div className="modal-backdrop open">
          <div className="modal-card" style={{ maxWidth: 560 }}>
            <h3>
              {t('training.sessions')} — {sessionsTrainee.name}
            </h3>
            <div className="mt-4 space-y-3">
              {(sessionsTrainee.sessions ?? []).length === 0 && (
                <p className="text-sm text-muted">{t('training.noSessions')}</p>
              )}
              {(sessionsTrainee.sessions ?? []).map((s) => (
                <div key={s.id} className="ui-card p-3 flex items-start justify-between gap-3">
                  <div className="text-sm space-y-1">
                    <div className="font-semibold" dir="ltr">
                      {fmt(s.starts_at)}
                      <span className="text-muted font-normal"> · {s.duration_minutes} min</span>
                    </div>
                    {s.meeting_url && (
                      <a
                        href={s.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-xs underline break-all"
                        dir="ltr"
                      >
                        {s.meeting_url}
                      </a>
                    )}
                    {s.notes && <div className="text-xs text-muted">{s.notes}</div>}
                    {s.scheduled_by && (
                      <div className="text-xs text-muted">
                        {t('training.scheduledBy')}: {s.scheduled_by.name}
                      </div>
                    )}
                  </div>
                  {can('manage-training') && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleting({ traineeId: sessionsTrainee.id, session: s })}
                    >
                      {t('training.deleteSession')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => setSessionsFor(null)}>
                {t('common.cancel')}
              </Button>
              {can('manage-training') && (
                <Button onClick={() => setScheduling(sessionsTrainee)}>{t('training.schedule')}</Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule form */}
      {scheduling && <ScheduleModal trainee={scheduling} onClose={() => setScheduling(null)} onSaved={invalidate} />}

      {/* Promote confirm */}
      {promoting && (
        <div className="modal-backdrop open">
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <h3>{t('training.promote')}</h3>
            <p className="text-sm text-muted mb-4">
              {promoting.name} — {t('training.promoteConfirm')}
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => setPromoting(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="gold" onClick={() => promote.mutate(promoting.id)} loading={promote.isPending}>
                {t('training.promote')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete session confirm */}
      {deleting && (
        <div className="modal-backdrop open">
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <h3>{t('training.deleteSession')}</h3>
            <p className="text-sm text-muted mb-4">
              <span dir="ltr">{fmt(deleting.session.starts_at)}</span> — {t('training.deleteSessionConfirm')}
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteSession.mutate({ traineeId: deleting.traineeId, sessionId: deleting.session.id })}
                loading={deleteSession.isPending}
              >
                {t('training.deleteSession')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ScheduleModal({
  trainee,
  onClose,
  onSaved,
}: {
  trainee: Trainee;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TrainingSessionValues>({
    resolver: zodResolver(trainingSessionSchema),
    defaultValues: { starts_at: '', duration_minutes: 60, meeting_url: '', notes: '' },
  });

  const err = (key: keyof TrainingSessionValues) =>
    errors[key]?.message ? t(errors[key]!.message as string) : undefined;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.post(`/admin/training/${trainee.id}/sessions`, values);
      toast.success(t('training.sessionScheduled'));
      onSaved();
      onClose();
    } catch (e) {
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message);
    }
  });

  return (
    <div className="modal-backdrop open">
      <div className="modal-card" style={{ maxWidth: 520 }}>
        <h3>
          {t('training.schedule')} — {trainee.name}
        </h3>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <Input
            label={t('training.startsAt')}
            type="datetime-local"
            error={err('starts_at')}
            {...register('starts_at')}
          />
          <Input
            label={t('training.duration')}
            type="number"
            min={15}
            max={480}
            step={15}
            error={err('duration_minutes')}
            {...register('duration_minutes', { valueAsNumber: true })}
          />
          <Input
            label={t('training.meetingUrl')}
            type="url"
            dir="ltr"
            hint={t('training.meetingUrlHint')}
            error={err('meeting_url')}
            {...register('meeting_url')}
          />
          <Textarea label={t('training.notes')} rows={3} error={err('notes')} {...register('notes')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t('training.schedule')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
