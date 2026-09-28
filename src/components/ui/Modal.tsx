'use client';

import { useEffect, useRef, type ReactNode } from 'react';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: keyof typeof SIZES;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // simple focus trap: focus the card on open
    cardRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(15, 42, 29, 0.55)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />
      <div
        ref={cardRef}
        tabIndex={-1}
        className={`relative z-10 w-full ${SIZES[size]} bg-surface border border-border rounded-2xl p-7 outline-none max-h-[90vh] overflow-y-auto`}
        style={{ boxShadow: '0 30px 80px -30px rgba(0,0,0,.55)', borderTop: '3px solid var(--accent)' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="close"
          className="absolute top-3 end-3 w-8 h-8 rounded-full border border-border bg-background text-muted hover:bg-primary hover:text-white transition-colors text-lg leading-none"
        >
          ×
        </button>
        {title && <h3 className="text-xl mb-5 pe-8">{title}</h3>}
        {children}
        {footer && <div className="flex justify-end gap-3 mt-6">{footer}</div>}
      </div>
    </div>
  );
}
