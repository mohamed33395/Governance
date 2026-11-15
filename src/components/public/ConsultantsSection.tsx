"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/i18n-context";
import { ConsultantCard } from "./ConsultantCard";
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
    <>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {consultants.map((c) => (
          <li key={c.id}>
            <ConsultantCard consultant={c} />
          </li>
        ))}
      </ul>
      <div className="mt-10 text-center">
        <Link href="/consultants" className="btn btn-outline">
          {t("lp.consultantsAll")}
        </Link>
      </div>
    </>
  );
}
