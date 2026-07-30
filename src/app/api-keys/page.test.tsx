import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ApiKeysPage from "./page";

const FAKE_KEY = "sk_live_abc123secretvalue";
const BASE_TIME = new Date("2026-06-23T12:00:00.000Z");
const mockItems = [
  {
    prefix: "abc123",
    label: "my-key",
    createdAt: Math.floor((BASE_TIME.getTime() - 60_000) / 1_000),
  },
];

function mockFetchSuccess() {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ items: mockItems }),
  } as unknown as Response);
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(BASE_TIME);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it("shows each key created-at as relative time with an absolute ISO title", async () => {
  mockFetchSuccess();
  render(<ApiKeysPage />);

  await screen.findByText("my-key");

  expect(screen.getByText("1m ago")).toBeInTheDocument();
  expect(screen.getByTitle("2026-06-23T11:59:00.000Z")).toBeInTheDocument();
});

it("shows an announced empty state when there are no API keys", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ items: [] }),
  } as unknown as Response);

  render(<ApiKeysPage />);

  // The loading indicator also uses role="status", so wait for the empty state
  // itself rather than for whichever status region happens to exist first.
  await screen.findByText("No API keys yet");
  expect(screen.getByRole("status")).toHaveTextContent("No API keys yet");
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
  expect(screen.queryByText(/Loading API keys/i)).not.toBeInTheDocument();
});

it("shows a safe placeholder when a key is missing created-at", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      items: [{ prefix: "missing", label: "missing-created", createdAt: null }],
    }),
  } as unknown as Response);

  render(<ApiKeysPage />);

  await screen.findByText("missing-created");
  expect(screen.getByTitle("—")).toHaveTextContent("—");
});

it("keeps load errors visible without showing an empty state", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
    text: async () => "server down",
  } as unknown as Response);

  render(<ApiKeysPage />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Request failed");
  expect(screen.queryByText("No API keys yet")).not.toBeInTheDocument();
});

it("does not delete immediately when Revoke is clicked", async () => {
  mockFetchSuccess();
  render(<ApiKeysPage />);
  await screen.findByText("my-key");
  const fetchMock = globalThis.fetch as jest.Mock;
  fetchMock.mockClear();

  fireEvent.click(screen.getByRole("button", { name: /^revoke$/i }));
  expect(fetchMock).not.toHaveBeenCalled();
});

it("shows confirm dialog when Revoke is clicked", async () => {
  mockFetchSuccess();
  render(<ApiKeysPage />);
  await screen.findByText("my-key");

  fireEvent.click(screen.getByRole("button", { name: /^revoke$/i }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText(/revoke api key/i)).toBeInTheDocument();
});

it("cancels without deleting when Cancel is clicked", async () => {
  mockFetchSuccess();
  render(<ApiKeysPage />);
  await screen.findByText("my-key");
  const fetchMock = globalThis.fetch as jest.Mock;
  fetchMock.mockClear();

  fireEvent.click(screen.getByRole("button", { name: /^revoke$/i }));
  fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("calls DELETE and closes dialog when confirmed", async () => {
  mockFetchSuccess();
  render(<ApiKeysPage />);
  await screen.findByText("my-key");

  // stub DELETE + reload
  (globalThis.fetch as jest.Mock)
    .mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    } as unknown as Response)
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    } as unknown as Response);

  fireEvent.click(screen.getByRole("button", { name: /^revoke$/i }));
  // click the Revoke confirm button inside the dialog
  const confirmBtn = screen.getAllByRole("button", { name: /^revoke$/i })[0];
  fireEvent.click(confirmBtn);

  await waitFor(() => {
    const calls = (globalThis.fetch as jest.Mock).mock.calls;
    expect(
      calls.some((c: string[]) => c[0].includes("/api/v1/api-keys/abc123")),
    ).toBe(true);
  });
  await screen.findByText("No API keys yet");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

// --- reveal-once panel ---

function mockFetchCreate() {
  globalThis.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    } as unknown as Response)
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ key: FAKE_KEY }),
    } as unknown as Response)
    .mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    } as unknown as Response);
}

it("shows the panel masked after key creation", async () => {
  mockFetchCreate();
  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), { target: { value: "test" } });
  fireEvent.submit(screen.getByRole("button", { name: "Create" }).closest("form")!);
  await waitFor(() => expect(screen.getByLabelText(/created api key/i)).toBeInTheDocument());
  expect(screen.getByLabelText(/created api key/i)).not.toHaveTextContent(FAKE_KEY);
  expect(screen.getByLabelText(/created api key/i)).toHaveTextContent("****");
});

