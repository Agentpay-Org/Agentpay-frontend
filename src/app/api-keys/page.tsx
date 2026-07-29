"use client";

import { PageShell } from "@/components/PageShell";
import { useEffect, useState, useMemo } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/apiClient";
import { AlertError } from "@/components/AlertError";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CopyButton } from "@/components/CopyButton";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { TimeAgo } from "@/components/TimeAgo";

type KeyItem = {
  prefix: string;
  label: string;
  createdAt?: number | string | null;
};


function toTimestampMs(value: KeyItem["createdAt"]): number | null {
  if (value === null || value === undefined) return null;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric < 1_000_000_000_000 ? numeric * 1_000 : numeric;
}

export default function ApiKeysPage() {
  const [items, setItems] = useState<KeyItem[] | null>(null);
  const [label, setLabel] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const tableData = useMemo(() => items ?? [], [items]);

  const load = () =>
    apiGet<{ items: KeyItem[] }>("/api/v1/api-keys")
      .then((b) => setItems(b.items))
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    void load();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiPost<{ key: string }>("/api/v1/api-keys", { label });
      setCreated(res.key);
      setShowFull(false);
      setLabel("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onDelete = async (prefix: string) => {
    setError(null);
    try {
      await apiDelete(`/api/v1/api-keys/${prefix}`);
      await load();
    } catch (err) {
      setError((err as Error).message);
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
            <CopyButton value={created} />
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

      <AlertError message={error} />

      {items && items.length === 0 && (
        <div role="status">
          <EmptyState
            title="No API keys yet"
            description="Create an API key to authenticate requests from your agents and services."
          />
        </div>
      )}

      {items && items.length > 0 && (
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
