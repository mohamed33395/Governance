'use client';

import { useState } from 'react';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { AvailabilityTab } from '@/components/admin/AvailabilityTab';
import { TimeOffsTab } from '@/components/admin/TimeOffsTab';
import { SlotPreviewTab } from '@/components/admin/SlotPreviewTab';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { EmptyState, PageHeader, Tabs } from '@/components/ui';

// §13.6 — consultant self-service (MY-01..06). Same editors as §13.5 tabs
// 2/3/8 but against /admin/my/*. Admins get 403 backend-side — hide it.
export default function MyAvailabilityPage() {
  const { t } = useI18n();
  const { type } = usePermissions();
  const [tab, setTab] = useState('availability');

  if (type !== 'consultant') {
    return <EmptyState title={t('admin.forbidden')} />;
  }

  return (
    <RequirePermission perm="view-availability">
      <PageHeader title={t('nav.my_availability')} />
      <Tabs
        tabs={[
          { key: 'availability', label: t('consultants.tabAvailability') },
          { key: 'timeoffs', label: t('consultants.tabTimeOffs') },
          { key: 'slots', label: t('consultants.tabSlots') },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />
      {tab === 'availability' && <AvailabilityTab basePath="/admin/my" />}
      {tab === 'timeoffs' && <TimeOffsTab basePath="/admin/my" />}
      {tab === 'slots' && <SlotPreviewTab basePath="/admin/my" />}
    </RequirePermission>
  );
}
