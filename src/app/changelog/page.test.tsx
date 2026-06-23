import { render, screen } from "@testing-library/react";
import ChangelogPage from "./page";
import { apiGet } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  apiGet: jest.fn(),
}));

const mockApiGet = apiGet as jest.MockedFunction<typeof apiGet>;

describe("ChangelogPage", () => {
  beforeEach(() => {
    mockApiGet.mockReset();
  });

  it("renders the shared loading status while fetching", () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));

    render(<ChangelogPage />);

    expect(mockApiGet).toHaveBeenCalledWith("/api/v1/changelog");
    expect(screen.getByRole("status")).toHaveTextContent("Loading changelog");
  });

  it("renders changelog entries on success", async () => {
    mockApiGet.mockResolvedValue({
      entries: [
        {
          version: "v1.2.0",
          date: "2026-06-23",
          notes: ["Added usage exports"],
        },
      ],
    });

    render(<ChangelogPage />);

    expect(await screen.findByRole("heading", { name: /v1.2.0/i }))
      .toBeInTheDocument();
    expect(screen.getByText("Added usage exports")).toBeInTheDocument();
  });

  it("renders an empty state when no entries are returned", async () => {
    mockApiGet.mockResolvedValue({ entries: [] });

    render(<ChangelogPage />);

    expect(await screen.findByText("No changelog entries yet"))
      .toBeInTheDocument();
    expect(screen.getByText(
      "New release notes will appear here when they are published.",
    )).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders API errors as alerts", async () => {
    mockApiGet.mockRejectedValue(new Error("failed to load changelog"));

    render(<ChangelogPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "failed to load changelog",
    );
  });
});
