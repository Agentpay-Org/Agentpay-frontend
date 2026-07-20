# Dashboard API integration reference

This document catalogues every backend endpoint the AgentPay dashboard calls, with
the exact request body and the response shape the UI expects. Shapes are derived
from `src/lib/apiClient.ts` and the inline TypeScript declarations in each page —
**every shape below matches the code at the cited source.**

All requests go through the lightweight `fetch` wrapper in
[`src/lib/apiClient.ts`](../src/lib/apiClient.ts) (reads are usually issued via the
[`useApi`](../src/lib/useApi.ts) hook). Two call sites — the usage **Record** and
**Query** forms in [`src/app/usage/page.tsx`](../src/app/usage/page.tsx) — use raw
`fetch` directly but follow the same JSON conventions.

## Transport conventions

| Concern | Behaviour | Source |
| --- | --- | --- |
| Base URL | `API_BASE` resolved once at module load via `resolveApiBase()`; every path is `${API_BASE}${path}` | `apiClient.ts`, `resolveApiBase.ts` |
| Request headers | `Content-Type: application/json` is sent by default (callers may override) | `apiClient.ts` |
| Request body | `apiPost`/`apiPatch` `JSON.stringify` the supplied object | `apiClient.ts` |
| Empty response | HTTP **204** resolves to `undefined` (no body parsed) | `apiClient.ts` |
| Timeout | Default **10 000 ms**; on expiry the call rejects with `ApiTimeoutError` | `apiClient.ts` |
| Success | 2xx JSON body is returned as the generic `T` | `apiClient.ts` |

### Error envelope (`ApiError`)

Non-2xx responses are expected to carry this JSON envelope; the wrapper throws an
`Error` whose `message` (and `error`/`requestId`) come from it:

```ts
type ApiError = {
  error: string;       // machine-readable code, e.g. "validation_error"
  message: string;     // human-readable; surfaced in the UI
  requestId?: string;  // optional correlation id
};
```

If the body is missing/!ok, the wrapper falls back to `error: "http_error"` and a
`Request failed with status <code>` message.

### Pause flag

A global pause flag is exposed by `GET /api/v1/admin/status` (`{ paused }`) and
`GET /api/v1/stats` (`paused`), and toggled from the Admin page via
`POST /api/v1/admin/pause` / `POST /api/v1/admin/unpause`. **While paused the
backend refuses writes** (the Stats page surfaces "writes are refused"). In the
tables below, **Write** rows are the mutating calls subject to this flag; **Read**
rows are always available.

---

## Services

| Method & path | Type | Request body | Response shape | Source |
| --- | --- | --- | --- | --- |
| `GET /api/v1/services?page={page}&limit={limit}` | Read | — | `{ services?: Service[]; items?: Service[]; page?: number; pageCount?: number }` (UI reads `services ?? items`) | `services/page.tsx` |
| `GET /api/v1/services?q={query}&limit={limit}` | Read | — | `{ services: Service[] }` | `search/page.tsx` |
| `POST /api/v1/services` | Write | `{ serviceId: string; priceStroops: number }` | response ignored by UI | `services/new/page.tsx` |
| `GET /api/v1/services/{serviceId}` | Read | — | `Service` | `services/[serviceId]/page.tsx`, `.../edit/page.tsx` |
| `PATCH /api/v1/services/{serviceId}/price` | Write | `{ priceStroops: number }` | response ignored by UI | `services/[serviceId]/edit/page.tsx` |
| `GET /api/v1/services/{serviceId}/usage` | Read | — | `Rollup` | `services/[serviceId]/page.tsx` |
| `GET /api/v1/services/{serviceId}/agents/top?limit={limit}` | Read | — | `TopAgents` | `services/[serviceId]/agents/page.tsx` |

```ts
type Service   = { serviceId: string; priceStroops: number };
type Rollup    = { serviceId: string; total: number; agents: number };
type TopAgents = { serviceId: string; items: { agent: string; total: number }[] };
```

## Usage

| Method & path | Type | Request body | Response shape | Source |
| --- | --- | --- | --- | --- |
| `POST /api/v1/usage` | Write | `{ agent: string; serviceId: string; requests: number }` | `{ total: number }` | `usage/page.tsx` (raw `fetch`) |
| `GET /api/v1/usage/{agent}/{serviceId}` | Read | — | `{ agent: string; serviceId: string; total: number }` | `usage/page.tsx` (raw `fetch`) |
| `GET /api/v1/usage/export.json` | Read | — | file download (JSON), opened via `<a href>` | `export/ExportActions.tsx` |
| `GET /api/v1/usage/export.csv` | Read | — | file download (CSV), opened via `<a href>` | `export/ExportActions.tsx` |

Both export endpoints accept optional query parameters for date-range filtering:

| Parameter | Type | Description |
| --- | --- | --- |
| `startDate` | `string` (ISO date, e.g. `2025-01-01`) | Inclusive start of the date range |
| `endDate` | `string` (ISO date, e.g. `2025-12-31`) | Inclusive end of the date range |

