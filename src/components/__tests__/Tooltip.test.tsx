import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Tooltip } from "../Tooltip";

/**
 * Locks down the WCAG 2.1 SC 1.4.13 (Content on Hover or Focus) contract that
 * Tooltip.tsx documents: show on hover/focus, stay hoverable, link the trigger
 * via aria-describedby only while visible, and dismiss on Escape without moving
 * focus.
 *
 * DOM shape rendered by Tooltip:
 *   span.wrapper            ← owns the hover/focus/keydown handlers
 *     └ span[aria-describedby?]   ← trigger's direct parent
 *         └ {children}            ← the focusable trigger
 *     └ span[role="tooltip"]      ← only mounted while visible
 *
 * Event note: React 19 listens for focus/blur via focusin/focusout and for
 * mouseenter/mouseleave via mouseover/mouseout, so the tests fire those native
 * events. A real .focus() is used where document.activeElement matters.
 */
const renderTooltip = () =>
  render(
    <Tooltip label="More info">
      <button type="button">Help</button>
    </Tooltip>
  );

const getTrigger = () => screen.getByRole("button", { name: "Help" });
const describedBySpan = (trigger: HTMLElement) =>
  trigger.parentElement as HTMLElement;
const wrapper = (trigger: HTMLElement) =>
  trigger.parentElement?.parentElement as HTMLElement;

describe("Tooltip", () => {
  describe("visibility on hover and focus", () => {
    it("renders nothing until hovered or focused", () => {
      renderTooltip();
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("appears on mouse enter and disappears on mouse leave", () => {
      renderTooltip();
      const region = wrapper(getTrigger());

      fireEvent.mouseOver(region);
      expect(screen.getByRole("tooltip")).toHaveTextContent("More info");

      // relatedTarget defaults outside the wrapper → a genuine region exit.
      fireEvent.mouseOut(region);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("appears on focus and disappears on blur", () => {
      renderTooltip();
      const trigger = getTrigger();

      fireEvent.focusIn(trigger);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      fireEvent.focusOut(trigger);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("stays visible while the pointer travels from the trigger onto the tooltip (hoverable)", () => {
      renderTooltip();
      const trigger = getTrigger();
      const region = wrapper(trigger);

      fireEvent.mouseOver(region);
      const tip = screen.getByRole("tooltip");

      // Pointer crosses trigger → tooltip; both share the wrapper, so leave
      // must not fire and the tooltip stays mounted.
      fireEvent.mouseOut(trigger, { relatedTarget: tip });
      fireEvent.mouseOver(tip, { relatedTarget: trigger });

      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });
  });

  describe("aria-describedby wiring", () => {
    it("has no aria-describedby before the tooltip is shown", () => {
      renderTooltip();
      expect(describedBySpan(getTrigger())).not.toHaveAttribute(
        "aria-describedby"
      );
    });

    it("points aria-describedby at the tooltip id while visible", () => {
      renderTooltip();
      const trigger = getTrigger();

      fireEvent.focusIn(trigger);

      const tip = screen.getByRole("tooltip");
      expect(tip.id).toBeTruthy();
      expect(describedBySpan(trigger)).toHaveAttribute(
        "aria-describedby",
        tip.id
      );
    });

    it("clears aria-describedby again after the tooltip hides", () => {
      renderTooltip();
      const trigger = getTrigger();

      fireEvent.focusIn(trigger);
      expect(describedBySpan(trigger)).toHaveAttribute("aria-describedby");

      fireEvent.focusOut(trigger);
      expect(describedBySpan(trigger)).not.toHaveAttribute("aria-describedby");
    });
  });

  describe("dismiss on Escape (WCAG 1.4.13 dismissible)", () => {
    it("hides the tooltip and keeps focus on the trigger", () => {
      renderTooltip();
      const trigger = getTrigger();

      act(() => {
        trigger.focus(); // sets document.activeElement and fires React onFocus
      });
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      expect(trigger).toHaveFocus();

      fireEvent.keyDown(trigger, { key: "Escape" });

      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });

    it("ignores non-Escape keys while visible", () => {
      renderTooltip();
      const trigger = getTrigger();

      fireEvent.focusIn(trigger);
      fireEvent.keyDown(trigger, { key: "Enter" });

      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("survives rapid enter/leave/enter without getting stuck", () => {
      renderTooltip();
      const region = wrapper(getTrigger());

      fireEvent.mouseOver(region);
      fireEvent.mouseOut(region);
      fireEvent.mouseOver(region);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      fireEvent.mouseOut(region);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("can be focused, dismissed with Escape, then shown again", () => {
      renderTooltip();
      const trigger = getTrigger();

      act(() => {
        trigger.focus();
      });
      fireEvent.keyDown(trigger, { key: "Escape" });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      fireEvent.focusIn(trigger);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });
  });

  describe("collision-aware positioning", () => {
    const originalInnerWidth = window.innerWidth;
    const originalRect = Element.prototype.getBoundingClientRect;

    beforeAll(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    afterAll(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });

    afterEach(() => {
      Element.prototype.getBoundingClientRect = originalRect;
    });

    const rect = (over: Partial<DOMRect>): DOMRect =>
      ({
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        ...over,
      }) as DOMRect;

    const mockMeasurements = (
      wrapperRect: Partial<DOMRect>,
      tooltipRect: Partial<DOMRect>
    ) => {
      Element.prototype.getBoundingClientRect = function () {
        if (this.getAttribute("role") === "tooltip") return rect(tooltipRect);
        if (this.className.includes("inline-flex")) return rect(wrapperRect);
        return rect({});
      };
    };

    it("keeps the default (above) placement when there is room above", async () => {
      mockMeasurements(
        { top: 100, left: 200, width: 50, height: 20 },
        { width: 80, height: 30 }
      );
      renderTooltip();
      fireEvent.focusIn(getTrigger());

      await waitFor(() => {
        const tip = screen.getByRole("tooltip");
        expect(tip).toHaveStyle({ bottom: "100%", opacity: "1" });
        expect(tip).not.toHaveStyle({ top: "100%" });
      });
    });

    it("flips below the trigger when there is not enough room above", async () => {
      mockMeasurements(
        { top: 20, left: 200, width: 50, height: 20 },
        { width: 80, height: 30 }
      );
      renderTooltip();
      fireEvent.focusIn(getTrigger());

      await waitFor(() => {
        const tip = screen.getByRole("tooltip");
        expect(tip).toHaveStyle({ top: "100%", opacity: "1" });
        expect(tip).not.toHaveStyle({ bottom: "100%" });
      });
    });

    it("clamps to the left viewport edge when overflowing left", async () => {
      mockMeasurements(
        { top: 100, left: 10, width: 50, height: 20 },
        { width: 80, height: 30 }
      );
      renderTooltip();
      fireEvent.focusIn(getTrigger());

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toHaveStyle({ left: "-2px" });
      });
    });

    it("clamps to the right viewport edge when overflowing right", async () => {
      mockMeasurements(
        { top: 100, left: 980, width: 50, height: 20 },
        { width: 80, height: 30 }
      );
      renderTooltip();
      fireEvent.focusIn(getTrigger());

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toHaveStyle({ left: "-44px" });
      });
    });
  });
});
