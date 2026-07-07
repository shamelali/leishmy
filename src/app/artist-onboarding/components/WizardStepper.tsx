"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

export type StepKey = "basics" | "professional" | "portfolio" | "services" | "review";

export const STEP_ORDER: StepKey[] = [
  "basics",
  "professional",
  "portfolio",
  "services",
  "review",
];

export function stepIndex(step: StepKey): number {
  return STEP_ORDER.indexOf(step);
}

interface WizardStepperProps {
  current: StepKey;
  furthestReached: number;
  status: "draft" | "pending_verification" | "verified" | "rejected" | "suspended";
}

export function WizardStepper({ current, furthestReached, status }: WizardStepperProps) {
  const t = useTranslations("artistOnboarding.wizard.stepper");
  const currentIdx = stepIndex(current);

  return (
    <ol className="flex w-full items-center gap-2 sm:gap-3" aria-label="Onboarding progress">
      {STEP_ORDER.map((key, idx) => {
        const isCurrent = idx === currentIdx;
        const isDone = idx < furthestReached || status === "verified" || status === "pending_verification";
        const isReachable = idx <= furthestReached;
        const Icon = isDone ? Check : () => <span>{idx + 1}</span>;
        const label = t(`${key}.label`);

        const inner = (
          <span className="flex flex-col items-center text-center min-w-0">
            <span
              className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                isCurrent
                  ? "bg-rose-500 text-white shadow-md shadow-rose-200/50"
                  : isDone
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400"
              }`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <Icon />
            </span>
            <span
              className={`mt-1.5 text-[11px] sm:text-xs font-medium truncate max-w-[64px] sm:max-w-[88px] ${
                isCurrent
                  ? "text-rose-600 dark:text-rose-400"
                  : isDone
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {label}
            </span>
          </span>
        );

        return (
          <li key={key} className="flex flex-1 items-center">
            {isReachable && !isCurrent ? (
              <Link
                href={`/artist-onboarding/create/${idx + 1}`}
                className="flex-1 flex justify-center"
              >
                {inner}
              </Link>
            ) : (
              <div className="flex-1 flex justify-center">{inner}</div>
            )}
            {idx < STEP_ORDER.length - 1 && (
              <span
                aria-hidden="true"
                className={`mx-1 h-px flex-1 ${
                  idx < currentIdx || isDone
                    ? "bg-emerald-300 dark:bg-emerald-700"
                    : "bg-gray-200 dark:bg-neutral-800"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
