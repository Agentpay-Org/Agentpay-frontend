import { act, fireEvent, render, screen } from "@testing-library/react";

import { apiGet } from "../apiClient";
import { usePolling } from "../usePolling";

jest.mock("../apiClient", () => ({
  apiGet: jest.fn(),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;

type Payload = {
  value: number;
};

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function lastApiGetCall() {
  return apiGetMock.mock.calls[apiGetMock.mock.calls.length - 1];
}

function expectLastStatsCall() {
  const call = lastApiGetCall();
  expect(call[0]).toBe("/api/v1/stats");
  expect(call[1]).toMatchObject({ signal: expect.any(AbortSignal) });
}

function Probe({
  initialPaused = false,
  path = "/api/v1/stats",
}: {
  initialPaused?: boolean;
  path?: string | null;
}) {
  const state = usePolling<Payload>(path, 1000, { initialPaused });

  return (
    <div>
      <output data-testid="status">{state.status}</output>
      <output data-testid="value">{state.data?.value ?? "none"}</output>
      <output data-testid="error">{state.error ?? "none"}</output>
      <output data-testid="paused">{String(state.paused)}</output>
      <output data-testid="last-updated">
        {state.lastUpdated?.toISOString() ?? "none"}
      </output>
      <button type="button" onClick={state.pause}>
        pause
      </button>
      <button type="button" onClick={state.resume}>
        resume
      </button>
      <button type="button" onClick={state.refresh}>
        refresh
      </button>
    </div>
  );
}

describe("usePolling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-04T00:00:00.000Z"));
    apiGetMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("fetches immediately and again on the interval", async () => {
    apiGetMock
      .mockResolvedValueOnce({ value: 1 })
      .mockResolvedValueOnce({ value: 2 });

    render(<Probe />);

    expect(await screen.findByText("1")).toBeInTheDocument();
    expect(screen.getByTestId("status")).toHaveTextContent("ok");
    expect(screen.getByTestId("last-updated")).toHaveTextContent(
      /^2026-07-04T00:00:00\.\d{3}Z$/
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(apiGetMock).toHaveBeenCalledTimes(2);
    expectLastStatsCall();
  });

  it("supports starting paused before the first tick", async () => {
    apiGetMock.mockResolvedValue({ value: 7 });

    render(<Probe initialPaused />);

    expect(apiGetMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("paused")).toHaveTextContent("true");

    fireEvent.click(screen.getByRole("button", { name: "resume" }));

    expect(await screen.findByText("7")).toBeInTheDocument();
    expect(apiGetMock).toHaveBeenCalledTimes(1);
  });

  it("pause stops interval fetches and resume fetches immediately", async () => {
    apiGetMock
      .mockResolvedValueOnce({ value: 1 })
      .mockResolvedValueOnce({ value: 2 });

    render(<Probe />);

    expect(await screen.findByText("1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "pause" }));

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(apiGetMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "resume" }));

    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(apiGetMock).toHaveBeenCalledTimes(2);
  });

  it("aborts the in-flight request when paused", async () => {
    const pending = deferred<Payload>();
    apiGetMock.mockReturnValue(pending.promise);

    render(<Probe />);

    expect(apiGetMock).toHaveBeenCalledTimes(1);
    const signal = apiGetMock.mock.calls[0][1]?.signal as AbortSignal;

    fireEvent.click(screen.getByRole("button", { name: "pause" }));

    expect(signal.aborted).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(apiGetMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces errors and recovers on a later poll", async () => {
    apiGetMock
      .mockRejectedValueOnce(new Error("stats unavailable"))
      .mockResolvedValueOnce({ value: 3 });

    render(<Probe />);

    expect(await screen.findByText("stats unavailable")).toBeInTheDocument();
    expect(screen.getByTestId("status")).toHaveTextContent("error");

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(screen.getByTestId("error")).toHaveTextContent("none");
  });

  it("falls back to a generic message for empty errors", async () => {
    apiGetMock.mockRejectedValueOnce(new Error(""));

    render(<Probe />);

    expect(await screen.findByText("failed to load")).toBeInTheDocument();
    expect(screen.getByTestId("status")).toHaveTextContent("error");
  });

  it("skips fetching when the path is null", async () => {
    render(<Probe path={null} />);

    fireEvent.click(screen.getByRole("button", { name: "refresh" }));

    expect(apiGetMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("status")).toHaveTextContent("loading");
  });

  it("manual refresh reuses the same API path", async () => {
    apiGetMock
      .mockResolvedValueOnce({ value: 1 })
      .mockResolvedValueOnce({ value: 9 });

    render(<Probe />);

    expect(await screen.findByText("1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "refresh" }));

    expect(await screen.findByText("9")).toBeInTheDocument();
    expectLastStatsCall();
  });

  it("aborts a superseded request when refreshing manually", async () => {
    const first = deferred<Payload>();
    apiGetMock
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ value: 2 });

    render(<Probe />);

    expect(apiGetMock).toHaveBeenCalledTimes(1);
    const firstSignal = apiGetMock.mock.calls[0][1]?.signal as AbortSignal;

    fireEvent.click(screen.getByRole("button", { name: "refresh" }));

    expect(firstSignal.aborted).toBe(true);
    expect(await screen.findByText("2")).toBeInTheDocument();

    await act(async () => {
      first.resolve({ value: 1 });
      await Promise.resolve();
    });

    expect(screen.getByTestId("value")).toHaveTextContent("2");
  });

  it("ignores pending responses after unmount and clears the interval", async () => {
    const pending = deferred<Payload>();
    apiGetMock.mockReturnValue(pending.promise);

    const { unmount } = render(<Probe />);

    expect(apiGetMock).toHaveBeenCalledTimes(1);
    const signal = apiGetMock.mock.calls[0][1]?.signal as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);

    await act(async () => {
      pending.resolve({ value: 99 });
      await Promise.resolve();
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(apiGetMock).toHaveBeenCalledTimes(1);
  });
});
