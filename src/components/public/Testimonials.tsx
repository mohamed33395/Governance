"use client";

import { Star } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Reveal } from "./Reveal";
import { CARD } from "./tokens";

const INITIALS = ["م.ر", "ن.ع", "ف.ح"] as const;

export function Testimonials() {
  const { t } = useI18n();
  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <li key={i}>
          <Reveal delay={(i - 1) * 100} className="h-full">
            <figure className={`flex h-full flex-col p-8 ${CARD}`}>
              <div className="flex gap-1 text-accent" role="img" aria-label="5 / 5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={16} weight="fill" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-base text-text text-pretty">
                {t(`testimonial${i}Text`)}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-accent-soft"
                >
                  {INITIALS[i - 1]}
                </span>
                <span className="flex flex-col">
                  <strong className="text-base font-bold text-text">{t(`testimonial${i}Name`)}</strong>
                  <span className="text-sm text-muted">{t(`testimonial${i}Role`)}</span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
