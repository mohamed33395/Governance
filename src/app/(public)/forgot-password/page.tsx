'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { forgotSchema, type ForgotValues } from '@/schemas/auth';
import { useI18n } from '@/lib/i18n/i18n-context';
import { AuthCard } from '@/components/auth/AuthCard';
import { Alert, Button, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

  // always succeeds (the backend never leaks whether the email exists)
  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.post('/client/auth/forgot-password', values);
    } finally {
      setSent(true);
    }
  });

  return (
    <AuthCard title={t('auth.forgotPassword')} subtitle={sent ? undefined : t('auth.clientArea')}>
      {sent ? (
        <>
          <Alert color="success" body={t('auth.checkInbox')} />
          <div className="auth-switch">
            <Link href="/login" className="auth-link">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label={t('auth.email')}
            type="email"
            dir="ltr"
            autoComplete="email"
            error={errors.email?.message ? t(errors.email.message) : undefined}
            {...register('email')}
          />
          <Button type="submit" loading={isSubmitting} className="w-full mt-1">
            {t('auth.sendResetLink')}
          </Button>
          <div className="auth-switch">
            <Link href="/login" className="auth-link">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
