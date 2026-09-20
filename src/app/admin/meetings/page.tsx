"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
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
import type { AdminMeeting, ClientRecord, Consultant } from "@/types/admin-dashboard";

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

const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 9;
  const label = `${h <= 12 ? h : h - 12}:00 ${h < 12 ? "ص" : "م"}`;
  return label;
});

function generateMeetLink() {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const seg = (n: number) => Array.from({ length: n }, () => letters[Math.floor(Math.random() * 26)]).join("");
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

function formatMeetingDate(val: string, lang: string) {
  try {
    return new Date(val + "T00:00:00").toLocaleDateString(lang === "en" ? "en-GB" : "ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return val;
  }
}

export default function AdminMeetingsPage() {
  const { token } = useAdminAuth();
  const { t, lang } = useI18n();

  const fetcher = useCallback(
    () => (token ? adminDashboardService.getMeetings(token) : Promise.reject()),
    [token]
  );
  const { data: meetings, setData: setMeetings } = useApiData<AdminMeeting[]>(fetcher, []);

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
  const pager = useTablePager(meetings, search, (m) =>
    [m.title, m.clientName, m.consultant, m.dateLabel, m.time, m.link].join(" ")
  );

  const [addOpen, setAddOpen] = useState(false);
  const [addFeedback, setAddFeedback] = useState("");
  const addFormRef = useRef<HTMLFormElement>(null);

  const deleteMeeting = (id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    if (token) adminDashboardService.deleteMeeting(token, id).catch(() => {});
  };

  const submitAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") || "");
    const clientName = String(fd.get("client") || "");
    const consultant = String(fd.get("consultant") || "");
    const date = String(fd.get("date") || "");
    const time = String(fd.get("time") || "");
    const client = clients.find((c) => c.name === clientName || c.email === clientName);
    const meeting: AdminMeeting = {
      id: `m_${Date.now()}`,
      title,
      clientName: client ? client.name : clientName,
      clientEmail: client?.email,
      consultant,
      date,
      dateLabel: formatMeetingDate(date, lang),
      time,
      link: generateMeetLink(),
    };
    setMeetings((prev) => [meeting, ...prev]);
    if (token) adminDashboardService.createMeeting(token, meeting).catch(() => {});
    setAddFeedback(t("meetingSaved"));
    addFormRef.current?.reset();
    setTimeout(() => {
      setAddOpen(false);
      setAddFeedback("");
    }, 1600);
  };

  return (
    <>
      <div className="panel-card">
        <div className="table-toolbar">
          <h3 style={{ margin: 0 }}>{t("meetingsTitle")}</h3>
          <TableSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              pager.resetPage();
            }}
          />
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setAddOpen(true)}>
            {t("addMeeting")}
          </button>
        </div>
        <table className="data-table no-actions" id="meetingsTable">
          <thead>
            <tr>
              <th>{t("meetingTitle")}</th>
              <th>{t("client")}</th>
              <th>{t("consultant")}</th>
              <th>{t("date")}</th>
              <th>{t("time")}</th>
              <th>{t("meetingLink")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pager.pagedRows.map((m) => (
              <tr key={m.id}>
                <td>{m.title}</td>
                <td>{m.clientName}</td>
                <td>{m.consultant}</td>
                <td>{m.dateLabel}</td>
                <td>{m.time}</td>
                <td>
                  <a className="meet-link" href={m.link} target="_blank" rel="noopener">
                    {m.link.replace("https://", "")}
                  </a>
                </td>
                <td>
                  <button type="button" className="actions-toggle" onClick={() => deleteMeeting(m.id)}>
                    {t("delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {meetings.length === 0 && (
          <p className="notif-empty" id="meetingsEmpty">
            {t("noMeetings")}
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

      {/* ADD MEETING MODAL */}
      <AdminModal id="addMeetingModal" open={addOpen} onClose={() => setAddOpen(false)} maxWidth={540}>
        <h3>{t("addMeeting")}</h3>
        <form className="edit-form" ref={addFormRef} onSubmit={submitAdd}>
          <div className="field">
            <label>{t("meetingTitle")}</label>
            <input type="text" name="title" required />
          </div>
          <div className="field">
            <label>{t("client")}</label>
            <select name="client" id="meetingClient" required defaultValue="">
              <option value="" disabled>
                {t("selectOption")}
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.email || c.name}>
                  {c.email ? `${c.name} — ${c.email}` : c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t("consultant")}</label>
            <select name="consultant" id="meetingConsultant" required defaultValue="">
              <option value="" disabled>
                {t("selectOption")}
              </option>
              {consultants.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t("date")}</label>
            <input type="date" name="date" required />
          </div>
          <div className="field">
            <label>{t("time")}</label>
            <select name="time" id="meetingTime" required defaultValue="">
              <option value="" disabled>
                {t("selectOption")}
              </option>
              {TIME_SLOTS.map((ts) => (
                <option key={ts} value={ts}>
                  {ts}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            {t("saveMeeting")}
          </button>
          <ModalCancelButton onClose={() => setAddOpen(false)} style={{ marginInlineStart: 8 }} />
        </form>
        <p className={`form-feedback${addFeedback ? " ok" : ""}`}>{addFeedback}</p>
      </AdminModal>
    </>
  );
}
