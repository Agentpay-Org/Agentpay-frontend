import { type ReactNode } from "react";

type Variant = "neutral" | "ok" | "warning" | "danger";

const variants: Record<Variant, string> = {
  neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  danger: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

/**
 * Renders a small visual badge with text.
 * 
 * Variants:
 * - neutral: Default state for standard information (zinc/gray).
 * - ok: Positive or successful state (emerald/green).
 * - warning: Attention or pending state (amber/yellow).
 * - danger: Critical, error, or destructive state (rose/red).
 */
export function Badge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
