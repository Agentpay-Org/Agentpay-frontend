# Help page (`/help`)

Client component displaying a list of help topics fetched from the backend.

## Files

| File | Role |
| --- | --- |
| `src/app/help/page.tsx` | Client component. Fetches help topics via `useApi` and renders them, managing loading, error, empty, and populated states. |
| `src/app/help/page.test.tsx` | Tests for the component's state rendering. |

## Data shape

The component expects the `/api/v1/help` endpoint to return data matching this structure:

```ts
type HelpTopic = { 
  id: string; 
  title: string; 
  content: string;
};

// Response shape
{ topics: HelpTopic[] }
```

## Props (Component Contract)

The `HelpPage` component is a Next.js App Router page component. It takes no props:

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| none | - | - | Page components do not take custom props. |

## States

- **Loading** (`state.status === "loading"`): renders the shared `Spinner` with the label "Loading help topics".
- **Error** (`state.status === "error"`): renders the shared `ErrorMessage` with the title "Failed to load help topics" and the error detail.
- **Empty** (`state.status === "ok"` and `topics.length === 0`): renders the shared `EmptyState` titled "No help topics found." with guidance to check back later.
- **Populated** (`state.status === "ok"` and `topics.length > 0`): renders a `<ul className="divide-y divide-zinc-200 dark:divide-zinc-800">` where each topic is a list item showing its `title` and `content`.

## Usage Example

As a Next.js App Router page, it is used automatically by the router when navigating to `/help`.

```tsx
// Handled by Next.js App Router internally:
import HelpPage from "@/app/help/page";

// Example manual render in a test:
<HelpPage />
```

## Testing

Tests live in `src/app/help/page.test.tsx` and assert correct rendering of all four states (loading, error, empty, success) using a mocked `useApi`.
