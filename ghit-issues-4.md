---
type: Feature
title: "Migrate the New Service form to TextField and the shared positive-integer validator"
labels: type:enhancement, area:services, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Refactor the New Service form onto TextField and shared validation

### Description
[`src/app/services/new/page.tsx`](src/app/services/new/page.tsx) hand-rolls two raw `<input>` elements with duplicated Tailwind classes, an inline `Number.isInteger(n) || n < 0` price check, and a manually wired `role="alert"` paragraph — even though the repo ships the accessible [`TextField`](src/components/TextField.tsx) primitive (label + `aria-describedby` + `aria-invalid` + `error` slot) and a `Button` component. This issue migrates both fields to `TextField`, surfaces the price error through the field's `error` prop, and routes validation through the shared positive-integer helper instead of an inline check.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Replace the two bespoke `<input>` blocks with [`TextField`](src/components/TextField.tsx), preserving `required`, `maxLength={128}` on Service ID and `inputMode="numeric"` on price.
- Show the "Price must be a non-negative integer." message via the price field's `error` prop (per-field), not only a page-level alert.
- Reuse the shared field validator if present; otherwise validate inline but keep behaviour identical.
- Keep the existing `router.push("/services")` success navigation and the `disabled`/`Saving…` submit affordance.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/services-new-textfield-validation`
- Implement changes
  - **Write code in:** [`src/app/services/new/page.tsx`](src/app/services/new/page.tsx); reuse [`src/components/TextField.tsx`](src/components/TextField.tsx) and [`src/components/Button.tsx`](src/components/Button.tsx).
  - **Write comprehensive tests in:** create [`src/app/services/new/page.test.tsx`](src/app/services/new/page.test.tsx) — mock apiClient + `next/navigation`, assert the price error attaches to the field, a valid submit posts and navigates, and a backend error alerts.
  - **Add documentation:** note the form validation in [`README.md`](README.md).
  - JSDoc any extracted helper; validate `aria-invalid`/`aria-describedby` wiring from TextField.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: negative price, decimal price, empty service id, and a backend `invalid_request`.
- Include the `npm test` output.

### Example commit message
`feat(services): migrate New Service form to TextField with field-level validation`

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
title: "Fix the hard-coded confirm-title id so concurrent ConfirmDialogs do not collide"
labels: type:a11y, area:components, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Make the ConfirmDialog title id unique per instance

### Description
[`src/components/ConfirmDialog.tsx`](src/components/ConfirmDialog.tsx) wires its accessible name with a literal `aria-labelledby="confirm-title"` on the dialog and `id="confirm-title"` on the `<h2>`, while correctly generating a unique `descriptionId` via `useId()` for the description. The hard-coded title id is a latent a11y bug: if two dialogs ever mount (e.g. a future page with both a revoke and a remove dialog), the duplicate `id` makes `aria-labelledby` ambiguous and produces invalid HTML. This issue derives the title id from `useId()` like the description already does.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Generate a unique title id (e.g. `${baseId}-title`) from the existing `useId()` and reference it from both the dialog's `aria-labelledby` and the `<h2 id>`.
- Do not change the dialog's focus trap, Escape-to-cancel, scroll lock, or focus restoration behaviour.
- Keep the public `Props` type unchanged so all current callers (api-keys, webhooks) keep working.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/components-confirmdialog-unique-title-id`
- Implement changes
  - **Write code in:** [`src/components/ConfirmDialog.tsx`](src/components/ConfirmDialog.tsx).
  - **Write comprehensive tests in:** create [`src/components/__tests__/ConfirmDialog.test.tsx`](src/components/__tests__/ConfirmDialog.test.tsx) — render two dialogs and assert each `aria-labelledby` resolves to its own unique `<h2>` id, and the accessible name is correct via `getByRole('dialog', { name })`.
  - **Add documentation:** note the unique-id contract in the component JSDoc.
  - Validate the rendered HTML has no duplicate `id` attributes.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: two simultaneous dialogs, dialog without a description, and accessible-name resolution.
- Include the `npm test` output.

### Example commit message
`fix(a11y): derive ConfirmDialog title id from useId to avoid id collisions`

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
title: "Replace the events page Loading… text with the shared Spinner and a busy region"
labels: type:enhancement, area:events, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Use the Spinner primitive for the events page loading state

### Description
[`src/app/events/page.tsx`](src/app/events/page.tsx) gained filtering and auto-refresh, but its initial pending branch still renders a bare `{loading && !error && <p>Loading…</p>}` string instead of the shared [`Spinner`](src/components/Spinner.tsx) used elsewhere, and the loading paragraph carries no `role="status"`/`aria-busy`, so assistive tech is not told the page is fetching. This issue swaps the plain text for the Spinner inside a properly announced busy region without disturbing the existing filter/auto-refresh logic.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Replace the `<p>Loading…</p>` with [`Spinner`](src/components/Spinner.tsx) wrapped in a `role="status"`/`aria-busy` region consistent with the other pages.
- Do not change the `parseEventsResponse`, debounced filter, or `EVENT_POLL_INTERVAL_MS` polling behaviour.
- Keep the `EmptyState`, error `role="alert"`, and the rendered event list exactly as they are.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/events-spinner-loading`
- Implement changes
  - **Write code in:** [`src/app/events/page.tsx`](src/app/events/page.tsx).
  - **Write comprehensive tests in:** extend [`src/app/events/page.test.tsx`](src/app/events/page.test.tsx) — assert the Spinner/busy region shows during the initial fetch and is gone after data resolves.
  - **Add documentation:** note the loading affordance in [`README.md`](README.md).
  - Validate the busy region is announced and does not steal focus.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: slow first load, background auto-refresh (no spinner flash), and error.
- Include the `npm test` output.

### Example commit message
`feat(events): replace Loading… text with Spinner in an announced busy region`

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
title: "Add a Settings page section to view and override the configured API base URL"
labels: type:feature, area:settings, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Surface the resolved API base URL on the Settings page

### Description
[`src/app/settings/page.tsx`](src/app/settings/page.tsx) only renders an Appearance section with the [`ThemeToggle`](src/components/ThemeToggle.tsx); operators have no way to see which backend the dashboard is talking to, even though [`src/lib/resolveApiBase.ts`](src/lib/resolveApiBase.ts) computes that origin and it drives every request. This issue adds a read-only "Connection" section that displays the resolved API base (with a [`CopyButton`](src/components/CopyButton.tsx)) so operators can confirm the environment they are in.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a "Connection" `<section>` that shows the resolved base URL from [`resolveApiBase`](src/lib/resolveApiBase.ts) inside a [`KeyValueGrid`](src/components/KeyValueGrid.tsx) row with a [`CopyButton`](src/components/CopyButton.tsx).
- Keep the page server-rendered where possible; only the copy control needs a client island.
- Preserve the existing Appearance section, the `main` landmark, the metadata title, and dark-mode classes.
- Do not display any secret value — only the public base URL.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/settings-api-base-section`
- Implement changes
  - **Write code in:** [`src/app/settings/page.tsx`](src/app/settings/page.tsx); reuse [`src/components/KeyValueGrid.tsx`](src/components/KeyValueGrid.tsx) and [`src/components/CopyButton.tsx`](src/components/CopyButton.tsx).
  - **Write comprehensive tests in:** create [`src/app/settings/page.test.tsx`](src/app/settings/page.test.tsx) — assert the resolved base renders and the copy control is present.
  - **Add documentation:** note the Connection section in [`README.md`](README.md).
  - JSDoc the island; validate the copy control's `aria-live` feedback.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: default localhost base, an overridden env base, and copy behaviour.
- Include the `npm test` output.

### Example commit message
`feat(settings): add Connection section displaying the resolved API base URL`

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
title: "Render the docs OpenAPI link through the safeHref-validated link path"
labels: type:security, area:docs, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Route the docs page external/relative links through safeHref

