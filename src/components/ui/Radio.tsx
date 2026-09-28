'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, className = '', id, ...rest },
  ref
) {
  return (
    <label htmlFor={id} className={`inline-flex items-center gap-2.5 cursor-pointer text-[0.9rem] text-text ${className}`}>
      <input
        ref={ref}
        id={id}
        type="radio"
        className="shrink-0 cursor-pointer"
        style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
        {...rest}
      />
      {label && <span>{label}</span>}
    </label>
  );
});
