"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
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
import type { Consultant } from "@/types/admin-dashboard";

const DEMO_CONSULTANTS: Consultant[] = [
  { id: "s1", name: "أروى العنزي", specialty: "استشارات الحوكمة", email: "a.alanazi@example.com", phone: "٠٥٥٥٥٥١٢٣٤٥٦", status: "نشط" },
  { id: "s2", name: "محمد الشهري", specialty: "استشارات الامتثال", email: "m.alshahri@example.com", phone: "٠٥٥٥٩٨٧٦٥٤", status: "نشط" },
  { id: "s3", name: "سارة الدوسري", specialty: "الاستشارات الإدارية", email: "s.aldosari@example.com", phone: "٠٥٥٥٥٥١١٢٢٣٣", status: "نشط" },
  { id: "s4", name: "خالد العتيبي", specialty: "تحليل الأعمال والتخطيط", email: "k.alotaibi@example.com", phone: "٠٥٥٥٣٣٤٤٥٥", status: "نشط" },
  { id: "s5", name: "نورة القحطاني", specialty: "استقطاب المواهب", email: "n.alqahtani@example.com", phone: "٠٥٥٥٥٥٧٧٨٨٩٩", status: "مشغول" },
];

const STAT_CARDS = [
  {
    num: "5",
    labelKey: "totalConsultants",
    trendKey: "newConsultant",
    trendClass: "up",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    ),
  },
  {
    num: "4",
    labelKey: "activeConsultants",
    trendKey: "noChange",
    trendClass: "flat",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="9" />
        <polyline points="8,12 11,15 16,9" />
      </svg>
    ),
  },
  {
    num: "12",
    labelKey: "projectsCompleted",
    trendKey: "twoThisMonth",
    trendClass: "up",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="4" width="18" height="17" rx="1" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
      </svg>
    ),
  },
  {
    num: "4.9",
    labelKey: "averageRating",
    trendKey: "zeroPointTwo",
    trendClass: "up",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12,7 12,12 15,14" />
      </svg>
    ),
  },
];

export default function AdminConsultantsPage() {
  const { token } = useAdminAuth();
  const { t } = useI18n();
  const openDetail = useRecordDetail();

  const fetcher = useCallback(
    () => (token ? adminDashboardService.getConsultants(token) : Promise.reject()),
    [token]
  );
  const { data: rows, setData: setRows } = useApiData<Consultant[]>(fetcher, DEMO_CONSULTANTS);

  const [search, setSearch] = useState("");
  const pager = useTablePager(rows, search, (r) =>
    [r.name, r.specialty, r.email, r.phone, r.status].join(" ")
  );

  const [editing, setEditing] = useState<Consultant | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [editFeedback, setEditFeedback] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addFeedback, setAddFeedback] = useState<{ text: string; ok: boolean }>({ text: "", ok: false });
  const [consultantImage, setConsultantImage] = useState("");
  const addFormRef = useRef<HTMLFormElement>(null);

  const handleAction = (row: Consultant, action: TableAction) => {
    if (action === "view") {
      openDetail({
        name: row.name,
        image: row.image || undefined,
        fields: [
          { label: t("consultant"), value: row.name },
          { label: t("specialty"), value: row.specialty },
          { label: t("email"), value: row.email },
          { label: t("phone"), value: row.phone },
          { label: t("status"), value: row.status },
        ],
        extra: { consultant: { engagements: [], reports: [] } },
      });
    } else if (action === "edit") {
      setEditing({ ...row });
      setEditPassword("");
      setEditFeedback("");
    } else if (action === "delete") {
      if (confirm(t("deleteConfirm"))) {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        if (token) adminDashboardService.deleteConsultant(token, row.id).catch(() => {});
      }
    }
  };

  const saveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setRows((prev) => prev.map((r) => (r.id === editing.id ? editing : r)));
    if (token) adminDashboardService.updateConsultant(token, editing.id, editing).catch(() => {});
    setEditFeedback(t("saveChanges"));
    setTimeout(() => setEditing(null), 800);
  };

  const submitAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const consultant = String(fd.get("consultant") || "").trim();
    const specialty = String(fd.get("specialty") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const status = String(fd.get("status") || "").trim();
    if (!consultant || !specialty || !email || !password || !phone || !status) return;
    if (rows.some((r) => r.email === email)) {
      setAddFeedback({ text: t("emailExists"), ok: false });
      return;
    }
    const record: Consultant = {
      id: `s_${Date.now()}`,
      name: consultant,
      specialty,
      email,
      phone,
      status,
      image: consultantImage || null,
    };
    setRows((prev) => [...prev, record]);
    if (token) adminDashboardService.createConsultant(token, record).catch(() => {});
    setConsultantImage("");
    setAddFeedback({ text: t("consultantAdded"), ok: true });
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
          <h3 style={{ margin: 0 }}>{t("consultantRecord")}</h3>
          <TableSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              pager.resetPage();
            }}
          />
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setAddOpen(true)}>
            {t("addConsultant")}
          </button>
        </div>
        <table className="data-table" id="consultantsTable">
          <thead>
            <tr>
              <th>{t("consultant")}</th>
              <th>{t("specialty")}</th>
              <th>{t("email")}</th>
              <th>{t("phone")}</th>
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
                <td>{r.specialty}</td>
                <td>{r.email}</td>
                <td>{r.phone}</td>
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
              <label>{t("consultant")}</label>
              <input type="text" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("specialty")}</label>
              <input type="text" value={editing.specialty} onChange={(e) => setEditing({ ...editing, specialty: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("email")}</label>
              <input type="text" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("phone")}</label>
              <input type="text" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("status")}</label>
              <input type="text" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("password")}</label>
              <input type="text" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              {t("saveChanges")}
            </button>
          </form>
        )}
        <p className={`form-feedback${editFeedback ? " ok" : ""}`}>{editFeedback}</p>
        <ModalCancelButton onClose={() => setEditing(null)} style={{ marginTop: 8 }} />
      </AdminModal>

      {/* ADD CONSULTANT MODAL */}
      <AdminModal id="addConsultantModal" open={addOpen} onClose={() => setAddOpen(false)} maxWidth={540}>
        <h3>{t("addConsultantNew")}</h3>
        <form className="edit-form" ref={addFormRef} onSubmit={submitAdd}>
          <div className="field" style={{ textAlign: "center" }}>
            <img
              className={`avatar-preview${consultantImage ? " show" : ""}`}
              src={consultantImage || undefined}
              alt={t("consultantImage")}
            />
            <label>{t("consultantImage")}</label>
            <input
              type="file"
              name="consultantImage"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => setConsultantImage(String(ev.target?.result || ""));
                reader.readAsDataURL(file);
              }}
            />
          </div>
          <div className="field">
            <label>{t("consultantLabel")}</label>
            <input type="text" name="consultant" required />
          </div>
          <div className="field">
            <label>{t("specialty")}</label>
            <input type="text" name="specialty" required />
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
            <label>{t("phone")}</label>
            <input type="text" name="phone" required />
          </div>
          <div className="field">
            <label>{t("status")}</label>
            <input type="text" name="status" defaultValue={t("active")} required />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            {t("saveConsultant")}
          </button>
          <ModalCancelButton onClose={() => setAddOpen(false)} style={{ marginTop: 8 }} />
        </form>
        <p className={`form-feedback${addFeedback.text ? (addFeedback.ok ? " ok" : " err") : ""}`}>{addFeedback.text}</p>
      </AdminModal>
    </>
  );
}
