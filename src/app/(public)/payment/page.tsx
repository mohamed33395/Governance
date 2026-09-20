"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import "@/styles/payment.css";

const CARD_METHODS = ["visa", "mastercard", "mada"];

const BANK = {
  name: "بنك البلاد",
  accountName: "مكتب المتخصصون في الحوكمة والامتثال للاستشارات الإدارية",
  iban: "SA5115000900146895150002",
  ibanFormatted: "SA51 1500 0900 1468 9515 0002",
  vat: "310053594400003",
};

const WALLET_HINTS: Record<string, string> = {
  apple: "سيتم تحويلك إلى Apple Pay لتأكيد الدفع.",
  google: "سيتم تحويلك إلى Google Pay لتأكيد الدفع.",
  stc: "سيتم تحويلك إلى تطبيق STC Pay لتأكيد الدفع.",
  paypal: "سيتم تحويلك إلى PayPal لتأكيد الدفع.",
  tabby: "اخترت التقسيط عبر تابي. سيتم تحويلك لإكمال طلب التقسيط.",
  tamara: "اخترت التقسيط عبر تمارا. سيتم تحويلك لإكمال طلب التقسيط.",
};

function PaymentForm() {
  const params = useSearchParams();
  const [method, setMethod] = useState("visa");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  function copyIban() {
    navigator.clipboard?.writeText(BANK.iban).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const fromPackage = params.get("package") || "";
  const fromPrice = params.get("price") || "";
  const fromName = params.get("name") || "";
  const fromPhone = params.get("phone") || "";
  const fromEmail = params.get("email") || "";
  const fromService = params.get("service") || "";
  const fromDate = params.get("date") || "";
  const fromTime = params.get("time") || "";

  const serviceText = fromPackage || fromService || "استشارة";
  const priceNum = fromPrice ? Number(fromPrice) : 0;
  const dateText = fromDate && fromTime ? `${fromDate} - ${fromTime}` : fromDate || "";

  useEffect(() => {
    document.title = "إتمام الدفع — مكتب المتخصصون في الحوكمة والامتثال للاستشارات الإدارية";
  }, []);

  function formatCardNumber(v: string) {
    return v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }

  function formatExpiry(v: string) {
    let d = v.replace(/\D/g, "").slice(0, 4);
    if (d.length > 2) d = d.slice(0, 2) + " / " + d.slice(2);
    return d;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    if (!fromName.trim() || !fromPhone.trim() || !serviceText.trim() || !priceNum) {
      setMsg({ text: "يرجى تعبئة جميع الحقول المطلوبة (الاسم، الجوال، الخدمة، المبلغ).", error: true });
      return;
    }

    if (method === "transfer") {
      setMsg({
        text: "تم تسجيل طلبك. قم بالتحويل على الحساب الموضح ثم أرسل إيصال التحويل عبر الواتساب أو البريد لتأكيد حجزك.",
        error: false,
      });
      return;
    }

    if (CARD_METHODS.includes(method)) {
      const rawNumber = cardNumber.replace(/\s/g, "");
      const rawExpiry = cardExpiry.replace(/\s/g, "");
      const rawCvv = cardCvv.trim();

      if (rawNumber.length < 15 || rawNumber.length > 16) {
        setMsg({ text: "يرجى إدخال رقم بطاقة صحيح (١٥ أو ١٦ رقماً).", error: true });
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(rawExpiry) && !/^(0[1-9]|1[0-2])\d{2}$/.test(rawExpiry)) {
        setMsg({ text: "يرجى إدخال تاريخ انتهاء صحيح (MM/YY).", error: true });
        return;
      }
      if (rawCvv.length < 3 || rawCvv.length > 4) {
        setMsg({ text: "يرجى إدخال رمز CVV صحيح (٣ أو ٤ أرقام).", error: true });
        return;
      }
      if (!cardHolder.trim()) {
        setMsg({ text: "يرجى إدخال اسم حامل البطاقة.", error: true });
        return;
      }
    }

    setMsg({ text: "تم استلام بيانات الدفع بنجاح. سيتواصل معك الفريق لتأكيد العملية.", error: false });
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCardHolder("");
    setMethod("visa");
  }

  const isCard = CARD_METHODS.includes(method);

  return (
    <div className="payment-grid">
      <div className="order-summary" id="orderSummary">
        <span className="eyebrow">ملخص الطلب</span>
        <h2 style={{ marginTop: 12, marginBottom: 18 }}>تفاصيل الدفع</h2>
        <div className="summary-row">
          <span className="label">الخدمة / الباقة</span>
          <span className="value" id="summaryService">
            {serviceText || "—"}
          </span>
        </div>
        <div className="summary-row">
          <span className="label">العميل</span>
          <span className="value" id="summaryName">
            {fromName || "—"}
          </span>
        </div>
        <div className="summary-row">
          <span className="label">رقم الجوال</span>
          <span className="value" id="summaryPhone">
            {fromPhone || "—"}
          </span>
        </div>
        <div className="summary-row">
          <span className="label">الموعد المفضل</span>
          <span className="value" id="summaryDate">
            {dateText || "—"}
          </span>
        </div>
        <div className="summary-row total">
          <span className="label">المبلغ الإجمالي</span>
          <span className="value" id="summaryPrice">
            {priceNum > 0 ? priceNum.toLocaleString("ar-SA") : "٠"} <small>ريال</small>
          </span>
        </div>
      </div>

      <form className="booking-form payment-form" id="paymentForm" style={{ marginTop: 20 }} onSubmit={handleSubmit}>
        <h2>اختر طريقة الدفع</h2>

        <div className="payment-methods" role="radiogroup" aria-label="طرق الدفع">
          <label className="payment-option">
            <input type="radio" name="method" value="visa" checked={method === "visa"} onChange={() => setMethod("visa")} />
            <span className="pay-card">
              <span className="pay-icon">
                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#1A1F71" style={{ width: 28, height: 28 }}>
                  <title>Visa</title>
                  <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z" />
                </svg>
              </span>
              <span>Visa</span>
            </span>
          </label>
          <label className="payment-option">
            <input type="radio" name="method" value="mastercard" checked={method === "mastercard"} onChange={() => setMethod("mastercard")} />
            <span className="pay-card">
              <span className="pay-icon">
                <svg viewBox="0 0 40 24" style={{ width: 34, height: 20 }} fill="none">
                  <circle cx="14" cy="12" r="10" fill="#EB001B" opacity=".95" />
                  <circle cx="26" cy="12" r="10" fill="#F79E1B" opacity=".95" />
                </svg>
              </span>
              <span>MasterCard</span>
            </span>
          </label>
          <label className="payment-option">
            <input type="radio" name="method" value="mada" checked={method === "mada"} onChange={() => setMethod("mada")} />
            <span className="pay-card">
              <span className="pay-icon">
                <svg viewBox="0 0 40 24" style={{ width: 30, height: 18 }}>
                  <rect x="1" y="1" width="38" height="22" rx="4" fill="#55A51C" />
                  <text x="20" y="16" textAnchor="middle" fontFamily="IBM Plex Sans Arabic, sans-serif" fontWeight="700" fontSize="12" fill="#fff">
                    مدى
                  </text>
                </svg>
              </span>
              <span>مدى</span>
            </span>
          </label>
          <label className="payment-option">
            <input type="radio" name="method" value="apple" checked={method === "apple"} onChange={() => setMethod("apple")} />
            <span className="pay-card">
              <span className="pay-icon">
                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000" style={{ width: 28, height: 28 }}>
                  <title>Apple</title>
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                </svg>
              </span>
              <span>Apple Pay</span>
            </span>
          </label>
          <label className="payment-option">
            <input type="radio" name="method" value="google" checked={method === "google"} onChange={() => setMethod("google")} />
            <span className="pay-card">
              <span className="pay-icon">
                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#4285F4" style={{ width: 28, height: 28 }}>
                  <title>Google</title>
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
              </span>
              <span>Google Pay</span>
            </span>
          </label>
          <label className="payment-option">
            <input type="radio" name="method" value="stc" checked={method === "stc"} onChange={() => setMethod("stc")} />
            <span className="pay-card">
              <span className="pay-icon">
                <svg viewBox="0 0 64 24" style={{ width: 32, height: 12 }}>
                  <text x="32" y="18" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="16" fill="#003DA6">
                    STC
                  </text>
                  <path d="M6 21 h52" stroke="#00B4AC" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              <span>STC Pay</span>
            </span>
          </label>
          <label className="payment-option">
            <input type="radio" name="method" value="paypal" checked={method === "paypal"} onChange={() => setMethod("paypal")} />
            <span className="pay-card">
              <span className="pay-icon">
                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#003087" style={{ width: 28, height: 28 }}>
                  <title>PayPal</title>
                  <path d="M15.607 4.653H8.941L6.645 19.251H1.82L4.862 0h7.995c3.754 0 6.375 2.294 6.473 5.513-.648-.478-2.105-.86-3.722-.86m6.57 5.546c0 3.41-3.01 6.853-6.958 6.853h-2.493L11.595 24H6.74l1.845-11.538h3.592c4.208 0 7.346-3.634 7.153-6.949a5.24 5.24 0 0 1 2.848 4.686M9.653 5.546h6.408c.907 0 1.942.222 2.363.541-.195 2.741-2.655 5.483-6.441 5.483H8.714Z" />
                </svg>
              </span>
              <span>PayPal</span>
            </span>
          </label>
          <label className="payment-option">
            <input type="radio" name="method" value="transfer" checked={method === "transfer"} onChange={() => setMethod("transfer")} />
            <span className="pay-card">
              <span className="pay-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 24, height: 24 }}>
                  <path d="M3 9.5L12 4l9 5.5" />
                  <path d="M4.5 9.5v8M9.75 9.5v8M14.25 9.5v8M19.5 9.5v8" />
                  <path d="M3 19.5h18" />
                </svg>
              </span>
              <span>تحويل بنكي</span>
            </span>
          </label>
          <label className="payment-option">
            <input type="radio" name="method" value="tabby" checked={method === "tabby"} onChange={() => setMethod("tabby")} />
            <span className="pay-card">
              <span className="pay-icon">
                <svg viewBox="0 0 48 24" style={{ width: 30, height: 15 }}>
                  <text x="24" y="17" textAnchor="middle" fontFamily="sans-serif" fontWeight="700" fontSize="14" fill="#00D692">
                    tabby
                  </text>
                </svg>
              </span>
              <span>تابي</span>
            </span>
          </label>
          <label className="payment-option">
            <input type="radio" name="method" value="tamara" checked={method === "tamara"} onChange={() => setMethod("tamara")} />
            <span className="pay-card">
              <span className="pay-icon">
                <svg viewBox="0 0 56 24" style={{ width: 32, height: 14 }}>
                  <text x="26" y="17" textAnchor="middle" fontFamily="sans-serif" fontWeight="700" fontSize="13" fill="#000">
                    tamara
                  </text>
                  <circle cx="50" cy="6" r="2.5" fill="#00D4AA" />
                </svg>
              </span>
              <span>تمارا</span>
            </span>
          </label>
        </div>

        <div className={`pay-hint${!isCard && method !== "transfer" ? " active" : ""}`} id="walletHint">
          {WALLET_HINTS[method] || "سيتم تحويلك إلى بوابة الدفع المختارة لتأكيد العملية."}
        </div>

        <div className={`bank-details${method === "transfer" ? " active" : ""}`}>
          <div className="bd-row">
            <span className="bd-label">البنك</span>
            <span className="bd-value">{BANK.name}</span>
          </div>
          <div className="bd-row">
            <span className="bd-label">اسم الحساب</span>
            <span className="bd-value">{BANK.accountName}</span>
          </div>
          <div className="bd-row">
            <span className="bd-label">رقم الآيبان (IBAN)</span>
            <span className="bd-value bd-iban">
              {BANK.ibanFormatted}
              <button type="button" className="bank-copy" onClick={copyIban}>
                {copied ? "تم النسخ ✓" : "نسخ"}
              </button>
            </span>
          </div>
          <div className="bd-row">
            <span className="bd-label">الرقم الضريبي</span>
            <span className="bd-value bd-iban">{BANK.vat}</span>
          </div>
          <p className="bd-note">بعد التحويل أرسل إيصال التحويل على الواتساب أو البريد الإلكتروني لتأكيد حجزك.</p>
        </div>

        <div className={`pay-fields${isCard ? " active" : ""}`} id="cardFields">
          <div className="field-grid">
            <div className="field full">
              <label>رقم البطاقة</label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                placeholder="٤٠٠٠ ١٢٣٤ ٥٦٧٧٨ ٩٠١٢"
                inputMode="numeric"
                autoComplete="cc-number"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              />
            </div>
            <div className="field">
              <label>تاريخ الانتهاء</label>
              <input
                type="text"
                id="cardExpiry"
                name="cardExpiry"
                placeholder="MM / YY"
                inputMode="numeric"
                autoComplete="cc-exp"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
              />
            </div>
            <div className="field">
              <label>CVV</label>
              <input
                type="text"
                id="cardCvv"
                name="cardCvv"
                placeholder="١٢٣"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
            <div className="field full">
              <label>اسم حامل البطاقة</label>
              <input
                type="text"
                id="cardHolder"
                name="cardHolder"
                placeholder="الاسم كما يظهر على البطاقة"
                autoComplete="cc-name"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
              />
            </div>
          </div>
        </div>

        <input type="hidden" id="payName" name="payName" value={fromName} />
        <input type="hidden" id="payPhone" name="payPhone" value={fromPhone} />
        <input type="hidden" id="payEmail" name="payEmail" value={fromEmail} />
        <input type="hidden" id="payService" name="payService" value={serviceText} />
        <input type="hidden" id="payAmount" name="payAmount" value={priceNum > 0 ? priceNum : ""} />
        <input type="hidden" id="payDate" name="payDate" value={dateText} />

        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          إتمام الدفع الآن
        </button>
        <p className="form-note">
          بيانات البطاقة لا تُحفظ على الموقع؛ تُعالج عبر بوابة الدفع المرخصة. عملية الدفع الحقيقية تتطلب ربط backend مع
          بوابة الدفع.
        </p>
        <div className={`form-msg${msg ? " show" : ""}${msg?.error ? " error" : ""}`} id="paymentMsg">
          {msg?.text}
        </div>
      </form>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main className="payment-page">
      <section className="page-hero" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <Suspense fallback={null}>
            <PaymentForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
