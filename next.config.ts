import type { NextConfig } from "next";
import { defaultSecurityHeaders } from "./src/lib/securityHeaders";
import { resolveApiBase } from "./src/lib/resolveApiBase";

// Resolve the API base once at build time so the CSP matches what the client
// will fetch against at runtime.
const apiBase = resolveApiBase();

const nextConfig: NextConfig = {
  // Apply the security headers to every response served by Next.js. Routes
  // can override individually later, but the baseline locks the dashboard
  // down by default.
  async headers() {
    const headers = defaultSecurityHeaders({
      apiBase,
      isDev: process.env.NODE_ENV !== "production",
      includeCsp: false,
    });
    return [
      {
        source: "/:path*",
        headers: Object.entries(headers).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },
};

export default nextConfig;
