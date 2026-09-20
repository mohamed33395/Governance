"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { adminDashboardService } from "@/services/admin-dashboard.service";
import { useApiData } from "@/lib/use-api-data";
import { AdminModal, ModalCancelButton } from "@/components/admin/table";
import type { AdminSettings } from "@/types/admin-dashboard";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1770802675212-3a604a2852b2?w=40&h=40&fit=crop&crop=faces&fm=jpg&q=80";

const DEFAULT_SETTINGS: AdminSettings = {
  name: "أروى العنزي",
  role: "",
  email: "admin@gmail.com",
  avatarUrl: null,
};

export default function AdminSettingsPage() {
  const { token, user } = useAdminAuth();
  const { t } = useI18n();

  const fetcher = useCallback(
    () => (token ? adminDashboardService.getSettings(token) : Promise.reject()),
    [token]
  );
  const { data: settings, setData: setSettings } = useApiData<AdminSettings>(fetcher, DEFAULT_SETTINGS);

  const displayName = settings.name || user?.name || DEFAULT_SETTINGS.name;
  const displayRole = settings.role || t("adminRole");
  const displayEmail = settings.email || user?.email || DEFAULT_SETTINGS.email;
  const avatarSrc = settings.avatarUrl || DEFAULT_AVATAR;

  /* ===== avatar ===== */
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [avatarFeedback, setAvatarFeedback] = useState("");

  const onAvatarChange = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPendingAvatar(String(ev.target?.result || ""));
      setAvatarFeedback("");
    };
    reader.readAsDataURL(file);
  };

  const saveAvatar = () => {
    if (!pendingAvatar) return;
    setSettings((prev) => ({ ...prev, avatarUrl: pendingAvatar }));
    if (token) adminDashboardService.updateSettings(token, { avatarUrl: pendingAvatar }).catch(() => {});
    setAvatarFeedback(t("savePhoto"));
    setPendingAvatar(null);
  };

  const removeAvatar = () => {
    setSettings((prev) => ({ ...prev, avatarUrl: null }));
    if (token) adminDashboardService.updateSettings(token, { avatarUrl: null }).catch(() => {});
    setPendingAvatar(null);
    setAvatarFeedback("");
  };

  /* ===== name modal ===== */
  const [nameOpen, setNameOpen] = useState(false);
  const [nameForm, setNameForm] = useState({ name: "", role: "" });
  const [nameFeedback, setNameFeedback] = useState("");

  const openNameModal = () => {
    setNameForm({ name: displayName, role: displayRole });
    setNameFeedback("");
    setNameOpen(true);
  };

  const submitName = (e: FormEvent) => {
    e.preventDefault();
    if (!nameForm.name.trim() || !nameForm.role.trim()) return;
    setSettings((prev) => ({ ...prev, name: nameForm.name.trim(), role: nameForm.role.trim() }));
    if (token) adminDashboardService.updateSettings(token, { name: nameForm.name.trim(), role: nameForm.role.trim() }).catch(() => {});
    setNameFeedback(t("profileUpdated"));
    setTimeout(() => setNameOpen(false), 900);
  };

  /* ===== email modal ===== */
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailFeedback, setEmailFeedback] = useState("");

  const submitEmail = (e: FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setSettings((prev) => ({ ...prev, email: newEmail.trim() }));
    if (token) adminDashboardService.updateSettings(token, { email: newEmail.trim() }).catch(() => {});
    setEmailFeedback(t("emailUpdated"));
    setTimeout(() => setEmailOpen(false), 900);
  };

  /* ===== password modal ===== */
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [pwdFeedback, setPwdFeedback] = useState<{ text: string; ok: boolean }>({ text: "", ok: false });

  const submitPassword = (e: FormEvent) => {
    e.preventDefault();
    if (pwdForm.next !== pwdForm.confirm) {
      setPwdFeedback({ text: t("newPasswordMismatch"), ok: false });
      return;
    }
    if (token) {
      adminDashboardService
        .updatePassword(token, { current: pwdForm.current, next: pwdForm.next })
        .catch(() => {});
    }
    setPwdFeedback({ text: t("passwordUpdated"), ok: true });
    setTimeout(() => {
      setPasswordOpen(false);
      setPwdForm({ current: "", next: "", confirm: "" });
      setPwdFeedback({ text: "", ok: false });
    }, 900);
  };

  return (
    <>
      <h3 style={{ marginBottom: 24 }}>{t("accountSettings")}</h3>
      <div className="settings-grid">
        <div className="panel-card" id="avatarCard">
          <h3>{t("personalPhoto")}</h3>
          <div className="profile-upload">
            <img id="adminAvatarPreview" src={pendingAvatar || avatarSrc} alt={t("personalPhoto")} />
            <div className="actions">
              <label className="btn btn-outline btn-sm" htmlFor="adminAvatarInput">
                {t("changePhoto")}
              </label>
              <input
                id="adminAvatarInput"
                type="file"
                accept="image/*"
                onChange={(e) => onAvatarChange(e.target.files?.[0])}
              />
              <button
                className="btn btn-sm"
                type="button"
                id="removeAdminAvatar"
                style={{ background: "var(--cream)", border: "1px solid var(--line)", color: "var(--stone)" }}
                onClick={removeAvatar}
              >
                {t("removePhoto")}
              </button>
              <button
                className="btn btn-primary btn-sm"
                type="button"
                id="saveAdminAvatar"
                style={{ display: pendingAvatar ? "inline-flex" : "none" }}
                onClick={saveAvatar}
              >
                {t("savePhoto")}
              </button>
              <p className={`form-feedback${avatarFeedback ? " ok" : ""}`}>{avatarFeedback}</p>
            </div>
          </div>
        </div>
        <div className="panel-card">
          <h3>{t("accountData")}</h3>
          <div className="account-row" id="nameRow">
            <div>
              <div className="lbl">{t("name")}</div>
              <div className="sub">
                <span id="displayName">{displayName}</span> — <span id="displayRole">{displayRole}</span>
              </div>
            </div>
            <button className="btn btn-outline btn-sm" type="button" onClick={openNameModal}>
              {t("change")}
            </button>
          </div>
          <div
            className="account-row"
            id="emailRow"
            style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}
          >
            <div>
              <div className="lbl">{t("email")}</div>
              <div className="sub" id="displayEmail">
                {displayEmail}
              </div>
            </div>
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={() => {
                setNewEmail(displayEmail);
                setEmailFeedback("");
                setEmailOpen(true);
              }}
            >
              {t("change")}
            </button>
          </div>
          <div
            className="account-row"
            id="passwordRow"
            style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}
          >
            <div>
              <div className="lbl">{t("password")}</div>
              <div className="sub">********</div>
            </div>
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={() => {
                setPwdForm({ current: "", next: "", confirm: "" });
                setPwdFeedback({ text: "", ok: false });
                setPasswordOpen(true);
              }}
            >
              {t("change")}
            </button>
          </div>
        </div>
      </div>

      {/* NAME MODAL */}
      <AdminModal id="nameModal" open={nameOpen} onClose={() => setNameOpen(false)}>
        <h3>{t("changeNameRole")}</h3>
        <form onSubmit={submitName}>
          <div className="field">
            <label>{t("fullName")}</label>
            <input type="text" value={nameForm.name} onChange={(e) => setNameForm({ ...nameForm, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>{t("position")}</label>
            <input type="text" value={nameForm.role} onChange={(e) => setNameForm({ ...nameForm, role: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            {t("saveChanges")}
          </button>
          <ModalCancelButton onClose={() => setNameOpen(false)} style={{ marginInlineStart: 8 }} />
          <p className={`form-feedback${nameFeedback ? " ok" : ""}`}>{nameFeedback}</p>
        </form>
      </AdminModal>

      {/* EMAIL MODAL */}
      <AdminModal id="emailModal" open={emailOpen} onClose={() => setEmailOpen(false)}>
        <h3>{t("changeEmail")}</h3>
        <form className="field" onSubmit={submitEmail}>
          <label>{t("changeEmail")}</label>
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>
            {t("updateEmail")}
          </button>
          <ModalCancelButton onClose={() => setEmailOpen(false)} style={{ marginTop: 8 }} />
          <p className={`form-feedback${emailFeedback ? " ok" : ""}`}>{emailFeedback}</p>
        </form>
      </AdminModal>

      {/* PASSWORD MODAL */}
      <AdminModal id="passwordModal" open={passwordOpen} onClose={() => setPasswordOpen(false)}>
        <h3>{t("changePassword")}</h3>
        <form onSubmit={submitPassword}>
          <div className="field">
            <label>{t("currentPassword")}</label>
            <input
              type="password"
              value={pwdForm.current}
              onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>{t("newPassword")}</label>
            <input
              type="password"
              value={pwdForm.next}
              onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div className="field">
            <label>{t("confirmPassword")}</label>
            <input
              type="password"
              value={pwdForm.confirm}
              onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            {t("updatePassword")}
          </button>
          <ModalCancelButton onClose={() => setPasswordOpen(false)} style={{ marginInlineStart: 8 }} />
          <p className={`form-feedback${pwdFeedback.text ? (pwdFeedback.ok ? " ok" : " err") : ""}`}>{pwdFeedback.text}</p>
        </form>
      </AdminModal>
    </>
  );
}
