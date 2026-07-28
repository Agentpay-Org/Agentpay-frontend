---
type: Feature
title: "Add a confirmation summary before the admin pause toggle acts"
labels: type:feature, area:admin, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Confirm before pausing the service

### Description
The admin pause toggle acts immediately, risking accidental service pauses. This issue adds a confirmation summarizing the effect before applying.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Show an accessible confirmation (current state -> new state, impact) before toggling pause; cancel is a no-op.
- Reuse the existing confirm dialog primitive.
- Do not change the underlying pause API call.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/admin-01-pause-confirm`
- Implement changes
  - **Write code in:** the admin pause control.
  - **Write comprehensive tests in:** confirm applies, cancel is a no-op, summary reflects direction.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: pause then unpause, cancel path.
- Include the full test output in the PR description.

### Example commit message
`feat(admin): confirm before pause toggle`

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
title: "Add a CSV export of the usage table"
labels: type:feature, area:usage, stack:typescript, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Let users export usage data

### Description
Usage data can be viewed but not exported. This issue adds a client-side CSV export of the current usage table.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Export exactly the currently filtered usage rows as CSV with safe escaping; trigger a client download.
- Add an accessible control; no server round-trip.
- Handle an empty table gracefully.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/usage-02-csv-export`
- Implement changes
  - **Write code in:** a small CSV helper + a usage toolbar control.
  - **Write comprehensive tests in:** escaping, respects filter, empty table.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: values with commas/quotes/newlines, empty.
- Include the full test output in the PR description.

### Example commit message
`feat(usage): add CSV export of the usage table`

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
title: "Announce Pagination page changes via an aria-live region"
labels: type:a11y, area:pagination, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Announce page changes to assistive tech

### Description
Pagination updates content silently, so screen-reader users are not told the page changed. This issue adds a polite announcement.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Announce the new page (for example, page 2 of 5) via a polite live region on change.
- Do not announce on initial mount.
- Verify with an automated a11y assertion if available.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/pagination-01-live`
- Implement changes
  - **Write code in:** the Pagination component.
  - **Write comprehensive tests in:** announcement fires on page change, not on mount.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: single page, first/last page.
- Include the full test output in the PR description.

### Example commit message
`a11y(pagination): announce page changes`

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
title: "Add tests for the services sort comparator"
labels: type:test, area:services, stack:typescript, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Cover the services sort logic

### Description
The services list sort comparator needs deterministic tests for ordering and tie-breaks. This issue adds them.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add tests asserting ordering per column and direction plus a stable tie-break.
- Drive via the pure comparator if present; otherwise the rendered list.
- Do not change behaviour unless a defect is found (note it).

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/services-01-sort`
- Implement changes
  - **Write comprehensive tests in:** the services list test suite.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: equal values, single item, empty.
- Include the full test output in the PR description.

### Example commit message
`test(services): cover sort comparator`

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
title: "Add a reveal toggle for the created API key instead of always showing it"
labels: type:feature, area:apikeys, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Avoid exposing the API key by default

### Description
The created API key is shown in plain text. This issue masks it by default with an accessible reveal toggle, alongside the existing copy action.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Mask the key by default; add an accessible show/hide toggle; keep copy working while masked.
- Do not log or persist the key beyond the existing flow.
- Announce the reveal state.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/apikeys-01-reveal-toggle`
- Implement changes
  - **Write code in:** the API key display component.
  - **Write comprehensive tests in:** masked by default, toggle reveals/hides, copy works masked.
- Test and commit

### Test and commit
- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: very long key, rapid toggling.
- Include the full test output in the PR description.

### Example commit message
`feat(apikeys): add masked reveal toggle for created key`

### Guidelines
- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
