"use client";

import { useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { SOCIAL_ICONS } from "./social-icons";

const LOGO = "/logo_icon.png";

const I = {
  home: (
    <svg viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  cal: (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  ),
  pkg: (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <polyline points="3,6 12,13 21,6" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
};

function StatusBar() {
  return (
    <div className="app-statusbar">
      <span>9:41</span>
      <span className="icons">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="14" width="3.5" height="6" rx="1" />
          <rect x="8.5" y="11" width="3.5" height="9" rx="1" />
          <rect x="14" y="8" width="3.5" height="12" rx="1" />
          <rect x="19.5" y="5" width="3.5" height="15" rx="1" />
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12.5a10 10 0 0 1 14 0" />
          <path d="M8.5 16a5 5 0 0 1 7 0" />
          <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="8" width="17" height="9" rx="2" />
          <rect x="4" y="10" width="11" height="5" rx="1" fill="currentColor" stroke="none" />
          <rect x="20" y="10.5" width="2.5" height="4" rx="1" fill="currentColor" stroke="none" />
        </svg>
      </span>
    </div>
  );
}

function AppHeader({ sub }: { sub: string }) {
  const { t } = useI18n();
  return (
    <div className="app-header">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO} alt="" />
      <div>
        <div className="t">{t("phBrand")}</div>
        <div className="s">{sub}</div>
      </div>
      <div className="h-icons">
        <span>{I.globe}</span>
        <span>{I.bell}</span>
      </div>
    </div>
  );
}

function TabBar({ active }: { active: string }) {
  const { t } = useI18n();
  const tabs = [
    { id: "home", label: t("phTabHome"), icon: I.home },
    { id: "appts", label: t("phTabAppts"), icon: I.cal },
    { id: "plus", label: "", icon: I.plus },
    { id: "reports", label: t("phTabReports"), icon: I.doc },
    { id: "packages", label: t("phTabPackages"), icon: I.pkg },
  ];
  return (
    <nav className="app-tabbar">
      {tabs.map((tb) => (
        <div key={tb.id} className={`tb${tb.id === "plus" ? " plus" : ""}${tb.id === active ? " on" : ""}`}>
          {tb.icon}
          {tb.label ? <span>{tb.label}</span> : null}
        </div>
      ))}
    </nav>
  );
}

function Screen({ sub, active, children }: { sub: string; active: string; children: ReactNode }) {
  return (
    <div className="app-screen">
      <StatusBar />
      <div className="app-body">
        <AppHeader sub={sub} />
        {children}
      </div>
      <TabBar active={active} />
    </div>
  );
}

export function LoginScreen() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"login" | "signup">("login");
  return (
    <div className="app-screen login">
      <StatusBar />
      <div className="login-body">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} alt="" />
        <h1>{t("phLoginTitle")}</h1>
        <div className="sub">{t("phLoginSub")}</div>
        <div className="login-card">
          <div className="login-tabs">
            <button type="button" className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>
              {t("phTabLogin")}
            </button>
            <button type="button" className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>
              {t("phTabSignup")}
            </button>
          </div>
          {mode === "signup" && (
            <div className="field">
              <label>{t("fullName")}</label>
              <input value={t("phProfileName")} readOnly />
            </div>
          )}
          <div className="field">
            <label>{t("phEmail")}</label>
            <input value="example@mail.com" readOnly dir="ltr" />
          </div>
          <div className="field">
            <label>{t("phPassword")}</label>
            <input type="password" value="••••••••" readOnly dir="ltr" />
          </div>
          {mode === "signup" && (
            <div className="field">
              <label>{t("phConfirmPassword")}</label>
              <input type="password" value="••••••••" readOnly dir="ltr" />
            </div>
          )}
          <button type="button" className="btn">
            {mode === "login" ? t("phTabLogin") : t("phTabSignup")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function HomeScreen() {
  const { t } = useI18n();
  return (
    <Screen sub={t("phPortal")} active="home">
      <div className="card dark">
        <h4>{t("phHello")}</h4>
        <div className="muted">{t("phHelloSub")}</div>
      </div>
      <div className="app-stats">
        <div className="app-stat">
          <div className="n">{t("phGold")}</div>
          <div className="l">{t("phStatPackage")}</div>
        </div>
        <div className="app-stat">
          <div className="n">٢</div>
          <div className="l">{t("phStatAppts")}</div>
        </div>
        <div className="app-stat">
          <div className="n">٤</div>
          <div className="l">{t("phStatReports")}</div>
        </div>
      </div>
      <div className="app-section-label">{t("phQuickActions")}</div>
      <div className="app-actions">
        <div className="app-action">
          {I.chat}
          <span>{t("phActContact")}</span>
        </div>
        <div className="app-action">
          {I.cal}
          <span>{t("phActAppts")}</span>
        </div>
        <div className="app-action">
          {I.doc}
          <span>{t("phActReports")}</span>
        </div>
        <div className="app-action">
          {I.plus}
          <span>{t("phActBook")}</span>
        </div>
      </div>
      <div className="card">
        <div className="row">
          <h4>{t("phNextReport")}</h4>
          <span className="badge gold">{t("phSoon")}</span>
        </div>
        <div className="app-list-item">
          <div className="ic">{I.doc}</div>
          <div>
            <div className="v">{t("phNextReportVal")}</div>
            <div className="k">{t("phNextReportDate")}</div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="row">
          <h4>{t("phNextAppt")}</h4>
          <span className="badge">{t("phScheduled")}</span>
        </div>
        <div className="app-list-item">
          <div className="ic">{I.cal}</div>
          <div>
            <div className="v">{t("phNextApptVal")}</div>
            <div className="k">{t("phNextApptDate")}</div>
          </div>
        </div>
      </div>
      <div className="card">
        <h4>{t("phNotifications")}</h4>
        <div className="app-list-item">
          <div className="ic">{I.bell}</div>
          <div>
            <div className="v">{t("phNotif1")}</div>
            <div className="k">{t("phNotif1Sub")}</div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

export function PackagesScreen() {
  const { t } = useI18n();
  return (
    <Screen sub={t("phPackagesTitle")} active="packages">
      <div className="app-pkg">
        <div className="pkg-head">
          <div className="row">
            <h4>{t("phSilver")}</h4>
            <span className="badge gold">{t("phCurrent")}</span>
          </div>
          <div className="price">
            1,200 <small>{t("phSarMonth")}</small>
          </div>
        </div>
        <div className="pkg-body">
          <ul>
            <li>{t("phSilverF1")}</li>
            <li>{t("phSilverF2")}</li>
            <li>{t("phSilverF3")}</li>
            <li>{t("phSilverF4")}</li>
          </ul>
          <button type="button" className="btn">
            {t("phSwitchSilver")}
          </button>
        </div>
      </div>
      <div className="app-pkg plain">
        <div className="pkg-head">
          <h4>{t("phBronze")}</h4>
          <div className="price">
            1,900 <small>{t("phSarMonth")}</small>
          </div>
        </div>
        <div className="pkg-body">
          <ul>
            <li>{t("phBronzeF1")}</li>
            <li>{t("phBronzeF2")}</li>
            <li>{t("phBronzeF3")}</li>
            <li>{t("phBronzeF4")}</li>
          </ul>
          <button type="button" className="btn outline">
            {t("phSwitchBronze")}
          </button>
        </div>
      </div>
    </Screen>
  );
}

export function BookingScreen() {
  const { t } = useI18n();
  return (
    <Screen sub={t("phBookingTitle")} active="appts">
      <div className="card">
        <div className="field">
          <label>{t("phConsultType")}</label>
          <select defaultValue="">
            <option>{t("phConsultTypeVal")}</option>
          </select>
        </div>
        <div className="field">
          <label>{t("phAdvisor")}</label>
          <select defaultValue="">
            <option>{t("phAdvisorVal")}</option>
          </select>
        </div>
        <div className="field">
          <label>{t("phDate")}</label>
          <input type="date" defaultValue="2026-09-25" dir="ltr" />
        </div>
        <div className="field">
          <label>{t("phTime")}</label>
          <div className="app-times">
            <span className="app-time on">{t("phT1")}</span>
            <span className="app-time">{t("phT2")}</span>
            <span className="app-time">{t("phT3")}</span>
            <span className="app-time">{t("phT4")}</span>
          </div>
        </div>
        <div className="field">
          <label>{t("phNotes")}</label>
          <textarea placeholder={t("phNotesPh")} readOnly />
        </div>
        <button type="button" className="btn">
          {t("phConfirmBooking")}
        </button>
      </div>
    </Screen>
  );
}

export function AppointmentsScreen() {
  const { t } = useI18n();
  return (
    <Screen sub={t("phApptsTitle")} active="appts">
      <button type="button" className="btn" style={{ marginBottom: 10 }}>
        {t("phBookNew")}
      </button>
      <div className="app-list-item">
        <div className="ic">{I.cal}</div>
        <div style={{ flex: 1 }}>
          <div className="v">{t("phNextApptVal")}</div>
          <div className="k">{t("phNextApptDate")}</div>
        </div>
        <span className="badge">{t("phScheduled")}</span>
      </div>
      <div className="app-list-item">
        <div className="ic">{I.cal}</div>
        <div style={{ flex: 1 }}>
          <div className="v">{t("phAppt2")}</div>
          <div className="k">
            {t("phAppt2Doc")} · {t("phAppt2Time")}
          </div>
        </div>
        <span className="badge">{t("phScheduled")}</span>
      </div>
      <div className="app-list-item">
        <div className="ic">{I.doc}</div>
        <div style={{ flex: 1 }}>
          <div className="v">{t("phAppt3")}</div>
          <div className="k">
            {t("phAppt3Doc")} · {t("phAppt3Time")}
          </div>
        </div>
        <span className="badge gold">{t("phDone")}</span>
      </div>
    </Screen>
  );
}

export function ReportsScreen() {
  const { t } = useI18n();
  return (
    <Screen sub={t("phReportsTitle")} active="reports">
      <div className="app-list-item">
        <div className="ic">{I.doc}</div>
        <div style={{ flex: 1 }}>
          <div className="v">{t("phNextReportVal")}</div>
          <div className="k">{t("phReport1Date")}</div>
        </div>
        <span className="badge gold">{t("phNew")}</span>
      </div>
      <div className="app-list-item">
        <div className="ic">{I.doc}</div>
        <div style={{ flex: 1 }}>
          <div className="v">{t("phReport2")}</div>
          <div className="k">{t("phReport2Date")}</div>
        </div>
        <div className="ic">{I.download}</div>
      </div>
      <div className="app-list-item">
        <div className="ic">{I.doc}</div>
        <div style={{ flex: 1 }}>
          <div className="v">{t("phReport3")}</div>
          <div className="k">{t("phReport3Date")}</div>
        </div>
        <div className="ic">{I.download}</div>
      </div>
    </Screen>
  );
}

export function NotificationsScreen() {
  const { t } = useI18n();
  return (
    <Screen sub={t("phNotifTitle")} active="">
      <div className="app-list-item">
        <div className="ic">{I.bell}</div>
        <div style={{ flex: 1 }}>
          <div className="v">{t("phNotif1")}</div>
          <div className="k">{t("phNotif1Sub")}</div>
        </div>
      </div>
      <div className="app-list-item">
        <div className="ic">{I.cal}</div>
        <div style={{ flex: 1 }}>
          <div className="v">{t("phNotif2")}</div>
          <div className="k">{t("phNotif2Sub")}</div>
        </div>
      </div>
      <div className="app-list-item">
        <div className="ic">{I.bell}</div>
        <div style={{ flex: 1 }}>
          <div className="v">{t("phNotif3")}</div>
          <div className="k">{t("phNotif3Sub")}</div>
        </div>
      </div>
      <div className="app-list-item">
        <div className="ic">{I.chat}</div>
        <div style={{ flex: 1 }}>
          <div className="v">{t("phNotif4")}</div>
          <div className="k">{t("phNotif4Sub")}</div>
        </div>
      </div>
    </Screen>
  );
}

export function ProfileScreen() {
  const { t } = useI18n();
  return (
    <Screen sub={t("phProfileTitle")} active="">
      <div className="card" style={{ textAlign: "center" }}>
        <div className="app-avatar">{t("phProfileName").charAt(0)}</div>
        <h4>{t("phProfileName")}</h4>
        <div className="muted" dir="ltr">
          mohammed@mail.com
        </div>
      </div>
      <div className="app-list-item">
        <div className="ic">{I.pkg}</div>
        <div style={{ flex: 1 }}>
          <div className="v">{t("phMyPackage")}</div>
          <div className="k">{t("phGold")}</div>
        </div>
        <span className="badge gold">{t("phCurrent")}</span>
      </div>
      <div className="app-list-item">
        <div className="ic">{I.user}</div>
        <div style={{ flex: 1 }}>
          <div className="v">{t("phEditProfile")}</div>
        </div>
      </div>
      <div className="app-list-item">
        <div className="ic">{I.gear}</div>
        <div style={{ flex: 1 }}>
          <div className="v">{t("phSettings")}</div>
        </div>
      </div>
      <div className="app-list-item">
        <div className="ic">{I.logout}</div>
        <div style={{ flex: 1 }}>
          <div className="v">{t("phLogout")}</div>
        </div>
      </div>
    </Screen>
  );
}

export function ContactScreen() {
  const { t } = useI18n();
  return (
    <Screen sub={t("phContactTitle")} active="">
      <div className="app-c-item">
        <div className="ic">{I.mail}</div>
        <div>
          <div className="v" dir="ltr">
            GCMC@GCMC.SA
          </div>
          <div className="k">{t("phEmail")}</div>
        </div>
      </div>
      <div className="app-c-item">
        <div className="ic">{I.phone}</div>
        <div>
          <div className="v" dir="ltr">
            +966 55 018 1166
          </div>
          <div className="k">{t("phDirectCall")}</div>
        </div>
      </div>
      <div className="app-c-item">
        <div className="ic">{I.pin}</div>
        <div>
          <div className="v">{t("phLocationVal")}</div>
          <div className="k">{t("phLocation")}</div>
        </div>
      </div>
      <div className="app-section-label">{t("phFollowUs")}</div>
      <div className="app-socials">
        {SOCIAL_ICONS.map((s) => (
          <div className="app-social" key={s.name}>
            <span className="sic" style={{ background: s.bg, color: s.fg ?? "#fff" }}>
              {s.icon}
            </span>
            <span>{s.name}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <h4>{t("phSendMsg")}</h4>
        <div className="field">
          <input placeholder={t("phMsgPh")} readOnly />
        </div>
        <button type="button" className="btn gold">
          {t("phSend")}
        </button>
      </div>
    </Screen>
  );
}
