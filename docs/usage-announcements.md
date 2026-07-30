# Usage live-region announcements

The usage view (`src/app/usage/page.tsx`) renders a visually-hidden
`aria-live="polite"` region (`data-testid="usage-announcer"`) so screen-reader
users hear when a usage query actually returns something new. The text is
produced by
[`useUsageAnnouncement`](../src/app/usage/useUsageAnnouncement.ts).

## State to announcement

The hook reads the page's existing `queryResult` state and maps it to a stable
announcement key.

| Query state | Announcement key | Announced text |
| --- | --- | --- |
| `{ kind: "idle" }` | `idle` | *(silent)* |
| `{ kind: "loading" }` | `idle` | *(silent)* |
| `{ kind: "error" }` | `idle` | *(silent)* |
| `{ kind: "ok", result: null }` | `empty` | `No usage data found` |
| `{ kind: "ok", result: { total: 1 } }` | `total:1` | `Usage total: 1 request` |
| `{ kind: "ok", result: { total: N } }` | `total:N` | `Usage total: N requests` |

## Behaviour notes for reviewers

- **Silent on mount.** The region is mounted empty so assistive tech registers
  it before the first change, and the first settled state is kept as a silent
  baseline. The first query result is therefore not announced — it is already
  rendered visibly in a `role="status"` paragraph, which announces itself.
- **Debounced (300ms).** Rapid successive updates collapse into a single
  announcement instead of queueing one per update.
- **Errors are not repeated.** A failed query renders `ErrorMessage` with
  `role="alert"`, which assistive tech announces on its own, so the polite
  region stays silent to avoid double-speaking.
- **A re-query with the same total is still announced.** The query passes
  through `loading` (an `idle` key) on its way back to `ok`, so returning the
  same total is a genuine key change and is spoken again. This matters: a user
  who re-runs a query needs confirmation that something happened.
- **`total: 0` is a result, not an empty state.** A recorded total of zero
  announces `Usage total: 0 requests`; only a missing payload announces
  `No usage data found`.
- **Announcement keys are primitives.** `useDebounce` compares by identity, so
  the state is flattened to a string (`total:12`) rather than an object; an
  object would be a new reference each render and the timer would never settle.
- **Not `role="status"`.** The query result and the date-range hint already own
  that role on this page; a third would make the page's status ambiguous.

## No change to underlying logic

The hook derives text only. It reads the existing `queryResult` state and does
not change how usage is recorded or queried. No new dependencies.
