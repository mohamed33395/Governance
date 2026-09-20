"use client";

import { useCallback, useMemo, useState } from "react";
import { useClientAuth } from "@/lib/auth/client-auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { clientPortalService } from "@/services/client-portal.service";
import { useApiData } from "@/lib/use-api-data";
import type { ClientInterview } from "@/types/client-portal";

export default function ClientInterviewsPage() {
  const { token } = useClientAuth();
  const { t } = useI18n();

  const fetcher = useCallback(
    () => (token ? clientPortalService.getInterviews(token) : Promise.reject()),
    [token]
  );
  const { data: interviews } = useApiData<ClientInterview[]>(fetcher, []);

  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return interviews;
    return interviews.filter((i) => [i.meetingType, i.date, i.time, i.consultant, i.status].join(" ").toLowerCase().includes(q));
  }, [interviews, search]);

  return (
    <div className="client-panel-card">
      <div className="client-toolbar">
        <h3>{t("myInterviews")}</h3>
        <div className="table-search">
          <span className="icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input type="text" id="interviewsSearch" placeholder="بحث في المقابلات..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <table className="client-table">
        <thead>
          <tr>
            <th>{t("meetingType")}</th>
            <th>{t("date")}</th>
            <th>{t("time")}</th>
            <th>{t("consultant")}</th>
            <th>{t("status")}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((i) => (
            <tr key={i.id}>
              <td>{i.meetingType}</td>
              <td>{i.date}</td>
              <td>{i.time}</td>
              <td>{i.consultant}</td>
              <td>
                <span className={`client-badge ${i.status === "مكتملة" ? "completed" : "pending"}`}>{i.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="client-empty" id="interviewsEmpty" style={{ display: filtered.length ? "none" : "block" }}>
        {t("clientInterviewsEmpty")}
      </p>
    </div>
  );
}
