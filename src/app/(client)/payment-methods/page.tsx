'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { useI18n } from '@/lib/i18n/i18n-context';
import { CardForm } from '@/components/payment/CardForm';
import {
  ActionsMenu,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  useToast,
} from '@/components/ui';
import type { PaymentMethod } from '@/types/api';

// §12.7 — saved payment methods (CLI-PM-01..04). The raw gateway token is
// never returned; adding a card tokenizes in the browser first (§11.5).
export default function PaymentMethodsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<PaymentMethod | null>(null);

  const query = useQuery({
    queryKey: ['client', 'payment-methods'],
    queryFn: () => api.get('/client/payment-methods').then((r) => r.data.data as PaymentMethod[]),
  });
  const cards = query.data;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['client', 'payment-methods'] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/client/payment-methods/${id}`),
    onSuccess: () => {
      toast.success(t('paymentMethods.deleted'));
      setDeleting(null);
      invalidate();
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  const setDefault = useMutation({
    mutationFn: (id: number) => api.patch(`/client/payment-methods/${id}/default`),
    onSuccess: () => {
      invalidate();
      toast.success(t('profile.saved'));
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title={t('paymentMethods.title')}
        actions={
          <Button size="sm" onClick={() => setAdding(true)}>
            + {t('paymentMethods.add')}
          </Button>
        }
      />

      {query.isLoading ? (
        <div className="page-loader">
          <span className="spinner" />
        </div>
      ) : query.isError || !cards ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : cards.length === 0 ? (
        <EmptyState title={t('paymentMethods.empty')} body={t('paymentMethods.emptyBody')} />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {cards.map((card) => (
            <div key={card.id} className="bg-surface border border-border rounded-2xl p-5" style={{ boxShadow: 'var(--shadow)' }}>
              <div className="flex items-center gap-3 flex-wrap">
                <strong className="text-[1.05rem]" dir="ltr">
                  {card.display}
                </strong>
                {card.is_default && (
                  <span className="text-accent" title={t('paymentMethods.default')}>
                    ★
                  </span>
                )}
                {card.is_expired && <Badge color="red">{t('paymentMethods.expired')}</Badge>}
              </div>
              <div className="text-muted text-[0.86rem] mt-2 flex gap-4">
                {card.holder_name && <span>{card.holder_name}</span>}
                <span dir="ltr">
                  {String(card.exp_month).padStart(2, '0')}/{card.exp_year}
                </span>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-border/60 flex-wrap">
                <span className="ms-auto">
                  <ActionsMenu
                    ariaLabel={t('common.actions')}
                    items={[
                      ...(!card.is_default && !card.is_expired
                        ? [
                            {
                              key: 'default',
                              label: t('paymentMethods.setDefault'),
                              onClick: () => setDefault.mutate(card.id),
                              disabled: setDefault.isPending,
                            },
                          ]
                        : []),
                      {
                        key: 'delete',
                        label: t('common.delete'),
                        danger: true,
                        onClick: () => setDeleting(card),
                      },
                    ]}
                  />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* add card modal — tokenize first, then POST the token */}
      <AddCardModal open={adding} onClose={() => setAdding(false)} onSaved={invalidate} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title={t('common.delete')}
        body={t('paymentMethods.deleteConfirm')}
        danger
        loading={deleteMutation.isPending}
      />
    </>
  );
}

function AddCardModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!token) return;
    setBusy(true);
    try {
      // a duplicate token returns the existing card (backend upsert)
      await api.post('/client/payment-methods', { token });
      toast.success(t('paymentMethods.saved'));
      setToken(null);
      onSaved();
      onClose();
    } catch (e) {
      if (isApiError(e)) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('paymentMethods.add')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button onClick={save} loading={busy} disabled={!token}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <CardForm onToken={setToken} />
    </Modal>
  );
}
