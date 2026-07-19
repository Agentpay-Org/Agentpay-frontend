import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../Button";

describe("Button", () => {
  it("renders children without busy state by default", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("defaults type to button", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("respects an explicit type override", () => {
    render(<Button type="submit">Submit</Button>);

    expect(screen.getByRole("button", { name: "Submit" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("renders the primary variant with correct styles", () => {
    render(<Button variant="primary">Primary</Button>);

    const button = screen.getByRole("button", { name: "Primary" });
    expect(button.className).toMatch(/bg-black/);
  });

  it("renders the secondary variant with correct styles", () => {
    render(<Button variant="secondary">Secondary</Button>);

    const button = screen.getByRole("button", { name: "Secondary" });
    expect(button.className).toMatch(/border-zinc-300/);
  });

  it("renders the danger variant with correct styles", () => {
    render(<Button variant="danger">Danger</Button>);

    const button = screen.getByRole("button", { name: "Danger" });
    expect(button.className).toMatch(/bg-rose-600/);
  });

  it("disables the button and exposes busy state while loading", () => {
    render(<Button loading>Save</Button>);

    const button = screen.getByRole("button", { name: /save/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });

  it("combines loading and explicit disabled without conflict", () => {
    render(
      <Button loading disabled>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: /save/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("preserves explicit disabled state when not loading", () => {
    render(<Button disabled>Delete</Button>);

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it("calls onClick when enabled and clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Click Me" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick while loading", () => {
    const handleClick = jest.fn();
    render(
      <Button loading onClick={handleClick}>
        Click Me
      </Button>,
    );

    fireEvent.click(screen.getByRole("button", { name: /click me/i }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders the danger variant correctly while loading", () => {
    render(
      <Button variant="danger" loading>
        Delete
      </Button>,
    );

    const button = screen.getByRole("button", { name: /delete/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.className).toMatch(/bg-rose-600/);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
