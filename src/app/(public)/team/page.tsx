"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Container, PageHero } from "@/components/public/Section";
import { Reveal } from "@/components/public/Reveal";
import { PersonCard } from "@/components/public/PersonCard";

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
  const { t } = useI18n();

  useEffect(() => {
    document.title = `${t("team")} — ${t("brandName")}`;
  }, [t]);

  return (
    <main>
      <PageHero
        eyebrow={t("team")}
        title="الاستراتيجيون خلف المكتب"
        lead="فريق عمل وهمي لأغراض العرض — يمكن استبدال البيانات بالفريق الفعلي لاحقاً."
      />
      <section className="py-24">
        <Container>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((m, i) => (
              <li key={m.name}>
                <Reveal delay={i * 100} className="h-full">
                  <PersonCard
                    avatar={
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.img}
                        alt={m.name}
                        loading="lazy"
                        className="size-24 rounded-full border border-border object-cover"
                      />
                    }
                    name={m.name}
                    role={m.role}
                    field={m.field}
                  />
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </main>
  );
}
