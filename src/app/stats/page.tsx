"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import { AlertError } from "@/components/AlertError";
import { PageShell } from "@/components/PageShell";

type Stats = {
  totalServices: number;
  totalApiKeys: number;
  totalRequests: number;
  uniqueAgents: number;
  paused: boolean;
};

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = () =>
      apiGet<Stats>("/api/v1/stats")
        .then((s) => !cancelled && setStats(s))
        .catch((e) => !cancelled && setError(e.message));
    tick();
    const t = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
      <AlertError message={error} />
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
