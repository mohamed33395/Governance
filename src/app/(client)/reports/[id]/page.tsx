'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { downloadFile } from '@/lib/files';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Button, ErrorState, PageHeader } from '@/components/ui';
import type { Report } from '@/types/api';

// §12.4 — report details (CLI-RPT-02). URL contract: the email button lands here.
export default function ClientReportDetailsPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['client', 'reports', params.id],
    queryFn: () => api.get(`/client/reports/${params.id}`).then((r) => r.data.data as Report),
  });
  const report = query.data;

  if (query.isLoading) {
    return (
      <div className="page-loader">
        <span className="spinner" />
      </div>
    );
  }
  if (query.isError || !report) return <ErrorState onRetry={() => query.refetch()} />;

  const download = async () => {
    await downloadFile(`/client/reports/${report.id}/download`, report.file.name);
    queryClient.invalidateQueries({ queryKey: ['client', 'reports'] });
    queryClient.invalidateQueries({ queryKey: ['client', 'dashboard'] });
  };

  const card = 'bg-surface border border-border rounded-2xl p-5';

  return (
    <>
      <div className="mb-6">
        <Link href="/reports" className="text-muted hover:text-accent text-[0.9rem]">
          <span className="inline-block rtl:-scale-x-100">‹</span> {t('common.back')}
        </Link>
      </div>
      <PageHeader
        title={report.title}
        subtitle={
          <>
            {t('reports.booking')}: <span dir="ltr">{report.booking.reference}</span> · {report.booking.date} ·{' '}
            {t('reports.consultant')}: {report.consultant.name}
          </>
        }
      />

      {report.summary && (
        <div className={`${card} mb-5`}>
          <h3 className="text-[0.95rem] mb-3 pb-3 border-b border-border">{t('reports.summary')}</h3>
          <p className="text-[0.92rem] leading-relaxed whitespace-pre-line">{report.summary}</p>
        </div>
      )}

      <div className={card}>
        <h3 className="text-[0.95rem] mb-4 pb-3 border-b border-border">{t('reports.file')}</h3>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span
              className="w-11 h-11 rounded-xl inline-flex items-center justify-center"
              style={{ background: 'rgba(26,65,46,.08)', color: 'var(--primary)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </span>
            <div>
              <strong className="block text-[0.92rem]" dir="ltr">
                {report.file.name}
              </strong>
              <span className="text-muted text-[0.82rem]" dir="ltr">
                {report.file.size_human}
              </span>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={download}>
            {t('reports.download')}
          </Button>
        </div>
      </div>
    </>
  );
}
