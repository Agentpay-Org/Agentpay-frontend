"use client";

import { type KeyboardEvent, type ReactNode, useId, useState, useRef, useEffect } from "react";

type Props = {
  label: ReactNode;
  children: ReactNode;
};

/**
 * Calculates the collision-aware positioning of the tooltip.
 *
 * - Measures available vertical space above the trigger to determine if it should flip below.
 * - Flips to bottom if space above is less than tooltip height + 8px.
 * - Centers the tooltip horizontally relative to the trigger, then clamps it
 *   within the viewport boundaries (with an 8px padding) to prevent horizontal overflow.
 *
 * @param wrapperRect - Bounding rectangle of the trigger wrapper.
 * @param tooltipRect - Bounding rectangle of the tooltip element.
 * @param viewportWidth - Total width of the window/viewport.
 * @returns Computed relative left coordinate and whether the tooltip should be flipped below.
 */
export function calculateTooltipPosition(
  wrapperRect: DOMRect | DOMRectReadOnly,
  tooltipRect: DOMRect | DOMRectReadOnly,
  viewportWidth: number
): { left: number; isFlipped: boolean } {
  const isFlipped = wrapperRect.top < tooltipRect.height + 8;
  const tooltipLeftViewport = wrapperRect.left + wrapperRect.width / 2 - tooltipRect.width / 2;
  const clampedLeft = Math.max(8, Math.min(viewportWidth - 8 - tooltipRect.width, tooltipLeftViewport));
  return { left: clampedLeft - wrapperRect.left, isFlipped };
}

/**
 * Accessible tooltip implementing WCAG 2.1 SC 1.4.13 (Content on Hover or Focus):
 *
 * - Dismissible: pressing Escape hides the tooltip without moving focus off the
 *   trigger, so a keyboard user can clear obscuring content and stay in place.
 * - Hoverable: the pointer can travel from the trigger onto the tooltip content
 *   without it disappearing. The hover region is owned by the outer wrapper (not
 *   the trigger), `pointer-events-none` is gone, and a padding bridge on
 *   the tooltip removes the dead gap between the trigger and content.
 * - Persistent: the tooltip stays visible until the pointer leaves the whole
 *   region, the trigger blurs, or Escape is pressed.
 *
 * Positioning behavior (collision-aware):
 * - Checks available vertical space above the trigger. If insufficient, flips the tooltip below the trigger.
 * - Clamps horizontal position relative to viewport boundaries to avoid horizontal clipping/overflow.
 */
export function Tooltip({ label, children }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  const [coords, setCoords] = useState<{
    left: number;
    isFlipped: boolean;
    ready: boolean;
  }>({ left: 0, isFlipped: false, ready: false });

  const showTooltip = () => setVisible(true);
  const hideTooltip = () => {
    setVisible(false);
    setCoords((prev) => ({ ...prev, ready: false }));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    // Dismissible: Escape hides the tooltip but leaves focus on the trigger.
    if (event.key === "Escape" && visible) {
      event.stopPropagation();
      hideTooltip();
    }
  };

  useEffect(() => {
    if (!visible) return;

    const updatePosition = () => {
      const wrapper = wrapperRef.current;
      const tooltip = tooltipRef.current;
      if (!wrapper || !tooltip) return;

      const wrapperRect = wrapper.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      const viewportWidth = window.innerWidth;
      
      const { left: relativeLeft, isFlipped } = calculateTooltipPosition(
        wrapperRect,
        tooltipRect,
        viewportWidth
      );

      setCoords({
        left: relativeLeft,
        isFlipped,
        ready: true,
      });
    };

    // Calculate immediately
    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { capture: true });

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, { capture: true });
    };
  }, [visible]);

  return (
    // Focus/hover handlers live on the wrapper so that moving the pointer across
    // the gap from the trigger into the tooltip body does not dismiss it.
    <span
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onKeyDown={handleKeyDown}
    >
      <span aria-describedby={visible ? id : undefined}>{children}</span>
      {visible && (
        <span
          role="tooltip"
          id={id}
          ref={tooltipRef}
          style={{
            left: `${coords.left}px`,
            bottom: coords.isFlipped ? undefined : "100%",
            top: coords.isFlipped ? "100%" : undefined,
            opacity: coords.ready ? 1 : 0,
          }}
          className={`absolute ${coords.isFlipped ? "pt-1" : "pb-1"}`}
        >
          <span className="block whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white shadow">
            {label}
          </span>
        </span>
      )}
    </span>
  );
}
