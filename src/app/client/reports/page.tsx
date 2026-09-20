"use client";

import { useCallback, useMemo, useState } from "react";
import { useClientAuth } from "@/lib/auth/client-auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { clientPortalService } from "@/services/client-portal.service";
import { useApiData } from "@/lib/use-api-data";
import type { ClientReport } from "@/types/client-portal";

export default function ClientReportsPage() {
  const { token } = useClientAuth();
  const { t } = useI18n();

  const fetcher = useCallback(
    () => (token ? clientPortalService.getReports(token) : Promise.reject()),
    [token]
  );
  const { data: reports } = useApiData<ClientReport[]>(fetcher, []);

  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => [r.title, r.type, r.period, r.date, r.status].join(" ").toLowerCase().includes(q));
  }, [reports, search]);

  return (
    <div className="client-panel-card">
      <div className="client-toolbar">
        <h3>{t("myReports")}</h3>
        <div className="table-search">
          <span className="icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input type="text" id="reportsSearch" placeholder="بحث في التقارير..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <table className="client-table">
        <thead>
          <tr>
            <th>{t("clientReports")}</th>
            <th>النوع</th>
            <th>الفترة</th>
            <th>{t("date")}</th>
            <th>{t("status")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => {
            const ready = r.status === "جاهز";
            return (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.type}</td>
                <td>{r.period}</td>
                <td>{r.date}</td>
                <td>
                  <span className={`client-badge ${ready ? "ready" : "pending"}`}>{r.status}</span>
                </td>
                <td>
                  <button type="button" className="btn btn-outline btn-sm">
                    {ready ? t("download") : t("preview")}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="client-empty" id="reportsEmpty" style={{ display: filtered.length ? "none" : "block" }}>
        {t("clientReportsEmpty")}
      </p>
    </div>
  );
}
