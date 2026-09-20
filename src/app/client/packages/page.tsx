"use client";

import { useCallback } from "react";
import { useClientAuth } from "@/lib/auth/client-auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { clientPortalService } from "@/services/client-portal.service";
import { useApiData } from "@/lib/use-api-data";
import type { ClientPackage } from "@/types/client-portal";

const PACKAGES: ClientPackage[] = [
  {
    id: "bronze",
    name: "الباقة البرونزية",
    price: "١,٩٠٠",
    period: "شهرياً",
    desc: "للمنشآت الناشئة التي تبدأ رحلة الحوكمة والامتثال.",
    benefits: ["استشارتان شهرياً", "مراجعة مستندين شهرياً", "دعم عبر البريد الإلكتروني", "تقرير متابعة ربع سنوي"],
    featured: false,
  },
  {
    id: "silver",
    name: "الباقة الفضية",
    price: "٤,٥٠٠",
    period: "شهرياً",
    desc: "للمنشآت المتنامية التي تحتاج مرافقة استشارية أعمق.",
    benefits: ["٥ استشارات شهرياً", "مراجعة حتى ٨ مستندات شهرياً", "دعم عبر الجوال والبريد", "تقرير أداء شهري", "جلسة تدريبية ربع سنوية"],
    featured: false,
  },
  {
    id: "gold",
    name: "الباقة الذهبية",
    price: "٩,٨٠٠",
    period: "شهرياً",
    desc: "مرافقة شاملة للمنشآت الطامحة للريادة.",
    benefits: ["استشارات غير محدودة", "مراجعة مستندات غير محدودة", "مستشار مخصص لمنشأتكم", "دعم على مدار الساعة", "تقارير أداء أسبوعية", "حضور اجتماعات مجلس الإدارة"],
    featured: true,
  },
];

export default function ClientPackagesPage() {
  const { token, user } = useClientAuth();
  const { t } = useI18n();

  const fetcher = useCallback(
    () => (token ? clientPortalService.getPackages(token) : Promise.reject()),
    [token]
  );
  const { data: packages } = useApiData<ClientPackage[]>(fetcher, PACKAGES);

  const currentFetcher = useCallback(
    () => (token ? clientPortalService.getCurrentPackage(token) : Promise.reject()),
    [token]
  );
  const { data: currentPkg, setData: setCurrentPkg } = useApiData<{ packageName: string | null }>(
    currentFetcher,
    { packageName: user?.packageName || null }
  );

  const currentName = currentPkg.packageName || user?.packageName || null;
  const current = packages.find((p) => p.name === currentName) || packages[0];

  const choosePackage = (name: string) => {
    setCurrentPkg({ packageName: name });
    if (token) clientPortalService.choosePackage(token, name).catch(() => {});
  };

  return (
    <>
      <div className="client-panel-card">
        <h3>{t("currentPackage")}</h3>
        <div id="currentPackageInfo">
          {current ? (
            <>
              <h4>{current.name}</h4>
              <p className="client-empty" style={{ marginTop: 6 }}>
                {current.desc}
              </p>
              <div className="price" style={{ fontFamily: "Amiri,serif", fontSize: "1.8rem", color: "var(--green-deep)", marginTop: 10 }}>
                {current.price} <small style={{ fontSize: ".8rem", color: "var(--stone)" }}>/ {current.period}</small>
              </div>
            </>
          ) : (
            <span className="client-empty">{t("clientPackageEmpty")}</span>
          )}
        </div>
      </div>
      <div className="client-panel-card">
        <h3>{t("clientPackagesTitle")}</h3>
        <div className="client-packages" id="packagesList">
          {packages.map((p) => (
            <div key={p.id} className={`client-package-card${p.featured ? " featured" : ""}`}>
              {p.name === currentName && <span className="client-current-badge">{t("currentPackage")}</span>}
              <h4>{p.name}</h4>
              <p className="desc">{p.desc}</p>
              <div className="price">
                {p.price} <small>/ {p.period}</small>
              </div>
              <ul>
                {p.benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <button
                type="button"
                className={`btn ${p.featured ? "btn-gold" : "btn-outline"} btn-sm`}
                onClick={() => p.name !== currentName && choosePackage(p.name)}
              >
                {p.name === currentName ? t("currentPackage") : t("choosePackage") || "اختر الباقة"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
