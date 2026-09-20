"use client";

import { useEffect } from "react";

const TEAM = [
  {
    name: "عبدالله العتيبي",
    role: "شريك استشاري",
    field: "استشارات الحوكمة",
    img: "https://images.unsplash.com/photo-1758876204244-930299843f07?w=150&h=150&fit=crop&crop=faces&fm=jpg&q=80",
  },
  {
    name: "فيصل الدوسري",
    role: "مستشار أول",
    field: "الاستشارات الإدارية",
    img: "https://images.unsplash.com/photo-1758874574397-e56dfcfc116d?w=150&h=150&fit=crop&crop=faces&fm=jpg&q=80",
  },
  {
    name: "سلطان الشهراني",
    role: "رئيس قسم الامتثال",
    field: "الامتثال والمخاطر",
    img: "https://images.unsplash.com/photo-1758874573370-e5496b20794b?w=150&h=150&fit=crop&crop=faces&fm=jpg&q=80",
  },
  {
    name: "نايف القحطاني",
    role: "مدير المواهب",
    field: "استقطاب المواهب",
    img: "https://images.unsplash.com/photo-1756412066334-faa0ba38261f?w=150&h=150&fit=crop&crop=faces&fm=jpg&q=80",
  },
];

export default function TeamPage() {
  useEffect(() => {
    document.title = "فريق العمل — مكتب المتخصصون في الحوكمة والامتثال للاستشارات الإدارية";
  }, []);

  return (
    <section className="section" id="team">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">فريق العمل</span>
          <h2>الاستراتيجيون خلف المكتب</h2>
          <p>فريق عمل وهمي لأغراض العرض — يمكن استبدال البيانات بالفريق الفعلي لاحقاً.</p>
        </div>
        <div className="team-grid">
          {TEAM.map((m) => (
            <div className="team-card" key={m.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="avatar" src={m.img} alt={m.name} loading="lazy" />
              <h4>{m.name}</h4>
              <div className="role">{m.role}</div>
              <div className="field-tag">{m.field}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
