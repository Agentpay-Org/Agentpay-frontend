"use client";

import { useState, useEffect, useCallback } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageShell } from "@/components/PageShell";
import { messages } from "@/lib/messages";
import { resolveApiBase } from "@/lib/resolveApiBase";
import { KeyValueGrid } from "@/components/KeyValueGrid";
import { CopyButton } from "@/components/CopyButton";

type SettingsState = "loading" | "error" | "empty" | "success";

export default function SettingsPage() {
  const [status, setStatus] = useState<SettingsState>("loading");
  const [apiBase, setApiBase] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

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

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <PageShell maxWidth="2xl" gap="8">
      <h1 className="text-3xl font-semibold tracking-tight">
        {messages.settings.heading}
      </h1>

      {/* Screen reader live region for assistive technology announcements */}
      <div className="sr-only" aria-live="polite" role="status">
        {status === "loading" && "Loading settings..."}
        {status === "error" && `Error: ${errorMessage}`}
        {status === "empty" && "No settings configured."}
        {status === "success" && "Settings loaded successfully."}
      </div>

      {/* Loading State */}
      {status === "loading" && (
        <div
          role="status"
          aria-label="Loading settings"
          className="rounded-lg border border-zinc-200 p-6 text-center dark:border-zinc-800"
        >
          <p className="text-sm text-zinc-500">Loading settings...</p>
        </div>
      )}

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
      {status === "success" && (
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
              <KeyValueGrid
                rows={[
                  {
                    label: messages.settings.connection.label,
                    value: (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-900 dark:text-zinc-100">
                          {apiBase}
                        </span>
                        <CopyButton value={apiBase} label="Copy" />
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </section>
        </>
      )}
    </PageShell>
  );
}
