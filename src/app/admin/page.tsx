"use client";

import { useCallback, useMemo, useState } from "react";

import { apiPost } from "@/lib/apiClient";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageShell } from "@/components/PageShell";
import { StatusDot } from "@/components/StatusDot";
import { useToast } from "@/components/ToastProvider";
import { usePolling } from "@/lib/usePolling";

type AdminStatus = { paused: boolean };

type ToggleKind = "pause" | "unpause";

type ToggleState = {
  paused: boolean;
  kind: ToggleKind;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel: string;
};

const ADMIN_STATUS_POLL_INTERVAL_MS = 5000;

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
  const {
    data: status,
    error: pollingError,
    refresh: refreshStatus,
  } = usePolling<AdminStatus>(
    "/api/v1/admin/status",
    ADMIN_STATUS_POLL_INTERVAL_MS
  );

  const paused = status?.paused ?? null;
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const error = actionError ?? pollingError;

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
    await refreshStatus();
  }, [refreshStatus]);

  const onConfirm = useCallback(async () => {
    if (paused === null || !endpoint) return;

    setConfirmOpen(false);
    setActionError(null);
    setPending(true);

    try {
      await apiPost(endpoint, {});
      toast.push("Admin pause toggle applied.", "info");
      await refreshAfterAction();
    } catch (e) {
      const message = (e as Error).message;
      setActionError(message);
      toast.push(message, "error");
    } finally {
      setPending(false);
    }
  }, [endpoint, paused, refreshAfterAction, toast]);

  const onOpenConfirm = useCallback(() => {
    setConfirmOpen(true);
  }, []);

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
            setConfirmOpen(false);
          }}
        />
      )}

      <AlertError message={error} />
    </PageShell>
  );
}

