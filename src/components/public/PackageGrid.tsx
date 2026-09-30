"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Check } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/i18n-context";
import { EmptyState, ErrorState } from "@/components/ui";
import type { Package } from "@/types/api";
import { FLUID, FOCUS } from "./tokens";

const MEDALS = ["bg-[#cd8b5a]", "bg-[#e6e6e6]", "bg-accent-soft"] as const;

/** Public pricing cards. Data: GET /public/packages (PUB-01). */
export function PackageGrid({ withDetails = false }: { withDetails?: boolean }) {
  const { t } = useI18n();
  const query = useQuery({
    queryKey: ["public", "packages"],
    queryFn: () => api.get("/public/packages").then((r) => r.data.data as Package[]),
  });
  const packages = query.data;

  if (query.isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="min-h-[420px] animate-pulse rounded-2xl border border-border bg-surface" />
        ))}
      </div>
    );
  }
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  if (!packages || packages.length === 0) return <EmptyState title={t("common.empty")} />;

  return (
    <>
      {/* Saudi Riyal symbol (official SAMA glyph) */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <symbol id="riyal-symbol" viewBox="0 0 1124.14 1256.39">
            <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" />
            <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" />
          </symbol>
        </defs>
      </svg>

      <ul className="grid items-stretch gap-6 md:grid-cols-3">
        {packages.map((pkg, i) => {
          const featured = pkg.is_featured;
          return (
            <li key={pkg.id} className="flex">
              <article
                className={`relative flex w-full flex-col rounded-2xl border p-8 ${FLUID} hover:-translate-y-1 ${
                  featured
                    ? "border-white/15 bg-secondary text-white hover:border-accent"
                    : "border-border bg-surface text-text hover:border-accent"
                }`}
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-semibold whitespace-nowrap text-accent-foreground">
                    {t("featuredTag")}
                  </span>
                )}
                <h3 className={`flex items-center gap-2 text-lg font-bold ${featured ? "text-white" : "text-text"}`}>
                  <span aria-hidden="true" className={`size-3 shrink-0 rounded-full ${MEDALS[i % MEDALS.length]}`} />
                  {pkg.name}
                </h3>
                <p className={`mt-4 text-4xl leading-tight font-bold ${featured ? "text-accent-soft" : "text-text"}`}>
                  {pkg.price_formatted.replace(/\s*SAR\s*$/u, "")}{" "}
                  <svg className="inline-block h-[0.76em] w-[0.68em] fill-current align-baseline" aria-hidden="true">
                    <use href="#riyal-symbol" />
                  </svg>{" "}
                  <small className={`text-xs font-normal ${featured ? "text-white/60" : "text-muted"}`}>
                    / {pkg.billing_period_days} {t("packages.days")}
                  </small>
                </p>
                {pkg.description && (
                  <p className={`mt-2 text-sm text-pretty ${featured ? "text-white/70" : "text-muted"}`}>
                    {pkg.description}
                  </p>
                )}
                <ul className="mt-6 mb-8 flex flex-1 flex-col gap-3">
                  {[
                    pkg.is_unlimited || pkg.consultations_limit === null
                      ? t("packages.unlimitedConsultations")
                      : t("packages.consultationsMonthly").replace("{n}", String(pkg.consultations_limit)),
                    ...pkg.features_localized,
                  ].map((feature, fi) => (
                    <li key={fi} className={`flex items-start gap-2 text-sm ${featured ? "text-white/90" : "text-text"}`}>
                      <Check size={16} weight="bold" aria-hidden="true" className="mt-1 shrink-0 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-3">
                  {withDetails && (
                    <Link
                      href={`/details#package-${i + 1}`}
                      className={`btn btn-sm ${featured ? "btn-ghost" : "btn-outline"} ${FOCUS}`}
                    >
                      {t("packageDetails")}
                    </Link>
                  )}
                  <Link href={`/book/${pkg.slug}`} className={`btn ${featured ? "btn-gold" : "btn-outline"}`}>
                    {t("choosePackage")}
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </>
  );
}
