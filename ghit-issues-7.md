---
type: Feature
title: "Add a lint and typecheck step to the CI workflow"
labels: type:enhancement, area:ci, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add lint and typecheck stages to CI

### Description
`.github/workflows/ci.yml` runs only `npm run build` and `npx jest --coverage`, so the `lint` and `typecheck` scripts declared in `package.json` never execute in CI. Lint and type regressions can therefore merge unnoticed.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add an `npm run lint` step and an `npm run typecheck` step to the `build-test` job before the build.
- Keep steps independent so a lint failure still reports the type errors.
- Update `CONTRIBUTING.md` to state that both gates are enforced on pull requests.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/ci-lint-typecheck`
- **Write code in:** `.github/workflows/ci.yml`
- **Write comprehensive tests in:** `src/__tests__/readme_route_and_commands.test.ts`
- **Add documentation:** `CONTRIBUTING.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`ci: run lint and typecheck in the build-test job`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Pin GitHub Actions to commit SHAs in the CI workflow"
labels: type:security, area:ci, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Pin CI actions to immutable commit SHAs

### Description
`.github/workflows/ci.yml` references `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`, and `actions/github-script@v7` by mutable tag. A compromised or retagged release would execute untrusted code with the workflow's `issues: write` permission.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Replace every `uses:` tag with a full 40-character commit SHA plus a trailing version comment.
- Narrow the job-level `permissions` block to only what the coverage-comment step needs.
- Document the pinning policy so future workflow edits keep it.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/ci-pin-action-shas`
- **Write code in:** `.github/workflows/ci.yml`
- **Write comprehensive tests in:** `src/__tests__/readme_route_and_commands.test.ts`
- **Add documentation:** `docs/security-headers.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`ci: pin GitHub Actions to commit SHAs`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add Dependabot configuration for npm and GitHub Actions updates"
labels: type:enhancement, area:dependencies, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add Dependabot update configuration

### Description
The repository has no `.github/dependabot.yml`, so `next`, `react`, and the Jest toolchain in `package.json` are never automatically checked for security or version updates. GitHub Actions versions in `.github/workflows/ci.yml` are similarly unmanaged.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `.github/dependabot.yml` with `npm` and `github-actions` ecosystems on a weekly schedule.
- Group minor and patch updates to keep pull-request volume manageable.
- Document the review expectation for dependency pull requests.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/dependencies-dependabot`
- **Write code in:** `.github/dependabot.yml`
- **Write comprehensive tests in:** `src/__tests__/readme_route_and_commands.test.ts`
- **Add documentation:** `CONTRIBUTING.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`chore: add dependabot configuration for npm and actions`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a dependency audit workflow that fails on high-severity advisories"
labels: type:security, area:ci, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add an npm audit security workflow

### Description
There is no automated vulnerability scan for the dependency tree recorded in `package-lock.json`. Advisories affecting `next` or the transitive Jest toolchain would go undetected until a manual audit.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a scheduled and pull-request-triggered workflow running `npm audit --audit-level=high`.
- Allow a documented allowlist file for accepted advisories so the gate stays actionable.
- Upload the audit JSON as a workflow artifact for triage.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/ci-dependency-audit`
- **Write code in:** `.github/workflows/audit.yml`
- **Write comprehensive tests in:** `src/__tests__/readme_route_and_commands.test.ts`
- **Add documentation:** `docs/security-headers.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`ci: add npm audit workflow failing on high severity advisories`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add issue and pull request templates under .github"
labels: type:docs, area:contributor-experience, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add contributor issue and PR templates

### Description
`.github/` currently contains only `workflows/ci.yml`. Contributors have no structured template, so bug reports and pull requests arrive without reproduction steps, affected routes, or the test output `CONTRIBUTING.md` asks for.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `.github/ISSUE_TEMPLATE/bug_report.yml` and `feature_request.yml` using GitHub form schema.
- Add `.github/PULL_REQUEST_TEMPLATE.md` with a checklist for lint, typecheck, tests, and accessibility.
- Link the templates from `CONTRIBUTING.md`.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/contributor-experience-templates`
- **Write code in:** `.github/ISSUE_TEMPLATE/bug_report.yml`
- **Write comprehensive tests in:** `src/__tests__/readme_route_and_commands.test.ts`
- **Add documentation:** `CONTRIBUTING.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`docs: add issue and pull request templates`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a SECURITY.md vulnerability disclosure policy"
labels: type:security, area:governance, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a security disclosure policy

### Description
The repository has no `SECURITY.md`, so there is no documented private channel for reporting issues found in the security surface described by `docs/security-headers.md` and implemented in `src/lib/securityHeaders.ts`.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `SECURITY.md` with supported versions, a private reporting channel, and a response-time expectation.
- Reference the CSP and header architecture already documented in `docs/security-headers.md`.
- Link the policy from `README.md` and `CONTRIBUTING.md`.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/governance-security-policy`
- **Write code in:** `SECURITY.md`
- **Write comprehensive tests in:** `src/__tests__/readme_route_and_commands.test.ts`
- **Add documentation:** `README.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`docs: add SECURITY.md disclosure policy`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a .env.example documenting every supported environment variable"
labels: type:docs, area:configuration, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add an env example file

