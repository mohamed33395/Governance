"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { adminDashboardService } from "@/services/admin-dashboard.service";
import { useApiData } from "@/lib/use-api-data";
import type { ConsultantProfile } from "@/types/admin-dashboard";

const EMPTY_PROFILE: ConsultantProfile = {
  name: "",
  bio: "",
  certificates: [],
  achievements: [],
  photo: null,
  ratingAvg: 0,
  ratingCount: 0,
  reviews: [],
};

const textareaStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  background: "var(--cream)",
  color: "var(--ink)",
  padding: "12px 14px",
  fontSize: ".92rem",
  borderRadius: 10,
  fontFamily: "inherit",
  width: "100%",
  resize: "vertical",
};

export default function AdminProfilePage() {
  const { token, user } = useAdminAuth();
  const { t } = useI18n();

  const fetcher = useCallback(
    () => (token ? adminDashboardService.getConsultantProfile(token) : Promise.reject()),
    [token]
  );
  const { data: profile, setData: setProfile } = useApiData<ConsultantProfile>(fetcher, EMPTY_PROFILE);

  const [photo, setPhoto] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const displayName = profile.name || user?.name || "";
  const photoData = photo ?? profile.photo;
  const rounded = Math.round(profile.ratingAvg || 0);

  const onPhotoChange = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(String(ev.target?.result || ""));
    reader.readAsDataURL(file);
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next: ConsultantProfile = {
      ...profile,
      bio: String(fd.get("bio") || "").trim(),
      certificates: String(fd.get("certificates") || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
      achievements: String(fd.get("achievements") || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
      photo: photoData,
    };
    setProfile(next);
    if (token) adminDashboardService.updateConsultantProfile(token, next).catch(() => {});
    setFeedback(t("saveChanges"));
  };

  return (
    <>
      <div className="panel-card" style={{ maxWidth: 640 }}>
        <h3>{t("myProfile")}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "16px 0 24px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img
              id="myProfilePhoto"
              alt=""
              src={photoData || undefined}
              style={{
                display: photoData ? "block" : "none",
                width: 92,
                height: 92,
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid var(--gold)",
              }}
            />
            <div
              id="myProfilePhotoFallback"
              style={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                background: "var(--green-mid)",
                color: "#fff",
                display: photoData ? "none" : "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.1rem",
                fontWeight: 700,
                border: "3px solid var(--gold)",
              }}
            >
              {(displayName || "?").trim().charAt(0)}
            </div>
            <label
              htmlFor="myProfilePhotoInput"
              style={{
                position: "absolute",
                bottom: 0,
                insetInlineEnd: 0,
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "var(--gold)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "2px solid #fff",
                boxShadow: "0 2px 6px rgba(0,0,0,.18)",
              }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </label>
            <input
              type="file"
              id="myProfilePhotoInput"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => onPhotoChange(e.target.files?.[0])}
            />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <h3 id="myProfileName" style={{ margin: "0 0 6px", fontSize: "1.15rem" }}>
              {displayName}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span id="myProfileStars" style={{ color: "var(--gold)", fontSize: "1.2rem", letterSpacing: 2 }}>
                {"★".repeat(rounded) + "☆".repeat(5 - rounded)}
              </span>
              <span id="myProfileSummary" style={{ fontSize: ".85rem", color: "var(--stone)" }}>
                {profile.ratingCount
                  ? `${(profile.ratingAvg || 0).toFixed(1)} (${profile.ratingCount} ${t("ratingsCount")})`
                  : t("noRatingsYet")}
              </span>
            </div>
          </div>
        </div>
        <form className="edit-form" onSubmit={submit}>
          <div className="field">
            <label>{t("consultantBio")}</label>
            <textarea name="bio" rows={3} style={textareaStyle} defaultValue={profile.bio} />
          </div>
          <div className="field">
            <label>{t("consultantCertificates")}</label>
            <textarea name="certificates" rows={3} style={textareaStyle} defaultValue={(profile.certificates || []).join("\n")} />
          </div>
          <div className="field">
            <label>{t("consultantAchievements")}</label>
            <textarea name="achievements" rows={3} style={textareaStyle} defaultValue={(profile.achievements || []).join("\n")} />
          </div>
          <p className={`form-feedback${feedback ? " ok" : ""}`}>{feedback}</p>
          <button type="submit" className="btn btn-primary btn-sm">
            {t("saveChanges")}
          </button>
        </form>
      </div>
      <div className="panel-card" style={{ maxWidth: 640, marginTop: 20 }}>
        <h3>{t("clientReviews")}</h3>
        <div id="myProfileReviews">
          {!profile.reviews?.length ? (
            <p className="notif-empty">{t("noRatingsYet")}</p>
          ) : (
            profile.reviews.slice(0, 20).map((r, i) => {
              const rr = Math.round(r.stars || 0);
              return (
                <div
                  key={i}
                  style={{ padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: ".82rem" }}
                >
                  <strong style={{ color: "var(--gold)" }}>{"★".repeat(rr) + "☆".repeat(5 - rr)}</strong>{" "}
                  <span>{r.client || ""}</span>
                  <br />
                  <span style={{ color: "var(--stone)" }}>{r.text || ""}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
