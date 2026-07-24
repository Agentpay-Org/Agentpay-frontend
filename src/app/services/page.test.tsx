import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import { apiGet } from "../../lib/apiClient";
import ServicesPage from "./page";
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
  const s: Record<string, unknown> = { serviceId, priceStroops };
  if (createdAt !== undefined) s.createdAt = createdAt;
  return s;
}

function getServiceLinks(): HTMLAnchorElement[] {
  return screen.getAllByRole("link").filter(
    (l) => l.getAttribute("href") !== "/services/new"
  ) as HTMLAnchorElement[];
}

function getHeaderButtons(): HTMLButtonElement[] {
  return screen.getAllByRole("button").filter(
    (b) =>
      b.textContent === "Name" ||
      b.textContent?.startsWith("Name") ||
      b.textContent === "Price" ||
      b.textContent?.startsWith("Price") ||
      b.textContent === "Created" ||
      b.textContent?.startsWith("Created")
  ) as HTMLButtonElement[];
}

async function renderWithServices(
  data: Record<string, unknown>[] = [
    { serviceId: "svc-c", priceStroops: 30, createdAt: 3000 },
    { serviceId: "svc-a", priceStroops: 10, createdAt: 1000 },
    { serviceId: "svc-b", priceStroops: 20, createdAt: 2000 },
  ]
) {
  apiGetMock.mockResolvedValueOnce({
    services: data,
    page: 1,
    pageCount: 1,
  } as never);
  render(<ServicesPage />);
  await screen.findByText("svc-a");
}

function renderServicesPage() {
  return render(
    <ToastProvider>
      <ServicesPage />
    </ToastProvider>
  );
}

