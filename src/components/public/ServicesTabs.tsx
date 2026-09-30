"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { SERVICE_GROUPS, type Txt } from "@/lib/data/services-content";
import { FLUID, FOCUS } from "./tokens";

export function ServicesTabs() {
  const { t, lang, dir } = useI18n();
  const [active, setActive] = useState(SERVICE_GROUPS[0].id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tx = (v: Txt) => (typeof v === "string" ? v : t(v.k));
  const num = (n: number) => n.toLocaleString(lang === "ar" ? "ar-EG" : "en", { useGrouping: false });

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = SERVICE_GROUPS.length - 1;
    const nextKey = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const prevKey = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    let next: number;
    if (e.key === "ArrowDown" || e.key === nextKey) next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowUp" || e.key === prevKey) next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    setActive(SERVICE_GROUPS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="grid overflow-hidden rounded-2xl border border-border bg-surface lg:grid-cols-[320px_1fr]">
      <div
        role="tablist"
        aria-orientation="vertical"
        className="flex gap-1 overflow-x-auto bg-secondary p-2 lg:flex-col lg:overflow-visible"
      >
        {SERVICE_GROUPS.map((g, i) => {
          const selected = active === g.id;
          return (
            <button
              key={g.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={`tab-${g.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${g.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(g.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`flex shrink-0 items-center justify-between gap-4 rounded-lg px-4 py-3 text-start text-sm whitespace-nowrap ${FLUID} ${FOCUS} lg:whitespace-normal ${
                selected ? "bg-surface font-semibold text-text" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                {g.featured && <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-accent" />}
                {tx(g.label ?? g.title)}
              </span>
              <span aria-hidden="true" className={`text-xs ${selected ? "text-muted" : "text-white/40"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-6 md:p-12">
        {SERVICE_GROUPS.map((g) => (
          <div
            key={g.id}
            id={`panel-${g.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${g.id}`}
            hidden={active !== g.id}
            tabIndex={0}
            className={`rounded-lg ${FOCUS}`}
          >
            {g.kicker && <span className="text-sm font-semibold text-primary dark:text-accent-soft">{g.kicker}</span>}
            <h3 className="mt-2 text-2xl font-bold text-text text-balance">{tx(g.title)}</h3>
            <ul className="mt-6 flex flex-col gap-4">
              {g.items.map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-text"
                  >
                    {num(i + 1)}
                  </span>
                  <span className="flex flex-col gap-1 pt-1 text-base text-muted text-pretty">
                    {item.title && <strong className="font-bold text-text">{tx(item.title)}</strong>}
                    {tx(item.body)}
                  </span>
                </li>
              ))}
            </ul>
            <Link href={g.href} className="btn btn-outline mt-8">
              {g.hrefLabel ? tx(g.hrefLabel) : t("details")}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
