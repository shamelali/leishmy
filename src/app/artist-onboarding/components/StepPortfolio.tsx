"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { saveStepPortfolio, type ActionResult } from "../actions";
import { Field, FormError, NavButtons } from "./FormBits";
import { PortfolioUploader, type PortfolioItem } from "@/components/upload";

interface StepPortfolioProps {
  initial: PortfolioItem[];
  nextHref: string;
  prevHref: string;
}

export function StepPortfolio({ initial, nextHref, prevHref }: StepPortfolioProps) {
  const t = useTranslations("artistOnboarding.wizard.portfolio");
  const tCommon = useTranslations("artistOnboarding.wizard.common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [savingDraft, setSavingDraft] = useState(false);
  const [items, setItems] = useState<PortfolioItem[]>(initial);

  function handleUploadError(message: string) {
    setError(message);
  }

  function buildPayload() {
    return {
      portfolio: items.map((i) => ({
        url: i.url,
        publicId: i.publicId,
        alt: i.alt ?? "",
      })),
    };
  }

  function runSave(
    onSuccess: (r: ActionResult<{ step: number; count: number }>) => void,
  ) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await saveStepPortfolio(buildPayload());
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
    runSave(() => router.push(nextHref));
  }

  function onSaveDraft() {
    setSavingDraft(true);
    runSave(() => setSavingDraft(false));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("heading")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      <FormError message={error} />

      <Field
        id="portfolio"
        label={t("label")}
        required
        error={fieldErrors.portfolio?.[0]}
        hint={t("hint")}
      >
        <PortfolioUploader
          value={items}
          onChange={setItems}
          onError={handleUploadError}
          disabled={isPending}
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
