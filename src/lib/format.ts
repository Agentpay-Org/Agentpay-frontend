const STROOPS_PER_XLM = 10_000_000;
const DEFAULT_LOCALE = "en-US";

const formattersCache = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}-${JSON.stringify(options)}`;
  let formatter = formattersCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    formattersCache.set(key, formatter);
  }
  return formatter;
}

export interface FormatStroopsOptions {
  /** If true, format as raw stroops instead of converting to XLM (e.g. "123,456,789 stroops") */
  forceRaw?: boolean;
  /** The locale to use for formatting. Defaults to "en-US" */
  locale?: string;
}

/**
 * Format a stroops amount using Stellar's 1 XLM = 10,000,000 stroops ratio.
 * Zero remains `0 XLM`. Non-zero sub-cent values stay in grouped raw stroops
 * so tiny balances are not hidden as `0.00 XLM`.
 *
 * @param stroops - The amount in stroops to format.
 * @param optionsOrForceRaw - Optional configuration object or boolean toggle to force raw stroops formatting.
 * @returns A locale-formatted string representation.
 */
export function formatStroops(
  stroops: number,
  optionsOrForceRaw?: FormatStroopsOptions | boolean
): string {
  const forceRaw = typeof optionsOrForceRaw === "boolean"
    ? optionsOrForceRaw
    : optionsOrForceRaw?.forceRaw;
  let locale = DEFAULT_LOCALE;
  if (optionsOrForceRaw && typeof optionsOrForceRaw === "object" && optionsOrForceRaw.locale) {
    locale = optionsOrForceRaw.locale;
  }

  const xlm = stroops / STROOPS_PER_XLM;
  
  // Keep the 0 XLM zero case
  if (xlm === 0) return "0 XLM";

  // Check if we force raw stroops or if we are below the sub-cent threshold (< 0.01 XLM in absolute terms)
  if (forceRaw || Math.abs(xlm) < 0.01) {
    const unit = Math.abs(stroops) === 1 ? "stroop" : "stroops";
    const formatter = getFormatter(locale, { maximumFractionDigits: 0 });
    return `${formatter.format(stroops)} ${unit}`;
  }

  // Otherwise, format as XLM with 2 to 7 decimal places
  const formatter = getFormatter(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  });
  return `${formatter.format(xlm)} XLM`;
}

/**
 * Format a numeric request count with thousands separators.
 *
 * @param n - The number of requests.
 * @param optionsOrLocale - Optional configuration object or string locale.
 * @returns A locale-formatted integer string.
 */
export function formatRequests(
  n: number,
  optionsOrLocale?: { locale?: string } | string
): string {
  const locale = typeof optionsOrLocale === "string"
    ? optionsOrLocale
    : optionsOrLocale?.locale || DEFAULT_LOCALE;
  const formatter = getFormatter(locale, { maximumFractionDigits: 0 });
  return formatter.format(n);
}

/** Format an absolute timestamp into a short HH:MM:SS string. */
export function formatTime(ms: number): string {
  const d = new Date(ms);
  return d.toISOString().slice(11, 19);
}

/**
 * Maximum number of characters any single serialised payload is allowed to
 * occupy in the event log before the renderer truncates it with a marker.
 *
 * Lower so a single event never dominates the page (DOM cost + scroll). Keep
 * the value stable so callers / tests can rely on it.
 */
export const EVENT_PAYLOAD_MAX_CHARS = 5000;

/** Marker appended to truncated payloads so readers can spot the cut-off. */
export const EVENT_PAYLOAD_TRUNCATED_MARKER = "\n…(truncated)";

/**
 * Maximum number of top-level rows rendered in a single pass on any list page.
 *
 * This acts as a client-side defence-in-depth cap: if the backend ignores the
 * page/limit parameters and sends back a huge payload, the browser will only
 * ever create this many DOM nodes per list.  It is **not** a substitute for
 * server-side pagination — the backend should still enforce its own limit so
 * the response size stays reasonable over the wire.
 *
 * Chosen above the expected values for every list in the app:
 *   - events page:     backend limit = 100
 *   - search page:     backend limit =  50
 *   - top-agents page: backend limit =  25 per page
 *
 * Set to 100 so it covers the largest expected page without firing
 * a false-positive truncation note in normal operation.
 */
export const MAX_RENDERED_ROWS = 100;

/**
 * Safely serialise an arbitrary value to JSON, defending against:
 *   - circular references (replaced with `[Circular]`)
 *   - values JSON can't represent natively, e.g. `BigInt` (replaced with a
 *     stringified marker)
 * Then truncate the result to at most `maxChars` characters and append a
 * visible marker so the operator can see the cut-off.
 *
 * The function never throws so it can be used inside render code without
 * needing an error boundary.
 */
export function safeStringify(
  value: unknown,
  maxChars: number = EVENT_PAYLOAD_MAX_CHARS
): string {
  // Top-level `undefined` / functions / symbols: `JSON.stringify` returns
  // `undefined` and never invokes the replacer consistently. Surface them
  // as a sentinel so callers always get a renderable string.
  if (
    value === undefined ||
    typeof value === "function" ||
    typeof value === "symbol"
  ) {
    return `[${typeof value}]`;
  }
  const seen = new WeakSet<object>();
  let serialised = "";
  try {
    serialised = JSON.stringify(
      value,
      (_key, v) => {
        if (typeof v === "bigint") return `[BigInt:${v.toString()}]`;
        if (typeof v === "function") return "[Function]";
        if (typeof v === "symbol") return "[Symbol]";
        if (typeof v === "undefined") return "[undefined]";
        if (v !== null && typeof v === "object") {
          if (seen.has(v)) return "[Circular]";
          seen.add(v);
        }
        return v;
      },
      2
    );
  } catch {
    // Defensive: JSON.stringify should be total after the replacer above,
    // but we still refuse to throw inside render code.
    return "[unserialisable]";
  }
  if (serialised.length <= maxChars) return serialised;
  return (
    serialised.slice(0, Math.max(0, maxChars)) + EVENT_PAYLOAD_TRUNCATED_MARKER
  );
}

type TimestampInput = number | string | null | undefined;

/**
 * Format a timestamp that may be malformed into a safe ISO string. Non-finite
 * numbers, nullish arguments, and unparseable values fall back to the
 * placeholder so the page never throws `Invalid time value`.
 */
export function safeFormatTimestamp(
  value: TimestampInput,
  fallback: string = "\u2014"
): string {
  if (value === null || value === undefined) return fallback;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toISOString();
}
