"use client";

import { useState } from "react";

import { useDebounce } from "@/lib/useDebounce";
import type { PollingStatus } from "@/lib/usePolling";

export const ADMIN_ANNOUNCEMENT_DEBOUNCE_MS = 300;

export type AdminAnnouncementKey = "idle" | "live" | "paused" | "empty";

/**
 * Map the current admin fetch/status into a stable announcement key.
 * `idle` covers loading and error (those states use their own UI feedback).
 * `empty` is the zero-results case: fetch succeeded with no usable payload.
 */
export function adminAnnouncementKey(
  paused: boolean | null,
  fetchStatus: PollingStatus
): AdminAnnouncementKey {
  if (paused !== null) return paused ? "paused" : "live";
  if (fetchStatus === "ok") return "empty";
  return "idle";
}

export function buildAdminAnnouncement(key: AdminAnnouncementKey): string {
  switch (key) {
    case "live":
      return "Admin status: Live";
    case "paused":
      return "Admin status: Paused";
    case "empty":
      return "No admin data available";
    case "idle":
      return "";
  }
}

/**
 * Debounced polite live-region text for meaningful admin status changes.
 *
 * - Does not announce on mount / first settled value (baseline only).
 * - Collapses rapid successive updates into a single announcement.
 * - Leaves underlying admin business logic untouched.
 */
export function useAdminStatusAnnouncement(
  paused: boolean | null,
  fetchStatus: PollingStatus
): string {
  const key = adminAnnouncementKey(paused, fetchStatus);
  const debouncedKey = useDebounce(key, ADMIN_ANNOUNCEMENT_DEBOUNCE_MS);
  const [previousKey, setPreviousKey] = useState(debouncedKey);
  // If the first committed key is already meaningful (live/paused/empty),
  // treat it as the silent baseline so we do not announce on mount.
  const [hasBaseline, setHasBaseline] = useState(debouncedKey !== "idle");
  const [announcement, setAnnouncement] = useState("");

  // Mirror Pagination: update announcement in the same commit as the
  // debounced key change so the live region stays empty until a real update.
  if (debouncedKey !== previousKey) {
    setPreviousKey(debouncedKey);
    if (!hasBaseline) {
      if (debouncedKey !== "idle") {
        setHasBaseline(true);
      }
    } else {
      setAnnouncement(buildAdminAnnouncement(debouncedKey));
    }
  }

  return announcement;
}
