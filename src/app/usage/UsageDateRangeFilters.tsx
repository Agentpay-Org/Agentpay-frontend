"use client";

import { memo } from "react";

import {
  PRESET_KEYS,
  PRESET_RANGES,
  type PresetKey,
} from "./dateRange";

export type UsageDateRangeFiltersProps = {
  activePreset: PresetKey;
  startDate: string;
  endDate: string;
  /** Pre-derived range description, rendered into the polite live region. */
  announcement: string;
  onPresetChange: (key: PresetKey) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

/**
 * The date-range control for the usage view: preset radios, the custom
 * start/end inputs, and the range description.
 *
 * Wrapped in `memo` so that unrelated page state — typing in the Record or
 * Query form fields, an in-flight request, a returned total — does not
 * re-render this control or the preset buttons inside it. All of its props are
 * either primitives or callbacks the page holds stable with `useCallback`, so
 * the default shallow comparison is enough. It re-renders only when the range
 * itself changes.
 *
 * The markup is unchanged from the inline version it replaces.
 */
function UsageDateRangeFiltersInner({
  activePreset,
  startDate,
  endDate,
  announcement,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
}: UsageDateRangeFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Date range
        </legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Date range presets">
          {PRESET_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={activePreset === key}
              onClick={() => onPresetChange(key)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {PRESET_RANGES[key].label}
            </button>
          ))}
          <button
            type="button"
            role="radio"
            aria-checked={activePreset === "custom"}
            onClick={() => onPresetChange("custom")}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Custom
          </button>
        </div>
        {activePreset === "custom" && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">Start</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                aria-label="Start date"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">End</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                aria-label="End date"
              />
            </label>
          </div>
        )}
      </fieldset>
      <p role="status" aria-live="polite" className="text-xs text-zinc-500 dark:text-zinc-400">
        {announcement}
      </p>
    </div>
  );
}

export const UsageDateRangeFilters = memo(UsageDateRangeFiltersInner);
