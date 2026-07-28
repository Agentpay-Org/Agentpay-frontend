/**
 * @jest-environment node
 *
 * readTheme/writeTheme/effectiveTheme all guard on `typeof window ===
 * "undefined"` for SSR safety. Under the default jsdom environment, `window`
 * is defined as a non-configurable getter on `globalThis`
 * (`Object.getOwnPropertyDescriptor(globalThis, "window").configurable ===
 * false`), so it cannot be redefined, replaced, or deleted to simulate an
 * SSR context — `Object.defineProperty`/`jest.replaceProperty` both throw
 * "not declared configurable". Running this file under the "node"
 * environment instead means `window` is genuinely absent, exercising the
 * real guard branch rather than a simulated one.
 */
import { effectiveTheme, readTheme, writeTheme } from "../theme";

describe("readTheme / writeTheme SSR guard (window undefined)", () => {
  it("readTheme returns 'system' when window is undefined", () => {
    expect(typeof window).toBe("undefined");
    expect(readTheme()).toBe("system");
  });

  it("writeTheme is a no-op when window is undefined", () => {
    expect(() => writeTheme("dark")).not.toThrow();
  });

  it("effectiveTheme returns 'light' when window is undefined", () => {
    expect(effectiveTheme("system")).toBe("light");
  });
});
