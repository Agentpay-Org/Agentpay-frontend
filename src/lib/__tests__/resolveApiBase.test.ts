import {
  DEFAULT_API_BASE,
  NEXT_PUBLIC_AGENTPAY_API_BASE_ENV,
  resolveApiBase,
} from "../resolveApiBase";

const env = (values: Record<string, string | undefined>): NodeJS.ProcessEnv =>
  values as NodeJS.ProcessEnv;

describe("resolveApiBase", () => {
  it("falls back to the default API base when the env var is missing", () => {
    expect(resolveApiBase({ env: env({}), isProduction: false })).toBe(DEFAULT_API_BASE);
  });

  it("trims whitespace and removes trailing slashes while preserving a base path", () => {
    expect(resolveApiBase({
      env: env({ [NEXT_PUBLIC_AGENTPAY_API_BASE_ENV]: " https://api.example.com/v1/// " }),
      isProduction: true,
    })).toBe("https://api.example.com/v1");
  });

  it("normalizes a root pathname to the origin", () => {
    expect(resolveApiBase({
      env: env({ [NEXT_PUBLIC_AGENTPAY_API_BASE_ENV]: "https://api.example.com/" }),
      isProduction: true,
    })).toBe("https://api.example.com");
  });

  it("throws when the env var is not an absolute URL", () => {
    expect(() => resolveApiBase({
      env: env({ [NEXT_PUBLIC_AGENTPAY_API_BASE_ENV]: "api.example.com" }),
      isProduction: false,
    })).toThrow("Invalid NEXT_PUBLIC_AGENTPAY_API_BASE");
  });

  it("throws for unsupported protocols", () => {
    expect(() => resolveApiBase({
      env: env({ [NEXT_PUBLIC_AGENTPAY_API_BASE_ENV]: "ftp://api.example.com" }),
      isProduction: false,
    })).toThrow("Unsupported protocol");
  });

  it("throws for non-local HTTP URLs in production", () => {
    expect(() => resolveApiBase({
      env: env({
        NODE_ENV: "production",
        [NEXT_PUBLIC_AGENTPAY_API_BASE_ENV]: "http://api.example.com",
      }),
    })).toThrow("Refusing to use a non-https");
  });

  it("allows local HTTP URLs in production", () => {
    expect(resolveApiBase({
      env: env({ [NEXT_PUBLIC_AGENTPAY_API_BASE_ENV]: "http://127.0.0.1:3001" }),
      isProduction: true,
    })).toBe("http://127.0.0.1:3001");

    expect(resolveApiBase({
      env: env({ [NEXT_PUBLIC_AGENTPAY_API_BASE_ENV]: "http://[::1]:3001" }),
      isProduction: true,
    })).toBe("http://[::1]:3001");
  });

  it("warns for non-local HTTP URLs outside production", () => {
    const warn = jest.fn();

    expect(resolveApiBase({
      env: env({ [NEXT_PUBLIC_AGENTPAY_API_BASE_ENV]: "http://api.example.com" }),
      isProduction: false,
      warn,
    })).toBe("http://api.example.com");

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("uses http"));
  });

  it("uses console.warn when no warning logger is provided", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    try {
      expect(resolveApiBase({
        env: env({ [NEXT_PUBLIC_AGENTPAY_API_BASE_ENV]: "http://api.example.com" }),
        isProduction: false,
      })).toBe("http://api.example.com");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("uses http"));
    } finally {
      warnSpy.mockRestore();
    }
  });
});
