# fix(security): add rel=noopener and scheme validation for external links

## Summary

Hardens all external and data-derived links against **reverse-tabnabbing** (`target="_blank"` without `rel="noopener noreferrer"`) and **unsafe scheme injection** (`javascript:`, `data:`, etc.) in backend-supplied URLs.

## Changes

### New files

- **`src/lib/url.ts`** — `safeHref()` helper that accepts `http:`, `https:`, relative (`/`), and hash (`#`) links; rejects `javascript:`, `data:`, `mailto:`, `tel:`, `ftp:`, protocol-relative (`//`), and any malformed/bogus inputs. Returns `{ ok: true, href }` for safe values and `{ ok: false }` for blocked ones.

- **`src/lib/__tests__/url.test.ts`** — 23 test cases covering:
  - 7 safe patterns (https, http, uppercase scheme, relative paths with/without whitespace, hash links)
  - 16 unsafe patterns (null, undefined, empty, javascript:, data: with whitespace tricks, protocol-relative, mailto:, tel:, ftp:, chrome:, no-scheme, relative-without-slash, malformed, colon-first, space-in-scheme)

### Modified files

- **`src/app/webhooks/page.tsx`** — Backend-supplied webhook URLs are validated through `safeHref()` before rendering as `<a href>`. If validation fails, the URL falls back to plain text instead of becoming a clickable link.

- **`src/app/docs/page.tsx`** — Both the relative OpenAPI link and the external GitHub reference link are validated through `safeHref()` with plain-text fallback on failure.

- **`README.md`** — Added "Link safety convention" section documenting the two rules:
  1. Every `target="_blank"` link must include `rel="noopener noreferrer"`
  2. Every data-derived `href` must be validated with `safeHref()`

### Audit (no changes needed — already compliant)

All `<a target="_blank">` links across the codebase were audited and **already** carried `rel="noopener noreferrer"`:

| File | Link | Status |
|---|---|---|
| `src/app/page.tsx:63` | `https://stellar.org` | ✅ `rel="noopener noreferrer"` |
| `src/components/Footer.tsx:27` | `https://discord.gg/eXvRKkgcv` | ✅ `rel="noopener noreferrer"` |
| `src/app/docs/page.tsx:36` | GitHub reference doc | ✅ `rel="noopener noreferrer"` |
| `src/app/webhooks/page.tsx:118` | Webhook URL (validated) | ✅ `rel="noopener noreferrer"` |

Both `src/app/page.tsx` and `src/components/Footer.tsx` were already compliant and required no changes.

## Security notes

- **Tabnabbing prevention:** Any page opened with `target="_blank"` without `rel="noopener noreferrer"` can redirect the original page via `window.opener.location`. All external links now carry the full `rel` attribute to prevent this.
- **Scheme injection:** `javascript:` and `data:` URIs in `href` attributes can execute arbitrary code in the context of the page. The `safeHref()` helper strips these before they reach the DOM.
- **Safe by default:** The helper rejects unknown schemes and malformed URLs, forcing developers to explicitly allow only known-safe patterns.
