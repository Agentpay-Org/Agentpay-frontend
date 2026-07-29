# Docs page (`/docs`)

Renders a filterable, curl-example reference of the AgentPay API,
sourced statically at build/render time (not fetched over the network).

## Files

| File | Role |
| --- | --- |
| `src/app/docs/page.tsx` | Server component. Builds the section list via `getSections(resolveApiBase())`, renders the intro copy and OpenAPI/reference links, and hands the sections to `DocsFilter`. |
| `src/app/docs/endpoints.ts` | Defines `ApiSection` and `getSections(baseUrl)`, which returns the hardcoded list of endpoint sections with the given base URL interpolated into each `curl` example. |
| `src/app/docs/DocsFilter.tsx` | Client component. Owns the search/filter UI and all interactive state. |

## `DocsFilter`

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `sections` | `ApiSection[]` | yes | `{ h: string; p: string; curl: string }[]` — heading, prose description, and curl example per endpoint. |

```tsx
<DocsFilter sections={getSections(resolveApiBase())} />
```

### States

- **Populated** (default): a debounced (300ms) `SearchBar` filters `sections`
  case-insensitively against both `h` and `p`. Matches render as a `<dl>` list,
  each entry with a `CurlBlock` copy-to-clipboard example.
- **No results for the current search** (`sections.length > 0` but the filter
  matches nothing): renders `EmptyState` titled "No matching endpoints" with
  guidance to try a different term. The search box stays visible.
- **No endpoints at all** (`sections.length === 0`): renders a distinct
  `EmptyState` titled "No endpoints documented yet" with no search box —
  since no search term could fix a missing content set, offering one would be
  misleading. This is a content/configuration state, not something the
  current `getSections()` implementation can actually produce (it always
  returns a fixed non-empty list), but `DocsFilter` handles it defensively
  for future callers.
- **Error**: `DocsFilter` has no async operation of its own, so no distinct
  error UI. The one call in the page that can throw —
  `resolveApiBase()`, invoked directly in the server component with no local
  `try`/`catch` — is caught by the app's root `error.tsx` boundary
  (`role="alert"`, keyboard-operable "Try again" via Next.js's `reset()`).

### Accessibility

- A polite, `aria-atomic` live region announces `"N result(s) for
  "<query>""` or `"No matches for "<query>""` after the debounce settles.
  It stays empty on mount and while there are no endpoints at all (there is
  nothing to announce the result of a search for).
- The search input, its clear button (via `SearchBar`'s `clearable` prop),
  and every endpoint's `CurlBlock` copy button are all reachable and
  operable by keyboard alone — see
  `src/app/docs/__tests__/DocsFilter.test.tsx` for the keyboard-driven
  filter-then-clear flow.

## Testing

`src/app/docs/page.tsx` and `src/app/docs/DocsFilter.tsx` are both locked at
100% coverage in `jest.config.ts` — see [docs/testing.md](./testing.md).
Tests live in `src/app/docs/page.test.tsx` (page-level: heading, link
fallbacks when `safeHref` rejects a URL) and
`src/app/docs/__tests__/DocsFilter.test.tsx` (filter/announce/empty-state/
keyboard behavior), both using real `getSections()` fixture data rather than
a hand-rolled mock so assertions track the actual documented content.
