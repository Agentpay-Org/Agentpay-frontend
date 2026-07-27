---
type: Feature
title: "Add a reusable agents directory listing on the Agents page with drill-down links"
labels: type:feature, area:agents, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Implement an agents directory listing on the Agents page with drill-down links

### Description
[`src/app/agents/page.tsx`](src/app/agents/page.tsx) currently only reads `/api/v1/stats` and renders a placeholder paragraph that literally says "Per-agent listing follows in the next commit." Meanwhile [`src/app/agents/[agent]/page.tsx`](src/app/agents/[agent]/page.tsx) already exists and can render a single agent's per-service usage, but there is no way to reach it from the UI because no list of agents is rendered. This issue replaces the placeholder with a real, paginated directory of agents whose rows link to the detail page.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Fetch the agent directory (e.g. `GET /api/v1/agents?limit=…&page=…`) and render each agent as a Next.js `<Link>` to `/agents/${encodeURIComponent(agent)}`.
- Reuse existing primitives: [`src/components/Pagination.tsx`](src/components/Pagination.tsx) for paging, [`src/components/EmptyState.tsx`](src/components/EmptyState.tsx) for the no-agents case, and [`src/components/Spinner.tsx`](src/components/Spinner.tsx) for the loading state — do not hand-roll a `Loading…` string.
- Keep the existing stats summary line but remove the "follows in the next commit" placeholder text.
- Handle the error path with a `role="alert"` message consistent with the other pages.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/agents-01-directory-listing`
- Implement changes
  - **Write code in:** [`src/app/agents/page.tsx`](src/app/agents/page.tsx) — list fetch, pagination state, and `<Link>` rows.
  - **Write comprehensive tests in:** create `src/app/agents/page.test.tsx` — mock `apiGet`, assert rows render as links, empty state shows, and error renders `role="alert"`.
  - **Add documentation:** update [`README.md`](README.md) project-structure/notes to mention the agents directory.
  - Add JSDoc to any new helper and a short comment on the pagination wiring.
  - Validate a11y: rows are real links, list uses a `<ul>`/`<ol>`, focus-visible rings preserved.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: empty directory, single page (Pagination hidden), backend error, and very long agent identifiers (no overflow).
- Paste the `npm test` output and a short note on the API shape you assumed.

### Example commit message
`feat(agents): add paginated agents directory with drill-down links and tests`

### Guidelines
- **Minimum 95 percent test coverage** for the changed page.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Route the Usage page through the shared apiClient instead of raw fetch"
labels: type:enhancement, area:usage, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Refactor the Usage page to use the shared apiClient instead of raw fetch

### Description
[`src/app/usage/page.tsx`](src/app/usage/page.tsx) is the only feature page that re-declares `API_BASE` and calls `fetch()` directly instead of using the centralised [`src/lib/apiClient.ts`](src/lib/apiClient.ts) helpers (`apiPost`, `apiGet`). This duplicates base-URL resolution, content-type headers, and the `res.ok` error-unwrapping logic, and it diverges from every other page (services, agents, admin, etc.). This issue migrates both the "Record usage" and "Query usage" flows onto `apiPost`/`apiGet` while preserving the existing validation and `role="status"`/`role="alert"` behaviour.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Replace the local `API_BASE` constant and both `fetch()` calls with `apiPost<{ total: number }>("/api/v1/usage", …)` and `apiGet<QueryResult>(…)`.
- Preserve the positive-integer guard on `requests` and the typed `status`/`queryResult` state machine.
- Map thrown `ApiError`/`Error` messages onto the existing alert paragraphs — do not swallow `requestId`.
- Do not regress the existing tests in [`src/app/usage/page.test.tsx`](src/app/usage/page.test.tsx); update mocks to the apiClient surface if needed.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/usage-02-shared-apiclient`
- Implement changes
  - **Write code in:** [`src/app/usage/page.tsx`](src/app/usage/page.tsx) — swap raw fetch for apiClient helpers.
  - **Write comprehensive tests in:** [`src/app/usage/page.test.tsx`](src/app/usage/page.test.tsx) — mock `@/lib/apiClient`, assert success total, backend error alert, and the non-integer guard still blocks the call.
  - **Add documentation:** add a short JSDoc note in `apiClient.ts` if you extend its surface.
  - Validate that no second `API_BASE` definition remains in the tree.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: 204/no-body responses, network rejection, and a backend `invalid_request` payload.
- Include the `npm test` output and confirm the existing four usage tests still pass.

### Example commit message
`refactor(usage): route record/query flows through shared apiClient`

### Guidelines
- **Minimum 95 percent test coverage** for the changed page.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add request timeout and AbortController support to the API client"
labels: type:feature, area:api-client, stack:nextjs, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Implement request timeout and AbortController support in apiFetch

### Description
[`src/lib/apiClient.ts`](src/lib/apiClient.ts) wraps `fetch()` but has no timeout: a hung backend leaves every page (services, agents, stats, changelog) spinning on `Loading…` forever, with no way to cancel an in-flight request. This issue adds a configurable timeout via `AbortController` and lets callers pass their own `signal`, so the React hooks and pages can abort on unmount or navigation.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Add an optional `timeoutMs` (default e.g. 10000) to `apiFetch`; wire an internal `AbortController` and clear the timer in a `finally`.
- Respect a caller-supplied `init.signal` by combining it with the internal one (or documenting precedence) so [`src/lib/useApi.ts`](src/lib/useApi.ts) can abort on cleanup.
- Throw a typed, distinguishable timeout error (e.g. message `"request timed out"`) rather than a generic `AbortError`, so call sites can show a clear message.
- Keep the 204 handling and existing `ApiError` unwrapping intact.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/api-client-03-timeout-abort`
- Implement changes
  - **Write code in:** [`src/lib/apiClient.ts`](src/lib/apiClient.ts) — `AbortController`, timer, signal merge, typed timeout error.
  - **Write comprehensive tests in:** create `src/lib/__tests__/apiClient.test.ts` — fake timers + mocked `fetch`, assert timeout rejects with the typed error, caller abort propagates, and success path is unchanged.
  - **Add documentation:** document the `timeoutMs`/`signal` options with a JSDoc block on `apiFetch`.
  - Validate that aborting does not leave dangling timers.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: timeout before response, caller abort, immediate 204, and a non-JSON error body.
- Paste the `npm test` output and a short note on signal-precedence semantics.

### Example commit message
`feat(api-client): add request timeout and AbortController support with tests`

### Guidelines
- **Minimum 95 percent test coverage** for `apiClient.ts`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Complete the primary navigation so every route is reachable from the header"
labels: type:enhancement, area:navigation, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve the header navigation to expose all dashboard routes

### Description
[`src/components/Header.tsx`](src/components/Header.tsx) hard-codes only six links (Home, Services, Usage, Agents, Search, Admin), yet the app ships pages for API keys, webhooks, events, stats, settings, docs, export, about, and changelog under [`src/app/`](src/app) that are currently unreachable except by typing the URL. This issue restructures the nav so all primary routes are discoverable, grouping secondary links sensibly and marking the active route.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Add the missing routes (`/api-keys`, `/webhooks`, `/events`, `/stats`, `/settings`, `/docs`) to the nav; keep `Main navigation` `aria-label`.
- Mark the current route with `aria-current="page"` using `usePathname()` (the component becomes a client component) without breaking server rendering of the layout.
- Avoid an unusably wide nav on small screens — collapse secondary links into a details/menu or wrap responsively; the existing focus-visible rings must be preserved.
- Keep the existing Header test green and extend it.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/navigation-04-complete-header`
- Implement changes
  - **Write code in:** [`src/components/Header.tsx`](src/components/Header.tsx) — expanded link set, active-route marking, responsive layout.
  - **Write comprehensive tests in:** [`src/components/__tests__/Header.test.tsx`](src/components/__tests__/Header.test.tsx) — assert all routes render and the active link carries `aria-current` (mock `next/navigation`).
  - **Add documentation:** update the routes table/notes in [`README.md`](README.md).
  - Validate keyboard order and that the menu is operable without a pointer.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: deep routes like `/services/[serviceId]/edit` marking the Services parent, and narrow-viewport rendering.
