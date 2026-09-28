'use client';

import { useWizard } from '@/stores/wizard';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Avatar, PriceTag } from '@/components/ui';

// §11.1 — summary sidebar rendered from the wizard store on every step
export function WizardSummary({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  const { pkg, consultant, date, time, location, paymentMethodId, cardToken, quote } = useWizard();

  return (
    <aside
      className={`bg-surface border border-border rounded-2xl p-6 h-fit sticky top-24 ${className}`}
      style={{ boxShadow: 'var(--shadow)' }}
    >
      <h3 className="text-lg mb-5 pb-4 border-b border-border">{t('wizard.summary')}</h3>
      <dl className="flex flex-col gap-4 text-[0.9rem]">
        {pkg && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted">{t('wizard.stepPackage')}</dt>
            <dd className="text-end">
              <strong className="block text-text">{pkg.name}</strong>
              <PriceTag formatted={pkg.price_formatted} className="text-[0.85rem] text-accent" />
            </dd>
          </div>
        )}
        {consultant && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted">{t('wizard.stepConsultant')}</dt>
            <dd className="flex items-center gap-2.5">
              <Avatar src={consultant.avatar_thumb_url} name={consultant.name} size="sm" />
              <strong className="text-text">{consultant.name}</strong>
            </dd>
          </div>
        )}
        {date && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted">{t('wizard.stepDateTime')}</dt>
            <dd className="text-text font-medium">
              {date}
              {time && (
                <>
                  {' · '}
                  <bdi dir="ltr">{time}</bdi>
                </>
              )}
            </dd>
          </div>
        )}
        {location && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted">{t('wizard.stepLocation')}</dt>
            <dd className="text-text font-medium">{location.name}</dd>
          </div>
        )}
        {(paymentMethodId || cardToken) && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted">{t('wizard.stepPayment')}</dt>
            <dd className="text-text font-medium">
              {paymentMethodId ? t('wizard.savedCards') : t('wizard.newCard')}
            </dd>
          </div>
        )}
      </dl>

      {quote && (
        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
          <span className="text-muted text-[0.9rem]">{t('wizard.total')}</span>
          {quote.requires_payment ? (
            <PriceTag formatted={quote.amount_formatted} className="text-xl" />
          ) : (
            <strong className="text-success">{t('wizard.includedInSubscription')}</strong>
          )}
        </div>
      )}
    </aside>
  );
}
