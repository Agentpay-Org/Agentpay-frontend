import { render, screen } from "@testing-library/react";
import { Card } from "../Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>hello world</Card>);
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("renders the title in a <header> when provided", () => {
    render(<Card title="Section title">body</Card>);
    expect(screen.getByText("Section title")).toBeInTheDocument();
    expect(screen.getByText("Section title").tagName).toBe("HEADER");
  });

  it("renders the footer in a <footer> when provided", () => {
    render(<Card footer="Footer note">body</Card>);
    const footer = screen.getByText("Footer note");
    expect(footer).toBeInTheDocument();
    expect(footer.tagName).toBe("FOOTER");
  });

  it("renders both title and footer simultaneously", () => {
    render(
      <Card title="The Title" footer="The Footer">
        body text
      </Card>,
    );
    expect(screen.getByText("The Title")).toBeInTheDocument();
    expect(screen.getByText("The Title").tagName).toBe("HEADER");
    expect(screen.getByText("The Footer")).toBeInTheDocument();
    expect(screen.getByText("The Footer").tagName).toBe("FOOTER");
    expect(screen.getByText("body text")).toBeInTheDocument();
  });

  it("does not render a <header> when title is omitted", () => {
    const { container } = render(<Card>no title</Card>);
    expect(container.querySelector("header")).not.toBeInTheDocument();
  });

  it("does not render a <footer> when footer is omitted", () => {
    const { container } = render(<Card>no footer</Card>);
    expect(container.querySelector("footer")).not.toBeInTheDocument();
  });

  it("renders as a <section> element", () => {
    const { container } = render(<Card>section</Card>);
    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("merges custom className with the default classes", () => {
    render(
      <Card className="my-custom-class" data-testid="card">
        styled
      </Card>,
    );
    const section = screen.getByTestId("card");
    expect(section.className).toContain("my-custom-class");
    expect(section.className).toContain("rounded-lg");
  });

  it("passes through arbitrary HTML attributes on the <section>", () => {
    render(
      <Card data-testid="my-card" aria-label="card label" role="region">
        passthrough
      </Card>,
    );
    const section = screen.getByTestId("my-card");
    expect(section).toHaveAttribute("aria-label", "card label");
    expect(section).toHaveAttribute("role", "region");
  });

  it("passes through event handlers", () => {
    const onClick = jest.fn();
    render(
      <Card data-testid="clickable" onClick={onClick}>
        click me
      </Card>,
    );
    screen.getByTestId("clickable").click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders children inside a <div> wrapper", () => {
    const { container } = render(
      <Card>
        <span data-testid="child">wrapped</span>
      </Card>,
    );
    const child = container.querySelector("section > div > [data-testid='child']");
    expect(child).toBeInTheDocument();
  });

  it("renders title when no children are provided", () => {
    render(<Card title="Only title" />);
    expect(screen.getByText("Only title")).toBeInTheDocument();
    expect(screen.getByText("Only title").tagName).toBe("HEADER");
  });
});
