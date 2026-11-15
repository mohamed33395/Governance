'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { downloadFile } from '@/lib/files';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { reportReviewSchema, type ReportReviewValues } from '@/schemas/bookings';
import {
  Alert,
  Button,
  Drawer,
  LogoLoader,
  Modal,
  StatusBadge,
  Textarea,
  useToast,
} from '@/components/ui';
import type { Report, ReportReviewEntry } from '@/types/api';

type ReviewAction = 'approve' | 'reject' | 'return';

// RPT-02/02b/02c/04a-c — report details, review decisions and the full
// submission/decision history (each entry keeps its own file version).
export function ReportDrawer({ report, onClose }: { report: Report | null; onClose: () => void }) {
  const { t } = useI18n();
  const { can, type } = usePermissions();
  const [action, setAction] = useState<ReviewAction | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'reports', 'detail', report?.id],
    queryFn: () => api.get(`/admin/reports/${report!.id}`).then((r) => r.data.data as Report),
    enabled: !!report,
  });
  const details = query.data ?? report;

  const row = 'flex justify-between gap-3 py-2 border-b border-border/60 text-[0.9rem]';
  const reviewable = type === 'admin' && can('approve-reports') && details?.approval_status === 'pending_review';

  return (
    <Drawer open={!!report} onClose={onClose} title={details?.title ?? t('nav.reports')} width={480}>
      {details ? (
        <div className="flex flex-col gap-1">
          <div className={row}>
            <span className="text-muted">{t('common.status')}</span>
            <StatusBadge
              kind="reportApproval"
              value={details.approval_status}
              label={t(`reportApprovalStatus.${details.approval_status}`)}
            />
          </div>
          {details.booking && (
            <div className={row}>
              <span className="text-muted">{t('reports.booking')}</span>
              <span>
                <span dir="ltr">{details.booking.reference}</span> · {details.booking.date}{' '}
                <bdi dir="ltr">{details.booking.time}</bdi>
              </span>
            </div>
          )}
          {details.consultant && (
            <div className={row}>
              <span className="text-muted">{t('bookings.consultant')}</span>
              <span>{details.consultant.name}</span>
            </div>
          )}
          {details.client && (
            <div className={row}>
              <span className="text-muted">{t('nav.clients')}</span>
              <span>{details.client.company_name}</span>
            </div>
          )}
          {details.file && (
            <div className={row}>
              <span className="text-muted">{t('reports.file')}</span>
              <span>
                {details.file.name} <span className="text-muted">({details.file.size_human})</span>
              </span>
            </div>
          )}
          {details.summary && (
            <div className={row}>
              <span className="text-muted">{t('reports.summary')}</span>
              <span className="text-left">{details.summary}</span>
            </div>
          )}
          {details.review_note && (
            <div className={row}>
              <span className="text-muted">{t('reportReview.note')}</span>
              <span className="text-left">{details.review_note}</span>
            </div>
          )}
          {details.reviewed_by && (
            <div className={row}>
              <span className="text-muted">{t('reportReview.reviewedBy')}</span>
              <span>{details.reviewed_by.name}</span>
            </div>
          )}
          {details.reviewed_at && (
            <div className={row}>
              <span className="text-muted">{t('reportReview.reviewedAt')}</span>
              <span dir="ltr">{details.reviewed_at.slice(0, 16).replace('T', ' ')}</span>
            </div>
          )}
          <div className={row}>
            <span className="text-muted">{t('bookingsAdmin.createdAt')}</span>
            <span dir="ltr">{details.created_at.slice(0, 16).replace('T', ' ')}</span>
          </div>

          {details.approval_status === 'pending_review' && !reviewable && (
            <Alert color="info" body={t('reportReview.awaitingReview')} className="mt-4" />
          )}

          <div className="flex gap-2 flex-wrap mt-5">
            {can('download-reports') && details.file && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(`/admin/reports/${details.id}/download`, details.file!.name)}
              >
                {t('common.download')}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowHistory((v) => !v)}>
              {t('reportReview.history')}
            </Button>
          </div>

          {reviewable && (
            <div className="mt-5 rounded-xl border border-border p-4 flex flex-col gap-3">
              <strong className="text-[0.95rem]">{t('reportsAdmin.review')}</strong>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => setAction('approve')}>
                  {t('reportReview.approve')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAction('return')}>
                  {t('reportReview.return')}
                </Button>
                <Button size="sm" variant="danger" onClick={() => setAction('reject')}>
                  {t('reportReview.reject')}
                </Button>
              </div>
            </div>
          )}

          {showHistory && <HistorySection reportId={details.id} />}

          {action && (
            <ReviewDecisionModal reportId={details.id} action={action} onClose={() => setAction(null)} />
          )}

          {query.isLoading && <LogoLoader />}
        </div>
      ) : (
        <LogoLoader />
      )}
    </Drawer>
  );
}

