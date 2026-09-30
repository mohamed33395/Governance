'use client';

const SIZES = { sm: 32, md: 44, lg: 64, xl: 88 } as const;
// on-scale type sizes (px) per avatar size
const FONT = { sm: 12, md: 14, lg: 20, xl: 24 } as const;

export function Avatar({
  src,
  name,
  size = 'md',
  className = '',
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        width={px}
        height={px}
        className={`rounded-full object-cover border border-border shrink-0 ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }
  return (
    <span
      aria-label={name}
      className={`rounded-full inline-flex items-center justify-center font-bold shrink-0 ${className}`}
      style={{
        width: px,
        height: px,
        fontSize: FONT[size],
        background: 'var(--secondary)',
        color: 'var(--accent-soft)',
        border: '2px solid var(--accent)',
      }}
    >
      {initials}
    </span>
  );
}
