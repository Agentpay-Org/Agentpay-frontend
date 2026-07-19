# AgentPay Frontend

Dashboard and Stellar wallet integration for the AgentPay protocol (machine-to-machine payments on Stellar).

## Overview

- **Stack:** Next.js 16, React, TypeScript, Tailwind CSS
- **Purpose:** AgentPay branding, dashboard placeholder, and future wallet/API integration

## Prerequisites

- Node.js 18+
- npm

## Setup for contributors

1. **Clone the repo** (or add remote and pull):

   ```bash
   git clone <repo-url> && cd agentpay-frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Verify setup**:

   ```bash
   npm run build
   npm test
   ```

4. **Run locally**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
agentpay-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── global-error.tsx                        # root-layout crash boundary
│   │   ├── not-found.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── page.tsx                                 # /
│   │   ├── about/page.tsx                           # /about
│   │   ├── admin/page.tsx                           # /admin
│   │   ├── agents/page.tsx                         # /agents
│   │   │   └── [agent]/page.tsx                   # /agents/:agent
│   │   ├── api-keys/page.tsx                      # /api-keys
│   │   ├── changelog/page.tsx                      # /changelog
│   │   ├── docs/page.tsx                           # /docs
│   │   ├── events/page.tsx                        # /events
│   │   ├── export/page.tsx                        # /export
│   │   ├── search/page.tsx                        # /search
│   │   ├── services/page.tsx                     # /services
│   │   │   ├── [serviceId]/page.tsx            # /services/:serviceId
│   │   │   ├── [serviceId]/agents/page.tsx    # /services/:serviceId/agents
│   │   │   └── [serviceId]/edit/page.tsx      # /services/:serviceId/edit
│   │   │   └── new/page.tsx                   # /services/new
│   │   ├── settings/page.tsx                     # /settings
│   │   ├── stats/page.tsx                        # /stats
│   │   ├── usage/page.tsx                        # /usage
│   │   ├── webhooks/page.tsx                     # /webhooks
│   │   └── (shared components & libs live outside app/)
│   ├── components/                                # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   └── lib/                                       # API client, hooks, formatting, etc.
│       ├── apiClient.ts
│       ├── resolveApiBase.ts
│       ├── useApi.ts
│       └── ...
├── package.json
├── jest.config.ts
├── jest.setup.ts
└── .github/workflows/
    └── ci.yml                                    # CI: build, test
```

## Route architecture

For a detailed breakdown of each route's responsibility, render mode (server vs client), nested layout, and backend endpoints, see [docs/architecture.md](docs/architecture.md).

## Route map (frontend)

Backend endpoints are taken from the companion documentation page `src/app/docs/page.tsx` and from the API client usage throughout `src/app/*`.

| Path                          | Purpose                                      | Backend endpoints it calls                                                                                                                        |
| ----------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                           | Main dashboard landing                       | _(check app code in `src/app/page.tsx` and any hooks it uses)_                                                                                    |
| `/about`                      | About page                                   | _(static UI unless the page calls APIs)_                                                                                                          |
| `/admin`                      | Admin control surface (pause/unpause/status) | `POST /api/v1/admin/pause`, `POST /api/v1/admin/unpause`, _(reads status via GET `/api/v1/admin/status` in code)_                                 |
| `/agents`                     | Agents overview                              | _(reads agents list via `/api/v1/agents` in code)_                                                                                                |
| `/agents/:agent`              | Single-agent view                            | _(reads agent details via `/api/v1/agents/:agent` in code)_                                                                                       |
| `/api-keys`                   | API keys management with created-at timestamps and a no-keys empty state | _(list/create/delete/update endpoints in code)_                                                                                                   |
| `/changelog`                  | Changelog                                    | _(static or calls `/api/v1/changelog` depending on implementation)_                                                                               |
| `/docs` | Short API endpoint reference | `GET /api/v1/openapi.json` plus the prose list rendered from `src/app/docs/page.tsx` (usage, settle, services, admin pause/unpause), filterable via a debounced search input. Each endpoint includes a copyable curl example. |
| `/events`                     | Event log renderer                           | _(reads events stream/poll via `/api/v1/events` endpoints in code)_                                                                               |
| `/export`                     | Export data                                  | _(calls export endpoints in code)_                                                                                                                |
| `/search`                     | Global search                                | _(calls search endpoint in code)_                                                                                                                 |
| `/services`                   | Services list                                | `GET /api/v1/services` _(and/or list related endpoints in code)_                                                                                  |
| `/services/:serviceId`        | Service details                              | `GET /api/v1/services/:serviceId` _(plus nested reads in code)_                                                                                   |
| `/services/:serviceId/agents` | Agents for a given service                   | `GET /api/v1/services/:serviceId/agents`                                                                                                          |
| `/services/:serviceId/edit`   | Edit service                                 | _(reads service + submits via service update endpoints in code)_                                                                                  |
| `/services/new`               | Create service                               | `POST /api/v1/services`                                                                                                                           |
| `/settings`                   | User/app settings (theme configuration and Connection section displaying the resolved API base URL) | _(static UI settings surface)_                                                                                                                    |
| `/stats`                      | Statistics                                   | _(calls stats endpoints in code)_                                                                                                                 |
| `/usage`                      | Usage totals & settlement workflow           | `POST /api/v1/usage`, `GET /api/v1/usage/:agent/:serviceId`, `POST /api/v1/settle`                                                                |
| `/webhooks`                   | Webhooks management                          | _(calls webhooks endpoints in code)_ and displays each webhook registration time relatively with an absolute timestamp tooltip                    |