### Description
`src/lib/resolveApiBase.ts` reads `NEXT_PUBLIC_AGENTPAY_API_BASE` and `next.config.ts` consumes it at build time, but there is no `.env.example`. New contributors must read source to discover the variable and its accepted format.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `.env.example` with every `NEXT_PUBLIC_*` variable, its default, and an inline comment.
- State the origin constraints enforced by `resolveApiBase` so invalid values are avoided.
- Reference the file from the README setup section.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/configuration-env-example`
- **Write code in:** `.env.example`
- **Write comprehensive tests in:** `src/lib/__tests__/resolveApiBase.test.ts`
- **Add documentation:** `README.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`docs: add .env.example documenting public env vars`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Remove generated build artifacts and scratch markdown from version control"
labels: type:refactor, area:repo-hygiene, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Clean generated files out of the repository root

### Description
The repository root tracks `tsconfig.tsbuildinfo` plus several scratch documents (`IMPLEMENTATION_SUMMARY.md`, `ERROR_BOUNDARY_SUMMARY.md`, `EVENTS_CAP_SUMMARY.md`, `pr-description.md`). These are build or process byproducts that add noise to every diff.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Delete the tracked artifacts and extend `.gitignore` to cover `*.tsbuildinfo`.
- Fold any still-relevant content from the summary files into `docs/`.
- Confirm `npm run build` and `npm run typecheck` still succeed from a clean checkout.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/repo-hygiene-untrack-artifacts`
- **Write code in:** `.gitignore`
- **Write comprehensive tests in:** `src/__tests__/readme_route_and_commands.test.ts`
- **Add documentation:** `docs/architecture.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`chore: untrack build artifacts and scratch summaries`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add Prettier with a format:check script wired into CI"
labels: type:enhancement, area:tooling, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add Prettier formatting enforcement

### Description
Formatting across `src/components` and `src/app` is currently maintained by hand — `src/lib/format.ts` uses a different indentation style from `src/components/Pagination.tsx`. There is no formatter config or script in `package.json`.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `prettier` plus a `.prettierrc` and `.prettierignore` consistent with the dominant existing style.
- Add `format` and `format:check` scripts and run `format:check` in CI.
- Apply the formatter in one isolated commit so review of behaviour changes stays clean.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/tooling-prettier`
- **Write code in:** `package.json`
- **Write comprehensive tests in:** `src/__tests__/readme_route_and_commands.test.ts`
- **Add documentation:** `CONTRIBUTING.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`chore: add prettier and a format:check gate`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Enable stricter TypeScript compiler options and fix the resulting errors"
labels: type:refactor, area:typescript, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Tighten the TypeScript compiler configuration

### Description
`tsconfig.json` runs without `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, or `noImplicitOverride`. Index access in list-rendering pages such as `src/app/events/page.tsx` and `src/app/services/page.tsx` is therefore typed as always-defined.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Enable the stricter flags one at a time and resolve the reported errors.
- Prefer narrowing guards over non-null assertions when fixing index access.
- Confirm `npm run typecheck` and `npm run build` both pass afterwards.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/typescript-strict-flags`
- **Write code in:** `tsconfig.json`
- **Write comprehensive tests in:** `src/lib/__tests__/apiClient.test.ts`
- **Add documentation:** `docs/architecture.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`refactor: enable stricter typescript compiler options`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Enable jsx-a11y lint rules across the components directory"
labels: type:a11y, area:linting, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Enable accessibility lint rules

### Description
`eslint.config.mjs` extends `eslint-config-next/core-web-vitals` and `typescript` only. Accessibility rules are not enforced, so regressions in `src/components/Tooltip.tsx`, `src/components/ConfirmDialog.tsx`, and form pages are caught only by review.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add the `jsx-a11y` plugin with a recommended rule set scoped to `src/**/*.tsx`.
- Fix or explicitly justify every violation surfaced on the existing components.
- Record the enabled rules and the rationale for any disabled ones.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/linting-jsx-a11y-rules`
- **Write code in:** `eslint.config.mjs`
- **Write comprehensive tests in:** `src/components/__tests__/Tooltip.test.tsx`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`chore: enable jsx-a11y lint rules`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add jest-axe accessibility assertions to the shared component tests"
labels: type:a11y, area:testing, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add automated axe checks to component tests

