"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { FOCUS } from "./tokens";

export function HorizontalCarousel({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { t, dir } = useI18n();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => setHasOverflow(viewport.scrollWidth > viewport.clientWidth + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
    return () => observer.disconnect();
  }, [children]);

  const move = (physicalDirection: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const list = viewport.firstElementChild;
    const firstCard = list?.firstElementChild;
    if (!(list instanceof HTMLElement) || !(firstCard instanceof HTMLElement)) return;
    const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 0;
    const rtlFactor = dir === "rtl" ? -1 : 1;
    viewport.scrollBy({ left: physicalDirection * rtlFactor * (firstCard.offsetWidth + gap), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div ref={viewportRef} className="overflow-x-auto scroll-smooth py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" tabIndex={0}>
        <ul className={`flex snap-x snap-mandatory items-stretch gap-6 ${className}`}>
          {children}
        </ul>
      </div>
      {hasOverflow && (
        <>
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label={t("common.prev")}
            className={`absolute top-1/2 left-2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text shadow-lg hover:border-accent hover:text-primary md:-left-14 ${FOCUS}`}
          >
            <CaretLeft size={22} weight="bold" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label={t("common.next")}
            className={`absolute top-1/2 right-2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text shadow-lg hover:border-accent hover:text-primary md:-right-14 ${FOCUS}`}
          >
            <CaretRight size={22} weight="bold" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
