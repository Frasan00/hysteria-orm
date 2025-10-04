import { DataSourceType } from "../data_source/data_source_types";
import { Driver } from "./driver";
import {
  DriverSpecificOptions,
  DriverNotFoundError,
  PgImport,
} from "./driver_constants";

export class PgDriver extends Driver {
  override type: DataSourceType | "redis" = "postgres";
  override client: PgImport;

  constructor(
    client: PgImport,
    driverSpecificOptions?: DriverSpecificOptions<DataSourceType>,
  ) {
    super(driverSpecificOptions);
    this.client = client;
  }

  static async createDriver(
    driverSpecificOptions?: DriverSpecificOptions<DataSourceType>,
  ): Promise<Driver> {
    const pg = await import("pg").catch(() => {
      throw new DriverNotFoundError("pg");
    });
    if (!pg) {
      throw new DriverNotFoundError("pg");
    }

    return new PgDriver(pg.default, driverSpecificOptions);
  }
}
