import type { DataSourceType } from "../data_source/data_source_types";
import { HysteriaError } from "../errors/hysteria_error";
import { Driver } from "./driver";
import { MongoDriver } from "./mongo_driver";
import { MssqlDriver } from "./mssql_driver";
import { MysqlDriver } from "./mysql_driver";
import { OracleDBDriver } from "./oracledb_driver";
import { PgDriver } from "./pg_driver";
import { Sqlite3Driver } from "./sqlite3_driver";

export class DriverFactory {
  static mysqlDriver: Driver | null = null;
  static pgDriver: Driver | null = null;
  static sqliteDriver: Driver | null = null;
  static mssqlDriver: Driver | null = null;
  static oracledbDriver: Driver | null = null;
  static mongodbDriver: Driver | null = null;

  static async getDriver(client: DataSourceType | "redis"): Promise<Driver> {
    const existingDriver = this.getExistingDriver(client);
    if (existingDriver) {
      return existingDriver;
    }

    switch (client) {
      case "mysql":
      case "mariadb":
        this.mysqlDriver = await MysqlDriver.createDriver();
        return this.mysqlDriver;
      case "postgres":
      case "cockroachdb":
        this.pgDriver = await PgDriver.createDriver();
        return this.pgDriver;
      case "sqlite":
        this.sqliteDriver = await Sqlite3Driver.createDriver();
        return this.sqliteDriver;
      case "mongo":
        this.mongodbDriver = await MongoDriver.createDriver();
        return this.mongodbDriver;
      case "mssql":
        this.mssqlDriver = await MssqlDriver.createDriver();
        return this.mssqlDriver;
      case "oracledb":
        this.oracledbDriver = await OracleDBDriver.createDriver();
        return this.oracledbDriver;
      default:
        throw new HysteriaError(
          `DriverFactory::getDriver Driver ${client} not supported`,
          "DRIVER_NOT_FOUND",
        );
    }
  }

  private static getExistingDriver(
    client: DataSourceType | "redis",
  ): Driver | null {
    switch (client) {
      case "mysql":
      case "mariadb":
        return this.mysqlDriver;
      case "postgres":
      case "cockroachdb":
        return this.pgDriver;
      case "sqlite":
        return this.sqliteDriver;
      case "mongo":
        return this.mongodbDriver;
      case "mssql":
        return this.mssqlDriver;
      case "oracledb":
        return this.oracledbDriver;
      default:
        return null;
    }
  }
}
