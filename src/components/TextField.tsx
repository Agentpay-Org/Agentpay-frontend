import { type InputHTMLAttributes, type ReactNode, useId } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Visible label rendered above the input. */
  label: ReactNode;
  /** Optional helper text rendered beneath the input. Linked via aria-describedby. */
  description?: ReactNode;
  /** Optional error message; when present flips aria-invalid and exposes the message via aria-describedby. */
  error?: ReactNode;
};

/**
 * Accessible text input with a label, optional description, and optional
 * error message. Generates a stable internal id when none is supplied so the
 * label, description, and error message all stay linked to the input via
 * `htmlFor` / `id` / `aria-describedby` / `aria-invalid`.
 *
 * @example
 *   <TextField label="Email" description="We never share it" />
 *   <TextField label="Email" error="Please enter a valid address" />
 */
export function TextField({
  label,
  description,
  error,
  className = "",
  id,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = description ? `${inputId}-desc` : undefined;
  const errId = error ? `${inputId}-err` : undefined;
  return (
    <div className={`flex flex-col gap-1 text-sm ${className}`}>
      <label htmlFor={inputId}>
        <span>{label}</span>
      </label>
      <input
        id={inputId}
        aria-describedby={[descId, errId].filter(Boolean).join(" ") || undefined}
        aria-invalid={Boolean(error)}
        className="rounded-md border border-zinc-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
        {...rest}
      />
      {description && (
        <span id={descId} className="text-xs text-zinc-500">
          {description}
        </span>
      )}
      {error && (
        <span id={errId} role="alert" className="text-xs text-rose-600">
          {error}
        </span>
      )}
    </div>
  );
}
