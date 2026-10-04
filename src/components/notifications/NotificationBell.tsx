'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, X } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ar';
import 'dayjs/locale/en';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { Notification } from '@/types/api';

dayjs.extend(relativeTime);

const PER_PAGE = 10;

interface NotificationBellProps {
  guard: 'admin' | 'client';
}

export function NotificationBell({ guard }: NotificationBellProps) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const prefix = `/${guard}/notifications`;

  // poll unread count every 30 s
  const countQuery = useQuery({
    queryKey: [guard, 'notifications', 'unread-count'],
    queryFn: () =>
      api
        .get(`${prefix}/unread-count`)
        .then((r) => (r.data as { data: { unread_count: number } }).data.unread_count),
    refetchInterval: 30_000,
  });

  const listQuery = useQuery({
    queryKey: [guard, 'notifications', { unread: unreadOnly ? 1 : 0, page: 1, per_page: PER_PAGE }],
    queryFn: () =>
      api
        .get(prefix, { params: { unread: unreadOnly ? 1 : 0, per_page: PER_PAGE } })
        .then((r) => (r.data as { data: Notification[]; meta: unknown }).data),
    enabled: open,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [guard, 'notifications'] });
  };

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`${prefix}/${id}/read`),
    onSuccess: () => invalidate(),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post(`${prefix}/read-all`),
    onSuccess: () => invalidate(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`${prefix}/${id}`),
    onSuccess: () => invalidate(),
  });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleClick = (n: Notification) => {
    const link = notificationLink(n, guard);
    markRead.mutate(n.id, {
      onSettled: () => {
        if (link) router.push(link);
        setOpen(false);
      },
    });
  };

  const unreadCount = countQuery.data ?? 0;
  const items = listQuery.data ?? [];

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-btn"
        aria-label={t('notifications.title')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={20} strokeWidth={2} aria-hidden="true" />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      <div className={`notif-dropdown${open ? ' open' : ''}`}>
        <div className="notif-head flex items-center justify-between gap-3">
          <span>{t('notifications.title')}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-[0.72rem] text-muted hover:text-ink"
              onClick={() => setUnreadOnly((v) => !v)}
            >
              {t(unreadOnly ? 'common.all' : 'notifications.unreadOnly')}
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-[0.72rem] font-semibold text-green-deep hover:underline"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>
        </div>

        {listQuery.isLoading ? (
          <div className="notif-empty">{t('loading')}</div>
        ) : items.length === 0 ? (
          <div className="notif-empty">{t('notifications.empty')}</div>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={`notif-item${n.read_at === null ? ' unread' : ''}`}
              onClick={() => handleClick(n)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(n)}
            >
              <div className="ic">
                <Bell size={16} aria-hidden="true" />
              </div>
              <div className="txt">
                <strong>{notificationTitle(n, t)}</strong>
                <p>{notificationBody(n, t)}</p>
                <time dir="ltr">{dayjs(n.created_at).locale(lang === 'ar' ? 'ar' : 'en').fromNow()}</time>
              </div>
              <button
                type="button"
                className="text-muted hover:text-danger"
                aria-label={t('common.delete')}
                onClick={(e) => {
                  e.stopPropagation();
                  remove.mutate(n.id);
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function notificationTitle(n: Notification, t: (key: string) => string) {
  const type = String(n.data.type ?? n.type ?? '');
  return t(`notification.type.${type}`) || type;
}

function notificationBody(n: Notification, t: (key: string) => string) {
  const d = n.data as Record<string, unknown>;
  const type = String(d.type ?? n.type ?? '');
  let text = '';
  switch (type) {
    case 'new_booking':
      text = `${d.reference ?? ''}${d.company_name ? ` — ${d.company_name}` : ''}`;
      break;
    case 'booking_confirmed':
      text = String(d.reference ?? '');
      break;
    case 'booking_cancelled':
      text = `${d.reference ?? ''}${d.reason ? ` — ${d.reason}` : ''}`;
      break;
    case 'payment_failed':
      text = String(d.reference ?? '');
      break;
    case 'report_ready':
      text = String(d.title ?? '');
      break;
    case 'staff_account_created':
      text = String(d.email ?? '');
      break;
    case 'join_request_submitted':
      text = `${d.name ?? ''}${d.specialization ? ` — ${d.specialization}` : ''}`;
      break;
    case 'review_submitted':
      text = `${d.name ?? ''}${typeof d.rating === 'number' ? ` — ${d.rating}/5` : ''}`;
      break;
    case 'support_ticket_created':
    case 'support_ticket_message':
      text = String(d.reference ?? '');
      break;
  }
  const recipient = d.recipient as { name?: string } | undefined;
  if (recipient?.name) {
    text = text ? `${text} — ${t('notifications.sentTo').replace('{name}', recipient.name)}` : '';
  }
  return text;
}

function notificationLink(n: Notification, guard: 'admin' | 'client'): string | null {
  const d = n.data as Record<string, unknown>;
  const type = String(d.type ?? n.type ?? '');
  const base = guard === 'admin' ? '/admin' : '';
  switch (type) {
    case 'new_booking':
    case 'booking_confirmed':
    case 'booking_cancelled':
    case 'payment_failed':
      return typeof d.booking_id === 'number' ? `${base}/bookings/${d.booking_id}` : null;
    case 'report_ready':
      return typeof d.report_id === 'number' ? `${base}/reports/${d.report_id}` : null;
    case 'client_welcome': {
      const r = d.recipient as { type?: string; id?: number } | undefined;
      return guard === 'admin' && r?.type === 'client' && r.id ? `/admin/clients/${r.id}` : null;
    }
    case 'staff_account_created': {
      const r = d.recipient as { type?: string; id?: number } | undefined;
      return guard === 'admin' && r?.type === 'user' && r.id ? `/admin/users/${r.id}` : null;
    }
    case 'join_request_submitted':
      return guard === 'admin' && typeof d.join_request_id === 'number'
        ? `/admin/join-requests/${d.join_request_id}`
        : null;
    case 'review_submitted':
      return guard === 'admin' && typeof d.review_id === 'number'
        ? `/admin/reviews/${d.review_id}`
        : null;
    case 'support_ticket_created':
    case 'support_ticket_message':
      return typeof d.ticket_id === 'number' ? `${base}/support-tickets/${d.ticket_id}` : null;
    default:
      return null;
  }
}
