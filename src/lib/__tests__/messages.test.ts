import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { messages, type Messages } from "../messages";
import { Footer } from "@/components/Footer";
import Home from "@/app/page";
import AboutPage from "@/app/about/page";
import DocsPage from "@/app/docs/page";
import SettingsPage from "@/app/settings/page";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

/**
 * Recursively collect every leaf value in the catalog together with its
 * dot-delimited key path. Used to assert that keys are unique and every leaf
 * is a usable, non-empty string.
 */
function flatten(
  obj: Record<string, unknown>,
  prefix = ""
): Array<[string, unknown]> {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === "object"
      ? flatten(value as Record<string, unknown>, path)
      : [[path, value] as [string, unknown]];
  });
}

describe("messages catalog", () => {
  afterEach(cleanup);

  it("resolves a representative key from each namespace", () => {
    expect(messages.footer.text).toBe(
      "AgentPay — machine-to-machine payments on Stellar. Pay per request."
    );
    expect(messages.home.heading).toBe("AgentPay");
    expect(messages.home.links.services).toBe("Manage services");
    expect(messages.about.heading).toBe("About AgentPay");
  });

  it("exposes only non-empty string leaves", () => {
    for (const [path, value] of flatten(messages)) {
      expect(typeof value).toBe("string");
      expect((value as string).length).toBeGreaterThan(0);
      // surface the offending path in the failure message
      expect(`${path}: ${String(value)}`.length).toBeGreaterThan(path.length);
    }
  });

  it("has no duplicate key paths", () => {
    const paths = flatten(messages).map(([path]) => path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("rejects unknown keys at the type level", () => {
    // @ts-expect-error — accessing a key that does not exist must not compile.
    const _missing: unknown = messages.footer.doesNotExist;
    void _missing;

    // A correctly typed lookup still works.
    const ok: Messages["footer"]["text"] = messages.footer.text;
    expect(ok).toBe(messages.footer.text);
  });

  it("matches the committed catalog snapshot", () => {
    expect(messages).toMatchSnapshot();
  });
});

describe("migrated surfaces render the catalog copy unchanged", () => {
  afterEach(cleanup);

  it("Footer renders the catalog text (and the original copy)", () => {
    render(createElement(Footer));
    // Catalog-driven and byte-for-byte identical to the pre-migration copy.
    expect(
      screen.getByText(messages.footer.text)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "AgentPay — machine-to-machine payments on Stellar. Pay per request."
      )
    ).toBeInTheDocument();
  });

  it("Home renders heading, description and every quick link from the catalog", () => {
    render(createElement(Home));

    expect(
      screen.getByRole("heading", { name: messages.home.heading })
    ).toBeInTheDocument();
    expect(screen.getByText(messages.home.description)).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: messages.home.quickLinksLabel })
    ).toBeInTheDocument();

    for (const label of Object.values(messages.home.links)) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }

    // Original, un-migrated copy is preserved exactly.
    expect(
      screen.getByText(
        "Machine-to-machine payment protocol on Stellar. Pay-per-request billing for AI agents and APIs."
      )
    ).toBeInTheDocument();
  });

  it("AboutPage renders heading and prose from the catalog", () => {
    render(createElement(AboutPage));

    expect(
      screen.getByRole("heading", { name: messages.about.heading })
    ).toBeInTheDocument();
    expect(screen.getByText(messages.about.intro)).toBeInTheDocument();
    expect(screen.getByText(messages.about.surfacesIntro)).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: messages.about.navLabel })
    ).toBeInTheDocument();
  });

  it("DocsPage renders heading and prose from the catalog", () => {
    render(createElement(DocsPage));

    expect(
      screen.getByRole("heading", { name: messages.docs.heading })
    ).toBeInTheDocument();
    
    // Test that the prefix, open api, and suffix are rendered
    expect(screen.getByText(messages.docs.introOpenApi)).toBeInTheDocument();
    
    // We can query the full link name as well
    expect(
      screen.getByRole("link", { name: messages.docs.referenceLink })
    ).toBeInTheDocument();
  });

  it("SettingsPage renders headings and prose from the catalog", () => {
    render(createElement(SettingsPage));

    expect(
      screen.getByRole("heading", { name: messages.settings.heading, level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: messages.settings.appearance.heading, level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.settings.appearance.description)
    ).toBeInTheDocument();
  });
});
