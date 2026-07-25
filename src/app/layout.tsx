import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ToastProvider } from "@/components/ToastProvider";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "AgentPay",
    template: "%s — AgentPay",
  },
  description: "Machine-to-machine payment protocol on Stellar",
  applicationName: "AgentPay",
  authors: [{ name: "AgentPay" }],
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "AgentPay",
    description: "Pay-per-request billing for AI agents and APIs on Stellar.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AgentPay",
    description: "Pay-per-request billing for AI agents and APIs on Stellar.",
  },
};

/**
 * Blocking inline script injected into <head> before the body renders.
 *
 * Reads the stored theme preference from localStorage (same key as
 * THEME_STORAGE_KEY in src/lib/theme.ts) and applies the `dark` class to
 * <html> synchronously so there is no flash of the wrong colour scheme
 * (FOUC) before React hydration runs.
 *
 * - localStorage access is wrapped in try/catch for private-browsing
 *   environments that throw on storage access.
 * - An absent or invalid stored value falls back to `prefers-color-scheme`,
 *   matching the behaviour of readTheme() / effectiveTheme().
 * - THEME_STORAGE_KEY is embedded at build time so this script and the TS
 *   helpers always reference the same key — no drift possible.
 */
const prePaintScript = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.classList.toggle("light",!d);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
   * Read the per-request nonce that src/proxy.ts set on the request
   * headers so we can stamp it onto the inline pre-paint <script>.
   * This lets the script execute under the CSP 'nonce-<value>'
   * mechanism instead of requiring 'unsafe-inline'.
   */
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    /*
     * suppressHydrationWarning: the pre-paint script mutates the `class`
     * attribute on <html> before React mounts, so the server-rendered
     * class list will differ from the client's first render. This prop
     * suppresses the resulting hydration mismatch warning on the root
     * element only — it does NOT suppress warnings in child components.
     */
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
         * dangerouslySetInnerHTML is intentional: the script must be a raw
         * inline string so the browser parser executes it synchronously,
         * before the first CSS paint. The content is entirely static
         * (no user input, no interpolated secrets), eliminating XSS risk.
         */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: prePaintScript }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-full focus-visible:bg-black focus-visible:px-4 focus-visible:py-2 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Skip to main content
        </a>
        <ToastProvider>
          <OfflineBanner />
          <Header />
          {children}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
