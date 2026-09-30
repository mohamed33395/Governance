"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/i18n-context";

// Branded 404 — a clear way back home.
export default function NotFound() {
  const { t } = useI18n();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-24">
      <div className="flex max-w-[480px] flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo_icon.png" alt="" className="h-12 w-auto" />
        <p className="mt-8 text-6xl font-bold text-text" dir="ltr">
          {t("lp.nfCode")}
        </p>
        <h1 className="mt-4 text-2xl font-bold text-text text-balance">{t("lp.nfTitle")}</h1>
        <p className="mt-2 text-base text-muted text-pretty">{t("lp.nfBody")}</p>
        <Link
          href="/"
          className="btn btn-primary mt-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t("lp.nfCta")}
          <ArrowLeft size={18} weight="bold" aria-hidden="true" className="ltr:rotate-180" />
        </Link>
      </div>
    </main>
  );
}
