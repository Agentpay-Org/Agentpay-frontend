import { fireEvent, render, screen } from "@testing-library/react";
import { useCallback, useState } from "react";

import {
  UsageDateRangeFilters,
  type UsageDateRangeFiltersProps,
} from "../UsageDateRangeFilters";
import { type PresetKey } from "../dateRange";

function renderFilters(overrides: Partial<UsageDateRangeFiltersProps> = {}) {
  const props: UsageDateRangeFiltersProps = {
    activePreset: "custom",
    startDate: "",
    endDate: "",
    announcement: "Showing all usage data (no date filter).",
    onPresetChange: jest.fn(),
    onStartDateChange: jest.fn(),
    onEndDateChange: jest.fn(),
    ...overrides,
  };
  return { ...render(<UsageDateRangeFilters {...props} />), props };
}

describe("UsageDateRangeFilters", () => {
  it("renders every preset radio plus Custom", () => {
    renderFilters();

    expect(
      screen.getByRole("radiogroup", { name: /date range presets/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    for (const label of [
      "Last 24 hours",
      "Last 7 days",
      "Last 30 days",
      "Custom",
    ]) {
      expect(screen.getByRole("radio", { name: label })).toBeInTheDocument();
    }
  });

  it("marks only the active preset as checked", () => {
    renderFilters({ activePreset: "7d" });

    expect(screen.getByRole("radio", { name: "Last 7 days" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Custom" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("reports preset changes to the parent", () => {
    const onPresetChange = jest.fn();
    renderFilters({ onPresetChange });

    fireEvent.click(screen.getByRole("radio", { name: "Last 30 days" }));
    expect(onPresetChange).toHaveBeenCalledWith("30d");

    fireEvent.click(screen.getByRole("radio", { name: "Custom" }));
    expect(onPresetChange).toHaveBeenCalledWith("custom");
  });

  it("shows the custom date inputs only for the custom preset", () => {
    const { unmount } = renderFilters({ activePreset: "custom" });
    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
    unmount();

    renderFilters({ activePreset: "24h" });
    expect(screen.queryByLabelText("Start date")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("End date")).not.toBeInTheDocument();
  });

  it("reports custom date edits to the parent", () => {
    const onStartDateChange = jest.fn();
    const onEndDateChange = jest.fn();
    renderFilters({ onStartDateChange, onEndDateChange });

    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-07-01" },
    });
    expect(onStartDateChange).toHaveBeenCalledWith("2026-07-01");

    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2026-07-15" },
    });
    expect(onEndDateChange).toHaveBeenCalledWith("2026-07-15");
  });

  it("renders the range description in a polite live region", () => {
    renderFilters({ announcement: "Showing Last 7 days." });

    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveTextContent("Showing Last 7 days.");
  });

  describe("memoization", () => {
    function Harness() {
      const [unrelated, setUnrelated] = useState(0);
      const [preset, setPreset] = useState<PresetKey>("custom");
      const onPresetChange = useCallback((key: PresetKey) => {
        setPreset(key);
      }, []);
      const noop = useCallback(() => {}, []);

      return (
        <>
          <button type="button" onClick={() => setUnrelated((n) => n + 1)}>
            bump {unrelated}
          </button>
          <UsageDateRangeFilters
            activePreset={preset}
            startDate=""
            endDate=""
            announcement="Showing all usage data (no date filter)."
            onPresetChange={onPresetChange}
            onStartDateChange={noop}
            onEndDateChange={noop}
          />
        </>
      );
    }

    it("is a memoized component", () => {
      // The memo boundary is the contract this refactor relies on; the
      // page-level test in `usage-memoization.test.tsx` proves it actually
      // bails out with the props the page supplies.
      expect(
        (UsageDateRangeFilters as unknown as { $$typeof: symbol }).$$typeof,
      ).toBe(Symbol.for("react.memo"));
    });

    it("survives unrelated parent updates without losing state or output", () => {
      render(<Harness />);

      fireEvent.click(screen.getByRole("button", { name: /bump/i }));
      fireEvent.click(screen.getByRole("button", { name: /bump/i }));

      expect(screen.getByText(/bump 2/)).toBeInTheDocument();
      expect(screen.getAllByRole("radio")).toHaveLength(4);
      expect(screen.getByRole("radio", { name: "Custom" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });

    it("still updates when the preset actually changes", () => {
      render(<Harness />);

      expect(screen.getByRole("radio", { name: "Custom" })).toHaveAttribute(
        "aria-checked",
        "true",
      );

      fireEvent.click(screen.getByRole("radio", { name: "Last 7 days" }));

      expect(
        screen.getByRole("radio", { name: "Last 7 days" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("radio", { name: "Custom" })).toHaveAttribute(
        "aria-checked",
        "false",
      );
    });
  });
});
