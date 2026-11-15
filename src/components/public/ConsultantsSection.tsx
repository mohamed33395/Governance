"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Reveal } from "./Reveal";
import { Container, SectionHead } from "./Section";
import { ConsultantCard } from "./ConsultantCard";
import { HorizontalCarousel } from "./HorizontalCarousel";
import type { Paginated, PublicConsultant } from "@/types/api";

// Home page — all consultants with price and a direct "Book now" button.
export function ConsultantsSection() {
  const { t } = useI18n();

  const query = useQuery({
    queryKey: ["public", "consultants", "home"],
    queryFn: () =>
      api.get("/public/consultants", { params: { per_page: 100 } }).then((r) => r.data as Paginated<PublicConsultant>),
    staleTime: 60_000,
  });

  const consultants = query.data?.data ?? [];
  if (query.isLoading || query.isError || consultants.length === 0) return null;

  return (
    <section id="consultants" className="py-24">
      <Container>
        <Reveal>
          <SectionHead
            eyebrow={t("consultants.eyebrow")}
            title={t("lp.consultantsTitle")}
            lead={t("lp.consultantsDesc")}
          />
        </Reveal>
        <HorizontalCarousel autoAdvanceMs={6000}>
          {consultants.map((c) => (
            <li key={c.id} className="w-[88%] shrink-0 snap-start sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]">
              <ConsultantCard consultant={c} />
            </li>
          ))}
        </HorizontalCarousel>
        <div className="mt-8 text-center">
          <Link
            href="/consultants"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-accent dark:text-accent-soft"
          >
            {t("lp.consultantsAll")}
            <ArrowLeft
              size={16}
              weight="bold"
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-1 ltr:rotate-180"
            />
          </Link>
        </div>
      </Container>
    </section>
  );
}
