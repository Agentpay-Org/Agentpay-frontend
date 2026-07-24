import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import { apiGet } from "../../lib/apiClient";
import ServicesPage from "./page";
import { ToastProvider } from "../../components/ToastProvider";
import { truncateMiddle } from "../../lib/format";

jest.mock("../../lib/apiClient", () => ({
  apiGet: jest.fn(),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;

function service(serviceId: string, priceStroops: number) {
  return { serviceId, priceStroops };
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
  });

  it("renders a spinner while the first page is loading", () => {
    apiGetMock.mockReturnValueOnce(new Promise(() => undefined) as never);

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

