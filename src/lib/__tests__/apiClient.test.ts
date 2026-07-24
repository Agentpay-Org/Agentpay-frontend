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
  apiPost,
  apiPatch,
  apiDelete,
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
  const hdrs: Record<string, string> = {
    "Content-Type": "application/json",
    ...rateLimitHeaders,
  };
  const headers = new Headers();
  for (const [k, v] of Object.entries(hdrs)) {
    headers.set(k, v);
  }
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers,
    json: async () => (body != null ? body : undefined),
    redirected: false,
    type: "default" as const,
    url: "",
    clone: () => {
      throw new Error("not implemented");
    },
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => { throw new Error("not implemented"); },
    blob: async () => { throw new Error("not implemented"); },
    formData: async () => { throw new Error("not implemented"); },
    text: async () => JSON.stringify(body),
  } as Response;
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

    const result = await apiGet<{ ok: boolean }>("/api/v1/things");
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("honours NEXT_PUBLIC_AGENTPAY_API_BASE instead of the localhost default", async () => {
    const fetchMock = jest.fn(async (url) => {
      expect(url).toBe("https://api.example.com/v1/health");
      return mockOk({ ok: true });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiGet: altApiGet } = await loadApiClient({
      NEXT_PUBLIC_AGENTPAY_API_BASE: "https://api.example.com/v1/",
    });
    const result = await altApiGet<{ ok: boolean }>("/health");
    expect(result).toEqual({ ok: true });
  });

  it("sends POST bodies as JSON strings", async () => {
    const fetchMock = jest.fn(async (_url, init) => {
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ hello: "world" }));
      return mockOk({ created: true });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const result = await apiPost<{ created: boolean }>("/api/v1/things", {
      hello: "world",
    });
    expect(result).toEqual({ created: true });
  });

  it("sends PATCH bodies as JSON strings", async () => {
    const fetchMock = jest.fn(async (_url, init) => {
      expect(init?.method).toBe("PATCH");
      expect(init?.body).toBe(JSON.stringify({ enabled: true }));
      return mockOk({ updated: true });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const result = await apiPatch<{ updated: boolean }>(
      "/api/v1/things/1",
      { enabled: true },
    );
    expect(result).toEqual({ updated: true });
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

    const result = await apiFetch("/api/v1/custom", {
      headers: {
        "Content-Type": "text/plain",
        Authorization: "Bearer token",
        "X-Request-Id": "req-123",
      },
    });
    expect(result.data).toEqual({ ok: true });
  });

  it("returns undefined for DELETE 204 responses", async () => {
    const fetchMock = jest.fn(async (_url, init) => {
      expect(init?.method).toBe("DELETE");
      return new Response(null, { status: 204 });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const result = await apiDelete("/api/v1/things/1");
    expect(result).toBeUndefined();
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

    const result = await apiGet("/api/v1/things/1");
    expect(result).toBeUndefined();
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

  describe("GET request deduplication", () => {
    it("deduplicates concurrent GET requests with the same path", async () => {
      let resolveFetch!: (value: Response) => void;
      const fetchMock = jest.fn(
        () => new Promise<Response>((resolve) => { resolveFetch = resolve; }),
      );
      globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

      const { apiGet } = await loadApiClient();
      const promise1 = apiGet<{ ok: boolean }>("/api/v1/things");
      const promise2 = apiGet<{ ok: boolean }>("/api/v1/things");

      expect(fetchMock).toHaveBeenCalledTimes(1);

      resolveFetch!(new Response(JSON.stringify({ ok: true }), { status: 200 }));

      const [r1, r2] = await Promise.all([promise1, promise2]);
      expect(r1).toEqual({ ok: true });
      expect(r2).toEqual({ ok: true });
    });

    it("does not deduplicate requests made to different paths", async () => {
      const fetchMock = jest.fn(
        async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
      globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

      const { apiGet } = await loadApiClient();

      await Promise.all([
        apiGet("/api/v1/foo"),
        apiGet("/api/v1/bar"),
      ]);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("uses distinct cache keys for different query strings", async () => {
      const fetchMock = jest.fn(
        async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
      globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

      const { apiGet } = await loadApiClient();

      await Promise.all([
        apiGet("/api/v1/things?limit=10"),
        apiGet("/api/v1/things?limit=20"),
      ]);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("evicts the cache entry after the request settles so a second call re-fetches", async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), { status: 200 }),
        );
      globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

      const { apiGet } = await loadApiClient();

      await apiGet("/api/v1/things");
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await apiGet("/api/v1/things");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("evicts the cache entry when the request fails", async () => {
      const fetchMock = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network failure"))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), { status: 200 }),
        );
      globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

      const { apiGet } = await loadApiClient();

      await expect(apiGet("/api/v1/things")).rejects.toThrow("Network failure");
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await expect(apiGet("/api/v1/things")).resolves.toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("does not cancel the shared fetch when one subscriber aborts", async () => {
      let resolveFetch!: (value: Response) => void;
      const fetchMock = jest.fn(
        () => new Promise<Response>((resolve) => { resolveFetch = resolve; }),
      );
      globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

      const { apiGet } = await loadApiClient();

      const controller1 = new AbortController();
      const controller2 = new AbortController();

      const promise1 = apiGet<{ ok: boolean }>("/api/v1/things", {
        signal: controller1.signal,
      });
      const promise2 = apiGet<{ ok: boolean }>("/api/v1/things", {
        signal: controller2.signal,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);

      const abortReason = new Error("Caller cancelled");
      abortReason.name = "AbortError";
      controller1.abort(abortReason);

      resolveFetch!(new Response(JSON.stringify({ ok: true }), { status: 200 }));

      const [r1, r2] = await Promise.all([promise1, promise2]);
      expect(r1).toEqual({ ok: true });
      expect(r2).toEqual({ ok: true });
    });

    it("does not deduplicate POST, PATCH or DELETE requests", async () => {
      const fetchMock = jest.fn(
        async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
      globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

      const { apiPost, apiPatch, apiDelete } = await loadApiClient();

      await Promise.all([
        apiPost("/api/v1/things", { name: "x" }),
        apiPost("/api/v1/things", { name: "x" }),
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      await Promise.all([
        apiPatch("/api/v1/things/1", { name: "x" }),
        apiPatch("/api/v1/things/1", { name: "x" }),
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(4);

      await Promise.all([
        apiDelete("/api/v1/things/1"),
        apiDelete("/api/v1/things/1"),
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(6);
    });

    it("respects headers passed to the deduped request", async () => {
      const fetchMock = jest.fn(
        async (_url: string, init?: RequestInit) => {
          const headers = init?.headers as Record<string, string>;
          expect(headers["Authorization"]).toBe("Bearer token-123");
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        },
      );
      globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

      const { apiGet } = await loadApiClient();
      await apiGet("/api/v1/things", {
        headers: { Authorization: "Bearer token-123" },
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
