"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useClientAuth } from "@/lib/auth/client-auth-context";
import { ApiError } from "@/lib/api/client";

export function ClientLoginView() {
  const { t } = useI18n();
  const { login, signup } = useClientAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await login({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : t("clientLoginError"), error: true });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await signup({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        confirm: String(form.get("confirm") ?? ""),
      });
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : t("clientLoginError"), error: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="client-login-view active" id="clientLoginView">
      <form className="client-login-card" id="clientLoginCard" onSubmit={tab === "login" ? handleLogin : handleSignup}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo_icon.png" alt="" />
        <h1>{t("clientLoginTitle")}</h1>
        <p className="sub">{t("clientLoginSub")}</p>
        <div className="client-login-tabs">
          <button
            type="button"
            className={`client-login-tab${tab === "login" ? " active" : ""}`}
            onClick={() => setTab("login")}
          >
            {t("login")}
          </button>
          <button
            type="button"
            className={`client-login-tab${tab === "signup" ? " active" : ""}`}
            onClick={() => setTab("signup")}
          >
            {t("signUp")}
          </button>
        </div>
        <div className="client-login-panels">
          <div className={`client-login-panel${tab === "login" ? " active" : ""}`} id="clientLoginTab">
            <div className="field">
              <label>{t("email")}</label>
              <input type="email" name="email" required placeholder={t("email")} />
            </div>
            <div className="field">
              <label>{t("password")}</label>
              <input type="password" name="password" required placeholder={t("password")} />
            </div>
            {tab === "login" ? (
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {t("login")}
              </button>
            ) : null}
          </div>
          <div className={`client-login-panel${tab === "signup" ? " active" : ""}`} id="clientSignupTab">
            <div className="field">
              <label>{t("fullName")}</label>
              <input type="text" name="name" required placeholder={t("fullName")} />
            </div>
            <div className="field">
              <label>{t("email")}</label>
              <input type="email" name="email" required placeholder={t("email")} />
            </div>
            <div className="field">
              <label>{t("password")}</label>
              <input type="password" name="password" required placeholder={t("password")} />
            </div>
            <div className="field">
              <label>{t("confirmPassword")}</label>
              <input type="password" name="confirm" required placeholder={t("confirmPassword")} />
            </div>
            {tab === "signup" ? (
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {t("signUp")}
              </button>
            ) : null}
          </div>
        </div>
        <div className={`client-login-msg${message ? " show" : ""}${message?.error ? " error" : ""}`} id="clientLoginMsg">
          {message?.text}
        </div>
      </form>
    </div>
  );
}
