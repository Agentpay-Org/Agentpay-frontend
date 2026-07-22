# Shared Hooks Reference

This catalog documents every reusable hook exported from `src/lib`. Keep this
page in sync with the hook signatures in source whenever a hook is added or its
contract changes.

## Inventory

| Hook | Source | Status |
| --- | --- | --- |
| `useApi` | `src/lib/useApi.ts` | Exported |
| `useClipboard` | `src/lib/useClipboard.ts` | Exported |
| `useDebounce` | `src/lib/useDebounce.ts` | Exported |
| `useLocalState` | `src/lib/useLocalState.ts` | Exported |
| `usePolling` | `src/lib/usePolling.ts` | Exported |

## `useApi`

```ts
function useApi<T>(path: string | null): State<T>;
```

Import from:

```ts
import { useApi } from "@/lib/useApi";
```

Return shape:

```ts
type ApiErrorKind = "timeout" | "generic";

type State<T> =
  | { status: "loading" }
  | {
      status: "error";
      error: string;
      errorKind: ApiErrorKind;
      isTimeout: boolean;
      retry: () => void;
    }
  | { status: "ok"; data: T };
```

Parameters:

- `path`: backend API path passed to `apiGet<T>`. Pass `null` to skip starting
  a request.

Behaviour and gotchas:

- This is a client hook and must be used from a client component.
- The first state is `{ status: "loading" }`.
- When `path` changes, the hook dispatches a fresh loading state and fetches the
  new path.
- If the component unmounts or `path` changes before a response settles, the
  stale response is ignored through an internal cancellation flag.
- `path: null` skips fetching and leaves the existing state unchanged.
- Detects `ApiTimeoutError` and sets `errorKind: "timeout"`, `isTimeout: true`, and `"Request timed out. Please try again."`. Generic errors set `errorKind: "generic"`, `isTimeout: false`, and `Error.message` (or `"failed to load"`).
- Provides a `retry()` callback affordance on the error state to trigger a refetch of the path.

Minimal real usage, based on `src/app/changelog/page.tsx`:

```tsx
"use client";

import { Spinner } from "@/components/Spinner";
import { useApi } from "@/lib/useApi";

type Entry = { version: string; date: string; notes: string[] };

export function ChangelogPreview() {
  const state = useApi<{ entries: Entry[] }>("/api/v1/changelog");

  if (state.status === "loading") {
    return <Spinner label="Loading changelog" />;
  }

  if (state.status === "error") {
    return <p role="alert">{state.error}</p>;
  }

  return <p>{state.data.entries.length} entries</p>;
}
```

Use this hook for simple GET-backed client views that can be represented as
loading, error, or successful data. For write actions or request bodies, use the
helpers in `src/lib/apiClient.ts` directly.

## `usePolling`

```ts
function usePolling<T>(
  path: string | null,
  intervalMs: number,
  options?: { initialPaused?: boolean },
): PollingState<T>;
```

Import from:

```ts
import { usePolling } from "@/lib/usePolling";
```

Return shape:

```ts
type PollingState<T> = {
  status: "loading" | "error" | "ok";
  data: T | null;
  error: string | null;
  lastUpdated: Date | null;
  paused: boolean;
  pause: () => void;
  resume: () => void;
  refresh: () => Promise<void>;
};
```

Parameters:

- `path`: backend API path passed to `apiGet<T>`. Pass `null` to skip fetching.
- `intervalMs`: polling cadence in milliseconds.
- `initialPaused`: starts without the initial fetch. Calling `resume()` fetches
  immediately and starts the interval.

Behaviour and gotchas:

- This is a client hook and must be used from a client component.
- The hook fetches immediately unless `initialPaused` is true.
- Polling uses the shared `apiGet` client, so base URL resolution, JSON parsing,
  and API error handling stay consistent with other client views.
- `pause()` clears the interval and prevents further automatic fetches.
- `resume()` restarts polling and fetches immediately.
- `refresh()` performs an on-demand fetch using the same path and resolves after
  that request settles, so action handlers can await a follow-up status read.
- Responses from superseded requests, paused/path-changed effects, and unmounted
  components are ignored through an internal request id guard.
- Successful responses update `lastUpdated`. Errors preserve the latest data, set
  `status: "error"`, and expose a display-ready `error` string.

Minimal real usage, based on `src/app/stats/page.tsx`:

```tsx
"use client";

import { usePolling } from "@/lib/usePolling";

type Stats = { totalRequests: number };

export function StatsPreview() {
  const state = usePolling<Stats>("/api/v1/stats", 5000);

  if (state.error) {
    return <p role="alert">{state.error}</p>;
  }

  return <p>{state.data?.totalRequests ?? 0} requests</p>;
}
```

