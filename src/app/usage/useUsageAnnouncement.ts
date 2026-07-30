"use client";

import { useState } from "react";

import { useDebounce } from "@/lib/useDebounce";

export const USAGE_ANNOUNCEMENT_DEBOUNCE_MS = 300;

/**
 * A stable, primitive announcement key.
 *
 * Keys must be primitives: `useDebounce` compares by identity, so an object
 * key would be a fresh reference on every render and the debounce timer would
 * reset forever without ever settling.
 */
export type UsageAnnouncementKey = "idle" | "empty" | `total:${number}`;

/** The shape of the query result this hook reads — a subset of the page's. */
export type UsageQueryStateLike =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; result: { total: number } | null }
  | { kind: "error"; message: string; requestId?: string };

/**
 * Map the current usage query state into a stable announcement key.
 *
 * - `idle` covers the untouched form, in-flight queries, and failures. Errors
 *   are surfaced by `ErrorMessage`'s `role="alert"`, which assistive tech
 *   already announces, so the live region stays silent to avoid double-speaking.
 * - `empty` is the zero-results case: the query succeeded with no usable
 *   payload.
 * - `total:N` carries the request total so a changed total is a changed key.
 */
export function usageAnnouncementKey(
  queryState: UsageQueryStateLike
): UsageAnnouncementKey {
  if (queryState.kind !== "ok") return "idle";
  if (queryState.result === null) return "empty";
  return `total:${queryState.result.total}`;
}

export function buildUsageAnnouncement(key: UsageAnnouncementKey): string {
  if (key === "idle") return "";
  if (key === "empty") return "No usage data found";
  const total = Number(key.slice("total:".length));
  return `Usage total: ${total} ${total === 1 ? "request" : "requests"}`;
}

/**
 * Debounced polite live-region text for meaningful usage query changes.
 *
 * - Does not announce on mount / first settled value (baseline only).
 * - Collapses rapid successive updates into a single announcement.
 * - Leaves the underlying usage business logic untouched.
 */
export function useUsageAnnouncement(queryState: UsageQueryStateLike): string {
  const key = usageAnnouncementKey(queryState);
  const debouncedKey = useDebounce(key, USAGE_ANNOUNCEMENT_DEBOUNCE_MS);
  const [previousKey, setPreviousKey] = useState(debouncedKey);
  // If the first committed key is already meaningful (empty/total), treat it as
  // the silent baseline so we do not announce on mount.
  const [hasBaseline, setHasBaseline] = useState(debouncedKey !== "idle");
  const [announcement, setAnnouncement] = useState("");

  // Mirror useAdminStatusAnnouncement: update the announcement in the same
  // commit as the debounced key change so the live region stays empty until a
  // real update lands.
  if (debouncedKey !== previousKey) {
    setPreviousKey(debouncedKey);
    if (!hasBaseline) {
      if (debouncedKey !== "idle") {
        setHasBaseline(true);
      }
    } else {
      setAnnouncement(buildUsageAnnouncement(debouncedKey));
    }
  }

  return announcement;
}
