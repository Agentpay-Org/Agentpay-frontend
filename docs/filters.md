# Filters component contract

This document is the concise reference for filter components in the AgentPay frontend, such as the `DocsFilter` component. Use it to understand the props and contract for filtering interfaces.

## `DocsFilter`

`DocsFilter` is a client component that provides a search interface to filter a list of API sections. It debounces user input and displays matching results or an empty state.

### Props

```ts
type Props = {
  sections: ApiSection[];
};
```

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `sections` | `ApiSection[]` | yes | The list of API sections to filter and display. Each section requires `h` (heading), `p` (prose), and `curl` (command). |

### Render states

- **Populated (Matches found)**: Renders the filtered `sections` based on the search query.
- **No results**: Renders an `EmptyState` when the search query yields no matches.
- **No endpoints**: Renders an `EmptyState` without a search box if the initial `sections` array is empty.

### Minimal usage

```tsx
import { DocsFilter } from "./DocsFilter";
import { type ApiSection } from "./endpoints";

function Example() {
  const sections: ApiSection[] = [
    { h: "GET /api/v1/status", p: "Check status", curl: "curl ..." }
  ];

  return <DocsFilter sections={sections} />;
}
```

## Accessibility

- The component includes a polite, `aria-atomic` live region that announces the number of search results to screen readers.
- The announcements are debounced to prevent spamming on every keystroke.
- The search input and result interactions are fully keyboard operable.
