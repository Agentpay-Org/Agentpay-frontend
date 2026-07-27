import { type ReactNode } from "react";

type Variant = "ok" | "warn" | "down";

const variants: Record<Variant, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  down: "bg-rose-500",
};

const labels: Record<Variant, string> = {
  ok: "Operational",
  warn: "Degraded",
  down: "Down",
};

/**
 * A colour-coded status indicator: a small decorative dot paired with a visible
 * text label, so status is never conveyed by colour alone (WCAG 1.4.1).
 *
 * Variants and their default labels:
 * - `ok`   → emerald dot, "Operational"
 * - `warn` → amber dot, "Degraded"
 * - `down` → rose dot, "Down"
 *
 * Pass `label` to override the default text while keeping the same dot
 * affordance — useful for states outside the three defaults (e.g. `"Paused"`
 * on a `warn` dot). An omitted, `null`, or empty-string `label` falls back to
 * the variant's default text, so the label is always present for screen
 * readers. The decorative dot is always `aria-hidden`.
 */
export function StatusDot({
  variant,
  label,
}: {
  variant: Variant;
  /** Optional text override; falls back to the variant default when empty. */
  label?: ReactNode;
}) {
  const resolvedLabel =
    label === undefined || label === null || label === ""
      ? labels[variant]
      : label;

  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-full ${variants[variant]}`}
      />
      <span>{resolvedLabel}</span>
    </span>
  );
}
