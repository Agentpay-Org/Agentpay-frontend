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

## Render states

Because the load state is one value rather than separate `items` / `error` flags, the four render states are mutually exclusive by construction — the view can never show the empty state while a load is in flight, or an error and a table at once.

| `fetchState` | Renders | Live-region role |
| --- | --- | --- |
| `loading` | `Loading API keys…` | `role="status"` |
| `error` | `ErrorMessage` titled *Could not load API keys*, with a **Try again** button | `role="alert"` |
| `ok`, `items` empty | `EmptyState` titled *No API keys yet* | `role="status"` |
| `ok`, `items` non-empty | `DataTable` of keys | — |

Notes for reviewers:

- **Retry.** *Try again* calls `reload()`, which resets `fetchState` to `loading` and re-runs the same `GET /api/v1/api-keys` request. It is a plain `<button type="button">`, so it is focusable in DOM order and activates with both Enter and Space — no key handling of our own is needed.
- **Announcements.** Each state carries its own live-region role, so assistive tech announces the transition. They are deliberately *not* wrapped in a shared `aria-live` container, which would announce the same change twice.
- **Missing payload.** A response without an `items` array is treated as an empty list, so a malformed payload shows the empty state instead of rendering blank.
- **Action errors.** A failed create or revoke renders an `AlertError` above the list and leaves the loaded table in place; it does not switch the view into the load-error state.

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
