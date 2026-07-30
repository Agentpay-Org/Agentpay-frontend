/**
 * Page-level proof that the memoized parts of the usage view are not
 * re-rendered by unrelated state changes.
 *
 * Each memoized child module is replaced by a `memo`-wrapped counter that
 * delegates to the real implementation. Because the wrapper is itself
 * memoized, the counter only increments when the props the page passes have
 * actually changed identity — which is exactly the property this refactor
 * introduces (`useMemo` for derived data, `useCallback` for handlers).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { apiGet, apiPost } from "@/lib/apiClient";

let filtersRenders = 0;
let rowsRenders = 0;

jest.mock("@/lib/apiClient", () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

jest.mock("../UsageDateRangeFilters", () => {
  const React = jest.requireActual("react");
  const actual = jest.requireActual("../UsageDateRangeFilters");
  const CountingFilters = (props: Record<string, unknown>) => {
    filtersRenders += 1;
    return React.createElement(actual.UsageDateRangeFilters, props);
  };
  CountingFilters.displayName = "CountingUsageDateRangeFilters";
  return { ...actual, UsageDateRangeFilters: React.memo(CountingFilters) };
});

jest.mock("../UsageQueryRows", () => {
  const React = jest.requireActual("react");
  const actual = jest.requireActual("../UsageQueryRows");
  const CountingRows = (props: Record<string, unknown>) => {
    rowsRenders += 1;
    return React.createElement(actual.UsageQueryRows, props);
  };
  CountingRows.displayName = "CountingUsageQueryRows";
  return { ...actual, UsageQueryRows: React.memo(CountingRows) };
});

// Imported after the mocks so the page picks up the wrapped components.
import UsagePage from "../page";

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;
const apiPostMock = apiPost as jest.MockedFunction<typeof apiPost>;

function typeInRecordForm(value: string) {
  fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], {
    target: { value },
  });
}

function runQuery() {
  fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
    target: { value: "a" },
  });
  fireEvent.change(
    screen.getByLabelText(/^Service ID$/i, {
      selector: 'input[name="queryServiceId"]',
    }),
    { target: { value: "s" } },
  );
  fireEvent.click(screen.getByRole("button", { name: /Query/i }));
}

describe("UsagePage memoization", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-23T10:00:00.000Z"));
    apiGetMock.mockReset();
    apiPostMock.mockReset();
    filtersRenders = 0;
    rowsRenders = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("does not re-render the filters when unrelated fields change", () => {
    render(<UsagePage />);
    const afterMount = filtersRenders;
    expect(afterMount).toBe(1);

    typeInRecordForm("agent-1");
    fireEvent.change(screen.getByLabelText(/^Requests$/i), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "svc-1" },
    });

    expect(filtersRenders).toBe(afterMount);
  });

  it("does not re-render the filters across a large number of keystrokes", () => {
    render(<UsagePage />);
    const afterMount = filtersRenders;

    // Stand-in for a large data set / heavy interaction: 100 unrelated updates.
    for (let i = 0; i < 100; i += 1) {
      typeInRecordForm(`agent-${i}`);
    }

    expect(filtersRenders).toBe(afterMount);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("does not re-render the rows when unrelated fields change", async () => {
    apiGetMock.mockResolvedValueOnce({ agent: "a", serviceId: "s", total: 12 });
    render(<UsagePage />);
    runQuery();

    await waitFor(() => {
      expect(screen.getByText("12", { selector: "strong" })).toBeInTheDocument();
    });
    const afterResult = rowsRenders;

    for (let i = 0; i < 50; i += 1) {
      typeInRecordForm(`agent-${i}`);
    }

    expect(rowsRenders).toBe(afterResult);
    expect(screen.getByText("12", { selector: "strong" })).toBeInTheDocument();
  });

  it("does not re-render the rows while an unrelated record is in flight", async () => {
    apiGetMock.mockResolvedValueOnce({ agent: "a", serviceId: "s", total: 12 });
    apiPostMock.mockResolvedValueOnce({ total: 99 });
    render(<UsagePage />);
    runQuery();
    await waitFor(() => {
      expect(screen.getByText("12", { selector: "strong" })).toBeInTheDocument();
    });
    const afterResult = rowsRenders;

    typeInRecordForm("agent-1");
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "svc-1" },
    });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Record/i }));

    await waitFor(() => {
      expect(screen.getByText(/New total: 99/)).toBeInTheDocument();
    });

    expect(rowsRenders).toBe(afterResult);
    expect(screen.getByText("12", { selector: "strong" })).toBeInTheDocument();
  });

  it("still re-renders the filters when a preset is selected", () => {
    render(<UsagePage />);
    const afterMount = filtersRenders;

    fireEvent.click(screen.getByRole("radio", { name: "Last 7 days" }));

    expect(filtersRenders).toBeGreaterThan(afterMount);
    expect(screen.getByRole("radio", { name: "Last 7 days" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing Last 7 days.",
    );
  });

  it("still re-renders the filters when a custom date changes", () => {
    render(<UsagePage />);
    fireEvent.click(screen.getByRole("radio", { name: "Custom" }));
    const afterCustom = filtersRenders;

    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-07-01" },
    });

    expect(filtersRenders).toBeGreaterThan(afterCustom);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing usage from 2026-07-01 onwards.",
    );
  });

  it("still re-renders the rows when the query result changes", async () => {
    apiGetMock
      .mockResolvedValueOnce({ agent: "a", serviceId: "s", total: 12 })
      .mockResolvedValueOnce({ agent: "a", serviceId: "s", total: 30 });
    render(<UsagePage />);

    runQuery();
    await waitFor(() => {
      expect(screen.getByText("12", { selector: "strong" })).toBeInTheDocument();
    });
    const afterFirst = rowsRenders;

    runQuery();
    await waitFor(() => {
      expect(screen.getByText("30", { selector: "strong" })).toBeInTheDocument();
    });

    expect(rowsRenders).toBeGreaterThan(afterFirst);
  });
});
