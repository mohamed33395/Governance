'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className = '', id, ...rest },
  ref
) {
  return (
    <label htmlFor={id} className={`inline-flex items-center gap-2.5 cursor-pointer text-[0.9rem] text-text ${className}`}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className="w-4.5 h-4.5 shrink-0 accent-[#C19B4A] cursor-pointer"
        style={{ width: 18, height: 18 }}
        {...rest}
      />
      {label && <span>{label}</span>}
    </label>
  );
});
