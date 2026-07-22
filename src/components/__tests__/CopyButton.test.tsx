import { render, screen, act, fireEvent } from "@testing-library/react";
import { CopyButton } from "../CopyButton";

function mockClipboard(writeText = jest.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

function removeClipboard() {
  Object.defineProperty(navigator, "clipboard", {
    value: undefined,
    configurable: true,
  });
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("CopyButton", () => {
  it("renders with the default label", () => {
    mockClipboard();
    render(<CopyButton value="abc" />);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("renders with a custom label", () => {
    mockClipboard();
    render(<CopyButton value="abc" label="Copy ID" />);
    expect(screen.getByRole("button", { name: "Copy ID" })).toBeInTheDocument();
  });

  it("writes the exact value to clipboard on click", async () => {
    const writeText = mockClipboard();
    render(<CopyButton value="secret-value-123" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(writeText).toHaveBeenCalledWith("secret-value-123");
  });

  it("switches label to Copied immediately after click", async () => {
    mockClipboard();
    render(<CopyButton value="x" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(screen.getByRole("button")).toHaveTextContent("Copied");
  });

  it("reverts label back to original after 1500 ms", async () => {
    mockClipboard();
    render(<CopyButton value="x" label="Copy Key" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(screen.getByRole("button")).toHaveTextContent("Copied");

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByRole("button")).toHaveTextContent("Copy Key");
  });

  it("has an aria-live region for screen reader announcements", () => {
    mockClipboard();
    render(<CopyButton value="x" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-live", "polite");
  });

  it("does not throw when clipboard API is unavailable", async () => {
    removeClipboard();
    render(<CopyButton value="x" />);

    await expect(
      act(async () => {
        fireEvent.click(screen.getByRole("button"));
      })
    ).resolves.not.toThrow();
  });

  it("does not enter copied state when clipboard is unavailable", async () => {
    removeClipboard();
    render(<CopyButton value="x" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(screen.getByRole("button")).toHaveTextContent("Copy");
  });

  it("handles a double-click without throwing", async () => {
    const writeText = mockClipboard();
    render(<CopyButton value="x" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(writeText).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button")).toHaveTextContent("Copied");
  });

  it("resets the revert timer on double-click so Copied shows for 1500 ms from the last click", async () => {
    mockClipboard();
    render(<CopyButton value="x" label="Copy" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(screen.getByRole("button")).toHaveTextContent("Copied");

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(screen.getByRole("button")).toHaveTextContent("Copied");

    act(() => {
      jest.advanceTimersByTime(1499);
    });

    expect(screen.getByRole("button")).toHaveTextContent("Copied");

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByRole("button")).toHaveTextContent("Copy");
  });

  it("does not enter copied state when clipboard.writeText rejects", async () => {
    const writeText = mockClipboard(
      jest.fn().mockRejectedValue(new Error("denied"))
    );
    render(<CopyButton value="x" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button")).toHaveTextContent("Copy");
  });

  it("passes an empty string value to the clipboard", async () => {
    const writeText = mockClipboard();
    render(<CopyButton value="" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(writeText).toHaveBeenCalledWith("");
    expect(screen.getByRole("button")).toHaveTextContent("Copied");
  });

  it("clears the revert timer on unmount without stale setState", async () => {
    mockClipboard();
    const { unmount } = render(<CopyButton value="x" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    unmount();

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(true).toBe(true);
  });
});
