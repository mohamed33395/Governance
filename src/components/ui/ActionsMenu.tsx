'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface ActionsMenuItem {
  key: string;
  label: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

const MENU_WIDTH = 160;

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width={18} height={18}>
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

/**
 * Row-actions dropdown (⋮ → menu). The panel is `position: fixed` so it
 * escapes the Table's overflow clipping; closes on outside click, Escape,
 * scroll and resize.
 */
export function ActionsMenu({ items, ariaLabel }: { items: ActionsMenuItem[]; ariaLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const rtl = document.documentElement.dir === 'rtl';
    // align the menu's inline-end edge with the trigger's
    const left = rtl ? r.left : r.right - MENU_WIDTH;
    const clampedLeft = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));
    // flip upward when there's no room below
    const menuHeight = items.length * 38 + 12;
    const top =
      r.bottom + menuHeight + 8 > window.innerHeight ? r.top - menuHeight - 6 : r.bottom + 6;
    setPos({ top, left: clampedLeft });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <span className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-black/5 hover:text-text"
      >
        <DotsIcon />
      </button>
      {open && pos && (
        <div
          role="menu"
          style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: MENU_WIDTH }}
          className="z-50 rounded-xl border border-border bg-surface py-1.5 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`block w-full px-4 py-2 text-start text-[0.85rem] transition-colors disabled:opacity-50 ${
                item.danger
                  ? 'text-danger hover:bg-[var(--danger-soft)]'
                  : 'text-text hover:bg-black/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
