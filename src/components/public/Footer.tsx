"use client";

import Link from "next/link";
import { Envelope, Phone } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/i18n-context";

const FOOTER_SERVICES = Array.from({ length: 13 }, (_, i) => `footSvc${i + 1}`);

const COMPANY_LINKS = [
  { href: "/about", key: "about" },
  { href: "/services", key: "services" },
  { href: "/team", key: "team" },
  { href: "/join", key: "join" },
  { href: "/contact", key: "contact" },
  { href: "/packages", key: "bookConsultation" },
] as const;

const LINK =
  "rounded-lg text-sm text-white/70 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer id="contact" className="bg-secondary text-white/70">
      <div className="mx-auto max-w-[1180px] px-6 pt-16 pb-6 md:px-8">
        <div className="grid gap-10 border-b border-white/15 pb-12 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1.8fr_1fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_icon.png" alt={t("logoAlt")} className="mb-4 h-10 w-auto" />
            <p className="max-w-[32ch] text-sm text-pretty">{t("brandDesc")}</p>
          </div>

          <nav aria-label={t("footerCompany")}>
            <h2 className="mb-4 text-sm font-semibold text-white">{t("footerCompany")}</h2>
            <ul className="flex flex-col gap-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={LINK}>
                    {t(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("footerServices")}>
            <h2 className="mb-4 text-sm font-semibold text-white">{t("footerServices")}</h2>
            <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {FOOTER_SERVICES.map((key) => (
                <li key={key}>
                  <Link href="/services" className={`${LINK} text-xs`}>
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mb-4 text-sm font-semibold text-white">{t("footerContactTitle")}</h2>
            <ul className="flex flex-col gap-3">
              <li>
                <a href="mailto:GCMC@GCMC.SA" className={`${LINK} inline-flex items-center gap-2`}>
                  <Envelope size={18} aria-hidden="true" />
                  <span dir="ltr">GCMC@GCMC.SA</span>
                </a>
              </li>
              <li>
                <a href="tel:+966550181166" className={`${LINK} inline-flex items-center gap-2`}>
                  <Phone size={18} aria-hidden="true" />
                  <span dir="ltr">+966 55 018 1166</span>
                </a>
              </li>
              <li>
                <a href="tel:+966554181166" className={`${LINK} inline-flex items-center gap-2`}>
                  <Phone size={18} aria-hidden="true" />
                  <span dir="ltr">+966 55 418 1166</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="pt-6 text-xs text-pretty">{t("footerCopyright")}</p>
      </div>
    </footer>
  );
}
