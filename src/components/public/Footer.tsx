"use client";

import Link from "next/link";
import {
  CaretDown,
  Envelope,
  FacebookLogo,
  InstagramLogo,
  Phone,
  SnapchatLogo,
  TelegramLogo,
  TiktokLogo,
  WhatsappLogo,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";

// Split by text length so both columns render ~equal height
const SERVICES_COLS = [
  ["footSvc1", "footSvc3", "footSvc4", "footSvc5", "footSvc7", "footSvc9", "footSvc13"],
  ["footSvc2", "footSvc6", "footSvc8", "footSvc10", "footSvc11", "footSvc12", "footSvc14"],
];

const COMPANY_LINKS = [
  { href: "/about", key: "about" },
  { href: "/services", key: "services" },
  { href: "/join", key: "join" },
  { href: "/contact", key: "contact" },
  { href: "/packages", key: "bookConsultation" },
] as const;

const PHONES = [
  { label: "+966 55 418 1166", tel: "+966554181166" },
  { label: "+966 50 318 1166", tel: "+966503181166" },
  { label: "+966 50 418 1166", tel: "+966504181166" },
  { label: "+966 53 518 1166", tel: "+966535181166" },
  { label: "+966 55 018 1166", tel: "+966550181166" },
] as const;

const EMAILS = [
  "gcmc@gcmc.sa",
  "info@gcmc.sa",
  "consultant@gcmc.sa",
  "it@gcmc.sa",
  "noreply@gcmc.sa",
] as const;

const SOCIALS = [
  { label: "Facebook", href: "https://www.facebook.com/share/1EVSS5h1Ud/", Icon: FacebookLogo },
  { label: "Instagram", href: "https://www.instagram.com/alhawkamah", Icon: InstagramLogo },
  { label: "X", href: "https://x.com/alhawkamah", Icon: XLogo },
  { label: "TikTok", href: "https://www.tiktok.com/@alhawkamah", Icon: TiktokLogo },
  { label: "Snapchat", href: "https://snapchat.com/t/fpooV3uz", Icon: SnapchatLogo },
  { label: "YouTube", href: "https://youtube.com/@alhawkamah", Icon: YoutubeLogo },
  { label: "WhatsApp", href: "https://wa.me/966554181166", Icon: WhatsappLogo },
  { label: "Telegram", href: "https://t.me/+966554181166", Icon: TelegramLogo },
] as const;

const LINK =
  "rounded-lg text-sm text-white/70 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Footer() {
  const { t } = useI18n();
  const [showAllEmails, setShowAllEmails] = useState(false);
  const [showAllPhones, setShowAllPhones] = useState(false);

  return (
    <footer id="contact" className="bg-secondary text-white/70">
      <div className="mx-auto max-w-[1180px] px-6 pt-10 pb-5 md:px-8">
        <div className="grid gap-8 border-b border-white/15 pb-8 md:grid-cols-2 lg:grid-cols-[1.1fr_0.7fr_1.5fr_1.7fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo_mark.png"
              alt={t("logoAlt")}
              className="mx-auto mb-6 h-10 w-auto"
            />
            <p className="max-w-[32ch] text-sm text-pretty">{t("brandDesc")}</p>
          </div>

          <nav aria-label={t("footerCompany")}>
            <h2 className="mb-3 text-sm font-semibold text-white">{t("footerCompany")}</h2>
            <ul className="flex flex-col gap-2.5">
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
            <div className="grid gap-x-8 sm:grid-cols-2">
              {SERVICES_COLS.map((col, i) => (
                <div key={i}>
                  <h2
                    className={`mb-3 text-sm font-semibold text-white ${i > 0 ? "hidden sm:block" : ""}`}
                    aria-hidden={i > 0 || undefined}
                  >
                    {t("footerServices")}
                  </h2>
                  <ul className="flex flex-col gap-1.5">
                    {col.map((key) => (
                      <li key={key}>
                        <Link href="/services" className={`${LINK} text-xs`}>
                          {t(key)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-white">{t("footerContactTitle")}</h2>
            <div className="grid gap-x-8 gap-y-4 min-[480px]:grid-cols-2">
              <div>
                <h3 className="mb-2 text-xs font-semibold text-white/50">{t("emailLabel")}</h3>
                <ul className="flex flex-col gap-1.5">
                  {(showAllEmails ? EMAILS : EMAILS.slice(0, 1)).map((email) => (
                    <li key={email}>
                      <a href={`mailto:${email}`} className={`${LINK} inline-flex items-center gap-2`}>
                        <Envelope size={16} aria-hidden="true" />
                        <span dir="ltr">{email}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setShowAllEmails((v) => !v)}
                  aria-expanded={showAllEmails}
                  className={`${LINK} mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white/90`}
                >
                  {showAllEmails ? t("showLess") : `${t("showMore")} (${EMAILS.length - 1}+)`}
                  <CaretDown
                    size={14}
                    weight="bold"
                    aria-hidden="true"
                    className={`transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      showAllEmails ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold text-white/50">{t("phoneLabel")}</h3>
                <ul className="flex flex-col gap-1.5">
                  {(showAllPhones ? PHONES : PHONES.slice(0, 1)).map((p) => (
                    <li key={p.tel}>
                      <a href={`tel:${p.tel}`} className={`${LINK} inline-flex items-center gap-2`}>
                        <Phone size={16} aria-hidden="true" />
                        <span dir="ltr">{p.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setShowAllPhones((v) => !v)}
                  aria-expanded={showAllPhones}
                  className={`${LINK} mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white/90`}
                >
                  {showAllPhones ? t("showLess") : `${t("showMore")} (${PHONES.length - 1}+)`}
                  <CaretDown
                    size={14}
                    weight="bold"
                    aria-hidden="true"
                    className={`transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      showAllPhones ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold text-white/50">{t("socialLabel")}</h3>
              <ul className="flex flex-wrap items-center gap-2.5">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="inline-flex size-8 items-center justify-center rounded-full border border-white/20 text-white/70 transition-all duration-300 hover:scale-105 hover:border-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <Icon size={16} weight="fill" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="pt-5 text-xs text-pretty">{t("footerCopyright")}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white/90">{t("footerBankLabel")}:</span>
            <span dir="ltr">SA51 1500 0900 1468 9515 0002</span>
            <span>— {t("footerBankName")}</span>
          </p>
          <span dir="ltr" className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/LOG-icon.png"
              alt="CodeHouse"
              className="h-9 w-auto opacity-80 grayscale md:h-10"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/LOG-text.png"
              alt=""
              aria-hidden="true"
              className="footer-dev-logo h-3 w-auto grayscale md:h-3.5"
            />
          </span>
        </div>
      </div>
    </footer>
  );
}
