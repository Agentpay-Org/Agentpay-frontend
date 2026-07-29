"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type ToastLevel = "info" | "error" | "success" | "warning";

type Toast = { id: string; message: string; level: ToastLevel };
type Ctx = { push: (m: string, level?: Toast["level"]) => void };

const ToastCtx = createContext<Ctx | null>(null);

/** How long a toast stays on screen before it auto-dismisses (ms). */
const AUTO_DISMISS_MS = 4000;

/**
 * Provides the `useToast()` hook and renders the toast stack.
 *
 * Accessibility:
 * - The stack container is a named landmark region (`role="region"`,
 *   `aria-label="Notifications"`) so screen-reader users can jump straight
 *   to it via a regions/landmarks list and review the current toasts on
 *   demand, in addition to hearing new ones announced automatically.
 * - Each individual toast manages its own accessibility properties
 *   dynamically based on severity:
 *   - Error toasts (`error`) use `role="alert"` and `aria-live="assertive"` so screen readers
 *     can interrupt and announce them immediately.
 *   - Info, success, and warning toasts (`info`, `success`, `warning`) use `role="status"`
 *     and `aria-live="polite"` for non-intrusive announcements.
 * - `aria-atomic` is set *per toast* (not on the container) so adding a new toast
 *   announces only that toast rather than re-reading the whole stack.
 * - Each toast carries a real `<button>` dismiss affordance with an
 *   `aria-label`, so keyboard and screen-reader users can remove a toast
 *   immediately instead of waiting out the {@link AUTO_DISMISS_MS} auto-dismiss.
 *
 * Satisfies WCAG 4.1.3 Status Messages.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((s) => s.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, level: Toast["level"] = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setItems((s) => [...s, { id, message, level }]);
      setTimeout(() => {
        setItems((s) => s.filter((t) => t.id !== id));
      }, AUTO_DISMISS_MS);
    },
    [],
  );

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 flex flex-col gap-2"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role={t.level === "error" ? "alert" : "status"}
            aria-live={t.level === "error" ? "assertive" : "polite"}
            aria-atomic="true"
            className={`pointer-events-auto flex items-center gap-3 rounded-md px-4 py-2 text-sm shadow-lg ${
              t.level === "error"
                ? "bg-rose-600 text-white"
                : "bg-black text-white dark:bg-white dark:text-black"
            }`}
          >
            <span>{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label={`Dismiss notification: ${t.message}`}
              className="-mr-1 ml-auto rounded p-0.5 text-lg leading-none opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
