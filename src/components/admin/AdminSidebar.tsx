"use client";

import { useI18n } from "@/lib/i18n/i18n-context";

const NAV_GROUPS = [
  {
    labelKey: "navMain",
    items: [
      { id: "overview", key: "navOverview" },
      { id: "requests", key: "navRequests" },
    ],
  },
  {
    labelKey: "navManagement",
    items: [
      { id: "clients", key: "navClients" },
      { id: "consultations", key: "navConsultations" },
      { id: "consultants", key: "navConsultants" },
      { id: "reports", key: "navReports" },
      { id: "payments", key: "navPayments" },
      { id: "meetings", key: "navMeetings" },
      { id: "support", key: "navSupport" },
      { id: "permissions", key: "navPermissions" },
      { id: "profile", key: "navProfile" },
    ],
  },
  {
    labelKey: "navSettings",
    items: [{ id: "settings-account", key: "navAccount" }],
  },
] as const;

interface AdminSidebarProps {
  activePanel: string;
  onSelectPanel: (panel: string) => void;
  isOpen: boolean;
}

export function AdminSidebar({ activePanel, onSelectPanel, isOpen }: AdminSidebarProps) {
  const { t } = useI18n();

  return (
    <aside className={`dash-sidebar${isOpen ? " open" : ""}`} id="dashSidebar">
      <div className="dash-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo_icon.png" alt="" />
        <span>{t("dashBrand")}</span>
      </div>
      <nav className="dash-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.labelKey}>
            <div className="group-label">{t(group.labelKey)}</div>
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activePanel === item.id ? "active" : undefined}
                onClick={() => onSelectPanel(item.id)}
              >
                <span className="icon" />
                {t(item.key)}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
