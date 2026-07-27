---
type: Feature
title: "Fix the non-functional stale-status guard in the admin pause toggle"
labels: type:refactor, area:admin, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Fix the broken stale-status guard in the admin pause/unpause page

### Description
[`src/app/admin/page.tsx`](src/app/admin/page.tsx) declares a `statusSeq` counter whose comment promises it "detect[s] and avoid[s] stale status overwrites if an external change happens concurrently with our toggle request." In reality the guard is dead code: `load()` computes `const seq = statusSeq + 1`, calls `setStatusSeq(seq)`, but then `setPaused((prev) => b.paused)` always returns the freshest resolved promise's value regardless of `seq` — the sequence number is never compared, so a slow earlier `/api/v1/admin/status` response can still clobber a newer one. Worse, `load` lists `statusSeq` in its `useCallback` deps while incrementing it, so the callback identity churns. This issue replaces the misleading counter with a correct, real cancellation/sequence guard (mirroring the token pattern in [`src/lib/useApi.ts`](src/lib/useApi.ts)).

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Implement a real guard: capture a per-call sequence (or an `AbortController`/ref token) and apply `setPaused` only when the resolved call is still the latest one; drop superseded responses.
- Remove `statusSeq` from the `load` `useCallback` dependency array (use a `useRef` for the sequence) so the callback identity is stable and the `eslint-disable exhaustive-deps` hack can go.
- Preserve the existing `ConfirmDialog` flow, the `StatusDot` status, the pending/disabled button, the success/error `toast`, and the `role="alert"` error path — observable behaviour for the happy path must not change.
- Do not regress the existing [`src/app/admin/page.test.tsx`](src/app/admin/page.test.tsx); extend it.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/admin-fix-stale-status-guard`
- Implement changes
  - **Write code in:** [`src/app/admin/page.tsx`](src/app/admin/page.tsx) — replace the dead `statusSeq` logic with a working latest-wins guard via `useRef`.
  - **Write comprehensive tests in:** extend [`src/app/admin/page.test.tsx`](src/app/admin/page.test.tsx) — assert an out-of-order/slow status response is ignored, the latest response wins, and a toggle still refreshes correctly.
  - **Add documentation:** add a JSDoc note describing the latest-wins semantics; correct the misleading inline comments.
  - Validate no state-after-unmount warnings and stable callback identity.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: slow then fast status response, toggle while a status load is in flight, unmount during fetch, and load error.
- Include the `npm test` output and a short note on the chosen guard mechanism.

### Example commit message
`refactor(admin): replace dead statusSeq with a working latest-wins guard`

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
title: "Add in-flight feedback and a reset to the usage query form"
labels: type:enhancement, area:usage, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve the usage query form with a loading state and result reset

### Description
On [`src/app/usage/page.tsx`](src/app/usage/page.tsx) the "Query usage" form fires `GET /api/v1/usage/{agent}/{serviceId}` with no pending indication and no disabled state, so an operator can resubmit repeatedly while a request is in flight, and a stale `queryResult` from a previous lookup stays visible while a new query for a different agent runs — making it ambiguous which agent the displayed total belongs to. The "Record usage" form has the same lack of a busy state. This issue adds explicit in-flight feedback and clears stale results on a new submit.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a `querying`/`recording` busy flag for each form: disable the submit button and show a [`Spinner`](src/components/Spinner.tsx) or `role="status"` "Querying…" while the request is in flight.
- Clear the previous `queryResult` (and `queryError`) at the start of each new query so a superseded total is not shown next to a different agent/service.
- Keep the existing positive-integer guard on `requests`, the `role="status"`/`role="alert"` regions, and the current request/query behaviour.
- Do not change the network layer in this issue (the apiClient migration is tracked separately); only add UI feedback and reset.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/usage-query-inflight-feedback`
- Implement changes
  - **Write code in:** [`src/app/usage/page.tsx`](src/app/usage/page.tsx).
  - **Write comprehensive tests in:** extend [`src/app/usage/page.test.tsx`](src/app/usage/page.test.tsx) — mock fetch, assert the button disables while pending, the busy status shows, and a new query clears the prior result before the response arrives.
  - **Add documentation:** note the query feedback behaviour in [`README.md`](README.md).
  - JSDoc any extracted submit helper; validate the busy region is announced and does not steal focus.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: double-submit blocked, query error after a prior success, and an empty/zero total.
