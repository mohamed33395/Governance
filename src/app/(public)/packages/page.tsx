'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { EmptyState, ErrorState } from '@/components/ui';
import type { Package } from '@/types/api';

function Check() {
  return (
    <span className="check">
      <svg viewBox="0 0 24 24">
        <polyline points="4,12.5 9.5,18 20,6.5" />
      </svg>
    </span>
  );
}

const MEDALS = ['medal-bronze', 'medal-silver', 'medal-gold'] as const;

// §10.1 — public pricing (wizard step 1). Data: GET /public/packages (PUB-01)
export default function PackagesPage() {
  const { t } = useI18n();
  const packagesQuery = useQuery({
    queryKey: ['public', 'packages'],
    queryFn: () => api.get('/public/packages').then((r) => r.data.data as Package[]),
  });
  const packages = packagesQuery.data;

  return (
    <>
      {/* Saudi Riyal symbol (official SAMA glyph) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <symbol id="riyal-symbol" viewBox="0 0 1124.14 1256.39">
            <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" />
            <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" />
          </symbol>
        </defs>
      </svg>

      <section className="section" id="packages">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t('packages.eyebrow')}</span>
            <h2>{t('packages.title')}</h2>
            <p>{t('packages.subtitle')}</p>
          </div>

          {packagesQuery.isLoading ? (
            <div className="pricing-grid">
              {[0, 1, 2].map((i) => (
                <div key={i} className="price-card animate-pulse" style={{ minHeight: 420 }} />
              ))}
            </div>
          ) : packagesQuery.isError ? (
            <ErrorState onRetry={() => packagesQuery.refetch()} />
          ) : !packages || packages.length === 0 ? (
            <EmptyState title={t('common.empty')} />
          ) : (
            <div className="pricing-grid">
              {packages.map((pkg, i) => (
                <div key={pkg.id} className={`price-card${pkg.is_featured ? ' featured' : ''}`}>
                  {pkg.is_featured && <span className="featured-tag">{t('packages.mostFeatured')}</span>}
                  <div className="tier">
                    <span className={`medal ${MEDALS[i % MEDALS.length]}`} /> {pkg.name}
                  </div>
                  <div className="price">
                    {pkg.price_formatted}{' '}
                    <small>
                      / {pkg.billing_period_days} {t('packages.days')}
                    </small>
                  </div>
                  {pkg.description && <p className="desc">{pkg.description}</p>}
                  <ul>
                    <li>
                      <Check />
                      {pkg.is_unlimited || pkg.consultations_limit === null
                        ? t('packages.unlimitedConsultations')
                        : t('packages.consultationsMonthly').replace('{n}', String(pkg.consultations_limit))}
                    </li>
                    {pkg.features_localized.map((feature, fi) => (
                      <li key={fi}>
                        <Check /> {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/book/${pkg.slug}`}
                    className={`btn ${pkg.is_featured ? 'btn-gold' : 'btn-outline'}`}
                  >
                    {t('choosePackage')}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
