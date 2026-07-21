"use client";

import { useClipboard } from "../lib/useClipboard";

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
  const { copy, copied } = useClipboard({ timeout: 1500 });

  const onClick = async () => {
    await copy(value);
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