- Include the `npm test` output.

### Example commit message
`feat(usage): add in-flight busy state and result reset to the query form`

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
title: "Add an empty state to the changelog page when no entries are returned"
labels: type:enhancement, area:changelog, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Render an empty state on the changelog page for zero entries

### Description
[`src/app/changelog/page.tsx`](src/app/changelog/page.tsx) handles `loading` (via [`Spinner`](src/components/Spinner.tsx)) and `error` (via `role="alert"`), but when the API returns `{ entries: [] }` it renders an empty `<ol>` with nothing inside — the page just shows the heading and a blank gap, which reads as a broken page rather than "no releases yet." The repo already ships [`EmptyState`](src/components/EmptyState.tsx) for exactly this case. This issue adds the empty branch.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- When `state.status === "ok"` and `entries.length === 0`, render [`EmptyState`](src/components/EmptyState.tsx) with a clear title (e.g. "No changelog entries yet") instead of an empty list.
- Keep the existing `loading`, `error`, and populated-list branches and the `useApi` wiring unchanged.
- Do not introduce a new fetch path; continue using [`src/lib/useApi.ts`](src/lib/useApi.ts).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/changelog-empty-state`
- Implement changes
  - **Write code in:** [`src/app/changelog/page.tsx`](src/app/changelog/page.tsx).
  - **Write comprehensive tests in:** extend [`src/app/changelog/page.test.tsx`](src/app/changelog/page.test.tsx) — mock `@/lib/apiClient`, assert the empty state renders for `entries: []` and the list renders when entries exist.
  - **Add documentation:** note the empty-state behaviour in [`README.md`](README.md).
  - Validate the empty state is reachable and announced like the other pages.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: empty entries, single entry, error, and loading.
- Include the `npm test` output.

### Example commit message
`feat(changelog): add empty state for zero entries`

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
title: "Make the StatTile trend convey direction without relying on colour alone"
labels: type:a11y, area:components, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Make the StatTile trend non-colour-dependent and screen-reader friendly

### Description
[`src/components/StatTile.tsx`](src/components/StatTile.tsx) renders the trend delta as a bare number whose meaning (good vs bad) is conveyed **only** by `text-emerald-700` vs `text-rose-700`. This fails WCAG 1.4.1 (Use of Color): colour-blind users and screen-reader users cannot tell whether a trend is favourable, and the number alone has no directional or contextual label. This issue adds a non-colour indicator (arrow/▲▼ glyph or "up/down" text) plus an accessible label, without changing the existing `trend` prop contract.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a redundant non-colour cue for direction (e.g. a ▲/▼ glyph or "up"/"down" text) so meaning is not conveyed by colour alone.
- Add an accessible label (e.g. `aria-label` like "up 12" / "down 3") and mark any decorative glyph `aria-hidden`.
- Keep the existing `positiveIsGood` logic (default true) that decides the good/bad colour; the new cue should reflect direction, the colour reflects good/bad.
- Preserve the `<dt>`/`<dd>` structure and the public `Props` type unchanged so all current callers (stats page) keep working.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/components-stattile-trend-color`
- Implement changes
  - **Write code in:** [`src/components/StatTile.tsx`](src/components/StatTile.tsx).
  - **Write comprehensive tests in:** create [`src/components/__tests__/StatTile.test.tsx`](src/components/__tests__/StatTile.test.tsx) — assert the directional cue renders for positive/negative deltas, the accessible label is present, and `positiveIsGood` flips the good/bad treatment.
  - **Add documentation:** add a JSDoc block documenting the trend semantics and the non-colour cue.
  - Validate against WCAG 1.4.1 (information not by colour alone).
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: zero delta, negative delta, `positiveIsGood: false`, and no trend prop.
- Include the `npm test` output.

