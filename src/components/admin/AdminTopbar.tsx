"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/i18n-context";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";

interface AdminTopbarProps {
  title: string;
  onToggleSidebar: () => void;
}

export function AdminTopbar({ title, onToggleSidebar }: AdminTopbarProps) {
  const { t } = useI18n();
  const { user, logout } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="dash-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          className="menu-toggle"
          id="dashMenuToggle"
          style={{ display: "inline-flex", color: "var(--green-deep)" }}
          aria-label={t("menu")}
          onClick={onToggleSidebar}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </span>
        </button>
        <Link href="/" className="dash-topbar-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon.png" alt="" />
        </Link>
        <h2 id="dashTitle">{title}</h2>
      </div>
      <div className="topbar-right header-actions">
        <div className="notif-wrap">
          <button id="notifBtn" className="notif-btn" type="button" aria-label={t("notifications")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </button>
          <div className="notif-dropdown" id="notifDropdown">
            <div className="notif-head">{t("notifications")}</div>
            <div id="notifList">
              <p className="notif-empty">{t("noNotifications")}</p>
            </div>
          </div>
        </div>
        <ThemeToggle />
        <div className="admin-user-menu">
          <div
            className="admin-chip"
            id="adminChip"
            role="button"
            tabIndex={0}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="avatar" src={user?.avatarUrl ?? "/logo_icon.png"} alt="" />
            <div className="who">
              {user?.name}
              <span>{user?.role ?? t("adminRole")}</span>
            </div>
          </div>
          <div className={`admin-menu${menuOpen ? " open" : ""}`} id="adminMenu" role="menu">
            <div className="menu-head">
              <strong id="adminMenuName">{user?.name}</strong>
              <span id="adminMenuRole">{user?.role ?? t("adminRole")}</span>
            </div>
            <button type="button" id="menuAccountBtn">
              {t("accountSettings")}
            </button>
            <button type="button" id="logoutBtn" className="danger" onClick={logout}>
              {t("logout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