it("provides an accessible reveal toggle with a state announcement", async () => {
  mockFetchCreate();
  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), { target: { value: "test" } });
  fireEvent.submit(screen.getByRole("button", { name: "Create" }).closest("form")!);
  await waitFor(() => screen.getByRole("button", { name: /show full api key/i }));

  expect(screen.getByText(/api key is hidden/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /show full api key/i }));

  expect(screen.getByLabelText(/created api key/i)).toHaveTextContent(FAKE_KEY);
  expect(screen.getByRole("button", { name: /hide full api key/i })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText(/api key is visible/i)).toBeInTheDocument();
});

it("reveals the full key when Show is clicked", async () => {
  mockFetchCreate();
  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), { target: { value: "test" } });
  fireEvent.submit(screen.getByRole("button", { name: "Create" }).closest("form")!);
  await waitFor(() => screen.getByRole("button", { name: /show full api key/i }));
  fireEvent.click(screen.getByRole("button", { name: /show full api key/i }));
  expect(screen.getByLabelText(/created api key/i)).toHaveTextContent(FAKE_KEY);
  expect(screen.getByRole("button", { name: /hide full api key/i })).toHaveAttribute("aria-pressed", "true");
});

it("hides the key again when Hide is clicked", async () => {
  mockFetchCreate();
  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), { target: { value: "test" } });
  fireEvent.submit(screen.getByRole("button", { name: "Create" }).closest("form")!);
  await waitFor(() => screen.getByRole("button", { name: /show full api key/i }));
  fireEvent.click(screen.getByRole("button", { name: /show full api key/i }));
  fireEvent.click(screen.getByRole("button", { name: /hide full api key/i }));
  expect(screen.getByLabelText(/created api key/i)).not.toHaveTextContent(FAKE_KEY);
});

it("masks very long keys without exposing the full value by default", async () => {
  const longKey = "sk_live_" + "a".repeat(80);
  globalThis.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: [] }) } as unknown as Response)
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ key: longKey }) } as unknown as Response)
    .mockResolvedValue({ ok: true, status: 200, json: async () => ({ items: [] }) } as unknown as Response);

  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), { target: { value: "test" } });
  fireEvent.submit(screen.getByRole("button", { name: "Create" }).closest("form")!);

  await waitFor(() => expect(screen.getByLabelText(/created api key/i)).toBeInTheDocument());
  expect(screen.getByLabelText(/created api key/i)).not.toHaveTextContent(longKey);
  expect(screen.getByText(/api key is hidden/i)).toBeInTheDocument();
});

it("handles rapid toggling without leaving the key exposed", async () => {
  mockFetchCreate();
  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), { target: { value: "test" } });
  fireEvent.submit(screen.getByRole("button", { name: "Create" }).closest("form")!);
  await waitFor(() => screen.getByRole("button", { name: /show full api key/i }));

  fireEvent.click(screen.getByRole("button", { name: /show full api key/i }));
  fireEvent.click(screen.getByRole("button", { name: /hide full api key/i }));
  fireEvent.click(screen.getByRole("button", { name: /show full api key/i }));
  fireEvent.click(screen.getByRole("button", { name: /hide full api key/i }));

  expect(screen.getByLabelText(/created api key/i)).not.toHaveTextContent(FAKE_KEY);
  expect(screen.getByText(/api key is hidden/i)).toBeInTheDocument();
});

it("copies the full key to clipboard", async () => {
  mockFetchCreate();
  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "test" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Create" }).closest("form")!,
  );
  await waitFor(() => screen.getByRole("button", { name: "Copy" }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
  });
  await waitFor(() =>
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(FAKE_KEY),
  );
  expect(screen.getByText(/New key/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Copied" })).toHaveAttribute(
    "aria-live",
    "polite",
  );
});

it("removes the panel when Done is clicked", async () => {
  mockFetchCreate();
  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "test" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Create" }).closest("form")!,
  );
  await waitFor(() => screen.getByRole("button", { name: /done/i }));
  fireEvent.click(screen.getByRole("button", { name: /done/i }));
  expect(screen.queryByLabelText(/created api key/i)).not.toBeInTheDocument();
});

it("handles clipboard unavailable without throwing", async () => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: undefined,
  });
  mockFetchCreate();
  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "test" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Create" }).closest("form")!,
  );
  await waitFor(() => screen.getByRole("button", { name: "Copy" }));
  await expect(
    act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    })
  ).resolves.not.toThrow();
  expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
});

it("does not show a copy action when key creation fails", async () => {
  globalThis.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    } as unknown as Response)
    .mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "creation failed",
    } as unknown as Response);

  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "test" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Create" }).closest("form")!,
  );

  expect(await screen.findByRole("alert")).toHaveTextContent("Request failed");
  expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
});

