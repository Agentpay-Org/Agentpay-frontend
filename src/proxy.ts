import { NextResponse, type NextRequest } from "next/server";
import { defaultSecurityHeaders } from "./lib/securityHeaders";
import { resolveApiBase } from "./lib/resolveApiBase";

const apiBase = resolveApiBase();
const isDev = process.env.NODE_ENV !== "production";

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function proxy(request: NextRequest) {
  const nonce = generateNonce();
  const securityHeaders = defaultSecurityHeaders({
    apiBase,
    isDev,
    scriptNonce: nonce,
  });
  const csp = securityHeaders["Content-Security-Policy"];
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
