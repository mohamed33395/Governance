'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, className = '', id, ...rest },
  ref
) {
  const control = (
    <span className="relative inline-flex shrink-0" style={{ width: 42, height: 24 }}>
      <input ref={ref} id={id} type="checkbox" className="peer sr-only" {...rest} />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-border transition-colors peer-checked:bg-primary peer-disabled:opacity-50"
      />
      <span
        aria-hidden="true"
        className="absolute top-[3px] start-[3px] rounded-full bg-white shadow transition-transform peer-checked:translate-x-[18px] rtl:peer-checked:-translate-x-[18px]"
        style={{ width: 18, height: 18 }}
      />
    </span>
  );
  if (!label) return control;
  return (
    <label htmlFor={id} className={`inline-flex items-center gap-2.5 cursor-pointer text-[0.9rem] text-text ${className}`}>
      {control}
      <span>{label}</span>
    </label>
  );
});
