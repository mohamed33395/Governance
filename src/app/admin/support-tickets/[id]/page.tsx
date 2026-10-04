'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { useBlobUrl, downloadFile } from '@/lib/files';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePermissions } from '@/lib/permissions';
import { supportMessageSchema, type SupportMessageValues } from '@/schemas/support';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { useBreadcrumbLabel } from '@/components/admin/Breadcrumbs';
import {
  Alert,
  AttachButton,
  Avatar,
  Badge,
  Button,
  Checkbox,
  ErrorState,
  Select,
  Textarea,
  useToast,
  VoiceRecorderButton,
} from '@/components/ui';
import type { SupportMessage, SupportTicket, SupportTicketStatus } from '@/types/api';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;

const card = 'bg-surface border border-border rounded-2xl p-5';
const cardTitle = 'text-[0.95rem] mb-4 pb-3 border-b border-border';
const infoRow = 'flex justify-between gap-3 py-1.5 text-[0.9rem]';
const infoLabel = 'text-muted';

export default function AdminSupportTicketDetailPage() {
  return (
    <RequirePermission perm="view-support-tickets">
      <SupportTicketDetailInner />
    </RequirePermission>
  );
}

function SupportTicketDetailInner() {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { type, can } = usePermissions();
  const isStaff = type === 'admin';
  const canReply = can('reply-support-tickets');
  const canManage = can('manage-support-tickets');

  const query = useQuery({
    queryKey: ['admin', 'support-tickets', ticketId],
    queryFn: () => api.get(`/admin/support-tickets/${ticketId}`).then((r) => r.data.data as SupportTicket),
  });
  const ticket = query.data;
  useBreadcrumbLabel(ticket?.reference ?? (ticket ? `#${ticket.id}` : null));

  const [image, setImage] = useState<File | null>(null);
  const [voice, setVoice] = useState<File | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // keep the thread pinned to the newest message
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [ticket?.messages?.length]);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupportMessageValues>({
    resolver: zodResolver(supportMessageSchema),
    defaultValues: { body: '', is_internal: false },
  });
  const isInternal = watch('is_internal') ?? false;

  const reply = useMutation({
    mutationFn: async (values: SupportMessageValues) => {
      const fd = new FormData();
      if (values.body) fd.append('body', values.body);
      if (image) fd.append('image', image);
      if (voice) fd.append('voice', voice);
      if (isStaff && values.is_internal) fd.append('is_internal', '1');
      return api.post(`/admin/support-tickets/${ticketId}/messages`, fd);
    },
    onSuccess: () => {
      reset();
      setImage(null);
      setVoice(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets', ticketId] });
    },
    onError: (e) => {
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/admin/support-tickets/${ticketId}/status`, { status }),
    onSuccess: () => {
      toast.success(t('profile.saved'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets', ticketId] });
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  if (query.isLoading) {
    return <div className="page-loader"><span className="spinner" /></div>;
  }
  if (query.isError || !ticket) {
    return <ErrorState onRetry={() => query.refetch()} />;
  }

  const messages = ticket.messages ?? [];
  const closed = ticket.status === 'closed';
  const clientName = ticket.client?.name ?? '—';

  return (
    <>
      {/* header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/admin/support-tickets" className="text-muted hover:text-accent text-[0.9rem]">
            <span className="inline-block rtl:-scale-x-100">‹</span> {t('common.back')}
          </Link>
          <h1 className="text-2xl" dir="ltr">
            {ticket.reference ?? `#${ticket.id}`}
          </h1>
          <Badge color={statusColor(ticket.status)}>
            {ticket.status_label ?? t(`supportTickets.statuses.${ticket.status}`)}
          </Badge>
          <span className="text-muted text-[0.9rem]">
            {ticket.category_label ?? t(`supportTickets.categories.${ticket.category}`)} ·{' '}
            <bdi dir="ltr">{ticket.created_at.slice(0, 16).replace('T', ' ')}</bdi>
          </span>
        </div>

        {isStaff && canManage && (
          <Select
            options={STATUSES.map((s) => ({ value: s, label: t(`supportTickets.statuses.${s}`) }))}
            value={ticket.status}
            onChange={(e) => statusMutation.mutate(e.target.value)}
            disabled={statusMutation.isPending}
            style={{ minWidth: 180 }}
          />
        )}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_330px] gap-5 items-start">
        {/* conversation thread */}
        <div className={card}>
          <h3 className={cardTitle}>{t('supportTickets.conversation')}</h3>

          <div
            ref={threadRef}
            className="flex flex-col gap-5 overflow-y-auto pe-1"
            style={{ maxHeight: 480, scrollbarWidth: 'thin' }}
          >
            {messages.map((m) => (
              <MessageRow key={m.id} message={m} clientName={clientName} />
            ))}
          </div>

          {!closed && canReply && (
            <form
              onSubmit={handleSubmit((v) => reply.mutate(v))}
              className="mt-6 pt-5 border-t border-border"
            >
              <Textarea
                placeholder={t('supportTickets.replyPlaceholder')}
                rows={3}
                error={errors.body?.message ? t(errors.body.message) : undefined}
                {...register('body')}
              />
              {isStaff && (
                <div className="mt-2">
                  <Checkbox
                    label={t('supportTickets.internalNote')}
                    checked={isInternal}
                    onChange={(e) => setValue('is_internal', e.target.checked)}
                  />
                </div>
              )}
              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-4">
                  <AttachButton
                    icon="image"
                    label={t('supportTickets.image')}
                    accept=".jpg,.jpeg,.png,.webp"
                    maxMb={10}
                    onFile={setImage}
                    fileName={image?.name}
                    onClear={() => setImage(null)}
                  />
                  <VoiceRecorderButton
                    label={t('supportTickets.voice')}
                    onFile={setVoice}
                    fileName={voice?.name}
                    onClear={() => setVoice(null)}
                  />
                </div>
                <Button type="submit" loading={isSubmitting || reply.isPending}>
                  {t('supportTickets.send')}
                </Button>
              </div>
            </form>
          )}
          {closed && <Alert color="warning" body={t('supportTickets.closedWarning')} className="mt-5" />}
        </div>

        {/* sidebar */}
        <div className="flex flex-col gap-5">
          {/* client */}
          {ticket.client && (
            <div className={card}>
              <h3 className={cardTitle}>{t('nav.clients')}</h3>
              <div className="flex items-center gap-3.5">
                <Avatar src={null} name={ticket.client.name} size="lg" />
                <div className="min-w-0">
                  <strong className="block truncate">{ticket.client.name}</strong>
                  {ticket.client.company_name && (
                    <span className="text-muted text-[0.86rem] block truncate">
                      {ticket.client.company_name}
                    </span>
                  )}
                  {ticket.client.email && (
                    <span className="text-muted text-[0.82rem] block truncate" dir="ltr">
                      {ticket.client.email}
                    </span>
                  )}
                </div>
                {isStaff && can('view-clients') && (
                  <Link href={`/admin/clients/${ticket.client.id}`} className="ms-auto shrink-0">
                    <Button variant="ghost" size="sm">
                      {t('common.view')}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* consultant */}
          {ticket.consultant && (
            <div className={card}>
              <h3 className={cardTitle}>{t('nav.consultants')}</h3>
              <div className="flex items-center gap-3.5">
                <Avatar src={null} name={ticket.consultant.name} size="lg" />
                <strong className="block truncate">{ticket.consultant.name}</strong>
                {isStaff && can('view-consultants') && (
                  <Link href={`/admin/consultants/${ticket.consultant.id}`} className="ms-auto shrink-0">
                    <Button variant="ghost" size="sm">
                      {t('common.view')}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ticket info */}
          <div className={card}>
            <h3 className={cardTitle}>{t('supportTickets.info')}</h3>
            <div className={infoRow}>
              <span className={infoLabel}>{t('supportTickets.reference')}</span>
              <span dir="ltr">{ticket.reference ?? `#${ticket.id}`}</span>
            </div>
            <div className={infoRow}>
              <span className={infoLabel}>{t('supportTickets.category')}</span>
              <span>{ticket.category_label ?? t(`supportTickets.categories.${ticket.category}`)}</span>
            </div>
            <div className={infoRow}>
              <span className={infoLabel}>{t('supportTickets.status')}</span>
              <Badge color={statusColor(ticket.status)}>
                {ticket.status_label ?? t(`supportTickets.statuses.${ticket.status}`)}
              </Badge>
            </div>
            <div className={infoRow}>
              <span className={infoLabel}>{t('supportTickets.openedAt')}</span>
              <span dir="ltr">{ticket.created_at.slice(0, 16).replace('T', ' ')}</span>
            </div>
            {ticket.last_message_at && (
              <div className={infoRow}>
                <span className={infoLabel}>{t('supportTickets.lastReply')}</span>
                <span dir="ltr">{ticket.last_message_at.slice(0, 16).replace('T', ' ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function MessageRow({ message, clientName }: { message: SupportMessage; clientName: string }) {
  const { t, lang } = useI18n();
  const isStaff = message.sender_type === 'user';
  const isSystem = message.sender_type === 'system';
  const name =
    message.sender?.name ??
    (isStaff ? t('supportTickets.staff') : isSystem ? t('supportTickets.system') : clientName);
  const voiceUrl = useBlobUrl(message.voice?.url);
  const imageUrl = useBlobUrl(message.image?.url);

  return (
    <div className="flex gap-3">
      <Avatar src={null} name={name === '—' ? '؟' : name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <strong className="text-[0.88rem]">{name}</strong>
          {message.is_internal && <Badge color="amber">{t('supportTickets.internalNote')}</Badge>}
          <time className="text-[0.72rem] text-muted" dir="ltr">
            {new Date(message.created_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
          </time>
        </div>
        <div
          className="mt-1.5 rounded-xl px-3.5 py-2.5"
          style={{
            background: message.is_internal
              ? 'rgba(193,155,74,.12)'
              : isStaff
                ? 'color-mix(in srgb, var(--green-deep) 8%, transparent)'
                : 'var(--cream)',
            border: `1px solid ${message.is_internal ? 'rgba(193,155,74,.4)' : 'var(--line)'}`,
          }}
        >
          {message.body && (
            <p className="text-[0.9rem] leading-relaxed whitespace-pre-wrap">{message.body}</p>
          )}
          {message.image && (
            <button
              type="button"
              className="mt-2 block"
              onClick={() => downloadFile(message.image!.url, message.image!.name)}
              title={message.image.name}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={message.image.name}
                  className="rounded-lg border border-border max-w-[220px] max-h-[160px] object-cover"
                />
              ) : (
                <span className="text-xs underline text-accent">{message.image.name}</span>
              )}
            </button>
          )}
          {message.voice &&
            (voiceUrl ? (
              <audio controls src={voiceUrl} className="mt-2 w-full max-w-xs" />
            ) : (
              <span className="text-xs text-muted block mt-2">{message.voice.name}</span>
            ))}
        </div>
      </div>
    </div>
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
