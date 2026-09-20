"use client";

import { useCallback } from "react";
import { useClientAuth } from "@/lib/auth/client-auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { clientPortalService } from "@/services/client-portal.service";
import { useApiData } from "@/lib/use-api-data";
import type { ClientBooking } from "@/types/client-portal";

export default function ClientBookingsPage() {
  const { token } = useClientAuth();
  const { t } = useI18n();

  const fetcher = useCallback(
    () => (token ? clientPortalService.getBookings(token) : Promise.reject()),
    [token]
  );
  const { data: bookings } = useApiData<ClientBooking[]>(fetcher, []);

  return (
    <div className="client-panel-card">
      <div className="client-toolbar">
        <h3>{t("myBookings")}</h3>
      </div>
      <div className="client-bookings-grid" id="bookingsGrid">
        {bookings.map((b) => (
          <div className="client-booking-card" key={b.id}>
            <div className="client-booking-head">
              <img src={b.specialist?.photo || "logo_icon.png"} alt="" />
              <div>
                <strong>{b.package || "استشارة"}</strong>
                <span>{b.specialist ? `${b.specialist.name} — ${b.specialist.spec}` : ""}</span>
              </div>
              <span className={`client-badge ${b.status === "مكتمل" ? "completed" : "pending"}`}>{b.status}</span>
            </div>
            <div className="client-booking-body">
              <div>
                <span>التاريخ والوقت:</span>
                <strong>
                  {b.date || "—"} | {b.time || "—"}
                </strong>
              </div>
              <div>
                <span>الموقع:</span>
                <strong>{b.location ? b.location.name : "—"}</strong>
              </div>
              <div>
                <span>المبلغ:</span>
                <strong>{b.price ? Number(b.price).toLocaleString("ar-SA") : "٠"} ريال</strong>
              </div>
              {b.meetLink && (
                <div>
                  <span>رابط الاجتماع:</span>
                  <a href={b.meetLink} target="_blank" rel="noopener">
                    {b.meetLink}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="client-empty" id="bookingsEmpty" style={{ display: bookings.length ? "none" : "block" }}>
        {t("clientBookingsEmpty")}
      </p>
    </div>
  );
}
