"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import { ApiError } from "@/lib/api/client";

export function AdminLoginView() {
  const { t } = useI18n();
  const { login } = useAdminAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await login({
        identifier: String(form.get("identifier") ?? ""),
        password: String(form.get("password") ?? ""),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("clientLoginError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-view active" id="loginView">
      <form className="login-card" id="loginForm" onSubmit={handleSubmit}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo_icon.png" alt="" />
        <h1>{t("dashTitle")}</h1>
        <p className="sub">{t("loginSub")}</p>
        <div className="field">
          <label>{t("usernameOrEmail")}</label>
          <input type="text" name="identifier" required autoComplete="username" placeholder={t("usernameOrEmail")} />
        </div>
        <div className="field">
          <label>{t("password")}</label>
          <input type="password" name="password" required autoComplete="current-password" placeholder={t("password")} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {t("login")}
        </button>
        {error ? <p style={{ color: "#a03020", fontSize: ".85rem", marginTop: 12 }}>{error}</p> : null}
        <Link href="/" className="login-back">
          {t("backToSiteArrow")}
        </Link>
      </form>
    </div>
  );
}
