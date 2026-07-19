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

/** Character used to mark the removed middle section of a truncated id. */
export const TRUNCATE_ELLIPSIS = "…";

/** Default number of leading characters kept by {@link truncateMiddle}. */
export const TRUNCATE_HEAD_DEFAULT = 8;

/** Default number of trailing characters kept by {@link truncateMiddle}. */
export const TRUNCATE_TAIL_DEFAULT = 6;

/**
 * Truncate a long identifier by collapsing its middle into an ellipsis while
 * preserving both ends, e.g. `GABCDEFG…XYZ123`. Agent and service ids only
 * differ at the edges, so keeping the tail visible is what makes two truncated
 * ids distinguishable — unlike CSS `text-overflow: ellipsis`, which hides it.
 *
 * The input is returned unchanged when it already fits the budget
 * (`head + tail + 1` characters, the `1` being the ellipsis itself), so short
 * ids never gain a marker. Counting is code-point aware so surrogate pairs are
 * never split in half. Negative or fractional `head` / `tail` values are
 * clamped to non-negative integers.
 *
 * Callers rendering the truncated form should expose the full value through
 * `title` and an accessible label (e.g. `aria-label`) so hover and assistive
 * technology both see the complete identifier.
 *
 * @param value - The identifier to truncate.
 * @param head - Leading characters to keep. Defaults to {@link TRUNCATE_HEAD_DEFAULT}.
 * @param tail - Trailing characters to keep. Defaults to {@link TRUNCATE_TAIL_DEFAULT}.
 * @returns The original string, or `head` chars + `…` + `tail` chars.
 */
export function truncateMiddle(
  value: string,
  head: number = TRUNCATE_HEAD_DEFAULT,
  tail: number = TRUNCATE_TAIL_DEFAULT
): string {
  const safeHead = Number.isFinite(head) ? Math.max(0, Math.floor(head)) : TRUNCATE_HEAD_DEFAULT;
  const safeTail = Number.isFinite(tail) ? Math.max(0, Math.floor(tail)) : TRUNCATE_TAIL_DEFAULT;

  // Split into code points so astral characters (emoji, some CJK) are kept
  // whole instead of being cut between surrogate halves.
  const chars = Array.from(value);
  const budget = safeHead + safeTail + TRUNCATE_ELLIPSIS.length;
  if (chars.length <= budget) return value;

  const headPart = chars.slice(0, safeHead).join("");
  const tailPart = safeTail > 0 ? chars.slice(-safeTail).join("") : "";
  return `${headPart}${TRUNCATE_ELLIPSIS}${tailPart}`;
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
