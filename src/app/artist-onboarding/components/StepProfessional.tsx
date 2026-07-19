"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { saveStepProfessional, type ActionResult } from "../actions";
import type { StepProfessionalInput } from "@/lib/validations/artist";
import { Field, FormError, NavButtons } from "./FormBits";

export type StepProfessionalData = Partial<StepProfessionalInput>;

interface StepProfessionalProps {
  initial: StepProfessionalData;
  nextHref: string;
  prevHref: string;
  categories: { id: number; name: string; slug: string; icon: string | null }[];
  selectedCategoryIds: string[];
}

const LANGUAGES = [
  "English",
  "Bahasa Malaysia",
  "中文 (Mandarin)",
  "தமிழ் (Tamil)",
  "Cantonese",
  "Hindi",
  "Arabic",
];

const OPERATING_DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const TRAVEL_OPTIONS = [
  { value: "", label: "—" },
  { value: "local_5km", label: "Up to 5 km" },
  { value: "local_20km", label: "Up to 20 km" },
  { value: "state", label: "Within state" },
  { value: "nationwide", label: "Nationwide" },
  { value: "international", label: "International" },
];

const RESPONSE_TIME_OPTIONS = [
  { value: "", label: "—" },
  { value: "within_1h", label: "Within 1 hour" },
  { value: "within_3h", label: "Within 3 hours" },
  { value: "within_24h", label: "Within 24 hours" },
  { value: "within_48h", label: "Within 48 hours" },
];

