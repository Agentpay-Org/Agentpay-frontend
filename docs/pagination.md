# Pagination component contract

This document is the concise reference for
[`src/components/Pagination.tsx`](../src/components/Pagination.tsx). Use it when
wiring list pages so callers agree on props, render states, and accessibility
behaviour.

Import from:

```ts
import { Pagination } from "@/components/Pagination";
```

`Pagination` is a client component (`"use client"`) and is exported as a
`React.memo` wrapper so unrelated parent re-renders do not force it to update
when its props are unchanged.

## Props

```ts
type Props = {
  page: number;
  pageCount: number;
  onChange: (next: number) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};
```

| Prop | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `page` | `number` | yes | — | Current **1-based** page. |
| `pageCount` | `number` | yes | — | Total number of pages. |
| `onChange` | `(next: number) => void` | yes | — | Called with the next page. Previous/Next clamp to `[1, pageCount]`. |
| `loading` | `boolean` | no | `false` | Replaces the nav with a `Spinner` labelled `"Loading page"`. |
| `error` | `string \| null` | no | `null` | Replaces the nav with an `ErrorMessage`. Takes precedence over `loading`. |
| `onRetry` | `() => void` | no | — | Passed to the error state's `"Try again"` button. The button renders only when both `error` and `onRetry` are set. |

## Render states

Exactly one of the following is rendered. Precedence is top to bottom:

| State | Condition | What renders |
| --- | --- | --- |
| **Error** | `error` is truthy | `ErrorMessage` with `title="Failed to load page"`, `detail={error}`, and optional `onRetry`. |
| **Loading** | `loading === true` (and no error) | Centered `Spinner` with `label="Loading page"`. |
| **Hidden** | `pageCount <= 1` (and neither error nor loading) | `null` — no DOM. |
| **Nav** | otherwise | `<nav aria-label="Pagination">` with Previous, `"Page {page} of {pageCount}"`, a polite live region, and Next. |

Important details:

- `error` wins over `loading` when both are set.
- Loading and error still render when `pageCount <= 1`. Only the idle nav is
  suppressed for a single page.
- Previous is `disabled` when `page <= 1`; Next is `disabled` when
  `page >= pageCount`.
- Clicking Previous calls `onChange(Math.max(1, page - 1))`; Next calls
  `onChange(Math.min(pageCount, page + 1))`. The parent owns the controlled
  `page` value.

Some list pages (for example `src/app/agents/page.tsx`) already gate
pagination with `{!loading && !error && (...)}` and only pass
`page` / `pageCount` / `onChange`. That remains valid. Prefer the component's
own `loading` / `error` / `onRetry` props when the pagination strip itself
should show those states instead of disappearing.

## Accessibility

- The nav landmark is labelled `aria-label="Pagination"`.
- Page changes are announced through a polite, `aria-atomic` live region
  (`"Page N of pageCount"`). Announcements are debounced **300ms** so rapid
  clicks collapse into one announcement for the settled page.
- The live region stays empty on first mount (no announcement of the initial
  page).
- Previous, Next, and the error retry control are ordinary buttons and are
  keyboard operable (Tab + Enter/Space).

## Minimal usage

Controlled page state with the idle nav:

```tsx
"use client";

import { useState } from "react";
import { Pagination } from "@/components/Pagination";

export function AgentsListFooter({ pageCount }: { pageCount: number }) {
  const [page, setPage] = useState(1);

  return (
    <Pagination page={page} pageCount={pageCount} onChange={setPage} />
  );
}
```

Loading and error states in place of the nav:

```tsx
<Pagination
  page={page}
  pageCount={pageCount}
  onChange={setPage}
  loading={isFetching}
/>

<Pagination
  page={page}
  pageCount={pageCount}
  onChange={setPage}
  error={loadError}
  onRetry={refetch}
/>
```

## Related

- Catalog entry: [Component Catalog — Pagination](./components.md#pagination)
- Tests: `src/components/__tests__/Pagination.test.tsx`
- Coverage notes: [Testing](./testing.md)
