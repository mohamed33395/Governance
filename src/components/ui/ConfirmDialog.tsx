'use client';

import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useI18n } from '@/lib/i18n/i18n-context';

// use for every destructive action
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: ReactNode;
  body?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </>
      }
    >
      {typeof body === 'string' ? <p className="text-[0.92rem] text-muted leading-relaxed">{body}</p> : body}
    </Modal>
  );
}
