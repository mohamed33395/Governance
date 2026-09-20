"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useClientAuth } from "@/lib/auth/client-auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { clientPortalService } from "@/services/client-portal.service";
import { useApiData } from "@/lib/use-api-data";
import { ClientModal } from "@/components/client/ClientModal";
import type { ClientReview } from "@/types/client-portal";

const STAR_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

export default function ClientReviewsPage() {
  const { token, user } = useClientAuth();
  const { t } = useI18n();

  const fetcher = useCallback(
    () => (token ? clientPortalService.getReviews(token) : Promise.reject()),
    [token]
  );
  const { data: reviews, setData: setReviews } = useApiData<ClientReview[]>(fetcher, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", text: "", rating: 5 });
  const [msg, setMsg] = useState("");

  const openModal = () => {
    setForm({
      name: user?.name || "",
      role: user ? `${user.company || ""}${user.company && user.email ? " — " : ""}${user.email || ""}` : "",
      text: "",
      rating: 5,
    });
    setModalOpen(true);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    let rating = form.rating;
    if (isNaN(rating) || rating < 1) rating = 5;
    if (rating > 5) rating = 5;
    const review: ClientReview = {
      id: `rev_${Date.now()}`,
      name: form.name.trim() || user?.name || "",
      role: form.role.trim() || user?.company || "",
      text: form.text.trim(),
      rating,
      date: new Date().toISOString(),
    };
    setReviews((prev) => [review, ...prev]);
    if (token) clientPortalService.addReview(token, review).catch(() => {});
    setModalOpen(false);
    setMsg(t("clientReviewAdded") || "تم إضافة التقييم بنجاح");
  };

  return (
    <>
      <div className="client-panel-card">
        <div className="client-toolbar" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h3>{t("clientReviews")}</h3>
          <button type="button" className="btn btn-primary btn-sm" id="openClientReviewModal" onClick={openModal}>
            {t("testimonialModalOpen")}
          </button>
        </div>
        <div id="clientReviewsList">
          {reviews.map((r) => {
            const stars = Math.max(1, Math.min(5, r.rating || 5));
            const initials =
              (r.name || "")
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0])
                .join(".")
                .toUpperCase() || "؟";
            return (
              <div className="client-review-card" key={r.id}>
                <div className="client-review-stars" aria-label={`${r.rating || 5} من 5`}>
                  {Array.from({ length: stars }, (_, i) => (
                    <svg key={i} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d={STAR_PATH} />
                    </svg>
                  ))}
                </div>
                <p className="client-review-text">&quot;{r.text}&quot;</p>
                <div className="client-review-author">
                  <div className="client-review-avatar">{initials}</div>
                  <div className="client-review-meta">
                    <strong>{r.name}</strong>
                    <span>{r.role}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="client-empty" id="clientReviewsEmpty" style={{ display: reviews.length ? "none" : "block" }}>
          {t("clientReviewsEmpty")}
        </p>
        <div className={`client-msg${msg ? " show" : ""}`} id="clientReviewsMsg" style={{ marginTop: 12 }}>
          {msg}
        </div>
      </div>

      {/* ADD REVIEW MODAL */}
      <ClientModal
        id="clientReviewModal"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t("testimonialModalTitle")}
        titleId="clientReviewModalTitle"
      >
        <form id="clientReviewForm" onSubmit={submit}>
          <div className="field">
            <label htmlFor="clientReviewName">{t("testimonialModalName")}</label>
            <input
              type="text"
              id="clientReviewName"
              required
              placeholder={t("testimonialModalName")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="clientReviewRole">{t("testimonialModalRole")}</label>
            <input
              type="text"
              id="clientReviewRole"
              required
              placeholder={t("testimonialModalRole")}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="clientReviewText">{t("testimonialModalText")}</label>
            <textarea
              id="clientReviewText"
              rows={3}
              required
              placeholder={t("testimonialModalText")}
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="clientReviewRating">{t("testimonialModalRating")}</label>
            <input
              type="number"
              id="clientReviewRating"
              min={1}
              max={5}
              required
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value, 10) })}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            {t("testimonialModalAdd")}
          </button>
        </form>
      </ClientModal>
    </>
  );
}