Use this hook for GET-backed views that need a repeated refresh cadence without
copying `setInterval` cleanup, stale-response guards, and pause/resume handling
into each page. Current adopters include the stats page and the admin status
panel; the admin toggle awaits `refresh()` after pause/unpause actions so the
visible status follows the backend result.

## `useDebounce`

```ts
function useDebounce<T>(value: T, delayMs?: number): T;
```

Import from:

```ts
import { useDebounce } from "@/lib/useDebounce";
```

Parameters:

- `value`: the current value to delay.
- `delayMs`: debounce window in milliseconds. Defaults to `300`.

Return shape:

- Returns the same type `T` as the input value.
- The initial render returns the initial `value` immediately.
- Later updates publish only after the debounce timer expires.

Behaviour and gotchas:

- This is a client hook and must be used from a client component.
- The hook clears its pending timer whenever `value` or `delayMs` changes.
- Because the first value is immediate, callers that should not fetch on an
  empty value should still guard empty strings or null-like values.
- A changing `delayMs` resets the pending timer.

Minimal real usage, based on `src/app/search/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import { useDebounce } from "@/lib/useDebounce";

type Service = { serviceId: string; priceStroops: number };

export function ServiceSearchProbe() {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);

  useEffect(() => {
    if (!debounced) return;
    void apiGet<{ services: Service[] }>(
      `/api/v1/services?q=${encodeURIComponent(debounced)}&limit=50`,
    );
  }, [debounced]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

Use this hook for search/filter text, route query inputs, or other UI values
where downstream work should wait until changes settle.

## `useLocalState`

```ts
function useLocalState<T>(key: string, initial: T): [T, (next: T) => void];
```

Import from:

```ts
import { useLocalState } from "@/lib/useLocalState";
```

Parameters:

- `key`: localStorage key.
- `initial`: first-render value and fallback when storage is unavailable,
  missing, or unreadable.

Return shape:

- Tuple index `0`: current value.
- Tuple index `1`: setter accepting the next value.

Behaviour and gotchas:

- This is a client hook and must be used from a client component.
- The initial render always uses `initial`.
- After mount, the hook attempts to read `window.localStorage.getItem(key)` and
  `JSON.parse` the stored value.
- Missing keys, invalid JSON, and storage read errors leave the fallback value
  in place.
- Calling the setter updates React state first, then best-effort writes
  `JSON.stringify(next)` to localStorage.
- Storage quota or write errors are ignored after React state is updated.
- Because hydration happens after mount, UI may briefly show `initial` before a
  persisted value replaces it.

Minimal real usage, based on `src/lib/__tests__/useLocalState.test.tsx`:

```tsx
"use client";

import { useLocalState } from "@/lib/useLocalState";

export function PersistedPreference() {
  const [mode, setMode] = useLocalState("agentpay.docs.mode", "summary");

  return (
    <button type="button" onClick={() => setMode("detailed")}>
      Current mode: {mode}
    </button>
  );
}
```

Use this hook for non-sensitive UI preferences that should persist in the
browser, such as display modes, dismissed hints, or local filters. Do not store
secrets, API keys, seed phrases, passwords, or private account material in
localStorage.

## `useClipboard`

```ts
function useClipboard(options?: { timeout?: number }): {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
  error: Error | null;
};
```

Import from:

```ts
import { useClipboard } from "@/lib/useClipboard";
```

Parameters:

- `options.timeout`: milliseconds to keep the `copied` state as `true`. Defaults to `2000`.

Return shape:

- `copy`: asynchronous function to write text to the clipboard. Returns `true` on success and `false` on failure.
- `copied`: boolean indicating if the most recent copy succeeded and is still within the timeout window.
- `error`: the `Error` caught if `navigator.clipboard.writeText` fails or is rejected.

Behaviour and gotchas:

- This is a client hook and must be used from a client component.
- The hook manages an internal timer for resetting the `copied` state, which is automatically cleared if a new copy action happens before the timeout expires, or if the component unmounts.
- `navigator.clipboard` may be unavailable in non-HTTPS contexts or without appropriate permissions. Failures update the `error` state.

Minimal real usage, based on `src/components/CopyButton.tsx`:

```tsx
"use client";

import { useClipboard } from "@/lib/useClipboard";

export function CopyButton({ value }: { value: string }) {
  const { copy, copied } = useClipboard({ timeout: 1500 });

  return (
    <button type="button" onClick={() => copy(value)}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
```

Use this hook to extract clipboard interactions and timeout-based state resets from visual components.

## Coverage Note

This reference covers every hook exported from `src/lib` at the time of writing:
`useApi`, `useClipboard`, `usePolling`, `useDebounce`, and `useLocalState`.
