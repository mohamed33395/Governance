'use client';

import { useBreadcrumbLabel } from '@/components/admin/Breadcrumbs';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { downloadFile } from '@/lib/files';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ReportUploadModal } from '@/components/admin/ReportUploadModal';
import { RequirePermission } from '@/components/admin/RequirePermission';
import {
  Alert,
  Avatar,
  Button,
  ConfirmDialog,
  CopyButton,
  ErrorState,
  Modal,
  PriceTag,
  StatusBadge,
  Textarea,
  useToast,
} from '@/components/ui';
import type { Booking } from '@/types/api';

// §13.8 — booking details + actions (BKG-02..07)
export default function AdminBookingDetailsPage() {
  return (
    <RequirePermission perm="view-bookings">
      <DetailsInner />
    </RequirePermission>
  );
}

const card = 'bg-surface border border-border rounded-2xl p-5';
const cardTitle = 'text-[0.95rem] mb-4 pb-3 border-b border-border';
const row = 'flex justify-between gap-3 py-1.5 text-[0.9rem]';
const label = 'text-muted';

function DetailsInner() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const { can } = usePermissions();

  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string>();
  const pollAttempts = useRef(0);

  const query = useQuery({
    queryKey: ['admin', 'bookings', params.id],
    queryFn: () => api.get(`/admin/bookings/${params.id}`).then((r) => r.data.data as Booking),
    // meeting link is created async — poll a few times while pending
    refetchInterval: (q) => {
      const b = q.state.data;
      if (b?.meeting.status === 'pending' && pollAttempts.current < 5) {
        pollAttempts.current += 1;
        return 3_000;
      }
      return false;
    },
  });
  const booking = query.data;
  useBreadcrumbLabel(booking?.reference);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'bookings', params.id] });

  const complete = useMutation({
    mutationFn: () => api.post(`/admin/bookings/${params.id}/complete`, { notes: notes.trim() || undefined }),
    onSuccess: () => {
      toast.success(t('bookingsAdmin.completed'));
      setCompleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => isApiError(e) && toast.error(e.message), // BOOKING_NOT_STARTED etc.
  });

  const cancel = useMutation({
    mutationFn: () => api.post(`/admin/bookings/${params.id}/cancel`, { reason: reason.trim() }),
    onSuccess: () => {
      toast.success(t('bookings.cancelled'));
      setCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  const regenerateMeeting = useMutation({
    mutationFn: () => api.post(`/admin/bookings/${params.id}/meeting`, { notify_client: true }),
    onSuccess: () => {
      toast.success(t('bookingsAdmin.meetingCreated'));
      pollAttempts.current = 0;
      invalidate();
    },
    onError: (e) => isApiError(e) && toast.error(e.message), // 502 MEETING_CREATION_FAILED
  });

  const markRefunded = useMutation({
    mutationFn: () => api.post(`/admin/bookings/${params.id}/mark-refunded`),
    onSuccess: () => {
      toast.success(t('bookingsAdmin.refunded'));
      setRefundOpen(false);
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
  if (query.isError || !booking) return <ErrorState onRetry={() => query.refetch()} />;

  // §13.8 — booking.can + §7.2 permissions drive the action buttons
  const showComplete = booking.can.complete && can('complete-bookings');
  const showCancel = booking.can.cancel && can('cancel-bookings');
  const showMeeting = booking.status === 'pending' && can('manage-meetings');
  const showRefund = booking.refund_status === 'requested' && can('refund-payments');
  const showUpload = booking.can.upload_report && can('upload-reports');

  return (
    <>
      {/* header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/admin/bookings" className="text-muted hover:text-accent text-[0.9rem]">
            <span className="inline-block rtl:-scale-x-100">‹</span> {t('common.back')}
          </Link>
          <h1 className="text-2xl" dir="ltr">
            {booking.reference}
          </h1>
          <StatusBadge kind="booking" value={booking.status} label={booking.status_label} />
          <span className="text-muted text-[0.9rem]">
            {booking.date} · <bdi dir="ltr">{booking.time}</bdi> · {booking.duration_minutes} {t('common.minutes')}
          </span>
        </div>

        {/* actions bar */}
        <div className="flex gap-2 flex-wrap">
          {showComplete && (
            <Button size="sm" onClick={() => setCompleteOpen(true)}>
              {t('bookingsAdmin.complete')}
            </Button>
          )}
          {showUpload && (
            <Button size="sm" variant="gold" onClick={() => setUploadOpen(true)}>
              {t('reportsAdmin.upload')}
            </Button>
          )}
          {showCancel && (
            <Button size="sm" variant="danger" onClick={() => setCancelOpen(true)}>
              {t('bookings.cancel')}
            </Button>
          )}
        </div>
      </div>

      {booking.refund_status === 'requested' && (
        <Alert
          color="warning"
          body={t('bookings.refundRequested')}
          className="mb-5"
          title={t('bookingsAdmin.refundPending')}
        />
      )}
      {booking.refund_status === 'refunded' && (
        <Alert color="success" body={t('bookingsAdmin.refundDone')} className="mb-5" />
      )}
      {showRefund && (
        <div className="mb-5">
          <Button size="sm" variant="outline" onClick={() => setRefundOpen(true)}>
            {t('bookingsAdmin.markRefunded')}
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* left column */}
        <div className="flex flex-col gap-5">
          {/* client */}
          {booking.client && (
            <div className={card}>
              <h3 className={cardTitle}>{t('nav.clients')}</h3>
              <div className="flex items-center gap-3.5">
                <Avatar src={null} name={booking.client.name} size="lg" />
                <div>
                  <strong className="block">{booking.client.name}</strong>
                  <span className="text-muted text-[0.86rem] block">{booking.client.company_name}</span>
                  <span className="text-muted text-[0.82rem] block" dir="ltr">
                    {booking.client.email} · {booking.client.phone}
                  </span>
                </div>
                <Link href={`/admin/clients/${booking.client.id}`} className="ms-auto">
                  <Button variant="ghost" size="sm">
                    {t('common.view')}
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* location (snapshot) */}
          {booking.location && (
            <div className={card}>
              <h3 className={cardTitle}>{t('bookings.location')}</h3>
              <strong className="block">{booking.location.name}</strong>
              {booking.location.city && <span className="text-muted text-[0.88rem] block mt-1">{booking.location.city}</span>}
              <span className="text-muted text-[0.88rem] block mt-0.5">{booking.location.address}</span>
            </div>
          )}

          {/* client notes */}
          {booking.client_notes && (
            <div className={card}>
              <h3 className={cardTitle}>{t('bookings.notes')}</h3>
              <p className="text-[0.92rem] leading-relaxed">{booking.client_notes}</p>
            </div>
          )}

          {/* payment */}
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

            {/* payments history */}
            {booking.payments && booking.payments.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/60">
                {booking.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-1.5 text-[0.85rem] flex-wrap">
                    <StatusBadge kind="payment" value={p.status} label={p.status_label ?? t(`paymentStatus.${p.status}`)} />
                    <span dir="ltr" className="text-muted">
                      {p.card_brand ? `${p.card_brand} •••• ${p.card_last_four}` : `#${p.id}`}
                    </span>
                    <span className="text-muted">{p.paid_at ? p.paid_at.slice(0, 16).replace('T', ' ') : p.created_at.slice(0, 16).replace('T', ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* right column */}
        <div className="flex flex-col gap-5">
          {/* consultant */}
          <div className={card}>
            <h3 className={cardTitle}>{t('bookings.consultant')}</h3>
            <div className="flex items-center gap-3.5">
              <Avatar src={booking.consultant.avatar_thumb_url} name={booking.consultant.name} size="lg" />
              <div>
                <strong className="block">{booking.consultant.name}</strong>
                {booking.consultant.title && <span className="text-muted text-[0.85rem]">{booking.consultant.title}</span>}
              </div>
              <Link href={`/admin/consultants/${booking.consultant.id}`} className="ms-auto">
                <Button variant="ghost" size="sm">
                  {t('common.view')}
                </Button>
              </Link>
            </div>
          </div>

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
              <div className="flex flex-col gap-3">
                <Alert color="danger" body={t('bookingsAdmin.meetingFailed')} />
                {showMeeting && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="self-start"
                    onClick={() => regenerateMeeting.mutate()}
                    loading={regenerateMeeting.isPending}
                  >
                    {t('bookingsAdmin.regenerateMeeting')}
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-muted text-[0.9rem]">—</p>
            )}
            {showMeeting && booking.meeting.status !== 'failed' && booking.meeting.status !== 'none' && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => regenerateMeeting.mutate()}
                  loading={regenerateMeeting.isPending}
                >
                  {t('bookingsAdmin.regenerateMeeting')}
                </Button>
              </div>
            )}
          </div>

          {/* report */}
          <div className={card}>
            <h3 className={cardTitle}>{t('bookings.report')}</h3>
            {booking.report ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <strong className="block">{booking.report.title}</strong>
                  <span className="text-muted text-[0.82rem]">{booking.report.uploaded_at.slice(0, 10)}</span>
                </div>
                {can('download-reports') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(`/admin/reports/${booking.report!.id}/download`, booking.report!.file_name)}
                  >
                    {t('common.download')}
                  </Button>
                )}
              </div>
            ) : (
              <StatusBadge kind="report" value={booking.report_status} label={t(`reportStatus.${booking.report_status}`)} />
            )}
          </div>

          {/* timeline */}
          <div className={card}>
            <h3 className={cardTitle}>{t('bookingsAdmin.timeline')}</h3>
            <ul className="flex flex-col gap-2.5 text-[0.88rem]">
              <TimelineRow label={t('bookingsAdmin.createdAt')} value={booking.created_at} />
              {booking.payments?.find((p) => p.paid_at) && (
                <TimelineRow label={t('bookingsAdmin.paidAt')} value={booking.payments.find((p) => p.paid_at)!.paid_at!} />
              )}
              <TimelineRow label={t('bookingsAdmin.completedAt')} value={booking.completed_at} />
              <TimelineRow label={t('bookingsAdmin.cancelledAt')} value={booking.cancelled_at} />
              {booking.cancellation_reason && (
                <li className="text-[0.85rem]">
                  <span className={label}>{t('bookings.cancelReason')}: </span>
                  {booking.cancellation_reason}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* complete modal (optional notes) */}
      <Modal
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        title={t('bookingsAdmin.complete')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCompleteOpen(false)} disabled={complete.isPending}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => complete.mutate()} loading={complete.isPending}>
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        <Textarea
          label={t('bookingsAdmin.completeNotes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
        />
      </Modal>

      {/* cancel modal (reason required) */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={t('bookings.cancel')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)} disabled={cancel.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              loading={cancel.isPending}
              onClick={() => {
                if (!reason.trim()) {
                  setReasonError(t('required'));
                  return;
                }
                setReasonError(undefined);
                cancel.mutate();
              }}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        <Textarea
          label={t('bookings.cancelReason')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          required
          error={reasonError}
        />
      </Modal>

      {/* mark refunded — warns about the linked subscription */}
      <ConfirmDialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        onConfirm={() => markRefunded.mutate()}
        title={t('bookingsAdmin.markRefunded')}
        body={t('bookingsAdmin.markRefundedWarn')}
        danger
        loading={markRefunded.isPending}
      />

      {uploadOpen && (
        <ReportUploadModal
          bookingId={booking.id}
          hasExistingReport={!!booking.report}
          onClose={() => setUploadOpen(false)}
          onSaved={() => {
            setUploadOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin'] });
          }}
        />
      )}
    </>
  );
}

function TimelineRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <li className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span dir="ltr">{value.slice(0, 16).replace('T', ' ')}</span>
    </li>
  );
}
