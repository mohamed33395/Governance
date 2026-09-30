import type { ReactNode } from "react";
import { FLUID } from "./tokens";

export { FLUID };

/**
 * Scroll reveal animations are switched off on purpose: content is visible as soon as the
 * page loads. The component stays as a plain wrapper so existing call sites (and any future
 * animation) keep working without touching every page.
 */
export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  /** kept for API compatibility, no longer used */
  delay?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