### Usage identifier validation

The `/usage` record and query forms trim the agent and service identifiers before
submission. Identifiers must be 1-128 characters and may only contain letters,
numbers, dots, underscores, hyphens, and colons. Query requests still URL-encode
the validated identifiers before placing them in the path.

### API keys page notes

The `/api-keys` page lists each key label, prefix, and created-at age with the absolute ISO timestamp available on hover. If the account has no keys, the page renders a clear "No API keys yet" empty state instead of an empty list while preserving the create, reveal-once, copy, and revoke confirmation flows.

### Export page notes

The `/export` page builds JSON and CSV export requests from the resolved API base URL. Downloads are fetched as blobs so the UI can disable both buttons during an in-flight request, show the shared `Spinner` with a "Preparing export" status, trigger the browser download with the response filename, show a success toast, and surface backend failures in a `role="alert"` message.

## Shared components

See [docs/components.md](docs/components.md) for the shared component catalog,
including prop tables, usage examples, and accessibility notes for the
primitives in `src/components`.

## Shared hooks

See [docs/hooks.md](docs/hooks.md) for the shared hook reference, including
signatures, return shapes, cancellation and SSR notes, and usage examples for
the hooks in `src/lib`.

The stats page uses `usePolling("/api/v1/stats", 5000)` for its five-second
refresh loop, and the admin page uses the same hook for
`/api/v1/admin/status`. Interval cleanup, stale-response guards, action-triggered
refreshes, and error recovery stay in one shared hook instead of being
reimplemented in route code.

The agent detail route uses `useApi` for its primary usage request, keyed by the
URL-encoded agent identifier. Navigating between agents aborts the superseded
usage request and ignores any stale completion. Its optional lifetime-total
request remains a soft failure, but is guarded so a slower previous agent cannot
overwrite the current agent's total.

## Error boundaries

### Route-level boundary (`src/app/error.tsx`)

Catches exceptions thrown inside individual route segments. Renders inside the
root layout so the Header, Footer, and ToastProvider remain visible.

Key features:

- **Accessible error presentation:** Error message wrapped in `role="alert"` so
  screen readers announce it immediately.
- **Recovery action:** "Try again" button (using the shared `Button` component)
  wired to Next.js's `reset()` callback allows users to retry without a full page
  reload — essential for transient failures like flaky fetches.
- **Production safety:** Only `error.message` is rendered; stack traces never
  leak into the DOM.
- **Debug support:** `error.digest` (if present) is logged to the console for
  debugging but not prominently displayed to users.
- **Keyboard accessible:** Button includes `focus-visible` outline and is fully
  operable via keyboard.
- **Dark mode compatible:** All styling supports both light and dark themes.

Behaviour is covered by `src/app/error.test.tsx`, which asserts the alert region
renders, the reset callback is invoked on click, no stack traces appear, and edge
cases like empty messages are handled gracefully.

### Global boundary (`src/app/global-error.tsx`)

Catches exceptions thrown **in the root layout itself** — for example a crash
in `Header`, `Footer`, or `ToastProvider` in `src/app/layout.tsx`. Because the
layout chrome is unavailable at that point, `global-error.tsx` renders its own
`<html>`/`<body>` shell as required by the Next.js contract.

