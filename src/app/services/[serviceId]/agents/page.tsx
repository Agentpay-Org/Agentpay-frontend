"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/apiClient";
import { MAX_RENDERED_ROWS } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { Spinner } from "@/components/Spinner";

type TopAgent = { agent: string; total: number };
type TopAgents = {
  serviceId: string;
  items?: TopAgent[];
  agents?: TopAgent[];
  page?: number;
  pageCount?: number;
};

const PAGE_SIZE = 25;

export default function ServiceAgentsPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = use(params);
  const [items, setItems] = useState<TopAgent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [requestedPage, setRequestedPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  const onPageChange = (nextPage: number) => {
    setLoading(true);
    setError(null);
    setItems(null);
    setRequestedPage(nextPage);
  };

  useEffect(() => {
    let cancelled = false;

    apiGet<TopAgents>(
      `/api/v1/services/${encodeURIComponent(
        serviceId,
      )}/agents/top?page=${requestedPage}&limit=${PAGE_SIZE}`,
    )
      .then((body) => {
        if (cancelled) return;

        const nextItems = body.items ?? body.agents ?? [];
        const nextPageCount = Math.max(body.pageCount ?? 1, 1);
        const nextPage = Math.min(
          Math.max(body.page ?? requestedPage, 1),
          nextPageCount,
        );

        setItems(nextItems);
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
  }, [requestedPage, serviceId]);

  const renderedItems = useMemo(() => {
    if (!items) return null;
    return items.slice(0, MAX_RENDERED_ROWS);
  }, [items]);

  const totalVisible = items?.length ?? 0;
  const isTruncated = totalVisible > MAX_RENDERED_ROWS;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <Link
        href={`/services/${encodeURIComponent(serviceId)}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Back to service
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">
        Top agents{" "}
        <span className="font-mono text-base text-zinc-500">{serviceId}</span>
      </h1>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {loading && (
        <div className="flex justify-center py-10">
          <Spinner label="Loading top agents" />
        </div>
      )}
      {!loading && items && items.length === 0 && (
        <EmptyState
          title="No agents on this service yet."
          description="Agents appear here after they record usage against this service."
        />
      )}
      {!loading && items && items.length > 0 && (
        <>
          {isTruncated && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Showing first {MAX_RENDERED_ROWS} of {totalVisible} agents.
            </p>
          )}
          <ol className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {renderedItems!.map((a, i) => (
            <li
              key={a.agent}
              className="flex items-center justify-between py-3 text-sm"
            >
              <span className="flex items-center font-mono">
                <span className="mr-3 inline-block w-5 text-right text-zinc-500">
                  {(page - 1) * PAGE_SIZE + i + 1}.
                </span>
                <Link
                  href={`/agents/${encodeURIComponent(a.agent)}`}
                  className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  {a.agent}
                </Link>
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {a.total} requests
              </span>
            </li>
          ))}
        </ol>
        </>
      )}
      {!loading && !error && (
        <Pagination page={page} pageCount={pageCount} onChange={onPageChange} />
      )}
    </main>
  );
}
