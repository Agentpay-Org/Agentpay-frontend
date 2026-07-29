# api-keys

The `api-keys` component (`src/app/api-keys/page.tsx`) provides the API keys management view for the dashboard. It handles listing, creating, and revoking API keys.

## Props

This is a Next.js route component and accepts no custom React props. It is rendered automatically by the App Router at `/api-keys`.

## States

The component maintains the following internal state to manage the lifecycle of API keys:

- `items`: `KeyItem[] | null` - The list of loaded API keys, or null before the initial load completes.
- `label`: `string` - The current input value for a new key's label in the creation form.
- `created`: `string | null` - The newly created raw key value, which is shown only once upon creation.
- `showFull`: `boolean` - Toggles whether to reveal the full `created` key value or keep it masked.
- `error`: `string | null` - The current error message from any failed API interactions (load, create, revoke).
- `pendingRevoke`: `KeyItem | null` - The key currently selected for revocation, used to show the confirmation dialog.

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
