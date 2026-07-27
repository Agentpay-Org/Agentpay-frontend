# Testing & Coverage

## Running tests

| Command | Description |
|---------|-------------|
| `npm test` | Run the full Jest suite once (no coverage) |
| `npm run test:coverage` | Run the full Jest suite and collect coverage |
| `npm run test:watch` | Run Jest in interactive watch mode (local dev only) |

`test:coverage` is the canonical way to verify coverage gates locally and is what CI checks on every PR.

## Coverage reports

When you run `npm run test:coverage`, Jest writes three report formats into `coverage/`:

| Format | Location | Use |
|--------|----------|-----|
| `text` | printed to the terminal | Quick scan after a run |
| `lcov` | `coverage/lcov.info` | Import into IDE coverage overlays (VS Code Coverage Gutters, etc.) |
| `json-summary` | `coverage/coverage-summary.json` | Machine-readable; consumed by CI badge scripts |

Open `coverage/lcov-report/index.html` in a browser for the full line-by-line HTML report.

## Coverage thresholds

Thresholds are enforced by Jest itself via `coverageThreshold` in [`jest.config.ts`](../jest.config.ts). A build **fails** if any threshold is not met — the script exits non-zero.

### Global floor

Applies to the aggregate of every file **not** listed in the per-file table below.

| Metric | Threshold |
|--------|-----------|
| Statements | 20% |
| Branches | 40% |
| Functions | 28% |
| Lines | 20% |

The global floor is intentionally low because many pages are stubs. It exists to prevent wholesale regressions, not to enforce completeness on every file.

### Per-file gates

These files are fully tested and locked at their current coverage level. Any PR that drops coverage below these numbers will fail CI.

| File | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| `src/app/page.tsx` | 100% | 100% | 100% | 100% |
| `src/app/docs/DocsFilter.tsx` | 100% | 100% | 100% | 100% |
| `src/components/Badge.tsx` | 100% | 100% | 100% | 100% |
| `src/components/Breadcrumb.tsx` | 100% | 100% | 100% | 100% |
| `src/components/Card.tsx` | 100% | 100% | 100% | 100% |
| `src/components/ConfirmDialog.tsx` | 100% | 94% | 100% | 100% |
| `src/components/Header.tsx` | 100% | 100% | 100% | 100% |
| `src/components/Pagination.tsx` | 100% | 100% | 100% | 100% |
| `src/components/TextField.tsx` | 100% | 100% | 100% | 100% |
| `src/components/ThemeToggle.tsx` | 100% | 100% | 100% | 100% |
| `src/components/ToastProvider.tsx` | 100% | 100% | 100% | 100% |
| `src/lib/apiClient.ts` | 80% | 80% | 70% | 80% |
| `src/lib/resolveApiBase.ts` | 100% | 100% | 100% | 100% |
| `src/lib/securityHeaders.ts` | 100% | 100% | 100% | 100% |
| `src/lib/useDebounce.ts` | 100% | 100% | 100% | 100% |
| `src/lib/format.ts` | 100% | 92% | 100% | 100% |
| `src/lib/theme.ts` | 100% | 81% | 100% | 100% |

> **Near-100% files (`format.ts`, `theme.ts`, `ConfirmDialog.tsx`):** branches are locked at their current measured value rather than 100% because a small number of defensive branches are not reachable through the public API. The locks still prevent regression.

## Coverage scope

`collectCoverageFrom` in `jest.config.ts` includes:

```
src/**/*.{ts,tsx}
```

and explicitly excludes:

- `src/**/*.d.ts` — type declaration files
- `src/**/__tests__/**` — test files themselves

## Reading the terminal report

After `npm run test:coverage` the terminal prints a table like:

```
File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
src/components/Badge.tsx    |     100 |      100 |     100 |     100 |
src/lib/format.ts           |     100 |    92.30 |     100 |     100 | 47
```

The **Uncovered Line #s** column points directly to the lines not exercised by any test. Use those line numbers with the lcov HTML report for context.

## Route-segment layout tests

`src/app/__tests__/layouts.test.tsx` is a shared, data-driven suite covering every top-level route-segment layout (`admin`, `agents`, `api-keys`, `events`, `search`, `services`, `stats`, `usage`, `webhooks`). Each layout in this app is a simple pass-through component that renders its children and exports a static `metadata.title` sourced from [`src/app/pageTitles.ts`](../src/app/pageTitles.ts).

Rather than one test file per layout, the suite holds a `layoutCases` array of `{ name, Layout, metadata, expectedTitle }` rows and runs the same two assertions against each via `describe.each`:

1. The layout renders its `children` (a sentinel node is passed in and asserted visible).
2. `metadata.title` matches the corresponding entry in `pageTitles`, so the two files can never silently drift apart.

To cover a new route segment's layout, add one row to `layoutCases` — no new test file or boilerplate is needed. Dynamic-route layouts that use `generateMetadata` (e.g. `src/app/services/[serviceId]/layout.tsx`) are out of scope for this suite and continue to be covered by [`src/app/services/layout.test.tsx`](../src/app/services/layout.test.tsx).

## Adding coverage for a new file

1. Write tests until the file's metrics meet or exceed the per-file thresholds above.
2. Add a matching entry to the `coverageThreshold` block in `jest.config.ts` to lock it in.
3. Run `npm run test:coverage` locally to confirm the gate passes before opening a PR.

## CI

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs `npm test` on every push and pull request to `main`. To add coverage enforcement to CI, change that step to `npm run test:coverage` — the non-zero exit from Jest will fail the job automatically if any threshold is breached.
