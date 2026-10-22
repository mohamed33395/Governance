'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import { useAdminAuth } from '@/stores/admin-auth';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Avatar, Button, CopyButton, useToast } from '@/components/ui';

// Google Fonts loads via a cross-origin <link> in the root layout, so
// html-to-image cannot read its cssRules (SecurityError). Fetching the same
// stylesheet and passing it as fontEmbedCSS bypasses the document stylesheet
// scan entirely AND keeps Amiri / IBM Plex embedded in the export.
const FONT_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap';
let fontCssPromise: Promise<string> | null = null;
const getFontEmbedCss = () =>
  (fontCssPromise ??= fetch(FONT_STYLESHEET)
    .then((r) => r.text())
    .catch(() => ''));

// Printable consultant ID card: photo + name + specialization + QR that opens
// the public consultant profile (/consultants/{id}). Shown on /admin/profile
// for consultant accounts only.
export function ConsultantIdCard() {
  const { t } = useI18n();
  const toast = useToast();
  const user = useAdminAuth((s) => s.user);
  const cardRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [profileUrl, setProfileUrl] = useState('');
  const [downloading, setDownloading] = useState<'card' | 'qr' | null>(null);

  useEffect(() => {
    if (user) setProfileUrl(`${window.location.origin}/consultants/${user.id}`);
  }, [user]);

  if (!user || user.type !== 'consultant') return null;

  const save = (dataUrl: string, filename: string) => {
    const a = Object.assign(document.createElement('a'), { href: dataUrl, download: filename });
    a.click();
  };

  const downloadCard = async () => {
    const node = cardRef.current;
    if (!node) return;
    setDownloading('card');
    // neutralize the card's mx-auto on the LIVE node for the duration of the
    // capture — options.style doesn't reliably reach the cloned root, and the
    // computed auto margin otherwise gets baked into the PNG as whitespace
    const prevMargin = node.style.margin;
    node.style.margin = '0';
    try {
      const fontEmbedCSS = await getFontEmbedCss();
      const dataUrl = await toPng(node, { pixelRatio: 3, cacheBust: true, fontEmbedCSS });

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('png decode'));
        img.src = dataUrl;
      });

      // standard A4 page with the card centered — deterministic layout, no
      // dependence on jsPDF's custom-format handling; the card can't clip
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF(); // A4 portrait, unit mm
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const cardW = Math.min(90, pageW - 20); // ~ID badge width with margin
      const cardH = (img.naturalHeight / img.naturalWidth) * cardW;
      pdf.addImage(dataUrl, 'PNG', (pageW - cardW) / 2, (pageH - cardH) / 2, cardW, cardH);
      pdf.save(`consultant-card-${user.id}.pdf`);
    } catch {
      toast.error(t('common.error'));
    } finally {
      node.style.margin = prevMargin;
      setDownloading(null);
    }
  };

  const downloadQr = async () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    setDownloading('qr');
    try {
      const size = 512;
      const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('qr render'));
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
      });
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no canvas');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      save(canvas.toDataURL('image/png'), `consultant-qr-${user.id}.png`);
    } catch {
      toast.error(t('consultantCard.downloadError'));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <h3 className="text-[1rem] mb-5 pb-3 border-b border-border">{t('consultantCard.title')}</h3>

      <div
        ref={cardRef}
        className="mx-auto w-[300px] overflow-hidden rounded-3xl border border-border bg-surface"
      >
        <div className="h-24" style={{ background: 'var(--gold)' }} />
        <div className="-mt-11 flex flex-col items-center px-6 pb-6">
          {/* avatar goes through /api/media so the PNG/PDF export can fetch it
              same-origin (artisan serve sends no CORS headers on /storage) */}
          <Avatar
            src={user.avatar_url ? `/api/media?url=${encodeURIComponent(user.avatar_url)}` : null}
            name={user.name}
            size="xl"
          />
          {/* nowrap: in the export the name can wrap differently and the 2nd
              line renders under the solid badge — one centered line + ellipsis
              keeps it fully visible */}
          <h4 className="mt-3 w-full overflow-hidden text-ellipsis whitespace-nowrap text-center font-bold leading-snug">
            {user.name}
          </h4>
          {(user.specialization || user.title) && (
            <span
              className="mt-2 inline-block whitespace-nowrap rounded-lg px-4 py-1.5 text-[0.8rem] text-white"
              style={{ background: 'var(--primary)' }}
            >
              {user.specialization || user.title}
            </span>
          )}
          <div ref={qrRef} className="mt-5 rounded-xl bg-white p-3">
            {profileUrl && <QRCode value={profileUrl} size={132} />}
          </div>
          <span className="mt-2 whitespace-nowrap text-[0.75rem] text-muted">
            {t('consultantCard.scanQr')}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={downloadCard} loading={downloading === 'card'}>
          {t('consultantCard.downloadCard')}
        </Button>
        <Button variant="outline" size="sm" onClick={downloadQr} loading={downloading === 'qr'}>
          {t('consultantCard.downloadQr')}
        </Button>
      </div>
      {profileUrl && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-[0.8rem] text-muted" dir="ltr">
            {profileUrl}
          </span>
          <CopyButton text={profileUrl} />
        </div>
      )}
    </div>
  );
}
