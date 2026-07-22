"use client";

import { PageShell } from "@/components/PageShell";
import Link from "next/link";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { Spinner } from "@/components/Spinner";
import { apiGet } from "@/lib/apiClient";
import { MAX_RENDERED_ROWS } from "@/lib/format";
import { useDebounce } from "@/lib/useDebounce";

type Service = { serviceId: string; priceStroops: number };

type SearchState = {
  items: Service[] | null;
  loading: boolean;
  error: string | null;
};

type SearchAction =
  | { type: "clear" }
  | { type: "loading" }
  | { type: "success"; items: Service[] }
  | { type: "error"; error: string };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "clear":
      return { items: null, loading: false, error: null };
    case "loading":
      return { ...state, loading: true, error: null };
    case "success":
      return { items: action.items, loading: false, error: null };
    case "error":
      return { items: null, loading: false, error: action.error };
  }
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const debounced = useDebounce(q, 250);
  const [{ items, loading, error }, dispatchSearch] = useReducer(searchReducer, {
    items: null,
    loading: false,
    error: null,
  });
  const requestId = useRef(0);
  const latestInputRef = useRef("");
  const latestInput = q.trim();
  const query = debounced.trim();
  const hasPendingDebounce = latestInput !== query;
  const isSearching = Boolean(latestInput) && (hasPendingDebounce || loading);
  const visibleItems = query ? items : null;

  const renderedItems = useMemo(() => {
    if (!visibleItems) return null;
    return visibleItems.slice(0, MAX_RENDERED_ROWS);
  }, [visibleItems]);

  const totalVisible = visibleItems?.length ?? 0;
  const isTruncated = totalVisible > MAX_RENDERED_ROWS;

  const handleQueryChange = (value: string) => {
    latestInputRef.current = value.trim();
    setQ(value);
  };

  // Derive live region text from items and debounced query
  const liveRegionText = useMemo(() => {
    if (!query || error || isSearching) return "";
    if (!items) return "";
    const count = items.length;
    return count === 0
      ? `No matches for "${query}"`
      : `${count} result${count === 1 ? "" : "s"} for "${query}"`;
  }, [error, isSearching, items, query]);

  useEffect(() => {
    requestId.current += 1;
    const activeRequestId = requestId.current;

    if (!query) {
      dispatchSearch({ type: "clear" });
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    dispatchSearch({ type: "loading" });
    const isCurrentRequest = () =>
      !cancelled &&
      requestId.current === activeRequestId &&
      latestInputRef.current === query;

    apiGet<{ services: Service[] }>(
      `/api/v1/services?q=${encodeURIComponent(query)}&limit=50`,
      { signal: controller.signal }
    )
      .then((b) => {
        if (!isCurrentRequest()) return;
        dispatchSearch({ type: "success", items: b.services });
      })
      .catch((e) => {
        if (!isCurrentRequest()) return;
        dispatchSearch({
          type: "error",
          error: (e as Error).message || "Search failed",
        });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [query]);

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
      <SearchBar value={q} onChange={handleQueryChange} placeholder="Search services…" />
      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Spinner label="Searching services" />
          <span>Searching...</span>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveRegionText}
      </div>
      {!error && visibleItems && visibleItems.length === 0 && (
        <p className="text-sm text-zinc-500">No matches.</p>
      )}
      {!error && visibleItems && visibleItems.length > 0 && (
        <>
          {isTruncated && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Showing first {MAX_RENDERED_ROWS} of {totalVisible} results.
            </p>
          )}
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {renderedItems!.map((s) => (
            <li key={s.serviceId} className="py-3 font-mono text-sm">
              <Link
                href={`/services/${encodeURIComponent(s.serviceId)}`}
                className="hover:underline"
              >
                {s.serviceId}
              </Link>{" "}
              <span className="text-zinc-500">— {s.priceStroops} stroops</span>
            </li>
          ))}
        </ul>
        </>
      )}
    </PageShell>
  );
}
