import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { apiGet } from "../apiClient";
import { useApi } from "../useApi";

jest.mock("../apiClient", () => ({
  apiGet: jest.fn(),
}));

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

    render(<Probe path="/api/v1/events" />);

    await waitFor(() => {
      expect(screen.getByTestId("state")).toHaveTextContent(
        "error:backend unavailable",
      );
    });
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
});
