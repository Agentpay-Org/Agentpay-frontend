"use client";

import {
  createContext,
  memo,
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
 * Renders one toast bubble. Extracted and wrapped in `memo` so that pushing
 * or dismissing one toast does not re-render every other toast currently on
 * screen — each item only re-renders when its own `id`, `message`, or
 * `level` changes, or when its `onDismiss` identity changes (it doesn't:
 * `dismiss` in `ToastProvider` is itself stable via `useCallback`).
 */
export const ToastItem = memo(function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      role={toast.level === "error" ? "alert" : "status"}
      aria-live={toast.level === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      className={`pointer-events-auto flex items-center gap-3 rounded-md px-4 py-2 text-sm shadow-lg ${
        toast.level === "error"
          ? "bg-rose-600 text-white"
          : "bg-black text-white dark:bg-white dark:text-black"
      }`}
    >
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={`Dismiss notification: ${toast.message}`}
        className="-mr-1 ml-auto rounded p-0.5 text-lg leading-none opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
});

/**
 * Provides the `useToast()` hook and renders the toast stack.
 *
 * Accessibility:
 * - The stack container acts as a status region while each individual toast
 *   manages its own accessibility properties dynamically based on severity:
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
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 flex flex-col gap-2"
      >
        {items.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
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
