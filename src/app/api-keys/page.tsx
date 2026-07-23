"use client";

import { PageShell } from "@/components/PageShell";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/apiClient";
import { AlertError } from "@/components/AlertError";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CopyButton } from "@/components/CopyButton";
import { EmptyState } from "@/components/EmptyState";
import { TimeAgo } from "@/components/TimeAgo";
import { safeFormatTimestamp } from "@/lib/format";

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
    ? created.slice(0, created.indexOf("_") + 1) + "****"
    : "";

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
        <section
          aria-labelledby="created-key-heading"
          className="flex flex-col gap-3 rounded border border-emerald-300 bg-emerald-50 p-4 text-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <p id="created-key-heading" className="font-medium">
              New key - copy now, shown only once.
            </p>
            <CopyButton value={created} label="Copy" />
          </div>
          <div className="flex items-center gap-2 font-mono text-sm">
            <code id="created-api-key" className="flex-1 break-all">
              {showFull ? created : maskedKey}
            </code>
            <button
              type="button"
              aria-pressed={showFull}
              aria-controls="created-api-key"
              onClick={() => setShowFull((v) => !v)}
            >
              {showFull ? "Hide" : "Reveal"}
            </button>
          </div>
          <p
            role="status"
            aria-label="API key visibility"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            API key is {showFull ? "visible" : "hidden"}.
          </p>
          <button type="button" onClick={onDismiss}>
            Done - I have saved it
          </button>
        </section>
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
        <ul className="divide-y divide-zinc-200">
          {items.map((k) => {
            const createdAtMs = toTimestampMs(k.createdAt);
            const createdAtIso = safeFormatTimestamp(createdAtMs);

            return (
              <li
                key={k.prefix}
                className="flex items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{k.label}</p>
                  <p className="font-mono text-xs text-zinc-500">
                    {k.prefix}...
                  </p>
                  <p className="text-xs text-zinc-500">
                    Created{" "}
                    {createdAtMs === null ? (
                      <time title={createdAtIso}>{createdAtIso}</time>
                    ) : (
                      <TimeAgo ts={createdAtMs} />
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingRevoke(k)}
                  className="rounded border border-zinc-300 px-3 py-1 text-xs"
                >
                  Revoke
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
