// Request-time proxy that generates a per-request cryptographic nonce, stamps
// the Content-Security-Policy response header with `'nonce-<value>'`, and
// forwards the nonce via `x-nonce` so `src/app/layout.tsx` can apply it to the
// inline theme pre-paint script.
//
// Using a proxy (rather than next.config.ts headers) is required because a
// nonce must be unique per HTTP request — build-time headers can't do that.
//
// The CSP itself is built by the same `buildCsp()` from src/lib/securityHeaders
// that the build-time path uses, so the directive list stays in one place.

import { NextRequest, NextResponse } from "next/server";
import { buildCsp, resolveApiBase } from "@/lib/securityHeaders";

export function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID();

  const csp = buildCsp({
    apiBase: resolveApiBase(),
    isDev: process.env.NODE_ENV !== "production",
    nonce,
  });

  // Clone request headers so we can propagate the nonce to the layout without
  // polluting the actual upstream request sent by the browser.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", csp);

  return response;
}

// Run on every route so the CSP nonce is fresh for every page navigation.
// Note: In Next.js 16 the file convention is `proxy.ts` (formerly `middleware.ts`).
export const config = {
  matcher: "/:path*",
};
