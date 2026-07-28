# Stats page (`/stats`)

Live-polling dashboard of aggregate backend counters.

## Files

| File | Role |
| --- | --- |
| `src/app/stats/page.tsx` | Client component. Polls `GET /api/v1/stats` via `usePolling` and renders the tiles, pause/resume control, and paused-backend notice. |
| `src/app/stats/loading.tsx` | Route-level Suspense fallback (`PageSkeleton`), shown on first navigation before the client bundle mounts. |

## Data shape

```ts
type Stats = {
  totalServices: number;
  totalApiKeys: number;
  totalRequests: number;
  uniqueAgents: number;
  paused: boolean;
};
```

## Polling

Uses `usePolling<Stats>("/api/v1/stats", 5000)` — see
[docs/hooks.md](./hooks.md#usepolling) for the full hook contract
(status/data/error/lastUpdated, pause/resume/refresh, request
cancellation on unmount). This page surfaces:

- `lastUpdated` via `TimeAgo`, or "Never" before the first successful poll.
- A pause/resume `button` with `aria-pressed={statsState.paused}`, wired to
  `usePolling`'s `pause`/`resume`.

## States

- **Loading** (first mount, before any poll resolves): the route-level
  `PageSkeleton` (`src/app/stats/loading.tsx`) is shown while the client
  bundle loads; `usePolling`'s own `status === "loading"` only affects
  whether `stats` is populated yet (see "Populated" below) — there is no
  separate in-page loading indicator once the client component has mounted.
- **Error**: `usePolling`'s `error` is passed straight to `ErrorMessage`
  (`title="Failed to load stats"`, `role="alert"`). `usePolling` keeps
  polling on the same interval after an error, so a transient failure
  self-recovers on the next tick without user action; there is no explicit
  retry button (pausing/resuming restarts the interval, but that's a
  distinct control from error recovery).
- **Populated** (`stats` non-null): renders a 4-tile `<dl>` grid (Services,
  API keys, Requests, Agents). Each tile is a hand-rolled `<div>`/`<dt>`/
  `<dd>` — this page does **not** use the shared `StatTile` component (see
  [docs/components.md](./components.md#stattile)), so its markup doesn't
  automatically pick up `StatTile`'s trend-indicator support.
- **Paused backend** (`stats.paused === true`): an additional
  `role="status"` notice ("The backend is currently paused — writes are
  refused.") renders below the tiles. This reflects the *backend's* admin
  pause flag, distinct from the pause/resume button above it, which
  controls this *page's* polling.

## Testing

Tests live in `src/app/stats/page.test.tsx` (states, pause/resume, paused
notice) and `src/app/stats/loading.test.tsx` (loading fallback). Neither
file is coverage-locked in `jest.config.ts` — see
[docs/testing.md](./testing.md) for the full per-file threshold table.
