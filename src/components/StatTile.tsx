import { type ReactNode } from "react";

type Props = {
  label: ReactNode;
  value: ReactNode;
  trend?: { delta: number; positiveIsGood?: boolean };
};

const trendTone = {
  good: "text-emerald-700",
  bad: "text-rose-700",
  neutral: "text-zinc-500",
};

/** Interprets the delta from the caller's point of view, not just its sign. */
function getTrendIntent({ delta, positiveIsGood = true }: NonNullable<Props["trend"]>) {
  if (delta === 0) {
    return "neutral";
  }

  return (delta > 0) === positiveIsGood ? "good" : "bad";
}

export function StatTile({ label, value, trend }: Props) {
  const intent = trend ? getTrendIntent(trend) : null;
  const formattedDelta = trend
    ? `${trend.delta > 0 ? "+" : ""}${trend.delta}`
    : "";

  return (
    <div className="rounded-lg border border-zinc-200 p-4 text-center dark:border-zinc-800">
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">{value}</dd>
      {trend && intent && (
        <p
          aria-label={`Trend ${formattedDelta} is ${intent}`}
          className={`mt-1 text-xs ${trendTone[intent]}`}
        >
          {formattedDelta}
        </p>
      )}
    </div>
  );
}
