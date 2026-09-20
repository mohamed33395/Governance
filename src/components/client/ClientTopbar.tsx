"use client";

import { useI18n } from "@/lib/i18n/i18n-context";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

interface ClientTopbarProps {
  title: string;
  onToggleSidebar: () => void;
}

export function ClientTopbar({ title, onToggleSidebar }: ClientTopbarProps) {
  const { t } = useI18n();

  return (
    <header className="client-topbar">
      <div className="client-topbar-left">
        <button
          className="client-menu-toggle"
          id="clientMenuToggle"
          type="button"
          aria-label={t("menu")}
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        <h2 id="clientTitle">{title}</h2>
      </div>
      <div className="client-topbar-actions">
        <div className="notif-wrap">
          <button className="notif-btn" id="clientNotifBtn" type="button" aria-label={t("notifications")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </button>
          <div className="notif-dropdown" id="clientNotifDropdown">
            <div className="notif-head">{t("notifications")}</div>
            <div id="clientNotifList">
              <p className="notif-empty">{t("noNotifications")}</p>
            </div>
          </div>
        </div>
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
