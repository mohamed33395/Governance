"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "@/styles/detail.css";

/* ===== Optional legacy global (client-activity.js in the static site) ===== */
interface ActivityConsultation {
  title: string;
  consultant?: string;
  date?: string;
  deadline?: string;
  status?: string;
}
interface ActivityBooking {
  package?: string;
  specialist?: { name: string; spec?: string } | null;
  date?: string;
  time?: string;
  location?: { name?: string } | null;
  meetLink?: string;
  price?: number;
  status?: string;
}
interface ActivityReport {
  title: string;
  type?: string;
  period?: string;
  date?: string;
  status?: string;
  client?: string;
}
interface ClientActivityData {
  consultations?: ActivityConsultation[];
  bookings?: ActivityBooking[];
  reports?: ActivityReport[];
}
interface ActivityEngagement {
  client: string;
  kind: string;
  title: string;
  date?: string;
  status?: string;
}
interface ConsultantActivityData {
  engagements?: ActivityEngagement[];
  reports?: ActivityReport[];
}
interface ClientActivityApi {
  getClientActivity: (name: string) => ClientActivityData | null;
  getConsultantActivity: (name: string) => ConsultantActivityData | null;
}
function clientActivityApi(): ClientActivityApi | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ClientActivity?: ClientActivityApi }).ClientActivity || null;
}

interface DetailField {
  label: string;
  value: string;
}
interface RecordDetail {
  name?: string;
  image?: string;
  fields?: DetailField[];
  payment?: boolean;
  receiptImg?: string;
  client?: ClientActivityData;
  consultant?: ConsultantActivityData;
}

const ICONS = {
  report: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  ),
  booking: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="4" width="18" height="17" rx="1" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
    </svg>
  ),
  consultation: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="7" width="18" height="13" rx="1" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

const BACK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

function statusBadge(text?: string) {
  const txt = String(text == null || text === "" ? "—" : text).trim() || "—";
  const ok = ["نشط", "مقبول", "جاهز", "مكتمل", "مكتملة"];
  const bad = ["منتهي", "مرفوض", "متأخرة", "مسودة", "مشغول", "ملغي"];
  let cls = "pending";
  if (ok.includes(txt)) cls = "approved";
  else if (bad.includes(txt)) cls = "rejected";
  return <span className={`badge ${cls}`}>{txt}</span>;
}

function arNum(n: number) {
  return Number(n).toLocaleString("ar-EG");
}

interface Section {
  title: string;
  count?: number;
  el: ReactNode;
}

