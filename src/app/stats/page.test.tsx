import { act, render, screen, waitFor } from "@testing-library/react";

import { apiGet } from "@/lib/apiClient";
import StatsPage from "./page";

jest.mock("@/lib/apiClient", () => ({
  apiGet: jest.fn(),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;

const STATS_FIXTURE = {
  totalServices: 3,
  totalApiKeys: 2,
  totalRequests: 42,
  uniqueAgents: 5,
  paused: false,
};

describe("StatsPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    apiGetMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("loads stats through the shared polling hook", async () => {
    apiGetMock.mockResolvedValue(STATS_FIXTURE);

    render(<StatsPage />);

    expect(await screen.findByText("42")).toBeInTheDocument();
    expect(apiGetMock.mock.calls[0][0]).toBe("/api/v1/stats");
    expect(apiGetMock.mock.calls[0][1]).toMatchObject({
      signal: expect.any(AbortSignal),
    });
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("API keys")).toBeInTheDocument();
    expect(screen.getByText("Requests")).toBeInTheDocument();
    expect(screen.getByText("Agents")).toBeInTheDocument();
  });

  it("polls stats again every five seconds", async () => {
    apiGetMock
      .mockResolvedValueOnce(STATS_FIXTURE)
      .mockResolvedValueOnce({ ...STATS_FIXTURE, totalRequests: 43 });

    render(<StatsPage />);

    expect(await screen.findByText("42")).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(await screen.findByText("43")).toBeInTheDocument();
    expect(apiGetMock).toHaveBeenCalledTimes(2);
  });

  it("keeps the existing alert path for polling failures", async () => {
    apiGetMock.mockRejectedValue(new Error("stats failed"));

    render(<StatsPage />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("stats failed");
  });

  it("preserves the paused backend status message", async () => {
    apiGetMock.mockResolvedValue({ ...STATS_FIXTURE, paused: true });

    render(<StatsPage />);

    expect(
      await screen.findByText(/backend is currently paused/i)
    ).toBeInTheDocument();
  });

  it("does not poll after the page unmounts", async () => {
    apiGetMock.mockResolvedValue(STATS_FIXTURE);

    const { unmount } = render(<StatsPage />);

    expect(await screen.findByText("42")).toBeInTheDocument();
    unmount();

    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledTimes(1);
    });
  });
});
