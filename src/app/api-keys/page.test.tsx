import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from "@testing-library/react";
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
  Object.assign(navigator, {
    clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
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

  expect(await screen.findByRole("status")).toHaveTextContent(
    "No API keys yet",
  );
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});

it("shows a safe placeholder when a key has no usable created-at", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      items: [
        { prefix: "null", label: "null-created", createdAt: null },
        { prefix: "undefined", label: "undefined-created" },
        {
          prefix: "invalid",
          label: "invalid-created",
          createdAt: "not-a-timestamp",
        },
      ],
    }),
  } as unknown as Response);

  render(<ApiKeysPage />);

  await screen.findByText("invalid-created");
  expect(screen.getAllByTitle("—")).toHaveLength(3);
  screen
    .getAllByTitle("—")
    .forEach((timestamp) => expect(timestamp).toHaveTextContent("—"));
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

function mockFetchCreate(createdKey = FAKE_KEY) {
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
      json: async () => ({ key: createdKey }),
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
  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "test" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Create" }).closest("form")!,
  );
  await waitFor(() => expect(screen.getByText(/New key/i)).toBeInTheDocument());
  const panel = screen.getByRole("region", { name: /New key/i });
  expect(panel).not.toHaveTextContent(FAKE_KEY);
  expect(panel).toHaveTextContent("****");
});

it("reveals the full key when Reveal is clicked", async () => {
  mockFetchCreate();
  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "test" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Create" }).closest("form")!,
  );
  await waitFor(() => screen.getByRole("button", { name: "Reveal" }));
  fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
  expect(screen.getByRole("region", { name: /New key/i })).toHaveTextContent(
    FAKE_KEY,
  );
  expect(screen.getByRole("button", { name: "Hide" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

it("hides the key again when Hide is clicked", async () => {
  mockFetchCreate();
  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "test" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Create" }).closest("form")!,
  );
  await waitFor(() => screen.getByRole("button", { name: "Reveal" }));
  fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
  fireEvent.click(screen.getByRole("button", { name: "Hide" }));
  expect(
    screen.getByRole("region", { name: /New key/i }),
  ).not.toHaveTextContent(FAKE_KEY);
});

it("announces only the key visibility state", async () => {
  mockFetchCreate();
  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "test" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Create" }).closest("form")!,
  );

  const visibilityStatus = await screen.findByRole("status", {
    name: "API key visibility",
  });
  expect(visibilityStatus).toHaveTextContent("API key is hidden.");

  fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
  expect(visibilityStatus).toHaveTextContent("API key is visible.");
  screen
    .getAllByRole("status")
    .forEach((status) => expect(status).not.toHaveTextContent(FAKE_KEY));

  fireEvent.click(screen.getByRole("button", { name: "Hide" }));
  expect(visibilityStatus).toHaveTextContent("API key is hidden.");
});

it("keeps a very long key masked until the user reveals it", async () => {
  const longKey = `sk_live_${"x".repeat(512)}`;
  mockFetchCreate(longKey);
  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "test" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Create" }).closest("form")!,
  );

  const panel = await screen.findByRole("region", { name: /New key/i });
  expect(panel).not.toHaveTextContent(longKey);
  expect(panel).toHaveTextContent("sk_****");

  fireEvent.click(within(panel).getByRole("button", { name: "Reveal" }));
  expect(within(panel).getByText(longKey)).toBeInTheDocument();

  fireEvent.click(within(panel).getByRole("button", { name: "Hide" }));
  expect(panel).not.toHaveTextContent(longKey);
});

it("keeps the toggle and announcement in sync during rapid changes", async () => {
  mockFetchCreate();
  render(<ApiKeysPage />);
  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "test" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Create" }).closest("form")!,
  );

  const panel = await screen.findByRole("region", { name: /New key/i });
  const toggle = within(panel).getByRole("button", { name: "Reveal" });
  const visibilityStatus = within(panel).getByRole("status", {
    name: "API key visibility",
  });

  act(() => {
    for (let click = 0; click < 10; click += 1) toggle.click();
  });

  expect(toggle).toHaveAttribute("aria-pressed", "false");
  expect(toggle).toHaveTextContent("Reveal");
  expect(visibilityStatus).toHaveTextContent("API key is hidden.");
  expect(panel).not.toHaveTextContent(FAKE_KEY);

  act(() => toggle.click());
  expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(toggle).toHaveTextContent("Hide");
  expect(visibilityStatus).toHaveTextContent("API key is visible.");
  expect(panel).toHaveTextContent(FAKE_KEY);
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
  expect(screen.queryByText(/New key/i)).not.toBeInTheDocument();
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