Key design decisions:

- **`role="alert"` + `aria-live="assertive"`** on the `<main>` element so
  screen readers announce the error immediately.
- **No stack traces in the DOM.** Only `error.message` (user-facing) and
  `error.digest` (server-generated support-correlation ID) are rendered.
- **Minimal inline styles** (no Tailwind, no font imports) so the page renders
  correctly even when the CSS pipeline that powers the normal layout is
  unavailable.
- Behaviour is covered by `src/app/global-error.test.tsx`, which asserts the
  message renders, `reset` is called on click, no stack trace appears, and the
  component renders standalone without Header/Footer.

## Responsive header navigation

On small screens (below Tailwind `md`), the Header collapses into an accessible disclosure menu with a keyboard-operable toggle (Escape closes; focus returns to the toggle). The inline primary navigation remains for `md` and larger screens.

Additionally, the Header marks exactly one active route strictly utilizing `aria-current="page"` (leveraging the client-side `usePathname()` context), creating a robust "you are here" cue for assistive technologies.

## Accessibility


### Route loading skeleton

The App Router fallback in [`src/app/loading.tsx`](src/app/loading.tsx) renders an
animated `animate-pulse` skeleton during route transitions. So that
assistive-technology users are not left on an apparently empty page, the skeleton is
wrapped in a `role="status"` / `aria-live="polite"` region carrying an `sr-only`
"Loading…" label — mirroring the pattern used by
[`src/components/Spinner.tsx`](src/components/Spinner.tsx). The individual skeleton
blocks are marked `aria-hidden="true"` so they are not announced one by one, and the
pulse animation is disabled for users who request reduced motion via the
`prefers-reduced-motion` rules in [`src/app/globals.css`](src/app/globals.css). This
satisfies [WCAG 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html).
Behaviour is covered by [`src/app/loading.test.tsx`](src/app/loading.test.tsx).

### Search result announcements

The search page ([`src/app/search/page.tsx`](src/app/search/page.tsx)) includes a
visually-hidden `aria-live="polite"` region that announces the number of search results
to screen readers after the debounced query settles. This ensures assistive-technology
users receive feedback about result counts without focus being stolen from the search
input. The announcement format is:
- "N results for 'query'" for one or more matches
- "No matches for 'query'" when the search returns zero results
- No announcement for empty queries

The live region coordinates with the 250ms debounce timing to avoid spamming announcements
on every keystroke. The region is marked with `aria-atomic="true"` and uses the `sr-only`
class for visual hiding. This implementation satisfies
[WCAG 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html).
While the debounce window or backend request is pending, the page shows the shared
`Spinner` with a visible "Searching..." status. Requests include an `AbortSignal`
and a latest-input guard so out-of-order responses cannot replace newer results.
Backend errors are shown in a `role="alert"` message instead of being reported as
an empty result set.
Behaviour is covered by [`src/app/search/page.test.tsx`](src/app/search/page.test.tsx).

## API integration

See [docs/api-integration.md](docs/api-integration.md) for the complete reference of
every backend endpoint the dashboard calls — request bodies, response shapes, the
shared `ApiError` envelope, the 204/no-body convention, and pause-flag semantics.

## Environment variables

| Variable                        | Visibility                      | Default                 | Purpose                                                                                                                                                                         |
| ------------------------------- | ------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_AGENTPAY_API_BASE` | public (bundled into client JS) | `http://localhost:3001` | Base URL for the AgentPay backend. Validated by `resolveApiBase()` in `src/lib/resolveApiBase.ts` and rejected in production if non-https except for `localhost` / `127.0.0.1`. |
| `NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN` | public (metadata route output) | `http://localhost:3000` | Canonical frontend origin used by `src/app/sitemap.ts` and `src/app/robots.ts`. Set this per deployment, for example `https://dashboard.example.com`; trailing slashes are trimmed. |

Because the variable is `NEXT_PUBLIC_*`, its value is exposed to the browser. Never put API secrets in it - it is used only for routing public HTTP requests.

## SEO

The dashboard exposes Next.js metadata routes for crawler discovery and crawl
control:

- `src/app/sitemap.ts` emits canonical URLs for the public static routes:
  `/`, `/about`, `/docs`, and `/changelog`.
