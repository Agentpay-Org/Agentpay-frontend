"use client";

import { useClipboard } from "../lib/useClipboard";

/**
 * Copies `value` to the clipboard on click and shows "Copied" for 1500 ms.
 * Silently no-ops when `navigator.clipboard` is unavailable (e.g. non-HTTPS).
 * The button carries `aria-live="polite"` so the state change is announced.
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
      {copied ? "Copied" : label}
    </button>
  );
}
