"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Client portal modal — same DOM as the original:
 * .client-modal-overlay(.open) > .client-modal-card > .client-modal-close + content
 */
export function ClientModal({
  id,
  open,
  onClose,
  title,
  titleId,
  children,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  titleId?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`client-modal-overlay${open ? " open" : ""}`}
      id={id}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="client-modal-card" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="client-modal-close" aria-label="إغلاق" onClick={onClose}>
          &times;
        </button>
        <h3 id={titleId}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
