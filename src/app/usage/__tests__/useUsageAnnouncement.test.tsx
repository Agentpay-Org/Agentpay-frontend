import { act, renderHook } from "@testing-library/react";

import {
  USAGE_ANNOUNCEMENT_DEBOUNCE_MS,
  usageAnnouncementKey,
  buildUsageAnnouncement,
  useUsageAnnouncement,
  type UsageQueryStateLike,
} from "../useUsageAnnouncement";

const IDLE: UsageQueryStateLike = { kind: "idle" };
const LOADING: UsageQueryStateLike = { kind: "loading" };
const ERROR: UsageQueryStateLike = { kind: "error", message: "boom" };
const EMPTY: UsageQueryStateLike = { kind: "ok", result: null };

function ok(total: number): UsageQueryStateLike {
  return { kind: "ok", result: { total } };
}

function settle(ms = USAGE_ANNOUNCEMENT_DEBOUNCE_MS) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

describe("usageAnnouncementKey", () => {
  it("maps idle, loading, empty (zero results), and populated states", () => {
    expect(usageAnnouncementKey(IDLE)).toBe("idle");
    expect(usageAnnouncementKey(LOADING)).toBe("idle");
    expect(usageAnnouncementKey(EMPTY)).toBe("empty");
    expect(usageAnnouncementKey(ok(0))).toBe("total:0");
    expect(usageAnnouncementKey(ok(1))).toBe("total:1");
    expect(usageAnnouncementKey(ok(42))).toBe("total:42");
  });

  it("stays idle on error so role=alert is not double-spoken", () => {
    expect(usageAnnouncementKey(ERROR)).toBe("idle");
  });

  it("returns a primitive key so the debounce can settle", () => {
    // Object keys would be a fresh reference each render and reset the timer.
    expect(typeof usageAnnouncementKey(ok(5))).toBe("string");
  });
});

describe("buildUsageAnnouncement", () => {
  it("builds polite copy for each key, pluralising the total", () => {
    expect(buildUsageAnnouncement("idle")).toBe("");
    expect(buildUsageAnnouncement("empty")).toBe("No usage data found");
    expect(buildUsageAnnouncement("total:0")).toBe("Usage total: 0 requests");
    expect(buildUsageAnnouncement("total:1")).toBe("Usage total: 1 request");
    expect(buildUsageAnnouncement("total:2")).toBe("Usage total: 2 requests");
  });
});

describe("useUsageAnnouncement", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not announce on initial mount or the first settled result", () => {
    const { result, rerender } = renderHook(
      ({ state }) => useUsageAnnouncement(state),
      { initialProps: { state: IDLE } }
    );

    expect(result.current).toBe("");

    rerender({ state: ok(5) });
    settle();
    expect(result.current).toBe("");
  });

  it("does not announce an initial populated mount", () => {
    const { result } = renderHook(() => useUsageAnnouncement(ok(5)));

    settle();
    expect(result.current).toBe("");
  });

  it("does not announce an initial empty (zero results) mount", () => {
    const { result } = renderHook(() => useUsageAnnouncement(EMPTY));

    settle();
    expect(result.current).toBe("");
  });

  it("does not announce before the debounce window elapses", () => {
    const { result, rerender } = renderHook(
      ({ state }) => useUsageAnnouncement(state),
      { initialProps: { state: ok(1) } }
    );
    settle();
    expect(result.current).toBe("");

    rerender({ state: ok(2) });
    act(() => {
      jest.advanceTimersByTime(USAGE_ANNOUNCEMENT_DEBOUNCE_MS - 1);
    });
    expect(result.current).toBe("");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("Usage total: 2 requests");
  });

  it("announces total changes once a baseline is established", () => {
    const { result, rerender } = renderHook(
      ({ state }) => useUsageAnnouncement(state),
      { initialProps: { state: ok(1) } }
    );
    settle();

    rerender({ state: ok(9) });
    settle();
    expect(result.current).toBe("Usage total: 9 requests");

    rerender({ state: ok(1) });
    settle();
    expect(result.current).toBe("Usage total: 1 request");
  });

  it("announces zero results when a query returns no payload", () => {
    const { result, rerender } = renderHook(
      ({ state }) => useUsageAnnouncement(state),
      { initialProps: { state: ok(5) } }
    );
    settle();

    rerender({ state: EMPTY });
    settle();
    expect(result.current).toBe("No usage data found");
  });

  it("announces a total of zero as a real result, not as empty", () => {
    const { result, rerender } = renderHook(
      ({ state }) => useUsageAnnouncement(state),
      { initialProps: { state: ok(5) } }
    );
    settle();

    rerender({ state: ok(0) });
    settle();
    expect(result.current).toBe("Usage total: 0 requests");
  });

  it("collapses rapid successive updates into one announcement", () => {
    const { result, rerender } = renderHook(
      ({ state }) => useUsageAnnouncement(state),
      { initialProps: { state: ok(1) } }
    );
    settle();

    rerender({ state: ok(2) });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender({ state: ok(3) });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender({ state: ok(4) });

    // Nothing spoken yet: each update restarted the debounce window.
    expect(result.current).toBe("");

    settle();
    expect(result.current).toBe("Usage total: 4 requests");
  });

  it("stays silent while a query is in flight and when it fails", () => {
    const { result, rerender } = renderHook(
      ({ state }) => useUsageAnnouncement(state),
      { initialProps: { state: ok(3) } }
    );
    settle();

    rerender({ state: LOADING });
    settle();
    expect(result.current).toBe("");

    rerender({ state: ERROR });
    settle();
    expect(result.current).toBe("");
  });

  it("re-announces an unchanged total because loading resets the key", () => {
    const { result, rerender } = renderHook(
      ({ state }) => useUsageAnnouncement(state),
      { initialProps: { state: ok(7) } }
    );
    settle();

    // A re-query passes through `loading` (idle key), so returning the same
    // total is still a key change and is announced.
    rerender({ state: LOADING });
    settle();
    rerender({ state: ok(7) });
    settle();
    expect(result.current).toBe("Usage total: 7 requests");
  });

  it("stays silent when the first query fails and the retry then succeeds", () => {
    // A failed first query leaves no baseline, so the first successful result
    // is the baseline and is not announced.
    const { result, rerender } = renderHook(
      ({ state }) => useUsageAnnouncement(state),
      { initialProps: { state: ERROR } }
    );
    settle();

    rerender({ state: ok(4) });
    settle();
    expect(result.current).toBe("");
  });
});
