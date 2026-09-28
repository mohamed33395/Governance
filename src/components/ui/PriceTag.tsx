'use client';

// renders the API's *_formatted string — never formats money itself
export function PriceTag({ formatted, className = '' }: { formatted: string; className?: string }) {
  return (
    <span className={`font-serif font-bold ${className}`} dir="auto">
      {formatted}
    </span>
  );
}
