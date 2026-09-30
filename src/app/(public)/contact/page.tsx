"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Clock, DeviceMobile, Envelope, WhatsappLogo } from "@phosphor-icons/react";
import { Container, PageHero } from "@/components/public/Section";
import { Reveal } from "@/components/public/Reveal";
import { FormMessage, SelectField, TextAreaField, TextField } from "@/components/public/FormField";
import { CARD, FLUID, FOCUS } from "@/components/public/tokens";

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

  const LINK = `rounded-lg font-semibold text-text ${FLUID} hover:text-primary dark:hover:text-accent-soft ${FOCUS}`;

  return (
    <main>
      <PageHero
        eyebrow="تواصل معنا"
        title="نسعد بتواصلكم معنا"
        lead="يمكنكم التواصل مع فريقنا عبر البريد الإلكتروني أو الجوال، أو إرسال رسالة مباشرة من خلال النموذج أدناه."
      />

      <section className="py-24">
        <Container className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <h2 className="text-2xl font-bold text-text">بيانات التواصل</h2>
            <ul className="mt-8 flex flex-col gap-6">
              <li className="flex items-start gap-4">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-primary dark:text-accent-soft">
                  <Envelope size={24} weight="duotone" aria-hidden="true" />
                </span>
                <span className="text-sm text-muted">
                  البريد الإلكتروني
                  <br />
                  <a href="mailto:GCMC@GCMC.SA" className={LINK} dir="ltr">
                    GCMC@GCMC.SA
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-4">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-primary dark:text-accent-soft">
                  <DeviceMobile size={24} weight="duotone" aria-hidden="true" />
                </span>
                <span className="text-sm text-muted">
                  الجوال
                  <br />
                  <a href="tel:+966550181166" dir="ltr" className={LINK}>
                    +966 55 018 1166
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-4">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-primary dark:text-accent-soft">
                  <WhatsappLogo size={24} weight="duotone" aria-hidden="true" />
                </span>
                <span className="text-sm text-muted">
                  الواتساب
                  <br />
                  <a href="tel:+966554181166" dir="ltr" className={LINK}>
                    +966 55 418 1166
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-4">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-primary dark:text-accent-soft">
                  <Clock size={24} weight="duotone" aria-hidden="true" />
                </span>
                <span className="text-sm text-muted">
                  وقت الرد
                  <br />
                  <span className="font-semibold text-text">خلال يوم عمل واحد</span>
                </span>
              </li>
            </ul>
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
