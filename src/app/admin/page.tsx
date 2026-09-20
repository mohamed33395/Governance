"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import { adminDashboardService } from "@/services/admin-dashboard.service";
import type { AdminOverview } from "@/types/admin-dashboard";
import { ApiError } from "@/lib/api/client";
import { StatIcon } from "@/components/admin/StatIcons";

export default function AdminOverviewPage() {
  const { t } = useI18n();
  const { token } = useAdminAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    adminDashboardService
      .getOverview(token)
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t("clientLoginError"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  if (isLoading) {
    return (
      <div className="dash-panel active" id="panel-overview">
        <div className="panel-card">
          <span className="client-empty">{t("loading")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-panel active" id="panel-overview">
        <div className="panel-card">
          <span className="client-empty">{error}</span>
        </div>
      </div>
    );
  }

  const maxMonthly = Math.max(1, ...(overview?.monthlyJoinRequests.map((p) => p.value) ?? [1]));

  return (
    <div className="dash-panel active" id="panel-overview">
      <div className="stat-grid">
        {overview?.stats.length ? (
          overview.stats.map((stat) => (
            <div className="stat-card" key={stat.key}>
              <div className="top">
                <div className="ic">
                  <StatIcon statKey={stat.key} />
                </div>
              </div>
              <div className="num">{stat.value}</div>
              <div className="label">{t(stat.labelKey)}</div>
              {stat.trend ? <div className={`trend ${stat.trend.direction}`}>{t(stat.trend.textKey)}</div> : null}
            </div>
          ))
        ) : (
          <p className="client-empty">{t("clientReportsEmpty")}</p>
        )}
      </div>

      <div className="chart-row">
        <div className="panel-card">
          <h3>{t("monthlyJoinRequests")}</h3>
          <div className="bar-chart">
            {overview?.monthlyJoinRequests.map((point) => (
              <div className="col" style={{ height: "100%" }} key={point.monthKey}>
                <div className="bar" style={{ height: `${Math.round((point.value / maxMonthly) * 100)}%` }} />
                <span>{t(point.monthKey)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel-card">
          <h3>{t("requestDistribution")}</h3>
          <div className="donut-wrap">
            <ul className="legend">
              {overview?.requestDistribution.map((slice) => (
                <li key={slice.labelKey}>
                  <span className="sw" style={{ background: slice.color }} />
                  <span>{t(slice.labelKey)}</span>
                  <span className="pct">{slice.percent}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="chart-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="panel-card">
          <div className="table-toolbar">
            <h3 style={{ margin: 0 }}>{t("topConsultants")}</h3>
          </div>
          <div id="topConsultantsList">
            {overview?.topConsultants.length ? (
              overview.topConsultants.map((entry) => (
                <div key={entry.id}>
                  {entry.name} — {entry.metric}
                </div>
              ))
            ) : (
              <p className="client-empty">{t("noRatingsYet")}</p>
            )}
          </div>
        </div>
        <div className="panel-card">
          <div className="table-toolbar">
            <h3 style={{ margin: 0 }}>{t("topClients")}</h3>
          </div>
          <div id="topClientsList">
            {overview?.topClients.length ? (
              overview.topClients.map((entry) => (
                <div key={entry.id}>
                  {entry.name} — {entry.metric}
                </div>
              ))
            ) : (
              <p className="client-empty">{t("noRatingsYet")}</p>
            )}
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="table-toolbar">
          <h3 style={{ margin: 0 }}>{t("latestJoinRequests")}</h3>
          <button type="button" className="btn btn-outline btn-sm">
            {t("viewAll")}
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("field")}</th>
              <th>{t("city")}</th>
              <th>{t("submissionDate")}</th>
              <th>{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {overview?.latestJoinRequests.length ? (
              overview.latestJoinRequests.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.field}</td>
                  <td>{row.city}</td>
                  <td>{row.submissionDate}</td>
                  <td>
                    <span className={`badge ${row.status}`}>
                      <span className="d" />
                      {row.status === "pending" ? t("underReview") : row.status === "approved" ? t("accepted") : t("rejected")}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="client-empty">
                  {t("clientReportsEmpty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
