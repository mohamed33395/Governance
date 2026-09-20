"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "@/styles/booking-wizard.css";
import { ClientAuthProvider, useClientAuth } from "@/lib/auth/client-auth-context";
import { clientPortalService } from "@/services/client-portal.service";
import type { BookingLocation, BookingSpecialist, PaymentMethod } from "@/types/client-portal";

/* ===== Optional legacy globals (loaded externally in the static site) ===== */
interface AvailabilitySlot {
  label: string;
  booked?: boolean;
}
interface AvailabilityResult {
  available: boolean;
  full?: boolean;
  slots: AvailabilitySlot[];
}
interface ConsultantAvailabilityApi {
  slotsFor: (name: string, date: string) => AvailabilityResult;
  isAvailableAt: (name: string, date: string, time: string) => boolean;
  summary: (name: string) => string;
  nextAvailableDays: (name: string, from: string, count: number) => string[];
}
interface ClientActivityApi {
  sameConsultant: (a: string, b: string) => boolean;
}
function availability(): ConsultantAvailabilityApi | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ConsultantAvailability?: ConsultantAvailabilityApi }).ConsultantAvailability || null;
}
function clientActivity(): ClientActivityApi | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ClientActivity?: ClientActivityApi }).ClientActivity || null;
}

const BASE_SPECIALISTS: BookingSpecialist[] = [
  { id: 1, name: "أ. أحمد العتيبي", title: "مستشار حوكمة", spec: "الحوكمة المؤسسية", photo: "logo_icon.png" },
  { id: 2, name: "د. سارة الدوسري", title: "مستشار امتثال", spec: "الامتثال التنظيمي", photo: "logo_icon.png" },
  { id: 3, name: "م. محمد الشهري", title: "مستشار إداري", spec: "تحسين الأداء", photo: "logo_icon.png" },
  { id: 4, name: "أ. أروى العنزي", title: "مستشار موارد بشرية", spec: "استقطاب المواهب", photo: "logo_icon.png" },
  { id: 5, name: "د. فهد القحطاني", title: "مستشار مالي", spec: "إدارة المخاطر", photo: "logo_icon.png" },
  { id: 6, name: "أ. نورة السبيعي", title: "مستشار جودة", spec: "جودة العمليات", photo: "logo_icon.png" },
];

const COMPANY_LOCATIONS: BookingLocation[] = [
  { id: "riyadh", name: "الفرع الرئيسي — الرياض", address: "طريق العروبة، حي العليا، برج المملكة، الدور ١٨" },
  { id: "jeddah", name: "فرع جدة", address: "طريق الملك عبدالله، حي الصحافة، مركز الإجادة" },
  { id: "dammam", name: "فرع الدمام", address: "طريق الملك فهد، حي الفيصلية، برج الأعمال" },
  { id: "makkah", name: "فرع مكة المكرمة", address: "حي العزيزية، شارع إبراهيم الخليل" },
];

const TIME_SLOTS = ["9:00 ص", "10:00 ص", "11:00 ص", "12:00 م", "1:00 م", "2:00 م", "3:00 م", "4:00 م"];
const STEP_LABELS = ["الحساب", "المستشار", "الموعد", "الموقع", "الدفع", "التأكيد"];
const STEP_NUMS = ["١", "٢", "٣", "٤", "٥", "٦"];

function luhnCheck(num: string) {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num.substring(i, i + 1), 10);
    if (isNaN(n)) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function toISODateTime(dateStr: string, timeStr: string) {
  const [time, period] = timeStr.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "م" && h !== 12) h += 12;
  if (period === "ص" && h === 12) h = 0;
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(h, m, 0, 0);
  return d;
}

interface NewCard {
  mask: string;
  expiry: string;
  last4: string;
  holder: string;
}

function BookingWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const { token, user, login, signup } = useClientAuth();

  const packageName = decodeURIComponent(params.get("package") || "");
  const priceNum = Number(params.get("price") || "") || 0;

  /* ===== state (mirrors the original `state` object) ===== */
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [account, setAccount] = useState({ email: "", name: "", phone: "", company: "" });
  const [specialist, setSpecialist] = useState<BookingSpecialist | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [location, setLocation] = useState<BookingLocation | null>(null);
  const [savedIndex, setSavedIndex] = useState(-1);
  const [card, setCard] = useState<NewCard | null>(null);
  const [savedLocations, setSavedLocations] = useState<BookingLocation[]>([]);
  const [savedPayments, setSavedPayments] = useState<PaymentMethod[]>([]);
  const [specialists, setSpecialists] = useState<BookingSpecialist[]>(BASE_SPECIALISTS);

  const [specialistSearch, setSpecialistSearch] = useState("");
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newLoc, setNewLoc] = useState({ locName: "", locAddress: "" });
  const [cardForm, setCardForm] = useState({ number: "", expiry: "", cvv: "", holder: "", save: true });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [accountMsg, setAccountMsg] = useState<{ text: string; error: boolean }>({ text: "", error: false });
  const [confirmMsg, setConfirmMsg] = useState<{ text: string; error: boolean }>({ text: "", error: false });
  const [submitting, setSubmitting] = useState(false);

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  /* ===== merge consultants registered from the admin dashboard ===== */
  useEffect(() => {
    try {
      const accs = JSON.parse(localStorage.getItem("consultantAccounts") || "[]") as { name?: string; specialty?: string }[];
      const merged = [...BASE_SPECIALISTS];
      accs.forEach((a, i) => {
        if (!a || !a.name) return;
        const dup = merged.some((s) => {
          const ca = clientActivity();
          return ca ? ca.sameConsultant(s.name, a.name!) : s.name === a.name;
        });
        if (!dup) merged.push({ id: "acc_" + i, name: a.name, title: "مستشار", spec: a.specialty || "استشارات إدارية", photo: "logo_icon.png" });
      });
      setSpecialists(merged);
    } catch {
      /* ignore */
    }
  }, []);

  /* ===== load existing client (loadClientState) ===== */
  const loadClientData = useCallback(
    async (tok: string) => {
      try {
        const [locs, pays] = await Promise.all([
          clientPortalService.getLocations(tok).catch(() => [] as BookingLocation[]),
          clientPortalService.getPaymentMethods(tok).catch(() => [] as PaymentMethod[]),
        ]);
        setSavedLocations(locs);
        setSavedPayments(pays);
      } catch {
        /* keep empty */
      }
    },
    []
  );

  useEffect(() => {
    if (!user || !token) return;
    setAccount({ email: user.email, name: user.name, phone: user.phone || "", company: user.company || "" });
    setMode("login");
    loadClientData(token);
  }, [user, token, loadClientData]);

  /* ===== derived renders ===== */
  const av = availability();
  const dayAvail: AvailabilityResult | null =
    av && specialist && date ? av.slotsFor(specialist.name, date) : null;
  const altDays: string[] =
    av && specialist && date && dayAvail && (!dayAvail.available || dayAvail.full)
      ? av.nextAvailableDays(specialist.name, date, 3)
      : [];

  const filteredSpecialists = useMemo(() => {
    const q = specialistSearch.toLowerCase();
    return specialists.filter((s) => (s.name + s.spec + s.title).toLowerCase().includes(q));
  }, [specialists, specialistSearch]);

  const slotLabels: { label: string; booked: boolean }[] = dayAvail
    ? dayAvail.slots.map((s) => ({ label: s.label, booked: !!s.booked }))
    : TIME_SLOTS.map((t) => ({ label: t, booked: false }));

  const payText =
    savedIndex >= 0 && savedPayments[savedIndex] ? savedPayments[savedIndex].mask : card ? card.mask : "—";

  const calendarHref = useMemo(() => {
    if (!date || !time || !specialist || !meetLink) return "#";
    const start = toISODateTime(date, time);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]*/g, "").split(".")[0] + "Z";
    const text = "استشارة " + packageName + " مع " + specialist.name;
    const details = "رابط الاجتماع: " + meetLink + "%0Aالعميل: " + account.name + "%0Aالباقة: " + packageName;
    const loc = location ? location.name : "";
    return (
      "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
      encodeURIComponent(text) +
      "&dates=" +
      fmt(start) +
      "/" +
      fmt(end) +
      "&details=" +
      details +
      "&location=" +
      encodeURIComponent(loc)
    );
  }, [date, time, specialist, meetLink, packageName, account.name, location]);

  /* ===== actions ===== */
  const generateMeet = useCallback(() => {
    if (!date || !time) return;
    const code =
      Math.random().toString(36).substring(2, 5) +
      "-" +
      Math.random().toString(36).substring(2, 5) +
      "-" +
      Math.random().toString(36).substring(2, 5);
    setMeetLink("https://meet.google.com/" + code);
  }, [date, time]);

  const showStep = (n: number) => {
    setStep(n);
    setAccountMsg({ text: "", error: false });
    setConfirmMsg({ text: "", error: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateAccount = async (): Promise<boolean> => {
    setAccountMsg({ text: "", error: false });
    if (mode === "register") {
      const f = document.getElementById("registerForm") as HTMLFormElement;
      const fd = new FormData(f);
      const name = String(fd.get("name") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const phone = String(fd.get("phone") || "").trim();
      const company = String(fd.get("company") || "").trim();
      const pass = String(fd.get("password") || "");
      const confirm = String(fd.get("confirm") || "");
      if (!name || !email || !phone || !pass) {
        setAccountMsg({ text: "املأ جميع الحقول المطلوبة", error: true });
        return false;
      }
      if (pass !== confirm) {
        setAccountMsg({ text: "كلمتا المرور غير متطابقتين", error: true });
        return false;
      }
      try {
        await signup({ name, email, password: pass, confirm });
      } catch (e) {
        setAccountMsg({ text: e instanceof Error ? e.message : "تعذر إنشاء الحساب", error: true });
        return false;
      }
      setAccount({ name, email, phone, company });
      const tok = window.localStorage.getItem("clientAuthToken");
      if (tok) {
        clientPortalService.updateProfile(tok, { phone, company }).catch(() => {});
        loadClientData(tok);
      }
      return true;
    }
    const f = document.getElementById("loginForm") as HTMLFormElement;
    const email = (f.querySelector('[name="email"]') as HTMLInputElement).value.trim();
    const pass = (f.querySelector('[name="password"]') as HTMLInputElement).value;
    if (!email || !pass) {
      setAccountMsg({ text: "أدخل البريد الإلكتروني وكلمة المرور", error: true });
      return false;
    }
    try {
      await login({ email, password: pass });
    } catch {
      setAccountMsg({ text: "البريد الإلكتروني أو كلمة المرور غير صحيحة", error: true });
      return false;
    }
    const tok = window.localStorage.getItem("clientAuthToken");
    if (tok) loadClientData(tok);
    return true;
  };

  const validateDateTime = (): boolean => {
    if (!date || !time) {
      setAccountMsg({ text: "اختر التاريخ والوقت", error: true });
      return false;
    }
    if (new Date(date + "T00:00:00") < new Date(new Date().setHours(0, 0, 0, 0))) {
      setAccountMsg({ text: "لا يمكن اختيار تاريخ سابق", error: true });
      return false;
    }
    const av2 = availability();
    if (av2 && specialist && !av2.isAvailableAt(specialist.name, date, time)) {
      setAccountMsg({ text: "هذا الموعد غير متاح للمستشار المختار — اختر موعداً آخر", error: true });
      return false;
    }
    generateMeet();
    return true;
  };

  const validatePayment = (): boolean => {
    if (savedIndex >= 0) return true;
    const num = cardForm.number.replace(/\s/g, "");
    const exp = cardForm.expiry.replace(/\s/g, "");
    const cvv = cardForm.cvv.trim();
    const holder = cardForm.holder.trim();
    if (num.length < 15 || num.length > 16 || !luhnCheck(num)) {
      setAccountMsg({ text: "أدخل رقم بطاقة صحيح", error: true });
      return false;
    }
    if (!/^(0[1-9]|1[0-2])\/?\d{2}$/.test(exp) && !/^(0[1-9]|1[0-2])\d{2}$/.test(exp)) {
      setAccountMsg({ text: "تاريخ الانتهاء غير صحيح", error: true });
      return false;
    }
    if (cvv.length < 3 || cvv.length > 4) {
      setAccountMsg({ text: "CVV غير صحيح", error: true });
      return false;
    }
    if (!holder) {
      setAccountMsg({ text: "أدخل اسم حامل البطاقة", error: true });
      return false;
    }
    const newCard: NewCard = { mask: "**** " + num.slice(-4), expiry: exp, last4: num.slice(-4), holder };
    setCard(newCard);
    if (cardForm.save && token) {
      clientPortalService
        .addPaymentMethod(token, { method: "card", mask: newCard.mask, last4: newCard.last4, expiry: newCard.expiry, holder: newCard.holder })
        .catch(() => {});
    }
    return true;
  };

  const doConfirm = async () => {
    if (!agreeTerms) {
      setConfirmMsg({ text: "يجب الموافقة على الشروط والأحكام", error: true });
      return;
    }
    setConfirmMsg({ text: "", error: false });
    if (!token || !account.email) {
      setConfirmMsg({ text: "خطأ في بيانات الحساب", error: true });
      return;
    }
    setSubmitting(true);
    try {
      await clientPortalService
        .createBooking(token, {
          package: packageName,
          price: priceNum,
          specialist,
          date,
          time,
          meetLink,
          location,
          status: "مجدول",
        })
        .catch(() => null);
      if (packageName) clientPortalService.choosePackage(token, packageName).catch(() => {});
    } finally {
      setTimeout(() => router.push("/client/bookings"), 1200);
    }
  };

  const onNext = async () => {
    setAccountMsg({ text: "", error: false });
    setConfirmMsg({ text: "", error: false });
    if (step === 1) {
      if (!(await validateAccount())) return;
    } else if (step === 2) {
      if (!specialist) {
        setAccountMsg({ text: "اختر مستشاراً", error: true });
        return;
      }
    } else if (step === 3) {
      if (!validateDateTime()) return;
    } else if (step === 4) {
      if (!location) {
        setAccountMsg({ text: "اختر موقعاً", error: true });
        return;
      }
    } else if (step === 5) {
      if (!validatePayment()) return;
    } else if (step === 6) {
      doConfirm();
      return;
    }
    showStep(step + 1);
  };

  const addNewLocation = () => {
    const name = newLoc.locName.trim();
    const address = newLoc.locAddress.trim();
    if (!name || !address) return;
    const loc: BookingLocation = { id: "loc_" + Date.now(), name, address };
    if (token) clientPortalService.addLocation(token, { name, address }).catch(() => {});
    setSavedLocations((prev) => [loc, ...prev]);
    setLocation(loc);
    setNewLoc({ locName: "", locAddress: "" });
    setShowNewLocation(false);
  };

  const pickSpecialist = (s: BookingSpecialist, unavailable: boolean) => {
    if (unavailable) return;
    setSpecialist(s);
    setTime("");
  };

  const pickTime = (t: string, booked: boolean) => {
    if (booked) return;
    setTime(t);
    setTimeout(generateMeet, 0);
  };

  const pickAltDay = (iso: string) => {
    setDate(iso);
    setTime("");
  };

  const onDateChange = (v: string) => {
    setDate(v);
    setTime("");
    setTimeout(generateMeet, 0);
  };

  /* ===== card input formatting (same as original) ===== */
  const onCardNumber = (v: string) => {
    let x = v.replace(/\D/g, "").slice(0, 16);
    x = x.replace(/(.{4})/g, "$1 ").trim();
    setCardForm((p) => ({ ...p, number: x }));
  };
  const onCardExpiry = (v: string) => {
    let x = v.replace(/\D/g, "").slice(0, 4);
    if (x.length > 2) x = x.slice(0, 2) + " / " + x.slice(2);
    setCardForm((p) => ({ ...p, expiry: x }));
  };
  const onCardCvv = (v: string) => setCardForm((p) => ({ ...p, cvv: v.replace(/\D/g, "").slice(0, 4) }));

  const allLocations = [...savedLocations, ...COMPANY_LOCATIONS];

  return (
    <main>
      <section className="page-hero">
        <div className="wrap">
          <h1>إنشاء حجز استشاري</h1>
          <div className="wizard-grid" style={{ marginTop: 22 }}>
            <div className="order-summary">
              <span className="eyebrow">ملخص الحجز</span>
              <h2 style={{ marginTop: 10 }}>تفاصيل الطلب</h2>
              <div className="summary-row">
                <span className="label">الباقة</span>
                <span className="value" id="sumPackage">{packageName || "—"}</span>
              </div>
              <div className="summary-row">
                <span className="label">المستشار</span>
                <span className="value" id="sumSpecialist">{specialist ? `${specialist.name} — ${specialist.spec}` : "—"}</span>
              </div>
              <div className="summary-row">
                <span className="label">الموعد</span>
                <span className="value" id="sumDateTime">{date && time ? `${date} | ${time}` : "—"}</span>
              </div>
              <div className="summary-row">
                <span className="label">الموقع</span>
                <span className="value" id="sumLocation">{location ? location.name : "—"}</span>
              </div>
              <div className="summary-row">
                <span className="label">طريقة الدفع</span>
                <span className="value" id="sumPayment">{payText}</span>
              </div>
              <div className="summary-row total">
                <span className="label">المبلغ الإجمالي</span>
                <span className="value" id="sumPrice">
                  {priceNum > 0 ? priceNum.toLocaleString("ar-SA") : "٠"} <small>ريال</small>
                </span>
              </div>
            </div>

            <div className="wizard-card">
              <div className="stepper" id="stepper">
                {STEP_LABELS.map((label, i) => {
                  const n = i + 1;
                  const cls = n === step ? "active" : n < step ? "completed" : "";
                  return (
                    <div key={n} className={`stepper-step ${cls}`} data-step={n}>
                      <span className="step-num">{STEP_NUMS[i]}</span>
                      <span className="step-label">{label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Step 1: Account */}
              <div className={`wizard-step${step === 1 ? " active" : ""}`} data-step="1">
                <h2 id="accountTitle">{mode === "register" ? "إنشاء حساب جديد" : "تسجيل الدخول"}</h2>
                <p className="auth-toggle" id="accountToggle">
                  {mode === "register" ? (
                    <>
                      لديك حساب بالفعل؟{" "}
                      <button type="button" id="switchToLogin" onClick={() => setMode("login")}>
                        سجّل دخول
                      </button>
                    </>
                  ) : (
                    <>
                      ليس لديك حساب؟{" "}
                      <button type="button" id="switchToRegister" onClick={() => setMode("register")}>
                        أنشئ حساباً
                      </button>
                    </>
                  )}
                </p>

                <form id="registerForm" style={{ display: mode === "register" ? "block" : "none" }}>
                  <div className="field-grid">
                    <div className="field">
                      <label>الاسم الكامل</label>
                      <input type="text" name="name" required placeholder="اسم المسؤول عن الشركة" defaultValue={account.name} />
                    </div>
                    <div className="field">
                      <label>البريد الإلكتروني</label>
                      <input type="email" name="email" required placeholder="example@company.sa" defaultValue={account.email} />
                    </div>
                    <div className="field">
                      <label>رقم الجوال</label>
                      <input type="tel" name="phone" required placeholder="05xxxxxxxx" defaultValue={account.phone} />
                    </div>
                    <div className="field">
                      <label>اسم الشركة</label>
                      <input type="text" name="company" placeholder="اسم المنشأة" defaultValue={account.company} />
                    </div>
                    <div className="field">
                      <label>كلمة المرور</label>
                      <input type="password" name="password" required placeholder="٨ أحرف على الأقل" />
                    </div>
                    <div className="field">
                      <label>تأكيد كلمة المرور</label>
                      <input type="password" name="confirm" required placeholder="أعد إدخال كلمة المرور" />
                    </div>
                  </div>
                </form>

                <form id="loginForm" style={{ display: mode === "login" ? "block" : "none" }}>
                  <div className="field">
                    <label>البريد الإلكتروني</label>
                    <input type="email" name="email" required placeholder="example@company.sa" defaultValue={account.email} />
                  </div>
                  <div className="field">
                    <label>كلمة المرور</label>
                    <input type="password" name="password" required placeholder="كلمة المرور" />
                  </div>
                </form>
                <div className={`form-msg${accountMsg.text && step === 1 ? " show" : ""}${accountMsg.error ? " error" : ""}`} id="accountMsg">
                  {step === 1 ? accountMsg.text : ""}
                </div>
              </div>

              {/* Step 2: Specialist */}
              <div className={`wizard-step${step === 2 ? " active" : ""}`} data-step="2">
                <h2>اختر المستشار</h2>
                <div className="field">
                  <input
                    type="text"
                    id="specialistSearch"
                    placeholder="ابحث بالاسم أو التخصص..."
                    value={specialistSearch}
                    onChange={(e) => setSpecialistSearch(e.target.value)}
                  />
                </div>
                <div className="specialist-grid" id="specialistGrid">
                  {filteredSpecialists.map((s) => {
                    let unavailable = false;
                    if (av && date) {
                      const r = av.slotsFor(s.name, date);
                      unavailable = !r.available || !!r.full || (!!time && !av.isAvailableAt(s.name, date, time));
                    }
                    const availText = av ? av.summary(s.name) || "غير متاح" : "";
                    return (
                      <div
                        key={s.id}
                        className={`specialist-card${specialist && specialist.id === s.id ? " selected" : ""}${unavailable ? " disabled" : ""}`}
                        onClick={() => pickSpecialist(s, unavailable)}
                      >
                        <img src={s.photo} alt={s.name} />
                        <div className="name">{s.name}</div>
                        <div className="title">{s.title}</div>
                        <div className="spec">{s.spec}</div>
                        {availText && <div className="avail">{availText}</div>}
                        {unavailable && <div className="unavail-tag">غير متاح في هذا الموعد</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Date & Time */}
              <div className={`wizard-step${step === 3 ? " active" : ""}`} data-step="3">
                <h2>اختر التاريخ والوقت</h2>
                <div className="field">
                  <label>التاريخ</label>
                  <input type="date" id="meetingDate" required min={minDate} value={date} onChange={(e) => onDateChange(e.target.value)} />
                </div>
                <div className="field">
                  <label>الوقت المتاح</label>
                  <div className="time-slots" id="timeSlots">
                    {slotLabels.map((s) => {
                      const disabled = (dayAvail && !dayAvail.available) || s.booked;
                      return (
                        <div
                          key={s.label}
                          className={`time-slot${time === s.label ? " selected" : ""}${disabled ? " disabled" : ""}`}
                          onClick={() => pickTime(s.label, !!disabled)}
                        >
                          {s.label}
                        </div>
                      );
                    })}
                  </div>
                  <p
                    id="slotsHint"
                    style={{ display: dayAvail && (!dayAvail.available || dayAvail.full) ? "block" : "none", fontSize: ".8rem", color: "var(--stone)", marginTop: 8 }}
                  >
                    {dayAvail && !dayAvail.available
                      ? "المستشار غير متاح في هذا اليوم — اختر أحد الأيام المتاحة:"
                      : dayAvail && dayAvail.full
                        ? "جميع مواعيد هذا اليوم محجوزة — الأيام المتاحة للحجز:"
                        : ""}
                  </p>
                  <div id="altDays" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                    {altDays.map((iso) => (
                      <button key={iso} type="button" className="alt-day-btn" onClick={() => pickAltDay(iso)}>
                        {iso}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="meet-box" id="meetBox" style={{ display: meetLink ? "block" : "none" }}>
                  <strong>رابط الاجتماع (Google Meet)</strong>
                  <a id="meetLink" href={meetLink || "#"} target="_blank" rel="noopener">
                    {meetLink}
                  </a>
                  <p className="form-note" style={{ marginTop: 8 }}>
                    سيتم إرسال الرابط في تأكيد الحجز. يمكنك إضافته إلى تقويم Google.
                  </p>
                  <a id="calendarLink" className="btn btn-outline btn-sm" href={calendarHref} target="_blank" rel="noopener" style={{ marginTop: 10 }}>
                    إضافة إلى Google Calendar
                  </a>
                </div>
              </div>

              {/* Step 4: Location */}
              <div className={`wizard-step${step === 4 ? " active" : ""}`} data-step="4">
                <h2>اختر موقع الشركة</h2>
                <div className="location-list" id="locationList">
                  {allLocations.map((loc, idx) => {
                    const isSaved = idx < savedLocations.length;
                    return (
                      <div
                        key={loc.id}
                        className={`location-card${location && location.id === loc.id ? " selected" : ""}`}
                        onClick={() => setLocation(loc)}
                      >
                        <strong>
                          {loc.name}
                          {isSaved && <span style={{ fontSize: ".7rem", color: "var(--gold)" }}> (محفوظ)</span>}
                        </strong>
                        <span>{loc.address}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 20 }}>
                  <button type="button" className="btn btn-ghost btn-sm" id="toggleNewLocation" onClick={() => setShowNewLocation((v) => !v)}>
                    + إضافة موقع جديد
                  </button>
                  <form id="newLocationForm" style={{ display: showNewLocation ? "block" : "none", marginTop: 12 }}>
                    <div className="field-grid">
                      <div className="field">
                        <label>اسم الموقع</label>
                        <input
                          type="text"
                          name="locName"
                          placeholder="مثال: الفرع الرئيسي"
                          required
                          value={newLoc.locName}
                          onChange={(e) => setNewLoc({ ...newLoc, locName: e.target.value })}
                        />
                      </div>
                      <div className="field full">
                        <label>العنوان التفصيلي</label>
                        <input
                          type="text"
                          name="locAddress"
                          placeholder="المدينة، الحي، الشارع"
                          required
                          value={newLoc.locAddress}
                          onChange={(e) => setNewLoc({ ...newLoc, locAddress: e.target.value })}
                        />
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" id="addNewLocation" onClick={addNewLocation}>
                      حفظ الموقع
                    </button>
                  </form>
                </div>
              </div>

              {/* Step 5: Payment */}
              <div className={`wizard-step${step === 5 ? " active" : ""}`} data-step="5">
                <h2>اختر طريقة الدفع</h2>
                <div id="savedPayMethods" style={{ display: savedPayments.length ? "block" : "none" }}>
                  <p style={{ fontSize: ".85rem", color: "var(--stone)", marginBottom: 10 }}>طرق الدفع المحفوظة</p>
                  <div className="pay-methods" id="payMethodsList">
                    {savedPayments.map((m, i) => (
                      <div
                        key={m.id || i}
                        className={`pay-method-card${savedIndex === i ? " selected" : ""}`}
                        onClick={() => {
                          setSavedIndex(i);
                          setCard(null);
                        }}
                      >
                        <div className="mask">{m.mask}</div>
                        {m.expiry && <div className="exp">تنتهي {m.expiry}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: ".85rem", color: "var(--stone)", margin: "18px 0 10px" }}>بطاقة جديدة</p>
                <form id="newCardForm">
                  <div className="field-grid">
                    <div className="field full">
                      <label>رقم البطاقة</label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="٤٠٠٠ ١٢٣٤ ٥٦٧٧ ٩٠١٢"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        value={cardForm.number}
                        onChange={(e) => onCardNumber(e.target.value)}
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
                        value={cardForm.expiry}
                        onChange={(e) => onCardExpiry(e.target.value)}
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
                        value={cardForm.cvv}
                        onChange={(e) => onCardCvv(e.target.value)}
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
                        value={cardForm.holder}
                        onChange={(e) => setCardForm({ ...cardForm, holder: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="confirm-box">
                    <input
                      type="checkbox"
                      id="saveCard"
                      checked={cardForm.save}
                      onChange={(e) => setCardForm({ ...cardForm, save: e.target.checked })}
                    />
                    <label htmlFor="saveCard">حفظ البطاقة لعمليات الدفع المستقبلية</label>
                  </div>
                </form>
              </div>

              {/* Step 6: Confirm */}
              <div className={`wizard-step${step === 6 ? " active" : ""}`} data-step="6">
                <h2>تأكيد الحجز والدفع</h2>
                <div
                  id="confirmSummary"
                  style={{ background: "var(--cream)", border: "1px solid var(--line)", borderRadius: 6, padding: 16, marginBottom: 18, fontSize: ".88rem", lineHeight: 2 }}
                >
                  <strong>الباقة:</strong> {packageName || "—"}
                  <br />
                  <strong>السعر:</strong> {priceNum > 0 ? priceNum.toLocaleString("ar-SA") : "٠"} ريال
                  <br />
                  <strong>العميل:</strong> {account.name || "—"} — {account.email || "—"}
                  <br />
                  <strong>المستشار:</strong> {specialist ? `${specialist.name} (${specialist.spec})` : "—"}
                  <br />
                  <strong>الموعد:</strong> {date ? `${date} | ${time}` : "—"}
                  <br />
                  <strong>رابط الاجتماع:</strong>{" "}
                  <a href={meetLink || "#"} target="_blank" rel="noopener">
                    {meetLink}
                  </a>
                  <br />
                  <strong>الموقع:</strong> {location ? `${location.name} — ${location.address}` : "—"}
                  <br />
                  <strong>الدفع:</strong> {payText}
                </div>
                <div className="confirm-box">
                  <input type="checkbox" id="agreeTerms" required checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                  <label htmlFor="agreeTerms">أوافق على الشروط والأحكام وسياسة الحجز والاستشارة.</label>
                </div>
                <div className={`form-msg${confirmMsg.text ? " show" : ""}${confirmMsg.error ? " error" : ""}`} id="confirmMsg">
                  {confirmMsg.text}
                </div>
              </div>

              <div className="wizard-actions">
                <button type="button" className="btn btn-ghost" id="prevBtn" style={{ display: step === 1 ? "none" : "inline-flex" }} onClick={() => showStep(step - 1)}>
                  السابق
                </button>
                <button type="button" className="btn btn-primary" id="nextBtn" disabled={submitting} onClick={onNext}>
                  {submitting ? "جارٍ إتمام الحجز..." : step === 6 ? "تأكيد الحجز والدفع" : "التالي"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function BookingWizardPage() {
  return (
    <ClientAuthProvider>
      <Suspense fallback={null}>
        <BookingWizard />
      </Suspense>
    </ClientAuthProvider>
  );
}
