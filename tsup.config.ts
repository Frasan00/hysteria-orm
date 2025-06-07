import { defineConfig } from "tsup";

const external = [
  "commander",
  "pluralize",
  "reflect-metadata",
  "sql-formatter",
  "ioredis",
  "pino",
  "pino-pretty",
];

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
    treeshake: true,
    splitting: false,
    outDir: "lib",
    external,
  },
  {
    entry: ["src/cli.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
    treeshake: true,
    splitting: false,
    outDir: "lib",
    external,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
]);
