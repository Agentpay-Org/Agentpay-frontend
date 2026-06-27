import { type ReactNode } from "react";

/**
 * KeyValueGrid renders semantic label/value pairs using a <dl>.
 */
type Row = { label: ReactNode; value: ReactNode };

export function KeyValueGrid({ rows }: { rows: Row[] }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
      {rows.map((r, i) => (
        <div key={i} className="contents">
          <dt className="text-zinc-500">{r.label}</dt>
          <dd className="break-all">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
