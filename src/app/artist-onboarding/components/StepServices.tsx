"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2, Star, Plus } from "lucide-react";
import { saveStepServices, type ActionResult } from "../actions";
import type { StepServicesInput } from "@/lib/validations/artist";
import { Field, FormError, NavButtons } from "./FormBits";

export type ServiceDraft = StepServicesInput["services"][number];

interface StepServicesProps {
  initialServices: ServiceDraft[];
  initialPrice: number;
  nextHref: string;
  prevHref: string;
}

const MAX_SERVICES = 25;

function emptyService(): ServiceDraft {
  return { name: "", description: "", duration: "", price: 0, popular: false };
}

export function StepServices({
  initialServices,
  initialPrice,
  nextHref,
  prevHref,
}: StepServicesProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [savingDraft, setSavingDraft] = useState(false);
  const [services, setServices] = useState<ServiceDraft[]>(
    initialServices.length > 0 ? initialServices : [emptyService()],
  );
  const [price, setPrice] = useState<number>(initialPrice);

  function update(idx: number, patch: Partial<ServiceDraft>) {
    setServices((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function add() {
    if (services.length >= MAX_SERVICES) return;
    setServices((prev) => [...prev, emptyService()]);
  }

  function remove(idx: number) {
    setServices((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  function buildPayload(): StepServicesInput {
    return {
      services: services.map((s) => ({
        name: s.name,
        description: s.description ?? "",
        duration: s.duration ?? "",
        price: Number(s.price || 0),
        popular: Boolean(s.popular),
      })),
      price: Number(price || 0),
    };
  }

  function runSave(
    onSuccess: (r: ActionResult<{ step: number; count: number }>) => void,
  ) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await saveStepServices(buildPayload());
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
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Services &amp; pricing</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">List the services you offer. You can add pricing for each.</p>
      </div>

      <FormError message={error} />

      <div className="space-y-3">
        {services.map((s, idx) => {
          const basePath = `services.${idx}`;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-gray-200 dark:border-neutral-800 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Service #{idx + 1}
                </h3>
                {services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="text-rose-500 hover:text-rose-700"
                    aria-label="Remove service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  id={`name-${idx}`}
                  label="Service name"
                  required
                  error={fieldErrors[`${basePath}.name`]?.[0]}
                >
                  <input
                    id={`name-${idx}`}
                    type="text"
                    maxLength={255}
                    value={s.name}
                    onChange={(e) => update(idx, { name: e.target.value })}
                    className="form-input"
                  />
                </Field>
                <Field
                  id={`price-${idx}`}
                  label="Price (MYR)"
                  required
                  error={fieldErrors[`${basePath}.price`]?.[0]}
                >
                  <input
                    id={`price-${idx}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={s.price}
                    onChange={(e) => update(idx, { price: Number(e.target.value) })}
                    className="form-input"
                  />
                </Field>
                <Field
                  id={`duration-${idx}`}
                  label="Duration"
                  error={fieldErrors[`${basePath}.duration`]?.[0]}
                >
                  <input
                    id={`duration-${idx}`}
                    type="text"
                    maxLength={50}
                    value={s.duration ?? ""}
                    onChange={(e) => update(idx, { duration: e.target.value })}
                    className="form-input"
                    placeholder="90 mins"
                  />
                </Field>
                <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={Boolean(s.popular)}
                    onChange={(e) => update(idx, { popular: e.target.checked })}
                    className="form-checkbox"
                  />
                  <Star className="w-4 h-4 text-amber-400" />
                  Popular
                </label>
              </div>
              <Field
                id={`desc-${idx}`}
                label="Description (optional)"
                error={fieldErrors[`${basePath}.description`]?.[0]}
              >
                <textarea
                  id={`desc-${idx}`}
                  maxLength={500}
                  value={s.description ?? ""}
                  onChange={(e) => update(idx, { description: e.target.value })}
                  className="form-textarea"
                  rows={2}
                />
              </Field>
            </div>
          );
        })}

        {services.length < MAX_SERVICES && (
          <button
            type="button"
            onClick={add}
            className="w-full rounded-2xl border-2 border-dashed border-gray-200 dark:border-neutral-700 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-rose-300 hover:text-rose-600 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add another service
          </button>
        )}

        {fieldErrors.services?.[0] && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{fieldErrors.services[0]}</p>
        )}
      </div>

      <Field
        id="startingPrice"
        label="Starting price (MYR)"
        required
        error={fieldErrors.price?.[0]}
        hint="The lowest price a client can expect to pay for any of your services."
      >
        <input
          id="startingPrice"
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="form-input max-w-xs"
        />
      </Field>

      <NavButtons
        isPending={isPending}
        savingDraft={savingDraft}
        onSaveDraft={onSaveDraft}
        prevHref={prevHref}
        nextLabel="Continue"
      />
    </form>
  );
}
