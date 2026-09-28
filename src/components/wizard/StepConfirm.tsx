'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { useWizard } from '@/stores/wizard';
import { usePublicMeta } from '@/lib/meta';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Alert, Button, PriceTag, Textarea, useToast } from '@/components/ui';
import type { Booking, Payment } from '@/types/api';

export type TerminalState = { kind: 'success' | 'confirming'; bookingId: number } | null;

// §11.6 step 7 — submit POST /client/bookings and handle every outcome
export function StepConfirm({
  onTerminal,
  onGoTo,
  onSlotGone,
}: {
  onTerminal: (t: TerminalState) => void;
  onGoTo: (step: 'datetime' | 'payment') => void;
  onSlotGone: () => void; // re-fetch slots for the same date
}) {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const meta = usePublicMeta();
  const {
    pkg,
    consultant,
    date,
    time,
    location,
    paymentMethodId,
    cardToken,
    saveCard,
    clientNotes,
    quote,
    setTime,
    setQuote,
  } = useWizard();

  const requote = async () => {
    if (!pkg) return null;
    const { data } = await api.post('/client/bookings/quote', {
      package_id: pkg.id,
      consultant_id: consultant?.id,
      date,
      time,
    });
    const q = data.data as typeof quote;
    setQuote(q);
    return q;
  };

  const mutation = useMutation({
    mutationFn: () =>
      api
        .post('/client/bookings', {
          package_id: pkg!.id,
          consultant_id: consultant!.id,
          date,
          time,
          client_location_id: location!.id,
          ...(paymentMethodId
            ? { payment_method_id: paymentMethodId }
            : cardToken
              ? { card_token: cardToken, save_card: saveCard }
              : {}),
          ...(clientNotes.trim() ? { client_notes: clientNotes.trim() } : {}),
        })
        .then((r) => r.data.data as { booking: Booking; payment: Payment | null }),

    onSuccess: async ({ booking, payment }) => {
      queryClient.invalidateQueries({ queryKey: ['client'] });
      // covered by subscription, or instantly paid
      if (!payment || payment.status === 'paid') {
        onTerminal({ kind: 'success', bookingId: booking.id });
        return;
      }
      // 3-D Secure
      if (payment.status === 'initiated' && payment.transaction_url) {
        localStorage.setItem('pending_payment', JSON.stringify({ payment_id: payment.id, booking_id: booking.id }));
        if (meta.data?.payment_gateway.driver === 'fake') {
          // dev shortcut: the fake gateway always verifies as paid — skip the redirect
          try {
            const { data } = await api.post(`/client/payments/${payment.id}/verify`);
            const verified = (data.data as { payment: Payment }).payment;
            localStorage.removeItem('pending_payment');
            onTerminal({ kind: verified.status === 'paid' ? 'success' : 'confirming', bookingId: booking.id });
          } catch {
            onTerminal({ kind: 'confirming', bookingId: booking.id });
          }
          return;
        }
        window.location.href = payment.transaction_url;
        return;
      }
      onTerminal({ kind: 'success', bookingId: booking.id });
    },

    onError: async (e) => {
      if (!isApiError(e)) return;
      switch (e.code) {
        case 'PAYMENT_FAILED': // 402 — stay on the payment step with the message
          toast.error(e.message || t('wizard.paymentFailed'));
          onGoTo('payment');
          break;
        case 'SLOT_NOT_AVAILABLE': // 409 — the slot is gone, re-pick
          setTime(null);
          onSlotGone();
          toast.error(t('wizard.slotGone'));
          onGoTo('datetime');
          break;
        case 'PAYMENT_METHOD_REQUIRED': // 422
          toast.error(e.message);
          onGoTo('payment');
          break;
        case 'SUBSCRIPTION_EXHAUSTED': {
          // 422 — quota ran out mid-race: re-quote (flips to requires_payment) → step 6
          const q = await requote().catch(() => null);
          toast.error(e.message);
          if (q?.requires_payment) onGoTo('payment');
          break;
        }
        case 'PAYMENT_PENDING_CONFIRMATION': // 503 — gateway unreachable; charge may have gone through
          onTerminal({ kind: 'confirming', bookingId: 0 });
          break;
        case 'VALIDATION_ERROR':
          toast.error(Object.values(e.errors)[0]?.[0] ?? e.message);
          break;
        default:
          toast.error(e.message);
      }
    },
  });

  if (!pkg || !consultant || !date || !time || !location) return null;

  return (
    <div className="flex flex-col gap-6">
      {quote && !quote.requires_payment && (
        <Alert color="success" body={t('wizard.coveredBySubscription')} />
      )}
      {quote?.requires_payment && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-background px-5 py-4">
          <span className="text-muted">{t('wizard.total')}</span>
          <PriceTag formatted={quote.amount_formatted} className="text-xl" />
        </div>
      )}

      <Textarea
        label={t('wizard.notes')}
        value={clientNotes}
        onChange={(e) => useWizard.getState().setClientNotes(e.target.value)}
        rows={3}
        maxLength={1000}
      />

      <Button size="lg" onClick={() => mutation.mutate()} loading={mutation.isPending} className="self-start">
        {t('wizard.confirmBooking')}
      </Button>
    </div>
  );
}
