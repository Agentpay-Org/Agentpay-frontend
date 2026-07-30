import { act, renderHook } from "@testing-library/react";

import {
  API_KEYS_ANNOUNCEMENT_DEBOUNCE_MS,
  apiKeysAnnouncementKey,
  buildApiKeysAnnouncement,
  useApiKeysAnnouncement,
} from "../useApiKeysAnnouncement";

type KeyList = { length: number } | null | undefined;

function list(length: number): KeyList {
  return { length };
}

function settle(ms = API_KEYS_ANNOUNCEMENT_DEBOUNCE_MS) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

describe("apiKeysAnnouncementKey", () => {
  it("maps loading, empty (zero results), and populated states", () => {
    expect(apiKeysAnnouncementKey(null, null)).toBe("idle");
    expect(apiKeysAnnouncementKey(undefined, null)).toBe("idle");
    expect(apiKeysAnnouncementKey(list(0), null)).toBe("empty");
    expect(apiKeysAnnouncementKey(list(1), null)).toBe("count:1");
    expect(apiKeysAnnouncementKey(list(7), null)).toBe("count:7");
  });

  it("stays idle while an error is present so role=alert is not double-spoken", () => {
    expect(apiKeysAnnouncementKey(null, "boom")).toBe("idle");
    expect(apiKeysAnnouncementKey(list(0), "boom")).toBe("idle");
    expect(apiKeysAnnouncementKey(list(3), "boom")).toBe("idle");
  });

  it("returns a primitive key so the debounce can settle", () => {
    // Object keys would be a fresh reference each render and reset the timer.
    expect(typeof apiKeysAnnouncementKey(list(2), null)).toBe("string");
  });
});

describe("buildApiKeysAnnouncement", () => {
  it("builds polite copy for each key, pluralising the count", () => {
    expect(buildApiKeysAnnouncement("idle")).toBe("");
    expect(buildApiKeysAnnouncement("empty")).toBe("No API keys");
    expect(buildApiKeysAnnouncement("count:1")).toBe("1 API key");
    expect(buildApiKeysAnnouncement("count:2")).toBe("2 API keys");
    expect(buildApiKeysAnnouncement("count:42")).toBe("42 API keys");
  });
});

describe("useApiKeysAnnouncement", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not announce on initial mount or first settled list", () => {
    const { result, rerender } = renderHook(
      ({ items, error }) => useApiKeysAnnouncement(items, error),
      { initialProps: { items: null as KeyList, error: null as string | null } }
    );

    expect(result.current).toBe("");

    rerender({ items: list(3), error: null });
    settle();
    expect(result.current).toBe("");
  });

  it("does not announce an initial populated mount", () => {
    const { result } = renderHook(() =>
      useApiKeysAnnouncement(list(3), null)
    );

    settle();
    expect(result.current).toBe("");
  });

  it("does not announce an initial empty (zero results) mount", () => {
    const { result } = renderHook(() => useApiKeysAnnouncement(list(0), null));

    settle();
    expect(result.current).toBe("");
  });

  it("does not announce before the debounce window elapses", () => {
    const { result, rerender } = renderHook(
      ({ items, error }) => useApiKeysAnnouncement(items, error),
      { initialProps: { items: list(1), error: null as string | null } }
    );
    settle();
    expect(result.current).toBe("");

    rerender({ items: list(2), error: null });
    act(() => {
      jest.advanceTimersByTime(API_KEYS_ANNOUNCEMENT_DEBOUNCE_MS - 1);
    });
    expect(result.current).toBe("");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("2 API keys");
  });

  it("announces count changes once a baseline is established", () => {
    const { result, rerender } = renderHook(
      ({ items, error }) => useApiKeysAnnouncement(items, error),
      { initialProps: { items: list(1), error: null as string | null } }
    );
    settle();

    rerender({ items: list(3), error: null });
    settle();
    expect(result.current).toBe("3 API keys");

    rerender({ items: list(1), error: null });
    settle();
    expect(result.current).toBe("1 API key");
  });

  it("announces zero results when the last key is revoked", () => {
    const { result, rerender } = renderHook(
      ({ items, error }) => useApiKeysAnnouncement(items, error),
      { initialProps: { items: list(1), error: null as string | null } }
    );
    settle();

    rerender({ items: list(0), error: null });
    settle();
    expect(result.current).toBe("No API keys");
  });

  it("announces the first key added to an empty list", () => {
    const { result, rerender } = renderHook(
      ({ items, error }) => useApiKeysAnnouncement(items, error),
      { initialProps: { items: list(0), error: null as string | null } }
    );
    settle();

    rerender({ items: list(1), error: null });
    settle();
    expect(result.current).toBe("1 API key");
  });

  it("collapses rapid successive updates into one announcement", () => {
    const { result, rerender } = renderHook(
      ({ items, error }) => useApiKeysAnnouncement(items, error),
      { initialProps: { items: list(1), error: null as string | null } }
    );
    settle();

    rerender({ items: list(2), error: null });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender({ items: list(3), error: null });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender({ items: list(4), error: null });

    // Nothing spoken yet: each update restarted the debounce window.
    expect(result.current).toBe("");

    settle();
    expect(result.current).toBe("4 API keys");
  });

  it("does not re-announce when the count is unchanged", () => {
    const { result, rerender } = renderHook(
      ({ items, error }) => useApiKeysAnnouncement(items, error),
      { initialProps: { items: list(2), error: null as string | null } }
    );
    settle();

    rerender({ items: list(3), error: null });
    settle();
    expect(result.current).toBe("3 API keys");

    // A refetch returning the same count is not a meaningful change; the
    // announcement text is retained rather than re-queued.
    rerender({ items: list(3), error: null });
    settle();
    expect(result.current).toBe("3 API keys");
  });

  it("stays silent when a load error arrives after a baseline", () => {
    const { result, rerender } = renderHook(
      ({ items, error }) => useApiKeysAnnouncement(items, error),
      { initialProps: { items: list(2), error: null as string | null } }
    );
    settle();

    rerender({ items: null, error: "Request failed" });
    settle();
    expect(result.current).toBe("");
  });

  it("announces the recovered list after an error clears", () => {
    const { result, rerender } = renderHook(
      ({ items, error }) => useApiKeysAnnouncement(items, error),
      { initialProps: { items: list(2), error: null as string | null } }
    );
    settle();

    rerender({ items: null, error: "Request failed" });
    settle();
    expect(result.current).toBe("");

    rerender({ items: list(2), error: null });
    settle();
    expect(result.current).toBe("2 API keys");
  });

  it("stays silent when the first load fails and the retry then succeeds", () => {
    // A failed first load leaves no baseline, so the first successful list is
    // the baseline and is not announced.
    const { result, rerender } = renderHook(
      ({ items, error }) => useApiKeysAnnouncement(items, error),
      {
        initialProps: {
          items: null as KeyList,
          error: "Request failed" as string | null,
        },
      }
    );
    settle();

    rerender({ items: list(2), error: null });
    settle();
    expect(result.current).toBe("");
  });
});
