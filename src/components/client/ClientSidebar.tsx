"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/i18n-context";

const NAV_ITEMS = [
  { id: "overview", key: "clientOverview" },
  { id: "reports", key: "myReports" },
  { id: "interviews", key: "myInterviews" },
  { id: "bookings", key: "myBookings" },
  { id: "packages", key: "myPackages" },
  { id: "payments", key: "myPayments" },
  { id: "receipts", key: "myReceipts" },
  { id: "reviews", key: "clientReviews" },
  { id: "profile", key: "myProfile" },
] as const;

interface ClientSidebarProps {
  activePanel: string;
  onSelectPanel: (panel: string) => void;
  isOpen: boolean;
}

export function ClientSidebar({ activePanel, onSelectPanel, isOpen }: ClientSidebarProps) {
  const { t } = useI18n();

  return (
    <aside className={`client-sidebar${isOpen ? " open" : ""}`} id="clientSidebar">
      <Link href="/" className="client-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo_icon.png" alt="" />
        <span>{t("clientDashboard")}</span>
      </Link>
      <nav className="client-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activePanel === item.id ? "active" : undefined}
            onClick={() => onSelectPanel(item.id)}
          >
            {t(item.key)}
          </button>
        ))}
      </nav>
      <div className="client-back">
        <Link href="/">{t("backToSiteArrow")}</Link>
      </div>
    </aside>
  );
}