### Description
The suites in `src/components/__tests__/` assert roles and labels individually but never run an automated accessibility audit. Contrast, landmark nesting, and ARIA-attribute misuse in primitives like `src/components/StatTile.tsx` go unchecked.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `jest-axe` and a shared `expectNoA11yViolations` helper registered from `jest.setup.ts`.
- Assert zero violations for every component in `src/components/`, covering both theme states.
- Document the helper and how to interpret failures in the testing guide.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/testing-jest-axe`
- **Write code in:** `jest.setup.ts`
- **Write comprehensive tests in:** `src/components/__tests__/a11y.test.tsx`
- **Add documentation:** `docs/testing.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`test: add jest-axe accessibility assertions to component tests`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a skip-to-main-content link in the root layout"
labels: type:a11y, area:navigation, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a skip navigation link

### Description
`src/app/layout.tsx` renders `Header`, the page `main`, and `Footer` with no bypass mechanism. Keyboard and screen-reader users must tab through every link in `src/components/Header.tsx` on each route change.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a visually hidden skip link as the first focusable element in `src/app/layout.tsx`.
- Make the link visible on focus and target the `main` element rendered by `src/components/PageShell.tsx`.
- Verify the target receives focus after activation in browsers that do not move focus automatically.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/navigation-skip-link`
- **Write code in:** `src/app/layout.tsx`
- **Write comprehensive tests in:** `src/app/layout.test.tsx`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(a11y): add skip-to-main-content link to root layout`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add roving tabindex and arrow-key navigation to the header nav"
labels: type:a11y, area:navigation, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add arrow-key navigation to the primary nav

### Description
`src/components/Header.tsx` renders the primary navigation as a flat list of links. Arrow-key traversal, which assistive-technology users expect from a navigation menubar, is unavailable.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Implement roving tabindex so the nav exposes a single tab stop with arrow-key movement between links.
- Support Home and End to jump to the first and last destination.
- Keep the existing `aria-current` marking on the active route intact.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/navigation-roving-tabindex`
- **Write code in:** `src/components/Header.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/Header.test.tsx`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(a11y): add roving tabindex to the header navigation`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a reusable VisuallyHidden component for screen-reader-only text"
labels: type:a11y, area:components, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a VisuallyHidden primitive

### Description
Screen-reader-only text is currently produced with repeated `sr-only` utility strings across `src/components/StatusDot.tsx`, `src/components/Spinner.tsx`, and several pages. There is no single primitive, so the pattern drifts.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `src/components/VisuallyHidden.tsx` supporting a polymorphic `as` prop and a focusable escape hatch.
- Migrate the existing `sr-only` usages in `src/components/` to the new primitive.
- Add the component to the catalog in `docs/components.md`.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/components-visually-hidden`
- **Write code in:** `src/components/VisuallyHidden.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/VisuallyHidden.test.tsx`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(a11y): add VisuallyHidden primitive and migrate sr-only usages`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a Select form primitive with label, hint, and error wiring"
labels: type:feature, area:components, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add an accessible Select primitive

### Description
`src/components/TextField.tsx` provides label, description, and error wiring for text inputs, but there is no equivalent for dropdowns. Pages that need a choice control fall back to bare markup without the same ARIA plumbing.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `src/components/Select.tsx` mirroring the `TextField` prop shape and id-generation strategy.
- Wire `aria-describedby` and `aria-invalid` for hint and error text.
- Support both controlled and uncontrolled usage.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/components-select-primitive`
- **Write code in:** `src/components/Select.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/Select.test.tsx`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: add accessible Select form primitive`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a Switch primitive and use it for the admin pause toggle"
labels: type:feature, area:components, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add an accessible Switch control

### Description
The pause/unpause control in `src/app/admin/page.tsx` is a plain button whose on/off state is conveyed only by its label text. A dedicated switch role would communicate state to assistive technology directly.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `src/components/Switch.tsx` implementing `role="switch"` with `aria-checked` and keyboard activation.
- Adopt it in the admin page while preserving the existing confirmation guard.
- Honour `prefers-reduced-motion` for the thumb transition.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/components-switch-primitive`
- **Write code in:** `src/components/Switch.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/Switch.test.tsx`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: add Switch primitive and adopt it on the admin page`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Extract a generic Modal primitive from ConfirmDialog"
labels: type:refactor, area:components, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Extract the dialog shell into a Modal primitive

