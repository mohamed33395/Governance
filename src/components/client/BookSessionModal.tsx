'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { useI18n } from '@/lib/i18n/i18n-context';
import {
  Alert,
  Avatar,
  Button,
  DatePicker,
  EmptyState,
  ErrorState,
  Modal,
  Pagination,
  SearchInput,
  SlotPicker,
  Textarea,
  useToast,
} from '@/components/ui';
import { BookingResult } from '@/components/wizard/BookingResult';
import type { Booking, Location, Paginated, PublicConsultant, Slot, Subscription } from '@/types/api';

type Step = 'consultant' | 'datetime' | 'confirm';

// §5.8 — an active subscription can book its next session with no payment.
export function canBookSession(sub: Subscription): boolean {
  return sub.status === 'active' && (sub.is_unlimited || (sub.consultations_remaining ?? 0) > 0);
}

// §5.8 — "Book session" mini-wizard from My packages / dashboard:
// consultant → date & time → location, then POST /client/subscriptions/{id}/bookings.
// There is no quote and no payment step — the session consumes one consultation.
export function BookSessionModal({ subscription, onClose }: { subscription: Subscription | null; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('consultant');
  const [consultant, setConsultant] = useState<PublicConsultant | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [notes, setNotes] = useState('');
  const [month, setMonth] = useState(() => dayjs().format('YYYY-MM'));
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [doneId, setDoneId] = useState<number | null>(null);

  // reset the whole flow whenever a different subscription is opened
  useEffect(() => {
    setStep('consultant');
    setConsultant(null);
    setDate(null);
    setTime(null);
    setLocation(null);
    setNotes('');
    setMonth(dayjs().format('YYYY-MM'));
    setSearch('');
    setPage(1);
    setDoneId(null);
  }, [subscription?.id]);

  // step 1 — PUB-03
  const consultantsQuery = useQuery({
    queryKey: ['public', 'consultants', { search, page }],
    queryFn: () =>
      api
        .get('/public/consultants', { params: { search: search || undefined, page } })
        .then((r) => r.data as Paginated<PublicConsultant>),
    enabled: !!subscription && step === 'consultant',
  });
  const consultants = consultantsQuery.data;

  // step 2 — PUB-05 / PUB-06
  const datesQuery = useQuery({
    queryKey: ['public', 'consultants', consultant?.id, 'available-dates', month],
    queryFn: () =>
      api
        .get(`/public/consultants/${consultant!.id}/available-dates`, { params: { month } })
        .then((r) => r.data.data as { month: string; dates: string[] }),
    enabled: !!subscription && step === 'datetime' && !!consultant,
  });
  const slotsQuery = useQuery({
    queryKey: ['public', 'consultants', consultant?.id, 'slots', date],
    queryFn: () =>
      api
        .get(`/public/consultants/${consultant!.id}/slots`, { params: { date } })
        .then((r) => r.data.data as { date: string; slots: Slot[] }),
    enabled: !!subscription && step === 'datetime' && !!consultant && !!date,
  });
  const slots: Slot[] = slotsQuery.data?.slots ?? [];

  // step 3 — CLI-LOC-01 (plain array)
  const locationsQuery = useQuery({
    queryKey: ['client', 'locations'],
    queryFn: () => api.get('/client/locations').then((r) => r.data.data as Location[]),
    enabled: !!subscription && step === 'confirm',
  });
  const locations = locationsQuery.data;

  // pre-select the default location
  useEffect(() => {
    if (!location && locations && locations.length > 0) {
      setLocation(locations.find((l) => l.is_default) ?? locations[0]);
    }
  }, [locations, location]);

  const mutation = useMutation({
    mutationFn: () =>
      api
        .post(`/client/subscriptions/${subscription!.id}/bookings`, {
          consultant_id: consultant!.id,
          date,
          time,
          client_location_id: location!.id,
          ...(notes.trim() ? { client_notes: notes.trim() } : {}),
        })
        .then((r) => r.data.data as { booking: Booking; subscription: Subscription }),

    onSuccess: ({ booking }) => {
      // refresh the subscription card (consultations_used/remaining) and bookings lists
      queryClient.invalidateQueries({ queryKey: ['client'] });
      setDoneId(booking.id);
    },

    onError: (e) => {
      if (!isApiError(e)) return;
      switch (e.code) {
        case 'SLOT_NOT_AVAILABLE': // 409 — slot taken between pick and submit (§5.7)
          setTime(null);
          setStep('datetime');
          slotsQuery.refetch();
          toast.error(t('wizard.slotGone'));
          break;
        case 'SUBSCRIPTION_EXHAUSTED': // quota ran out — refresh the card, close
        case 'SUBSCRIPTION_INACTIVE':
          toast.error(e.message);
          queryClient.invalidateQueries({ queryKey: ['client', 'subscriptions'] });
          onClose();
          break;
        case 'VALIDATION_ERROR':
          toast.error(Object.values(e.errors)[0]?.[0] ?? e.message);
          break;
        default:
          toast.error(e.message);
      }
    },
  });

  const canNext =
    step === 'consultant' ? !!consultant : step === 'datetime' ? !!date && !!time : !!location;
  const STEPS: Step[] = ['consultant', 'datetime', 'confirm'];
  const stepIndex = STEPS.indexOf(step);

  return (
    <Modal
      open={!!subscription}
      onClose={onClose}
      size="lg"
      title={`${t('bookSession.title')}${subscription?.package?.name ? ` — ${subscription.package.name}` : ''}`}
      footer={
        doneId ? undefined : (
          <>
            {stepIndex > 0 && (
              <Button variant="ghost" onClick={() => setStep(STEPS[stepIndex - 1])} disabled={mutation.isPending}>
                {t('common.back')}
              </Button>
            )}
            {step === 'confirm' ? (
              <Button
                variant="primary"
                onClick={() => mutation.mutate()}
                disabled={!canNext}
                loading={mutation.isPending}
              >
                {t('wizard.confirmBooking')}
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setStep(STEPS[stepIndex + 1])} disabled={!canNext}>
                {t('common.next')}
              </Button>
            )}
          </>
        )
      }
    >
      {doneId ? (
        <BookingResult kind="success" bookingId={doneId} />
      ) : (
        <>
          <Alert color="success" body={t('bookSession.subtitle')} className="mb-6" />

          {step === 'consultant' && (
            <div>
              <SearchInput
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                placeholder={t('consultants.searchPlaceholder')}
                className="mb-5"
              />
              {consultantsQuery.isLoading ? (
                <div className="page-loader">
                  <span className="spinner" />
                </div>
              ) : consultantsQuery.isError || !consultants ? (
                <ErrorState onRetry={() => consultantsQuery.refetch()} />
              ) : consultants.data.length === 0 ? (
                <EmptyState title={t('common.empty')} />
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3" role="radiogroup">
                    {consultants.data.map((c) => {
                      const active = consultant?.id === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => {
                            setConsultant(c);
                            setDate(null);
                            setTime(null);
                          }}
                          className={`flex items-center gap-3 rounded-2xl border p-3.5 text-start transition-all cursor-pointer ${
                            active ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border bg-surface hover:border-accent'
                          }`}
                        >
                          <Avatar src={c.avatar_thumb_url} name={c.name} size="md" />
                          <span className="min-w-0">
                            <strong className="block text-text text-[0.95rem]">{c.name}</strong>
                            {c.specialization && (
                              <span className="block text-accent text-[0.8rem] mt-0.5">{c.specialization}</span>
                            )}
                          </span>
                          <span
                            aria-hidden="true"
                            className={`ms-auto w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                              active ? 'border-accent bg-accent' : 'border-border'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <Pagination meta={consultants.meta} onPage={setPage} className="mt-5" />
                </>
              )}
            </div>
          )}

          {step === 'datetime' && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-[0.95rem] mb-3 text-muted font-medium">{t('wizard.chooseDate')}</h4>
                {datesQuery.isError ? (
                  <ErrorState onRetry={() => datesQuery.refetch()} />
                ) : (
                  <DatePicker
                    value={date}
                    onSelect={(d) => {
                      setDate(d);
                      setTime(null);
                    }}
                    enabledDates={datesQuery.data?.dates}
                    onMonthChange={setMonth}
                  />
                )}
              </div>
              <div>
                <h4 className="text-[0.95rem] mb-3 text-muted font-medium">{t('wizard.chooseTime')}</h4>
                {!date ? (
                  <p className="text-muted text-[0.9rem] py-4">{t('wizard.pickDateFirst')}</p>
                ) : slotsQuery.isLoading ? (
                  <div className="page-loader">
                    <span className="spinner" />
                  </div>
                ) : slotsQuery.isError ? (
                  <ErrorState onRetry={() => slotsQuery.refetch()} />
                ) : (
                  <SlotPicker slots={slots} value={time} onSelect={setTime} />
                )}
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="flex flex-col gap-5">
              <h4 className="text-[0.95rem] text-muted font-medium">{t('wizard.chooseLocation')}</h4>
              {locationsQuery.isLoading ? (
                <div className="page-loader">
                  <span className="spinner" />
                </div>
              ) : locationsQuery.isError || !locations ? (
                <ErrorState onRetry={() => locationsQuery.refetch()} />
              ) : locations.length === 0 ? (
                <EmptyState
                  title={t('locations.empty')}
                  body={t('locations.emptyBody')}
                  action={
                    <Link href="/locations" className="btn btn-primary btn-sm">
                      {t('locations.add')}
                    </Link>
                  }
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-3" role="radiogroup">
                  {locations.map((loc) => {
                    const active = location?.id === loc.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setLocation(loc)}
                        className={`rounded-2xl border p-3.5 text-start transition-all cursor-pointer ${
                          active ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border bg-surface hover:border-accent'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <strong className="text-text">{loc.name}</strong>
                          {loc.is_default && (
                            <span className="text-accent" title={t('locations.default')}>
                              ★
                            </span>
                          )}
                        </span>
                        {loc.city && <span className="block text-muted text-[0.84rem] mt-1">{loc.city}</span>}
                        <span className="block text-muted text-[0.84rem] mt-0.5">{loc.address}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <Textarea
                label={t('wizard.notes')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={1000}
              />
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
