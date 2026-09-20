"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/i18n-context";
import { SOCIAL_ICONS } from "./social-icons";

const FOOTER_SERVICES = [
  "footSvc1",
  "footSvc2",
  "footSvc3",
  "footSvc4",
  "footSvc5",
  "footSvc6",
  "footSvc7",
  "footSvc8",
  "footSvc9",
  "footSvc10",
  "footSvc11",
  "footSvc12",
  "footSvc13",
];

export function Footer() {
  const { t } = useI18n();

  return (
    <footer id="contact">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_icon.png" alt={t("logoAlt")} />
            <p>{t("brandDesc")}</p>
            <div className="social-row" style={{ marginTop: 20 }}>
              {SOCIAL_ICONS.map((s) => (
                <a key={s.name} href="#" aria-label={s.name}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          <div className="footer-col">
            <h5>{t("footerCompany")}</h5>
            <ul>
              <li>
                <Link href="/about">{t("about")}</Link>
              </li>
              <li>
                <Link href="/services">{t("services")}</Link>
              </li>
              <li>
                <Link href="/team">{t("team")}</Link>
              </li>
              <li>
                <Link href="/client">{t("join")}</Link>
              </li>
              <li>
                <Link href="/contact">{t("contact")}</Link>
              </li>
              <li>
                <Link href="/booking">{t("bookConsultation")}</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col footer-services">
            <h5>{t("footerServices")}</h5>
            <ul>
              {FOOTER_SERVICES.map((key) => (
                <li key={key}>
                  <Link href="/services">{t(key)}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col footer-contact">
            <h5>{t("footerContactTitle")}</h5>
            <ul>
              <li>
                <span className="icon">
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="14" rx="1" />
                    <polyline points="3,6 12,13 21,6" />
                  </svg>
                </span>{" "}
                GCMC@GCMC.SA
              </li>
              <li>
                <span className="icon">
                  <svg viewBox="0 0 24 24">
                    <rect x="7" y="2" width="10" height="20" rx="2" />
                    <line x1="11" y1="18" x2="13" y2="18" />
                  </svg>
                </span>{" "}
                <span dir="ltr">+966 55 018 1166</span>
              </li>
              <li>
                <span className="icon">
                  <svg viewBox="0 0 24 24">
                    <rect x="7" y="2" width="10" height="20" rx="2" />
                    <line x1="11" y1="18" x2="13" y2="18" />
                  </svg>
                </span>{" "}
                <span dir="ltr">+966 55 418 1166</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t("footerCopyright")}</span>
        </div>
      </div>
    </footer>
  );
}
