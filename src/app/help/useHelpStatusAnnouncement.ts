"use client";

import { useState } from "react";

import { useDebounce } from "@/lib/useDebounce";

export const HELP_ANNOUNCEMENT_DEBOUNCE_MS = 300;

export type HelpFetchStatus = "loading" | "error" | "ok";

export type HelpAnnouncementKey = "idle" | "success" | "empty" | "error";

/**
 * Map the current help fetch status (plus topic count once loaded) into a
 * stable announcement key. `idle` covers the loading state, which has its
 * own visible spinner and doesn't need a separate announcement.
 */
export function helpAnnouncementKey(
  status: HelpFetchStatus,
  topicCount: number
): HelpAnnouncementKey {
  if (status === "error") return "error";
  if (status === "ok") return topicCount > 0 ? "success" : "empty";
  return "idle";
}

export function buildHelpAnnouncement(key: HelpAnnouncementKey): string {
  switch (key) {
    case "success":
      return "Help topics loaded.";
    case "empty":
      return "No help topics found.";
    case "error":
      return "Failed to load help topics.";
    case "idle":
      return "";
  }
}

/**
 * Debounced polite live-region text for meaningful help-page status changes.
 *
 * - Does not announce on mount / first settled value (baseline only).
 * - Collapses rapid successive updates (e.g. a fast retry loop) into a
 *   single announcement.
 * - Leaves the existing visible `aria-live` panel and its content untouched.
 */
export function useHelpStatusAnnouncement(
  status: HelpFetchStatus,
  topicCount: number
): string {
  const key = helpAnnouncementKey(status, topicCount);
  const debouncedKey = useDebounce(key, HELP_ANNOUNCEMENT_DEBOUNCE_MS);
  const [previousKey, setPreviousKey] = useState(debouncedKey);
  // If the first committed key is already meaningful (success/empty/error),
  // treat it as the silent baseline so we do not announce on mount.
  const [hasBaseline, setHasBaseline] = useState(debouncedKey !== "idle");
  const [announcement, setAnnouncement] = useState("");

  // Update announcement in the same commit as the debounced key change so
  // the live region stays empty until a real, post-baseline update.
  if (debouncedKey !== previousKey) {
    setPreviousKey(debouncedKey);
    if (!hasBaseline) {
      if (debouncedKey !== "idle") {
        setHasBaseline(true);
      }
    } else {
      setAnnouncement(buildHelpAnnouncement(debouncedKey));
    }
  }

  return announcement;
}
