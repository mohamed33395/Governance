"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarCheck,
  FileText,
  Plus,
  SealCheck,
  ShieldCheck,
  SquaresFour,
  WarningCircle,
} from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/i18n-context";
import { EmptyState, ErrorState } from "@/components/ui";
import { Reveal } from "@/components/public/Reveal";
import { TaglineReveal } from "@/components/public/TaglineReveal";
import type { Package } from "@/types/api";

const MEDALS = ["medal-bronze", "medal-silver", "medal-gold"] as const;

function Check() {
  return (
    <span className="check">
      <svg viewBox="0 0 24 24">
        <polyline points="4,12.5 9.5,18 20,6.5" />
      </svg>
    </span>
  );
}

const FLUID = "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-12 max-w-[680px]">
      <span className="text-sm font-semibold text-primary dark:text-accent-soft">{eyebrow}</span>
      <h2 className="mt-2 text-3xl font-bold text-text text-balance md:text-4xl">{title}</h2>
    </div>
  );
}

function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1180px] px-6 md:px-8 ${className}`}>{children}</div>;
}

const BENEFITS = [
  { icon: SealCheck, title: "lp.b1Title", body: "lp.b1Body" },
  { icon: SquaresFour, title: "lp.b2Title", body: "lp.b2Body" },
  { icon: CalendarCheck, title: "lp.b3Title", body: "lp.b3Body" },
  { icon: FileText, title: "lp.b4Title", body: "lp.b4Body" },
] as const;

const STEPS = [
  { n: "1", title: "lp.s1Title", body: "lp.s1Body" },
  { n: "2", title: "lp.s2Title", body: "lp.s2Body" },
  { n: "3", title: "lp.s3Title", body: "lp.s3Body" },
] as const;

const FAQ_COUNT = 8;

export default function HomePage() {
  const { t, lang } = useI18n();
  const [activeTab, setActiveTab] = useState<string>("t7");

  // Packages come from the dashboard — GET /public/packages (PUB-01)
  const packagesQuery = useQuery({
    queryKey: ["public", "packages"],
    queryFn: () => api.get("/public/packages").then((r) => r.data.data as Package[]),
  });
  const packages = packagesQuery.data;

  const faqs = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    q: t(`lp.faq${i + 1}Q`),
    a: t(`lp.faq${i + 1}A`),
  }));
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const heroLines = t("lp.heroTitle").split("|");

  return (
    <main>
      {/* HERO — one offer, one audience, one primary action */}
      <section id="top" className="relative pt-8 pb-24 md:pt-16">
        <Container className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Reveal>
              <Link
                href="/details#license-1"
                className={`inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-sm text-text ${FLUID} hover:border-accent ${FOCUS}`}
              >
                <SealCheck size={20} weight="fill" className="text-accent" aria-hidden="true" />
                {t("licenseText")}
                <ArrowLeft size={14} weight="bold" aria-hidden="true" className="ltr:rotate-180" />
              </Link>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="mt-6 max-w-[680px] bg-linear-to-r from-black to-[#666666] bg-clip-text text-4xl leading-tight font-bold text-balance text-transparent md:text-5xl dark:from-white dark:to-[#9B9B9B]">
                {heroLines.map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br className="hidden md:block" />}
                    {i > 0 && <span className="md:hidden"> </span>}
                    {line}
                  </span>
                ))}
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 max-w-[680px] text-lg text-muted text-pretty md:text-xl">{t("lp.heroSub")}</p>
            </Reveal>
            <Reveal delay={300}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/packages" className="btn btn-primary">
                  {t("lp.heroCta")}
                  <ArrowLeft size={18} weight="bold" aria-hidden="true" className="ltr:rotate-180" />
                </Link>
                <span className="text-sm text-muted">{t("lp.heroNote")}</span>
              </div>
            </Reveal>
            <Reveal delay={400}>
              <div className="mt-12 grid max-w-[680px] grid-cols-3 gap-6 border-t border-border pt-6">
                {(
                  [
                    ["expertStatExp", "expertStat1"],
                    ["expertStatCons", "expertStat2"],
                    ["expertStatEst", "expertStat3"],
                  ] as const
                ).map(([value, label]) => (
                  <div key={value}>
                    <strong className="block text-3xl font-bold text-text">{t(value)}</strong>
                    <span className="text-sm text-muted">{t(label)}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={200} className="w-full max-w-[480px] lg:justify-self-end">
            <div className="rounded-3xl border border-border bg-surface p-2">
              {/* outer radius 24 − gap 8 = 16 */}
              <div className="flex aspect-[5/4] flex-col items-center justify-center gap-4 rounded-2xl bg-white p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/loge_leger-.png" alt={t("fullLogoAlt")} className="max-h-[200px] w-auto object-contain" />
                <span className="text-lg font-semibold text-black">{t("lp.heroCaption")}</span>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* PROBLEM → SOLUTION */}
      <section className="border-y border-border bg-surface py-24">
        <Container className="grid gap-6 md:grid-cols-2">
          <Reveal>
            <article className="h-full rounded-2xl border border-border bg-background p-8">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-danger">
                <WarningCircle size={20} weight="fill" aria-hidden="true" />
                {t("lp.problemKicker")}
              </span>
              <h2 className="mt-4 text-2xl font-bold text-text text-balance">{t("lp.problemTitle")}</h2>
              <p className="mt-4 text-base text-muted text-pretty">{t("lp.problemBody")}</p>
            </article>
          </Reveal>
          <Reveal delay={100}>
            <article className="h-full rounded-2xl border border-white/15 bg-secondary p-8 text-white">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent-soft">
                <ShieldCheck size={20} weight="fill" aria-hidden="true" />
                {t("lp.solutionKicker")}
              </span>
              <h2 className="mt-4 text-2xl font-bold text-balance">{t("lp.solutionTitle")}</h2>
              <p className="mt-4 text-base text-white/70 text-pretty">{t("lp.solutionBody")}</p>
            </article>
          </Reveal>
        </Container>
      </section>

      {/* TAGLINE REVEAL */}
      <section className="flex min-h-[60vh] items-center py-24" aria-label={t("lp.tagline")}>
        <Container>
          <TaglineReveal
            key={t("lp.tagline")}
            text={t("lp.tagline")}
            className="max-w-[680px] text-4xl leading-tight font-bold text-pretty md:text-5xl"
          />
        </Container>
      </section>

      {/* BENEFITS */}
      <section id="why" className="border-y border-border bg-surface py-24">
        <Container>
          <Reveal>
            <SectionHead eyebrow={t("lp.benefitsEyebrow")} title={t("lp.benefitsTitle")} />
          </Reveal>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(({ icon: Icon, title, body }, i) => (
              <li key={title}>
                <Reveal delay={i * 100} className="h-full">
                  <article
                    className={`h-full rounded-2xl border border-border bg-background p-6 ${FLUID} hover:-translate-y-1 hover:border-accent`}
                  >
                    <span className="inline-flex size-12 items-center justify-center rounded-xl border border-border bg-surface text-primary dark:text-accent-soft">
                      <Icon size={24} weight="duotone" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-xl font-bold text-text text-balance">{t(title)}</h3>
                    <p className="mt-2 text-sm text-muted text-pretty">{t(body)}</p>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24">
        <Container>
          <Reveal>
            <SectionHead eyebrow={t("lp.howEyebrow")} title={t("lp.howTitle")} />
          </Reveal>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.n}>
                <Reveal delay={i * 100} className="h-full">
                  <article className="h-full rounded-2xl border border-border bg-surface p-6">
                    <span
                      aria-hidden="true"
                      className="inline-flex size-10 items-center justify-center rounded-full bg-text text-base font-bold text-background"
                    >
                      {step.n}
                    </span>
                    <h3 className="mt-4 text-xl font-bold text-text text-balance">{t(step.title)}</h3>
                    <p className="mt-2 text-sm text-muted text-pretty">{t(step.body)}</p>
                  </article>
                </Reveal>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* SERVICES */}
      <section
        className="section"
        id="services"
        style={{ background: "var(--white)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="wrap">
          <Reveal>
          <div className="section-head">
            <span className="eyebrow">{t("servicesEyebrow")}</span>
            <h2>{t("lp.servicesTitle")}</h2>
            <p>{t("servicesDesc")}</p>
          </div>
          </Reveal>
          <Reveal>
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
                <Link href="/details#license-1" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>
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
                <Link href="/details#service-1" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>
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
                <Link href="/details#service-2" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>
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
                <Link href="/details#service-3" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>
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
                <Link href="/details#service-4" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>
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
                <Link href="/details#service-5" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>
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
                <Link href="/details#service-6" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>
                  {t("details")}
                </Link>
              </div>
            </div>
          </div>
          </Reveal>
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
          <Reveal>
          <div className="section-head">
            <span className="eyebrow">{t("packagesEyebrow")}</span>
            <h2>{t("packagesTitle")}</h2>
            <p>{t("packagesDesc")}</p>
          </div>
          </Reveal>
          <Reveal>
          {packagesQuery.isLoading ? (
            <div className="pricing-grid">
              {[0, 1, 2].map((i) => (
                <div key={i} className="price-card animate-pulse" style={{ minHeight: 420 }} />
              ))}
            </div>
          ) : packagesQuery.isError ? (
            <ErrorState onRetry={() => packagesQuery.refetch()} />
          ) : !packages || packages.length === 0 ? (
            <EmptyState title={t("common.empty")} />
          ) : (
            <div className="pricing-grid">
              {packages.map((pkg, i) => (
                <div key={pkg.id} className={`price-card${pkg.is_featured ? " featured" : ""}`}>
                  {pkg.is_featured && <span className="featured-tag">{t("featuredTag")}</span>}
                  <div className="tier">
                    <span className={`medal ${MEDALS[i % MEDALS.length]}`} /> {pkg.name}
                  </div>
                  <div className="price">
                    {pkg.price_formatted.replace(/\s*SAR\s*$/u, "")}{" "}
                    <svg className="riyal-icon" aria-hidden="true">
                      <use href="#riyal-symbol" />
                    </svg>{" "}
                    <small>
                      / {pkg.billing_period_days} {t("packages.days")}
                    </small>
                  </div>
                  {pkg.description && <p className="desc">{pkg.description}</p>}
                  <ul>
                    <li>
                      <Check />{" "}
                      {pkg.is_unlimited || pkg.consultations_limit === null
                        ? t("packages.unlimitedConsultations")
                        : t("packages.consultationsMonthly").replace("{n}", String(pkg.consultations_limit))}
                    </li>
                    {pkg.features_localized.map((feature, fi) => (
                      <li key={fi}>
                        <Check /> {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/details#package-${i + 1}`}
                    className={`btn ${pkg.is_featured ? "btn-ghost" : "btn-outline"} btn-sm`}
                    style={{ marginBottom: 12 }}
                  >
                    {t("packageDetails")}
                  </Link>
                  <Link href={`/book/${pkg.slug}`} className={`btn ${pkg.is_featured ? "btn-gold" : "btn-outline"}`}>
                    {t("choosePackage")}
                  </Link>
                </div>
              ))}
            </div>
          )}
          </Reveal>
        </div>
      </section>

      {/* EXPERT */}
      <section className="section" id="expert">
        <div className="wrap">
          <Reveal>
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
          </Reveal>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" id="testimonials">
        <div className="wrap">
          <Reveal>
          <div className="section-head">
            <span className="eyebrow">{t("testimonialsEyebrow")}</span>
            <h2>{t("testimonialsTitle")}</h2>
            <p>{t("testimonialsDesc")}</p>
          </div>
          </Reveal>
          <Reveal>
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
          </Reveal>
        </div>
      </section>
      {/* VISION / MISSION / VALUES */}
      <section className="section" id="about">
        <div className="wrap">
          <Reveal>
          <div className="section-head">
            <span className="eyebrow">{t("aboutEyebrow")}</span>
            <h2>{t("aboutTitle")}</h2>
          </div>
          </Reveal>
          <Reveal>
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
          </Reveal>
          <Reveal>
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
          </Reveal>
        </div>
      </section>


      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-surface py-24">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <Container>
          <Reveal>
            <SectionHead eyebrow={t("lp.faqEyebrow")} title={t("lp.faqTitle")} />
          </Reveal>
          <div className="flex max-w-[880px] flex-col gap-3">
            {faqs.map((f, i) => (
              <Reveal key={i} delay={Math.min(i, 3) * 50}>
                <details className="group rounded-2xl border border-border bg-background">
                  <summary
                    className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-6 text-lg font-semibold text-text [&::-webkit-details-marker]:hidden ${FLUID} hover:bg-surface ${FOCUS}`}
                  >
                    {f.q}
                    <Plus
                      size={20}
                      weight="bold"
                      aria-hidden="true"
                      className={`shrink-0 ${FLUID} group-open:rotate-45`}
                    />
                  </summary>
                  <p className="px-6 pb-6 text-base text-muted text-pretty">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* RISK REVERSAL + FINAL CTA (same action as the hero) */}
      <section className="py-24">
        <Container>
          <Reveal>
            <div className="flex flex-col items-center rounded-3xl border border-white/15 bg-secondary p-12 text-center text-white">
              <h2 className="max-w-[680px] text-3xl font-bold text-balance md:text-4xl">{t("lp.finalTitle")}</h2>
              <p className="mt-4 max-w-[680px] text-lg text-white/70 text-pretty">{t("lp.finalBody")}</p>
              <Link href="/packages" className="btn btn-gold mt-8">
                {t("lp.heroCta")}
                <ArrowLeft size={18} weight="bold" aria-hidden="true" className="ltr:rotate-180" />
              </Link>
              <p className="mt-6 inline-flex max-w-[680px] items-start gap-2 text-sm text-white/60 text-pretty">
                <ShieldCheck size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                {t("lp.finalRisk")}
              </p>
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
