'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { FAMILY, type FamilyKey } from '@/components/admin/registry';

interface KpiCardProps {
  label: string;
  value: ReactNode;
  family?: FamilyKey;
  /** Concise metric definition; shown on hover, focus and tap. */
  hint?: string;
  /** Comparison / context line under the value. */
  context?: ReactNode;
  /** Numeric delta (neutral capsule; only the number carries semantic color). */
  delta?: { value: number; suffix?: string };
  onClick?: () => void;
  valueSize?: 'md' | 'sm';
}

const TIP_W = 260;
const GAP = 10;

function MetricTitle({ label, hint }: { label: string; hint?: string }) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; side: 'right' | 'left' | 'top' } | null>(null);

  if (!hint) return <span className="kpi-title">{label}</span>;

  const show = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    if (vw < 640) {
      const left = Math.min(Math.max(8, r.left + r.width / 2 - TIP_W / 2), vw - TIP_W - 8);
      setPos({ top: r.top - GAP, left, side: 'top' });
    } else if (r.right + GAP + TIP_W <= vw - 8) {
      setPos({ top: r.top + r.height / 2, left: r.right + GAP, side: 'right' });
    } else {
      setPos({ top: r.top + r.height / 2, left: Math.max(8, r.left - GAP - TIP_W), side: 'left' });
    }
  };
  const hide = () => setPos(null);

  return (
    <>
      <span
        ref={ref}
        className="kpi-title kpi-title-hint"
        tabIndex={0}
        aria-describedby={pos ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => (pos ? hide() : show())}
        onKeyDown={(e) => e.key === 'Escape' && hide()}
      >
        {label}
      </span>
      {pos && (
        <span
          id={id}
          role="tooltip"
          className="kpi-tooltip"
          style={{
            top: pos.top,
            left: pos.left,
            width: TIP_W,
            transform: pos.side === 'top' ? 'translateY(-100%)' : 'translateY(-50%)',
          }}
        >
          {hint}
        </span>
      )}
    </>
  );
}

export function KpiCard({ label, value, family = 'cyan', hint, context, delta, onClick, valueSize = 'md' }: KpiCardProps) {
  const accent = FAMILY[family];
  const interactive = !!onClick;
  return (
    <div
      className={`kpi-card${interactive ? ' kpi-card-link' : ''}`}
      style={{ ['--kpi-accent' as string]: accent.light }}
      role={interactive ? 'link' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      <div className="kpi-head">
        <MetricTitle label={label} hint={hint} />
      </div>
      <div className="kpi-divider" />
      <div className={`kpi-value${valueSize === 'sm' ? ' kpi-value-sm' : ''}`}>{value}</div>
      {(context || delta) && (
        <div className="kpi-foot">
          {delta && (
            <span className="kpi-delta">
              {delta.value >= 0 ? (
                <ArrowUpRight size={12} strokeWidth={2.5} aria-hidden="true" style={{ color: 'var(--success)' }} />
              ) : (
                <ArrowDownRight size={12} strokeWidth={2.5} aria-hidden="true" style={{ color: 'var(--danger)' }} />
              )}
              <span style={{ color: delta.value >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {Math.abs(delta.value)}
                {delta.suffix ?? ''}
              </span>
            </span>
          )}
          {context && <span className="kpi-context">{context}</span>}
        </div>
      )}
    </div>
  );
}
