import robots from "./robots";

const ORIGINAL_SITE_ORIGIN = process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN;

afterEach(() => {
  if (ORIGINAL_SITE_ORIGIN === undefined) {
    delete process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN;
  } else {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = ORIGINAL_SITE_ORIGIN;
  }
});

describe("robots metadata route", () => {
  it("allows public crawling and disallows operator surfaces", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com/";

    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api-keys", "/webhooks", "/settings"],
      },
      sitemap: "https://dashboard.example.com/sitemap.xml",
    });
  });

  it("falls back to the local development sitemap URL", () => {
    delete process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN;

    expect(robots().sitemap).toBe("http://localhost:3000/sitemap.xml");
  });

  it("allows crawling from root path", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com";

    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules?.allow).toBe("/");
  });

  it("applies rules to all user agents", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com";

    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules?.userAgent).toBe("*");
  });

  it("disallow list contains exactly the four operator surfaces", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com";

    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules?.disallow).toEqual(["/admin", "/api-keys", "/webhooks", "/settings"]);
  });

  it("sitemap URL uses the configured origin", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://custom.agentpay.example";

    expect(robots().sitemap).toBe("https://custom.agentpay.example/sitemap.xml");
  });

  it("strips trailing slash from configured origin in sitemap URL", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com/";

    expect(robots().sitemap).toBe("https://dashboard.example.com/sitemap.xml");
  });
});
