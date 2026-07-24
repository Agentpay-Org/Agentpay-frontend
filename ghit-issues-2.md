---
type: Feature
title: "Build a real agents directory list on the Agents page to replace the placeholder copy"
labels: type:feature, area:agents, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Implement a real agents directory list on the Agents page

### Description
[`src/app/agents/page.tsx`](src/app/agents/page.tsx) still only calls `GET /api/v1/stats` and renders a static line that says "X unique agents across Y services" plus a "future agents directory" sentence — it never lists a single agent, even though [`src/app/agents/[agent]/page.tsx`](src/app/agents/[agent]/page.tsx) renders per-agent usage and the header links to `/agents`. This issue replaces the placeholder with an actual directory of agents, each linking to its detail page, while keeping the existing stats summary.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Fetch the agent directory (e.g. `GET /api/v1/agents?page=…&limit=…`) and render rows as Next.js `<Link>` to `/agents/${encodeURIComponent(agent)}` inside a real `<ul>`.
- Reuse [`Spinner`](src/components/Spinner.tsx) for loading, [`EmptyState`](src/components/EmptyState.tsx) for the no-agents case, and [`Pagination`](src/components/Pagination.tsx) for paging.
- Keep the stats summary line but delete the "future agents directory" placeholder sentence.
- Surface failures via a `role="alert"` paragraph consistent with the other pages.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/agents-directory-real-list`
- Implement changes
  - **Write code in:** [`src/app/agents/page.tsx`](src/app/agents/page.tsx) — list fetch, pagination state, `<Link>` rows.
  - **Write comprehensive tests in:** create [`src/app/agents/page.test.tsx`](src/app/agents/page.test.tsx) — mock `@/lib/apiClient`, assert rows render as links, empty state shows, and error renders `role="alert"`.
  - **Add documentation:** note the agents directory in [`README.md`](README.md).
  - Add JSDoc to any new helper and validate rows are real links inside a list with focus-visible rings preserved.
  - Validate a11y: keyboard reachability and long agent identifiers do not overflow.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: empty directory, single page (Pagination hidden), backend error, and very long agent ids.
- Paste the `npm test` output and a note on the assumed API shape.

### Example commit message
`feat(agents): replace placeholder with paginated agents directory and tests`

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
title: "Add a loading and error state machine to the service detail page"
labels: type:enhancement, area:services, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve the service detail page with explicit loading and error states

### Description
[`src/app/services/[serviceId]/page.tsx`](src/app/services/[serviceId]/page.tsx) fetches the service price and an optional usage rollup, but it renders no loading state while those requests are in flight — the page shows empty tiles until data arrives, and the rollup request fails silently. This issue adds a `loading | error | ok` state machine so the detail panel behaves consistently with the rest of the dashboard.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Render a [`Spinner`](src/components/Spinner.tsx) while the primary service fetch is pending and a `role="alert"` paragraph when it fails.
- Keep the optional usage-rollup soft-failure (it may legitimately 404) but show a small inline note instead of silently rendering nothing.
- Preserve the existing price tile, usage tile, and the Edit / Top-agents links.
- Do not regress the existing `next/navigation` `useParams` usage.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/services-detail-loading-error`
- Implement changes
  - **Write code in:** [`src/app/services/[serviceId]/page.tsx`](src/app/services/[serviceId]/page.tsx).
  - **Write comprehensive tests in:** create [`src/app/services/[serviceId]/page.test.tsx`](src/app/services/[serviceId]/page.test.tsx) — mock apiClient + `next/navigation`, assert loading→ok, loading→error, and rollup-missing note.
  - **Add documentation:** note the loading/error behaviour in [`README.md`](README.md).
  - JSDoc any extracted helper; validate the alert is announced.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: service 404, rollup 404, both fail, and a slow primary fetch.
- Include the `npm test` output.

### Example commit message
`feat(services): add loading and error states to service detail page`

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
title: "Add loading state and an unsaved-changes guard to the service edit page"
labels: type:enhancement, area:services, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve the service edit page with a loading state and unsaved-changes guard

### Description
[`src/app/services/[serviceId]/edit/page.tsx`](src/app/services/[serviceId]/edit/page.tsx) fetches the current `priceStroops` to prefill the form but renders nothing distinct while that fetch is pending, and it lets the operator navigate away after editing the price without any warning, silently discarding the change. This issue adds a prefill loading state and a beforeunload/route-change unsaved-changes guard.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Show a [`Spinner`](src/components/Spinner.tsx) while the prefill `GET` is in flight and a `role="alert"` if it fails.
- Track whether the price field is dirty; warn before leaving (window `beforeunload` and a confirm on the in-app Back link) only when dirty.
- Keep the existing positive-integer `priceStroops` validation and the `PATCH /api/v1/services/{serviceId}/price` submit.
- Show a success [`toast`](src/components/ToastProvider.tsx) and clear the dirty flag on save.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/services-edit-loading-dirty-guard`
- Implement changes
  - **Write code in:** [`src/app/services/[serviceId]/edit/page.tsx`](src/app/services/[serviceId]/edit/page.tsx).
  - **Write comprehensive tests in:** create [`src/app/services/[serviceId]/edit/page.test.tsx`](src/app/services/[serviceId]/edit/page.test.tsx) — assert prefill spinner, dirty guard fires only when changed, and successful PATCH toasts and clears dirty.
  - **Add documentation:** note the unsaved-changes behaviour in [`README.md`](README.md).
  - JSDoc the dirty-tracking helper; validate keyboard operability of the confirm.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: prefill error, no change then leave (no warning), invalid price blocked, and PATCH failure.
- Include the `npm test` output.

### Example commit message
`feat(services): add prefill loading and unsaved-changes guard to edit page`

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
title: "Paginate the service top-agents page and add loading and empty states"
labels: type:feature, area:services, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Implement pagination and proper states on the service top-agents page

### Description
[`src/app/services/[serviceId]/agents/page.tsx`](src/app/services/[serviceId]/agents/page.tsx) calls `GET /api/v1/services/{serviceId}/agents/top?limit=25` with a hard-coded `limit=25`, renders a single unbounded ranked `<ol>`, and shows no loading or empty state. This issue adds server-driven paging via the shared [`Pagination`](src/components/Pagination.tsx) component plus loading and empty handling.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `page`/`pageCount` state and request `?page=…&limit=…`; render [`Pagination`](src/components/Pagination.tsx) below the ranked list (it self-hides when `pageCount <= 1`).
- Replace the bare loading gap with [`Spinner`](src/components/Spinner.tsx) and add [`EmptyState`](src/components/EmptyState.tsx) for services with no recorded agents.
- Preserve the rank/agent/request-count rows and link each agent to `/agents/${encodeURIComponent(agent)}`.
- Keep the existing `role="alert"` error path and the `next/navigation` `useParams` wiring.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/services-top-agents-pagination`
- Implement changes
  - **Write code in:** [`src/app/services/[serviceId]/agents/page.tsx`](src/app/services/[serviceId]/agents/page.tsx).
  - **Write comprehensive tests in:** create [`src/app/services/[serviceId]/agents/page.test.tsx`](src/app/services/[serviceId]/agents/page.test.tsx) — mock apiClient + `next/navigation`, assert paging refetches, empty state renders, and rows link.
  - **Add documentation:** note the paging behaviour in [`README.md`](README.md).
  - Validate the `aria-live` page indicator inside Pagination announces changes.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: single page, last page, empty result, and backend error.
- Include the `npm test` output.

### Example commit message
`feat(services): paginate top-agents page with loading and empty states`

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
title: "Add a debounce loading indicator and stale-result handling to the search page"
labels: type:enhancement, area:search, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve search-page feedback during debounce and stale fetches

