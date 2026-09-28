'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWizard } from '@/stores/wizard';
import { useI18n } from '@/lib/i18n/i18n-context';
import { CardForm } from '@/components/payment/CardForm';
import { Checkbox, ErrorState, Radio } from '@/components/ui';
import type { PaymentMethod } from '@/types/api';

// §11.5 step 6 — saved cards (CLI-PM-01) or a new card via <CardForm>
export function StepPayment() {
  const { t } = useI18n();
  const { paymentMethodId, cardToken, saveCard, setPaymentMethod, setCardToken, setSaveCard } = useWizard();
  const [mode, setMode] = useState<'saved' | 'new'>(paymentMethodId ? 'saved' : cardToken ? 'new' : 'saved');

  const query = useQuery({
    queryKey: ['client', 'payment-methods'],
    queryFn: () => api.get('/client/payment-methods').then((r) => r.data.data as PaymentMethod[]),
  });
  const cards = query.data;

  // pre-select the default card
  useEffect(() => {
    if (!paymentMethodId && !cardToken && cards && cards.length > 0) {
      const def = cards.find((c) => c.is_default && !c.is_expired) ?? cards.find((c) => !c.is_expired);
      if (def) {
        setPaymentMethod(def.id);
        setMode('saved');
      } else {
        setMode('new');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  if (query.isLoading) {
    return (
      <div className="page-loader">
        <span className="spinner" />
      </div>
    );
  }
  if (query.isError || !cards) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="flex flex-col gap-6">
      {cards.length > 0 && (
        <div>
          <h4 className="text-[0.95rem] mb-3 text-muted font-medium">{t('wizard.savedCards')}</h4>
          <div className="flex flex-col gap-2.5" role="radiogroup">
            {cards.map((card) => {
              const active = mode === 'saved' && paymentMethodId === card.id;
              return (
                <label
                  key={card.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    card.is_expired ? 'opacity-50 cursor-not-allowed border-border' : 'cursor-pointer'
                  } ${active ? 'border-accent bg-accent/5' : 'border-border bg-surface'}`}
                >
                  <Radio
                    name="payment-method"
                    disabled={card.is_expired}
                    checked={active}
                    onChange={() => {
                      setMode('saved');
                      setPaymentMethod(card.id);
                    }}
                  />
                  <span className="text-[0.92rem] text-text font-medium" dir="ltr">
                    {card.display}
                  </span>
                  {card.holder_name && <span className="text-muted text-[0.82rem]">{card.holder_name}</span>}
                  <span className="text-muted text-[0.82rem] ms-auto" dir="ltr">
                    {String(card.exp_month).padStart(2, '0')}/{card.exp_year}
                  </span>
                  {card.is_default && <span className="text-accent text-[0.8rem]">★</span>}
                  {card.is_expired && <span className="text-danger text-[0.8rem]">{t('paymentMethods.expired')}</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
            mode === 'new' ? 'border-accent bg-accent/5' : 'border-border bg-surface'
          }`}
        >
          <Radio
            name="payment-method"
            checked={mode === 'new'}
            onChange={() => {
              setMode('new');
              setPaymentMethod(null);
            }}
          />
          <span className="text-[0.92rem] text-text font-medium">{t('wizard.newCard')}</span>
        </label>

        {mode === 'new' && (
          <div className="mt-4 rounded-2xl border border-border bg-background p-5">
            <CardForm onToken={(token) => setCardToken(token)} />
            <div className="mt-4">
              <Checkbox
                label={t('wizard.saveCard')}
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
