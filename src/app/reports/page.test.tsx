import { render, screen, waitFor } from "@testing-library/react";
import ReportsPage from "./page";
import { apiGet } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  ...jest.requireActual("@/lib/apiClient"),
  apiGet: jest.fn(),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;

describe("ReportsPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
  });

  it("renders a spinner while the request is pending", () => {
    apiGetMock.mockImplementation(() => new Promise(() => undefined));

    render(<ReportsPage />);

    expect(screen.getAllByText("Loading reports").length).toBeGreaterThan(0);
  });

  it("renders report rows once loaded", async () => {
    apiGetMock.mockResolvedValue({
      reports: [
        { id: "rep-1", title: "Monthly volume", generatedAt: "2026-01-01" },
        { id: "rep-2", title: "Weekly fees", generatedAt: "2026-01-08" },
      ],
    });

    render(<ReportsPage />);

    expect(await screen.findByText("Monthly volume")).toBeInTheDocument();
    expect(screen.getByText("Weekly fees")).toBeInTheDocument();
  });

  it("renders an empty state when there are no reports", async () => {
    apiGetMock.mockResolvedValue({ reports: [] });

    render(<ReportsPage />);

    expect(await screen.findByText("No reports yet.")).toBeInTheDocument();
  });

  it("renders an error state with a retry affordance on failure", async () => {
    apiGetMock.mockRejectedValue(new Error("network down"));

    render(<ReportsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("network down");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("retries the request when the retry button is clicked", async () => {
    apiGetMock.mockRejectedValueOnce(new Error("network down"));
    apiGetMock.mockResolvedValueOnce({
      reports: [{ id: "rep-1", title: "Monthly volume", generatedAt: "2026-01-01" }],
    });

    render(<ReportsPage />);

    const retryButton = await screen.findByRole("button", { name: "Try again" });
    retryButton.click();

    expect(await screen.findByText("Monthly volume")).toBeInTheDocument();
    await waitFor(() => expect(apiGetMock).toHaveBeenCalledTimes(2));
  });

  it("announces state changes through the aria-live status region", async () => {
    apiGetMock.mockResolvedValue({ reports: [] });

    render(<ReportsPage />);

    const live = screen.getAllByRole("status")[0];
    expect(live).toHaveAttribute("aria-live", "polite");
    await waitFor(() => expect(live).toHaveTextContent("No reports to show."));
  });
});
