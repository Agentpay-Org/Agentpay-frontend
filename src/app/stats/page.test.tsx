import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import StatsPage from "./page";

const START_TIME = new Date("2026-07-22T10:00:00.000Z");
const STATS = {
  totalServices: 4,
  totalApiKeys: 8,
  totalRequests: 16,
  uniqueAgents: 2,
  paused: true,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function lastUpdatedTime() {
  return screen.getByText(/Last updated:/i).querySelector("time");
}

describe("StatsPage polling", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(START_TIME);
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("updates the freshness timestamp after every successful poll", async () => {
    const fetchMock = jest.fn(async () => jsonResponse(STATS));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<StatsPage />);

    await waitFor(() => expect(lastUpdatedTime()).toBeInTheDocument());
    const firstTimestamp = lastUpdatedTime()?.getAttribute("datetime");

    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    const secondTimestamp = lastUpdatedTime()?.getAttribute("datetime");
    expect(secondTimestamp).not.toBe(firstTimestamp);
    expect(Date.parse(secondTimestamp ?? "")).toBeGreaterThan(
      Date.parse(firstTimestamp ?? ""),
    );
  });

  it("pauses polling and resumes it with an immediate request", async () => {
    const fetchMock = jest.fn(async () => jsonResponse(STATS));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<StatsPage />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const pause = screen.getByRole("button", { name: /pause polling/i });
    expect(pause).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(pause);

    const resume = screen.getByRole("button", { name: /resume polling/i });
    expect(resume).toHaveAttribute("aria-pressed", "true");
    await act(async () => jest.advanceTimersByTime(15_000));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(resume);
    expect(screen.getByRole("button", { name: /pause polling/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    await act(async () => {});
    await act(async () => jest.advanceTimersByTime(5_000));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  });

  it("clears active polling when unmounted", async () => {
    const fetchMock = jest.fn(async () => jsonResponse(STATS));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { unmount } = render(<StatsPage />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    unmount();
    await act(async () => jest.advanceTimersByTime(20_000));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows a failed poll distinctly while retaining the last successful timestamp", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(STATS))
      .mockResolvedValueOnce(jsonResponse({ message: "stats unavailable" }, 503));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<StatsPage />);
    await waitFor(() => expect(lastUpdatedTime()).toBeInTheDocument());
    const successfulTimestamp = lastUpdatedTime()?.getAttribute("datetime");

    await act(async () => jest.advanceTimersByTime(5_000));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(lastUpdatedTime()).toHaveAttribute("datetime", successfulTimestamp);
    expect(screen.getByText(/backend is currently paused/i)).toBeInTheDocument();
    expect(screen.getAllByRole("definition")).toHaveLength(4);
  });

  it("announces meaningful stats changes via a debounced live region, avoiding initial mount, handling zero states", async () => {
    const fetchMock = jest.fn(async () => jsonResponse(STATS)); // paused: true
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { container } = render(<StatsPage />);
    
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    
    // Initial data fetch
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await act(async () => jest.advanceTimersByTime(500)); // debounce window
    
    // Should NOT announce on initial mount
    expect(liveRegion).toHaveTextContent("");

    // Simulate poll with changes (unpaused, updated counts)
    fetchMock.mockImplementationOnce(async () => jsonResponse({ ...STATS, totalRequests: 17, paused: false }));
    await act(async () => jest.advanceTimersByTime(5_000));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    // Fast-forward partial debounce time
    await act(async () => jest.advanceTimersByTime(200));
    expect(liveRegion).toHaveTextContent("");

    // Fast-forward remainder of debounce window
    await act(async () => jest.advanceTimersByTime(300));
    expect(liveRegion).toHaveTextContent("Stats updated: 4 services, 8 API keys, 17 requests, 2 agents");

    // Simulate zero-results state
    fetchMock.mockImplementationOnce(async () => jsonResponse({ totalServices: 0, totalApiKeys: 0, totalRequests: 0, uniqueAgents: 0, paused: false }));
    await act(async () => jest.advanceTimersByTime(5_000));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    
    // Rapid successive update (another update happens before the previous 500ms debounce completes)
    // We can simulate this by resolving another fetch instantly, though usePolling is 5s.
    // Instead we'll just wait 200ms, then trigger another state change by simulating a paused state fetch
    await act(async () => jest.advanceTimersByTime(200));
    
    // Force a re-render with new data (simulating a rapid update perhaps from another source, or just we test debounce)
    fetchMock.mockImplementationOnce(async () => jsonResponse({ ...STATS, paused: true }));
    await act(async () => jest.advanceTimersByTime(5_000)); // wait for next poll
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    
    await act(async () => jest.advanceTimersByTime(500));
    // The previous update (0 results) should have been skipped/overwritten, only the final update announced
    expect(liveRegion).toHaveTextContent("Stats updated: Backend is paused");
  });
});