- Include the `npm test` output and a screenshot or note on the responsive behaviour.

### Example commit message
`feat(navigation): expose all routes in header with active-state and tests`

### Guidelines
- **Minimum 95 percent test coverage** for the Header component.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add a settlement quote screen backed by POST /api/v1/settle"
labels: type:feature, area:settlement, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Implement a settlement quote screen backed by POST /api/v1/settle

### Description
The docs page at [`src/app/docs/page.tsx`](src/app/docs/page.tsx) documents `POST /api/v1/settle` ("Drain the accumulator and return `{ requests, priceStroops, billedStroops }`"), and the About page promises a "billing quotes" surface — but no page in [`src/app/`](src/app) actually calls `/api/v1/settle`. This issue adds a `/settle` screen where an operator enters an agent + serviceId, previews the bill, and confirms settlement.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Create `src/app/settle/page.tsx` (client component) with a form for `agent` and `serviceId`, using [`src/components/TextField.tsx`](src/components/TextField.tsx) and [`src/components/Button.tsx`](src/components/Button.tsx).
- Call `apiPost("/api/v1/settle", { agent, serviceId })` via [`src/lib/apiClient.ts`](src/lib/apiClient.ts); render the returned `requests`/`priceStroops`/`billedStroops` using [`src/lib/format.ts`](src/lib/format.ts) (`formatStroops`, `formatRequests`).
- Gate the destructive action behind [`src/components/ConfirmDialog.tsx`](src/components/ConfirmDialog.tsx) since settlement drains the counter.
- Surface success via [`src/components/ToastProvider.tsx`](src/components/ToastProvider.tsx) (`useToast`) and errors via `role="alert"`.
- Add the route to the header (coordinate with the navigation work).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/settlement-05-settle-screen`
- Implement changes
  - **Write code in:** create `src/app/settle/page.tsx`.
  - **Write comprehensive tests in:** create `src/app/settle/page.test.tsx` — mock apiClient, assert quote renders formatted, confirm dialog gates the call, and errors alert.
  - **Add documentation:** add the Settle flow to [`README.md`](README.md) and cross-link from [`src/app/docs/page.tsx`](src/app/docs/page.tsx).
  - JSDoc the page-level helpers; validate the confirm flow is keyboard operable.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: zero outstanding requests, paused backend rejection, and unknown agent/service.
- Include the `npm test` output and a note on the assumed response shape.

### Example commit message
`feat(settlement): add settle quote-and-confirm screen with tests and docs`

### Guidelines
- **Minimum 95 percent test coverage** for the new page.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Paginate the services list and reuse the shared Pagination component"
labels: type:feature, area:services, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Implement pagination on the services list using the shared Pagination component

### Description
[`src/app/services/page.tsx`](src/app/services/page.tsx) fetches `/api/v1/services` and renders every service in one unbounded `<ul>`, with no paging and a hand-rolled `Loading…` string. The repo already ships [`src/components/Pagination.tsx`](src/components/Pagination.tsx) (currently unused anywhere) plus [`src/components/EmptyState.tsx`](src/components/EmptyState.tsx) and [`src/components/Spinner.tsx`](src/components/Spinner.tsx). This issue adds server-driven pagination and wires those primitives in.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Add `page`/`pageCount` state and request `?page=…&limit=…`; render [`Pagination`](src/components/Pagination.tsx) below the list (it self-hides when `pageCount <= 1`).
- Replace the `Loading…` text with [`Spinner`](src/components/Spinner.tsx) and the empty branch with [`EmptyState`](src/components/EmptyState.tsx) including a "New service" action.
- Make each service row a `<Link>` to `/services/${encodeURIComponent(serviceId)}` (it is currently non-clickable plain text).
- Preserve the `role="alert"` error path and the `New service` header button.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/services-06-list-pagination`
- Implement changes
  - **Write code in:** [`src/app/services/page.tsx`](src/app/services/page.tsx).
  - **Write comprehensive tests in:** create `src/app/services/page.test.tsx` — mock apiClient, assert Pagination appears only with multiple pages, page change refetches, empty state renders, and rows link.
  - **Add documentation:** note the list paging behaviour in [`README.md`](README.md).
  - Validate the `aria-live` page indicator inside Pagination announces changes.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: single page, last page (Next disabled), and an out-of-range page request.
- Include the `npm test` output and a note on the assumed pagination contract.

### Example commit message
`feat(services): paginate list and reuse Pagination/EmptyState/Spinner with tests`

### Guidelines
- **Minimum 95 percent test coverage** for the changed page.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add live filtering and auto-refresh controls to the event log"
labels: type:feature, area:events, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Implement event-type filtering and auto-refresh on the event log page

