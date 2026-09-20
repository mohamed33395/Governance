"use client";

import { useEffect } from "react";

export default function AboutPage() {
  useEffect(() => {
    document.title = "من نحن — مكتب المتخصصون في الحوكمة والامتثال للاستشارات الإدارية";
  }, []);

  return (
    <>
      {/* VISION / MISSION / VALUES */}
      <section className="section" id="about">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">من نحن</span>
            <h2>رؤيتنا ورسالتنا وقيمنا</h2>
          </div>
          <div className="vm-grid">
            <div className="vm-card">
              <div className="divider" />
              <span className="eyebrow" style={{ fontSize: ".85rem" }}>
                الرؤية
              </span>
              <p style={{ marginTop: 14 }}>
                نتطلع إلى تحقيق الريادة في مجال تقديم خدمات الاستشارات الإدارية وحوكمة الشركات والامتثال لرواد الأعمال،
                لتحقيق أعلى عائد من الربحية والاستقرار الوظيفي والاقتصادي، والعمل بمفاهيم تحقق ثبات الاستثمار لمنظمات
                الأعمال ومنسوبيها.
              </p>
            </div>
            <div className="vm-card">
              <div className="divider" />
              <span className="eyebrow" style={{ fontSize: ".85rem" }}>
                الرسالة
              </span>
              <p style={{ marginTop: 14 }}>نحرص على بناء فريق من الاستراتيجيين قادر على تحقيق أفضل مستويات الأداء والربحية.</p>
            </div>
          </div>
          <div className="values-row">
            <div className="value-item">
              <div className="mark" />
              <h4>التفوق</h4>
            </div>
            <div className="value-item">
              <div className="mark" />
              <h4>الأثر</h4>
            </div>
            <div className="value-item">
              <div className="mark" />
              <h4>المبادرة</h4>
            </div>
            <div className="value-item">
              <div className="mark" />
              <h4>الريادة</h4>
            </div>
            <div className="value-item">
              <div className="mark" />
              <h4>التميز</h4>
            </div>
            <div className="value-item">
              <div className="mark" />
              <h4>حرص المالك</h4>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERT */}
      <section className="section" id="expert">
        <div className="wrap">
          <div className="expert-grid">
            <div className="expert-card">
              <div className="expert-photo">
                <div className="expert-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/WhatsApp Image 2026-09-07 at 4.14.04 PM.png" alt="المستشار عبدالكريم بن خالد الغامدي" />
                </div>
              </div>
              <div className="expert-info">
                <span className="eyebrow">عن الخبير</span>
                <h2>المستشار عبدالكريم بن خالد الغامدي</h2>
                <span className="expert-name-en">Consultant. Abdul Kareem Al-Ghamdi</span>
                <span className="expert-role">خبير الاستشارات الإدارية وحوكمة الشركات والامتثال</span>
                <p>حياكم الله في منصة المتخصصين في الحوكمة والامتثال للاستشارات الإدارية.</p>
                <div className="expert-stats">
                  <div>
                    <strong>+٢٥</strong>
                    <span>سنة خبرة</span>
                  </div>
                  <div>
                    <strong>+٥٠٠</strong>
                    <span>استشارة موثقة</span>
                  </div>
                  <div>
                    <strong>+١٢٠</strong>
                    <span>منشأة تمت مرافقتها</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
