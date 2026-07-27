/**
 * Sparkline — a dependency-free inline SVG micro-chart.
 *
 * Accessibility contract
 * ─────────────────────
 * • The SVG carries `role="img"` and an `aria-label` that summarises the trend
 *   direction (rising / falling / flat) and the numeric range so assistive
 *   technology users receive meaningful information without having to interpret
 *   the graphic.
 * • A `<details>` element below the chart exposes the raw data points in a
 *   semantic `<table>` so every number is reachable via keyboard and screen
 *   readers.
 *
 * Motion contract
 * ───────────────
 * • When `prefers-reduced-motion: reduce` is active the stroke-dashoffset
 *   draw animation is entirely omitted.  The preference is checked at render
 *   time through `window.matchMedia` (falls back gracefully in SSR / jsdom).
 */

"use client";

import { useMemo } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SparklineProps {
  /** Raw data series. Finite values only; NaN / Infinity are silently dropped. */
  data: number[];
  /**
   * Accessible label that is injected into the auto-generated aria-label.
   * E.g. `"Request count"` → `"Request count sparkline: rising trend, 5 → 42"`.
   * When omitted the label begins with `"Usage sparkline:"`.
   */
  label?: string;
  /** Viewport width in pixels. Defaults to 160. */
  width?: number;
  /** Viewport height in pixels. Defaults to 40. */
  height?: number;
  /** Stroke colour for the polyline. Defaults to `"currentColor"`. */
  strokeColor?: string;
  /** Stroke width in pixels. Defaults to 1.5. */
  strokeWidth?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Keep only finite numbers so NaN / Infinity never corrupt the SVG math. */
function filterFinite(values: number[]): number[] {
  return values.filter((v) => Number.isFinite(v));
}

type TrendDirection = "rising" | "falling" | "flat";

function computeTrend(values: number[]): TrendDirection {
  if (values.length < 2) return "flat";
  const first = values[0];
  const last = values[values.length - 1];
  if (last > first) return "rising";
  if (last < first) return "falling";
  return "flat";
}

/**
 * Map a data series onto SVG polyline points.
 * X is spread evenly; Y is normalised to fit `height` with a 2 px padding.
 */
function toPoints(
  values: number[],
  width: number,
  height: number
): string {
  if (values.length === 0) return "";

  const padding = 2;
  const innerH = height - padding * 2;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  return values
    .map((v, i) => {
      const x =
        values.length === 1
          ? width / 2
          : (i / (values.length - 1)) * width;
      const y =
        range === 0
          ? height / 2
          : padding + innerH - ((v - min) / range) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

/** Build the human-readable aria-label. */
function buildAriaLabel(
  prefix: string,
  values: number[],
  trend: TrendDirection
): string {
  if (values.length === 0) {
    return `${prefix}: no data available`;
  }
  if (values.length === 1) {
    return `${prefix}: single data point, value ${values[0]}`;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  return `${prefix}: ${trend} trend, range ${min} to ${max}`;
}

/** Detect prefers-reduced-motion safely (SSR / jsdom safe). */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Renders an inline SVG sparkline for a numeric data series.
 *
 * @example
 * ```tsx
 * <Sparkline data={[10, 24, 18, 35, 42]} label="Request count" />
 * ```
 */
export function Sparkline({
  data,
  label = "Usage",
  width = 160,
  height = 40,
  strokeColor = "currentColor",
  strokeWidth = 1.5,
}: SparklineProps) {
  const values = useMemo(() => filterFinite(data), [data]);
  const trend = useMemo(() => computeTrend(values), [values]);
  const points = useMemo(
    () => toPoints(values, width, height),
    [values, width, height]
  );

  const prefix = `${label} sparkline`;
  const ariaLabel = useMemo(
    () => buildAriaLabel(prefix, values, trend),
    [prefix, values, trend]
  );

  const skipAnimation = prefersReducedMotion();

  // Total polyline length estimation: used for the stroke-dasharray draw trick.
  // We over-estimate so the animation always completes a full reveal.
  const pathLength = width * 2 + height * 2;

  return (
    <div className="flex flex-col gap-1">
      {/* ── SVG chart ── */}
      <svg
        role="img"
        aria-label={ariaLabel}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        overflow="visible"
        data-testid="sparkline-svg"
      >
        {!skipAnimation && (
          <style>{`
            @keyframes spark-draw {
              from { stroke-dashoffset: ${pathLength}; }
              to   { stroke-dashoffset: 0; }
            }
            .spark-line {
              stroke-dasharray: ${pathLength};
              stroke-dashoffset: 0;
              animation: spark-draw 0.8s ease-out forwards;
            }
            @media (prefers-reduced-motion: reduce) {
              .spark-line { animation: none; }
            }
          `}</style>
        )}

        {values.length > 0 ? (
          <polyline
            data-testid="sparkline-polyline"
            className={skipAnimation ? undefined : "spark-line"}
            points={points}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          /* Empty state: a subtle horizontal centre line */
          <line
            data-testid="sparkline-empty-line"
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray="2 4"
            opacity={0.3}
          />
        )}
      </svg>

      {/* ── Accessible table fallback ── */}
      {values.length > 0 && (
        <details className="text-xs text-zinc-500 dark:text-zinc-400">
          <summary className="cursor-pointer select-none">
            Show data table
          </summary>
          <table
            aria-label={`${label} data table`}
            className="mt-1 w-full border-collapse text-left"
          >
            <thead>
              <tr>
                <th
                  scope="col"
                  className="border border-zinc-200 px-2 py-0.5 dark:border-zinc-700"
                >
                  Point
                </th>
                <th
                  scope="col"
                  className="border border-zinc-200 px-2 py-0.5 dark:border-zinc-700"
                >
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {values.map((v, i) => (
                <tr key={i}>
                  <td className="border border-zinc-200 px-2 py-0.5 dark:border-zinc-700">
                    {i + 1}
                  </td>
                  <td className="border border-zinc-200 px-2 py-0.5 dark:border-zinc-700">
                    {v}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
