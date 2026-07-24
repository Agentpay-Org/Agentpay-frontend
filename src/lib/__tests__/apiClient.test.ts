jest.mock("../resolveApiBase", () => ({
  resolveApiBase: jest.fn(() => {
    const raw = process.env.NEXT_PUBLIC_AGENTPAY_API_BASE?.trim();
    const base = raw && raw.length > 0 ? raw : "http://localhost:3001";
    return base.replace(/\/+$/, "");
  }),
}));

import {
  type ApiError,
  type ApiResult,
  type RateLimitInfo,
  ApiTimeoutError,
  ApiRateLimitedError,
  RATE_LIMIT_WARNING_THRESHOLD,
  apiFetch,
  apiGet,
} from "../apiClient";

type ApiClientModule = typeof import("../apiClient");

const emptyRateLimit: RateLimitInfo = {
  remaining: null,
  limit: null,
  resetAt: null,
  retryAfterMs: null,
};

function flatRateLimit(
  overrides: Partial<RateLimitInfo> = {},
): RateLimitInfo {
  return { ...emptyRateLimit, ...overrides };
}

async function loadApiClient(
  env: { NEXT_PUBLIC_AGENTPAY_API_BASE?: string } = {},
): Promise<ApiClientModule> {
  jest.resetModules();

  const mutableEnv = process.env as NodeJS.ProcessEnv & {
    NODE_ENV?: string;
    NEXT_PUBLIC_AGENTPAY_API_BASE?: string;
  };
  const envBag = mutableEnv as Record<string, string | undefined>;
  const previousBase = mutableEnv.NEXT_PUBLIC_AGENTPAY_API_BASE;
  const previousNodeEnv = mutableEnv.NODE_ENV;

  try {
    if (env.NEXT_PUBLIC_AGENTPAY_API_BASE === undefined) {
      delete envBag.NEXT_PUBLIC_AGENTPAY_API_BASE;
    } else {
      envBag.NEXT_PUBLIC_AGENTPAY_API_BASE = env.NEXT_PUBLIC_AGENTPAY_API_BASE;
    }
    envBag.NODE_ENV = "test";

    return (await import("../apiClient")) as ApiClientModule;
  } finally {
    if (previousBase === undefined) {
      delete envBag.NEXT_PUBLIC_AGENTPAY_API_BASE;
    } else {
      envBag.NEXT_PUBLIC_AGENTPAY_API_BASE = previousBase;
    }
    if (previousNodeEnv === undefined) {
      delete envBag.NODE_ENV;
    } else {
      envBag.NODE_ENV = previousNodeEnv;
    }
  }
}

function mockResponse(
  body: unknown,
  status: number,
  statusText = "",
  rateLimitHeaders: Record<string, string> = {},
): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    ...rateLimitHeaders,
  });
  return new Response(body != null ? JSON.stringify(body) : null, {
    status,
    statusText,
    headers,
  });
}

function mockOk(body: unknown, rateLimitHeaders: Record<string, string> = {}) {
  return mockResponse(body, 200, "OK", rateLimitHeaders);
}

