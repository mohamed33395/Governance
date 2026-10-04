'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { applyValidationErrors } from '@/lib/form-errors';
import { useI18n } from '@/lib/i18n/i18n-context';
import { supportTicketCreateSchema, type SupportTicketCreateValues } from '@/schemas/support';
import {
  AttachButton,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Modal,
  Pagination,
  Select,
  Table,
  TableSkeleton,
  Textarea,
  useToast,
  VoiceRecorderButton,
} from '@/components/ui';
import type { Paginated, SupportTicket, SupportTicketStatus } from '@/types/api';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
const CATEGORIES = ['general_inquiry', 'booking_issue', 'payment_issue', 'technical', 'consultant_complaint'] as const;

export default function SupportTicketsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const query = useQuery({
    queryKey: ['client', 'support-tickets', { page, status }],
    queryFn: () =>
      api
        .get('/client/support-tickets', { params: { page, status: status || undefined } })
        .then((r) => r.data as Paginated<SupportTicket>),
  });
  const data = query.data;

  return (
    <>
      <div className="client-card-head" style={{ marginBottom: 20 }}>
        <h3>{t('supportTickets.title')}</h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          {t('supportTickets.new')}
        </Button>
      </div>

      <div className="mb-4" style={{ maxWidth: 220 }}>
        <Select
          options={STATUSES.map((s) => ({ value: s, label: t(`supportTickets.statuses.${s}`) }))}
          placeholder={t('supportTickets.status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState
          title={t('supportTickets.noTickets')}
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              {t('supportTickets.new')}
            </Button>
          }
        />
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
                key: 'category',
                header: t('supportTickets.category'),
                render: (row) => row.category_label ?? t(`supportTickets.categories.${row.category}`),
              },
              {
                key: 'status',
                header: t('common.status'),
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
            ]}
            rows={data.data}
            rowKey={(t) => t.id}
            onRowClick={(t) => router.push(`/support-tickets/${t.id}`)}
          />
          <Pagination meta={data.meta} onPage={setPage} className="mt-6" />
        </>
      )}

      <CreateTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          setCreateOpen(false);
          query.refetch();
          toast.success(t('supportTickets.created'));
          router.push(`/support-tickets/${id}`);
        }}
      />
    </>
  );
}

function CreateTicketModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [image, setImage] = useState<File | null>(null);
  const [voice, setVoice] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupportTicketCreateValues>({
    resolver: zodResolver(supportTicketCreateSchema),
    defaultValues: { category: 'general_inquiry', description: '' },
  });

  const mutation = useMutation({
    mutationFn: async (values: SupportTicketCreateValues) => {
      const fd = new FormData();
      fd.append('category', values.category);
      fd.append('description', values.description);
      if (image) fd.append('image', image);
      if (voice) fd.append('voice', voice);
      return api.post('/client/support-tickets', fd).then((r) => r.data.data as SupportTicket);
    },
    onSuccess: (ticket) => {
      reset();
      setImage(null);
      setVoice(null);
      onCreated(ticket.id);
    },
    onError: (e) => {
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e);
      else if (isApiError(e)) toast.error(e.message);
    },
  });

  const err = (key?: string) => (key ? t(key) : undefined);

  return (
    <Modal open={open} onClose={onClose} title={t('supportTickets.newTicketHeading')}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <Select
          label={t('supportTickets.category')}
          options={CATEGORIES.map((c) => ({
            value: c,
            label: t(`supportTickets.categories.${c}`),
          }))}
          {...register('category')}
        />
        <Textarea
          label={t('supportTickets.description')}
          rows={4}
          error={err(errors.description?.message)}
          {...register('description')}
        />

        {/* compact attachment icons */}
        <div className="flex items-center gap-5 mt-4">
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

        <div className="flex justify-end gap-3 mt-5">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending}>
            {t('supportTickets.send')}
          </Button>
        </div>
      </form>
    </Modal>
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
