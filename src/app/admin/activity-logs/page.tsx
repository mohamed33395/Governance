'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePermissions } from '@/lib/permissions';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { FilterPanel } from '@/components/admin/FilterPanel';
import {
  Badge,
  CopyButton,
  Drawer,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Table,
  TableSkeleton,
} from '@/components/ui';
import type { BadgeColor } from '@/components/ui';
import type { ActivityLog, ActivityLogsMeta, Client, Paginated, User } from '@/types/api';

// LOG-01/02 — read-only audit trail. Rows are created by the backend and are immutable.
const EVENT_COLOR: Record<string, BadgeColor> = {
  created: 'green',
  updated: 'blue',
  deleted: 'red',
  restored: 'amber',
  login: 'green',
  logout: 'gray',
  login_failed: 'red',
};

export default function AdminActivityLogsPage() {
  return (
    <RequirePermission perm="view-activity-logs">
      <ActivityLogsInner />
    </RequirePermission>
  );
}

function ActivityLogsInner() {
  const { t } = useI18n();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [event, setEvent] = useState('');
  const [logName, setLogName] = useState('');
  const [userId, setUserId] = useState('');
  const [clientId, setClientId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ActivityLog | null>(null);

  // LOG-02 — dropdown options come from the backend, no hard-coded lists
  const metaQuery = useQuery({
    queryKey: ['admin', 'activity-logs', 'meta'],
    queryFn: () => api.get('/admin/activity-logs/meta').then((r) => r.data.data as ActivityLogsMeta),
    staleTime: 60_000,
  });
  const meta = metaQuery.data;

  const query = useQuery({
    queryKey: ['admin', 'activity-logs', { search, module, event, logName, userId, clientId, dateFrom, dateTo, page }],
    queryFn: () =>
      api
        .get('/admin/activity-logs', {
          params: {
            search: search || undefined,
            module: module || undefined,
            event: event || undefined,
            log_name: logName || undefined,
            user_id: userId || undefined,
            client_id: clientId || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            page,
          },
        })
        .then((r) => r.data as Paginated<ActivityLog>),
  });
  const data = query.data;

  const resetPage = () => setPage(1);

  // actor pickers — staff (user_id) and client (client_id) are mutually exclusive in the UI
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', 'options'],
    queryFn: () =>
      api.get('/admin/users', { params: { per_page: 100 } }).then((r) => (r.data as Paginated<User>).data),
    enabled: can('view-users'),
    staleTime: 60_000,
  });
  const clientsQuery = useQuery({
    queryKey: ['admin', 'clients', 'options'],
    queryFn: () =>
      api.get('/admin/clients', { params: { per_page: 100 } }).then((r) => (r.data as Paginated<Client>).data),
    enabled: can('view-clients'),
    staleTime: 60_000,
  });

  return (
    <>
      <PageHeader title={t('nav.activity_logs')} />

      <FilterPanel>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetPage();
          }}
          placeholder={t('activityLogs.searchPlaceholder')}
          className="flex-1 min-w-[220px]"
        />
        <Select
          options={(meta?.modules ?? []).map((m) => ({ value: m, label: m }))}
          placeholder={t('activityLogs.module')}
          value={module}
          onChange={(e) => {
            setModule(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 160 }}
          dir="ltr"
        />
        <Select
          options={(meta?.events ?? []).map((ev) => ({ value: ev, label: t(`activityEvent.${ev}`) }))}
          placeholder={t('activityLogs.event')}
          value={event}
          onChange={(e) => {
            setEvent(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 170 }}
        />
        <Select
          options={(meta?.log_names ?? []).map((n) => ({ value: n, label: t(`activityLogName.${n}`) }))}
          placeholder={t('activityLogs.source')}
          value={logName}
          onChange={(e) => {
            setLogName(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 140 }}
        />
        <Select
          options={(usersQuery.data ?? []).map((u) => ({ value: u.id, label: u.name }))}
          placeholder={t('activityLogs.staffActor')}
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            if (e.target.value) setClientId('');
            resetPage();
          }}
          style={{ maxWidth: 180 }}
        />
        <Select
          options={(clientsQuery.data ?? []).map((c) => ({ value: c.id, label: c.company_name || c.name }))}
          placeholder={t('nav.clients')}
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            if (e.target.value) setUserId('');
            resetPage();
          }}
          style={{ maxWidth: 180 }}
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            resetPage();
          }}
          aria-label={t('reports.dateFrom')}
          style={{ maxWidth: 155 }}
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            resetPage();
          }}
          aria-label={t('reports.dateTo')}
          style={{ maxWidth: 155 }}
        />
      </FilterPanel>

      {query.isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('common.empty')} />
      ) : (
        <>
          <Table
            columns={[
              { key: 'id', header: '#', render: (l) => l.id },
              {
                key: 'time',
                header: t('activityLogs.time'),
                render: (l) => <span dir="ltr">{l.created_at.slice(0, 16).replace('T', ' ')}</span>,
              },
              {
                key: 'event',
                header: t('activityLogs.event'),
                render: (l) => <Badge color={EVENT_COLOR[l.event] ?? 'gray'}>{t(`activityEvent.${l.event}`)}</Badge>,
              },
              {
                key: 'description',
                header: t('activityLogs.details'),
                minWidth: 220,
                render: (l) => l.description,
              },
              {
                key: 'module',
                header: t('activityLogs.module'),
                render: (l) => <span dir="ltr">{l.module}</span>,
              },
              {
                key: 'actor',
                header: t('activityLogs.actor'),
                render: (l) =>
                  l.causer ? (
                    <span>
                      {l.causer.name}
                      {l.causer.type === 'Client' && <span className="text-muted"> · {t('activityLogs.clientActor')}</span>}
                    </span>
                  ) : (
                    <span className="text-muted">{t('activityLogs.systemActor')}</span>
                  ),
              },
              {
                key: 'subject',
                header: t('activityLogs.subject'),
                render: (l) =>
                  l.subject ? (
                    <span>
                      {l.subject.name ?? `#${l.subject.id}`} <span className="text-muted">({l.subject.type})</span>
                    </span>
                  ) : (
                    '—'
                  ),
              },
            ]}
            rows={data.data}
            rowKey={(l) => l.id}
            onRowClick={(l) => setSelected(l)}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}

      <LogDrawer log={selected} onClose={() => setSelected(null)} />
    </>
  );
}

