"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const TABS = [
  { id: "t7", label: "الخدمات الاستشارية لمنصة خبرة", n: "01", featured: true },
  { id: "t1", label: "استشارات الحوكمة", n: "02" },
  { id: "t2", label: "استشارات الامتثال", n: "03" },
  { id: "t3", label: "الاستشارات الإدارية", n: "04" },
  { id: "t4", label: "استقطاب المواهب الوظيفية", n: "05" },
  { id: "t5", label: "تحليل الأعمال والتخطيط", n: "06" },
  { id: "t6", label: "شبكات الأعمال والشؤون الاقتصادية", n: "07" },
];

export default function ServicesPage() {
  const [active, setActive] = useState("t7");

  useEffect(() => {
    document.title = "خدماتنا — مكتب المتخصصون في الحوكمة والامتثال للاستشارات الإدارية";
  }, []);

  return (
    <section
      className="section"
      id="services"
      style={{ background: "var(--white)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}
    >
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">خدماتنا</span>
          <h2>سبع خدمات استشارية متكاملة</h2>
          <p>اختر مجالاً من القائمة لاستعراض تفاصيل الخدمات المقدمة ضمنه.</p>
        </div>
        <div className="services-panel">
          <div className="service-tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`${active === tab.id ? "active " : ""}${tab.featured ? "service-tab-featured" : ""}`}
                onClick={() => setActive(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="n">{tab.n}</span>
              </button>
            ))}
          </div>
          <div className="service-content">
            <div className={`tab-panel expert-platform-panel${active === "t7" ? " active" : ""}`} id="t7">
              <span className="service-panel-kicker">خدمات منصة خبرة</span>
              <h3>الخدمات الاستشارية لمنصة خبرة</h3>
              <ul className="service-list service-list-detailed">
                <li>
                  <span className="b">١</span>
                  <span>
                    <strong>إعداد تقارير الخبرة القضائية</strong>تقديم دراسات فنية دقيقة حول القضايا والنزاعات الإدارية
                    المحالة من الدوائر القضائية، وصياغة حلول مهنية محايدة.
                  </span>
                </li>
                <li>
                  <span className="b">٢</span>
                  <span>
                    <strong>تقديم الآراء في النزاعات التعاقدية</strong>فحص وتحليل النزاعات المتعلقة بالعقود الإدارية
                    والهياكل التنظيمية وإجراءات التشغيل داخل المنشآت، ومقارنتها باللوائح والأنظمة المعمول بها.
                  </span>
                </li>
                <li>
                  <span className="b">٣</span>
                  <span>
                    <strong>تقديم العروض الفنية</strong>تقديم حلول واستشارات فنية من خبراء المنصة بناءً على معايير الطلب
                    المرفوع من الدائرة القضائية.
                  </span>
                </li>
              </ul>
              <Link href="/details#license-1" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
                عرض تفاصيل الاعتماد
              </Link>
            </div>
            <div className={`tab-panel${active === "t1" ? " active" : ""}`} id="t1">
              <h3>استشارات الحوكمة</h3>
              <ul className="service-list">
                <li>
                  <span className="b">١</span> تحليل الفجوات ودراسة الوضع الراهن
                </li>
                <li>
                  <span className="b">٢</span> صياغة لوائح وقواعد حوكمة الشركات
                </li>
                <li>
                  <span className="b">٣</span> تحديد الصلاحيات والمسؤوليات والأدوار الإدارية
                </li>
                <li>
                  <span className="b">٤</span> تقييم أداء مجالس الإدارة واللجان المنبثقة عنها
                </li>
                <li>
                  <span className="b">٥</span> إعداد اللوائح التنظيمية، وتطوير أدلة إجراءات العمل، وتقديم الاستشارات
                  للجان المنبثقة عن مجالس الإدارات
                </li>
              </ul>
              <Link href="/details#service-1" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
                عرض التفاصيل
              </Link>
            </div>
            <div className={`tab-panel${active === "t2" ? " active" : ""}`} id="t2">
              <h3>استشارات الامتثال</h3>
              <ul className="service-list">
                <li>
                  <span className="b">١</span> تصميم السياسات والإجراءات القانونية والتشغيلية
                </li>
                <li>
                  <span className="b">٢</span> مراجعة عقود العمل ولوائح العمل الداخلية لضمان الامتثال
                </li>
                <li>
                  <span className="b">٣</span> إعداد تقارير الإفصاح والتقارير الرقابية للجهات المختصة
                </li>
              </ul>
              <Link href="/details#service-2" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
                عرض التفاصيل
              </Link>
            </div>
            <div className={`tab-panel${active === "t3" ? " active" : ""}`} id="t3">
              <h3>الاستشارات الإدارية</h3>
              <ul className="service-list">
                <li>
                  <span className="b">١</span> التخطيط الاستراتيجي: إعداد الرؤية والرسالة، وتحديد الأهداف الاستراتيجية،
                  وبناء النماذج التشغيلية
                </li>
                <li>
                  <span className="b">٢</span> تطوير هياكل الأجور، وتصميم الأوصاف الوظيفية، وإدارة المواهب واستراتيجيات
                  التوظيف
                </li>
                <li>
                  <span className="b">٣</span> إدارة التغيير والتحول الرقمي
                </li>
                <li>
                  <span className="b">٤</span> إدارة الجودة والأداء: تصميم وتقييم مؤشرات الأداء المتوازن وتطبيق معايير
                  تحسين الجودة الشاملة
                </li>
                <li>
                  <span className="b">٥</span> إدارة الأزمات والمخاطر: وضع الخطط الاستباقية لضمان استمرارية الأعمال
                </li>
              </ul>
              <Link href="/details#service-3" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
                عرض التفاصيل
              </Link>
            </div>
            <div className={`tab-panel${active === "t4" ? " active" : ""}`} id="t4">
              <h3>استقطاب المواهب الوظيفية</h3>
              <ul className="service-list service-list-detailed">
                <li>
                  <span className="b">١</span>
                  <span>
                    <strong>قطاع التكنولوجيا والتقنية</strong>استقطاب خبرات متخصصة في البرمجيات والأمن السيبراني والذكاء
                    الاصطناعي.
                  </span>
                </li>
                <li>
                  <span className="b">٢</span>
                  <span>
                    <strong>التسويق الرقمي وتحليل البيانات</strong>توفير متخصصين في التسويق الإلكتروني وتحليل سلوك
                    المستهلك وإدارة الحملات الرقمية.
                  </span>
                </li>
                <li>
                  <span className="b">٣</span>
                  <span>
                    <strong>الهندسة بمختلف فروعها</strong>استقطاب كفاءات هندسية متخصصة تلائم احتياجات القطاعات التقنية
                    والصناعية.
                  </span>
                </li>
                <li>
                  <span className="b">٤</span>
                  <span>
                    <strong>الإدارة والقيادة التنفيذية</strong>توفير قيادات ومديري مشاريع وكفاءات إدارية عليا لدعم
                    استراتيجيات المؤسسات.
                  </span>
                </li>
                <li>
                  <span className="b">٥</span>
                  <span>
                    <strong>المبيعات وتطوير الأعمال</strong>استقطاب محترفي المبيعات وتطوير الأعمال القادرين على بناء
                    الفرص وتنمية الإيرادات.
                  </span>
                </li>
              </ul>
              <Link href="/details#service-4" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
                عرض التفاصيل
              </Link>
            </div>
            <div className={`tab-panel${active === "t5" ? " active" : ""}`} id="t5">
              <h3>تحليل الأعمال والتخطيط</h3>
              <ul className="service-list service-list-detailed">
                <li>
                  <span className="b">١</span>
                  <span>
                    <strong>تحديد نهج تحليل الأعمال</strong>اختيار المنهجية المناسبة لبيئة المنشأة وآلية تنفيذ المهام
                    وتخطيط الأنشطة المطلوبة.
                  </span>
                </li>
                <li>
                  <span className="b">٢</span>
                  <span>
                    <strong>إشراك أصحاب المصلحة</strong>تحديد أصحاب المصلحة وأدوارهم ومسؤولياتهم، وبناء آليات تواصل
                    فعّالة معهم.
                  </span>
                </li>
                <li>
                  <span className="b">٣</span>
                  <span>
                    <strong>تخطيط حوكمة تحليل الأعمال</strong>وضع القواعد المنظمة لاتخاذ القرارات وتغيير المتطلبات
                    واعتمادها.
                  </span>
                </li>
                <li>
                  <span className="b">٤</span>
                  <span>
                    <strong>تخطيط إدارة معلومات تحليل الأعمال</strong>تحديد كيفية تخزين وتنظيم وحفظ المعلومات والوثائق
                    المرتبطة بالمتطلبات.
                  </span>
                </li>
                <li>
                  <span className="b">٥</span>
                  <span>
                    <strong>تحديد أداء تحليل الأعمال</strong>وضع معايير واضحة لقياس جودة وفاعلية أعمال تحليل الأعمال
                    وتقييم نتائجها.
                  </span>
                </li>
              </ul>
              <Link href="/details#service-5" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
                عرض التفاصيل
              </Link>
            </div>
            <div className={`tab-panel${active === "t6" ? " active" : ""}`} id="t6">
              <h3>شبكات الأعمال والشؤون الاقتصادية والتجارية</h3>
              <ul className="service-list">
                <li>
                  <span className="b">١</span> الخدمات الإدارية والتجارية
                </li>
                <li>
                  <span className="b">٢</span> الإدارة المالية وبحوث الاستثمار
                </li>
                <li>
                  <span className="b">٣</span> التخطيط الاستراتيجي والتطوير
                </li>
                <li>
                  <span className="b">٤</span> التجارة الإلكترونية
                </li>
                <li>
                  <span className="b">٥</span> العلاقات العامة وبناء الشراكات
                </li>
              </ul>
              <Link href="/details#service-6" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
                عرض التفاصيل
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
