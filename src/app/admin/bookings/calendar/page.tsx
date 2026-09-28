'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n/i18n-context';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { Button, ErrorState, PageHeader, Select } from '@/components/ui';
import type { BookingCalendarItem, BookingStatus, Consultant, Paginated } from '@/types/api';

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'var(--info)',
  pending_payment: 'var(--warning)',
  completed: 'var(--success)',
  cancelled: 'var(--danger)',
};

// §13.7 — calendar view (BKG-06)
export default function BookingsCalendarPage() {
  return (
    <RequirePermission perm="view-bookings">
      <CalendarInner />
    </RequirePermission>
  );
}

function CalendarInner() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { type } = usePermissions();
  const [month, setMonth] = useState(() => dayjs().format('YYYY-MM'));
  const [consultantId, setConsultantId] = useState('');

  const first = dayjs(`${month}-01`);
  // request exactly the month's days (max range is 62 days)
  const from = first.format('YYYY-MM-DD');
  const to = first.endOf('month').format('YYYY-MM-DD');

  const query = useQuery({
    queryKey: ['admin', 'bookings-calendar', { month, consultantId }],
    queryFn: () =>
      api
        .get('/admin/bookings/calendar', {
          params: { from, to, consultant_id: consultantId || undefined },
        })
        .then((r) => r.data.data as BookingCalendarItem[]),
  });
  const items = query.data;

  const consultantsQuery = useQuery({
    queryKey: ['admin', 'consultants', 'options'],
    queryFn: () =>
      api.get('/admin/consultants', { params: { per_page: 100 } }).then((r) => (r.data as Paginated<Consultant>).data),
    enabled: type === 'admin',
    staleTime: 60_000,
  });

  const daysInMonth = first.daysInMonth();
  const startOffset = first.day(); // 0 = Sunday
  const cells: (string | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => first.date(i + 1).format('YYYY-MM-DD')),
  ];

  const byDate = new Map<string, BookingCalendarItem[]>();
  (items ?? []).forEach((item) => {
    const day = dayjs(item.starts_at).format('YYYY-MM-DD');
    byDate.set(day, [...(byDate.get(day) ?? []), item]);
  });

  const weekDays =
    lang === 'ar'
      ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <PageHeader
        title={t('bookingsAdmin.calendarView')}
        actions={
          <Link href="/admin/bookings">
            <Button variant="outline" size="sm">
              {t('bookingsAdmin.listView')}
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-3 flex-wrap mb-5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setMonth(first.add(-1, 'month').format('YYYY-MM'))}>
            <span className="inline-block rtl:-scale-x-100">‹</span>
          </Button>
          <strong className="text-[1.05rem] min-w-[140px] text-center">
            {first.locale(lang).format('MMMM YYYY')}
          </strong>
          <Button variant="ghost" size="sm" onClick={() => setMonth(first.add(1, 'month').format('YYYY-MM'))}>
            <span className="inline-block rtl:-scale-x-100">›</span>
          </Button>
        </div>
        {type === 'admin' && (
          <Select
            options={(consultantsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            placeholder={t('bookings.consultant')}
            value={consultantId}
            onChange={(e) => setConsultantId(e.target.value)}
            style={{ maxWidth: 200 }}
          />
        )}
      </div>

      {query.isLoading ? (
        <div className="page-loader">
          <span className="spinner" />
        </div>
      ) : query.isError || !items ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-surface">
          <div className="grid grid-cols-7">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-[0.78rem] text-muted py-2.5 border-b border-border font-semibold">
                {d}
              </div>
            ))}
            {cells.map((date, i) => (
              <div
                key={i}
                className="min-h-[104px] border-b border-e border-border/50 p-1.5 align-top"
                style={{ background: date ? undefined : 'rgba(0,0,0,0.02)' }}
              >
                {date && (
                  <>
                    <span
                      className={`text-[0.78rem] inline-flex w-6 h-6 items-center justify-center rounded-full ${
                        date === dayjs().format('YYYY-MM-DD') ? 'bg-accent text-accent-foreground font-bold' : 'text-muted'
                      }`}
                    >
                      {dayjs(date).date()}
                    </span>
                    <div className="flex flex-col gap-1 mt-1">
                      {(byDate.get(date) ?? []).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => router.push(`/admin/bookings/${item.id}`)}
                          className="text-start rounded-md px-1.5 py-1 text-[0.7rem] leading-tight cursor-pointer border-none text-white truncate"
                          style={{ background: STATUS_COLORS[item.status] ?? 'var(--info)' }}
                          title={`${item.reference} — ${item.client.company_name}`}
                        >
                          <span dir="ltr">{item.reference}</span> · {item.client.company_name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
