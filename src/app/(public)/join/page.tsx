"use client";

import { useEffect, useState, type FormEvent } from "react";
import "@/styles/join.css";

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

  return (
    <main>
      <section className="join-hero">
        <div className="wrap">
          <div className="join-grid">
            <div>
              <span className="eyebrow">شبكة الخبراء</span>
              <h1>انضم إلى شبكة خبرائنا المعتمدين</h1>
              <p className="lead">
                نبني شبكة من الخبراء والاستشاريين المعتمدين في مختلف المجالات. زودنا ببياناتك المهنية لينضم ملفك إلى
                قاعدة الخبراء لدينا.
              </p>
              <ul className="join-points">
                <li>
                  <span className="b">•</span> مراجعة الملفات من قبل فريق مختص خلال أيام عمل
                </li>
                <li>
                  <span className="b">•</span> فرص تعاون في مشاريع استشارية نشطة
                </li>
                <li>
                  <span className="b">•</span> عضوية ضمن شبكة أعمال معتمدة ومرخصة
                </li>
              </ul>
            </div>

            <form className="join-form" id="joinForm" onSubmit={handleSubmit}>
              <div className="field-grid">
                <div className="field">
                  <label>الاسم</label>
                  <input type="text" required />
                </div>
                <div className="field">
                  <label>المؤهل</label>
                  <input type="text" required />
                </div>
                <div className="field">
                  <label>الخبرات المهنية</label>
                  <input type="text" />
                </div>
                <div className="field">
                  <label>مجالات تقديم الخدمة</label>
                  <input type="text" />
                </div>
                <div className="field">
                  <label>الرخص أو الاعتمادات المهنية</label>
                  <input type="text" />
                </div>
                <div className="field">
                  <label>رقم الجوال</label>
                  <input type="tel" required />
                </div>
                <div className="field">
                  <label>البريد الإلكتروني</label>
                  <input type="email" required />
                </div>
                <div className="field">
                  <label>الدولة – المدينة</label>
                  <input type="text" />
                </div>
                <div className="field full">
                  <label>حسابات التواصل الاجتماعي</label>
                  <input type="text" />
                </div>
                <div className="field full">
                  <label>حساب اللينكدإن</label>
                  <input type="text" />
                </div>
              </div>
              <div className="rules-box">
                <h3>القواعد والتعليمات</h3>
                <ol className="join-rules">
                  {RULES.map((rule, i) => (
                    <li key={i}>
                      <span className="rn">{i + 1}</span>
                      <p>{rule}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <label className="rules-check">
                <input type="checkbox" required />
                <span>أقر بأنني اطلعت على القواعد والتعليمات الموضحة أعلاه وأوافق عليها</span>
              </label>
              <button type="submit" className="btn btn-gold" style={{ width: "100%", justifyContent: "center" }}>
                إرسال الطلب
              </button>
              <p className="form-note">بإرسال هذا النموذج فإنك توافق على مراجعة فريقنا لبياناتك المهنية لأغراض الانضمام فقط.</p>
              <div className={`form-msg${submitted ? " show" : ""}`} id="formMsg">
                تم استلام طلبك بنجاح، سيتواصل معك فريقنا قريباً.
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
