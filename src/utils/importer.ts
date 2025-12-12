import path from "node:path";
import { DriverNotFoundError } from "../drivers/driver_constants";

export async function importTsUniversal<T = any>(
  entry: string,
  tsconfigPath?: string,
): Promise<T> {
  const { bundleRequire } = await import("bundle-require").catch(() => {
    throw new DriverNotFoundError("bundle-require");
  });

  const filepath = path.isAbsolute(entry)
    ? entry
    : path.resolve(process.cwd(), entry);

  const { mod } = await bundleRequire({
    filepath,
    format: "esm",
    preserveTemporaryFile: false,
    esbuildOptions: {
      keepNames: true,
      sourcemap: true,
    },
    tsconfig: tsconfigPath ?? "./tsconfig.json",
    external: [
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
    ],
  });

  return mod as T;
}
