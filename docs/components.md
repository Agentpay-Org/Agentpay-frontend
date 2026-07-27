# Component Catalog

This catalog documents the shared UI primitives in `src/components`. Use it as
the first stop when building AgentPay pages so page code stays consistent,
accessible, and easy to review.

## Conventions

- Prefer the shared components before adding page-local UI primitives.
- Pass accessible labels for icon-only actions and short status text.
- Keep interactive controls keyboard reachable and use the existing
  `focus-visible` ring styles.
- Do not pass secrets or private keys into display or clipboard components.

## Layout and Navigation

### `Header`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| none | - | - | Renders the AgentPay brand link and the main navigation links. |

Use `Header` once in the app shell. It already exposes the nav with
`aria-label="Main navigation"` and focus-visible styles on each link.

```tsx
<Header />
```

### `Footer`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| none | - | - | Renders the shared AgentPay footer tagline. |

```tsx
<Footer />
```

### `PageShell`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | yes | Inner content of the page layout wrapper. |
| `maxWidth` | `"xl" \| "2xl" \| "3xl" \| "4xl" \| "5xl" \| "6xl" \| "7xl" \| string` | no | Suffix of the max-width Tailwind class (e.g. `"3xl"` sets `"max-w-3xl"`). Defaults to `"3xl"`. |
| `gap` | `"4" \| "6" \| "8" \| "12" \| string` | no | Suffix of the gap Tailwind class (e.g. `"6"` sets `"gap-6"`). Defaults to `"6"`. |
| `className` | `string` | no | Additional style classes to append. |

PageShell wraps pages inside the `<main id="main-content">` accessible landmark, providing consistent focus indicators for accessibility skip-links, min-height formatting, and horizontal auto-centering.

```tsx
<PageShell maxWidth="2xl" gap="8">
  <h1>Page Title</h1>
</PageShell>
```

### `PageHeading`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | `ReactNode` | yes | Main page heading. |
| `description` | `ReactNode` | no | Short supporting copy under the heading. |
| `action` | `ReactNode` | no | Right-aligned page action, usually a button or link. |

```tsx
<PageHeading
  title="Services"
  description="Manage the services that can bill AgentPay requests."
  action={<Button>Create service</Button>}
/>
```

### `Breadcrumb`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `items` | `{ href?: string; label: ReactNode }[]` | yes | Items with `href` render as links; the final plain item gets `aria-current="page"`. |

```tsx
<Breadcrumb
  items={[
    { href: "/services", label: "Services" },
    { label: "agent-api" },
  ]}
/>
```

## Surfaces and Empty States

### `Card`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | `ReactNode` | no | Optional header above the card body. |
| `footer` | `ReactNode` | no | Optional small footer separated by a top border. |
| `children` | `ReactNode` | no | Card body content. |
| other div attributes | `HTMLAttributes<HTMLDivElement>` | no | Useful for `className`, `id`, and ARIA attributes. |

```tsx
<Card title="API usage" footer="Updated every minute">
  <p>1,248 requests today</p>
</Card>
```

### `EmptyState`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | `ReactNode` | yes | Primary empty state message. |
| `description` | `ReactNode` | no | Additional guidance or context. |
| `action` | `ReactNode` | no | Recovery action such as a create button. |

```tsx
<EmptyState
  title="No services yet"
  description="Create a service before adding billable agents."
  action={<Button>Create service</Button>}
/>
```

## Controls

### `Button`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `variant` | `"primary" \| "secondary" \| "danger"` | no | Defaults to `"primary"`. |
| other button attributes | `ButtonHTMLAttributes<HTMLButtonElement>` | no | Supports `type`, `disabled`, `onClick`, `aria-*`, and `className`. |

Use `danger` only for destructive actions and pair it with confirmation when
the action cannot be undone.

```tsx
<Button type="submit">Save changes</Button>
<Button type="button" variant="secondary">Cancel</Button>
<Button type="button" variant="danger">Delete key</Button>
```

### `TextField`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `label` | `ReactNode` | yes | Visible label rendered above the input. |
| `description` | `ReactNode` | no | Helper text linked through `aria-describedby`. |
| `error` | `ReactNode` | no | Error text; sets `aria-invalid` and `role="alert"`. |
| other input attributes | `InputHTMLAttributes<HTMLInputElement>` | no | Supports `name`, `type`, `value`, `onChange`, `required`, and `autoComplete`. |

```tsx
<TextField
  label="Webhook URL"
  type="url"
  description="Use an HTTPS endpoint that can receive AgentPay events."
/>
```

### `SearchBar`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `value` | `string` | yes | Controlled search value. |
| `onChange` | `(next: string) => void` | yes | Receives the next search value. |
| `placeholder` | `string` | no | Defaults to the component placeholder. |
| other input attributes | `Omit<InputHTMLAttributes<HTMLInputElement>, "type" \| "value" \| "onChange">` | no | Pass `aria-label` when the surrounding context is not enough. |

```tsx
<SearchBar
  value={query}
  onChange={setQuery}
  placeholder="Search services"
/>
```

### `CopyButton`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `value` | `string` | yes | Text copied to the clipboard. |
| `label` | `string` | no | Defaults to `"Copy"`; changes to `"Copied"` after success. |

Use this for public identifiers, request IDs, and URLs. Do not use it for
secrets, private keys, seed phrases, or passwords.

```tsx
<CopyButton value={service.id} label="Copy service ID" />
```

