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
    global: { statements: 0, branches: 0, functions: 0, lines: 0 },
  },
  coverageReporters: ["text", "json-summary", "lcov"],
};

export default config;
