import React, { memo } from "react";
import { TimeAgo } from "@/components/TimeAgo";
import { safeFormatTimestamp, safeStringify } from "@/lib/format";

// Exported type from page.tsx, we can just inline it or import if we extract it.
// Wait, I will just inline the AppEvent type here or import it if I export it from page.tsx.
// Let's just define it here to avoid circular dependencies if any, or export it from page.tsx.
export type AppEvent = {
  id: string;
  ts: number | string | null;
  type: string;
  payload: unknown;
};

interface ActivityProps {
  event: AppEvent;
}

export const Activity = memo(function Activity({ event }: ActivityProps) {
  const timestamp = safeFormatTimestamp(event.ts);
  const numericTs =
    typeof event.ts === "number"
      ? event.ts
      : typeof event.ts === "string"
        ? Number(event.ts)
        : Number.NaN;
  const hasValidTs = Number.isFinite(numericTs);

  return (
    <li className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <span className="break-all font-mono text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
          {event.type}
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <time dateTime={timestamp} title={timestamp}>
            {timestamp}
          </time>
          {hasValidTs && <TimeAgo ts={numericTs} />}
        </div>
      </div>
      <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded bg-zinc-50 p-3 font-mono text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
        {safeStringify(event.payload)}
      </pre>
    </li>
  );
});
