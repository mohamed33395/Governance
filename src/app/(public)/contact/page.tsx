"use client";

import { useEffect, useState, type FormEvent } from "react";
import "@/styles/contact.css";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "تواصل معنا — مكتب المتخصصون في الحوكمة والامتثال للاستشارات الإدارية";
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim();
    const subject = String(data.get("subject") || "").trim();
    const message = String(data.get("message") || "").trim();
    const msgApp = String(data.get("msgApp") || "").trim();
    const msgAccount = String(data.get("msgAccount") || "").trim();
    try {
      const list = JSON.parse(localStorage.getItem("adminNotifications") || "[]");
      list.unshift({
        type: "mail",
        title: "رسالة جديدة من " + (name || "زائر"),
        body:
          subject +
          " — " +
          email +
          (phone ? " — " + phone : "") +
          (msgApp && msgAccount ? ` — تواصل عبر ${msgApp}: ${msgAccount}` : "") +
          (message ? "\n" + message : ""),
        time: Date.now(),
        read: false,
      });
      localStorage.setItem("adminNotifications", JSON.stringify(list));
    } catch {
      /* ignore */
    }
    setSubmitted(true);
    form.reset();
  }

  return (
    <main>
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">تواصل معنا</span>
          <h1 style={{ marginTop: 12 }}>نسعد بتواصلكم معنا</h1>
          <p className="lead">
            يمكنكم التواصل مع فريقنا عبر البريد الإلكتروني أو الجوال، أو إرسال رسالة مباشرة من خلال النموذج أدناه.
          </p>
          <div className="contact-chips">
            <a className="contact-chip" href="mailto:GCMC@GCMC.SA">
              <span className="icon">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="14" rx="1" />
                  <polyline points="3,6 12,13 21,6" />
                </svg>
              </span>
              GCMC@GCMC.SA
            </a>
            <a className="contact-chip" href="tel:+966550181166">
              <span className="icon">
                <svg viewBox="0 0 24 24">
                  <rect x="7" y="2" width="10" height="20" rx="2" />
                  <line x1="11" y1="18" x2="13" y2="18" />
                </svg>
              </span>
              <span dir="ltr">+966 55 018 1166</span>
            </a>
            <a className="contact-chip" href="tel:+966554181166">
              <span className="icon">
                <svg viewBox="0 0 24 24">
                  <rect x="7" y="2" width="10" height="20" rx="2" />
                  <line x1="11" y1="18" x2="13" y2="18" />
                </svg>
              </span>
              <span dir="ltr">+966 55 418 1166</span>
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="contact-grid">
            <div className="contact-info">
              <div className="divider" />
              <h2>بيانات التواصل</h2>
              <ul>
                <li>
                  <span className="icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="14" rx="1" />
                      <polyline points="3,6 12,13 21,6" />
                    </svg>
                  </span>
                  <span>
                    البريد الإلكتروني:
                    <br />
                    <a href="mailto:GCMC@GCMC.SA">GCMC@GCMC.SA</a>
                  </span>
                </li>
                <li>
                  <span className="icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="7" y="2" width="10" height="20" rx="2" />
                      <line x1="11" y1="18" x2="13" y2="18" />
                    </svg>
                  </span>
                  <span>
                    الجوال:
                    <br />
                    <a href="tel:+966550181166" dir="ltr">+966 55 018 1166</a>
                  </span>
                </li>
                <li>
                  <span className="icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="7" y="2" width="10" height="20" rx="2" />
                      <line x1="11" y1="18" x2="13" y2="18" />
                    </svg>
                  </span>
                  <span>
                    الواتساب:
                    <br />
                    <a href="tel:+966554181166" dir="ltr">+966 55 418 1166</a>
                  </span>
                </li>
                <li>
                  <span className="icon">
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                  </span>
                  <span>
                    وقت الرد:
                    <br />
                    خلال يوم عمل واحد
                  </span>
                </li>
              </ul>
            </div>

            <form className="contact-form" id="contactForm" onSubmit={handleSubmit}>
              <div className="field-grid">
                <div className="field">
                  <label>الاسم</label>
                  <input type="text" name="name" required />
                </div>
                <div className="field">
                  <label>رقم الجوال (مرتبط بالتسجيل)</label>
                  <input type="tel" name="phone" required />
                </div>
                <div className="field full">
                  <label>البريد الإلكتروني</label>
                  <input type="email" name="email" required />
                </div>
                <div className="field">
                  <label>برنامج التواصل المفضل</label>
                  <select name="msgApp" defaultValue="">
                    <option value="" disabled>
                      اختر البرنامج
                    </option>
                    <option value="واتساب">واتساب</option>
                    <option value="تليجرام">تليجرام</option>
                    <option value="سيجنال">سيجنال</option>
                  </select>
                </div>
                <div className="field">
                  <label>اسم الحساب أو الرابط</label>
                  <input type="text" name="msgAccount" placeholder="مثال: @username أو رقم الحساب" />
                </div>
                <div className="field full">
                  <label>الموضوع</label>
                  <input type="text" name="subject" required />
                </div>
                <div className="field full">
                  <label>الرسالة</label>
                  <textarea name="message" placeholder="اكتب رسالتك هنا..." required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                إرسال الرسالة
              </button>
              <p className="form-note">بإرسال هذا النموذج فإنك توافق على التواصل معك عبر البريد أو الجوال.</p>
              <div className={`form-msg${submitted ? " show" : ""}`} id="formMsg">
                تم استلام رسالتك بنجاح، سيتواصل معك فريقنا قريباً.
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
