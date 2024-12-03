import { DataSourceType } from "../data_source";
import { Driver } from "./driver";
import { DriverSpecificOptions } from "./driver_constants";
import { PgDriver } from "./pg_driver";
import { MongoDriver } from "./mongo_driver";
import { MysqlDriver } from "./mysql_driver";
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
        return PgDriver.createDriver(driverSpecificOptions);
      case "sqlite":
        return Sqlite3Driver.createDriver(driverSpecificOptions);
      case "mongo":
        return MongoDriver.createDriver(driverSpecificOptions);
      case "redis":
        return RedisDriver.createDriver(driverSpecificOptions);
      default:
        throw new Error(
          `Driver ${client} not found, il likely not installed, try running npm install ${client}`,
        );
    }
  }
}
