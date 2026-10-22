"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CameraPlus, CheckCircle } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { isApiError } from "@/lib/errors";
import { applyValidationErrors } from "@/lib/form-errors";
import { useI18n } from "@/lib/i18n/i18n-context";
import { joinRequestSchema, type JoinRequestValues } from "@/schemas/join";
import { Container, PageHero } from "@/components/public/Section";
import { Reveal } from "@/components/public/Reveal";
import { FormMessage } from "@/components/public/FormField";
import { Button, Field, FileDrop, Input, Select, Textarea } from "@/components/ui";
import { CARD } from "@/components/public/tokens";
import { SPECIALIZATION_KINDS } from "@/schemas/join";

const CV_ACCEPT = ".pdf,.doc,.docx";
const CV_MAX_MB = 5;
const PHOTO_ACCEPT = ".jpg,.jpeg,.png,.webp";
const PHOTO_MAX_MB = 2;
const LICENSES_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
const LICENSES_MAX_MB = 10;
const LICENSES_MAX_COUNT = 10;

// dial codes — value is what gets prepended to the local number
const PHONE_CODES = [
  { value: "+966", label: "🇸🇦 +966" },
  { value: "+971", label: "🇦🇪 +971" },
  { value: "+965", label: "🇰🇼 +965" },
  { value: "+973", label: "🇧🇭 +973" },
  { value: "+974", label: "🇶🇦 +974" },
  { value: "+968", label: "🇴🇲 +968" },
  { value: "+962", label: "🇯🇴 +962" },
  { value: "+964", label: "🇮🇶 +964" },
  { value: "+20", label: "🇪🇬 +20" },
  { value: "+961", label: "🇱🇧 +961" },
  { value: "+970", label: "🇵🇸 +970" },
  { value: "+963", label: "🇸🇾 +963" },
  { value: "+967", label: "🇾🇪 +967" },
  { value: "+249", label: "🇸🇩 +249" },
  { value: "+218", label: "🇱🇾 +218" },
  { value: "+216", label: "🇹🇳 +216" },
  { value: "+213", label: "🇩🇿 +213" },
  { value: "+212", label: "🇲🇦 +212" },
  { value: "+90", label: "🇹🇷 +90" },
  { value: "+92", label: "🇵🇰 +92" },
  { value: "+91", label: "🇮🇳 +91" },
  { value: "+44", label: "🇬🇧 +44" },
  { value: "+1", label: "🇺🇸 +1" },
];

