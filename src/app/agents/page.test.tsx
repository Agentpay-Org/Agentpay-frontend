import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { apiGet } from "../../lib/apiClient";
import AgentsPage from "./page";

jest.mock("../../lib/apiClient", () => ({
  apiGet: jest.fn(),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const STATS_FIXTURE = {
  uniqueAgents: 7,
  totalServices: 3,
  totalApiKeys: 2,
  totalRequests: 100,
  paused: false,
};

/** Build a resolved AgentsResponse payload. */
function agentsPayload(
  agents: string[],
  page = 1,
  pageCount = 1
): Promise<unknown> {
  return Promise.resolve({ agents, page, pageCount });
}

function mockByUrl({
  stats = Promise.resolve(STATS_FIXTURE),
  agents,
}: {
  stats?: Promise<unknown>;
  agents: Promise<unknown>;
}) {
  apiGetMock.mockImplementation((url: string) => {
    if (url === "/api/v1/stats") return stats as never;
    return agents as never;
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AgentsPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
  });

  // --- Loading state --------------------------------------------------------

  it("renders a spinner while the first page is loading", () => {
    mockByUrl({
      agents: new Promise(() => undefined), // never resolves
      stats: new Promise(() => undefined), // never resolves
    });

    render(<AgentsPage />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /pagination/i })
    ).not.toBeInTheDocument();
  });

  // --- Empty state ----------------------------------------------------------

  it("shows the empty state when the directory returns no agents", async () => {
    mockByUrl({ agents: agentsPayload([], 1, 1) });

    render(<AgentsPage />);

    expect(await screen.findByText(/No agents seen yet/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /pagination/i })
    ).not.toBeInTheDocument();
    // Spinner should be gone
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  // --- Single-page list with link rows -------------------------------------

  it("renders each agent as a link and omits pagination on a single page", async () => {
    mockByUrl({
      agents: agentsPayload(["agent-alpha", "agent-beta"], 1, 1),
    });

    render(<AgentsPage />);

    const linkA = await screen.findByRole("link", { name: "agent-alpha" });
    expect(linkA).toHaveAttribute("href", "/agents/agent-alpha");

    const linkB = screen.getByRole("link", { name: "agent-beta" });
    expect(linkB).toHaveAttribute("href", "/agents/agent-beta");

    expect(
      screen.queryByRole("navigation", { name: /pagination/i })
    ).not.toBeInTheDocument();
  });

  it("URL-encodes special characters in agent identifiers", async () => {
    mockByUrl({
      agents: agentsPayload(["agent/with/slashes"], 1, 1),
    });

    render(<AgentsPage />);

    const link = await screen.findByRole("link", {
      name: "agent/with/slashes",
    });
    expect(link).toHaveAttribute("href", "/agents/agent%2Fwith%2Fslashes");
  });

  it("handles very long agent identifiers without overflow", async () => {
    const longId = "a".repeat(200);
    mockByUrl({ agents: agentsPayload([longId], 1, 1) });

    render(<AgentsPage />);

    const link = await screen.findByRole("link", { name: longId });
    expect(link).toHaveAttribute("href", `/agents/${longId}`);
  });

  // --- Multi-page pagination ------------------------------------------------

  it("shows pagination when there are multiple pages", async () => {
    mockByUrl({
      agents: agentsPayload(["agent-a"], 1, 2),
    });

    render(<AgentsPage />);

    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /pagination/i })
    ).toBeInTheDocument();
  });

  it("refetches with the next page when Next is clicked", async () => {
    apiGetMock.mockImplementation((url: string) => {
      if (url === "/api/v1/stats")
        return Promise.resolve(STATS_FIXTURE) as never;
      if (url.includes("page=1"))
        return Promise.resolve({
          agents: ["agent-a"],
          page: 1,
          pageCount: 2,
        }) as never;
      if (url.includes("page=2"))
        return Promise.resolve({
          agents: ["agent-b"],
          page: 2,
          pageCount: 2,
        }) as never;
      return Promise.reject(new Error(`unmocked URL: ${url}`)) as never;
    });

    render(<AgentsPage />);

    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith(
        "/api/v1/agents?page=2&limit=25"
      );
    });

    expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "agent-b" })).toHaveAttribute(
      "href",
      "/agents/agent-b"
    );
    // Previous page row should be gone
    expect(
      screen.queryByRole("link", { name: "agent-a" })
    ).not.toBeInTheDocument();
  });

  it("disables the Next button on the last page", async () => {
    mockByUrl({ agents: agentsPayload(["agent-last"], 2, 2) });

    render(<AgentsPage />);

    expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("disables the Previous button on the first page", async () => {
    mockByUrl({ agents: agentsPayload(["agent-first"], 1, 2) });

    render(<AgentsPage />);

    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("clamps an out-of-range page response to the server-provided page", async () => {
    // Server corrects page=2 back to page=1 (e.g. data shrank between requests)
    apiGetMock.mockImplementation((url: string) => {
      if (url === "/api/v1/stats")
        return Promise.resolve(STATS_FIXTURE) as never;
      if (url.includes("page=1"))
        return Promise.resolve({
          agents: ["agent-a"],
          page: 1,
          pageCount: 2,
        }) as never;
      // Server corrects the page back to 1
      return Promise.resolve({
        agents: ["agent-a"],
        page: 1,
        pageCount: 2,
      }) as never;
    });

    render(<AgentsPage />);

    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith(
        "/api/v1/agents?page=2&limit=25"
      );
    });

    // UI follows the server-provided page, not the requested one
    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
  });

  // --- Error state ----------------------------------------------------------

  it("surfaces backend failures as a role=alert", async () => {
    mockByUrl({
      agents: Promise.reject(new Error("backend unavailable")),
    });

    render(<AgentsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "backend unavailable"
    );
    // Pagination must not appear on error
    expect(
      screen.queryByRole("navigation", { name: /pagination/i })
    ).not.toBeInTheDocument();
  });

  it("hides the spinner after an error", async () => {
    mockByUrl({
      agents: Promise.reject(new Error("oops")),
    });

    render(<AgentsPage />);

    await screen.findByRole("alert");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  // --- Stats summary --------------------------------------------------------

  it("displays the stats summary when /api/v1/stats resolves", async () => {
    mockByUrl({ agents: agentsPayload([], 1, 1) });

    render(<AgentsPage />);

    // Wait for both async effects to settle
    await screen.findByText(/No agents seen yet/i);

    const summary = await screen.findByText(/unique agent\(s\) seen across/i);
    expect(summary).toBeInTheDocument();
    expect(summary.textContent).toMatch(/7/);
    expect(summary.textContent).toMatch(/3/);
  });

  it("renders the list without a stats summary if /api/v1/stats fails", async () => {
    mockByUrl({
      stats: Promise.reject(new Error("stats error")),
      agents: agentsPayload(["agent-ok"], 1, 1),
    });

    render(<AgentsPage />);

    expect(await screen.findByRole("link", { name: "agent-ok" })).toBeInTheDocument();
    // Stats summary should simply be absent — no error banner for it
    expect(
      screen.queryByText(/unique agent\(s\) seen across/i)
    ).not.toBeInTheDocument();
    // The agents error alert should also be absent
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
