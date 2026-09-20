"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/i18n-context";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export function Header() {
  const { t } = useI18n();
  const [navOpen, setNavOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (navOpen) {
      document.body.classList.add("nav-open");
    } else {
      document.body.classList.remove("nav-open");
    }
    return () => document.body.classList.remove("nav-open");
  }, [navOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setNavOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="wrap nav-row">
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon.png" alt={t("fullLogoAlt")} />
          <span className="brand-text">
            {t("brandName")}
            <span>{t("brandTagline")}</span>
          </span>
        </Link>
        <nav className={`main-nav${navOpen ? " open" : ""}`} id="mainNav">
          <Link href="/" onClick={() => setNavOpen(false)}>
            {t("home")}
          </Link>
          <Link href="/services" onClick={() => setNavOpen(false)}>
            {t("services")}
          </Link>
          <Link href="/packages" onClick={() => setNavOpen(false)}>
            {t("packages")}
          </Link>
          <Link href="/about" onClick={() => setNavOpen(false)}>
            {t("about")}
          </Link>
          <Link href="/client" onClick={() => setNavOpen(false)}>
            {t("join")}
          </Link>
          <Link href="/team" onClick={() => setNavOpen(false)}>
            {t("team")}
          </Link>
          <Link href="/contact" onClick={() => setNavOpen(false)}>
            {t("contact")}
          </Link>
        </nav>
        <div className="header-actions">
          <Link href="/app" className="app-download" aria-label={t("appDownloadAria")} title={t("appDownload")}>
            <span className="app-download-text">{t("appDownload")}</span>
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            type="button"
            className="menu-toggle"
            id="menuToggle"
            aria-label={t("menu")}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            <span className="icon">
              <svg viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </span>
          </button>
        </div>
      </div>
      {navOpen ? (
        <div className="nav-overlay open" aria-hidden="true" onClick={() => setNavOpen(false)} />
      ) : null}
    </header>
  );
}
