import { render, screen } from "@testing-library/react";
import { StatusDot } from "../StatusDot";

describe("StatusDot", () => {
  it.each([
    ["ok", "Operational"],
    ["warn", "Degraded"],
    ["down", "Down"],
  ] as const)("renders the %s variant with a text label", (variant, label) => {
    render(<StatusDot variant={variant} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("marks the visual dot as decorative", () => {
    const { container } = render(<StatusDot variant="ok" />);

    const dot = container.querySelector("[aria-hidden='true']");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("rounded-full");
  });
});
