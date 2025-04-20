import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  treeshake: true,
  splitting: false,
  outDir: "lib",
  external: [
    "commander",
    "pluralize",
    "reflect-metadata",
    "sql-formatter",
    "ioredis",
    "mongodb",
    "mysql2",
    "pg",
    "sqlite3",
  ],
});
