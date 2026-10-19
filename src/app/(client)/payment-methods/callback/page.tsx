'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Alert, Button } from '@/components/ui';

// Return page after the 3DS verification of a reusable Moyasar token.
// The backend re-fetches the token with the secret key; if it is not active it answers 422.
export default function CardCallbackPage() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = sessionStorage.getItem('pending_card_token');
    if (!token) {
      setError(t('paymentMethods.callbackNoCard'));
      return;
    }
    api
      .post('/client/payment-methods', { token })
      .then(() => {
        sessionStorage.removeItem('pending_card_token');
        queryClient.invalidateQueries({ queryKey: ['client', 'payment-methods'] });
        router.replace('/payment-methods');
      })
      .catch((e) => {
        sessionStorage.removeItem('pending_card_token');
        setError(isApiError(e) ? (e.errors.token?.[0] ?? e.message) : t('paymentMethods.callbackFailed'));
      });
  }, [router, queryClient, t]);

  if (!error) {
    return (
      <div className="page-loader" style={{ minHeight: '40vh' }}>
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center py-12">
      <Alert color="danger" body={error} className="text-start mb-6" />
      <Link href="/payment-methods">
        <Button variant="primary">{t('paymentMethods.title')}</Button>
      </Link>
    </div>
  );
}
