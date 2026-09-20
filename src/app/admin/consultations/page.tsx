"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
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
import type { Consultation } from "@/types/admin-dashboard";

const DEMO_CONSULTATIONS: Consultation[] = [
  { id: "p1", project: "بناء إطار الحوكمة المؤسسية", client: "شركة الرياض للتطوير العقاري", consultant: "أروى العنزي", startDate: "١ يوليو ٢٠٢٦", deadline: "٣٠ سبتمبر ٢٠٢٦", status: "جارية" },
  { id: "p2", project: "مراجعة سياسات الامتثال النظامية", client: "مؤسسة أفق التقنية", consultant: "محمد الشهري", startDate: "١٥ أغسطس ٢٠٢٦", deadline: "١٥ أكتوبر ٢٠٢٦", status: "جارية" },
  { id: "p3", project: "إعادة هيكلة الإدارات والأوصاف الوظيفية", client: "مجموعة الخليج التجارية", consultant: "سارة الدوسري", startDate: "١ مايو ٢٠٢٦", deadline: "٣١ أغسطس ٢٠٢٦", status: "مكتملة" },
  { id: "p4", project: "دراسة جدوى التوسع الإقليمي", client: "شركة نمو للاستثمار", consultant: "خالد العتيبي", startDate: "١٠ يونيو ٢٠٢٦", deadline: "٣٠ أغسطس ٢٠٢٦", status: "متأخرة" },
  { id: "p5", project: "تطوير استراتيجية استقطاب الكفاءات", client: "شركة المسار اللوجستي", consultant: "نورة القحطاني", startDate: "٢٠ أغسطس ٢٠٢٦", deadline: "٢٠ نوفمبر ٢٠٢٦", status: "جارية" },
  { id: "p6", project: "إعداد دليل إجراءات العمل", client: "عيادات الشفاء التخصصية", consultant: "أروى العنزي", startDate: "١ فبراير ٢٠٢٦", deadline: "٣٠ أبريل ٢٠٢٦", status: "مكتملة" },
];

const FILTERS = ["", "جارية", "مكتملة", "متأخرة"];
const FILTER_KEYS = ["all", "ongoing", "completed", "delayed"];

export default function AdminConsultationsPage() {
  const { token } = useAdminAuth();
  const { t } = useI18n();
  const openDetail = useRecordDetail();

  const fetcher = useCallback(
    () => (token ? adminDashboardService.getConsultations(token) : Promise.reject()),
    [token]
  );
  const { data: rows, setData: setRows } = useApiData<Consultation[]>(fetcher, DEMO_CONSULTATIONS);

  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => rows.filter((r) => !filter || r.status === filter), [rows, filter]);
  const pager = useTablePager(filtered, search, (r) =>
    [r.project, r.client, r.consultant, r.startDate, r.deadline, r.status].join(" ")
  );

  const [editing, setEditing] = useState<Consultation | null>(null);
  const [editFeedback, setEditFeedback] = useState("");

  const handleAction = (row: Consultation, action: TableAction) => {
    if (action === "view") {
      openDetail({
        name: row.project,
        fields: [
          { label: t("projectName"), value: row.project },
          { label: t("client"), value: row.client },
          { label: t("responsibleConsultant"), value: row.consultant },
          { label: t("startDate"), value: row.startDate },
          { label: t("deadline"), value: row.deadline },
          { label: t("status"), value: row.status },
        ],
      });
    } else if (action === "edit") {
      setEditing({ ...row });
      setEditFeedback("");
    } else if (action === "delete") {
      if (confirm(t("deleteConfirm"))) {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        if (token) adminDashboardService.deleteConsultation(token, row.id).catch(() => {});
      }
    }
  };

  const saveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setRows((prev) => prev.map((r) => (r.id === editing.id ? editing : r)));
    if (token) adminDashboardService.updateConsultation(token, editing.id, editing).catch(() => {});
    setEditFeedback(t("saveChanges"));
    setTimeout(() => setEditing(null), 800);
  };

  return (
    <>
      <div className="panel-card">
        <div className="table-toolbar">
          <h3 style={{ margin: 0 }}>{t("consultingProjects")}</h3>
          <TableSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              pager.resetPage();
            }}
          />
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
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("projectName")}</th>
              <th>{t("client")}</th>
              <th>{t("responsibleConsultant")}</th>
              <th>{t("startDate")}</th>
              <th>{t("deadline")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pager.pagedRows.map((r) => (
              <tr key={r.id}>
                <td className="detail-name" onClick={() => handleAction(r, "view")}>
                  {r.project}
                </td>
                <td>{r.client}</td>
                <td>{r.consultant}</td>
                <td>{r.startDate}</td>
                <td>{r.deadline}</td>
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

      <AdminModal id="editModal" open={!!editing} onClose={() => setEditing(null)} maxWidth={540}>
        <h3>{t("editRecord")}</h3>
        {editing && (
          <form className="edit-form" onSubmit={saveEdit}>
            <div className="field">
              <label>{t("projectName")}</label>
              <input type="text" value={editing.project} onChange={(e) => setEditing({ ...editing, project: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("client")}</label>
              <input type="text" value={editing.client} onChange={(e) => setEditing({ ...editing, client: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("responsibleConsultant")}</label>
              <input type="text" value={editing.consultant} onChange={(e) => setEditing({ ...editing, consultant: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("startDate")}</label>
              <input type="text" value={editing.startDate} onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("deadline")}</label>
              <input type="text" value={editing.deadline} onChange={(e) => setEditing({ ...editing, deadline: e.target.value })} />
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
    </>
  );
}
