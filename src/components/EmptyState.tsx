import { type ReactNode } from "react";

/**
 * EmptyState is a small presentational helper for empty list/detail screens.
 *
 * It renders a title and optional description and action content.
 */
type Props = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <section className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
      <p className="text-base font-medium">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-zinc-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}