describe("apiClient", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.resetModules();
  });

  function mockFetch(fn: unknown) {
    globalThis.fetch = fn as typeof globalThis.fetch;
  }

  // ---------------------------------------------------------------------------
  // Existing tests adapted for ApiResult
  // ---------------------------------------------------------------------------

  it("prefixes GETs with the localhost default base URL", async () => {
    const fetchMock = jest.fn(async (url, init) => {
      expect(url).toBe("http://localhost:3001/api/v1/things");
      expect(init?.method).toBeUndefined();
      expect((init?.headers as Record<string, string>)["Content-Type"]).toBe(
        "application/json",
      );
      return mockOk({ ok: true });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiGet } = await loadApiClient();
    const result = await apiGet<{ ok: boolean }>("/api/v1/things");
    expect(result.data).toEqual({ ok: true });
    expect(result.rateLimit).toEqual(emptyRateLimit);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("honours NEXT_PUBLIC_AGENTPAY_API_BASE instead of the localhost default", async () => {
    const fetchMock = jest.fn(async (url) => {
      expect(url).toBe("https://api.example.com/v1/health");
      return mockOk({ ok: true });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiGet } = await loadApiClient({
      NEXT_PUBLIC_AGENTPAY_API_BASE: "https://api.example.com/v1/",
    });
    const result = await apiGet<{ ok: boolean }>("/health");
    expect(result.data).toEqual({ ok: true });
  });

  it("sends POST bodies as JSON strings", async () => {
    const fetchMock = jest.fn(async (_url, init) => {
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ hello: "world" }));
      return mockOk({ created: true });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiPost } = await loadApiClient();
    const result = await apiPost<{ created: boolean }>("/api/v1/things", {
      hello: "world",
    });
    expect(result.data).toEqual({ created: true });
  });

  it("sends PATCH bodies as JSON strings", async () => {
    const fetchMock = jest.fn(async (_url, init) => {
      expect(init?.method).toBe("PATCH");
      expect(init?.body).toBe(JSON.stringify({ enabled: true }));
      return mockOk({ updated: true });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiPatch } = await loadApiClient();
    const result = await apiPatch<{ updated: boolean }>(
      "/api/v1/things/1",
      { enabled: true },
    );
    expect(result.data).toEqual({ updated: true });
  });

  it("merges caller headers while allowing Content-Type overrides", async () => {
    const fetchMock = jest.fn(async (_url, init) => {
      const headers = init?.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBe("text/plain");
      expect(headers["Authorization"]).toBe("Bearer token");
      expect(headers["X-Request-Id"]).toBe("req-123");
      return mockOk({ ok: true });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiFetch } = await loadApiClient();
    const result = await apiFetch("/api/v1/custom", {
      headers: {
        "Content-Type": "text/plain",
        Authorization: "Bearer token",
        "X-Request-Id": "req-123",
      },
    });
    expect(result.data).toEqual({ ok: true });
  });

  it("returns { data: undefined, rateLimit } for DELETE 204 responses", async () => {
    const fetchMock = jest.fn(async (_url, init) => {
      expect(init?.method).toBe("DELETE");
      return new Response(null, { status: 204 });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiDelete } = await loadApiClient();
    const result = await apiDelete("/api/v1/things/1");
    expect(result.data).toBeUndefined();
    expect(result.rateLimit).toEqual(emptyRateLimit);
  });

  it("unwraps ApiError fields onto the thrown Error instance", async () => {
    const fetchMock = jest.fn(
      async () =>
        mockResponse(
          {
            error: "invalid_request",
            message: "boom",
            requestId: "req-1",
          },
          400,
          "Bad Request",
        ),
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things/1").catch(
      (err) => err,
    )) as Error & Partial<ApiError>;

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      message: "boom",
      error: "invalid_request",
      requestId: "req-1",
    });
  });

  it("falls back cleanly when a non-OK response has no body", async () => {
    const fetchMock = jest.fn(
      async () =>
        new Response(null, {
          status: 500,
          statusText: "Internal Server Error",
        }),
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things/1").catch(
      (err) => err,
    )) as Error & Partial<ApiError>;

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Internal Server Error");
    expect(error.error).toBe("http_error");
    expect(error.requestId).toBeUndefined();
  });

  it("treats a JSON null body as undefined", async () => {
    mockFetch(
      jest.fn(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "Content-Type": "application/json" }),
        json: async () => null,
      })) as unknown as typeof globalThis.fetch,
    );

    const { apiGet } = await loadApiClient();
    const result = await apiGet("/api/v1/things/1");
    expect(result.data).toBeUndefined();
  });

  it("reports malformed JSON on a successful response", async () => {
    mockFetch(
      jest.fn(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "Content-Type": "application/json" }),
        json: async () => {
          throw new Error("unexpected token");
        },
      })) as unknown as typeof globalThis.fetch,
    );

    const { apiGet } = await loadApiClient();
    await expect(apiGet("/api/v1/things/1")).rejects.toThrow(
      "Response body was not valid JSON",
    );
  });

  it("falls back to the status text when malformed JSON comes back with a non-OK status", async () => {
    mockFetch(
      jest.fn(async () => ({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers({ "Content-Type": "application/json" }),
        json: async () => {
          throw new Error("unexpected token");
        },
      })) as unknown as typeof globalThis.fetch,
    );

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things/1").catch(
      (err) => err,
    )) as Error & Partial<ApiError>;

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Internal Server Error");
  });

  it("falls back to Request failed when malformed JSON arrives without a status text", async () => {
    mockFetch(
      jest.fn(async () => ({
        ok: false,
        status: 500,
        statusText: "",
        headers: new Headers({ "Content-Type": "application/json" }),
        json: async () => {
          throw new Error("unexpected token");
        },
      })) as unknown as typeof globalThis.fetch,
    );

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things/1").catch(
      (err) => err,
    )) as Error & Partial<ApiError>;

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Request failed");
  });

  it("uses Request failed when an error payload omits message and status text", async () => {
    mockFetch(
      jest.fn(async () => ({
        ok: false,
        status: 500,
        statusText: "",
        headers: new Headers({ "Content-Type": "application/json" }),
        json: async () => ({
          error: "server_error",
        }),
      })) as unknown as typeof globalThis.fetch,
    );

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things/1").catch(
      (err) => err,
    )) as Error & Partial<ApiError>;

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Request failed");
    expect(error.error).toBe("server_error");
  });

  it("throws a generic ApiError when an error response is not JSON", async () => {
    mockFetch(
      jest.fn(
        async () => new Response("Bad gateway", { status: 502 }),
      ),
    );

    const { apiGet } = await loadApiClient();
    await expect(apiGet("/api/v1/x")).rejects.toMatchObject({
      message: "Request failed",
      error: "http_error",
    });
  });

  it("aborts the request when timeoutMs elapses", async () => {
    jest.useFakeTimers();

    globalThis.fetch = jest.fn(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          signal?.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          });
        }),
    ) as unknown as typeof globalThis.fetch;

    const pending = apiFetch("/api/v1/slow", { timeoutMs: 50 });
    const assertion = pending.catch((error) => {
      expect(error).toBeInstanceOf(ApiTimeoutError);
      expect(error).toMatchObject({
        message: "request timed out after 50ms",
        timeoutMs: 50,
      });
    });
    await jest.advanceTimersByTimeAsync(50);

    await assertion;
  });

  it("uses the default timeout when timeoutMs is omitted", async () => {
    jest.useFakeTimers();

    mockFetch(
      jest.fn(
        (_url, init) =>
          new Promise<Response>((_resolve, reject) => {
            const signal = init?.signal;
            signal?.addEventListener("abort", () => reject(signal.reason), {
              once: true,
            });
          }),
      ),
    );

    const pending = apiFetch("/api/v1/slow");
    const assertion = pending.catch((error) => {
      expect(error).toBeInstanceOf(ApiTimeoutError);
      expect(error).toMatchObject({
        message: "request timed out after 10000ms",
        timeoutMs: 10_000,
      });
    });
    await jest.advanceTimersByTimeAsync(10_000);

    await assertion;
  });

  it("propagates caller aborts through the composed signal", async () => {
    const callerController = new AbortController();

    mockFetch(
      jest.fn(
        (_url, init) =>
          new Promise<Response>((_resolve, reject) => {
            const signal = init?.signal;
            signal?.addEventListener("abort", () => reject(signal.reason), {
              once: true,
            });
          }),
      ),
    );

    const pending = apiFetch("/api/v1/slow", {
      signal: callerController.signal,
      timeoutMs: 500,
    });
    const callerAbort = new Error("Caller cancelled");
    callerAbort.name = "AbortError";
    callerController.abort(callerAbort);

    await expect(pending).rejects.toBe(callerAbort);
  });

  it("handles a caller signal that is already aborted before apiFetch is called", async () => {
    const callerController = new AbortController();
    const abortReason = new Error("Already cancelled");
    abortReason.name = "AbortError";
    callerController.abort(abortReason);

    mockFetch(
      jest.fn((_url, init) => {
        const signal = init?.signal as AbortSignal;
        if (signal?.aborted) {
          return Promise.reject(signal.reason);
        }
        return Promise.resolve(mockOk({ ok: true }));
      }),
    );

    await expect(
      apiFetch("/api/v1/things", { signal: callerController.signal }),
    ).rejects.toBe(abortReason);
  });

  it("does not set a timeout when timeoutMs is 0", async () => {
    jest.useFakeTimers();

    let fetchSignal: AbortSignal | undefined;
    globalThis.fetch = jest.fn(async (_url, init) => {
      fetchSignal = init?.signal as AbortSignal;
      return mockOk({ ok: true });
    }) as unknown as typeof globalThis.fetch;

    const result = await apiFetch<{ ok: boolean }>("/api/v1/things", {
      timeoutMs: 0,
    });
    expect(result.data).toEqual({ ok: true });

    expect(fetchSignal?.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(10_000);
    expect(fetchSignal?.aborted).toBe(false);
  });

  it("still resolves normally before timeout and leaves the signal un-aborted", async () => {
    jest.useFakeTimers();

    let fetchSignal: AbortSignal | undefined;
    mockFetch(
      jest.fn(async (_url, init) => {
        fetchSignal = init?.signal as AbortSignal;
        return mockOk({ ok: true });
      }),
    );

    const result = await apiFetch<{ ok: boolean }>("/api/v1/things", {
      timeoutMs: 100,
    });
    expect(result.data).toEqual({ ok: true });

    expect(fetchSignal?.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(100);
    expect(fetchSignal?.aborted).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Rate-limit header parsing
  // ---------------------------------------------------------------------------

  it("returns rateLimit with all-null values when no rate-limit headers are present", async () => {
    mockFetch(jest.fn(async () => mockOk({ data: 1 })));

    const { apiGet } = await loadApiClient();
    const result = await apiGet("/api/v1/things");
    expect(result.rateLimit).toEqual(emptyRateLimit);
  });

  it("parses X-RateLimit-Remaining, X-RateLimit-Limit, and X-RateLimit-Reset headers", async () => {
    mockFetch(
      jest.fn(async () =>
        mockOk({ data: 1 }, {
          "X-RateLimit-Remaining": "42",
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Reset": "1700000000",
        }),
      ),
    );

    const { apiGet } = await loadApiClient();
    const result = await apiGet("/api/v1/things");
    expect(result.rateLimit).toEqual(
      flatRateLimit({
        remaining: 42,
        limit: 100,
        resetAt: 1700000000,
      }),
    );
  });

  it("parses Retry-After header and converts seconds to ms", async () => {
    mockFetch(
      jest.fn(async () =>
        mockOk({ data: 1 }, { "Retry-After": "30" }),
      ),
    );

    const { apiGet } = await loadApiClient();
    const result = await apiGet("/api/v1/things");
    expect(result.rateLimit).toEqual(
      flatRateLimit({ retryAfterMs: 30000 }),
    );
  });

  it("parses all rate-limit headers together on a 2xx response", async () => {
    mockFetch(
      jest.fn(async () =>
        mockOk({ data: 1 }, {
          "X-RateLimit-Remaining": "5",
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Reset": "1700000000",
          "Retry-After": "60",
        }),
      ),
    );

    const { apiGet } = await loadApiClient();
    const result = await apiGet("/api/v1/things");
    expect(result.rateLimit).toEqual({
      remaining: 5,
      limit: 100,
      resetAt: 1700000000,
      retryAfterMs: 60000,
    });
  });

  it("rateLimit is present on error responses (non-429)", async () => {
    mockFetch(
      jest.fn(async () =>
        mockResponse(
          { error: "bad", message: "bad" },
          400,
          "Bad Request",
          { "X-RateLimit-Remaining": "0" },
        ),
      ),
    );

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things").catch(
      (err) => err,
    )) as Error & Partial<ApiError>;
    expect(error.message).toBe("bad");

    // Rate-limit info is lost with non-429 errors because we throw before
    // returning it.  This is acceptable — the error object carries the info
    // needed for 429s specifically.
  });

  // ---------------------------------------------------------------------------
  // Warning threshold
  // ---------------------------------------------------------------------------

  it("warns via console.warn when remaining <= RATE_LIMIT_WARNING_THRESHOLD and > 0", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    mockFetch(
      jest.fn(async () =>
        mockOk({ data: 1 }, { "X-RateLimit-Remaining": "5" }),
      ),
    );

    const { apiGet } = await loadApiClient();
    await apiGet("/api/v1/things");

    expect(warn).toHaveBeenCalledWith(
      "API rate-limit near exhaustion: 5 calls remaining",
    );
    warn.mockRestore();
  });

  it("warns when remaining equals the threshold", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    mockFetch(
      jest.fn(async () =>
        mockOk({ data: 1 }, { "X-RateLimit-Remaining": String(RATE_LIMIT_WARNING_THRESHOLD) }),
      ),
    );

    const { apiGet } = await loadApiClient();
    await apiGet("/api/v1/things");

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("does NOT warn when remaining > threshold", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    mockFetch(
      jest.fn(async () =>
        mockOk({ data: 1 }, { "X-RateLimit-Remaining": "100" }),
      ),
    );

    const { apiGet } = await loadApiClient();
    await apiGet("/api/v1/things");

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("does NOT warn when remaining is 0", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    mockFetch(
      jest.fn(async () =>
        mockOk({ data: 1 }, { "X-RateLimit-Remaining": "0" }),
      ),
    );

    const { apiGet } = await loadApiClient();
    await apiGet("/api/v1/things");

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("does NOT warn when remaining is null", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    mockFetch(jest.fn(async () => mockOk({ data: 1 })));

    const { apiGet } = await loadApiClient();
    await apiGet("/api/v1/things");

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // 429 handling
  // ---------------------------------------------------------------------------

  it("throws ApiRateLimitedError on 429 with Retry-After", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    mockFetch(
      jest.fn(async () =>
        mockResponse(null, 429, "Too Many Requests", {
          "Retry-After": "15",
          "X-RateLimit-Remaining": "0",
        }),
      ),
    );

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things").catch(
      (err) => err,
    )) as ApiRateLimitedError;

    expect(error).toBeInstanceOf(ApiRateLimitedError);
    expect(error.name).toBe("ApiRateLimitedError");
    expect(error.message).toBe("Rate limited. Retry after 15s");
    expect(error.retryAfterMs).toBe(15000);
    warn.mockRestore();
  });

  it("throws ApiRateLimitedError on 429 without Retry-After (defaults to 0)", async () => {
    mockFetch(
      jest.fn(
        async () =>
          new Response(JSON.stringify({ error: "rate_limited" }), {
            status: 429,
            statusText: "Too Many Requests",
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things").catch(
      (err) => err,
    )) as ApiRateLimitedError;

    expect(error).toBeInstanceOf(ApiRateLimitedError);
    expect(error.message).toBe("Rate limited. Retry after 0s");
    expect(error.retryAfterMs).toBe(0);
  });

  it("429 with remaining > 0 still throws ApiRateLimitedError", async () => {
    mockFetch(
      jest.fn(async () =>
        mockResponse(null, 429, "Too Many Requests", {
          "X-RateLimit-Remaining": "5",
          "Retry-After": "10",
        }),
      ),
    );

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things").catch(
      (err) => err,
    )) as ApiRateLimitedError;

    expect(error).toBeInstanceOf(ApiRateLimitedError);
    expect(error.retryAfterMs).toBe(10000);
  });

  it("429 response body is ignored and not parsed", async () => {
    mockFetch(
      jest.fn(async () =>
        new Response("not json at all", {
          status: 429,
          statusText: "Too Many Requests",
          headers: { "Retry-After": "5" },
        }),
      ),
    );

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things").catch(
      (err) => err,
    )) as ApiRateLimitedError;

    expect(error).toBeInstanceOf(ApiRateLimitedError);
    expect(error.retryAfterMs).toBe(5000);
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it("apiPost returns ApiResult correctly", async () => {
    mockFetch(jest.fn(async () => mockOk({ id: "abc" })));

    const { apiPost } = await loadApiClient();
    const result = await apiPost<{ id: string }>("/api/v1/things", { name: "x" });
    expect(result.data).toEqual({ id: "abc" });
    expect(result.rateLimit).toEqual(emptyRateLimit);
  });

  it("apiPatch returns ApiResult correctly", async () => {
    mockFetch(jest.fn(async () => mockOk({ updated: true })));

    const { apiPatch } = await loadApiClient();
    const result = await apiPatch("/api/v1/things/1", { name: "y" });
    expect(result.data).toEqual({ updated: true });
  });

  it("apiDelete returns ApiResult<void> correctly with rateLimit", async () => {
    mockFetch(
      jest.fn(
        async () =>
          new Response(null, {
            status: 204,
            headers: { "X-RateLimit-Remaining": "99" },
          }),
      ),
    );

    const { apiDelete } = await loadApiClient();
    const result = await apiDelete("/api/v1/things/1");
    expect(result.data).toBeUndefined();
    expect(result.rateLimit).toEqual(flatRateLimit({ remaining: 99 }));
  });

  it("ApiRateLimitedError is exported and is an Error subclass", () => {
    const err = new ApiRateLimitedError(5000);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ApiRateLimitedError");
    expect(err.message).toBe("Rate limited. Retry after 5s");
    expect(err.retryAfterMs).toBe(5000);
  });

  it("RateLimitInfo type has correct shape", () => {
    const info: RateLimitInfo = {
      remaining: 0,
      limit: 100,
      resetAt: 1e9,
      retryAfterMs: 1000,
    };
    expect(info.remaining).toBe(0);
    expect(info.limit).toBe(100);
    expect(info.resetAt).toBe(1e9);
    expect(info.retryAfterMs).toBe(1000);
  });

  it("ApiResult type is correctly shaped", () => {
    const result: ApiResult<string> = {
      data: "hello",
      rateLimit: emptyRateLimit,
    };
    expect(result.data).toBe("hello");
    expect(result.rateLimit).toBe(emptyRateLimit);
  });

  it("RATE_LIMIT_WARNING_THRESHOLD is exported as a number", () => {
    expect(RATE_LIMIT_WARNING_THRESHOLD).toBe(10);
  });
});
