'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWizard } from '@/stores/wizard';
import { useClientAuth } from '@/stores/client-auth';
import { useI18n } from '@/lib/i18n/i18n-context';
import { EmptyState, ErrorState, useToast } from '@/components/ui';
import { WizardSummary } from '@/components/wizard/WizardSummary';
import { StepAccount } from '@/components/wizard/StepAccount';
import { StepConsultant } from '@/components/wizard/StepConsultant';
import { StepDateTime } from '@/components/wizard/StepDateTime';
import { StepLocation } from '@/components/wizard/StepLocation';
import { StepPayment } from '@/components/wizard/StepPayment';
import { StepConfirm, type TerminalState } from '@/components/wizard/StepConfirm';
import { BookingResult } from '@/components/wizard/BookingResult';
import type { Package, Quote } from '@/types/api';

type StepKey = 'account' | 'consultant' | 'datetime' | 'location' | 'payment' | 'confirm';

const STEP_LABELS: Record<StepKey, string> = {
  account: 'wizard.stepAccount',
  consultant: 'wizard.stepConsultant',
  datetime: 'wizard.stepDateTime',
  location: 'wizard.stepLocation',
  payment: 'wizard.stepPayment',
  confirm: 'wizard.stepConfirm',
};

// §11 — the booking wizard (core flow)
export default function BookingWizardPage() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{ packageSlug: string }>();
  const slug = params.packageSlug;

  const token = useClientAuth((s) => s.token);
  const wizard = useWizard();
  const { pkg, consultant, date, time, location, paymentMethodId, cardToken, quote } = wizard;

  // logged-out users start at the account step, logged-in users skip it
  const [step, setStep] = useState<StepKey>(() => (useClientAuth.getState().token ? 'consultant' : 'account'));
  const [terminal, setTerminal] = useState<TerminalState>(null);

  // step 1 — load the full package by slug (PUB-02)
  const pkgQuery = useQuery({
    queryKey: ['public', 'packages', slug],
    queryFn: () => api.get(`/public/packages/${slug}`).then((r) => r.data.data as Package),
  });

  useEffect(() => {
    if (pkgQuery.data) wizard.setPackage(slug, pkgQuery.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkgQuery.data, slug]);

  // fresh store per package / on leave
  useEffect(() => {
    return () => useWizard.getState().reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // §11.4 — refresh the quote whenever package/consultant/date/time changes (debounced)
  useEffect(() => {
    if (!token || !pkg) return;
    const id = setTimeout(async () => {
      try {
        const { data } = await api.post('/client/bookings/quote', {
          package_id: pkg.id,
          consultant_id: consultant?.id ?? undefined,
          date: date ?? undefined,
          time: time ?? undefined,
        });
        const q = data.data as Quote;
        useWizard.getState().setQuote(q);
        if (q.slot_available === false && time) {
          useWizard.getState().setTime(null);
          queryClient.invalidateQueries({ queryKey: ['public', 'consultants', consultant?.id, 'slots', date] });
          toast.error(t('wizard.slotGone'));
        }
      } catch {
        /* quote errors are re-validated on submit */
      }
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, pkg?.id, consultant?.id, date, time]);

  // the visible steps: account skipped with a token, payment skipped when the
  // subscription covers the booking (§11.4)
  const steps = useMemo<StepKey[]>(() => {
    const list: StepKey[] = [];
    if (!token) list.push('account');
    list.push('consultant', 'datetime', 'location');
    if (quote?.requires_payment !== false) list.push('payment');
    list.push('confirm');
    return list;
  }, [token, quote?.requires_payment]);

  // if the current step vanished (logged in / subscription covers it), advance
  // to the next step in the canonical order that still exists
  const ORDER: StepKey[] = ['account', 'consultant', 'datetime', 'location', 'payment', 'confirm'];
  useEffect(() => {
    if (!steps.includes(step)) {
      const after = ORDER.slice(ORDER.indexOf(step) + 1).find((k) => steps.includes(k));
      setStep(after ?? steps[steps.length - 1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, step]);

  const canEnter = (s: StepKey): boolean => {
    switch (s) {
      case 'account':
        return true;
      case 'consultant':
        return !!token;
      case 'datetime':
        return !!consultant;
      case 'location':
        return !!date && !!time;
      case 'payment':
        return !!location;
      case 'confirm':
        return (
          !!location &&
          (quote?.requires_payment === false || !!paymentMethodId || !!cardToken)
        );
    }
  };

  const index = steps.indexOf(step);
  const goNext = () => {
    const next = steps[index + 1];
    if (next && canEnter(next)) setStep(next);
  };
  const goPrev = () => {
    const prev = steps[index - 1];
    if (prev) setStep(prev);
  };

  if (pkgQuery.isLoading) {
    return (
      <div className="page-loader" style={{ minHeight: '50vh' }}>
        <span className="spinner" />
      </div>
    );
  }
  if (pkgQuery.isError || !pkgQuery.data) {
    return (
      <div className="section-padding container">
        {pkgQuery.isError ? (
          <ErrorState onRetry={() => pkgQuery.refetch()} />
        ) : (
          <EmptyState title={t('common.empty')} />
        )}
      </div>
    );
  }

  if (terminal) {
    return (
      <div className="section-padding container">
        <BookingResult kind={terminal.kind} bookingId={terminal.bookingId} />
      </div>
    );
  }

  return (
    <div className="section-padding container">
      <div className="max-w-4xl mx-auto mb-16">
      {/* stepper */}
      <ol className="flex items-center justify-center gap-1.5 flex-wrap mb-8" aria-label="steps">
        {steps.map((s, i) => {
          const done = i < index;
          const current = i === index;
          return (
            <li key={s} className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!done && !current}
                onClick={() => done && setStep(s)}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.82rem] transition-colors ${
                  current
                    ? 'bg-primary text-primary-foreground'
                    : done
                      ? 'bg-accent/15 text-accent cursor-pointer'
                      : 'bg-surface text-muted border border-border'
                }`}
                aria-current={current ? 'step' : undefined}
              >
                <span
                  className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[0.7rem] font-bold ${
                    current ? 'bg-accent text-accent-foreground' : done ? 'bg-accent text-accent-foreground' : 'bg-border text-muted'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                {t(STEP_LABELS[s])}
              </button>
              {i < steps.length - 1 && <span className="text-border select-none">‹</span>}
            </li>
          );
        })}
      </ol>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
        <WizardSummary />

        <div className="bg-surface border border-border rounded-2xl p-5 sm:p-7 min-h-[480px]" style={{ boxShadow: 'var(--shadow)' }}>
          <h2 className="text-lg mb-5">{t(STEP_LABELS[step])}</h2>

          {step === 'account' && <StepAccount onDone={goNext} />}
          {step === 'consultant' && <StepConsultant />}
          {step === 'datetime' && <StepDateTime />}
          {step === 'location' && <StepLocation />}
          {step === 'payment' && <StepPayment />}
          {step === 'confirm' && (
            <StepConfirm
              onTerminal={setTerminal}
              onGoTo={(s) => setStep(s)}
              onSlotGone={() =>
                queryClient.invalidateQueries({ queryKey: ['public', 'consultants', consultant?.id, 'slots', date] })
              }
            />
          )}

          {step !== 'account' && step !== 'confirm' && (
            <div className="flex justify-between mt-6 pt-5 border-t border-border">
              <button
                type="button"
                onClick={goPrev}
                className="text-muted hover:text-accent text-[0.9rem] transition-colors cursor-pointer bg-transparent border-none inline-flex items-center gap-1.5"
              >
                <span className="inline-block rtl:-scale-x-100">‹</span> {t('common.prev')}
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canEnter(steps[index + 1] ?? 'confirm')}
                className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {t('common.next')} <span className="inline-block rtl:-scale-x-100">›</span>
              </button>
            </div>
          )}
          {step === 'confirm' && (
            <div className="mt-6 pt-5 border-t border-border">
              <button
                type="button"
                onClick={goPrev}
                className="text-muted hover:text-accent text-[0.9rem] transition-colors cursor-pointer bg-transparent border-none inline-flex items-center gap-1.5"
              >
                <span className="inline-block rtl:-scale-x-100">‹</span> {t('common.prev')}
              </button>
            </div>
          )}
        </div>

      </div>
      </div>
    </div>
  );
}
