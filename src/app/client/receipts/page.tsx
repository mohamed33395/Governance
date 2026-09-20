"use client";

import { useCallback, useState } from "react";
import { useClientAuth } from "@/lib/auth/client-auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { clientPortalService } from "@/services/client-portal.service";
import { useApiData } from "@/lib/use-api-data";
import { ClientModal } from "@/components/client/ClientModal";
import type { ClientReceipt } from "@/types/client-portal";

export default function ClientReceiptsPage() {
  const { token } = useClientAuth();
  const { t } = useI18n();

  const fetcher = useCallback(
    () => (token ? clientPortalService.getReceipts(token) : Promise.reject()),
    [token]
  );
  const { data: receipts } = useApiData<ClientReceipt[]>(fetcher, []);

  const [active, setActive] = useState<ClientReceipt | null>(null);

  const receiptImage = (r: ClientReceipt) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="420"><rect width="100%" height="100%" fill="#FBF9F3"/><text x="50%" y="40" text-anchor="middle" font-size="18" fill="#1A412E" font-family="sans-serif">إيصال</text><text x="50%" y="70" text-anchor="middle" font-size="12" fill="#666" font-family="sans-serif">${r.receiptNo}</text><text x="50%" y="100" text-anchor="middle" font-size="13" fill="#666" font-family="sans-serif">${r.service}</text><text x="50%" y="140" text-anchor="middle" font-size="20" fill="#C19B4A" font-family="sans-serif">${r.amountNum.toLocaleString("ar-SA")} ريال</text><text x="50%" y="180" text-anchor="middle" font-size="12" fill="#666" font-family="sans-serif">${r.date}</text></svg>`
    )}`;

  const downloadReceipt = () => {
    if (!active) return;
    const a = document.createElement("a");
    a.href = receiptImage(active);
    a.download = "receipt.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const shareReceipt = () => {
    if (!active) return;
    const text = `${t("receipt")} ${active.receiptNo} — ${active.service} — ${active.amountNum.toLocaleString("ar-SA")} ريال`;
    if (navigator.share) {
      navigator.share({ title: t("receipt"), text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  };

  return (
    <>
      <div className="client-panel-card">
        <div className="client-toolbar">
          <h3>{t("myReceipts")}</h3>
        </div>
        <table className="client-table">
          <thead>
            <tr>
              <th>{t("receiptNo")}</th>
              <th>{t("serviceOrPackage")}</th>
              <th>{t("paymentMethod")}</th>
              <th>{t("amount")}</th>
              <th>{t("date")}</th>
              <th>{t("status")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {receipts.map((r) => (
              <tr key={r.id}>
                <td>{r.receiptNo}</td>
                <td>{r.service}</td>
                <td>{r.methodLabel || "—"}</td>
                <td>{r.amountNum ? `${Number(r.amountNum).toLocaleString("ar-SA")} ريال` : "—"}</td>
                <td>{r.date || "—"}</td>
                <td>
                  <span className={`client-badge ${r.status === "مدفوع" ? "completed" : "pending"}`}>{r.status}</span>
                </td>
                <td>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setActive(r)}>
                    {t("viewReceipt")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="client-empty" id="receiptsEmpty" style={{ display: receipts.length ? "none" : "block" }}>
          {t("clientReceiptsEmpty")}
        </p>
      </div>

      {/* RECEIPT MODAL */}
      <ClientModal id="receiptModal" open={!!active} onClose={() => setActive(null)} title={t("receipt")}>
        <div id="receiptContent">{active && <img className="receipt-img" src={receiptImage(active)} alt="" />}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button type="button" className="btn btn-primary" id="downloadReceiptBtn" onClick={downloadReceipt}>
            {t("downloadReceipt")}
          </button>
          <button type="button" className="btn btn-outline" id="shareReceiptBtn" onClick={shareReceipt}>
            {t("sendReceipt")}
          </button>
        </div>
      </ClientModal>
    </>
  );
}
