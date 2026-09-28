'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ToastKind = 'success' | 'error' | 'info';
type ToastItem = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<{
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
} | null>(null);

const KIND_STYLES: Record<ToastKind, { bg: string; fg: string; border: string }> = {
  success: { bg: 'var(--success-soft)', fg: 'var(--success)', border: 'var(--success)' },
  error: { bg: 'var(--danger-soft)', fg: 'var(--danger)', border: 'var(--danger)' },
  info: { bg: 'var(--info-soft)', fg: 'var(--info)', border: 'var(--info)' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const value = useMemo(
    () => ({
      success: (m: string) => push('success', m),
      error: (m: string) => push('error', m),
      info: (m: string) => push('info', m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* top-start corner */}
      <div className="fixed top-4 start-4 z-[200] flex flex-col gap-2 max-w-[min(360px,90vw)]" aria-live="polite">
        {toasts.map((t) => {
          const s = KIND_STYLES[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className="rounded-xl px-4 py-3 text-[0.88rem] font-medium shadow-lg border-s-4"
              style={{ background: s.bg, color: s.fg, borderColor: s.border }}
            >
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
