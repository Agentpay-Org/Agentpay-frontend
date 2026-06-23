import {
  ApiTimeoutError,
  apiFetch,
  apiGet,
} from "../apiClient";
import type { ApiError } from "../apiClient";

type ApiClientModule = typeof import("../apiClient");

async function loadApiClient(
  env: { NEXT_PUBLIC_AGENTPAY_API_BASE?: string } = {}
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

describe("apiClient", () => {
  let originalFetch: typeof globalThis.fetch;

  function mockFetch(handler: jest.Mock | typeof globalThis.fetch) {
    globalThis.fetch = handler as unknown as typeof globalThis.fetch;
  }

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    globalThis.fetch = originalFetch;
    jest.resetModules();
  });

  it("prefixes GETs with the localhost default base URL", async () => {
    const fetchMock = jest.fn(async (url, init) => {
      expect(url).toBe("http://localhost:3001/api/v1/things");
      expect(init?.method).toBeUndefined();
      expect((init?.headers as Record<string, string>)["Content-Type"]).toBe(
        "application/json"
      );
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiGet } = await loadApiClient();
    await expect(apiGet<{ ok: boolean }>("/api/v1/things")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("honours NEXT_PUBLIC_AGENTPAY_API_BASE instead of the localhost default", async () => {
    const fetchMock = jest.fn(async (url) => {
      expect(url).toBe("https://api.example.com/v1/health");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiGet } = await loadApiClient({
      NEXT_PUBLIC_AGENTPAY_API_BASE: "https://api.example.com/v1/",
    });
    await expect(apiGet<{ ok: boolean }>("/health")).resolves.toEqual({ ok: true });
  });

  it("sends POST bodies as JSON strings", async () => {
    const fetchMock = jest.fn(async (_url, init) => {
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ hello: "world" }));
      return new Response(JSON.stringify({ created: true }), { status: 200 });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiPost } = await loadApiClient();
    await expect(apiPost<{ created: boolean }>("/api/v1/things", { hello: "world" })).resolves.toEqual(
      { created: true }
    );
  });

  it("sends PATCH bodies as JSON strings", async () => {
    const fetchMock = jest.fn(async (_url, init) => {
      expect(init?.method).toBe("PATCH");
      expect(init?.body).toBe(JSON.stringify({ enabled: true }));
      return new Response(JSON.stringify({ updated: true }), { status: 200 });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiPatch } = await loadApiClient();
    await expect(apiPatch<{ updated: boolean }>("/api/v1/things/1", { enabled: true })).resolves.toEqual(
      { updated: true }
    );
  });

  it("merges caller headers while allowing Content-Type overrides", async () => {
    const fetchMock = jest.fn(async (_url, init) => {
      const headers = init?.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBe("text/plain");
      expect(headers["Authorization"]).toBe("Bearer token");
      expect(headers["X-Request-Id"]).toBe("req-123");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiFetch } = await loadApiClient();
    await expect(
      apiFetch("/api/v1/custom", {
        headers: {
          "Content-Type": "text/plain",
          Authorization: "Bearer token",
          "X-Request-Id": "req-123",
        },
      })
    ).resolves.toEqual({ ok: true });
  });

  it("returns undefined for DELETE 204 responses", async () => {
    const fetchMock = jest.fn(async (_url, init) => {
      expect(init?.method).toBe("DELETE");
      return new Response(null, { status: 204 });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiDelete } = await loadApiClient();
    await expect(apiDelete("/api/v1/things/1")).resolves.toBeUndefined();
  });

  it("unwraps ApiError fields onto the thrown Error instance", async () => {
    const fetchMock = jest.fn(async () =>
      new Response(
        JSON.stringify({
          error: "invalid_request",
          message: "boom",
          requestId: "req-1",
        }),
        { status: 400, statusText: "Bad Request" }
      )
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things/1").catch((err) => err)) as Error &
      Partial<ApiError>;

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      message: "boom",
      error: "invalid_request",
      requestId: "req-1",
    });
  });

  it("falls back cleanly when a non-OK response has no body", async () => {
    const fetchMock = jest.fn(async () =>
      new Response(null, { status: 500, statusText: "Internal Server Error" })
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things/1").catch((err) => err)) as Error &
      Partial<ApiError>;

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Internal Server Error");
    expect(error.error).toBeUndefined();
    expect(error.requestId).toBeUndefined();
  });

  it("treats a JSON null body as undefined", async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => null,
    }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiGet } = await loadApiClient();
    await expect(apiGet("/api/v1/things/1")).resolves.toBeUndefined();
  });

  it("reports malformed JSON on a successful response", async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => {
        throw new Error("unexpected token");
      },
    }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiGet } = await loadApiClient();
    await expect(apiGet("/api/v1/things/1")).rejects.toThrow(
      "Response body was not valid JSON"
    );
  });

  it("falls back to the status text when malformed JSON comes back with a non-OK status", async () => {
    const fetchMock = jest.fn(async () => ({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => {
        throw new Error("unexpected token");
      },
    }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things/1").catch((err) => err)) as Error &
      Partial<ApiError>;

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Internal Server Error");
  });

  it("falls back to Request failed when malformed JSON arrives without a status text", async () => {
    const fetchMock = jest.fn(async () => ({
      ok: false,
      status: 500,
      statusText: "",
      json: async () => {
        throw new Error("unexpected token");
      },
    }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things/1").catch((err) => err)) as Error &
      Partial<ApiError>;

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Request failed");
  });

  it("uses Request failed when an error payload omits message and status text", async () => {
    const fetchMock = jest.fn(async () => ({
      ok: false,
      status: 500,
      statusText: "",
      json: async () => ({
        error: "server_error",
      }),
    }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { apiGet } = await loadApiClient();
    const error = (await apiGet("/api/v1/things/1").catch((err) => err)) as Error &
      Partial<ApiError>;

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Request failed");
    expect(error.error).toBe("server_error");
  });

  it("throws a generic ApiError when an error response is not JSON", async () => {
    mockFetch(jest.fn(async () => new Response("Bad gateway", { status: 502 })));

    await expect(apiGet("/api/v1/x")).rejects.toMatchObject({
      message: "Request failed with status 502",
      error: "http_error",
    });
  });

  it("aborts the request when timeoutMs elapses", async () => {
    jest.useFakeTimers();

    mockFetch(
      jest.fn(
        (_url, init) =>
          new Promise<Response>((_resolve, reject) => {
            const signal = init?.signal;
            signal?.addEventListener(
              "abort",
              () => reject(signal.reason),
              { once: true }
            );
          })
      )
    );

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
            signal?.addEventListener(
              "abort",
              () => reject(signal.reason),
              { once: true }
            );
          })
      )
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
            signal?.addEventListener(
              "abort",
              () => reject(signal.reason),
              { once: true }
            );
          })
      )
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

  it("still resolves normally before timeout and leaves the signal un-aborted", async () => {
    jest.useFakeTimers();

    let fetchSignal: AbortSignal | undefined;
    mockFetch(
      jest.fn(async (_url, init) => {
        fetchSignal = init?.signal as AbortSignal;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      })
    );

    await expect(
      apiFetch<{ ok: boolean }>("/api/v1/things", { timeoutMs: 100 })
    ).resolves.toEqual({ ok: true });

    expect(fetchSignal?.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(100);
    expect(fetchSignal?.aborted).toBe(false);
  });
});
