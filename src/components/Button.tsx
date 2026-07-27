import { type ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200",
  secondary:
    "border border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700",
};

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual style variant. @default "primary" */
  variant?: Variant;
  /** When true, disables the button, sets aria-busy, and renders an inline
   *  Spinner in place of the usual label. The button is not clickable while
   *  loading. */
  loading?: boolean;
};

/**
 * Primary action button with built-in loading / busy-state support.
 *
 * Renders a `<button>` element styled according to the chosen `variant`.
 * When `loading` is `true` the button is disabled, `aria-busy="true"` is set
 * so assistive technology announces the busy state, and an inline `Spinner`
 * appears alongside the children.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleSave}>Save</Button>
 * <Button loading onClick={handleSave}>Saving…</Button>
 * <Button variant="danger" loading>Deleting…</Button>
 * ```
 */
export function Button({
  variant = "primary",
  loading = false,
  type = "button",
  className = "",
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${ring} ${className}`}
    >
      {loading && <Spinner label="Loading" />}
      {children}
    </button>
  );
}