### Description
[`src/app/docs/page.tsx`](src/app/docs/page.tsx) renders a relative `<a href="/api/v1/openapi.json">` and an absolute GitHub `<a href="…/docs/api-integration.md">` as raw anchors, while the rest of the app (e.g. [`src/app/webhooks/page.tsx`](src/app/webhooks/page.tsx)) routes hrefs through the [`safeHref`](src/lib/url.ts) validator and adds `rel="noopener noreferrer"` to `target="_blank"` links. The docs anchors bypass that hardening. This issue brings them in line: validate hrefs via `safeHref` and apply the safe `rel`/`target` policy consistently.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Validate both hrefs through [`safeHref`](src/lib/url.ts); render plain text (or omit the link) when validation fails.
- The external GitHub link must carry `target="_blank"` and `rel="noopener noreferrer"`; the relative OpenAPI link stays same-tab.
- Keep the page server-rendered and the existing prose/`<dl>` endpoint list unchanged.
- Do not invent new endpoints; only harden the existing links.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/docs-safehref-links`
- Implement changes
  - **Write code in:** [`src/app/docs/page.tsx`](src/app/docs/page.tsx); reuse [`src/lib/url.ts`](src/lib/url.ts).
  - **Write comprehensive tests in:** create [`src/app/docs/page.test.tsx`](src/app/docs/page.test.tsx) — assert the external link has the safe `rel`/`target` and the relative link renders same-tab.
  - **Add documentation:** note the link hardening in [`README.md`](README.md).
  - Validate no `target="_blank"` link is missing `rel="noopener noreferrer"`.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: validated external link, relative link, and a rejected scheme fallback.
- Include the `npm test` output.

### Example commit message
`fix(security): route docs page links through safeHref with safe rel/target`

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
title: "Add unit tests for the safeHref URL scheme validator"
labels: type:test, area:testing, stack:nextjs, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the safeHref scheme and relative/absolute URL handling

### Description
[`src/lib/url.ts`](src/lib/url.ts) `safeHref` is security-critical — it decides which hrefs the dashboard renders (blocking `javascript:`/`data:`, protocol-relative `//`, and unparseable schemes while allowing `#`, `/`, and `http(s)`) and is consumed by [`src/app/webhooks/page.tsx`](src/app/webhooks/page.tsx) for backend-supplied webhook URLs. Despite gating XSS-relevant rendering, it has no test. This issue locks its behaviour with a focused suite.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Assert acceptance of: `http://…`, `https://…`, root-relative `/path`, and hash-only `#section`.
- Assert rejection of: `javascript:alert(1)`, `data:text/html,…`, protocol-relative `//evil.com`, empty/whitespace, `null`/`undefined`, and `mailto:`/`tel:` (intentionally rejected per the JSDoc).
- Cover the obfuscation guards in `normaliseScheme` (leading whitespace, missing colon, colon at index 0).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-safehref`
- Implement changes
  - **Write comprehensive tests in:** create [`src/lib/__tests__/url.test.ts`](src/lib/__tests__/url.test.ts).
  - **Write code in:** no source change expected (file a follow-up if a bug is found).
  - **Add documentation:** none beyond test descriptions.
  - Validate the result shape (`{ ok: true, href }` vs `{ ok: false }`) for each case.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: leading whitespace `  javascript:`, uppercase `HTTPS:`, and a bare word with no scheme.
- Include the `npm test` output and coverage for `url.ts`.

### Example commit message
`test(lib): cover safeHref scheme validation and relative/absolute handling`

### Guidelines
- **Minimum 95 percent test coverage** for `url.ts`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add unit tests for the securityHeaders CSP builder and origin extraction"
labels: type:test, area:testing, stack:nextjs, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test buildCsp, originOf, and defaultSecurityHeaders

### Description
[`src/lib/securityHeaders.ts`](src/lib/securityHeaders.ts) constructs the Content-Security-Policy and the hardening header map served by every route via [`next.config.ts`](next.config.ts) — including `connect-src` derived from the API origin, the dev-only `'unsafe-eval'` script source, and the production-only `Strict-Transport-Security` header. A regression here silently weakens the dashboard's security posture, yet the module has no test. This issue adds coverage for the builder functions.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Assert `originOf` returns the correct origin for a valid base and falls back to the localhost default for an unparseable input.
- Assert `buildCsp` includes `connect-src 'self' <apiOrigin>`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, and adds `'unsafe-eval'` to `script-src` only when `isDev` is true.
- Assert `defaultSecurityHeaders` includes `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, and only includes `Strict-Transport-Security` when not dev.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-security-headers`
- Implement changes
  - **Write comprehensive tests in:** create [`src/lib/__tests__/securityHeaders.test.ts`](src/lib/__tests__/securityHeaders.test.ts).
  - **Write code in:** no source change expected (file a follow-up if a bug is found).
  - **Add documentation:** none beyond test descriptions.
  - Validate the CSP string is a single `; `-joined directive list.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: dev vs prod script-src, HSTS presence, unparseable apiBase, and a custom https origin.
- Include the `npm test` output and coverage for `securityHeaders.ts`.

### Example commit message
`test(lib): cover buildCsp, originOf, and defaultSecurityHeaders`

### Guidelines
- **Minimum 95 percent test coverage** for `securityHeaders.ts`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add unit tests for safeStringify circular, BigInt, and truncation handling"
labels: type:test, area:testing, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the safeStringify serialiser and safeFormatTimestamp fallbacks

### Description
[`src/lib/format.ts`](src/lib/format.ts) exposes `safeStringify` (used by the event log to render arbitrary payloads without throwing — handling circular refs as `[Circular]`, `BigInt` as a marker, functions/symbols/undefined, and truncating past `EVENT_PAYLOAD_MAX_CHARS`) and `safeFormatTimestamp` (which coerces malformed timestamps to a placeholder). The `formatStroops`/`formatRequests` paths have tests, but these two render-safety helpers do not. This issue covers them.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- For `safeStringify`: assert circular objects produce `[Circular]`, `BigInt` produces `[BigInt:…]`, top-level `undefined`/function/symbol return the typeof sentinel, and an over-long string is truncated with `EVENT_PAYLOAD_TRUNCATED_MARKER`.
- Assert a custom `maxChars` is respected and small payloads are returned untruncated.
- For `safeFormatTimestamp`: assert valid numeric/string timestamps return ISO, and `null`/`undefined`/non-finite/`NaN` inputs return the fallback dash.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-safestringify-timestamp`
- Implement changes
  - **Write comprehensive tests in:** extend [`src/lib/__tests__/format.test.ts`](src/lib/__tests__/format.test.ts).
  - **Write code in:** no source change expected (file a follow-up if a bug is found).
  - **Add documentation:** none beyond test descriptions.
  - Validate the function never throws for any input shape.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: nested circular, a payload exactly at the limit, BigInt inside an array, and a `"not-a-date"` timestamp string.
- Include the `npm test` output and coverage for `format.ts`.

### Example commit message
`test(lib): cover safeStringify circular/BigInt/truncation and safeFormatTimestamp`

### Guidelines
- **Minimum 95 percent test coverage** for the impacted functions.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the Spinner accessible busy semantics and label"
labels: type:test, area:testing, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the Spinner role, label, and reduced-motion class

### Description
[`src/components/Spinner.tsx`](src/components/Spinner.tsx) is rendered across loading states on services, agents, search, and stats, and it pairs with the `prefers-reduced-motion` overrides in [`src/app/globals.css`](src/app/globals.css), but it has no test — so a regression in its accessible busy semantics (role/label) or its `animate-spin` class hook would go unnoticed across every page that uses it. This issue adds focused coverage.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Assert the Spinner exposes an accessible busy/loading status (e.g. `role="status"` or an accessible label) so screen readers announce it.
- Assert the element carries the `animate-spin` class hook that the reduced-motion media query in [`globals.css`](src/app/globals.css) targets.
- Assert any optional `label`/size prop renders as documented; use semantic queries rather than class-only assertions where possible.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-spinner`
- Implement changes
  - **Write comprehensive tests in:** create [`src/components/__tests__/Spinner.test.tsx`](src/components/__tests__/Spinner.test.tsx).
  - **Add documentation:** add a JSDoc header to [`src/components/Spinner.tsx`](src/components/Spinner.tsx) if missing.
  - Validate the accessible name is present for assistive tech.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: default render, custom label, and the animate-spin hook presence.
- Include the `npm test` output and coverage for the component.

### Example commit message
`test(components): cover Spinner busy semantics and animation hook`

### Guidelines
- **Minimum 95 percent test coverage** for `Spinner.tsx`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the Tooltip hover, focus, and Escape-to-dismiss behaviour"
labels: type:test, area:testing, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the Tooltip WCAG 1.4.13 hover/focus/dismiss contract

### Description
[`src/components/Tooltip.tsx`](src/components/Tooltip.tsx) implements WCAG 2.1 SC 1.4.13 — it shows on hover/focus, stays hoverable, links the trigger via `aria-describedby` only while visible, and dismisses on Escape without moving focus — but none of that behaviour is tested. As the docstring spells out a precise contract, regressions are easy to introduce silently. This issue locks the behaviour down.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Assert the tooltip content (`role="tooltip"`) appears on mouse enter and on focus, and disappears on mouse leave and blur.
- Assert `aria-describedby` on the trigger is present only while the tooltip is visible and points at the tooltip id.
- Assert pressing Escape hides the tooltip and leaves focus on the trigger.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-tooltip`
- Implement changes
  - **Write comprehensive tests in:** create [`src/components/__tests__/Tooltip.test.tsx`](src/components/__tests__/Tooltip.test.tsx).
  - **Add documentation:** none beyond test descriptions (the component already documents the contract).
  - Validate focus stays on the trigger after Escape via `document.activeElement`.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: rapid enter/leave, focus then Escape, and aria-describedby cleared on hide.
