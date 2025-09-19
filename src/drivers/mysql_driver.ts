import type { DataSourceType } from "../data_source/data_source_types";
import { Driver } from "./driver";
import {
  Mysql2Import,
  DriverSpecificOptions,
  DriverNotFoundError,
} from "./driver_constants";

export class MysqlDriver extends Driver {
  override type: DataSourceType | "redis" = "mysql";
  override client: Mysql2Import;

  constructor(
    client: Mysql2Import,
    driverSpecificOptions?: DriverSpecificOptions,
  ) {
    super(driverSpecificOptions);
    this.client = client;
  }

  static async createDriver(
    driverSpecificOptions?: DriverSpecificOptions,
  ): Promise<Driver> {
    const mysql2 = await import("mysql2/promise").catch(() => {
      throw new DriverNotFoundError("mysql2");
    });

    if (!mysql2) {
      throw new DriverNotFoundError("mysql");
    }

    return new MysqlDriver(mysql2.default, driverSpecificOptions);
  }
}
