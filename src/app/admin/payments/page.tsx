"use client";

import { useCallback, useMemo, useState } from "react";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { adminDashboardService } from "@/services/admin-dashboard.service";
import { useApiData } from "@/lib/use-api-data";
import {
  AdminModal,
  ModalCancelButton,
  TablePagination,
  TableSearch,
  useTablePager,
} from "@/components/admin/table";
import type { AdminPayment, OfficeAccount } from "@/types/admin-dashboard";

const PAY_METHOD_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "MasterCard",
  mada: "مدى",
  apple: "Apple Pay",
  google: "Google Pay",
  stc: "STC Pay",
  paypal: "PayPal",
  tabby: "تابي",
  tamara: "تمارا",
  card: "بطاقة بنكية",
  bank: "تحويل بنكي",
};

const DEMO_PAYMENTS: AdminPayment[] = [
  { id: "pay1", client: "شركة الرياض للتطوير العقاري", service: "اشتراك — الباقة الذهبية", method: "visa", detail: "Visa **** 4532", amountNum: 9800, date: "١ سبتمبر ٢٠٢٦", status: "مدفوع" },
  { id: "pay2", client: "مؤسسة أفق التقنية", service: "حجز — استشارة امتثال", method: "mada", detail: "مدى **** 8821", amountNum: 4500, date: "٣ سبتمبر ٢٠٢٦", status: "مدفوع" },
  { id: "pay3", client: "مجموعة الخليج التجارية", service: "اشتراك — الباقة الفضية", method: "mastercard", detail: "MasterCard **** 7710", amountNum: 4500, date: "٢٨ أغسطس ٢٠٢٦", status: "مدفوع" },
  { id: "pay4", client: "شركة نمو للاستثمار", service: "حجز — استشارة حوكمة", method: "stc", detail: "STC Pay — 0551234567", amountNum: 1900, date: "٥ سبتمبر ٢٠٢٦", status: "بانتظار السداد" },
  { id: "pay5", client: "شركة المسار اللوجستي", service: "اشتراك — الباقة البرونزية", method: "apple", detail: "Apple Pay — 0559871234", amountNum: 1900, date: "١٠ سبتمبر ٢٠٢٦", status: "مدفوع" },
  { id: "pay6", client: "عيادات الشفاء التخصصية", service: "حجز — استشارة إدارية", method: "tabby", detail: "تابي — 0553344556", amountNum: 4500, date: "٧ سبتمبر ٢٠٢٦", status: "بانتظار السداد" },
];

const FILTERS = ["", "اشتراك", "حجز", "بانتظار"];
const FILTER_KEYS = ["all", "subscriptions", "bookings", "pendingPayments"];

const STAT_ICONS = [
  <svg key="i1" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>,
  <svg key="i2" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><polyline points="8,12 11,15 16,9" /></svg>,
  <svg key="i3" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><polyline points="12,7 12,12 15,14" /></svg>,
  <svg key="i4" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7"><line x1="6" y1="20" x2="6" y2="11" /><line x1="12" y1="20" x2="12" y2="5" /><line x1="18" y1="20" x2="18" y2="14" /></svg>,
];

