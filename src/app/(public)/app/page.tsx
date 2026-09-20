"use client";

import { useEffect, useState } from "react";
import "@/styles/app-page.css";
import { useI18n } from "@/lib/i18n/i18n-context";
import {
  AppointmentsScreen,
  BookingScreen,
  ContactScreen,
  HomeScreen,
  LoginScreen,
  NotificationsScreen,
  PackagesScreen,
  ProfileScreen,
  ReportsScreen,
} from "@/components/public/AppScreens";

const FEATURES = [
  {
    titleKey: "feat1",
    descKey: "feat1Desc",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    titleKey: "feat2",
    descKey: "feat2Desc",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    titleKey: "feat3",
    descKey: "feat3Desc",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    titleKey: "feat4",
    descKey: "feat4Desc",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    titleKey: "feat5",
    descKey: "feat5Desc",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    titleKey: "feat6",
    descKey: "feat6Desc",
    icon: (
      <svg viewBox="0 0 24 24">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

const SCREENSHOTS = [
  { id: "home", titleKey: "screenHome", Screen: HomeScreen },
  { id: "appts", titleKey: "screenAppts", Screen: AppointmentsScreen },
  { id: "reports", titleKey: "screenReports", Screen: ReportsScreen },
  { id: "packages", titleKey: "screenPackages", Screen: PackagesScreen },
  { id: "booking", titleKey: "screenBooking", Screen: BookingScreen },
  { id: "notif", titleKey: "screenNotif", Screen: NotificationsScreen },
  { id: "profile", titleKey: "screenProfile", Screen: ProfileScreen },
  { id: "contact", titleKey: "screenContact", Screen: ContactScreen },
];

const APPLE_ICON = (
  <svg viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.84-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const ANDROID_ICON = (
  <svg viewBox="0 0 24 24">
    <path d="M17.6 9.48l1.84-3.18a.38.38 0 0 0-.66-.38l-1.86 3.22a11.66 11.66 0 0 0-9.84 0L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.81 10.81 0 0 0 1 18h22a10.81 10.81 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 1.25-1.25A1.25 1.25 0 0 1 7 15.25zm10 0a1.25 1.25 0 1 1 1.25-1.25 1.25 1.25 0 0 1-1.25 1.25z" />
  </svg>
);

export default function AppPage() {
  const { t, dir } = useI18n();
  const [activeShot, setActiveShot] = useState(0);
  const [visible, setVisible] = useState(4);

  useEffect(() => {
    document.title = t("appPageTitle");
  }, [t]);

  useEffect(() => {
    const sm = window.matchMedia("(max-width: 680px)");
    const md = window.matchMedia("(max-width: 1000px)");
    const update = () => setVisible(sm.matches ? 1 : md.matches ? 2 : 4);
    update();
    sm.addEventListener("change", update);
    md.addEventListener("change", update);
    return () => {
      sm.removeEventListener("change", update);
      md.removeEventListener("change", update);
    };
  }, []);

  const maxShot = Math.max(0, SCREENSHOTS.length - visible);
  const shot = Math.min(activeShot, maxShot);

  return (
    <main className="app-page">
      <section className="app-hero" id="top">
        <div className="wrap">
          <div>
            <span className="eyebrow">{t("appEyebrow")}</span>
            <h1>{t("appHeroTitle")}</h1>
            <p>{t("appHeroLead")}</p>
            <div className="store-badges">
              <a href="#" className="store-badge" aria-label={t("downloadAppStore")}>
                {APPLE_ICON}
                iPhone
              </a>
              <a href="#" className="store-badge" aria-label={t("downloadPlayStore")}>
                {ANDROID_ICON}
                Android
              </a>
            </div>
          </div>
          <div className="phone-mockup">
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-screen live">
                <LoginScreen />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t("featuresEyebrow")}</span>
            <h2>{t("featuresTitle")}</h2>
            <p>{t("featuresDesc")}</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.titleKey}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{t(f.titleKey)}</h3>
                <p>{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section screenshots" id="screenshots">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t("screenshotsEyebrow")}</span>
            <h2>{t("screenshotsTitle")}</h2>
            <p>{t("screenshotsDesc")}</p>
          </div>
          <div className="shots-carousel">
            <button
              type="button"
              className="shot-arrow"
              aria-label={t("phPrev")}
              disabled={shot === 0}
              onClick={() => setActiveShot((i) => Math.max(0, i - 1))}
            >
              <svg viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <div className="shot-viewport">
              <div
                className="shot-track"
                style={{ transform: `translateX(${(dir === "rtl" ? 1 : -1) * shot * (100 / visible)}%)` }}
              >
                {SCREENSHOTS.map(({ id, titleKey, Screen }) => (
                  <div className="shot-slide" key={id} style={{ flex: `0 0 ${100 / visible}%` }}>
                    <div className="phone">
                      <div className="phone-notch" />
                      <div className="phone-screen live">
                        <Screen />
                      </div>
                    </div>
                    <div className="screen-caption">{t(titleKey)}</div>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="shot-arrow"
              aria-label={t("phNext")}
              disabled={shot === maxShot}
              onClick={() => setActiveShot((i) => Math.min(maxShot, i + 1))}
            >
              <svg viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
          <div className="shot-dots">
            {Array.from({ length: maxShot + 1 }, (_, i) => (
              <button
                key={i}
                type="button"
                className={i === shot ? "on" : ""}
                aria-label={`${i + 1}`}
                onClick={() => setActiveShot(i)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="download">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t("downloadEyebrow")}</span>
            <h2>{t("downloadTitle")}</h2>
            <p>{t("downloadDesc")}</p>
          </div>
          <div className="download-grid">
            <div className="download-card">
              <div className="os-icon">{APPLE_ICON}</div>
              <h3>iPhone</h3>
              <p>{t("downloadIos")}</p>
              <a href="#" className="btn btn-gold">
                {t("downloadAppStore")}
              </a>
            </div>
            <div className="download-card">
              <div className="os-icon">{ANDROID_ICON}</div>
              <h3>Android</h3>
              <p>{t("downloadAndroid")}</p>
              <a href="#" className="btn btn-gold">
                {t("downloadPlayStore")}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