### Description
`src/components/ConfirmDialog.tsx` bundles focus trapping, Escape handling, focus restoration, and backdrop behaviour with confirm-specific copy and buttons. Any future non-confirmation dialog would have to duplicate that logic.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `src/components/Modal.tsx` owning the overlay, focus trap, and dismissal behaviour.
- Reimplement `ConfirmDialog` on top of `Modal` with no change to its public props.
- Keep the existing ConfirmDialog tests green as the regression signal.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/components-modal-primitive`
- **Write code in:** `src/components/Modal.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/Modal.test.tsx`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`refactor: extract Modal primitive from ConfirmDialog`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a DataTable primitive with sortable and accessible column headers"
labels: type:feature, area:components, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a shared DataTable component

### Description
List rendering is hand-rolled in `src/app/services/page.tsx`, `src/app/events/page.tsx`, and `src/app/api-keys/page.tsx`, each with its own markup and header semantics. A shared table primitive would make column behaviour consistent.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `src/components/DataTable.tsx` with a typed column definition, caption, and `scope` attributes on headers.
- Support optional client-side sorting with `aria-sort` reflected on the active column.
- Adopt it on one existing list page to prove the API.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/components-data-table`
- **Write code in:** `src/components/DataTable.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/DataTable.test.tsx`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: add accessible DataTable primitive`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add first and last page controls plus a result count to Pagination"
labels: type:enhancement, area:components, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Extend Pagination with jump and count affordances

### Description
`src/components/Pagination.tsx` exposes only Previous and Next. On a long services or events list, reaching the final page requires one click per page and the total result count is never shown.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add optional First and Last buttons that respect the existing disabled-state styling.
- Accept an optional `totalItems` prop and render a "showing X-Y of Z" summary in the live region.
- Keep the component a no-op when `pageCount` is one or less.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/components-pagination-controls`
- **Write code in:** `src/components/Pagination.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/Pagination.test.tsx`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: add first/last controls and result count to Pagination`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a refetch function to the useApi hook return value"
labels: type:feature, area:hooks, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Return a manual refetch handle from useApi

### Description
`src/lib/useApi.ts` refetches only when its `path` argument changes. Pages that need a manual retry currently rely on a full reload or on cache-busting query strings appended to the path.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Extend the returned state with a stable `refetch()` callback that re-runs the request and cancels any in-flight one.
- Preserve the existing discriminated-union status shape so current consumers keep compiling.
- Adopt `refetch` on at least one error state to replace a reload-based retry.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/hooks-useapi-refetch`
- **Write code in:** `src/lib/useApi.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/useApi.test.tsx`
- **Add documentation:** `docs/hooks.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(hooks): return a refetch callback from useApi`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a useApiMutation hook for POST and DELETE flows"
labels: type:feature, area:hooks, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a mutation counterpart to useApi

### Description
`src/lib/useApi.ts` covers reads only. Write flows in `src/app/services/new/page.tsx`, `src/app/webhooks/page.tsx`, and `src/app/api-keys/page.tsx` each re-implement their own pending/error/success state machine around `apiClient`.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `src/lib/useApiMutation.ts` exposing `mutate`, `status`, `error`, and `reset`.
- Abort in-flight mutations on unmount and ignore late responses, matching the `useApi` cancellation contract.
- Migrate one write page to the hook to validate the ergonomics.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/hooks-use-api-mutation`
- **Write code in:** `src/lib/useApiMutation.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/useApiMutation.test.tsx`
- **Add documentation:** `docs/hooks.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(hooks): add useApiMutation for write flows`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Extract the clipboard logic from CopyButton into a useClipboard hook"
labels: type:refactor, area:hooks, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Extract a reusable useClipboard hook

### Description
Clipboard writing plus the transient "copied" state lives inside `src/components/CopyButton.tsx`. Other surfaces that want copy behaviour without the button chrome, such as the curl blocks in `src/components/CurlBlock.tsx`, cannot reuse it.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `src/lib/useClipboard.ts` returning `copy(text)`, a `copied` flag, and an `error` value.
- Reimplement `CopyButton` on top of the hook with no change to its props.
- Make the copied-flag timeout configurable and cleared on unmount.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/hooks-use-clipboard`
- **Write code in:** `src/lib/useClipboard.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/useClipboard.test.tsx`
- **Add documentation:** `docs/hooks.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`refactor(hooks): extract useClipboard from CopyButton`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a clipboard fallback for insecure and unsupported contexts"
labels: type:enhancement, area:clipboard, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Handle missing clipboard API in CopyButton

### Description
`src/components/CopyButton.tsx` depends on `navigator.clipboard`, which is undefined over plain HTTP and in older browsers. The copy action then fails silently instead of offering an alternative.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Detect an unavailable clipboard API and fall back to a selectable text region the user can copy manually.
- Surface a clear failure message through the toast system rather than a console error.
- Cover both the supported and unsupported paths in tests.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/clipboard-insecure-fallback`
- **Write code in:** `src/components/CopyButton.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/CopyButton.test.tsx`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`fix: add clipboard fallback for insecure contexts`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add retry with exponential backoff for transient API failures"
labels: type:enhancement, area:api-client, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Retry transient backend failures in the API client

