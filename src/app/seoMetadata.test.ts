import {
  publicStaticRoutes,
  operatorOnlyRoutes,
  resolveSiteOrigin,
  absoluteSiteUrl,
} from "./seoMetadata";

const ORIGINAL_SITE_ORIGIN = process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN;

afterEach(() => {
  if (ORIGINAL_SITE_ORIGIN === undefined) {
    delete process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN;
  } else {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = ORIGINAL_SITE_ORIGIN;
  }
});

describe("publicStaticRoutes", () => {
  it("includes the home route", () => {
    expect(publicStaticRoutes).toContain("/");
  });

  it("includes all expected public routes", () => {
    expect(publicStaticRoutes).toEqual(
      expect.arrayContaining(["/", "/about", "/docs", "/changelog"])
    );
  });

  it("does not include any operator-only routes", () => {
    for (const opRoute of operatorOnlyRoutes) {
      expect(publicStaticRoutes).not.toContain(opRoute);
    }
  });
});

describe("operatorOnlyRoutes", () => {
  it("includes /admin", () => {
    expect(operatorOnlyRoutes).toContain("/admin");
  });

  it("includes /api-keys", () => {
    expect(operatorOnlyRoutes).toContain("/api-keys");
  });

  it("includes /webhooks", () => {
    expect(operatorOnlyRoutes).toContain("/webhooks");
  });

  it("includes /settings", () => {
    expect(operatorOnlyRoutes).toContain("/settings");
  });

  it("does not include any public static routes", () => {
    for (const pubRoute of publicStaticRoutes) {
      expect(operatorOnlyRoutes).not.toContain(pubRoute);
    }
  });
});

describe("resolveSiteOrigin", () => {
  it("returns the configured origin with trailing slashes stripped", () => {
    expect(resolveSiteOrigin({ NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN: "https://dashboard.example.com/" } as unknown as NodeJS.ProcessEnv)).toBe(
      "https://dashboard.example.com"
    );
  });

  it("strips multiple trailing slashes", () => {
    expect(resolveSiteOrigin({ NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN: "https://dashboard.example.com///" } as unknown as NodeJS.ProcessEnv)).toBe(
      "https://dashboard.example.com"
    );
  });

  it("falls back to localhost:3000 when env is absent", () => {
    expect(resolveSiteOrigin({} as unknown as NodeJS.ProcessEnv)).toBe("http://localhost:3000");
  });

  it("falls back to localhost:3000 when env value is whitespace-only", () => {
    expect(resolveSiteOrigin({ NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN: "   " } as unknown as NodeJS.ProcessEnv)).toBe(
      "http://localhost:3000"
    );
  });

  it("falls back to localhost:3000 when env value is an empty string", () => {
    expect(resolveSiteOrigin({ NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN: "" } as unknown as NodeJS.ProcessEnv)).toBe(
      "http://localhost:3000"
    );
  });

  it("reads from process.env by default", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://custom.example.com";
    expect(resolveSiteOrigin()).toBe("https://custom.example.com");
  });
});

describe("absoluteSiteUrl", () => {
  it("builds absolute URL for a root path", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com";
    expect(absoluteSiteUrl("/")).toBe("https://dashboard.example.com/");
  });

  it("builds absolute URL for a nested path", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com";
    expect(absoluteSiteUrl("/about")).toBe("https://dashboard.example.com/about");
  });

  it("builds absolute URL for /sitemap.xml", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com";
    expect(absoluteSiteUrl("/sitemap.xml")).toBe(
      "https://dashboard.example.com/sitemap.xml"
    );
  });

  it("falls back to localhost when env is unset", () => {
    delete process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN;
    expect(absoluteSiteUrl("/about")).toBe("http://localhost:3000/about");
  });
});