it("does not show empty state or data table while loading (loading exclusivity)", () => {
  let resolve: (val: unknown) => void = () => {};
  globalThis.fetch = jest.fn().mockReturnValue(
    new Promise((res) => {
      resolve = res;
    })
  );
  render(<ApiKeysPage />);

  // Loading owns the status region; neither the empty state, the error state,
  // nor the table may render alongside it.
  expect(screen.getByRole("status")).toHaveTextContent("Loading API keys");
  expect(screen.queryByText("No API keys yet")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();

  resolve({ ok: true, status: 200, json: async () => ({ items: [] }) });
});

it("submits a new API key via keyboard interaction (Enter key)", async () => {
  const user = userEvent.setup({ delay: null });
  mockFetchCreate();
  render(<ApiKeysPage />);
  
  const input = screen.getByLabelText("Label");
  await user.type(input, "my-new-key{Enter}");
  
  expect(await screen.findByLabelText(/created api key/i)).toBeInTheDocument();
});

// --- empty and error states ---

function mockFetchFailure(text = "server down") {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
    text: async () => text,
  } as unknown as Response);
}

it("shows a distinct error state with a retry action when the load fails", async () => {
  mockFetchFailure();
  render(<ApiKeysPage />);

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Could not load API keys");
  expect(alert).toHaveTextContent("Request failed");
  expect(
    screen.getByRole("button", { name: /try again/i }),
  ).toBeInTheDocument();

  // The error state replaces, not accompanies, the empty and loading states.
  expect(screen.queryByText("No API keys yet")).not.toBeInTheDocument();
  expect(screen.queryByText(/Loading API keys/i)).not.toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});

it("re-fetches and recovers when Retry is clicked", async () => {
  mockFetchFailure();
  render(<ApiKeysPage />);
  await screen.findByRole("button", { name: /try again/i });

  const fetchMock = globalThis.fetch as jest.Mock;
  const callsBeforeRetry = fetchMock.mock.calls.length;
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ items: mockItems }),
  } as unknown as Response);

  fireEvent.click(screen.getByRole("button", { name: /try again/i }));

  await screen.findByText("my-key");
  expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBeforeRetry);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /try again/i }),
  ).not.toBeInTheDocument();
});

it("shows the loading state again while a retry is in flight", async () => {
  mockFetchFailure();
  render(<ApiKeysPage />);
  await screen.findByRole("button", { name: /try again/i });

  let resolve: (val: unknown) => void = () => {};
  (globalThis.fetch as jest.Mock).mockReturnValue(
    new Promise((res) => {
      resolve = res;
    }),
  );

  fireEvent.click(screen.getByRole("button", { name: /try again/i }));

  expect(screen.getByRole("status")).toHaveTextContent("Loading API keys");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();

  resolve({ ok: true, status: 200, json: async () => ({ items: [] }) });
  await screen.findByText("No API keys yet");
});

it("keeps the retry keyboard-operable", async () => {
  const user = userEvent.setup({ delay: null, advanceTimers: jest.advanceTimersByTime });
  mockFetchFailure();
  render(<ApiKeysPage />);

  const retry = await screen.findByRole("button", { name: /try again/i });
  expect(retry).toHaveAttribute("type", "button");

  // Reachable by keyboard from the top of the page...
  for (let i = 0; i < 6 && !retry.matches(":focus"); i += 1) {
    await user.tab();
  }
  expect(retry).toHaveFocus();

  (globalThis.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ items: mockItems }),
  } as unknown as Response);

  // ...and activatable with Enter.
  await user.keyboard("{Enter}");
  await screen.findByText("my-key");
});

it("shows the empty state when the payload omits an items array", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
  } as unknown as Response);

  render(<ApiKeysPage />);

  await screen.findByText("No API keys yet");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});

it("shows an action error alongside the list rather than the error state", async () => {
  mockFetchSuccess();
  render(<ApiKeysPage />);
  await screen.findByText("my-key");

  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: 500,
    text: async () => "revoke failed",
  } as unknown as Response);

  fireEvent.click(screen.getByRole("button", { name: /^revoke$/i }));
  fireEvent.click(screen.getAllByRole("button", { name: /^revoke$/i })[0]);

  expect(await screen.findByRole("alert")).toHaveTextContent("Request failed");
  // A failed action must not blow away the loaded table.
  expect(screen.getByRole("table", { name: /api keys/i })).toBeInTheDocument();
  expect(
    screen.queryByText("Could not load API keys"),
  ).not.toBeInTheDocument();
});

it("shows the data table on successful load", async () => {
  mockFetchSuccess();
  render(<ApiKeysPage />);
  
  expect(await screen.findByText("my-key")).toBeInTheDocument();
  
  expect(screen.getByRole("table", { name: /api keys/i })).toBeInTheDocument();
  expect(screen.getByRole("columnheader", { name: /label/i })).toBeInTheDocument();
});

