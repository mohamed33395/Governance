import type { ReactNode } from "react";
import { H1_GRADIENT } from "./tokens";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1180px] px-6 md:px-8 ${className}`}>{children}</div>;
}

export function SectionHead({
  eyebrow,
  title,
  lead,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-12 max-w-[680px]">
      {eyebrow && <span className="text-sm font-semibold text-primary dark:text-accent-soft">{eyebrow}</span>}
      <Tag className="mt-2 text-3xl font-bold text-text text-balance md:text-4xl">{title}</Tag>
      {lead && <p className="mt-4 text-base text-muted text-pretty md:text-lg">{lead}</p>}
    </div>
  );
}

/** Hero for inner pages: one heading, one sentence, optional actions. */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
  before,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
  before?: ReactNode;
}) {
  return (
    <section className="border-b border-border bg-surface pt-16 pb-16 md:pt-24">
      <Container>
        {before}
        {eyebrow && <span className="text-sm font-semibold text-primary dark:text-accent-soft">{eyebrow}</span>}
        <h1 className={`mt-2 ${H1_GRADIENT}`}>{title}</h1>
        {lead && <p className="mt-6 max-w-[680px] text-lg text-muted text-pretty">{lead}</p>}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </section>
  );
}
