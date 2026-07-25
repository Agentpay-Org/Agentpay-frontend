"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot(): boolean {
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true;
}

/**
 * Track the browser's online/offline connectivity status.
 *
 * Uses `useSyncExternalStore` so the value is always consistent with the
 * actual DOM state and never causes tearing during concurrent rendering.
 *
 * @example
 * const { isOnline } = useOnlineStatus();
 * return <span>{isOnline ? "Online" : "Offline"}</span>;
 */
export function useOnlineStatus(): { isOnline: boolean } {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { isOnline };
}