### Description
[`src/app/search/page.tsx`](src/app/search/page.tsx) debounces the query (250 ms) and fetches `GET /api/v1/services?q=…&limit=50`, but it shows no indication while the debounce window or the request is pending — the previous results stay on screen and an out-of-order response can clobber a newer query. This issue adds a "searching…" indicator and discards stale responses.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Show a subtle [`Spinner`](src/components/Spinner.tsx) (or `role="status"` "Searching…") while the debounced value differs from the input or a fetch is in flight.
- Guard against stale responses (track the latest query and ignore results for a superseded term), mirroring the cancellation pattern in [`src/lib/useApi.ts`](src/lib/useApi.ts).
- Keep the existing `SearchBar`, the "No matches" empty branch, and result `<Link>`s to service detail.
- Surface fetch errors via `role="alert"` rather than silently keeping old results.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/search-debounce-feedback`
- Implement changes
  - **Write code in:** [`src/app/search/page.tsx`](src/app/search/page.tsx); reuse [`src/lib/useDebounce.ts`](src/lib/useDebounce.ts).
  - **Write comprehensive tests in:** create [`src/app/search/page.test.tsx`](src/app/search/page.test.tsx) — fake timers, assert searching indicator, stale-response discard, empty result, and error alert.
  - **Add documentation:** note the search feedback behaviour in [`README.md`](README.md).
  - Validate the status region is announced and does not steal focus.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: rapid typing, empty query, slow then fast response ordering, and backend error.
- Include the `npm test` output.

### Example commit message
`feat(search): add searching indicator and stale-result guard`

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
title: "Show download progress and error handling on the usage export page"
labels: type:enhancement, area:export, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve the export page with in-flight feedback and error handling

### Description
[`src/app/export/page.tsx`](src/app/export/page.tsx) offers JSON and CSV download buttons that hit `/api/v1/usage/export.json` and `/api/v1/usage/export.csv`, but it assumes the request always succeeds, gives no feedback while the (potentially large) export is downloading, and surfaces nothing if the backend errors. This issue adds an explicit downloading state, disabled buttons during the request, and an error path.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Convert the buttons to fetch the export, build a Blob, and trigger the download programmatically so failures can be caught.
- Disable both buttons and show a [`Spinner`](src/components/Spinner.tsx) / "Preparing export…" status while a download is in flight.
- Surface failures via `role="alert"` and a [`toast`](src/components/ToastProvider.tsx) on success.
- Build the export URLs via the centralised base-URL resolver in [`src/lib/resolveApiBase.ts`](src/lib/resolveApiBase.ts) rather than raw concatenation.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/export-progress-and-errors`
- Implement changes
  - **Write code in:** [`src/app/export/page.tsx`](src/app/export/page.tsx).
  - **Write comprehensive tests in:** create [`src/app/export/page.test.tsx`](src/app/export/page.test.tsx) — mock fetch + `URL.createObjectURL`, assert downloading state, success toast, and error alert.
  - **Add documentation:** note the export flow in [`README.md`](README.md).
  - Validate buttons are not double-clickable mid-download and have accessible busy state.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: backend 500, empty export, and a second click while downloading.
- Include the `npm test` output.

### Example commit message
`feat(export): add download progress, disabled state, and error handling`

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
title: "Add a copy action to the created API key instead of plain-text display"
labels: type:enhancement, area:api-keys, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Add a CopyButton to the newly created API key

### Description
[`src/app/api-keys/page.tsx`](src/app/api-keys/page.tsx) shows a newly created key inside a green `role="status"` alert as plain text the operator must select and copy by hand, even though the repo ships a ready [`CopyButton`](src/components/CopyButton.tsx) that already handles clipboard fallbacks and an `aria-live` "Copied" announcement. This issue wires the CopyButton into the created-key panel.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Render a [`CopyButton`](src/components/CopyButton.tsx) bound to the full created key value next to the existing "shown only once" message.
- Keep the `role="status"` region and the once-only warning intact; do not place the key in any URL or log.
- Do not break the existing create form, list rendering, or revoke flow.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/api-keys-copy-created-key`
- Implement changes
  - **Write code in:** [`src/app/api-keys/page.tsx`](src/app/api-keys/page.tsx); reuse [`src/components/CopyButton.tsx`](src/components/CopyButton.tsx).
  - **Write comprehensive tests in:** extend [`src/app/api-keys/page.test.tsx`](src/app/api-keys/page.test.tsx) — mock clipboard, assert copy writes the key value and the "Copied" state announces.
  - **Add documentation:** note the copy affordance in [`README.md`](README.md).
  - Validate the button has an accessible label and works when clipboard is unavailable.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: clipboard unavailable, copy before dismiss, and creation error.
- Include the `npm test` output.

### Example commit message
`feat(api-keys): add CopyButton to the newly created key panel`

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
title: "Add a freshness indicator and pause control to the stats auto-refresh"
labels: type:enhancement, area:stats, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve the stats page with a freshness indicator and refresh control

### Description
[`src/app/stats/page.tsx`](src/app/stats/page.tsx) polls `GET /api/v1/stats` every 5 seconds but gives the operator no signal that the numbers are live, no way to pause the polling, and no "last updated" timestamp — so it is impossible to tell whether a frozen value means "unchanged" or "request failing". This issue adds a freshness indicator and an opt-out control.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Show a "Last updated <relative time>" line using [`TimeAgo`](src/components/TimeAgo.tsx), updated on each successful poll.
- Add a pause/resume toggle (with `aria-pressed`) that starts/stops the interval and is cleaned up on unmount.
- Reflect a failing poll distinctly from a successful one (e.g. a [`StatusDot`](src/components/StatusDot.tsx) or `role="alert"` note) instead of leaving stale numbers ambiguous.
- Preserve the four StatTiles and the paused-backend status alert.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/stats-freshness-indicator`
- Implement changes
  - **Write code in:** [`src/app/stats/page.tsx`](src/app/stats/page.tsx).
  - **Write comprehensive tests in:** create [`src/app/stats/page.test.tsx`](src/app/stats/page.test.tsx) — fake timers, assert poll updates the timestamp, toggle stops polling, and a failed poll shows the error indicator.
  - **Add documentation:** note the polling and freshness behaviour in [`README.md`](README.md).
  - Validate the toggle is keyboard operable and the interval clears on unmount.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: poll failure mid-stream, toggle off then unmount, and first-load error.
- Include the `npm test` output and a note on the chosen interval.

### Example commit message
`feat(stats): add freshness indicator and pause control to polling`

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
title: "Add loading states and a lifetime-total fallback to the agent detail page"
labels: type:enhancement, area:agents, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve the agent detail page with loading states and a graceful total fallback

### Description
[`src/app/agents/[agent]/page.tsx`](src/app/agents/[agent]/page.tsx) fetches per-service usage plus an optional lifetime total, but renders no loading state during the primary fetch and silently swallows the total request when it errors, so the page can show an empty body that looks like "no data" while a request is still running. This issue adds explicit states and a visible fallback for the missing total.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Render a [`Spinner`](src/components/Spinner.tsx) while the primary `GET /api/v1/agents/{agent}/usage` is pending and `role="alert"` on failure.
- Add [`EmptyState`](src/components/EmptyState.tsx) for agents with no per-service usage.
- When the optional total fetch fails, show "Total unavailable" rather than rendering nothing; keep the agent id in monospace.
- Format request counts via [`formatRequests`](src/lib/format.ts).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/agents-detail-loading-states`
- Implement changes
  - **Write code in:** [`src/app/agents/[agent]/page.tsx`](src/app/agents/[agent]/page.tsx).
  - **Write comprehensive tests in:** create [`src/app/agents/[agent]/page.test.tsx`](src/app/agents/[agent]/page.test.tsx) — mock apiClient + `next/navigation`, assert loading, empty, error, and total-fallback branches.
  - **Add documentation:** note the agent-detail states in [`README.md`](README.md).
  - Validate the alert is announced and the layout handles long agent ids.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: usage 404, total 404, both succeed, and slow primary fetch.
- Include the `npm test` output.

### Example commit message
`feat(agents): add loading, empty, and total-fallback states to detail page`

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
title: "Add an in-page search to the docs endpoint reference"
labels: type:feature, area:docs, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Implement client-side filtering of the docs endpoint list

### Description
[`src/app/docs/page.tsx`](src/app/docs/page.tsx) renders a static list of API endpoints with descriptions, but as the API surface grows this becomes hard to scan, and there is no way to jump to a specific endpoint. This issue adds a client-side filter over the endpoint reference using the existing [`SearchBar`](src/components/SearchBar.tsx) primitive.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Extract the endpoint reference into a typed data array and render it from that source so a filter can operate over it.
- Add a [`SearchBar`](src/components/SearchBar.tsx) that filters by path or description (debounced via [`useDebounce`](src/lib/useDebounce.ts)); show [`EmptyState`](src/components/EmptyState.tsx) when nothing matches.
- Because the page becomes interactive, split a small client island so the surrounding metadata/title stays server-rendered.
- Keep every currently documented endpoint present in the new data array.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/docs-endpoint-filter`
- Implement changes
  - **Write code in:** [`src/app/docs/page.tsx`](src/app/docs/page.tsx) (extract a client filter component if needed).
  - **Write comprehensive tests in:** create [`src/app/docs/page.test.tsx`](src/app/docs/page.test.tsx) — assert filtering narrows the list and empty state shows for no matches.
  - **Add documentation:** note the docs filter in [`README.md`](README.md).
  - Validate the search input has an accessible label and results are announced.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: empty query, case-insensitive match, and no-match.
