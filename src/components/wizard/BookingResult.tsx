'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Alert, Button, CopyButton } from '@/components/ui';
import type { Booking } from '@/types/api';

// §11.6 terminal screens — booking success / payment being confirmed.
// The Meet link is created async: poll the booking a few times until
// meeting.status === 'created'.
export function BookingResult({ kind, bookingId }: { kind: 'success' | 'confirming'; bookingId: number }) {
  const { t } = useI18n();
  const attempts = useRef(0);

  const query = useQuery({
    queryKey: ['client', 'bookings', bookingId],
    queryFn: () => api.get(`/client/bookings/${bookingId}`).then((r) => r.data.data as Booking),
    enabled: bookingId > 0,
    refetchInterval: (q) => {
      const b = q.state.data;
      if (kind === 'confirming') return 30_000; // §11.6: poll after ~30 s
      if (b && b.meeting.status !== 'created' && attempts.current < 5) {
        attempts.current += 1;
        return 3_000;
      }
      return false;
    },
  });
  const booking = query.data;

  return (
    <div className="max-w-xl mx-auto text-center py-10">
      <span
        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
        style={{
          background: kind === 'success' ? 'var(--success-soft)' : 'var(--warning-soft)',
          color: kind === 'success' ? 'var(--success)' : 'var(--warning)',
        }}
      >
        {kind === 'success' ? (
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        )}
      </span>

      <h2 className="text-2xl mb-3">
        {kind === 'success' ? t('wizard.bookingSuccess') : t('wizard.paymentConfirming')}
      </h2>

      {kind === 'confirming' && (
        <Alert color="warning" body={t('wizard.paymentConfirmingBody')} className="text-start mb-6" />
      )}

      {booking && (
        <div className="bg-surface border border-border rounded-2xl p-6 text-start mb-6" style={{ boxShadow: 'var(--shadow)' }}>
          <div className="flex justify-between gap-3 py-2 border-b border-border/60">
            <span className="text-muted text-[0.88rem]">{t('wizard.bookingReference')}</span>
            <strong dir="ltr">{booking.reference}</strong>
          </div>
          <div className="flex justify-between gap-3 py-2 border-b border-border/60">
            <span className="text-muted text-[0.88rem]">{t('wizard.stepConsultant')}</span>
            <strong>{booking.consultant.name}</strong>
          </div>
          <div className="flex justify-between gap-3 py-2 border-b border-border/60">
            <span className="text-muted text-[0.88rem]">{t('wizard.stepDateTime')}</span>
            <strong>
              {booking.date} · <bdi dir="ltr">{booking.time}</bdi>
            </strong>
          </div>
          <div className="flex justify-between items-center gap-3 py-2">
            <span className="text-muted text-[0.88rem]">{t('wizard.meetingLink')}</span>
            {booking.meeting.status === 'created' && booking.meeting.url ? (
              <span className="flex items-center gap-2">
                <a href={booking.meeting.url} target="_blank" rel="noreferrer" className="text-accent underline text-[0.88rem]" dir="ltr">
                  {booking.meeting.url}
                </a>
                <CopyButton text={booking.meeting.url} />
              </span>
            ) : (
              <span className="text-muted text-[0.85rem]">{t('wizard.meetingPending')}</span>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center flex-wrap">
        {booking ? (
          <Link href={`/bookings/${booking.id}`}>
            <Button variant="primary">{t('wizard.viewBooking')}</Button>
          </Link>
        ) : (
          <Link href="/bookings">
            <Button variant="primary">{t('wizard.checkBookings')}</Button>
          </Link>
        )}
        <Link href="/dashboard">
          <Button variant="ghost">{t('nav.dashboard')}</Button>
        </Link>
      </div>
    </div>
  );
}
