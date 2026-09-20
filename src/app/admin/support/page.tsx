"use client";

import { useCallback, useMemo, useState } from "react";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { adminDashboardService } from "@/services/admin-dashboard.service";
import { useApiData } from "@/lib/use-api-data";
import { TablePagination, TableSearch, useTablePager } from "@/components/admin/table";
import type { SupportTicket } from "@/types/admin-dashboard";

const FILTERS = ["", "جديدة", "تم الحل"];
const FILTER_KEYS = ["all", "supportNew", "supportResolved"];

export default function AdminSupportPage() {
  const { token } = useAdminAuth();
  const { t } = useI18n();

  const fetcher = useCallback(
    () => (token ? adminDashboardService.getSupportTickets(token) : Promise.reject()),
    [token]
  );
  const { data: tickets, setData: setTickets } = useApiData<SupportTicket[]>(fetcher, []);

  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => tickets.filter((tk) => !filter || tk.status === filter), [tickets, filter]);
  const pager = useTablePager(filtered, search, (tk) =>
    [tk.client, tk.type, tk.message, tk.date, tk.status].join(" ")
  );

  const toggleTicket = (tk: SupportTicket) => {
    const resolved = tk.status === "تم الحل";
    const next = { ...tk, status: resolved ? "جديدة" : "تم الحل" };
    setTickets((prev) => prev.map((x) => (x.id === tk.id ? next : x)));
    if (token) adminDashboardService.updateSupportTicket(token, tk.id, { status: next.status }).catch(() => {});
  };

  return (
    <div className="panel-card">
      <div className="table-toolbar">
        <h3 style={{ margin: 0 }}>{t("supportTitle")}</h3>
        <TableSearch
          value={search}
          onChange={(v) => {
            setSearch(v);
            pager.resetPage();
          }}
        />
        <div className="chip-filters" id="supportFilters">
          {FILTERS.map((f, i) => (
            <button
              key={f || "all"}
              type="button"
              className={filter === f ? "active" : undefined}
              onClick={() => {
                setFilter(f);
                pager.resetPage();
              }}
            >
              {t(FILTER_KEYS[i])}
            </button>
          ))}
        </div>
      </div>
      <table className="data-table no-actions" id="supportTable">
        <thead>
          <tr>
            <th>{t("client")}</th>
            <th>{t("supportType")}</th>
            <th>{t("supportMsg")}</th>
            <th>{t("date")}</th>
            <th>{t("status")}</th>
            <th>{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {pager.pagedRows.map((tk) => {
            const resolved = tk.status === "تم الحل";
            return (
              <tr key={tk.id}>
                <td>{tk.client || "—"}</td>
                <td>{tk.type || "—"}</td>
                <td style={{ maxWidth: 320, whiteSpace: "normal" }}>{tk.message || ""}</td>
                <td>{tk.date || ""}</td>
                <td>
                  <span className={`badge ${resolved ? "approved" : "pending"}`}>
                    <span className="d" />
                    {tk.status || "جديدة"}
                  </span>
                </td>
                <td>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => toggleTicket(tk)}>
                    {resolved ? t("supportReopen") : t("supportResolve")}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <p className="notif-empty" id="supportEmpty">
          {t("noSupport")}
        </p>
      )}
      <TablePagination
        page={pager.page}
        totalPages={pager.totalPages}
        pageSize={pager.pageSize}
        count={pager.filtered.length}
        onPage={pager.setPage}
        onPageSize={pager.setPageSize}
      />
    </div>
  );
}