### Example commit message
`fix(a11y): make StatTile trend direction non-colour-dependent`

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
title: "Give the SearchBar a configurable accessible label and an optional clear button"
labels: type:a11y, area:components, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Add a configurable label and clear affordance to the SearchBar

### Description
[`src/components/SearchBar.tsx`](src/components/SearchBar.tsx) hard-codes its visually hidden label to the literal word "Search", so every place it is reused (the search page, and the planned docs/events filters) announces the identical generic name to screen readers with no way to distinguish "Search services" from "Filter endpoints." It also offers no way to clear the current query other than manual backspacing. This issue makes the label configurable and adds an optional clear button, keeping the existing input behaviour.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add an optional `label` prop (default "Search") used for the `sr-only` text and the input's accessible name; keep the existing `value`/`onChange`/`placeholder` contract backward compatible.
- Add an optional clear button (shown only when `value` is non-empty) that calls `onChange("")`, has an accessible label (e.g. "Clear search"), and returns focus to the input.
- Preserve `type="search"`, the focus-visible ring, and the `...rest` passthrough.
- Do not break existing callers (search page) — the new props are additive with safe defaults.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/components-searchbar-label-clear`
- Implement changes
  - **Write code in:** [`src/components/SearchBar.tsx`](src/components/SearchBar.tsx).
  - **Write comprehensive tests in:** create [`src/components/__tests__/SearchBar.test.tsx`](src/components/__tests__/SearchBar.test.tsx) — assert the custom label sets the accessible name, typing calls `onChange`, the clear button appears only with a value and resets it, and focus returns to the input.
  - **Add documentation:** add a JSDoc block documenting the `label` and clear behaviour.
  - Validate the input has a programmatic name and the clear control is keyboard operable.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: empty value (no clear button), custom label, and clear restoring focus.
- Include the `npm test` output.

### Example commit message
`feat(a11y): add configurable label and clear button to SearchBar`

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
title: "Turn the home page quick-links into a labelled navigation landmark"
labels: type:a11y, area:home, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Make the home page quick-links a proper labelled nav landmark

### Description
[`src/app/page.tsx`](src/app/page.tsx) renders its primary calls-to-action (Manage services, View stats, Record usage, Stellar) as a bare `<div className="flex …">` of `<Link>`/`<a>` elements, not a navigation landmark. Screen-reader users get no landmark or group label for the main entry points, the list is not semantic, and the destinations are an arbitrary subset of the app's routes. This issue wraps the quick-links in a labelled `<nav>` with a semantic list and rounds out the destination set.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Wrap the action group in a `<nav aria-label="Quick links">` containing a `<ul>` of links so it becomes a navigable landmark with a semantic list.
- Keep the existing external Stellar link with `target="_blank"` and `rel="noopener noreferrer"`; keep the focus-visible rings and the responsive layout.
- Consider adding the obvious missing primary destinations (e.g. Agents, Docs) so the home page reflects the real route map.
- Do not regress the existing [`src/app/page.test.tsx`](src/app/page.test.tsx); extend it.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/home-quick-links-nav-landmark`
- Implement changes
  - **Write code in:** [`src/app/page.tsx`](src/app/page.tsx).
  - **Write comprehensive tests in:** extend [`src/app/page.test.tsx`](src/app/page.test.tsx) — assert a `navigation` landmark with the accessible name renders, the links are within a list, and the external link carries `rel="noopener noreferrer"`.
  - **Add documentation:** note the home quick-links in [`README.md`](README.md).
  - Validate the landmark is reachable and the list is semantic (`getByRole('navigation', { name: … })`).
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: keyboard tab order through the links and the external link target/rel.
- Include the `npm test` output.

