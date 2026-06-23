import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  coverageProvider: "v8",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
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
    "./src/components/Header.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/Pagination.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/StatTile.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/StatusDot.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/TextField.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/ThemeToggle.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/components/ToastProvider.tsx": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/lib/securityHeaders.ts": { statements: 100, branches: 100, functions: 100, lines: 100 },
    "./src/lib/useDebounce.ts": { statements: 100, branches: 100, functions: 100, lines: 100 },
    // Files locked at their current coverage to prevent regressions without
    // making CI fail on aspirational 100% thresholds.
    "./src/components/ConfirmDialog.tsx": { statements: 95, branches: 82, functions: 100, lines: 95 },
    "./src/lib/apiClient.ts": { statements: 98, branches: 94, functions: 100, lines: 98 },
    "./src/lib/format.ts": { statements: 100, branches: 92, functions: 100, lines: 100 },
    "./src/lib/resolveApiBase.ts": { statements: 75, branches: 57, functions: 66, lines: 75 },
    "./src/lib/theme.ts": { statements: 100, branches: 81, functions: 100, lines: 100 },
  },
  coverageReporters: ["text", "json-summary", "lcov"],
};

export default createJestConfig(config);
