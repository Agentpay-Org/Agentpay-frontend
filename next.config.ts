import type { NextConfig } from "next";
import { defaultSecurityHeaders } from "./src/lib/securityHeaders";
import { resolveApiBase } from "./src/lib/resolveApiBase";

// Default the public API base to the live backend so production builds work
// without extra configuration. Override with NEXT_PUBLIC_AGENTPAY_API_BASE.
if (!process.env.NEXT_PUBLIC_AGENTPAY_API_BASE) {
  process.env.NEXT_PUBLIC_AGENTPAY_API_BASE =
    "https://agentpay-backend-red.vercel.app";
}

// Resolve the API base once at build time so the CSP matches what the client
// will fetch against at runtime.
const apiBase = resolveApiBase();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_AGENTPAY_API_BASE: apiBase,
  },
  // Apply the security headers to every response served by Next.js. Routes
  // can override individually later, but the baseline locks the dashboard
  // down by default.
  async headers() {
    const headers = defaultSecurityHeaders({
      apiBase,
      isDev: process.env.NODE_ENV !== "production",
    });
    // CSP is handled by src/proxy.ts at request time so a per-request nonce
    // can be injected; we exclude it from the static config headers.
    const { "Content-Security-Policy": _csp, ...headersWithoutCsp } = headers;
    return [
      {
        source: "/:path*",
        headers: Object.entries(headersWithoutCsp).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },
};

export default nextConfig;
