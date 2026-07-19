"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/apiClient";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TimeAgo } from "@/components/TimeAgo";
import { safeFormatTimestamp } from "@/lib/format";
import { safeHref } from "@/lib/url";

type Webhook = { id: string; url: string; events: string[]; createdAt?: number | null };

export default function WebhooksPage() {
  const [items, setItems] = useState<Webhook[] | null>(null);
  const [url, setUrl] = useState("");
  const [eventsCsv, setEventsCsv] = useState("usage.recorded,usage.settled");
  const [error, setError] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<Webhook | null>(null);

  const load = () =>
    apiGet<{ items: Webhook[] }>("/api/v1/webhooks")
      .then((b) => setItems(b.items))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const events = eventsCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await apiPost("/api/v1/webhooks", { url, events });
      setUrl("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await apiDelete(`/api/v1/webhooks/${id}`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <ConfirmDialog
        open={pendingRemove !== null}
        title="Remove webhook?"
        description={`Deliveries to "${pendingRemove?.url}" will stop immediately.`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (pendingRemove) onDelete(pendingRemove.id);
          setPendingRemove(null);
        }}
        onCancel={() => setPendingRemove(null)}
      />
      <h1 className="text-3xl font-semibold tracking-tight">Webhooks</h1>
      <form onSubmit={onCreate} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>URL</span>
          <input
            required
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/agentpay-hook"
            className="rounded-md border border-zinc-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Events (comma-separated)</span>
          <input
            required
            value={eventsCsv}
            onChange={(e) => setEventsCsv(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Register
        </button>
        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}
      </form>
      {items && (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((w) => {
            const createdAt = typeof w.createdAt === "number" ? w.createdAt : Number.NaN;
            const createdAtIso = safeFormatTimestamp(createdAt);
            const hasValidCreatedAt = createdAtIso !== "—";

            return (
            <li key={w.id} className="flex items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-medium break-all">
                  {(() => {
                    const validated = safeHref(w.url);
                    if (validated.ok) {
                      return (
                        <a href={validated.href} target="_blank" rel="noopener noreferrer">
                          {w.url}
                        </a>
                      );
                    }
                    return w.url;
                  })()}

                </p>
                <p className="text-xs text-zinc-500">{w.events.join(", ")}</p>
                {hasValidCreatedAt && (
                  <p className="text-xs text-zinc-500">
                    Registered <TimeAgo ts={createdAt} title={createdAtIso} />
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPendingRemove(w)}
                className="rounded border border-zinc-300 px-3 py-1 text-xs hover:border-rose-500 hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700"
              >
                Remove
              </button>
            </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
