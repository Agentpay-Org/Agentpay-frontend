/**
 * Date-range presets and the derived range description for the usage view.
 *
 * These are pure helpers with no React dependency so the values can be memoized
 * by the page and re-used by the memoized filter component without either side
 * pulling the other into a re-render.
 */

export type PresetKey = "24h" | "7d" | "30d" | "custom";

export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export function hoursAgo(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

export const PRESET_RANGES: Record<
  Exclude<PresetKey, "custom">,
  { start: () => Date; end: () => Date; label: string }
> = {
  "24h": { start: () => hoursAgo(24), end: () => new Date(), label: "Last 24 hours" },
  "7d": { start: () => daysAgo(7), end: () => new Date(), label: "Last 7 days" },
  "30d": { start: () => daysAgo(30), end: () => new Date(), label: "Last 30 days" },
};

/** The preset keys, in render order, excluding the `custom` escape hatch. */
export const PRESET_KEYS = Object.keys(PRESET_RANGES) as Array<
  Exclude<PresetKey, "custom">
>;

/**
 * Human-readable description of the active date range.
 *
 * Extracted unchanged from the page so the string can be derived once per
 * range change rather than on every render of the page.
 */
export function buildDateRangeAnnouncement(
  activePreset: PresetKey,
  startDate: string,
  endDate: string
): string {
  if (activePreset === "custom") {
    if (!startDate && !endDate) return "Showing all usage data (no date filter).";
    if (startDate && endDate) return `Showing usage from ${startDate} to ${endDate}.`;
    if (startDate) return `Showing usage from ${startDate} onwards.`;
    return `Showing usage up to ${endDate}.`;
  }
  return `Showing ${PRESET_RANGES[activePreset].label}.`;
}