### Description
`src/lib/apiClient.ts` surfaces the first failure directly, so a single 502 from the backend or a dropped connection turns into a full-page error state on every dashboard route.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Retry idempotent GET requests on network errors and 5xx responses with exponential backoff and jitter.
- Cap the attempt count and total elapsed time, and never retry 4xx responses or aborted requests.
- Expose the retry policy as an option so call sites can opt out.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/api-client-retry-backoff`
- **Write code in:** `src/lib/apiClient.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/apiClient.test.ts`
- **Add documentation:** `docs/api-integration.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(api): retry transient GET failures with exponential backoff`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Deduplicate concurrent identical GET requests in the API client"
labels: type:performance, area:api-client, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add in-flight request deduplication

### Description
Several routes mount multiple components that each call `useApi` with the same path — for example the stats surfaces polled by `src/lib/usePolling.ts`. `src/lib/apiClient.ts` issues one network request per caller.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Key in-flight GET promises by resolved URL and share the result among concurrent callers.
- Evict the entry as soon as the promise settles so no stale data is served.
- Ensure a caller aborting does not cancel the request for the other subscribers.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b performance/api-client-request-dedupe`
- **Write code in:** `src/lib/apiClient.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/apiClient.test.ts`
- **Add documentation:** `docs/api-integration.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`perf(api): deduplicate concurrent identical GET requests`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Surface the backend requestId in error states for support correlation"
labels: type:enhancement, area:error-handling, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Show requestId alongside API errors

### Description
`src/lib/apiClient.ts` already models `requestId` on its `ApiError` type and copies it onto thrown errors, but `src/lib/useApi.ts` narrows failures to a bare `error` string. The correlation id never reaches the UI.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Widen the `useApi` error state to carry the optional `requestId` and error code.
- Render the id in a copyable, de-emphasised line beneath the error message on failing pages.
- Omit the line entirely when the backend does not supply an id.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/error-handling-request-id`
- **Write code in:** `src/lib/useApi.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/useApi.test.tsx`
- **Add documentation:** `docs/api-integration.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: surface backend requestId in API error states`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a shared ErrorMessage component for consistent failure rendering"
labels: type:refactor, area:error-handling, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Unify API error presentation

### Description
Each data page renders failures its own way — some as a bare paragraph with `role="alert"`, others inline in the content area. There is no shared component, so tone, spacing, and retry affordances differ across routes.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `src/components/ErrorMessage.tsx` with a title, detail, optional `requestId`, and an optional retry action.
- Adopt it on the events, stats, and services pages to replace the ad-hoc markup.
- Ensure the component announces itself once, without re-announcing on unrelated re-renders.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/error-handling-error-message`
- **Write code in:** `src/components/ErrorMessage.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/ErrorMessage.test.tsx`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`refactor: add shared ErrorMessage component`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Give ApiTimeoutError a distinct user-facing message and retry affordance"
labels: type:enhancement, area:error-handling, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Distinguish timeouts from generic failures

### Description
`src/lib/apiClient.ts` defines a dedicated `ApiTimeoutError` with the elapsed milliseconds, but `src/lib/useApi.ts` flattens it into the same generic error string as an HTTP failure. Users cannot tell a slow backend from a broken one.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Detect `ApiTimeoutError` in the hook and expose a distinct error kind on the state.
- Render timeout-specific copy that invites a retry rather than suggesting a permanent fault.
- Cover the timeout branch explicitly in the hook tests using fake timers.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/error-handling-timeout-copy`
- **Write code in:** `src/lib/useApi.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/useApi.test.tsx`
- **Add documentation:** `docs/api-integration.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: distinguish timeout errors from generic API failures`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add an offline and reconnect banner driven by network status"
labels: type:feature, area:connectivity, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Warn when the browser goes offline

### Description
When connectivity drops, every route built on `src/lib/useApi.ts` shows an indistinct fetch error. Nothing tells the user the failure is local, and nothing refreshes automatically once the connection returns.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a `useOnlineStatus` hook subscribing to the `online` and `offline` window events.
- Render a dismissible banner from `src/app/layout.tsx` while offline, announced politely.
- Trigger a refetch on the active page when connectivity is restored.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/connectivity-offline-banner`
- **Write code in:** `src/lib/useOnlineStatus.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/useOnlineStatus.test.tsx`
- **Add documentation:** `docs/hooks.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: add offline and reconnect banner`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Surface backend rate-limit headers in the UI"
labels: type:feature, area:rate-limiting, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Read and display API rate-limit state

### Description
`src/lib/apiClient.ts` discards response headers entirely, so any `X-RateLimit-Remaining` or `Retry-After` value returned by the AgentPay backend is invisible. Users hitting a limit only see an opaque failure.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Parse standard rate-limit headers in the client and expose them on a typed result envelope.
- Show a warning when the remaining quota falls below a threshold, and a countdown on a 429.
- Suppress retries until the `Retry-After` window elapses.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/rate-limiting-header-surfacing`
- **Write code in:** `src/lib/apiClient.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/apiClient.test.ts`
- **Add documentation:** `docs/api-integration.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: surface backend rate-limit headers in the dashboard`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a truncateMiddle helper for long agent and service identifiers"
labels: type:enhancement, area:formatting, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add middle-ellipsis truncation for identifiers

