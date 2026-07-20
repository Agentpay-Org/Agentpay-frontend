import { useState, useEffect, useCallback, useRef } from "react";

export interface UseClipboardOptions {
  timeout?: number;
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
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(null);
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, timeout);
        return true;
      } catch (err) {
        setCopied(false);
        setError(err instanceof Error ? err : new Error("Failed to copy"));
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
