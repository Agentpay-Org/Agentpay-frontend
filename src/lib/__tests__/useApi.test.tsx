import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import {
  ApiRateLimitedError,
  ApiTimeoutError,
  apiGet,
} from "../apiClient";
import { useApi } from "../useApi";

jest.mock("../apiClient", () => {
  const original = jest.requireActual("../apiClient");
  return {
    ...original,
    apiGet: jest.fn(),
  };
});

type Payload = { label: string };

const apiGetMock = jest.mocked(apiGet<Payload>);

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function Probe({ path }: { path: string | null }) {
  const state = useApi<Payload>(path);

  if (state.status === "ok") {
    return <output data-testid="state">ok:{state.data.label}</output>;
  }

  if (state.status === "error") {
    return <output data-testid="state">error:{state.error}</output>;
  }

  return <output data-testid="state">loading</output>;
}

function DetailedProbe({ path }: { path: string | null }) {
  const state = useApi<Payload>(path);

  if (state.status === "error") {
    return (
      <div>
        <output data-testid="error-message">{state.error}</output>
        <output data-testid="error-kind">{state.errorKind}</output>
        <output data-testid="is-timeout">{String(state.isTimeout)}</output>
        <output data-testid="is-rate-limited">{String("isRateLimited" in state ? state.isRateLimited : false)}</output>
        <output data-testid="retry-after-ms">{String("retryAfterMs" in state ? state.retryAfterMs ?? "" : "")}</output>
        <button data-testid="retry-btn" onClick={state.retry}>
          Retry
        </button>
      </div>
    );
  }

  if (state.status === "ok") {
    return <output data-testid="state">ok:{state.data.label}</output>;
  }

  return <output data-testid="state">loading</output>;
}

