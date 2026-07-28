import { act, fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "../ThemeToggle";

const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    mockMatchMedia(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders all theme options and marks the stored theme as active", async () => {
    window.localStorage.setItem("agentpay.theme", "dark");

    render(<ThemeToggle />);

    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "light" })).toHaveAttribute("aria-pressed", "false");
    expect(await screen.findByRole("button", { name: "dark", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "system" })).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("persists light mode and removes the dark class", async () => {
    window.localStorage.setItem("agentpay.theme", "dark");
    render(<ThemeToggle />);
    await screen.findByRole("button", { name: "dark", pressed: true });

    fireEvent.click(screen.getByRole("button", { name: "light" }));

    expect(window.localStorage.getItem("agentpay.theme")).toBe("light");
    expect(screen.getByRole("button", { name: "light" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("uses matchMedia when system mode is selected", () => {
    mockMatchMedia(true);
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "system" }));

    expect(window.localStorage.getItem("agentpay.theme")).toBe("system");
    expect(screen.getByRole("button", { name: "system" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("provides an empty polite live region without announcing on mount", () => {
    jest.useFakeTimers();
    window.localStorage.setItem("agentpay.theme", "dark");

    render(<ThemeToggle />);

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    expect(liveRegion).toHaveClass("sr-only");

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(liveRegion).toBeEmptyDOMElement();
  });

  it("debounces rapid changes and announces only the latest theme", () => {
    jest.useFakeTimers();
    render(<ThemeToggle />);
    const liveRegion = screen.getByRole("status");

    fireEvent.click(screen.getByRole("button", { name: "dark" }));
    act(() => {
      jest.advanceTimersByTime(200);
    });
    fireEvent.click(screen.getByRole("button", { name: "system" }));
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(liveRegion).toBeEmptyDOMElement();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(liveRegion).toHaveTextContent("Theme set to system.");
  });
});
