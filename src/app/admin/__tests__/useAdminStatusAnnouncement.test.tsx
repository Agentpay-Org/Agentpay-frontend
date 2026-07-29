import { act, renderHook } from "@testing-library/react";

import {
  ADMIN_ANNOUNCEMENT_DEBOUNCE_MS,
  adminAnnouncementKey,
  buildAdminAnnouncement,
  useAdminStatusAnnouncement,
} from "../useAdminStatusAnnouncement";

function settle(ms = ADMIN_ANNOUNCEMENT_DEBOUNCE_MS) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

describe("adminAnnouncementKey / buildAdminAnnouncement", () => {
  it("maps paused status, empty (zero results), and idle states", () => {
    expect(adminAnnouncementKey(false, "ok")).toBe("live");
    expect(adminAnnouncementKey(true, "ok")).toBe("paused");
    expect(adminAnnouncementKey(null, "ok")).toBe("empty");
    expect(adminAnnouncementKey(null, "loading")).toBe("idle");
    expect(adminAnnouncementKey(null, "error")).toBe("idle");
  });

  it("builds polite announcement copy for each key", () => {
    expect(buildAdminAnnouncement("live")).toBe("Admin status: Live");
    expect(buildAdminAnnouncement("paused")).toBe("Admin status: Paused");
    expect(buildAdminAnnouncement("empty")).toBe("No admin data available");
    expect(buildAdminAnnouncement("idle")).toBe("");
  });
});

describe("useAdminStatusAnnouncement", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not announce on initial mount or first settled status", () => {
    const { result, rerender } = renderHook(
      ({ paused, fetchStatus }) =>
        useAdminStatusAnnouncement(paused, fetchStatus),
      { initialProps: { paused: null as boolean | null, fetchStatus: "loading" as const } }
    );

    expect(result.current).toBe("");

    rerender({ paused: false, fetchStatus: "ok" });
    settle();
    expect(result.current).toBe("");
  });

  it("does not announce before the debounce window elapses", () => {
    const { result, rerender } = renderHook(
      ({ paused, fetchStatus }) =>
        useAdminStatusAnnouncement(paused, fetchStatus),
      { initialProps: { paused: false as boolean | null, fetchStatus: "ok" as const } }
    );
    settle();
    expect(result.current).toBe("");

    rerender({ paused: true, fetchStatus: "ok" });
    act(() => {
      jest.advanceTimersByTime(ADMIN_ANNOUNCEMENT_DEBOUNCE_MS - 1);
    });
    expect(result.current).toBe("");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("Admin status: Paused");
  });

  it("announces status changes after the first baseline is established", () => {
    const { result, rerender } = renderHook(
      ({ paused, fetchStatus }) =>
        useAdminStatusAnnouncement(paused, fetchStatus),
      { initialProps: { paused: false as boolean | null, fetchStatus: "ok" as const } }
    );
    settle();

    rerender({ paused: true, fetchStatus: "ok" });
    settle();
    expect(result.current).toBe("Admin status: Paused");

    rerender({ paused: false, fetchStatus: "ok" });
    settle();
    expect(result.current).toBe("Admin status: Live");
  });

  it("collapses rapid successive updates into one announcement", () => {
    const { result, rerender } = renderHook(
      ({ paused, fetchStatus }) =>
        useAdminStatusAnnouncement(paused, fetchStatus),
      { initialProps: { paused: false as boolean | null, fetchStatus: "ok" as const } }
    );
    settle();

    rerender({ paused: true, fetchStatus: "ok" });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender({ paused: false, fetchStatus: "ok" });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender({ paused: true, fetchStatus: "ok" });

    expect(result.current).toBe("");
    settle();
    expect(result.current).toBe("Admin status: Paused");
  });

  it("announces zero results when status becomes empty after a baseline", () => {
    const { result, rerender } = renderHook(
      ({ paused, fetchStatus }) =>
        useAdminStatusAnnouncement(paused, fetchStatus),
      { initialProps: { paused: false as boolean | null, fetchStatus: "ok" as const } }
    );
    settle();

    rerender({ paused: null, fetchStatus: "ok" });
    settle();
    expect(result.current).toBe("No admin data available");
  });

  it("does not announce an initial empty (zero results) mount", () => {
    const { result } = renderHook(() =>
      useAdminStatusAnnouncement(null, "ok")
    );

    settle();
    expect(result.current).toBe("");
  });
});
