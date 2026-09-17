import { DriverFactory } from "../../drivers_factory";
import type {
  MssqlImport,
  Mysql2Import,
  PgImport,
  Sqlite3Import,
} from "../../driver_types";
import { registerDriverAdapter } from "../../driver_adapter_registry";
import { PgDriverAdapter } from "./pg.adapter";
import { Mysql2DriverAdapter } from "./mysql2.adapter";
import { Sqlite3DriverAdapter } from "./sqlite3.adapter";
import { MssqlDriverAdapter } from "./mssql.adapter";

/**
 * @description Registers the node runtime's default npm drivers (pg, mysql2,
 * sqlite3, mssql). Runs once at module load; bun's native drivers are
 * registered separately and override these on their own environments.
 */
const registerNodeDriverAdapters = (): void => {
  registerDriverAdapter({
    name: "pg",
    dialects: ["postgres", "cockroachdb"] as const,
    create: async ({ dialect, input }) => {
      const driver = (await DriverFactory.getDriver(dialect))
        .client as PgImport;
      return new PgDriverAdapter(
        dialect as "postgres" | "cockroachdb",
        input as never,
        driver,
      );
    },
  });

  registerDriverAdapter({
    name: "mysql2",
    dialects: ["mysql", "mariadb"] as const,
    create: async ({ dialect, input }) => {
      const driver = (await DriverFactory.getDriver(dialect))
        .client as Mysql2Import;
      return new Mysql2DriverAdapter(
        dialect as "mysql" | "mariadb",
        input as never,
        driver,
      );
    },
  });

  registerDriverAdapter({
    name: "sqlite3",
    dialects: ["sqlite"] as const,
    create: async ({ dialect, input }) => {
      const driver = (await DriverFactory.getDriver(dialect))
        .client as Sqlite3Import;
      return new Sqlite3DriverAdapter(
        dialect as "sqlite",
        input as never,
        driver,
      );
    },
  });

  registerDriverAdapter({
    name: "mssql",
    dialects: ["mssql"] as const,
    create: async ({ dialect, input }) => {
      const driver = (await DriverFactory.getDriver(dialect))
        .client as MssqlImport;
      return new MssqlDriverAdapter(dialect as "mssql", input as never, driver);
    },
  });
};

registerNodeDriverAdapters();
