"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="translate-wrap" ref={wrapRef}>
      <button
        type="button"
        className="translate-icon"
        aria-label={t("translateAria")}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </button>
      <div className={`translate-panel${open ? " open" : ""}`}>
        <div className="translate-list">
          <button
            type="button"
            className={lang === "ar" ? "active" : undefined}
            onClick={() => {
              setLang("ar");
              setOpen(false);
            }}
          >
            {t("langAr")}
          </button>
          <button
            type="button"
            className={lang === "en" ? "active" : undefined}
            onClick={() => {
              setLang("en");
              setOpen(false);
            }}
          >
            {t("langEn")}
          </button>
        </div>
      </div>
    </div>
  );
}
