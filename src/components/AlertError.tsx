/**
 * Renders a `role="alert"` paragraph for inline error messages.
 * Returns `null` when `message` is falsy so callers can simply
 * write `<AlertError message={error} />` without a guard.
 */
export function AlertError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-rose-600">
      {message}
    </p>
  );
}
