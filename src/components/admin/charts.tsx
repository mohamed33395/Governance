'use client';

import type { ReactNode } from 'react';
import { FAMILY } from '@/components/admin/registry';

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

type Sort = 'none' | 'value-desc' | 'value-asc' | 'label-asc';

function sortData<T extends ChartDatum>(data: T[], sort: Sort): T[] {
  return [...data].sort((a, b) => {
    if (sort === 'value-desc') return b.value - a.value;
    if (sort === 'value-asc') return a.value - b.value;
    if (sort === 'label-asc') return a.label.localeCompare(b.label);
    return 0;
  });
}

// Accessible alternative to the drawing: the same values as a visually-hidden table.
function ValuesTable({ data, format }: { data: ChartDatum[]; format: (v: number) => string }) {
  return (
    <table className="sr-only">
      <tbody>
        {data.map((d, i) => (
          <tr key={i}>
            <th scope="row">{d.label}</th>
            <td>{format(d.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const summarize = (data: ChartDatum[], format: (v: number) => string) =>
  data.map((d) => `${d.label}: ${format(d.value)}`).join('، ');

/* ----------------------------------------------------------------- Donut */

export function DonutChart({
  data,
  size = 168,
  thickness = 20,
  showTotal = true,
  label,
}: {
  data: ChartDatum[];
  size?: number;
  thickness?: number;
  showTotal?: boolean;
  label?: string;
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
  const c = 2 * Math.PI * radius;
  const visible = data.filter((s) => s.value > 0);
  let offset = 0;

  return (
    <div style={{ width: size, height: size }} className="relative shrink-0">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label ?? ''} ${summarize(data, String)}`.trim()}
        className="-rotate-90"
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--chart-grid)" strokeWidth={thickness} />
        {visible.map((slice, i) => {
          const dash = (slice.value / total) * c;
          // hairline gap between arcs keeps neighbouring colours distinguishable
          const gap = visible.length > 1 ? 2 : 0;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color ?? FAMILY.cyan.light}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(dash - gap, 0)} ${c - Math.max(dash - gap, 0)}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      {showTotal && (
        <span
          className="absolute inset-0 flex items-center justify-center font-serif"
          style={{ fontSize: '1.6rem', color: 'var(--text)' }}
          aria-hidden="true"
        >
          {total}
        </span>
      )}
      <ValuesTable data={data} format={String} />
    </div>
  );
}

export function DonutLegend({ data }: { data: ChartDatum[] }) {
  const total = data.reduce((sum, s) => sum + s.value, 0);
  return (
    <ul className="flex flex-col gap-2.5 text-[0.88rem] min-w-[170px]">
      {data.map((slice, i) => {
        const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
        return (
          <li key={i} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2.5">
              <span
                className="inline-block rounded-full shrink-0"
                style={{ width: 8, height: 8, background: slice.color ?? FAMILY.cyan.light }}
              />
              <span className="text-text">{slice.label}</span>
            </span>
            <span className="text-text font-semibold tabular-nums">
              {slice.value} <span className="text-muted text-xs font-normal">({pct}%)</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------- Bars */

// Vertical columns — for chronological series (months).
export function BarChart({
  data,
  height = 240,
  sort = 'none',
  valueFormatter = (v) => String(v),
  label,
}: {
  data: ChartDatum[];
  height?: number;
  sort?: Sort;
  valueFormatter?: (value: number) => string;
  label?: string;
}) {
  const sorted = sortData(data, sort);
  if (sorted.length === 0) return <div className="text-muted text-sm text-center py-10">—</div>;

  const margin = { top: 28, right: 12, bottom: 34, left: 8 };
  const width = 640;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const max = Math.max(...sorted.map((d) => d.value), 1);
  const y = (v: number) => margin.top + innerH - (v / max) * innerH;
  const slotW = innerW / sorted.length;
  const barW = Math.min(slotW * 0.5, 56);

  return (
    <div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label ?? ''} ${summarize(sorted, valueFormatter)}`.trim()}
        preserveAspectRatio="xMidYMid meet"
      >
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={margin.left}
            x2={width - margin.right}
            y1={y(max * t)}
            y2={y(max * t)}
            stroke="var(--chart-grid)"
            strokeWidth={1}
          />
        ))}
        {sorted.map((d, i) => {
          const x = margin.left + i * slotW + (slotW - barW) / 2;
          const barH = Math.max(y(0) - y(d.value), d.value > 0 ? 2 : 0);
          const fill = d.color ?? FAMILY.cyan.light;
          return (
            <g key={i}>
              <rect x={x} y={y(0) - barH} width={barW} height={barH} rx={4} ry={4} fill={fill} />
              <text
                x={x + barW / 2}
                y={y(0) - barH - 8}
                textAnchor="middle"
                style={{ fontSize: 12, fontWeight: 700, fill: 'var(--text)' }}
              >
                {valueFormatter(d.value)}
              </text>
              <text
                x={x + barW / 2}
                y={height - 10}
                textAnchor="middle"
                style={{ fontSize: 12, fill: 'var(--muted)' }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <ValuesTable data={sorted} format={valueFormatter} />
    </div>
  );
}

// Horizontal ranking — for named categories (consultants, packages…). Long Arabic
// names stay fully readable and the order reads like a leaderboard.
export function RankingList({
  data,
  sort = 'value-desc',
  limit,
  valueFormatter = (v) => String(v),
  label,
}: {
  data: ChartDatum[];
  sort?: Sort;
  limit?: number;
  valueFormatter?: (value: number) => string;
  label?: string;
}) {
  const sorted = sortData(data, sort).slice(0, limit);
  if (sorted.length === 0) return <div className="text-muted text-sm text-center py-10">—</div>;
  const max = Math.max(...sorted.map((d) => d.value), 1);

  return (
    <ol className="ranking-list" aria-label={label}>
      {sorted.map((d, i) => (
        <li key={i} className="ranking-row">
          <span className="ranking-rank" aria-hidden="true">
            {i + 1}
          </span>
          <span className="ranking-body">
            <span className="ranking-line">
              <span className="ranking-label" title={d.label}>
                {d.label}
              </span>
              <span className="ranking-value">{valueFormatter(d.value)}</span>
            </span>
            <span className="ranking-track">
              <span
                className="ranking-fill"
                style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0)}%`, background: d.color ?? FAMILY.cyan.light }}
              />
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------- Card */

// Every chart card answers one question: a short title, quiet divider, then the chart.
export function ChartCard({
  title,
  accent = 'cyan',
  children,
}: {
  title: string;
  accent?: keyof typeof FAMILY;
  children: ReactNode;
}) {
  return (
    <section className="panel-card chart-card" style={{ ['--card-accent' as string]: FAMILY[accent].light }}>
      <h3 className="chart-card-title">{title}</h3>
      <div className="chart-card-body">{children}</div>
    </section>
  );
}
