"use client";

import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { adminDashboardService } from "@/services/admin-dashboard.service";
import { useApiData } from "@/lib/use-api-data";
import {
  ActionsCell,
  AdminModal,
  ModalCancelButton,
  StatusBadge,
  TablePagination,
  TableSearch,
  useRecordDetail,
  useTablePager,
  type TableAction,
} from "@/components/admin/table";
import type { ClientRecord } from "@/types/admin-dashboard";

const DEMO_CLIENTS: ClientRecord[] = [
  { id: "c1", name: "شركة الرياض للتطوير العقاري", sector: "عقارات", field: "استشارات الحوكمة", city: "الرياض", contractDate: "١٢ يناير ٢٠٢٦", status: "نشط" },
  { id: "c2", name: "مؤسسة أفق التقنية", sector: "تقنية المعلومات", field: "استشارات الامتثال", city: "جدة", contractDate: "٣ مارس ٢٠٢٦", status: "نشط" },
  { id: "c3", name: "مجموعة الخليج التجارية", sector: "تجارة التجزئة", field: "الاستشارات الإدارية", city: "الدمام", contractDate: "٢٠ فبراير ٢٠٢٦", status: "نشط" },
  { id: "c4", name: "شركة نمو للاستثمار", sector: "خدمات مالية", field: "تحليل الأعمال والتخطيط", city: "الرياض", contractDate: "٥ أبريل ٢٠٢٦", status: "تجديد العقد" },
  { id: "c5", name: "مصنع اليمامة للأغذية", sector: "صناعة", field: "استقطاب المواهب", city: "القصيم", contractDate: "١٤ نوفمبر ٢٠٢٥", status: "منتهي" },
  { id: "c6", name: "شركة المسار اللوجستي", sector: "نقل وخدمات لوجستية", field: "شبكات الأعمال", city: "جدة", contractDate: "٨ يونيو ٢٠٢٦", status: "نشط" },
  { id: "c7", name: "عيادات الشفاء التخصصية", sector: "رعاية صحية", field: "استشارات الامتثال", city: "مكة المكرمة", contractDate: "٢٥ ديسمبر ٢٠٢٥", status: "منتهي" },
];

const FILTERS = ["", "نشط", "منتهي"];
const FILTER_KEYS = ["all", "active", "expired"];

const STAT_CARDS = [
  {
    num: "57",
    labelKey: "totalClients",
    trendKey: "newClientsThisMonth",
    trendClass: "up",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 20c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5" />
        <circle cx="17.5" cy="9" r="2.5" />
        <path d="M15.5 14.3c2.8.3 4.5 2.1 4.5 5.7" />
      </svg>
    ),
  },
  {
    num: "41",
    labelKey: "activeContracts",
    trendKey: "upFromLastQuarterPercent",
    trendClass: "up",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <line x1="8" y1="8" x2="16" y2="8" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    num: "16",
    labelKey: "expiredContracts",
    trendKey: "noChange",
    trendClass: "flat",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12,7 12,12 15,14" />
      </svg>
    ),
  },
  {
    num: "92%",
    labelKey: "retentionRate",
    trendKey: "improvement",
    trendClass: "up",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="9" />
        <polyline points="8,12 11,15 16,9" />
      </svg>
    ),
  },
];

