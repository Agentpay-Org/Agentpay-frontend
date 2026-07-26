# Theming architecture (anti-FOUC + dark-mode tokens)

This document explains how theme selection flows through the app **without breaking the anti-FOUC contract**.

## Single source of truth: theme storage key

The user’s theme preference is persisted in `localStorage` under:

- **Storage key:** `THEME_STORAGE_KEY`
- **Value:** `"agentpay.theme"`

Defined in:
- `src/lib/theme.ts`

The same key is embedded into the pre-paint inline script in:
- `src/app/layout.tsx`

### Why this matters

The pre-paint script runs **before the first CSS paint**. If a contributor changes the key in only one place, the script would read the wrong value and the page could flash the wrong theme.

**Rule:** any storage-key change must update `src/lib/theme.ts` (and the layout script embeds it automatically).

## Theme model: `light | dark | system`

`src/lib/theme.ts` defines:

- `"light"`: force light mode
- `"dark"`: force dark mode
- `"system"`: follow OS preference

Helpers:

- `readTheme()` reads the stored value from `localStorage` and validates it.
  - If storage is unavailable or the stored value is invalid, it falls back to `"system"`.
- `effectiveTheme(theme)` converts the `Theme` model into an effective palette.
  - `"system"` becomes `"dark"` or `"light"` using `window.matchMedia("(prefers-color-scheme: dark)")`.

## Anti-FOUC: pre-paint inline script + `suppressHydrationWarning`

### The pre-paint script role

In `src/app/layout.tsx`, the app injects a blocking inline script into `<head>`:

- It is stored in `prePaintScript`.
- It is injected via `<script dangerouslySetInnerHTML={{ __html: prePaintScript }} />`.

Responsibilities (all synchronous):

1. Read `localStorage.getItem("${THEME_STORAGE_KEY}")`.
2. Compute whether to enable dark mode:
   - If stored value is `"dark"`, enable dark.
   - If stored value is `"light"`, disable dark.
   - If stored value is missing, `"system"`, or corrupt, fall back to `window.matchMedia("(prefers-color-scheme: dark)")`.
3. Mutate the DOM immediately:
   - `document.documentElement.classList.toggle("dark", d)`
   - `document.documentElement.classList.toggle("light", !d)`

This is intentionally done **before React hydrates**, so the first paint uses the correct theme.

### `suppressHydrationWarning` contract

`src/app/layout.tsx` sets:

- `<html lang="en" suppressHydrationWarning>`

Because the server and client can disagree on the initial `class` list (the client may already have applied `dark`/`light` via the pre-paint script), this prop suppresses the hydration mismatch warning on the root element only.

**Rule:** do not broaden `suppressHydrationWarning` to child components; the anti-FOUC approach only expects mutation on `<html>`.

## Theme toggle UI behavior

`src/components/ThemeToggle.tsx`:

- Keeps UI state in `useState<Theme>("system")`.
- On mount, it calls `readTheme()` and updates component state.
- It also ensures `<html>` reflects the effective palette via:
  - `document.documentElement.classList.toggle("dark", effectiveTheme(t) === "dark")`

When a user selects a new theme:

1. Component state is updated.
2. `writeTheme(next)` persists the preference to `localStorage`.
3. `<html>` classes are updated immediately using `effectiveTheme(next)`.

## CSS token structure in `src/app/globals.css`

The theme implementation is driven by CSS custom properties.

### Base tokens (light defaults)

In `:root`:

- `--background: #ffffff;`
- `--foreground: #171717;`

### Inline theme (Tailwind-compatible)

`@theme inline` maps the custom properties to internal color tokens:

- `--color-background: var(--background);`
- `--color-foreground: var(--foreground);`
- `--font-sans: var(--font-geist-sans);`
- `--font-mono: var(--font-geist-mono);`

### No-JS OS fallback

If the pre-paint script does not run (e.g. JavaScript disabled), this media query provides dark tokens:

- `@media (prefers-color-scheme: dark) { :root { ... } }`

### Class-based overrides (authoritative when JS runs)

When the pre-paint script or the toggle updates `<html>`, these selectors apply:

- `html.dark { --background: #0a0a0a; --foreground: #ededed; }`
- `html.light { --background: #ffffff; --foreground: #171717; }`

The class-based selectors take precedence over the media query.

## Reduced-motion handling

Theme changes animate only when motion is allowed.

In `src/app/globals.css`:

- Theme transitions are enabled under:
  - `@media (prefers-reduced-motion: no-preference) { html { transition: background-color 0.2s ease, color 0.2s ease; } }`

For users who prefer reduced motion (`prefers-reduced-motion: reduce`), transitions are not applied, avoiding unexpected animation.

## Adding a new themeable token safely

To add a new color/style token without breaking either mode:

1. **Add the token at the base level** under `:root` (light default).
   - Example structure mirrors `--background`/`--foreground`.
2. **Add the dark value** inside `html.dark`.
3. **Add the light value** inside `html.light` (keeps intent explicit and consistent).
4. **Map the token into the theme inline block** if it should be consumable as a `--color-*` variable:
   - Update `@theme inline` accordingly.
5. **Update the no-JS fallback** for dark mode:
   - Add the dark value to `@media (prefers-color-scheme: dark) { :root { ... } }`

### Do NOT break the anti-FOUC contract

- Do not change the storage key string without changing `THEME_STORAGE_KEY` in `src/lib/theme.ts`.
- Keep the anti-FOUC mechanism class-based (`html.dark`/`html.light`) so the pre-paint script can apply it instantly.
- Ensure any new token is available via CSS variables on first paint (i.e., declared in CSS, not computed in JS).

## Implementation consistency note

This document matches the current implementation:

- Storage key: `THEME_STORAGE_KEY = "agentpay.theme"` (`src/lib/theme.ts`)
- Pre-paint script reads the embedded `THEME_STORAGE_KEY` and toggles `html.dark`/`html.light` (`src/app/layout.tsx`).
- CSS overrides are implemented by `html.dark` / `html.light` plus an OS fallback media query (`src/app/globals.css`).
- Reduced motion is handled with `@media (prefers-reduced-motion: no-preference)` wrapping theme transitions.

## Font loading with next/font

Typography is powered by **Geist Sans** (body/sans) and **Geist Mono** (monospace), loaded through `next/font/google` in `src/app/layout.tsx`:

```ts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});
```

- **`subsets: ["latin"]`** — only the Latin glyph subset is downloaded, keeping the bundle small.
- **`display: "swap"`** — text is rendered in a fallback font immediately while the font file loads, preventing invisible-text (FOIT) and reducing layout shift.
- **`variable: "--font-*"`** — Next.js generates a CSS custom property pointing to the self-hosted `@font-face` declarations.

### Tailwind integration

The generated CSS variables are mapped to Tailwind's `--font-sans` and `--font-mono` tokens inside `@theme inline` in `src/app/globals.css`:

```css
@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

This allows any Tailwind utility (`font-sans`, `font-mono`) to resolve to the correct self-hosted font face. The `<body>` element receives the classes directly:

```tsx
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
```

### CSP compatibility

Because `next/font/google` downloads and self-hosts the font files at build time (served from `/_next/static/media/` under the `'self'` origin), **no external font origins are required** in the Content-Security-Policy. The existing CSP directive `font-src 'self' data:` in `src/lib/securityHeaders.ts` covers these fonts without modification.

