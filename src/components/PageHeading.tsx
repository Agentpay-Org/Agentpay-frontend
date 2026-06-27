import { type ReactNode } from "react";

/**
 * PageHeading renders a consistent <h1> header with optional description and
 * an action slot (e.g., button/link) on the right.
 */
type Props = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function PageHeading({ title, description, action }: Props) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
