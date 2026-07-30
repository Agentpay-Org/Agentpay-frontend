import { render, screen, waitFor } from "@testing-library/react";
import TransactionsPage from "./page";
import { apiGet } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  ...jest.requireActual("@/lib/apiClient"),
  apiGet: jest.fn(),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;

describe("TransactionsPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
  });

  it("renders a spinner while the request is pending", () => {
    apiGetMock.mockImplementation(() => new Promise(() => undefined));

    render(<TransactionsPage />);

    expect(screen.getAllByText("Loading transactions").length).toBeGreaterThan(0);
  });

  it("renders transaction rows once loaded", async () => {
    apiGetMock.mockResolvedValue({
      transactions: [
        { id: "tx-1", status: "settled", amount: 25, createdAt: "2026-01-01T00:00:00.000Z" },
        { id: "tx-2", status: "pending", amount: 10, createdAt: "2026-01-02T00:00:00.000Z" },
      ],
    });

    render(<TransactionsPage />);

    expect(await screen.findByText("tx-1")).toBeInTheDocument();
    expect(screen.getByText("tx-2")).toBeInTheDocument();
    expect(screen.getByText("settled")).toBeInTheDocument();
  });

  it("renders an empty state when there are no transactions", async () => {
    apiGetMock.mockResolvedValue({ transactions: [] });

    render(<TransactionsPage />);

    expect(await screen.findByText("No transactions yet.")).toBeInTheDocument();
  });

  it("renders an error state with a retry affordance on failure", async () => {
    apiGetMock.mockRejectedValue(new Error("network down"));

    render(<TransactionsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("network down");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("retries the request when the retry button is clicked", async () => {
    apiGetMock.mockRejectedValueOnce(new Error("network down"));
    apiGetMock.mockResolvedValueOnce({
      transactions: [{ id: "tx-1", status: "settled", amount: 25, createdAt: "2026-01-01T00:00:00.000Z" }],
    });

    render(<TransactionsPage />);

    const retryButton = await screen.findByRole("button", { name: "Try again" });
    retryButton.click();

    expect(await screen.findByText("tx-1")).toBeInTheDocument();
    await waitFor(() => expect(apiGetMock).toHaveBeenCalledTimes(2));
  });

  it("announces state changes through the aria-live status region", async () => {
    apiGetMock.mockResolvedValue({ transactions: [] });

    render(<TransactionsPage />);

    const live = screen.getAllByRole("status")[0];
    expect(live).toHaveAttribute("aria-live", "polite");
    await waitFor(() => expect(live).toHaveTextContent("No transactions to show."));
  });
});
