import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import EventsPage from "./page";
import { safeFormatTimestamp } from "@/lib/format";

type EventRow = {
  id: string;
  ts: number;
  type: string;
  payload: Record<string, unknown>;
};

const BASE_TIME = new Date("2026-06-23T12:00:00.000Z");

const FIRST_BATCH: EventRow[] = [
  {
    id: "evt-1",
    ts: BASE_TIME.getTime() - 60_000,
    type: "payment.created",
    payload: { amount: 10 },
  },
  {
    id: "evt-2",
    ts: BASE_TIME.getTime() - 120_000,
    type: "payment.failed",
    payload: { code: "declined" },
  },
  {
    id: "evt-3",
    ts: BASE_TIME.getTime() - 180_000,
    type: "agent.updated",
    payload: { agent: "A1" },
  },
];

const REFRESH_BATCH: EventRow[] = [
  {
    id: "evt-4",
    ts: BASE_TIME.getTime() - 30_000,
    type: "payment.created",
    payload: { amount: 20 },
  },
  {
    id: "evt-5",
    ts: BASE_TIME.getTime() - 15_000,
    type: "audit.logged",
    payload: { note: "refreshed" },
  },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("EventsPage", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(BASE_TIME);
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("CSV export", () => {
    // jsdom's Blob implementation doesn't support `.text()`, so a capturing
    // stub records what the page constructs the Blob with instead of
    // relying on reading the Blob back out.
    class CapturingBlob {
      parts: string[];
      type: string;
      constructor(parts: BlobPart[], options?: BlobPropertyBag) {
        this.parts = parts as string[];
        this.type = options?.type ?? "";
      }
    }

    const originalBlob = global.Blob;
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    let clickSpy: jest.SpyInstance;
    let createObjectURLMock: jest.Mock;

    beforeEach(() => {
      clickSpy = jest
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation();
      global.Blob = CapturingBlob as unknown as typeof Blob;
      createObjectURLMock = jest.fn(() => "blob:events-export");
      URL.createObjectURL = createObjectURLMock as unknown as typeof URL.createObjectURL;
      URL.revokeObjectURL = jest.fn();
    });

    afterEach(() => {
      clickSpy.mockRestore();
      global.Blob = originalBlob;
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    function exportButton() {
      return screen.getByRole("button", { name: /export filtered events as csv/i });
    }

    function exportedBlob(): CapturingBlob {
      return createObjectURLMock.mock.calls[0][0] as CapturingBlob;
    }

    function exportedCsvText(): string {
      const raw = exportedBlob().parts.join("");
      // Strip the leading UTF-8 BOM before asserting on content.
      return raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    }

    it("disables the export button while loading", async () => {
      let resolveFetch: (value: Response) => void = () => {};
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });
      globalThis.fetch = jest.fn(() => fetchPromise) as unknown as typeof globalThis.fetch;

      render(<EventsPage />);

      expect(exportButton()).toBeDisabled();

      await act(async () => {
        resolveFetch(jsonResponse({ items: FIRST_BATCH }));
      });

      await waitFor(() => {
        expect(exportButton()).toBeEnabled();
      });
    });

    it("disables the export button when the filtered set is empty", async () => {
      globalThis.fetch = jest.fn(async () =>
        jsonResponse({ items: FIRST_BATCH }),
      ) as unknown as typeof globalThis.fetch;

      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByText("payment.created")).toBeInTheDocument();
      });
      expect(exportButton()).toBeEnabled();

      const filter = screen.getByRole("searchbox", {
        name: /filter events by type/i,
      });
      fireEvent.change(filter, { target: { value: "does-not-exist" } });

      await act(async () => {
        jest.advanceTimersByTime(250);
      });

      await waitFor(() => {
        expect(exportButton()).toBeDisabled();
      });
    });

    it("does not download anything when clicked while disabled", async () => {
      globalThis.fetch = jest.fn(async () =>
        jsonResponse({ items: [] }),
      ) as unknown as typeof globalThis.fetch;

      render(<EventsPage />);

      await waitFor(() => {
        expect(exportButton()).toBeDisabled();
      });

      fireEvent.click(exportButton());

      expect(createObjectURLMock).not.toHaveBeenCalled();
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("downloads a CSV of the currently filtered events with a header row", async () => {
      globalThis.fetch = jest.fn(async () =>
        jsonResponse({ items: FIRST_BATCH }),
      ) as unknown as typeof globalThis.fetch;

      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByText("payment.created")).toBeInTheDocument();
      });

      fireEvent.click(exportButton());

      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:events-export");

      const csv = exportedCsvText();
      const lines = csv.split("\r\n");
      expect(lines[0]).toBe("id,timestamp,type,payload");
      expect(lines).toHaveLength(1 + FIRST_BATCH.length);
      expect(lines[1]).toContain("evt-1");
      expect(lines[1]).toContain("payment.created");
      expect(lines[1]).toContain(safeFormatTimestamp(FIRST_BATCH[0].ts));
    });

    it("exports only the filtered subset, not the full unfiltered list", async () => {
      globalThis.fetch = jest.fn(async () =>
        jsonResponse({ items: FIRST_BATCH }),
      ) as unknown as typeof globalThis.fetch;

      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByText("payment.created")).toBeInTheDocument();
      });

      const filter = screen.getByRole("searchbox", {
        name: /filter events by type/i,
      });
      fireEvent.change(filter, { target: { value: "payment.failed" } });

      await act(async () => {
        jest.advanceTimersByTime(250);
      });

      await waitFor(() => {
        expect(screen.queryByText("payment.created")).not.toBeInTheDocument();
      });

      fireEvent.click(exportButton());

      const csv = exportedCsvText();
      const lines = csv.split("\r\n");
      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain("payment.failed");
    });

    it("exports events beyond the 100-row on-screen render cap", async () => {
      const largeList = Array.from({ length: 150 }, (_, i) => ({
        id: `evt-${i}`,
        ts: BASE_TIME.getTime() - i * 1000,
        type: "bulk.event",
        payload: { index: i },
      }));
      globalThis.fetch = jest.fn(async () =>
        jsonResponse({ items: largeList }),
      ) as unknown as typeof globalThis.fetch;

      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByText("Showing first 100 of 150 events.")).toBeInTheDocument();
      });

      fireEvent.click(exportButton());

      const csv = exportedCsvText();
      const lines = csv.split("\r\n");
      expect(lines).toHaveLength(1 + 150);
      expect(csv).toContain("evt-149");
    });

    it("escapes embedded commas, quotes, and newlines and guards formula-injection prefixes", async () => {
      // "id" starts with a formula-trigger char ("="); "type" carries a
      // comma, an embedded quote, and a newline. Keeping these on raw
      // (non-JSON) fields makes the expected escaping unambiguous — the
      // payload column goes through safeStringify separately and is
      // exercised by the other export tests.
      const trickyEvents = [
        {
          id: "=cmd|' /c calc'!A1",
          ts: BASE_TIME.getTime(),
          type: 'csv,injection "quoted"\nvalue',
          payload: { plain: "ok" },
        },
      ];
      globalThis.fetch = jest.fn(async () =>
        jsonResponse({ items: trickyEvents }),
      ) as unknown as typeof globalThis.fetch;

      render(<EventsPage />);

      await waitFor(() => {
        expect(exportButton()).toBeEnabled();
      });

      fireEvent.click(exportButton());

      const csv = exportedCsvText();

      // A field that starts with "=" is prefixed with an apostrophe so
      // spreadsheet software treats it as text, not a formula.
      expect(csv).toContain("'=cmd|' /c calc'!A1");
      // A field with a comma, an embedded quote, and a newline is wrapped in
      // quotes, with the embedded quote doubled per RFC 4180.
      expect(csv).toContain('"csv,injection ""quoted""\nvalue"');
      // The overall row count must still be exactly header + 1 data row —
      // the embedded newline must not be interpreted as a new CSV record.
      expect(csv.split("\r\n")).toHaveLength(2);
    });

    it("prepends a UTF-8 BOM and uses a text/csv blob type", async () => {
      globalThis.fetch = jest.fn(async () =>
        jsonResponse({ items: FIRST_BATCH.slice(0, 1) }),
      ) as unknown as typeof globalThis.fetch;

      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByText("payment.created")).toBeInTheDocument();
      });

      fireEvent.click(exportButton());

      const blob = exportedBlob();
      expect(blob.type).toBe("text/csv;charset=utf-8;");
      const raw = blob.parts.join("");
      expect(raw.charCodeAt(0)).toBe(0xfeff);
    });

    it("sets a .csv download filename on the anchor", async () => {
      globalThis.fetch = jest.fn(async () =>
        jsonResponse({ items: FIRST_BATCH.slice(0, 1) }),
      ) as unknown as typeof globalThis.fetch;

      render(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByText("payment.created")).toBeInTheDocument();
      });

      fireEvent.click(exportButton());

      expect(clickSpy).toHaveBeenCalledTimes(1);
      const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
      expect(anchor.download).toMatch(/^events-.*\.csv$/);
    });
  });

  it("renders events, filters by type, and shows an empty state when nothing matches", async () => {
    const fetchMock = jest.fn(async (url: RequestInfo | URL) => {
      expect(String(url)).toContain("/api/v1/events?limit=100");
      return jsonResponse({ items: FIRST_BATCH });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { container } = render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText("payment.created")).toBeInTheDocument();
      expect(screen.getByText("payment.failed")).toBeInTheDocument();
      expect(screen.getByText("agent.updated")).toBeInTheDocument();
    });

    expect(container.querySelectorAll("time")).toHaveLength(6);
    expect(screen.getByText("1m ago")).toBeInTheDocument();

    const filter = screen.getByRole("searchbox", {
      name: /filter events by type/i,
    });
    fireEvent.change(filter, { target: { value: "payment.failed" } });

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    await waitFor(() => {
      expect(screen.getByText("payment.failed")).toBeInTheDocument();
      expect(screen.queryByText("payment.created")).not.toBeInTheDocument();
      expect(screen.queryByText("agent.updated")).not.toBeInTheDocument();
    });

    expect(fetchMock.mock.calls[1][0]).toContain("type=payment.failed");

    fireEvent.change(filter, { target: { value: "does-not-exist" } });

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/No events match "does-not-exist"\./i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /clear filter/i })
      ).toBeInTheDocument();
    });
  });

  it("starts and stops polling when auto-refresh is toggled", async () => {
    let call = 0;
    const fetchMock = jest.fn(async () => {
      call += 1;
      return call === 1
        ? jsonResponse({ items: FIRST_BATCH.slice(0, 1) })
        : jsonResponse({ items: REFRESH_BATCH });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText("payment.created")).toBeInTheDocument();
    });

    const toggle = screen.getByRole("button", { name: /auto-refresh event log/i });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByText("audit.logged")).toBeInTheDocument();
    });
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(3);

    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    const callsAfterOff = fetchMock.mock.calls.length;

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(fetchMock.mock.calls.length).toBe(callsAfterOff);
  });

  it("clears the polling interval on unmount", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ items: FIRST_BATCH }));
    const clearIntervalSpy = jest.spyOn(globalThis, "clearInterval");
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { unmount } = render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText("payment.created")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /auto-refresh event log/i }));

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();

    const callsBefore = fetchMock.mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(callsBefore);
  });

  it("surfaces malformed event payloads as an error", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ items: { nope: true } }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /malformed events payload/i
      );
    });
  });

  it("throws when an item in the array is not an object", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ items: [null] }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /malformed events payload/i
      );
    });
  });

  it("handles the alternative { events: [...] } response shape", async () => {
    const fetchMock = jest.fn(async () =>
      jsonResponse({ events: FIRST_BATCH.slice(0, 1) })
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText("payment.created")).toBeInTheDocument();
    });
  });

  it("coerces non-numeric/non-string/non-null ts to null", async () => {
    const weirdEvents = [
      {
        id: "evt-weird",
        ts: { some: "object" }, // should be coerced to null
        type: "weird.event",
        payload: {},
      },
    ];

    const fetchMock = jest.fn(async () => jsonResponse({ items: weirdEvents }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText("weird.event")).toBeInTheDocument();
    });

    // When ts is null, safeFormatTimestamp returns \u2014 (em-dash)
    // and TimeAgo is not rendered.
    expect(screen.getByText("\u2014")).toBeInTheDocument();
  });

  it("throws when neither items nor events is an array", async () => {
    const fetchMock = jest.fn(async () =>
      jsonResponse({ items: "not-an-array", events: "also-not-an-array" })
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /malformed events payload/i
      );
    });
  });

  it("handles missing type field by coercing to empty string", async () => {
    const missingTypeEvents = [
      {
        id: "evt-no-type",
        ts: BASE_TIME.getTime(),
        // type is missing
        payload: { test: "missing-type" },
      },
    ];

    const fetchMock = jest.fn(async () => jsonResponse({ items: missingTypeEvents }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<EventsPage />);

    await waitFor(() => {
      // Verify the payload is rendered, confirming the item was processed
      expect(screen.getByText(/"test": "missing-type"/)).toBeInTheDocument();
    });

    // The type span should be empty but present
    const spans = screen.getAllByRole("listitem")[0].querySelectorAll("span");
    expect(spans[0]).toHaveTextContent("");
  });

  it("caps rendered events at 100 and shows truncation note when list exceeds cap", async () => {
    const largeList = Array.from({ length: 150 }, (_, i) => ({
      id: `evt-${i}`,
      ts: BASE_TIME.getTime() - i * 1000,
      type: `event.type.${i}`,
      payload: { index: i },
    }));

    const fetchMock = jest.fn(async () => jsonResponse({ items: largeList }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText("event.type.0")).toBeInTheDocument();
    });

    // Should show exactly 100 events
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(100);

    // Should show the truncation note
    expect(screen.getByText("Showing first 100 of 150 events.")).toBeInTheDocument();

    // First 100 should be rendered
    expect(screen.getByText("event.type.0")).toBeInTheDocument();
    expect(screen.getByText("event.type.99")).toBeInTheDocument();

    // 101st and beyond should not be rendered
    expect(screen.queryByText("event.type.100")).not.toBeInTheDocument();
    expect(screen.queryByText("event.type.149")).not.toBeInTheDocument();
  });

  it("does not show truncation note when list is below cap", async () => {
    const smallList = Array.from({ length: 50 }, (_, i) => ({
      id: `evt-${i}`,
      ts: BASE_TIME.getTime() - i * 1000,
      type: `event.type.${i}`,
      payload: { index: i },
    }));

    const fetchMock = jest.fn(async () => jsonResponse({ items: smallList }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText("event.type.0")).toBeInTheDocument();
    });

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(50);

    // Should not show truncation note
    expect(screen.queryByText(/Showing first \d+ of \d+ events\./)).not.toBeInTheDocument();
  });

  it("caps rendered events after filtering", async () => {
    const largeList = Array.from({ length: 150 }, (_, i) => ({
      id: `evt-${i}`,
      ts: BASE_TIME.getTime() - i * 1000,
      type: i < 120 ? "payment.created" : `other.type.${i}`,
      payload: { index: i },
    }));

    const fetchMock = jest.fn(async () => jsonResponse({ items: largeList }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("payment.created").length).toBeGreaterThan(0);
    });

    const filter = screen.getByRole("searchbox", {
      name: /filter events by type/i,
    });
    fireEvent.change(filter, { target: { value: "payment" } });

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    await waitFor(() => {
      expect(screen.getByText("Showing first 100 of 120 events.")).toBeInTheDocument();
    });

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(100);
  });

  it("does not cause re-render churn when data is unchanged across polls", async () => {
    let renderCount = 0;
    const stableData = FIRST_BATCH;

    const fetchMock = jest.fn(async () => jsonResponse({ items: stableData }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const TestWrapper = () => {
      renderCount++;
      return <EventsPage />;
    };

    render(<TestWrapper />);

    await waitFor(() => {
      expect(screen.getByText("payment.created")).toBeInTheDocument();
    });

    const initialRenderCount = renderCount;

    const toggle = screen.getByRole("button", { name: /auto-refresh event log/i });
    await act(async () => {
      fireEvent.click(toggle);
    });

    // Advance through multiple poll cycles
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    // Should have fetched multiple times
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(3);

    // Render count should not increase excessively
    // (some re-renders are expected for state updates, but not one per list item)
    expect(renderCount).toBeLessThan(initialRenderCount + 10);
  });

  it("renders spinner/busy region during initial load, which goes away after load", async () => {
    let resolveFetch: (value: Response) => void = () => {};
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = jest.fn(() => fetchPromise);
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<EventsPage />);

    // Assert spinner is present and busy region has correct aria attributes
    const statusElements = screen.getAllByRole("status");
    const busyRegion = statusElements.find((el) => el.getAttribute("aria-busy") === "true");
    expect(busyRegion).toBeDefined();
    expect(busyRegion).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading events")).toBeInTheDocument();

    // Resolve the fetch
    await act(async () => {
      resolveFetch(jsonResponse({ items: FIRST_BATCH }));
    });

    // Assert spinner/busy region is gone
    await waitFor(() => {
      expect(screen.queryAllByRole("status")).toHaveLength(0);
    });
    expect(screen.getByText("payment.created")).toBeInTheDocument();
  });

  it("does not render/flash spinner during background auto-refresh", async () => {
    let resolveFirstFetch: (value: Response) => void = () => {};
    const firstFetchPromise = new Promise<Response>((resolve) => {
      resolveFirstFetch = resolve;
    });

    let resolveSecondFetch: (value: Response) => void = () => {};
    const secondFetchPromise = new Promise<Response>((resolve) => {
      resolveSecondFetch = resolve;
    });

    let resolveThirdFetch: (value: Response) => void = () => {};
    const thirdFetchPromise = new Promise<Response>((resolve) => {
      resolveThirdFetch = resolve;
    });

    let call = 0;
    const fetchMock = jest.fn(() => {
      call += 1;
      if (call === 1) return firstFetchPromise;
      if (call === 2) return secondFetchPromise;
      return thirdFetchPromise;
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<EventsPage />);

    // 1. Initial load
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
    await act(async () => {
      resolveFirstFetch(jsonResponse({ items: FIRST_BATCH }));
    });
    await waitFor(() => {
      expect(screen.queryAllByRole("status")).toHaveLength(0);
    });

    // 2. Turn on auto-refresh (triggers load(false) on useEffect effect restart)
    const toggle = screen.getByRole("button", { name: /auto-refresh event log/i });
    await act(async () => {
      fireEvent.click(toggle);
    });

    // Resolve the toggle-triggered load(false) fetch
    await act(async () => {
      resolveSecondFetch(jsonResponse({ items: FIRST_BATCH }));
    });
    await waitFor(() => {
      expect(screen.queryAllByRole("status")).toHaveLength(0);
    });

    // 3. Advance timer to trigger background auto-refresh (load(true))
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    // Assert third fetch is pending, but spinner is NOT shown (because background auto-refresh shouldn't trigger loading state)
    expect(screen.queryAllByRole("status")).toHaveLength(0);

    // Resolve third fetch
    await act(async () => {
      resolveThirdFetch(jsonResponse({ items: REFRESH_BATCH }));
    });

    // Assert updated data is present
    await waitFor(() => {
      expect(screen.getByText("audit.logged")).toBeInTheDocument();
    });
    expect(screen.queryAllByRole("status")).toHaveLength(0);
  });

  it("shows error and hides spinner when load fails", async () => {
    let rejectFetch: (reason: Error) => void = () => {};
    const fetchPromise = new Promise<Response>((_, reject) => {
      rejectFetch = reject;
    });
    const fetchMock = jest.fn(() => fetchPromise);
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<EventsPage />);

    // Assert initial spinner is shown
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    // Reject fetch with error
    await act(async () => {
      rejectFetch(new Error("API Error"));
    });

    // Assert spinner is gone and error is shown
    await waitFor(() => {
      expect(screen.queryAllByRole("status")).toHaveLength(0);
      expect(screen.getByRole("alert")).toHaveTextContent("API Error");
    });
  });

  describe("activity state rendering", () => {
    it("renders loading state correctly", async () => {
      let resolveFetch: (value: Response) => void = () => {};
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });
      globalThis.fetch = jest.fn(() => fetchPromise) as unknown as typeof globalThis.fetch;
      render(<EventsPage />);
      expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByText("No events yet.")).not.toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
      
      await act(async () => {
        resolveFetch(jsonResponse({ items: [] }));
      });
    });

    it("renders empty state correctly", async () => {
      let resolveFetch: (value: Response) => void = () => {};
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });
      globalThis.fetch = jest.fn(() => fetchPromise) as unknown as typeof globalThis.fetch;
      
      render(<EventsPage />);
      
      await act(async () => {
        resolveFetch(jsonResponse({ items: [] }));
      });

      await waitFor(() => {
        expect(screen.getByText("No events yet.")).toBeInTheDocument();
      });
      expect(screen.queryAllByRole("status")).toHaveLength(0);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("renders error state correctly", async () => {
      let rejectFetch: (reason: Error) => void = () => {};
      const fetchPromise = new Promise<Response>((_, reject) => {
        rejectFetch = reject;
      });
      globalThis.fetch = jest.fn(() => fetchPromise) as unknown as typeof globalThis.fetch;
      
      render(<EventsPage />);
      
      await act(async () => {
        rejectFetch(new Error("API Error"));
      });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("API Error");
      });
      expect(screen.queryAllByRole("status")).toHaveLength(0);
      expect(screen.queryByText("No events yet.")).not.toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("renders success state correctly", async () => {
      let resolveFetch: (value: Response) => void = () => {};
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });
      globalThis.fetch = jest.fn(() => fetchPromise) as unknown as typeof globalThis.fetch;
      
      render(<EventsPage />);
      
      await act(async () => {
        resolveFetch(jsonResponse({ items: FIRST_BATCH }));
      });

      await waitFor(() => {
        expect(screen.getByText("payment.created")).toBeInTheDocument();
      });
      expect(screen.queryAllByRole("status")).toHaveLength(0);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByText("No events yet.")).not.toBeInTheDocument();
    });
  });
});

