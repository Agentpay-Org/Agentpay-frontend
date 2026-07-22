import { resolveApiBase } from "../resolveApiBase";

describe("resolveApiBase", () => {
  it("defaults to process.env when no options are provided", () => {
    const result = resolveApiBase();
    expect(result).toBe("http://localhost:3001");
  });

  it("returns the default base when the env var is unset", () => {
    expect(resolveApiBase({ env: {} })).toBe("http://localhost:3001");
  });

  it("uses the env var when set", () => {
    expect(
      resolveApiBase({
        env: { NEXT_PUBLIC_AGENTPAY_API_BASE: "https://api.example.com" },
      })
    ).toBe("https://api.example.com");
  });

  it("strips trailing slashes from the origin path", () => {
    expect(
      resolveApiBase({
        env: { NEXT_PUBLIC_AGENTPAY_API_BASE: "https://api.example.com/v1/" },
      })
    ).toBe("https://api.example.com/v1");
  });

  it("throws for an invalid URL", () => {
    expect(() =>
      resolveApiBase({
        env: { NEXT_PUBLIC_AGENTPAY_API_BASE: "not a url" },
      })
    ).toThrow("Invalid NEXT_PUBLIC_AGENTPAY_API_BASE");
  });

  it("throws for an unsupported protocol", () => {
    expect(() =>
      resolveApiBase({
        env: { NEXT_PUBLIC_AGENTPAY_API_BASE: "ftp://api.example.com" },
      })
    ).toThrow("Unsupported protocol");
  });

  it("throws for http on a non-localhost host in production", () => {
    expect(() =>
      resolveApiBase({
        env: { NEXT_PUBLIC_AGENTPAY_API_BASE: "http://api.example.com" },
        isProduction: true,
      })
    ).toThrow("Refusing to use a non-https NEXT_PUBLIC_AGENTPAY_API_BASE in production");
  });

  it("allows http for localhost in production", () => {
    expect(
      resolveApiBase({
        env: { NEXT_PUBLIC_AGENTPAY_API_BASE: "http://localhost:4000" },
        isProduction: true,
      })
    ).toBe("http://localhost:4000");
  });

  it("warns for http on a non-localhost host in development", () => {
    const warn = jest.fn();

    resolveApiBase({
      env: { NEXT_PUBLIC_AGENTPAY_API_BASE: "http://api.example.com" },
      isProduction: false,
      warn,
    });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("non-localhost host")
    );
  });

  it("does not warn for https in development", () => {
    const warn = jest.fn();

    resolveApiBase({
      env: { NEXT_PUBLIC_AGENTPAY_API_BASE: "https://api.example.com" },
      isProduction: false,
      warn,
    });

    expect(warn).not.toHaveBeenCalled();
  });

  it("trims surrounding whitespace from env var", () => {
    expect(
      resolveApiBase({
        env: { NEXT_PUBLIC_AGENTPAY_API_BASE: "  https://api.example.com  " },
      })
    ).toBe("https://api.example.com");
  });

  it("returns default base when env var is whitespace-only", () => {
    expect(
      resolveApiBase({
        env: { NEXT_PUBLIC_AGENTPAY_API_BASE: "   " },
      })
    ).toBe("http://localhost:3001");
  });

  it("allows http for 127.0.0.1 and IPv6 localhost in production", () => {
    expect(
      resolveApiBase({
        env: { NEXT_PUBLIC_AGENTPAY_API_BASE: "http://127.0.0.1:4000" },
        isProduction: true,
      })
    ).toBe("http://127.0.0.1:4000");

    expect(
      resolveApiBase({
        env: { NEXT_PUBLIC_AGENTPAY_API_BASE: "http://[::1]:4000" },
        isProduction: true,
      })
    ).toBe("http://[::1]:4000");
  });

  it("calls console.warn via the default warn callback for http on a non-localhost host", () => {
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});

    resolveApiBase({
      env: { NEXT_PUBLIC_AGENTPAY_API_BASE: "http://non-localhost.example.com" },
      isProduction: false,
    });

    expect(consoleWarn).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });
});

