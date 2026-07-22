import { render, screen } from "@testing-library/react";
import { PageSkeleton } from "../PageSkeleton";

function getSkeletonRows(container: HTMLElement) {
  return container.querySelectorAll('[aria-hidden="true"].animate-pulse');
}

describe("PageSkeleton", () => {
  it("announces loading with busy status semantics", () => {
    render(<PageSkeleton />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Loading…");
    expect(screen.getByText("Loading…")).toHaveClass("sr-only");
  });

  it("renders the default configured row count", () => {
    const { container } = render(<PageSkeleton />);

    expect(getSkeletonRows(container)).toHaveLength(3);
  });

  it("renders a custom configured row count", () => {
    const { container } = render(<PageSkeleton rows={5} />);

    expect(getSkeletonRows(container)).toHaveLength(5);
  });

  it("keeps visual skeleton rows hidden from the accessibility tree", () => {
    const { container } = render(<PageSkeleton rows={2} />);

    for (const row of Array.from(getSkeletonRows(container))) {
      expect(row).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("keeps at least one row when given an invalid row count", () => {
    const { container } = render(<PageSkeleton rows={0} />);

    expect(getSkeletonRows(container)).toHaveLength(1);
  });
});
