"use client";

import { useI18n } from "@/lib/i18n/i18n-context";
import { Reveal } from "./Reveal";
import { CARD, FLUID } from "./tokens";

const VALUES = ["excellence", "impact", "initiative", "leadership", "distinction", "ownership"] as const;

export function VisionValues() {
  const { t } = useI18n();
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {(
          [
            ["vision", "visionText"],
            ["mission", "missionText"],
          ] as const
        ).map(([title, body], i) => (
          <Reveal key={title} delay={i * 100} className="h-full">
            <article className={`h-full p-8 ${CARD}`}>
              <h3 className="text-sm font-semibold text-primary dark:text-accent-soft">{t(title)}</h3>
              <p className="mt-4 text-xl text-text text-pretty">{t(body)}</p>
            </article>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {VALUES.map((v) => (
            <li
              key={v}
              className={`flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center ${FLUID} hover:-translate-y-1 hover:border-accent`}
            >
              <span aria-hidden="true" className="size-2 rotate-45 bg-accent" />
              <span className="text-base font-semibold text-text">{t(v)}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </>
  );
}