describe("ServicesPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    window.history.replaceState(null, "", "/services");
  });

  describe("basic rendering", () => {
    it("renders a spinner while the first page is loading", () => {
      apiGetMock.mockReturnValueOnce(new Promise(() => undefined) as never);
      render(<ServicesPage />);
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(
        screen.queryByRole("navigation", { name: /pagination/i })
      ).not.toBeInTheDocument();
    });

    renderServicesPage();

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
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

  it("shows pagination only when there are multiple pages and refetches when Next is clicked", async () => {
    apiGetMock
      .mockResolvedValueOnce({
        services: [service("svc-a", 10)],
        page: 1,
        pageCount: 1,
      } as never);

      render(<ServicesPage />);

      expect(
        await screen.findByText(/No services registered yet/i)
      ).toBeInTheDocument();
      const newServiceLinks = screen.getAllByRole("link", {
        name: /new service/i,
      });
      expect(newServiceLinks).toHaveLength(2);
      expect(
        newServiceLinks.some(
          (link) => link.getAttribute("href") === "/services/new"
        )
      ).toBe(true);
      expect(
        screen.queryByRole("navigation", { name: /pagination/i })
      ).not.toBeInTheDocument();
    });

    it("renders each service row and omits pagination on a single page", async () => {
      apiGetMock.mockResolvedValueOnce({
        services: [service("svc/1", 42)],
        page: 1,
        pageCount: 1,
      } as never);

      render(<ServicesPage />);

      const rowLink = await screen.findByRole("link", { name: /svc\/1/i });
      expect(rowLink).toHaveAttribute("href", "/services/svc%2F1");
      expect(screen.getByText(/42 stroops \/ request/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("navigation", { name: /pagination/i })
      ).not.toBeInTheDocument();
    });

    it("surfaces backend failures as a role=alert", async () => {
      apiGetMock.mockRejectedValueOnce(new Error("backend unavailable"));

      render(<ServicesPage />);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "backend unavailable"
      );
    });

    it("renders table with sortable column headers", async () => {
      await renderWithServices();

      expect(
        screen.getByRole("button", { name: /^Name/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Price/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Created/ })
      ).toBeInTheDocument();
    });
  });

  describe("pagination", () => {
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

      render(<ServicesPage />);

      expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
      expect(
        screen.getByRole("navigation", { name: /pagination/i })
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(apiGetMock).toHaveBeenLastCalledWith(
          "/api/v1/services?page=2&limit=25"
        );
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

      render(<ServicesPage />);

      expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(apiGetMock).toHaveBeenLastCalledWith(
          "/api/v1/services?page=2&limit=25"
        );
      });

      expect(
        await screen.findByRole("link", { name: /svc-b/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /svc-a/i })
      ).not.toBeInTheDocument();
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /svc-b/i })).toHaveAttribute(
        "href",
        "/services/svc-b"
      );
    });
  });

  describe("sorting", () => {
    it("preserves backend order when no sort is selected", async () => {
      await renderWithServices([
        service("svc-b", 20),
        service("svc-c", 10),
        service("svc-a", 30),
      ]);

    renderServicesPage();

    it("sorts by name ascending when Name header is clicked", async () => {
      await renderWithServices();

      fireEvent.click(screen.getByRole("button", { name: /^Name/ }));

      const links = getServiceLinks();
      expect(links[0]).toHaveAttribute("href", "/services/svc-a");
      expect(links[1]).toHaveAttribute("href", "/services/svc-b");
      expect(links[2]).toHaveAttribute("href", "/services/svc-c");
    });

    it("sorts by name descending when Name header is clicked twice", async () => {
      await renderWithServices();

      fireEvent.click(screen.getByRole("button", { name: /^Name/ }));
      fireEvent.click(screen.getByRole("button", { name: /^Name/ }));

      const links = getServiceLinks();
      expect(links[0]).toHaveAttribute("href", "/services/svc-c");
      expect(links[1]).toHaveAttribute("href", "/services/svc-b");
      expect(links[2]).toHaveAttribute("href", "/services/svc-a");
    });

    it("sorts by price ascending when Price header is clicked", async () => {
      await renderWithServices();

      fireEvent.click(screen.getByRole("button", { name: /^Price/ }));

      const links = getServiceLinks();
      expect(links[0]).toHaveAttribute("href", "/services/svc-a");
      expect(links[1]).toHaveAttribute("href", "/services/svc-b");
      expect(links[2]).toHaveAttribute("href", "/services/svc-c");
    });

    it("sorts by price descending when Price header is clicked twice", async () => {
      await renderWithServices();

      fireEvent.click(screen.getByRole("button", { name: /^Price/ }));
      fireEvent.click(screen.getByRole("button", { name: /^Price/ }));

      const links = getServiceLinks();
      expect(links[0]).toHaveAttribute("href", "/services/svc-c");
      expect(links[1]).toHaveAttribute("href", "/services/svc-b");
      expect(links[2]).toHaveAttribute("href", "/services/svc-a");
    });

    it("sorts by created ascending when Created header is clicked", async () => {
      await renderWithServices();

      fireEvent.click(screen.getByRole("button", { name: /^Created/ }));

      const links = getServiceLinks();
      expect(links[0]).toHaveAttribute("href", "/services/svc-a");
      expect(links[1]).toHaveAttribute("href", "/services/svc-b");
      expect(links[2]).toHaveAttribute("href", "/services/svc-c");
    });

    it("sorts by created descending when Created header is clicked twice", async () => {
      await renderWithServices();

      fireEvent.click(screen.getByRole("button", { name: /^Created/ }));
      fireEvent.click(screen.getByRole("button", { name: /^Created/ }));

      const links = getServiceLinks();
      expect(links[0]).toHaveAttribute("href", "/services/svc-c");
      expect(links[1]).toHaveAttribute("href", "/services/svc-b");
      expect(links[2]).toHaveAttribute("href", "/services/svc-a");
    });

    it("switches sort column and resets to ascending when a different header is clicked", async () => {
      await renderWithServices();

      fireEvent.click(screen.getByRole("button", { name: /^Price/ }));
      fireEvent.click(screen.getByRole("button", { name: /^Price/ }));
      fireEvent.click(screen.getByRole("button", { name: /^Name/ }));

      const links = getServiceLinks();
      expect(links[0]).toHaveAttribute("href", "/services/svc-a");
      expect(links[1]).toHaveAttribute("href", "/services/svc-b");
      expect(links[2]).toHaveAttribute("href", "/services/svc-c");
    });

    it("sets aria-sort to ascending on the active Name header", async () => {
      await renderWithServices();
      fireEvent.click(screen.getByRole("button", { name: /^Name/ }));

      const th = screen
        .getByRole("button", { name: /^Name/ })
        .closest("th");
      expect(th).toHaveAttribute("aria-sort", "ascending");
    });

    it("sets aria-sort to descending on the active Price header after two clicks", async () => {
      await renderWithServices();
      fireEvent.click(screen.getByRole("button", { name: /^Price/ }));
      fireEvent.click(screen.getByRole("button", { name: /^Price/ }));

      const th = screen
        .getByRole("button", { name: /^Price/ })
        .closest("th");
      expect(th).toHaveAttribute("aria-sort", "descending");
    });

    it("sets aria-sort to none on inactive column headers", async () => {
      await renderWithServices();
      fireEvent.click(screen.getByRole("button", { name: /^Name/ }));

      const priceTh = screen
        .getByRole("button", { name: /^Price/ })
        .closest("th");
      expect(priceTh).toHaveAttribute("aria-sort", "none");
    });

    it("shows ascending indicator on active column", async () => {
      await renderWithServices();
      fireEvent.click(screen.getByRole("button", { name: /^Name/ }));

      const button = screen.getByRole("button", { name: /^Name/ });
      expect(button.textContent).toMatch(/\u25B2/);
    });

    it("shows descending indicator on active column after two clicks", async () => {
      await renderWithServices();
      fireEvent.click(screen.getByRole("button", { name: /^Name/ }));
      fireEvent.click(screen.getByRole("button", { name: /^Name/ }));

      const button = screen.getByRole("button", { name: /^Name/ });
      expect(button.textContent).toMatch(/\u25BC/);
    });

    it("does not show indicator on inactive columns", async () => {
      await renderWithServices();
      fireEvent.click(screen.getByRole("button", { name: /^Name/ }));

      const priceButton = screen.getByRole("button", { name: /^Price/ });
      expect(priceButton.textContent).not.toMatch(/[\u25B2\u25BC]/);
    });
  });

  describe("URL persistence", () => {
    it("updates URL search params when sorting", async () => {
      await renderWithServices();

      fireEvent.click(screen.getByRole("button", { name: /^Price/ }));

      expect(window.location.search).toContain("sort=price");
      expect(window.location.search).toContain("dir=asc");
    });

    it("reads initial sort from URL on mount", async () => {
      window.history.replaceState(
        null,
        "",
        "/services?sort=price&dir=desc"
      );

      const data = [
        service("svc-a", 10, 1000),
        service("svc-b", 20, 2000),
        service("svc-c", 30, 3000),
      ];
      apiGetMock.mockResolvedValueOnce({
        services: data,
        page: 1,
        pageCount: 1,
      } as never);
      render(<ServicesPage />);
      await screen.findByText("svc-c");

    renderServicesPage();

    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenLastCalledWith("/api/v1/services?page=2&limit=25");
    });

    it("falls back to no sort when URL has invalid sort key", async () => {
      window.history.replaceState(
        null,
        "",
        "/services?sort=invalid&dir=asc"
      );

      const data = [
        service("svc-b", 20),
        service("svc-a", 10),
        service("svc-c", 30),
      ];
      apiGetMock.mockResolvedValueOnce({
        services: data,
        page: 1,
        pageCount: 1,
      } as never);
      render(<ServicesPage />);
      await screen.findByText("svc-b");

      const links = getServiceLinks();
      expect(links[0]).toHaveAttribute("href", "/services/svc-b");
      expect(links[1]).toHaveAttribute("href", "/services/svc-a");
      expect(links[2]).toHaveAttribute("href", "/services/svc-c");
    });

    it("defaults to asc when URL has invalid sort direction", async () => {
      window.history.replaceState(
        null,
        "",
        "/services?sort=name&dir=invalid"
      );

      const data = [
        service("svc-c", 30),
        service("svc-a", 10),
        service("svc-b", 20),
      ];
      apiGetMock.mockResolvedValueOnce({
        services: data,
        page: 1,
        pageCount: 1,
      } as never);
      render(<ServicesPage />);
      await screen.findByText("svc-c");

      const links = getServiceLinks();
      expect(links[0]).toHaveAttribute("href", "/services/svc-a");
      expect(links[1]).toHaveAttribute("href", "/services/svc-b");
      expect(links[2]).toHaveAttribute("href", "/services/svc-c");
    });
  });

  describe("stable sort", () => {
    it("preserves original order for services with equal names", async () => {
      const data = [
        { serviceId: "svc-a", priceStroops: 30, createdAt: 3000 },
        { serviceId: "svc-a", priceStroops: 10, createdAt: 1000 },
        { serviceId: "svc-a", priceStroops: 20, createdAt: 2000 },
      ];
      apiGetMock.mockResolvedValueOnce({
        services: data,
        page: 1,
        pageCount: 1,
      } as never);
      render(<ServicesPage />);
      await screen.findByText(/30 stroops/);

    renderServicesPage();

      const links = getServiceLinks();
      expect(links).toHaveLength(3);
      const prices = links.map((l) =>
        l.closest("tr")!.querySelectorAll("td")[1].textContent!.trim()
      );
      expect(prices[0]).toBe("30 stroops / request");
      expect(prices[1]).toBe("10 stroops / request");
      expect(prices[2]).toBe("20 stroops / request");
    });

    it("preserves original order for services with equal prices", async () => {
      const data = [
        { serviceId: "svc-c", priceStroops: 10, createdAt: 3000 },
        { serviceId: "svc-a", priceStroops: 10, createdAt: 1000 },
        { serviceId: "svc-b", priceStroops: 10, createdAt: 2000 },
      ];
      apiGetMock.mockResolvedValueOnce({
        services: data,
        page: 1,
        pageCount: 1,
      } as never);
      render(<ServicesPage />);
      await screen.findByText("svc-c");

      fireEvent.click(screen.getByRole("button", { name: /^Price/ }));

      const links = getServiceLinks();
      expect(links[0]).toHaveAttribute("href", "/services/svc-c");
      expect(links[1]).toHaveAttribute("href", "/services/svc-a");
      expect(links[2]).toHaveAttribute("href", "/services/svc-b");
    });
  });

  describe("createdAt edge cases", () => {
    it("displays em-dash for services without createdAt", async () => {
      await renderWithServices([
        service("svc-a", 10),
        service("svc-b", 20),
      ]);

      const cells = screen.getAllByText("\u2014");
      expect(cells).toHaveLength(2);
    });

    it("sorts null createdAt values to the end when sorting ascending", async () => {
      await renderWithServices([
        service("svc-b", 20, 2000),
        service("svc-a", 10, null),
        service("svc-c", 30, 1000),
      ]);

      fireEvent.click(screen.getByRole("button", { name: /^Created/ }));

      const links = getServiceLinks();
      expect(links[0]).toHaveAttribute("href", "/services/svc-c");
      expect(links[1]).toHaveAttribute("href", "/services/svc-b");
      expect(links[2]).toHaveAttribute("href", "/services/svc-a");
    });

    it("sorts null createdAt values to the end when sorting descending", async () => {
      await renderWithServices([
        service("svc-b", 20, 2000),
        service("svc-a", 10, null),
        service("svc-c", 30, 1000),
      ]);

      fireEvent.click(screen.getByRole("button", { name: /^Created/ }));
      fireEvent.click(screen.getByRole("button", { name: /^Created/ }));

      const links = getServiceLinks();
      expect(links[0]).toHaveAttribute("href", "/services/svc-b");
      expect(links[1]).toHaveAttribute("href", "/services/svc-c");
      expect(links[2]).toHaveAttribute("href", "/services/svc-a");
    });
  });

  describe("row affordance", () => {
    async function renderWithRowServices() {
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

    it("each row has a single link element with the encoded detail href", async () => {
      await renderWithRowServices();
      const links = getServiceLinks();
      expect(links).toHaveLength(3);
      expect(links[0]).toHaveAttribute("href", "/services/svc-a");
      expect(links[1]).toHaveAttribute("href", "/services/svc-b");
      expect(links[2]).toHaveAttribute("href", "/services/svc%2Fc");
    });

    it("contains no nested interactive elements inside the row link", async () => {
      await renderWithRowServices();
      const links = getServiceLinks();
      links.forEach((link) => {
        expect(
          link.querySelector("a, button, input, select, textarea")
        ).toBeNull();
      });
    });

    it("has hover background styling on each table row", async () => {
      await renderWithRowServices();
      const rows = document.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        expect(row.className).toContain("hover:bg-zinc-50");
      });
    });

    it("has focus-visible outline styling on the row link", async () => {
      await renderWithRowServices();
      const rowLink = screen.getByRole("link", { name: /svc-a/i });
      expect(rowLink.className).toContain("focus-visible:outline");
    });

    it("is keyboard-focusable", async () => {
      await renderWithRowServices();
      const rowLink = screen.getByRole("link", { name: /svc-a/i });
      rowLink.focus();
      expect(document.activeElement).toBe(rowLink);
    });

    it("has rounded-lg styling on the row link", async () => {
      await renderWithRowServices();
      const rowLink = screen.getByRole("link", { name: /svc-a/i });
      expect(rowLink.className).toContain("rounded-lg");
    });

    it("supports keyboard navigation between rows", async () => {
      await renderWithRowServices();
      const links = getServiceLinks();
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

      expect(await screen.findByRole("alert")).toHaveTextContent("Failed to copy service ID");
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

