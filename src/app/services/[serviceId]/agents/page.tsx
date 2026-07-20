"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/apiClient";
import { AlertError } from "@/components/AlertError";
import { PageShell } from "@/components/PageShell";

type TopAgents = { serviceId: string; items: { agent: string; total: number }[] };

export default function ServiceAgentsPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = use(params);
  const [items, setItems] = useState<TopAgents["items"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<TopAgents>(
      `/api/v1/services/${encodeURIComponent(serviceId)}/agents/top?limit=25`
    )
      .then((b) => { if (!cancelled) setItems(b.items); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [serviceId]);

  return (
    <PageShell>
      <Link
        href={`/services/${encodeURIComponent(serviceId)}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Back to service
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">
        Top agents <span className="font-mono text-base text-zinc-500">{serviceId}</span>
      </h1>
      <AlertError message={error} />
      {items && items.length === 0 && (
        <p className="text-sm text-zinc-500">No agents on this service yet.</p>
      )}
      {items && items.length > 0 && (
        <ol className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((a, i) => (
            <li key={a.agent} className="flex items-center justify-between py-3 text-sm">
              <span className="font-mono">
                <span className="mr-3 inline-block w-5 text-right text-zinc-500">
                  {i + 1}.
                </span>
                {a.agent}
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {a.total} requests
              </span>
            </li>
          ))}
        </ol>
      )}
    </PageShell>
  );
}
