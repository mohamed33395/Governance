"use client";

import Link from "next/link";
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
import { useI18n } from "@/lib/i18n/i18n-context";
import { Reveal } from "@/components/public/Reveal";
import { TaglineReveal } from "@/components/public/TaglineReveal";
import { Container, SectionHead } from "@/components/public/Section";
import { ServicesTabs } from "@/components/public/ServicesTabs";
import { PackageGrid } from "@/components/public/PackageGrid";
import { ExpertCard } from "@/components/public/ExpertCard";
import { Testimonials } from "@/components/public/Testimonials";
import { VisionValues } from "@/components/public/VisionValues";
import { FLUID, FOCUS } from "@/components/public/tokens";

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
      <section id="services" className="border-y border-border bg-surface py-24">
        <Container>
          <Reveal>
            <SectionHead eyebrow={t("servicesEyebrow")} title={t("lp.servicesTitle")} lead={t("servicesDesc")} />
          </Reveal>
          <Reveal>
            <ServicesTabs />
          </Reveal>
        </Container>
      </section>

      {/* PACKAGES */}
      <section id="packages" className="py-24">
        <Container>
          <Reveal>
            <SectionHead eyebrow={t("packagesEyebrow")} title={t("packagesTitle")} lead={t("packagesDesc")} />
          </Reveal>
          <Reveal>
            <PackageGrid withDetails />
          </Reveal>
        </Container>
      </section>

      {/* EXPERT */}
      <section id="expert" className="border-y border-border bg-surface py-24">
        <Container>
          <Reveal>
            <ExpertCard
              eyebrow={t("expertEyebrow")}
              name={t("expertName")}
              sub="Consultant. Abdul Kareem Al-Ghamdi"
              role={t("expertRole")}
              bio={t("expertBio")}
              photo="/WhatsApp Image 2026-09-07 at 4.14.04 PM.png"
              photoAlt={t("expertName")}
              stats={[
                { value: t("expertStatExp"), label: t("expertStat1") },
                { value: t("expertStatCons"), label: t("expertStat2") },
                { value: t("expertStatEst"), label: t("expertStat3") },
              ]}
            />
          </Reveal>
        </Container>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24">
        <Container>
          <Reveal>
            <SectionHead
              eyebrow={t("testimonialsEyebrow")}
              title={t("testimonialsTitle")}
              lead={t("testimonialsDesc")}
            />
          </Reveal>
          <Testimonials />
        </Container>
      </section>

      {/* VISION / MISSION / VALUES */}
      <section id="about" className="border-y border-border bg-surface py-24">
        <Container>
          <Reveal>
            <SectionHead eyebrow={t("aboutEyebrow")} title={t("aboutTitle")} />
          </Reveal>
          <VisionValues />
        </Container>
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
