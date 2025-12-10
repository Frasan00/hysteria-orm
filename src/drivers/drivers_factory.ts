import type { DataSourceType } from "../data_source/data_source_types";
import { HysteriaError } from "../errors/hysteria_error";
import { Driver } from "./driver";
import { MongoDriver } from "./mongo_driver";
import { MssqlDriver } from "./mssql_driver";
import { MysqlDriver } from "./mysql_driver";
import { PgDriver } from "./pg_driver";
import { Sqlite3Driver } from "./sqlite3_driver";

export class DriverFactory {
  static async getDriver(client: DataSourceType | "redis"): Promise<Driver> {
    switch (client) {
      case "mysql":
      case "mariadb":
        return MysqlDriver.createDriver();
      case "postgres":
      case "cockroachdb":
        return PgDriver.createDriver();
      case "sqlite":
        return Sqlite3Driver.createDriver();
      case "mongo":
        return MongoDriver.createDriver();
      case "mssql":
        return MssqlDriver.createDriver();
      default:
        throw new HysteriaError(
          `DriverFactory::getDriver Driver ${client} not supported`,
          "DRIVER_NOT_FOUND"
        );
    }
  }
}