### Description
[`src/app/events/page.tsx`](src/app/events/page.tsx) fetches the latest 100 events once on mount and dumps them as raw `JSON.stringify` blocks with no way to filter by `type` or to refresh without a full reload. This issue adds a type filter (using the existing [`SearchBar`](src/components/SearchBar.tsx) or a select) plus an opt-in auto-refresh interval, modelled on the polling pattern already in [`src/app/stats/page.tsx`](src/app/stats/page.tsx).

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Add a debounced filter input (reuse [`src/lib/useDebounce.ts`](src/lib/useDebounce.ts)) that filters the rendered events by `type` client-side, or passes `?type=` if the backend supports it.
- Add an auto-refresh toggle (default off) that re-fetches on an interval and is cleaned up on unmount (mirror the `cancelled` + `clearInterval` pattern in stats).
- Render each event's timestamp with [`src/components/TimeAgo.tsx`](src/components/TimeAgo.tsx) alongside the existing ISO string in a `<time>`.
- Use [`EmptyState`](src/components/EmptyState.tsx) when no events match the filter.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/events-07-filter-autorefresh`
- Implement changes
  - **Write code in:** [`src/app/events/page.tsx`](src/app/events/page.tsx).
  - **Write comprehensive tests in:** create `src/app/events/page.test.tsx` — fake timers, assert filtering hides non-matching rows, toggle starts/stops polling, and cleanup clears the interval.
  - **Add documentation:** describe filtering/auto-refresh in [`README.md`](README.md).
  - Validate the toggle has an accessible label and `aria-pressed`.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: empty filter result, polling teardown on unmount, and malformed payloads.
- Include the `npm test` output and a note on the polling interval chosen.

### Example commit message
`feat(events): add type filter and opt-in auto-refresh with tests`

### Guidelines
- **Minimum 95 percent test coverage** for the changed page.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Show full service metadata on the service detail page using KeyValueGrid and Badge"
labels: type:feature, area:services, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve the service detail page with KeyValueGrid, Badge, and a copy action

### Description
[`src/app/services/[serviceId]/page.tsx`](src/app/services/[serviceId]/page.tsx) renders a bespoke two-cell `<dl>` for price and a usage rollup, displaying the raw `priceStroops` integer with no XLM conversion and offering no way to copy the service id. The repo already ships [`KeyValueGrid`](src/components/KeyValueGrid.tsx), [`Badge`](src/components/Badge.tsx), [`CopyButton`](src/components/CopyButton.tsx), and [`formatStroops`](src/lib/format.ts) that this page should use. This issue rebuilds the detail panel on those primitives.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Replace the hand-rolled grid with [`KeyValueGrid`](src/components/KeyValueGrid.tsx) rows: Service ID (with a [`CopyButton`](src/components/CopyButton.tsx)), Price (rendered via [`formatStroops`](src/lib/format.ts) plus the raw stroops), and the optional usage rollup.
- Add a [`Badge`](src/components/Badge.tsx) reflecting whether usage data was available (`ok`) or absent (`neutral`).
- Keep the existing optional-rollup error swallow and the Edit/Top-agents links intact.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/services-08-detail-metadata`
- Implement changes
  - **Write code in:** [`src/app/services/[serviceId]/page.tsx`](src/app/services/[serviceId]/page.tsx).
  - **Write comprehensive tests in:** create `src/app/services/[serviceId]/page.test.tsx` — mock apiClient + `next/navigation`, assert formatted price renders, copy button present, and rollup-missing branch.
  - **Add documentation:** note formatting conventions in [`README.md`](README.md).
  - Validate the copy button's `aria-live` feedback.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: zero price (`0 XLM`), sub-cent price (stroops fallback), and rollup endpoint failure.
- Include the `npm test` output.

### Example commit message
`feat(services): render service detail with KeyValueGrid, Badge, and copy action`

### Guidelines
- **Minimum 95 percent test coverage** for the changed page.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Document the API integration contract consumed by the dashboard"
labels: type:docs, area:docs, stack:nextjs, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Document the backend API contract the dashboard depends on

### Description
The frontend calls a wide set of backend endpoints from [`src/lib/apiClient.ts`](src/lib/apiClient.ts) and the pages — `/api/v1/services`, `/api/v1/usage`, `/api/v1/stats`, `/api/v1/admin/*`, `/api/v1/api-keys`, `/api/v1/webhooks`, `/api/v1/events`, `/api/v1/changelog`, `/api/v1/agents/*`, `/api/v1/usage/export.{json,csv}` — but the request/response shapes the UI assumes (e.g. `{ services: Service[] }`, `{ paused: boolean }`, the `ApiError` envelope) are scattered across TypeScript types in individual files with no single reference. The prose in [`src/app/docs/page.tsx`](src/app/docs/page.tsx) covers only five endpoints. This issue produces a complete integration reference.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Create `docs/api-integration.md` cataloguing every endpoint the dashboard calls, with the exact request body and the response shape the UI expects (derived from the inline `type` declarations in each page).
- Document the shared `ApiError` envelope (`{ error, message, requestId? }`) and the 204/no-body handling from [`src/lib/apiClient.ts`](src/lib/apiClient.ts).
- Note which calls are reads vs mutations and which are gated by the admin pause flag.
- Cross-link this doc from [`src/app/docs/page.tsx`](src/app/docs/page.tsx) and [`README.md`](README.md).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/docs-09-api-integration`
- Implement changes
  - **Write code in:** create `docs/api-integration.md` (docs only).
  - **Write comprehensive tests in:** not applicable; instead grep the codebase to confirm every documented endpoint string actually appears in [`src/app/`](src/app) or [`src/lib/`](src/lib).
  - **Add documentation:** this issue is the documentation.
  - Validate each documented type matches the `type` declared in the corresponding page.
- Test and commit

### Test and commit
- Run `npm run lint` and `npm run build` to confirm no references break.
- Cross-check every endpoint path against the source via search.
- Include a note confirming the documented shapes match the in-code types.

### Example commit message
`docs(api): add complete dashboard API integration reference`

### Guidelines
- Accuracy over completeness; every shape must match the code.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Reveal-once API key display with masking and copy-to-clipboard"
labels: type:feature, area:api-keys, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Implement a reveal-once API key panel with masking and copy action

### Description
When a key is created, [`src/app/api-keys/page.tsx`](src/app/api-keys/page.tsx) renders the secret inline as plain `<code>{created}</code>` with no copy button and leaves it on screen indefinitely. This is both a usability gap (operators copy by hand) and a shoulder-surfing risk. This issue adds a masked-by-default reveal panel with a [`CopyButton`](src/components/CopyButton.tsx) and an explicit dismiss.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Render the new key masked by default (e.g. `sk_••••`), with a "Reveal" toggle and a [`CopyButton`](src/components/CopyButton.tsx) bound to the full value.
- Add a "Done — I've saved it" button that clears the `created` state so the secret leaves the DOM.
- Keep the existing "shown only once" warning and the `role="status"` region.
- Do not log the secret anywhere; ensure it is not placed in any URL.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/api-keys-10-reveal-once`
- Implement changes
  - **Write code in:** [`src/app/api-keys/page.tsx`](src/app/api-keys/page.tsx); reuse [`src/components/CopyButton.tsx`](src/components/CopyButton.tsx).
  - **Write comprehensive tests in:** create `src/app/api-keys/page.test.tsx` — mock apiClient + clipboard, assert masked render, reveal toggle, copy writes the value, and dismiss removes it.
  - **Add documentation:** add a security note in [`README.md`](README.md) about reveal-once handling.
  - Validate the toggle's `aria-pressed` and that copy uses `navigator.clipboard` guarded like the existing component.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: clipboard unavailable, dismiss before copy, and creation error.
- Include the `npm test` output.

### Example commit message
`feat(api-keys): reveal-once key panel with masking and copy action`

### Guidelines
- **Minimum 95 percent test coverage** for the changed page.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Confirm-before-revoke for API keys and webhooks using the shared dialog"
labels: type:feature, area:api-keys, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Add a confirmation step before deleting API keys and webhooks

