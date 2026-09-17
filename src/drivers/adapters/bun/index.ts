import { registerDriverAdapter } from "../../driver_adapter_registry";
import type { DriverAdapterFactory } from "../../driver_adapter_registry";
import { BunSqlDriverAdapter } from "./bun_sql_adapter";
import { BunSqliteDriverAdapter } from "./bun_sqlite_adapter";

/**
 * Registers the bun-native drivers (Bun.sql for postgres/cockroachdb/mysql/
 * mariadb, bun:sqlite for sqlite). Only ever invoked under a bun runtime — the
 * guarded `import("bun")`/`import("bun:sqlite")` calls never run elsewhere.
 */
export const registerBunDrivers = async (): Promise<void> => {
  const { SQL } = await import("bun" as string);
  const { Database } = await import("bun:sqlite" as string);

  registerDriverAdapter({
    name: "bun-sql",
    dialects: ["postgres", "cockroachdb", "mysql", "mariadb"],
    environments: ["bun"] as const,
    create: async ({ dialect, input }) =>
      new BunSqlDriverAdapter(
        dialect as "postgres" | "cockroachdb" | "mysql" | "mariadb",
        input as never,
        SQL,
      ),
  } satisfies DriverAdapterFactory);

  registerDriverAdapter({
    name: "bun-sqlite",
    dialects: ["sqlite"],
    environments: ["bun"] as const,
    create: async ({ dialect, input }) =>
      new BunSqliteDriverAdapter(dialect as "sqlite", input as never, Database),
  } satisfies DriverAdapterFactory);
};
