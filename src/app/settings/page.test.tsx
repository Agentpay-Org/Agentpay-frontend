import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "./page";
import { messages } from "@/lib/messages";
import * as resolveApiBaseModule from "@/lib/resolveApiBase";

/**
 * jsdom does not implement `window.matchMedia`, which `ThemeToggle` reads via
 * `readTheme()` / `effectiveTheme()`. Stub it so the page renders without
 * throwing.
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
  const user = userEvent.setup();

  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    mockMatchMedia(false);
    jest.restoreAllMocks();
  });

  describe("Layout & Headings", () => {
    it("renders the Settings page heading", () => {
      render(<SettingsPage />);
      expect(
        screen.getByRole("heading", { level: 1, name: messages.settings.heading })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 1, name: "Settings" })
      ).toBeInTheDocument();
    });

    it("renders the Appearance section heading and descriptive copy", () => {
      render(<SettingsPage />);
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: messages.settings.appearance.heading,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.settings.appearance.description)
      ).toBeInTheDocument();
    });

    it("renders the Connection section heading and descriptive copy", () => {
      render(<SettingsPage />);
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: messages.settings.connection.heading,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.settings.connection.description)
      ).toBeInTheDocument();
    });

    it("exposes the main landmark with id='main-content' for the skip link", () => {
      render(<SettingsPage />);
      const main = screen.getByRole("main");
      expect(main).toHaveAttribute("id", "main-content");
    });
  });

  describe("Appearance / Theme Toggle Interactions", () => {
    it("renders the ThemeToggle control with all options", () => {
      render(<SettingsPage />);
      expect(
        screen.getByRole("group", { name: "Theme" })
      ).toBeInTheDocument();

      for (const option of ["light", "dark", "system"]) {
        expect(
          screen.getByRole("button", { name: new RegExp(option, "i") })
        ).toBeInTheDocument();
      }
    });

    it("allows switching theme option via click interaction", async () => {
      render(<SettingsPage />);
      const darkBtn = screen.getByRole("button", { name: /dark/i });

      await user.click(darkBtn);

      await waitFor(() => {
        expect(document.documentElement).toHaveClass("dark");
        expect(darkBtn).toHaveAttribute("aria-pressed", "true");
      });
    });

    it("supports keyboard navigation across theme options", async () => {
      render(<SettingsPage />);
      const lightBtn = screen.getByRole("button", { name: /light/i });
      const darkBtn = screen.getByRole("button", { name: /dark/i });

      lightBtn.focus();
      expect(lightBtn).toHaveFocus();

      await user.tab();
      expect(darkBtn).toHaveFocus();
    });
  });

  describe("Connection / API Base States & Copy Action", () => {
    it("renders the resolved API base URL correctly in success state", () => {
      jest.spyOn(resolveApiBaseModule, "resolveApiBase").mockReturnValue("https://api.agentpay.org");

      render(<SettingsPage />);

      expect(screen.getByText("https://api.agentpay.org")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    });

    it("handles empty or fallback API base states gracefully", () => {
      jest.spyOn(resolveApiBaseModule, "resolveApiBase").mockReturnValue("");

      render(<SettingsPage />);

      expect(screen.getByRole("heading", { level: 2, name: messages.settings.connection.heading })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    });

    it("triggers clipboard copy interaction when CopyButton is clicked", async () => {
      const writeTextMock = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      render(<SettingsPage />);

      const copyBtn = screen.getByRole("button", { name: /copy/i });
      await user.click(copyBtn);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalled();
      });
    });
  });

  describe("Edge Cases", () => {
    it("renders without throwing when matchMedia is unavailable-shaped (matches=false)", () => {
      expect(() => render(<SettingsPage />)).not.toThrow();
    });
  });
});
