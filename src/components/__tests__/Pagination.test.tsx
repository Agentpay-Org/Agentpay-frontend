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

  it("disables Previous on page 1 and Next on last page", () => {
    const onChange = jest.fn();
    render(<Pagination page={1} pageCount={3} onChange={onChange} />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();
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
