"use client";

import { useEffect, useRef, useState } from "react";

/** Duration (ms) the "Copied" label is shown before reverting. */
const COPIED_MS = 1500;

/** Label shown while the copied state is active. */
const COPIED_LABEL = "Copied";

/**
 * Copies `value` to the clipboard on click and shows "Copied" for 1500 ms.
 * Silently no-ops when `navigator.clipboard` is unavailable (e.g. non-HTTPS)
 * or when the clipboard write rejects (e.g. permissions policy).
 * The button carries `aria-live="polite"` so the state change is announced
 * to assistive-technology users.
 *
 * The revert timer is stored in a ref so that rapid clicks reset the
 * countdown rather than stacking independent timers, and it is cleared on
 * unmount to prevent stale setState calls.
 *
 * @param value - The string written to `navigator.clipboard.writeText`.
 * @param label - Visible button label before copying (defaults to `"Copy"`).
 */
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      /* ignore — clipboard may be unavailable in non-https contexts */
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-live="polite"
      className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:border-zinc-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700"
    >
      {copied ? COPIED_LABEL : label}
    </button>
  );
}