### Description
[`src/app/api-keys/page.tsx`](src/app/api-keys/page.tsx) revokes a key the instant "Revoke" is clicked, and [`src/app/webhooks/page.tsx`](src/app/webhooks/page.tsx) deletes a webhook on the first click of "Remove" — both destructive and irreversible, with no confirmation. The repo already ships [`ConfirmDialog`](src/components/ConfirmDialog.tsx) (currently unused). This issue gates both deletions behind it.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Wire [`ConfirmDialog`](src/components/ConfirmDialog.tsx) into both pages: clicking Revoke/Remove opens the dialog naming the target; only Confirm performs the `apiDelete`.
- Show a success [`toast`](src/components/ToastProvider.tsx) and refresh the list on success; surface failures via the existing `role="alert"`.
- Keep the dialog dismissible via Cancel and ensure the originating button regains focus when it closes (coordinate with the dialog-a11y issue if landed).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/api-keys-11-confirm-before-revoke`
- Implement changes
  - **Write code in:** [`src/app/api-keys/page.tsx`](src/app/api-keys/page.tsx) and [`src/app/webhooks/page.tsx`](src/app/webhooks/page.tsx).
  - **Write comprehensive tests in:** create `src/app/api-keys/page.test.tsx` and `src/app/webhooks/page.test.tsx` — assert Cancel makes no call, Confirm deletes and refreshes, and error path alerts.
  - **Add documentation:** note the confirm step in [`README.md`](README.md).
  - Validate `role="dialog"` / `aria-modal` semantics are reached.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: delete failure, double-confirm prevention, and empty list after deletion.
- Include the `npm test` output.

### Example commit message
`feat(api-keys): gate key/webhook deletion behind ConfirmDialog with tests`

### Guidelines
- **Minimum 95 percent test coverage** for the changed pages.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Author a component catalog documenting the shared UI primitives and their props"
labels: type:docs, area:docs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Document the shared UI component catalog and prop contracts

### Description
The repo ships ~20 reusable primitives under [`src/components/`](src/components) — [`Button`](src/components/Button.tsx), [`TextField`](src/components/TextField.tsx), [`Card`](src/components/Card.tsx), [`Badge`](src/components/Badge.tsx), [`StatTile`](src/components/StatTile.tsx), [`Pagination`](src/components/Pagination.tsx), [`ConfirmDialog`](src/components/ConfirmDialog.tsx), [`ToastProvider`](src/components/ToastProvider.tsx), and others — but several are undocumented and some (Pagination, ConfirmDialog, StatTile, KeyValueGrid) are not yet used anywhere, so contributors don't know they exist or how to compose them. This issue produces a single catalog so future work reuses primitives instead of re-implementing them.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Create `docs/components.md` listing every component in [`src/components/`](src/components) with: purpose, prop table (name, type, default), variants, accessibility notes (e.g. `Button`/`TextField` focus rings, `Badge` variants, `StatTile` trend logic), and a minimal usage snippet.
- Call out the currently-unused primitives and where they should be adopted (cross-reference the relevant feature issues).
- Add JSDoc `/** … */` headers to any component file currently missing one so the catalog and source agree.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/docs-12-component-catalog`
- Implement changes
  - **Write code in:** create `docs/components.md`; add missing JSDoc headers in [`src/components/`](src/components).
  - **Write comprehensive tests in:** not applicable; instead confirm each documented prop matches the component's TypeScript props type.
  - **Add documentation:** this issue is the documentation; link it from [`README.md`](README.md).
  - Validate every snippet compiles against the real props.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm run build`.
- Cross-check each prop table against the component's `type`/interface in source.
- Include a note confirming the catalog covers every file in [`src/components/`](src/components).

### Example commit message
`docs(components): add shared UI component catalog with prop contracts`

### Guidelines
- Accuracy over completeness; prop tables must match the source types.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Validate and harden the webhook registration form before submit"
labels: type:enhancement, area:webhooks, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve webhook form validation and event-name handling

### Description
[`src/app/webhooks/page.tsx`](src/app/webhooks/page.tsx) accepts any `type="url"` string and a free-text comma-separated events field, then posts it directly. There is no validation that the URL is `https`, no de-duplication of event names, and no guard against an empty event list after trimming. This issue adds client-side validation before the `apiPost` call and clearer field-level feedback using [`TextField`](src/components/TextField.tsx).

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Validate the URL is a well-formed `https://` URL (reject `http`/`javascript:`); show a field error via [`TextField`](src/components/TextField.tsx)'s `error` prop.
- Normalise the events CSV: trim, drop empties, de-duplicate, and block submit if the resulting list is empty.
- Keep the existing list rendering and per-item Remove button working.
- Do not weaken the `required` attributes; validation augments, not replaces, them.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/webhooks-13-form-validation`
- Implement changes
  - **Write code in:** [`src/app/webhooks/page.tsx`](src/app/webhooks/page.tsx); migrate inputs to [`src/components/TextField.tsx`](src/components/TextField.tsx).
  - **Write comprehensive tests in:** create `src/app/webhooks/page.test.tsx` — assert `http://` rejected, empty-events blocked, duplicate events collapsed, and valid submit posts the normalised payload.
  - **Add documentation:** document accepted URL schemes in [`README.md`](README.md).
  - Validate `aria-invalid`/`aria-describedby` wiring from TextField.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: trailing commas, whitespace-only events, and a malformed URL.
- Include the `npm test` output.

### Example commit message
`feat(webhooks): validate https url and normalise event list before submit`

### Guidelines
- **Minimum 95 percent test coverage** for the changed page.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Adopt the useApi hook across data-fetching pages to remove duplicated state machines"
labels: type:refactor, area:api-client, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Refactor list pages to use the useApi hook

### Description
[`src/lib/useApi.ts`](src/lib/useApi.ts) implements a clean `loading | error | ok` state machine with cancellation, yet no page imports it — instead [`src/app/services/page.tsx`](src/app/services/page.tsx), [`src/app/events/page.tsx`](src/app/events/page.tsx), and [`src/app/changelog/page.tsx`](src/app/changelog/page.tsx) each re-implement `useState` + `useEffect` + manual error handling. This issue consolidates the simplest read-only pages onto `useApi`, reducing duplication and getting cancellation for free.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Migrate at least the changelog and events list fetches to `useApi<T>(path)` and branch on `state.status`.
- Render `loading` with [`Spinner`](src/components/Spinner.tsx), `error` with `role="alert"`, and `ok` with the existing list markup.
- Do not change observable behaviour for the happy path; only the implementation.
- Leave pages that need polling or mutations (stats, admin, usage) as-is for this issue.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/api-client-14-adopt-useapi`
- Implement changes
  - **Write code in:** [`src/app/changelog/page.tsx`](src/app/changelog/page.tsx) and [`src/app/events/page.tsx`](src/app/events/page.tsx) (and others where trivial).
  - **Write comprehensive tests in:** create `src/app/changelog/page.test.tsx` — mock `@/lib/apiClient`, assert loading→ok and loading→error transitions.
  - **Add documentation:** add a usage example to a JSDoc block in [`src/lib/useApi.ts`](src/lib/useApi.ts).
  - Validate the cancellation cleanup is exercised by an unmount test.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: unmount during fetch (no state-after-unmount warning), error message fallback, and empty data.
- Include the `npm test` output.

### Example commit message
`refactor(pages): adopt useApi hook for read-only list pages with tests`

### Guidelines
- **Minimum 95 percent test coverage** for the changed modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add unit tests for the apiClient request helpers and error unwrapping"
labels: type:test, area:testing, stack:nextjs, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the apiClient request helpers and ApiError unwrapping

### Description
[`src/lib/apiClient.ts`](src/lib/apiClient.ts) is the single point through which most pages talk to the backend, yet it has no tests — its 204 handling, JSON parsing, `res.ok` failure path that throws an enriched `ApiError`, and the `apiGet/apiPost/apiPatch/apiDelete` wrappers are all unverified. This issue adds a focused test suite around the fetch wrapper.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Mock `globalThis.fetch` (as done in [`src/app/usage/page.test.tsx`](src/app/usage/page.test.tsx)) and assert: base-URL prefixing, default `Content-Type` header, 204 returning `undefined`, and a non-OK response throwing an error carrying `error`/`message`/`requestId`.
- Verify each wrapper sends the correct method and JSON-stringified body.
- Cover `NEXT_PUBLIC_AGENTPAY_API_BASE` override vs the localhost default.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-15-apiclient-unit`
- Implement changes
  - **Write code in:** no source change expected (file a follow-up if a bug is found).
  - **Write comprehensive tests in:** create `src/lib/__tests__/apiClient.test.ts`.
  - **Add documentation:** none beyond test descriptions.
  - Validate the thrown object is an `Error` instance with merged `ApiError` fields.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: empty body on error, header override merge, and DELETE returning 204.
