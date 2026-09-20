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
import type { JoinRequest } from "@/types/admin-dashboard";

const DEMO_REQUESTS: JoinRequest[] = [
  { id: "r1", name: "خالد الحربي", field: "استشارات الحوكمة", city: "الرياض", email: "k.harbi@email.com", submissionDate: "٣ سبتمبر ٢٠٢٦", status: "قيد المراجعة" },
  { id: "r2", name: "منيرة القحطاني", field: "استقطاب المواهب", city: "جدة", email: "m.qahtani@email.com", submissionDate: "٢ سبتمبر ٢٠٢٦", status: "مقبول" },
  { id: "r3", name: "عبدالله الزهراني", field: "الاستشارات الإدارية", city: "الدمام", email: "a.zahrani@email.com", submissionDate: "٣١ أغسطس ٢٠٢٦", status: "مقبول" },
  { id: "r4", name: "هند العتيبي", field: "استشارات الامتثال", city: "مكة المكرمة", email: "h.otaibi@email.com", submissionDate: "٣٠ أغسطس ٢٠٢٦", status: "مرفوض" },
  { id: "r5", name: "سلطان المطيري", field: "تحليل الأعمال والتخطيط", city: "الرياض", email: "s.mutairi@email.com", submissionDate: "٢٩ أغسطس ٢٠٢٦", status: "قيد المراجعة" },
  { id: "r6", name: "ريم الدوسري", field: "شبكات الأعمال", city: "الخبر", email: "r.dosari@email.com", submissionDate: "٢٧ أغسطس ٢٠٢٦", status: "مقبول" },
  { id: "r7", name: "فيصل العمري", field: "استشارات الحوكمة", city: "جدة", email: "f.amri@email.com", submissionDate: "٢٥ أغسطس ٢٠٢٦", status: "قيد المراجعة" },
];

const FILTERS = ["", "قيد المراجعة", "مقبول", "مرفوض"];
const FILTER_KEYS = ["all", "underReview", "accepted", "rejected"];

export default function AdminRequestsPage() {
  const { token } = useAdminAuth();
  const { t } = useI18n();
  const openDetail = useRecordDetail();

  const fetcher = useCallback(
    () => (token ? adminDashboardService.getRequests(token) : Promise.reject()),
    [token]
  );
  const { data: rows, setData: setRows } = useApiData<JoinRequest[]>(fetcher, DEMO_REQUESTS);

  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => rows.filter((r) => !filter || r.status === filter),
    [rows, filter]
  );
  const pager = useTablePager(filtered, search, (r) =>
    [r.name, r.field, r.city, r.email, r.submissionDate, r.status].join(" ")
  );

  const [editing, setEditing] = useState<JoinRequest | null>(null);
  const [editFeedback, setEditFeedback] = useState("");

  const handleAction = (row: JoinRequest, action: TableAction) => {
    if (action === "view") {
      openDetail({
        name: row.name,
        fields: [
          { label: t("name"), value: row.name },
          { label: t("field"), value: row.field },
          { label: t("city"), value: row.city },
          { label: t("email"), value: row.email },
          { label: t("submissionDate"), value: row.submissionDate },
          { label: t("status"), value: row.status },
        ],
      });
    } else if (action === "edit") {
      setEditing({ ...row });
      setEditFeedback("");
    } else if (action === "delete") {
      if (confirm(t("deleteConfirm"))) {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        if (token) adminDashboardService.deleteRequest(token, row.id).catch(() => {});
      }
    }
  };

  const saveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setRows((prev) => prev.map((r) => (r.id === editing.id ? editing : r)));
    if (token) adminDashboardService.updateRequest(token, editing.id, editing).catch(() => {});
    setEditFeedback(t("saveChanges"));
    setTimeout(() => setEditing(null), 800);
  };

  return (
    <>
      <div className="panel-card">
        <div className="table-toolbar">
          <h3 style={{ margin: 0 }}>{t("allJoinRequests")}</h3>
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
              <th>{t("name")}</th>
              <th>{t("field")}</th>
              <th>{t("city")}</th>
              <th>{t("email")}</th>
              <th>{t("submissionDate")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pager.pagedRows.map((r) => (
              <tr key={r.id}>
                <td
                  className="detail-name"
                  onClick={() => handleAction(r, "view")}
                >
                  {r.name}
                </td>
                <td>{r.field}</td>
                <td>{r.city}</td>
                <td>{r.email}</td>
                <td>{r.submissionDate}</td>
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
              <label>{t("name")}</label>
              <input type="text" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("field")}</label>
              <input type="text" value={editing.field} onChange={(e) => setEditing({ ...editing, field: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("city")}</label>
              <input type="text" value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("email")}</label>
              <input type="text" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("submissionDate")}</label>
              <input type="text" value={editing.submissionDate} onChange={(e) => setEditing({ ...editing, submissionDate: e.target.value })} />
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
