import type { DataSourceType } from "../data_source/data_source_types";
import { HysteriaError } from "../errors/hysteria_error";
import { Driver } from "./driver";
import { DriverSpecificOptions } from "./driver_constants";
import { MongoDriver } from "./mongo_driver";
import { MysqlDriver } from "./mysql_driver";
import { PgDriver } from "./pg_driver";
import { RedisDriver } from "./redis_driver";
import { Sqlite3Driver } from "./sqlite3_driver";

export class DriverFactory {
  static async getDriver(
    client: DataSourceType | "redis",
    driverSpecificOptions?: DriverSpecificOptions,
  ): Promise<Driver> {
    switch (client) {
      case "mysql":
      case "mariadb":
        return MysqlDriver.createDriver(driverSpecificOptions);
      case "postgres":
      case "cockroachdb":
        return PgDriver.createDriver(driverSpecificOptions);
      case "sqlite":
        return Sqlite3Driver.createDriver(driverSpecificOptions);
      case "mongo":
        return MongoDriver.createDriver(driverSpecificOptions);
      case "redis":
        return RedisDriver.createDriver(driverSpecificOptions);
      default:
        throw new HysteriaError(
          `DriverFactory::getDriver Driver ${client} not found, il likely not installed, try running npm install ${client}`,
          "DRIVER_NOT_FOUND",
        );
    }
  }
}