- Include the `npm test` output and the coverage summary for `apiClient.ts`.

### Example commit message
`test(api-client): cover request helpers and ApiError unwrapping`

### Guidelines
- **Minimum 95 percent test coverage** for `apiClient.ts`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the useLocalState hook including SSR-safe hydration"
labels: type:test, area:testing, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the useLocalState hook hydration and write paths

### Description
[`src/lib/useLocalState.ts`](src/lib/useLocalState.ts) backs state with `localStorage` and swallows JSON parse/write errors, but it has no test coverage — the hydration effect, the malformed-JSON fallback, and the write-through behaviour are all unverified. This issue adds a test suite mirroring the style of [`src/lib/__tests__/useDebounce.test.tsx`](src/lib/__tests__/useDebounce.test.tsx).

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Assert: initial value is the fallback before hydration, the stored value is read after the effect, `write` updates both state and `localStorage`, and malformed stored JSON falls back without throwing.
- Use a real or mocked `window.localStorage`; clear it between tests.
- Cover the `try/catch` branches that currently `/* ignore */`.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-16-uselocalstate`
- Implement changes
  - **Write comprehensive tests in:** create `src/lib/__tests__/useLocalState.test.tsx`.
  - **Add documentation:** none beyond test descriptions.
  - Validate no act() warnings and deterministic teardown.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: missing key, corrupt JSON, and a `setItem` throw (quota) being swallowed.
- Include the `npm test` output and the coverage summary for the hook.

### Example commit message
`test(lib): cover useLocalState hydration, write-through, and error fallbacks`

### Guidelines
- **Minimum 95 percent test coverage** for `useLocalState.ts`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the theme helper and ThemeToggle component"
labels: type:test, area:testing, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the theme helpers and ThemeToggle behaviour

### Description
[`src/lib/theme.ts`](src/lib/theme.ts) (read/write/effective theme with `matchMedia`) and [`src/components/ThemeToggle.tsx`](src/components/ThemeToggle.tsx) (which toggles the `dark` class on `documentElement`) have no tests. Regressions here silently break dark mode across every page. This issue adds coverage for both.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- For `theme.ts`: assert `readTheme` validates the stored value, `writeTheme` persists, and `effectiveTheme("system")` follows a mocked `matchMedia`.
- For `ThemeToggle`: mock `localStorage` and `matchMedia`, assert the three buttons render, `aria-pressed` reflects the active theme, and clicking toggles `documentElement.classList`.
- Stub `window.matchMedia` in the test setup since jsdom lacks it.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-17-theme`
- Implement changes
  - **Write comprehensive tests in:** create `src/lib/__tests__/theme.test.ts` and `src/components/__tests__/ThemeToggle.test.tsx`.
  - **Add documentation:** if you add a `matchMedia` polyfill, note it in [`jest.setup.ts`](jest.setup.ts).
  - Validate the `role="group"` with `aria-label="Theme"` is reachable.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: invalid stored value coerced to `system`, SSR guards (`typeof window === "undefined"`), and dark-preference media query.
- Include the `npm test` output and coverage for the two modules.

### Example commit message
`test(theme): cover theme helpers and ThemeToggle dark-mode wiring`

### Guidelines
- **Minimum 95 percent test coverage** for the impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the ToastProvider context, auto-dismiss, and useToast guard"
labels: type:test, area:testing, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the ToastProvider context, auto-dismiss timer, and useToast guard

### Description
[`src/components/ToastProvider.tsx`](src/components/ToastProvider.tsx) provides app-wide toasts (used by the layout) with a 4s auto-dismiss and a `useToast` hook that throws outside the provider — none of which is tested. The `role="alert"` vs `role="status"` distinction for error/info toasts is a meaningful a11y behaviour worth locking down. This issue adds coverage.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Render a consumer that calls `push`, assert the message appears, error toasts use `role="alert"` and info toasts `role="status"`, and the toast disappears after advancing fake timers by 4000 ms.
- Assert `useToast()` throws the documented error when rendered outside `<ToastProvider>`.
- Use `jest.useFakeTimers()` and `act` for the timer assertions.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-18-toastprovider`
- Implement changes
  - **Write comprehensive tests in:** create `src/components/__tests__/ToastProvider.test.tsx`.
  - **Add documentation:** none beyond test descriptions.
  - Validate the live region container (`aria-live="polite"`) is present.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: multiple stacked toasts, default level (`info`), and the outside-provider throw.
- Include the `npm test` output and coverage for the component.

### Example commit message
`test(components): cover ToastProvider dismiss timer and useToast guard`

### Guidelines
- **Minimum 95 percent test coverage** for `ToastProvider.tsx`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the TextField component label, error, and aria wiring"
labels: type:test, area:testing, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the TextField label association and aria-invalid/describedby wiring

### Description
[`src/components/TextField.tsx`](src/components/TextField.tsx) is the accessible input primitive (auto-generated id via `useId`, `aria-describedby` linking description and error, `aria-invalid` and `role="alert"` on errors) intended for forms across the app, but it has no test. This issue verifies its accessibility contract so future form refactors can rely on it.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Assert: the label is associated with the input (clicking the label focuses the input), `description` renders with an id referenced by `aria-describedby`, and an `error` sets `aria-invalid` and renders `role="alert"` referenced by `aria-describedby`.
- Assert a caller-supplied `id` overrides the generated one.
- Verify no `aria-describedby` attribute is emitted when neither description nor error is present.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-19-textfield`
- Implement changes
  - **Write comprehensive tests in:** create `src/components/__tests__/TextField.test.tsx`.
  - **Add documentation:** add a short JSDoc usage note to [`src/components/TextField.tsx`](src/components/TextField.tsx).
  - Validate with `@testing-library/jest-dom` matchers.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: description + error together, error-only, and custom id.
- Include the `npm test` output and coverage for the component.

### Example commit message
`test(components): cover TextField label and aria wiring`

