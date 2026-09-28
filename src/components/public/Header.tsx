"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/i18n-context";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Avatar } from "@/components/ui";
import { useClientAuth } from "@/stores/client-auth";
import type { ClientMe } from "@/types/api";

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="7" r="3.5" />
      <path d="M8 21c0-3 2-6 4-6s4 3 4 6" />
      <g className="user-hand-group">
        <path d="M16 14c2 2 4 6 4 9" />
      </g>
    </svg>
  );
}

export function Header() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const clientToken = useClientAuth((s) => s.token);
  const user = useClientAuth((s) => s.user);
  const setUser = useClientAuth((s) => s.setUser);
  const clear = useClientAuth((s) => s.clear);
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Keep the stored client fresh — GET /client/auth/me (§6)
  const meQuery = useQuery({
    queryKey: ["client", "me"],
    queryFn: () => api.get("/client/auth/me").then((r) => r.data.data as ClientMe),
    enabled: !!clientToken,
  });
  useEffect(() => {
    if (meQuery.data) setUser(meQuery.data);
  }, [meQuery.data, setUser]);

  const logout = useMutation({
    mutationFn: () => api.post("/client/auth/logout"),
    onSettled: () => {
      clear();
      setMenuOpen(false);
      queryClient.clear();
      router.refresh();
    },
  });

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
          <Link href="/consultants" onClick={() => setNavOpen(false)}>
            {t("nav.consultants")}
          </Link>
          <Link href="/about" onClick={() => setNavOpen(false)}>
            {t("about")}
          </Link>
          <Link href="/join" onClick={() => setNavOpen(false)}>
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
          {/* §9.2 — one dropdown; guest → login/register, client → account menu fed by /client/auth/me */}
          <div className="client-user-menu">
            <button
              type="button"
              className="client-user-menu-btn"
              aria-label="حسابي"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <UserIcon />
            </button>
            <div className={`client-user-dropdown${menuOpen ? " open" : ""}`}>
              {clientToken ? (
                <>
                  <div className="client-dropdown-header">
                    <Avatar src={user?.avatar_url} name={user?.name ?? "?"} size="sm" />
                    <span>{user?.name}</span>
                  </div>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                    {t("nav.dashboard")}
                  </Link>
                  <Link href="/profile" onClick={() => setMenuOpen(false)}>
                    {t("nav.profile")}
                  </Link>
                  <button type="button" disabled={logout.isPending} onClick={() => logout.mutate()}>
                    {t("common.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    {t("auth.login")}
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)}>
                    {t("auth.register")}
                  </Link>
                </>
              )}
            </div>
          </div>
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