export default function AdminClientsPage() {
  const { token } = useAdminAuth();
  const { t } = useI18n();
  const openDetail = useRecordDetail();

  const fetcher = useCallback(
    () => (token ? adminDashboardService.getClients(token) : Promise.reject()),
    [token]
  );
  const { data: rows, setData: setRows } = useApiData<ClientRecord[]>(fetcher, DEMO_CLIENTS);

  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => rows.filter((r) => !filter || r.status === filter), [rows, filter]);
  const pager = useTablePager(filtered, search, (r) =>
    [r.name, r.sector, r.field, r.city, r.contractDate, r.status].join(" ")
  );

  const [editing, setEditing] = useState<ClientRecord | null>(null);
  const [editFeedback, setEditFeedback] = useState("");
  const [editAccount, setEditAccount] = useState({ email: "", password: "" });

  const [addOpen, setAddOpen] = useState(false);
  const [addFeedback, setAddFeedback] = useState<{ text: string; ok: boolean }>({ text: "", ok: false });
  const [clientImage, setClientImage] = useState("");
  const addFormRef = useRef<HTMLFormElement>(null);

  const handleAction = (row: ClientRecord, action: TableAction) => {
    if (action === "view") {
      openDetail({
        name: row.name,
        image: row.image || undefined,
        fields: [
          { label: t("client"), value: row.name },
          { label: t("sector"), value: row.sector },
          { label: t("consultingField"), value: row.field },
          { label: t("city"), value: row.city },
          { label: t("contractDate"), value: row.contractDate },
          { label: t("status"), value: row.status },
        ],
        extra: { client: { reports: [], bookings: [], consultations: [] } },
      });
    } else if (action === "edit") {
      setEditing({ ...row });
      setEditAccount({ email: row.email || "", password: "" });
      setEditFeedback("");
    } else if (action === "delete") {
      if (confirm(t("deleteConfirm"))) {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        if (token) adminDashboardService.deleteClient(token, row.id).catch(() => {});
      }
    }
  };

  const saveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setRows((prev) => prev.map((r) => (r.id === editing.id ? editing : r)));
    if (token) adminDashboardService.updateClient(token, editing.id, editing).catch(() => {});
    setEditFeedback(t("saveChanges"));
    setTimeout(() => setEditing(null), 800);
  };

  const submitAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const client = String(fd.get("client") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "").trim();
    const sector = String(fd.get("sector") || "").trim();
    const field = String(fd.get("field") || "").trim();
    const city = String(fd.get("city") || "").trim();
    const date = String(fd.get("date") || "").trim();
    const status = String(fd.get("status") || "").trim();
    if (!client || !email || !password || !sector || !field || !city || !date || !status) return;
    if (rows.some((r) => r.email === email)) {
      setAddFeedback({ text: t("emailExists"), ok: false });
      return;
    }
    const record: ClientRecord = {
      id: `c_${Date.now()}`,
      name: client,
      email,
      sector,
      field,
      city,
      contractDate: date,
      status,
      image: clientImage || null,
    };
    setRows((prev) => [...prev, record]);
    if (token) adminDashboardService.createClient(token, record).catch(() => {});
    setClientImage("");
    setAddFeedback({ text: t("clientAdded"), ok: true });
    addFormRef.current?.reset();
    setTimeout(() => {
      setAddOpen(false);
      setAddFeedback({ text: "", ok: false });
    }, 800);
  };

  return (
    <>
      <div className="stat-grid">
        {STAT_CARDS.map((s) => (
          <div className="stat-card" key={s.labelKey}>
            <div className="top">
              <div className="ic">{s.icon}</div>
            </div>
            <div className="num">{s.num}</div>
            <div className="label">{t(s.labelKey)}</div>
            <div className={`trend ${s.trendClass}`}>{t(s.trendKey)}</div>
          </div>
        ))}
      </div>

      <div className="panel-card">
        <div className="table-toolbar">
          <h3 style={{ margin: 0 }}>{t("clientsRecord")}</h3>
          <TableSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              pager.resetPage();
            }}
          />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="chip-filters">
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
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setAddOpen(true)}>
              {t("addClient")}
            </button>
          </div>
        </div>
        <table className="data-table" id="clientsTable">
          <thead>
            <tr>
              <th>{t("client")}</th>
              <th>{t("sector")}</th>
              <th>{t("consultingField")}</th>
              <th>{t("city")}</th>
              <th>{t("contractDate")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pager.pagedRows.map((r) => (
              <tr key={r.id}>
                <td className="detail-name" onClick={() => handleAction(r, "view")}>
                  {r.image && <img className="table-avatar" src={r.image} alt={r.name} />}
                  {r.name}
                </td>
                <td>{r.sector}</td>
                <td>{r.field}</td>
                <td>{r.city}</td>
                <td>{r.contractDate}</td>
                <td>
                  <StatusBadge text={r.status} />
                </td>
                <ActionsCell actions={["view", "edit", "delete"]} onAction={(a) => handleAction(r, a)} />
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

      {/* EDIT MODAL */}
      <AdminModal id="editModal" open={!!editing} onClose={() => setEditing(null)} maxWidth={540}>
        <h3>{t("editRecord")}</h3>
        {editing && (
          <form className="edit-form" onSubmit={saveEdit}>
            <div className="field">
              <label>{t("client")}</label>
              <input type="text" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("sector")}</label>
              <input type="text" value={editing.sector} onChange={(e) => setEditing({ ...editing, sector: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("consultingField")}</label>
              <input type="text" value={editing.field} onChange={(e) => setEditing({ ...editing, field: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("city")}</label>
              <input type="text" value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("contractDate")}</label>
              <input type="text" value={editing.contractDate} onChange={(e) => setEditing({ ...editing, contractDate: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("status")}</label>
              <input type="text" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("email")}</label>
              <input type="text" value={editAccount.email} onChange={(e) => setEditAccount({ ...editAccount, email: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("password")}</label>
              <input type="text" value={editAccount.password} onChange={(e) => setEditAccount({ ...editAccount, password: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              {t("saveChanges")}
            </button>
          </form>
        )}
        <p className={`form-feedback${editFeedback ? " ok" : ""}`}>{editFeedback}</p>
        <ModalCancelButton onClose={() => setEditing(null)} style={{ marginTop: 8 }} />
      </AdminModal>

      {/* ADD CLIENT MODAL */}
      <AdminModal id="addClientModal" open={addOpen} onClose={() => setAddOpen(false)} maxWidth={540}>
        <h3>{t("addClientNew")}</h3>
        <form className="edit-form" ref={addFormRef} onSubmit={submitAdd}>
          <div className="field" style={{ textAlign: "center" }}>
            <img
              className={`avatar-preview${clientImage ? " show" : ""}`}
              src={clientImage || undefined}
              alt={t("clientImage")}
            />
            <label>{t("clientImage")}</label>
            <input
              type="file"
              name="clientImage"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => setClientImage(String(ev.target?.result || ""));
                reader.readAsDataURL(file);
              }}
            />
          </div>
          <div className="field">
            <label>{t("clientLabel")}</label>
            <input type="text" name="client" required />
          </div>
          <div className="field">
            <label>{t("email")}</label>
            <input type="email" name="email" required />
          </div>
          <div className="field">
            <label>{t("password")}</label>
            <input type="text" name="password" required minLength={4} />
          </div>
          <div className="field">
            <label>{t("sector")}</label>
            <input type="text" name="sector" required />
          </div>
          <div className="field">
            <label>{t("consultingField")}</label>
            <input type="text" name="field" required />
          </div>
          <div className="field">
            <label>{t("city")}</label>
            <input type="text" name="city" required />
          </div>
          <div className="field">
            <label>{t("contractDate")}</label>
            <input type="text" name="date" required />
          </div>
          <div className="field">
            <label>{t("status")}</label>
            <input type="text" name="status" defaultValue={t("active")} required />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            {t("saveClient")}
          </button>
          <ModalCancelButton onClose={() => setAddOpen(false)} style={{ marginTop: 8 }} />
        </form>
        <p className={`form-feedback${addFeedback.text ? (addFeedback.ok ? " ok" : " err") : ""}`}>{addFeedback.text}</p>
      </AdminModal>
    </>
  );
}
