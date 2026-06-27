import { render, screen } from "@testing-library/react";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="No results" />);

    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="No results" />);

    expect(screen.queryByText("Nothing to show")).not.toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <EmptyState title="No results" description="Nothing to show" />
    );

    expect(screen.getByText("Nothing to show")).toBeInTheDocument();
  });

  it("does not render action when not provided", () => {
    render(<EmptyState title="No results" />);

    expect(screen.queryByRole("link", { name: /learn more/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create/i })
    ).not.toBeInTheDocument();
  });

  it("renders action when provided as a link", () => {
    render(
      <EmptyState
        title="No results"
        action={<a href="/docs">Learn more</a>}
      />
    );

    expect(screen.getByRole("link", { name: /learn more/i })).toHaveAttribute(
      "href",
      "/docs"
    );
  });

  it("renders action when provided as a button", () => {
    render(
      <EmptyState
        title="No results"
        action={<button type="button">Create</button>}
      />
    );

    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
  });
});

