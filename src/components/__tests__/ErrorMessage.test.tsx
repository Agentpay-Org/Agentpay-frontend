import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorMessage } from "../ErrorMessage";

describe("ErrorMessage", () => {
  it("renders the title", () => {
    render(<ErrorMessage title="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders the detail when provided", () => {
    render(
      <ErrorMessage title="Error" detail="The backend is unavailable." />
    );
    expect(screen.getByText("The backend is unavailable.")).toBeInTheDocument();
  });

  it("does not render detail when omitted", () => {
    render(<ErrorMessage title="Error" />);
    expect(screen.queryByText("The backend is unavailable.")).not.toBeInTheDocument();
  });

  it("does not render detail when null", () => {
    render(<ErrorMessage title="Error" detail={null} />);
    expect(screen.queryByText("The backend is unavailable.")).not.toBeInTheDocument();
  });

  it("renders the requestId when provided", () => {
    render(<ErrorMessage title="Error" requestId="req-abc-123" />);
    expect(screen.getByText(/req-abc-123/)).toBeInTheDocument();
    expect(screen.getByText(/request id:/i)).toBeInTheDocument();
  });

  it("does not render requestId when omitted", () => {
    render(<ErrorMessage title="Error" />);
    expect(screen.queryByText(/request id:/i)).not.toBeInTheDocument();
  });

  it("renders a retry button when onRetry is provided", () => {
    const onRetry = jest.fn();
    render(<ErrorMessage title="Error" onRetry={onRetry} />);
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("calls onRetry when the retry button is clicked", async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    render(<ErrorMessage title="Error" onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render a retry button when onRetry is omitted", () => {
    render(<ErrorMessage title="Error" />);
    expect(
      screen.queryByRole("button", { name: /try again/i })
    ).not.toBeInTheDocument();
  });

  it("has role=\"alert\" on the container", () => {
    render(<ErrorMessage title="Error" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders all sections together", () => {
    render(
      <ErrorMessage
        title="Operation failed"
        detail="The server returned an error."
        requestId="req-999"
        onRetry={() => {}}
      />
    );
    expect(screen.getByText("Operation failed")).toBeInTheDocument();
    expect(screen.getByText("The server returned an error.")).toBeInTheDocument();
    expect(screen.getByText(/req-999/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("does not re-render when parent re-renders with unchanged props (memo)", () => {
    const onRetry = jest.fn();
    const { rerender } = render(
      <ErrorMessage title="Stable" onRetry={onRetry} />
    );

    // Rerender with the same props — memo should prevent re-render
    rerender(<ErrorMessage title="Stable" onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Stable");
  });
});