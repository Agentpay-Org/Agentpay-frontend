"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
    if (error.digest) {
      console.error("Error digest:", error.digest);
    }
  }, [error]);

  return (
    <html lang="en">
      <head>
        <style>{`
          :root {
            --bg: #fafafa;
            --fg: #18181b;
            --secondary: #52525b;
            --btn-bg: #18181b;
            --btn-fg: #fafafa;
            --btn-hover: #3f3f46;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --bg: #09090b;
              --fg: #fafafa;
              --secondary: #a1a1aa;
              --btn-bg: #fafafa;
              --btn-fg: #09090b;
              --btn-hover: #e4e4e7;
            }
          }
          body {
            background-color: var(--bg);
            color: var(--fg);
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
          }
          .container {
            max-width: 36rem;
            padding: 2rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            outline: none;
          }
          .title {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0;
          }
          .message {
            font-size: 0.875rem;
            color: var(--secondary);
            line-height: 1.5;
          }
          .digest {
            font-size: 0.75rem;
            color: var(--secondary);
            font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
          }
          .btn-retry {
            background-color: var(--btn-bg);
            color: var(--btn-fg);
            border: none;
            border-radius: 9999px;
            padding: 0.5rem 1.25rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
          }
          .btn-retry:hover {
            background-color: var(--btn-hover);
          }
          .btn-retry:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }
        `}</style>
      </head>
      <body>
        <main
          id="main-content"
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="container"
        >
          <h1 className="title">Something went wrong.</h1>
          <div className="message">
            {error.message || "An unexpected error occurred."}
          </div>
          {error.digest && (
            <div className="digest">
              Error ID: {error.digest}
            </div>
          )}
          <button type="button" onClick={reset} className="btn-retry">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
