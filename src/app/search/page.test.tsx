import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { apiGet } from "@/lib/apiClient";
import SearchPage from "./page";

jest.mock("@/lib/apiClient");

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;

async function advanceDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(250);
  });
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function enterSearchTerm(term: string) {
  const searchInput = screen.getByRole("searchbox", { name: /Search/i });
  fireEvent.change(searchInput, { target: { value: term } });
  await advanceDebounce();
  await flushPromises();
}

describe("SearchPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("renders the search heading and search bar", () => {
    render(<SearchPage />);

    expect(screen.getByRole("heading", { name: /Search/i })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /Search/i })).toBeInTheDocument();
  });

  it("renders an aria-live region with polite setting", () => {
    render(<SearchPage />);

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
  });

  it("does not announce results for empty query", () => {
    render(<SearchPage />);

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveTextContent("");
  });

  it("announces single result after search settles", async () => {
    apiGetMock.mockResolvedValue({
      services: [{ serviceId: "service-1", priceStroops: 100 }],
    });

    render(<SearchPage />);
    await enterSearchTerm("test");

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveTextContent('1 result for "test"');
  });

  it("announces multiple results after search settles", async () => {
    apiGetMock.mockResolvedValue({
      services: [
        { serviceId: "service-1", priceStroops: 100 },
        { serviceId: "service-2", priceStroops: 200 },
        { serviceId: "service-3", priceStroops: 300 },
      ],
    });

    render(<SearchPage />);
    await enterSearchTerm("api");

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveTextContent('3 results for "api"');
  });

  it("announces no matches when search returns empty results", async () => {
    apiGetMock.mockResolvedValue({ services: [] });

    render(<SearchPage />);
    await enterSearchTerm("nonexistent");

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveTextContent('No matches for "nonexistent"');
    expect(screen.getByText("No matches.")).toBeInTheDocument();
  });

  it("surfaces an alert when the API call fails", async () => {
    apiGetMock.mockRejectedValue(new Error("API error"));

    render(<SearchPage />);
    await enterSearchTerm("error");

    expect(screen.getByRole("alert")).toHaveTextContent("API error");
    expect(screen.queryByText("No matches.")).not.toBeInTheDocument();
  });

  it("clears live region and results when query is cleared", async () => {
    apiGetMock.mockResolvedValue({
      services: [{ serviceId: "service-1", priceStroops: 100 }],
    });

    render(<SearchPage />);
    await enterSearchTerm("test");

    expect(screen.getByText("service-1")).toBeInTheDocument();

    const searchInput = screen.getByRole("searchbox", { name: /Search/i });
    fireEvent.change(searchInput, { target: { value: "" } });
    await advanceDebounce();

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveTextContent("");
    expect(screen.queryByText("service-1")).not.toBeInTheDocument();
    expect(screen.queryByText("No matches.")).not.toBeInTheDocument();
  });

  it("renders result links when results are found", async () => {
    apiGetMock.mockResolvedValue({
      services: [
        { serviceId: "service-1", priceStroops: 100 },
        { serviceId: "service-2", priceStroops: 200 },
      ],
    });

    render(<SearchPage />);
    await enterSearchTerm("test");

    expect(screen.getByRole("link", { name: "service-1" })).toHaveAttribute(
      "href",
      "/services/service-1"
    );
    expect(screen.getByRole("link", { name: "service-2" })).toHaveAttribute(
      "href",
      "/services/service-2"
    );
    expect(screen.getAllByText(/stroops/i)).toHaveLength(2);
  });

  it("does not render results or no matches message when query is empty", () => {
    render(<SearchPage />);

    expect(screen.queryByText("No matches.")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("live region is visually hidden but accessible to screen readers", () => {
    render(<SearchPage />);

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveClass("sr-only");
  });

  it("shows searching feedback while debounce or fetch is pending", async () => {
    let resolveSearch: (value: { services: [] }) => void = () => {};
    apiGetMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSearch = resolve;
      })
    );

    render(<SearchPage />);

    const searchInput = screen.getByRole("searchbox", { name: /Search/i });
    fireEvent.change(searchInput, { target: { value: "billing" } });

    expect(screen.getByText("Searching...")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Searching services");
    expect(apiGetMock).not.toHaveBeenCalled();

    await advanceDebounce();

    expect(apiGetMock).toHaveBeenCalledWith(
      "/api/v1/services?q=billing&limit=50",
      expect.objectContaining({ signal: expect.any(Object) })
    );
    expect(screen.getByText("Searching...")).toBeInTheDocument();

    await act(async () => {
      resolveSearch({ services: [] });
    });

    await waitFor(() => {
      expect(screen.queryByText("Searching...")).not.toBeInTheDocument();
    });
  });

  it("ignores stale responses after the input changes", async () => {
    type SearchPayload = {
      services: { serviceId: string; priceStroops: number }[];
    };
    let resolveSlow: (value: SearchPayload) => void = () => {};
    let resolveFast: (value: SearchPayload) => void = () => {};

    apiGetMock.mockImplementation((path) => {
      if (String(path).includes("slow")) {
        return new Promise((resolve) => {
          resolveSlow = resolve;
        });
      }
      return new Promise((resolve) => {
        resolveFast = resolve;
      });
    });

    render(<SearchPage />);

    const searchInput = screen.getByRole("searchbox", { name: /Search/i });
    fireEvent.change(searchInput, { target: { value: "slow" } });
    await advanceDebounce();

    fireEvent.change(searchInput, { target: { value: "fast" } });

    await act(async () => {
      resolveSlow({ services: [{ serviceId: "slow-service", priceStroops: 100 }] });
    });

    expect(screen.queryByText("slow-service")).not.toBeInTheDocument();

    await advanceDebounce();

    await act(async () => {
      resolveFast({ services: [{ serviceId: "fast-service", priceStroops: 200 }] });
    });

    expect(screen.getByText("fast-service")).toBeInTheDocument();
    expect(screen.queryByText("slow-service")).not.toBeInTheDocument();
  });

  it("shows truncation note when results exceed the render cap", async () => {
    const manyServices = Array.from({ length: 101 }, (_, i) => ({
      serviceId: `svc-${i}`,
      priceStroops: i * 100,
    }));
    apiGetMock.mockResolvedValue({ services: manyServices });

    render(<SearchPage />);
    await enterSearchTerm("svc");

    await waitFor(() => {
      expect(screen.getByText("Showing first 100 of 101 results.")).toBeInTheDocument();
    });

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(100);
    expect(screen.getByText("svc-0")).toBeInTheDocument();
    expect(screen.getByText("svc-99")).toBeInTheDocument();
    expect(screen.queryByText("svc-100")).not.toBeInTheDocument();
  });

  it("does not show truncation note when results exactly equal the cap", async () => {
    const exactServices = Array.from({ length: 100 }, (_, i) => ({
      serviceId: `svc-${i}`,
      priceStroops: i * 100,
    }));
    apiGetMock.mockResolvedValue({ services: exactServices });

    render(<SearchPage />);
    await enterSearchTerm("svc");

    await waitFor(() => {
      expect(screen.getByText("svc-0")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Showing first \d+ of \d+ results\./)).not.toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(100);
  });

  it("does not show truncation note when results are below the cap", async () => {
    const fewServices = Array.from({ length: 5 }, (_, i) => ({
      serviceId: `svc-${i}`,
      priceStroops: i * 100,
    }));
    apiGetMock.mockResolvedValue({ services: fewServices });

    render(<SearchPage />);
    await enterSearchTerm("svc");

    await waitFor(() => {
      expect(screen.getByText("svc-0")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Showing first \d+ of \d+ results\./)).not.toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
  });
});
