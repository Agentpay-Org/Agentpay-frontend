# Application architecture and route map

This document is the single source of truth for every route defined under `src/app/`. Each entry lists the page's purpose, whether it is a server component or a `"use client"` client component, the backend endpoints it calls, and the layout/title chain that renders it.

All routes documented here correspond to a real `page.tsx` file confirmed by `find src/app -name page.tsx`.

## Cross-cutting concerns

### Root layout (`src/app/layout.tsx`)

Every route is wrapped by the root layout, which provides:

- **ToastProvider** — global toast notification context.
- **Header** — site-wide navigation.
- **Footer** — global footer.
- **PageShell children** — the nested layout or `page.tsx` is rendered between Header and Footer.

### Pre-paint theme script

A blocking inline `<script>` is injected into `<head>` before the body renders. It reads the stored theme preference from `localStorage` (key `THEME_STORAGE_KEY`) and toggles the `dark` class on `<html>` synchronously. This prevents a flash of the wrong colour scheme (FOUC) before React hydration runs. The script is wrapped in `try/catch` for private-browsing environments that throw on storage access, and falls back to `prefers-color-scheme` when no valid stored value exists.

The root `<html>` element uses `suppressHydrationWarning` because the pre-paint script mutates the `class` attribute before React mounts.

### Per-route metadata

- **`src/app/pageTitles.ts`** — typed, `as const` map of static route titles and helper functions for dynamic routes (service ID, agent ID).
- **`src/app/seoMetadata.ts`** — classifies routes as `publicStaticRoutes` (crawled: `/`, `/about`, `/docs`, `/changelog`) and `operatorOnlyRoutes` (disallowed for crawlers: `/admin`, `/api-keys`, `/webhooks`, `/settings`).
- Individual `page.tsx` files may also export a `metadata` object when the title is route-specific and not covered by a parent layout.

### Data modules pattern

Some routes render from typed data modules rather than API endpoints to improve performance, enable SSG/SSR, and allow content reuse (e.g., SEO feeds, documentation surfaces).

- **`src/app/docs/endpoints.ts`** — API endpoint reference with types, descriptions, and curl examples. Used by `/docs` page.
- **`src/app/changelog/entries.ts`** — Changelog release entries with version, date, and notes. Used by `/changelog` page. Entries are sorted by date in the component to prevent ordering drift.

This pattern separates content from presentation, making it easier to:
- Add new entries without editing React components
- Validate entry shapes in tests
- Reuse data for RSS feeds, sitemaps, or other surfaces
- Enable static generation for better performance and SEO

### Nested layouts

Segments may define their own `layout.tsx` (invariably thin wrappers that return `children`) to override or compose section-level metadata. Where no nested `layout.tsx` exists, the route inherits the root layout directly.

---

## Route map

