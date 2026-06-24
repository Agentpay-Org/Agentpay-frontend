import {
  buildCsp,
  defaultSecurityHeaders,
  originOf,
  resolveApiBase,
  type BuildSecurityHeadersOptions,
} from "../lib/securityHeaders";

const prod: BuildSecurityHeadersOptions = {
  apiBase: "https://api.example.com",
};
const prodWithNonce: BuildSecurityHeadersOptions = {
  apiBase: "https://api.example.com",
  scriptNonce: "test-nonce",
};
const dev: BuildSecurityHeadersOptions = {
  apiBase: "https://api.example.com",
  isDev: true,
  scriptNonce: "dev-nonce",
};

describe("originOf", () => {
  it("returns origin for a fully qualified URL", () => {
    expect(originOf("https://api.example.com/v1")).toBe("https://api.example.com");
  });

  it("returns origin for a URL with a port", () => {
    expect(originOf("http://localhost:3001")).toBe("http://localhost:3001");
  });

  it("falls back to the localhost default origin for unparseable input", () => {
    expect(originOf("not a url")).toBe("http://localhost:3001");
  });
});

describe("buildCsp", () => {
  it("includes default-src 'self'", () => {
    expect(buildCsp(prod)).toMatch(/default-src 'self'/);
  });

  it("includes the api origin in connect-src", () => {
    const csp = buildCsp({ apiBase: "https://api.example.com" });
    expect(csp).toContain("connect-src 'self' https://api.example.com");
  });

  it("preserves a localhost origin in connect-src", () => {
    const csp = buildCsp({ apiBase: "http://localhost:3001" });
    expect(csp).toContain("connect-src 'self' http://localhost:3001");
  });

  it("includes 'self' and the nonce for script-src in production", () => {
    expect(buildCsp(prodWithNonce)).toMatch(
      /script-src 'self' 'nonce-test-nonce'/
    );
    expect(buildCsp(prodWithNonce)).not.toMatch(/script-src[^;]*'unsafe-eval'/);
  });

  it("omits script-src unsafe-inline in production", () => {
    expect(buildCsp(prodWithNonce)).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });

  it("keeps script-src unsafe-inline out even if middleware has not supplied a nonce", () => {
    expect(buildCsp(prod)).toContain("script-src 'self'");
    expect(buildCsp(prod)).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(buildCsp(prod)).not.toMatch(/script-src[^;]*'nonce-/);
  });

  it("adds 'unsafe-eval' to script-src in development for Fast Refresh", () => {
    expect(buildCsp(dev)).toContain("'unsafe-eval'");
    expect(buildCsp(dev)).toContain("'nonce-dev-nonce'");
    expect(buildCsp(dev)).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });

  it("includes 'unsafe-inline' for style-src because next/font injects styles", () => {
    expect(buildCsp(prod)).toContain("style-src 'self' 'unsafe-inline'");
  });

  it("adds font data: uri support for icon fonts and font subsets", () => {
    expect(buildCsp(prod)).toContain("font-src 'self' data:");
  });

  it("adds img-src data: support", () => {
    expect(buildCsp(prod)).toContain("img-src 'self' data:");
  });

  it("disallows framing (clickjacking protection) via frame-ancestors", () => {
    expect(buildCsp(prod)).toContain("frame-ancestors 'none'");
  });

  it("disallows object-src entirely", () => {
    expect(buildCsp(prod)).toContain("object-src 'none'");
  });

  it("locks down form-action and base-uri to self", () => {
    expect(buildCsp(prod)).toContain("form-action 'self'");
    expect(buildCsp(prod)).toContain("base-uri 'self'");
  });

  it("does not include a `navigate-to` directive so external <a> links open normally", () => {
    expect(buildCsp(prod)).not.toMatch(/navigate-to/);
  });

  it("separates directives with semicolons", () => {
    const csp = buildCsp(prod);
    const segments = csp.split("; ");
    expect(segments.length).toBeGreaterThanOrEqual(8);
  });
});

describe("defaultSecurityHeaders", () => {
  it("returns every required hardening header (including HSTS) in production", () => {
    const headers = defaultSecurityHeaders(prodWithNonce);
    expect(headers["Content-Security-Policy"]).toBeTruthy();
    expect(headers["Content-Security-Policy"]).toContain("'nonce-test-nonce'");
    expect(headers["Content-Security-Policy"]).not.toMatch(
      /script-src[^;]*'unsafe-inline'/
    );
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Permissions-Policy"]).toBeTruthy();
    expect(headers["Strict-Transport-Security"]).toMatch(/max-age=/);
  });

  it("omits Strict-Transport-Security in development so browsers don't cache the upgrade", () => {
    const headers = defaultSecurityHeaders({
      apiBase: "http://localhost:3001",
      isDev: true,
      scriptNonce: "dev-nonce",
    });
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
    // Baseline headers should still be present in dev.
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Content-Security-Policy"]).toContain(
      "script-src 'self' 'nonce-dev-nonce' 'unsafe-eval'"
    );
  });

  it("can omit CSP when next.config.ts serves only static hardening headers", () => {
    const headers = defaultSecurityHeaders({
      apiBase: "https://api.example.com",
      includeCsp: false,
    });
    expect(headers["Content-Security-Policy"]).toBeUndefined();
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("disables a wide set of potentially sensitive browser features by default", () => {
    const pp = defaultSecurityHeaders(prod)["Permissions-Policy"];
    expect(pp).toContain("camera=()");
    expect(pp).toContain("microphone=()");
    expect(pp).toContain("geolocation=()");
    expect(pp).toContain("payment=()");
    expect(pp).toContain("interest-cohort=()");
  });

  it("derives the CSP connect-src from the api base", () => {
    const headers = defaultSecurityHeaders({
      apiBase: "https://api.staging.agentpay.io/v2",
    });
    expect(headers["Content-Security-Policy"]).toContain(
      "connect-src 'self' https://api.staging.agentpay.io"
    );
  });
});

describe("resolveApiBase (re-exported from securityHeaders)", () => {
  it("returns the localhost default when no env var is set", () => {
    expect(resolveApiBase({ env: {} })).toBe("http://localhost:3001");
  });
});
