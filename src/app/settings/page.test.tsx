import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "./page";
import { messages } from "@/lib/messages";
import * as resolveApiBaseModule from "@/lib/resolveApiBase";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe("SettingsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    jest.restoreAllMocks();
  });

  describe("Success & Layout Rendering", () => {
    it("renders page heading and settings content when resolved", async () => {
      jest.spyOn(resolveApiBaseModule, "resolveApiBase").mockReturnValue("https://api.agentpay.org");

      render(<SettingsPage />);

      expect(
        await screen.findByRole("heading", { level: 1, name: messages.settings.heading })
      ).toBeInTheDocument();

      expect(
        screen.getByRole("heading", { level: 2, name: messages.settings.appearance.heading })
      ).toBeInTheDocument();

      expect(screen.getByText("https://api.agentpay.org")).toBeInTheDocument();
    });
  });

  describe("Empty State Handling", () => {
    it("renders the empty state UI when no API base is returned", async () => {
      jest.spyOn(resolveApiBaseModule, "resolveApiBase").mockReturnValue("");

      render(<SettingsPage />);

      expect(await screen.findByRole("region", { name: "Empty settings" })).toBeInTheDocument();
      expect(screen.getByText("No settings available.")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /copy/i })).not.toBeInTheDocument();
    });
  });

  describe("Error State & Retry Handling", () => {
    it("renders error alert with retry button when an exception is thrown and retries successfully", async () => {
      const user = userEvent.setup();
      const mockApi = jest.spyOn(resolveApiBaseModule, "resolveApiBase");

      // First call throws error
      mockApi.mockImplementationOnce(() => {
        throw new Error("Failed to connect to backend service");
      });

      render(<SettingsPage />);

      // Verify Error State
      const alert = await screen.findByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(screen.getByText("Failed to connect to backend service")).toBeInTheDocument();

      // Next call succeeds
      mockApi.mockReturnValueOnce("http://localhost:3001");

      // Click Retry
      const retryBtn = screen.getByRole("button", { name: /retry/i });
      await user.click(retryBtn);

      // Verify Success State
      await waitFor(() => {
        expect(screen.getByText("http://localhost:3001")).toBeInTheDocument();
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("uses default error message when error thrown is not an Error object", async () => {
      jest.spyOn(resolveApiBaseModule, "resolveApiBase").mockImplementationOnce(() => {
        throw "String exception";
      });

      render(<SettingsPage />);

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Failed to load settings configuration.")).toBeInTheDocument();
    });

    it("renders fallback text when errorMessage is empty string", async () => {
      jest.spyOn(resolveApiBaseModule, "resolveApiBase").mockImplementationOnce(() => {
        throw new Error("");
      });

      render(<SettingsPage />);

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Failed to load settings.")).toBeInTheDocument();
    });
  });

  describe("Theme Toggle Interactions", () => {
    it("allows clicking theme toggle button", async () => {
      const user = userEvent.setup();
      jest.spyOn(resolveApiBaseModule, "resolveApiBase").mockReturnValue("http://localhost:3001");

      render(<SettingsPage />);

      const darkBtn = await screen.findByRole("button", { name: /dark/i });
      await user.click(darkBtn);

      await waitFor(() => {
        expect(document.documentElement).toHaveClass("dark");
      });
    });
  });
});