| Path | Route name | Render mode | Backend endpoints called | Nested layout / title source |
|------|-----------|-------------|-------------------------|------------------------------|
| `/` | Home | Server (no `"use client"`) | None — static landing with quick-link navigation | Root layout; title `AgentPay` (root default) |
| `/about` | About | Server (no `"use client"`) | None — static surface overview | Root layout; title `About — AgentPay` (exported from `page.tsx`) |
| `/admin` | Admin | Client (`"use client"`) | `GET /api/v1/admin/status`; `POST /api/v1/admin/pause`; `POST /api/v1/admin/unpause` | `admin/layout.tsx`; title `Admin` (`pageTitles.admin`) |
| `/agents` | Agents | Client (`"use client"`) | `GET /api/v1/stats`; `GET /api/v1/agents?page=N&limit=25` | `agents/layout.tsx`; title `Agents` (`pageTitles.agents`) |
| `/agents/:agent` | Agent detail | Client (`"use client"`) | `GET /api/v1/agents/:agent/usage`; `GET /api/v1/agents/:agent/total` | `agents/[agent]/layout.tsx`; title `Agent <agent>` (`agentTitle`) |
| `/api-keys` | API keys | Client (`"use client"`) | `GET /api/v1/api-keys`; `POST /api/v1/api-keys`; `DELETE /api/v1/api-keys/:prefix` | `api-keys/layout.tsx`; title `API keys` (`pageTitles.apiKeys`) |
| `/changelog` | Changelog | Server (no `"use client"`) | None — static release notes rendered from `src/app/changelog/entries.ts` data module | Root layout; title `Changelog — AgentPay` (exported from `page.tsx`) |
| `/docs` | Docs | Server (no `"use client"`) | None — static endpoint reference (links to `/api/v1/openapi.json`) | Root layout; title `Docs — AgentPay` (exported from `page.tsx`) |
| `/events` | Events | Client (`"use client"`) | `GET /api/v1/events?limit=100&type=<filter>` (with optional auto-refresh polling) | `events/layout.tsx`; title `Event log` (`pageTitles.events`) |
| `/export` | Export | Server (no `"use client"`) | None — browser navigates directly to backend URLs | Root layout; title `Export` (exported from `page.tsx`) |
| `/search` | Search | Client (`"use client"`) | `GET /api/v1/services?q=<query>&limit=50` (250ms debounced) | `search/layout.tsx`; title `Search` (`pageTitles.search`) |
| `/services` | Services | Client (`"use client"`) | `GET /api/v1/services?page=N&limit=25` | `services/layout.tsx`; title `Services` (`pageTitles.services`) |
| `/services/:serviceId` | Service detail | Client (`"use client"`) | `GET /api/v1/services/:serviceId`; `GET /api/v1/services/:serviceId/usage` | `services/[serviceId]/layout.tsx`; title `Service <serviceId>` (`serviceTitle`) |
| `/services/:serviceId/agents` | Service agents | Client (`"use client"`) | `GET /api/v1/services/:serviceId/agents/top?limit=25` | `services/[serviceId]/agents/layout.tsx`; title `Top agents <serviceId>` (`serviceAgentsTitle`) |
| `/services/:serviceId/edit` | Edit service price with prefill loading, unsaved-changes guard (`beforeunload` + Back-link confirm), success toast | Client (`"use client"`) | `GET /api/v1/services/:serviceId`; `PATCH /api/v1/services/:serviceId/price` | `services/[serviceId]/edit/layout.tsx`; title `Edit service <serviceId>` (`serviceEditTitle`) |
| `/services/new` | New service | Client (`"use client"`) | `POST /api/v1/services` | `services/new/layout.tsx`; title `New service` (`pageTitles.serviceNew`) |
| `/settings` | Settings | Server (no `"use client"`) | None — renders `ThemeToggle` client component only | Root layout; title `Settings — AgentPay` (exported from `page.tsx`) |
| `/stats` | Stats | Client (`"use client"`) | `GET /api/v1/stats` (polled every 5 s) | `stats/layout.tsx`; title `Stats` (`pageTitles.stats`) |
| `/usage` | Usage metering | Client (`"use client"`) | `POST /api/v1/usage`; `GET /api/v1/usage/:agent/:serviceId` | `usage/layout.tsx`; title `Usage metering` (`pageTitles.usage`) |
| `/webhooks` | Webhooks | Client (`"use client"`) | `GET /api/v1/webhooks`; `POST /api/v1/webhooks`; `DELETE /api/v1/webhooks/:id` | `webhooks/layout.tsx`; title `Webhooks` (`pageTitles.webhooks`) |

### Title source summary

Titles fall into three categories:

1. **Root default** — `/` inherits the root layout's default `AgentPay` title because it does not export metadata.
2. **Page-exported metadata** — `/about`, `/docs`, `/export`, `/settings`, and `/changelog` export `metadata` directly from `page.tsx` with a fixed string.
3. **Layout-exported metadata** — all other routes use a nested `layout.tsx` that sets `metadata.title` from `pageTitles.ts` or dynamically via `generateMetadata` for dynamic segments (`/services/:serviceId`, `/agents/:agent`).

---

## Backend endpoint index

This index groups the endpoints referenced by the frontend so reviewers can audit API surface quickly.

