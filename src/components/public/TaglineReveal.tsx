"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Large tagline whose words light up one at a time as they cross a trigger line
 * (65% down the viewport). Muted at ~30% opacity, full colour once crossed.
 * One IntersectionObserver for all words, no scroll listeners.
 * Render with `key={text}` so a language switch resets the word state.
 */
export function TaglineReveal({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState<boolean[]>(() => words.map(() => false));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(words.map(() => true));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        setActive((prev) => {
          const next = [...prev];
          for (const entry of entries) {
            const i = Number((entry.target as HTMLElement).dataset.i);
            // lit while inside the upper 65% of the viewport, or already scrolled past it
            next[i] = entry.isIntersecting || entry.boundingClientRect.top < 0;
          }
          return next;
        });
      },
      { rootMargin: "0px 0px -35% 0px", threshold: 0 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <p className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          data-i={i}
          aria-hidden="true"
          className={`transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            active[i] ? "text-text" : "text-text/30"
          }`}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