// ---------- detail drawer ----------
function propValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function LogDrawer({ log, onClose }: { log: ActivityLog | null; onClose: () => void }) {
  const { t } = useI18n();
  const props = log?.properties ?? {};
  const row = 'flex justify-between gap-3 py-2 border-b border-border/60 text-[0.9rem]';

  // updated → field × (old | new) diff; created/deleted → attributes snapshot
  const diffKeys = [
    ...new Set([...Object.keys(props.changes ?? {}), ...Object.keys(props.old ?? {})]),
  ];
  const attrKeys = Object.keys(props.attributes ?? {});

  return (
    <Drawer open={!!log} onClose={onClose} title={`${t('activityLogs.details')} #${log?.id ?? ''}`}>
      {log && (
        <div className="flex flex-col gap-1">
          <div className={row}>
            <span className="text-muted">{t('activityLogs.event')}</span>
            <Badge color={EVENT_COLOR[log.event] ?? 'gray'}>{t(`activityEvent.${log.event}`)}</Badge>
          </div>
          <div className={row}>
            <span className="text-muted">{t('activityLogs.source')}</span>
            <span>{t(`activityLogName.${log.log_name}`)}</span>
          </div>
          <div className={row}>
            <span className="text-muted">{t('activityLogs.module')}</span>
            <span dir="ltr">{log.module}</span>
          </div>
          <div className={row}>
            <span className="text-muted">{t('activityLogs.time')}</span>
            <span dir="ltr">{log.created_at.slice(0, 16).replace('T', ' ')}</span>
          </div>
          <div className={row}>
            <span className="text-muted">{t('activityLogs.actor')}</span>
            <span>
              {log.causer ? (
                <>
                  {log.causer.name} <span className="text-muted">({log.causer.type})</span>
                </>
              ) : (
                t('activityLogs.systemActor')
              )}
            </span>
          </div>
          {log.subject && (
            <div className={row}>
              <span className="text-muted">{t('activityLogs.subject')}</span>
              <span>
                {log.subject.name ?? `#${log.subject.id}`} <span className="text-muted">({log.subject.type})</span>
              </span>
            </div>
          )}
          {log.ip_address && (
            <div className={row}>
              <span className="text-muted">{t('activityLogs.ip')}</span>
              <span dir="ltr" className="flex items-center gap-2">
                {log.ip_address}
                <CopyButton text={log.ip_address} />
              </span>
            </div>
          )}
          <div className="py-2 text-[0.9rem]">{log.description}</div>

          {/* auth extras */}
          {(props.guard || props.email || props.reason || props.device_name) && (
            <div className="mt-4 rounded-xl border border-border p-4 flex flex-col gap-1.5 text-[0.85rem]">
              {props.guard && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted">{t('activityLogs.guard')}</span>
                  <span dir="ltr">{props.guard}</span>
                </div>
              )}
              {typeof props.email === 'string' && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted">{t('auth.email')}</span>
                  <span dir="ltr">{props.email}</span>
                </div>
              )}
              {typeof props.reason === 'string' && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted">{t('activityLogs.reason')}</span>
                  <span dir="ltr">{props.reason}</span>
                </div>
              )}
              {typeof props.device_name === 'string' && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted">{t('activityLogs.device')}</span>
                  <span dir="ltr">{props.device_name}</span>
                </div>
              )}
            </div>
          )}

          {/* updated diff */}
          {diffKeys.length > 0 && (
            <div className="mt-4">
              <span className="text-muted text-[0.82rem] block mb-2">{t('activityLogs.changes')}</span>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-[0.82rem]">
                  <thead>
                    <tr className="bg-black/[0.03]">
                      <th className="text-start font-medium text-muted px-3 py-2">{t('activityLogs.field')}</th>
                      <th className="text-start font-medium text-muted px-3 py-2">{t('activityLogs.oldValue')}</th>
                      <th className="text-start font-medium text-muted px-3 py-2">{t('activityLogs.newValue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffKeys.map((k) => (
                      <tr key={k} className="border-t border-border/60">
                        <td className="px-3 py-2 font-medium" dir="ltr">
                          {k}
                        </td>
                        <td className="px-3 py-2 text-muted break-all" dir="auto">
                          {propValue(props.old?.[k])}
                        </td>
                        <td className="px-3 py-2 break-all" dir="auto">
                          {propValue(props.changes?.[k])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* created / deleted attributes snapshot */}
          {attrKeys.length > 0 && (
            <div className="mt-4">
              <span className="text-muted text-[0.82rem] block mb-2">{t('activityLogs.attributes')}</span>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-[0.82rem]">
                  <tbody>
                    {attrKeys.map((k) => (
                      <tr key={k} className="border-t border-border/60 first:border-t-0">
                        <td className="px-3 py-2 font-medium text-muted w-1/3" dir="ltr">
                          {k}
                        </td>
                        <td className="px-3 py-2 break-all" dir="auto">
                          {propValue(props.attributes?.[k])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {props.force === true && (
            <div className="mt-4">
              <Badge color="red">{t('activityLogs.forceDelete')}</Badge>
            </div>
          )}

          {/* request context */}
          {props.request && (props.request.method || props.request.url || props.request.user_agent) && (
            <div className="mt-4 rounded-xl border border-border p-4">
              <span className="text-muted text-[0.82rem] block mb-2">{t('activityLogs.request')}</span>
              {(props.request.method || props.request.url) && (
                <div dir="ltr" className="font-mono text-[0.82rem] break-all">
                  <strong>{props.request.method}</strong> {props.request.url}
                </div>
              )}
              {props.request.user_agent && (
                <div dir="ltr" className="text-muted text-[0.78rem] mt-1.5 break-all">
                  {props.request.user_agent}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