- `src/app/robots.ts` allows public crawling from `/` and explicitly
  disallows operator-only dashboard surfaces: `/admin`, `/api-keys`,
  `/webhooks`, and `/settings`.
- `src/app/manifest.ts` serves the PWA web app manifest with name, description, branding colors matching the dark/light palette in `src/app/globals.css`, and `favicon.ico` icon entry to enable installability as a PWA.
- Both `sitemap.ts` and `robots.ts` derive absolute URLs from
  `NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN`, defaulting to `http://localhost:3000` for
  local development rather than hard-coding a production domain.

## Route map (frontend)

The following frontend routes are defined under `src/app/`:

| Route | Page |
|-------|------|
| `/` | Home |
| `/about` | About |
| `/admin` | Admin |
| `/agents` | Agents |
| `/agents/:agent` | Agent detail |
| `/api-keys` | API keys |
| `/changelog` | Changelog |
| `/docs` | Docs |
| `/events` | Events |
| `/export` | Export |
| `/search` | Search |
| `/services` | Services |
| `/services/:serviceId` | Service detail |
| `/services/:serviceId/agents` | Service agents |
| `/services/:serviceId/edit` | Edit service |
| `/services/new` | New service |
| `/settings` | Settings |
| `/stats` | Stats |
| `/usage` | Usage |
| `/webhooks` | Webhooks |

## Home page quick-links

The home page (`src/app/page.tsx`) renders the primary navigation entry points (Manage services, View stats, Record usage, Agents, Docs) and the external Stellar link inside a `<nav aria-label="Quick links">` landmark with a semantic `<ul>` / `<li>` list structure. This improves discoverability for screen-reader users.

## 404 page recovery links

The 404 page (`src/app/not-found.tsx`) renders a `<nav aria-label="Helpful links">` landmark below the error message with quick-return links to four primary surfaces (Home, Services, Stats, Docs). This gives users a semantic, keyboard-accessible path back into the app without relying on the browser back button. The navigation uses a `<ul>` / `<li>` list structure and all links include `focus-visible` outlines for keyboard accessibility.

## Security headers

