import { render, screen } from "@testing-library/react";
import { PageHeading } from "../PageHeading";

describe("PageHeading", () => {
  it("renders the title as an h1", () => {
    render(<PageHeading title="Services" />);

    expect(screen.getByRole("heading", { level: 1, name: "Services" })).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<PageHeading title="Services" />);

    expect(screen.queryByText(/choose a service/i)).not.toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <PageHeading
        title="Services"
        description="Choose a service to manage"
      />
    );

    expect(screen.getByText("Choose a service to manage")).toBeInTheDocument();
  });

  it("does not render action when not provided", () => {
    render(<PageHeading title="Services" />);

    expect(screen.queryByRole("link", { name: /new service/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /refresh/i })).not.toBeInTheDocument();
  });

  it("renders action slot when provided as a link", () => {
    render(
      <PageHeading
        title="Services"
        action={<a href="/services/new">New service</a>}
      />
    );

    const link = screen.getByRole("link", { name: /new service/i });
    expect(link).toHaveAttribute("href", "/services/new");
  });

  it("renders action slot when provided as a button", () => {
    render(
      <PageHeading
        title="Services"
        action={<button type="button">Refresh</button>}
      />
    );

    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });
});

