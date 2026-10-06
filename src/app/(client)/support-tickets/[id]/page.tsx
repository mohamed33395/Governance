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
import { useClientAuth } from '@/stores/client-auth';
import { useBreadcrumbLabel } from '@/components/admin/Breadcrumbs';
import { supportMessageSchema, type SupportMessageValues } from '@/schemas/support';
import {
  Alert,
  AttachButton,
  Avatar,
  Badge,
  Button,
  ErrorState,
  Textarea,
  useToast,
  VoiceRecorderButton,
} from '@/components/ui';
import type { SupportMessage, SupportTicket, SupportTicketStatus } from '@/types/api';

export default function SupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const toast = useToast();
  const me = useClientAuth((s) => s.user);

  const query = useQuery({
    queryKey: ['client', 'support-tickets', ticketId],
    queryFn: () => api.get(`/client/support-tickets/${ticketId}`).then((r) => r.data.data as SupportTicket),
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupportMessageValues>({
    resolver: zodResolver(supportMessageSchema),
    defaultValues: { body: '', is_internal: false },
  });

  const reply = useMutation({
    mutationFn: async (values: SupportMessageValues) => {
      const fd = new FormData();
      if (values.body) fd.append('body', values.body);
      if (image) fd.append('image', image);
      if (voice) fd.append('voice', voice);
      return api.post(`/client/support-tickets/${ticketId}/messages`, fd);
    },
    onSuccess: () => {
      reset();
      setImage(null);
      setVoice(null);
      queryClient.invalidateQueries({ queryKey: ['client', 'support-tickets', ticketId] });
    },
    onError: (e) => {
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message);
    },
  });

  if (query.isLoading) {
    return <div className="page-loader"><span className="spinner" /></div>;
  }
  if (query.isError || !ticket) {
    return <ErrorState onRetry={() => query.refetch()} />;
  }

  const closed = ticket.status === 'closed';
  const messages = ticket.messages ?? [];

  return (
    <>
      {/* header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/support-tickets" className="text-muted hover:text-accent text-[0.9rem]">
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
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
        {/* conversation thread */}
        <div className="client-panel-card" style={{ marginBottom: 0 }}>
          <h3>{t('supportTickets.conversation')}</h3>

          <div
            ref={threadRef}
            className="flex flex-col gap-5 overflow-y-auto pe-1"
            style={{ maxHeight: 480, scrollbarWidth: 'thin' }}
          >
            {messages.map((m) => (
              <MessageRow key={m.id} message={m} clientName={me?.name ?? t('supportTickets.you')} />
            ))}
          </div>

          {!closed ? (
            <form
              onSubmit={handleSubmit((v) => reply.mutate(v))}
              className="mt-6 pt-5 border-t border-line"
            >
              <Textarea
                placeholder={t('supportTickets.replyPlaceholder')}
                rows={3}
                error={errors.body?.message ? t(errors.body.message) : undefined}
                {...register('body')}
              />
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
          ) : (
            <Alert color="warning" body={t('supportTickets.closedWarning')} className="mt-5" />
          )}
        </div>

        {/* ticket info sidebar */}
        <div className="client-panel-card" style={{ marginBottom: 0 }}>
          <h3>{t('supportTickets.info')}</h3>
          <div className="flex justify-between gap-3 py-1.5 text-[0.9rem]">
            <span className="text-muted">{t('supportTickets.reference')}</span>
            <span dir="ltr">{ticket.reference ?? `#${ticket.id}`}</span>
          </div>
          <div className="flex justify-between gap-3 py-1.5 text-[0.9rem]">
            <span className="text-muted">{t('supportTickets.category')}</span>
            <span>{ticket.category_label ?? t(`supportTickets.categories.${ticket.category}`)}</span>
          </div>
          <div className="flex justify-between gap-3 py-1.5 text-[0.9rem]">
            <span className="text-muted">{t('supportTickets.status')}</span>
            <Badge color={statusColor(ticket.status)}>
              {ticket.status_label ?? t(`supportTickets.statuses.${ticket.status}`)}
            </Badge>
          </div>
          <div className="flex justify-between gap-3 py-1.5 text-[0.9rem]">
            <span className="text-muted">{t('supportTickets.openedAt')}</span>
            <span dir="ltr">{ticket.created_at.slice(0, 16).replace('T', ' ')}</span>
          </div>
          {ticket.last_message_at && (
            <div className="flex justify-between gap-3 py-1.5 text-[0.9rem]">
              <span className="text-muted">{t('supportTickets.lastReply')}</span>
              <span dir="ltr">{ticket.last_message_at.slice(0, 16).replace('T', ' ')}</span>
            </div>
          )}
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
          <time className="text-[0.72rem] text-muted" dir="ltr">
            {new Date(message.created_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
          </time>
        </div>
        <div
          className="mt-1.5 rounded-xl px-3.5 py-2.5"
          style={{
            background: isStaff ? 'color-mix(in srgb, var(--green-deep) 8%, transparent)' : 'var(--cream)',
            border: '1px solid var(--line)',
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
