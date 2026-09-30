import type { ReactNode } from "react";
import { FLUID } from "./tokens";

/** Card for a team member or consultant. Wrap in a link by passing `as`. */
export function PersonCard({
  avatar,
  name,
  role,
  field,
  footer,
}: {
  avatar: ReactNode;
  name: string;
  role?: string | null;
  field?: string | null;
  footer?: ReactNode;
}) {
  return (
    <div
      className={`flex h-full flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center ${FLUID} hover:-translate-y-1 hover:border-accent`}
    >
      {avatar}
      <h3 className="mt-4 text-lg font-bold text-text text-balance">{name}</h3>
      {role && <p className="mt-1 text-sm text-muted">{role}</p>}
      {field && (
        <span className="mt-3 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-primary dark:text-accent-soft">
          {field}
        </span>
      )}
      {footer}
    </div>
  );
}
