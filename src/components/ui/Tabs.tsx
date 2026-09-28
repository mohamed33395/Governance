'use client';

export function Tabs({
  tabs,
  active,
  onChange,
  className = '',
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-5 py-2.5 rounded-full border text-[0.88rem] transition-all duration-150 cursor-pointer ${
            active === tab.key
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-surface text-muted border-border hover:border-accent hover:text-accent'
          }`}
        >
          {tab.label}
          {typeof tab.count === 'number' && (
            <span className="ms-2 text-[0.75rem] opacity-75">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
