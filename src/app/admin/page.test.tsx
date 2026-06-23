import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminPage from "./page";
import { ToastProvider } from "@/components/ToastProvider";

type FetchResp = {
  ok: boolean;
  status: number;
  json?: unknown;
};

function mockFetchSequence(responses: FetchResp[]) {
  const fetchMock = jest.fn<Promise<Response>, [input: RequestInfo | URL, init?: RequestInit]>() as unknown as jest.Mock;

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
      { ok: true, status: 200, json: { paused: false } }, // initial
      { ok: true, status: 204 }, // pause
      { ok: true, status: 200, json: { paused: true } }, // refresh
    ]);

    renderWithToast(<AdminPage />);
    await screen.findByText(/Live/i);

    openPauseConfirm();

    // ConfirmDialog confirm button label is "Pause" for pause-state.
    // There are two "Pause" buttons: main toggle and dialog confirm.
    const pauseButtons = screen.getAllByRole("button", { name: /^Pause$/i });
    fireEvent.click(pauseButtons[pauseButtons.length - 1]);


    await waitFor(() => {
      const calls = (fetchMock as jest.Mock).mock.calls.map((c: unknown[]) => String(c[0]));
      expect(calls.some((p) => p.includes("/api/v1/admin/pause"))).toBe(true);
    });

    await screen.findByText(/Paused/i);
  });

  it("disables the toggle while the request is in flight to prevent double-submit", async () => {
    let pauseResolve: () => void = () => {};
    const pausePromise = new Promise<void>((r) => {
      pauseResolve = r;
    });

    const fetchMock = jest.fn<Promise<Response>, [input: RequestInfo | URL, init?: RequestInit]>() as unknown as jest.Mock;

    fetchMock
      .mockImplementationOnce(async () =>
        ({ ok: true, status: 200, json: async () => ({ paused: false }) }) as unknown as Response
      )
      .mockImplementationOnce(async () =>
        // pause request: hang until resolved
        (pausePromise.then(() => ({ ok: true, status: 204, json: async () => ({}) })) as unknown as Response)
      )
      .mockImplementationOnce(async () =>
        ({ ok: true, status: 200, json: async () => ({ paused: true }) }) as unknown as Response
      );

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    renderWithToast(<AdminPage />);
    await screen.findByText(/Live/i);

    openPauseConfirm();

    const pauseButtons = screen.getAllByRole("button", { name: /^Pause$/i });
    fireEvent.click(pauseButtons[pauseButtons.length - 1]);

    // While pending, the main toggle is disabled and shows Working…
    expect(screen.getByRole("button", { name: /^Working…$/i })).toBeDisabled();

    // Rapid extra clicks on the disabled main toggle should not call pause endpoint again.
    fireEvent.click(screen.getByRole("button", { name: /^Working…$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Working…$/i }));

    pauseResolve();

    await screen.findByText(/Paused/i);

    const pauseCalls = (fetchMock as jest.Mock).mock.calls.filter((c: unknown[]) =>
      String(c[0]).includes("/api/v1/admin/pause")
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
    expect(alerts.some((a) => a.textContent?.toLowerCase().includes("boom"))).toBe(true);

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

    // Dialog confirm label is "Resume" when paused.
    fireEvent.click(screen.getAllByRole("button", { name: /^Resume$/i }).pop()!);

    await waitFor(() => {
      const calls = (fetchMock as jest.Mock).mock.calls.map((c: unknown[]) => String(c[0]));
      expect(calls.some((p) => p.includes("/api/v1/admin/unpause"))).toBe(true);
    });

    await screen.findByText(/Live/i);
  });
});