- Include the `npm test` output and coverage for the component.

### Example commit message
`test(components): cover Tooltip hover/focus/Escape behaviour`

### Guidelines
- **Minimum 95 percent test coverage** for `Tooltip.tsx`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the Footer navigation, Discord link, and dynamic year"
labels: type:test, area:testing, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the Footer links, safe external rel, and copyright year

### Description
[`src/components/Footer.tsx`](src/components/Footer.tsx) renders on every page via [`src/app/layout.tsx`](src/app/layout.tsx) and (after the footer build-out) carries internal nav links, an external Discord link, and a dynamic copyright year, but it has no dedicated test. A regression in the external link's `rel` or a broken internal route would ship to every page unnoticed. This issue adds coverage.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Assert the footer landmark renders, the internal `<Link>`s point at real routes, and the tagline is present.
- Assert any external/Discord link carries `target="_blank"` and `rel="noopener noreferrer"`.
- Assert the copyright line shows the current year (mock `Date` for a deterministic assertion).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-footer`
- Implement changes
  - **Write comprehensive tests in:** create [`src/components/__tests__/Footer.test.tsx`](src/components/__tests__/Footer.test.tsx).
  - **Add documentation:** add a JSDoc header to [`src/components/Footer.tsx`](src/components/Footer.tsx) if missing.
  - Validate every internal link target resolves to a route under [`src/app/`](src/app).
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: external rel/target, year boundary, and all internal links resolving.
- Include the `npm test` output and coverage for the component.

### Example commit message
`test(components): cover Footer nav, external rel, and dynamic year`

### Guidelines
- **Minimum 95 percent test coverage** for `Footer.tsx`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the Settings page Appearance section and ThemeToggle wiring"
labels: type:test, area:testing, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the Settings page rendering and theme controls

### Description
[`src/app/settings/page.tsx`](src/app/settings/page.tsx) renders the Appearance section and the [`ThemeToggle`](src/components/ThemeToggle.tsx), but the page itself has no test — the heading, the `main` landmark, the section structure, and the toggle's presence are unverified, so a refactor could quietly drop the only place a user changes theme. This issue adds page-level coverage.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Assert the `<h1>Settings</h1>`, the Appearance `<h2>`, and the descriptive copy render.
- Assert the [`ThemeToggle`](src/components/ThemeToggle.tsx) is present (mock `localStorage`/`matchMedia` in setup since jsdom lacks `matchMedia`).
- Assert the `main` landmark with `id="main-content"` exists for the skip link.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-settings-page`
- Implement changes
  - **Write comprehensive tests in:** create [`src/app/settings/page.test.tsx`](src/app/settings/page.test.tsx).
  - **Add documentation:** none beyond test descriptions.
  - Validate the page renders without `matchMedia` errors (stub it in the test).
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: toggle present, headings present, and main landmark id.
- Include the `npm test` output and coverage for the page.

### Example commit message
`test(settings): cover Settings page Appearance section and ThemeToggle`

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
title: "Replace the New Service Saving… text button with the loading-aware Button primitive"
labels: type:enhancement, area:services, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Adopt the loading-aware Button on the New Service submit

### Description
[`src/app/services/new/page.tsx`](src/app/services/new/page.tsx) renders a bespoke `<button>` that swaps its label to "Saving…" and toggles `disabled` while submitting, duplicating logic the shared [`Button`](src/components/Button.tsx) (with its `loading`/`aria-busy` support) is meant to own. This issue swaps the inline button for the primitive so the busy state is announced to assistive tech and the markup is consistent with other forms.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Replace the inline submit `<button>` with [`Button`](src/components/Button.tsx) using its `loading` prop bound to the page's `loading` state.
- Keep `type="submit"` so the form still submits, and preserve the disabled-while-saving behaviour.
- Do not change the validation or the `router.push("/services")` success path.
- Coordinate with the New Service TextField migration if both land; this issue only touches the submit control.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/services-new-loading-button`
- Implement changes
  - **Write code in:** [`src/app/services/new/page.tsx`](src/app/services/new/page.tsx); reuse [`src/components/Button.tsx`](src/components/Button.tsx).
  - **Write comprehensive tests in:** extend/create [`src/app/services/new/page.test.tsx`](src/app/services/new/page.test.tsx) — assert the button is disabled and `aria-busy` during submit and re-enables after.
  - **Add documentation:** note the busy submit in [`README.md`](README.md).
  - Validate the busy state is announced and clicks are blocked while loading.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: submit then error (button re-enables), double-click blocked, and success navigation.
- Include the `npm test` output.

### Example commit message
`feat(services): use the loading-aware Button on the New Service form`

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
title: "Add an inline status code and severity Badge to the StatusDot variants"
labels: type:enhancement, area:components, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Let StatusDot accept a custom label and align with the Badge palette

### Description
[`src/components/StatusDot.tsx`](src/components/StatusDot.tsx) hard-codes its three labels ("Operational", "Degraded", "Down") and offers no way to override the text, so the admin page cannot show, say, "Paused" using the same dot affordance — it would have to render a separate element. The component also re-declares colour values that overlap conceptually with [`Badge`](src/components/Badge.tsx)'s variants. This issue adds an optional `label` override (defaulting to the existing text) so the dot is reusable beyond the three fixed states, keeping the colour-coded dot intact.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add an optional `label?: ReactNode` prop that overrides the default per-variant text; keep the existing defaults when omitted.
- Keep the `aria-hidden` colour dot plus the visible text label so meaning is not conveyed by colour alone.
- Preserve the existing `variant` union (`ok | warn | down`) and the public shape for current callers (admin/stats).
- Do not change the rendered DOM structure for existing call sites that omit `label`.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/components-statusdot-custom-label`
- Implement changes
  - **Write code in:** [`src/components/StatusDot.tsx`](src/components/StatusDot.tsx).
  - **Write comprehensive tests in:** create [`src/components/__tests__/StatusDot.test.tsx`](src/components/__tests__/StatusDot.test.tsx) — assert default labels per variant, a custom label overrides, and the dot is `aria-hidden`.
  - **Add documentation:** add a JSDoc block documenting the variants and the label override.
  - Validate the text label is always present for screen readers.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: each variant default, a custom label, and an empty-string label fallback.
- Include the `npm test` output.

### Example commit message
`feat(components): add optional custom label to StatusDot`

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
title: "Render webhook timestamps with TimeAgo on the webhooks list"
labels: type:enhancement, area:webhooks, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Show created-at relative time for each webhook

