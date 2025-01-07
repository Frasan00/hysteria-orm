import { DataSourceType } from "../data_source/data_source_types";
import { Driver } from "./driver";
import {
  DriverSpecificOptions,
  DriverNotFoundError,
  Sqlite3Import,
} from "./driver_constants";

export class Sqlite3Driver extends Driver {
  override type: DataSourceType | "redis" = "postgres";
  override client: Sqlite3Import;

  constructor(
    client: Sqlite3Import,
    driverSpecificOptions?: DriverSpecificOptions,
  ) {
    super(driverSpecificOptions);
    this.client = client;
  }

  static async createDriver(
    driverSpecificOptions?: DriverSpecificOptions,
  ): Promise<Driver> {
    const sqlite3 = await import("sqlite3").catch(() => {
      throw new DriverNotFoundError("sqlite3");
    });
    if (!sqlite3) {
      throw new DriverNotFoundError("sqlite3");
    }

    return new Sqlite3Driver(sqlite3.default, driverSpecificOptions);
  }
}
