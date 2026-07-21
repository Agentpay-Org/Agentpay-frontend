import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders children inside the badge", () => {
    render(<Badge>Test content</Badge>);
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("supports rich ReactNode children", () => {
    render(
      <Badge>
        <span data-testid="rich-child">Rich Child</span>
      </Badge>
    );
    expect(screen.getByTestId("rich-child")).toBeInTheDocument();
  });

  it("defaults to the neutral variant", () => {
    render(<Badge>Neutral Badge</Badge>);
    const badge = screen.getByText("Neutral Badge");
    expect(badge).toHaveClass("bg-zinc-100");
  });

  it("applies the neutral variant class set", () => {
    render(<Badge variant="neutral">Neutral Badge</Badge>);
    const badge = screen.getByText("Neutral Badge");
    expect(badge).toHaveClass("bg-zinc-100");
  });

  it("applies the ok variant class set", () => {
    render(<Badge variant="ok">Ok Badge</Badge>);
    const badge = screen.getByText("Ok Badge");
    expect(badge).toHaveClass("bg-emerald-100");
  });

  it("applies the warning variant class set", () => {
    render(<Badge variant="warning">Warning Badge</Badge>);
    const badge = screen.getByText("Warning Badge");
    expect(badge).toHaveClass("bg-amber-100");
  });

  it("applies the danger variant class set", () => {
    render(<Badge variant="danger">Danger Badge</Badge>);
    const badge = screen.getByText("Danger Badge");
    expect(badge).toHaveClass("bg-rose-100");
  });
});