### Description
Agent and service identifiers render at full length across `src/app/agents/[agent]/page.tsx` and `src/app/services/page.tsx`, overflowing narrow viewports. `src/lib/format.ts` has no truncation helper, so CSS ellipsis hides the distinguishing tail of each id.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add `truncateMiddle(value, head, tail)` to `src/lib/format.ts` preserving both ends of the identifier.
- Render the truncated form with the full value exposed via `title` and an accessible label.
- Return the input unchanged when it is already within the budget.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/formatting-truncate-middle`
- **Write code in:** `src/lib/format.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/format.test.ts`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: add truncateMiddle helper for long identifiers`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add an absolute timestamp tooltip to relative TimeAgo output"
labels: type:enhancement, area:components, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Expose the exact timestamp behind TimeAgo

### Description
`src/components/TimeAgo.tsx` renders only a relative string such as "3 hours ago". When auditing the event log in `src/app/events/page.tsx`, users need the exact timestamp and currently have no way to see it.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Render the absolute, locale-formatted timestamp in the element's `title` and `dateTime` attributes.
- Offer an opt-in tooltip using the existing `src/components/Tooltip.tsx` for pointer and keyboard users.
- Keep the relative text as the accessible name so announcements stay concise.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/components-timeago-absolute`
- **Write code in:** `src/components/TimeAgo.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/TimeAgo.test.tsx`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: expose absolute timestamps from TimeAgo`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a locale preference in Settings that drives number formatting"
labels: type:feature, area:settings, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a user locale preference

### Description
`src/lib/format.ts` hard-codes `en-US` as `DEFAULT_LOCALE` even though `formatStroops` already accepts a `locale` option. `src/app/settings/page.tsx` offers no way for a user to change it.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a locale select to the Settings page persisted with `src/lib/useLocalState.ts`.
- Provide the preference to formatting helpers through a context so call sites do not thread it manually.
- Default to the browser locale when no preference has been stored.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/settings-locale-preference`
- **Write code in:** `src/app/settings/page.tsx`
- **Write comprehensive tests in:** `src/app/settings/page.test.tsx`
- **Add documentation:** `docs/theming.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: add locale preference driving number formatting`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add sortable columns to the services list"
labels: type:feature, area:services, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Make the services list sortable

### Description
`src/app/services/page.tsx` renders services in whatever order the backend returns. With more than a handful registered, finding the most expensive or most recently added service requires manual scanning.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add client-side sorting by name, price, and creation time with `aria-sort` on the active header.
- Persist the chosen sort in the URL query string so the view is shareable and survives reload.
- Keep sorting stable so equal keys retain backend order.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/services-sortable-columns`
- **Write code in:** `src/app/services/page.tsx`
- **Write comprehensive tests in:** `src/app/services/page.test.tsx`
- **Add documentation:** `docs/architecture.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: add sortable columns to the services list`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a CSV export action to the event log"
labels: type:feature, area:events, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Export filtered events as CSV

### Description
`src/app/export/page.tsx` exports usage data, but the audit trail rendered by `src/app/events/page.tsx` can only be read on screen. Operators reconciling incidents have no way to take the filtered log elsewhere.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add an export action that serialises the currently filtered events to CSV client-side.
- Escape embedded quotes, commas, and newlines, and guard against formula-injection prefixes.
- Disable the action while loading and when the filtered set is empty.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/events-csv-export`
- **Write code in:** `src/app/events/page.tsx`
- **Write comprehensive tests in:** `src/app/events/page.test.tsx`
- **Add documentation:** `docs/api-integration.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: add CSV export to the event log`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a date-range filter to the usage export form"
labels: type:feature, area:export, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add date-range selection to usage exports

### Description
`src/app/export/ExportActions.tsx` exports the full usage set with no time bounds. Reconciling a single billing period therefore means downloading everything and filtering externally.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add validated start and end date inputs, rejecting ranges where the end precedes the start.
- Pass the range to the backend as query parameters and reflect it in the file name.
- Default to the current month and expose quick presets for the last 7 and 30 days.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/export-date-range-filter`
- **Write code in:** `src/app/export/ExportActions.tsx`
- **Write comprehensive tests in:** `src/app/export/page.test.tsx`
- **Add documentation:** `docs/api-integration.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: add date-range filter to usage export`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add an accessible sparkline to the service detail page"
labels: type:feature, area:charts, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Visualise recent usage on the service detail page

### Description
`src/app/services/[serviceId]/page.tsx` presents service metadata as text only. A small usage trend would make spikes obvious without leaving the page, and no chart primitive exists yet.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a dependency-free inline SVG `Sparkline` component with an accessible table fallback.
- Provide `role="img"` with a descriptive label summarising the trend direction and range.
- Respect `prefers-reduced-motion` by skipping any draw animation.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/charts-service-sparkline`
- **Write code in:** `src/components/Sparkline.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/Sparkline.test.tsx`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat: add accessible sparkline to the service detail page`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Validate priceStroops bounds on the service edit form"
labels: type:security, area:validation, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Bound the price field on service edit