A baseline security header set (CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`, HSTS) is wired up in `next.config.ts` via `src/lib/securityHeaders.ts`. The CSP `connect-src` directive tracks `NEXT_PUBLIC_AGENTPAY_API_BASE` automatically; `<a href>` links to external sites (`https://stellar.org`, etc.) remain navigable. See [`docs/security-headers.md`](docs/security-headers.md) for the full header and CSP architecture, including directive-by-directive rationale and the safe workflow for adding allowed origins.

## Link safety convention

When rendering links:

- Any external link rendered with `target="_blank"` must include `rel="noopener noreferrer"`.
- Any `href` derived from backend/user data must be validated with `safeHref()` from `src/lib/url.ts`. Unsafe schemes like `javascript:` and `data:` are rejected.
- Links on the `/docs` page (relative OpenAPI and external GitHub reference link) are validated through `safeHref()`, falling back to plain text if validation fails.

## Route map (frontend)

| Path | Notes |
|------|-------|
| `/` | Home |
| `/about` | About |
| `/admin` | Admin |
| `/agents` | Agents |
| `/agents/:agent` | Agent detail |
| `/api-keys` | API keys |
| `/changelog` | Changelog |
| `/docs` | Docs |
| `/events` | Event log |
| `/export` | Export |
| `/search` | Search |
| `/services` | Services |
| `/services/:serviceId` | Service detail |
| `/services/:serviceId/agents` | Service agents |
| `/services/:serviceId/edit` | Edit service |
| `/services/new` | New service |
| `/settings` | Settings |
| `/stats` | Stats |
| `/usage` | Usage |
| `/webhooks` | Webhooks |

## Event log rendering

The `/events` page renders server-supplied JSON payloads with performance safeguards:

- **Per-payload cap:** Each payload is serialised through `safeStringify` (`src/lib/format.ts`) with a hard cap (`EVENT_PAYLOAD_MAX_CHARS`, default 5,000 chars) and a visible `…(truncated)` marker. Circular references, `BigInt`, functions, and malformed timestamps are replaced with safe sentinels so a bad payload can't crash the page.
- **Render count cap:** The list is capped at 50 rendered rows (`MAX_RENDERED_EVENTS`) to keep the DOM bounded, regardless of the backend `limit`. When the filtered list exceeds the cap, a "Showing 50 of N events." note appears above the list.
- **Stable filtering:** The `useMemo` filter dependencies are minimal (`items`, `debouncedQuery`), so background polling does not trigger unnecessary re-renders when the underlying data is unchanged.

## Changelog empty state

The `/changelog` page keeps using `useApi("/api/v1/changelog")` for loading release notes. When the backend returns `{ entries: [] }`, it renders the shared `EmptyState` component with a clear "No changelog entries yet" message instead of an empty list. This branch is constant-time and adds no extra network calls.

## Webhooks empty and loading states

The `/webhooks` page shows the shared `Spinner` component during the initial fetch. Once the list resolves, if it is empty, it renders the `EmptyState` component with "No webhooks registered yet" and helpful guidance. When webhooks are present, they are rendered inside an accessible region for better screen-reader discovery.

## Formatting conventions

The frontend formats currency (Stroops / XLM) consistently using the helper `formatStroops` (located in `src/lib/format.ts`):

- **Stroops definition:** 1 XLM = 10,000,000 stroops (Stellar's base unit).
- **Sub-cent amounts:** If the value converts to less than `0.01 XLM` in absolute magnitude (but is non-zero), the formatting shows the amount in grouped raw `stroops` (e.g., `50,000 stroops`).
- **Standard amounts:** Standard amounts are formatted in grouped `XLM` with at least two and up to seven fraction digits so large values stay readable and fractional XLM is not hidden (e.g., `1.50 XLM`, `1,234.56789 XLM`).
- **Zero amount:** A zero price formats to `0 XLM`.
- **Locale-aware grouping:** Both XLM and raw-stroops representations support locale-aware thousands separators using cached `Intl.NumberFormat` instances. You can customize the locale by passing a `locale` option (e.g., `formatStroops(12345678900, { locale: "de-DE" })` results in `"1.234,56789 XLM"`).
- **Raw-Stroops force toggle:** An optional second argument accepts a boolean or options object `{ forceRaw: boolean }` to bypass the XLM conversion and format the value as raw, grouped stroops (e.g., `formatStroops(10000000, true)` results in `"10,000,000 stroops"`). The zero case remains stable.

## Internationalization (groundwork)

User-facing copy is being centralized into a single typed catalog so a future
localization effort has one place to translate. This is **groundwork only** — no
i18n library is wired up yet and no rendered copy changes.

- **Single source of truth:** [`src/lib/messages.ts`](src/lib/messages.ts)
  exports a typed, namespaced `messages` object (one namespace per surface),
  mirroring the established pattern in
  [`src/app/pageTitles.ts`](src/app/pageTitles.ts). It is `as const`, so keys and
  literal values are fully typed and a typo on a key fails at compile time.
- **Consuming it:** import `messages` and read the string instead of hard-coding
  it inline:

  ```tsx
  import { messages } from "@/lib/messages";

  export function Footer() {
    return <footer>{messages.footer.text}</footer>;
  }
  ```

- **Migrated so far:** [`src/components/Footer.tsx`](src/components/Footer.tsx),
  the home page [`src/app/page.tsx`](src/app/page.tsx), the about page
  [`src/app/about/page.tsx`](src/app/about/page.tsx), the docs page
  [`src/app/docs/page.tsx`](src/app/docs/page.tsx), and the settings page
  [`src/app/settings/page.tsx`](src/app/settings/page.tsx). Follow the same pattern when
  touching other surfaces — add the string to a namespace in `messages.ts`, then
  reference it from the component.
- **Future i18n:** because the catalog is framework-agnostic, adopting
  `next-intl` / `next-i18next` later can wrap the same namespaced shape (e.g. a
  per-locale catalog keyed off `Messages`) without changing existing call sites.
- **Tests:** [`src/lib/__tests__/messages.test.ts`](src/lib/__tests__/messages.test.ts)
  asserts keys resolve, there are no duplicate key paths, unknown keys fail at
  the type level, and the migrated surfaces still render the exact original copy.

## Document titles

The root layout keeps the home route on the default `AgentPay` title and applies the template `"%s — AgentPay"` to route-specific titles.

| Route | Title |
|-------|-------|
| `/` | `AgentPay` |
| `/about` | `About AgentPay` |
| `/services` | `Services` |
| `/services/new` | `New service` |
| `/usage` | `Usage metering` |
| `/agents` | `Agents` |
| `/admin` | `Admin` |
| `/stats` | `Stats` |
| `/events` | `Event log` |
| `/webhooks` | `Webhooks` |
| `/api-keys` | `API keys` |
| `/search` | `Search` |
| `/services/[serviceId]` | `Service {serviceId}` |
| `/services/[serviceId]/edit` | `Edit service {serviceId}` |
| `/services/[serviceId]/agents` | `Top agents {serviceId}` |
| `/agents/[agent]` | `Agent {agent}` |

The `/about` page now exposes direct links to the dashboard surfaces described in its copy: `/services`, `/usage`, `/docs`, `/events`, `/webhooks`, `/api-keys`, and `/admin`.

## Form validation

Forms in the application (such as the New Service form `/services/new`) follow these validation and accessibility standards:
- **Shared Primitive Components:** Reusable input fields use the `TextField` component (`src/components/TextField.tsx`) and standard `Button` components.
- **Per-Field Validation Errors:** Local validation errors (e.g. invalid inputs or formatting issues verified via `src/lib/validateNumber.ts`) are passed directly to the `TextField`'s `error` prop. This flips `aria-invalid` to `true` and attaches the message using `aria-describedby` dynamically.
- **Page-Level Alerts:** Generic API errors and backend validation failures (e.g. `invalid_request`) are rendered at the page level inside a dedicated alert region with `role="alert"` so assistive technologies announce them immediately.

## Services list paging

The `/services` page now uses server-driven pagination with the shared `Spinner`, `EmptyState`, and `Pagination` components.

See also: `docs/theming.md` for the full theme system, anti-FOUC contract, and token architecture.


To prevent a flash of the wrong colour scheme (FOUC) when a user has chosen dark mode, a tiny blocking inline `<script>` is injected into `<head>` in `src/app/layout.tsx` **before the body renders**:
- Requests are sent as `GET /api/v1/services?page=N&limit=25`.
- The page assumes the backend returns a paged payload with `services` or `items`, plus `page` and `pageCount`.
- If the backend clamps an out-of-range request, the UI follows the server-provided `page` and `pageCount` so the visible indicator stays in sync.
- Service rows link through to `/services/:serviceId` using encoded IDs.

## Agents directory paging

The `/agents` page lists every agent identity seen by the backend, paginated with the same `Spinner`, `EmptyState`, and `Pagination` primitives used by the services page.

- A summary line (`X unique agent(s) seen across Y service(s)`) is loaded once from `GET /api/v1/stats` and shown above the directory. If that request fails the list still renders normally.
- Directory rows are fetched from `GET /api/v1/agents?page=N&limit=25`. The backend may return the array under either `agents` or `items`.
- Each row is a `<Link>` to `/agents/:agent` with the identifier fully `encodeURIComponent`-encoded, so agents with slashes or other special characters route correctly.
- `Pagination` hides itself automatically when `pageCount ≤ 1`, so no pagination bar appears for a single-page result.
- Backend errors are surfaced as a `role="alert"` paragraph; the pagination bar is suppressed while an error is shown.
- The single-agent view (`/agents/:agent`) utilizes a semantic `<Breadcrumb>` trail for accessible orientation.

## Service top-agents paging

The `/services/:serviceId/agents` page requests top agents with `page` and
`limit=25`, shows the shared `Spinner` while each page is loading, renders
`EmptyState` when no agents are returned, and uses the shared `Pagination`
component so the `aria-live` page indicator announces page changes. Agent rows
link to `/agents/:agent` with the agent identifier encoded.

## Commands

| Command                 | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `npm run build`         | Production build                                         |
| `npm test`              | Run Jest tests (no coverage)                             |
| `npm run test:coverage` | Run Jest with coverage — enforces all threshold gates    |
| `npm run test:watch`    | Run Jest in interactive watch mode (local dev)           |
| `npm run dev`           | Development server                                       |
| `npm run lint`          | Run ESLint                                               |
| `npm run typecheck`     | Run the TypeScript compiler                              |

See [docs/testing.md](docs/testing.md) for the full coverage reference — per-file thresholds, report locations, and how to read the terminal output.

## CI/CD

On push/PR to `main`, GitHub Actions runs:

- `npm ci`
- `npm run build`
- `npm test`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contributor workflow, branch naming convention, local checks, and UI accessibility expectations.

## License

MIT
