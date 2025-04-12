import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["cjs", "esm"],
  external: ["luxon", "ioredis", "pg", "mysql2", "sqlite3", "mongodb"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
  outDir: "lib",
});