// ---------- decision modal (approve / reject / return + optional note) ----------
function ReviewDecisionModal({
  reportId,
  action,
  onClose,
}: {
  reportId: number;
  action: ReviewAction;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReportReviewValues>({ resolver: zodResolver(reportReviewSchema) });

  const mutation = useMutation({
    mutationFn: (values: ReportReviewValues) =>
      api.post(`/admin/reports/${reportId}/${action}`, { note: values.note || undefined }),
    onSuccess: () => {
      toast.success(t('reportReview.done'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      onClose();
    },
    onError: (e) => {
      // 422 REPORT_REVIEW_NOT_ALLOWED → report no longer pending_review
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message);
    },
  });

  const err = (key?: string) => (key ? t(key) : undefined);

  return (
    <Modal
      open
      onClose={onClose}
      title={t(`reportReview.${action}Title`)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={action === 'approve' ? 'primary' : 'danger'}
            onClick={handleSubmit((v) => mutation.mutate(v))}
            loading={mutation.isPending || isSubmitting}
          >
            {t(`reportReview.${action}`)}
          </Button>
        </>
      }
    >
      <form noValidate className="flex flex-col gap-4">
        <Alert color={action === 'approve' ? 'success' : 'warning'} body={t(`reportReview.${action}Body`)} />
        <Textarea
          label={t('reportReview.note')}
          rows={3}
          maxLength={2000}
          error={err(errors.note?.message)}
          {...register('note')}
        />
      </form>
    </Modal>
  );
}

// ---------- version + decision history (RPT-02b/02c) ----------
function HistorySection({ reportId }: { reportId: number }) {
  const { t } = useI18n();
  const { can } = usePermissions();

  const query = useQuery({
    queryKey: ['admin', 'reports', 'history', reportId],
    queryFn: () => api.get(`/admin/reports/${reportId}/history`).then((r) => r.data.data as ReportReviewEntry[]),
  });
  const entries = query.data;

  if (query.isLoading || !entries) return <LogoLoader />;
  if (entries.length === 0) return <p className="text-muted text-[0.85rem] mt-4">{t('common.empty')}</p>;

  return (
    <div className="mt-5 flex flex-col gap-3">
      <strong className="text-[0.95rem]">{t('reportReview.history')}</strong>
      {entries.map((e) => (
        <div key={e.id} className="rounded-xl border border-border p-3.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <StatusBadge
              kind="reportApproval"
              value={e.status}
              label={t(`reportApprovalStatus.${e.status}`)}
            />
            <span className="text-muted text-[0.78rem]" dir="ltr">
              {e.created_at.slice(0, 16).replace('T', ' ')}
            </span>
          </div>
          <div className="text-[0.85rem]">
            {e.actor ? `${e.actor.name} · ` : ''}
            {e.file ? (
              <span className="text-muted">
                {e.file.name} ({e.file.size_human})
              </span>
            ) : null}
          </div>
          {e.note && <p className="text-[0.85rem] text-muted">{e.note}</p>}
          {can('download-reports') && e.download_url && (
            <div>
              <Button variant="ghost" size="sm" onClick={() => downloadFile(e.download_url!, e.file?.name)}>
                {t('reportReview.downloadVersion')}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
