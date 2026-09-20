"use client";

import { useState, type ReactNode } from "react";
import "@/styles/admin-dashboard.css";
import { AdminAuthProvider, useAdminAuth } from "@/lib/auth/admin-auth-context";
import { AdminLoginView } from "@/components/admin/AdminLoginView";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { useI18n } from "@/lib/i18n/i18n-context";
import { usePathname, useRouter } from "next/navigation";

const PANEL_ROUTES: Record<string, string> = {
  overview: "/admin",
  requests: "/admin/requests",
  clients: "/admin/clients",
  consultations: "/admin/consultations",
  consultants: "/admin/consultants",
  reports: "/admin/reports",
  payments: "/admin/payments",
  meetings: "/admin/meetings",
  support: "/admin/support",
  permissions: "/admin/permissions",
  profile: "/admin/profile",
  "settings-account": "/admin/settings-account",
};

const PANEL_TITLE_KEYS: Record<string, string> = {
  overview: "navOverview",
  requests: "navRequests",
  clients: "navClients",
  consultations: "navConsultations",
  consultants: "navConsultants",
  reports: "navReports",
  payments: "navPayments",
  meetings: "navMeetings",
  support: "navSupport",
  permissions: "navPermissions",
  profile: "navProfile",
  "settings-account": "navAccount",
};

function AdminShell({ children }: { children: ReactNode }) {
  const { token, isLoading } = useAdminAuth();
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const activePanel = pathname === "/admin" ? "overview" : pathname.replace("/admin/", "");

  if (isLoading) {
    return null;
  }

  if (!token) {
    return <AdminLoginView />;
  }

  function handleSelectPanel(panel: string) {
    setSidebarOpen(false);
    const target = PANEL_ROUTES[panel];
    if (target) {
      router.push(target);
    }
  }

  return (
    <div className="dash-shell" id="dashShell">
      <AdminSidebar activePanel={activePanel} onSelectPanel={handleSelectPanel} isOpen={sidebarOpen} />
      <div className="dash-main">
        <AdminTopbar
          title={t(PANEL_TITLE_KEYS[activePanel] ?? "navOverview")}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        <div className="dash-body">{children}</div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