- Include the `npm test` output.

### Example commit message
`feat(docs): add client-side filter to the endpoint reference`

### Guidelines
- **Minimum 95 percent test coverage** for the changed page/component.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add a mobile-friendly collapsible navigation menu to the header"
labels: type:feature, area:navigation, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Implement a responsive collapsible menu in the header

### Description
[`src/components/Header.tsx`](src/components/Header.tsx) renders its nav links in a single horizontal row with no responsive behaviour, so on narrow viewports the links wrap or overflow and there is no hamburger/menu affordance. This issue adds an accessible disclosure menu for small screens while keeping the inline layout on wide screens.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a menu toggle button shown only below a breakpoint, with `aria-expanded`, `aria-controls`, and a real `<button>` (not a div).
- The expanded menu must be keyboard operable (Tab order, Escape to close, focus returns to the toggle) and close on route change.
- Keep the existing `Main navigation` `aria-label`, the logo link, and the focus-visible rings.
- Do not regress the existing Header test; extend it for the responsive behaviour.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/navigation-responsive-menu`
- Implement changes
  - **Write code in:** [`src/components/Header.tsx`](src/components/Header.tsx) (becomes a client component if not already).
  - **Write comprehensive tests in:** extend [`src/components/__tests__/Header.test.tsx`](src/components/__tests__/Header.test.tsx) — assert toggle opens/closes, `aria-expanded` flips, Escape closes, and links remain reachable.
  - **Add documentation:** note the responsive nav in [`README.md`](README.md).
  - Validate against keyboard-only operation and focus management.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: open then navigate (auto-close), Escape while open, and wide-viewport inline layout unaffected.
- Include the `npm test` output and a note on the breakpoint chosen.

### Example commit message
`feat(navigation): add accessible responsive menu to the header`

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
title: "Add a pending/busy state to the Button component for async actions"
labels: type:feature, area:components, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Implement a loading/busy state in the Button primitive

### Description
[`src/components/Button.tsx`](src/components/Button.tsx) exposes only `variant` plus native button attributes — every async submit across the app (services/new, edit, usage, webhooks, api-keys) hand-rolls its own disabled-while-pending logic, and none of them announce busy state to assistive tech. This issue adds a first-class `loading` prop with an inline spinner and `aria-busy`.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a `loading?: boolean` prop that disables the button, sets `aria-busy="true"`, and renders an inline [`Spinner`](src/components/Spinner.tsx) (or equivalent) alongside the label.
- Default `type` to `"button"` so a Button outside a form does not accidentally submit.
- Preserve all variants (`primary | secondary | danger`), the disabled styling, and the focus-visible ring.
- Keep the existing public prop API backward compatible.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/components-button-loading-state`
- Implement changes
  - **Write code in:** [`src/components/Button.tsx`](src/components/Button.tsx).
  - **Write comprehensive tests in:** create [`src/components/__tests__/Button.test.tsx`](src/components/__tests__/Button.test.tsx) — assert variants render, `loading` disables and sets `aria-busy`, default type is button, and clicks fire when enabled.
  - **Add documentation:** add a JSDoc block describing the props and `loading` behaviour.
  - Validate the busy state is announced and the button is not clickable while loading.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: loading + disabled, danger variant, and explicit `type="submit"` override.
- Include the `npm test` output.

### Example commit message
`feat(components): add loading/busy state to Button`

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
title: "Add a reusable usePolling hook and adopt it in the stats and admin pages"
labels: type:refactor, area:lib, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Implement a reusable usePolling hook to replace ad-hoc intervals

### Description
[`src/app/stats/page.tsx`](src/app/stats/page.tsx) re-implements a `setInterval` polling loop with manual `cancelled` flags and `clearInterval` cleanup, and any future auto-refresh page (events, admin) would copy the same boilerplate. The repo already has a clean fetch state machine in [`src/lib/useApi.ts`](src/lib/useApi.ts) but nothing for repeated polling. This issue extracts a tested `usePolling` hook.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Create `src/lib/usePolling.ts` exporting a hook that fetches on an interval, supports pause/resume, exposes `loading | error | ok` state plus a `lastUpdated` timestamp, and cancels on unmount.
- Refactor [`src/app/stats/page.tsx`](src/app/stats/page.tsx) to consume it, preserving the existing 5s cadence and observable behaviour.
- Reuse [`apiGet`](src/lib/apiClient.ts) under the hood; do not introduce a new fetch path.
- Keep cancellation semantics consistent with `useApi` (no state updates after unmount).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/lib-use-polling-hook`
- Implement changes
  - **Write code in:** create `src/lib/usePolling.ts`; refactor [`src/app/stats/page.tsx`](src/app/stats/page.tsx).
  - **Write comprehensive tests in:** create [`src/lib/__tests__/usePolling.test.tsx`](src/lib/__tests__/usePolling.test.tsx) — fake timers, assert repeated fetches, pause stops them, error surfaces, and unmount clears the interval.
  - **Add documentation:** add a JSDoc usage example in `usePolling.ts`.
  - Validate no act() warnings and deterministic teardown.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: pause before first tick, error then recovery, and rapid unmount.
- Include the `npm test` output and coverage for the hook.

### Example commit message
`refactor(lib): add usePolling hook and adopt it in the stats page`

### Guidelines
- **Minimum 95 percent test coverage** for the hook and changed page.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add an XLM/stroops toggle and locale grouping to the formatStroops helper"
labels: type:enhancement, area:lib, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve formatStroops with thousands grouping and a raw-stroops affordance

### Description
[`src/lib/format.ts`](src/lib/format.ts) `formatStroops` returns either `"0 XLM"`, `"{stroops} stroops"`, or `"{xlm.toFixed(2)} XLM"` with no thousands separators, so large balances render as unreadable digit runs (e.g. `123456789 stroops`) and the two-decimal XLM rounding hides sub-cent amounts. This issue improves number formatting without changing the stroops→XLM ratio.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Use `Intl.NumberFormat` for locale-aware grouping of both the XLM and raw-stroops representations.
- Increase precision so sub-cent XLM values are not silently rounded to `0.00 XLM` (e.g. fall back to a higher fraction-digit count or stroops below a threshold).
- Keep the `0 XLM` zero case and the public signature stable; existing callers in service/agent pages must not break.
- Mirror the same grouping in [`formatRequests`](src/lib/format.ts).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/lib-format-number-grouping`
- Implement changes
  - **Write code in:** [`src/lib/format.ts`](src/lib/format.ts).
  - **Write comprehensive tests in:** extend [`src/lib/__tests__/format.test.ts`](src/lib/__tests__/format.test.ts) — assert grouping, zero case, sub-cent precision, and large-value formatting.
  - **Add documentation:** JSDoc the formatting rules; note the conventions in [`README.md`](README.md).
  - Validate output is deterministic under a fixed locale in tests.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: zero, one stroop, exactly 1 XLM, and a very large balance.
- Include the `npm test` output and coverage for `format.ts`.

### Example commit message
`feat(lib): add locale grouping and sub-cent precision to formatStroops`

### Guidelines
- **Minimum 95 percent test coverage** for `format.ts`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add unit tests for the useApi fetch state machine and cancellation"
labels: type:test, area:testing, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the useApi hook states, null-path skip, and unmount cancellation

