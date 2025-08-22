import { defineConfig } from "tsup";

const external = [
  "ioredis",
  "mongodb",
  "pg",
  "mysql2",
  "sqlite3",
  "bundle-require",
  "esbuild",
  "sql-formatter",
  "sql-highlight",
  "reflect-metadata",
  "pluralize",
  "dayjs",
  "async-mutex",
  "commander",
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