describe("useApi", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
  });

  it("starts in loading state and transitions to ok with fetched data", async () => {
    const request = createDeferred<Payload>();
    apiGetMock.mockReturnValueOnce(request.promise);

    render(<Probe path="/api/v1/events" />);

    expect(screen.getByTestId("state")).toHaveTextContent("loading");
    expect(apiGetMock).toHaveBeenCalledWith(
      "/api/v1/events",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    await act(async () => {
      request.resolve({ label: "events loaded" });
      await request.promise;
    });

    expect(screen.getByTestId("state")).toHaveTextContent("ok:events loaded");
  });

  it("transitions to error when the request rejects", async () => {
    apiGetMock.mockRejectedValueOnce(new Error("backend unavailable"));

    render(<DetailedProbe path="/api/v1/events" />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "backend unavailable",
      );
      expect(screen.getByTestId("error-kind")).toHaveTextContent("generic");
      expect(screen.getByTestId("is-timeout")).toHaveTextContent("false");
      expect(screen.getByTestId("is-rate-limited")).toHaveTextContent("false");
    });
  });

  it("detects ApiTimeoutError and exposes timeout errorKind and message", async () => {
    apiGetMock.mockRejectedValueOnce(new ApiTimeoutError(10000));

    render(<DetailedProbe path="/api/v1/events" />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Request timed out. Please try again.",
      );
      expect(screen.getByTestId("error-kind")).toHaveTextContent("timeout");
      expect(screen.getByTestId("is-timeout")).toHaveTextContent("true");
      expect(screen.getByTestId("is-rate-limited")).toHaveTextContent("false");
    });
  });

  it("detects errors with name ApiTimeoutError and exposes timeout errorKind", async () => {
    const err = new Error("custom timeout");
    err.name = "ApiTimeoutError";
    apiGetMock.mockRejectedValueOnce(err);

    render(<DetailedProbe path="/api/v1/events" />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Request timed out. Please try again.",
      );
      expect(screen.getByTestId("error-kind")).toHaveTextContent("timeout");
    });
  });

  it("allows retrying the request using state.retry affordance", async () => {
    apiGetMock.mockRejectedValueOnce(new ApiTimeoutError(10000));

    render(<DetailedProbe path="/api/v1/events" />);

    await waitFor(() => {
      expect(screen.getByTestId("error-kind")).toHaveTextContent("timeout");
    });

    const secondRequest = createDeferred<Payload>();
    apiGetMock.mockReturnValueOnce(secondRequest.promise);

    act(() => {
      screen.getByTestId("retry-btn").click();
    });

    expect(screen.getByTestId("state")).toHaveTextContent("loading");

    await act(async () => {
      secondRequest.resolve({ label: "retried success" });
      await secondRequest.promise;
    });

    expect(screen.getByTestId("state")).toHaveTextContent("ok:retried success");
  });

  it("covers timeout branch using fake timers", async () => {
    jest.useFakeTimers();

    apiGetMock.mockImplementationOnce(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          reject(new ApiTimeoutError(5000));
        }, 5000);
      });
    });

    render(<DetailedProbe path="/api/v1/events" />);

    expect(screen.getByTestId("state")).toHaveTextContent("loading");

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("error-kind")).toHaveTextContent("timeout");
      expect(screen.getByTestId("is-timeout")).toHaveTextContent("true");
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Request timed out. Please try again.",
      );
    });

    jest.useRealTimers();
  });

  it("falls back to a generic error message for non-Error rejections", async () => {
    apiGetMock.mockRejectedValueOnce({});

    render(<Probe path="/api/v1/events" />);

    await waitFor(() => {
      expect(screen.getByTestId("state")).toHaveTextContent(
        "error:failed to load",
      );
    });
  });

  it("skips fetching when path is null", () => {
    render(<Probe path={null} />);

    expect(screen.getByTestId("state")).toHaveTextContent("loading");
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it("refetches when the path changes and ignores stale responses", async () => {
    const first = createDeferred<Payload>();
    const second = createDeferred<Payload>();
    let firstSignal: AbortSignal | undefined;

    apiGetMock
      .mockImplementationOnce((_path, init) => {
        firstSignal = init?.signal as AbortSignal;
        return first.promise;
      })
      .mockReturnValueOnce(second.promise);

    const { rerender } = render(<Probe path="/api/v1/first" />);

    expect(apiGetMock).toHaveBeenCalledTimes(1);
    rerender(<Probe path="/api/v1/second" />);

    expect(apiGetMock).toHaveBeenCalledTimes(2);
    expect(apiGetMock).toHaveBeenLastCalledWith(
      "/api/v1/second",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(firstSignal?.aborted).toBe(true);

    await act(async () => {
      first.resolve({ label: "stale first" });
      await first.promise;
    });

    expect(screen.getByTestId("state")).toHaveTextContent("loading");

    await act(async () => {
      second.resolve({ label: "fresh second" });
      await second.promise;
    });

    expect(screen.getByTestId("state")).toHaveTextContent("ok:fresh second");
  });

  it("aborts in-flight requests on unmount without updating state", async () => {
    const request = createDeferred<Payload>();
    let signal: AbortSignal | undefined;
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    apiGetMock.mockImplementationOnce((_path, init) => {
      signal = init?.signal as AbortSignal;
      return request.promise;
    });

    const { unmount } = render(<Probe path="/api/v1/events" />);

    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);

    await act(async () => {
      request.resolve({ label: "late response" });
      await request.promise;
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // Rate-limit error tests
  // ---------------------------------------------------------------------------

  it("detects ApiRateLimitedError and exposes rate_limited errorKind, isRateLimited, retryAfterMs", async () => {
    apiGetMock.mockRejectedValueOnce(new ApiRateLimitedError(30000));

    render(<DetailedProbe path="/api/v1/events" />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Rate limited. Retry after 30s",
      );
      expect(screen.getByTestId("error-kind")).toHaveTextContent("rate_limited");
      expect(screen.getByTestId("is-timeout")).toHaveTextContent("false");
      expect(screen.getByTestId("is-rate-limited")).toHaveTextContent("true");
      expect(screen.getByTestId("retry-after-ms")).toHaveTextContent("30000");
    });
  });

  it("detects errors with name ApiRateLimitedError and exposes rate_limited errorKind", async () => {
    const err = new Error("custom rate limit");
    err.name = "ApiRateLimitedError";
    apiGetMock.mockRejectedValueOnce(err);

    render(<DetailedProbe path="/api/v1/events" />);

    await waitFor(() => {
      expect(screen.getByTestId("error-kind")).toHaveTextContent("rate_limited");
    });
  });
});
