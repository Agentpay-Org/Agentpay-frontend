# Onboarding page (`/onboarding`)

Read-only checklist of account setup steps.

## Files

| File | Role |
| --- | --- |
| `src/app/onboarding/page.tsx` | Client component. Fetches `GET /api/v1/onboarding` via `useApi` and renders the loading/error/empty/list states. |
| `src/app/onboarding/layout.tsx` | Sets the route's document title (`pageTitles.onboarding`). |

## Data shape

```ts
type OnboardingStep = {
  id: string;
  title: string;
  complete: boolean;
};

type OnboardingResponse = { steps?: OnboardingStep[] };
```

## Fetching

Uses `useApi<OnboardingResponse>("/api/v1/onboarding")` — see
[docs/use-api.md](./use-api.md) for the full hook contract
(status/data/error/refetch, request cancellation on unmount and path
change, `online` event auto-retry).

## States

- **Loading** (`state.status === "loading"`): a centered `Spinner` with
  label "Loading onboarding steps".
- **Error** (`state.status === "error"`): `ErrorMessage` with
  `title="Failed to load onboarding steps"`, the hook's `error` message as
  `detail`, and `onRetry={state.retry}` — clicking "Try again" re-runs the
  fetch.
- **Empty** (`state.status === "ok"` and `steps.length === 0`):
  `EmptyState` explaining the checklist isn't available yet.
- **Populated**: a `<ul>` of `OnboardingStepRow` items (title, plus "Done"
  or "Not started" derived from `complete`).

## Row memoization

Each row is `OnboardingStepRow`, a `memo`-wrapped component (same pattern
as `TransactionRow` on the transactions page — see
[docs/transactions-page.md](./transactions-page.md) — and `ErrorMessage`
in [docs/components.md](./components.md)). Re-rendering the list does not
force every row to re-render; only rows whose `step` prop actually changed
do.

## Accessibility

A visually-hidden (`sr-only`) `role="status" aria-live="polite"` element
sits above the visible content and announces the current state in prose
("Loading onboarding steps.", "No onboarding steps to show.", "Loaded N
onboarding step(s).", or the error message), kept separate from the
visible `Spinner`/`ErrorMessage`/`EmptyState` markup so a screen reader
gets exactly one announcement per state transition.

## See also

- [docs/components.md](./components.md) — `EmptyState`, `ErrorMessage`,
  `Spinner`, `PageShell`
- [docs/use-api.md](./use-api.md) — `useApi` hook contract
- [docs/transactions-page.md](./transactions-page.md) — the same
  view/state/memoization pattern applied to transactions
