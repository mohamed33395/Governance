"use client";

import { useState, type ReactNode } from "react";
import "@/styles/client-portal.css";
import { ClientAuthProvider, useClientAuth } from "@/lib/auth/client-auth-context";
import { ClientLoginView } from "@/components/client/ClientLoginView";
import { ClientSidebar } from "@/components/client/ClientSidebar";
import { ClientTopbar } from "@/components/client/ClientTopbar";
import { useI18n } from "@/lib/i18n/i18n-context";
import { usePathname, useRouter } from "next/navigation";

const PANEL_ROUTES: Record<string, string> = {
  overview: "/client",
  reports: "/client/reports",
  interviews: "/client/interviews",
  bookings: "/client/bookings",
  packages: "/client/packages",
  payments: "/client/payments",
  receipts: "/client/receipts",
  reviews: "/client/reviews",
  profile: "/client/profile",
};

const PANEL_TITLE_KEYS: Record<string, string> = {
  overview: "clientOverview",
  reports: "myReports",
  interviews: "myInterviews",
  bookings: "myBookings",
  packages: "myPackages",
  payments: "myPayments",
  receipts: "myReceipts",
  reviews: "clientReviews",
  profile: "myProfile",
};

function ClientShell({ children }: { children: ReactNode }) {
  const { token, isLoading } = useClientAuth();
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const activePanel = pathname === "/client" ? "overview" : pathname.replace("/client/", "");

  if (isLoading) {
    return null;
  }

  if (!token) {
    return <ClientLoginView />;
  }

  function handleSelectPanel(panel: string) {
    setSidebarOpen(false);
    const target = PANEL_ROUTES[panel];
    if (target) {
      router.push(target);
    }
  }

  return (
    <div className="client-shell" id="clientShell">
      <ClientSidebar activePanel={activePanel} onSelectPanel={handleSelectPanel} isOpen={sidebarOpen} />
      <main className="client-main">
        <ClientTopbar
          title={t(PANEL_TITLE_KEYS[activePanel] ?? "clientOverview")}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        <div className="client-body" id="clientBody">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ClientAuthProvider>
      <ClientShell>{children}</ClientShell>
    </ClientAuthProvider>
  );
}
