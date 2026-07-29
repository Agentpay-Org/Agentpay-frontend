"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageShell } from "@/components/PageShell";
import { messages } from "@/lib/messages";
import { resolveApiBase } from "@/lib/resolveApiBase";
import { KeyValueGrid } from "@/components/KeyValueGrid";
import { CopyButton } from "@/components/CopyButton";

type SettingsState = "loading" | "error" | "empty" | "success";

function computeInitialSettings(): {
  status: SettingsState;
  apiBase: string;
  errorMessage: string;
} {
  try {
    const base = resolveApiBase();
    return base
      ? { status: "success", apiBase: base, errorMessage: "" }
      : { status: "empty", apiBase: "", errorMessage: "" };
  } catch (err) {
    return {
      status: "error",
      apiBase: "",
      errorMessage:
        err instanceof Error ? err.message : "Failed to load settings configuration.",
    };
  }
}

/**
 * Derives the assistive-technology announcement for a settings state.
 *
 * Pure and defined at module scope so it allocates nothing per render and can
 * be exercised directly, including the `loading` state — which React never
 * paints in practice, since `loadSettings` sets it and its successor status in
 * the same batch.
 */
export function deriveAnnouncement(
  status: SettingsState,
  errorMessage: string
): string {
  switch (status) {
    case "loading":
      return "Loading settings...";
    case "error":
      return `Error: ${errorMessage}`;
    case "empty":
      return "No settings configured.";
    default:
      return "Settings loaded successfully.";
  }
}

/**
 * The loading placeholder. Extracted and wrapped in `memo` so it is a stable
 * element rather than JSX rebuilt on every parent render.
 */
export const LoadingPanel = memo(function LoadingPanel() {
  return (
    <div
      role="status"
      aria-label="Loading settings"
      className="rounded-lg border border-zinc-200 p-6 text-center dark:border-zinc-800"
    >
      <p className="text-sm text-zinc-500">Loading settings...</p>
    </div>
  );
});

/**
 * Renders the value cell for one connection row: the API base plus its copy
 * button. Extracted and wrapped in `memo` so that unrelated settings state
 * (status transitions, error text) does not re-render the row — it only
 * re-renders when `apiBase` itself changes.
 */
export const ConnectionValue = memo(function ConnectionValue({
  apiBase,
}: {
  apiBase: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-zinc-900 dark:text-zinc-100">{apiBase}</span>
      <CopyButton value={apiBase} label="Copy" />
    </div>
  );
});

/**
 * Renders the settings body shown in the `success` state (appearance +
 * connection sections).
 *
 * Wrapped in `memo` and given a single `apiBase` prop so that state the body
 * does not read — `status` and `errorMessage`, both of which change on every
 * load/retry cycle — cannot force it to re-render. The `KeyValueGrid` rows
 * array is derived inside a `useMemo` keyed on `apiBase`, so the grid receives
 * a stable `rows` reference across renders instead of a freshly allocated
 * array each time; the cost of building it scales with the number of rows, so
 * this is the part worth keeping out of the hot path.
 */
export const SettingsSections = memo(function SettingsSections({
  apiBase,
}: {
  apiBase: string;
}) {
  const rows = useMemo(
    () => [
      {
        label: messages.settings.connection.label,
        value: <ConnectionValue apiBase={apiBase} />,
      },
    ],
    [apiBase]
  );

  return (
    <>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">
          {messages.settings.appearance.heading}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {messages.settings.appearance.description}
        </p>
        <ThemeToggle />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">
          {messages.settings.connection.heading}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {messages.settings.connection.description}
        </p>
        <div className="mt-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <KeyValueGrid rows={rows} />
        </div>
      </section>
    </>
  );
});

export default function SettingsPage() {
  const [initial] = useState(computeInitialSettings);
  const [status, setStatus] = useState<SettingsState>(initial.status);
  const [apiBase, setApiBase] = useState<string>(initial.apiBase);
  const [errorMessage, setErrorMessage] = useState<string>(initial.errorMessage);

  /**
   * The assistive-technology announcement is derived from `status` and
   * `errorMessage` only, so it is memoized on those two — a change to
   * `apiBase` alone leaves the announced string untouched.
   */
  const announcement = useMemo(
    () => deriveAnnouncement(status, errorMessage),
    [status, errorMessage]
  );

  const loadSettings = useCallback(() => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const base = resolveApiBase();
      if (!base) {
        setStatus("empty");
      } else {
        setApiBase(base);
        setStatus("success");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load settings configuration."
      );
      setStatus("error");
    }
  }, []);

  return (
    <PageShell maxWidth="2xl" gap="8">
      <h1 className="text-3xl font-semibold tracking-tight">
        {messages.settings.heading}
      </h1>

      {/* Screen reader live region for assistive technology announcements */}
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      {/* Loading State */}
      {status === "loading" && <LoadingPanel />}

      {/* Error State with Retry Button */}
      {status === "error" && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20"
        >
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {errorMessage || "Failed to load settings."}
          </p>
          <button
            type="button"
            onClick={loadSettings}
            className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-red-700 dark:hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {status === "empty" && (
        <div
          role="region"
          aria-label="Empty settings"
          className="rounded-lg border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700"
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No settings available.
          </p>
        </div>
      )}

      {/* Success State */}
      {status === "success" && <SettingsSections apiBase={apiBase} />}
    </PageShell>
  );
}
