'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { downloadFile } from '@/lib/files';
import { usePublicMeta } from '@/lib/meta';
import { useI18n } from '@/lib/i18n/i18n-context';
import {
  Alert,
  Avatar,
  Button,
  ConfirmDialog,
  CopyButton,
  ErrorState,
  PriceTag,
  StatusBadge,
  Textarea,
  useToast,
} from '@/components/ui';
import type { Booking } from '@/types/api';

// §12.3 — booking details (CLI-BKG-04) + cancel (CLI-BKG-05)
export default function ClientBookingDetailsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const meta = usePublicMeta();
  const cancelHours = meta.data?.booking.client_cancel_hours ?? 24;

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  const query = useQuery({
    queryKey: ['client', 'bookings', params.id],
    queryFn: () => api.get(`/client/bookings/${params.id}`).then((r) => r.data.data as Booking),
  });
  const booking = query.data;

  const cancel = useMutation({
    mutationFn: () =>
      api.post(`/client/bookings/${params.id}/cancel`, { reason: reason.trim() || undefined }),
    onSuccess: () => {
      toast.success(t('bookings.cancelled'));
      setCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: ['client'] });
    },
    onError: (e) => {
      if (isApiError(e)) toast.error(e.message); // e.g. BOOKING_CANCEL_WINDOW_PASSED
    },
  });

  if (query.isLoading) {
    return (
      <div className="page-loader">
        <span className="spinner" />
      </div>
    );
  }
  if (query.isError || !booking) return <ErrorState onRetry={() => query.refetch()} />;

  // client-side window hint (the backend enforces it regardless)
  const withinWindow = dayjs(booking.starts_at).diff(dayjs(), 'hour') >= cancelHours;
  const canCancel = booking.can.cancel && withinWindow;

  const card = 'bg-surface border border-border rounded-2xl p-5';
  const cardTitle = 'text-[0.95rem] mb-4 pb-3 border-b border-border';
  const row = 'flex justify-between gap-3 py-1.5 text-[0.9rem]';
  const label = 'text-muted';

  return (
    <>
      {/* header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/bookings" className="text-muted hover:text-accent text-[0.9rem]">
            <span className="inline-block rtl:-scale-x-100">‹</span> {t('common.back')}
          </Link>
          <h1 className="text-2xl" dir="ltr">
            {booking.reference}
          </h1>
          <StatusBadge kind="booking" value={booking.status} label={booking.status_label} />
        </div>
        {booking.can.cancel && (
          <span title={!withinWindow ? t('bookings.cancelWindow').replace('{hours}', String(cancelHours)) : undefined}>
            <Button variant="danger" size="sm" disabled={!withinWindow} onClick={() => setCancelOpen(true)}>
              {t('bookings.cancel')}
            </Button>
          </span>
        )}
      </div>

      {booking.refund_status === 'requested' && (
        <Alert color="warning" body={t('bookings.refundRequested')} className="mb-5" />
      )}
      {booking.can.cancel && !withinWindow && booking.status !== 'cancelled' && (
        <Alert color="info" body={t('bookings.cancelWindow').replace('{hours}', String(cancelHours))} className="mb-5" />
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* consultant */}
        <div className={card}>
          <h3 className={cardTitle}>{t('bookings.consultant')}</h3>
          <div className="flex items-center gap-3.5">
            <Avatar src={booking.consultant.avatar_thumb_url} name={booking.consultant.name} size="lg" />
            <div>
              <strong className="block">{booking.consultant.name}</strong>
              {booking.consultant.title && <span className="text-muted text-[0.85rem]">{booking.consultant.title}</span>}
              {booking.consultant.specialization && (
                <span className="block text-accent text-[0.82rem] mt-0.5">{booking.consultant.specialization}</span>
              )}
            </div>
          </div>
        </div>

        {/* package + date/time */}
        <div className={card}>
          <h3 className={cardTitle}>{t('bookings.package')}</h3>
          <div className={row}>
            <span className={label}>{t('bookings.package')}</span>
            <strong>{booking.package.name}</strong>
          </div>
          <div className={row}>
            <span className={label}>{t('common.date')}</span>
            <strong>{booking.date}</strong>
          </div>
          <div className={row}>
            <span className={label}>{t('common.time')}</span>
            <strong>
              <bdi dir="ltr">{booking.time}</bdi>
            </strong>
          </div>
          <div className={row}>
            <span className={label}>{t('bookings.duration')}</span>
            <strong>
              {booking.duration_minutes} {t('common.minutes')}
            </strong>
          </div>
        </div>

        {/* location (snapshot — always present) */}
        {booking.location && (
          <div className={card}>
            <h3 className={cardTitle}>{t('bookings.location')}</h3>
            <strong className="block">{booking.location.name}</strong>
            {booking.location.city && <span className="text-muted text-[0.88rem] block mt-1">{booking.location.city}</span>}
            <span className="text-muted text-[0.88rem] block mt-0.5">{booking.location.address}</span>
          </div>
        )}

        {/* meeting */}
        <div className={card}>
          <h3 className={cardTitle}>{t('bookings.meeting')}</h3>
          {booking.meeting.status === 'created' && booking.meeting.url ? (
            <div className="flex items-center gap-3 flex-wrap">
              <a href={booking.meeting.url} target="_blank" rel="noreferrer" className="text-accent underline text-[0.9rem] break-all" dir="ltr">
                {booking.meeting.url}
              </a>
              <CopyButton text={booking.meeting.url} />
            </div>
          ) : booking.meeting.status === 'pending' ? (
            <p className="text-muted text-[0.9rem]">{t('dashboard.meetingPending')}</p>
          ) : booking.meeting.status === 'failed' ? (
            <Alert color="danger" body={t('bookings.meetingFailed')} />
          ) : (
            <p className="text-muted text-[0.9rem]">—</p>
          )}
        </div>

        {/* payment summary */}
        <div className={card}>
          <h3 className={cardTitle}>{t('bookings.payment')}</h3>
          <div className={row}>
            <span className={label}>{t('common.status')}</span>
            <StatusBadge kind="bookingPayment" value={booking.payment_status} label={t(`paymentStatus.${booking.payment_status}`)} />
          </div>
          <div className={row}>
            <span className={label}>{t('wizard.total')}</span>
            <PriceTag formatted={booking.amount_formatted} />
          </div>
          {booking.payment?.card_brand && (
            <div className={row}>
              <span className={label}>{t('paymentMethods.title')}</span>
              <strong dir="ltr">
                {booking.payment.card_brand} •••• {booking.payment.card_last_four}
              </strong>
            </div>
          )}
        </div>

        {/* report */}
        {booking.report && (
          <div className={card}>
            <h3 className={cardTitle}>{t('bookings.report')}</h3>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <strong>{booking.report.title}</strong>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(`/client/reports/${booking.report!.id}/download`, booking.report!.file_name)}
              >
                {t('bookings.downloadReport')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* client notes */}
      {booking.client_notes && (
        <div className={`${card} mt-5`}>
          <h3 className={cardTitle}>{t('bookings.notes')}</h3>
          <p className="text-[0.92rem] leading-relaxed">{booking.client_notes}</p>
        </div>
      )}

      {/* cancel dialog */}
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => cancel.mutate()}
        title={t('bookings.cancel')}
        danger
        loading={cancel.isPending}
        confirmLabel={t('bookings.cancel')}
        body={
          <div className="flex flex-col gap-4">
            <p className="text-[0.92rem] text-muted leading-relaxed">{t('bookings.cancelConfirm')}</p>
            <Textarea
              label={t('bookings.cancelReason')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
        }
      />
    </>
  );
}