### Description
[`src/lib/useApi.ts`](src/lib/useApi.ts) drives the events and changelog pages with a `loading | error | ok` state machine and a cancellation token, but it has no dedicated test — the null-path skip (no fetch), the success/error transitions, and the no-update-after-unmount guarantee are all unverified. This issue adds a focused suite.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Mock `@/lib/apiClient` and assert: `loading` initially, transition to `ok` with data, transition to `error` on rejection, and no fetch when `path` is `null`.
- Assert that unmounting during an in-flight fetch produces no state update / act() warning (the cancellation token works).
- Assert refetch when `path` changes.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-useapi-hook`
- Implement changes
  - **Write comprehensive tests in:** create [`src/lib/__tests__/useApi.test.tsx`](src/lib/__tests__/useApi.test.tsx).
  - **Write code in:** no source change expected (file a follow-up if a bug is found).
  - **Add documentation:** none beyond test descriptions.
  - Validate deterministic teardown and no leaked promises.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: null path, path change mid-fetch, rejection, and unmount during fetch.
- Include the `npm test` output and coverage for `useApi.ts`.

### Example commit message
`test(lib): cover useApi states, null-path skip, and cancellation`

### Guidelines
- **Minimum 95 percent test coverage** for `useApi.ts`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add unit tests for the resolveApiBase URL validator"
labels: type:test, area:testing, stack:nextjs, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test resolveApiBase validation, https-in-prod, and trailing-slash normalisation

### Description
[`src/lib/resolveApiBase.ts`](src/lib/resolveApiBase.ts) validates `NEXT_PUBLIC_AGENTPAY_API_BASE`, enforces `https` in production (allowing localhost), strips trailing slashes, and falls back to a default — but it has no test, despite being security-relevant and feeding the CSP `connect-src` in [`src/lib/securityHeaders.ts`](src/lib/securityHeaders.ts). This issue locks the resolver's behaviour with a suite.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Assert: default fallback when env is empty, trailing-slash stripping, valid https accepted, non-https rejected/warned in production, and localhost http allowed in production.
- Assert an unparseable URL is rejected (throws or surfaces the documented error).
- Cover the `isProduction` and `warn` option branches via injected options rather than mutating `process.env` globally where possible.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-resolve-api-base`
- Implement changes
  - **Write comprehensive tests in:** create [`src/lib/__tests__/resolveApiBase.test.ts`](src/lib/__tests__/resolveApiBase.test.ts).
  - **Write code in:** no source change expected (file a follow-up if a bug is found).
  - **Add documentation:** none beyond test descriptions.
  - Validate the thrown/warned behaviour matches the documented contract.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: empty env, `http://example.com` in prod, `http://localhost:3001` in prod, trailing slash, and `not-a-url`.
- Include the `npm test` output and coverage for the resolver.

### Example commit message
`test(lib): cover resolveApiBase validation and normalisation`

### Guidelines
- **Minimum 95 percent test coverage** for `resolveApiBase.ts`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the CopyButton clipboard and copied-state behaviour"
labels: type:test, area:testing, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the CopyButton clipboard write, copied state, and unavailable fallback

### Description
[`src/components/CopyButton.tsx`](src/components/CopyButton.tsx) writes a value to `navigator.clipboard`, flips a "copied" state for ~1500 ms, and announces it via `aria-live`, but silently no-ops when the clipboard API is missing — none of which is tested. As more pages adopt it (created API key, service id, settle quote) this behaviour needs locking down.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Assert: clicking writes the exact `value` via a mocked `navigator.clipboard.writeText`, the label switches to the copied state, and it reverts after advancing fake timers.
- Assert the `aria-live` region is present so the copied state is announced.
- Assert it does not throw when `navigator.clipboard` is undefined.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-copybutton`
- Implement changes
  - **Write comprehensive tests in:** create [`src/components/__tests__/CopyButton.test.tsx`](src/components/__tests__/CopyButton.test.tsx).
  - **Add documentation:** add a short JSDoc note to [`src/components/CopyButton.tsx`](src/components/CopyButton.tsx).
  - Validate with `jest.useFakeTimers()` and `act` for the revert.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: clipboard unavailable, double-click, and custom label.
- Include the `npm test` output and coverage for the component.

### Example commit message
`test(components): cover CopyButton clipboard and copied-state behaviour`

### Guidelines
- **Minimum 95 percent test coverage** for `CopyButton.tsx`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the TimeAgo relative-time rendering and interval updates"
labels: type:test, area:testing, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the TimeAgo relative formatting, time element, and tick updates

### Description
[`src/components/TimeAgo.tsx`](src/components/TimeAgo.tsx) renders a `<time dateTime=…>` with relative text ("just now", "3h ago") and refreshes itself on a 30-second interval, handling negative/zero deltas, but it has no test. This is used across event and stats surfaces, so its formatting boundaries deserve coverage.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Assert the rendered text for boundary deltas (just now, seconds, minutes, hours, days) using a fixed `Date.now`.
- Assert the `dateTime` attribute is a valid ISO string and the `title`/full timestamp (if present) matches.
- Assert the relative text updates after advancing fake timers past the 30s tick, and the interval clears on unmount.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-timeago`
- Implement changes
  - **Write comprehensive tests in:** create [`src/components/__tests__/TimeAgo.test.tsx`](src/components/__tests__/TimeAgo.test.tsx).
  - **Add documentation:** add a JSDoc note to [`src/components/TimeAgo.tsx`](src/components/TimeAgo.tsx) describing the tick.
  - Validate with `jest.useFakeTimers()` and a mocked `Date.now`.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: future timestamp, zero delta, and unmount during interval.
- Include the `npm test` output and coverage for the component.

### Example commit message
`test(components): cover TimeAgo formatting and interval updates`

### Guidelines
- **Minimum 95 percent test coverage** for `TimeAgo.tsx`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the EmptyState, KeyValueGrid, and PageHeading layout primitives"
labels: type:test, area:testing, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the EmptyState, KeyValueGrid, and PageHeading rendering contracts

### Description
[`src/components/EmptyState.tsx`](src/components/EmptyState.tsx), [`src/components/KeyValueGrid.tsx`](src/components/KeyValueGrid.tsx), and [`src/components/PageHeading.tsx`](src/components/PageHeading.tsx) are presentational primitives reused across list and detail pages, but none has a test — so a regression in their optional `action`/`description`/rows props would go unnoticed. This issue adds coverage for all three.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- EmptyState: assert title renders, optional `description` and `action` render only when provided.
- KeyValueGrid: assert each row renders a `<dt>`/`<dd>` pair with the given label/value and that an empty rows array renders nothing meaningful.
- PageHeading: assert the `<h1>` title, optional description, and the `action` slot render.
- Use semantic queries (`getByRole`/`getByText`) rather than class assertions.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-layout-primitives`
- Implement changes
  - **Write comprehensive tests in:** create [`src/components/__tests__/EmptyState.test.tsx`](src/components/__tests__/EmptyState.test.tsx), [`src/components/__tests__/KeyValueGrid.test.tsx`](src/components/__tests__/KeyValueGrid.test.tsx), and [`src/components/__tests__/PageHeading.test.tsx`](src/components/__tests__/PageHeading.test.tsx).
  - **Add documentation:** add JSDoc headers to any of the three components missing one.
  - Validate semantic structure (`<dl>`, `<h1>`).
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: missing optional props, empty rows, and an action that is a link vs a button.
- Include the `npm test` output and coverage for the three components.

### Example commit message
`test(components): cover EmptyState, KeyValueGrid, and PageHeading`

### Guidelines
- **Minimum 95 percent test coverage** for the three components.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the StatTile trend logic and StatusDot variants"
labels: type:test, area:testing, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the StatTile trend colour logic and StatusDot variant labels

### Description
[`src/components/StatTile.tsx`](src/components/StatTile.tsx) computes a trend colour from `delta` and a `positiveIsGood` flag — a double-negative expression that is easy to break — and [`src/components/StatusDot.tsx`](src/components/StatusDot.tsx) maps an `ok | warn | down` variant to a coloured dot plus a visible label. Neither is tested. This issue pins both behaviours.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- StatTile: assert label/value render, and that the trend direction/intent (good vs bad) is correct for positive and negative deltas under both `positiveIsGood` settings, and that no trend renders when `trend` is omitted.
- StatusDot: assert each variant renders the correct label text and the coloured dot is `aria-hidden` so the label carries the meaning.
- Prefer asserting the rendered direction/label over Tailwind class strings; if colour is the only signal, assert an accessible cue is present.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-stattile-statusdot`
- Implement changes
  - **Write comprehensive tests in:** create [`src/components/__tests__/StatTile.test.tsx`](src/components/__tests__/StatTile.test.tsx) and [`src/components/__tests__/StatusDot.test.tsx`](src/components/__tests__/StatusDot.test.tsx).
  - **Add documentation:** add JSDoc clarifying the trend semantics in StatTile.
  - Validate the trend logic against all four combinations.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: zero delta, negative delta with `positiveIsGood=false`, and missing trend.
