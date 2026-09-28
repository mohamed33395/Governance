'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { resetSchema, type ResetValues } from '@/schemas/auth';
import { useI18n } from '@/lib/i18n/i18n-context';
import { AuthCard } from '@/components/auth/AuthCard';
import { Alert, Button, Input, useToast } from '@/components/ui';

// URL contract: the admin/consultant password-reset email lands here
function AdminResetForm() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const [expired, setExpired] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token: params.get('token') ?? '', email: params.get('email') ?? '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.post('/admin/auth/reset-password', values);
      toast.success(t('auth.resetSuccess'));
      router.replace('/admin/login');
    } catch (e) {
      if (!isApiError(e)) return;
      if (e.code === 'VALIDATION_ERROR') {
        if (e.errors.email) {
          setExpired(true);
        } else {
          Object.entries(e.errors).forEach(([field, msgs]) =>
            setError(field as keyof ResetValues, { type: 'server', message: msgs[0] })
          );
        }
      } else {
        toast.error(e.message);
      }
    }
  });

  if (expired) {
    return (
      <AuthCard dark title={t('auth.resetPassword')}>
        <Alert color="warning" body={t('auth.linkExpired')} />
        <div className="auth-switch">
          <Link href="/admin/forgot-password" className="auth-link">
            {t('auth.forgotPassword')}
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard dark title={t('auth.resetPassword')} subtitle={t('auth.adminArea')}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <input type="hidden" {...register('token')} />
        <Input
          label={t('auth.email')}
          type="email"
          dir="ltr"
          readOnly
          error={errors.email?.message ? t(errors.email.message) : undefined}
          {...register('email')}
        />
        <Input
          label={t('auth.newPassword')}
          type="password"
          autoComplete="new-password"
          error={errors.password?.message ? t(errors.password.message) : undefined}
          {...register('password')}
        />
        <Input
          label={t('auth.passwordConfirmation')}
          type="password"
          autoComplete="new-password"
          error={
            errors.password_confirmation?.message ? t(errors.password_confirmation.message) : undefined
          }
          {...register('password_confirmation')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full mt-1">
          {t('auth.resetPassword')}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense>
      <AdminResetForm />
    </Suspense>
  );
}
