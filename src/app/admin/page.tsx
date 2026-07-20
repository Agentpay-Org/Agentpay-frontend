"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiGet, apiPost } from "@/lib/apiClient";
import { AlertError } from "@/components/AlertError";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { StatusDot } from "@/components/StatusDot";
import { useToast } from "@/components/ToastProvider";

type AdminStatus = { paused: boolean };

type ToggleKind = "pause" | "unpause";

type ToggleState = {
  paused: boolean;
  kind: ToggleKind;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel: string;
};

const getToggleState = (paused: boolean): ToggleState => {
  if (paused) {
    return {
      paused,
      kind: "unpause",
      confirmTitle: "Resume writes?",
      confirmDescription:
        "This will re-enable all backend writes across the protocol.",
      confirmLabel: "Resume",
    };
  }

  return {
    paused,
    kind: "pause",
    confirmTitle: "Pause all writes?",
    confirmDescription:
      "This will immediately disable all backend writes across the protocol.",
    confirmLabel: "Pause",
  };
};

export default function AdminPage() {
  const toast = useToast();

  const [paused, setPaused] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  /**
   * Latest-wins stale-status guard.
   *
   * Each call to `load()` increments a monotonically increasing sequence number.
   * Only the response for the latest in-flight call is allowed to update `paused`/`error`.
   * This prevents out-of-order fetch responses from clobbering a newer state.
   */
  const loadSeqRef = useRef(0);

  const load = useCallback(async () => {
    const callSeq = ++loadSeqRef.current;
    setError(null);

    try {
      const b = await apiGet<AdminStatus>("/api/v1/admin/status");
      if (callSeq !== loadSeqRef.current) return;
      setPaused(b.paused);
    } catch (e) {
      if (callSeq !== loadSeqRef.current) return;
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleState = useMemo(() => {
    if (paused === null) return null;


    return getToggleState(paused);
  }, [paused]);

  const endpoint = useMemo(() => {
    if (!toggleState) return null;
    return toggleState.kind === "pause"
      ? "/api/v1/admin/pause"
      : "/api/v1/admin/unpause";
  }, [toggleState]);

  const refreshAfterAction = useCallback(async () => {
    await load();
  }, [load]);

  const onConfirm = useCallback(async () => {
    if (paused === null || !endpoint) return;

    setConfirmOpen(false);
    setError(null);
    setPending(true);

    try {
      await apiPost(endpoint, {});
      toast.push("Admin pause toggle applied.", "info");
      await refreshAfterAction();
    } catch (e) {
      const message = (e as Error).message;
      setError(message);
      toast.push(message, "error");
    } finally {
      setPending(false);
    }
  }, [endpoint, paused, refreshAfterAction, toast]);

  const onOpenConfirm = useCallback(() => {
    if (paused === null) return;
    if (pending) return;
    setConfirmOpen(true);
  }, [paused, pending]);

  const statusVariant = paused ? "down" : "ok";

  const toggleButtonLabel = paused ? "Unpause" : "Pause";

  return (
    <PageShell maxWidth="xl">
      <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>

      {paused === null && !error && <p>Loading status…</p>}

      {paused !== null && (
        <section className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <StatusDot variant={statusVariant} />
            <p>
              Status: <strong>{paused ? "Paused" : "Live"}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenConfirm}
            disabled={pending}
            aria-disabled={pending}
            className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {pending ? "Working…" : toggleButtonLabel}
          </button>
        </section>
      )}

      {confirmOpen && toggleState && endpoint && (
        <ConfirmDialog
          open={confirmOpen}
          title={toggleState.confirmTitle}
          description={toggleState.confirmDescription}
          confirmLabel={toggleState.confirmLabel}
          cancelLabel="Cancel"
          onConfirm={() => {
            void onConfirm();
          }}
          onCancel={() => {
            if (pending) return;
            setConfirmOpen(false);
          }}
        />
      )}

      <AlertError message={error} />
    </PageShell>
  );
}

