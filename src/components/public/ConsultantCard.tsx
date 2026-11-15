"use client";

import Link from "next/link";
import { ArrowLeft, Briefcase, CalendarCheck } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui";
import { useI18n } from "@/lib/i18n/i18n-context";
import { FLUID, FOCUS } from "./tokens";
import type { PublicConsultant } from "@/types/api";

// Consultant card with price and a direct-booking button (no package).
// "Book now" is hidden when the consultant has no price.
export function ConsultantCard({ consultant: c, footer }: { consultant: PublicConsultant; footer?: React.ReactNode }) {
  const { t } = useI18n();
  const hasPrice = c.consultation_price != null && !!c.consultation_price_formatted;
  // priced consultants book directly — the whole card opens the wizard
  const href = hasPrice ? `/book/consultant/${c.id}` : `/consultants/${c.id}`;

  return (
    <div className="flex h-full flex-col gap-3">
      <Link
        href={href}
        className={`group flex flex-1 flex-col rounded-2xl border border-border bg-surface p-6 text-center ${FLUID} hover:-translate-y-1 hover:border-accent ${FOCUS}`}
      >
        <div className="relative mx-auto">
          <Avatar src={c.avatar_thumb_url ?? c.avatar_url} name={c.name} size="xl" />
          {hasPrice && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-3 py-1 text-[11px] font-bold whitespace-nowrap text-white shadow">
              {c.consultation_price_formatted}
            </span>
          )}
        </div>

        <h3 className="mt-4 text-lg font-bold text-text text-balance">{c.name}</h3>
        {c.title && <p className="mt-1 text-sm font-semibold text-primary dark:text-accent-soft">{c.title}</p>}

        {c.specialization && (
          <span className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-text">
            <Briefcase size={14} weight="duotone" aria-hidden="true" className="text-accent" />
            {c.specialization}
          </span>
        )}

        {c.bio && <p className="mt-3 line-clamp-2 text-sm text-muted text-pretty">{c.bio}</p>}

        <div className="mt-auto pt-4">
          {footer}
          {hasPrice && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
              <CalendarCheck size={16} weight="duotone" aria-hidden="true" />
              {t("consultants.bookDirect")}
            </span>
          )}
        </div>
      </Link>

      {hasPrice && (
        <Link href={`/book/consultant/${c.id}`} className="btn btn-primary justify-center">
          {t("bookNow")}
          <ArrowLeft size={16} weight="bold" aria-hidden="true" className="ltr:rotate-180" />
        </Link>
      )}
    </div>
  );
}
