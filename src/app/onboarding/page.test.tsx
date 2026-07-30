import { render, screen, waitFor } from "@testing-library/react";
import OnboardingPage from "./page";
import { apiGet } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  ...jest.requireActual("@/lib/apiClient"),
  apiGet: jest.fn(),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;

describe("OnboardingPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
  });

  it("renders a spinner while the request is pending", () => {
    apiGetMock.mockImplementation(() => new Promise(() => undefined));

    render(<OnboardingPage />);

    expect(screen.getAllByText("Loading onboarding steps").length).toBeGreaterThan(0);
  });

  it("renders onboarding step rows once loaded", async () => {
    apiGetMock.mockResolvedValue({
      steps: [
        { id: "step-1", title: "Create a service", complete: true },
        { id: "step-2", title: "Generate an API key", complete: false },
      ],
    });

    render(<OnboardingPage />);

    expect(await screen.findByText("Create a service")).toBeInTheDocument();
    expect(screen.getByText("Generate an API key")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Not started")).toBeInTheDocument();
  });

  it("renders an empty state when there are no steps", async () => {
    apiGetMock.mockResolvedValue({ steps: [] });

    render(<OnboardingPage />);

    expect(await screen.findByText("No onboarding steps yet.")).toBeInTheDocument();
  });

  it("renders an error state with a retry affordance on failure", async () => {
    apiGetMock.mockRejectedValue(new Error("network down"));

    render(<OnboardingPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("network down");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("retries the request when the retry button is clicked", async () => {
    apiGetMock.mockRejectedValueOnce(new Error("network down"));
    apiGetMock.mockResolvedValueOnce({
      steps: [{ id: "step-1", title: "Create a service", complete: true }],
    });

    render(<OnboardingPage />);

    const retryButton = await screen.findByRole("button", { name: "Try again" });
    retryButton.click();

    expect(await screen.findByText("Create a service")).toBeInTheDocument();
    await waitFor(() => expect(apiGetMock).toHaveBeenCalledTimes(2));
  });

  it("announces state changes through the aria-live status region", async () => {
    apiGetMock.mockResolvedValue({ steps: [] });

    render(<OnboardingPage />);

    const live = screen.getAllByRole("status")[0];
    expect(live).toHaveAttribute("aria-live", "polite");
    await waitFor(() => expect(live).toHaveTextContent("No onboarding steps to show."));
  });
});
