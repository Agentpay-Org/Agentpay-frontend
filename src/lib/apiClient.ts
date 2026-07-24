// Lightweight wrapper around fetch() for the AgentPay backend API.
// Centralises base URL resolution and error handling so call sites stay
// small.

import { resolveApiBase } from "./resolveApiBase";

// Resolved at module load time so any misconfiguration surfaces during boot
// rather than at the first fetch.
const API_BASE = resolveApiBase();
const DEFAULT_API_TIMEOUT_MS = 10_000;

export const RATE_LIMIT_WARNING_THRESHOLD = 10;

export type ApiError = {
  error: string;
  message: string;
  requestId?: string;
};

export type RateLimitInfo = {
  remaining: number | null;
  limit: number | null;
  resetAt: number | null;
  retryAfterMs: number | null;
};

export type ApiResult<T> = {
  data: T;
  rateLimit: RateLimitInfo;
};

export type ApiFetchInit = RequestInit & {
  /** Request timeout in milliseconds. Pass 0 or a negative value to disable. */
  timeoutMs?: number;
};

export class ApiTimeoutError extends Error {
  timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`request timed out after ${timeoutMs}ms`);
    this.name = "ApiTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export class ApiRateLimitedError extends Error {
  retryAfterMs: number;

  constructor(retryAfterMs: number) {
    const seconds = Math.ceil(retryAfterMs / 1000);
    super(`Rate limited. Retry after ${seconds}s`);
    this.name = "ApiRateLimitedError";
    this.retryAfterMs = retryAfterMs;
  }
}

function shouldUseTimeout(timeoutMs: number) {
  return Number.isFinite(timeoutMs) && timeoutMs > 0;
}

async function readJson(res: Response): Promise<unknown> {
  const parsed = await res.json();
  return parsed === null ? undefined : parsed;
}

function parseRateLimit(headers: Headers | undefined): RateLimitInfo {
  const rawRemaining = headers?.get("X-RateLimit-Remaining");
  const rawLimit = headers?.get("X-RateLimit-Limit");
  const rawReset = headers?.get("X-RateLimit-Reset");
  const rawRetryAfter = headers?.get("Retry-After");

  const remaining = rawRemaining != null ? Number(rawRemaining) : null;
  const limit = rawLimit != null ? Number(rawLimit) : null;
  const resetAt = rawReset != null ? Number(rawReset) : null;
  const retryAfterMs =
    rawRetryAfter != null ? Number(rawRetryAfter) * 1000 : null;

  return { remaining, limit, resetAt, retryAfterMs };
}

function warnLowQuota(rateLimit: RateLimitInfo): void {
  if (
    rateLimit.remaining !== null &&
    rateLimit.remaining > 0 &&
    rateLimit.remaining <= RATE_LIMIT_WARNING_THRESHOLD
  ) {
    console.warn(
      `API rate-limit near exhaustion: ${rateLimit.remaining} calls remaining`,
    );
  }
}

function createHttpError(status: number, body: unknown, statusText = "") {
  const apiError =
    body && typeof body === "object" ? (body as Partial<ApiError>) : undefined;

  const message =
    typeof apiError?.message === "string" && apiError.message.length > 0
      ? apiError.message
      : statusText.trim().length > 0
        ? statusText
        : "Request failed";

  const err = new Error(message);

  return Object.assign(err, apiError ?? {}, {
    error:
      typeof apiError?.error === "string" && apiError.error.length > 0
        ? apiError.error
        : "http_error",
  });
}

const pendingGets = new Map<string, Promise<unknown>>();

function resolveUrl(path: string): string {
  return `${API_BASE}${path}`;
}

/**
 * Fetch JSON from the AgentPay API.
 *
 * `timeoutMs` defaults to 10 seconds. A caller-provided `signal` is composed
 * with the internal timeout signal, so whichever aborts first wins. Timers and
 * caller abort listeners are always cleared after the request settles.
 *
 * The returned `ApiResult` includes the response body as `data` and
 * rate-limit header values as `rateLimit`. If the backend returns HTTP 429
 * the call throws `ApiRateLimitedError` instead of a generic error.
 */
export async function apiFetch<T>(
  path: string,
  init: ApiFetchInit = {},
): Promise<ApiResult<T>> {
  const { timeoutMs, signal: callerSignal, headers, ...restInit } = init;
  const effectiveTimeoutMs = timeoutMs ?? DEFAULT_API_TIMEOUT_MS;
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let timeoutError: ApiTimeoutError | undefined;

  const abortFromCaller = () => {
    controller.abort(callerSignal!.reason);
  };

  if (callerSignal?.aborted) {
    abortFromCaller();
  } else {
    callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  if (shouldUseTimeout(effectiveTimeoutMs) && !controller.signal.aborted) {
    timeoutId = setTimeout(() => {
      timeoutError = new ApiTimeoutError(effectiveTimeoutMs);
      controller.abort(timeoutError);
    }, effectiveTimeoutMs);
  }

  function finish() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    if (callerSignal != null) {
      callerSignal.removeEventListener("abort", abortFromCaller);
    }
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...restInit,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(headers ?? {}),
      },
    });

    const rateLimit = parseRateLimit(res.headers);

    if (res.status === 429) {
      finish();
      const retryAfter = rateLimit.retryAfterMs ?? 0;
      if (retryAfter > 0) {
        warnLowQuota(rateLimit);
      }
      throw new ApiRateLimitedError(retryAfter);
    }

    warnLowQuota(rateLimit);

    if (res.status === 204) {
      finish();
      return { data: undefined as T, rateLimit };
    }

    let body: T | ApiError | undefined;
    try {
      body = (await readJson(res)) as T | ApiError | undefined;
    } catch {
      if (!res.ok) {
        finish();
        throw createHttpError(res.status, undefined, res.statusText);
      }
      finish();
      throw new Error("Response body was not valid JSON");
    }
    if (!res.ok) {
      finish();
      throw createHttpError(res.status, body, res.statusText);
    }
    finish();
    return { data: body as T, rateLimit };
  } catch (error) {
    finish();
    if (timeoutError !== undefined) {
      throw timeoutError;
    }
    throw error;
  }
}

export function apiGet<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const url = resolveUrl(path);
  const existing = pendingGets.get(url);
  if (existing) {
    return existing as Promise<T>;
  }
  const { signal: callerSignal, ...sharedInit } = init;
  void callerSignal;
  const promise = apiFetch<T>(path, sharedInit).finally(() => {
    if (pendingGets.get(url) === promise) {
      pendingGets.delete(url);
    }
  });
  pendingGets.set(url, promise);
  return promise;
}

export function apiPost<T>(
  path: string,
  body: unknown,
  init: ApiFetchInit = {},
) {
  return apiFetch<T>(path, { ...init, method: "POST", body: JSON.stringify(body) }).then((r) => r.data);
}
export const apiPatch = <T>(
  path: string,
  body: unknown,
  init: ApiFetchInit = {},
) =>
  apiFetch<T>(path, { ...init, method: "PATCH", body: JSON.stringify(body) }).then((r) => r.data);
export const apiDelete = (path: string, init: ApiFetchInit = {}) =>
  apiFetch<void>(path, { ...init, method: "DELETE" }).then((r) => r.data);
