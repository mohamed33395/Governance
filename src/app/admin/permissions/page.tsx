"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { adminDashboardService } from "@/services/admin-dashboard.service";
import { useApiData } from "@/lib/use-api-data";
import { AdminModal, ModalCancelButton, TablePagination, TableSearch, useTablePager } from "@/components/admin/table";
import type { ClientRecord, Consultant, ConsultantAccount } from "@/types/admin-dashboard";

const PERMISSION_PANELS = ["overview", "requests", "clients", "consultations", "consultants", "reports", "payments", "meetings", "support"];
const PERMISSION_LABELS: Record<string, string> = {
  overview: "navOverview",
  requests: "navRequests",
  clients: "navClients",
  consultations: "navConsultations",
  consultants: "navConsultants",
  reports: "navReports",
  payments: "navPayments",
  meetings: "navMeetings",
  support: "navSupport",
};

const CLIENT_PERM_PANELS = ["overview", "reports", "interviews", "bookings", "packages", "payments", "receipts", "reviews", "profile"];
const CLIENT_PERM_LABELS: Record<string, string> = {
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

const DEMO_CLIENT_NAMES = [
  "شركة الرياض للتطوير العقاري",
  "مؤسسة أفق التقنية",
  "مجموعة الخليج التجارية",
  "شركة نمو للاستثمار",
  "مصنع اليمامة للأغذية",
  "شركة المسار اللوجستي",
  "عيادات الشفاء التخصصية",
];

const DEMO_CONSULTANT_NAMES = ["أروى العنزي", "محمد الشهري", "سارة الدوسري", "خالد العتيبي", "نورة القحطاني"];

const selectStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--line)",
  background: "var(--cream)",
  color: "var(--ink)",
  padding: "12px 14px",
  fontSize: ".92rem",
  borderRadius: 10,
  fontFamily: "inherit",
};

const checkLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: ".8rem",
  marginBottom: 6,
};

