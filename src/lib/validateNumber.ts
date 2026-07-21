/**
 * Shared numeric parsing helpers for form inputs.
 *
 * These helpers intentionally follow the same semantics as existing page logic:
 * - parse by coercing the input string with `Number(...)`
 * - require an integer via `Number.isInteger`
 *
 * Rules:
 * - `parseNonNegativeInt`: accepts integers >= 0
 * - `parsePositiveInt`: accepts integers >= 1
 */

export type ParseResult =
  | { ok: true; value: number }
  | { ok: false; message: string };

const DEFAULT_NON_NEGATIVE_MESSAGE = "Price must be a non-negative integer.";
const DEFAULT_POSITIVE_MESSAGE = "requests must be a positive integer";

/**
 * Parses a string as a non-negative integer.
 *
 * Accepted examples: "0", "1", "42", "001"
 * Rejected examples: "", "-1", "-0", "1.5", "1e2" (non-integer), "-0.1"
 */
export function parseNonNegativeInt(input: string): ParseResult {
  if (input.trim() === "") {
    return { ok: false, message: DEFAULT_NON_NEGATIVE_MESSAGE };
  }
  const n = Number(input);
  if (!Number.isInteger(n) || n < 0 || Object.is(n, -0)) {
    return { ok: false, message: DEFAULT_NON_NEGATIVE_MESSAGE };
  }
  return { ok: true, value: n };
}

/**
 * Parses a string as a positive integer (>= 1).
 *
 * Accepted examples: "1", "42", "001"
 * Rejected examples: "", "0", "-1", "1.5", "-0.1"
 */
export function parsePositiveInt(input: string): ParseResult {
  if (input.trim() === "") {
    return { ok: false, message: DEFAULT_POSITIVE_MESSAGE };
  }
  const n = Number(input);
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, message: DEFAULT_POSITIVE_MESSAGE };
  }
  return { ok: true, value: n };
}

