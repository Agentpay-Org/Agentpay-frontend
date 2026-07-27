import { render, screen } from "@testing-library/react";
import SettingsPage, { metadata } from "./page";

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

  it("renders the Settings heading", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: /Settings/i })).toBeInTheDocument();
  });

  it("wraps content in a PageShell with maxWidth 2xl and gap 8", () => {
    render(<SettingsPage />);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main.className).toContain("max-w-2xl");
    expect(main.className).toContain("gap-8");
  });

  it("renders the Appearance section heading", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: /Appearance/i })).toBeInTheDocument();
  });

  it("displays the theme description text", () => {
    render(<SettingsPage />);
    expect(
      screen.getByText(/Choose a colour scheme\. System follows your OS preference\./i),
    ).toBeInTheDocument();
  });

  it("renders the ThemeToggle component", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "light" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "dark" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "system" })).toBeInTheDocument();
  });

  it("exports metadata with the correct title", () => {
    expect(metadata).toEqual({ title: "Settings — AgentPay" });
  });
});
