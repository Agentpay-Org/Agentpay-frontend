import { render, screen, act } from "@testing-library/react";
import { TimeAgo } from "../TimeAgo";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const SEC = 1000;
const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

const BASELINE = 1_700_000_000_000;

function iso(ts: number) {
  return new Date(ts).toISOString();
}

describe("TimeAgo", () => {
  describe("formatting boundary deltas", () => {
    it('renders "just now" for a future timestamp (negative delta)', () => {
      jest.setSystemTime(BASELINE);
      render(<TimeAgo ts={BASELINE + 5000} />);
      expect(screen.getByText("just now")).toBeInTheDocument();
    });

    it('renders "just now" for zero delta', () => {
      jest.setSystemTime(BASELINE);
      render(<TimeAgo ts={BASELINE} />);
      expect(screen.getByText("just now")).toBeInTheDocument();
    });

    it('renders "just now" for sub-second delta', () => {
      jest.setSystemTime(BASELINE);
      render(<TimeAgo ts={BASELINE - 500} />);
      expect(screen.getByText("just now")).toBeInTheDocument();
    });

    it('renders "X ago" for seconds', () => {
      jest.setSystemTime(BASELINE);
      render(<TimeAgo ts={BASELINE - 45 * SEC} />);
      expect(screen.getByText("45s ago")).toBeInTheDocument();
    });

    it('renders "Xm ago" for minutes', () => {
      jest.setSystemTime(BASELINE);
      render(<TimeAgo ts={BASELINE - 5 * MIN} />);
      expect(screen.getByText("5m ago")).toBeInTheDocument();
    });

    it('renders "1m ago" for exactly one minute', () => {
      jest.setSystemTime(BASELINE);
      render(<TimeAgo ts={BASELINE - MIN} />);
      expect(screen.getByText("1m ago")).toBeInTheDocument();
    });

    it('renders "Xh ago" for hours', () => {
      jest.setSystemTime(BASELINE);
      render(<TimeAgo ts={BASELINE - 3 * HOUR} />);
      expect(screen.getByText("3h ago")).toBeInTheDocument();
    });

    it('renders "Xd ago" for days', () => {
      jest.setSystemTime(BASELINE);
      render(<TimeAgo ts={BASELINE - 2 * DAY} />);
      expect(screen.getByText("2d ago")).toBeInTheDocument();
    });
  });

  describe("dateTime and title attributes", () => {
    it("sets dateTime to a valid ISO string", () => {
      jest.setSystemTime(BASELINE);
      render(<TimeAgo ts={BASELINE - 3 * HOUR} />);
      const timeEl = screen.getByText("3h ago");
      expect(timeEl).toHaveAttribute("dateTime", iso(BASELINE - 3 * HOUR));
    });

    it("defaults title to the ISO string when not provided", () => {
      jest.setSystemTime(BASELINE);
      render(<TimeAgo ts={BASELINE - 3 * HOUR} />);
      const timeEl = screen.getByText("3h ago");
      expect(timeEl).toHaveAttribute("title", iso(BASELINE - 3 * HOUR));
    });

    it("uses the explicit title prop when provided", () => {
      jest.setSystemTime(BASELINE);
      render(<TimeAgo ts={BASELINE - 3 * HOUR} title="Explicit title" />);
      const timeEl = screen.getByText("3h ago");
      expect(timeEl).toHaveAttribute("title", "Explicit title");
    });
  });

  describe("interval tick updates", () => {
    it("updates relative text after the 30s tick passes", () => {
      const start = BASELINE;
      jest.setSystemTime(start);
      // ts = start - 90s => initially "1m ago"
      render(<TimeAgo ts={start - 90 * SEC} />);
      expect(screen.getByText("1m ago")).toBeInTheDocument();

      // Advance 31 seconds so delta becomes ~121s => "2m ago"
      act(() => {
        jest.setSystemTime(start + 31 * SEC);
        jest.advanceTimersByTime(31 * SEC);
      });

      expect(screen.getByText("2m ago")).toBeInTheDocument();
    });
  });

  describe("cleanup on unmount", () => {
    it("clears the interval and does not throw when unmounted before a tick", () => {
      jest.setSystemTime(BASELINE);
      const { unmount } = render(<TimeAgo ts={BASELINE} />);
      unmount();

      // Advancing timers after unmount should not trigger setState warnings
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(31 * SEC);
        });
      }).not.toThrow();
    });
  });
});