- Include the `npm test` output and coverage for both components.

### Example commit message
`test(components): cover StatTile trend logic and StatusDot variants`

### Guidelines
- **Minimum 95 percent test coverage** for both components.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the new-service form validation and submit flow"
labels: type:test, area:testing, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the new-service form validation, submit, and navigation

### Description
[`src/app/services/new/page.tsx`](src/app/services/new/page.tsx) validates that `priceStroops` is a non-negative integer, posts `POST /api/v1/services`, and navigates to `/services` on success — but it has no test, so the validation guard and the success navigation are unverified. This issue adds coverage.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Mock `@/lib/apiClient` and `next/navigation`; assert a negative or non-integer `priceStroops` blocks the POST, a valid submit posts the expected body and navigates to `/services`, and a backend error renders the alert.
- Assert the `serviceId` `maxLength` constraint and required fields are honoured.
- Mirror the mocking style used in the existing usage/services page tests.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-new-service-form`
- Implement changes
  - **Write comprehensive tests in:** create [`src/app/services/new/page.test.tsx`](src/app/services/new/page.test.tsx).
  - **Write code in:** no source change expected (file a follow-up if a bug is found).
  - **Add documentation:** none beyond test descriptions.
  - Validate the navigation mock is asserted on success only.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: empty serviceId, non-integer price, backend 409/error, and successful create.
- Include the `npm test` output and coverage for the page.

### Example commit message
`test(services): cover new-service form validation and submit`

### Guidelines
- **Minimum 95 percent test coverage** for the page.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the error and not-found app boundary pages"
labels: type:test, area:testing, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the error boundary reset and the not-found page

### Description
[`src/app/error.tsx`](src/app/error.tsx) is the route error boundary (renders an error heading and a "Try again" button bound to `reset`) and [`src/app/not-found.tsx`](src/app/not-found.tsx) renders the 404 with a back-home link — neither has a test, so a regression in the reset wiring or the 404 link would ship unnoticed. This issue covers both.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- error.tsx: assert the error message renders, clicking "Try again" calls the `reset` prop, and the recovery affordance is reachable.
- not-found.tsx: assert the 404 heading and a link back to `/` render.
- If error.tsx does not yet announce its message via `role="alert"`, add it and assert it (small a11y fix bundled with the test).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-error-notfound`
- Implement changes
  - **Write code in:** add `role="alert"` to the error message in [`src/app/error.tsx`](src/app/error.tsx) if missing.
  - **Write comprehensive tests in:** create [`src/app/error.test.tsx`](src/app/error.test.tsx) and [`src/app/not-found.test.tsx`](src/app/not-found.test.tsx).
  - **Add documentation:** none beyond test descriptions.
  - Validate the reset callback fires exactly once per click.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: error with a digest, empty message, and the 404 link target.
- Include the `npm test` output and coverage for both files.

### Example commit message
`test(app): cover error boundary reset and not-found page`

### Guidelines
- **Minimum 95 percent test coverage** for both files.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add a global-error boundary for root-layout failures"
labels: type:security, area:error-handling, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Add a global-error.tsx to recover from root-layout crashes

### Description
The app ships a route-level [`src/app/error.tsx`](src/app/error.tsx), but there is no `src/app/global-error.tsx`, so an exception thrown in the root layout itself — the Header, Footer, or [`ToastProvider`](src/components/ToastProvider.tsx) wiring in [`src/app/layout.tsx`](src/app/layout.tsx) — escapes the route boundary and produces an unstyled white error screen with no recovery. This issue adds the top-level boundary Next.js requires for that case.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Create `src/app/global-error.tsx` (a client component that renders its own `<html>`/`<body>`, per the Next.js contract) with a recovery `reset` button and a `role="alert"` message.
- Do not leak stack traces in production; show `error.digest` for support correlation only.
- Keep the styling minimal but on-brand and ensure it works without the (failed) layout chrome.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/error-handling-global-boundary`
- Implement changes
  - **Write code in:** create `src/app/global-error.tsx`.
  - **Write comprehensive tests in:** create [`src/app/global-error.test.tsx`](src/app/global-error.test.tsx) — assert the message renders, `reset` is called on click, and no stack is rendered.
  - **Add documentation:** note the global error boundary in [`README.md`](README.md).
  - Validate it renders standalone (no dependency on Header/Footer).
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: error with digest, error without message, and reset click.
- Include the `npm test` output and a short note on the production-safe rendering.

### Example commit message
`feat(error-handling): add global-error boundary for root-layout failures`

### Guidelines
- **Minimum 95 percent test coverage** for the new file.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add rel=noopener and scheme validation to all external and dynamic links"
labels: type:security, area:navigation, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Harden external and dynamic links against tabnabbing and unsafe schemes

### Description
[`src/app/page.tsx`](src/app/page.tsx) links to `https://stellar.org` and [`src/components/Footer.tsx`](src/components/Footer.tsx) / various pages render outbound links; any `target="_blank"` link without `rel="noopener noreferrer"` is a reverse-tabnabbing risk, and pages that build hrefs from backend-supplied data (e.g. webhook URLs echoed back, service ids) could in principle render an unsafe scheme. This issue audits and hardens link rendering.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Ensure every external/new-tab link carries `rel="noopener noreferrer"`.
- Add a small `safeHref` helper (e.g. in [`src/lib/format.ts`](src/lib/format.ts) or a new `src/lib/url.ts`) that rejects non-`http(s)` schemes (`javascript:`, `data:`) before rendering any href derived from data, and use it where backend data feeds a link (webhook URLs in [`src/app/webhooks/page.tsx`](src/app/webhooks/page.tsx)).
- Do not break internal Next.js `<Link>` navigation.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/navigation-safe-links`
- Implement changes
  - **Write code in:** add the helper and apply it in [`src/app/page.tsx`](src/app/page.tsx), [`src/components/Footer.tsx`](src/components/Footer.tsx), and [`src/app/webhooks/page.tsx`](src/app/webhooks/page.tsx).
  - **Write comprehensive tests in:** create `src/lib/__tests__/url.test.ts` (or extend format tests) — assert unsafe schemes are rejected and https passes.
  - **Add documentation:** note the link-safety convention in [`README.md`](README.md).
  - Validate no internal links regress.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: `javascript:` URL, relative URL, and a valid https URL.
- Include the `npm test` output and a short security note.

### Example commit message
`fix(security): add rel=noopener and scheme validation for external links`

### Guidelines
- **Minimum 95 percent test coverage** for the helper.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Replace CSP unsafe-inline with a nonce for the theme pre-paint script"
labels: type:security, area:config, stack:nextjs, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Tighten the script CSP by nonce-ing the inline theme script

### Description
[`src/lib/securityHeaders.ts`](src/lib/securityHeaders.ts) builds a CSP that currently allows `script-src 'unsafe-inline'` (and `unsafe-eval` in dev), which is required only because [`src/app/layout.tsx`](src/app/layout.tsx) injects an inline theme pre-paint script via `dangerouslySetInnerHTML`. `unsafe-inline` defeats much of the XSS protection a CSP provides. This issue replaces it with a per-request nonce.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Generate a per-request nonce (via `src/middleware.ts` or the header builder), add it to `script-src 'nonce-…'`, and drop `unsafe-inline` from `script-src`.
- Apply the same nonce to the inline theme script in [`src/app/layout.tsx`](src/app/layout.tsx) so it still executes before paint.
- Keep `style-src` working for the `next/font` Geist setup and preserve all other directives in [`src/lib/securityHeaders.ts`](src/lib/securityHeaders.ts).
- Document the nonce flow and any dev/prod differences.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/config-csp-nonce`
- Implement changes
  - **Write code in:** [`src/lib/securityHeaders.ts`](src/lib/securityHeaders.ts), `src/middleware.ts` (new if needed), and [`src/app/layout.tsx`](src/app/layout.tsx).
  - **Write comprehensive tests in:** extend [`src/__tests__/securityHeaders.test.ts`](src/__tests__/securityHeaders.test.ts) — assert `script-src` contains a nonce placeholder and no `unsafe-inline`.
  - **Add documentation:** update the "Security headers" section in [`README.md`](README.md).
  - Validate the app still loads (theme applies, no CSP console violations).
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: dev vs prod CSP, missing nonce path, and font/style loading.
- Include the `npm test` output and a `curl -I` header dump from `npm run start`.

