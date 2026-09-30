/** Shared design tokens for the public site (landing design system). */

/** Heavy, spring like settle used by every transition. */
export const FLUID = "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]";

export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Hero heading: gradient text (#000 to #666 light, #FFF to #9B9B9B dark), max 680px. */
export const H1_GRADIENT =
  "max-w-[680px] bg-linear-to-r from-black to-[#666666] bg-clip-text text-4xl leading-tight font-bold text-balance text-transparent md:text-5xl dark:from-white dark:to-[#9B9B9B]";

/** Text fields (contact, join, filters). 16px text so iOS never zooms on focus. */
export const FIELD = `w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-text placeholder:text-muted ${FLUID} hover:border-accent focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50`;

export const LABEL = "mb-2 block text-sm font-semibold text-text";

/** Card surface used across inner pages. */
export const CARD = "rounded-2xl border border-border bg-surface";
