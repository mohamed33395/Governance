'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Field } from './Field';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, className = '', id, type, ...rest },
  ref
) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  const input = (
    <input
      ref={ref}
      id={id}
      type={isPassword ? (visible ? 'text' : 'password') : type}
      required={required}
      data-invalid={!!error}
      className={`ui-input ${className}`}
      aria-invalid={!!error}
      {...rest}
    />
  );

  const control = isPassword ? (
    <div className="ui-input-wrap">
      {input}
      <button
        type="button"
        className="ui-password-toggle"
        aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  ) : (
    input
  );

  if (!label && !error && !hint) return control;
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      {control}
    </Field>
  );
});