### Example commit message
`fix(security): nonce the inline theme script and drop script-src unsafe-inline`

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
title: "Enforce length and character bounds on agent and serviceId inputs"
labels: type:security, area:usage, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Bound and validate agent/serviceId inputs before building requests

### Description
[`src/app/usage/page.tsx`](src/app/usage/page.tsx) and the agent/service detail routes take free-text `agent` and `serviceId` values and place them directly into request paths via `encodeURIComponent`, but there is no length cap or character validation, so an operator can submit an empty, whitespace-only, or absurdly long identifier that produces a malformed request or a confusing 404. This issue adds shared input validation.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a small validator (e.g. `src/lib/validateId.ts`) enforcing a max length and an allowed character set for agent/service identifiers, returning a typed result with a message.
- Apply it in the usage record/query forms in [`src/app/usage/page.tsx`](src/app/usage/page.tsx) (block submit and show a field error via [`TextField`](src/components/TextField.tsx)).
- Keep `encodeURIComponent` on the wire; validation augments, not replaces, encoding.
- Do not weaken existing `required` attributes.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/usage-validate-identifiers`
- Implement changes
  - **Write code in:** create `src/lib/validateId.ts`; apply it in [`src/app/usage/page.tsx`](src/app/usage/page.tsx).
  - **Write comprehensive tests in:** create `src/lib/__tests__/validateId.test.ts` and extend [`src/app/usage/page.test.tsx`](src/app/usage/page.test.tsx) — assert empty/whitespace/too-long are rejected and a valid id passes.
  - **Add documentation:** note the identifier rules in [`README.md`](README.md).
  - Validate `aria-invalid`/`aria-describedby` wiring from TextField.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: empty, whitespace-only, max+1 length, and a valid identifier.
- Include the `npm test` output and a short security note.

### Example commit message
`fix(security): validate and bound agent/serviceId inputs`

### Guidelines
- **Minimum 95 percent test coverage** for the validator and changed page.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Cap rendered list sizes to prevent unbounded DOM growth on large responses"
labels: type:security, area:performance, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Bound list rendering against oversized backend responses

### Description
Several pages render whatever the backend returns in one pass — [`src/app/events/page.tsx`](src/app/events/page.tsx) maps up to 100 events with serialized payloads, [`src/app/search/page.tsx`](src/app/search/page.tsx) renders up to 50 results, and [`src/app/services/[serviceId]/agents/page.tsx`](src/app/services/[serviceId]/agents/page.tsx) renders a ranked list — but none guards against a backend that ignores the `limit` and returns far more rows, which can freeze the tab. This issue caps client-side rendering defensively.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a shared render cap (e.g. `MAX_RENDERED_ROWS`) and slice arrays before mapping, showing a "showing first N of M" note when truncated.
- Apply to the events, search, and top-agents lists; keep the existing empty/error states.
- Treat the cap as defence-in-depth alongside server pagination, not a replacement for it.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/performance-bound-list-render`
- Implement changes
  - **Write code in:** [`src/app/events/page.tsx`](src/app/events/page.tsx), [`src/app/search/page.tsx`](src/app/search/page.tsx), [`src/app/services/[serviceId]/agents/page.tsx`](src/app/services/[serviceId]/agents/page.tsx); define the constant in [`src/lib/format.ts`](src/lib/format.ts) or a small util.
  - **Write comprehensive tests in:** add cases to the relevant page tests asserting truncation note appears above the cap.
  - **Add documentation:** note the render cap in [`README.md`](README.md).
  - Validate the cap does not change behaviour for in-range responses.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: exactly the cap, cap+1, and a small response.
- Include the `npm test` output and a short note on the chosen cap.

### Example commit message
`fix(performance): cap rendered list sizes against oversized responses`

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
title: "Add a generated sitemap.ts and robots.ts for the dashboard routes"
labels: type:feature, area:seo, stack:nextjs, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Implement sitemap.ts and robots.ts for SEO and crawler control

### Description
The app has ~20 routes under [`src/app/`](src/app) but ships no `sitemap.ts` and no `robots.ts`, so search engines have no canonical route map and no crawl directives — and operator-only routes like `/admin`, `/api-keys`, and `/webhooks` should be explicitly disallowed from indexing. This issue adds both Next.js metadata files.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Create `src/app/sitemap.ts` returning the public static routes (home, about, docs, changelog, etc.) using the Next.js `MetadataRoute.Sitemap` type.
- Create `src/app/robots.ts` returning a `MetadataRoute.Robots` that allows public routes and disallows operator surfaces (`/admin`, `/api-keys`, `/webhooks`, `/settings`).
- Derive the base URL from a configurable site origin (env-driven), defaulting sensibly; do not hard-code a production domain.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/seo-sitemap-robots`
- Implement changes
  - **Write code in:** create `src/app/sitemap.ts` and `src/app/robots.ts`.
  - **Write comprehensive tests in:** create [`src/app/sitemap.test.ts`](src/app/sitemap.test.ts) and [`src/app/robots.test.ts`](src/app/robots.test.ts) — assert public routes are present and operator routes are disallowed.
  - **Add documentation:** add an "SEO" section to [`README.md`](README.md).
  - Validate the generated output shape against the Next.js types.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: custom site origin env, and disallow list correctness.
- Include the `npm test` output.

### Example commit message
`feat(seo): add sitemap.ts and robots.ts with crawl directives`

### Guidelines
- **Minimum 95 percent test coverage** for the new files.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add a PWA web app manifest and apple-touch metadata"
labels: type:feature, area:seo, stack:nextjs, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Implement a web app manifest for installability and richer metadata

### Description
[`src/app/layout.tsx`](src/app/layout.tsx) sets a title template, description, and OpenGraph/Twitter metadata, but the app has no `manifest.ts`, so it cannot be installed as a PWA and lacks theme-color / icon metadata that browsers and OS share sheets use. This issue adds a generated manifest and wires it into the metadata.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Create `src/app/manifest.ts` returning a `MetadataRoute.Manifest` with name, short_name, description, start_url, display, background/theme colours matching the dark/light palette in [`src/app/globals.css`](src/app/globals.css).
- Reference the existing favicon and add icon entries; do not invent assets that do not exist (reuse `src/app/favicon.ico` or add a documented placeholder).
- Add `themeColor`/`manifest` to the metadata in [`src/app/layout.tsx`](src/app/layout.tsx) per the Next.js viewport/metadata API.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/seo-web-manifest`
- Implement changes
  - **Write code in:** create `src/app/manifest.ts`; update metadata in [`src/app/layout.tsx`](src/app/layout.tsx).
  - **Write comprehensive tests in:** create [`src/app/manifest.test.ts`](src/app/manifest.test.ts) — assert required manifest fields are present and colours are valid.
  - **Add documentation:** note PWA/manifest support in [`README.md`](README.md).
  - Validate `npm run build` emits the manifest without warnings.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: theme-color matches palette and required fields present.
- Include the `npm test` output.

### Example commit message
`feat(seo): add PWA web app manifest and theme-color metadata`

### Guidelines
- **Minimum 95 percent test coverage** for the manifest module.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Make the loading skeleton announce its busy state to assistive tech"
labels: type:a11y, area:a11y, stack:nextjs, stack:react, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Add an accessible busy announcement to the route loading skeleton

