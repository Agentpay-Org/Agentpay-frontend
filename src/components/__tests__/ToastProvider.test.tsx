import { useEffect } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "../ToastProvider";

// --------------- test helpers ---------------

/** Component that uses useToast() to push a single toast on click. */
function ToastPusher({
  message,
  level,
  testId,
}: {
  message: string;
  level?: "info" | "error";
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
  messages: { text: string; level?: "info" | "error" }[];
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
      expect(live).toHaveAttribute("aria-atomic", "true");
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
      let observedPush: ((m: string) => void) | null = null;
      const recordPush = (push: (m: string) => void) => {
        observedPush = push;
      };

      function Spy() {
        const { push } = useToast();
        useEffect(() => {
          recordPush(push);
        }, [push]);
        return null;
      }

      const { rerender } = render(
        <ToastProvider>
          <Spy />
        </ToastProvider>,
      );

      const firstPush = observedPush;
      rerender(
        <ToastProvider>
          <Spy />
        </ToastProvider>,
      );
      expect(observedPush).toBe(firstPush);
    });
  });
});
