'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { loginSchema, registerSchema, type LoginValues, type RegisterValues } from '@/schemas/auth';
import { useClientAuth } from '@/stores/client-auth';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Alert, Button, Input, Tabs, useToast } from '@/components/ui';
import type { ClientMe } from '@/types/api';

// §11.2 step 2 — embedded login/register inside the wizard
export function StepAccount({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'register' | 'login'>('register');

  return (
    <div>
      <Tabs
        tabs={[
          { key: 'register', label: t('auth.register') },
          { key: 'login', label: t('auth.login') },
        ]}
        active={mode}
        onChange={(k) => setMode(k as 'register' | 'login')}
        className="mb-6"
      />
      {mode === 'login' ? <LoginForm onDone={onDone} /> : <RegisterForm onDone={onDone} />}
    </div>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const setAuth = useClientAuth((s) => s.setAuth);
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
      const { data } = await api.post('/client/auth/login', { ...values, device_name: 'web' });
      setAuth(data.data.token, data.data.user as ClientMe);
      onDone();
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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 max-w-md">
      {disabled && <Alert color="danger" body={t('auth.accountDisabled')} />}
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
      <Button type="submit" loading={isSubmitting} className="self-start mt-1">
        {t('auth.login')}
      </Button>
    </form>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
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
      onDone();
    } catch (e) {
      if (!isApiError(e)) return;
      if (e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else toast.error(e.message);
    }
  });

  const err = (key?: string) => (key ? t(key) : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="grid sm:grid-cols-2 gap-4">
      <Input label={t('auth.name')} required error={err(errors.name?.message)} {...register('name')} />
      <Input
        label={t('auth.companyName')}
        required
        error={err(errors.company_name?.message)}
        {...register('company_name')}
      />
      <Input
        label={t('auth.email')}
        type="email"
        dir="ltr"
        required
        autoComplete="email"
        error={err(errors.email?.message)}
        {...register('email')}
      />
      <Input
        label={t('auth.phone')}
        dir="ltr"
        required
        placeholder="05XXXXXXXX"
        error={err(errors.phone?.message)}
        {...register('phone')}
      />
      <Input
        label={t('auth.password')}
        type="password"
        required
        autoComplete="new-password"
        error={err(errors.password?.message)}
        {...register('password')}
      />
      <Input
        label={t('auth.passwordConfirmation')}
        type="password"
        required
        autoComplete="new-password"
        error={err(errors.password_confirmation?.message)}
        {...register('password_confirmation')}
      />
      <div className="sm:col-span-2">
        <Button type="submit" loading={isSubmitting}>
          {t('auth.register')}
        </Button>
      </div>
    </form>
  );
}
