import { render, screen } from "@testing-library/react";
import SettingsPage from "./page";
import { messages } from "@/lib/messages";

/**
 * jsdom does not implement `window.matchMedia`, which `ThemeToggle` reads via
 * `readTheme()` / `effectiveTheme()`. Stub it so the page renders without
 * throwing. Mirrors the stub used in the ThemeToggle component test.
 */
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

describe("SettingsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    mockMatchMedia(false);
  });

  it("renders the Settings page heading", () => {
    render(<SettingsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: messages.settings.heading }),
    ).toBeInTheDocument();
    // Sanity-check the literal copy so a messages refactor cannot silently
    // change the visible heading.
    expect(
      screen.getByRole("heading", { level: 1, name: "Settings" }),
    ).toBeInTheDocument();
  });

  it("renders the Appearance section heading and descriptive copy", () => {
    render(<SettingsPage />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: messages.settings.appearance.heading,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.settings.appearance.description),
    ).toBeInTheDocument();
  });

  it("renders the ThemeToggle control", () => {
    render(<SettingsPage />);
    // ThemeToggle exposes a labelled radio-like button group.
    expect(
      screen.getByRole("group", { name: "Theme" }),
    ).toBeInTheDocument();
    for (const option of ["light", "dark", "system"]) {
      expect(
        screen.getByRole("button", { name: option }),
      ).toBeInTheDocument();
    }
  });

  it("exposes the main landmark with id='main-content' for the skip link", () => {
    render(<SettingsPage />);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
  });

  it("renders without throwing when matchMedia is unavailable-shaped (matches=false)", () => {
    // Guards the regression the issue calls out: the page must render in jsdom
    // (no real matchMedia) once the stub is in place.
    expect(() => render(<SettingsPage />)).not.toThrow();
  });
});