| Method | Path | Consumed by |
|--------|------|-------------|
| `GET` | `/api/v1/stats` | `/agents` (summary), `/stats` (poll) |
| `GET` | `/api/v1/agents?page=N&limit=25` | `/agents` (paged list) |
| `GET` | `/api/v1/agents/:agent/usage` | `/agents/:agent` (service breakdown) |
| `GET` | `/api/v1/agents/:agent/total` | `/agents/:agent` (lifetime count) |
| `GET` | `/api/v1/services?page=N&limit=25` | `/services` (paged list) |
| `GET` | `/api/v1/services?q=<query>&limit=50` | `/search` (filtered query) |
| `GET` | `/api/v1/services/:serviceId` | `/services/:serviceId`, `/services/:serviceId/edit` |
| `GET` | `/api/v1/services/:serviceId/usage` | `/services/:serviceId` (rollup) |
| `GET` | `/api/v1/services/:serviceId/agents/top?limit=25` | `/services/:serviceId/agents` |
| `POST` | `/api/v1/services` | `/services/new` (create) |
| `PATCH` | `/api/v1/services/:serviceId/price` | `/services/:serviceId/edit` (update price) |
| `POST` | `/api/v1/usage` | `/usage` (record) |
| `GET` | `/api/v1/usage/:agent/:serviceId` | `/usage` (query total) |
| `GET` | `/api/v1/events?limit=100&type=<filter>` | `/events` (polled / filtered) |
| `GET` | `/api/v1/admin/status` | `/admin` (read pause flag) |
| `POST` | `/api/v1/admin/pause` | `/admin` (toggle pause) |
| `POST` | `/api/v1/admin/unpause` | `/admin` (toggle unpause) |
| `GET` | `/api/v1/api-keys` | `/api-keys` (list keys) |
| `POST` | `/api/v1/api-keys` | `/api-keys` (create key) |
| `DELETE` | `/api/v1/api-keys/:prefix` | `/api-keys` (revoke key) |
| `GET` | `/api/v1/webhooks` | `/webhooks` (list) |
| `POST` | `/api/v1/webhooks` | `/webhooks` (register) |
| `DELETE` | `/api/v1/webhooks/:id` | `/webhooks` (remove) |
| `GET` | `/api/v1/usage/export.json` | `/export` (direct browser download) |
| `GET` | `/api/v1/usage/export.csv` | `/export` (direct browser download) |

---

## Public vs operator-only surfaces

`src/app/seoMetadata.ts` classifies routes for sitemap and robots generation.

- **Public static routes** (crawled): `/`, `/about`, `/docs`, `/changelog`
- **Operator-only routes** (disallowed for crawlers): `/admin`, `/api-keys`, `/webhooks`, `/settings`

All other pages are dynamic and omitted from the static sitemap because they are driven by API responses rendered at request time.

---

## Validation note

The route list above was cross-checked against the filesystem on 2026-06-28:

```bash
find src/app -name page.tsx
```

Every path in the table maps to a real `page.tsx`. The server/client designation was validated by inspecting the presence (or absence) of `"use client"` at the top of each file.

---

## Bundle budgets

Every route has a **first-load JS budget** defined in [`bundle-budgets.json`](../bundle-budgets.json) at the repository root.

### How it works

1. After `next build` completes, [`scripts/check-bundle-budgets.mjs`](../scripts/check-bundle-budgets.mjs) parses the build output table to extract each route's `First Load JS` value.
2. Each value is compared against the route's budget in `bundle-budgets.json`.
3. Budget status is determined as:

   | Usage % | Status |
   |---------|--------|
   | `< 90%` | ✅ ok |
   | `≥ 90%` | ⚠️ warn (comment only, does not fail) |
   | `> 100%` | ❌ fail (exits with code 1) |

4. A `bundle-report.json` artifact is uploaded alongside the coverage report.
5. On pull requests, the per-route comparison is posted as a PR comment merged with the coverage summary.

### Budget config (`bundle-budgets.json`)

- **`routes`** — a flat map of route pattern → budget in kB. Dynamic segments use the filesystem convention (`[agent]`, `[serviceId]`).
- **`_meta.warn_at_pct`** — the percentage threshold at which a route is flagged as a warning (default `90`).
- **`_meta.unit`** — the size unit (always `kB`).

### Raising a budget

Budgets should be set to the current baseline when first introduced. To raise a budget:

1. Edit `bundle-budgets.json` in a dedicated PR.
2. The PR review serves as the explicit decision to accept the increase.
3. Once merged, the new ceiling applies to all subsequent builds.

### When budgets are added for new routes

When a new `page.tsx` is added under `src/app/`:

1. Run `npm run build` locally.
2. Note the `First Load JS` value for the new route.
3. Add an entry to the `routes` map in `bundle-budgets.json`.
4. Include this entry in the same PR that introduces the route.

### CI integration

See `.github/workflows/ci.yml` for the full pipeline. Key steps:

```yaml
- name: Build
  run: npm run build

- name: Check bundle budgets
  run: node scripts/check-bundle-budgets.mjs
  continue-on-error: true

- name: Upload bundle report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: bundle-report
    path: bundle-report.json
```