export default function AdminPaymentsPage() {
  const { token } = useAdminAuth();
  const { t } = useI18n();

  const fetcher = useCallback(
    () => (token ? adminDashboardService.getPayments(token) : Promise.reject()),
    [token]
  );
  const { data: rows } = useApiData<AdminPayment[]>(fetcher, DEMO_PAYMENTS);

  const accountsFetcher = useCallback(
    () => (token ? adminDashboardService.getOfficeAccounts(token) : Promise.reject()),
    [token]
  );
  const { data: officeAccounts, setData: setOfficeAccounts } = useApiData<OfficeAccount[]>(accountsFetcher, []);

  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => rows.filter((r) => !filter || r.service.includes(filter) || r.status.includes(filter)),
    [rows, filter]
  );
  const pager = useTablePager(filtered, search, (r) =>
    [r.client, r.service, PAY_METHOD_LABELS[r.method] || r.method, r.detail, String(r.amountNum), r.date, r.status].join(" ")
  );

  const stats = useMemo(() => {
    let revenue = 0;
    let paid = 0;
    let pending = 0;
    rows.forEach((r) => {
      if (r.status === "مدفوع") {
        paid++;
        revenue += r.amountNum || 0;
      } else {
        pending++;
      }
    });
    return { revenue, paid, pending, count: rows.length };
  }, [rows]);

  const [receipt, setReceipt] = useState<AdminPayment | null>(null);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [openForms, setOpenForms] = useState<Record<string, boolean>>({});
  const [formValues, setFormValues] = useState<Record<string, { name: string; number: string }>>({});

  const receiptImage = (r: AdminPayment) => {
    // Placeholder receipt — the original rendered one via SGCReceipt (canvas).
    // Until the backend provides receipt images we render the same card layout.
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="420"><rect width="100%" height="100%" fill="#FBF9F3"/><text x="50%" y="40" text-anchor="middle" font-size="18" fill="#1A412E" font-family="sans-serif">إيصال</text><text x="50%" y="80" text-anchor="middle" font-size="13" fill="#666" font-family="sans-serif">${r.service}</text><text x="50%" y="110" text-anchor="middle" font-size="13" fill="#666" font-family="sans-serif">${r.client}</text><text x="50%" y="150" text-anchor="middle" font-size="20" fill="#C19B4A" font-family="sans-serif">${r.amountNum.toLocaleString("ar-SA")} ريال</text><text x="50%" y="190" text-anchor="middle" font-size="12" fill="#666" font-family="sans-serif">${r.date}</text></svg>`
    )}`;
  };

  const downloadReceipt = () => {
    if (!receipt) return;
    const a = document.createElement("a");
    a.href = receiptImage(receipt);
    a.download = "receipt.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const deleteAccount = (id: string) => {
    setOfficeAccounts((prev) => prev.filter((a) => a.id !== id));
    if (token) adminDashboardService.deleteOfficeAccount(token, id).catch(() => {});
  };

  const addAccount = (method: string) => {
    const vals = formValues[method] || { name: "", number: "" };
    if (!vals.name.trim() || !vals.number.trim()) return;
    const acc: OfficeAccount = { id: `acc_${Date.now()}`, method, name: vals.name.trim(), number: vals.number.trim() };
    setOfficeAccounts((prev) => [acc, ...prev]);
    if (token) adminDashboardService.createOfficeAccount(token, acc).catch(() => {});
    setFormValues((prev) => ({ ...prev, [method]: { name: "", number: "" } }));
    setOpenForms((prev) => ({ ...prev, [method]: false }));
  };

  const statCards = [
    { num: `${stats.revenue.toLocaleString("ar-SA")} ريال`, labelKey: "totalRevenue", trendClass: "up" },
    { num: String(stats.paid), labelKey: "paidPayments", trendClass: "up" },
    { num: String(stats.pending), labelKey: "pendingPayments", trendClass: "flat" },
    { num: String(stats.count), labelKey: "totalPayments", trendClass: "flat" },
  ];

  return (
    <>
      <div className="stat-grid">
        {statCards.map((s, i) => (
          <div className="stat-card" key={s.labelKey}>
            <div className="top">
              <div className="ic">{STAT_ICONS[i]}</div>
            </div>
            <div className="num">{s.num}</div>
            <div className="label">{t(s.labelKey)}</div>
            <div className={`trend ${s.trendClass}`}>{t("noChange")}</div>
          </div>
        ))}
      </div>

      <div className="panel-card">
        <div className="table-toolbar">
          <h3 style={{ margin: 0 }}>{t("paymentsRecord")}</h3>
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setAccountsOpen(true)}>
            {t("addAccount")}
          </button>
          <TableSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              pager.resetPage();
            }}
          />
          <div className="chip-filters" id="paymentsFilters">
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
        <table className="data-table no-actions" id="paymentsTable">
          <thead>
            <tr>
              <th>{t("client")}</th>
              <th>{t("serviceOrPackage")}</th>
              <th>{t("paymentMethod")}</th>
              <th>{t("paymentDetails")}</th>
              <th>{t("amount")}</th>
              <th>{t("date")}</th>
              <th>{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {pager.pagedRows.map((r) => (
              <tr key={r.id}>
                <td>{r.client}</td>
                <td>{r.service}</td>
                <td>{PAY_METHOD_LABELS[r.method] || r.method || "—"}</td>
                <td>
                  <button type="button" className="receipt-link" onClick={() => setReceipt(r)}>
                    {r.detail || "—"}
                  </button>
                </td>
                <td>{r.amountNum ? `${Number(r.amountNum).toLocaleString("ar-SA")} ريال` : "—"}</td>
                <td>{r.date || "—"}</td>
                <td>
                  <span className={`badge ${r.status === "مدفوع" ? "approved" : "pending"}`}>
                    <span className="d" />
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          page={pager.page}
          totalPages={pager.totalPages}
          pageSize={pager.pageSize}
          count={pager.filtered.length}
          onPage={pager.setPage}
          onPageSize={pager.setPageSize}
        />
      </div>

      {/* ADD PAYMENT ACCOUNT MODAL */}
      <AdminModal id="addPayAccountModal" open={accountsOpen} onClose={() => setAccountsOpen(false)} maxWidth={560}>
        <h3>{t("addAccount")}</h3>
        <p style={{ fontSize: ".82rem", color: "var(--stone)", marginBottom: 14 }}>
          كل وسيلة دفع وحالة حسابها — اضغط إضافة لإدخال بيانات الحساب.
        </p>
        <div id="payMethodsAccountsList">
          {Object.keys(PAY_METHOD_LABELS)
            .filter((id) => id !== "card")
            .map((id) => {
              const methodAccounts = officeAccounts.filter((a) => a.method === id);
              const added = methodAccounts.length > 0;
              const formOpen = !!openForms[id];
              const vals = formValues[id] || { name: "", number: "" };
              return (
                <div className="pay-acc-row" key={id}>
                  <div className="pay-acc-head">
                    <span className="pay-acc-name">{PAY_METHOD_LABELS[id]}</span>
                    <span className={`pay-acc-status ${added ? "added" : "missing"}`}>{added ? "مضاف" : "غير مضاف"}</span>
                  </div>
                  {methodAccounts.map((a) => (
                    <div className="pay-acc-item" key={a.id}>
                      <span>
                        {a.name} — {a.number}
                      </span>
                      <button type="button" className="pay-acc-del" onClick={() => deleteAccount(a.id)}>
                        {t("delete")}
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm pay-acc-add"
                    onClick={() => setOpenForms((prev) => ({ ...prev, [id]: !formOpen }))}
                  >
                    {added ? "+ إضافة حساب آخر" : "+ إضافة حساب"}
                  </button>
                  <div className="pay-acc-form" style={{ display: formOpen ? "grid" : "none" }}>
                    <input
                      type="text"
                      className="pa-name"
                      placeholder="اسم الحساب / البنك"
                      value={vals.name}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [id]: { ...vals, name: e.target.value } }))}
                    />
                    <input
                      type="text"
                      className="pa-number"
                      placeholder="رقم الحساب / IBAN"
                      value={vals.number}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [id]: { ...vals, number: e.target.value } }))}
                    />
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => addAccount(id)}>
                      حفظ
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
        <ModalCancelButton onClose={() => setAccountsOpen(false)} style={{ marginTop: 8 }} />
      </AdminModal>

      {/* RECEIPT MODAL */}
      <AdminModal id="receiptModal" open={!!receipt} onClose={() => setReceipt(null)} maxWidth={520}>
        <h3>{t("receipt")}</h3>
        <div id="receiptContent">{receipt && <img className="receipt-img" src={receiptImage(receipt)} alt="" />}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={downloadReceipt}>
            {t("downloadReceipt")}
          </button>
          <ModalCancelButton onClose={() => setReceipt(null)} />
        </div>
      </AdminModal>
    </>
  );
}
