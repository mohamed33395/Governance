"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserCircle } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/i18n-context";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Avatar } from "@/components/ui";
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

  return (
    <header className="pointer-events-none sticky top-0 z-50 h-24">
      {/* screen filling glass overlay */}
      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label={t("menu")}
        aria-hidden={!open}
        className={`fixed inset-0 flex flex-col items-center justify-center gap-8 overflow-y-auto bg-white/80 px-6 py-24 backdrop-blur-3xl transition-all duration-700 ${EASE} dark:bg-black/80 ${
          open ? "pointer-events-auto visible opacity-100" : "invisible opacity-0"
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

      {/* closed state: floating glass pill */}
      <div
        className={`pointer-events-auto relative mx-auto mt-6 flex w-max max-w-[calc(100vw-32px)] items-center gap-2 rounded-full border border-border bg-white/80 p-2 backdrop-blur-xl transition-all duration-700 ${EASE} dark:bg-black/80`}
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full ps-2 pe-2 focus-visible:outline-2 focus-visible:outline-accent"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon.png" alt={t("fullLogoAlt")} className="h-8 w-auto" />
        </Link>

        <LanguageSwitcher />
        <ThemeToggle />

        <Link
          href="/packages"
          className="hidden items-center gap-2 rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] sm:inline-flex"
        >
          {t("bookConsultation")}
          <ArrowLeft size={16} weight="bold" aria-hidden="true" className="ltr:rotate-180" />
        </Link>

        {!clientToken && (
          <Link
            href="/login"
            aria-label={t("auth.login")}
            className="hidden size-10 items-center justify-center rounded-full text-text transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-border focus-visible:outline-2 focus-visible:outline-accent sm:inline-flex"
          >
            <UserCircle size={24} aria-hidden="true" />
          </Link>
        )}

        {/* hamburger → X morph */}
        <button
          type="button"
          aria-label={t("menu")}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
          className="relative size-10 shrink-0 rounded-full bg-text text-background transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
        >
          <span
            aria-hidden="true"
            className={`absolute start-1/2 top-1/2 -ms-[9px] -mt-px h-0.5 w-[18px] rounded-full bg-current transition-all duration-700 ${EASE} ${
              open ? "translate-y-0 rotate-45" : "-translate-y-1 rotate-0"
            }`}
          />
          <span
            aria-hidden="true"
            className={`absolute start-1/2 top-1/2 -ms-[9px] -mt-px h-0.5 w-[18px] rounded-full bg-current transition-all duration-700 ${EASE} ${
              open ? "translate-y-0 -rotate-45" : "translate-y-1 rotate-0"
            }`}
          />
        </button>
      </div>
    </header>
  );
}
