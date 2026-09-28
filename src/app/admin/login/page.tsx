'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { loginSchema, type LoginValues } from '@/schemas/auth';
import { useAdminAuth } from '@/stores/admin-auth';
import { useI18n } from '@/lib/i18n/i18n-context';
import { AuthCard } from '@/components/auth/AuthCard';
import { Alert, Button, Input, useToast } from '@/components/ui';
import type { User } from '@/types/api';

export default function AdminLoginPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const setAuth = useAdminAuth((s) => s.setAuth);
  const [disabled, setDisabled] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setDisabled(false);
    try {
      const { data } = await api.post('/admin/auth/login', { ...values, device_name: 'web' });
      setAuth(data.data.token, data.data.user as User);
      router.replace('/admin');
    } catch (e) {
      if (!isApiError(e)) return;
      if (e.code === 'INVALID_CREDENTIALS') {
        setError('email', { type: 'server', message: t('auth.invalidCredentials') });
      } else if (e.code === 'ACCOUNT_DISABLED') {
        setDisabled(true);
      } else if (e.code === 'VALIDATION_ERROR') {
        applyValidationErrors(setError, e);
      } else {
        toast.error(e.message);
      }
    }
  });

  return (
    <AuthCard dark title={t('auth.adminArea')} subtitle={t('auth.adminSubtitle')}>
      {disabled && <Alert color="danger" body={t('auth.accountDisabled')} className="mb-4" />}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label={t('auth.email')}
          type="email"
          dir="ltr"
          autoComplete="email"
          error={errors.email?.message ? t(errors.email.message) : undefined}
          {...register('email')}
        />
        <Input
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message ? t(errors.password.message) : undefined}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full mt-1">
          {t('auth.login')}
        </Button>
      </form>
      <div className="auth-switch">
        <Link href="/admin/forgot-password" className="auth-link">
          {t('auth.forgotPassword')}
        </Link>
      </div>
    </AuthCard>
  );
}
