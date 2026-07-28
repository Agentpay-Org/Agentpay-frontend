import { act, render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "../Pagination";

function settle() {
  act(() => {
    jest.advanceTimersByTime(300);
  });
}

describe("Pagination", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders nothing when there is only one page", () => {
    const onChange = jest.fn();
    const { container } = render(
      <Pagination page={1} pageCount={1} onChange={onChange} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not announce the current page on initial render", () => {
    const { container } = render(
      <Pagination page={2} pageCount={5} onChange={jest.fn()} />
    );

    expect(
      container.querySelector('[aria-live="polite"]')
    ).toBeEmptyDOMElement();
  });

  it("does not announce before the debounce window elapses", () => {
    const onChange = jest.fn();
    const { container, rerender } = render(
      <Pagination page={2} pageCount={5} onChange={onChange} />
    );
    const liveRegion = container.querySelector('[aria-live="polite"]');

    rerender(<Pagination page={3} pageCount={5} onChange={onChange} />);
    expect(liveRegion).toBeEmptyDOMElement();

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(liveRegion).toBeEmptyDOMElement();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(liveRegion).toHaveTextContent("Page 3 of 5");
  });

  it("announces the settled page after the controlled page changes", () => {
    const onChange = jest.fn();
    const { container, rerender } = render(
      <Pagination page={2} pageCount={5} onChange={onChange} />
    );
    const liveRegion = container.querySelector('[aria-live="polite"]');

    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    expect(liveRegion).toHaveClass("sr-only");

    rerender(<Pagination page={3} pageCount={5} onChange={onChange} />);
    settle();
    expect(liveRegion).toHaveTextContent("Page 3 of 5");

    rerender(<Pagination page={5} pageCount={5} onChange={onChange} />);
    settle();
    expect(liveRegion).toHaveTextContent("Page 5 of 5");

    rerender(<Pagination page={1} pageCount={5} onChange={onChange} />);
    settle();
    expect(liveRegion).toHaveTextContent("Page 1 of 5");
  });

  it("collapses rapid successive page changes into one announcement", () => {
    const onChange = jest.fn();
    const { container, rerender } = render(
      <Pagination page={1} pageCount={5} onChange={onChange} />
    );
    const liveRegion = container.querySelector('[aria-live="polite"]');

    // Fire several changes in quick succession, each well inside the 300ms
    // debounce window — only the final, settled page should be announced.
    rerender(<Pagination page={2} pageCount={5} onChange={onChange} />);
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender(<Pagination page={3} pageCount={5} onChange={onChange} />);
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender(<Pagination page={4} pageCount={5} onChange={onChange} />);

    expect(liveRegion).toBeEmptyDOMElement();
    settle();
    expect(liveRegion).toHaveTextContent("Page 4 of 5");
  });

  it("does not retain an announcement across the single-page state", () => {
    const onChange = jest.fn();
    const { container, rerender } = render(
      <Pagination page={2} pageCount={5} onChange={onChange} />
    );

    rerender(<Pagination page={3} pageCount={5} onChange={onChange} />);
    settle();
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
      "Page 3 of 5"
    );

    rerender(<Pagination page={1} pageCount={1} onChange={onChange} />);
    settle();
    expect(container.firstChild).toBeNull();

    rerender(<Pagination page={1} pageCount={5} onChange={onChange} />);
    settle();
    expect(
      container.querySelector('[aria-live="polite"]')
    ).toBeEmptyDOMElement();
  });

  it("disables Previous on page 1 and Next on last page", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <Pagination page={1} pageCount={3} onChange={onChange} />
    );
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();

    rerender(<Pagination page={3} pageCount={3} onChange={onChange} />);
    expect(screen.getByRole("button", { name: /previous/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("calls onChange with the next page on click", () => {
    const onChange = jest.fn();
    render(<Pagination page={2} pageCount={5} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("calls onChange(1) when Previous is clicked on page 2", () => {
    const onChange = jest.fn();
    render(<Pagination page={2} pageCount={3} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("shows a loading indicator instead of the nav controls", () => {
    render(<Pagination page={1} pageCount={5} onChange={jest.fn()} loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading page");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("shows the loading indicator even when pageCount is 1", () => {
    render(<Pagination page={1} pageCount={1} onChange={jest.fn()} loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading page");
  });

  it("shows an error state with a retry action instead of the nav controls", () => {
    const onRetry = jest.fn();
    render(
      <Pagination
        page={1}
        pageCount={5}
        onChange={jest.fn()}
        error="Network request failed"
        onRetry={onRetry}
      />
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Failed to load page");
    expect(alert).toHaveTextContent("Network request failed");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows an error state without a retry button when onRetry is omitted", () => {
    render(
      <Pagination
        page={1}
        pageCount={5}
        onChange={jest.fn()}
        error="Network request failed"
      />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /try again/i })
    ).not.toBeInTheDocument();
  });

  it("shows the error state even when pageCount is 1", () => {
    render(
      <Pagination page={1} pageCount={1} onChange={jest.fn()} error="Oops" />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("prioritizes the error state over loading when both are set", () => {
    render(
      <Pagination
        page={1}
        pageCount={5}
        onChange={jest.fn()}
        loading
        error="Oops"
      />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("the loading state never also renders the error or nav states", () => {
    render(<Pagination page={1} pageCount={5} onChange={jest.fn()} loading />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("the error state never also renders the loading or nav states", () => {
    render(
      <Pagination page={1} pageCount={5} onChange={jest.fn()} error="Oops" />
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("reaches Previous and Next by keyboard and activates them with Enter", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onChange = jest.fn();
    render(<Pagination page={2} pageCount={3} onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole("button", { name: /previous/i })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(1);

    await user.tab();
    expect(screen.getByRole("button", { name: /next/i })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("skips the disabled Previous button when tabbing on page 1", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Pagination page={1} pageCount={3} onChange={jest.fn()} />);

    await user.tab();
    expect(screen.getByRole("button", { name: /next/i })).toHaveFocus();
  });

  it("reaches and activates the retry button by keyboard", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onRetry = jest.fn();
    render(
      <Pagination
        page={1}
        pageCount={5}
        onChange={jest.fn()}
        error="Oops"
        onRetry={onRetry}
      />
    );

    await user.tab();
    expect(screen.getByRole("button", { name: /try again/i })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
