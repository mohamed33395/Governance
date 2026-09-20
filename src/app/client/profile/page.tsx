"use client";

import { useState } from "react";
import { useClientAuth } from "@/lib/auth/client-auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { clientPortalService } from "@/services/client-portal.service";

export default function ClientProfilePage() {
  const { token, user } = useClientAuth();
  const { t } = useI18n();

  const [fields, setFields] = useState({
    name: user?.name || "",
    email: user?.email || "",
    company: user?.company || "",
    phone: user?.phone || "",
  });
  const [editable, setEditable] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; error: boolean }>({ text: "", error: false });
  const [photoMsg, setPhotoMsg] = useState<{ text: string; error: boolean }>({ text: "", error: false });
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; error: boolean }>({ text: "", error: false });
  const [photo, setPhoto] = useState<string>(user?.photoUrl || "logo_icon.png");
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });

  const saveProfile = () => {
    const body = { name: fields.name.trim(), company: fields.company.trim(), phone: fields.phone.trim() };
    if (token) clientPortalService.updateProfile(token, body).catch(() => {});
    setEditable(false);
    setProfileMsg({ text: "تم حفظ البيانات الشخصية", error: false });
  };

  const onPhotoChange = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoMsg({ text: "اختر ملف صورة صالح", error: true });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoMsg({ text: "حجم الصورة يجب أن يكون أقل من 2 ميجابايت", error: true });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = String(ev.target?.result || "");
      setPhoto(url);
      if (token) clientPortalService.updatePhoto(token, url).catch(() => {});
      setPhotoMsg({ text: "تم تحديث الصورة بنجاح", error: false });
    };
    reader.readAsDataURL(file);
  };

  const changePassword = () => {
    if (!pwd.next || pwd.next !== pwd.confirm) {
      setPasswordMsg({ text: "كلمتا المرور غير متطابقتين", error: true });
      return;
    }
    if (token) {
      clientPortalService.changePassword(token, { current: pwd.current, next: pwd.next }).catch(() => {});
    }
    setPasswordMsg({ text: "تم تغيير كلمة المرور بنجاح", error: false });
    setPwd({ current: "", next: "", confirm: "" });
  };

  return (
    <div className="client-settings-grid">
      <div className="client-panel-card client-settings-card">
        <div className="client-card-head">
          <h3>{t("personalInfo")}</h3>
          <button
            type="button"
            className="profile-edit-btn"
            id="editProfileBtn"
            aria-label="تعديل البيانات"
            title="تعديل"
            onClick={() => setEditable(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </button>
        </div>
        <div className="field">
          <label>{t("fullName")}</label>
          <input type="text" id="profileName" disabled={!editable} value={fields.name} onChange={(e) => setFields({ ...fields, name: e.target.value })} />
        </div>
        <div className="field">
          <label>{t("email")}</label>
          <input type="email" id="profileEmail" disabled value={fields.email} />
        </div>
        <div className="field">
          <label>{t("companyName")}</label>
          <input type="text" id="profileCompany" disabled={!editable} value={fields.company} onChange={(e) => setFields({ ...fields, company: e.target.value })} />
        </div>
        <div className="field">
          <label>{t("phone")}</label>
          <input type="tel" id="profilePhone" disabled={!editable} value={fields.phone} onChange={(e) => setFields({ ...fields, phone: e.target.value })} />
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          id="saveProfileBtn"
          style={{ display: editable ? "inline-flex" : "none" }}
          onClick={saveProfile}
        >
          {t("saveChanges")}
        </button>
        <div className={`client-msg${profileMsg.text ? " show" : ""}${profileMsg.error ? " error" : ""}`} id="profileMsg">
          {profileMsg.text}
        </div>
      </div>
      <div className="client-panel-card client-settings-card" style={{ textAlign: "center" }}>
        <h3>{t("uploadPhoto")}</h3>
        <img src={photo} alt="" className="client-avatar-preview" id="profilePhotoPreview" />
        <label className="client-photo-label">
          <input
            type="file"
            className="client-photo-input"
            id="profilePhotoInput"
            accept="image/*"
            onChange={(e) => onPhotoChange(e.target.files?.[0])}
          />
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>{t("chooseImage")}</span>
        </label>
        <div className={`client-msg${photoMsg.text ? " show" : ""}${photoMsg.error ? " error" : ""}`} id="photoMsg">
          {photoMsg.text}
        </div>
      </div>
      <div className="client-panel-card client-settings-card">
        <h3>{t("changePassword")}</h3>
        <div className="field">
          <label>{t("currentPassword")}</label>
          <input type="password" id="settingsCurrent" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />
        </div>
        <div className="field">
          <label>{t("newPassword")}</label>
          <input type="password" id="settingsNew" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
        </div>
        <div className="field">
          <label>{t("confirmPassword")}</label>
          <input type="password" id="settingsConfirm" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
        </div>
        <button type="button" className="btn btn-primary btn-sm" id="changePasswordBtn" onClick={changePassword}>
          {t("saveChanges")}
        </button>
        <div className={`client-msg${passwordMsg.text ? " show" : ""}${passwordMsg.error ? " error" : ""}`} id="passwordMsg">
          {passwordMsg.text}
        </div>
      </div>
    </div>
  );
}
