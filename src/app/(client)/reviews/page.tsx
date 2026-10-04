'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { useI18n } from '@/lib/i18n/i18n-context';
import { reviewSchema, type ReviewValues } from '@/schemas/reviews';
import { Badge, Button, EmptyState, ErrorState, Input, Modal, Textarea, useToast } from '@/components/ui';
import type { Paginated, Review } from '@/types/api';

export default function ReviewsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [writeOpen, setWriteOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { name: '', title: '', comment: '', rating: 0 },
  });

  const listQuery = useQuery({
    queryKey: ['client', 'reviews'],
    queryFn: () => api.get('/client/reviews').then((r) => r.data as Paginated<Review>),
  });

  const submit = useMutation({
    mutationFn: (values: ReviewValues) => api.post('/client/reviews', values),
    onSuccess: () => {
      toast.success(t('reviews.submitted'));
      reset();
      setRating(0);
      setWriteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['client', 'reviews'] });
    },
    onError: (e) => {
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message);
    },
  });

  const err = (key?: string) => (key ? t(key) : undefined);

  const data = listQuery.data;

  return (
    <>
      <div className="client-card-head" style={{ marginBottom: 20 }}>
        <h3>{t('reviews.myReviews')}</h3>
        <Button size="sm" onClick={() => setWriteOpen(true)}>
          {t('reviews.write')}
        </Button>
      </div>

      {listQuery.isLoading ? (
        <div className="page-loader"><span className="spinner" /></div>
      ) : listQuery.isError || !data ? (
        <ErrorState onRetry={() => listQuery.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState
          title={t('reviews.noReviews')}
          action={
            <Button size="sm" onClick={() => setWriteOpen(true)}>
              {t('reviews.write')}
            </Button>
          }
        />
      ) : (
        <div className="client-review-list">
          {data.data.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      {/* write-review dialog */}
      <Modal open={writeOpen} onClose={() => setWriteOpen(false)} title={t('reviews.write')} size="sm">
        <form onSubmit={handleSubmit((v) => submit.mutate(v))}>
          {/* rating picker */}
          <div className="text-center mb-5">
            <span className="text-[0.82rem] text-muted block mb-2">{t('reviews.rating')}</span>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setRating(n);
                    setValue('rating', n, { shouldValidate: true });
                  }}
                  aria-label={`${n} / 5`}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    weight={n <= rating ? 'fill' : 'regular'}
                    className={n <= rating ? 'text-accent' : 'text-border'}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-[0.8rem] text-muted mt-2">{t(`reviews.ratingLabels.${rating}`)}</p>
            )}
            {errors.rating?.message && (
              <p className="text-xs text-danger mt-1">{t(errors.rating.message)}</p>
            )}
          </div>

          <Input
            label={t('reviews.name')}
            error={err(errors.name?.message)}
            {...register('name')}
          />
          <Input
            label={t('reviews.titleLabel')}
            error={err(errors.title?.message)}
            {...register('title')}
          />
          <Textarea
            label={t('reviews.comment')}
            rows={4}
            error={err(errors.comment?.message)}
            {...register('comment')}
          />
          <div className="flex justify-end mt-4">
            <Button type="submit" loading={isSubmitting || submit.isPending}>
              {t('reviews.submit')}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const { t } = useI18n();
  return (
    <div className="client-review-card">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={18}
            weight={n <= review.rating ? 'fill' : 'regular'}
            className={n <= review.rating ? 'text-accent' : 'text-border'}
          />
        ))}
        <Badge color={statusColor(review.status)} className="ms-auto">
          {review.status_label ?? t(`reviews.statuses.${review.status}`)}
        </Badge>
      </div>
      {review.title && <h4 className="font-semibold mt-2">{review.title}</h4>}
      <p className="client-review-text">{review.comment}</p>
      {review.rejection_reason && (
        <p className="text-sm text-danger mt-2">
          {t('reviews.rejectionReason')}: {review.rejection_reason}
        </p>
      )}
      <div className="client-review-author">
        <div className="client-review-avatar">{review.name.slice(0, 2)}</div>
        <div className="client-review-meta">
          <strong>{review.name}</strong>
          <span>{review.created_at.slice(0, 10)}</span>
        </div>
      </div>
    </div>
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
