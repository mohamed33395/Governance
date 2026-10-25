"use client";

import { useEffect, useRef, useState } from "react";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Count-up animation for translated stat strings like "+١٢٠" / "+120".
 * The first digit run is animated 0 → target while the surrounding text
 * (prefix "+" etc.) is kept verbatim, so bidi rendering and digit style
 * (Arabic-Indic vs Latin) match the static output exactly. Starts once
 * the element scrolls into view; reduced-motion users see the final value.
 */
function parseStat(value: string) {
  const m = value.match(/[0-9٠-٩]+/);
  if (!m) return null;
  const target = parseInt(
    m[0].replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))),
    10
  );
  return {
    target,
    prefix: value.slice(0, m.index),
    suffix: value.slice((m.index ?? 0) + m[0].length),
    arabic: /[٠-٩]/.test(m[0]),
  };
}

export function CountUp({
  value,
  duration = 1600,
  className = "",
}: {
  /** translated stat string, e.g. t("expertStatExp") */
  value: string;
  duration?: number;
  className?: string;
}) {
  const parsed = parseStat(value);
  const target = parsed?.target ?? 0;
  const arabic = parsed?.arabic ?? false;
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !parsed) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    started.current = false;
    setN(0);
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
          setN(Math.round(eased * target));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, arabic, duration]);

  if (!parsed) return <span className={className}>{value}</span>;

  const digits = arabic
    ? String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)])
    : String(n);

  return (
    <span ref={ref} className={className}>
      {parsed.prefix}
      {digits}
      {parsed.suffix}
    </span>
  );
}