export default function AdminPermissionsPage() {
  const { token } = useAdminAuth();
  const { t } = useI18n();

  const fetcher = useCallback(
    () => (token ? adminDashboardService.getConsultantAccounts(token) : Promise.reject()),
    [token]
  );
  const { data: accounts, setData: setAccounts } = useApiData<ConsultantAccount[]>(fetcher, []);

  const clientsFetcher = useCallback(
    () => (token ? adminDashboardService.getClients(token) : Promise.reject()),
    [token]
  );
  const { data: clients } = useApiData<ClientRecord[]>(
    clientsFetcher,
    DEMO_CLIENT_NAMES.map((n, i) => ({ id: `c${i}`, name: n, sector: "", field: "", city: "", contractDate: "", status: "" }))
  );

  const consultantsFetcher = useCallback(
    () => (token ? adminDashboardService.getConsultants(token) : Promise.reject()),
    [token]
  );
  const { data: consultants } = useApiData<Consultant[]>(
    consultantsFetcher,
    DEMO_CONSULTANT_NAMES.map((n, i) => ({ id: `s${i}`, name: n, specialty: "", email: "", phone: "", status: "" }))
  );

  const [search, setSearch] = useState("");
  const pager = useTablePager(accounts, search, (a) =>
    [a.name, a.email, PERMISSION_PANELS.filter((k) => a.permissions?.[k]).map((k) => t(PERMISSION_LABELS[k])).join(" ")].join(" ")
  );

  /* ===== permission modal (add / edit consultant account) ===== */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(-1);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [permFeedback, setPermFeedback] = useState<{ text: string; ok: boolean }>({ text: "", ok: false });

  const openPermissionModal = (idx: number) => {
    const acc = idx >= 0 ? accounts[idx] : null;
    setEditingIdx(idx);
    setForm({ name: acc?.name || "", email: acc?.email || "", password: acc?.password || "" });
    const p: Record<string, boolean> = {};
    PERMISSION_PANELS.forEach((k) => {
      p[k] = acc?.permissions?.[k] ?? false;
    });
    setPerms(p);
    setPermFeedback({ text: "", ok: false });
    setModalOpen(true);
  };

  const submitPermission = (e: FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password.trim();
    if (!name || !email || !password) {
      setPermFeedback({ text: t("fillAllFields"), ok: false });
      return;
    }
    if (editingIdx < 0 && accounts.some((a) => a.email === email)) {
      setPermFeedback({ text: t("emailExists"), ok: false });
      return;
    }
    const account: ConsultantAccount = {
      id: editingIdx >= 0 ? accounts[editingIdx].id : `acc_${Date.now()}`,
      name,
      email,
      password,
      permissions: perms,
    };
    if (editingIdx >= 0) {
      setAccounts((prev) => prev.map((a, i) => (i === editingIdx ? account : a)));
      if (token) adminDashboardService.updateConsultantAccount(token, account.id, account).catch(() => {});
    } else {
      setAccounts((prev) => [account, ...prev]);
      if (token) adminDashboardService.createConsultantAccount(token, account).catch(() => {});
    }
    setPermFeedback({ text: t("saveChanges"), ok: true });
    setTimeout(() => setModalOpen(false), 700);
  };

  const deleteAccount = (idx: number) => {
    const acc = accounts[idx];
    setAccounts((prev) => prev.filter((_, i) => i !== idx));
    if (token && acc) adminDashboardService.deleteConsultantAccount(token, acc.id).catch(() => {});
  };

  /* ===== assign permissions card ===== */
  const [permType, setPermType] = useState<"consultant" | "client">("consultant");
  const [permTarget, setPermTarget] = useState("");
  const [assignPerms, setAssignPerms] = useState<Record<string, boolean>>({});
  const [assignFeedback, setAssignFeedback] = useState<{ text: string; ok: boolean }>({ text: "", ok: false });

  const targetNames = useMemo(() => {
    const names: string[] = [];
    if (permType === "client") {
      clients.forEach((c) => {
        const n = (c.name || "").trim();
        if (n && !names.includes(n)) names.push(n);
      });
    } else {
      consultants.forEach((c) => {
        const n = (c.name || "").trim();
        if (n && !names.includes(n)) names.push(n);
      });
      accounts.forEach((a) => {
        const n = (a.name || "").trim();
        if (n && !names.includes(n)) names.push(n);
      });
    }
    return names;
  }, [permType, clients, consultants, accounts]);

  const activePanels = permType === "client" ? CLIENT_PERM_PANELS : PERMISSION_PANELS;
  const activeLabels = permType === "client" ? CLIENT_PERM_LABELS : PERMISSION_LABELS;

  const refreshChecklist = useCallback(
    (type: "consultant" | "client", name: string, accs: ConsultantAccount[]) => {
      const panels = type === "client" ? CLIENT_PERM_PANELS : PERMISSION_PANELS;
      let existing: Record<string, boolean> | null = null;
      if (name && type === "consultant") {
        const acc = accs.find((a) => a.name === name || a.email === name);
        if (acc) existing = acc.permissions || null;
      }
      const defaultOn = type === "client";
      const next: Record<string, boolean> = {};
      panels.forEach((k) => {
        next[k] = existing ? !!existing[k] : defaultOn;
      });
      setAssignPerms(next);
    },
    []
  );

  const onTypeChange = (type: "consultant" | "client") => {
    setPermType(type);
    setPermTarget("");
    const panels = type === "client" ? CLIENT_PERM_PANELS : PERMISSION_PANELS;
    const next: Record<string, boolean> = {};
    panels.forEach((k) => {
      next[k] = type === "client";
    });
    setAssignPerms(next);
    setAssignFeedback({ text: "", ok: false });
  };

  const onTargetChange = (name: string) => {
    setPermTarget(name);
    refreshChecklist(permType, name, accounts);
    setAssignFeedback({ text: "", ok: false });
  };

  const applyPermissions = () => {
    if (!permTarget) {
      setAssignFeedback({ text: t("selectName"), ok: false });
      return;
    }
    if (permType === "consultant") {
      const acc = accounts.find((a) => a.name === permTarget || a.email === permTarget);
      if (acc) {
        const next = { ...acc, permissions: assignPerms };
        setAccounts((prev) => prev.map((a) => (a.id === acc.id ? next : a)));
        if (token) adminDashboardService.updateConsultantAccount(token, acc.id, next).catch(() => {});
      }
    }
    if (token) {
      adminDashboardService.assignPermissions(token, { type: permType, name: permTarget, permissions: assignPerms }).catch(() => {});
    }
    setAssignFeedback({ text: t("permApplied"), ok: true });
  };

  return (
    <>
      <div className="panel-card">
        <div className="table-toolbar">
          <h3 style={{ margin: 0 }}>{t("permissionsTitle")}</h3>
          <TableSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              pager.resetPage();
            }}
          />
          <button className="btn btn-primary btn-sm" type="button" onClick={() => openPermissionModal(-1)}>
            {t("addConsultantAccount")}
          </button>
        </div>
        <table className="data-table no-actions" id="permissionsTable">
          <thead>
            <tr>
              <th>{t("consultant")}</th>
              <th>{t("email")}</th>
              <th>{t("grantedPermissions")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pager.pagedRows.map((acc) => {
              const idx = accounts.indexOf(acc);
              const allowed = PERMISSION_PANELS.filter((k) => acc.permissions?.[k]).map((k) => t(PERMISSION_LABELS[k]));
              return (
                <tr key={acc.id}>
                  <td>{acc.name || "—"}</td>
                  <td>{acc.email || "—"}</td>
                  <td style={{ maxWidth: 320, whiteSpace: "normal", fontSize: ".8rem", color: "var(--stone)" }}>
                    {allowed.length ? allowed.join("، ") : t("noPermissions")}
                  </td>
                  <td>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => openPermissionModal(idx)}>
                      {t("edit")}
                    </button>{" "}
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ color: "#a03020", borderColor: "#a03020" }}
                      onClick={() => deleteAccount(idx)}
                    >
                      {t("delete")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {accounts.length === 0 && (
          <p className="notif-empty" id="permissionsEmpty">
            {t("noPermissionAccounts")}
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

      <div className="panel-card" style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 16px" }}>{t("assignPermissions")}</h3>
        <div className="field">
          <label>{t("accountType")}</label>
          <select
            id="permTypeSelect"
            style={selectStyle}
            value={permType}
            onChange={(e) => onTypeChange(e.target.value as "consultant" | "client")}
          >
            <option value="consultant">{t("consultant")}</option>
            <option value="client">{t("client")}</option>
          </select>
        </div>
        <div className="field">
          <label>{t("selectName")}</label>
          <select id="permTargetSelect" style={selectStyle} value={permTarget} onChange={(e) => onTargetChange(e.target.value)}>
            <option value="" disabled>
              {t("selectOption")}
            </option>
            {targetNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("grantedPermissions")}</label>
          <div id="permAssignChecklist">
            {activePanels.map((k) => (
              <label key={k} style={checkLabelStyle}>
                <input
                  type="checkbox"
                  checked={!!assignPerms[k]}
                  onChange={(e) => setAssignPerms((prev) => ({ ...prev, [k]: e.target.checked }))}
                />{" "}
                {t(activeLabels[k])}
              </label>
            ))}
          </div>
        </div>
        <p className={`form-feedback${assignFeedback.text ? (assignFeedback.ok ? " ok" : " err") : ""}`}>{assignFeedback.text}</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={applyPermissions}>
          {t("applyPermissions")}
        </button>
      </div>

      {/* PERMISSION MODAL */}
      <AdminModal id="permissionModal" open={modalOpen} onClose={() => setModalOpen(false)} maxWidth={480}>
        <h3>{editingIdx >= 0 ? t("editPermissions") : t("addConsultantAccount")}</h3>
        <form className="edit-form" onSubmit={submitPermission}>
          <div className="field">
            <label>{t("consultantName")}</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>{t("email")}</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field">
            <label>{t("password")}</label>
            <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="field">
            <label>{t("grantedPermissions")}</label>
            <div id="permissionChecklist">
              {PERMISSION_PANELS.map((k) => (
                <label key={k} style={checkLabelStyle}>
                  <input
                    type="checkbox"
                    checked={!!perms[k]}
                    onChange={(e) => setPerms((prev) => ({ ...prev, [k]: e.target.checked }))}
                  />{" "}
                  {t(PERMISSION_LABELS[k])}
                </label>
              ))}
            </div>
          </div>
          <p className={`form-feedback${permFeedback.text ? (permFeedback.ok ? " ok" : " err") : ""}`}>{permFeedback.text}</p>
          <button type="submit" className="btn btn-primary btn-sm">
            {t("saveChanges")}
          </button>
          <ModalCancelButton onClose={() => setModalOpen(false)} style={{ marginInlineStart: 8 }} />
        </form>
      </AdminModal>
    </>
  );
}
