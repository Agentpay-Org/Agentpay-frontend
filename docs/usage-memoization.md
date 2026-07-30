# Usage view rendering and memoization

The usage view (`src/app/usage/page.tsx`) holds two independent forms — Record
and Query — plus a date-range control. Because it is one component, a keystroke
in the Record form re-rendered *everything*: the preset buttons, the custom date
inputs, and the query result. This document describes the memoization boundaries
that stop that.

Behaviour and rendered output are unchanged. This is a pure refactor.

## Modules

| Module | Role |
| --- | --- |
| `dateRange.ts` | Pure helpers: `PresetKey`, `PRESET_RANGES`, `PRESET_KEYS`, `toISODate`, `daysAgo`, `hoursAgo`, and `buildDateRangeAnnouncement`. No React import, so both the page and the memoized control can use them without pulling each other into a re-render. |
| `UsageDateRangeFilters.tsx` | `memo`-wrapped date-range control: preset radios, custom date inputs, and the range description. |
| `UsageQueryRows.tsx` | `memo`-wrapped query result rows, plus `deriveUsageRows`, which flattens a response into the rows to render. |
| `page.tsx` | Owns state; memoizes derived data and holds the handlers stable. |

## What is memoized, and why

- **Derived data — `useMemo`.**
  - `dateRangeAnnouncement` is recomputed only when `activePreset`, `startDate`,
    or `endDate` changes.
  - `queryRows` is recomputed only when `queryResult` changes. The memo exists
    for the array's *identity*, not the cost of building it: a fresh array every
    render would defeat the memo on `UsageQueryRows`.
- **Row rendering — `memo`.** `UsageQueryRows` re-renders only when `queryRows`
  changes identity. Typing in either form, or a record request completing, no
  longer touches it.
- **The filter control — `memo`.** `UsageDateRangeFilters` re-renders only when
  the range itself changes. Its props are primitives plus callbacks the page
  holds stable, so React's default shallow comparison is sufficient — no custom
  comparator.
- **Handlers — `useCallback`.** `applyPreset`, `onStartDateChange`, and
  `onEndDateChange` are stable with `[]` deps (they only call state setters).
  Without this the memoized control would receive fresh props on every render
  and the `memo` would never bail out.

## What is deliberately *not* memoized

The `onRecord` and `onQuery` submit handlers. They are passed to plain `<form>`
elements, not to memoized components, so wrapping them would add indirection
without preventing a single re-render.

## Testing the memoization

Two complementary approaches, both dependency-free:

1. **Page level** (`__tests__/usage-memoization.test.tsx`) — each memoized child
   module is replaced by a `memo`-wrapped counter that delegates to the real
   implementation. Since the wrapper is itself memoized, the counter increments
   only when the props the page passes have changed identity. This is what
   proves the `useMemo`/`useCallback` work: reverting any one of them makes
   these tests fail.
2. **Component level** (`__tests__/UsageQueryRows.test.tsx`) — rows are built
   with a getter on `total` that counts reads. A skipped render leaves the count
   untouched, so re-renders are observable without instrumenting the component.

Both directions are asserted: unrelated state changes must *not* re-render, and
a real change (preset selected, custom date edited, new query result) *must*.
