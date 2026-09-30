'use client';

import type { ReactNode } from 'react';

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  data,
  size = 170,
  thickness = 22,
  showTotal = true,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  showTotal?: boolean;
}) {
  const total = data.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) {
    return (
      <div className="flex items-center justify-center text-muted text-sm" style={{ width: size, height: size }}>
        —
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={thickness}
        opacity={0.5}
      />
      {data.map((slice, i) => {
        const fraction = slice.value / total;
        const dash = fraction * circumference;
        const gap = circumference - dash;
        const circle = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
          />
        );
        offset += dash;
        return circle;
      })}
      {showTotal && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-serif fill-primary"
          style={{ fontSize: '1.35rem' }}
          transform={`rotate(90 ${size / 2} ${size / 2})`}
        >
          {total}
        </text>
      )}
    </svg>
  );
}

export function DonutLegend({ data }: { data: DonutSlice[] }) {
  const total = data.reduce((sum, s) => sum + s.value, 0);
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {data.map((slice, i) => {
        const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
        return (
          <li key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="inline-block rounded-full" style={{ width: 10, height: 10, background: slice.color }} />
              <span className="text-text">{slice.label}</span>
            </span>
            <span className="text-muted">
              {slice.value} <span className="text-xs">({pct}%)</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

export function BarChart({
  data,
  height = 220,
  sort = 'none',
  valueFormatter = (v) => String(v),
}: {
  data: BarDatum[];
  height?: number;
  sort?: 'none' | 'value-desc' | 'value-asc' | 'label-asc';
  valueFormatter?: (value: number) => string;
}) {
  const sorted = [...data].sort((a, b) => {
    if (sort === 'value-desc') return b.value - a.value;
    if (sort === 'value-asc') return a.value - b.value;
    if (sort === 'label-asc') return a.label.localeCompare(b.label);
    return 0;
  });

  if (sorted.length === 0) {
    return <div className="text-muted text-sm text-center py-10">—</div>;
  }

  const margin = { top: 24, right: 16, bottom: 56, left: 52 };
  const width = 640;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const max = Math.max(...sorted.map((d) => d.value), 1);
  const y = (v: number) => margin.top + innerH - (v / max) * innerH;
  const slotW = innerW / sorted.length;
  const barW = Math.min(slotW * 0.55, 52);

  const truncate = (text: string, len = 12) =>
    text.length > len ? text.slice(0, len) + '…' : text;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--primary)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--green-mid)' }} />
        </linearGradient>
      </defs>

      {/* grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const val = max * t;
        const yPos = y(val);
        return (
          <g key={t}>
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={yPos}
              y2={yPos}
              stroke="var(--border)"
              strokeDasharray="4 4"
              opacity={0.7}
            />
            <text
              x={margin.left - 10}
              y={yPos + 4}
              textAnchor="end"
              className="fill-muted"
              style={{ fontSize: 11 }}
            >
              {valueFormatter(Math.round(val))}
            </text>
          </g>
        );
      })}

      {/* bars */}
      {sorted.map((d, i) => {
        const x = margin.left + i * slotW + (slotW - barW) / 2;
        const barH = y(0) - y(d.value);
        return (
          <g key={i}>
            <rect
              x={x}
              y={y(d.value)}
              width={barW}
              height={barH}
              rx={6}
              ry={6}
              fill={d.color ?? 'url(#barGradient)'}
              style={{ filter: 'drop-shadow(0 4px 6px rgba(15,42,29,.12))' }}
            />
            <text
              x={x + barW / 2}
              y={y(d.value) - 10}
              textAnchor="middle"
              className="fill-text font-semibold"
              style={{ fontSize: 12 }}
            >
              {valueFormatter(d.value)}
            </text>
            <text
              x={x + barW / 2}
              y={height - 14}
              textAnchor="middle"
              className="fill-muted"
              style={{ fontSize: 11 }}
            >
              {truncate(d.label)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="panel-card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
