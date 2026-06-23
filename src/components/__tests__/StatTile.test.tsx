import { render, screen } from "@testing-library/react";
import { StatTile } from "../StatTile";

describe("StatTile", () => {
  it("renders label and value without a trend", () => {
    render(<StatTile label="Payments" value="42" />);

    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.queryByLabelText(/trend/i)).not.toBeInTheDocument();
  });

  it("treats a positive delta as good by default", () => {
    render(<StatTile label="Revenue" value="$120" trend={{ delta: 8 }} />);

    expect(screen.getByLabelText("Trend +8 is good")).toHaveTextContent("+8");
  });

  it("treats a negative delta as bad by default", () => {
    render(<StatTile label="Errors" value="3" trend={{ delta: -2 }} />);

    expect(screen.getByLabelText("Trend -2 is bad")).toHaveTextContent("-2");
  });

  it("inverts the trend intent when lower values are better", () => {
    render(
      <>
        <StatTile
          label="Latency"
          value="180ms"
          trend={{ delta: -12, positiveIsGood: false }}
        />
        <StatTile
          label="Retries"
          value="9"
          trend={{ delta: 4, positiveIsGood: false }}
        />
      </>,
    );

    expect(screen.getByLabelText("Trend -12 is good")).toHaveTextContent("-12");
    expect(screen.getByLabelText("Trend +4 is bad")).toHaveTextContent("+4");
  });

  it("renders zero as neutral regardless of direction preference", () => {
    render(
      <>
        <StatTile label="Volume" value="100" trend={{ delta: 0 }} />
        <StatTile
          label="Latency"
          value="180ms"
          trend={{ delta: 0, positiveIsGood: false }}
        />
      </>,
    );

    expect(screen.getAllByLabelText("Trend 0 is neutral")).toHaveLength(2);
  });
});
