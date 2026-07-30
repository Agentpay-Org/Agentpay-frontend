import {
  PRESET_KEYS,
  PRESET_RANGES,
  buildDateRangeAnnouncement,
  daysAgo,
  hoursAgo,
  toISODate,
} from "../dateRange";

describe("dateRange helpers", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-23T10:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("formats a date as an ISO day", () => {
    expect(toISODate(new Date("2026-07-23T10:00:00.000Z"))).toBe("2026-07-23");
  });

  it("walks back by days and hours", () => {
    expect(toISODate(daysAgo(7))).toBe("2026-07-16");
    expect(toISODate(daysAgo(30))).toBe("2026-06-23");
    expect(toISODate(hoursAgo(24))).toBe("2026-07-22");
  });

  it("exposes the presets in render order, excluding custom", () => {
    expect(PRESET_KEYS).toEqual(["24h", "7d", "30d"]);
    expect(PRESET_KEYS).not.toContain("custom");
  });

  it("labels every preset", () => {
    expect(PRESET_RANGES["24h"].label).toBe("Last 24 hours");
    expect(PRESET_RANGES["7d"].label).toBe("Last 7 days");
    expect(PRESET_RANGES["30d"].label).toBe("Last 30 days");
  });

  it("computes each preset's start and end", () => {
    for (const key of PRESET_KEYS) {
      const range = PRESET_RANGES[key];
      expect(range.start().getTime()).toBeLessThan(range.end().getTime());
    }
  });

  describe("buildDateRangeAnnouncement", () => {
    it("describes each preset", () => {
      expect(buildDateRangeAnnouncement("24h", "", "")).toBe(
        "Showing Last 24 hours.",
      );
      expect(buildDateRangeAnnouncement("7d", "", "")).toBe(
        "Showing Last 7 days.",
      );
      expect(buildDateRangeAnnouncement("30d", "", "")).toBe(
        "Showing Last 30 days.",
      );
    });

    it("describes every custom-range combination", () => {
      expect(buildDateRangeAnnouncement("custom", "", "")).toBe(
        "Showing all usage data (no date filter).",
      );
      expect(
        buildDateRangeAnnouncement("custom", "2026-07-01", "2026-07-15"),
      ).toBe("Showing usage from 2026-07-01 to 2026-07-15.");
      expect(buildDateRangeAnnouncement("custom", "2026-07-01", "")).toBe(
        "Showing usage from 2026-07-01 onwards.",
      );
      expect(buildDateRangeAnnouncement("custom", "", "2026-07-15")).toBe(
        "Showing usage up to 2026-07-15.",
      );
    });
  });
});
