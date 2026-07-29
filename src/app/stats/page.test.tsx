import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { usePolling } from "@/lib/usePolling";

import StatsPage from "./page";

jest.mock("@/lib/usePolling", () => {
  const actual = jest.requireActual("@/lib/usePolling") as typeof import("@/lib/usePolling");
  return {
    ...actual,
    usePolling: jest.fn(actual.usePolling),
  };
});

const mockedUsePolling = usePolling as jest.MockedFunction<typeof usePolling>;

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
    const pause = await screen.findByRole("button", { name: /pause polling/i });
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
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("Try again on a stale poll failure re-fetches successfully", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ...STATS, paused: false }))
      .mockResolvedValueOnce(jsonResponse({ message: "stats unavailable" }, 503))
      .mockResolvedValue(jsonResponse({ ...STATS, paused: false }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<StatsPage />);
    await waitFor(() => expect(screen.getAllByRole("definition")).toHaveLength(4));

    await act(async () => jest.advanceTimersByTime(5_000));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});

// ---------------------------------------------------------------------------
// Loading / empty / error fetch states
// ---------------------------------------------------------------------------

describe("StatsPage — loading state", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows a loading spinner while the initial fetch is in flight", async () => {
    let resolveFirst!: (value: Response) => void;
    const firstPending = new Promise<Response>((r) => {
      resolveFirst = r;
    });

    globalThis.fetch = jest.fn().mockReturnValueOnce(firstPending) as unknown as typeof fetch;

    render(<StatsPage />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/loading stats/i)).toBeInTheDocument();
    expect(screen.queryByText(/could not load stats/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no stats available/i)).not.toBeInTheDocument();

    await act(async () => {
      resolveFirst(jsonResponse(STATS));
    });
  });

  it("hides the loading spinner once data arrives", async () => {
    globalThis.fetch = jest.fn(async () => jsonResponse(STATS)) as unknown as typeof fetch;
    render(<StatsPage />);

    await screen.findByText("Services");
    expect(screen.queryByText(/loading stats/i)).not.toBeInTheDocument();
  });
});

describe("StatsPage — error state", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the error EmptyState when the initial fetch fails", async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error("Network error")) as unknown as typeof fetch;

    render(<StatsPage />);

    expect(await screen.findByText(/could not load stats/i)).toBeInTheDocument();
    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });

  it("renders a keyboard-operable Retry button inside the error state", async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error("Network error")) as unknown as typeof fetch;

    render(<StatsPage />);
    await screen.findByText(/could not load stats/i);

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();
    expect(retryBtn.tagName.toLowerCase()).toBe("button");
    expect(retryBtn).not.toBeDisabled();
  });

  it("Retry re-fetches and recovers to the stats grid", async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValue(jsonResponse(STATS));

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<StatsPage />);
    await screen.findByText(/could not load stats/i);

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await screen.findByText("Services");
    expect(screen.queryByText(/could not load stats/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("definition")).toHaveLength(4);
  });

  it("supports keyboard activation of Retry", async () => {
    const user = userEvent.setup();
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValue(jsonResponse(STATS));

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<StatsPage />);
    await screen.findByText(/could not load stats/i);

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    retryBtn.focus();
    await user.keyboard("{Enter}");

    await screen.findByText("Services");
    expect(screen.queryByText(/could not load stats/i)).not.toBeInTheDocument();
  });

  it("error state is announced to assistive tech via aria-live", async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error("down")) as unknown as typeof fetch;
    render(<StatsPage />);

    await screen.findByText(/could not load stats/i);

    const liveRegion = screen
      .getByText(/could not load stats/i)
      .closest("[aria-live]");
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
  });

  it("error state is distinct from loading state", async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error("oops")) as unknown as typeof fetch;
    render(<StatsPage />);

    await screen.findByText(/could not load stats/i);

    expect(screen.queryByText(/loading stats/i)).not.toBeInTheDocument();
  });

  it("error state does not render the stats grid", async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error("oops")) as unknown as typeof fetch;
    render(<StatsPage />);

    await screen.findByText(/could not load stats/i);

    expect(screen.queryByText("Services")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pause polling/i })).not.toBeInTheDocument();
  });
});