Example: `GET /api/v1/usage/export.json?startDate=2025-01-01&endDate=2025-01-31`

The UI defaults to the current month and provides quick presets for the last 7 and 30 days.

## Stats

| Method & path | Type | Request body | Response shape | Source |
| --- | --- | --- | --- | --- |
| `GET /api/v1/stats` | Read | — | `Stats` | `stats/page.tsx`, `agents/page.tsx` |

```ts
type Stats = {
  totalServices: number;
  totalApiKeys: number;
  totalRequests: number;
  uniqueAgents: number;
  paused: boolean;
};
```

## Agents

| Method & path | Type | Request body | Response shape | Source |
| --- | --- | --- | --- | --- |
| `GET /api/v1/agents/{agent}/usage` | Read | — | `Usage` | `agents/[agent]/page.tsx` |
| `GET /api/v1/agents/{agent}/total` | Read | — | `{ total: number }` (optional; failure is ignored) | `agents/[agent]/page.tsx` |

```ts
type Usage = { agent: string; items: { serviceId: string; total: number }[] };
```

## Admin

| Method & path | Type | Request body | Response shape | Source |
| --- | --- | --- | --- | --- |
| `GET /api/v1/admin/status` | Read | — | `{ paused: boolean }` | `admin/page.tsx` |
| `POST /api/v1/admin/pause` | Write | `{}` | response ignored by UI | `admin/page.tsx` |
| `POST /api/v1/admin/unpause` | Write | `{}` | response ignored by UI | `admin/page.tsx` |

## API keys

| Method & path | Type | Request body | Response shape | Source |
| --- | --- | --- | --- | --- |
| `GET /api/v1/api-keys` | Read | — | `{ items: KeyItem[] }` | `api-keys/page.tsx` |
| `POST /api/v1/api-keys` | Write | `{ label: string }` | `{ key: string }` (full key, shown once) | `api-keys/page.tsx` |
| `DELETE /api/v1/api-keys/{prefix}` | Write | — | 204 (no body) | `api-keys/page.tsx` |

```ts
type KeyItem = { prefix: string; label: string; createdAt: number };
```

## Webhooks

| Method & path | Type | Request body | Response shape | Source |
| --- | --- | --- | --- | --- |
| `GET /api/v1/webhooks` | Read | — | `{ items: Webhook[] }` | `webhooks/page.tsx` |
| `POST /api/v1/webhooks` | Write | `{ url: string; events: string[] }` | response ignored by UI | `webhooks/page.tsx` |
| `DELETE /api/v1/webhooks/{id}` | Write | — | 204 (no body) | `webhooks/page.tsx` |

```ts
type Webhook = { id: string; url: string; events: string[]; createdAt: number };
```

## Events

| Method & path | Type | Request body | Response shape | Source |
| --- | --- | --- | --- | --- |
| `GET /api/v1/events?limit={limit}` | Read | — | `{ items: AppEvent[] } \| { events: AppEvent[] }` | `events/page.tsx` |

```ts
type AppEvent = {
  id: string;
  ts: number | string | null;
  type: string;
  payload: Record<string, unknown>;
};
```

### CSV export (client-side)

The **Export CSV** button on the Events page does not call the backend — it
serialises the currently filtered `AppEvent[]` (the full filtered set, not
just the 50 rows rendered on screen) into an RFC 4180 CSV string entirely in
the browser and triggers a download via an object URL. Disabled while the
page is loading or the filtered set is empty. Columns: `id, timestamp, type,
payload` (`payload` is JSON-stringified). Each field is escaped:

- Values starting with `=`, `+`, `-`, `@`, a tab, or a carriage return are
  prefixed with `'` to defuse spreadsheet formula injection.
- Values containing a comma, double quote, or newline are wrapped in double
  quotes, with embedded quotes doubled.

The file is written with a UTF-8 byte-order mark so Excel opens it with the
correct character set. Source: `events/page.tsx` (`eventsToCsv`,
`escapeCsvField`, `downloadEventsCsv`).

## Changelog

| Method & path | Type | Request body | Response shape | Source |
| --- | --- | --- | --- | --- |
| `GET /api/v1/changelog` | Read | — | `{ entries: Entry[] }` | `changelog/page.tsx` |

```ts
type Entry = { version: string; date: string; notes: string[] };
```

## OpenAPI

| Method & path | Type | Notes | Source |
| --- | --- | --- | --- |
| `GET /api/v1/openapi.json` | Read | Linked from the Docs page as the machine-readable spec | `docs/page.tsx` |

---

_Accuracy note: every request/response shape above was transcribed from the
TypeScript type passed to `apiGet`/`apiPost`/`apiPatch`/`useApi` (or the raw
`fetch` body) at the cited source file. If a page's inline type changes, update the
corresponding row here._
