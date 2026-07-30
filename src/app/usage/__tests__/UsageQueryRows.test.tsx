import { render, screen } from "@testing-library/react";
import { useState } from "react";

import {
  UsageQueryRows,
  deriveUsageRows,
  type UsageRow,
} from "../UsageQueryRows";

describe("deriveUsageRows", () => {
  it("returns a single row for a result", () => {
    expect(deriveUsageRows({ agent: "a", serviceId: "s", total: 7 })).toEqual([
      { agent: "a", serviceId: "s", total: 7 },
    ]);
  });

  it("returns no rows for a missing result", () => {
    expect(deriveUsageRows(null)).toEqual([]);
    expect(deriveUsageRows(undefined)).toEqual([]);
  });

  it("keeps a total of zero as a row", () => {
    expect(deriveUsageRows({ agent: "a", serviceId: "s", total: 0 })).toHaveLength(
      1,
    );
  });
});

describe("UsageQueryRows", () => {
  it("renders a row with the unchanged output format", () => {
    render(
      <UsageQueryRows rows={[{ agent: "a", serviceId: "s", total: 12 }]} />,
    );

    const row = screen.getByRole("status");
    expect(row).toHaveTextContent("a / s: 12 request(s).");
    expect(screen.getByText("12", { selector: "strong" })).toBeInTheDocument();
  });

  it("renders nothing for zero rows", () => {
    const { container } = render(<UsageQueryRows rows={[]} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders a large data set", () => {
    const rows: UsageRow[] = Array.from({ length: 500 }, (_, i) => ({
      agent: `agent-${i}`,
      serviceId: `svc-${i}`,
      total: i,
    }));

    render(<UsageQueryRows rows={rows} />);

    expect(screen.getAllByRole("status")).toHaveLength(500);
    expect(screen.getByText(/agent-499 \/ svc-499/)).toBeInTheDocument();
  });

  /**
   * Detect re-renders without instrumenting the component: reading `total`
   * during render bumps a counter, so a skipped render leaves it untouched.
   */
  function countingRows(totals: number[]): {
    rows: UsageRow[];
    reads: () => number;
  } {
    let reads = 0;
    const rows = totals.map((total, i) => ({
      agent: `agent-${i}`,
      serviceId: `svc-${i}`,
      get total() {
        reads += 1;
        return total;
      },
    }));
    return { rows, reads: () => reads };
  }

  function Harness({ rows }: { rows: UsageRow[] }) {
    const [unrelated, setUnrelated] = useState(0);
    return (
      <>
        <button type="button" onClick={() => setUnrelated((n) => n + 1)}>
          bump {unrelated}
        </button>
        <UsageQueryRows rows={rows} />
      </>
    );
  }

  it("does not re-render when the parent re-renders with the same rows", () => {
    const { rows, reads } = countingRows([5]);
    render(<Harness rows={rows} />);

    const afterFirstRender = reads();
    expect(afterFirstRender).toBeGreaterThan(0);

    screen.getByRole("button", { name: /bump/i }).click();
    screen.getByRole("button", { name: /bump/i }).click();

    expect(reads()).toBe(afterFirstRender);
  });

  it("does not re-render a large data set on unrelated parent updates", () => {
    const { rows, reads } = countingRows(
      Array.from({ length: 500 }, (_, i) => i),
    );
    render(<Harness rows={rows} />);

    const afterFirstRender = reads();
    expect(afterFirstRender).toBeGreaterThanOrEqual(500);

    for (let i = 0; i < 20; i += 1) {
      screen.getByRole("button", { name: /bump/i }).click();
    }

    expect(reads()).toBe(afterFirstRender);
  });

  it("re-renders when the rows actually change", () => {
    const { rerender } = render(
      <UsageQueryRows rows={[{ agent: "a", serviceId: "s", total: 1 }]} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("1 request(s).");

    rerender(
      <UsageQueryRows rows={[{ agent: "a", serviceId: "s", total: 2 }]} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("2 request(s).");
  });
});
