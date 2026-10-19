'use client';

import { useState } from 'react';
import { usePublicMeta } from '@/lib/meta';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Alert, Button, Input, Radio } from '@/components/ui';

// §11.5 — card tokenization. Never send card numbers to our API:
// tokenize in the browser, send only the token.
//
// driver 'fake' (local dev): pick one of the three magic tokens.
// driver 'moyasar': tokenize via Moyasar's token API using the publishable key.
export function CardForm({
  onToken,
  className = '',
  reusable = false,
}: {
  onToken: (token: string | null) => void;
  className?: string;
  reusable?: boolean; // moyasar: create a reusable token (3DS verification) to save the card
}) {
  const { t } = useI18n();
  const meta = usePublicMeta();
  const driver = meta.data?.payment_gateway.driver ?? 'fake';

  if (driver === 'moyasar') {
    return (
      <MoyasarCardForm
        publishableKey={
          process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY ?? meta.data?.payment_gateway.publishable_key ?? ''
        }
        onToken={onToken}
        className={className}
        reusable={reusable}
      />
    );
  }
  return <FakeCardForm onToken={onToken} className={className} />;
}

// ---------- fake driver (dev) ----------
const FAKE_TOKENS = [
  { value: 'tok_fake_success', labelKey: 'cardForm.fakeSuccess' },
  { value: 'tok_fake_3ds', labelKey: 'cardForm.fake3ds' },
  { value: 'tok_fake_declined', labelKey: 'cardForm.fakeDeclined' },
] as const;

function FakeCardForm({
  onToken,
  className = '',
}: {
  onToken: (token: string | null) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string>('');

  return (
    <div className={className}>
      <Alert color="info" body={t('cardForm.fakeNotice')} className="mb-3" />
      <div className="flex flex-col gap-2.5" role="radiogroup">
        {FAKE_TOKENS.map((tok) => (
          <label
            key={tok.value}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
              selected === tok.value ? 'border-accent bg-accent/5' : 'border-border bg-surface'
            }`}
          >
            <Radio
              name="fake-token"
              checked={selected === tok.value}
              onChange={() => {
                setSelected(tok.value);
                onToken(tok.value);
              }}
            />
            <span className="text-[0.9rem] text-text">{t(tok.labelKey)}</span>
            <code className="ms-auto text-[0.75rem] text-muted" dir="ltr">
              {tok.value}
            </code>
          </label>
        ))}
      </div>
    </div>
  );
}

// ---------- moyasar driver ----------
// Tokenizes via Moyasar's token API (publishable key, browser-safe).
// Card data goes browser → Moyasar directly; only the token id reaches us.
function MoyasarCardForm({
  publishableKey,
  onToken,
  className = '',
  reusable = false,
}: {
  publishableKey: string;
  onToken: (token: string | null) => void;
  className?: string;
  reusable?: boolean;
}) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  const tokenize = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch('https://api.moyasar.com/v1/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publishable_api_key: publishableKey,
          ...(reusable
            ? { callback_url: `${window.location.origin}/payment-methods/callback` }
            : { save_only: true }),
          name: name.trim(),
          number: number.replace(/\s+/g, ''),
          month: Number(month),
          year: Number(year.length === 4 ? year.slice(2) : year),
          cvc,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.id) throw new Error(body?.message ?? 'tokenization failed');
      setNumber('');
      setCvc('');
      if (reusable) {
        if (!body.verification_url) throw new Error(body?.message ?? 'tokenization failed');
        sessionStorage.setItem('pending_card_token', body.id as string);
        window.location.href = body.verification_url as string; // 3-D Secure
        return;
      }
      setDone(true);
      onToken(body.id as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      onToken(null);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return <Alert color="success" body={t('cardForm.cardReady')} className={className} />;
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`} dir="ltr">
      <Input label={t('cardForm.holderName')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="cc-name" />
      <Input
        label={t('cardForm.cardNumber')}
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder="4111 1111 1111 1111"
      />
      <div className="grid grid-cols-3 gap-3">
        <Input label={t('cardForm.expMonth')} value={month} onChange={(e) => setMonth(e.target.value)} placeholder="MM" inputMode="numeric" />
        <Input label={t('cardForm.expYear')} value={year} onChange={(e) => setYear(e.target.value)} placeholder="YYYY" inputMode="numeric" />
        <Input label={t('cardForm.cvc')} value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="CVC" inputMode="numeric" autoComplete="cc-csc" />
      </div>
      {error && <Alert color="danger" body={error} />}
      <Button type="button" variant="outline" size="sm" onClick={tokenize} loading={busy} disabled={!name || !number || !month || !year || !cvc}>
        {reusable ? t('cardForm.verifyAndSave') : t('cardForm.verifyCard')}
      </Button>
    </div>
  );
}
