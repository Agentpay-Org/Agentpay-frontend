"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/apiClient";
import { AlertError } from "@/components/AlertError";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CopyButton } from "@/components/CopyButton";
import { PageShell } from "@/components/PageShell";

type KeyItem = { prefix: string; label: string; createdAt: number };

export default function ApiKeysPage() {
  const [items, setItems] = useState<KeyItem[] | null>(null);
  const [label, setLabel] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<KeyItem | null>(null);

  const load = () =>
    apiGet("/api/v1/api-keys")
      .then((b) => setItems((b as { items: KeyItem[] }).items))
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    void load();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiPost("/api/v1/api-keys", { label });
      setCreated((res as { key: string }).key);
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
        <div role="status" className="flex flex-col gap-3 rounded border border-emerald-300 bg-emerald-50 p-4 text-sm">
          <p className="font-medium">New key - copy now, shown only once.</p>
          <div className="flex items-center gap-2 font-mono text-sm">
            <code className="flex-1 break-all">
              {showFull ? created : maskedKey}
            </code>
            <button
              type="button"
              aria-pressed={showFull}
              onClick={() => setShowFull((v) => !v)}
            >
              {showFull ? "Hide" : "Reveal"}
            </button>
            <CopyButton value={created} label="Copy" />
          </div>
          <button type="button" onClick={onDismiss}>
            Done - I have saved it
          </button>
        </div>
      )}

      <AlertError message={error} />

      {items && (
        <ul className="divide-y divide-zinc-200">
          {items.map((k) => (
            <li key={k.prefix} className="flex items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-medium">{k.label}</p>
                <p className="font-mono text-xs text-zinc-500">{k.prefix}...</p>
              </div>
              <button
                type="button"
                onClick={() => setPendingRevoke(k)}
                className="rounded border border-zinc-300 px-3 py-1 text-xs"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
