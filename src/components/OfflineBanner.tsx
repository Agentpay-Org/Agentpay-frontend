"use client";

import { useCallback, useState } from "react";
import { useOnlineStatus } from "@/lib/useOnlineStatus";

/**
 * A dismissible banner that appears when the browser goes offline.
 *
 * Accessibility:
 * - The banner uses `role="alert"` so assistive technology announces it
 *   immediately when the connectivity state changes.
 * - The dismiss button carries an `aria-label` for screen-reader users.
 *
 * Satisfies WCAG 4.1.3 Status Messages.
 */
export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => setDismissed(true), []);

  if (isOnline || dismissed) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-amber-50 px-4 py-2 text-sm text-amber-900 shadow-sm dark:bg-amber-950 dark:text-amber-200"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>You are offline. Some features may be unavailable.</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss offline notification"
        className="-ml-1 ml-auto rounded p-0.5 text-lg leading-none opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}
