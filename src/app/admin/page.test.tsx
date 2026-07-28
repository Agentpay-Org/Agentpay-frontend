import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminPage from "./page";
import { ToastProvider } from "@/components/ToastProvider";

type FetchResp = {
  ok: boolean;
  status: number;
  json?: unknown;
};

function mockFetchSequence(responses: FetchResp[]) {
  const fetchMock = jest.fn<
    Promise<Response>,
    [input: RequestInfo | URL, init?: RequestInit]
  >() as unknown as jest.Mock;

  fetchMock.mockImplementation(async () => {
    const callIndex = (fetchMock as jest.Mock).mock.calls.length - 1;
    const r = responses[callIndex] ?? responses[responses.length - 1];

    return {
      ok: r.ok,
      status: r.status,
      json: async () => r.json,
    } as unknown as Response;
  });

  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock as jest.Mock;
}

afterEach(() => {
  jest.restoreAllMocks();
});

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

function openPauseConfirm() {
  fireEvent.click(screen.getByRole("button", { name: /^Pause$/i }));
}

export default function AdminPageTestShim() {
  // This file contains tests; this component is unused.
  return null;
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe("AdminPage — loading state", () => {
  it("shows a loading status message while the initial fetch is in flight", async () => {
    let resolveFirst!: (value: Response) => void;
    const firstPending = new Promise<Response>((r) => {
      resolveFirst = r;
    });

    globalThis.fetch = jest.fn().mockReturnValueOnce(firstPending) as unknown as typeof fetch;

    renderWithToast(<AdminPage />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/loading status/i)).toBeInTheDocument();

    // Neither error nor empty-state should appear during loading
    expect(screen.queryByText(/could not load/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no admin data/i)).not.toBeInTheDocument();

    // Clean up: resolve so no act() warning leaks
    await act(async () => {
      resolveFirst({
        ok: true,
        status: 200,
        json: async () => ({ paused: false }),
      } as unknown as Response);
    });
  });

  it("hides the loading message once data arrives", async () => {
    mockFetchSequence([{ ok: true, status: 200, json: { paused: false } }]);
    renderWithToast(<AdminPage />);

    await screen.findByText(/Live/i);
    expect(screen.queryByText(/loading status/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error state (polling failure, no data yet)
// ---------------------------------------------------------------------------

describe("AdminPage — error state", () => {
  it("renders the error EmptyState when the initial fetch fails", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network error")) as unknown as typeof fetch;

    renderWithToast(<AdminPage />);

    expect(await screen.findByText(/could not load admin status/i)).toBeInTheDocument();
    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });

  it("renders a keyboard-operable Retry button inside the error state", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network error")) as unknown as typeof fetch;

    renderWithToast(<AdminPage />);
    await screen.findByText(/could not load admin status/i);

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();
    // Must be a real <button> so it is keyboard reachable by default
    expect(retryBtn.tagName.toLowerCase()).toBe("button");
    expect(retryBtn).not.toBeDisabled();
  });

  it("Retry re-fetches and recovers to the live panel", async () => {
    const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>();

    fetchMock
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ paused: false }),
      } as unknown as Response);

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    renderWithToast(<AdminPage />);
    await screen.findByText(/could not load admin status/i);

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await screen.findByText(/Live/i);
    expect(screen.queryByText(/could not load/i)).not.toBeInTheDocument();
  });

  it("error state is announced to assistive tech via aria-live", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch;
    renderWithToast(<AdminPage />);

    await screen.findByText(/could not load admin status/i);

    const liveRegion = screen
      .getByText(/could not load admin status/i)
      .closest("[aria-live]");
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
  });

  it("error state is distinct from loading state", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("oops")) as unknown as typeof fetch;
    renderWithToast(<AdminPage />);

    await screen.findByText(/could not load admin status/i);

    expect(screen.queryByText(/loading status/i)).not.toBeInTheDocument();
  });

  it("error state is distinct from the live status panel", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("oops")) as unknown as typeof fetch;
    renderWithToast(<AdminPage />);

    await screen.findByText(/could not load admin status/i);

    // The toggle button (Pause / Unpause / Working…) must not appear in error state
    expect(screen.queryByRole("button", { name: /^Pause$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Unpause$/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty state (fetch ok but payload missing paused field)
// ---------------------------------------------------------------------------

describe("AdminPage — empty state", () => {
  it("renders the empty EmptyState when fetch succeeds but payload has no paused field", async () => {
    // Server returns 200 but with an empty object — no `paused` key
    mockFetchSequence([{ ok: true, status: 200, json: {} }]);
    renderWithToast(<AdminPage />);

    expect(await screen.findByText(/no admin data available/i)).toBeInTheDocument();
  });

  it("renders a Refresh button inside the empty state", async () => {
    mockFetchSequence([{ ok: true, status: 200, json: {} }]);
    renderWithToast(<AdminPage />);

    await screen.findByText(/no admin data available/i);

    const refreshBtn = screen.getByRole("button", { name: /refresh/i });
    expect(refreshBtn).toBeInTheDocument();
    expect(refreshBtn.tagName.toLowerCase()).toBe("button");
    expect(refreshBtn).not.toBeDisabled();
  });

  it("Refresh in empty state re-fetches and recovers", async () => {
    const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>();

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as unknown as Response)
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ paused: false }),
      } as unknown as Response);

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    renderWithToast(<AdminPage />);
    await screen.findByText(/no admin data available/i);

    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

    await screen.findByText(/Live/i);
    expect(screen.queryByText(/no admin data available/i)).not.toBeInTheDocument();
  });

  it("empty state is distinct from error state", async () => {
    mockFetchSequence([{ ok: true, status: 200, json: {} }]);
    renderWithToast(<AdminPage />);

    await screen.findByText(/no admin data available/i);
    expect(screen.queryByText(/could not load admin status/i)).not.toBeInTheDocument();
  });

  it("empty state is distinct from loading state", async () => {
    mockFetchSequence([{ ok: true, status: 200, json: {} }]);
    renderWithToast(<AdminPage />);

    await screen.findByText(/no admin data available/i);
    expect(screen.queryByText(/loading status/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// State exclusivity
// ---------------------------------------------------------------------------

describe("AdminPage — state exclusivity", () => {
  it("shows exactly one of: loading / error / empty / live panel at a time (live)", async () => {
    mockFetchSequence([{ ok: true, status: 200, json: { paused: false } }]);
    renderWithToast(<AdminPage />);

    await screen.findByText(/Live/i);

    expect(screen.queryByText(/loading status/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/could not load/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no admin data/i)).not.toBeInTheDocument();
  });

  it("shows exactly one of: loading / error / empty / live panel at a time (error)", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("fail")) as unknown as typeof fetch;
    renderWithToast(<AdminPage />);

    await screen.findByText(/could not load/i);

    expect(screen.queryByText(/loading status/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no admin data/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Pause$/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Accessible success state and keyboard interaction
// ---------------------------------------------------------------------------

describe("AdminPage — accessible success state", () => {
  it("exposes the live status panel with accessible roles and names", async () => {
    mockFetchSequence([{ ok: true, status: 200, json: { paused: false } }]);
    renderWithToast(<AdminPage />);

    const statusSection = await screen.findByRole("region", { name: /admin status/i });
    expect(statusSection).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Pause$/i })).toBeInTheDocument();
    expect(screen.getByText(/status:/i)).toBeInTheDocument();
  });

  it("supports keyboard-driven confirmation for the primary admin action", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetchSequence([
      { ok: true, status: 200, json: { paused: false } },
      { ok: true, status: 204 },
      { ok: true, status: 200, json: { paused: true } },
    ]);

    renderWithToast(<AdminPage />);
    const toggleButton = await screen.findByRole("button", { name: /^Pause$/i });

    toggleButton.focus();
    await user.keyboard("{Enter}");

    const dialog = await screen.findByRole("dialog", { name: /pause all writes/i });
    expect(dialog).toHaveTextContent(/disable all backend writes/i);

    await user.tab();
    await user.keyboard("{Enter}");

    await waitFor(() => {
      const calls = (fetchMock as jest.Mock).mock.calls.map((c: unknown[]) => String(c[0]));
      expect(calls.some((p) => p.includes("/api/v1/admin/pause"))).toBe(true);
    });

    expect(await screen.findByText(/Paused/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Existing pause/unpause flows (non-regression)
// ---------------------------------------------------------------------------

describe("AdminPage pause/unpause", () => {
  it("Cancel makes no call", async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, status: 200, json: { paused: false } },
    ]);

    renderWithToast(<AdminPage />);
    await screen.findByText(/Live/i);

    fireEvent.click(screen.getByRole("button", { name: /^Pause$/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fetchMock.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /^Cancel$/i }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Confirm posts correct endpoint and refreshes status", async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, status: 200, json: { paused: false } },
      { ok: true, status: 204 },
      { ok: true, status: 200, json: { paused: true } },
    ]);

    renderWithToast(<AdminPage />);
    await screen.findByText(/Live/i);

    openPauseConfirm();

    const pauseButtons = screen.getAllByRole("button", { name: /^Pause$/i });
    fireEvent.click(pauseButtons[pauseButtons.length - 1]);

    await waitFor(() => {
      const calls = (fetchMock as jest.Mock).mock.calls.map((c: unknown[]) =>
        String(c[0]),
      );
      expect(calls.some((p) => p.includes("/api/v1/admin/pause"))).toBe(true);
    });

    await screen.findByText(/Paused/i);
  });

  it("disables the toggle while the request is in flight to prevent double-submit", async () => {
    let pauseResolve!: (value: void) => void;
    const pausePromise = new Promise<void>((r) => {
      pauseResolve = r;
    });

    const fetchMock = jest.fn<
      Promise<Response>,
      [input: RequestInfo | URL, init?: RequestInit]
    >() as unknown as jest.Mock;

    fetchMock
      .mockImplementationOnce(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => ({ paused: false }),
          }) as unknown as Response,
      )
      .mockImplementationOnce(
        async () =>
          pausePromise.then(() => ({
            ok: true,
            status: 204,
            json: async () => ({}),
          })) as unknown as Response,
      )
      .mockImplementationOnce(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => ({ paused: true }),
          }) as unknown as Response,
      );

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    renderWithToast(<AdminPage />);
    await screen.findByText(/Live/i);

    openPauseConfirm();

    const pauseButtons = screen.getAllByRole("button", { name: /^Pause$/i });
    fireEvent.click(pauseButtons[pauseButtons.length - 1]);

    expect(screen.getByRole("button", { name: /^Working…$/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /^Working…$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Working…$/i }));

    await act(async () => {
      pauseResolve(undefined);
    });

    await screen.findByText(/Paused/i);

    const pauseCalls = (fetchMock as jest.Mock).mock.calls.filter(
      (c: unknown[]) => String(c[0]).includes("/api/v1/admin/pause"),
    );
    expect(pauseCalls).toHaveLength(1);
  });

  it("re-reads status after action", async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, status: 200, json: { paused: false } },
      { ok: true, status: 204 },
      { ok: true, status: 200, json: { paused: true } },
    ]);

    renderWithToast(<AdminPage />);
    await screen.findByText(/Live/i);

    openPauseConfirm();
    const pauseButtons = screen.getAllByRole("button", { name: /^Pause$/i });
    fireEvent.click(pauseButtons[pauseButtons.length - 1]);

    await waitFor(() => {
      const statusCalls = (fetchMock as jest.Mock).mock.calls
        .map((c: unknown[]) => String(c[0]))
        .filter((p) => p.includes("/api/v1/admin/status"));
      expect(statusCalls.length).toBeGreaterThanOrEqual(2);
    });

    await screen.findByText(/Paused/i);
  });

  it("keeps existing role=alert error path on request failure", async () => {
    mockFetchSequence([
      { ok: true, status: 200, json: { paused: false } },
      { ok: false, status: 500, json: { error: "internal", message: "boom" } },
    ]);

    renderWithToast(<AdminPage />);
    await screen.findByText(/Live/i);

    openPauseConfirm();
    const pauseButtons = screen.getAllByRole("button", { name: /^Pause$/i });
    fireEvent.click(pauseButtons[pauseButtons.length - 1]);

    const alerts = await screen.findAllByRole("alert");
    expect(
      alerts.some((a) => a.textContent?.toLowerCase().includes("boom")),
    ).toBe(true);
  });

  it("handles toggle while already paused (unpause flow)", async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, status: 200, json: { paused: true } },
      { ok: true, status: 204 },
      { ok: true, status: 200, json: { paused: false } },
    ]);

    renderWithToast(<AdminPage />);
    await screen.findByText(/Paused/i);

    fireEvent.click(screen.getByRole("button", { name: /^Unpause$/i }));

    fireEvent.click(
      screen.getAllByRole("button", { name: /^Resume$/i }).pop()!,
    );

    await waitFor(() => {
      const calls = (fetchMock as jest.Mock).mock.calls.map((c: unknown[]) =>
        String(c[0]),
      );
      expect(calls.some((p) => p.includes("/api/v1/admin/unpause"))).toBe(true);
    });

    await screen.findByText(/Live/i);
  });
});