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
 *
 * State model: unlike a `useApi`-backed view, this component has no
 * "loading" phase — `push()` is a synchronous, local state update, not a
 * network fetch, so there is nothing to retry. Its two states are:
 * - **Empty**: no toasts on screen. `push(message)` no-ops for a blank or
 *   whitespace-only `message` so this never regresses into a visible but
 *   content-less toast.
 * - **Error**: an individual toast pushed with `level: "error"` — rendered
 *   distinctly (`role="alert"`, `aria-live="assertive"`, rose background)
 *   from every other level, and interruptive by design rather than
 *   queued behind the current announcement.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((s) => s.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, level: Toast["level"] = "info") => {
      // Guard against the empty state: a blank or whitespace-only message
      // would otherwise render a content-less toast bubble — visible to
      // sighted users as an empty box, and silently skipped by assistive
      // tech (an aria-live region with no text announces nothing), so it
      // helps no one. Treat it as "nothing to show" and no-op instead.
      if (message.trim().length === 0) return;
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
