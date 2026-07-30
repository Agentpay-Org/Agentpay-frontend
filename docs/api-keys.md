# api-keys

The `api-keys` component (`src/app/api-keys/page.tsx`) provides the API keys management view for the dashboard. It handles listing, creating, and revoking API keys.

## Props

This is a Next.js route component and accepts no custom React props. It is rendered automatically by the App Router at `/api-keys`.

## States

The component maintains the following internal state to manage the lifecycle of API keys:

- `fetchState`: `FetchState` - The load state of the key list. A single discriminated union, mirroring the `loading | ok | error` vocabulary used by the shared `useApi` / `usePolling` hooks:
  - `{ status: "loading" }` - a load is in flight.
  - `{ status: "ok"; items: KeyItem[] }` - the list loaded; `items` may be empty.
  - `{ status: "error"; message: string }` - the load failed.
- `label`: `string` - The current input value for a new key's label in the creation form.
- `created`: `string | null` - The newly created raw key value, which is shown only once upon creation.
- `showFull`: `boolean` - Toggles whether to reveal the full `created` key value or keep it masked.
- `actionError`: `string | null` - The error message from a failed create or revoke. Kept separate from `fetchState` because an action failure annotates an otherwise-usable view rather than replacing it.
- `pendingRevoke`: `KeyItem | null` - The key currently selected for revocation, used to show the confirmation dialog.

## Live-region announcements

The view renders a visually-hidden `aria-live="polite"` region
(`data-testid="api-keys-announcer"`) so screen-reader users hear when the key
list actually changes. The text is produced by
[`useApiKeysAnnouncement`](../src/app/api-keys/useApiKeysAnnouncement.ts).

| Fetch state | Announcement key | Announced text |
| --- | --- | --- |
| Loading (`items === null`) | `idle` | *(silent)* |
| Load/action error | `idle` | *(silent)* |
| Loaded, no keys | `empty` | `No API keys` |
| Loaded, one key | `count:1` | `1 API key` |
| Loaded, N keys | `count:N` | `N API keys` |

Behaviour notes for reviewers:

- **Silent on mount.** The region is mounted empty so assistive tech registers
  it before the first change, and the first settled state is kept as a silent
  baseline. Only later changes are announced.
- **Debounced (300ms).** Rapid successive updates — for example a revoke
  followed immediately by a reload — collapse into a single announcement
  instead of queueing one per update.
- **Errors are not repeated.** Failures already render a `role="alert"`
  message, which assistive tech announces on its own, so the polite region
  stays silent to avoid double-speaking.
- **Announcement keys are primitives.** `useDebounce` compares by identity, so
  the state is flattened to a string (`count:3`) rather than an object; an
  object would be a new reference each render and the timer would never settle.
- The hook derives text only. It reads the existing `items` and `error` state
  and does not change how keys are loaded, created, or revoked.

## Minimal usage example

Because this is a route-level page component, it is not imported and rendered manually as a typical React component. It is accessed by navigating to its route:

```tsx
import Link from "next/link";

export function SettingsNav() {
  return (
    <nav>
      <Link href="/api-keys">Manage API Keys</Link>
    </nav>
  );
}
```
