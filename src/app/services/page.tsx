"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/apiClient";
import { AlertError } from "@/components/AlertError";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/PageShell";
import { Pagination } from "@/components/Pagination";
import { Spinner } from "@/components/Spinner";
import { truncateMiddle } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";
import { useClipboard } from "@/lib/useClipboard";

type Service = { serviceId: string; priceStroops: number };
type ServicesResponse = {
  services?: Service[];
  items?: Service[];
  page?: number;
  pageCount?: number;
};

const PAGE_SIZE = 25;

export function ServiceCopyButton({ serviceId }: { serviceId: string }) {
  const { copy, copied } = useClipboard({ timeout: 1500 });
  const { push } = useToast();

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await copy(serviceId);
    if (success) {
      push("Service ID copied to clipboard", "info");
    } else {
      push("Failed to copy service ID", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy service ID for ${serviceId}`}
      title={`Copy service ID for ${serviceId}`}
      aria-live="polite"
      className="ml-3 inline-flex items-center gap-1.5 rounded border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
    >
      {copied ? (
        <span>Copied</span>
      ) : (
        <>
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.1"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 15.75s1.5 0 1.5 1.5V6a2.25 2.25 0 0 1 2.25-2.25h6.375A2.25 2.25 0 0 1 21 6v11.25a2.25 2.25 0 0 1-2.25 2.25H9z"
            />
          </svg>
          <span>Copy ID</span>
        </>
      )}
    </button>
  );
}

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
    <PageShell>
      <header className="flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Services</h1>
        <Link
          href="/services/new"
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-white dark:text-black"
        >
          New service
        </Link>
      </header>
      <AlertError message={error} />
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
            <li
              key={s.serviceId}
              className="-mx-4 flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <Link
                href={`/services/${encodeURIComponent(s.serviceId)}`}
                className="flex flex-1 items-center justify-between rounded-lg hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:bg-zinc-900"
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
              <ServiceCopyButton serviceId={s.serviceId} />
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
    </PageShell>
  );
}

