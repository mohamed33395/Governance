"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui";
import { useI18n } from "@/lib/i18n/i18n-context";
import { PersonCard } from "./PersonCard";
import { FOCUS } from "./tokens";
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
      <Link href={href} className={`block flex-1 rounded-2xl ${FOCUS}`}>
        <PersonCard
          avatar={<Avatar src={c.avatar_thumb_url ?? c.avatar_url} name={c.name} size="lg" />}
          name={c.name}
          role={c.title}
          field={c.specialization}
          footer={
            <>
              {footer}
              {hasPrice && (
                <strong className="mt-4 text-base text-accent" dir="ltr">
                  {c.consultation_price_formatted}
                </strong>
              )}
            </>
          }
        />
      </Link>
      {hasPrice && (
        <Link href={`/book/consultant/${c.id}`} className="btn btn-primary justify-center">
          {t("bookNow")}
        </Link>
      )}
    </div>
  );
}