### Description
[`src/app/loading.tsx`](src/app/loading.tsx) renders animated `animate-pulse` skeleton blocks during route transitions, but the container has no `role="status"`/`aria-live` and no screen-reader text, so assistive-technology users get no indication that the page is loading — they perceive an empty page. This issue makes the skeleton announce itself, mirroring the pattern in [`src/components/Spinner.tsx`](src/components/Spinner.tsx).

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Wrap the skeleton in a `role="status"` / `aria-live="polite"` region with an `sr-only` "Loading…" label.
- Keep the visual skeleton blocks `aria-hidden` so they are not announced individually.
- Respect the existing `prefers-reduced-motion` handling in [`src/app/globals.css`](src/app/globals.css).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/a11y-loading-skeleton-status`
- Implement changes
  - **Write code in:** [`src/app/loading.tsx`](src/app/loading.tsx).
  - **Write comprehensive tests in:** create [`src/app/loading.test.tsx`](src/app/loading.test.tsx) — assert the `role="status"` region and the sr-only label render and the blocks are `aria-hidden`.
  - **Add documentation:** note the accessible loading state in [`README.md`](README.md).
  - Validate against WCAG 4.1.3 (Status Messages).
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: reduced-motion on, and the sr-only label presence.
- Include the `npm test` output and an a11y note.

### Example commit message
`fix(a11y): announce route loading skeleton via role=status`

### Guidelines
- **Minimum 95 percent test coverage** for the changed file.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Reposition the Tooltip to avoid viewport overflow and clipping"
labels: type:a11y, area:a11y, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve Tooltip placement to stay within the viewport

### Description
[`src/components/Tooltip.tsx`](src/components/Tooltip.tsx) always positions its content at `bottom-full` (above the trigger) with no overflow detection, so a tooltip on an element near the top edge of the viewport is clipped and unreadable, and one near the right edge overflows horizontally. This issue adds basic collision-aware placement so tooltip content is always visible.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Measure available space and flip the tooltip below the trigger when there is insufficient room above; clamp horizontal position to stay on-screen.
- Preserve the existing `role="tooltip"` + `aria-describedby` association, `useId` wiring, and show-on-hover/focus behaviour.
- Keep `pointer-events` such that the association and focus behaviour are not broken.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/a11y-tooltip-positioning`
- Implement changes
  - **Write code in:** [`src/components/Tooltip.tsx`](src/components/Tooltip.tsx).
  - **Write comprehensive tests in:** create [`src/components/__tests__/Tooltip.test.tsx`](src/components/__tests__/Tooltip.test.tsx) — assert the association id, show on focus, and the placement-flip logic given mocked measurements.
  - **Add documentation:** add a JSDoc note describing the placement behaviour.
  - Validate keyboard focus still shows the tooltip and content is reachable.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: trigger near top edge (flips down), near right edge (clamps), and default placement.
- Include the `npm test` output and an a11y note.

### Example commit message
`fix(a11y): add collision-aware placement to Tooltip`

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
title: "Give the ConfirmDialog backdrop an accessible cancel affordance"
labels: type:a11y, area:a11y, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Add an optional, accessible backdrop-click cancel to ConfirmDialog

### Description
[`src/components/ConfirmDialog.tsx`](src/components/ConfirmDialog.tsx) already traps focus and handles Escape, but the backdrop overlay is non-interactive — users accustomed to clicking outside a modal to dismiss it cannot, and there is no documented way to enable that. This issue adds an opt-in backdrop-click cancel that is implemented accessibly (not by hijacking dialog clicks).

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a `dismissOnBackdrop?: boolean` prop; when enabled, clicking the backdrop (but not the dialog panel) calls `onCancel`.
- Ensure the backdrop handler does not fire when the click originates inside the dialog, and that it does not break the focus trap or Escape handling.
- Keep `role="dialog"`, `aria-modal`, `aria-labelledby`, and focus restoration intact; do not make a non-button element the only way to dismiss (Escape and Cancel remain).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/a11y-confirmdialog-backdrop`
- Implement changes
  - **Write code in:** [`src/components/ConfirmDialog.tsx`](src/components/ConfirmDialog.tsx).
  - **Write comprehensive tests in:** extend [`src/components/__tests__/ConfirmDialog.test.tsx`](src/components/__tests__/ConfirmDialog.test.tsx) — assert backdrop click cancels only when enabled, dialog-panel clicks do not cancel, and Escape still works.
  - **Add documentation:** document the new prop in the component JSDoc.
  - Validate the focus trap and restoration are unaffected.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: backdrop click with prop off (no cancel), click inside panel, and Escape.
- Include the `npm test` output and an a11y note.

### Example commit message
`feat(a11y): add opt-in backdrop-click cancel to ConfirmDialog`

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
title: "Add accessible labels and announcements to the toast close and stack"
labels: type:a11y, area:a11y, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve toast accessibility with a dismiss control and correct live semantics

### Description
[`src/components/ToastProvider.tsx`](src/components/ToastProvider.tsx) renders toasts in an `aria-live="polite"` `aria-atomic="true"` region that auto-dismisses after 4s, but there is no way to dismiss a toast manually, and `aria-atomic="true"` on the whole stack means every new toast re-announces the entire list. This issue adds a per-toast dismiss button and corrects the live-region semantics.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add an accessible "Dismiss" button per toast (real `<button>` with an `aria-label`) that removes that toast immediately.
- Set `aria-atomic` per item rather than on the whole container so only the new toast is announced; keep `role="alert"` for errors and `role="status"` for info.
- Preserve the 4s auto-dismiss and the `useToast` API/guard.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/a11y-toast-dismiss-and-live`
- Implement changes
  - **Write code in:** [`src/components/ToastProvider.tsx`](src/components/ToastProvider.tsx).
  - **Write comprehensive tests in:** extend [`src/components/__tests__/ToastProvider.test.tsx`](src/components/__tests__/ToastProvider.test.tsx) — assert the dismiss button removes a toast, the live semantics, and the auto-dismiss timer still fires.
  - **Add documentation:** note the dismiss affordance in the component JSDoc.
  - Validate against WCAG 4.1.3 and that stacked toasts do not over-announce.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: dismiss before auto-timeout, multiple stacked toasts, and error vs info roles.
- Include the `npm test` output and an a11y note.

### Example commit message
`fix(a11y): add toast dismiss control and correct live-region semantics`

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
title: "Render breadcrumbs across detail pages for orientation and back-navigation"
labels: type:a11y, area:navigation, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Adopt the Breadcrumb component on nested detail routes

### Description
The repo ships an accessible [`Breadcrumb`](src/components/Breadcrumb.tsx) component (`nav[aria-label="Breadcrumb"]`, `aria-current="page"`), but the deeply nested routes that most need it — [`src/app/services/[serviceId]/page.tsx`](src/app/services/[serviceId]/page.tsx), [`src/app/services/[serviceId]/edit/page.tsx`](src/app/services/[serviceId]/edit/page.tsx), [`src/app/services/[serviceId]/agents/page.tsx`](src/app/services/[serviceId]/agents/page.tsx), and [`src/app/agents/[agent]/page.tsx`](src/app/agents/[agent]/page.tsx) — use ad-hoc "Back" links instead. This issue adopts Breadcrumb for consistent orientation.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Render [`Breadcrumb`](src/components/Breadcrumb.tsx) at the top of the four nested detail pages (e.g. Services / {serviceId} / Edit) using the route params.
- Replace or complement the ad-hoc Back links; the final crumb is the current page with `aria-current="page"`.
- Encode segment labels safely and avoid layout shift; keep existing page content intact.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/navigation-adopt-breadcrumbs`
- Implement changes
  - **Write code in:** the four nested pages listed above.
  - **Write comprehensive tests in:** add assertions to those pages' tests (creating them if absent) that the breadcrumb renders the expected trail and marks the current page.
  - **Add documentation:** note the breadcrumb convention in [`README.md`](README.md).
  - Validate the breadcrumb nav landmark and `aria-current` are present.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: long ids, missing param, and the current-page crumb.
- Include the `npm test` output.

### Example commit message
`feat(navigation): adopt Breadcrumb on nested service/agent detail pages`

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
title: "Centralize user-facing strings into a typed messages module for future i18n"
labels: type:refactor, area:i18n, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Extract hardcoded UI strings into a typed messages module

### Description
Every page and component hard-codes its English copy inline — headings, button labels, empty-state text, error messages — with no central catalog, which blocks any future localization and makes copy changes error-prone. [`src/app/pageTitles.ts`](src/app/pageTitles.ts) already shows the pattern for titles. This issue introduces a typed strings module as a first, non-breaking step toward i18n.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Create `src/lib/messages.ts` (or `src/lib/strings.ts`) exporting a typed, namespaced object of user-facing strings, mirroring the style of [`src/app/pageTitles.ts`](src/app/pageTitles.ts).
- Migrate the strings of two or three representative surfaces (e.g. [`src/components/Footer.tsx`](src/components/Footer.tsx), [`src/components/EmptyState.tsx`](src/components/EmptyState.tsx) defaults, and one page) to consume it, leaving a clear pattern for follow-ups.
- Keep it framework-agnostic (no i18n library yet); the goal is a single source of truth that a future `next-intl`/`next-i18next` adoption can wrap.
- Do not change any rendered copy in this pass.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/i18n-centralize-strings`
- Implement changes
  - **Write code in:** create `src/lib/messages.ts`; migrate the chosen surfaces.
  - **Write comprehensive tests in:** create [`src/lib/__tests__/messages.test.ts`](src/lib/__tests__/messages.test.ts) — assert keys resolve and no duplicate keys, plus snapshot the migrated component copy is unchanged.
  - **Add documentation:** add an "Internationalization (groundwork)" section to [`README.md`](README.md).
  - Validate the migrated surfaces render identical text.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: missing key access fails at type level, and migrated copy matches the original.
