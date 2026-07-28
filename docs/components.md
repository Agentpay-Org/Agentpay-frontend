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
- Refer to the [Forms and Validation Guide](./forms.md) for shared validation contracts, error message conventions, and form state management rules.

## Layout and Navigation

### `Header`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| none | - | - | Renders the AgentPay brand link, the primary nav, the "More" secondary-links menu, and the mobile disclosure menu. Reads the current route via `usePathname()` internally — nothing to pass in. |

Use `Header` once in the app shell. It reads its own link list from two
module-level constants (not props):

- **`primaryLinks`** — always visible on `md+` viewports: Home, Services,
  Agents, Usage, Search.
- **`secondaryLinks`** — grouped behind a "More" menu on desktop and a
  "More" section in the mobile panel: API Keys, Webhooks, Events, Stats,
  Settings, Docs, Admin.

To add or remove a nav entry, edit these arrays directly in `Header.tsx` —
there is currently no prop-driven way to override them per page.

```tsx
<Header />
```

**Active-link logic:** a link is "active" (`aria-current="page"`) when the
current path equals its `href` exactly, or — for every `href` except `/` —
when the current path starts with `href + "/"`. This means a nested route
like `/services/abc/edit` marks the `Services` link active, not just an
exact `/services` match. A route matching no known link marks nothing
active; this is not treated as an error, just "no highlight."

**Responsive behavior:**
- **Desktop (`md+`)**: primary links render inline; secondary links are
  behind a "More" `aria-haspopup="menu"` button that opens a `role="menu"`
  dropdown, closing on outside blur (`onBlur` checking `relatedTarget`) or
  on route change.
- **Mobile (below `md`)**: a single "Menu" disclosure button
  (`aria-expanded`/`aria-controls`) opens a `role="region"` panel
  (`aria-label="Mobile navigation"`) listing every primary link, then a
  "More" heading, then every secondary link. Closes on **Escape** (returning
  focus to the toggle button) or on route change.

**Accessibility:** the `<nav>` has `aria-label="Main navigation"`; every
link and the "More" button/menu items carry `focus-visible` ring styles
matching the rest of the design system.

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

`TextField` automatically manages internal component IDs to link the label (`htmlFor`), helper text (`aria-describedby`), and error messages. When an `error` prop is passed, `TextField`:
1. Flips `aria-invalid` to `true`.
2. Connects the error message element's ID to `aria-describedby`.
3. Renders the error message inside a `span` with `role="alert"` for screen reader announcements.

Always clear field-specific error states inside the `onChange` handler as the user types. For full details on validator contracts and form conventions, see the [Forms and Validation Guide](./forms.md).

```tsx
<TextField
  label="Webhook URL"
  type="url"
  description="Use an HTTPS endpoint that can receive AgentPay events."
/>

<TextField
  label="Service ID"
  value={serviceId}
  onChange={(e) => {
    setServiceId(e.target.value);
    setServiceIdError(null);
  }}
  error={serviceIdError ?? undefined}
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
| `pageCount` | `number` | yes | Total pages. Renders nothing when `pageCount <= 1` (and neither `loading` nor `error` is set). |
| `onChange` | `(next: number) => void` | yes | Called with the clamped next page. |
| `loading` | `boolean` | no | Shows a `Spinner` in place of the nav controls, regardless of `pageCount`. Defaults to `false`. |
| `error` | `string \| null` | no | Shows an `ErrorMessage` in place of the nav controls, regardless of `pageCount`. Takes precedence over `loading`. Defaults to `null`. |
| `onRetry` | `() => void` | no | Retry handler passed through to the error state's "Try again" button. Only rendered when both `error` and `onRetry` are set. |
| `showFirstLast` | `boolean` | no | When `true`, renders First and Last jump buttons that use the same disabled-state styling as Previous/Next. Defaults to `false`. |
| `totalItems` | `number` | no | Total result count. Combined with `pageSize` to show and announce a `"showing X-Y of Z"` summary. |
| `pageSize` | `number` | no | Items per page. Required together with `totalItems` for the result-count summary. |

Render precedence is **error → loading → hidden (`pageCount <= 1`) → nav**.
Announces page changes to assistive tech via a polite, debounced `aria-live`
region (`"Page N of pageCount"`). When both `totalItems` and `pageSize` are
set, the announcement also includes `"showing X-Y of Z"` (with `Y` clamped to
`totalItems` on the last page). The announcement is debounced 300ms so
rapid successive page changes collapse into a single announcement for the
page the user settles on, and it stays empty on first mount.

For the full prop table, state matrix, accessibility notes, and usage
examples (including loading/error), see the
[Pagination component contract](./pagination.md).

```tsx
<Pagination page={page} pageCount={pageCount} onChange={setPage} />

<Pagination
  page={page}
  pageCount={pageCount}
  onChange={setPage}
  showFirstLast
  totalItems={totalItems}
  pageSize={25}
/>
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
| `label` | `ReactNode` | no | Overrides the default per-variant text. An omitted, `null`, or empty-string value falls back to the variant default, so a label is always present. |

The color dot is decorative (`aria-hidden`); the visible label carries the
status meaning. Use `label` to reuse the same dot affordance for states outside
the three defaults — for example `"Paused"` on a `warn` dot — without rendering a
separate element.