### Example commit message
`feat(a11y): wrap home quick-links in a labelled nav landmark`

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
title: "Expand the Footer with navigation links, Discord, and a dynamic copyright year"
labels: type:feature, area:footer, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Build out the Footer with links, community, and a copyright line

### Description
[`src/components/Footer.tsx`](src/components/Footer.tsx) is a single static tagline paragraph — it has no links to secondary routes (About, Docs, Changelog), no community link to the AgentPay Discord, and no copyright/year line, even though it is rendered on every page via [`src/app/layout.tsx`](src/app/layout.tsx). This issue turns it into a useful footer with a labelled navigation region, an external Discord/repo link, and a dynamically computed year.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a `<nav aria-label="Footer">` with internal `<Link>`s to existing routes (e.g. About, Docs, Changelog, Stats) and keep the tagline.
- Add an external community link to the AgentPay Discord (https://discord.gg/eXvRKkgcv) with `target="_blank"` and `rel="noopener noreferrer"`.
- Render a copyright line using a dynamically computed year (`new Date().getFullYear()`) so it never goes stale.
- Preserve the `<footer>` landmark, the border/spacing styles, and dark-mode classes; only add links to routes that actually exist in [`src/app/`](src/app).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/footer-links-and-copyright`
- Implement changes
  - **Write code in:** [`src/components/Footer.tsx`](src/components/Footer.tsx).
  - **Write comprehensive tests in:** create [`src/components/__tests__/Footer.test.tsx`](src/components/__tests__/Footer.test.tsx) — assert the footer nav landmark and links render, the Discord link has the safe `rel`, and the current year appears (mock `Date` if asserting exact year).
  - **Add documentation:** note the footer links in [`README.md`](README.md).
  - JSDoc the component; validate each internal link points at a real route.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: external link rel/target, year boundary, and all internal links resolving.
- Include the `npm test` output.

### Example commit message
`feat(footer): add navigation links, Discord, and dynamic copyright year`

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
title: "Make the About page link to the dashboard surfaces it describes"
labels: type:enhancement, area:about, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Turn the About page prose into linked entry points

### Description
[`src/app/about/page.tsx`](src/app/about/page.tsx) is a static two-paragraph blurb that enumerates "every read and write surface the backend provides: service registry, usage metering, billing quotes, audit log, webhooks, API keys, and admin pause/unpause" — but none of those named surfaces is a link, so the page is a dead end that describes routes a user then has to find manually. This issue keeps the descriptive copy but turns each named surface into a `<Link>` to its actual route, making About a useful orientation page.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Convert the named surfaces into Next.js `<Link>`s to their real routes that exist under [`src/app/`](src/app): service registry → `/services`, usage metering → `/usage`, billing quotes → `/settle` (or `/docs` if `/settle` is not yet present), audit log → `/events`, webhooks → `/webhooks`, API keys → `/api-keys`, admin pause/unpause → `/admin`.
- Render the links as a labelled list (e.g. a `<nav aria-label="Dashboard surfaces">` or a `<ul>`) rather than inline-only, while keeping the introductory paragraph.
- Preserve the existing `metadata` title export, the `main` landmark, focus-visible rings, and dark-mode classes.
- Only link routes that actually exist; do not invent endpoints.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/about-surface-links`
- Implement changes
  - **Write code in:** [`src/app/about/page.tsx`](src/app/about/page.tsx).
  - **Write comprehensive tests in:** create [`src/app/about/page.test.tsx`](src/app/about/page.test.tsx) — assert each described surface renders as a link to the expected route and the intro copy remains.
  - **Add documentation:** note the About entry points in [`README.md`](README.md).
  - Validate every link target resolves to a real route and the list is semantic.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: keyboard reachability of every link and the `/settle` vs `/docs` fallback for billing quotes.
- Include the `npm test` output.

### Example commit message
`feat(about): link the described dashboard surfaces to their routes`

### Guidelines
- **Minimum 95 percent test coverage** for the changed page.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.