'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { Field } from './Field';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, required, options, placeholder, className = '', id, ...rest },
  ref
) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <select
        ref={ref}
        id={id}
        required={required}
        data-invalid={!!error}
        className={`ui-input ${className}`}
        aria-invalid={!!error}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={String(o.value)} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
});
