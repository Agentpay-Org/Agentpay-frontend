import { DEFAULT_API_BASE } from "@/lib/resolveApiBase";

export type ApiSection = {
  h: string;
  p: string;
  curl: string;
};

/**
 * Characters allowed in a base URL that gets interpolated into a copyable
 * shell command. Everything a normalised http(s) origin + path can legitimately
 * contain: alphanumerics, `-._~` (RFC 3986 unreserved), `%` (percent-encoding),
 * `:` (scheme/port), and `/`. Notably absent: whitespace, quotes, `$`,
 * backtick, backslash, `;`, `&`, `|`, `<`, `>`, `(`, `)`, `{`, `}`, `*`, `?`,
 * `!`, `#`, `@` — anything a shell could interpret, even inside double quotes.
 */
const SHELL_SAFE_BASE_URL = /^[A-Za-z0-9\-._~%:/]+$/;

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/**
 * Validate a base URL destined for interpolation into the docs page's curl
 * examples, applying the same rules as `resolveApiBase`:
 *
 *   - trims surrounding whitespace and falls back to `DEFAULT_API_BASE` when
 *     empty;
 *   - must parse as an absolute http(s) URL;
 *   - http is only accepted for localhost hosts when `isProduction` is true;
 *   - normalises to origin + pathname without trailing slashes (dropping any
 *     credentials, query, or fragment).
 *
 * On top of that, the normalised value is rejected outright if it contains any
 * character a shell could interpret (see `SHELL_SAFE_BASE_URL`). `resolveApiBase`
 * throws on bad input, but the docs page only renders example commands, so this
 * function degrades to the safe `DEFAULT_API_BASE` instead of taking the page
 * down — a misconfigured `NEXT_PUBLIC_AGENTPAY_API_BASE` must never produce a
 * copyable command that executes anything.
 */
export function sanitizeBaseUrl(
  baseUrl: string,
  isProduction: boolean = process.env.NODE_ENV === "production"
): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) return DEFAULT_API_BASE;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return DEFAULT_API_BASE;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return DEFAULT_API_BASE;
  }

  if (isProduction && url.protocol === "http:" && !isLocalHost(url.hostname)) {
    return DEFAULT_API_BASE;
  }

  // Rebuild from origin + pathname so credentials, query strings, and
  // fragments never reach the command string, mirroring resolveApiBase's
  // "origin + pathname-without-trailing-slash" normalisation.
  const path = url.pathname.replace(/\/+$/, "");
  const normalised = path && path !== "/" ? `${url.origin}${path}` : url.origin;

  if (!SHELL_SAFE_BASE_URL.test(normalised)) {
    return DEFAULT_API_BASE;
  }

  return normalised;
}

export const getSections = (baseUrl: string): ApiSection[] => {
  // The base URL originates from NEXT_PUBLIC_AGENTPAY_API_BASE. Sanitize it
  // before interpolation and keep it double-quoted in every generated command;
  // SHELL_SAFE_BASE_URL guarantees the quoted string contains nothing the
  // shell expands (`$`, backtick, `\`, `"`).
  const safeBase = sanitizeBaseUrl(baseUrl);
  return [
    {
      h: "POST /api/v1/usage",
      p: "Record incremental usage for an (agent, serviceId) pair. Body: { agent, serviceId, requests }.",
      curl: `curl -X POST "${safeBase}/api/v1/usage" \
  -H "Content-Type: application/json" \
  -d '{"agent":"agent-id","serviceId":"service-id","requests":1}'`,
    },
    {
      h: "GET /api/v1/usage/:agent/:serviceId",
      p: "Read the accumulated request total. Returns { agent, serviceId, total }.",
      curl: `curl "${safeBase}/api/v1/usage/agent-id/service-id"`,
    },
    {
      h: "POST /api/v1/settle",
      p: "Drain the accumulator and return { requests, priceStroops, billedStroops }.",
      curl: `curl -X POST "${safeBase}/api/v1/settle" \
  -H "Content-Type: application/json" \
  -d '{"agent":"agent-id"}'`,
    },
    {
      h: "POST /api/v1/services",
      p: "Register a service with priceStroops/request. Idempotent.",
      curl: `curl -X POST "${safeBase}/api/v1/services" \
  -H "Content-Type: application/json" \
  -d '{"name":"my-service","priceStroops":100}'`,
    },
    {
      h: "POST /api/v1/admin/{pause,unpause}",
      p: "Toggle the global pause flag; GET /admin/status to read.",
      curl: `curl -X POST "${safeBase}/api/v1/admin/pause"`,
    },
  ];
};
