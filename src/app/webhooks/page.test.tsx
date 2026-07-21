import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import WebhooksPage from "./page";

const NOW = Date.UTC(2024, 0, 1, 12, 0, 0);
const VALID_CREATED_AT = NOW - 2 * 60 * 60 * 1000;
const mockItems = [
  { id: "wh_1", url: "https://example.com/hook", events: ["usage.recorded"], createdAt: VALID_CREATED_AT },
];

type MockWebhook = {
  id: string;
  url: string;
  events: string[];
  createdAt?: number | null;
};

function mockFetchSuccess(items: MockWebhook[] = mockItems) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ items }),
  } as unknown as Response);
}

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(NOW);
});

afterEach(() => jest.restoreAllMocks());

it("renders createdAt as relative time with a valid ISO dateTime and absolute title", async () => {
  mockFetchSuccess();
  render(<WebhooksPage />);

  const time = await screen.findByText("2h ago");
  const expectedIso = new Date(VALID_CREATED_AT).toISOString();

  expect(time.tagName).toBe("TIME");
  expect(time).toHaveAttribute("dateTime", expectedIso);
  expect(time).toHaveAttribute("title", expectedIso);
  expect(Number.isNaN(Date.parse(time.getAttribute("dateTime")!))).toBe(false);
});

it("keeps the webhook row rendering when createdAt is missing", async () => {
  mockFetchSuccess([{ id: "wh_missing", url: "https://example.com/missing", events: ["usage.settled"] }]);
  render(<WebhooksPage />);

  expect(await screen.findByText("https://example.com/missing")).toBeInTheDocument();
  expect(screen.getByText("usage.settled")).toBeInTheDocument();
  expect(screen.queryByText(/Registered/i)).not.toBeInTheDocument();
});

it("renders zero createdAt as a valid very old timestamp", async () => {
  mockFetchSuccess([{ id: "wh_old", url: "https://example.com/old", events: ["usage.recorded"], createdAt: 0 }]);
  render(<WebhooksPage />);

  await screen.findByText("https://example.com/old");
  const time = screen.getByText(/d ago$/i);

  expect(time.tagName).toBe("TIME");
  expect(time).toHaveAttribute("dateTime", "1970-01-01T00:00:00.000Z");
  expect(time).toHaveAttribute("title", "1970-01-01T00:00:00.000Z");
});

it("does not delete immediately when Remove is clicked", async () => {
  mockFetchSuccess();
  render(<WebhooksPage />);
  await screen.findByText("https://example.com/hook");
  const fetchMock = globalThis.fetch as jest.Mock;
  fetchMock.mockClear();

  fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
  expect(fetchMock).not.toHaveBeenCalled();
});

it("shows confirm dialog when Remove is clicked", async () => {
  mockFetchSuccess();
  render(<WebhooksPage />);
  await screen.findByText("https://example.com/hook");

  fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText(/remove webhook/i)).toBeInTheDocument();
});

it("cancels without deleting when Cancel is clicked", async () => {
  mockFetchSuccess();
  render(<WebhooksPage />);
  await screen.findByText("https://example.com/hook");
  const fetchMock = globalThis.fetch as jest.Mock;
  fetchMock.mockClear();

  fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
  fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("calls DELETE and closes dialog when confirmed", async () => {
  mockFetchSuccess();
  render(<WebhooksPage />);
  await screen.findByText("https://example.com/hook");

  // stub DELETE + reload
  (globalThis.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) } as unknown as Response)
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: [] }) } as unknown as Response);

  fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
  const dialog = screen.getByRole("dialog");
  const confirmBtn = within(dialog).getByRole("button", { name: /^remove$/i });
  fireEvent.click(confirmBtn);

  await waitFor(() => {
    const calls = (globalThis.fetch as jest.Mock).mock.calls;
    expect(calls.some((c: string[]) => c[0].includes("/api/v1/webhooks/wh_1"))).toBe(true);
  });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("registers a webhook with trimmed events and reloads the list", async () => {
  globalThis.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: [] }) } as unknown as Response)
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) } as unknown as Response)
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: mockItems }) } as unknown as Response);

  render(<WebhooksPage />);

  fireEvent.change(screen.getByPlaceholderText("https://example.com/agentpay-hook"), {
    target: { value: "https://example.com/new" },
  });
  fireEvent.change(screen.getByDisplayValue("usage.recorded,usage.settled"), {
    target: { value: "usage.recorded, usage.settled, " },
  });
  fireEvent.click(screen.getByRole("button", { name: /register/i }));

  await screen.findByText("https://example.com/hook");
  expect(globalThis.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/v1/webhooks"),
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ url: "https://example.com/new", events: ["usage.recorded", "usage.settled"] }),
    })
  );
});

it("shows create errors without dropping the existing row", async () => {
  globalThis.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: mockItems }) } as unknown as Response)
    .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ message: "bad webhook" }) } as unknown as Response);

  render(<WebhooksPage />);
  await screen.findByText("https://example.com/hook");
  fireEvent.change(screen.getByPlaceholderText("https://example.com/agentpay-hook"), {
    target: { value: "https://example.com/new" },
  });
  fireEvent.click(screen.getByRole("button", { name: /register/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent("bad webhook");
  expect(screen.getByText("https://example.com/hook")).toBeInTheDocument();
});

it("shows load errors", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
    json: async () => ({ message: "load failed" }),
  } as unknown as Response);

  render(<WebhooksPage />);

  expect(await screen.findByRole("alert")).toHaveTextContent("load failed");
});

it("renders unsafe URLs as text", async () => {
  mockFetchSuccess([{ id: "wh_bad_url", url: "javascript:alert(1)", events: ["usage.recorded"], createdAt: VALID_CREATED_AT }]);
  render(<WebhooksPage />);

  expect(await screen.findByText("javascript:alert(1)")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "javascript:alert(1)" })).not.toBeInTheDocument();
});

it("shows delete errors after confirmation", async () => {
  mockFetchSuccess();
  render(<WebhooksPage />);
  await screen.findByText("https://example.com/hook");

  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: 500,
    json: async () => ({ message: "delete failed" }),
  } as unknown as Response);

  fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
  fireEvent.click(screen.getAllByRole("button", { name: /^remove$/i })[0]);

  expect(await screen.findByRole("alert")).toHaveTextContent("delete failed");
});
