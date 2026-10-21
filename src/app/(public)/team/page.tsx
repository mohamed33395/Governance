"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Container, PageHero } from "@/components/public/Section";
import { Reveal } from "@/components/public/Reveal";
import { PersonCard } from "@/components/public/PersonCard";
import type { TeamMember } from "@/types/api";

export default function TeamPage() {
  const { t } = useI18n();

  useEffect(() => {
    document.title = `${t("team")} — ${t("brandName")}`;
  }, [t]);

  const query = useQuery({
    queryKey: ["public", "team-members"],
    queryFn: () => api.get("/public/team-members").then((r) => r.data.data as TeamMember[]),
    staleTime: 60_000,
  });
  const members = query.data ?? [];

  return (
    <main>
      <PageHero eyebrow={t("team")} title={t("public.team.title")} lead={t("public.team.lead")} />
      <section className="py-24">
        <Container>
          {query.isLoading ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="h-72 animate-pulse rounded-2xl border border-border bg-surface" />
              ))}
            </ul>
          ) : members.length === 0 ? (
            <p className="py-10 text-center text-muted">{t("public.team.empty")}</p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {members.map((m, i) => (
                <li key={m.id}>
                  <Reveal delay={i * 100} className="h-full">
                    <PersonCard
                      avatar={
                        m.avatar_thumb_url || m.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.avatar_thumb_url ?? m.avatar_url ?? ""}
                            alt={m.name}
                            loading="lazy"
                            className="size-24 rounded-full border border-border object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="inline-flex size-24 items-center justify-center rounded-full border border-border bg-secondary text-2xl font-bold text-accent-soft"
                          >
                            {m.name.slice(0, 2)}
                          </span>
                        )
                      }
                      name={m.name}
                      role={m.job_title}
                      field={t("team.yearsPill").replace("{n}", String(m.experience_years))}
                    />
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </main>
  );
}