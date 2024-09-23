import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  external: ["luxon", "ioredis", "pg", "mysql2", "sqlite3"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: "lib",
});
