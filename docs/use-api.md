# `useApi` FetchState contract

The `useApi` hook in [`src/lib/useApi.ts`](../src/lib/useApi.ts) is a small client-side data loader for GET requests. It returns a discriminated union named `State<T>` in the source, and the UI branches on `status` instead of using a separate `isLoading` flag.

## Return contract

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

### States

- `loading`: the hook has started a request, or the path has changed and the next fetch is in progress.
- `error`: the fetch failed. The error branch carries the human-readable error message, `errorKind`, `isTimeout`, and a `retry()` callback.
- `ok`: the request completed successfully and the payload is available as `data`.

### Refetch behavior

`useApi` exposes `retry()` only on the `error` branch. Calling `state.retry()` bumps the hook's internal reload token, which causes the effect to re-run with the same `path`.

That means the hook's refetch affordance is a minimal, state-driven retry action:

```tsx
if (state.status === "error") {
  return <button onClick={state.retry}>Retry</button>;
}
```

## Request lifecycle

A few behavioral details are worth keeping explicit because they are easy to miss when reading the source:

- `useApi` is a client-only hook and should be used inside a client component.
- The initial state is `{ status: "loading" }`.
- When `path` changes, the hook dispatches a fresh `loading` state before issuing the new request.
- If a request is superseded by a route change or unmount, the stale response is ignored.
- Passing `null` to `useApi` skips the request entirely and leaves the existing state untouched.

## Minimal usage example

```tsx
"use client";

import { Spinner } from "@/components/Spinner";
import { useApi } from "@/lib/useApi";

type ChangelogPayload = { entries: { version: string; date: string }[] };

export function ChangelogPreview() {
  const state = useApi<ChangelogPayload>("/api/v1/changelog");

  if (state.status === "loading") {
    return <Spinner label="Loading changelog" />;
  }

  if (state.status === "error") {
    return (
      <div>
        <p role="alert">{state.error}</p>
        {state.isTimeout && <button onClick={state.retry}>Retry</button>}
      </div>
    );
  }

  return <p>{state.data.entries.length} entries</p>;
}
```

## Timeout handling

The underlying `apiGet` wrapper can throw `ApiTimeoutError` after the default timeout window. `useApi` translates that into:

- `errorKind: "timeout"`
- `isTimeout: true`
- `error: "Request timed out. Please try again."`

Any other thrown error is surfaced as `errorKind: "generic"`, with `isTimeout: false` and the error message from the thrown value.
