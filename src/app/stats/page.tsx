"use client";

import { AlertError } from "@/components/AlertError";
import { PageShell } from "@/components/PageShell";
import { TimeAgo } from "@/components/TimeAgo";
import { usePolling } from "@/lib/usePolling";

type Stats = {
  totalServices: number;
  totalApiKeys: number;
  totalRequests: number;
  uniqueAgents: number;
  paused: boolean;
};

export default function StatsPage() {
  const statsState = usePolling<Stats>("/api/v1/stats", 5000);
  const stats = statsState.data;
  const error = statsState.error;
  const lastUpdated = statsState.lastUpdated;

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
      <AlertError message={error} />
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          Last updated: {lastUpdated ? <TimeAgo ts={lastUpdated.getTime()} /> : "Never"}
        </p>
        <button
          type="button"
          aria-pressed={statsState.paused}
          onClick={statsState.paused ? statsState.resume : statsState.pause}
          className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {statsState.paused ? "Resume polling" : "Pause polling"}
        </button>
      </div>
      {stats && (
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Services", stats.totalServices],
            ["API keys", stats.totalApiKeys],
            ["Requests", stats.totalRequests],
            ["Agents", stats.uniqueAgents],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-zinc-200 p-4 text-center dark:border-zinc-800"
            >
              <dt className="text-xs uppercase tracking-wide text-zinc-500">
                {label}
              </dt>
              <dd className="mt-1 text-2xl font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {stats?.paused && (
        <p role="status" className="text-sm text-amber-700">
          The backend is currently paused — writes are refused.
        </p>
      )}
    </PageShell>
  );
}
