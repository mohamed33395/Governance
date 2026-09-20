"use client";

import { useEffect } from "react";
import Link from "next/link";

function Check() {
  return (
    <span className="check">
      <svg viewBox="0 0 24 24">
        <polyline points="4,12.5 9.5,18 20,6.5" />
      </svg>
    </span>
  );
}

export default function PackagesPage() {
  useEffect(() => {
    document.title = "الباقات — مكتب المتخصصون في الحوكمة والامتثال للاستشارات الإدارية";
  }, []);

  return (
    <>
      {/* Saudi Riyal symbol (official SAMA glyph) */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <symbol id="riyal-symbol" viewBox="0 0 1124.14 1256.39">
            <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" />
            <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" />
          </symbol>
        </defs>
      </svg>

      <section className="section" id="packages">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">الباقات</span>
            <h2>باقات استشارية لكل مرحلة نمو</h2>
            <p>ثلاث باقات مصممة بعناية لتناسب حجم منشأتكم — جميعها تشمل متابعة دورية وتقارير أداء موثقة.</p>
          </div>
          <div className="pricing-grid">
            <div className="price-card">
              <div className="tier">
                <span className="medal medal-bronze" /> الباقة البرونزية
              </div>
              <div className="price">
                ١,٩٠٠{" "}
                <svg className="riyal-icon" aria-hidden="true">
                  <use href="#riyal-symbol" />
                </svg>{" "}
                <small>/ شهرياً</small>
              </div>
              <p className="desc">للمنشآت الناشئة التي تبدأ رحلة الحوكمة والامتثال.</p>
              <ul>
                <li>
                  <Check /> استشارتان شهرياً
                </li>
                <li>
                  <Check /> مراجعة مستندين شهرياً
                </li>
                <li>
                  <Check /> دعم عبر البريد الإلكتروني
                </li>
                <li>
                  <Check /> تقرير متابعة ربع سنوي
                </li>
              </ul>
              <Link href="/details#package-1" className="btn btn-outline btn-sm" style={{ marginBottom: 12 }}>
                تفاصيل الباقة
              </Link>
              <Link href="/booking-wizard?package=الباقة%20البرونزية&price=1900" className="btn btn-outline">
                اختر الباقة
              </Link>
            </div>

            <div className="price-card">
              <div className="tier">
                <span className="medal medal-silver" /> الباقة الفضية
              </div>
              <div className="price">
                ٤,٥٠٠{" "}
                <svg className="riyal-icon" aria-hidden="true">
                  <use href="#riyal-symbol" />
                </svg>{" "}
                <small>/ شهرياً</small>
              </div>
              <p className="desc">للمنشآت المتنامية التي تحتاج مرافقة استشارية أعمق.</p>
              <ul>
                <li>
                  <Check /> ٥ استشارات شهرياً
                </li>
                <li>
                  <Check /> مراجعة حتى ٨ مستندات شهرياً
                </li>
                <li>
                  <Check /> دعم عبر الجوال والبريد
                </li>
                <li>
                  <Check /> تقرير أداء شهري
                </li>
                <li>
                  <Check /> جلسة تدريبية ربع سنوية
                </li>
              </ul>
              <Link href="/details#package-2" className="btn btn-outline btn-sm" style={{ marginBottom: 12 }}>
                تفاصيل الباقة
              </Link>
              <Link href="/booking-wizard?package=الباقة%20الفضية&price=4500" className="btn btn-outline">
                اختر الباقة
              </Link>
            </div>

            <div className="price-card featured">
              <span className="featured-tag">الأكثر تميزاً</span>
              <div className="tier">
                <span className="medal medal-gold" /> الباقة الذهبية
              </div>
              <div className="price">
                ٩,٨٠٠{" "}
                <svg className="riyal-icon" aria-hidden="true">
                  <use href="#riyal-symbol" />
                </svg>{" "}
                <small>/ شهرياً</small>
              </div>
              <p className="desc">مرافقة شاملة للمنشآت الطامحة للريادة.</p>
              <ul>
                <li>
                  <Check /> استشارات غير محدودة
                </li>
                <li>
                  <Check /> مراجعة مستندات غير محدودة
                </li>
                <li>
                  <Check /> مستشار مخصص لمنشأتكم
                </li>
                <li>
                  <Check /> دعم على مدار الساعة
                </li>
                <li>
                  <Check /> تقارير أداء أسبوعية
                </li>
                <li>
                  <Check /> حضور اجتماعات مجلس الإدارة
                </li>
              </ul>
              <Link href="/details#package-3" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>
                تفاصيل الباقة
              </Link>
              <Link href="/booking-wizard?package=الباقة%20الذهبية&price=9800" className="btn btn-gold">
                اختر الباقة
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
