## Summary

Adds comprehensive unit tests for `StatTile` (trend colour logic) and `StatusDot` (variant labels and accessibility). Both components now sit at **100% statement, branch, function, and line coverage**.

## Changes

### `src/components/__tests__/StatTile.test.tsx`

Verifies the double-negative trend colour expression against all four delta/`positiveIsGood` combinations, plus edge cases:

| Scenario | Expected colour |
|---|---|
| `delta > 0`, `positiveIsGood` omitted (default `true`) | emerald (green — good increase) |
| `delta < 0`, `positiveIsGood` omitted (default `true`) | rose (red — bad decrease) |
| `delta > 0`, `positiveIsGood: false` | rose (red — bad increase, e.g. error rate) |
| `delta < 0`, `positiveIsGood: false` | emerald (green — good decrease) |
| `delta = 0`, `positiveIsGood` omitted | rose (stagnation = bad) |
| `delta = 0`, `positiveIsGood: false` | emerald (stagnation = ok) |
| No trend prop | No `<p>` rendered |
| `delta > 0` | Prefixes with `+` |
| `delta < 0` | No `+` prefix |

Colour is asserted via Tailwind class matching (`/emerald/` / `/rose/`), and the visible text content (including `▲`/`▼` and `+` prefix) is checked alongside it.

### `src/components/__tests__/StatusDot.test.tsx`

Covers every variant's label and dot colour, accessible markup rules, and custom-label fallback semantics:

| Test | What it asserts |
|---|---|
| Default labels | `ok` → "Operational", `warn` → "Degraded", `down` → "Down" |
| Dot colour per variant | `.bg-emerald-500`, `.bg-amber-500`, `.bg-rose-500` |
| `aria-hidden="true"` on the dot | Colour is never the only cue (WCAG 1.4.1) |
| Label is **not** `aria-hidden` | Visible text carries the meaning for AT |
| Custom string label | Overrides the default; dot colour preserved |
| ReactNode label | Accepts rich children (e.g. `<strong>`) |
| Empty-string `label=""` | Falls back to the variant default |
| Explicit `label={undefined}` | Falls back to the variant default |
| Visible text guard | At least one non-`aria-hidden` span holds non-empty text |

### JSDoc added

- **`StatTile.tsx`**: Clarified that `positiveIsGood` defaults to `true`, and documented the delta/colour mapping with a table.
- **`StatusDot.tsx`**: Documented the WCAG 1.4.1 rationale, the three variant defaults, and the `label` fallback behaviour (empty-string, `null`, `undefined`).

## Test output

```
PASS src/components/__tests__/StatTile.test.tsx
PASS src/components/__tests__/StatusDot.test.tsx
Tests:       24 passed, 24 total

------------------|---------|----------|---------|---------|-------------------
File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------|---------|----------|---------|---------|-------------------
 StatTile.tsx     |     100 |      100 |     100 |     100 |
 StatusDot.tsx    |     100 |      100 |     100 |     100 |
------------------|---------|----------|---------|---------|-------------------
```
