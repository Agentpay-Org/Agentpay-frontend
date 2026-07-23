/**
 * Shared numeric parsing helpers for form inputs.
 *
 * These helpers intentionally follow the same semantics as existing page logic:
 * - parse by coercing the input string with `Number(...)`
 * - require an integer via `Number.isInteger`
 *
 * Rules:
 * - `parseNonNegativeInt`: accepts integers >= 0 and <= `MAX_SAFE_INTEGER_VAL`
 * - `parsePositiveInt`: accepts integers >= 1 and <= `MAX_SAFE_INTEGER_VAL`
 *
 * Both reject exponent notation (e.g. `"1e2"`) and whitespace-padded input.
 */

export type ParseResult =
  | { ok: true; value: number }
  | { ok: false; message: string };

/** Maximum safe integer accepted by these parsers. */
export const MAX_SAFE_INTEGER_VAL = Number.MAX_SAFE_INTEGER;

const DEFAULT_NON_NEGATIVE_MESSAGE =
  "Price must be a non-negative integer between 0 and 9,007,199,254,740,991.";
const DEFAULT_POSITIVE_MESSAGE =
  "requests must be a positive integer between 1 and 9,007,199,254,740,991";

/**
 * Parses a string as a non-negative integer.
 *
 * Accepted examples: "0", "1", "42", "001"
 * Rejected examples: "", "-1", "-0", "1.5", "1e2" (exponent), " 100 " (whitespace),
 *                   "9007199254740992" (exceeds MAX_SAFE_INTEGER)
 */
export function parseNonNegativeInt(input: string): ParseResult {
  if (input.trim() === "") {
    return { ok: false, message: DEFAULT_NON_NEGATIVE_MESSAGE };
  }
  if (input !== input.trim()) {
    return { ok: false, message: DEFAULT_NON_NEGATIVE_MESSAGE };
  }
  if (/[eE]/.test(input)) {
    return { ok: false, message: DEFAULT_NON_NEGATIVE_MESSAGE };
  }
  const n = Number(input);
  if (
    !Number.isInteger(n) ||
    n < 0 ||
    Object.is(n, -0) ||
    n > MAX_SAFE_INTEGER_VAL
  ) {
    return { ok: false, message: DEFAULT_NON_NEGATIVE_MESSAGE };
  }
  return { ok: true, value: n };
}

/**
 * Parses a string as a positive integer (>= 1).
 *
 * Accepted examples: "1", "42", "001"
 * Rejected examples: "", "0", "-1", "1.5", "1e2" (exponent), " 42 " (whitespace),
 *                   "9007199254740992" (exceeds MAX_SAFE_INTEGER)
 */
export function parsePositiveInt(input: string): ParseResult {
  if (input.trim() === "") {
    return { ok: false, message: DEFAULT_POSITIVE_MESSAGE };
  }
  if (input !== input.trim()) {
    return { ok: false, message: DEFAULT_POSITIVE_MESSAGE };
  }
  if (/[eE]/.test(input)) {
    return { ok: false, message: DEFAULT_POSITIVE_MESSAGE };
  }
  const n = Number(input);
  if (!Number.isInteger(n) || n <= 0 || n > MAX_SAFE_INTEGER_VAL) {
    return { ok: false, message: DEFAULT_POSITIVE_MESSAGE };
  }
  return { ok: true, value: n };
}