### Description
`src/app/services/[serviceId]/edit/page.tsx` accepts a price value without an upper bound. `src/lib/validateNumber.ts` enforces positive integers but nothing rejects values beyond `Number.MAX_SAFE_INTEGER`, which silently lose precision before reaching the backend.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a documented maximum to the positive-integer validator and apply it to both the edit and create forms.
- Reject non-integer, exponent, and whitespace-padded input before submission.
- Show the accepted range in the field hint rather than only on error.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/validation-price-bounds`
- **Write code in:** `src/lib/validateNumber.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/validateNumber.test.ts`
- **Add documentation:** `docs/api-integration.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`fix: bound priceStroops on service create and edit forms`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Escape user-controlled values interpolated into docs curl examples"
labels: type:security, area:docs-generation, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Harden curl example generation

### Description
`src/app/docs/endpoints.ts` interpolates `baseUrl` directly into shell command strings. Because the base URL originates from `NEXT_PUBLIC_AGENTPAY_API_BASE`, a misconfigured value could produce a copyable command containing shell metacharacters.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Validate the base URL against the same rules as `src/lib/resolveApiBase.ts` before interpolation.
- Quote the URL in generated commands and reject values containing shell metacharacters.
- Cover the malicious-input path in the endpoints tests.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/docs-generation-curl-escaping`
- **Write code in:** `src/app/docs/endpoints.ts`
- **Write comprehensive tests in:** `src/app/docs/page.test.tsx`
- **Add documentation:** `docs/security-headers.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`fix(security): escape interpolated base URL in curl examples`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a bundle-size budget check to the CI pipeline"
labels: type:performance, area:ci, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Guard against bundle-size regressions

### Description
`.github/workflows/ci.yml` builds the app but never inspects the output. Client-heavy routes such as `src/app/events/page.tsx` and `src/app/search/page.tsx` can grow without any signal in review.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Parse the Next.js build output and fail when a route's first-load JavaScript exceeds a configured budget.
- Store budgets in a committed config file so raising one is an explicit, reviewed change.
- Post the per-route comparison as a pull-request comment alongside the coverage summary.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b performance/ci-bundle-budget`
- **Write code in:** `.github/workflows/ci.yml`
- **Write comprehensive tests in:** `src/__tests__/readme_route_and_commands.test.ts`
- **Add documentation:** `docs/architecture.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`ci: add first-load bundle size budgets`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Adopt next/font to remove render-blocking font loading"
labels: type:performance, area:rendering, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Optimise font loading in the root layout

### Description
`src/app/layout.tsx` and `src/app/globals.css` do not use the `next/font` loader, so typography relies on system or externally fetched faces. This costs a layout shift on first paint and leaves font sources outside the CSP allowlist built in `src/lib/securityHeaders.ts`.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Load the display and body faces through `next/font` with `display: swap` and a self-hosted subset.
- Expose the generated CSS variables to Tailwind so utility classes pick them up.
- Confirm no new external origins are required by the CSP after the change.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b performance/rendering-next-font`
- **Write code in:** `src/app/layout.tsx`
- **Write comprehensive tests in:** `src/app/layout.test.tsx`
- **Add documentation:** `docs/theming.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`perf: load fonts through next/font`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Source the changelog page from a versioned data module"
labels: type:refactor, area:changelog, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Extract changelog entries into typed data

### Description
`src/app/changelog/page.tsx` embeds release entries directly in JSX, mixing content with presentation. Adding a release means editing a component, and the entries cannot be reused for an SEO feed or the docs surface.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Move entries into a typed `src/app/changelog/entries.ts` module mirroring the `src/app/docs/endpoints.ts` pattern.
- Render from the data module and sort by date so ordering cannot drift.
- Validate the entry shape in tests, including the existing empty-state path.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/changelog-entries-module`
- **Write code in:** `src/app/changelog/entries.ts`
- **Write comprehensive tests in:** `src/app/changelog/page.test.tsx`
- **Add documentation:** `docs/architecture.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`refactor: extract changelog entries into a data module`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add Playwright smoke tests for the critical dashboard routes"
labels: type:test, area:e2e, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add end-to-end smoke coverage

### Description
All existing tests are Jest and jsdom based. Nothing exercises the real Next.js server, so routing regressions, middleware header application from `next.config.ts`, and hydration errors would only surface in production.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add Playwright with a smoke spec covering the home, services, stats, docs, and events routes.
- Assert the security headers from `src/lib/securityHeaders.ts` are present on a served response.
- Run the suite against a production build in a separate CI job.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/e2e-playwright-smoke`
- **Write code in:** `playwright.config.ts`
- **Write comprehensive tests in:** `e2e/smoke.spec.ts`
- **Add documentation:** `docs/testing.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`test: add Playwright smoke coverage for critical routes`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Raise the global Jest coverage thresholds toward the per-file gates"
labels: type:test, area:coverage, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Ratchet up the global coverage floor

