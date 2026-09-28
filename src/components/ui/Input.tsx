'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Field } from './Field';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, className = '', id, ...rest },
  ref
) {
  const input = (
    <input
      ref={ref}
      id={id}
      required={required}
      data-invalid={!!error}
      className={`ui-input ${className}`}
      aria-invalid={!!error}
      {...rest}
    />
  );
  if (!label && !error && !hint) return input;
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      {input}
    </Field>
  );
});
