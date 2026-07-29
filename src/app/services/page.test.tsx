import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import { apiGet } from "../../lib/apiClient";
import ServicesPage, { sortServices } from "./page";
import { ToastProvider } from "../../components/ToastProvider";
import { truncateMiddle } from "../../lib/format";

jest.mock("../../lib/apiClient", () => ({
  apiGet: jest.fn(),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;

function service(
  serviceId: string,
  priceStroops: number,
  createdAt?: number | string | null
) {
  return { serviceId, priceStroops, createdAt };
}

function renderServicesPage() {
  return render(
    <ToastProvider>
      <ServicesPage />
    </ToastProvider>
  );
}


describe("sortServices", () => {
  function getServiceIds(
    services: Array<{ serviceId: string }> | null
  ) {
    return services?.map((item) => item.serviceId);
  }

  const sortableServices = [
    service("svc-c", 30, 300),
    service("svc-a", 10, "100"),
    service("svc-b", 20, 200),
  ];

  it("sorts services by name in ascending order", () => {
    const result = sortServices(
      sortableServices,
      "name",
      "asc"
    );

    expect(getServiceIds(result)).toEqual([
      "svc-a",
      "svc-b",
      "svc-c",
    ]);
  });

  it("sorts services by name in descending order", () => {
    const result = sortServices(
      sortableServices,
      "name",
      "desc"
    );

    expect(getServiceIds(result)).toEqual([
      "svc-c",
      "svc-b",
      "svc-a",
    ]);
  });

  it("sorts services by price in ascending order", () => {
    const result = sortServices(
      sortableServices,
      "price",
      "asc"
    );

    expect(getServiceIds(result)).toEqual([
      "svc-a",
      "svc-b",
      "svc-c",
    ]);
  });

  it("sorts services by price in descending order", () => {
    const result = sortServices(
      sortableServices,
      "price",
      "desc"
    );

    expect(getServiceIds(result)).toEqual([
      "svc-c",
      "svc-b",
      "svc-a",
    ]);
  });

  it("sorts services by creation date in ascending order", () => {
    const result = sortServices(
      sortableServices,
      "created",
      "asc"
    );

    expect(getServiceIds(result)).toEqual([
      "svc-a",
      "svc-b",
      "svc-c",
    ]);
  });

  it("sorts services by creation date in descending order", () => {
    const result = sortServices(
      sortableServices,
      "created",
      "desc"
    );

    expect(getServiceIds(result)).toEqual([
      "svc-c",
      "svc-b",
      "svc-a",
    ]);
  });

  it("keeps services with equal values in their original order", () => {
    const first = service("svc-first", 50, 100);
    const second = service("svc-second", 50, 200);
    const third = service("svc-third", 50, 300);

    const result = sortServices(
      [first, second, third],
      "price",
      "desc"
    );

    expect(result).toEqual([
      first,
      second,
      third,
    ]);
  });

  it("keeps equal creation dates in their original order", () => {
    const first = service("svc-first", 10, 200);
    const second = service("svc-second", 20, "200");
    const third = service("svc-third", 30, 200);

    const result = sortServices(
      [first, second, third],
      "created",
      "asc"
    );

    expect(result).toEqual([
      first,
      second,
      third,
    ]);
  });

  it("places services without a creation date last in ascending order", () => {
    const result = sortServices(
      [
        service("svc-missing", 10, null),
        service("svc-new", 20, 300),
        service("svc-old", 30, 100),
      ],
      "created",
      "asc"
    );

    expect(getServiceIds(result)).toEqual([
      "svc-old",
      "svc-new",
      "svc-missing",
    ]);
  });

  it("places services without a creation date last in descending order", () => {
    const result = sortServices(
      [
        service("svc-missing", 10),
        service("svc-old", 20, 100),
        service("svc-new", 30, 300),
      ],
      "created",
      "desc"
    );

    expect(getServiceIds(result)).toEqual([
      "svc-new",
      "svc-old",
      "svc-missing",
    ]);
  });

  it("keeps multiple services without creation dates stable", () => {
    const firstMissing = service("svc-first-missing", 10, null);
    const dated = service("svc-dated", 20, 100);
    const secondMissing = service("svc-second-missing", 30);

    const result = sortServices(
      [firstMissing, dated, secondMissing],
      "created",
      "asc"
    );

    expect(result).toEqual([
      dated,
      firstMissing,
      secondMissing,
    ]);
  });

  it("handles an empty services list", () => {
    const services: Array<ReturnType<typeof service>> = [];

    expect(
      sortServices(services, "name", "asc")
    ).toBe(services);
  });

  it("handles a single service", () => {
    const onlyService = service("svc-only", 25, 100);

    expect(
      sortServices([onlyService], "price", "desc")
    ).toEqual([onlyService]);
  });

  it("handles a null services value", () => {
    expect(
      sortServices(null, "created", "asc")
    ).toBeNull();
  });

  it("preserves the original list when no sort key is selected", () => {
    const services = [
      service("svc-b", 20),
      service("svc-a", 10),
    ];

    expect(
      sortServices(services, "", "asc")
    ).toBe(services);
  });
});

describe("ServicesPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    window.history.replaceState(
      null,
      "",
      "/services"
    );
  });

  it("renders a spinner while the first page is loading", () => {
    apiGetMock.mockReturnValueOnce(new Promise(() => undefined) as never);

    renderServicesPage();

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
  });

  it("does not render the empty state while loading", () => {
  apiGetMock.mockReturnValueOnce(new Promise(() => {}) as never);

  renderServicesPage();

  expect(screen.getByRole("status")).toBeInTheDocument();
  expect(
    screen.queryByText(/No services registered yet/i)
  ).not.toBeInTheDocument();
});

  it("shows the empty state with a New service action when there are no services", async () => {
    apiGetMock.mockResolvedValueOnce({
      services: [],
      page: 1,
      pageCount: 1,
    } as never);

    renderServicesPage();

    expect(await screen.findByText(/No services registered yet/i)).toBeInTheDocument();
    const newServiceLinks = screen.getAllByRole("link", { name: /new service/i });
    expect(newServiceLinks).toHaveLength(2);
    expect(newServiceLinks.some((link) => link.getAttribute("href") === "/services/new")).toBe(
      true
    );
    expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
  });

  it("renders each service row as a link and omits pagination on a single page", async () => {
    apiGetMock.mockResolvedValueOnce({
      services: [service("svc/1", 42)],
      page: 1,
      pageCount: 1,
    } as never);

    renderServicesPage();

    const rowLink = await screen.findByRole("link", { name: /svc\/1/i });
    expect(rowLink).toHaveAttribute("href", "/services/svc%2F1");
    expect(screen.getByText(/42 stroops \/ request/i)).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
  });

  it("renders services using the order selected in the URL", async () => {
    window.history.replaceState(
      null,
      "",
      "/services?sort=price&dir=asc"
    );

    apiGetMock.mockResolvedValueOnce({
      services: [
        service("svc-expensive", 300),
        service("svc-cheap", 100),
        service("svc-middle", 200),
      ],
      page: 1,
      pageCount: 1,
    } as never);

    renderServicesPage();

    await screen.findByRole("link", {
      name: /svc-cheap/i,
    });

    const serviceLinks = screen
      .getAllByRole("link")
      .filter(
        (link) =>
          link.getAttribute("href") !==
          "/services/new"
      );

    expect(
      serviceLinks.map((link) =>
        link.getAttribute("href")
      )
    ).toEqual([
      "/services/svc-cheap",
      "/services/svc-middle",
      "/services/svc-expensive",
    ]);
  });

  it("shows pagination only when there are multiple pages and refetches when Next is clicked", async () => {
    apiGetMock
      .mockResolvedValueOnce({
        services: [service("svc-a", 10)],
        page: 1,
        pageCount: 2,
      } as never)
      .mockResolvedValueOnce({
        services: [service("svc-b", 20)],
        page: 2,
        pageCount: 2,
      } as never);

    renderServicesPage();

    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /pagination/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenLastCalledWith("/api/v1/services?page=2&limit=25");
    });

    expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /svc-b/i })).toHaveAttribute(
      "href",
      "/services/svc-b"
    );
  });

  it("disables Next on the last page", async () => {
    apiGetMock.mockResolvedValueOnce({
      services: [service("svc-last", 77)],
      page: 2,
      pageCount: 2,
    } as never);

    renderServicesPage();

    expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("clamps an out-of-range page response to the server-provided page", async () => {
    apiGetMock
      .mockResolvedValueOnce({
        services: [service("svc-a", 10)],
        page: 1,
        pageCount: 2,
      } as never)
      .mockResolvedValueOnce({
        services: [service("svc-b", 20)],
        page: 1,
        pageCount: 2,
      } as never);

    renderServicesPage();

    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenLastCalledWith("/api/v1/services?page=2&limit=25");
    });

    expect(await screen.findByRole("link", { name: /svc-b/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /svc-a/i })).not.toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /svc-b/i })).toHaveAttribute(
      "href",
      "/services/svc-b"
    );
  });

  it("surfaces backend failures as a role=alert", async () => {
    apiGetMock.mockRejectedValueOnce(new Error("backend unavailable"));

    renderServicesPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load services");
  });

  describe("row affordance", () => {
    async function renderWithServices() {
      apiGetMock.mockResolvedValueOnce({
        services: [
          { serviceId: "svc-a", priceStroops: 10 },
          { serviceId: "svc-b", priceStroops: 20 },
          { serviceId: "svc/c", priceStroops: 30 },
        ],
        page: 1,
        pageCount: 1,
      } as never);
      renderServicesPage();
      await screen.findByText("svc-a");
    }

    it("each row is a single link element with the encoded detail href", async () => {
      await renderWithServices();
      const links = screen.getAllByRole("link").filter(
        (l) => l.getAttribute("href") !== "/services/new",
      );
      expect(links).toHaveLength(3);
      expect(links[0]).toHaveAttribute("href", "/services/svc-a");
      expect(links[1]).toHaveAttribute("href", "/services/svc-b");
      expect(links[2]).toHaveAttribute("href", "/services/svc%2Fc");
    });

    it("each row link wraps both the service ID and the price text", async () => {
      await renderWithServices();
      const links = screen.getAllByRole("link").filter(
        (l) => l.getAttribute("href") !== "/services/new",
      );
      links.forEach((link) => {
        expect(link.textContent).toMatch(/svc/);
        expect(link.textContent).toMatch(/stroops/);
      });
    });

    it("contains no nested interactive elements inside the row link", async () => {
      await renderWithServices();
      const links = screen.getAllByRole("link").filter(
        (l) => l.getAttribute("href") !== "/services/new",
      );
      links.forEach((link) => {
        expect(link.querySelector("a, button, input, select, textarea")).toBeNull();
      });
    });

    it("has hover background styling on the row link", async () => {
      await renderWithServices();
      const rowLink = screen.getByRole("link", { name: /svc-a/i });
      expect(rowLink.className).toContain("hover:bg-zinc-50");
    });

    it("has focus-visible outline styling on the row link", async () => {
      await renderWithServices();
      const rowLink = screen.getByRole("link", { name: /svc-a/i });
      expect(rowLink.className).toContain("focus-visible:outline");
    });

    it("is keyboard-focusable", async () => {
      await renderWithServices();
      const rowLink = screen.getByRole("link", { name: /svc-a/i });
      rowLink.focus();
      expect(document.activeElement).toBe(rowLink);
    });

    it("has rounded-lg styling on the row link", async () => {
      await renderWithServices();
      const rowLink = screen.getByRole("link", { name: /svc-a/i });
      expect(rowLink.className).toContain("rounded-lg");
    });

    it("supports keyboard navigation between rows", async () => {
      await renderWithServices();
      const links = screen.getAllByRole("link").filter(
        (l) => l.getAttribute("href") !== "/services/new",
      );
      (links[0] as HTMLAnchorElement).focus();
      expect(document.activeElement).toBe(links[0]);
      (links[1] as HTMLAnchorElement).focus();
      expect(document.activeElement).toBe(links[1]);
      (links[2] as HTMLAnchorElement).focus();
      expect(document.activeElement).toBe(links[2]);
    });
  });

  describe("Copy service ID control", () => {
    const fullServiceId = "srv_live_abc123xyz789_untruncated_very_long_identifier";
    const originalClipboard = navigator.clipboard;
    const originalExecCommand = document.execCommand;

    afterEach(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        configurable: true,
      });
      document.execCommand = originalExecCommand;
    });

    async function renderWithService(id: string = fullServiceId) {
      apiGetMock.mockResolvedValueOnce({
        services: [{ serviceId: id, priceStroops: 100 }],
        page: 1,
        pageCount: 1,
      } as never);
      renderServicesPage();
      await screen.findByText(truncateMiddle(id));
    }

    it("copies untruncated serviceId using Clipboard API and displays success toast", async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        configurable: true,
      });

      await renderWithService(fullServiceId);

      const copyBtn = screen.getByRole("button", {
        name: `Copy service ID for ${fullServiceId}`,
      });
      expect(copyBtn).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(writeText).toHaveBeenCalledWith(fullServiceId);
      expect(await screen.findByText("Service ID copied to clipboard")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("Service ID copied to clipboard");
    });

    it("executes textarea fallback and triggers success toast when Clipboard API is unavailable", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        configurable: true,
      });

      const execCommandMock = jest.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;

      await renderWithService(fullServiceId);

      const copyBtn = screen.getByRole("button", {
        name: `Copy service ID for ${fullServiceId}`,
      });

      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(execCommandMock).toHaveBeenCalledWith("copy");
      expect(await screen.findByText("Service ID copied to clipboard")).toBeInTheDocument();
    });

    it("triggers error toast when both Clipboard API and fallback fail", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        configurable: true,
      });

      document.execCommand = jest.fn().mockReturnValue(false);

      await renderWithService(fullServiceId);

      const copyBtn = screen.getByRole("button", {
        name: `Copy service ID for ${fullServiceId}`,
      });

      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(await screen.findByText("Failed to copy service ID")).toBeInTheDocument();
    });

    it("handles rapid repeated clicks gracefully without breaking state", async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        configurable: true,
      });

      await renderWithService(fullServiceId);

      const copyBtn = screen.getByRole("button", {
        name: `Copy service ID for ${fullServiceId}`,
      });

      await act(async () => {
        fireEvent.click(copyBtn);
        fireEvent.click(copyBtn);
        fireEvent.click(copyBtn);
      });

      expect(writeText).toHaveBeenCalledTimes(3);
      expect(screen.getByText("Copied")).toBeInTheDocument();
    });

    it("has accessible label, focus indicator styling, and keyboard activation support", async () => {
      await renderWithService(fullServiceId);

      const copyBtn = screen.getByRole("button", {
        name: `Copy service ID for ${fullServiceId}`,
      });

      expect(copyBtn).toHaveAttribute(
        "aria-label",
        `Copy service ID for ${fullServiceId}`
      );
      expect(copyBtn.className).toContain("focus-visible:outline");
    });
  });
});

