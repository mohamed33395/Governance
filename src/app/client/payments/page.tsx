"use client";

import { useCallback, useState } from "react";
import { useClientAuth } from "@/lib/auth/client-auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { clientPortalService } from "@/services/client-portal.service";
import { useApiData } from "@/lib/use-api-data";
import { ClientModal } from "@/components/client/ClientModal";
import type { OfficeAccount, PaymentMethod } from "@/types/client-portal";

interface PayMethod {
  id: string;
  name: string;
  type: "card" | "wallet";
  icon: string;
}

const PAY_METHODS: PayMethod[] = [
  { id: "visa", name: "Visa", type: "card", icon: "<svg viewBox='0 0 24 24' fill='#1A1F71' style='width:28px;height:28px;'><path d='M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z'/></svg>" },
  { id: "mastercard", name: "MasterCard", type: "card", icon: "<svg viewBox='0 0 40 24' style='width:34px;height:20px;' fill='none'><circle cx='14' cy='12' r='10' fill='#EB001B' opacity='.95'/><circle cx='26' cy='12' r='10' fill='#F79E1B' opacity='.95'/></svg>" },
  { id: "mada", name: "مدى", type: "card", icon: "<svg viewBox='0 0 40 24' style='width:30px;height:18px;'><rect x='1' y='1' width='38' height='22' rx='4' fill='#55A51C'/><text x='20' y='16' text-anchor='middle' font-family='IBM Plex Sans Arabic, sans-serif' font-weight='700' font-size='12' fill='#fff'>مدى</text></svg>" },
  { id: "apple", name: "Apple Pay", type: "wallet", icon: "<svg viewBox='0 0 24 24' fill='#000' style='width:28px;height:28px;'><path d='M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701'/></svg>" },
  { id: "google", name: "Google Pay", type: "wallet", icon: "<svg viewBox='0 0 24 24' fill='#4285F4' style='width:28px;height:28px;'><path d='M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z'/></svg>" },
  { id: "stc", name: "STC Pay", type: "wallet", icon: "<svg viewBox='0 0 64 24' style='width:32px;height:12px;'><text x='32' y='18' text-anchor='middle' font-family='sans-serif' font-weight='800' font-size='16' fill='#003DA6'>STC</text><path d='M6 21 h52' stroke='#00B4AC' stroke-width='3' stroke-linecap='round'/></svg>" },
  { id: "paypal", name: "PayPal", type: "wallet", icon: "<svg viewBox='0 0 24 24' fill='#003087' style='width:28px;height:28px;'><path d='M15.607 4.653H8.941L6.645 19.251H1.82L4.862 0h7.995c3.754 0 6.375 2.294 6.473 5.513-.648-.478-2.105-.86-3.722-.86m6.57 5.546c0 3.41-3.01 6.853-6.958 6.853h-2.493L11.595 24H6.74l1.845-11.538h3.592c4.208 0 7.346-3.634 7.153-6.949a5.24 5.24 0 0 1 2.848 4.686M9.653 5.546h6.408c.907 0 1.942.222 2.363.541-.195 2.741-2.655 5.483-6.441 5.483H8.714Z'/></svg>" },
  { id: "tabby", name: "تابي", type: "wallet", icon: "<svg viewBox='0 0 48 24' style='width:30px;height:15px;'><text x='24' y='17' text-anchor='middle' font-family='sans-serif' font-weight='700' font-size='14' fill='#00D692'>tabby</text></svg>" },
  { id: "tamara", name: "تمارا", type: "wallet", icon: "<svg viewBox='0 0 56 24' style='width:32px;height:14px;'><text x='26' y='17' text-anchor='middle' font-family='sans-serif' font-weight='700' font-size='13' fill='#000'>tamara</text><circle cx='50' cy='6' r='2.5' fill='#00D4AA'/></svg>" },
];

