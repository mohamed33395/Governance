"use client";

import { useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function BookingPage() {
  const router = useRouter();

  useEffect(() => {
    document.title = "احجز استشارتك — مكتب المتخصصون في الحوكمة والامتثال للاستشارات الإدارية";
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams(new FormData(e.currentTarget) as unknown as Record<string, string>);
    router.push(`/payment?${params.toString()}`);
  }

  return (
    <main>
      <section className="page-hero" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <div className="booking-grid">
            <div>
              <span className="eyebrow">احجز الآن</span>
              <h1 style={{ marginTop: 12 }}>احجز استشارتك مع المستشار</h1>
              <p className="lead">
                املأ النموذج وسيتواصل معك فريقنا لتأكيد موعد جلستك مع المستشار. سرية تامة لجميع بياناتك وموضوع
                الاستشارة.
              </p>
              <ul className="booking-points">
                <li>
                  <span className="b">✓</span> سرية تامة لجميع بياناتك وموضوع استشارتك
                </li>
                <li>
                  <span className="b">✓</span> تأكيد الموعد خلال يوم عمل واحد
                </li>
                <li>
                  <span className="b">✓</span> الجلسة مع المستشار شخصياً — حضورياً أو عن بُعد
                </li>
                <li>
                  <span className="b">✓</span> تقرير مكتوب بأهم التوصيات بعد الجلسة
                </li>
              </ul>
            </div>

            <form className="booking-form" id="bookingForm" style={{ marginTop: 20 }} onSubmit={handleSubmit}>
              <div className="field-grid">
                <div className="field">
                  <label>الاسم الكامل</label>
                  <input type="text" name="name" required />
                </div>
                <div className="field">
                  <label>رقم الجوال</label>
                  <input type="tel" name="phone" required />
                </div>
                <div className="field">
                  <label>البريد الإلكتروني</label>
                  <input type="email" name="email" />
                </div>
                <div className="field">
                  <label>نوع الاستشارة</label>
                  <select name="service" required defaultValue="">
                    <option value="" disabled>
                      اختر المجال
                    </option>
                    <option>استشارات الحوكمة والامتثال</option>
                    <option>الاستشارات الإدارية</option>
                    <option>استقطاب المواهب الوظيفية</option>
                    <option>تحليل الأعمال – التخطيط</option>
                    <option>شبكات الأعمال والشؤون الاقتصادية والتجارية</option>
                    <option>استشارة عامة</option>
                  </select>
                </div>
                <div className="field">
                  <label>التاريخ المفضل</label>
                  <input type="date" name="date" required />
                </div>
                <div className="field">
                  <label>الوقت المفضل</label>
                  <select name="time" required defaultValue="">
                    <option value="" disabled>
                      اختر الوقت
                    </option>
                    <option>صباحاً (٩ – ١٢)</option>
                    <option>ظهراً (١٢ – ٤)</option>
                    <option>مساءً (٤ – ٩)</option>
                  </select>
                </div>
                <div className="field full">
                  <label>وصف مختصر للموضوع</label>
                  <textarea name="description" placeholder="اكتب باختصار موضوع الاستشارة المطلوبة..." />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                التالي: إتمام الدفع
              </button>
              <p className="form-note">بإرسال هذا النموذج ستنتقل لصفحة الدفع الآمنة. جميع بياناتك محمية.</p>
              <div className="form-msg" id="bookingMsg">
                تم استلام طلب الحجز بنجاح، سنؤكد موعدك خلال يوم عمل.
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