```tsx
<StatusDot variant="warn" />
<StatusDot variant="warn" label="Paused" />
```

### `ErrorMessage`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | `string` | yes | Primary error summary text. |
| `detail` | `string \| null` | no | Secondary detail with more context about the failure. |
| `requestId` | `string` | no | Backend request identifier shown as a monospace badge for debugging. |
| `onRetry` | `() => void` | no | When provided, renders a "Try again" button that calls this callback. |

The component is wrapped with `React.memo` so it does not re-render (and re-announce via `role="alert"`) on unrelated parent updates.

```tsx
<ErrorMessage title="Failed to load services" detail={error} />
<ErrorMessage
  title="Recording failed"
  detail="Backend rejected the request."
  requestId="req-abc-123"
  onRetry={handleRetry}
/>
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

### `DataTable`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `caption` | `ReactNode` | yes | Rendered as a visible `<caption>` above the table. Screen readers announce it as the table's accessible name. |
| `columns` | `DataTableColumn<T>[]` | yes | See column shape below. |
| `data` | `T[]` | yes | Rows to render, in the order they should appear before any sorting. |
| `getRowKey` | `(row: T, index: number) => string \| number` | yes | Stable React key per row. |
| `className` | `string` | no | Extra classes on the horizontal-scroll wrapper `div`. |
| `captionClassName` | `string` | no | Extra classes on the `<caption>`. |
| `defaultSortKey` | `string` | no | Column `key` sorted by on first render. |
| `defaultSortDirection` | `"ascending" \| "descending"` | no | Defaults to `"ascending"`. |

Each entry in `columns` is:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `key` | `string` | yes | Unique column id; doubles as the sort key. |
| `header` | `ReactNode` | yes | Header cell content. |
| `render` | `(row: T, index: number) => ReactNode` | yes | Cell content for a row. |
| `rowHeader` | `boolean` | no | Renders the cell as `<th scope="row">` instead of `<td>`. Use on the column that identifies the row (e.g. a name or id). |
| `align` | `"left" \| "center" \| "right"` | no | Text alignment for both the header and body cells. Defaults to `"left"`. |
| `sortable` | `true` | no | When set, `sortAccessor` becomes required and the header renders as a button. |
| `sortAccessor` | `(row: T) => string \| number` | when `sortable` | Comparable value used to order rows. Numbers compare numerically; everything else compares with `localeCompare`. |
| `headerClassName` / `cellClassName` | `string` | no | Extra classes appended to the header or body cell. |

Every header cell gets `scope="col"`. Sortable columns toggle between ascending
and descending on click and set `aria-sort` (`"ascending"`, `"descending"`, or
`"none"` when another sortable column is active) on the active `<th>`; the sort
is a stable client-side sort that never mutates `data`. Non-sortable columns
render as plain header text with no `aria-sort` attribute.

```tsx
<DataTable
  caption="API keys"
  data={items}
  getRowKey={(item) => item.prefix}
  columns={[
    {
      key: "label",
      header: "Label",
      rowHeader: true,
      sortable: true,
      sortAccessor: (item) => item.label,
      render: (item) => item.label,
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      sortAccessor: (item) => item.createdAtMs ?? Number.NEGATIVE_INFINITY,
      render: (item) => <TimeAgo ts={item.createdAtMs} />,
    },
  ]}
/>
```

Used by the API keys page (`src/app/api-keys/page.tsx`) in place of a hand-rolled
list; prefer it over new bespoke `<ul>`/`<table>` markup for tabular data.

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

## Formatting Helpers

Formatting helpers live in `src/lib/format.ts` and are plain functions, not
components. The ones relevant to identifier display are documented here because
they pair with the display patterns above.

### `truncateMiddle`

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `value` | `string` | yes | The identifier to truncate. |
| `head` | `number` | no | Leading characters kept. Defaults to `TRUNCATE_HEAD_DEFAULT` (8). |
| `tail` | `number` | no | Trailing characters kept. Defaults to `TRUNCATE_TAIL_DEFAULT` (6). |

Collapses the middle of a long identifier into a single ellipsis
(`GABCDEFG…QRSTUV`) while preserving both ends. Agent and service ids often
share a common prefix and only differ near the edges, so keeping the tail
visible is what makes two truncated ids distinguishable — unlike CSS
`text-overflow: ellipsis`, which hides it.

Behaviour to rely on:

- Values already within the budget (`head + tail + 1` characters, the `1`
  being the ellipsis) are returned unchanged, so short ids never gain a
  marker.
- Counting is code-point aware; surrogate pairs are never split.
- Negative or fractional `head` / `tail` values are clamped to non-negative
  integers; non-finite values fall back to the defaults.

When rendering the truncated form, always expose the full value through
`title` (hover) and an accessible label such as `aria-label` (assistive
technology), and keep `font-mono` so ids stay scannable:

```tsx
import { truncateMiddle } from "@/lib/format";

<span className="font-mono" title={serviceId} aria-label={serviceId}>
  {truncateMiddle(serviceId)}
</span>
```

Used by the agent detail page (`src/app/agents/[agent]/page.tsx`) for the
heading, breadcrumb, and per-service rows, and by the services list
(`src/app/services/page.tsx`) for each service id. Pair with `CopyButton`
when users need the full value on the clipboard — pass the untruncated id as
its `value`.
