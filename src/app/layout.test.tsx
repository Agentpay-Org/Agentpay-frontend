import { renderToString } from "react-dom/server.node";

jest.mock("next/headers", () => ({
  headers: jest.fn(() =>
    Promise.resolve({
      get: (key: string) => (key === "x-nonce" ? "test-nonce-abc" : null),
    })
  ),
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

import { headers } from "next/headers";
import RootLayout, { metadata, viewport } from "./layout";

const mockHeaders = headers as jest.Mock;

describe("RootLayout — metadata", () => {
  it("keeps the home route on the default AgentPay title", () => {
    expect(metadata.title).toMatchObject({
      default: "AgentPay",
      template: "%s — AgentPay",
    });
  });

  it("configures the manifest and apple-touch icon in metadata", () => {
    expect(metadata.manifest).toBe("/manifest.webmanifest");
    expect(metadata.icons).toMatchObject({
      apple: "/favicon.ico",
    });
  });

  it("configures the themeColor in viewport", () => {
    expect(viewport.themeColor).toEqual([
      { media: "(prefers-color-scheme: light)", color: "#ffffff" },
      { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    ]);
  });
});

describe("RootLayout — font loading", () => {
  it("renders children inside the layout", async () => {
    const html = await RootLayout({ children: <p>hello world</p> });
    expect(renderToString(html)).toContain("hello world");
  });

  it("applies Geist Sans and Geist Mono CSS variable classes to <body>", async () => {
    const html = await RootLayout({ children: null });
    const markup = renderToString(html);

    expect(markup).toContain('class="--font-geist-sans');
    expect(markup).toContain("--font-geist-mono");
  });

  it("includes the antialiased utility class on <body>", async () => {
    const html = await RootLayout({ children: null });
    const markup = renderToString(html);

    expect(markup).toContain("antialiased");
  });

  it("passes the nonce to the pre-paint <script> element", async () => {
    const html = await RootLayout({ children: null });
    const markup = renderToString(html);

    expect(markup).toContain('nonce="test-nonce-abc"');
  });

  it("falls back to empty nonce when x-nonce header is absent", async () => {
    mockHeaders.mockImplementationOnce(() =>
      Promise.resolve({ get: () => null })
    );

    const html = await RootLayout({ children: null });
    const markup = renderToString(html);

    expect(markup).toContain("<script");
    expect(markup).not.toContain('nonce="test-nonce-abc"');
  });

  it("renders the skip-to-main-content link as the first landmark", async () => {
    const html = await RootLayout({ children: null });
    const markup = renderToString(html);

    expect(markup).toContain('href="#main-content"');
    expect(markup).toContain("Skip to main content");
  });

  it("renders <html> with lang attribute", async () => {
    const html = await RootLayout({ children: null });
    const markup = renderToString(html);

    expect(markup).toContain('lang="en"');
  });

  it("renders layout components (Header, Footer, ToastProvider, OfflineBanner)", async () => {
    const html = await RootLayout({ children: null });
    const markup = renderToString(html);

    expect(markup).toContain("<header");
    expect(markup).toContain("<footer");
  });
});
