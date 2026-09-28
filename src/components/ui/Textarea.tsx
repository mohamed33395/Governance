'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { Field } from './Field';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, required, className = '', id, rows = 4, ...rest },
  ref
) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        required={required}
        data-invalid={!!error}
        className={`ui-input resize-y ${className}`}
        aria-invalid={!!error}
        {...rest}
      />
    </Field>
  );
});
