"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/styles/details.css";
import { DETAIL_ITEMS, DIR_STRUCTURE, type DetailItem } from "@/lib/data/details-content";

function DetailView({ item }: { item: DetailItem }) {
  return (
    <>
      <section className="detail-hero">
        <div className="wrap">
          <div className="breadcrumbs">
            <Link href="/">الرئيسية</Link>
            <span>/</span>
            <Link href="/details">التفاصيل</Link>
            <span>/</span>
            <span>{item.category}</span>
          </div>
          <span className="eyebrow" style={{ fontSize: ".95rem" }}>
            {item.category}
          </span>
          <h1 style={{ marginTop: 12 }}>{item.title}</h1>
          <p className="lead">{item.lead}</p>
          <div className="detail-actions">
            <Link href={item.cta.href} className="btn btn-primary">
              {item.cta.text}
            </Link>
            <Link href="/" className="btn btn-outline">
              العودة إلى الرئيسية
            </Link>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <div className="wrap">
          <div className="detail-grid">
            <div>
              <div className="divider" />
              <h2>ما يشمله هذا البند</h2>
              <ul className="detail-list">
                {item.bullets.map((b, i) => (
                  <li key={i}>
                    <span className="num">{i + 1}</span>
                    <div>{b}</div>
                  </li>
                ))}
              </ul>
              {item.features && item.features.length > 0 ? (
                <div className="feature-grid">
                  {item.features.map((f, i) => (
                    <div className="feature-card" key={i}>
                      <div className="mark" />
                      <h4>{f.title}</h4>
                      <p>{f.desc}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <aside className="detail-aside">
              <h3>{item.aside.title}</h3>
              {item.aside.price ? (
                <div className="price">
                  {item.aside.price} <small>{item.aside.period}</small>
                </div>
              ) : null}
              <ul>
                {item.aside.points.map((p, i) => (
                  <li key={i}>
                    <span className="check">
                      <svg viewBox="0 0 24 24">
                        <polyline points="4,12.5 9.5,18 20,6.5" />
                      </svg>
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href={item.cta.href}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: 20 }}
              >
                {item.cta.text}
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

function DirectoryView() {
  return (
    <section className="directory">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">صفحات التفاصيل</span>
          <h1>استعرض تفاصيل كل بند</h1>
          <p>اختر أحد البنود التالية لقراءة التفاصيل الكاملة حول الخدمة أو المجال أو الباقة.</p>
        </div>
        {DIR_STRUCTURE.map((group) => (
          <div className="dir-category" key={group.id}>
            <h2>{group.title}</h2>
            <div className="dir-grid">
              {group.ids.map((id) => {
                const item = DETAIL_ITEMS[id];
                return (
                  <Link className="dir-card" href={`/details#${id}`} key={id}>
                    <h3>{item.title}</h3>
                    <p>{item.lead}</p>
                    <span className="dir-link">عرض التفاصيل</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DetailsPage() {
  const [hash, setHash] = useState("");

  useEffect(() => {
    const read = () => setHash(window.location.hash.replace("#", "").trim());
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  useEffect(() => {
    const item = DETAIL_ITEMS[hash];
    document.title = item
      ? `${item.title} — مكتب المتخصصون في الحوكمة والامتثال`
      : "التفاصيل — مكتب المتخصصون في الحوكمة والامتثال";
  }, [hash]);

  const item = DETAIL_ITEMS[hash];

  return <main id="detailMain">{item ? <DetailView item={item} /> : <DirectoryView />}</main>;
}
