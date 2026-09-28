'use client';

import type { ReactNode } from 'react';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { EmptyState } from '@/components/ui';

// §7.1 — page-level permission gate (the backend enforces it regardless)
export function RequirePermission({ perm, children }: { perm: string; children: ReactNode }) {
  const { can } = usePermissions();
  const { t } = useI18n();
  if (!can(perm)) {
    return <EmptyState title={t('admin.forbidden')} />;
  }
  return <>{children}</>;
}
