"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { FIELD, LABEL } from "./tokens";

type Common = { label: string; full?: boolean; hint?: string };

export function TextField({
  label,
  full,
  hint,
  className = "",
  ...props
}: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className={LABEL}>
        {label}
        {props.required && <span className="text-danger" aria-hidden="true"> *</span>}
      </label>
      <input id={id} className={`${FIELD} ${className}`} {...props} />
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function SelectField({
  label,
  full,
  children,
  className = "",
  ...props
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const id = useId();
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <select id={id} className={`${FIELD} ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}

export function TextAreaField({
  label,
  full,
  className = "",
  ...props
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className={LABEL}>
        {label}
        {props.required && <span className="text-danger" aria-hidden="true"> *</span>}
      </label>
      <textarea id={id} className={`${FIELD} min-h-32 ${className}`} {...props} />
    </div>
  );
}

/** Success message announced to screen readers. */
export function FormMessage({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      {show && (
        <p className="mt-4 rounded-xl border border-success bg-success-soft p-4 text-sm font-semibold text-success">
          {children}
        </p>
      )}
    </div>
  );
}
