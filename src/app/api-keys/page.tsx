"use client";

import { PageShell } from "@/components/PageShell";
import { useCallback, useEffect, useState, useMemo } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/apiClient";
import { mapApiError } from "@/lib/mapApiError";
import { AlertError } from "@/components/AlertError";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CopyButton } from "@/components/CopyButton";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { TimeAgo } from "@/components/TimeAgo";
import { useApiKeysAnnouncement } from "./useApiKeysAnnouncement";

type KeyItem = {
  prefix: string;
  label: string;
  createdAt?: number | string | null;
};

/**
 * Load state for the key list, mirroring the `loading | ok | error` vocabulary
 * the shared fetch hooks (`useApi` / `usePolling`) already use.
 *
 * Modelling this as one value rather than separate `items` / `error` flags makes
 * the three render states mutually exclusive by construction: the view can
 * never show the empty state while a load is in flight, or an error and a table
 * at the same time.
 */
type FetchState =
  | { status: "loading" }
  | { status: "ok"; items: KeyItem[] }
  | { status: "error"; message: string };


function toTimestampMs(value: KeyItem["createdAt"]): number | null {
  if (value === null || value === undefined) return null;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric < 1_000_000_000_000 ? numeric * 1_000 : numeric;
}

export default function ApiKeysPage() {
  const [fetchState, setFetchState] = useState<FetchState>({
    status: "loading",
  });
  const [label, setLabel] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);
  // Errors from create/revoke are separate from load errors: they annotate an
  // otherwise-usable view rather than replacing it with an error state.
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<KeyItem | null>(null);

  const columns = useMemo<DataTableColumn<KeyItem>[]>(
    () => [
      {
        key: "label",
        header: "Label",
        sortable: true,
        sortAccessor: (r) => r.label.toLowerCase(),
        render: (r) => r.label,
      },
      {
        key: "prefix",
        header: "Prefix",
        sortable: true,
        sortAccessor: (r) => r.prefix,
        render: (r) => <code className="font-mono text-xs">{r.prefix}*</code>,
      },
      {
        key: "createdAt",
        header: "Created",
        sortable: true,
        sortAccessor: (r) => toTimestampMs(r.createdAt) ?? 0,
        render: (r) => {
          const ms = toTimestampMs(r.createdAt);
          return ms !== null ? <TimeAgo ts={ms} /> : <span title="—">—</span>;
        },
      },
      {
        key: "actions",
        header: "",
        render: (r) => (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setPendingRevoke(r)}
              className="rounded border border-zinc-300 px-3 py-1 text-xs hover:border-rose-500 hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700"
            >
              Revoke
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const items = fetchState.status === "ok" ? fetchState.items : null;
  const error = fetchState.status === "error" ? fetchState.message : null;
  const tableData = useMemo(() => items ?? [], [items]);

  const load = useCallback(
    () =>
      apiGet<{ items: KeyItem[] }>("/api/v1/api-keys")
        // A payload without `items` is treated as an empty list so the view
        // shows the empty state instead of rendering blank.
        .then((b) => setFetchState({ status: "ok", items: b.items ?? [] }))
        .catch((e: Error) =>
          setFetchState({ status: "error", message: mapApiError(e).message })
        ),
    []
  );

  /** Re-run the load from the start, showing the loading state again. */
  const reload = useCallback(() => {
    setFetchState({ status: "loading" });
    return load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      const res = await apiPost<{ key: string }>("/api/v1/api-keys", { label });
      setCreated(res.key);
      setShowFull(false);
      setLabel("");
      await load();
    } catch (err) {
      setActionError(mapApiError(err).message);
    }
  };

  const onDelete = async (prefix: string) => {
    setActionError(null);
    try {
      await apiDelete(`/api/v1/api-keys/${prefix}`);
      await load();
    } catch (err) {
      setActionError(mapApiError(err).message);
    }
  };

  const onDismiss = () => {
    setCreated(null);
    setShowFull(false);
  };

  const maskedKey = created
    ? created.slice(0, Math.max(created.indexOf("_"), 0) + 1) + "****"
    : "";

  const revealToggleLabel = showFull ? "Hide full API key" : "Show full API key";
  const revealStateMessage = showFull ? "API key is visible" : "API key is hidden";

  const listAnnouncement = useApiKeysAnnouncement(items, error);

  return (
    <PageShell>
      <ConfirmDialog
        open={pendingRevoke !== null}
        title="Revoke API key?"
        description={`"${pendingRevoke?.label}" will stop working immediately.`}
        confirmLabel="Revoke"
        onConfirm={() => {
          if (pendingRevoke) onDelete(pendingRevoke.prefix);
          setPendingRevoke(null);
        }}
        onCancel={() => setPendingRevoke(null)}
      />

      <h1 className="text-3xl font-semibold tracking-tight">API keys</h1>

      {/*
       * Debounced api-keys announcements for assistive tech. The region is
       * mounted empty (so screen readers register it before the first change)
       * and only subsequent meaningful count/empty changes are announced.
       * Deliberately not role="status": the empty and loading states own that
       * role, and a second one would make the page's status ambiguous.
       */}
      <span
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="api-keys-announcer"
      >
        {listAnnouncement}
      </span>

      <form onSubmit={onCreate} className="flex gap-2">
        <input
          required
          maxLength={64}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          aria-label="Label"
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Create
        </button>
      </form>

      {created && (
        <div aria-label="Created API key" className="flex flex-col gap-3 rounded border border-emerald-300 bg-emerald-50 p-4 text-sm">
          <p className="font-medium">New key - copy now, shown only once.</p>
          <div className="flex items-center gap-2 font-mono text-sm">
            <code id="created-api-key" className="flex-1 break-all">
              {showFull ? created : maskedKey}
            </code>
            <button
              type="button"
              aria-controls="created-api-key"
              aria-label={revealToggleLabel}
              aria-pressed={showFull}
              onClick={() => setShowFull((v) => !v)}
            >
              {showFull ? "Hide" : "Show"}
            </button>
            <CopyButton value={created} />
          </div>
          <p aria-live="polite" aria-atomic="true" className="sr-only">
            {revealStateMessage}
          </p>
          <button type="button" onClick={onDismiss}>
            Done - I have saved it
          </button>
        </div>
      )}

      <AlertError message={actionError} />

      {/*
       * Loading / error / empty are mutually exclusive branches of one state
       * value, so exactly one can ever render. Each carries its own live-region
       * role (role="status" for loading and empty, role="alert" inside
       * ErrorMessage) so assistive tech announces the transition; they are
       * deliberately not nested inside a shared aria-live wrapper, which would
       * announce the same change twice.
       */}
      {fetchState.status === "loading" && (
        <p role="status" className="text-sm text-zinc-500">
          Loading API keys…
        </p>
      )}

      {fetchState.status === "error" && (
        <ErrorMessage
          title="Could not load API keys"
          detail={fetchState.message}
          onRetry={reload}
        />
      )}

      {fetchState.status === "ok" && fetchState.items.length === 0 && (
        <div role="status">
          <EmptyState
            title="No API keys yet"
            description="Create an API key to authenticate requests from your agents and services."
          />
        </div>
      )}

      {fetchState.status === "ok" && fetchState.items.length > 0 && (
        <DataTable
          caption="API keys"
          columns={columns}
          data={tableData}
          getRowKey={(k) => k.prefix}
        />
      )}
    </PageShell>
  );
}
