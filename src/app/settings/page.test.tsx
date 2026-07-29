import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage, {
  ConnectionValue,
  LoadingPanel,
  SettingsSections,
  deriveAnnouncement,
} from "./page";
import { messages } from "@/lib/messages";
import * as resolveApiBaseModule from "@/lib/resolveApiBase";
import * as useClipboardModule from "@/lib/useClipboard";

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

    it("retries into the empty state when the API base disappears", async () => {
      const user = userEvent.setup();
      const mockApi = jest.spyOn(resolveApiBaseModule, "resolveApiBase");

      mockApi.mockImplementationOnce(() => {
        throw new Error("Failed to connect to backend service");
      });

      render(<SettingsPage />);
      expect(await screen.findByRole("alert")).toBeInTheDocument();

      mockApi.mockReturnValue("");
      await user.click(screen.getByRole("button", { name: /retry/i }));

      expect(await screen.findByRole("region", { name: "Empty settings" })).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("retries back into the error state when the retry also throws", async () => {
      const user = userEvent.setup();
      const mockApi = jest.spyOn(resolveApiBaseModule, "resolveApiBase");

      mockApi.mockImplementationOnce(() => {
        throw new Error("first failure");
      });

      render(<SettingsPage />);
      expect(await screen.findByText("first failure")).toBeInTheDocument();

      mockApi.mockImplementationOnce(() => {
        throw new Error("second failure");
      });
      await user.click(screen.getByRole("button", { name: /retry/i }));

      expect(await screen.findByText("second failure")).toBeInTheDocument();
    });

    it("falls back to the default message when a retry throws a non-Error", async () => {
      const user = userEvent.setup();
      const mockApi = jest.spyOn(resolveApiBaseModule, "resolveApiBase");

      mockApi.mockImplementationOnce(() => {
        throw new Error("first failure");
      });

      render(<SettingsPage />);
      expect(await screen.findByText("first failure")).toBeInTheDocument();

      mockApi.mockImplementationOnce(() => {
        throw "not an Error";
      });
      await user.click(screen.getByRole("button", { name: /retry/i }));

      expect(
        await screen.findByText("Failed to load settings configuration.")
      ).toBeInTheDocument();
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

  describe("Memoization", () => {
    /**
     * Counts renders of the memoized settings body without instrumenting
     * React internals: `CopyButton` (rendered by `ConnectionValue`, itself
     * rendered by `SettingsSections`) calls `useClipboard` exactly once per
     * render, so the spy's call count is the subtree's render count. If the
     * memo boundary holds, an unrelated parent state change leaves it flat.
     */
    function spyOnSubtreeRenders() {
      const real = useClipboardModule.useClipboard;
      return jest
        .spyOn(useClipboardModule, "useClipboard")
        .mockImplementation((opts) => real(opts));
    }

    /** Parent that owns unrelated state plus the one prop the body reads. */
    function Harness({ initialApiBase }: { initialApiBase: string }) {
      const [unrelated, setUnrelated] = useState(0);
      const [apiBase, setApiBase] = useState(initialApiBase);
      return (
        <>
          <button type="button" onClick={() => setUnrelated((n) => n + 1)}>
            bump unrelated
          </button>
          <button type="button" onClick={() => setApiBase("https://changed.example")}>
            change api base
          </button>
          <span data-testid="unrelated-count">{unrelated}</span>
          <SettingsSections apiBase={apiBase} />
        </>
      );
    }

    it("wraps the settings body and connection value in React.memo", () => {
      // Structural check that survives React version/scheduler internals:
      // memo() returns an object tagged with this well-known symbol wrapping
      // the inner render function.
      for (const component of [SettingsSections, ConnectionValue]) {
        const memoType = component as unknown as { $$typeof: symbol; type: unknown };
        expect(memoType.$$typeof).toBe(Symbol.for("react.memo"));
        expect(typeof memoType.type).toBe("function");
      }
    });

    it("does not re-render the settings body when unrelated parent state changes", async () => {
      const user = userEvent.setup();
      const useClipboardSpy = spyOnSubtreeRenders();

      render(<Harness initialApiBase="https://api.agentpay.org" />);

      expect(screen.getByText("https://api.agentpay.org")).toBeInTheDocument();
      const rendersAfterMount = useClipboardSpy.mock.calls.length;

      await user.click(screen.getByRole("button", { name: /bump unrelated/i }));

      // The parent re-rendered ...
      expect(screen.getByTestId("unrelated-count")).toHaveTextContent("1");
      // ... but the memoized body did not.
      expect(useClipboardSpy.mock.calls.length).toBe(rendersAfterMount);
    });

    it("stays flat across a large number of unrelated updates", async () => {
      const user = userEvent.setup();
      const useClipboardSpy = spyOnSubtreeRenders();

      render(<Harness initialApiBase="https://api.agentpay.org" />);
      const rendersAfterMount = useClipboardSpy.mock.calls.length;

      const bump = screen.getByRole("button", { name: /bump unrelated/i });
      for (let i = 0; i < 50; i++) {
        await user.click(bump);
      }

      expect(screen.getByTestId("unrelated-count")).toHaveTextContent("50");
      expect(useClipboardSpy.mock.calls.length).toBe(rendersAfterMount);
    });

    it("still re-renders and updates when the api base actually changes", async () => {
      const user = userEvent.setup();
      const useClipboardSpy = spyOnSubtreeRenders();

      render(<Harness initialApiBase="https://api.agentpay.org" />);
      const rendersAfterMount = useClipboardSpy.mock.calls.length;

      await user.click(screen.getByRole("button", { name: /change api base/i }));

      expect(await screen.findByText("https://changed.example")).toBeInTheDocument();
      expect(screen.queryByText("https://api.agentpay.org")).not.toBeInTheDocument();
      expect(useClipboardSpy.mock.calls.length).toBeGreaterThan(rendersAfterMount);
    });

    it("keeps the copy button wired to the current api base after a change", async () => {
      const user = userEvent.setup();
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      render(<Harness initialApiBase="https://api.agentpay.org" />);

      await user.click(screen.getByRole("button", { name: /change api base/i }));
      await user.click(screen.getByRole("button", { name: /copy/i }));

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith("https://changed.example");
      });
    });

    it("renders the connection value standalone for any api base", () => {
      render(<ConnectionValue apiBase="https://standalone.example" />);

      expect(screen.getByText("https://standalone.example")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    });

    it("renders an empty connection value without crashing", () => {
      const { container } = render(<ConnectionValue apiBase="" />);

      expect(container.querySelector("span.font-mono")).toHaveTextContent("");
      expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    });
  });

  describe("Derived Announcement", () => {
    it.each([
      ["loading" as const, "", "Loading settings..."],
      ["error" as const, "boom", "Error: boom"],
      ["error" as const, "", "Error: "],
      ["empty" as const, "", "No settings configured."],
      ["success" as const, "", "Settings loaded successfully."],
    ])("derives the %s announcement", (status, errorMessage, expected) => {
      expect(deriveAnnouncement(status, errorMessage)).toBe(expected);
    });
  });

  describe("Loading Panel", () => {
    it("renders the loading placeholder and is memoized", () => {
      render(<LoadingPanel />);

      expect(screen.getByRole("status", { name: "Loading settings" })).toBeInTheDocument();
      expect(screen.getByText("Loading settings...")).toBeInTheDocument();

      const memoType = LoadingPanel as unknown as { $$typeof: symbol };
      expect(memoType.$$typeof).toBe(Symbol.for("react.memo"));
    });
  });

  describe("Screen Reader Announcements", () => {
    it("announces each settings state", async () => {
      const user = userEvent.setup();
      const mockApi = jest.spyOn(resolveApiBaseModule, "resolveApiBase");

      mockApi.mockReturnValue("https://api.agentpay.org");
      const { unmount } = render(<SettingsPage />);
      expect(await screen.findByText("Settings loaded successfully.")).toBeInTheDocument();
      unmount();

      mockApi.mockReturnValue("");
      const empty = render(<SettingsPage />);
      expect(await screen.findByText("No settings configured.")).toBeInTheDocument();
      empty.unmount();

      mockApi.mockImplementation(() => {
        throw new Error("boom");
      });
      render(<SettingsPage />);
      expect(await screen.findByText("Error: boom")).toBeInTheDocument();

      // Retry flips back to a success announcement.
      mockApi.mockReturnValue("https://api.agentpay.org");
      await user.click(screen.getByRole("button", { name: /retry/i }));
      await waitFor(() => {
        expect(screen.getByText("Settings loaded successfully.")).toBeInTheDocument();
      });
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