### Guidelines
- **Minimum 95 percent test coverage** for `TextField.tsx`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add focus trap, Escape-to-close, and focus restoration to ConfirmDialog"
labels: type:a11y, area:a11y, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Harden ConfirmDialog with focus trapping, Escape, and focus restoration

### Description
[`src/components/ConfirmDialog.tsx`](src/components/ConfirmDialog.tsx) renders a `role="dialog"` `aria-modal="true"` overlay, but it does not trap focus inside the dialog, cannot be dismissed with the Escape key, does not move focus into the dialog on open, and does not restore focus to the trigger on close. These are baseline WCAG 2.1 modal requirements. This issue makes the dialog keyboard-accessible.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- On open: move focus to the first focusable element (or the dialog), trap Tab/Shift+Tab within the dialog, and prevent background scroll.
- Bind Escape to `onCancel`; clicking the backdrop may also cancel (configurable, but Escape is required).
- On close: restore focus to the element that was focused before opening.
- Keep the existing `aria-labelledby="confirm-title"` and Confirm/Cancel buttons.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/a11y-20-confirmdialog-focus-trap`
- Implement changes
  - **Write code in:** [`src/components/ConfirmDialog.tsx`](src/components/ConfirmDialog.tsx) — focus management via refs/effects.
  - **Write comprehensive tests in:** create `src/components/__tests__/ConfirmDialog.test.tsx` — assert focus moves in on open, Escape calls `onCancel`, Tab wraps, and focus returns to the trigger on close.
  - **Add documentation:** document the focus/keyboard behaviour in a JSDoc block.
  - Validate against WCAG 2.1 SC 2.1.2 (No Keyboard Trap, correctly) and 2.4.3 (Focus Order).
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: dialog with a single focusable element, rapid open/close, and Escape while focus is on the backdrop.
- Include the `npm test` output and a short a11y note.

### Example commit message
`fix(a11y): trap focus, handle Escape, and restore focus in ConfirmDialog`

### Guidelines
- **Minimum 95 percent test coverage** for the component.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Eliminate the dark-mode flash by applying the theme before first paint"
labels: type:a11y, area:a11y, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve theming to prevent the flash of incorrect color scheme (FOUC)

### Description
Theme is applied entirely client-side: [`src/components/ThemeToggle.tsx`](src/components/ThemeToggle.tsx) toggles the `dark` class on `documentElement` inside a `useEffect`, so a user who chose dark mode sees a white flash on every navigation until hydration runs. [`src/app/layout.tsx`](src/app/layout.tsx) hard-codes `<html lang="en">` with no early theme application and the CSS in [`src/app/globals.css`](src/app/globals.css) relies solely on `prefers-color-scheme`. This issue applies the stored theme before first paint.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Inject a tiny blocking inline script in [`src/app/layout.tsx`](src/app/layout.tsx) `<head>` that reads `agentpay.theme` from `localStorage` (key matches [`src/lib/theme.ts`](src/lib/theme.ts)) and sets the `dark` class synchronously before the body renders.
- Ensure the `system` setting still honours `prefers-color-scheme` and that the script is the single source of truth shared with [`src/lib/theme.ts`](src/lib/theme.ts) (no key drift).
- Respect `prefers-reduced-motion` where any theme-transition CSS is added.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/a11y-21-theme-fouc`
- Implement changes
  - **Write code in:** [`src/app/layout.tsx`](src/app/layout.tsx) (inline pre-paint script) and reconcile [`src/lib/theme.ts`](src/lib/theme.ts).
  - **Write comprehensive tests in:** create `src/lib/__tests__/theme.test.ts` cases or a layout test asserting the storage key and class logic match.
  - **Add documentation:** document the anti-FOUC approach in [`README.md`](README.md).
  - Validate no hydration mismatch warning is produced.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: no stored theme (defaults to system), corrupt stored value, and SSR with `localStorage` absent.
- Include the `npm test` output and a note confirming no hydration warnings in `npm run dev`.

### Example commit message
`fix(a11y): apply stored theme before first paint to remove dark-mode flash`

### Guidelines
- **Minimum 95 percent test coverage** for the touched theme logic.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Make the Tooltip dismissible with Escape and hoverable per WCAG 1.4.13"
labels: type:a11y, area:a11y, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Harden the Tooltip for WCAG 1.4.13 (dismissible, hoverable, persistent)

### Description
[`src/components/Tooltip.tsx`](src/components/Tooltip.tsx) shows content on hover/focus and hides on mouseleave/blur, but it cannot be dismissed with the Escape key while leaving the trigger focused, and the tooltip content is not itself hoverable — both violations of WCAG 2.1 SC 1.4.13 (Content on Hover or Focus). This issue brings the component into compliance.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Add Escape-to-dismiss that hides the tooltip without removing focus from the trigger.
- Make the tooltip content hoverable (do not hide while the pointer is over the tooltip itself), keeping it visible until blur/Escape/mouseleave of the whole region.
- Preserve the `role="tooltip"` + `aria-describedby` association and `useId` wiring.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/a11y-22-tooltip-dismissible`
- Implement changes
  - **Write code in:** [`src/components/Tooltip.tsx`](src/components/Tooltip.tsx).
  - **Write comprehensive tests in:** create `src/components/__tests__/Tooltip.test.tsx` — assert show on focus, hide on Escape (focus retained), and visible while hovering the content.
  - **Add documentation:** add a JSDoc note citing WCAG 1.4.13.
  - Validate keyboard-only operability.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: rapid focus/blur, Escape when already hidden, and pointer moving from trigger to tooltip.
- Include the `npm test` output and an a11y note.

### Example commit message
`fix(a11y): make Tooltip dismissible and hoverable per WCAG 1.4.13`

### Guidelines
- **Minimum 95 percent test coverage** for the component.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Respect prefers-reduced-motion for spinners and skeleton animations"
labels: type:a11y, area:a11y, stack:nextjs, stack:react, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve motion handling to respect prefers-reduced-motion

### Description
Several surfaces animate unconditionally: the spinning SVG in [`src/components/Spinner.tsx`](src/components/Spinner.tsx) (`animate-spin`), the pulsing skeletons in [`src/app/loading.tsx`](src/app/loading.tsx) (`animate-pulse`), and the copied-state transitions. Users who set `prefers-reduced-motion: reduce` should not see continuous motion (WCAG 2.3.3 / vestibular safety). This issue adds a reduced-motion fallback globally.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Add a `@media (prefers-reduced-motion: reduce)` block in [`src/app/globals.css`](src/app/globals.css) that disables or slows `animate-spin`/`animate-pulse` (e.g. set `animation: none` and provide a static indicator).
- Ensure the spinner still conveys "loading" without motion (the existing `role="status"` + `sr-only` label already helps — verify it remains).
- Do not break dark mode or the existing Tailwind v4 `@theme` setup.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/a11y-23-reduced-motion`
- Implement changes
  - **Write code in:** [`src/app/globals.css`](src/app/globals.css) (and a static fallback in [`src/components/Spinner.tsx`](src/components/Spinner.tsx) if needed).
  - **Write comprehensive tests in:** add/extend `src/components/__tests__/Spinner.test.tsx` to assert the accessible `role="status"`/label remains; document CSS-media behaviour in the PR.
  - **Add documentation:** note the reduced-motion support in [`README.md`](README.md).
  - Validate with the browser's reduced-motion emulation.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: reduced-motion on/off, dark mode, and the loading skeleton.
