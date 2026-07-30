# Activity component (`src/app/events/Activity.tsx`)

The `Activity` component is a page-local component used by the `/events` page to render individual event log entries.

## Contract

### `AppEvent` type

The component operates on the exported `AppEvent` type, representing a single generic event:

```ts
export type AppEvent = {
  id: string;
  ts: number | string | null;
  type: string;
  payload: unknown;
};
```

### Props

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `event` | `AppEvent` | yes | The event object to render. |

## Rendering rules

1. **Header row**: Displays the `event.type` in a monospace, uppercase format.
2. **Timestamps**:
   - Parses the `ts` field. If it is a valid finite number, it renders a `TimeAgo` component for a relative timestamp.
   - Always formats and displays an absolute timestamp string alongside it, utilizing `safeFormatTimestamp` from `src/lib/format.ts`.
3. **Payload body**: Safely stringifies `event.payload` (using `safeStringify` from `src/lib/format.ts` which handles circular references and length limits) and renders it inside a `<pre>` block that is scrollable if it exceeds `max-h-96`.

## Usage example

```tsx
import { Activity, AppEvent } from "@/app/events/Activity";

const event: AppEvent = {
  id: "evt_12345",
  type: "payment.succeeded",
  ts: 1672531200000,
  payload: {
    amount: 1500,
    currency: "XLM",
    status: "settled"
  }
};

<ul className="flex flex-col gap-4">
  <Activity event={event} />
</ul>
```