export function StepProfessional({
  initial,
  nextHref,
  prevHref,
  categories,
  selectedCategoryIds,
}: StepProfessionalProps) {
  const t = useTranslations("artistOnboarding.wizard.professional");
  const tCommon = useTranslations("artistOnboarding.wizard.common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [savingDraft, setSavingDraft] = useState(false);

  const [form, setForm] = useState<StepProfessionalData>({
    bio: initial.bio ?? "",
    experience: initial.experience ?? 0,
    languages: initial.languages ?? [],
    specialties: initial.specialties ?? [],
    categoryIds: selectedCategoryIds,
    instagramUrl: initial.instagramUrl ?? "",
    tiktokUrl: initial.tiktokUrl ?? "",
    willingToTravel: initial.willingToTravel ?? false,
    travelCoverage: initial.travelCoverage ?? "",
    operatingDays: initial.operatingDays ?? [],
    responseTime: initial.responseTime ?? "",
  });
  const [newSpecialty, setNewSpecialty] = useState("");

  function update<K extends keyof StepProfessionalData>(key: K, value: StepProfessionalData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArrayItem<T extends string | number>(key: "languages" | "operatingDays" | "categoryIds", item: T) {
    setForm((prev) => {
      const current = (prev[key] as T[] | undefined) ?? [];
      const exists = current.includes(item);
      return {
        ...prev,
        [key]: exists ? current.filter((x) => x !== item) : [...current, item],
      };
    });
  }

  function addSpecialty() {
    const v = newSpecialty.trim();
    if (!v) return;
    setForm((prev) => ({
      ...prev,
      specialties: [...(prev.specialties ?? []), v].slice(0, 20),
    }));
    setNewSpecialty("");
  }

  function removeSpecialty(idx: number) {
    setForm((prev) => ({
      ...prev,
      specialties: (prev.specialties ?? []).filter((_, i) => i !== idx),
    }));
  }

  function buildPayload(): StepProfessionalInput {
    return {
      bio: form.bio ?? "",
      experience: Number(form.experience ?? 0),
      languages: form.languages ?? [],
      specialties: form.specialties ?? [],
      categoryIds: form.categoryIds ?? [],
      instagramUrl: form.instagramUrl ?? "",
      tiktokUrl: form.tiktokUrl ?? "",
      willingToTravel: Boolean(form.willingToTravel),
      travelCoverage: form.willingToTravel ? form.travelCoverage ?? "" : "",
      operatingDays: form.operatingDays ?? [],
      responseTime: form.responseTime ?? "",
    };
  }

  function runSave(
    payload: StepProfessionalInput,
    onSuccess: (r: ActionResult<{ step: number }>) => void,
  ) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await saveStepProfessional(payload);
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
    runSave(buildPayload(), () => router.push(nextHref));
  }

  function onSaveDraft() {
    setSavingDraft(true);
    runSave(buildPayload(), () => setSavingDraft(false));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("heading")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      <FormError message={error} />

      <Field id="bio" label={t("bio")} required error={fieldErrors.bio?.[0]} hint={t("bioHint")}>
        <textarea
          id="bio"
          maxLength={1000}
          required
          value={form.bio ?? ""}
          onChange={(e) => update("bio", e.target.value)}
          className="form-textarea"
          rows={5}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="experience" label={t("experience")} required error={fieldErrors.experience?.[0]}>
          <input
            id="experience"
            type="number"
            min={0}
            max={80}
            value={form.experience ?? 0}
            onChange={(e) => update("experience", Number(e.target.value))}
            className="form-input"
          />
        </Field>
        <Field id="responseTime" label={t("responseTime")} error={fieldErrors.responseTime?.[0]}>
          <select
            id="responseTime"
            value={form.responseTime ?? ""}
            onChange={(e) => update("responseTime", e.target.value)}
            className="form-select"
          >
            {RESPONSE_TIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {t("categories")} <span className="text-rose-500">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = (form.categoryIds ?? []).includes(c.slug);
            return (
              <button
                type="button"
                key={c.slug}
                onClick={() => toggleArrayItem("categoryIds", c.slug)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? "bg-rose-500 text-white border-rose-500"
                    : "border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-200 hover:border-rose-300"
                }`}
              >
                {c.icon && <span className="mr-1">{c.icon}</span>}
                {c.name}
              </button>
            );
          })}
        </div>
        {fieldErrors.categoryIds?.[0] && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.categoryIds[0]}</p>
        )}
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {t("specialties")}
        </legend>
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={60}
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSpecialty();
              }
            }}
            className="form-input flex-1"
            placeholder={t("specialtiesPlaceholder")}
          />
          <button
            type="button"
            onClick={addSpecialty}
            className="px-4 py-2.5 text-sm font-medium rounded-xl bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-700"
          >
            {t("add")}
          </button>
        </div>
        {(form.specialties ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {(form.specialties ?? []).map((s, idx) => (
              <span
                key={`${s}-${idx}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeSpecialty(idx)}
                  className="text-rose-500 hover:text-rose-700"
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {t("languages")}
        </legend>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => {
            const active = (form.languages ?? []).includes(l);
            return (
              <button
                type="button"
                key={l}
                onClick={() => toggleArrayItem("languages", l)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? "bg-rose-500 text-white border-rose-500"
                    : "border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-200 hover:border-rose-300"
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {t("operatingDays")}
        </legend>
        <div className="flex flex-wrap gap-2">
          {OPERATING_DAYS.map((d) => {
            const active = (form.operatingDays ?? []).includes(d.key);
            return (
              <button
                type="button"
                key={d.key}
                onClick={() => toggleArrayItem("operatingDays", d.key)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? "bg-rose-500 text-white border-rose-500"
                    : "border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-200 hover:border-rose-300"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="instagramUrl" label={t("instagram")} error={fieldErrors.instagramUrl?.[0]}>
          <input
            id="instagramUrl"
            type="url"
            maxLength={500}
            value={form.instagramUrl ?? ""}
            onChange={(e) => update("instagramUrl", e.target.value)}
            className="form-input"
            placeholder="https://instagram.com/yourname"
          />
        </Field>
        <Field id="tiktokUrl" label={t("tiktok")} error={fieldErrors.tiktokUrl?.[0]}>
          <input
            id="tiktokUrl"
            type="url"
            maxLength={500}
            value={form.tiktokUrl ?? ""}
            onChange={(e) => update("tiktokUrl", e.target.value)}
            className="form-input"
            placeholder="https://tiktok.com/@yourname"
          />
        </Field>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-neutral-800 p-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(form.willingToTravel)}
            onChange={(e) => update("willingToTravel", e.target.checked)}
            className="form-checkbox"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {t("willingToTravel")}
          </span>
        </label>
        {form.willingToTravel && (
          <Field id="travelCoverage" label={t("travelCoverage")} error={fieldErrors.travelCoverage?.[0]}>
            <select
              id="travelCoverage"
              value={form.travelCoverage ?? ""}
              onChange={(e) => update("travelCoverage", e.target.value)}
              className="form-select"
            >
              {TRAVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

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
