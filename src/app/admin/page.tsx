"use client";

import { useCallback, useMemo, useState } from "react";

import { apiPost } from "@/lib/apiClient";
import { AlertError } from "@/components/AlertError";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/PageShell";
import { StatusDot } from "@/components/StatusDot";
import { useToast } from "@/components/ToastProvider";
import { usePolling } from "@/lib/usePolling";
import { useAdminStatusAnnouncement } from "./useAdminStatusAnnouncement";

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
    status: fetchStatus,
    refresh: refreshStatus,
  } = usePolling<AdminStatus>(
    "/api/v1/admin/status",
    ADMIN_STATUS_POLL_INTERVAL_MS
  );

  const paused = status?.paused ?? null;
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Only pass pollingError to AlertError when data is already visible (i.e.
  // the EmptyState error panel is NOT showing). When there's no data yet,
  // the error is already rendered inside the EmptyState and must not also
  // appear in AlertError — that would produce duplicate "Network error" text.
  const error = actionError ?? (paused !== null ? pollingError : null);

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

  const onRetry = useCallback(() => {
  void refreshStatus();
}, [refreshStatus]);

const onCancelConfirm = useCallback(() => {
  setConfirmOpen(false);
}, []);

const onConfirmDialog = useCallback(() => {
  void onConfirm();
}, [onConfirm]);

  const statusVariant = paused ? "down" : "ok";
  const toggleButtonLabel = paused ? "Unpause" : "Pause";
  const statusAnnouncement = useAdminStatusAnnouncement(paused, fetchStatus);

  return (
    <PageShell maxWidth="xl">
      <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>

      {/*
       * Debounced status announcements for assistive tech. Empty on mount;
       * only subsequent meaningful status/empty changes are announced.
       */}
      <span
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="admin-status-announcer"
      >
        {statusAnnouncement}
      </span>

      {/*
       * aria-live="polite" announces loading / empty / error panel transitions
       * without interrupting ongoing speech.
       */}
      <div aria-live="polite" aria-atomic="true">
        {/* Loading state */}
        {fetchStatus === "loading" && paused === null && (
          <p className="text-sm text-zinc-500" role="status">
            Loading status…
          </p>
        )}

        {/* Error state — polling failed and no data is available yet */}
        {fetchStatus === "error" && paused === null && !actionError && (
          <EmptyState
            title="Could not load admin status"
            description={pollingError ?? "An unexpected error occurred."}
            action={
              <button
                type="button"
                onClick={onRetry}
                className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-white dark:text-black"
              >
                Retry
              </button>
            }
          />
        )}

        {/* Empty state — fetch succeeded but returned no usable payload */}
        {fetchStatus === "ok" && paused === null && (
          <EmptyState
            title="No admin data available"
            description="The server returned an empty response. Try refreshing."
            action={
              <button
                type="button"
                onClick={() => void refreshStatus()}
                className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-white dark:text-black"
              >
                Refresh
              </button>
            }
          />
        )}
      </div>

      {/* Live status panel — only when data is available */}
      {paused !== null && (
        <section
          aria-label="Admin status"
          className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
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
          onConfirm={onConfirmDialog}
          onCancel={onCancelConfirm}
        />
      )}

      <AlertError message={error} />
    </PageShell>
  );
}