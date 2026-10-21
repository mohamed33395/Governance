"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Reveal } from "./Reveal";
import { PersonCard } from "./PersonCard";
import type { TeamMember } from "@/types/api";

// Landing "our team" strip — fed by GET /public/team-members (admin-managed).
// Hidden entirely when there is nothing to show.
export function TeamSection() {
  const { t } = useI18n();

  const query = useQuery({
    queryKey: ["public", "team-members"],
    queryFn: () => api.get("/public/team-members").then((r) => r.data.data as TeamMember[]),
    staleTime: 60_000,
  });

  const members = query.data ?? [];
  if (query.isLoading || query.isError || members.length === 0) return null;

  return (
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
  );
}