- Include the `npm test` output and a screenshot/note from reduced-motion emulation.

### Example commit message
`fix(a11y): honor prefers-reduced-motion for spinner and skeleton animations`

### Guidelines
- **Minimum 95 percent test coverage** for the changed component.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add per-page metadata titles for client-rendered routes"
labels: type:a11y, area:routing, stack:nextjs, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve document titles for client-component routes

### Description
The root layout defines a title template (`%s — AgentPay`) in [`src/app/layout.tsx`](src/app/layout.tsx), and a few server pages (settings, docs, about, export, changelog metadata) export `metadata`. But the many `"use client"` pages — [`services`](src/app/services/page.tsx), [`usage`](src/app/usage/page.tsx), [`agents`](src/app/agents/page.tsx), [`admin`](src/app/admin/page.tsx), [`stats`](src/app/stats/page.tsx), [`events`](src/app/events/page.tsx), [`webhooks`](src/app/webhooks/page.tsx), [`api-keys`](src/app/api-keys/page.tsx), [`search`](src/app/search/page.tsx) — cannot export `metadata`, so they all share the default "AgentPay" title, hurting screen-reader orientation and tab identification. This issue gives each route a distinct title.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- For each client page, add a colocated server `layout.tsx` (or split a small server wrapper) exporting `metadata.title` so the template produces e.g. "Services — AgentPay".
- Keep the page components as client components; do not convert their interactive logic to server.
- Ensure dynamic routes (`/services/[serviceId]`, `/agents/[agent]`) get a sensible title via `generateMetadata` where feasible.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/routing-24-page-titles`
- Implement changes
  - **Write code in:** add `layout.tsx` files under the relevant `src/app/<route>/` folders.
  - **Write comprehensive tests in:** since `metadata` is build-time, add a small test asserting the exported `metadata.title` constants where extracted, e.g. `src/app/services/layout.test.tsx`.
  - **Add documentation:** list the per-route titles in [`README.md`](README.md).
  - Validate titles render in `npm run build` output / browser tab.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: dynamic route titles and the template fallback for the home route.
- Include the `npm test` output and a note of the resulting titles.

### Example commit message
`feat(routing): add distinct document titles for client-rendered pages`

### Guidelines
- **Minimum 95 percent test coverage** for any extracted title module.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Validate and constrain the NEXT_PUBLIC_AGENTPAY_API_BASE origin"
labels: type:security, area:api-client, stack:nextjs, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Harden API base-URL resolution against misconfiguration and injection

### Description
[`src/lib/apiClient.ts`](src/lib/apiClient.ts), [`src/app/usage/page.tsx`](src/app/usage/page.tsx), and [`src/app/export/page.tsx`](src/app/export/page.tsx) each read `process.env.NEXT_PUBLIC_AGENTPAY_API_BASE` and concatenate it with a path with no validation. A trailing slash, a missing scheme, or a non-`https` value in production silently produces malformed or insecure requests, and the export page builds `href`s by raw string concat. This issue centralises and validates base-URL resolution.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Add a single exported helper (e.g. `resolveApiBase()`) in [`src/lib/apiClient.ts`](src/lib/apiClient.ts) that validates the env value is a parseable URL, strips a trailing slash, and warns (or in production rejects) a non-`https` origin that is not localhost.
- Make [`src/app/export/page.tsx`](src/app/export/page.tsx) build its download links via this helper instead of inline concatenation.
- Document precedence and the localhost default; do not embed secrets (the value is public by `NEXT_PUBLIC_` design — note this in docs).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/api-client-25-validate-base-url`
- Implement changes
  - **Write code in:** [`src/lib/apiClient.ts`](src/lib/apiClient.ts); update [`src/app/export/page.tsx`](src/app/export/page.tsx) to use the helper.
  - **Write comprehensive tests in:** create `src/lib/__tests__/apiClient.test.ts` cases — valid https, trailing-slash normalisation, missing scheme rejected, and localhost http allowed.
  - **Add documentation:** add an "Environment & API base URL" section to [`README.md`](README.md).
  - Validate no path can escape the configured origin via crafted input.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: empty env (default), `javascript:`/relative values rejected, and uppercase scheme.
- Include the `npm test` output and a short threat-model note.

### Example commit message
`fix(security): validate and normalise NEXT_PUBLIC_AGENTPAY_API_BASE origin`

### Guidelines
- **Minimum 95 percent test coverage** for the resolver.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add Content-Security-Policy and hardening headers via next.config and middleware"
labels: type:security, area:config, stack:nextjs, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Add security response headers (CSP, HSTS, frame and content-type protections)

### Description
[`next.config.ts`](next.config.ts) is empty (only a comment) and the app ships no security headers: there is no Content-Security-Policy, no `X-Content-Type-Options`, no `Referrer-Policy`, and no clickjacking protection. For a dashboard that handles API keys and admin pause/unpause, these defaults are unsafe. This issue adds a baseline header policy.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Add a `headers()` entry (or `src/middleware.ts`) setting `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` (or `frame-ancestors 'none'`), and `Permissions-Policy`.
- The CSP `connect-src` must allow the configured `NEXT_PUBLIC_AGENTPAY_API_BASE` and `style-src`/`font-src` must accommodate the `next/font` Geist fonts used in [`src/app/layout.tsx`](src/app/layout.tsx).
- Keep `https://stellar.org` (linked from [`src/app/page.tsx`](src/app/page.tsx)) reachable as a navigation target; do not block legitimate links.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/config-26-security-headers`
- Implement changes
  - **Write code in:** [`next.config.ts`](next.config.ts) `headers()` (and/or create `src/middleware.ts`).
  - **Write comprehensive tests in:** create `src/__tests__/securityHeaders.test.ts` asserting the header config object contains the expected directives (unit-test the exported policy builder).
  - **Add documentation:** add a "Security headers" section to [`README.md`](README.md).
  - Validate the build serves the headers and the app still loads fonts/styles.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: CSP with a custom API base, and report-only vs enforce mode if you add it.
- Include the `npm test` output and a `curl -I` header dump from `npm run start`.

### Example commit message
`feat(security): add CSP and hardening response headers with tests`

### Guidelines
- **Minimum 95 percent test coverage** for the policy builder.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Sanitize and bound rendering of arbitrary event payloads in the event log"
labels: type:security, area:events, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Harden event-payload rendering against unbounded and unsafe content

### Description
[`src/app/events/page.tsx`](src/app/events/page.tsx) renders each event's `payload` via `JSON.stringify(e.payload, null, 2)` inside a `<pre>` with `whitespace-pre-wrap`. While React escapes text, the payload is attacker-influenced backend data of unknown size and depth, and the page also trusts `e.type` and `e.ts` without bounds — a single huge or deeply nested payload can degrade the page, and unvalidated `ts` can produce `Invalid Date`. This issue bounds and defensively renders untrusted payloads.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Cap the serialized payload length (e.g. truncate with an explicit "…(truncated)" marker) and guard against circular structures in `JSON.stringify`.
- Validate `e.ts` is a finite number before `new Date(...).toISOString()`; show a fallback for invalid timestamps.
- Treat `e.type`/`e.id` as opaque strings rendered as text only (no `dangerouslySetInnerHTML` anywhere — confirm none is introduced).
- Keep the existing list/empty/error structure.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/events-27-sanitize-payload`
- Implement changes
  - **Write code in:** [`src/app/events/page.tsx`](src/app/events/page.tsx); optionally extract a `safeStringify` helper into [`src/lib/format.ts`](src/lib/format.ts).
  - **Write comprehensive tests in:** create `src/app/events/page.test.tsx` (and `src/lib/__tests__/format.test.ts` cases) — assert truncation, circular-safe stringify, and invalid-timestamp fallback.
  - **Add documentation:** note the truncation limit in [`README.md`](README.md).
  - Validate no raw HTML injection path exists.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: 1 MB payload, circular object, `ts = NaN`, and an empty payload.
