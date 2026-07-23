# Contributing to AgentPay Frontend

Thanks for helping improve the AgentPay frontend. This guide documents the workflow, review expectations, and UI conventions used by the project and its GrantFox OSS campaign issues.

## Project Setup

Use Node.js 20 to match CI.

```bash
npm ci
npm run build
npm test
```

For local development, run:

```bash
npm run dev
```

The app runs at `http://localhost:3000` by default.

## Branches and Commits

Create focused branches from `main` using the campaign convention:

```text
<type>/<area>-<issue-number>-<short-slug>
```

Examples:

```text
docs/docs-30-contributing-guide
fix/services-42-empty-state
feature/api-keys-18-create-flow
```

Use concise conventional commit messages when possible:

```text
docs: add contributing guide
fix: handle empty service lists
feat: add api key search
```

Keep each pull request scoped to one issue or one clear behavior change.

## Local Checks

Before opening a pull request, run the checks that apply to your change:

```bash
npm run build
npm test
npm run lint
npm run typecheck
```

The current CI workflow runs `npm ci`, `npm run build`, and `npm test` on pushes and pull requests targeting `main`. Running lint and typecheck locally is still expected for reviewer confidence because both scripts are available in `package.json`.

For test-heavy changes, keep coverage high for the touched area. Campaign issues may ask for a 95% coverage bar; when they do, include the coverage command and result in the pull request notes.

## UI and Accessibility Conventions

Prefer the shared components in `src/components/` before creating new primitives:

- `Button.tsx` for actions and links styled as controls.
- `TextField.tsx` for labeled text inputs.
- `Card.tsx`, `StatTile.tsx`, and `KeyValueGrid.tsx` for dashboard surfaces.
- `Spinner.tsx`, `EmptyState.tsx`, and `ToastProvider.tsx` for loading, empty, and feedback states.

Follow the existing accessibility patterns:

- Use semantic HTML and accessible names for interactive controls.
- Preserve focus-visible styling and keyboard navigation.
- Associate labels and descriptions with inputs.
- Prefer role and label based assertions in tests over implementation details.
- Keep color, spacing, and loading states consistent with existing pages.

Route API work through the helpers in `src/lib/`, especially `src/lib/apiClient.ts` and `src/lib/useApi.ts`, unless a task explicitly requires a different integration path.


## Dependency Update Review

Dependabot pull requests are expected to stay small and reviewable. Weekly npm and GitHub Actions updates should keep minor and patch releases grouped, while major-version updates should remain separate so reviewers can inspect migration notes and test impact.

When reviewing a dependency pull request, check the changelog or release notes for security fixes, breaking changes, and build-tool behavior changes. Run the normal build and test commands when the change affects runtime dependencies, test tooling, Next.js, React, or GitHub Actions used by CI.

## Pull Request Checklist

Include the issue reference and summarize the reviewer-relevant changes:

```text
Closes #<issue-number>
```

Before requesting review, confirm:

- The PR is scoped to one issue or one cohesive change.
- Relevant tests were added or updated.
- `npm run build` and `npm test` were run, or the reason they were not run is documented.
- `npm run lint` and `npm run typecheck` were run for code changes.
- Documentation was updated when behavior, setup, or contributor workflow changed.
- No secrets, tokens, `.env` files, or generated build artifacts were committed.
- UI changes preserve keyboard and screen-reader behavior.

## Security Notes

Never commit API keys, wallet seeds, private keys, `.env` files, or production credentials. If a change touches authentication, wallet integration, payments, or API calls, add a short security note to the PR describing the trust boundary and what was validated.

## Community and Rewards

This repository participates in the GrantFox OSS campaign. For questions and review coordination, use the AgentPay community Discord linked from campaign issues. Rewards are handled by the campaign maintainers after merge when an issue is eligible.