- Include the `npm test` output.

### Example commit message
`refactor(i18n): centralize UI strings into a typed messages module`

### Guidelines
- **Minimum 95 percent test coverage** for the messages module.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Extract the duplicated positive-integer field validation into a shared helper"
labels: type:refactor, area:forms, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Consolidate the repeated numeric-field validation logic

### Description
The non-negative-integer guard for `priceStroops` is re-implemented in [`src/app/services/new/page.tsx`](src/app/services/new/page.tsx) and [`src/app/services/[serviceId]/edit/page.tsx`](src/app/services/[serviceId]/edit/page.tsx), and a similar positive-integer guard for `requests` lives in [`src/app/usage/page.tsx`](src/app/usage/page.tsx) — three copies of essentially the same parse-and-validate logic. This issue extracts a single tested helper and adopts it in all three forms.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Create `src/lib/validateNumber.ts` (e.g. `parseNonNegativeInt` / `parsePositiveInt`) returning a typed `{ ok, value }` or `{ ok: false, message }`.
- Replace the inline checks in the three pages with the helper, preserving each page's exact accepted range (≥ 0 for price, ≥ 1 for requests).
- Surface validation messages via [`TextField`](src/components/TextField.tsx)'s `error` prop where the forms already use it.
- Do not change the wire payloads or observable success behaviour.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/forms-shared-number-validation`
- Implement changes
  - **Write code in:** create `src/lib/validateNumber.ts`; update the three pages.
  - **Write comprehensive tests in:** create [`src/lib/__tests__/validateNumber.test.ts`](src/lib/__tests__/validateNumber.test.ts) and update the affected page tests.
  - **Add documentation:** JSDoc the helper; note the validation rules in [`README.md`](README.md).
  - Validate the accepted ranges per form are unchanged.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: empty, negative, float, leading-zero, and a valid integer for each range.
- Include the `npm test` output and coverage for the helper.

### Example commit message
`refactor(forms): extract shared numeric-field validation helper`

### Guidelines
- **Minimum 95 percent test coverage** for the helper and changed pages.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Document the shared hooks (useApi, useDebounce, useLocalState, usePolling)"
labels: type:docs, area:docs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Author a hooks reference for the shared lib hooks

### Description
The repo ships several reusable hooks under [`src/lib/`](src/lib) — [`useApi`](src/lib/useApi.ts), [`useDebounce`](src/lib/useDebounce.ts), [`useLocalState`](src/lib/useLocalState.ts) — plus helpers like [`apiClient`](src/lib/apiClient.ts) and [`theme`](src/lib/theme.ts), but there is no single reference describing their signatures, return shapes, and gotchas (cancellation, SSR safety, debounce timing). Contributors re-implement fetch/state logic because the hooks are undiscoverable. This issue produces a hooks catalog.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Create `docs/hooks.md` documenting each hook: signature, parameters, return shape (e.g. `useApi`'s `loading | error | ok` union), cancellation/SSR behaviour, and a minimal usage snippet derived from a real call site.
- Cross-reference where each hook is (and should be) used and link it from [`README.md`](README.md).
- Add JSDoc headers to any hook file missing one so the doc and source agree.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/docs-hooks-reference`
- Implement changes
  - **Write code in:** create `docs/hooks.md`; add missing JSDoc in [`src/lib/`](src/lib).
  - **Write comprehensive tests in:** not applicable; instead confirm each documented signature matches the exported type in source.
  - **Add documentation:** this issue is the documentation; link it from [`README.md`](README.md).
  - Validate every snippet compiles against the real signatures.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm run build`.
- Cross-check each signature/return shape against the source types.
- Include a note confirming the doc covers every hook in [`src/lib/`](src/lib).

### Example commit message
`docs(hooks): add reference for shared lib hooks`

### Guidelines
- Accuracy over completeness; signatures must match the source.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Document the theming and dark-mode architecture"
labels: type:docs, area:docs, stack:nextjs, stack:react, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Document the theme system, FOUC handling, and dark-mode tokens

### Description
The theming story spans several files — the pre-paint inline script and `suppressHydrationWarning` in [`src/app/layout.tsx`](src/app/layout.tsx), the storage helpers in [`src/lib/theme.ts`](src/lib/theme.ts), the toggle UI in [`src/components/ThemeToggle.tsx`](src/components/ThemeToggle.tsx), and the CSS variables/`prefers-color-scheme`/`prefers-reduced-motion` rules in [`src/app/globals.css`](src/app/globals.css) — but nothing explains how they fit together. New contributors risk breaking the anti-FOUC contract. This issue documents the architecture.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Create `docs/theming.md` describing the storage key (shared between [`src/lib/theme.ts`](src/lib/theme.ts) and the layout script), the pre-paint script's role, the `light | dark | system` model, and the CSS token structure in [`src/app/globals.css`](src/app/globals.css).
- Explain the reduced-motion handling and how to add a new themeable token without breaking either mode.
- Cross-link from [`README.md`](README.md).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/docs-theming-architecture`
- Implement changes
  - **Write code in:** create `docs/theming.md` (docs only).
  - **Write comprehensive tests in:** not applicable; verify the documented storage key matches `THEME_STORAGE_KEY` in [`src/lib/theme.ts`](src/lib/theme.ts) and the layout script.
  - **Add documentation:** this issue is the documentation; link it from [`README.md`](README.md).
  - Validate every referenced file/symbol exists.
- Test and commit

### Test and commit
- Run `npm run lint` and `npm run build`.
- Cross-check the storage key and token names against the source.
- Include a note confirming the doc matches the implementation.

### Example commit message
`docs(theming): document theme system, FOUC handling, and tokens`

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
title: "Author a testing guide covering Jest setup, mocking, and coverage gates"
labels: type:docs, area:docs, stack:nextjs, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Document the testing conventions, mocking patterns, and coverage thresholds

### Description
The repo has a substantial test suite and a `jest.config.ts` with per-file coverage thresholds (some files locked at 100%), a [`src/jest.setup.ts`](src/jest.setup.ts) polyfill, and established mocking patterns (mocking `@/lib/apiClient`, `next/navigation`, `matchMedia`, clipboard, fake timers), but none of this is documented — contributors must reverse-engineer the conventions from existing tests. This issue writes a testing guide.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Create `docs/testing.md` documenting: running tests, the jsdom setup in [`src/jest.setup.ts`](src/jest.setup.ts), how to mock `apiClient`/`next/navigation`/`matchMedia`/clipboard, fake-timer usage, and the per-file coverage thresholds in `jest.config.ts`.
- Reference real example tests (e.g. [`src/app/usage/page.test.tsx`](src/app/usage/page.test.tsx), [`src/components/__tests__/ConfirmDialog.test.tsx`](src/components/__tests__/ConfirmDialog.test.tsx)) as canonical patterns.
- Explain the 95% coverage expectation and how to add a file to the locked-coverage list.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/docs-testing-guide`
- Implement changes
  - **Write code in:** create `docs/testing.md` (docs only).
  - **Write comprehensive tests in:** not applicable; verify each referenced test file and config path exists.
  - **Add documentation:** this issue is the documentation; link it from [`README.md`](README.md) and any CONTRIBUTING guide.
  - Validate every referenced mock target appears in the codebase.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm test`, and `npm run build` to confirm nothing breaks.
- Cross-check the documented thresholds against `jest.config.ts`.
- Include a note confirming the documented commands run.

### Example commit message
`docs(testing): add testing guide for setup, mocking, and coverage`

### Guidelines
- Accuracy over completeness; align with the actual config and tests.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
