# Transactions page (`/transactions`)

Read-only list of agent payment transactions.

## Files

| File | Role |
| --- | --- |
| `src/app/transactions/page.tsx` | Client component. Fetches `GET /api/v1/transactions` via `useApi` and renders the loading/error/empty/list states. |
| `src/app/transactions/layout.tsx` | Sets the route's document title (`pageTitles.transactions`). |

## Data shape

```ts
type Transaction = {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
};

type TransactionsResponse = { transactions?: Transaction[] };
```

## Fetching

Uses `useApi<TransactionsResponse>("/api/v1/transactions")` — see
[docs/use-api.md](./use-api.md) for the full hook contract
(status/data/error/refetch, request cancellation on unmount and path
change, `online` event auto-retry).

## States

- **Loading** (`state.status === "loading"`): a centered `Spinner` with
  label "Loading transactions".
- **Error** (`state.status === "error"`): `ErrorMessage` with
  `title="Failed to load transactions"`, the hook's `error` message as
  `detail`, and `onRetry={state.retry}` — clicking "Try again" re-runs the
  fetch.
- **Empty** (`state.status === "ok"` and `transactions.length === 0`):
  `EmptyState` with a short explanation that transactions appear once
  agents start making payments.
- **Populated**: a `<ul>` of `TransactionRow` items (id, status, amount).

## Row memoization

Each row is `TransactionRow`, a `memo`-wrapped component (see
[docs/components.md](./components.md) for the same pattern used by
`ErrorMessage`). Re-rendering the list — e.g. a future addition like a
filter control changing unrelated state — does not force every row to
re-render; only rows whose `transaction` prop actually changed do.

## Accessibility

A visually-hidden (`sr-only`) `role="status" aria-live="polite"` element
sits above the visible content and announces the current state in prose
("Loading transactions.", "No transactions to show.", "Loaded N
transaction(s).", or the error message). It is kept separate from the
visible `Spinner`/`ErrorMessage`/`EmptyState` markup — each of those has
its own presentation-appropriate role — so a screen reader gets exactly
one announcement per state transition instead of duplicate or
conflicting ones.

## See also

- [docs/components.md](./components.md) — `EmptyState`, `ErrorMessage`,
  `Spinner`, `PageShell`
- [docs/use-api.md](./use-api.md) — `useApi` hook contract
