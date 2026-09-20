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
import type { AdminReport } from "@/types/admin-dashboard";

const DEMO_REPORTS: AdminReport[] = [
  { id: "rep1", name: "تقرير الأداء الربعي", type: "أداء", period: "الربع الثالث ٢٠٢٦", date: "١ سبتمبر ٢٠٢٦", status: "جاهز" },
  { id: "rep2", name: "تقرير الامتثال السنوي", type: "امتثال", period: "٢٠٢٦", date: "٢٥ أغسطس ٢٠٢٦", status: "جاهز" },
  { id: "rep3", name: "تحليل طلبات الانضمام", type: "تشغيلي", period: "أغسطس ٢٠٢٦", date: "٢٠ أغسطس ٢٠٢٦", status: "قيد الإعداد" },
  { id: "rep4", name: "تقرير رضا العملاء", type: "جودة", period: "النصف الأول ٢٠٢٦", date: "١٠ يوليو ٢٠٢٦", status: "جاهز" },
  { id: "rep5", name: "مسودة تقرير الإفصاح الرقابي", type: "إفصاح", period: "الربع الثالث ٢٠٢٦", date: "٥ سبتمبر ٢٠٢٦", status: "مسودة" },
];

const STAT_CARDS = [
  {
    num: "24",
    labelKey: "reportsCreated",
    trendKey: "reportsThisMonth",
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
    num: "8",
    labelKey: "reportsThisQuarter",
    trendKey: "upFromLastQuarter",
    trendClass: "up",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
        <line x1="6" y1="20" x2="6" y2="11" />
        <line x1="12" y1="20" x2="12" y2="5" />
        <line x1="18" y1="20" x2="18" y2="14" />
      </svg>
    ),
  },
  {
    num: "5",
    labelKey: "scheduledReports",
    trendKey: "noChange",
    trendClass: "flat",
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
    num: "3 أيام",
    labelKey: "averagePrepTime",
    trendKey: "fasterByOneDay",
    trendClass: "up",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12,7 12,12 15,14" />
      </svg>
    ),
  },
];

export default function AdminReportsPage() {
  const { token } = useAdminAuth();
  const { t } = useI18n();
  const openDetail = useRecordDetail();

  const fetcher = useCallback(
    () => (token ? adminDashboardService.getReports(token) : Promise.reject()),
    [token]
  );
  const { data: rows, setData: setRows } = useApiData<AdminReport[]>(fetcher, DEMO_REPORTS);

  const [search, setSearch] = useState("");
  const pager = useTablePager(rows, search, (r) =>
    [r.name, r.type, r.period, r.date, r.status].join(" ")
  );

  const [editing, setEditing] = useState<AdminReport | null>(null);
  const [editFeedback, setEditFeedback] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addFeedback, setAddFeedback] = useState("");
  const addFormRef = useRef<HTMLFormElement>(null);

  const downloadReport = (r: AdminReport) => {
    const content = [
      `${t("reportName")}: ${r.name}`,
      `${t("type")}: ${r.type}`,
      `${t("period")}: ${r.period}`,
      `${t("creationDate")}: ${r.date}`,
      `${t("status")}: ${r.status}`,
      "",
      t("downloadReportFooter"),
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.name || t("reportName")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAction = (row: AdminReport, action: TableAction) => {
    if (action === "view") {
      openDetail({
        name: row.name,
        fields: [
          { label: t("reportName"), value: row.name },
          { label: t("type"), value: row.type },
          { label: t("period"), value: row.period },
          { label: t("creationDate"), value: row.date },
          { label: t("status"), value: row.status },
        ],
      });
    } else if (action === "edit") {
      setEditing({ ...row });
      setEditFeedback("");
    } else if (action === "download") {
      downloadReport(row);
    } else if (action === "delete") {
      if (confirm(t("deleteConfirm"))) {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        if (token) adminDashboardService.deleteReport(token, row.id).catch(() => {});
      }
    }
  };

  const saveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setRows((prev) => prev.map((r) => (r.id === editing.id ? editing : r)));
    if (token) adminDashboardService.updateReport(token, editing.id, editing).catch(() => {});
    setEditFeedback(t("saveChanges"));
    setTimeout(() => setEditing(null), 800);
  };

  const submitAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const type = String(fd.get("type") || "").trim();
    const period = String(fd.get("period") || "").trim();
    const date = String(fd.get("date") || "").trim();
    const status = String(fd.get("status") || "").trim();
    if (!name || !type || !period || !date || !status) return;
    const record: AdminReport = { id: `rep_${Date.now()}`, name, type, period, date, status };
    setRows((prev) => [...prev, record]);
    if (token) adminDashboardService.createReport(token, record).catch(() => {});
    setAddFeedback("تم إنشاء التقرير بنجاح");
    addFormRef.current?.reset();
    setTimeout(() => {
      setAddOpen(false);
      setAddFeedback("");
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
          <h3 style={{ margin: 0 }}>{t("availableReports")}</h3>
          <TableSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              pager.resetPage();
            }}
          />
          <button className="btn btn-outline btn-sm" type="button" onClick={() => setAddOpen(true)}>
            {t("createReport")}
          </button>
        </div>
        <table className="data-table no-actions" id="reportsTable">
          <thead>
            <tr>
              <th>{t("reportName")}</th>
              <th>{t("type")}</th>
              <th>{t("period")}</th>
              <th>{t("creationDate")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pager.pagedRows.map((r) => (
              <tr key={r.id}>
                <td className="detail-name" onClick={() => handleAction(r, "view")}>
                  {r.name}
                </td>
                <td>{r.type}</td>
                <td>{r.period}</td>
                <td>{r.date}</td>
                <td>
                  <StatusBadge text={r.status} />
                </td>
                <ActionsCell
                  actions={["view", "edit", "download", "delete"]}
                  onAction={(a) => handleAction(r, a)}
                />
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
              <label>{t("reportName")}</label>
              <input type="text" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("type")}</label>
              <input type="text" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("period")}</label>
              <input type="text" value={editing.period} onChange={(e) => setEditing({ ...editing, period: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("creationDate")}</label>
              <input type="text" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("status")}</label>
              <input type="text" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              {t("saveChanges")}
            </button>
          </form>
        )}
        <p className={`form-feedback${editFeedback ? " ok" : ""}`}>{editFeedback}</p>
        <ModalCancelButton onClose={() => setEditing(null)} style={{ marginTop: 8 }} />
      </AdminModal>

      {/* ADD REPORT MODAL */}
      <AdminModal id="addReportModal" open={addOpen} onClose={() => setAddOpen(false)} maxWidth={540}>
        <h3>{t("createReportNew")}</h3>
        <form className="edit-form" ref={addFormRef} onSubmit={submitAdd}>
          <div className="field">
            <label>{t("reportName")}</label>
            <input type="text" name="name" required />
          </div>
          <div className="field">
            <label>{t("type")}</label>
            <input type="text" name="type" required />
          </div>
          <div className="field">
            <label>{t("period")}</label>
            <input type="text" name="period" required />
          </div>
          <div className="field">
            <label>{t("creationDate")}</label>
            <input type="text" name="date" required />
          </div>
          <div className="field">
            <label>{t("status")}</label>
            <input type="text" name="status" defaultValue={t("ready")} required />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            {t("saveReport")}
          </button>
          <ModalCancelButton onClose={() => setAddOpen(false)} style={{ marginTop: 8 }} />
        </form>
        <p className={`form-feedback${addFeedback ? " ok" : ""}`}>{addFeedback}</p>
      </AdminModal>
    </>
  );
}
