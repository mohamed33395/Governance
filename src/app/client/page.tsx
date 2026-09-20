"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useClientAuth } from "@/lib/auth/client-auth-context";
import { clientPortalService } from "@/services/client-portal.service";
import type { ClientOverview } from "@/types/client-portal";
import { ApiError } from "@/lib/api/client";

export default function ClientOverviewPage() {
  const { t } = useI18n();
  const { token, user } = useClientAuth();
  const [overview, setOverview] = useState<ClientOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    clientPortalService
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

  return (
    <div className="client-panel active" id="panel-overview">
      <div className="client-welcome">
        <h2 id="welcomeTitle">
          {t("welcome")}
          {user?.name ? `، ${user.name}` : ""}
        </h2>
        <p id="welcomeSub">{t("clientWelcomeSub")}</p>
      </div>

      {isLoading ? (
        <div className="client-panel-card">
          <span className="client-empty">{t("loading")}</span>
        </div>
      ) : error ? (
        <div className="client-panel-card">
          <span className="client-empty">{error}</span>
        </div>
      ) : (
        <>
          <div className="client-card-grid">
            <div className="client-stat-card">
              <div className="num" id="statReports">
                {overview?.reportsCount ?? 0}
              </div>
              <div className="label">{t("clientReports")}</div>
            </div>
            <div className="client-stat-card">
              <div className="num" id="statInterviews">
                {overview?.upcomingInterviewsCount ?? 0}
              </div>
              <div className="label">{t("myInterviews")}</div>
            </div>
            <div className="client-stat-card">
              <div className="num" id="statPackage">
                {overview?.currentPackageName ?? "-"}
              </div>
              <div className="label">{t("currentPackage")}</div>
            </div>
          </div>
          <div className="client-panel-card">
            <h3>{t("clientNextReport")}</h3>
            <div id="nextReport">
              {overview?.nextReport ? (
                <span>{overview.nextReport.title}</span>
              ) : (
                <span className="client-empty">{t("clientReportsEmpty")}</span>
              )}
            </div>
          </div>
          <div className="client-panel-card">
            <h3>{t("clientNextInterview")}</h3>
            <div id="nextInterview">
              {overview?.nextInterview ? (
                <span>{overview.nextInterview.meetingType}</span>
              ) : (
                <span className="client-empty">{t("clientInterviewsEmpty")}</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
