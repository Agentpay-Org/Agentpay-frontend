"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { TimeAgo } from "@/components/TimeAgo";
import { Spinner } from "@/components/Spinner";
import { apiGet } from "@/lib/apiClient";
import { MAX_RENDERED_ROWS, safeFormatTimestamp, safeStringify } from "@/lib/format";
import { useDebounce } from "@/lib/useDebounce";

type AppEvent = {
  id: string;
  ts: number | string | null;
  type: string;
  payload: unknown;
};

type EventsResponse = {
  items?: unknown;
  events?: unknown;
};

const EVENT_POLL_INTERVAL_MS = 5000;
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

/**
 * Parse a loosely-typed EventsResponse into a list of AppEvents.
 *
 * Supports two response shapes:
 * - { items: AppEvent[] }
 * - { events: AppEvent[] }
 *
 * Each event field is validated or coerced to ensure it matches the AppEvent type.
 * Specifically, the 'ts' field is coerced to null if it's not a number, string, or null.
 *
 * @throws {Error} if the payload is not an object or does not contain an array of items/events.
 */
function parseEventsResponse(body: EventsResponse): AppEvent[] {
  const items = Array.isArray(body.items)
    ? body.items
    : Array.isArray(body.events)
      ? body.events
      : null;

  if (!items) {
    throw new Error("Malformed events payload");
  }

  return items.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error("Malformed events payload");
    }

    const ts = item.ts;
    const validatedTs: AppEvent["ts"] =
      typeof ts === "number" || typeof ts === "string" || ts === null
        ? ts
        : null;

    return {
      id: typeof item.id === "string" ? item.id : String(item.id ?? index),
      ts: validatedTs,
      type: typeof item.type === "string" ? item.type : String(item.type ?? ""),
      payload: "payload" in item ? item.payload : undefined,
    };
  });
}

function buildEventsPath(typeFilter: string): string {
  const params = new URLSearchParams({ limit: "100" });
  if (typeFilter) {
    params.set("type", typeFilter);
  }
  return `/api/v1/events?${params.toString()}`;
}

export default function EventsPage() {
  const [items, setItems] = useState<AppEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const debouncedQuery = useDebounce(query.trim(), 250);

  const visibleItems = useMemo(() => {
    if (!items) return null;
    if (!debouncedQuery) return items;
    const needle = debouncedQuery.toLowerCase();
    return items.filter((item) => item.type.toLowerCase().includes(needle));
  }, [items, debouncedQuery]);

  const renderedItems = useMemo(() => {
    if (!visibleItems) return null;
    return visibleItems.slice(0, MAX_RENDERED_ROWS);
  }, [visibleItems]);

  const totalVisible = visibleItems?.length ?? 0;
  const isTruncated = totalVisible > MAX_RENDERED_ROWS;

  useEffect(() => {
    let cancelled = false;

    const load = (background = false) => {
      if (!background) {
        setLoading(true);
        setError(null);
        setItems(null);
      }

      return apiGet<EventsResponse>(buildEventsPath(debouncedQuery))
        .then((body) => {
          if (cancelled) return;
          setItems(parseEventsResponse(body));
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          const message = e instanceof Error ? e.message : "Failed to load events";
          setError(message);
          setItems([]);
        })
        .finally(() => {
          if (!cancelled && !background) {
            setLoading(false);
          }
        });
    };

    void load(false);

    const interval = autoRefresh
      ? setInterval(() => {
          void load(true);
        }, EVENT_POLL_INTERVAL_MS)
      : null;

    return () => {
      cancelled = true;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, debouncedQuery]);

  const hasFilter = debouncedQuery.length > 0;
  const emptyTitle = hasFilter
    ? `No events match "${debouncedQuery}".`
    : "No events yet.";
  const emptyDescription = hasFilter
    ? "Try a different event type or clear the filter."
    : "Incoming events will appear here once the backend records them.";

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-4xl flex-col gap-6 p-8 focus:outline-none"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Event log</h1>
          <p className="max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Inspect recent backend activity, narrow the list by event type, and
            opt into live refreshes when you need to watch a stream.
          </p>
        </div>
        <button
          type="button"
          aria-pressed={autoRefresh}
          aria-label="Auto-refresh event log"
          onClick={() => setAutoRefresh((next) => !next)}
          className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700"
        >
          Auto-refresh {autoRefresh ? "on" : "off"}
        </button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Filter by event type…"
          aria-label="Filter events by type"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Refresh interval: {EVENT_POLL_INTERVAL_MS / 1000}s when enabled.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}

      {loading && !error && (
        <div role="status" aria-busy="true" className="flex justify-center py-10">
          <Spinner label="Loading events" />
        </div>
      )}

      {!loading && !error && visibleItems && visibleItems.length === 0 && (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            hasFilter ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-white dark:text-black"
              >
                Clear filter
              </button>
            ) : null
          }
        />
      )}

      {!loading && !error && visibleItems && visibleItems.length > 0 && (
        <>
          {isTruncated && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Showing first {MAX_RENDERED_ROWS} of {totalVisible} events.
            </p>
          )}
          <ol className="flex flex-col gap-3 text-sm">
            {renderedItems!.map((event, index) => {
              const timestamp = safeFormatTimestamp(event.ts);
              const numericTs =
                typeof event.ts === "number"
                  ? event.ts
                  : typeof event.ts === "string"
                    ? Number(event.ts)
                    : Number.NaN;
              const hasValidTs = Number.isFinite(numericTs);

              return (
                <li
                  key={`${index}-${event.id}`}
                  className="rounded border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <span className="break-all font-mono text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                      {event.type}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <time dateTime={timestamp} title={timestamp}>
                        {timestamp}
                      </time>
                      {hasValidTs && <TimeAgo ts={numericTs} />}
                    </div>
                  </div>
                  <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded bg-zinc-50 p-3 font-mono text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {safeStringify(event.payload)}
                  </pre>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </main>
  );
}