### Description
[`src/app/webhooks/page.tsx`](src/app/webhooks/page.tsx) carries a `createdAt: number` on each `Webhook` but never renders it — the list shows only the URL and the events CSV, giving operators no sense of when a hook was registered. The repo already ships [`TimeAgo`](src/components/TimeAgo.tsx) and [`safeFormatTimestamp`](src/lib/format.ts) for exactly this. This issue surfaces the registration time per row.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Render each webhook's `createdAt` using [`TimeAgo`](src/components/TimeAgo.tsx) inside a `<time>` element, with the absolute timestamp via [`safeFormatTimestamp`](src/lib/format.ts) as the title.
- Keep the existing safe-href URL rendering, the events CSV line, and the Remove button untouched.
- Guard against a missing/invalid `createdAt` so the row still renders.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/webhooks-created-at-timeago`
- Implement changes
  - **Write code in:** [`src/app/webhooks/page.tsx`](src/app/webhooks/page.tsx).
  - **Write comprehensive tests in:** extend [`src/app/webhooks/page.test.tsx`](src/app/webhooks/page.test.tsx) — assert the relative time renders for a valid `createdAt` and the row still renders for a missing one.
  - **Add documentation:** note the created-at display in [`README.md`](README.md).
  - Validate the `<time dateTime>` is a valid ISO string.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: valid timestamp, zero/missing timestamp, and a very old timestamp.
- Include the `npm test` output.

### Example commit message
`feat(webhooks): render created-at relative time with TimeAgo`

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
title: "Show created-at and an empty state on the API keys list"
labels: type:enhancement, area:api-keys, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Surface key created-at and an empty state on the API keys page

### Description
[`src/app/api-keys/page.tsx`](src/app/api-keys/page.tsx) renders each key's label and prefix but never shows the `createdAt` it carries, and when the list resolves to zero keys it renders an empty `<ul>` with nothing inside — there is no "No keys yet" guidance. The repo ships [`TimeAgo`](src/components/TimeAgo.tsx) and [`EmptyState`](src/components/EmptyState.tsx) for these. This issue adds both.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Render each key's `createdAt` with [`TimeAgo`](src/components/TimeAgo.tsx) (absolute ISO via [`safeFormatTimestamp`](src/lib/format.ts) as the title).
- When the resolved list is empty, render [`EmptyState`](src/components/EmptyState.tsx) with a clear "No API keys yet" message instead of a blank list.
- Keep the create form, reveal-once panel, copy action, and confirm-before-revoke flow intact.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/api-keys-created-at-empty-state`
- Implement changes
  - **Write code in:** [`src/app/api-keys/page.tsx`](src/app/api-keys/page.tsx).
  - **Write comprehensive tests in:** extend [`src/app/api-keys/page.test.tsx`](src/app/api-keys/page.test.tsx) — assert the relative time renders per key and the empty state shows for zero keys.
  - **Add documentation:** note the created-at and empty state in [`README.md`](README.md).
  - Validate the empty state is announced like the other pages.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: empty list, one key, missing `createdAt`, and a load error.
- Include the `npm test` output.

### Example commit message
`feat(api-keys): show created-at relative time and an empty state`

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
title: "Route the agent detail page hard-coded request counts through formatRequests"
labels: type:enhancement, area:agents, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Use formatRequests for the numbers on the agent detail page

### Description
[`src/app/agents/[agent]/page.tsx`](src/app/agents/[agent]/page.tsx) renders the lifetime total (`<strong>{total}</strong> requests`) and each per-service total (`{s.total} requests`) as bare integers, so large counts print as unreadable digit runs while every other surface routes numbers through [`formatRequests`](src/lib/format.ts) for locale thousands grouping. This issue applies the shared formatter consistently on this page.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Wrap the lifetime total and each per-service `total` with [`formatRequests`](src/lib/format.ts).
- Keep the monospace agent id, the optional-total soft-failure, the "No services consumed yet" branch, and the error `role="alert"` unchanged.
- Do not alter the fetch behaviour (the loading-state work is tracked separately).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/agents-detail-format-requests`
- Implement changes
  - **Write code in:** [`src/app/agents/[agent]/page.tsx`](src/app/agents/[agent]/page.tsx).
  - **Write comprehensive tests in:** create/extend [`src/app/agents/[agent]/page.test.tsx`](src/app/agents/[agent]/page.test.tsx) — mock apiClient + `next/navigation`, assert a large total renders grouped.
  - **Add documentation:** note the formatting convention in [`README.md`](README.md).
  - Validate output is deterministic under the fixed locale used by `format.ts`.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: zero total, a large total, and an absent optional total.
- Include the `npm test` output.

### Example commit message
`feat(agents): format request counts on the agent detail page`

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
title: "Add breadcrumbs to the agent detail page for orientation"
labels: type:enhancement, area:agents, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Render a Breadcrumb trail on the agent detail page

### Description
[`src/app/agents/[agent]/page.tsx`](src/app/agents/[agent]/page.tsx) offers only a bespoke "← Back to agents" text link for navigation, while the repo ships a reusable [`Breadcrumb`](src/components/Breadcrumb.tsx) component (`<nav aria-label="Breadcrumb">` with `aria-current="page"`) intended for exactly this orientation use. This issue replaces the ad-hoc back link with a proper breadcrumb trail (Agents → {agent}).

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Render [`Breadcrumb`](src/components/Breadcrumb.tsx) with items `Agents` (linking `/agents`) and the current `agent` (no href, so it gets `aria-current="page"`).
- Replace or complement the existing "← Back to agents" link; do not leave duplicate back-navigation.
- Keep the monospace agent heading and all data rendering unchanged.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/agents-detail-breadcrumb`
- Implement changes
  - **Write code in:** [`src/app/agents/[agent]/page.tsx`](src/app/agents/[agent]/page.tsx); reuse [`src/components/Breadcrumb.tsx`](src/components/Breadcrumb.tsx).
  - **Write comprehensive tests in:** create/extend [`src/app/agents/[agent]/page.test.tsx`](src/app/agents/[agent]/page.test.tsx) — assert the breadcrumb landmark renders with an Agents link and a current-page item.
  - **Add documentation:** note the breadcrumb in [`README.md`](README.md).
  - Validate the `Breadcrumb` landmark and `aria-current` are reachable.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: long agent id, special characters in the id, and keyboard reachability.
- Include the `npm test` output.

### Example commit message
`feat(agents): add Breadcrumb orientation to the agent detail page`

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
title: "Centralize remaining hard-coded copy on the docs and settings pages into the messages module"
labels: type:refactor, area:i18n, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Relocate docs/settings strings into the typed messages catalog

