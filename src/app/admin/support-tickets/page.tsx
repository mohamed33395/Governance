'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePermissions } from '@/lib/permissions';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { FilterPanel } from '@/components/admin/FilterPanel';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  Select,
  Table,
  TableSkeleton,
} from '@/components/ui';
import type { Paginated, SupportTicket, SupportTicketStatus } from '@/types/api';

const CATEGORIES = ['general_inquiry', 'booking_issue', 'payment_issue', 'technical', 'consultant_complaint'] as const;
const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;

export default function AdminSupportTicketsPage() {
  return (
    <RequirePermission perm="view-support-tickets">
      <SupportTicketsInner />
    </RequirePermission>
  );
}

function SupportTicketsInner() {
  const { t } = useI18n();
  const router = useRouter();
  const { type } = usePermissions();
  const isStaff = type === 'admin';

  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [clientId, setClientId] = useState('');
  const [consultantId, setConsultantId] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin', 'support-tickets', { status, category, clientId, consultantId, page }],
    queryFn: () =>
      api
        .get('/admin/support-tickets', {
          params: {
            status: status || undefined,
            category: category || undefined,
            client_id: isStaff && clientId ? clientId : undefined,
            consultant_id: isStaff && consultantId ? consultantId : undefined,
            page,
          },
        })
        .then((r) => r.data as Paginated<SupportTicket>),
  });
  const data = query.data;

  const resetPage = () => setPage(1);

  return (
    <>
      <div className="page-identity" style={{ ['--id-strong' as string]: 'var(--green-deep)' }}>
        <div className="page-identity-main">
          <div className="page-id-rail" />
          <div>
            <h1 className="page-id-title">{t('supportTickets.title')}</h1>
            {data && (
              <p className="page-id-sub">
                {t('supportTickets.total').replace('{count}', String(data.meta.total))}
              </p>
            )}
          </div>
        </div>
      </div>

      <FilterPanel>
        <Select
          options={STATUSES.map((s) => ({ value: s, label: t(`supportTickets.statuses.${s}`) }))}
          placeholder={t('supportTickets.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 160 }}
        />
        <Select
          options={CATEGORIES.map((c) => ({ value: c, label: t(`supportTickets.categories.${c}`) }))}
          placeholder={t('supportTickets.category')}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 170 }}
        />
        {isStaff && (
          <>
            <Input
              placeholder={t('nav.clients') + ' ID'}
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                resetPage();
              }}
              dir="ltr"
              style={{ maxWidth: 130 }}
            />
            <Input
              placeholder={t('nav.consultants') + ' ID'}
              value={consultantId}
              onChange={(e) => {
                setConsultantId(e.target.value);
                resetPage();
              }}
              dir="ltr"
              style={{ maxWidth: 130 }}
            />
          </>
        )}
      </FilterPanel>

      {query.isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('supportTickets.noTickets')} />
      ) : (
        <>
          <Table
            columns={[
              {
                key: 'reference',
                header: t('supportTickets.reference'),
                render: (row) => (
                  <span dir="ltr" className="font-semibold" style={{ color: 'var(--green-deep)' }}>
                    {row.reference ?? `#${row.id}`}
                  </span>
                ),
              },
              {
                key: 'client',
                header: t('nav.clients'),
                render: (row) => (
                  <div>
                    <span className="block">{row.client?.name ?? '—'}</span>
                    {row.client?.company_name && (
                      <span className="text-muted text-[0.8rem] block">{row.client.company_name}</span>
                    )}
                  </div>
                ),
              },
              {
                key: 'category',
                header: t('supportTickets.category'),
                render: (row) => row.category_label ?? t(`supportTickets.categories.${row.category}`),
              },
              {
                key: 'status',
                header: t('supportTickets.status'),
                render: (row) => (
                  <Badge color={statusColor(row.status)}>
                    {row.status_label ?? t(`supportTickets.statuses.${row.status}`)}
                  </Badge>
                ),
              },
              {
                key: 'lastReply',
                header: t('supportTickets.lastReply'),
                render: (row) =>
                  row.last_message_at ? (
                    <span dir="ltr" className="text-muted">
                      {row.last_message_at.slice(0, 16).replace('T', ' ')}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  ),
              },
              {
                key: 'created',
                header: t('common.date'),
                render: (row) => (
                  <span dir="ltr">{row.created_at.slice(0, 16).replace('T', ' ')}</span>
                ),
              },
              { key: 'go', header: '', render: () => <span className="text-muted rtl:-scale-x-100 inline-block">›</span> },
            ]}
            rows={data.data}
            rowKey={(t) => t.id}
            onRowClick={(t) => router.push(`/admin/support-tickets/${t.id}`)}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}
    </>
  );
}

function statusColor(status: SupportTicketStatus) {
  switch (status) {
    case 'open':
      return 'amber';
    case 'in_progress':
      return 'blue';
    case 'resolved':
      return 'green';
    case 'closed':
      return 'gray';
    default:
      return 'gray';
  }
}
