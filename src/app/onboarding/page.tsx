"use client";

import { memo } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/Spinner";
import { useApi } from "@/lib/useApi";

export type OnboardingStep = {
  id: string;
  title: string;
  complete: boolean;
};

type OnboardingResponse = { steps?: OnboardingStep[] };

function OnboardingStepRowInner({ step }: { step: OnboardingStep }) {
  return (
    <li className="flex items-center justify-between py-3 text-sm">
      <span>{step.title}</span>
      <span
        className={
          step.complete
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-zinc-500 dark:text-zinc-400"
        }
      >
        {step.complete ? "Done" : "Not started"}
      </span>
    </li>
  );
}

/**
 * Memoized so re-renders of the surrounding list don't re-render every
 * step row.
 */
export const OnboardingStepRow = memo(OnboardingStepRowInner);

export default function OnboardingPage() {
  const state = useApi<OnboardingResponse>("/api/v1/onboarding");
  const steps = state.status === "ok" ? (state.data.steps ?? []) : null;

  const announcement =
    state.status === "loading"
      ? "Loading onboarding steps."
      : state.status === "error"
        ? `Failed to load onboarding steps: ${state.error}`
        : steps && steps.length === 0
          ? "No onboarding steps to show."
          : steps
            ? `Loaded ${steps.length} onboarding step${steps.length === 1 ? "" : "s"}.`
            : "";

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold tracking-tight">Onboarding</h1>
      {/* Announces loading/error/empty/loaded transitions to screen readers
          without duplicating the visible content below. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {state.status === "loading" && (
        <div className="flex justify-center py-10">
          <Spinner label="Loading onboarding steps" />
        </div>
      )}
      {state.status === "error" && (
        <ErrorMessage
          title="Failed to load onboarding steps"
          detail={state.error}
          onRetry={state.retry}
        />
      )}
      {steps && steps.length === 0 && (
        <EmptyState
          title="No onboarding steps yet."
          description="Check back once your account setup checklist is available."
        />
      )}
      {steps && steps.length > 0 && (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {steps.map((s) => (
            <OnboardingStepRow key={s.id} step={s} />
          ))}
        </ul>
      )}
    </PageShell>
  );
}
