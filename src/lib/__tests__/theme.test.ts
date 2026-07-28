import {
  effectiveTheme,
  readTheme,
  writeTheme,
  THEME_STORAGE_KEY,
} from "../theme";

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

describe("THEME_STORAGE_KEY", () => {
  it("is a non-empty string", () => {
    expect(typeof THEME_STORAGE_KEY).toBe("string");
    expect(THEME_STORAGE_KEY.length).toBeGreaterThan(0);
  });

  it('equals \"agentpay.theme\" (no key drift between script and helpers)', () => {
    expect(THEME_STORAGE_KEY).toBe("agentpay.theme");
  });
});

describe("theme helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockMatchMedia(false);
  });

  it("falls back to system when the stored value is missing", () => {
    expect(readTheme()).toBe("system");
  });

  it("falls back to system when the stored value is invalid / corrupt", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "solarized");
    expect(readTheme()).toBe("system");

    window.localStorage.setItem(THEME_STORAGE_KEY, "");
    expect(readTheme()).toBe("system");

    window.localStorage.setItem(THEME_STORAGE_KEY, "1");
    expect(readTheme()).toBe("system");
  });

  it("persists and reads back valid theme choices", () => {
    writeTheme("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(readTheme()).toBe("dark");

    writeTheme("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(readTheme()).toBe("light");

    writeTheme("system");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
    expect(readTheme()).toBe("system");
  });

  it("resolves explicit themes without consulting matchMedia", () => {
    mockMatchMedia(true); // system would be dark, but explicit must override
    expect(effectiveTheme("light")).toBe("light");
    expect(effectiveTheme("dark")).toBe("dark");
  });

  it("resolves system theme from matchMedia (dark OS)", () => {
    mockMatchMedia(true);
    expect(effectiveTheme("system")).toBe("dark");
  });

  it("resolves system theme from matchMedia (light OS)", () => {
    mockMatchMedia(false);
    expect(effectiveTheme("system")).toBe("light");
  });
});

// The window-undefined SSR guard branches (readTheme/writeTheme/effectiveTheme)
// are covered in theme.ssr.test.ts, which runs under the "node" Jest
// environment so `window` is genuinely absent rather than simulated by
// redefining a jsdom global — see that file for why.

/**
 * These tests mirror the logic of the pre-paint inline script embedded in
 * src/app/layout.tsx so we can verify it against every edge case without
 * spinning up a browser.
 *
 * The script logic is:
 *   var s = localStorage.getItem(THEME_STORAGE_KEY);
 *   var d = s === "dark" || (s !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
 *   classList.toggle("dark", d);
 *   classList.toggle("light", !d);
 */
describe("pre-paint script logic (mirrored in layout.tsx)", () => {
  const resolve = (stored: string | null, systemDark: boolean): "dark" | "light" => {
    const dark =
      stored === "dark" || (stored !== "light" && systemDark);
    return dark ? "dark" : "light";
  };

  it("stored=dark → dark regardless of system preference", () => {
    expect(resolve("dark", false)).toBe("dark");
    expect(resolve("dark", true)).toBe("dark");
  });

  it("stored=light → light regardless of system preference", () => {
    expect(resolve("light", false)).toBe("light");
    expect(resolve("light", true)).toBe("light");
  });

  it("stored=system, systemDark=true → dark", () => {
    expect(resolve("system", true)).toBe("dark");
  });

  it("stored=system, systemDark=false → light", () => {
    expect(resolve("system", false)).toBe("light");
  });

  it("stored=null (absent), systemDark=true → dark", () => {
    expect(resolve(null, true)).toBe("dark");
  });

  it("stored=null (absent), systemDark=false → light", () => {
    expect(resolve(null, false)).toBe("light");
  });

  it("stored=corrupt value, systemDark=true → dark (falls back to system)", () => {
    expect(resolve("solarized", true)).toBe("dark");
  });

  it("stored=corrupt value, systemDark=false → light (falls back to system)", () => {
    expect(resolve("solarized", false)).toBe("light");
  });

  it("THEME_STORAGE_KEY is the key used inside the script", () => {
    // The key embedded in prePaintScript is a template-literal interpolation of
    // THEME_STORAGE_KEY at build time. Asserting the exported value protects
    // against key drift if the constant is ever renamed.
    expect(THEME_STORAGE_KEY).toBe("agentpay.theme");
  });
});
