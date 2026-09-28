'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Alert, Button } from '@/components/ui';
import { BookingResult } from '@/components/wizard/BookingResult';
import type { Booking, Payment } from '@/types/api';

type Pending = { payment_id: number; booking_id: number };

// §11.7 — /bookings/payment-callback: the 3DS return page.
// Moyasar's query params are NOT trusted — always verify against our API.
export default function PaymentCallbackPage() {
  const { t } = useI18n();
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'missing' }
    | { kind: 'success'; bookingId: number }
    | { kind: 'failed' }
    | { kind: 'confirming'; bookingId: number }
  >({ kind: 'loading' });
  const tries = useRef(0);

  useEffect(() => {
    const raw = localStorage.getItem('pending_payment');
    if (!raw) {
      setState({ kind: 'missing' });
      return;
    }
    let pending: Pending;
    try {
      pending = JSON.parse(raw) as Pending;
    } catch {
      setState({ kind: 'missing' });
      return;
    }

    let cancelled = false;
    const verify = async () => {
      try {
        // CLI-PAY-02 — idempotent, call freely on page load.
        // Response: data { booking, payment }
        const { data } = await api.post(`/client/payments/${pending.payment_id}/verify`);
        if (cancelled) return;
        const payment = (data.data as { booking: Booking; payment: Payment }).payment;
        if (payment.status === 'paid') {
          localStorage.removeItem('pending_payment');
          setState({ kind: 'success', bookingId: pending.booking_id });
        } else if (payment.status === 'failed') {
          localStorage.removeItem('pending_payment');
          setState({ kind: 'failed' });
        } else if (tries.current < 5) {
          // still initiated — poll again in a few seconds (max ~5 tries)
          tries.current += 1;
          setTimeout(verify, 4_000);
        } else {
          localStorage.removeItem('pending_payment');
          setState({ kind: 'confirming', bookingId: pending.booking_id });
        }
      } catch (e) {
        if (cancelled) return;
        if (isApiError(e) && e.code === 'PAYMENT_PENDING_CONFIRMATION') {
          // 503 — gateway unreachable; the charge may have gone through
          localStorage.removeItem('pending_payment');
          setState({ kind: 'confirming', bookingId: pending.booking_id });
        } else if (tries.current < 5) {
          tries.current += 1;
          setTimeout(verify, 4_000);
        } else {
          localStorage.removeItem('pending_payment');
          setState({ kind: 'confirming', bookingId: pending.booking_id });
        }
      }
    };
    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === 'loading') {
    return (
      <div className="page-loader" style={{ minHeight: '40vh' }}>
        <span className="spinner" />
      </div>
    );
  }

  if (state.kind === 'missing') {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-muted mb-6">{t('wizard.callbackMissing')}</p>
        <Link href="/bookings">
          <Button variant="primary">{t('wizard.checkBookings')}</Button>
        </Link>
      </div>
    );
  }

  if (state.kind === 'failed') {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <Alert color="danger" title={t('wizard.paymentFailed')} body={t('wizard.paymentFailedBody')} className="text-start mb-6" />
        <Link href="/packages">
          <Button variant="primary">{t('wizard.tryAgain')}</Button>
        </Link>
      </div>
    );
  }

  return <BookingResult kind={state.kind === 'success' ? 'success' : 'confirming'} bookingId={state.bookingId} />;
}
