"use client";

import { Star } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Reveal } from "./Reveal";
import { CARD } from "./tokens";
import type { Paginated, Review } from "@/types/api";

export function Testimonials() {
  const { t, lang } = useI18n();
  const query = useQuery({
    queryKey: ["public", "reviews", { per_page: 6 }],
    queryFn: () =>
      api
        .get("/public/reviews", { params: { per_page: 6 } })
        .then((r) => (r.data as Paginated<Review>).data),
  });

  const reviews = query.data ?? [];

  if (query.isLoading || query.isError || reviews.length === 0) {
    return <StaticTestimonials />;
  }

  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {reviews.map((review, i) => (
        <li key={review.id}>
          <Reveal delay={(i % 3) * 100} className="h-full">
            <figure className={`flex h-full flex-col p-8 ${CARD}`}>
              <div className="flex gap-1 text-accent" role="img" aria-label={`${review.rating} / 5`}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={16} weight={s < review.rating ? "fill" : "regular"} aria-hidden="true" />
                ))}
              </div>
              {review.title && <h3 className="mt-3 font-bold text-text">{review.title}</h3>}
              <blockquote className="mt-3 flex-1 text-base text-text text-pretty">
                {review.comment}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-accent-soft"
                >
                  {review.name.slice(0, 2)}
                </span>
                <span className="flex flex-col">
                  <strong className="text-base font-bold text-text">{review.name}</strong>
                  <span className="text-sm text-muted">
                    {new Date(review.published_at ?? review.created_at).toLocaleDateString(
                      lang === "ar" ? "ar-SA" : "en-US"
                    )}
                  </span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

const INITIALS = ["م.ر", "ن.ع", "ف.ح"] as const;

function StaticTestimonials() {
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
