import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  coverageProvider: "v8",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|sass|scss)$": "<rootDir>/src/__mocks__/styleMock.js",
  },
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
  ],
  coverageThreshold: {
    // Global thresholds cover files NOT listed in per-file thresholds below.
    // Jest intentionally excludes per-file-thresholded files from global calculation.
    global: {
      statements: 20,
      branches: 40,
      functions: 28,
      lines: 20,
    },
    // Lock in 100%-covered files to prevent regressions.
    "./src/app/page.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/Badge.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/Breadcrumb.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/Card.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/ConfirmDialog.tsx": { statements: 100, branches: 94, functions: 100, lines: 100 },
    "./src/components/Footer.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/Header.tsx": { statements: 100, branches: 87, functions: 90, lines: 100 },
    "./src/components/Pagination.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/TextField.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/ThemeToggle.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/TimeAgo.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/ToastProvider.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/app/docs/page.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/CurlBlock.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/lib/apiClient.ts": { statements: 80, branches: 80, functions: 70, lines: 80 },
    "./src/lib/resolveApiBase.ts": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/lib/securityHeaders.ts": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/lib/useDebounce.ts": { statements: 100, branches: 100, functions: 100, lines: 100 },
    // Near-100% files locked at their current coverage to prevent regressions.
    "./src/lib/format.ts": {
      statements: 100,
      branches: 92,
      functions: 100,
      lines: 100,
    },
    "./src/lib/theme.ts": {
      statements: 100,
      branches: 81,
      functions: 100,
      lines: 100,
    },
    "./src/lib/url.ts": {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
  coverageReporters: ["text", "json-summary", "lcov"],
};

export default config;