describe("StatsPage — empty state", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the empty EmptyState when fetch succeeds but payload has no stats fields", async () => {
    globalThis.fetch = jest.fn(async () => jsonResponse({})) as unknown as typeof fetch;
    render(<StatsPage />);

    expect(await screen.findByText(/no stats available/i)).toBeInTheDocument();
  });

  it("renders a keyboard-operable Refresh button inside the empty state", async () => {
    globalThis.fetch = jest.fn(async () => jsonResponse({})) as unknown as typeof fetch;
    render(<StatsPage />);

    await screen.findByText(/no stats available/i);

    const refreshBtn = screen.getByRole("button", { name: /refresh/i });
    expect(refreshBtn).toBeInTheDocument();
    expect(refreshBtn.tagName.toLowerCase()).toBe("button");
    expect(refreshBtn).not.toBeDisabled();
  });

  it("Refresh in empty state re-fetches and recovers", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValue(jsonResponse(STATS));

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<StatsPage />);
    await screen.findByText(/no stats available/i);

    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

    await screen.findByText("Services");
    expect(screen.queryByText(/no stats available/i)).not.toBeInTheDocument();
  });

  it("empty state is announced to assistive tech via aria-live", async () => {
    globalThis.fetch = jest.fn(async () => jsonResponse({})) as unknown as typeof fetch;
    render(<StatsPage />);

    await screen.findByText(/no stats available/i);

    const liveRegion = screen
      .getByText(/no stats available/i)
      .closest("[aria-live]");
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
  });

  it("empty state is distinct from error state", async () => {
    globalThis.fetch = jest.fn(async () => jsonResponse({})) as unknown as typeof fetch;
    render(<StatsPage />);

    await screen.findByText(/no stats available/i);
    expect(screen.queryByText(/could not load stats/i)).not.toBeInTheDocument();
  });

  it("empty state is distinct from loading state", async () => {
    globalThis.fetch = jest.fn(async () => jsonResponse({})) as unknown as typeof fetch;
    render(<StatsPage />);

    await screen.findByText(/no stats available/i);
    expect(screen.queryByText(/loading stats/i)).not.toBeInTheDocument();
  });
});

describe("StatsPage — state exclusivity", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows exactly one of: loading / error / empty / stats grid at a time (ok)", async () => {
    globalThis.fetch = jest.fn(async () => jsonResponse(STATS)) as unknown as typeof fetch;
    render(<StatsPage />);

    await screen.findByText("Services");

    expect(screen.queryByText(/loading stats/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/could not load stats/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no stats available/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows exactly one of: loading / error / empty / stats grid at a time (error)", async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error("fail")) as unknown as typeof fetch;
    render(<StatsPage />);

    await screen.findByText(/could not load stats/i);

    expect(screen.queryByText(/loading stats/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no stats available/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Services")).not.toBeInTheDocument();
  });

  it("shows exactly one of: loading / error / empty / stats grid at a time (empty)", async () => {
    globalThis.fetch = jest.fn(async () => jsonResponse({})) as unknown as typeof fetch;
    render(<StatsPage />);

    await screen.findByText(/no stats available/i);

    expect(screen.queryByText(/loading stats/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/could not load stats/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Services")).not.toBeInTheDocument();
  });
});

describe("StatsPage — defensive edge branches", () => {
  const actualUsePolling = (
    jest.requireActual("@/lib/usePolling") as typeof import("@/lib/usePolling")
  ).usePolling;

  afterEach(() => {
    mockedUsePolling.mockImplementation(actualUsePolling);
  });

  it("falls back when an error has no detail message", () => {
    mockedUsePolling.mockReturnValue({
      status: "error",
      data: null,
      error: null,
      lastUpdated: null,
      paused: false,
      pause: jest.fn(),
      resume: jest.fn(),
      refresh: jest.fn(),
    });

    render(<StatsPage />);

    expect(screen.getByText(/could not load stats/i)).toBeInTheDocument();
    expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
  });

  it("shows Never when stats are present without a lastUpdated timestamp", () => {
    mockedUsePolling.mockReturnValue({
      status: "ok",
      data: { ...STATS, paused: false },
      error: null,
      lastUpdated: null,
      paused: false,
      pause: jest.fn(),
      resume: jest.fn(),
      refresh: jest.fn(),
    });

    render(<StatsPage />);

    expect(screen.getByText(/last updated:\s*never/i)).toBeInTheDocument();
    expect(screen.queryByText(/backend is currently paused/i)).not.toBeInTheDocument();
  });
});
