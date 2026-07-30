"use client";

import { useState } from "react";

import { useDebounce } from "@/lib/useDebounce";

export const API_KEYS_ANNOUNCEMENT_DEBOUNCE_MS = 300;

/**
 * A stable, primitive announcement key.
 *
 * Keys must be primitives: `useDebounce` compares by identity, so an object
 * key would be a fresh reference on every render and the debounce timer would
 * reset forever without ever settling.
 */
export type ApiKeysAnnouncementKey = "idle" | "empty" | `count:${number}`;

type KeyListLike = { length: number } | null | undefined;

/**
 * Map the current api-keys fetch state into a stable announcement key.
 *
 * - `idle` covers loading (no list yet) and load failures. Errors are surfaced
 *   by the existing `role="alert"` message, which assistive tech already
 *   announces, so the live region stays silent to avoid double-speaking.
 * - `empty` is the zero-results case: the list loaded with no keys.
 * - `count:N` carries the key count so a changed count is a changed key.
 */
export function apiKeysAnnouncementKey(
  items: KeyListLike,
  error: string | null
): ApiKeysAnnouncementKey {
  if (error !== null) return "idle";
  if (items === null || items === undefined) return "idle";
  if (items.length === 0) return "empty";
  return `count:${items.length}`;
}

export function buildApiKeysAnnouncement(key: ApiKeysAnnouncementKey): string {
  if (key === "idle") return "";
  if (key === "empty") return "No API keys";
  const count = Number(key.slice("count:".length));
  return `${count} API ${count === 1 ? "key" : "keys"}`;
}

/**
 * Debounced polite live-region text for meaningful api-keys list changes.
 *
 * - Does not announce on mount / first settled value (baseline only).
 * - Collapses rapid successive updates into a single announcement.
 * - Leaves the underlying api-keys business logic untouched.
 */
export function useApiKeysAnnouncement(
  items: KeyListLike,
  error: string | null
): string {
  const key = apiKeysAnnouncementKey(items, error);
  const debouncedKey = useDebounce(key, API_KEYS_ANNOUNCEMENT_DEBOUNCE_MS);
  const [previousKey, setPreviousKey] = useState(debouncedKey);
  // If the first committed key is already meaningful (empty/count), treat it
  // as the silent baseline so we do not announce on mount.
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
      setAnnouncement(buildApiKeysAnnouncement(debouncedKey));
    }
  }

  return announcement;
}
