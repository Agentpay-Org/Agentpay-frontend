"use client";

import { memo } from "react";

export type UsageRow = {
  agent: string;
  serviceId: string;
  total: number;
};

/**
 * Flatten a query response into the rows to render.
 *
 * Pure and cheap to call, but the identity of the returned array matters: the
 * page memoizes it so `UsageQueryRows` receives the same reference across
 * unrelated re-renders and can bail out.
 */
export function deriveUsageRows(
  result: UsageRow | null | undefined
): UsageRow[] {
  return result ? [result] : [];
}

export type UsageQueryRowsProps = {
  rows: UsageRow[];
};

/**
 * The query result rows.
 *
 * Wrapped in `memo` so unrelated page state — keystrokes in either form, a
 * record in flight — does not re-render the rows. It re-renders only when the
 * derived `rows` array changes identity, which the page ties to the query
 * result itself.
 *
 * The per-row markup is unchanged from the inline version it replaces.
 */
function UsageQueryRowsInner({ rows }: UsageQueryRowsProps) {
  return (
    <>
      {rows.map((row) => (
        <p
          key={`${row.agent}/${row.serviceId}`}
          role="status"
          className="text-sm"
        >
          {row.agent} / {row.serviceId}: <strong>{row.total}</strong> request(s).
        </p>
      ))}
    </>
  );
}

export const UsageQueryRows = memo(UsageQueryRowsInner);
