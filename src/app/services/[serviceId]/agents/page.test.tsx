import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ServiceAgentsPage from "./page";
import { apiGet } from "@/lib/apiClient";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

jest.mock("@/lib/apiClient", () => ({
  apiGet: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
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
const useRouterMock = useRouter as jest.Mock;
const useSearchParamsMock = useSearchParams as jest.Mock;

function agent(agentId: string, total: number) {
  return { agent: agentId, total };
}

function renderPage(serviceId = "svc-1", searchParams: Record<string, string> = {}) {
  const params = Promise.resolve({ serviceId }) as Promise<{
    serviceId: string;
  }> & {
    _value: { serviceId: string };
  };
  params._value = { serviceId };
  
  useSearchParamsMock.mockReturnValue(new URLSearchParams(searchParams));
  const routerPush = jest.fn();
  useRouterMock.mockReturnValue({ push: routerPush });

  return {
    routerPush,
    ...render(
      <Suspense>
        <ServiceAgentsPage params={params} />
      </Suspense>
    ),
  };
}

describe("ServiceAgentsPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    useRouterMock.mockReset();
    useSearchParamsMock.mockReset();
  });

  it("renders a spinner while the first top-agents page is loading", () => {
    apiGetMock.mockReturnValueOnce(new Promise(() => undefined) as never);

    renderPage("svc/one");

    expect(screen.getByRole("status")).toHaveTextContent(/Loading top agents/i);
    expect(apiGetMock).toHaveBeenCalledWith(
      "/api/v1/services/svc%2Fone/agents/top?page=1&limit=25",
    );
    expect(
      screen.queryByRole("navigation", { name: /pagination/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the empty state when the service has no agents", async () => {
    apiGetMock.mockResolvedValueOnce({
      items: [],
      page: 1,
      pageCount: 1,
    } as never);

    renderPage();

    expect(
      await screen.findByText("No agents on this service yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Agents appear here after they record usage/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /pagination/i }),
    ).not.toBeInTheDocument();
  });

  it("renders top-agent rows as encoded links on a single page", async () => {
    apiGetMock.mockResolvedValueOnce({
      items: [agent("agent/one", 42)],
      page: 1,
      pageCount: 1,
    } as never);

    renderPage();

    const agentLink = await screen.findByRole("link", { name: "agent/one" });
    expect(agentLink).toHaveAttribute("href", "/agents/agent%2Fone");
    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("42 requests")).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /pagination/i }),
    ).not.toBeInTheDocument();
  });

  it("shows pagination for multiple pages and calls router.push on Next", async () => {
    apiGetMock
      .mockResolvedValueOnce({
        items: [agent("agent-a", 10)],
        page: 1,
        pageCount: 2,
      } as never)
      .mockResolvedValueOnce({
        items: [agent("agent-b", 20)],
        page: 2,
        pageCount: 2,
      } as never);

    const { routerPush } = renderPage("svc-main", { page: "1" });

    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
    
    // Simulate navigation change in searchParams
    useSearchParamsMock.mockReturnValue(new URLSearchParams({ page: "2" }));
    
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    
    expect(routerPush).toHaveBeenCalledWith("?page=2");
  });

  it("uses the page from searchParams", async () => {
    apiGetMock.mockResolvedValueOnce({
      items: [agent("agent-b", 20)],
      page: 2,
      pageCount: 3,
    } as never);

    renderPage("svc-main", { page: "2" });

    await waitFor(() => {
        expect(apiGetMock).toHaveBeenCalledWith(
        "/api/v1/services/svc-main/agents/top?page=2&limit=25",
        );
    });
    
    expect(await screen.findByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("26.")).toBeInTheDocument();
  });

  it("surfaces backend failures as a role=alert and hides pagination", async () => {
    apiGetMock.mockRejectedValueOnce(new Error("top agents unavailable"));

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "top agents unavailable",
    );
    expect(
      screen.queryByRole("navigation", { name: /pagination/i }),
    ).not.toBeInTheDocument();
  });

  it("shows truncation note when items exceed the render cap", async () => {
    const manyAgents = Array.from({ length: 101 }, (_, i) => ({
      agent: `agent-${i}`,
      total: i * 10,
    }));
    apiGetMock.mockResolvedValueOnce({
      items: manyAgents,
      page: 1,
      pageCount: 1,
    } as never);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Showing first 100 of 101 agents.")).toBeInTheDocument();
    });

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(100);
    expect(screen.getByText("agent-0")).toBeInTheDocument();
    expect(screen.getByText("agent-99")).toBeInTheDocument();
    expect(screen.queryByText("agent-100")).not.toBeInTheDocument();
  });

  it("does not truncate at exactly the cap", async () => {
    const exactAgents = Array.from({ length: 100 }, (_, i) => ({
      agent: `agent-${i}`,
      total: i * 10,
    }));
    apiGetMock.mockResolvedValueOnce({
      items: exactAgents,
      page: 1,
      pageCount: 1,
    } as never);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("agent-0")).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/Showing first \d+ of \d+ agents\./),
    ).not.toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(100);
  });

  it("does not truncate below the cap", async () => {
    apiGetMock.mockResolvedValueOnce({
      items: [agent("small-agent", 5)],
      page: 1,
      pageCount: 1,
    } as never);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("small-agent")).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/Showing first \d+ of \d+ agents\./),
    ).not.toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
  });
});
