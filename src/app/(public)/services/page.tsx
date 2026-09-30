"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Container, PageHero } from "@/components/public/Section";
import { Reveal } from "@/components/public/Reveal";
import { ServicesTabs } from "@/components/public/ServicesTabs";

export default function ServicesPage() {
  const { t } = useI18n();

  useEffect(() => {
    document.title = `${t("servicesEyebrow")} — ${t("brandName")}`;
  }, [t]);

  return (
    <main>
      <PageHero eyebrow={t("servicesEyebrow")} title={t("lp.servicesTitle")} lead={t("servicesDesc")} />
      <section className="py-24">
        <Container>
          <Reveal>
            <ServicesTabs />
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
