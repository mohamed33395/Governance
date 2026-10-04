'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePermissions } from '@/lib/permissions';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { useBreadcrumbLabel } from '@/components/admin/Breadcrumbs';
import { Alert, Avatar, Badge, Button, ErrorState, Modal, Textarea, useToast } from '@/components/ui';
import type { Review } from '@/types/api';

const card = 'bg-surface border border-border rounded-2xl p-5';
const cardTitle = 'text-[0.95rem] mb-4 pb-3 border-b border-border';
const infoRow = 'flex justify-between gap-3 py-1.5 text-[0.9rem]';
const infoLabel = 'text-muted';

export default function AdminReviewDetailPage() {
  return (
    <RequirePermission perm="view-reviews">
      <ReviewDetailInner />
    </RequirePermission>
  );
}

function ReviewDetailInner() {
  const { id } = useParams<{ id: string }>();
  const reviewId = Number(id);
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const query = useQuery({
    queryKey: ['admin', 'reviews', reviewId],
    queryFn: () => api.get(`/admin/reviews/${reviewId}`).then((r) => r.data.data as Review),
  });
  const review = query.data;
  useBreadcrumbLabel(review ? `#${review.id}` : null);

  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews', reviewId] });

  const approve = useMutation({
    mutationFn: () => api.patch(`/admin/reviews/${reviewId}/approve`),
    onSuccess: () => {
      toast.success(t('reviews.approved'));
      invalidate();
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: (reason: string) => api.patch(`/admin/reviews/${reviewId}/reject`, { reason }),
    onSuccess: () => {
      toast.success(t('reviews.rejected'));
      setShowReject(false);
      setRejectReason('');
      invalidate();
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  if (query.isLoading) {
    return (
      <div className="page-loader">
        <span className="spinner" />
      </div>
    );
  }
  if (query.isError || !review) {
    return <ErrorState onRetry={() => query.refetch()} />;
  }

  return (
    <>
      {/* header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/admin/reviews" className="text-muted hover:text-accent text-[0.9rem]">
            <span className="inline-block rtl:-scale-x-100">‹</span> {t('common.back')}
          </Link>
          <h1 className="text-2xl">
            {t('reviews.detail')} #{review.id}
          </h1>
          <Badge color={statusColor(review.status)}>
            {review.status_label ?? t(`reviews.statuses.${review.status}`)}
          </Badge>
          <span className="text-muted text-[0.9rem]" dir="ltr">
            {review.created_at.slice(0, 16).replace('T', ' ')}
          </span>
        </div>

        {review.status === 'pending' && can('manage-reviews') && (
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => approve.mutate()} loading={approve.isPending}>
              {t('reviews.approve')}
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowReject(true)}>
              {t('reviews.reject')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_330px] gap-5 items-start">
        {/* review content */}
        <div className={card}>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={22}
                weight={n <= review.rating ? 'fill' : 'regular'}
                className={n <= review.rating ? 'text-accent' : 'text-border'}
              />
            ))}
            <span className="text-muted text-[0.85rem]" dir="ltr">
              {review.rating}/5
            </span>
          </div>

          {review.title && <h3 className="mb-2">{review.title}</h3>}
          <p className="text-[1.02rem] leading-relaxed whitespace-pre-wrap">{review.comment}</p>

          {review.rejection_reason && (
            <Alert
              color="danger"
              title={t('reviews.rejectionReason')}
              body={review.rejection_reason}
              className="mt-5"
            />
          )}
        </div>

        {/* sidebar */}
        <div className="flex flex-col gap-5">
          {/* reviewer */}
          <div className={card}>
            <h3 className={cardTitle}>{t('nav.clients')}</h3>
            <div className="flex items-center gap-3.5">
              <Avatar src={null} name={review.name} size="lg" />
              <div className="min-w-0">
                <strong className="block truncate">{review.name}</strong>
                {review.client?.company_name && (
                  <span className="text-muted text-[0.86rem] block truncate">
                    {review.client.company_name}
                  </span>
                )}
                {review.client?.name && review.client.name !== review.name && (
                  <span className="text-muted text-[0.82rem] block truncate">{review.client.name}</span>
                )}
              </div>
              {review.client && can('view-clients') && (
                <Link href={`/admin/clients/${review.client.id}`} className="ms-auto shrink-0">
                  <Button variant="ghost" size="sm">
                    {t('common.view')}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* meta */}
          <div className={card}>
            <h3 className={cardTitle}>{t('reviews.info')}</h3>
            <div className={infoRow}>
              <span className={infoLabel}>{t('reviews.status')}</span>
              <Badge color={statusColor(review.status)}>
                {review.status_label ?? t(`reviews.statuses.${review.status}`)}
              </Badge>
            </div>
            <div className={infoRow}>
              <span className={infoLabel}>{t('reviews.rating')}</span>
              <span dir="ltr">{review.rating}/5</span>
            </div>
            <div className={infoRow}>
              <span className={infoLabel}>{t('common.date')}</span>
              <span dir="ltr">{review.created_at.slice(0, 16).replace('T', ' ')}</span>
            </div>
            {review.published_at && (
              <div className={infoRow}>
                <span className={infoLabel}>{t('reviews.publishedAt')}</span>
                <span dir="ltr">{review.published_at.slice(0, 16).replace('T', ' ')}</span>
              </div>
            )}
            {review.reviewed_at && (
              <div className={infoRow}>
                <span className={infoLabel}>{t('reviews.reviewedAt')}</span>
                <span dir="ltr">{review.reviewed_at.slice(0, 16).replace('T', ' ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* reject modal */}
      <Modal
        open={showReject}
        onClose={() => setShowReject(false)}
        title={t('reviews.reject')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowReject(false)} disabled={reject.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => reject.mutate(rejectReason)}
              loading={reject.isPending}
              disabled={!rejectReason.trim()}
            >
              {t('reviews.reject')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted mb-4">{t('reviews.rejectConfirm')}</p>
        <Textarea
          label={t('reviews.rejectReason')}
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </>
  );
}

function statusColor(status: Review['status']) {
  switch (status) {
    case 'pending':
      return 'amber';
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    default:
      return 'gray';
  }
}
