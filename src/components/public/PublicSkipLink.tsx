"use client";

import { useI18n } from "@/lib/i18n/i18n-context";

// Keyboard users jump past the nav straight to the page content.
export function PublicSkipLink() {
  const { t } = useI18n();
  return (
    <a
      href="#main"
      className="fixed start-4 top-4 z-[60] -translate-y-24 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {t("lp.skip")}
    </a>
  );
}
