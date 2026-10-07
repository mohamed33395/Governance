'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useClientAuth } from '@/stores/client-auth';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { Subscription } from '@/types/api';

// §4.1 — the client's active subscriptions above the pricing list (wizard step 1).
// Lets a logged-in client continue booking the remaining consultations of an
// already-purchased package with one click. The card carries its own frozen
// name/price/quota, so it keeps working even if the package was later updated,
// deactivated or drafted by an admin — purchases never change (§4).
export function ActiveSubscriptions() {
  const { t } = useI18n();
  const token = useClientAuth((s) => s.token);

  const query = useQuery({
    queryKey: ['client', 'subscriptions', 'active'],
    queryFn: () => api.get('/client/subscriptions/active').then((r) => r.data.data as Subscription[]),
    enabled: !!token,
    staleTime: 60_000,
  });

  // only subscriptions that can still cover a new consultation
  const subs = (query.data ?? []).filter(
    (s) => !!s.package && (s.is_unlimited || (s.consultations_remaining ?? 0) > 0)
  );
  if (!token || subs.length === 0) return null;

  return (
    <div className="mb-12 rounded-2xl border border-accent/40 bg-surface p-6 sm:p-8">
      <h3 className="text-lg mb-5">{t('dashboard.activePackages')}</h3>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subs.map((sub) =>
          sub.package ? (
            <li key={sub.id} className="flex flex-col gap-2 rounded-xl border border-border bg-background p-5">
              <strong className="text-[1.02rem]">{sub.package.name}</strong>
              <span className="text-muted text-[0.84rem]">
                {t('dashboard.consultationsRemaining')}:{' '}
                {sub.is_unlimited || sub.consultations_remaining === null
                  ? t('dashboard.unlimited')
                  : sub.consultations_remaining}
              </span>
              <span className="text-muted text-[0.84rem]">
                {t('dashboard.endsAt')} <bdi dir="ltr">{sub.ends_at.slice(0, 10)}</bdi>
              </span>
              <Link href={`/book/${sub.package.slug}`} className="btn btn-gold btn-sm mt-2 self-start">
                {t('packages.continueBooking')}
              </Link>
            </li>
          ) : null
        )}
      </ul>
    </div>
  );
}
