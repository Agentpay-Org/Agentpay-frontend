import { render, screen } from "@testing-library/react";
import HelpPage from "./page";
import { useApi } from "@/lib/useApi";

jest.mock("@/lib/useApi", () => ({
  useApi: jest.fn(),
}));

describe("HelpPage state rendering", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly for loading state", () => {
    (useApi as jest.Mock).mockReturnValue({ status: "loading" });
    render(<HelpPage />);
    expect(screen.getByTestId("help-loading")).toBeInTheDocument();
    expect(screen.getByText("Loading help topics")).toBeInTheDocument();
  });

  it("renders correctly for error state", () => {
    (useApi as jest.Mock).mockReturnValue({
      status: "error",
      error: "Internal Error",
      errorKind: "generic",
      isTimeout: false,
      isRateLimited: false,
      retryAfterMs: null,
      retry: jest.fn(),
    });
    render(<HelpPage />);
    expect(screen.getByTestId("help-error")).toBeInTheDocument();
    expect(screen.getByText("Failed to load help topics")).toBeInTheDocument();
    expect(screen.getByText("Internal Error")).toBeInTheDocument();
  });

  it("renders correctly for empty state", () => {
    (useApi as jest.Mock).mockReturnValue({ status: "ok", data: { topics: [] } });
    render(<HelpPage />);
    expect(screen.getByTestId("help-empty")).toBeInTheDocument();
    expect(screen.getByText("No help topics found.")).toBeInTheDocument();
  });

  it("renders correctly for success state", () => {
    (useApi as jest.Mock).mockReturnValue({
      status: "ok",
      data: {
        topics: [
          { id: "1", title: "How to use", content: "Instructions here." },
        ],
      },
    });
    render(<HelpPage />);
    expect(screen.getByTestId("help-success")).toBeInTheDocument();
    expect(screen.getByText("How to use")).toBeInTheDocument();
    expect(screen.getByText("Instructions here.")).toBeInTheDocument();
  });
});
