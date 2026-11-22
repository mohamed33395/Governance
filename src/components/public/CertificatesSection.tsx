"use client";

import { useQuery } from "@tanstack/react-query";
import { CaretLeft, CaretRight, Certificate as CertificateIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type TransitionEvent } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Reveal } from "./Reveal";
import { Container, SectionHead } from "./Section";
import { FLUID, FOCUS } from "./tokens";
import type { Certificate } from "@/types/api";

const AUTO_ADVANCE_MS = 5_000;

// Landing "certificates" strip — fed by GET /public/certificates (admin-managed).
// Seamless circular carousel: the items render twice; when the slide reaches the
// duplicated tail it snaps back to the real start with the transition off, so
// the loop looks endless. Auto-advances every 5s and pauses on hover/focus.
// Renders nothing while loading, on error, or when there are no active certs.
export function CertificatesSection() {
  const { t, dir } = useI18n();
  const [active, setActive] = useState(0);
  const [anim, setAnim] = useState(true);
  const [paused, setPaused] = useState(false);
  const viewportRef = useRef<HTMLUListElement>(null);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(1);

  const query = useQuery({
    queryKey: ["public", "certificates"],
    queryFn: () => api.get("/public/certificates").then((r) => r.data.data as Certificate[]),
    staleTime: 60_000,
  });

  const items = query.data ?? [];
  const count = items.length;
  // Carousel only makes sense when the strip actually overflows the viewport.
  const canSlide = count > 1 && count >= visible;
  // Rendered twice so sliding past the last real card reveals item 0 again.
  const strip = canSlide ? [...items, ...items] : items;

  // Measure one card + gap in px so the slide distance stays exact at any
  // breakpoint/font-size. Re-measures on resize.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => {
      const first = viewport.children[0] as HTMLElement | undefined;
      if (!first) return;
      const gap = parseFloat(getComputedStyle(viewport).columnGap || getComputedStyle(viewport).gap) || 0;
      const cardStep = first.getBoundingClientRect().width + gap;
      setStep(cardStep);
      setVisible(Math.max(1, Math.floor((viewport.parentElement?.clientWidth ?? 0) / cardStep)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    if (viewport.parentElement) ro.observe(viewport.parentElement);
    return () => ro.disconnect();
  }, [count]);

  // Keep the index in range if the data set changes size.
  useEffect(() => {
    setActive((a) => Math.min(Math.max(a, 0), count));
  }, [count]);

  useEffect(() => {
    if (paused || !canSlide) return;
    const id = window.setInterval(() => {
      // active === count is the duplicated tail — the onTransitionEnd snap below
      // returns it to 0 long before the next tick.
      if (!document.hidden) setActive((a) => Math.min(a + 1, count));
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, canSlide, count]);

  if (query.isLoading || query.isError || count === 0) return null;

  const offset = dir === "rtl" ? active * step : -active * step;

  const stepBy = (delta: 1 | -1) => {
    if (delta === -1 && active === 0) {
      // Jump invisibly to the identical-looking duplicated tail, then animate
      // one card back so "previous" loops seamlessly.
      setAnim(false);
      setActive(count);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setAnim(true);
          setActive(count - 1);
        }),
      );
      return;
    }
    setActive((a) => Math.min(Math.max(a + delta, 0), count));
  };

  // When the slide lands on the duplicated tail, snap to the real start without
  // the transition — the two positions look identical, so the loop is seamless.
  const onTrackTransitionEnd = (e: TransitionEvent<HTMLUListElement>) => {
    // Bubbled transitionends from card hovers must not trigger the snap.
    if (e.target !== e.currentTarget || active !== count) return;
    setAnim(false);
    setActive(0);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
  };

  return (
    <section id="certificates" className="border-y border-border bg-surface py-24">
      <Container>
        <Reveal>
          <SectionHead
            eyebrow={t("lp.certificatesEyebrow")}
            title={t("lp.certificatesTitle")}
            lead={t("lp.certificatesDesc")}
          />
        </Reveal>
        <div
          className="relative mt-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div className="overflow-hidden">
            <ul
              ref={viewportRef}
              onTransitionEnd={onTrackTransitionEnd}
              className={`flex w-max gap-4 lg:gap-6 ${anim ? "transition-transform duration-700 ease-out" : ""}`}
              style={{ transform: `translateX(${offset}px)` }}
            >
              {strip.map((c, i) => (
                <li key={`${c.id}-${i}`} aria-hidden={i >= count} className="w-56 shrink-0 sm:w-64">
                  <article
                    className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-white text-center ring-1 ring-border ${FLUID} hover:-translate-y-1 hover:shadow-md dark:bg-white/95`}
                  >
                    {c.image_url || c.image_thumb_url ? (
                      <a
                        href={c.image_url ?? c.image_thumb_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        title={c.name}
                        className="block overflow-hidden bg-surface"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.image_thumb_url ?? c.image_url ?? ""}
                          alt={c.name}
                          loading="lazy"
                          className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      </a>
                    ) : (
                      <div className="flex aspect-[3/4] w-full items-center justify-center bg-surface">
                        <CertificateIcon size={56} weight="duotone" aria-hidden="true" className="text-accent/70" />
                      </div>
                    )}
                    <h3 className="mt-auto px-4 pb-5 pt-4 text-sm font-semibold leading-snug text-text text-balance">{c.name}</h3>
                  </article>
                </li>
              ))}
            </ul>
          </div>
          {canSlide && (
            <>
              <button
                type="button"
                onClick={() => stepBy(-1)}
                aria-label={t("common.prev")}
                className={`absolute top-1/2 left-2 z-40 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text shadow-lg hover:border-accent hover:text-primary md:-left-14 ${FOCUS}`}
              >
                <CaretLeft size={22} weight="bold" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => stepBy(1)}
                aria-label={t("common.next")}
                className={`absolute top-1/2 right-2 z-40 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text shadow-lg hover:border-accent hover:text-primary md:-right-14 ${FOCUS}`}
              >
                <CaretRight size={22} weight="bold" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
