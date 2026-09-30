"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Container, PageHero } from "@/components/public/Section";
import { Reveal } from "@/components/public/Reveal";
import { VisionValues } from "@/components/public/VisionValues";
import { ExpertCard } from "@/components/public/ExpertCard";

export default function AboutPage() {
  const { t } = useI18n();

  useEffect(() => {
    document.title = `${t("aboutEyebrow")} — ${t("brandName")}`;
  }, [t]);

  return (
    <main>
      <PageHero eyebrow={t("aboutEyebrow")} title={t("aboutTitle")} />
      <section className="py-24">
        <Container>
          <VisionValues />
        </Container>
      </section>
      <section className="border-t border-border bg-surface py-24">
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
    </main>
  );
}