- Include the `npm test` output and a short security note.

### Example commit message
`fix(security): bound and safely render untrusted event payloads`

### Guidelines
- **Minimum 95 percent test coverage** for the changed module and helper.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add a typed double-confirmation guard to the admin pause/unpause toggle"
labels: type:security, area:admin, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Harden the admin pause/unpause control against accidental activation

### Description
[`src/app/admin/page.tsx`](src/app/admin/page.tsx) flips the global pause flag — which refuses all backend writes — on a single unconfirmed button click. There is no confirmation, no in-flight disabling (a user can double-click and fire `pause` then `unpause`), and no audit of who toggled it. For a protocol-wide kill switch this is too easy to trigger by accident. This issue adds a guarded, idempotent toggle.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Gate the toggle behind [`ConfirmDialog`](src/components/ConfirmDialog.tsx), with a confirmation message that names the resulting state ("Pause all writes?" / "Resume writes?").
- Disable the button while the request is in flight to prevent double submission; reflect status with a [`StatusDot`](src/components/StatusDot.tsx) or [`Badge`](src/components/Badge.tsx).
- Surface success/failure via [`toast`](src/components/ToastProvider.tsx) and keep the existing `role="alert"` error path.
- Re-read status after the action (the page already does) and handle a concurrent external change gracefully.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/admin-28-pause-confirmation`
- Implement changes
  - **Write code in:** [`src/app/admin/page.tsx`](src/app/admin/page.tsx).
  - **Write comprehensive tests in:** create `src/app/admin/page.test.tsx` — assert Cancel makes no call, Confirm posts the correct endpoint, the button disables mid-flight, and status refreshes.
  - **Add documentation:** note the kill-switch confirmation in [`README.md`](README.md).
  - Validate the dialog is keyboard operable (depends on the ConfirmDialog a11y work).
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: toggle while already paused, request failure, and rapid double-click prevention.
- Include the `npm test` output and a short security note.

### Example commit message
`fix(security): require confirmation and prevent double-submit on admin pause toggle`

### Guidelines
- **Minimum 95 percent test coverage** for the changed page.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Expand the README with environment configuration and the full route map"
labels: type:docs, area:docs, stack:nextjs, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Document environment configuration and the complete route map in the README

### Description
[`README.md`](README.md) describes the stack and basic commands but lists a project structure that only mentions `layout.tsx`, `page.tsx`, and `page.test.tsx` — it is badly out of date now that the app ships ~15 routes (services, usage, agents, admin, stats, events, webhooks, api-keys, search, settings, docs, export, about, changelog) and shared components/lib. It also never documents the required `NEXT_PUBLIC_AGENTPAY_API_BASE` env var read in [`src/lib/apiClient.ts`](src/lib/apiClient.ts). This issue brings the README up to date.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Add an "Environment variables" section documenting `NEXT_PUBLIC_AGENTPAY_API_BASE` (purpose, default `http://localhost:3001`, that it is public).
- Replace the stale project-structure tree with the real layout under [`src/app/`](src/app), [`src/components/`](src/components), and [`src/lib/`](src/lib).
- Add a route map table mapping each path to its purpose and the backend endpoints it calls (cross-reference [`src/app/docs/page.tsx`](src/app/docs/page.tsx)).
- Document `npm run typecheck` (present in package.json but unmentioned).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/docs-29-readme-env-and-routes`
- Implement changes
  - **Write code in:** [`README.md`](README.md) (docs only).
  - **Write comprehensive tests in:** not applicable; instead verify every documented path exists under [`src/app/`](src/app) and every command exists in [`package.json`](package.json).
  - **Add documentation:** this issue is the documentation.
  - Validate links resolve and the structure tree matches the repo.
- Test and commit

### Test and commit
- Run `npm run lint` and `npm run build` to confirm nothing references removed content.
- Cross-check the route table against the actual files in [`src/app/`](src/app).
- Include a note confirming each command in the README runs.

### Example commit message
`docs(readme): document env config and full route map`

### Guidelines
- Accuracy over completeness; every claim must match the code.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Author a CONTRIBUTING guide covering branch naming, testing, and a11y expectations"
labels: type:docs, area:docs, stack:nextjs, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Document the contribution workflow in a CONTRIBUTING guide

### Description
Contribution guidance currently lives in a four-line "Contributing" section of [`README.md`](README.md) and there is no dedicated guide describing the conventions this campaign relies on: branch naming (`<type>/<area>-NN-<slug>`), the test/lint/typecheck/build gates enforced by [`.github/workflows/ci.yml`](.github/workflows/ci.yml), the component/a11y patterns (focus-visible rings, `role` usage, `useId` associations) used throughout [`src/components/`](src/components), and the coverage expectation. This issue creates a `CONTRIBUTING.md`.

### Requirements and context
- **Repository scope:** `Agentpay-Org/Agentpay-frontend` only.
- Create `CONTRIBUTING.md` documenting: fork-and-branch flow, the conventional-commit style, local commands (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`), and the 95% coverage guideline.
- Describe the established UI conventions: prefer existing primitives ([`Button`](src/components/Button.tsx), [`TextField`](src/components/TextField.tsx), [`Card`](src/components/Card.tsx)), keep the skip-link/`focus-visible` patterns, and route fetches through [`src/lib/apiClient.ts`](src/lib/apiClient.ts).
- Link to the Discord and explain the review/reward flow.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/docs-30-contributing-guide`
- Implement changes
  - **Write code in:** create `CONTRIBUTING.md`; link it from [`README.md`](README.md).
  - **Write comprehensive tests in:** not applicable; verify referenced commands/paths exist.
  - **Add documentation:** this issue is the documentation.
  - Validate every command and file reference resolves.
- Test and commit

### Test and commit
- Run `npm run lint` and `npm run build`.
- Cross-check that the documented branch/commit conventions match those in these issues.
- Include a note confirming the linked commands run cleanly.

### Example commit message
`docs: add CONTRIBUTING guide with branch, testing, and a11y conventions`

### Guidelines
- Accuracy over completeness; align with the actual CI and code.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
