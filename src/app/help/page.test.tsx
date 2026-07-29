import { render, screen, fireEvent } from "@testing-library/react";
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

  it("calls retry function when retry button is clicked", () => {
    const mockRetry = jest.fn();
    (useApi as jest.Mock).mockReturnValue({
      status: "error",
      error: "Internal Error",
      errorKind: "generic",
      isTimeout: false,
      isRateLimited: false,
      retryAfterMs: null,
      retry: mockRetry,
    });
    render(<HelpPage />);
    
    const retryButton = screen.getByRole("button", { name: "Try again" });
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
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

  it("memoizes to prevent needless re-renders", () => {
    (useApi as jest.Mock).mockReturnValue({ status: "loading" });
    
    const Wrapper = ({ forceRender }: { forceRender: number }) => (
      <div data-force={forceRender}>
        <HelpPage />
      </div>
    );

    const { rerender } = render(<Wrapper forceRender={1} />);
    expect((useApi as jest.Mock)).toHaveBeenCalledTimes(1);

    rerender(<Wrapper forceRender={2} />);
    // The render count (and thus useApi call count) should remain 1
    expect((useApi as jest.Mock)).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Debounced status live-region announcements
// ---------------------------------------------------------------------------

describe("HelpPage — status live region", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders a polite, atomic, visually-hidden announcer, empty on initial mount", () => {
    (useApi as jest.Mock).mockReturnValue({
      status: "ok",
      data: { topics: [{ id: "1", title: "How to use", content: "Instructions here." }] },
    });
    render(<HelpPage />);

    const announcer = screen.getByTestId("help-status-announcer");
    expect(announcer).toHaveAttribute("aria-live", "polite");
    expect(announcer).toHaveAttribute("aria-atomic", "true");
    expect(announcer).toHaveClass("sr-only");
    expect(announcer).toBeEmptyDOMElement();
  });

  // Debounce/transition behavior (success → error → empty, collapsing rapid
  // updates, not announcing the very first settled status) is covered
  // exhaustively in isolation in __tests__/useHelpStatusAnnouncement.test.tsx.
  // It can't be re-exercised through this component directly: HelpPage is
  // memoized with no props (see "memoizes to prevent needless re-renders"
  // above), so re-rendering it with a new useApi() mock return value doesn't
  // trigger a re-render the way a real prop or internal state change would.
});
