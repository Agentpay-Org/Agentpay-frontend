import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DocsPage from "./page";
import { getSections, sanitizeBaseUrl } from "./endpoints";
import { DEFAULT_API_BASE } from "@/lib/resolveApiBase";

// Mock resolveApiBase since it depends on environment variables. The base is
// mutable so individual tests can simulate a misconfigured env var reaching
// the page.
let mockApiBase = "https://api.example.com";
jest.mock("@/lib/resolveApiBase", () => ({
  ...jest.requireActual("@/lib/resolveApiBase"),
  resolveApiBase: () => mockApiBase,
}));

jest.mock("@/lib/url", () => {
  const actual = jest.requireActual("@/lib/url");
  return { ...actual, safeHref: jest.fn(actual.safeHref) };
});

import { safeHref } from "@/lib/url";

const safeHrefMock = safeHref as jest.MockedFunction<typeof safeHref>;

beforeEach(() => {
  mockApiBase = "https://api.example.com";
});

afterEach(() => {
  safeHrefMock.mockImplementation(jest.requireActual("@/lib/url").safeHref);
});

describe("DocsPage", () => {
  it("renders the list of endpoints", () => {
    render(<DocsPage />);
    expect(screen.getByRole("heading", { name: /API documentation/i })).toBeInTheDocument();
    // Verify first endpoint is present
    expect(screen.getByText(/POST \/api\/v1\/usage/i)).toBeInTheDocument();
  });

  it("filters endpoints based on search query", async () => {
    render(<DocsPage />);
    const searchInput = screen.getByLabelText(/Filter endpoints/i);

    // Filter by "usage"
    fireEvent.change(searchInput, { target: { value: "usage" } });

    // Check that usage endpoints are present
    await waitFor(() => {
      expect(screen.getByText(/POST \/api\/v1\/usage/i)).toBeInTheDocument();
      expect(screen.getByText(/GET \/api\/v1\/usage\/:agent\/:serviceId/i)).toBeInTheDocument();
    }, { timeout: 1000 });

    // Check that admin endpoint is NOT present
    await waitFor(() => {
        expect(screen.queryByText(/POST \/api\/v1\/admin\/{pause,unpause}/i)).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it("renders link labels as plain text when safeHref rejects the URLs", () => {
    safeHrefMock.mockReturnValue({ ok: false });
    render(<DocsPage />);

    const openApiLabel = screen.getByText(/GET \/api\/v1\/openapi\.json/);
    expect(openApiLabel.closest("a")).toBeNull();

    const referenceLabel = screen.getByText(/dashboard API integration reference/i);
    expect(referenceLabel.closest("a")).toBeNull();
  });

  it("shows EmptyState when no matches", async () => {
    render(<DocsPage />);
    const searchInput = screen.getByLabelText(/Filter endpoints/i);

    // Filter by "nonexistent"
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    await waitFor(() => {
      expect(screen.getByText(/No matching endpoints/i)).toBeInTheDocument();
      expect(screen.getByText(/Try a different search term./i)).toBeInTheDocument();
    });
  });

  it("renders every curl example with the base URL double-quoted", () => {
    const { container } = render(<DocsPage />);
    const commands = Array.from(container.querySelectorAll("pre code")).map(
      (el) => el.textContent ?? ""
    );
    expect(commands).toHaveLength(5);
    for (const command of commands) {
      expect(command).toContain('"https://api.example.com/api/v1/');
      expect(command).not.toMatch(/curl(?: -X POST)? https:/); // never unquoted
    }
  });

  it("never renders a copyable command containing shell metacharacters when the env var is malicious", () => {
    mockApiBase = "https://api.example.com/$(touch pwned)";
    const { container } = render(<DocsPage />);
    const commands = Array.from(container.querySelectorAll("pre code")).map(
      (el) => el.textContent ?? ""
    );
    expect(commands).toHaveLength(5);
    for (const command of commands) {
      expect(command).not.toContain("$(");
      expect(command).not.toContain("touch");
      expect(command).toContain(`"${DEFAULT_API_BASE}/api/v1/`);
    }
  });
});

describe("getSections", () => {
  it("interpolates a valid base URL, double-quoted, into every command", () => {
    const sections = getSections("https://api.example.com");
    expect(sections).toHaveLength(5);
    for (const s of sections) {
      expect(s.curl).toMatch(/curl (-X POST )?"https:\/\/api\.example\.com\/api\/v1\//);
    }
  });

  it("preserves a configured base path", () => {
    const [first] = getSections("https://api.example.com/v1");
    expect(first.curl).toContain('"https://api.example.com/v1/api/v1/usage"');
  });

  it("falls back to the default base for a malicious value instead of interpolating it", () => {
    const sections = getSections("https://api.example.com/$(rm -rf ~)");
    for (const s of sections) {
      expect(s.curl).not.toContain("$(");
      expect(s.curl).not.toContain("rm -rf");
      expect(s.curl).toContain(`"${DEFAULT_API_BASE}/api/v1/`);
    }
  });
});

describe("sanitizeBaseUrl", () => {
  it("accepts and normalises well-formed https URLs", () => {
    expect(sanitizeBaseUrl("https://api.example.com")).toBe("https://api.example.com");
    expect(sanitizeBaseUrl("https://api.example.com/")).toBe("https://api.example.com");
    expect(sanitizeBaseUrl("https://api.example.com/v1///")).toBe("https://api.example.com/v1");
    expect(sanitizeBaseUrl("  https://api.example.com  ")).toBe("https://api.example.com");
    expect(sanitizeBaseUrl("https://api.example.com:8443/base")).toBe(
      "https://api.example.com:8443/base"
    );
  });

  it("falls back to the default for empty or unparseable values", () => {
    expect(sanitizeBaseUrl("")).toBe(DEFAULT_API_BASE);
    expect(sanitizeBaseUrl("   ")).toBe(DEFAULT_API_BASE);
    expect(sanitizeBaseUrl("not a url")).toBe(DEFAULT_API_BASE);
    expect(sanitizeBaseUrl("//missing-scheme.example.com")).toBe(DEFAULT_API_BASE);
  });

  it("rejects non-http(s) protocols", () => {
    expect(sanitizeBaseUrl("javascript:alert(1)")).toBe(DEFAULT_API_BASE);
    expect(sanitizeBaseUrl("ftp://files.example.com")).toBe(DEFAULT_API_BASE);
    expect(sanitizeBaseUrl("file:///etc/passwd")).toBe(DEFAULT_API_BASE);
  });

  it("rejects values whose normalised form still contains shell metacharacters", () => {
    // `$`, `(`, `)`, `;`, and `'` survive WHATWG URL path serialisation, so
    // the allowlist must catch them.
    expect(sanitizeBaseUrl("https://api.example.com/$(rm -rf ~)")).toBe(DEFAULT_API_BASE);
    expect(sanitizeBaseUrl("https://api.example.com/a;id")).toBe(DEFAULT_API_BASE);
    expect(sanitizeBaseUrl("https://api.example.com/a'b")).toBe(DEFAULT_API_BASE);
    expect(sanitizeBaseUrl("https://api.example.com/$HOME")).toBe(DEFAULT_API_BASE);
    expect(sanitizeBaseUrl("https://api.example.com/a&b")).toBe(DEFAULT_API_BASE);
    expect(sanitizeBaseUrl("https://api.example.com/a|b")).toBe(DEFAULT_API_BASE);
  });

  it("neutralises metacharacters the URL parser percent-encodes", () => {
    // Backticks, double quotes, and spaces are percent-encoded by the WHATWG
    // parser, so they reach the command as harmless literals.
    expect(sanitizeBaseUrl("https://api.example.com/`id`")).toBe(
      "https://api.example.com/%60id%60"
    );
    expect(sanitizeBaseUrl('https://api.example.com/a"b')).toBe(
      "https://api.example.com/a%22b"
    );
    expect(sanitizeBaseUrl("https://api.example.com/a b")).toBe(
      "https://api.example.com/a%20b"
    );
  });

  it("strips credentials, query strings, and fragments during normalisation", () => {
    expect(sanitizeBaseUrl("https://user:secret@api.example.com/v1")).toBe(
      "https://api.example.com/v1"
    );
    expect(sanitizeBaseUrl("https://api.example.com/v1?x=$(id)")).toBe(
      "https://api.example.com/v1"
    );
    expect(sanitizeBaseUrl("https://api.example.com/v1#$(id)")).toBe(
      "https://api.example.com/v1"
    );
  });

  it("applies the production http rules from resolveApiBase", () => {
    // http on a non-localhost host is refused in production...
    expect(sanitizeBaseUrl("http://api.example.com", true)).toBe(DEFAULT_API_BASE);
    // ...but localhost / 127.0.0.1 stay allowed, matching resolveApiBase.
    expect(sanitizeBaseUrl("http://localhost:3001", true)).toBe("http://localhost:3001");
    expect(sanitizeBaseUrl("http://127.0.0.1:3001", true)).toBe("http://127.0.0.1:3001");
    // In development http on any host is tolerated (resolveApiBase only warns).
    expect(sanitizeBaseUrl("http://api.example.com", false)).toBe("http://api.example.com");
  });
});
