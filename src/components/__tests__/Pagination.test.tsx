import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
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

  it("announces the new page when the controlled page changes", () => {
    const onChange = jest.fn();
    const { container, rerender } = render(
      <Pagination page={2} pageCount={5} onChange={onChange} />
    );
    const liveRegion = container.querySelector('[aria-live="polite"]');

    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    expect(liveRegion).toHaveClass("sr-only");
    rerender(<Pagination page={3} pageCount={5} onChange={onChange} />);
    expect(liveRegion).toHaveTextContent("Page 3 of 5");

    rerender(<Pagination page={5} pageCount={5} onChange={onChange} />);
    expect(liveRegion).toHaveTextContent("Page 5 of 5");

    rerender(<Pagination page={1} pageCount={5} onChange={onChange} />);
    expect(liveRegion).toHaveTextContent("Page 1 of 5");
  });

  it("does not retain an announcement across the single-page state", () => {
    const onChange = jest.fn();
    const { container, rerender } = render(
      <Pagination page={2} pageCount={5} onChange={onChange} />
    );

    rerender(<Pagination page={3} pageCount={5} onChange={onChange} />);
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
      "Page 3 of 5"
    );

    rerender(<Pagination page={1} pageCount={1} onChange={onChange} />);
    expect(container.firstChild).toBeNull();

    rerender(<Pagination page={1} pageCount={5} onChange={onChange} />);
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
});
