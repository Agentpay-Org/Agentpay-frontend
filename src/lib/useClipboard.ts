import { useState, useEffect, useCallback, useRef } from "react";

export interface UseClipboardOptions {
  timeout?: number;
}

/**
 * Copies the given text string to the system clipboard.
 * Uses `navigator.clipboard.writeText` when available (secure contexts: HTTPS / localhost).
 * Includes a fallback mechanism using an auxiliary <textarea> element and `document.execCommand('copy')`
 * for non-secure contexts (e.g. HTTP, older browsers) or when Clipboard API writeText rejects.
 *
 * @param text - The text string to copy.
 * @returns Promise<{ success: boolean; error?: Error }> result of the copy action.
 */
export async function copyToClipboard(
  text: string
): Promise<{ success: boolean; error?: Error }> {
  let lastError: Error | undefined;

  // 1. Primary path: Clipboard API (secure contexts)
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Failed to copy");
    }
  }

  // 2. Fallback path: Auxiliary <textarea> element + document.execCommand('copy')
  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      // Position offscreen to prevent visual disruption and scroll shifts
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      textarea.style.opacity = "0";
      textarea.setAttribute("readonly", "");

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (successful) {
        return { success: true };
      }
    } catch (fallbackErr) {
      if (!lastError) {
        lastError =
          fallbackErr instanceof Error
            ? fallbackErr
            : new Error("Failed to copy");
      }
    }
  }

  return { success: false, error: lastError ?? new Error("Failed to copy") };
}

export function useClipboard(options?: UseClipboardOptions) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeout = options?.timeout ?? 2000;

  const cleanupTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const copy = useCallback(
    async (text: string) => {
      cleanupTimer();
      const result = await copyToClipboard(text);
      if (result.success) {
        setCopied(true);
        setError(null);
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, timeout);
        return true;
      } else {
        setCopied(false);
        setError(result.error ?? new Error("Failed to copy"));
        return false;
      }
    },
    [timeout, cleanupTimer]
  );

  useEffect(() => {
    return cleanupTimer;
  }, [cleanupTimer]);

  return { copy, copied, error };
}

