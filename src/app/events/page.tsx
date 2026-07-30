"use client";

import { useEffect, useMemo, useState } from "react";
import { ErrorMessage } from "@/components/ErrorMessage";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/PageShell";
import { SearchBar } from "@/components/SearchBar";
import { Spinner } from "@/components/Spinner";
import { apiGet } from "@/lib/apiClient";
import { MAX_RENDERED_ROWS, safeFormatTimestamp, safeStringify } from "@/lib/format";
import { useDebounce } from "@/lib/useDebounce";

import { Activity } from "./Activity";

export type AppEvent = {
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
const CSV_HEADERS = ["id", "timestamp", "type", "payload"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

/**
 * Characters that Excel/Sheets/LibreOffice interpret as the start of a
 * formula when a cell is opened. Prefixing with a leading apostrophe forces
 * the value to be treated as text, neutralising CSV-formula-injection.
 */
const CSV_FORMULA_PREFIX_RE = /^[=+\-@\t\r]/;

/**
 * Escape a single CSV field per RFC 4180: guard against formula injection,
 * then quote the field (doubling embedded quotes) if it contains a comma,
 * quote, or newline.
 */
function escapeCsvField(value: string): string {
  let field = CSV_FORMULA_PREFIX_RE.test(value) ? `'${value}` : value;
  if (/[",\r\n]/.test(field)) {
    field = `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/** Serialise events to an RFC 4180 CSV string (CRLF line endings, header row). */
function eventsToCsv(events: AppEvent[]): string {
  const rows = events.map((event) =>
    [
      event.id,
      safeFormatTimestamp(event.ts),
      event.type,
      safeStringify(event.payload, Infinity),
    ]
      .map((field) => escapeCsvField(field))
      .join(","),
  );
  return [CSV_HEADERS.join(","), ...rows].join("\r\n");
}

function csvExportFilename(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `events-${stamp}.csv`;
}

/** UTF-8 byte-order mark so Excel opens the exported CSV with the right charset. */
const BOM = String.fromCharCode(0xfeff);

/**
 * Trigger a browser download of the given events as CSV. A UTF-8 BOM is
 * prepended so Excel opens the file with the correct character set.
 */
function downloadEventsCsv(events: AppEvent[]): void {
  const csv = eventsToCsv(events);
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = csvExportFilename();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  const exportDisabled = loading || totalVisible === 0;

  const handleExportCsv = () => {
    if (!visibleItems || visibleItems.length === 0) return;
    downloadEventsCsv(visibleItems);
  };

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
    <PageShell maxWidth="4xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Event log</h1>
          <p className="max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Inspect recent backend activity, narrow the list by event type, and
            opt into live refreshes when you need to watch a stream.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={exportDisabled}
            aria-label="Export filtered events as CSV"
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700"
          >
            Export CSV
          </button>
          <button
            type="button"
            aria-pressed={autoRefresh}
            aria-label="Auto-refresh event log"
            onClick={() => setAutoRefresh((next) => !next)}
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700"
          >
            Auto-refresh {autoRefresh ? "on" : "off"}
          </button>
        </div>
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

      {error && <ErrorMessage title="Failed to load events" detail={error} />}

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
            {renderedItems!.map((event, index) => (
              <Activity key={`${index}-${event.id}`} event={event} />
            ))}
          </ol>
        </>
      )}
    </PageShell>
  );
}
