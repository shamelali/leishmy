"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { saveStepBasics, type ActionResult } from "../actions";
import type { StepBasicsInput } from "@/lib/validations/artist";
import { Field, FormError, NavButtons } from "./FormBits";

export type StepBasicsData = Partial<StepBasicsInput>;

interface StepBasicsProps {
  initial: StepBasicsData;
  nextHref: string;
  prevHref: string | null;
}

export function StepBasics({ initial, nextHref, prevHref }: StepBasicsProps) {
  const t = useTranslations("artistOnboarding.wizard.basics");
  const tCommon = useTranslations("artistOnboarding.wizard.common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [savingDraft, setSavingDraft] = useState(false);

  const [form, setForm] = useState<StepBasicsData>({
    name: initial.name ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    image: initial.image ?? "",
    location: initial.location ?? "",
    area: initial.area ?? "",
    district: initial.district ?? "",
  });

  function update<K extends keyof StepBasicsData>(key: K, value: StepBasicsData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function runSave(
    data: StepBasicsData,
    onSuccess: (r: ActionResult<{ id: number; step: number }>) => void,
  ) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await saveStepBasics(data);
      if (res.ok) {
        onSuccess(res);
      } else {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSave(form, () => router.push(nextHref));
  }

  function onSaveDraft() {
    setSavingDraft(true);
    runSave(form, () => setSavingDraft(false));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("heading")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      <FormError message={error} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="name" label={t("name")} required error={fieldErrors.name?.[0]}>
          <input
            id="name"
            type="text"
            maxLength={255}
            autoComplete="name"
            required
            value={form.name ?? ""}
            onChange={(e) => update("name", e.target.value)}
            className="form-input"
          />
        </Field>
        <Field id="email" label={t("email")} required error={fieldErrors.email?.[0]}>
          <input
            id="email"
            type="email"
            maxLength={255}
            autoComplete="email"
            required
            value={form.email ?? ""}
            onChange={(e) => update("email", e.target.value)}
            className="form-input"
          />
        </Field>
        <Field id="phone" label={t("phone")} error={fieldErrors.phone?.[0]}>
          <input
            id="phone"
            type="tel"
            maxLength={50}
            autoComplete="tel"
            value={form.phone ?? ""}
            onChange={(e) => update("phone", e.target.value)}
            className="form-input"
            placeholder="+60123456789"
          />
        </Field>
        <Field id="location" label={t("location")} required error={fieldErrors.location?.[0]}>
          <input
            id="location"
            type="text"
            maxLength={255}
            required
            value={form.location ?? ""}
            onChange={(e) => update("location", e.target.value)}
            className="form-input"
            placeholder="Kuala Lumpur"
          />
        </Field>
        <Field id="area" label={t("area")} error={fieldErrors.area?.[0]}>
          <input
            id="area"
            type="text"
            maxLength={100}
            value={form.area ?? ""}
            onChange={(e) => update("area", e.target.value)}
            className="form-input"
            placeholder="Bangsar"
          />
        </Field>
        <Field id="district" label={t("district")} error={fieldErrors.district?.[0]}>
          <input
            id="district"
            type="text"
            maxLength={100}
            value={form.district ?? ""}
            onChange={(e) => update("district", e.target.value)}
            className="form-input"
          />
        </Field>
      </div>

      <Field
        id="image"
        label={t("profileImage")}
        error={fieldErrors.image?.[0]}
        hint={t("profileImageHint")}
      >
        <input
          id="image"
          type="url"
          maxLength={500}
          value={form.image ?? ""}
          onChange={(e) => update("image", e.target.value)}
          className="form-input"
          placeholder="https://res.cloudinary.com/..."
        />
      </Field>

      <NavButtons
        isPending={isPending}
        savingDraft={savingDraft}
        onSaveDraft={onSaveDraft}
        prevHref={prevHref}
        nextLabel={tCommon("next")}
      />
    </form>
  );
}
