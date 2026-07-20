"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/apiClient";
import { AlertError } from "@/components/AlertError";
import { PageShell } from "@/components/PageShell";

type Usage = { agent: string; items: { serviceId: string; total: number }[] };

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ agent: string }>;
}) {
  const { agent } = use(params);
  const [items, setItems] = useState<Usage["items"] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<Usage>(`/api/v1/agents/${encodeURIComponent(agent)}/usage`)
      .then((b) => { if (!cancelled) setItems(b.items); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    apiGet<{ total: number }>(
      `/api/v1/agents/${encodeURIComponent(agent)}/total`
    )
      .then((b) => { if (!cancelled) setTotal(b.total); })
      .catch(() => {
        /* total is optional */
      });
    return () => { cancelled = true; };
  }, [agent]);

  return (
    <PageShell>
      <Link href="/agents" className="text-sm text-zinc-500 hover:underline">
        ← Back to agents
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight font-mono">{agent}</h1>
      <AlertError message={error} />
      {total !== null && (
        <p className="text-sm">
          Lifetime total: <strong>{total}</strong> requests
        </p>
      )}
      {items && items.length === 0 && (
        <p className="text-sm text-zinc-500">No services consumed yet.</p>
      )}
      {items && items.length > 0 && (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((s) => (
            <li key={s.serviceId} className="flex items-center justify-between py-3 text-sm">
              <span className="font-mono">{s.serviceId}</span>
              <span>{s.total} requests</span>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
