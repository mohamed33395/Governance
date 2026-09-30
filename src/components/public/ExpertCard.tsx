import type { ReactNode } from "react";
import { FLUID } from "./tokens";

/** Profile card: photo, name, role, bio and optional stats. Used for the expert and consultant profiles. */
export function ExpertCard({
  eyebrow,
  name,
  role,
  sub,
  bio,
  photo,
  photoAlt,
  stats,
  children,
}: {
  eyebrow?: string;
  name: string;
  role?: string | null;
  sub?: string | null;
  bio?: string | null;
  photo?: string | null;
  photoAlt: string;
  stats?: { value: string; label: string }[];
  children?: ReactNode;
}) {
  return (
    // outer radius 24, gap 8, inner radius 16
    <article className="rounded-3xl border border-border bg-surface p-2">
      <div className="grid items-center gap-8 rounded-2xl bg-background p-6 md:grid-cols-[320px_1fr] md:gap-12 md:p-8">
        <div className="group aspect-[4/5] w-full max-w-[320px] justify-self-center overflow-hidden rounded-xl border border-border bg-surface md:justify-self-start">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={photoAlt}
              className={`size-full object-cover ${FLUID} group-hover:scale-105`}
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-full items-center justify-center text-5xl font-bold text-accent"
            >
              {name.trim()[0]}
            </span>
          )}
        </div>
        <div>
          {eyebrow && <span className="text-sm font-semibold text-primary dark:text-accent-soft">{eyebrow}</span>}
          <h2 className="mt-2 text-3xl font-bold text-text text-balance">{name}</h2>
          {sub && <span className="mt-1 block text-sm text-muted">{sub}</span>}
          {role && <span className="mt-2 block text-base font-semibold text-primary dark:text-accent-soft">{role}</span>}
          {bio && <p className="mt-4 text-base text-muted text-pretty">{bio}</p>}
          {stats && stats.length > 0 && (
            <dl className="mt-8 grid grid-cols-3 gap-6 border-t border-border pt-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <dd className="text-2xl font-bold text-text">{s.value}</dd>
                  <dt className="text-sm text-muted">{s.label}</dt>
                </div>
              ))}
            </dl>
          )}
          {children}
        </div>
      </div>
    </article>
  );
}
