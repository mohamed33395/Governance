'use client';

import { useEffect, type ReactNode } from 'react';

// side panel (end side — left in RTL, right in LTR)
export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 420,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(15, 42, 29, 0.45)' }}
        onClick={onClose}
      />
      <aside
        className="absolute top-0 bottom-0 end-0 bg-surface border-s border-border flex flex-col"
        style={{ width: `min(${width}px, 92vw)`, boxShadow: 'var(--shadow)' }}
      >
        <header className="flex items-center justify-between gap-3 px-6 py-5 border-b border-border">
          {typeof title === 'string' ? <h3 className="text-lg">{title}</h3> : title}
          <button
            type="button"
            onClick={onClose}
            aria-label="close"
            className="w-8 h-8 rounded-full border border-border bg-background text-muted hover:bg-primary hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </aside>
    </div>
  );
}
