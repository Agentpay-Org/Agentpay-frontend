"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/apiClient";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { Spinner } from "@/components/Spinner";
import { truncateMiddle } from "@/lib/format";

type Service = { serviceId: string; priceStroops: number };
type ServicesResponse = {
  services?: Service[];
  items?: Service[];
  page?: number;
  pageCount?: number;
};

const PAGE_SIZE = 25;

export default function ServicesPage() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [requestedPage, setRequestedPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  const onPageChange = (nextPage: number) => {
    setLoading(true);
    setError(null);
    setServices(null);
    setRequestedPage(nextPage);
  };

  useEffect(() => {
    let cancelled = false;

    apiGet<ServicesResponse>(
      `/api/v1/services?page=${requestedPage}&limit=${PAGE_SIZE}`
    )
      .then((body) => {
        if (cancelled) return;

        const nextServices = body.services ?? body.items ?? [];
        const nextPageCount = Math.max(body.pageCount ?? 1, 1);
        const nextPage = Math.min(
          Math.max(body.page ?? requestedPage, 1),
          nextPageCount
        );

        setServices(nextServices);
        setPageCount(nextPageCount);
        setPage(nextPage);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message ?? "failed to load");
        setPageCount(1);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestedPage]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <header className="flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Services</h1>
        <Link
          href="/services/new"
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-white dark:text-black"
        >
          New service
        </Link>
      </header>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {loading && (
        <div className="flex justify-center py-10">
          <Spinner label="Loading services" />
        </div>
      )}
      {!loading && services && services.length === 0 && (
        <EmptyState
          title="No services registered yet."
          description="Create the first service to start tracking request pricing."
          action={
            <Link
              href="/services/new"
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-white dark:text-black"
            >
              New service
            </Link>
          }
        />
      )}
      {!loading && services && services.length > 0 && (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {services.map((s) => (
            <li key={s.serviceId}>
              <Link
                href={`/services/${encodeURIComponent(s.serviceId)}`}
                className="-mx-4 flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:bg-zinc-900"
              >
                <span
                  className="font-mono text-sm"
                  title={s.serviceId}
                  aria-label={s.serviceId}
                >
                  {truncateMiddle(s.serviceId)}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {s.priceStroops} stroops / request
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!loading && !error && (
        <Pagination
          page={page}
          pageCount={pageCount}
          onChange={onPageChange}
        />
      )}
    </main>
  );
}
