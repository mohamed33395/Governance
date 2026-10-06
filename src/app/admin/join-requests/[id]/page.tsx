'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import { useI18n } from '@/lib/i18n/i18n-context';
import { usePermissions } from '@/lib/permissions';
import { downloadFile } from '@/lib/files';
import { RequirePermission } from '@/components/admin/RequirePermission';
import { Badge, Button, ErrorState, useToast } from '@/components/ui';
import type { JoinRequest } from '@/types/api';

export default function JoinRequestDetailPage() {
  return (
    <RequirePermission perm="view-join-requests">
      <JoinRequestDetailInner />
    </RequirePermission>
  );
}

function JoinRequestDetailInner() {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const query = useQuery({
    queryKey: ['admin', 'join-requests', requestId],
    queryFn: () => api.get(`/admin/join-requests/${requestId}`).then((r) => r.data.data as JoinRequest),
  });
  const request = query.data;

  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'join-requests', requestId] });

  const approve = useMutation({
    mutationFn: () => api.patch(`/admin/join-requests/${requestId}/approve`),
    onSuccess: () => {
      toast.success(t('joinRequests.approved'));
      invalidate();
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: (reason: string) => api.patch(`/admin/join-requests/${requestId}/reject`, { reason }),
    onSuccess: () => {
      toast.success(t('joinRequests.rejected'));
      setShowReject(false);
      setRejectReason('');
      invalidate();
    },
    onError: (e) => isApiError(e) && toast.error(e.message),
  });

  if (query.isLoading) {
    return (
      <div className="page-loader">
        <span className="spinner" />
      </div>
    );
  }
  if (query.isError || !request) {
    return <ErrorState onRetry={() => query.refetch()} />;
  }

  const row = 'flex justify-between gap-3 py-2 border-b border-border/60 text-[0.9rem]';

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-id-title">{t('joinRequests.detail')}</h1>
          <Badge color={statusColor(request.status)} className="mt-2">
            {t(`joinRequests.statuses.${request.status}`)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/join-requests')}>
            {t('common.back')}
          </Button>
          {request.status === 'pending' && can('manage-join-requests') && (
            <>
              <Button size="sm" onClick={() => approve.mutate()} loading={approve.isPending}>
                {t('joinRequests.approve')}
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowReject(true)}>
                {t('joinRequests.reject')}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="panel-card" style={{ marginBottom: 24 }}>
        <div className={row}>
          <span className="text-muted">{t('joinRequests.name')}</span>
          <span>{request.name}</span>
        </div>
        <div className={row}>
          <span className="text-muted">{t('joinRequests.email')}</span>
          <span dir="ltr">{request.email}</span>
        </div>
        <div className={row}>
          <span className="text-muted">{t('joinRequests.phone')}</span>
          <span dir="ltr">{request.phone}</span>
        </div>
        <div className={row}>
          <span className="text-muted">{t('joinRequests.specialization')}</span>
          <span>{request.specialization}</span>
        </div>
        {request.linkedin_url && (
          <div className={row}>
            <span className="text-muted">{t('joinRequests.linkedin')}</span>
            <a href={request.linkedin_url} target="_blank" rel="noreferrer" className="text-primary hover:underline" dir="ltr">
              {request.linkedin_url}
            </a>
          </div>
        )}
        {request.bio && (
          <div className={row} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <span className="text-muted">{t('joinRequests.bio')}</span>
            <p>{request.bio}</p>
          </div>
        )}
        <div className={row} style={{ borderBottom: 'none' }}>
          <span className="text-muted">{t('joinRequests.cv')}</span>
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => downloadFile(`/admin/join-requests/${requestId}/cv`, `${request.name}-cv.pdf`)}
          >
            {t('joinRequests.downloadCv')}
          </button>
        </div>
      </div>

      {request.reviewed_at && (
        <div className="panel-card" style={{ marginBottom: 24 }}>
          <div className={row} style={{ borderBottom: 'none' }}>
            <span className="text-muted">{t('common.date')}</span>
            <span dir="ltr">{request.reviewed_at.slice(0, 16).replace('T', ' ')}</span>
          </div>
        </div>
      )}

      {showReject && (
        <div className="modal-backdrop open">
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <h3>{t('joinRequests.reject')}</h3>
            <p className="text-sm text-muted mb-4">{t('joinRequests.rejectConfirm')}</p>
            <textarea
              className="ui-input resize-y"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('joinRequests.rejectReason')}
            />
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowReject(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={() => reject.mutate(rejectReason)}
                loading={reject.isPending}
                disabled={!rejectReason.trim()}
              >
                {t('joinRequests.reject')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function statusColor(status: JoinRequest['status']) {
  switch (status) {
    case 'pending':
      return 'amber';
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    default:
      return 'gray';
  }
}