### `ConfirmDialog`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `open` | `boolean` | yes | Returns `null` when false. |
| `title` | `ReactNode` | yes | Dialog heading. |
| `description` | `ReactNode` | no | Explains the effect of the action. |
| `confirmLabel` | `string` | no | Defaults to `"Confirm"`. |
| `cancelLabel` | `string` | no | Defaults to `"Cancel"`. |
| `onConfirm` | `() => void` | yes | Called by the destructive confirm button. |
| `onCancel` | `() => void` | yes | Called by the cancel button. |

```tsx
<ConfirmDialog
  open={isDeleting}
  title="Delete API key?"
  description="Requests signed with this key will stop working."
  confirmLabel="Delete key"
  onConfirm={deleteKey}
  onCancel={() => setIsDeleting(false)}
/>
```

### `Pagination`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `page` | `number` | yes | Current 1-based page. |
| `pageCount` | `number` | yes | Total pages. Renders nothing when `pageCount <= 1`. |
| `onChange` | `(next: number) => void` | yes | Called with the clamped next page. |

```tsx
<Pagination page={page} pageCount={pageCount} onChange={setPage} />
```

### `ThemeToggle`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| none | - | - | Lets users choose `light`, `dark`, or `system`. |

`ThemeToggle` persists the theme through `src/lib/theme` and exposes the three
options as an ARIA button group.

```tsx
<ThemeToggle />
```

## Feedback and Status

### `Badge`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | yes | Short label text. |
| `variant` | `"neutral" \| "ok" \| "warning" \| "danger"` | no | Defaults to `"neutral"`. |

```tsx
<Badge variant="ok">Active</Badge>
<Badge variant="warning">Review</Badge>
```

### `StatusDot`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `variant` | `"ok" \| "warn" \| "down"` | yes | Maps to Operational, Degraded, or Down text. |

The color dot is decorative; the visible label carries the status meaning.

```tsx
<StatusDot variant="warn" />
```

### `Spinner`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `label` | `string` | no | Screen-reader label; defaults to `"Loading"`. |

```tsx
<Spinner label="Loading webhook events" />
```

### `ToastProvider` and `useToast`

| API | Type | Notes |
| --- | --- | --- |
| `ToastProvider` | `({ children }: { children: ReactNode }) => JSX.Element` | Wrap the app area that can show toast messages. |
| `useToast` | `() => { push: (message: string, level?: "info" \| "error") => void }` | Throws if used outside the provider. |

Info toasts use `role="status"` and error toasts use `role="alert"`.

```tsx
const { push } = useToast();
push("Webhook saved");
push("Webhook failed", "error");
```

### `Tooltip`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `label` | `ReactNode` | yes | Tooltip content. |
| `children` | `ReactNode` | yes | Hover/focus target. |

Use tooltips for short hints. Keep essential instructions visible in the page
instead of only inside the tooltip.

```tsx
<Tooltip label="Copied values are public IDs only">
  <button type="button">?</button>
</Tooltip>
```

## Data Display

### `KeyValueGrid`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `rows` | `{ label: ReactNode; value: ReactNode }[]` | yes | Renders a semantic `dl` with label/value pairs. |

```tsx
<KeyValueGrid
  rows={[
    { label: "Service", value: service.name },
    { label: "Endpoint", value: service.endpoint },
  ]}
/>
```

### `StatTile`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `label` | `ReactNode` | yes | Metric label. |
| `value` | `ReactNode` | yes | Main metric value. |
| `trend` | `{ delta: number; positiveIsGood?: boolean }` | no | Displays a signed delta and chooses positive/negative color. |

Wrap groups of `StatTile` in a parent `<dl>` when presenting multiple related
metrics.

```tsx
<StatTile
  label="Requests"
  value="1,248"
  trend={{ delta: 12, positiveIsGood: true }}
/>
```

### `TimeAgo`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `ts` | `number` | yes | JavaScript timestamp in milliseconds. |

The component renders a semantic `<time>` with an ISO `dateTime` and `title`.
It refreshes every 30 seconds.

```tsx
<TimeAgo ts={event.createdAt} />
```

## Pages

### `SettingsPage`

Route: `/settings`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| none | - | - | Server component. Renders the Appearance section with `ThemeToggle`. |

`SettingsPage` is a Next.js page component at `src/app/settings/page.tsx`.
It exports a static `metadata` object (`{ title: "Settings — AgentPay" }`)
and a default `SettingsPage` function component. The page wraps its content
in `PageShell` with `maxWidth="2xl"` and `gap="8"`.

**Composition:**

- `PageShell` — accessible `<main>` wrapper.
- `ThemeToggle` — light / dark / system selector that persists via
  `localStorage` (`agentpay.theme` key). See the `ThemeToggle` entry above
  and `docs/theming.md` for the persistence layer.

**Minimal usage (route-level, no props):**

```tsx
// src/app/settings/page.tsx
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageShell } from "@/components/PageShell";

export const metadata = { title: "Settings — AgentPay" };

export default function SettingsPage() {
  return (
    <PageShell maxWidth="2xl" gap="8">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Appearance</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Choose a colour scheme. System follows your OS preference.
        </p>
        <ThemeToggle />
      </section>
    </PageShell>
  );
}
```

**Extending:** To add new settings sections (e.g. notifications, API keys),
append additional `<section>` blocks inside the `PageShell`. Each section
should follow the same pattern: an `<h2>` heading, a short description, and
the relevant control component.
