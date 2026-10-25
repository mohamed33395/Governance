"use client";

import { useQuery } from "@tanstack/react-query";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/i18n-context";
import { FLUID, FOCUS } from "./tokens";
import type { TeamMember } from "@/types/api";

// Landing "our team" strip — fed by GET /public/team-members (admin-managed).
// Deck carousel: active card centered on top, neighbors scaled down and tucked
// behind on both sides. Auto-flips every 5s; pauses on hover/focus.
export function TeamSection() {
  const { t, dir } = useI18n();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const query = useQuery({
    queryKey: ["public", "team-members"],
    queryFn: () => api.get("/public/team-members").then((r) => r.data.data as TeamMember[]),
    staleTime: 60_000,
  });

  const members = query.data ?? [];
  const count = members.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setActive((a) => (a + 1) % count);
    }, 5000);
    return () => window.clearInterval(id);
  }, [paused, count]);

  if (query.isLoading || query.isError || count === 0) return null;

  const sign = dir === "rtl" ? -1 : 1;

  const card = (m: TeamMember) => (
    <article className={`h-full rounded-3xl border border-border bg-surface p-2 ${FLUID} hover:border-accent`}>
      <div className="grid h-full gap-6 rounded-2xl bg-background p-5 md:grid-cols-[200px_1fr] md:p-6">
        <div className="group aspect-[4/5] w-full max-w-[240px] self-center justify-self-center overflow-hidden rounded-xl border border-border bg-surface md:justify-self-start">
          {m.avatar_url || m.avatar_thumb_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.avatar_url ?? m.avatar_thumb_url ?? ""}
              alt={m.name}
              loading="lazy"
              className={`size-full object-cover ${FLUID} group-hover:scale-105`}
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-full items-center justify-center text-5xl font-bold text-accent"
            >
              {m.name.trim()[0]}
            </span>
          )}
        </div>
        <div className="flex h-full flex-col text-center md:text-start">
          <h3 className="text-2xl font-bold text-text text-balance">{m.name}</h3>
          <span className="mt-2 block text-base font-semibold text-primary dark:text-accent-soft">
            {m.job_title}
          </span>
          <span className="mt-1 block text-xs text-muted">+{m.experience_years} {t("team.experienceYears")}</span>
          {m.bio && <p className="mt-3 line-clamp-3 text-sm text-muted text-pretty">{m.bio}</p>}
          <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
            {(
              [
                ["expertStatExp", "expertStat1"],
                ["expertStatCons", "expertStat2"],
                ["expertStatEst", "expertStat3"],
              ] as const
            ).map(([value, label]) => (
              <div key={value}>
                <dd className="text-lg font-bold text-text">{t(value)}</dd>
                <dt className="mt-0.5 text-[11px] leading-tight text-muted">{t(label)}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </article>
  );

  const step = (delta: 1 | -1) => setActive((a) => (a + delta + count) % count);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative">
        {/* Invisible sizer — keeps the deck height equal to the active card */}
        <div aria-hidden="true" className="invisible mx-auto w-[86%] sm:w-[64%] lg:w-[56%]">
          {card(members[active % count])}
        </div>
        <ul className="absolute inset-0">
          {members.map((m, i) => {
            let d = i - active;
            if (d > count / 2) d -= count;
            if (d < -count / 2) d += count;
            const off = Math.abs(d);
            const hidden = off > 1;
            return (
              <li
                key={m.id}
                aria-hidden={hidden ? true : undefined}
                onClick={off > 0 && !hidden ? () => setActive(i) : undefined}
                className={`absolute top-0 left-1/2 h-full w-[86%] transition-all duration-700 ease-out sm:w-[64%] lg:w-[56%] ${off > 0 && !hidden ? "cursor-pointer" : ""}`}
                style={{
                  transform: `translateX(calc(-50% + ${d * sign * 42}%)) scale(${off === 0 ? 1 : 0.85})`,
                  zIndex: hidden ? 0 : 30 - off * 5,
                  opacity: hidden ? 0 : off === 0 ? 1 : 0.9,
                  pointerEvents: hidden ? "none" : "auto",
                }}
              >
                {card(m)}
              </li>
            );
          })}
        </ul>
      </div>
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={t("common.prev")}
            className={`absolute top-1/2 left-2 z-40 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text shadow-lg hover:border-accent hover:text-primary md:-left-14 ${FOCUS}`}
          >
            <CaretLeft size={22} weight="bold" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={t("common.next")}
            className={`absolute top-1/2 right-2 z-40 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text shadow-lg hover:border-accent hover:text-primary md:-right-14 ${FOCUS}`}
          >
            <CaretRight size={22} weight="bold" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
