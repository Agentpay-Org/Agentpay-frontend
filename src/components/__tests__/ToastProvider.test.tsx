import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { ToastLevel, ToastProvider, useToast } from "../ToastProvider";

// --------------- test helpers ---------------

/** Component that uses useToast() to push a single toast on click. */
function ToastPusher({
  message,
  level,
  testId,
}: {
  message: string;
  level?: ToastLevel;
  /** custom test-id for the button so multiple pushers can coexist */
  testId?: string;
}) {
  const { push } = useToast();
  return (
    <button data-testid={testId ?? "push-btn"} onClick={() => push(message, level)}>
      Push
    </button>
  );
}

/** Component that pushes several toasts synchronously on one click. */
function MultiPusher({
  messages,
}: {
  messages: { text: string; level?: ToastLevel }[];
}) {
  const { push } = useToast();
  return (
    <button
      data-testid="multi-push"
      onClick={() => messages.forEach((m) => push(m.text, m.level))}
    >
      Push All
    </button>
  );
}

/** Component that just calls useToast() – used for the guard test. */
function BareConsumer() {
  useToast();
  return <div>consumer</div>;
}

// --------------- describe block ---------------

describe("ToastProvider", () => {
  // We use fake timers so we can control setTimeout (auto-dismiss).
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ------------------------------------------------------------------
  // 1. Live-region container
  // ------------------------------------------------------------------
  describe("live region container", () => {
    it("renders the aria-live='polite' container (empty state)", () => {
      render(
        <ToastProvider>
          <span>child</span>
        </ToastProvider>,
      );

      const live = document.querySelector('[aria-live="polite"]');
      expect(live).toBeInTheDocument();
    });

    it("exposes the stack as a named 'Notifications' region", () => {
      render(
        <ToastProvider>
          <span>child</span>
        </ToastProvider>,
      );

      const region = screen.getByRole("region", { name: "Notifications" });
      expect(region).toHaveAttribute("aria-live", "polite");
    });

    it("keeps the Notifications region present and reachable while toasts are on screen", () => {
      render(
        <ToastProvider>
          <ToastPusher message="Saved" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));

      const region = screen.getByRole("region", { name: "Notifications" });
      expect(region).toContainElement(screen.getByRole("status"));
    });

    it("does NOT set aria-atomic on the container (moved per-item)", () => {
      // aria-atomic on the whole stack makes every new toast re-announce the
      // entire list. The atomic semantics now live on each toast instead.
      render(
        <ToastProvider>
          <span>child</span>
        </ToastProvider>,
      );

      const live = document.querySelector('[aria-live="polite"]');
      expect(live).not.toHaveAttribute("aria-atomic");
    });

    it("sets aria-atomic='true' on each toast item", () => {
      render(
        <ToastProvider>
          <MultiPusher
            messages={[{ text: "One" }, { text: "Two", level: "error" }]}
          />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("multi-push"));

      const status = screen.getByRole("status");
      const alert = screen.getByRole("alert");
      expect(status).toHaveAttribute("aria-atomic", "true");
      expect(alert).toHaveAttribute("aria-atomic", "true");
    });
  });

  // ------------------------------------------------------------------
  // 1b. Manual dismiss control
  // ------------------------------------------------------------------
  describe("dismiss button", () => {
    it("renders a real <button> with an accessible label per toast", () => {
      render(
        <ToastProvider>
          <ToastPusher message="Saved" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));

      const dismiss = screen.getByRole("button", {
        name: "Dismiss notification: Saved",
      });
      expect(dismiss).toBeInTheDocument();
      expect(dismiss.tagName).toBe("BUTTON");
      expect(dismiss).toHaveAttribute("type", "button");
    });

    it("removes a toast immediately when its dismiss button is clicked", () => {
      render(
        <ToastProvider>
          <ToastPusher message="Dismiss me" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));
      expect(screen.getByRole("status")).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "Dismiss notification: Dismiss me" }),
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("dismisses only the targeted toast, leaving the rest", () => {
      render(
        <ToastProvider>
          <MultiPusher
            messages={[{ text: "Keep" }, { text: "Drop" }]}
          />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("multi-push"));
      expect(screen.getAllByRole("status")).toHaveLength(2);

      fireEvent.click(
        screen.getByRole("button", { name: "Dismiss notification: Drop" }),
      );

      const remaining = screen.getAllByRole("status");
      expect(remaining).toHaveLength(1);
      expect(remaining[0]).toHaveTextContent("Keep");
    });

    it("dismissing before the 4s timeout does not error when the timer later fires", () => {
      render(
        <ToastProvider>
          <ToastPusher message="Early dismiss" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));
      fireEvent.click(
        screen.getByRole("button", {
          name: "Dismiss notification: Early dismiss",
        }),
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument();

      // The auto-dismiss timer still fires; filtering an already-removed id is
      // a no-op and must not throw or resurrect the toast.
      act(() => {
        jest.advanceTimersByTime(4000);
      });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("keeps role='alert' on the dismiss-able error toast", () => {
      render(
        <ToastProvider>
          <ToastPusher message="Boom" level="error" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Boom");
      expect(
        screen.getByRole("button", { name: "Dismiss notification: Boom" }),
      ).toBeInTheDocument();
    });
  });

  // ------------------------------------------------------------------
  // 2. useToast() guard
  // ------------------------------------------------------------------
  describe("useToast guard", () => {
    it("throws when used outside <ToastProvider>", () => {
      // Suppress console.error for the expected error boundary output.
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => render(<BareConsumer />)).toThrow(
        "useToast must be used inside <ToastProvider>",
      );

      spy.mockRestore();
    });
  });

  // ------------------------------------------------------------------
  // 3. Toast roles: error → alert, info → status
  // ------------------------------------------------------------------
  describe("toast role assignment", () => {
    it("assigns role='alert' to error toasts", () => {
      render(
        <ToastProvider>
          <ToastPusher message="Something broke" level="error" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));

      const toast = screen.getByRole("alert");
      expect(toast).toHaveTextContent("Something broke");
    });

    it("assigns role='status' to info toasts (explicit level)", () => {
      render(
        <ToastProvider>
          <ToastPusher message="All good" level="info" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));

      const toast = screen.getByRole("status");
      expect(toast).toHaveTextContent("All good");
    });

    it("assigns role='status' when level is omitted (default info)", () => {
      render(
        <ToastProvider>
          <ToastPusher message="Default level" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));

      const toast = screen.getByRole("status");
      expect(toast).toHaveTextContent("Default level");
    });
  });

  // ------------------------------------------------------------------
  // 3b. Dynamic aria-live mapping (a11y)
  // ------------------------------------------------------------------
  describe("dynamic aria-live mapping", () => {
    it("renders an error toast with aria-live='assertive'", () => {
      render(
        <ToastProvider>
          <ToastPusher message="Connection failed" level="error" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));

      const toast = screen.getByRole("alert");
      expect(toast).toHaveAttribute("aria-live", "assertive");
    });

    it("renders an info toast with aria-live='polite'", () => {
      render(
        <ToastProvider>
          <ToastPusher message="System update available" level="info" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));

      const toast = screen.getByRole("status");
      expect(toast).toHaveAttribute("aria-live", "polite");
    });

    it("renders a success toast with aria-live='polite'", () => {
      render(
        <ToastProvider>
          <ToastPusher message="Payment processed successfully" level="success" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));

      const toast = screen.getByRole("status");
      expect(toast).toHaveAttribute("aria-live", "polite");
    });

    it("renders a warning toast with aria-live='polite'", () => {
      render(
        <ToastProvider>
          <ToastPusher message="Storage space low" level="warning" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));

      const toast = screen.getByRole("status");
      expect(toast).toHaveAttribute("aria-live", "polite");
    });

    it("maintains separate aria-live attributes for stacked toasts with mixed severities", () => {
      render(
        <ToastProvider>
          <MultiPusher
            messages={[
              { text: "Info item", level: "info" },
              { text: "Success item", level: "success" },
              { text: "Warning item", level: "warning" },
              { text: "Error item", level: "error" },
            ]}
          />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("multi-push"));

      const errorToast = screen.getByRole("alert");
      expect(errorToast).toHaveTextContent("Error item");
      expect(errorToast).toHaveAttribute("aria-live", "assertive");

      const politeToasts = screen.getAllByRole("status");
      expect(politeToasts).toHaveLength(3);
      expect(politeToasts[0]).toHaveTextContent("Info item");
      expect(politeToasts[0]).toHaveAttribute("aria-live", "polite");
      expect(politeToasts[1]).toHaveTextContent("Success item");
      expect(politeToasts[1]).toHaveAttribute("aria-live", "polite");
      expect(politeToasts[2]).toHaveTextContent("Warning item");
      expect(politeToasts[2]).toHaveAttribute("aria-live", "polite");
    });
  });

  // ------------------------------------------------------------------
  // 4. Auto-dismiss after 4 000 ms
  // ------------------------------------------------------------------
  describe("auto-dismiss", () => {
    it("removes the toast after 4 000 ms", () => {
      render(
        <ToastProvider>
          <ToastPusher message="Ephemeral" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));
      expect(screen.getByRole("status")).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(3999);
      });
      expect(screen.getByRole("status")).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1); // 4 000 total
      });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("removes all toasts pushed at the same time after 4000ms", () => {
      render(
        <ToastProvider>
          <MultiPusher
            messages={[
              { text: "First" },
              { text: "Second" },
            ]}
          />
        </ToastProvider>,
      );

      // Push both toasts at once so they get the same Date.now() timestamp
      // but different random suffixes → different ids.
      fireEvent.click(screen.getByTestId("multi-push"));

      // Both should be visible.
      const toasts = screen.getAllByRole("status");
      expect(toasts).toHaveLength(2);
      expect(toasts[0]).toHaveTextContent("First");
      expect(toasts[1]).toHaveTextContent("Second");

      // Advance past 4 000 ms – both should disappear.
      act(() => {
        jest.advanceTimersByTime(4000);
      });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("removes toasts pushed at different times independently", () => {
      // We need two separate pushers so we can click at different times.
      render(
        <ToastProvider>
          <ToastPusher message="Early" testId="btn-early" />
          <ToastPusher message="Late" testId="btn-late" />
        </ToastProvider>,
      );

      // Push early toast.
      fireEvent.click(screen.getByTestId("btn-early"));

      // Advance 2 000 ms, then push second toast.
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      fireEvent.click(screen.getByTestId("btn-late"));

      // Both visible now.
      expect(screen.getAllByRole("status")).toHaveLength(2);

      // After another 2 000 ms (total 4 000 for early), early should be gone.
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      const remaining = screen.getAllByRole("status");
      expect(remaining).toHaveLength(1);
      expect(remaining[0]).toHaveTextContent("Late");

      // After another 2 000 ms (total 4 000 for late), late should be gone.
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  // ------------------------------------------------------------------
  // 5. Multiple / stacked toasts
  // ------------------------------------------------------------------
  describe("stacked toasts", () => {
    it("displays multiple toasts simultaneously", () => {
      render(
        <ToastProvider>
          <MultiPusher
            messages={[
              { text: "Toast A", level: "info" },
              { text: "Toast B", level: "error" },
              { text: "Toast C" }, // default info
            ]}
          />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("multi-push"));

      // Distinguish by role.
      const alerts = screen.getAllByRole("alert");
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toHaveTextContent("Toast B");

      const statuses = screen.getAllByRole("status");
      expect(statuses).toHaveLength(2);
      expect(statuses[0]).toHaveTextContent("Toast A");
      expect(statuses[1]).toHaveTextContent("Toast C");
    });

    it("renders the error toast with rose background styling", () => {
      render(
        <ToastProvider>
          <ToastPusher message="Error!" level="error" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));

      const toast = screen.getByRole("alert");
      expect(toast.className).toMatch(/bg-rose-600/);
    });

    it("renders the info toast with neutral background styling", () => {
      render(
        <ToastProvider>
          <ToastPusher message="FYI" level="info" />
        </ToastProvider>,
      );

      fireEvent.click(screen.getByTestId("push-btn"));

      const toast = screen.getByRole("status");
      expect(toast.className).toMatch(/bg-black/);
    });
  });

  // ------------------------------------------------------------------
  // 6. Context value
  // ------------------------------------------------------------------
  describe("context value", () => {
    it("exposes a stable push function across re-renders", () => {
      const capture = jest.fn();

      function Spy() {
        const { push } = useToast();
        useEffect(() => {
          capture(push);
        }, [push]);
        return null;
      }

      const { rerender } = render(
        <ToastProvider>
          <Spy />
        </ToastProvider>,
      );

      expect(capture).toHaveBeenCalledTimes(1);
      const firstPush = capture.mock.calls[0][0];
      rerender(
        <ToastProvider>
          <Spy />
        </ToastProvider>,
      );
      expect(capture).toHaveBeenCalledTimes(1);
      expect(capture.mock.calls[0][0]).toBe(firstPush);
    });
  });
});
