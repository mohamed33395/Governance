'use client';

import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  minWidth?: number;
  className?: string;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  className = '',
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-border ${className}`}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="text-start font-semibold text-primary-foreground px-4 py-3.5 whitespace-nowrap"
                style={{ background: 'var(--primary)', minWidth: c.minWidth }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`${i % 2 === 1 ? 'bg-black/[0.03]' : ''} hover:bg-black/[0.05] ${onRowClick ? 'cursor-pointer' : ''}`}
              style={{ background: undefined }}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3.5 border-b border-border/60 text-text ${c.className ?? ''}`}>
                  {c.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border animate-pulse">
      <div className="h-12" style={{ background: 'var(--primary)', opacity: 0.85 }} />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-4 border-b border-border/60">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 rounded bg-border/70" style={{ width: `${100 / cols}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}
