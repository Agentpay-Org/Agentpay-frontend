// Validates and normalizes the NEXT_PUBLIC_AGENTPAY_API_BASE env var so
// downstream code can safely concatenate a path onto the result.
//
// Behaviour:
//   - Trims surrounding whitespace.
//   - Falls back to http://localhost:3001 when unset.
//   - Strips trailing slashes from the resulting origin/path string.
//   - Requires the value to parse as a URL; throws on malformed input.
//   - In production, requires https unless the host is localhost / 127.0.0.1.
//   - In development, logs a console warning instead of throwing for the same
//     case so contributors can run the app against a local backend.

export const DEFAULT_API_BASE = "http://localhost:3001";
export const NEXT_PUBLIC_AGENTPAY_API_BASE_ENV =
  "NEXT_PUBLIC_AGENTPAY_API_BASE";

export type ResolveApiBaseOptions = {
  /**
   * Override the env var lookup. Useful for tests.
   */
  env?: NodeJS.ProcessEnv;
  /**
   * Override the current NODE_ENV check. Useful for tests.
   */
  isProduction?: boolean;
  /**
   * Inject a logger so tests can assert on warnings without polluting
   * stderr. Defaults to `console.warn` when omitted.
   */
  warn?: (message: string) => void;
};

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

export function resolveApiBase(opts: ResolveApiBaseOptions = {}): string {
  const env = opts.env ?? process.env;
  const warn = opts.warn ?? ((msg) => console.warn(msg));
  const isProduction =
    opts.isProduction ?? env.NODE_ENV === "production";

  const raw = env[NEXT_PUBLIC_AGENTPAY_API_BASE_ENV]?.trim();
  const candidate = raw && raw.length > 0 ? raw : DEFAULT_API_BASE;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_AGENTPAY_API_BASE: ${JSON.stringify(candidate)}. ` +
        "Expected an absolute URL such as https://api.example.com or http://localhost:3001."
    );
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(
      `Unsupported protocol ${JSON.stringify(url.protocol)} in ` +
        "NEXT_PUBLIC_AGENTPAY_API_BASE. Use https (or http for localhost)."
    );
  }

  if (isProduction && url.protocol === "http:" && !isLocalHost(url.hostname)) {
    throw new Error(
      "Refusing to use a non-https NEXT_PUBLIC_AGENTPAY_API_BASE in production. " +
        "Set https://... (localhost / 127.0.0.1 are still allowed)."
    );
  }

  if (url.protocol === "http:" && !isLocalHost(url.hostname)) {
    warn(
      "NEXT_PUBLIC_AGENTPAY_API_BASE uses http on a non-localhost host. " +
        "Use https in production to keep credentials and traffic private."
    );
  }

  // Normalise to "origin + pathname-without-trailing-slash". We preserve any
  // configured base path (e.g. https://api.example.com/v1) so call sites can
  // continue to do `${API_BASE}/api/v1/...`.
  const origin = url.origin;
  const path = url.pathname.replace(/\/+$/, "");
  return path && path !== "/" ? `${origin}${path}` : origin;
}