### Description
[`src/lib/messages.ts`](src/lib/messages.ts) is the typed, `as const` source of truth for UI copy and already namespaces `footer`, `home`, and `about` — but the docs page ([`src/app/docs/page.tsx`](src/app/docs/page.tsx)) and the settings page ([`src/app/settings/page.tsx`](src/app/settings/page.tsx)) still hard-code their headings and prose inline, leaving the catalog incomplete and blocking the future i18n migration the module is designed for. This issue relocates those surfaces' static copy into `messages` without changing rendered text.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `docs` and `settings` namespaces to [`messages`](src/lib/messages.ts) mirroring the existing flat `as const` shape, and import them in the two pages.
- Do NOT change any rendered string — only relocate it (per the module's documented convention).
- Keep keys descriptive and stable; the endpoint reference data array stays in the docs page (only the headings/intro move).
- Preserve the `Messages` type export so a future per-locale catalog still type-checks.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/i18n-centralize-docs-settings-copy`
- Implement changes
  - **Write code in:** [`src/lib/messages.ts`](src/lib/messages.ts), [`src/app/docs/page.tsx`](src/app/docs/page.tsx), [`src/app/settings/page.tsx`](src/app/settings/page.tsx).
  - **Write comprehensive tests in:** create [`src/lib/__tests__/messages.test.ts`](src/lib/__tests__/messages.test.ts) — assert the new namespaces exist and the page tests still see the same visible copy.
  - **Add documentation:** note the new namespaces in [`docs/components.md`](docs/components.md) or [`README.md`](README.md).
  - Validate the rendered copy is byte-for-byte identical to before.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: every relocated key is consumed and no orphaned keys remain.
- Include the `npm test` output.

### Example commit message
`refactor(i18n): centralize docs and settings copy into the messages catalog`

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
title: "Document the security headers and Content-Security-Policy architecture"
labels: type:docs, area:docs, stack:nextjs, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Write a security headers and CSP reference doc

### Description
The dashboard ships a non-trivial security posture in [`src/lib/securityHeaders.ts`](src/lib/securityHeaders.ts) and [`next.config.ts`](next.config.ts) — a per-route CSP whose `connect-src` is derived from [`resolveApiBase`](src/lib/resolveApiBase.ts), a `Permissions-Policy` denylist, `X-Frame-Options`/`frame-ancestors`, and production-only HSTS — but none of it is documented, so contributors don't understand why `'unsafe-inline'` is present (the pre-paint theme script) or how to add an allowed origin. This issue produces a reference doc.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Create `docs/security-headers.md` explaining each header and CSP directive built in [`securityHeaders.ts`](src/lib/securityHeaders.ts), why `'unsafe-inline'`/`'unsafe-eval'` appear (and the dev/prod difference), and how `connect-src` tracks the API origin.
- Explain how to safely add a new allowed origin or relax a directive, and the relationship to the theme pre-paint script in [`src/app/layout.tsx`](src/app/layout.tsx).
- Cross-link from [`README.md`](README.md); ensure every directive named in the doc actually appears in the source.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/docs-security-headers`
- Implement changes
  - **Write code in:** create `docs/security-headers.md` (docs only).
  - **Write comprehensive tests in:** not applicable; instead grep [`securityHeaders.ts`](src/lib/securityHeaders.ts) to confirm every documented directive/header exists in source.
  - **Add documentation:** this issue is the documentation; link it from [`README.md`](README.md).
  - Validate each documented header matches the code.
- Test and commit

### Test and commit
- Run `npm run lint` and `npm run build` to confirm no references break.
- Cross-check every directive/header against the source via search.
- Include a note confirming the doc matches the in-code header map.

### Example commit message
`docs(security): document the CSP and hardening header architecture`

### Guidelines
- Accuracy over completeness; every directive must match the code.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add an accessible name and aria-current to the active route in the header nav"
labels: type:a11y, area:navigation, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Mark the active header link with aria-current using usePathname

### Description
[`src/components/Header.tsx`](src/components/Header.tsx) renders its nav links but provides no programmatic indication of which route is active — screen-reader and keyboard users get no "you are here" cue, failing the common WAI-ARIA navigation pattern. This issue adds `aria-current="page"` to the link matching the current route via `usePathname()`, without altering the link set or the responsive layout (tracked separately).

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Use `usePathname()` to compute the active link and set `aria-current="page"` on it (parent route matching for nested paths like `/services/...`).
- Keep the existing `Main navigation` `aria-label`, the link set, the logo link, and the focus-visible rings.
- The component becomes (or stays) a client component; do not break server rendering of the layout.
- Extend, do not regress, the existing [`src/components/__tests__/Header.test.tsx`](src/components/__tests__/Header.test.tsx).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/navigation-header-aria-current`
- Implement changes
  - **Write code in:** [`src/components/Header.tsx`](src/components/Header.tsx).
  - **Write comprehensive tests in:** extend [`src/components/__tests__/Header.test.tsx`](src/components/__tests__/Header.test.tsx) — mock `next/navigation`, assert the active link carries `aria-current="page"` and a nested path marks its parent.
  - **Add documentation:** note the active-route marking in [`README.md`](README.md).
  - Validate exactly one link is marked current per route.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: exact match, nested path, unknown route (no current), and root.
- Include the `npm test` output.

### Example commit message
`feat(a11y): mark the active header link with aria-current`

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
title: "Add a jump-to-page input to the Pagination component for large result sets"
labels: type:enhancement, area:components, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Add a direct page-jump control to Pagination

### Description
[`src/components/Pagination.tsx`](src/components/Pagination.tsx) only exposes Previous/Next buttons, so reaching page 40 of a large services or events list means 39 clicks. The component is the shared paging primitive across the dashboard, so adding an optional "jump to page" number input here benefits every list at once. This issue adds an opt-in jump input while keeping the Prev/Next behaviour and the self-hide-at-one-page rule.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add an optional `showJump?: boolean` (default false) that renders a small `<input type="number">` + "Go" control clamping to `[1, pageCount]` and calling `onChange`.
- Keep the existing Previous/Next buttons, the `aria-live="polite"` "Page x of y" indicator, the `disabled` boundaries, and the `pageCount <= 1` early return.
- The jump control needs an accessible label and must be keyboard operable (Enter submits).
- Keep the public `Props` backward compatible so current callers are unaffected.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/components-pagination-jump`
- Implement changes
  - **Write code in:** [`src/components/Pagination.tsx`](src/components/Pagination.tsx).
  - **Write comprehensive tests in:** extend [`src/components/__tests__/Pagination.test.tsx`](src/components/__tests__/Pagination.test.tsx) — assert the jump input is hidden by default, clamps out-of-range values, and calls `onChange` on submit.
  - **Add documentation:** document `showJump` in the component JSDoc and [`docs/components.md`](docs/components.md).
  - Validate the input has a label and Enter triggers the jump.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: value above `pageCount`, value below 1, non-numeric input, and `showJump` omitted.
- Include the `npm test` output.

### Example commit message
`feat(components): add optional jump-to-page input to Pagination`

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
title: "Add npm scripts and CI guidance for test:coverage and the existing coverage gates"
labels: type:docs, area:tooling, stack:nextjs, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Add a test:coverage script and document the coverage thresholds

### Description
[`jest.config.ts`](jest.config.ts) enforces per-file coverage thresholds (100% on many components/lib modules, near-100% locks on `format.ts`/`theme.ts`) plus a global floor, but [`package.json`](package.json) has no `test:coverage` script, so contributors must remember `jest --coverage` and have no documented map of which files are gated. This issue adds the convenience scripts and a short doc so the 95%-coverage expectation in every issue is easy to verify locally.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `test:coverage` (and optionally `test:watch`) scripts to [`package.json`](package.json) running Jest with `--coverage`.
- Document, in [`README.md`](README.md) or a new `docs/testing.md` section, the per-file thresholds in [`jest.config.ts`](jest.config.ts) and how to read the `text`/`lcov` reports.
- Do not change the existing thresholds or test setup; this is tooling + docs only.
- Confirm the new script runs the existing suite without altering results.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/tooling-coverage-scripts`
- Implement changes
  - **Write code in:** [`package.json`](package.json) (scripts only).
  - **Write comprehensive tests in:** not applicable; instead run `npm run test:coverage` and confirm the gates pass.
  - **Add documentation:** add the coverage section to [`README.md`](README.md) referencing [`jest.config.ts`](jest.config.ts).
  - Validate the script name does not clash with existing scripts.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm test`, and `npm run test:coverage`.
- Confirm the documented thresholds match the `coverageThreshold` block in [`jest.config.ts`](jest.config.ts).
- Include the coverage summary output.

### Example commit message
`docs(tooling): add test:coverage script and document coverage gates`

### Guidelines
- Accuracy over completeness; documented thresholds must match the config.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Replace useState(null as T) casts on the API keys page with typed generics"
labels: type:refactor, area:api-keys, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Clean up the loose typing on the API keys page

### Description
[`src/app/api-keys/page.tsx`](src/app/api-keys/page.tsx) declares state with `useState(null as KeyItem[] | null)` and casts `apiGet` results with `(b as { items: KeyItem[] }).items` and `(res as { key: string }).key`, bypassing the generic typing that [`src/lib/apiClient.ts`](src/lib/apiClient.ts) provides (`apiGet<T>`/`apiPost<T>`). This is inconsistent with the rest of the codebase (e.g. webhooks uses `apiGet<{ items: Webhook[] }>`) and weakens type safety. This issue tightens the typing without changing behaviour.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Replace `useState(null as …)` with the generic form `useState<… | null>(null)`.
- Use `apiGet<{ items: KeyItem[] }>` and `apiPost<{ key: string }>` so the `as` casts can be removed.
- Do not change any rendered behaviour, the reveal/copy/revoke flows, or the API paths.
- Keep the file passing lint with no new `any`/unsafe casts.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/api-keys-typed-state`
- Implement changes
  - **Write code in:** [`src/app/api-keys/page.tsx`](src/app/api-keys/page.tsx).
  - **Write comprehensive tests in:** ensure [`src/app/api-keys/page.test.tsx`](src/app/api-keys/page.test.tsx) still passes; add an assertion that create returns the typed key.
  - **Add documentation:** none beyond a short JSDoc on any extracted type if needed.
  - Validate `npm run typecheck` passes with no casts removed losing safety.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: create success, list load, and revoke — all unchanged.
- Include the `npm test` output.

### Example commit message
`refactor(api-keys): use typed apiClient generics instead of as-casts`

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
title: "Wrap the webhooks list in an empty state and accessible region"
labels: type:enhancement, area:webhooks, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Add an empty state to the webhooks list

### Description
[`src/app/webhooks/page.tsx`](src/app/webhooks/page.tsx) renders the registered webhooks in a `<ul>` only when `items` is truthy, but once a list resolves to zero entries it renders an empty list with no guidance — just the form and a blank gap below it. The repo ships [`EmptyState`](src/components/EmptyState.tsx) for this. This issue adds the empty branch and a loading affordance for the initial fetch.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- When the list resolves empty, render [`EmptyState`](src/components/EmptyState.tsx) with a clear "No webhooks registered yet" message.
- Show a [`Spinner`](src/components/Spinner.tsx) while `items` is still `null` (initial load) instead of rendering nothing.
- Keep the create form, the safe-href URL rendering, the events CSV, and the confirm-before-remove flow intact.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/webhooks-empty-and-loading-states`
- Implement changes
  - **Write code in:** [`src/app/webhooks/page.tsx`](src/app/webhooks/page.tsx).
  - **Write comprehensive tests in:** extend [`src/app/webhooks/page.test.tsx`](src/app/webhooks/page.test.tsx) — assert the loading spinner on first render, the empty state for zero items, and the list for non-empty.
  - **Add documentation:** note the empty/loading states in [`README.md`](README.md).
  - Validate both states are announced like other pages.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: empty list, single item, slow load, and load error.
- Include the `npm test` output.

### Example commit message
`feat(webhooks): add empty and loading states to the list`

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
title: "Add a typed events response contract and remove unknown casts on the event log"
labels: type:refactor, area:events, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Tighten the AppEvent parsing types on the event log page

### Description
[`src/app/events/page.tsx`](src/app/events/page.tsx) parses events from a loosely-typed `EventsResponse` (`items?: unknown; events?: unknown`) and casts `item.ts as AppEvent["ts"]` inside `parseEventsResponse`. The parsing is defensive but the `as` cast skips validation of the timestamp field, and the dual `items`/`events` shape is undocumented. This issue narrows the types and replaces the cast with a validated coercion, keeping the page's runtime behaviour identical.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Validate `ts` against the allowed `number | string | null` union instead of casting; coerce unexpected types to `null` so `safeFormatTimestamp` still renders the placeholder.
- Document the accepted response shapes (`{ items }` or `{ events }`) in a JSDoc on `parseEventsResponse`.
- Keep the malformed-payload `throw`, the filtering, and the polling behaviour unchanged.
- Do not introduce `any`; the parser must remain total and never throw on field-level surprises (only on a non-array body).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/events-typed-response`
- Implement changes
  - **Write code in:** [`src/app/events/page.tsx`](src/app/events/page.tsx).
  - **Write comprehensive tests in:** extend [`src/app/events/page.test.tsx`](src/app/events/page.test.tsx) — assert a non-numeric/non-string `ts` coerces to the placeholder and a non-array body throws.
  - **Add documentation:** JSDoc the response contract; note it in [`docs/api-integration.md`](docs/api-integration.md) if present.
  - Validate `npm run typecheck` passes without the removed cast.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: `{ items }` vs `{ events }`, a `ts` object, and a missing `type`.
- Include the `npm test` output.

### Example commit message
`refactor(events): validate the ts field and document the events response shape`

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
title: "Add a copyable curl example to each endpoint in the docs reference"
labels: type:feature, area:docs, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Add copyable curl snippets to the docs endpoint list

### Description
[`src/app/docs/page.tsx`](src/app/docs/page.tsx) lists each endpoint as a method/path heading plus a one-line description, but gives no concrete request example, so a developer has to assemble the curl call by hand from prose. The repo ships [`CopyButton`](src/components/CopyButton.tsx) for one-click copying. This issue extends the endpoint data with a curl example per entry and renders a copyable code block.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Extend the `sections` data array with a `curl` string per endpoint (built against the documented method/path and example body).
- Render the curl example in a `<pre>`/`<code>` block with a [`CopyButton`](src/components/CopyButton.tsx) bound to the exact command (split a small client island for the copy control so the rest stays server-rendered).
- Keep every existing endpoint heading and description; do not invent new endpoints.
- Build any base-URL prefix from [`resolveApiBase`](src/lib/resolveApiBase.ts) rather than hard-coding localhost.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/docs-curl-examples`
- Implement changes
  - **Write code in:** [`src/app/docs/page.tsx`](src/app/docs/page.tsx); reuse [`src/components/CopyButton.tsx`](src/components/CopyButton.tsx).
  - **Write comprehensive tests in:** create/extend [`src/app/docs/page.test.tsx`](src/app/docs/page.test.tsx) — assert a curl block renders per endpoint and the copy control writes the exact command.
  - **Add documentation:** note the curl examples in [`README.md`](README.md).
  - Validate the copy control has an accessible label and announces the copied state.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: GET vs POST examples, the base-URL prefix, and clipboard unavailable.
- Include the `npm test` output.

### Example commit message
`feat(docs): add copyable curl examples to the endpoint reference`

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
title: "Add a global not-found illustration and quick-links to recover from dead routes"
labels: type:enhancement, area:error-pages, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Enrich the not-found page with recovery links

### Description
[`src/app/not-found.tsx`](src/app/not-found.tsx) renders a minimal 404 message, but a user who hits a dead route gets no obvious way back into the app beyond the browser back button — there are no quick-links to the primary surfaces (Home, Services, Stats, Docs). This issue turns the 404 into a useful recovery page with a labelled navigation list, reusing only routes that exist.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a `<nav aria-label="Helpful links">` with `<Link>`s to existing routes (Home, Services, Stats, Docs) below the 404 message.
- Keep the `main` landmark, the existing heading/copy, the metadata title, and dark-mode classes.
- Only link routes that actually exist under [`src/app/`](src/app); do not invent destinations.
- Do not change the not-found behaviour itself (still returned for unmatched routes).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/error-pages-not-found-links`
- Implement changes
  - **Write code in:** [`src/app/not-found.tsx`](src/app/not-found.tsx).
  - **Write comprehensive tests in:** create [`src/app/not-found.test.tsx`](src/app/not-found.test.tsx) — assert the heading and the recovery nav with its links render.
  - **Add documentation:** note the recovery links in [`README.md`](README.md).
  - Validate the nav landmark is reachable and the list is semantic.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: every link resolves and keyboard reachability.
- Include the `npm test` output.

### Example commit message
`feat(error-pages): add recovery quick-links to the not-found page`

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
title: "Add a retry action to the app error boundary so users can recover without reload"
labels: type:enhancement, area:error-pages, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Wire the reset() retry into the app error boundary

### Description
[`src/app/error.tsx`](src/app/error.tsx) is the route error boundary that receives an `error` and a `reset()` callback from Next.js, but if it only displays a message a user has no in-page way to recover from a transient failure (a flaky fetch) other than a full page reload. This issue ensures the boundary renders an accessible "Try again" action wired to `reset()` and presents the error safely.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Render a "Try again" [`Button`](src/components/Button.tsx) that calls the `reset()` prop to re-render the segment.
- Present the error in an accessible `role="alert"` region; show the `error.message` but do not leak stack traces in production.
- Keep the existing `main` landmark/heading and dark-mode classes; the file stays a client component (`"use client"`).
- Optionally log the error digest for debugging without rendering it prominently.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/error-pages-boundary-retry`
- Implement changes
  - **Write code in:** [`src/app/error.tsx`](src/app/error.tsx); reuse [`src/components/Button.tsx`](src/components/Button.tsx).
  - **Write comprehensive tests in:** create [`src/app/error.test.tsx`](src/app/error.test.tsx) — assert the alert renders the message and clicking "Try again" invokes the `reset` prop.
  - **Add documentation:** note the error boundary recovery in [`README.md`](README.md).
  - Validate the alert is announced and the retry button is keyboard operable.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: error with/without a message, reset invoked once per click, and no stack leak.
- Include the `npm test` output.

### Example commit message
`feat(error-pages): add a reset()-backed retry action to the error boundary`

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
title: "Add an admin status freshness line using StatusDot on the admin page"
labels: type:enhancement, area:admin, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Show a last-checked freshness line on the admin pause page

### Description
[`src/app/admin/page.tsx`](src/app/admin/page.tsx) loads `/api/v1/admin/status` and shows a [`StatusDot`](src/components/StatusDot.tsx) for the paused/active state, but it gives no indication of when that status was last fetched — so an operator cannot tell a freshly-loaded "active" from a stale one after the tab has been open for a while. This issue adds a "Last checked <relative time>" line using [`TimeAgo`](src/components/TimeAgo.tsx), updated on each successful status load.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Track the timestamp of the last successful `load()` and render it via [`TimeAgo`](src/components/TimeAgo.tsx) near the StatusDot.
- Do not interfere with the latest-wins status guard or the ConfirmDialog/toggle flow; only add the freshness line on successful loads.
- Keep the `role="alert"` error path and the pending/disabled toggle behaviour intact.
- Do not introduce polling (that is tracked elsewhere); update only on explicit/initial loads.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/admin-status-freshness-line`
- Implement changes
  - **Write code in:** [`src/app/admin/page.tsx`](src/app/admin/page.tsx); reuse [`src/components/TimeAgo.tsx`](src/components/TimeAgo.tsx).
  - **Write comprehensive tests in:** extend [`src/app/admin/page.test.tsx`](src/app/admin/page.test.tsx) — assert the freshness line updates after a successful load and is not set on error.
  - **Add documentation:** note the freshness line in [`README.md`](README.md).
  - Validate the line is associated with the status region for assistive tech.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: first load, reload after a toggle, and a failed status load.
- Include the `npm test` output.

### Example commit message
`feat(admin): add a last-checked freshness line to the pause page`

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
title: "Add a loading.tsx skeleton to slow client-rendered route segments"
labels: type:enhancement, area:loading, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Add route-segment loading skeletons for slow pages

### Description
The app ships a top-level [`src/app/loading.tsx`](src/app/loading.tsx) skeleton, but the data-heavy nested segments (services, agents, stats) have no per-segment `loading.tsx`, so navigating into them shows the previous page frozen until the client component mounts and fetches. Next.js renders a segment-local `loading.tsx` as a Suspense fallback during navigation. This issue adds skeleton fallbacks for the heaviest segments, reusing the existing skeleton/Spinner styling.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `loading.tsx` files for the heaviest segments (e.g. `src/app/services/loading.tsx`, `src/app/agents/loading.tsx`, `src/app/stats/loading.tsx`) reusing the visual style of [`src/app/loading.tsx`](src/app/loading.tsx).
- The skeleton must announce its busy state (consistent with the existing loading skeleton's a11y) and respect `prefers-reduced-motion` per [`src/app/globals.css`](src/app/globals.css).
- Keep the page components and their fetch logic unchanged; this only adds navigation fallbacks.
- Do not duplicate large markup — extract a shared skeleton if it helps.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/loading-segment-skeletons`
- Implement changes
  - **Write code in:** create the per-segment `loading.tsx` files; optionally a shared skeleton under [`src/components/`](src/components).
  - **Write comprehensive tests in:** create `src/app/services/loading.test.tsx` (and siblings) — assert the skeleton renders with its busy semantics.
  - **Add documentation:** note the segment loading states in [`README.md`](README.md).
  - Validate the busy state is announced and the animate hooks are reduced-motion safe.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: each segment skeleton renders and carries the busy role.
- Include the `npm test` output.

### Example commit message
`feat(loading): add per-segment loading skeletons for heavy routes`

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
title: "Memoize the events filter and cap rendered events to keep the log responsive"
labels: type:performance, area:events, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Bound the rendered event count and avoid redundant filtering work

### Description
[`src/app/events/page.tsx`](src/app/events/page.tsx) fetches up to 100 events and renders every match in an `<ol>`, each with a `<pre>` serialised payload (capped per-payload but not in count). With auto-refresh on, the `useMemo` filter recomputes on each poll and the full list re-renders, and a large backend `limit` could balloon the DOM. This issue caps the number of rendered rows with a "showing N of M" note and stabilises the filter so polling does not cause avoidable re-render churn.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Cap the rendered list to a sensible maximum (e.g. the first N matches) and show a "showing N of M" note when truncated, so the DOM stays bounded regardless of backend `limit`.
- Keep the existing `useMemo` filter but ensure its dependencies are minimal; avoid recreating row elements when the underlying data is unchanged across a background poll.
- Preserve the `safeStringify` per-payload cap, the filter, the EmptyState, and the auto-refresh behaviour.
- Do not change the network `limit=100` contract in this issue (only the render cap).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b performance/events-render-cap`
- Implement changes
  - **Write code in:** [`src/app/events/page.tsx`](src/app/events/page.tsx).
  - **Write comprehensive tests in:** extend [`src/app/events/page.test.tsx`](src/app/events/page.test.tsx) — assert only the cap is rendered for an oversized list and the "showing N of M" note appears.
  - **Add documentation:** note the render cap in [`README.md`](README.md).
  - Validate no behavioural regression in filtering or polling.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: list below the cap, list above the cap, filter applied above the cap, and background poll.
- Include the `npm test` output and a short note on the chosen cap.

### Example commit message
`perf(events): cap rendered event rows and stabilise the filter memo`

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
title: "Add tests for the Card title, footer, and passthrough props"
labels: type:test, area:testing, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the Card optional title/footer slots and prop passthrough

### Description
[`src/components/Card.tsx`](src/components/Card.tsx) renders a `<section>` with an optional `title` header, optional `footer`, a `className` merge, and `...rest` HTML attribute passthrough — and `jest.config.ts` locks it at 100% coverage to prevent regressions, yet there is no visible test file under [`src/components/__tests__/`](src/components/__tests__). This issue adds an explicit suite so the contract is documented and the coverage lock is self-evidently satisfied.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Assert the children render, the optional `title` renders only when provided (in a `<header>`), and the optional `footer` renders only when provided (in a `<footer>`).
- Assert the `className` is merged onto the section and arbitrary `...rest` attributes (e.g. `data-testid`, `aria-label`) pass through.
- Use semantic queries rather than class-only assertions where possible.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-card`
- Implement changes
  - **Write comprehensive tests in:** create [`src/components/__tests__/Card.test.tsx`](src/components/__tests__/Card.test.tsx).
  - **Add documentation:** add a JSDoc header to [`src/components/Card.tsx`](src/components/Card.tsx) if missing.
  - Validate the title/footer slots and passthrough.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: no title, no footer, both present, and a passthrough attribute.
- Include the `npm test` output and coverage for the component.

### Example commit message
`test(components): cover Card title/footer slots and prop passthrough`

### Guidelines
- **Minimum 95 percent test coverage** for `Card.tsx`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the Badge variant class mapping and content rendering"
labels: type:test, area:testing, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the Badge variant mapping and default behaviour

### Description
[`src/components/Badge.tsx`](src/components/Badge.tsx) maps four variants (`neutral | ok | warning | danger`) to Tailwind class sets and defaults to `neutral`, and `jest.config.ts` locks it at 100% coverage — but there is no visible test file. As more pages adopt the Badge (service detail status, future statuses), the variant contract and default deserve an explicit suite so the coverage lock is backed by real assertions.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Assert the children render inside the badge for each variant.
- Assert the default variant is `neutral` when none is passed.
- Assert each variant applies its distinct class set (a representative class per variant is sufficient).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-badge`
- Implement changes
  - **Write comprehensive tests in:** create [`src/components/__tests__/Badge.test.tsx`](src/components/__tests__/Badge.test.tsx).
  - **Add documentation:** add a JSDoc header to [`src/components/Badge.tsx`](src/components/Badge.tsx) documenting the variants.
  - Validate content via `getByText` and the variant class via the rendered element.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: each variant, default variant, and rich `ReactNode` children.
- Include the `npm test` output and coverage for the component.

### Example commit message
`test(components): cover Badge variant mapping and default`

### Guidelines
- **Minimum 95 percent test coverage** for `Badge.tsx`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Add tests for the Breadcrumb separator, links, and current-page marking"
labels: type:test, area:testing, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Test the Breadcrumb landmark, links, and aria-current

### Description
[`src/components/Breadcrumb.tsx`](src/components/Breadcrumb.tsx) renders a `<nav aria-label="Breadcrumb">` with an ordered list where items carrying an `href` become links and the final/hrefless item gets `aria-current="page"`, with `aria-hidden` separators between items — and `jest.config.ts` locks it at 100% coverage, but there is no visible test file. This issue adds an explicit suite covering the link/current and separator logic.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Assert items with `href` render as links and items without render as `aria-current="page"` spans.
- Assert separators are rendered between items and marked `aria-hidden`, and not after the last item.
- Assert the `Breadcrumb` navigation landmark has its accessible name.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/testing-breadcrumb`
- Implement changes
  - **Write comprehensive tests in:** create [`src/components/__tests__/Breadcrumb.test.tsx`](src/components/__tests__/Breadcrumb.test.tsx).
  - **Add documentation:** add a JSDoc header to [`src/components/Breadcrumb.tsx`](src/components/Breadcrumb.tsx) if missing.
  - Validate via `getByRole('navigation', { name: 'Breadcrumb' })` and link/current queries.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, and `npm test`.
- Cover edge cases: single item, multiple items, all-linked, and a trailing current item.
- Include the `npm test` output and coverage for the component.

### Example commit message
`test(components): cover Breadcrumb links, separators, and aria-current`

### Guidelines
- **Minimum 95 percent test coverage** for `Breadcrumb.tsx`.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Make the services list rows keyboard-focusable cards with full-row click targets"
labels: type:a11y, area:services, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Improve services list row affordance and click target

### Description
[`src/app/services/page.tsx`](src/app/services/page.tsx) renders services in a `<ul>` where (after the link work) each row links to the detail page, but the clickable affordance is typically just the text, leaving a small target and inconsistent focus styling versus the surrounding card-based UI. This issue makes each row a full-width, keyboard-focusable link with a visible focus ring and a hover affordance, improving target size (WCAG 2.5.8) without changing the data or routing.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Make the entire row a single `<Link>` (or a link spanning the row) so the click/tap target covers the whole list item, with a focus-visible ring matching the app's pattern.
- Avoid nesting interactive elements inside the row link (no link-in-link); if a secondary action is needed, place it outside the row link.
- Keep the existing pagination, empty state, spinner, and error path intact.
- Preserve the `serviceId` encoding in the href.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/services-row-target-size`
- Implement changes
  - **Write code in:** [`src/app/services/page.tsx`](src/app/services/page.tsx).
  - **Write comprehensive tests in:** extend [`src/app/services/page.test.tsx`](src/app/services/page.test.tsx) — assert each row is a single link to the encoded detail route and is keyboard focusable.
  - **Add documentation:** note the row affordance in [`README.md`](README.md).
  - Validate focus-visible styling and the absence of nested interactive elements.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: long service ids, special characters, and keyboard navigation through rows.
- Include the `npm test` output.

### Example commit message
`feat(a11y): make services list rows full-row focusable link targets`

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
title: "Add an ARIA live region announcing search result counts on the search page"
labels: type:a11y, area:search, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Announce result counts to assistive tech on the search page

### Description
[`src/app/search/page.tsx`](src/app/search/page.tsx) updates its results list as the debounced query changes, but a screen-reader user gets no spoken feedback about how many matches were found — the list silently changes under them. This issue adds a polite `aria-live` region that announces "N results for '<query>'" (and "No matches") after each settled search, complementing any searching indicator without stealing focus.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a visually-hidden `aria-live="polite"` region that announces the settled result count and the active query.
- Announce only after results settle (avoid spamming on every keystroke); coordinate with the debounce so announcements are not duplicated.
- Keep the existing SearchBar, the "No matches" branch, the result links, and any searching indicator intact.
- Do not move focus into the live region.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/search-results-live-region`
- Implement changes
  - **Write code in:** [`src/app/search/page.tsx`](src/app/search/page.tsx).
  - **Write comprehensive tests in:** create/extend [`src/app/search/page.test.tsx`](src/app/search/page.test.tsx) — fake timers, assert the live region text updates with the count after a settled search and shows the no-match message.
  - **Add documentation:** note the result announcement in [`README.md`](README.md).
  - Validate the region is `aria-live="polite"` and does not steal focus.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: zero matches, one match, many matches, and empty query (no announcement).
- Include the `npm test` output.

### Example commit message
`feat(a11y): announce search result counts via a polite live region`

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
title: "Document the application route map and page responsibilities in an architecture doc"
labels: type:docs, area:docs, stack:nextjs, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Author a routes-and-architecture reference for the dashboard

### Description
The app under [`src/app/`](src/app) has grown to ~18 routes (services + nested detail/edit/agents, agents directory + detail, usage, search, events, stats, admin, api-keys, webhooks, export, docs, about, changelog, settings) plus the SEO/title helpers in [`src/app/pageTitles.ts`](src/app/pageTitles.ts) and [`src/app/seoMetadata.ts`](src/app/seoMetadata.ts) and the `layout.tsx` files — but there is no single document mapping each route to its responsibility, its backend calls, and whether it is server- or client-rendered. This issue produces that architecture map.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Create `docs/architecture.md` (or a README section) listing every route under [`src/app/`](src/app) with: purpose, server vs `"use client"`, the backend endpoints it calls, and the nested layout/title source.
- Note the cross-cutting pieces: the `ToastProvider`/`Header`/`Footer` in [`src/app/layout.tsx`](src/app/layout.tsx), the pre-paint theme script, and the per-route metadata via `pageTitles`/`seoMetadata`.
- Cross-link from [`README.md`](README.md); ensure every listed route corresponds to a real `page.tsx`.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/docs-route-architecture`
- Implement changes
  - **Write code in:** create `docs/architecture.md` (docs only).
  - **Write comprehensive tests in:** not applicable; instead `find src/app -name page.tsx` to confirm every documented route exists.
  - **Add documentation:** this issue is the documentation; link it from [`README.md`](README.md).
  - Validate each route's server/client designation against its file (`"use client"` presence).
- Test and commit

### Test and commit
- Run `npm run lint` and `npm run build` to confirm no references break.
- Cross-check the route list against `src/app/**/page.tsx` via search.
- Include a note confirming the map matches the filesystem.

### Example commit message
`docs(architecture): add a route map and page-responsibility reference`

### Guidelines
- Accuracy over completeness; every route must map to a real file.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Extract the duplicated page main wrapper into a shared PageShell layout component"
labels: type:refactor, area:components, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Introduce a PageShell to consolidate the repeated main wrapper markup

### Description
Almost every page repeats the same `<main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[60vh] max-w-… flex-col gap-… p-8 focus:outline-none">` wrapper — see [`src/app/settings/page.tsx`](src/app/settings/page.tsx), [`src/app/docs/page.tsx`](src/app/docs/page.tsx), [`src/app/agents/[agent]/page.tsx`](src/app/agents/[agent]/page.tsx), [`src/app/services/new/page.tsx`](src/app/services/new/page.tsx), and the webhooks/api-keys/events pages — duplicating the skip-link target id, focus handling, and spacing. This issue extracts a `PageShell` component so the `id="main-content"` landmark and layout are defined once and reused.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Create `src/components/PageShell.tsx` rendering the `<main id="main-content" tabIndex={-1} …>` landmark with a configurable `maxWidth`/`gap` and `className` merge, defaulting to the common values.
- Migrate at least three pages (e.g. settings, docs, new-service) onto `PageShell` without changing their visual output or the skip-link target.
- Keep the `id="main-content"` exactly as-is so the layout skip link in [`src/app/layout.tsx`](src/app/layout.tsx) still targets it.
- Do not change page logic; this is a presentational extraction.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/components-pageshell`
- Implement changes
  - **Write code in:** create [`src/components/PageShell.tsx`](src/components/PageShell.tsx); migrate the chosen pages.
  - **Write comprehensive tests in:** create [`src/components/__tests__/PageShell.test.tsx`](src/components/__tests__/PageShell.test.tsx) — assert the `main` landmark, the `id="main-content"`, `tabIndex={-1}`, and a className merge; confirm a migrated page still renders its content.
  - **Add documentation:** document `PageShell` in [`docs/components.md`](docs/components.md).
  - JSDoc the component; validate the skip-link target is preserved.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: default vs custom maxWidth, className merge, and the landmark id.
- Include the `npm test` output.

### Example commit message
`refactor(components): extract a shared PageShell main wrapper`

### Guidelines
- **Minimum 95 percent test coverage** for the new component and migrated pages.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
++++++
---
type: Feature
title: "Convert the agent detail page to the shared useApi hook and add a typed total fetch"
labels: type:refactor, area:agents, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN
assignees: ''
---

## Refactor the agent detail fetches onto useApi with proper cancellation

### Description
[`src/app/agents/[agent]/page.tsx`](src/app/agents/[agent]/page.tsx) fires two `apiGet` calls inside a `useEffect` with no cancellation token, so navigating between agents quickly can let a slow earlier response set state for the wrong agent, and the optional `total` request swallows errors with an empty `catch`. The repo ships [`useApi`](src/lib/useApi.ts) with a clean `loading | error | ok` machine and cancellation. This issue moves the primary usage fetch onto `useApi` and adds a guarded total fetch.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Migrate the primary `/api/v1/agents/{agent}/usage` fetch to `useApi<Usage>(path)`, keyed on the encoded agent so it refetches on navigation and cancels superseded requests.
- Keep the optional `/total` fetch's soft-failure but guard it against out-of-order responses (latest agent wins).
- Preserve the monospace heading, the per-service list, and the error `role="alert"`; observable happy-path behaviour must not change.
- Coordinate with the agent-detail loading-states work if it lands; this issue is the network-layer refactor.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/agents-detail-useapi`
- Implement changes
  - **Write code in:** [`src/app/agents/[agent]/page.tsx`](src/app/agents/[agent]/page.tsx); reuse [`src/lib/useApi.ts`](src/lib/useApi.ts).
  - **Write comprehensive tests in:** create/extend [`src/app/agents/[agent]/page.test.tsx`](src/app/agents/[agent]/page.test.tsx) — assert a stale response for a previous agent is ignored and the latest wins.
  - **Add documentation:** note the cancellation behaviour in [`README.md`](README.md).
  - Validate no state-after-unmount warnings.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Cover edge cases: rapid agent switch, slow then fast response, usage error, and optional-total failure.
- Include the `npm test` output.

### Example commit message
`refactor(agents): adopt useApi and guard the total fetch on the detail page`

### Guidelines
- **Minimum 95 percent test coverage** for the changed page.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord for questions, reviews, and faster merges:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — if this issue and the maintainers helped you ship, we'd be grateful for a **5-star rating**. Clear questions in Discord and tidy, well-tested PRs are the fastest path to a merge and a reward.
