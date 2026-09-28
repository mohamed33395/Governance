'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { AVATAR_ACCEPT, AVATAR_MAX_MB, uploadFile } from '@/lib/files';
import { clientProfileSchema, changePasswordSchema, type ClientProfileValues, type ChangePasswordValues } from '@/schemas/profile';
import { useClientAuth } from '@/stores/client-auth';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Alert, Avatar, Button, ConfirmDialog, Input, PageHeader, useToast } from '@/components/ui';
import type { ClientMe } from '@/types/api';

// §12.8 — client profile (CLI-PRF-01..05)
export default function ClientProfilePage() {
  const { t } = useI18n();
  const user = useClientAuth((s) => s.user);

  return (
    <>
      <PageHeader title={t('profile.title')} />
      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <div className="flex flex-col gap-5">
          <ProfileForm key={user?.updated_at ?? 'form'} />
          <PasswordCard />
        </div>
        <AvatarCard />
      </div>
    </>
  );
}

const card = 'bg-surface border border-border rounded-2xl p-6';
const cardTitle = 'text-[1rem] mb-5 pb-3 border-b border-border';

function ProfileForm() {
  const { t } = useI18n();
  const toast = useToast();
  const { user, setUser } = useClientAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClientProfileValues>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      company_name: user?.company_name ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { data } = await api.put('/client/profile', values);
      setUser(data.data as ClientMe);
      toast.success(t('profile.saved'));
    } catch (e) {
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message);
    }
  });

  const err = (key?: string) => (key ? t(key) : undefined);

  return (
    <div className={card}>
      <h3 className={cardTitle}>{t('profile.info')}</h3>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input label={t('auth.name')} required error={err(errors.name?.message)} {...register('name')} />
        <Input label={t('auth.email')} type="email" dir="ltr" required error={err(errors.email?.message)} {...register('email')} />
        <Input label={t('auth.phone')} dir="ltr" required placeholder="05XXXXXXXX" error={err(errors.phone?.message)} {...register('phone')} />
        <Input label={t('auth.companyName')} required error={err(errors.company_name?.message)} {...register('company_name')} />
        <Button type="submit" loading={isSubmitting} className="self-start">
          {t('common.save')}
        </Button>
      </form>
    </div>
  );
}

function AvatarCard() {
  const { t } = useI18n();
  const toast = useToast();
  const { user, setUser } = useClientAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const upload = useMutation({
    mutationFn: (file: File) => uploadFile<ClientMe>('/client/profile/avatar', 'avatar', file),
    onSuccess: (fresh) => {
      setUser(fresh);
      toast.success(t('profile.avatarUpdated'));
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => api.delete('/client/profile/avatar').then((r) => r.data.data as ClientMe),
    onSuccess: (fresh) => {
      setUser(fresh);
      setConfirmRemove(false);
      toast.success(t('profile.avatarRemoved'));
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  const onPick = (file: File | undefined) => {
    if (!file) return;
    if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
      toast.error(t('common.fileSizeError').replace('{max}', String(AVATAR_MAX_MB)));
      return;
    }
    upload.mutate(file);
  };

  return (
    <div className={card}>
      <h3 className={cardTitle}>{t('profile.avatar')}</h3>
      <div className="flex items-center gap-5 flex-wrap">
        {/* bust the browser cache with updated_at */}
        <Avatar src={user?.avatar_url ? `${user.avatar_url}?v=${encodeURIComponent(user.updated_at)}` : null} name={user?.name ?? '?'} size="xl" />
        <div className="flex flex-col gap-2.5">
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} loading={upload.isPending}>
            {t('profile.changeAvatar')}
          </Button>
          {user?.avatar_url && (
            <Button variant="ghost" size="sm" className="text-danger" onClick={() => setConfirmRemove(true)}>
              {t('profile.removeAvatar')}
            </Button>
          )}
          <p className="text-muted text-[0.78rem]">{t('common.maxMb').replace('{max}', String(AVATAR_MAX_MB))}</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ACCEPT}
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => remove.mutate()}
        title={t('profile.removeAvatar')}
        body={t('profile.removeAvatarConfirm')}
        danger
        loading={remove.isPending}
      />
    </div>
  );
}

function PasswordCard() {
  const { t } = useI18n();
  const toast = useToast();
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setDone(false);
    try {
      await api.put('/client/profile/password', values);
      reset();
      setDone(true);
      toast.success(t('profile.passwordChanged'));
    } catch (e) {
      // wrong current password → 422 under current_password
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message);
    }
  });

  const err = (key?: string) => (key ? t(key) : undefined);

  return (
    <div className={card}>
      <h3 className={cardTitle}>{t('profile.password')}</h3>
      {done && <Alert color="success" body={t('profile.passwordChanged')} className="mb-4" />}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label={t('auth.currentPassword')}
          type="password"
          autoComplete="current-password"
          required
          error={err(errors.current_password?.message)}
          {...register('current_password')}
        />
        <Input
          label={t('auth.newPassword')}
          type="password"
          autoComplete="new-password"
          required
          error={err(errors.password?.message)}
          {...register('password')}
        />
        <Input
          label={t('auth.passwordConfirmation')}
          type="password"
          autoComplete="new-password"
          required
          error={err(errors.password_confirmation?.message)}
          {...register('password_confirmation')}
        />
        <Button type="submit" loading={isSubmitting} className="self-start">
          {t('common.save')}
        </Button>
      </form>
    </div>
  );
}