export default function JoinPage() {
  const { t, lang } = useI18n();
  const [cv, setCv] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    document.title = `${t("public.join.title")} — ${t("brandName")}`;
  }, [t, lang]);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<JoinRequestValues>({
    resolver: zodResolver(joinRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      phone_code: "+966",
      phone: "",
      specialization_kind: undefined as unknown as JoinRequestValues["specialization_kind"],
      specialization_other: "",
      bio: "",
    },
  });

  const specKind = watch("specialization_kind");
  const specPicked = Boolean(specKind);

  const clearFileError = (key: string) =>
    setFileErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const pickPhoto = (file: File) => {
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!PHOTO_ACCEPT.split(",").includes(ext)) {
      setFileErrors((p) => ({ ...p, photo: t("common.fileTypeError") }));
      return;
    }
    if (file.size > PHOTO_MAX_MB * 1024 * 1024) {
      setFileErrors((p) => ({
        ...p,
        photo: t("common.fileSizeError").replace("{max}", String(PHOTO_MAX_MB)),
      }));
      return;
    }
    clearFileError("photo");
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    clearFileError("photo");
  };

  const mutation = useMutation({
    mutationFn: async (values: JoinRequestValues) => {
      const fd = new FormData();
      fd.append("name", values.name);
      fd.append("email", values.email);
      fd.append("phone", `${values.phone_code}${values.phone}`);
      const specialization =
        values.specialization_kind === "other"
          ? (values.specialization_other ?? "").trim()
          : t(`joinRequests.spec.${values.specialization_kind}`);
      fd.append("specialization", specialization);
      if (values.bio) fd.append("bio", values.bio);
      if (photo) fd.append("photo", photo);
      licenseFiles.forEach((f) => fd.append("licenses[]", f));
      if (cv) fd.append("cv", cv);
      return api.post("/public/join-requests", fd);
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (e) => {
      if (isApiError(e) && e.code === "VALIDATION_ERROR") {
        // file fields aren't RHF inputs — show their messages under the drops
        const files: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(e.errors)) {
          const root = key.split(".")[0];
          if (["photo", "licenses", "cv"].includes(root) && msgs?.[0]) files[root] = msgs[0];
        }
        setFileErrors(files);
        applyValidationErrors(setError, e);
      } else if (isApiError(e)) {
        // eslint-disable-next-line no-console
        console.error(e.message);
      }
    },
  });

  const err = (key?: string) => (key ? t(key) : undefined);

  const POINTS = [t("joinPoint1"), t("joinPoint2"), t("joinPoint3")];

  return (
    <main>
      <PageHero
        eyebrow={t("public.join.title")}
        title={t("joinAsExpert")}
        lead={t("joinHeroLead")}
      >
        <ul className="flex flex-col gap-3">
          {POINTS.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-base text-text">
              <CheckCircle size={24} weight="fill" aria-hidden="true" className="shrink-0 text-accent" />
              {p}
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="py-24">
        <Container>
          <Reveal>
            <form
              onSubmit={handleSubmit((v) => mutation.mutate(v))}
              className={`mx-auto max-w-[880px] p-6 md:p-8 ${CARD}`}
            >
              {/* personal photo — circular picker with instant preview */}
              <div className="mb-8 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  aria-label={t("joinRequests.photo")}
                  className="group relative flex size-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors"
                  style={{
                    borderColor: fileErrors.photo ? "var(--danger)" : "var(--border)",
                    background: "var(--background)",
                  }}
                >
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="" className="size-full object-cover" />
                  ) : (
                    <CameraPlus
                      size={30}
                      weight="duotone"
                      aria-hidden="true"
                      className="text-muted transition-colors group-hover:text-accent"
                    />
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-black/45 py-1 text-center text-[0.62rem] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {t("joinRequests.photo")}
                  </span>
                </button>
                <span className="text-sm text-muted">{t("joinRequests.photo")}</span>
                <span className="text-[0.72rem] text-muted" dir="ltr">
                  {PHOTO_ACCEPT} · {t("common.maxMb").replace("{max}", String(PHOTO_MAX_MB))}
                </span>
                {photo && (
                  <button
                    type="button"
                    className="text-[0.78rem] text-danger hover:underline"
                    onClick={clearPhoto}
                  >
                    {t("common.remove")}
                  </button>
                )}
                {fileErrors.photo && (
                  <p className="text-xs text-danger">{fileErrors.photo}</p>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept={PHOTO_ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) pickPhoto(f);
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <Input
                  label={t("fullName")}
                  autoComplete="name"
                  error={err(errors.name?.message)}
                  {...register("name")}
                />
                <Input
                  label={t("email")}
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  error={err(errors.email?.message)}
                  {...register("email")}
                />
                <div className="sm:col-span-2">
                  <Field
                    label={t("phone")}
                    required
                    error={err(errors.phone?.message) ?? err(errors.phone_code?.message)}
                  >
                    <div
                      className="ui-input flex items-center gap-0 overflow-hidden p-0! focus-within:border-accent focus-within:bg-surface"
                      data-invalid={!!(errors.phone ?? errors.phone_code)}
                    >
                      <select
                        aria-label={t("joinRequests.phoneCode")}
                        dir="ltr"
                        className="h-full shrink-0 cursor-pointer appearance-none border-0 bg-transparent py-3 pe-1 ps-4 text-sm text-text outline-none"
                        {...register("phone_code")}
                      >
                        {PHONE_CODES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <span
                        className="h-6 w-px shrink-0"
                        style={{ background: "var(--border)" }}
                        aria-hidden="true"
                      />
                      <input
                        type="tel"
                        dir="ltr"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="5XXXXXXXX"
                        className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-sm outline-none"
                        {...register("phone")}
                      />
                    </div>
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Select
                    label={t("joinRequests.specialization")}
                    placeholder={t("joinRequests.specSelect")}
                    options={SPECIALIZATION_KINDS.map((k) => ({
                      value: k,
                      label: t(`joinRequests.spec.${k}`),
                    }))}
                    error={err(errors.specialization_kind?.message)}
                    {...register("specialization_kind")}
                  />
                </div>
                {specKind === "other" && (
                  <div className="sm:col-span-2">
                    <Input
                      label={t("joinRequests.spec.otherField")}
                      maxLength={100}
                      error={err(errors.specialization_other?.message)}
                      {...register("specialization_other")}
                    />
                  </div>
                )}
                {specPicked && (
                  <div className="sm:col-span-2">
                    <Textarea
                      label={t("joinRequests.bio")}
                      hint={t("joinRequests.bioHint")}
                      rows={3}
                      maxLength={100}
                      error={err(errors.bio?.message)}
                      {...register("bio")}
                    />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <span className="text-sm text-muted block mb-2">
                    {t("joinRequests.licenses")}
                  </span>
                  <FileDrop
                    accept={LICENSES_ACCEPT}
                    maxMb={LICENSES_MAX_MB}
                    onFile={(f) => {
                      setLicenseFiles((prev) =>
                        prev.length >= LICENSES_MAX_COUNT ? prev : [...prev, f]
                      );
                    }}
                    error={fileErrors.licenses}
                  />
                  {licenseFiles.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {licenseFiles.map((f, i) => (
                        <li
                          key={`${f.name}-${i}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-[0.8rem]"
                        >
                          <span dir="ltr">{f.name}</span>
                          <button
                            type="button"
                            aria-label={t("common.remove")}
                            className="text-danger hover:underline"
                            onClick={() =>
                              setLicenseFiles((prev) => prev.filter((_, j) => j !== i))
                            }
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <span className="text-sm text-muted block mb-2">
                    {t("joinRequests.cv")}
                  </span>
                  <FileDrop
                    accept={CV_ACCEPT}
                    maxMb={CV_MAX_MB}
                    onFile={setCv}
                    label={cv?.name}
                    error={fileErrors.cv}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="mt-8 w-full"
                loading={isSubmitting || mutation.isPending}
              >
                {t("sendRequest")}
              </Button>
              <p className="mt-4 text-sm text-muted text-pretty">
                {t("joinFormNote")}
              </p>
              <FormMessage show={submitted}>{t("public.join.success")}</FormMessage>
            </form>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
