"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CaretDown, Clock, DeviceMobile, Envelope, WhatsappLogo } from "@phosphor-icons/react";
import { Container, PageHero } from "@/components/public/Section";
import { Reveal } from "@/components/public/Reveal";
import { FormMessage, SelectField, TextAreaField, TextField } from "@/components/public/FormField";
import { CARD, FLUID, FOCUS } from "@/components/public/tokens";

const CONTACT_PHONES = [
  { label: "+966 55 418 1166", tel: "+966554181166" },
  { label: "+966 50 318 1166", tel: "+966503181166" },
  { label: "+966 50 418 1166", tel: "+966504181166" },
  { label: "+966 53 518 1166", tel: "+966535181166" },
  { label: "+966 55 018 1166", tel: "+966550181166" },
] as const;

const CONTACT_EMAILS = [
  "gcmc@gcmc.sa",
  "info@gcmc.sa",
  "consultant@gcmc.sa",
  "it@gcmc.sa",
] as const;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [showAllEmails, setShowAllEmails] = useState(false);
  const [showAllPhones, setShowAllPhones] = useState(false);

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

  const LINK = `rounded-lg font-semibold text-text ${FLUID} hover:text-primary dark:hover:text-accent-soft ${FOCUS}`;

  return (
    <main>
      <PageHero
        eyebrow="تواصل معنا"
        title="نسعد بتواصلكم معنا"
        lead="يمكنكم التواصل مع فريقنا عبر البريد الإلكتروني أو الجوال، أو إرسال رسالة مباشرة من خلال النموذج. بيانات التواصل التالية:"
      />

      <section className="py-24">
        <Container className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className={`p-6 md:p-8 ${CARD}`}>
              <h2 className="text-2xl font-bold text-text">بيانات التواصل</h2>
              <ul className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2">
                <li className="flex items-start gap-4">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary dark:text-accent-soft">
                    <Envelope size={24} weight="duotone" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-muted">
                    البريد الإلكتروني
                    <span className="mt-2 flex flex-col items-start gap-1.5">
                      {(showAllEmails ? CONTACT_EMAILS : CONTACT_EMAILS.slice(0, 1)).map((email) => (
                        <a key={email} href={`mailto:${email}`} className={LINK} dir="ltr">
                          {email}
                        </a>
                      ))}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAllEmails((v) => !v)}
                      aria-expanded={showAllEmails}
                      className={`mt-2 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-primary ${FLUID} hover:text-accent ${FOCUS}`}
                    >
                      {showAllEmails ? "إخفاء" : `المزيد (${CONTACT_EMAILS.length - 1}+)`}
                      <CaretDown
                        size={14}
                        weight="bold"
                        aria-hidden="true"
                        className={`${FLUID} ${showAllEmails ? "rotate-180" : ""}`}
                      />
                    </button>
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary dark:text-accent-soft">
                    <DeviceMobile size={24} weight="duotone" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-muted">
                    الجوال
                    <span className="mt-2 flex flex-col items-start gap-1.5">
                      {(showAllPhones ? CONTACT_PHONES : CONTACT_PHONES.slice(0, 1)).map((p) => (
                        <a key={p.tel} href={`tel:${p.tel}`} dir="ltr" className={LINK}>
                          {p.label}
                        </a>
                      ))}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAllPhones((v) => !v)}
                      aria-expanded={showAllPhones}
                      className={`mt-2 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-primary ${FLUID} hover:text-accent ${FOCUS}`}
                    >
                      {showAllPhones ? "إخفاء" : `المزيد (${CONTACT_PHONES.length - 1}+)`}
                      <CaretDown
                        size={14}
                        weight="bold"
                        aria-hidden="true"
                        className={`${FLUID} ${showAllPhones ? "rotate-180" : ""}`}
                      />
                    </button>
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary dark:text-accent-soft">
                    <WhatsappLogo size={24} weight="duotone" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-muted">
                    الواتساب
                    <br />
                    <a href="https://wa.me/966554181166" target="_blank" rel="noopener noreferrer" dir="ltr" className={LINK}>
                      +966 55 418 1166
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary dark:text-accent-soft">
                    <Clock size={24} weight="duotone" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-muted">
                    وقت الرد
                    <br />
                    <span className="font-semibold text-text">خلال يوم عمل واحد</span>
                  </span>
                </li>
              </ul>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <form onSubmit={handleSubmit} className={`p-6 md:p-8 ${CARD}`}>
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField label="الاسم" name="name" type="text" autoComplete="name" required />
                <TextField
                  label="رقم الجوال (مرتبط بالتسجيل)"
                  name="phone"
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  required
                />
                <TextField label="البريد الإلكتروني" name="email" type="email" dir="ltr" autoComplete="email" required full />
                <SelectField label="برنامج التواصل المفضل" name="msgApp" defaultValue="">
                  <option value="" disabled>
                    اختر البرنامج
                  </option>
                  <option value="واتساب">واتساب</option>
                  <option value="تليجرام">تليجرام</option>
                  <option value="سيجنال">سيجنال</option>
                </SelectField>
                <TextField
                  label="اسم الحساب أو الرابط"
                  name="msgAccount"
                  type="text"
                  placeholder="مثال: @username أو رقم الحساب"
                />
                <TextField label="الموضوع" name="subject" type="text" required full />
                <TextAreaField label="الرسالة" name="message" placeholder="اكتب رسالتك هنا..." required full />
              </div>
              <button type="submit" className="btn btn-primary mt-8 w-full">
                إرسال الرسالة
              </button>
              <p className="mt-4 text-sm text-muted text-pretty">
                بإرسال هذا النموذج فإنك توافق على التواصل معك عبر البريد أو الجوال.
              </p>
              <FormMessage show={submitted}>تم استلام رسالتك بنجاح، سيتواصل معك فريقنا قريباً.</FormMessage>
            </form>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
