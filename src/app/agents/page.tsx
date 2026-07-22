"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/apiClient";
import { AlertError } from "@/components/AlertError";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/PageShell";
import { Pagination } from "@/components/Pagination";
import { Spinner } from "@/components/Spinner";

type StatsResponse = {
  totalServices: number;
  totalApiKeys: number;
  totalRequests: number;
  uniqueAgents: number;
  paused: boolean;
};

type AgentsResponse = {
  agents?: string[];
  items?: string[];
  page?: number;
  pageCount?: number;
};

const PAGE_SIZE = 25;

export default function AgentsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [agents, setAgents] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // `page` tracks the server-confirmed page; `requestedPage` drives the fetch.
  const [page, setPage] = useState(1);
  const [requestedPage, setRequestedPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    let cancelled = false;
    apiGet<StatsResponse>("/api/v1/stats")
      .then((s) => { if (!cancelled) setStats(s); })
      .catch(() => {
        /* stats summary is optional — a failure is silent */
      });
    return () => { cancelled = true; };
  }, []);

  const onPageChange = (nextPage: number) => {
    setLoading(true);
    setError(null);
    setAgents(null);
    setRequestedPage(nextPage);
  };

  useEffect(() => {
    let cancelled = false;

    apiGet<AgentsResponse>(
      `/api/v1/agents?page=${requestedPage}&limit=${PAGE_SIZE}`
    )
      .then((body) => {
        if (cancelled) return;

        const nextAgents = body.agents ?? body.items ?? [];
        const nextPageCount = Math.max(body.pageCount ?? 1, 1);
        // Clamp to what the server actually returned in case it corrected an
        // out-of-range request, so the visible indicator stays in sync.
        const nextPage = Math.min(
          Math.max(body.page ?? requestedPage, 1),
          nextPageCount
        );

        setAgents(nextAgents);
        setPageCount(nextPageCount);
        setPage(nextPage);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message ?? "failed to load");
        setPageCount(1);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestedPage]);

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold tracking-tight">Agents</h1>

      {/* Stats summary sourced from /api/v1/stats */}
      {stats && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          <strong>{stats.uniqueAgents}</strong> unique agent(s) seen across{" "}
          <strong>{stats.totalServices}</strong> service(s).
        </p>
      )}

      <AlertError message={error} />

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner label="Loading agents" />
        </div>
      )}

      {!loading && agents && agents.length === 0 && (
        <EmptyState
          title="No agents seen yet."
          description="Agents appear here once they start making requests to your services."
        />
      )}

      {!loading && agents && agents.length > 0 && (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {agents.map((agent) => (
            <li key={agent}>
              <Link
                href={`/agents/${encodeURIComponent(agent)}`}
                className="flex items-center py-3 font-mono text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {agent}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination renders null automatically when pageCount ≤ 1 */}
      {!loading && !error && (
        <Pagination page={page} pageCount={pageCount} onChange={onPageChange} />
      )}
    </PageShell>
  );
}