function luhnCheck(num: string) {
  let sum = 0;
  for (let i = 0; i < num.length; i++) {
    let d = parseInt(num[num.length - 1 - i], 10);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export default function ClientPaymentsPage() {
  const { token } = useClientAuth();
  const { t } = useI18n();

  const methodsFetcher = useCallback(
    () => (token ? clientPortalService.getPaymentMethods(token) : Promise.reject()),
    [token]
  );
  const { data: saved, setData: setSaved } = useApiData<PaymentMethod[]>(methodsFetcher, []);

  const officeFetcher = useCallback(
    () => (token ? clientPortalService.getOfficeAccounts(token) : Promise.reject()),
    [token]
  );
  const { data: officeAccounts } = useApiData<OfficeAccount[]>(officeFetcher, []);

  const [activeMethod, setActiveMethod] = useState<PayMethod | null>(null);
  const [msg, setMsg] = useState<{ text: string; error: boolean }>({ text: "", error: false });
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", holder: "", account: "" });

  const openModal = (m: PayMethod) => {
    setActiveMethod(m);
    setCard({ number: "", expiry: "", cvv: "", holder: "", account: "" });
    setMsg({ text: "", error: false });
  };

  const savePayment = () => {
    if (!activeMethod) return;
    if (activeMethod.type === "card") {
      const num = card.number.replace(/\s/g, "");
      const exp = card.expiry.trim();
      const cvv = card.cvv.trim();
      const holder = card.holder.trim();
      if (!/^\d{12,19}$/.test(num) || !luhnCheck(num)) {
        setMsg({ text: "رقم البطاقة غير صحيح", error: true });
        return;
      }
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(exp)) {
        setMsg({ text: "تاريخ الانتهاء غير صحيح (MM / YY)", error: true });
        return;
      }
      if (cvv.length < 3 || cvv.length > 4) {
        setMsg({ text: "CVV غير صحيح", error: true });
        return;
      }
      if (!holder) {
        setMsg({ text: "أدخل اسم حامل البطاقة", error: true });
        return;
      }
      const pm: PaymentMethod = {
        id: `pm_${Date.now()}`,
        method: activeMethod.id,
        mask: `${activeMethod.name} **** ${num.slice(-4)}`,
        last4: num.slice(-4),
        expiry: exp,
        holder,
      };
      setSaved((prev) => [pm, ...prev]);
      if (token) clientPortalService.addPaymentMethod(token, pm).catch(() => {});
    } else {
      const account = card.account.trim();
      if (!account) {
        setMsg({ text: "أدخل بيانات الحساب", error: true });
        return;
      }
      const pm: PaymentMethod = {
        id: `pm_${Date.now()}`,
        method: activeMethod.id,
        mask: `${activeMethod.name} — ${account}`,
        account,
      };
      setSaved((prev) => [pm, ...prev]);
      if (token) clientPortalService.addPaymentMethod(token, pm).catch(() => {});
    }
    setActiveMethod(null);
  };

  const removeSaved = (id: string) => {
    setSaved((prev) => prev.filter((p) => p.id !== id));
    if (token) clientPortalService.removePaymentMethod(token, id).catch(() => {});
  };

  const methodMeta = (id: string) => PAY_METHODS.find((m) => m.id === id) || { name: id || "بطاقة", icon: "" };

  return (
    <>
      <div className="client-panel-card">
        <h3>{t("choosePayment")}</h3>
        <p className="client-empty" style={{ marginBottom: 16 }}>
          اضغط على أي وسيلة لإضافة حسابك فيها.
        </p>
        <div className="client-pay-grid" id="payMethodsGrid">
          {PAY_METHODS.map((m) => (
            <button key={m.id} type="button" className="client-pay-btn" onClick={() => openModal(m)}>
              <span className="pay-icon" dangerouslySetInnerHTML={{ __html: m.icon }} />
              <span className="pay-name">{m.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="client-panel-card">
        <h3>حسابات الدفع المحفوظة</h3>
        <div className="saved-pay-list" id="savedPaymentsList">
          {saved.map((pm) => {
            const meta = methodMeta(pm.method);
            return (
              <div className="saved-pay-row" key={pm.id}>
                <span className="pay-icon" dangerouslySetInnerHTML={{ __html: meta.icon }} />
                <div className="saved-pay-info">
                  <strong>{meta.name}</strong>
                  <span>
                    {pm.mask || ""}
                    {pm.expiry ? ` — تنتهي ${pm.expiry}` : ""}
                    {pm.holder ? ` — ${pm.holder}` : ""}
                  </span>
                </div>
                <button type="button" className="saved-pay-remove" onClick={() => removeSaved(pm.id)}>
                  حذف
                </button>
              </div>
            );
          })}
        </div>
        <p className="client-empty" id="savedPaymentsEmpty" style={{ display: saved.length ? "none" : "block" }}>
          لا توجد حسابات دفع محفوظة بعد.
        </p>
      </div>
      <div className="client-panel-card">
        <h3>حسابات التحويل</h3>
        <p className="client-empty" style={{ marginBottom: 14 }}>
          حوّل على أحد هذه الحسابات حسب وسيلة الدفع المناسبة لك.
        </p>
        <div className="saved-pay-list" id="officeAccountsList">
          {officeAccounts.map((a) => {
            const meta = methodMeta(a.method);
            return (
              <div className="saved-pay-row" key={a.id}>
                <span className="pay-icon" dangerouslySetInnerHTML={{ __html: meta.icon }} />
                <div className="saved-pay-info">
                  <strong>
                    {meta.name} — {a.name}
                  </strong>
                  <span>{a.number}</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="client-empty" id="officeAccountsEmpty" style={{ display: officeAccounts.length ? "none" : "block" }}>
          لم تُضف حسابات تحويل بعد.
        </p>
      </div>

      {/* ADD PAYMENT METHOD MODAL */}
      <ClientModal
        id="paymentModal"
        open={!!activeMethod}
        onClose={() => setActiveMethod(null)}
        title={activeMethod ? `إضافة حساب — ${activeMethod.name}` : "إضافة حساب دفع"}
        titleId="paymentModalTitle"
      >
        <div id="payCardFields" style={{ display: activeMethod?.type === "card" ? "block" : "none" }}>
          <div className="field">
            <label>رقم البطاقة</label>
            <input
              type="text"
              id="payCardNumber"
              inputMode="numeric"
              placeholder="4000 1234 5678 9012"
              autoComplete="cc-number"
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value })}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>تاريخ الانتهاء</label>
              <input
                type="text"
                id="payCardExpiry"
                inputMode="numeric"
                placeholder="MM / YY"
                autoComplete="cc-exp"
                value={card.expiry}
                onChange={(e) => setCard({ ...card, expiry: e.target.value })}
              />
            </div>
            <div className="field">
              <label>CVV</label>
              <input
                type="text"
                id="payCardCvv"
                inputMode="numeric"
                placeholder="123"
                autoComplete="cc-csc"
                value={card.cvv}
                onChange={(e) => setCard({ ...card, cvv: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>اسم حامل البطاقة</label>
            <input
              type="text"
              id="payCardHolder"
              placeholder="الاسم كما يظهر على البطاقة"
              autoComplete="cc-name"
              value={card.holder}
              onChange={(e) => setCard({ ...card, holder: e.target.value })}
            />
          </div>
        </div>
        <div className="field" id="payAccountField" style={{ display: activeMethod && activeMethod.type !== "card" ? "block" : "none" }}>
          <label id="payAccountLabel">{activeMethod?.id === "paypal" ? "البريد الإلكتروني للحساب" : "رقم الجوال المرتبط بالحساب"}</label>
          <input
            type="text"
            id="payAccountValue"
            placeholder="05xxxxxxxx"
            value={card.account}
            onChange={(e) => setCard({ ...card, account: e.target.value })}
          />
        </div>
        <button type="button" className="btn btn-primary" id="savePaymentBtn" onClick={savePayment}>
          حفظ
        </button>
        <div className={`client-msg${msg.text ? " show" : ""}${msg.error ? " error" : ""}`} id="paymentMsg">
          {msg.text}
        </div>
      </ClientModal>
    </>
  );
}
