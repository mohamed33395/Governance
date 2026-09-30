"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { Container, PageHero } from "@/components/public/Section";
import { Reveal } from "@/components/public/Reveal";
import { FormMessage, TextField } from "@/components/public/FormField";
import { CARD } from "@/components/public/tokens";

const RULES = [
  "لا يسمح باستخدام الذكاء الاصطناعي في تحليل الأعمال أو صياغة التقارير.",
  "لا يسمح باستخدام الأسماء المستعارة أو الكنى.",
  "لا يسمح بإعطاء العملاء الأرقام الشخصية أو حسابات البريد الإلكتروني أو حسابات التواصل الاجتماعي الشخصية — التواصل مع العميل يتم داخل المنصة فقط.",
  "يجب التوقيع على اتفاقية عدم الإفشاء والسرية قبل البدء بأداء المهام.",
  "يتعين على الاستشاري متابعة تاريخ صلاحية ترخيصه.",
  "يتعين رفع البيانات التالية قبل تسجيل الاستشاري: رقم الحساب البنكي، العنوان الوطني، رقم الهوية وتاريخ الميلاد، السجل التجاري، عقد التأسيس، شهادة تسجيل الضريبة.",
  "يجب رفع السيرة الذاتية.",
  "يجب إعداد سابقة الأعمال.",
];

export default function JoinPage() {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "انضم إلينا — مكتب المتخصصون في الحوكمة والامتثال للاستشارات الإدارية";
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    e.currentTarget.reset();
  }

  const POINTS = [
    "مراجعة الملفات من قبل فريق مختص خلال أيام عمل",
    "فرص تعاون في مشاريع استشارية نشطة",
    "عضوية ضمن شبكة أعمال معتمدة ومرخصة",
  ];

  return (
    <main>
      <PageHero
        eyebrow="شبكة الخبراء"
        title="انضم إلى شبكة خبرائنا المعتمدين"
        lead="نبني شبكة من الخبراء والاستشاريين المعتمدين في مختلف المجالات. زودنا ببياناتك المهنية لينضم ملفك إلى قاعدة الخبراء لدينا."
      >
        <ul className="flex flex-col gap-3">
          {POINTS.map((p) => (
            <li key={p} className="flex items-start gap-2 text-base text-text">
              <CheckCircle size={24} weight="fill" aria-hidden="true" className="shrink-0 text-accent" />
              {p}
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="py-24">
        <Container>
          <Reveal>
            <form onSubmit={handleSubmit} className={`mx-auto max-w-[880px] p-6 md:p-8 ${CARD}`}>
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField label="الاسم" type="text" autoComplete="name" required />
                <TextField label="المؤهل" type="text" required />
                <TextField label="الخبرات المهنية" type="text" />
                <TextField label="مجالات تقديم الخدمة" type="text" />
                <TextField label="الرخص أو الاعتمادات المهنية" type="text" />
                <TextField label="رقم الجوال" type="tel" dir="ltr" autoComplete="tel" required />
                <TextField label="البريد الإلكتروني" type="email" dir="ltr" autoComplete="email" required />
                <TextField label="الدولة – المدينة" type="text" />
                <TextField label="حسابات التواصل الاجتماعي" type="text" full />
                <TextField label="حساب اللينكدإن" type="text" dir="ltr" full />
              </div>

              <div className="mt-8 rounded-xl border border-border bg-background p-2">
                <div className="max-h-64 overflow-y-auto rounded-lg p-4" tabIndex={0} role="region" aria-labelledby="rules-title">
                  <h2 id="rules-title" className="text-base font-bold text-text">
                    القواعد والتعليمات
                  </h2>
                  <ol className="mt-4 flex flex-col gap-3">
                    {RULES.map((rule, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-accent-soft"
                        >
                          {i + 1}
                        </span>
                        <p className="pt-1 text-sm text-muted text-pretty">{rule}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-text">
                <input type="checkbox" required className="mt-1 size-4 shrink-0 accent-primary" />
                <span>أقر بأنني اطلعت على القواعد والتعليمات الموضحة أعلاه وأوافق عليها</span>
              </label>

              <button type="submit" className="btn btn-gold mt-8 w-full">
                إرسال الطلب
              </button>
              <p className="mt-4 text-sm text-muted text-pretty">
                بإرسال هذا النموذج فإنك توافق على مراجعة فريقنا لبياناتك المهنية لأغراض الانضمام فقط.
              </p>
              <FormMessage show={submitted}>تم استلام طلبك بنجاح، سيتواصل معك فريقنا قريباً.</FormMessage>
            </form>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
