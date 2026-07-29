# Admin page (`/admin`)

Control surface to pause or unpause backend writes across the protocol.

## Files

| File | Role |
| --- | --- |
| `src/app/admin/page.tsx` | Client component (`"use client"`). Renders the Admin live status panel and confirmation dialog. |
| `src/app/admin/layout.tsx` | Nested layout setting the `<title>` metadata to `Admin`. |

## Component

The component exported is `AdminPage`.

### Props

None. This component takes no props.

### States

- **Loading**: While `usePolling` first fetches `/api/v1/admin/status`, a polite live region displays "Loading status…".
- **Error (initial load)**: If the first poll fails, an `EmptyState` renders with a "Retry" button.
- **Empty (no data)**: If the backend returns an empty response but succeeds, an `EmptyState` prompts to "Refresh".
- **Populated (Live status panel)**: Renders a `StatusDot` ("Paused" or "Live") and a toggle button.
- **Pending action**: When the pause/unpause POST request is in flight, the button is disabled and reads "Working…".
- **Confirmation dialog**: Clicking the toggle opens a `ConfirmDialog` (`confirmOpen`) asking the user to confirm pausing or resuming writes.
- **Action Error**: Errors from the POST request (`actionError`) are caught and displayed via `AlertError` at the bottom of the page, as well as pushed to `useToast`.

## Minimal usage example

Since `AdminPage` is a Next.js App Router page, it is used by being mounted at the `/admin` route. It requires no props and relies on the global `ToastProvider` provided by the root layout.

```tsx
import AdminPage from "@/app/admin/page";

// Rendered by Next.js at the /admin route:
export default function Page() {
  return <AdminPage />;
}
```
