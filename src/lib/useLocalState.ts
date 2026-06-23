"use client";

import { useEffect, useState } from "react";

/**
 * useState backed by window.localStorage. SSR-safe — initial state is
 * the fallback until the hydration effect runs.
 */
export function useLocalState<T>(
  key: string,
  initial: T
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrates client state from localStorage after the SSR fallback.
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      /* ignore */
    }
  }, [key]);

  const write = (next: T) => {
    setValue(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  return [value, write];
}
