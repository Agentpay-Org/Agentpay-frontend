import { render, screen } from "@testing-library/react";
import Loading from "./loading";

describe("Services Segment Loading", () => {
  it("renders inside the main landmark for skip-link focus", () => {
    render(<Loading />);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
  });

  it("exposes a polite status region announcing the loading state (WCAG 4.1.3)", () => {
    render(<Loading />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Loading…");
  });
});
