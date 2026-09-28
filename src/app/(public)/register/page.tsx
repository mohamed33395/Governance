'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { registerSchema, type RegisterValues } from '@/schemas/auth';
import { useClientAuth } from '@/stores/client-auth';
import { useI18n } from '@/lib/i18n/i18n-context';
import { AuthCard } from '@/components/auth/AuthCard';
import { Alert, Button, Input, useToast } from '@/components/ui';
import type { ClientMe } from '@/types/api';

function RegisterForm() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useClientAuth((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { data } = await api.post('/client/auth/register', { ...values, device_name: 'web' });
      setAuth(data.data.token, data.data.user as ClientMe);
      router.replace(params.get('next') ?? '/dashboard');
    } catch (e) {
      if (!isApiError(e)) return;
      if (e.code === 'VALIDATION_ERROR') {
        applyValidationErrors(setError, e);
      } else {
        toast.error(e.message);
      }
    }
  });

  return (
    <AuthCard title={t('auth.register')} subtitle={t('auth.registerSubtitle')}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label={t('auth.name')}
          autoComplete="name"
          error={errors.name?.message ? t(errors.name.message) : undefined}
          {...register('name')}
        />
        <Input
          label={t('auth.email')}
          type="email"
          dir="ltr"
          autoComplete="email"
          error={errors.email?.message ? t(errors.email.message) : undefined}
          {...register('email')}
        />
        <Input
          label={t('auth.phone')}
          type="tel"
          dir="ltr"
          placeholder="05XXXXXXXX"
          autoComplete="tel"
          error={errors.phone?.message ? t(errors.phone.message) : undefined}
          {...register('phone')}
        />
        <Input
          label={t('auth.companyName')}
          autoComplete="organization"
          error={errors.company_name?.message ? t(errors.company_name.message) : undefined}
          {...register('company_name')}
        />
        <Input
          label={t('auth.password')}
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
          {t('auth.register')}
        </Button>
      </form>
      <div className="auth-switch">
        <span>{t('auth.haveAccount')}</span>
        <Link href="/login" className="auth-link">
          {t('auth.login')}
        </Link>
      </div>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
