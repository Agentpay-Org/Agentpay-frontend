import { act, renderHook } from "@testing-library/react";

import {
  HELP_ANNOUNCEMENT_DEBOUNCE_MS,
  helpAnnouncementKey,
  buildHelpAnnouncement,
  useHelpStatusAnnouncement,
  type HelpFetchStatus,
} from "../useHelpStatusAnnouncement";

function settle(ms = HELP_ANNOUNCEMENT_DEBOUNCE_MS) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

describe("helpAnnouncementKey / buildHelpAnnouncement", () => {
  it("maps success, empty (zero topics), error, and idle states", () => {
    expect(helpAnnouncementKey("ok", 3)).toBe("success");
    expect(helpAnnouncementKey("ok", 0)).toBe("empty");
    expect(helpAnnouncementKey("error", 0)).toBe("error");
    expect(helpAnnouncementKey("loading", 0)).toBe("idle");
  });

  it("builds polite announcement copy for each key", () => {
    expect(buildHelpAnnouncement("success")).toBe("Help topics loaded.");
    expect(buildHelpAnnouncement("empty")).toBe("No help topics found.");
    expect(buildHelpAnnouncement("error")).toBe("Failed to load help topics.");
    expect(buildHelpAnnouncement("idle")).toBe("");
  });
});

describe("useHelpStatusAnnouncement", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not announce on initial mount or first settled status", () => {
    const { result, rerender } = renderHook(
      ({ status, topicCount }) => useHelpStatusAnnouncement(status, topicCount),
      { initialProps: { status: "loading" as HelpFetchStatus, topicCount: 0 } }
    );

    expect(result.current).toBe("");

    rerender({ status: "ok", topicCount: 2 });
    settle();
    expect(result.current).toBe("");
  });

  it("does not announce before the debounce window elapses", () => {
    const { result, rerender } = renderHook(
      ({ status, topicCount }) => useHelpStatusAnnouncement(status, topicCount),
      { initialProps: { status: "ok" as HelpFetchStatus, topicCount: 2 } }
    );
    settle();
    expect(result.current).toBe("");

    rerender({ status: "error", topicCount: 0 });
    act(() => {
      jest.advanceTimersByTime(HELP_ANNOUNCEMENT_DEBOUNCE_MS - 1);
    });
    expect(result.current).toBe("");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("Failed to load help topics.");
  });

  it("announces success after a failure is resolved", () => {
    const { result, rerender } = renderHook(
      ({ status, topicCount }) => useHelpStatusAnnouncement(status, topicCount),
      { initialProps: { status: "error" as HelpFetchStatus, topicCount: 0 } }
    );
    settle();

    rerender({ status: "ok", topicCount: 4 });
    settle();
    expect(result.current).toBe("Help topics loaded.");
  });

  it("announces failure after a success", () => {
    const { result, rerender } = renderHook(
      ({ status, topicCount }) => useHelpStatusAnnouncement(status, topicCount),
      { initialProps: { status: "ok" as HelpFetchStatus, topicCount: 4 } }
    );
    settle();

    rerender({ status: "error", topicCount: 0 });
    settle();
    expect(result.current).toBe("Failed to load help topics.");
  });

  it("collapses rapid successive updates into one announcement", () => {
    const { result, rerender } = renderHook(
      ({ status, topicCount }) => useHelpStatusAnnouncement(status, topicCount),
      { initialProps: { status: "ok" as HelpFetchStatus, topicCount: 4 } }
    );
    settle();

    rerender({ status: "error", topicCount: 0 });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender({ status: "ok", topicCount: 4 });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender({ status: "error", topicCount: 0 });

    expect(result.current).toBe("");
    settle();
    expect(result.current).toBe("Failed to load help topics.");
  });

  it("announces zero results when status becomes empty after a baseline", () => {
    const { result, rerender } = renderHook(
      ({ status, topicCount }) => useHelpStatusAnnouncement(status, topicCount),
      { initialProps: { status: "ok" as HelpFetchStatus, topicCount: 4 } }
    );
    settle();

    rerender({ status: "ok", topicCount: 0 });
    settle();
    expect(result.current).toBe("No help topics found.");
  });

  it("does not announce an initial empty (zero results) mount", () => {
    const { result } = renderHook(() => useHelpStatusAnnouncement("ok", 0));

    settle();
    expect(result.current).toBe("");
  });
});
