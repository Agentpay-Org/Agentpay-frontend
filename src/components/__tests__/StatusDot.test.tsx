import { render, screen } from "@testing-library/react";
import { StatusDot } from "../StatusDot";

describe("StatusDot", () => {
  describe("default labels per variant", () => {
    it("renders 'Operational' for the ok variant", () => {
      render(<StatusDot variant="ok" />);
      expect(screen.getByText("Operational")).toBeInTheDocument();
    });

    it("renders 'Degraded' for the warn variant", () => {
      render(<StatusDot variant="warn" />);
      expect(screen.getByText("Degraded")).toBeInTheDocument();
    });

    it("renders 'Down' for the down variant", () => {
      render(<StatusDot variant="down" />);
      expect(screen.getByText("Down")).toBeInTheDocument();
    });
  });

  describe("variant colour dot", () => {
    it("ok dot has the emerald colour class", () => {
      const { container } = render(<StatusDot variant="ok" />);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot?.className).toMatch(/bg-emerald-500/);
    });

    it("warn dot has the amber colour class", () => {
      const { container } = render(<StatusDot variant="warn" />);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot?.className).toMatch(/bg-amber-500/);
    });

    it("down dot has the rose colour class", () => {
      const { container } = render(<StatusDot variant="down" />);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot?.className).toMatch(/bg-rose-500/);
    });

    it("marks the colour dot as aria-hidden so colour is not the only cue", () => {
      const { container } = render(<StatusDot variant="ok" />);
      const dot = container.querySelector(".rounded-full");
      expect(dot).toHaveAttribute("aria-hidden", "true");
    });

    it("does not mark the visible label as aria-hidden", () => {
      render(<StatusDot variant="ok" />);
      const label = screen.getByText("Operational");
      expect(label).not.toHaveAttribute("aria-hidden");
    });
  });

  describe("custom label override", () => {
    it("renders a custom string label instead of the default", () => {
      render(<StatusDot variant="warn" label="Paused" />);
      expect(screen.getByText("Paused")).toBeInTheDocument();
      expect(screen.queryByText("Degraded")).not.toBeInTheDocument();
    });

    it("accepts a ReactNode label", () => {
      render(<StatusDot variant="ok" label={<strong>Live now</strong>} />);
      const node = screen.getByText("Live now");
      expect(node.tagName).toBe("STRONG");
      expect(screen.queryByText("Operational")).not.toBeInTheDocument();
    });

    it("keeps the variant dot colour when the label is overridden", () => {
      const { container } = render(
        <StatusDot variant="down" label="Maintenance" />,
      );
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot?.className).toMatch(/bg-rose-500/);
    });
  });

  describe("empty-string label fallback", () => {
    it("falls back to the default label for an empty string", () => {
      render(<StatusDot variant="ok" label="" />);
      expect(screen.getByText("Operational")).toBeInTheDocument();
    });

    it("falls back to the default label for an explicit undefined", () => {
      render(<StatusDot variant="down" label={undefined} />);
      expect(screen.getByText("Down")).toBeInTheDocument();
    });
  });

  it("always renders a visible text label for screen readers", () => {
    const { container } = render(<StatusDot variant="ok" label="" />);
    // The dot is aria-hidden; the label span must hold non-empty, non-hidden text.
    const labelSpan = Array.from(container.querySelectorAll("span")).find(
      (s) => !s.hasAttribute("aria-hidden") && s.textContent,
    );
    expect(labelSpan?.textContent).toBe("Operational");
  });
});
