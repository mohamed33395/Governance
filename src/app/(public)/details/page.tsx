"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CaretLeft, Check } from "@phosphor-icons/react";
import { Container, PageHero, SectionHead } from "@/components/public/Section";
import { Reveal } from "@/components/public/Reveal";
import { CARD, FLUID, FOCUS } from "@/components/public/tokens";
import { DETAIL_ITEMS, DIR_STRUCTURE, type DetailItem } from "@/lib/data/details-content";

function DetailView({ item }: { item: DetailItem }) {
  return (
    <>
      <PageHero
        eyebrow={item.category}
        title={item.title}
        lead={item.lead}
        before={
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <li>
                <Link href="/" className={`rounded-lg ${FLUID} hover:text-text ${FOCUS}`}>
                  الرئيسية
                </Link>
              </li>
              <li aria-hidden="true">
                <CaretLeft size={12} weight="bold" className="ltr:rotate-180" />
              </li>
              <li>
                <Link href="/details" className={`rounded-lg ${FLUID} hover:text-text ${FOCUS}`}>
                  التفاصيل
                </Link>
              </li>
              <li aria-hidden="true">
                <CaretLeft size={12} weight="bold" className="ltr:rotate-180" />
              </li>
              <li aria-current="page" className="text-text">
                {item.category}
              </li>
            </ol>
          </nav>
        }
      >
        <div className="flex flex-wrap gap-4">
          <Link href={item.cta.href} className="btn btn-primary">
            {item.cta.text}
          </Link>
          <Link href="/" className="btn btn-outline">
            العودة إلى الرئيسية
          </Link>
        </div>
      </PageHero>

      <section className="py-24">
        <Container className="grid items-start gap-12 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="text-2xl font-bold text-text">ما يشمله هذا البند</h2>
            <ol className="mt-8 flex flex-col gap-4">
              {item.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-accent-soft"
                  >
                    {i + 1}
                  </span>
                  <p className="pt-1 text-base text-muted text-pretty">{b}</p>
                </li>
              ))}
            </ol>
            {item.features && item.features.length > 0 ? (
              <ul className="mt-12 grid gap-6 sm:grid-cols-2">
                {item.features.map((f, i) => (
                  <li key={i} className={`p-6 ${CARD}`}>
                    <span aria-hidden="true" className="block size-2 rotate-45 bg-accent" />
                    <h3 className="mt-4 text-lg font-bold text-text text-balance">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted text-pretty">{f.desc}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <aside className={`p-8 lg:sticky lg:top-24 ${CARD}`}>
            <h3 className="text-lg font-bold text-text text-balance">{item.aside.title}</h3>
            {item.aside.price ? (
              <p className="mt-4 text-4xl leading-tight font-bold text-text">
                {item.aside.price} <small className="text-xs font-normal text-muted">{item.aside.period}</small>
              </p>
            ) : null}
            <ul className="mt-6 flex flex-col gap-3">
              {item.aside.points.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text">
                  <Check size={16} weight="bold" aria-hidden="true" className="mt-1 shrink-0 text-accent" />
                  {p}
                </li>
              ))}
            </ul>
            <Link href={item.cta.href} className="btn btn-primary mt-8 w-full">
              {item.cta.text}
            </Link>
          </aside>
        </Container>
      </section>
    </>
  );
}

function DirectoryView() {
  return (
    <section className="py-24">
      <Container>
        <SectionHead
          as="h1"
          eyebrow="صفحات التفاصيل"
          title="استعرض تفاصيل كل بند"
          lead="اختر أحد البنود التالية لقراءة التفاصيل الكاملة حول الخدمة أو المجال أو الباقة."
        />
        <div className="flex flex-col gap-12">
          {DIR_STRUCTURE.map((group) => (
            <Reveal key={group.id}>
              <h2 className="mb-6 text-2xl font-bold text-text text-balance">{group.title}</h2>
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {group.ids.map((id) => {
                  const item = DETAIL_ITEMS[id];
                  return (
                    <li key={id}>
                      <Link
                        href={`/details#${id}`}
                        className={`flex h-full flex-col p-6 ${CARD} ${FLUID} hover:-translate-y-1 hover:border-accent ${FOCUS}`}
                      >
                        <h3 className="text-lg font-bold text-text text-balance">{item.title}</h3>
                        <p className="mt-2 flex-1 text-sm text-muted text-pretty">{item.lead}</p>
                        <span className="mt-4 text-sm font-semibold text-primary dark:text-accent-soft">
                          عرض التفاصيل
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          ))}
        </div>
      </Container>
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
