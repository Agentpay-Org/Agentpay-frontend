---
type: Feature
title: "Add a debounced search filter to the services list"
labels: type:feature, area:services, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Let users search the services list

### Description
The services list has sortable columns but no text search, which does not scale. This issue adds a debounced search over service name/id.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a debounced search input filtering the services list client-side by name and id.
- Show an accessible empty state when nothing matches; reset paging on query change.
- Reuse the existing list data; do not fork the model.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/services-01-search`
- Implement changes
  - **Write code in:** the services list page/component.
  - **Write comprehensive tests in:** query narrows rows, empty state, debounce coalesces input.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: no matches, whitespace query, rapid typing.
- Include the full test output in the PR description.

### Example commit message
`feat(services): add debounced search filter`

### Guidelines
- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a per-row copy-service-id action with a toast"
labels: type:feature, area:services, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Let users copy a service id quickly

### Description
Copying a service id today means selecting truncated text. This issue adds a per-row copy control confirmed by a toast.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add an accessible copy control per service row that copies the full id.
- Use the Clipboard API with a documented fallback; confirm via the existing toast system.
- Keyboard-operable with a clear label.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/services-02-copy-id`
- Implement changes
  - **Write code in:** the services row component; reuse any clipboard helper.
  - **Write comprehensive tests in:** success path, clipboard-throws fallback, accessible name.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: clipboard unavailable, repeated clicks.
- Include the full test output in the PR description.

### Example commit message
`feat(services): add per-row copy service id`

### Guidelines
- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a date-range preset selector to the usage page"
labels: type:feature, area:usage, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Speed up common usage queries

### Description
The usage page requires manual date entry for common ranges. This issue adds presets (24h, 7d, 30d, custom).

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add an accessible preset selector that sets the usage query range; keep the existing custom range.
- Announce the applied range for assistive tech; default to the current behaviour.
- Reuse the existing query state.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/usage-01-range-presets`
- Implement changes
  - **Write code in:** the usage page.
  - **Write comprehensive tests in:** each preset sets the expected range, custom still works.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: preset then custom, boundary of a preset window.
- Include the full test output in the PR description.

### Example commit message
`feat(usage): add date-range preset selector`

### Guidelines
- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Set aria-live politeness per toast severity"
labels: type:a11y, area:toast, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Make toast announcements severity-aware

### Description
All toasts announce with the same politeness, so errors may not preempt low-priority messages. This issue maps severity to an appropriate aria-live setting.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Map error toasts to assertive and info/success to polite live regions.
- Do not change toast visuals or timing.
- Verify with an automated a11y assertion if the suite has one.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/toast-01-politeness`
- Implement changes
  - **Write code in:** the toast provider/component.
  - **Write comprehensive tests in:** error uses assertive, info uses polite.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: stacked toasts of mixed severity.
- Include the full test output in the PR description.

### Example commit message
`a11y(toast): severity-aware aria-live politeness`

### Guidelines
- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Centralize API error-to-message mapping in one helper"
labels: type:refactor, area:api, stack:typescript, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Unify API error messaging

### Description
Error-to-user-message mapping is duplicated across pages, risking inconsistent copy. This issue centralizes it in a single tested helper the components consume.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a `mapApiError` helper translating error shapes/status codes to user-facing messages, and adopt it at the call sites.
- Output messages unchanged for existing cases; verified by tests.
- Preserve requestId surfacing where present.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/api-01-error-mapping`
- Implement changes
  - **Write code in:** the API/error layer; update call sites.
  - **Write comprehensive tests in:** status-to-message table, unknown error fallback, requestId preserved.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: timeout, 4xx, 5xx, network error, unknown.
- Include the full test output in the PR description.

### Example commit message
`refactor(api): centralize error-to-message mapping`

### Guidelines
- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Document the useApi hook FetchState contract with examples"
labels: type:docs, area:api, stack:nextjs, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Document the data-fetching hook

### Description
The `useApi` hook returns a FetchState union that new contributors must reverse-engineer. This issue documents the states and usage.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `docs/use-api.md` documenting the FetchState union (idle/loading/error/success), the return shape (including refetch), and a minimal usage example.
- Keep it accurate — read the hook first.
- Link from the docs index if one exists.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/api-01-use-api`
- Implement changes
  - **Add documentation:** create `docs/use-api.md`.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: n/a — verify each state against the hook source.
- Include the full test output in the PR description.

### Example commit message
`docs(api): document the useApi FetchState contract`

### Guidelines
- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
