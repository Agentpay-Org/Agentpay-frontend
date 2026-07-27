import sitemap from "./sitemap";

const ORIGINAL_SITE_ORIGIN = process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN;

afterEach(() => {
  if (ORIGINAL_SITE_ORIGIN === undefined) {
    delete process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN;
  } else {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = ORIGINAL_SITE_ORIGIN;
  }
});

describe("sitemap metadata route", () => {
  it("lists the public static routes with a configured site origin", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com/";

    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual([
      "https://dashboard.example.com/",
      "https://dashboard.example.com/about",
      "https://dashboard.example.com/docs",
      "https://dashboard.example.com/changelog",
    ]);
    for (const entry of entries) {
      expect(entry).toMatchObject({
        changeFrequency: "weekly",
        priority: expect.any(Number),
      });
      expect(entry.lastModified).toBeInstanceOf(Date);
    }
  });

  it("does not include operator-only dashboard surfaces", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com";

    const urls = sitemap().map((entry) => new URL(entry.url).pathname);

    expect(urls).not.toEqual(expect.arrayContaining([
      "/admin",
      "/api-keys",
      "/webhooks",
      "/settings",
    ]));
  });

  it("falls back to the local development origin", () => {
    delete process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN;

    expect(sitemap()[0]?.url).toBe("http://localhost:3000/");
  });

  it("strips a trailing slash from the configured origin", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com/";

    const urls = sitemap().map((e) => e.url);
    for (const url of urls) {
      // Ensure no double-slash in the path portion (after the protocol)
      const path = new URL(url).pathname;
      expect(path).not.toMatch(/\/\//);
    }
  });

  it("assigns priority 1 to the home route", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com";

    const homeEntry = sitemap().find((e) => new URL(e.url).pathname === "/");
    expect(homeEntry?.priority).toBe(1);
  });

  it("assigns priority 0.7 to non-home routes", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com";

    const nonHome = sitemap().filter((e) => new URL(e.url).pathname !== "/");
    for (const entry of nonHome) {
      expect(entry.priority).toBe(0.7);
    }
  });

  it("sets changeFrequency to weekly for every entry", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com";

    const entries = sitemap();
    for (const entry of entries) {
      expect(entry.changeFrequency).toBe("weekly");
    }
  });

  it("sets lastModified to a Date instance for every entry", () => {
    process.env.NEXT_PUBLIC_AGENTPAY_SITE_ORIGIN = "https://dashboard.example.com";

    const entries = sitemap();
    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date);
    }
  });
});
