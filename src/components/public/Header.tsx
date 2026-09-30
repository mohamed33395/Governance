"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, DeviceMobile, UserCircle } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/i18n-context";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Avatar } from "@/components/ui";
import { FLUID, FOCUS } from "./tokens";
import { useClientAuth } from "@/stores/client-auth";
import type { ClientMe } from "@/types/api";

const LINKS = [
  { href: "/", key: "home" },
  { href: "/services", key: "services" },
  { href: "/packages", key: "packages" },
  { href: "/consultants", key: "nav.consultants" },
  { href: "/about", key: "about" },
  { href: "/join", key: "join" },
  { href: "/team", key: "team" },
  { href: "/contact", key: "contact" },
] as const;

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

// Fluid island nav: a floating glass pill that expands into a full screen overlay.
export function Header() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const queryClient = useQueryClient();
  const clientToken = useClientAuth((s) => s.token);
  const user = useClientAuth((s) => s.user);
  const setUser = useClientAuth((s) => s.setUser);
  const clear = useClientAuth((s) => s.clear);
  const [open, setOpen] = useState(false);

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
      setOpen(false);
      queryClient.clear();
      router.refresh();
    },
  });

  // close on navigation, lock page scroll while open, Escape closes
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const stagger = (i: number) => ({ transitionDelay: open ? `${100 + i * 50}ms` : "0ms" });
  const reveal = (shown: boolean) =>
    shown ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0";

  const LINK = `rounded-lg px-3 py-2 text-sm font-semibold ${FLUID} ${FOCUS}`;

  return (
    <>
      {/* full width bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 md:h-20 md:px-8">
          <Link href="/" className={`flex shrink-0 items-center rounded-lg ${FOCUS}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_icon.png" alt={t("fullLogoAlt")} className="h-10 w-auto md:h-12" />
          </Link>

          {/* inline links on wide screens */}
          <nav aria-label={t("menu")} className="mx-auto hidden xl:block">
            <ul className="flex items-center gap-1">
              {LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`${LINK} ${
                        active ? "bg-surface text-text" : "text-muted hover:bg-surface hover:text-text"
                      }`}
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ms-auto flex items-center gap-2 xl:ms-0">
            <LanguageSwitcher panelClassName="max-sm:fixed! max-sm:inset-x-4! max-sm:top-20! max-sm:w-auto! max-sm:max-w-none!" />
            <ThemeToggle />

            {!clientToken && (
              <Link
                href="/login"
                aria-label={t("auth.login")}
                className={`hidden size-10 items-center justify-center rounded-full text-text hover:bg-border ${FLUID} ${FOCUS} sm:inline-flex`}
              >
                <UserCircle size={24} aria-hidden="true" />
              </Link>
            )}

            <Link
              href="/app"
              aria-label={t("appDownloadAria")}
              className="btn btn-outline hidden md:inline-flex"
            >
              <DeviceMobile size={20} weight="bold" aria-hidden="true" />
              {t("appDownload")}
            </Link>

            <Link href="/packages" className="btn btn-primary hidden sm:inline-flex">
              {t("bookConsultation")}
              <ArrowLeft size={16} weight="bold" aria-hidden="true" className="ltr:rotate-180" />
            </Link>

            {/* hamburger → X morph (below the inline breakpoint) */}
            <button
              type="button"
              aria-label={t("menu")}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((v) => !v)}
              className={`relative size-10 shrink-0 rounded-full bg-text text-background hover:opacity-90 ${FLUID} ${FOCUS} active:scale-[0.98] xl:hidden`}
            >
              <span
                aria-hidden="true"
                className={`absolute start-1/2 top-1/2 -ms-[9px] -mt-px h-0.5 w-[18px] rounded-full bg-current ${FLUID} ${
                  open ? "translate-y-0 rotate-45" : "-translate-y-1 rotate-0"
                }`}
              />
              <span
                aria-hidden="true"
                className={`absolute start-1/2 top-1/2 -ms-[9px] -mt-px h-0.5 w-[18px] rounded-full bg-current ${FLUID} ${
                  open ? "translate-y-0 -rotate-45" : "translate-y-1 rotate-0"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* screen filling glass overlay (kept outside the blurred header so `fixed` stays viewport relative) */}
      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label={t("menu")}
        aria-hidden={!open}
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 overflow-y-auto bg-white/80 px-6 pt-24 pb-24 backdrop-blur-3xl transition-all duration-700 ${EASE} dark:bg-black/80 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav aria-label={t("menu")} className="flex flex-col items-center gap-2">
          {LINKS.map((link, i) => {
            const active = isActive(link.href);
            return (
              <div key={link.href} className="overflow-hidden">
                <Link
                  href={link.href}
                  tabIndex={open ? 0 : -1}
                  aria-current={active ? "page" : undefined}
                  style={stagger(i)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2 text-3xl font-semibold transition-all duration-700 ${EASE} hover:text-text focus-visible:outline-2 focus-visible:outline-accent md:text-4xl ${reveal(open)} ${
                    active ? "text-text" : "text-text/60"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`size-2 rounded-full bg-accent transition-all duration-700 ${EASE} ${
                      active ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    }`}
                  />
                  {t(link.key)}
                </Link>
              </div>
            );
          })}
        </nav>

        <div
          style={stagger(LINKS.length)}
          className={`flex flex-wrap items-center justify-center gap-3 transition-all duration-700 ${EASE} ${reveal(open)}`}
        >
          <Link href="/app" tabIndex={open ? 0 : -1} className="btn btn-outline">
            <DeviceMobile size={20} weight="bold" aria-hidden="true" />
            {t("appDownload")}
          </Link>
          <Link href="/packages" tabIndex={open ? 0 : -1} className="btn btn-primary">
            {t("bookConsultation")}
          </Link>
          {clientToken ? (
            <>
              <span className="flex items-center gap-2 text-base text-muted">
                <Avatar src={user?.avatar_url} name={user?.name ?? "?"} size="sm" />
                {user?.name}
              </span>
              <Link href="/dashboard" tabIndex={open ? 0 : -1} className="btn btn-outline">
                {t("nav.dashboard")}
              </Link>
              <Link href="/profile" tabIndex={open ? 0 : -1} className="btn btn-outline">
                {t("nav.profile")}
              </Link>
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                disabled={logout.isPending}
                onClick={() => logout.mutate()}
                className="btn btn-outline"
              >
                {t("common.logout")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" tabIndex={open ? 0 : -1} className="btn btn-outline">
                {t("auth.login")}
              </Link>
              <Link href="/register" tabIndex={open ? 0 : -1} className="btn btn-outline">
                {t("auth.register")}
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