function ActivitySection({
  title,
  headers,
  rows,
  emptyText,
  icon,
  subText,
}: {
  title: string;
  headers: string[];
  rows: ReactNode[][];
  emptyText: string;
  icon: ReactNode;
  subText?: string;
}) {
  return (
    <section className="activity-card">
      <div className="activity-head">
        <div className="activity-title">
          {icon}
          <div>
            <h2>{title}</h2>
            {subText && <span className="activity-sub">{subText}</span>}
          </div>
        </div>
        <span className="count-chip">{arNum(rows.length)}</span>
      </div>
      {!rows.length ? (
        <div className="empty-note">{emptyText}</div>
      ) : (
        <div className="table-scroll">
          <table className="sub-table">
            <thead>
              <tr>
                {headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function clientSections(client: ClientActivityData): Section[] {
  const consRows = (client.consultations || []).map((c) => [
    c.title,
    c.consultant || "—",
    c.date || "—",
    c.deadline || "—",
    statusBadge(c.status),
  ]);
  const bookingRows = (client.bookings || []).map((b) => {
    const specialist = b.specialist ? b.specialist.name + (b.specialist.spec ? " — " + b.specialist.spec : "") : "—";
    const when = (b.date || "—") + (b.time ? " | " + b.time : "");
    const price = (b.price ? Number(b.price).toLocaleString("ar-SA") : "٠") + " ريال";
    return [
      b.package || "استشارة",
      specialist,
      when,
      <>
        {b.location && b.location.name ? b.location.name : "—"}
        {b.meetLink && (
          <>
            <br />
            <a href={b.meetLink} target="_blank" rel="noopener">
              رابط الاجتماع
            </a>
          </>
        )}
      </>,
      price,
      statusBadge(b.status),
    ];
  });
  const reportRows = (client.reports || []).map((r) => [r.title, r.type, r.period, r.date, statusBadge(r.status)]);
  return [
    {
      title: "استشارات العميل",
      count: consRows.length,
      el: (
        <ActivitySection
          title="استشارات العميل"
          headers={["الاستشارة / المشروع", "المستشار المسؤول", "تاريخ البدء", "الموعد النهائي", "الحالة"]}
          rows={consRows}
          emptyText="لا توجد استشارات لهذا العميل."
          icon={ICONS.consultation}
        />
      ),
    },
    {
      title: "حجوزات العميل",
      count: bookingRows.length,
      el: (
        <ActivitySection
          title="حجوزات العميل"
          headers={["الباقة / الخدمة", "المستشار", "التاريخ والوقت", "الموقع", "المبلغ", "الحالة"]}
          rows={bookingRows}
          emptyText="لا توجد حجوزات لهذا العميل."
          icon={ICONS.booking}
        />
      ),
    },
    {
      title: "تقارير العميل",
      count: reportRows.length,
      el: (
        <ActivitySection
          title="تقارير العميل"
          headers={["اسم التقرير", "النوع", "الفترة", "تاريخ الإنشاء", "الحالة"]}
          rows={reportRows}
          emptyText="لا توجد تقارير لهذا العميل."
          icon={ICONS.report}
        />
      ),
    },
  ];
}

function consultantSections(consultant: ConsultantActivityData): Section[] {
  const engRows = (consultant.engagements || []).map((e) => [e.client, e.kind, e.title, e.date || "—", statusBadge(e.status)]);
  const repRows = (consultant.reports || []).map((r) => [r.client, r.title, r.type, r.period, r.date, statusBadge(r.status)]);
  return [
    {
      title: "العملاء والارتباطات",
      count: engRows.length,
      el: (
        <ActivitySection
          title="العملاء والارتباطات"
          headers={["العميل", "النوع", "البيان", "التوقيت", "الحالة"]}
          rows={engRows}
          emptyText="لا توجد ارتباطات لهذا المستشار."
          icon={ICONS.consultation}
        />
      ),
    },
    {
      title: "التقارير المرتبطة",
      count: repRows.length,
      el: (
        <ActivitySection
          title="التقارير المرتبطة"
          headers={["العميل", "اسم التقرير", "النوع", "الفترة", "تاريخ الإنشاء", "الحالة"]}
          rows={repRows}
          emptyText="لا توجد تقارير مرتبطة بهذا المستشار."
          icon={ICONS.report}
        />
      ),
    },
  ];
}

function Donut({ value, total }: { value: number; total: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const size = 56;
    const scale = 2;
    canvas.width = size * scale;
    canvas.height = size * scale;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;
    ctx.lineWidth = 7;
    ctx.strokeStyle = "rgba(15,42,29,.08)";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#C19B4A";
    ctx.lineCap = "round";
    const frac = Math.max(0.02, value / total);
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
  }, [value, total]);
  return <canvas ref={ref} />;
}

function DetailContent() {
  const params = useSearchParams();
  const [data, setData] = useState<RecordDetail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("recordDetail");
      if (stored) setData(JSON.parse(stored));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  const isPayment = !!(data && data.payment);
  const recordName = (data && data.name) || params.get("name") || "";

  const clientActivity = useMemo(() => {
    if (isPayment) return null;
    if (data && data.client) return data.client;
    const api = clientActivityApi();
    return recordName && api ? api.getClientActivity(recordName) : null;
  }, [data, isPayment, recordName]);

  const consultantActivity = useMemo(() => {
    if (isPayment) return null;
    if (data && data.consultant) return data.consultant;
    const api = clientActivityApi();
    return recordName && api ? api.getConsultantActivity(recordName) : null;
  }, [data, isPayment, recordName]);

  useEffect(() => {
    if (!loaded) return;
    document.title = (data?.fields || recordName) ? `${recordName || "التفاصيل"} — التفاصيل` : "لا توجد بيانات";
  }, [loaded, data, recordName]);

  const sections: Section[] = [];
  let miniCharts: Section[] | null = null;
  if (data?.fields || recordName) {
    if (data?.fields) {
      sections.push({
        title: "البيانات",
        el: (
          <div className="detail-card">
            {data.image && <img className="detail-avatar" src={data.image} alt={data.name || ""} />}
            <div className="detail-grid">
              {data.fields.map((f, i) => (
                <div className="detail-item" key={i}>
                  <label>{f.label}</label>
                  <span>{f.value}</span>
                </div>
              ))}
            </div>
            <div className="actions">
              <Link href="/admin" className="back-btn" aria-label="رجوع إلى لوحة التحكم" title="رجوع">
                {BACK_ICON}
              </Link>
            </div>
          </div>
        ),
      });
    }
    if (data?.receiptImg) {
      sections.push({
        title: "الإيصال",
        el: (
          <section className="activity-card">
            <div className="activity-head">
              <div className="activity-title">
                {ICONS.report}
                <div>
                  <h2>الإيصال</h2>
                </div>
              </div>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <img src={data.receiptImg} alt="إيصال" className="receipt-img" style={{ marginTop: 0 }} />
              <div className="actions" style={{ marginTop: 16 }}>
                <a href={data.receiptImg} download="receipt.png" className="btn btn-outline">
                  تنزيل الإيصال
                </a>
              </div>
            </div>
          </section>
        ),
      });
    }
    let tableSections: Section[] = [];
    if (clientActivity) tableSections = clientSections(clientActivity);
    if (consultantActivity) tableSections = tableSections.concat(consultantSections(consultantActivity));
    sections.push(...tableSections);
    miniCharts = tableSections.length > 1 ? tableSections : null;
  }

  const hasContent = !!(data?.fields || recordName);
  const total = (miniCharts || []).reduce((s, i) => s + (i.count || 0), 0) || 1;

  return (
    <div className="detail-page">
      <header className="site-header">
        <div className="nav-row">
          <Link href="/" className="brand">
            <img src="logo_icon.png" alt="شعار المكتب" />
            <span>مكتب المتخصصون في الحوكمة والامتثال</span>
          </Link>
          <nav className={`main-nav${navOpen ? " open" : ""}`} id="mainNav">
            <Link href="/services">خدماتنا</Link>
            <Link href="/packages">الباقات</Link>
            <Link href="/about">من نحن</Link>
            <Link href="/team">فريق العمل</Link>
            <Link href="/contact">تواصل معنا</Link>
          </nav>
          <div className="header-actions">
            <Link href="/admin" className="back-btn" aria-label="رجوع إلى لوحة التحكم" title="رجوع">
              {BACK_ICON}
            </Link>
            <button className="menu-toggle" id="menuToggle" type="button" aria-label="القائمة" onClick={() => setNavOpen((v) => !v)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="wrap" id="detailWrap">
          {loaded && !hasContent && (
            <div className="empty">
              <h2>لا توجد بيانات</h2>
              <p>يرجى العودة إلى لوحة التحكم واختيار سجل.</p>
              <Link href="/admin" className="btn btn-primary" style={{ marginTop: 16 }}>
                لوحة التحكم
              </Link>
            </div>
          )}
          {hasContent && (
            <>
              <div className="page-head">
                <h1>{recordName || "التفاصيل"}</h1>
                <div className="subtitle">تفاصيل السجل من لوحة التحكم</div>
              </div>
              {miniCharts && (
                <div className="mini-charts">
                  {miniCharts.map((it) => (
                    <div className="mini-chart" key={it.title}>
                      <Donut value={it.count || 0} total={total} />
                      <div className="mini-chart-info">
                        <strong>{it.count || 0}</strong>
                        <span>{it.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {sections.length > 1 ? (
                <div>
                  <div className="detail-tabs">
                    {sections.map((s, i) => (
                      <button key={s.title} type="button" className={i === activeTab ? "active" : ""} onClick={() => setActiveTab(i)}>
                        {s.title}
                      </button>
                    ))}
                  </div>
                  <div className="detail-tab-dashes">
                    {sections.map((s, i) => (
                      <span key={s.title} className={i === activeTab ? "active" : ""} />
                    ))}
                  </div>
                  <div className="tabbed-sections">
                    {sections.map((s, i) => (
                      <div key={s.title} className={i === activeTab ? "active" : ""}>
                        {s.el}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                sections.map((s) => <div key={s.title}>{s.el}</div>)
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DetailPage() {
  return (
    <Suspense fallback={null}>
      <DetailContent />
    </Suspense>
  );
}
