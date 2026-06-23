"use client";

import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { useApi } from "@/lib/useApi";

type Entry = { version: string; date: string; notes: string[] };

export default function ChangelogPage() {
  const state = useApi<{ entries: Entry[] }>("/api/v1/changelog");
  const entries = state.status === "ok" ? state.data.entries : null;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Changelog</h1>
      {state.status === "loading" && <Spinner label="Loading changelog" />}
      {state.status === "error" && (
        <p role="alert" className="text-sm text-rose-600">
          {state.error}
        </p>
      )}
      {entries?.length === 0 && (
        <EmptyState
          title="No changelog entries yet"
          description="New release notes will appear here when they are published."
        />
      )}
      {entries && entries.length > 0 && (
        <ol className="flex flex-col gap-6">
          {entries.map((e) => (
            <li key={e.version} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold">
                {e.version} <span className="text-sm text-zinc-500">— {e.date}</span>
              </h2>
              <ul className="mt-2 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
                {e.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
