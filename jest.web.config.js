/**
 * Web/react-native driver suite. Separate from jest.config.js because
 * testEnvironment must be jsdom — the whole point is that resolveJsEnvironment()
 * reports "web" and the platform/wasm paths never touch node builtins.
 */
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/test/web/**/*.test.ts"],
  setupFiles: ["<rootDir>/jest.web.setup.js"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.json",
        diagnostics: { ignoreCodes: [1343] },
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  maxWorkers: 1,
};
