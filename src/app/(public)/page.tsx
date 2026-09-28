"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";

const SERVICE_TABS = [
  { id: "t7", n: "01", featured: true },
  { id: "t1", n: "02" },
  { id: "t2", n: "03" },
  { id: "t3", n: "04" },
  { id: "t4", n: "05" },
  { id: "t5", n: "06" },
  { id: "t6", n: "07" },
] as const;

export default function HomePage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<string>("t7");

  return (
    <>
      {/* HERO */}
      <section className="hero hero-new" id="top">
        <div className="wrap">
          <div className="hero-sketch-layout">
            <div className="hero-left-column">
              <div className="hero-left-panel">
                <p className="hero-certified">
                  <span className="hero-certified-icon" aria-hidden="true">
                    ✓
                  </span>
                  <span>{t("licenseText")}</span>
                  <Link href="/details#license-1" className="hero-certified-link">
                    {t("licenseLink")}
                  </Link>
                </p>
                <p className="hero-definition">
                  <span className="hero-definition-accent">الحوكمة</span> من منظورنا أن نعمل على إيجاد وتأهيل نظام
                  متكامل من القواعد، والسياسات، والممارسات التي تُوجّه وتُرقّي وتحدّث بها منظمات الأعمال لضمان تحقيق{" "}
                  <span className="hero-definition-highlight">حفظ الاستثمار واستقراره</span>، والشفافية، والمساءلة،
                  وحماية حقوق جميع أصحاب المصلحة والشأن.
                </p>
              </div>
            </div>
            <div className="hero-logo-big">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/loge_leger-.png" alt={t("fullLogoAlt")} />
              <span className="hero-logo-tagline">عالم جديد من الحوكمة</span>
            </div>
          </div>
          <div className="hero-actions-bottom">
            <Link href="/packages" className="btn btn-primary">
              {t("bookConsultation")}
            </Link>
            <Link href="/login" className="btn btn-outline">
              {t("login")}
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section
        className="section"
        id="services"
        style={{ background: "var(--white)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t("servicesEyebrow")}</span>
            <h2>سبع خدمات استشارية متكاملة</h2>
            <p>{t("servicesDesc")}</p>
          </div>
          <div className="services-panel">
            <div className="service-tabs" role="tablist">
              <button
                className={`service-tab-featured${activeTab === "t7" ? " active" : ""}`}
                onClick={() => setActiveTab("t7")}
              >
                <span>الخدمات الاستشارية لمنصة خبرة</span>
                <span className="n">01</span>
              </button>
              <button className={activeTab === "t1" ? "active" : undefined} onClick={() => setActiveTab("t1")}>
                <span>{t("service1")}</span>
                <span className="n">02</span>
              </button>
              <button className={activeTab === "t2" ? "active" : undefined} onClick={() => setActiveTab("t2")}>
                <span>{t("service2")}</span>
                <span className="n">03</span>
              </button>
              <button className={activeTab === "t3" ? "active" : undefined} onClick={() => setActiveTab("t3")}>
                <span>{t("service3")}</span>
                <span className="n">04</span>
              </button>
              <button className={activeTab === "t4" ? "active" : undefined} onClick={() => setActiveTab("t4")}>
                <span>{t("service4")}</span>
                <span className="n">05</span>
              </button>
              <button className={activeTab === "t5" ? "active" : undefined} onClick={() => setActiveTab("t5")}>
                <span>{t("service5")}</span>
                <span className="n">06</span>
              </button>
              <button className={activeTab === "t6" ? "active" : undefined} onClick={() => setActiveTab("t6")}>
                <span>{t("service6")}</span>
                <span className="n">07</span>
              </button>
            </div>
            <div className="service-content">
              <div className={`tab-panel expert-platform-panel${activeTab === "t7" ? " active" : ""}`} id="t7">
                <span className="service-panel-kicker">خدمات منصة خبرة</span>
                <h3>الخدمات الاستشارية لمنصة خبرة</h3>
                <ul className="service-list service-list-detailed">
                  <li>
                    <span className="b">١</span>
                    <span>
                      <strong>إعداد تقارير الخبرة القضائية</strong>
                      تقديم دراسات فنية دقيقة حول القضايا والنزاعات الإدارية المحالة من الدوائر القضائية، وصياغة حلول
                      مهنية محايدة.
                    </span>
                  </li>
                  <li>
                    <span className="b">٢</span>
                    <span>
                      <strong>تقديم الآراء في النزاعات التعاقدية</strong>
                      فحص وتحليل النزاعات المتعلقة بالعقود الإدارية والهياكل التنظيمية وإجراءات التشغيل داخل المنشآت،
                      ومقارنتها باللوائح والأنظمة المعمول بها.
                    </span>
                  </li>
                  <li>
                    <span className="b">٣</span>
                    <span>
                      <strong>تقديم العروض الفنية</strong>
                      تقديم حلول واستشارات فنية من خبراء المنصة بناءً على معايير الطلب المرفوع من الدائرة القضائية.
                    </span>
                  </li>
                </ul>
                <Link href="/details#license-1" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
                  عرض تفاصيل الاعتماد
                </Link>
              </div>
              <div className={`tab-panel${activeTab === "t1" ? " active" : ""}`} id="t1">
                <h3>{t("service1")}</h3>
                <ul className="service-list">
                  <li>
                    <span className="b">١</span> {t("s1i1")}
                  </li>
                  <li>
                    <span className="b">٢</span> {t("s1i2")}
                  </li>
                  <li>
                    <span className="b">٣</span> {t("s1i3")}
                  </li>
                  <li>
                    <span className="b">٤</span> {t("s1i4")}
                  </li>
                  <li>
                    <span className="b">٥</span> {t("s1i5")}
                  </li>
                </ul>
                <Link href="/details#service-1" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
                  {t("details")}
                </Link>
              </div>
              <div className={`tab-panel${activeTab === "t2" ? " active" : ""}`} id="t2">
                <h3>{t("service2")}</h3>
                <ul className="service-list">
                  <li>
                    <span className="b">١</span> {t("s2i1")}
                  </li>
                  <li>
                    <span className="b">٢</span> {t("s2i2")}
                  </li>
                  <li>
                    <span className="b">٣</span> {t("s2i3")}
                  </li>
                </ul>
                <Link href="/details#service-2" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
                  {t("details")}
                </Link>
              </div>
              <div className={`tab-panel${activeTab === "t3" ? " active" : ""}`} id="t3">
                <h3>{t("service3")}</h3>
                <ul className="service-list">
                  <li>
                    <span className="b">١</span> {t("s3i1")}
                  </li>
                  <li>
                    <span className="b">٢</span> {t("s3i2")}
                  </li>
                  <li>
                    <span className="b">٣</span> {t("s3i3")}
                  </li>
                  <li>
                    <span className="b">٤</span> {t("s3i4")}
                  </li>
                  <li>
                    <span className="b">٥</span> {t("s3i5")}
                  </li>
                </ul>
                <Link href="/details#service-3" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
                  {t("details")}
                </Link>
              </div>
              <div className={`tab-panel${activeTab === "t4" ? " active" : ""}`} id="t4">
                <h3>{t("service4")}</h3>
                <ul className="service-list service-list-detailed">
                  <li>
                    <span className="b">١</span>
                    <span>
                      <strong>قطاع التكنولوجيا والتقنية</strong>
                      استقطاب خبرات متخصصة في البرمجيات والأمن السيبراني والذكاء الاصطناعي.
                    </span>
                  </li>
                  <li>
                    <span className="b">٢</span>
                    <span>
                      <strong>التسويق الرقمي وتحليل البيانات</strong>
                      توفير متخصصين في التسويق الإلكتروني وتحليل سلوك المستهلك وإدارة الحملات الرقمية.
                    </span>
                  </li>
                  <li>
                    <span className="b">٣</span>
                    <span>
                      <strong>الهندسة بمختلف فروعها</strong>
                      استقطاب كفاءات هندسية متخصصة تلائم احتياجات القطاعات التقنية والصناعية.
                    </span>
                  </li>
                  <li>
                    <span className="b">٤</span>
                    <span>
                      <strong>الإدارة والقيادة التنفيذية</strong>
                      توفير قيادات ومديري مشاريع وكفاءات إدارية عليا لدعم استراتيجيات المؤسسات.
                    </span>
                  </li>
                  <li>
                    <span className="b">٥</span>
                    <span>
                      <strong>المبيعات وتطوير الأعمال</strong>
                      استقطاب محترفي المبيعات وتطوير الأعمال القادرين على بناء الفرص وتنمية الإيرادات.
                    </span>
                  </li>
                </ul>
                <Link href="/details#service-4" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
                  {t("details")}
                </Link>
              </div>
              <div className={`tab-panel${activeTab === "t5" ? " active" : ""}`} id="t5">
                <h3>{t("service5")}</h3>
                <ul className="service-list service-list-detailed">
                  <li>
                    <span className="b">١</span>
                    <span>
                      <strong>تحديد نهج تحليل الأعمال</strong>
                      اختيار المنهجية المناسبة لبيئة المنشأة وآلية تنفيذ المهام وتخطيط الأنشطة المطلوبة.
                    </span>
                  </li>
                  <li>
                    <span className="b">٢</span>
                    <span>
                      <strong>إشراك أصحاب المصلحة</strong>
                      تحديد أصحاب المصلحة وأدوارهم ومسؤولياتهم، وبناء آليات تواصل فعّالة معهم.
                    </span>
                  </li>
                  <li>
                    <span className="b">٣</span>
                    <span>
                      <strong>تخطيط حوكمة تحليل الأعمال</strong>
                      وضع القواعد المنظمة لاتخاذ القرارات وتغيير المتطلبات واعتمادها.
                    </span>
                  </li>
                  <li>
                    <span className="b">٤</span>
                    <span>
                      <strong>تخطيط إدارة معلومات تحليل الأعمال</strong>
                      تحديد كيفية تخزين وتنظيم وحفظ المعلومات والوثائق المرتبطة بالمتطلبات.
                    </span>
                  </li>
                  <li>
                    <span className="b">٥</span>
                    <span>
                      <strong>تحديد أداء تحليل الأعمال</strong>
                      وضع معايير واضحة لقياس جودة وفاعلية أعمال تحليل الأعمال وتقييم نتائجها.
                    </span>
                  </li>
                </ul>
                <Link href="/details#service-5" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
                  {t("details")}
                </Link>
              </div>
              <div className={`tab-panel${activeTab === "t6" ? " active" : ""}`} id="t6">
                <h3>شبكات الأعمال والشؤون الاقتصادية والتجارية</h3>
                <ul className="service-list">
                  <li>
                    <span className="b">١</span> {t("s6i1")}
                  </li>
                  <li>
                    <span className="b">٢</span> {t("s6i2")}
                  </li>
                  <li>
                    <span className="b">٣</span> {t("s6i3")}
                  </li>
                  <li>
                    <span className="b">٤</span> {t("s6i4")}
                  </li>
                  <li>
                    <span className="b">٥</span> {t("s6i5")}
                  </li>
                </ul>
                <Link href="/details#service-6" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
                  {t("details")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Saudi Riyal symbol (official SAMA glyph) */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <symbol id="riyal-symbol" viewBox="0 0 1124.14 1256.39">
            <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" />
            <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" />
          </symbol>
        </defs>
      </svg>

      {/* PACKAGES */}
      <section className="section" id="packages">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t("packagesEyebrow")}</span>
            <h2>{t("packagesTitle")}</h2>
            <p>{t("packagesDesc")}</p>
          </div>
          <div className="pricing-grid">
            <div className="price-card">
              <div className="tier">
                <span className="medal medal-bronze" /> {t("ironPackage")}
              </div>
              <div className="price">
                {t("priceIron")} <svg className="riyal-icon" aria-hidden="true"><use href="#riyal-symbol" /></svg>{" "}
                <small>{t("perMonth")}</small>
              </div>
              <p className="desc">{t("ironPackageDesc")}</p>
              <ul>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("ironBenefit1")}
                </li>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("ironBenefit2")}
                </li>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("ironBenefit3")}
                </li>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("ironBenefit4")}
                </li>
              </ul>
              <Link href="/details#package-1" className="btn btn-outline btn-sm" style={{ marginBottom: 12 }}>
                {t("packageDetails")}
              </Link>
              <Link href={`/booking-wizard?package=${encodeURIComponent(t("ironPackage"))}&price=1900`} className="btn btn-outline">
                {t("choosePackage")}
              </Link>
            </div>

            <div className="price-card">
              <div className="tier">
                <span className="medal medal-silver" /> {t("silverPackage")}
              </div>
              <div className="price">
                {t("priceSilver")} <svg className="riyal-icon" aria-hidden="true"><use href="#riyal-symbol" /></svg>{" "}
                <small>{t("perMonth")}</small>
              </div>
              <p className="desc">{t("silverPackageDesc")}</p>
              <ul>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("silverBenefit1")}
                </li>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("silverBenefit2")}
                </li>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("silverBenefit3")}
                </li>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("silverBenefit4")}
                </li>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("silverBenefit5")}
                </li>
              </ul>
              <Link href="/details#package-2" className="btn btn-outline btn-sm" style={{ marginBottom: 12 }}>
                {t("packageDetails")}
              </Link>
              <Link href={`/payment?package=${encodeURIComponent(t("silverPackage"))}&price=4500`} className="btn btn-outline">
                {t("choosePackage")}
              </Link>
            </div>

            <div className="price-card featured">
              <span className="featured-tag">{t("featuredTag")}</span>
              <div className="tier">
                <span className="medal medal-gold" /> {t("goldPackage")}
              </div>
              <div className="price">
                {t("priceGold")} <svg className="riyal-icon" aria-hidden="true"><use href="#riyal-symbol" /></svg>{" "}
                <small>{t("perMonth")}</small>
              </div>
              <p className="desc">{t("goldPackageDesc")}</p>
              <ul>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("goldBenefit1")}
                </li>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("goldBenefit2")}
                </li>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("goldBenefit3")}
                </li>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("goldBenefit4")}
                </li>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("goldBenefit5")}
                </li>
                <li>
                  <span className="check">
                    <svg viewBox="0 0 24 24">
                      <polyline points="4,12.5 9.5,18 20,6.5" />
                    </svg>
                  </span>{" "}
                  {t("goldBenefit6")}
                </li>
              </ul>
              <Link href="/details#package-3" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>
                {t("packageDetails")}
              </Link>
              <Link href={`/payment?package=${encodeURIComponent(t("goldPackage"))}&price=9800`} className="btn btn-gold">
                {t("choosePackage")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* VISION / MISSION / VALUES */}
      <section className="section" id="about">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t("aboutEyebrow")}</span>
            <h2>{t("aboutTitle")}</h2>
          </div>
          <div className="vm-grid">
            <div className="vm-card">
              <div className="divider" />
              <span className="eyebrow" style={{ fontSize: ".85rem" }}>
                {t("vision")}
              </span>
              <p style={{ marginTop: 14 }}>{t("visionText")}</p>
            </div>
            <div className="vm-card">
              <div className="divider" />
              <span className="eyebrow" style={{ fontSize: ".85rem" }}>
                {t("mission")}
              </span>
              <p style={{ marginTop: 14 }}>{t("missionText")}</p>
            </div>
          </div>
          <div className="values-row">
            <div className="value-item">
              <div className="mark" />
              <h4>{t("excellence")}</h4>
            </div>
            <div className="value-item">
              <div className="mark" />
              <h4>{t("impact")}</h4>
            </div>
            <div className="value-item">
              <div className="mark" />
              <h4>{t("initiative")}</h4>
            </div>
            <div className="value-item">
              <div className="mark" />
              <h4>{t("leadership")}</h4>
            </div>
            <div className="value-item">
              <div className="mark" />
              <h4>{t("distinction")}</h4>
            </div>
            <div className="value-item">
              <div className="mark" />
              <h4>{t("ownership")}</h4>
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
                  <img src="/WhatsApp Image 2026-09-07 at 4.14.04 PM.png" alt={t("expertName")} />
                </div>
              </div>
              <div className="expert-info">
                <span className="eyebrow">{t("expertEyebrow")}</span>
                <h2>{t("expertName")}</h2>
                <span className="expert-name-en">Consultant. Abdul Kareem Al-Ghamdi</span>
                <span className="expert-role">{t("expertRole")}</span>
                <p>{t("expertBio")}</p>
                <div className="expert-stats">
                  <div>
                    <strong>{t("expertStatExp")}</strong>
                    <span>{t("expertStat1")}</span>
                  </div>
                  <div>
                    <strong>{t("expertStatCons")}</strong>
                    <span>{t("expertStat2")}</span>
                  </div>
                  <div>
                    <strong>{t("expertStatEst")}</strong>
                    <span>{t("expertStat3")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="section" id="team">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t("teamEyebrow")}</span>
            <h2>{t("teamTitle")}</h2>
            <p>فريق عمل وهمي لأغراض العرض — يمكن استبدال البيانات بالفريق الفعلي لاحقاً.</p>
          </div>
          <div className="team-grid">
            <div className="team-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="avatar"
                src="https://images.unsplash.com/photo-1758876204244-930299843f07?w=150&h=150&fit=crop&crop=faces&fm=jpg&q=80"
                alt="عبدالله العتيبي"
                loading="lazy"
              />
              <h4>عبدالله العتيبي</h4>
              <div className="role">شريك استشاري</div>
              <div className="field-tag">{t("fieldTagGovernance")}</div>
            </div>
            <div className="team-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="avatar"
                src="https://images.unsplash.com/photo-1758874574397-e56dfcfc116d?w=150&h=150&fit=crop&crop=faces&fm=jpg&q=80"
                alt="فيصل الدوسري"
                loading="lazy"
              />
              <h4>فيصل الدوسري</h4>
              <div className="role">مستشار أول</div>
              <div className="field-tag">{t("fieldTagManagement")}</div>
            </div>
            <div className="team-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="avatar"
                src="https://images.unsplash.com/photo-1758874573370-e5496b20794b?w=150&h=150&fit=crop&crop=faces&fm=jpg&q=80"
                alt="سلطان الشهراني"
                loading="lazy"
              />
              <h4>سلطان الشهراني</h4>
              <div className="role">رئيس قسم الامتثال</div>
              <div className="field-tag">{t("fieldTagCompliance")}</div>
            </div>
            <div className="team-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="avatar"
                src="https://images.unsplash.com/photo-1756412066334-faa0ba38261f?w=150&h=150&fit=crop&crop=faces&fm=jpg&q=80"
                alt="نايف القحطاني"
                loading="lazy"
              />
              <h4>نايف القحطاني</h4>
              <div className="role">مدير المواهب</div>
              <div className="field-tag">{t("fieldTagTalent")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CLIENTS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head" style={{ marginBottom: 24 }}>
            <span className="eyebrow">{t("clientsEyebrow")}</span>
            <h2>{t("clientsTitle")}</h2>
          </div>
          <p className="clients-note">{t("clientsNote")}</p>
          <div className="clients-grid">
            <div className="client-tile">
              <div className="client-logo">ر</div>
              <span>رواد الأعمال القابضة</span>
            </div>
            <div className="client-tile">
              <div className="client-logo">م</div>
              <span>المنارة للاستثمار</span>
            </div>
            <div className="client-tile">
              <div className="client-logo">ب</div>
              <span>بيت الخبرة التجارية</span>
            </div>
            <div className="client-tile">
              <div className="client-logo">ت</div>
              <span>التقنية المتقدمة</span>
            </div>
            <div className="client-tile">
              <div className="client-logo">م</div>
              <span>مشاريع الخليج</span>
            </div>
            <div className="client-tile">
              <div className="client-logo">أ</div>
              <span>مؤسسة الأعمال الرائدة</span>
            </div>
            <div className="client-tile">
              <div className="client-logo">إ</div>
              <span>إتقان للاستثمار</span>
            </div>
            <div className="client-tile">
              <div className="client-logo">ق</div>
              <span>قمة التطوير</span>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" id="testimonials">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t("testimonialsEyebrow")}</span>
            <h2>{t("testimonialsTitle")}</h2>
            <p>{t("testimonialsDesc")}</p>
          </div>
          <div className="testimonials-grid">
            {[1, 2, 3].map((i) => (
              <div className="testimonial-card" key={i}>
                <div className="testimonial-rating" aria-label="5 من 5">
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" key={starIdx}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="testimonial-text">{t(`testimonial${i}Text`)}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {i === 1 ? "م.ر" : i === 2 ? "ن.ع" : "ف.ح"}
                  </div>
                  <div className="testimonial-meta">
                    <strong>{t(`testimonial${i}Name`)}</strong>
                    <span>{t(`testimonial${i}Role`)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