### Description
`jest.config.ts` sets global thresholds of 20 percent statements and 20 percent lines while individual files are locked at 100 percent. The global floor is low enough that a new untested module can be added with no CI signal.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Measure current global coverage and raise the thresholds to just below it as a ratchet.
- Add the highest-value uncovered modules to the per-file threshold map.
- Document the ratcheting policy so thresholds are only ever raised.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/coverage-global-ratchet`
- **Write code in:** `jest.config.ts`
- **Write comprehensive tests in:** `src/__tests__/readme_route_and_commands.test.ts`
- **Add documentation:** `docs/testing.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`test: raise global coverage thresholds`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add tests for the admin layout and nested route segment layouts"
labels: type:test, area:layouts, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Cover the per-route layout segments

### Description
Route-segment layouts including `src/app/admin/layout.tsx`, `src/app/agents/layout.tsx`, `src/app/events/layout.tsx`, and `src/app/usage/layout.tsx` have no tests, while `src/app/services/layout.test.tsx` shows the intended pattern.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a shared parameterised suite asserting each layout renders its children and exports the expected metadata.
- Verify the metadata title matches the entry declared in `src/app/pageTitles.ts`.
- Keep the suite data-driven so new segments are covered by adding one row.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/layouts-segment-coverage`
- **Write code in:** `src/app/admin/layout.tsx`
- **Write comprehensive tests in:** `src/app/__tests__/layouts.test.tsx`
- **Add documentation:** `docs/testing.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`test: cover nested route segment layouts`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add tests for the DocsFilter search and empty-result behaviour"
labels: type:test, area:docs-page, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Cover the docs filter component

### Description
`src/app/docs/DocsFilter.tsx` implements the in-page endpoint search but has no dedicated test file; coverage comes only indirectly through `src/app/docs/page.test.tsx`. Debounce and no-match behaviour are untested.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Assert filtering matches on both endpoint heading and prose from `src/app/docs/endpoints.ts`.
- Cover the no-results state and the clear action that restores the full list.
- Verify the result count is announced through a live region.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/docs-page-filter-coverage`
- **Write code in:** `src/app/docs/DocsFilter.tsx`
- **Write comprehensive tests in:** `src/app/docs/__tests__/DocsFilter.test.tsx`
- **Add documentation:** `docs/testing.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`test: add DocsFilter search and empty-state coverage`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add tests for the PageSkeleton and CurlBlock rendering contracts"
labels: type:test, area:components, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Cover the remaining untested primitives

### Description
`src/components/PageSkeleton.tsx` has no file in `src/components/__tests__/`, and `src/components/CurlBlock.tsx` is held at a 100 percent threshold in `jest.config.ts` without a dedicated suite of its own.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a suite asserting `PageSkeleton` renders its configured row count with correct busy semantics.
- Add a `CurlBlock` suite covering command rendering, the copy affordance, and long-line wrapping.
- Register both files in the per-file coverage threshold map.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/components-skeleton-curlblock`
- **Write code in:** `src/components/PageSkeleton.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/PageSkeleton.test.tsx`
- **Add documentation:** `docs/testing.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`test: cover PageSkeleton and CurlBlock`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Document the state management and data-flow conventions"
labels: type:docs, area:architecture, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Write a state management conventions guide

### Description
`docs/hooks.md` documents individual hooks and `docs/architecture.md` covers routes, but nothing explains when to reach for `useApi`, `useLocalState`, `usePolling`, or plain `useState`. New contributors infer the convention from whichever page they open first.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Add a guide covering server versus client state, when polling is appropriate, and cancellation expectations.
- Include a decision table mapping common scenarios to the hook in `src/lib/` that fits.
- Cross-link the guide from `docs/architecture.md` and `CONTRIBUTING.md`.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/architecture-state-conventions`
- **Write code in:** `docs/state-management.md`
- **Write comprehensive tests in:** `src/__tests__/readme_route_and_commands.test.ts`
- **Add documentation:** `docs/architecture.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`docs: add state management conventions guide`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Document the form validation conventions and shared validators"
labels: type:docs, area:forms, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Write a forms and validation guide

### Description
Validation logic is split across `src/lib/validateNumber.ts` and `src/lib/validateId.ts` and consumed by the create, edit, webhook, and usage forms. No document explains the shared contract, so new forms tend to inline their own checks.

### Requirements and context
- **Repository scope:** Agentpay-Org/Agentpay-frontend only.
- Document the validator signatures, error-message conventions, and the `TextField` error wiring.
- Describe when validation belongs in a shared helper versus a single form.
- Include a worked example of adding a validated field end to end.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/forms-validation-guide`
- **Write code in:** `docs/forms.md`
- **Write comprehensive tests in:** `src/lib/__tests__/validateNumber.test.ts`
- **Add documentation:** `docs/components.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`docs: add forms and validation conventions guide`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the AgentPay community on Discord:** https://discord.gg/eXvRKkgcv
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
