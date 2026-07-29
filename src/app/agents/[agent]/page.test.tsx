import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import AgentDetailPage from "./page";
import { apiGet } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  ...jest.requireActual("@/lib/apiClient"),
  apiGet: jest.fn(),
}));

jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    use: (usable: unknown) => {
      const u = usable as { _value?: unknown } | null | undefined;
      if (u && u._value) {
        return u._value;
      }
      return originalReact.use(usable);
    },
  };
});

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;

type Usage = {
  agent: string;
  items: { serviceId: string; total: number }[];
};

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function paramsFor(agent: string) {
  const params = Promise.resolve({ agent }) as Promise<{ agent: string }> & {
    _value: { agent: string };
  };
  params._value = { agent };
  return params;
}

function renderPage(agent: string) {
  return render(<AgentDetailPage params={paramsFor(agent)} />);
}

function signalFor(path: string) {
  const call = apiGetMock.mock.calls.find(([calledPath]) => calledPath === path);
  const init = call?.[1] as RequestInit | undefined;
  return init?.signal ?? undefined;
}

describe("AgentDetailPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
  });

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  it("renders a spinner while the primary usage request is pending", () => {
    apiGetMock.mockImplementation(() => new Promise(() => undefined));

    renderPage("agent-loading");

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows the heading and total-fallback while the usage request is still loading", () => {
    apiGetMock.mockImplementation(() => new Promise(() => undefined));

    renderPage("agent-loading");

    expect(
      screen.getByRole("heading", { name: "agent-loading" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Total unavailable")).toBeInTheDocument();
  });

  it("removes the spinner once the usage request resolves", async () => {
    const usage = deferred<Usage>();
    const total = deferred<{ total: number }>();

    apiGetMock.mockImplementation((path: string) => {
      if (path.endsWith("/usage")) return usage.promise as never;
      if (path.endsWith("/total")) return total.promise as never;
      return Promise.reject(new Error(`unexpected: ${path}`)) as never;
    });

    renderPage("agent-resolve");

    expect(screen.getByRole("status")).toBeInTheDocument();

    usage.resolve({
      agent: "agent-resolve",
      items: [{ serviceId: "svc", total: 5 }],
    });
    total.resolve({ total: 10 });

    expect(await screen.findByText("svc")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  it("shows EmptyState when the agent has no per-service usage", async () => {
    apiGetMock.mockImplementation((path: string) => {
      if (path.endsWith("/usage")) {
        return Promise.resolve({
          agent: "agent-empty",
          items: [],
        } satisfies Usage) as never;
      }
      if (path.endsWith("/total")) {
        return Promise.resolve({ total: 0 }) as never;
      }
      return Promise.reject(new Error(`unexpected: ${path}`)) as never;
    });

    renderPage("agent-empty");

    expect(
      await screen.findByText("No services consumed yet."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Lifetime total:/)).toHaveTextContent(
      "Lifetime total: 0 requests",
    );
  });

  it("shows EmptyState with total-unavailable when the total also fails", async () => {
    apiGetMock.mockImplementation((path: string) => {
      if (path.endsWith("/usage")) {
        return Promise.resolve({
          agent: "agent-empty-no-total",
          items: [],
        } satisfies Usage) as never;
      }
      if (path.endsWith("/total")) {
        return Promise.reject(new Error("total offline")) as never;
      }
      return Promise.reject(new Error(`unexpected: ${path}`)) as never;
    });

    renderPage("agent-empty-no-total");

    expect(
      await screen.findByText("No services consumed yet."),
    ).toBeInTheDocument();
    expect(screen.getByText("Total unavailable")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Usage error (role=alert)
  // ---------------------------------------------------------------------------

  it("surfaces usage failures as a role=alert", async () => {
    apiGetMock.mockImplementation((path: string) => {
      if (path.endsWith("/usage")) {
        return Promise.reject(new Error("Backend usage offline")) as never;
      }
      if (path.endsWith("/total")) {
        return Promise.resolve({ total: 10 }) as never;
      }
      return Promise.reject(new Error(`unexpected: ${path}`)) as never;
    });

    renderPage("agent-error");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Backend usage offline",
    );
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("refetches usage when Try again is clicked after an error", async () => {
    let usageCalls = 0;

    apiGetMock.mockImplementation((path: string) => {
      if (path.endsWith("/usage")) {
        usageCalls += 1;
        if (usageCalls === 1) {
          return Promise.reject(new Error("Backend usage offline")) as never;
        }
        return Promise.resolve({
          agent: "agent-retry",
          items: [{ serviceId: "svc-retry", total: 3 }],
        }) as never;
      }
      if (path.endsWith("/total")) {
        return Promise.resolve({ total: 10 }) as never;
      }
      return Promise.reject(new Error(`unexpected: ${path}`)) as never;
    });

    renderPage("agent-retry");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Backend usage offline",
    );

    act(() => {
      screen.getByRole("button", { name: /try again/i }).click();
    });

    expect(await screen.findByText("svc-retry")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(usageCalls).toBe(2);
  });

  it("hides the spinner after a usage error", async () => {
    apiGetMock.mockImplementation((path: string) => {
      if (path.endsWith("/usage")) {
        return Promise.reject(new Error("fail")) as never;
      }
      if (path.endsWith("/total")) {
        return Promise.resolve({ total: 10 }) as never;
      }
      return Promise.reject(new Error(`unexpected: ${path}`)) as never;
    });

    renderPage("agent-error-hide-spinner");

    await screen.findByRole("alert");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Total fallback
  // ---------------------------------------------------------------------------

  it("shows 'Total unavailable' when the total request fails with non-empty items", async () => {
    apiGetMock.mockImplementation((path: string) => {
      if (path.endsWith("/usage")) {
        return Promise.resolve({
          agent: "agent-no-total",
          items: [{ serviceId: "svc-a", total: 3 }],
        } satisfies Usage) as never;
      }
      if (path.endsWith("/total")) {
        return Promise.reject(new Error("total offline")) as never;
      }
      return Promise.reject(new Error(`unexpected: ${path}`)) as never;
    });

    renderPage("agent-no-total");

    expect(await screen.findByText("svc-a")).toBeInTheDocument();
    expect(screen.getByText("Total unavailable")).toBeInTheDocument();
    expect(screen.getByText(/Lifetime total:/)).toHaveTextContent(
      "Lifetime total: Total unavailable requests",
    );
  });

  // ---------------------------------------------------------------------------
  // Both succeed
  // ---------------------------------------------------------------------------

  it("renders usage rows and the lifetime total when both requests succeed", async () => {
    apiGetMock.mockImplementation((path: string) => {
      if (path === "/api/v1/agents/agent-alpha/usage") {
        return Promise.resolve({
          agent: "agent-alpha",
          items: [{ serviceId: "svc-1", total: 12 }],
        } satisfies Usage) as never;
      }
      if (path === "/api/v1/agents/agent-alpha/total") {
        return Promise.resolve({ total: 42 }) as never;
      }
      return Promise.reject(new Error(`unexpected path: ${path}`)) as never;
    });

    renderPage("agent-alpha");

    expect(
      await screen.findByRole("heading", { name: "agent-alpha" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("svc-1")).toBeInTheDocument();
    expect(screen.getByText("12 requests")).toBeInTheDocument();
    expect(screen.getByText(/Lifetime total:/)).toHaveTextContent(
      "Lifetime total: 42 requests",
    );
  });

  it("renders Breadcrumb navigation with a link back to the agents list", async () => {
    apiGetMock.mockImplementation((path: string) => {
      if (path.endsWith("/usage")) {
        return Promise.resolve({
          agent: "agent-bread",
          items: [],
        } satisfies Usage) as never;
      }
      if (path.endsWith("/total")) {
        return Promise.resolve({ total: 0 }) as never;
      }
      return Promise.reject(new Error(`unexpected: ${path}`)) as never;
    });

    renderPage("agent-bread");

    expect(
      await screen.findByRole("link", { name: "Agents" }),
    ).toHaveAttribute("href", "/agents");
  });

  // ---------------------------------------------------------------------------
  // Stale response guard (rapid agent switch)
  // ---------------------------------------------------------------------------

  it("ignores stale usage and total responses after a rapid agent switch", async () => {
    const alphaUsage = deferred<Usage>();
    const alphaTotal = deferred<{ total: number }>();
    const betaUsage = deferred<Usage>();
    const betaTotal = deferred<{ total: number }>();

    apiGetMock.mockImplementation((path: string) => {
      if (path === "/api/v1/agents/agent-alpha/usage") {
        return alphaUsage.promise as never;
      }
      if (path === "/api/v1/agents/agent-alpha/total") {
        return alphaTotal.promise as never;
      }
      if (path === "/api/v1/agents/agent-beta/usage") {
        return betaUsage.promise as never;
      }
      if (path === "/api/v1/agents/agent-beta/total") {
        return betaTotal.promise as never;
      }
      return Promise.reject(new Error(`unexpected path: ${path}`)) as never;
    });

    const { rerender } = renderPage("agent-alpha");

    await waitFor(() => {
      expect(signalFor("/api/v1/agents/agent-alpha/usage")).toEqual(
        expect.any(AbortSignal),
      );
      expect(
        apiGetMock.mock.calls.some(
          ([path]) => path === "/api/v1/agents/agent-alpha/total",
        ),
      ).toBe(true);
    });
    const alphaUsageSignal = signalFor(
      "/api/v1/agents/agent-alpha/usage",
    );
    expect(alphaUsageSignal?.aborted).toBe(false);

    rerender(<AgentDetailPage params={paramsFor("agent-beta")} />);

    await waitFor(() => {
      expect(signalFor("/api/v1/agents/agent-beta/usage")).toEqual(
        expect.any(AbortSignal),
      );
    });
    expect(alphaUsageSignal?.aborted).toBe(true);

    betaUsage.resolve({
      agent: "agent-beta",
      items: [{ serviceId: "svc-latest", total: 7 }],
    });
    betaTotal.resolve({ total: 70 });

    expect(await screen.findByText("svc-latest")).toBeInTheDocument();
    expect(screen.getByText("7 requests")).toBeInTheDocument();
    expect(screen.getByText(/Lifetime total:/)).toHaveTextContent(
      "Lifetime total: 70 requests",
    );

    alphaUsage.resolve({
      agent: "agent-alpha",
      items: [{ serviceId: "svc-stale", total: 99 }],
    });
    alphaTotal.resolve({ total: 990 });

    await waitFor(() => {
      expect(screen.getByText("svc-latest")).toBeInTheDocument();
      expect(screen.queryByText("svc-stale")).not.toBeInTheDocument();
      expect(screen.getByText(/Lifetime total:/)).toHaveTextContent(
        "Lifetime total: 70 requests",
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Abort on unmount
  // ---------------------------------------------------------------------------

  it("aborts the useApi usage request and avoids state updates after unmount", async () => {
    const usage = deferred<Usage>();
    const total = deferred<{ total: number }>();
    let usageSignal: AbortSignal | undefined;
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {
        /* silence React error logging */
      });

    apiGetMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path.endsWith("/usage")) {
        usageSignal = init?.signal ?? undefined;
        return usage.promise as never;
      }
      if (path.endsWith("/total")) {
        return total.promise as never;
      }
      return Promise.reject(new Error(`unexpected path: ${path}`)) as never;
    });

    const { unmount } = renderPage("agent-unmount");

    await waitFor(() => {
      expect(usageSignal).toBeDefined();
    });

    unmount();
    expect(usageSignal?.aborted).toBe(true);

    try {
      usage.resolve({ agent: "agent-unmount", items: [] });
      total.resolve({ total: 5 });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  // ---------------------------------------------------------------------------
  // Long agent identifiers
  // ---------------------------------------------------------------------------

  it("renders a very long agent id in the heading without overflow", () => {
    const longId = "a".repeat(200);
    apiGetMock.mockImplementation(() => new Promise(() => undefined));

    renderPage(longId);

    const heading = screen.getByRole("heading", { name: longId });
    expect(heading).toBeInTheDocument();
    expect(heading.className).toContain("font-mono");
  });

  it("applies font-mono to the agent id heading for all agent ids", () => {
    apiGetMock.mockImplementation(() => new Promise(() => undefined));

    renderPage("regular-agent");

    const heading = screen.getByRole("heading", { name: "regular-agent" });
    expect(heading.className).toContain("font-mono");
  });

  // ---------------------------------------------------------------------------
  // Breadcrumb always visible
  // ---------------------------------------------------------------------------

  it("renders breadcrumb during every state", () => {
    apiGetMock.mockImplementation(() => new Promise(() => undefined));

    renderPage("breadcrumb-test");

    expect(screen.getByText("Agents")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Agents" })).toHaveAttribute(
      "href",
      "/agents",
    );
    // The agent name appears in both the breadcrumb and heading
    const agentTexts = screen.getAllByText("breadcrumb-test");
    expect(agentTexts).toHaveLength(2);
  });
});
