"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { isApiError } from "@/lib/errors";
import { applyValidationErrors } from "@/lib/form-errors";
import { useI18n } from "@/lib/i18n/i18n-context";
import { joinRequestSchema, type JoinRequestValues } from "@/schemas/join";
import { Container, PageHero } from "@/components/public/Section";
import { Reveal } from "@/components/public/Reveal";
import { FormMessage } from "@/components/public/FormField";
import { Button, FileDrop, Input, Textarea } from "@/components/ui";
import { CARD } from "@/components/public/tokens";

const CV_ACCEPT = ".pdf,.doc,.docx";
const CV_MAX_MB = 5;

export default function JoinPage() {
  const { t, lang } = useI18n();
  const [cv, setCv] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = `${t("public.join.title")} — ${t("brandName")}`;
  }, [t, lang]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<JoinRequestValues>({
    resolver: zodResolver(joinRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      specialization: "",
      bio: "",
      linkedin_url: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: JoinRequestValues) => {
      const fd = new FormData();
      fd.append("name", values.name);
      fd.append("email", values.email);
      fd.append("phone", values.phone);
      fd.append("specialization", values.specialization);
      if (values.bio) fd.append("bio", values.bio);
      if (values.linkedin_url) fd.append("linkedin_url", values.linkedin_url);
      if (cv) fd.append("cv", cv);
      return api.post("/public/join-requests", fd);
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (e) => {
      if (isApiError(e) && e.code === "VALIDATION_ERROR") {
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
                <Input
                  label={t("phone")}
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  error={err(errors.phone?.message)}
                  {...register("phone")}
                />
                <Input
                  label={t("joinRequests.specialization")}
                  error={err(errors.specialization?.message)}
                  {...register("specialization")}
                />
                <div className="sm:col-span-2">
                  <Input
                    label={t("joinRequests.linkedin")}
                    type="url"
                    dir="ltr"
                    error={err(errors.linkedin_url?.message)}
                    {...register("linkedin_url")}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Textarea
                    label={t("joinRequests.bio")}
                    rows={4}
                    error={err(errors.bio?.message)}
                    {...register("bio")}
                  />
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
