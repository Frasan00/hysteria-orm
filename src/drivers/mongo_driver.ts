import { DataSourceType } from "../data_source/data_source_types";
import { Driver } from "./driver";
import {
  DriverSpecificOptions,
  DriverNotFoundError,
  MongoClientImport,
} from "./driver_constants";

export class MongoDriver extends Driver {
  override type: DataSourceType | "redis" = "postgres";
  override client: MongoClientImport;

  constructor(
    client: MongoClientImport,
    driverSpecificOptions?: DriverSpecificOptions,
  ) {
    super(driverSpecificOptions);
    this.client = client;
  }

  static async createDriver(
    driverSpecificOptions?: DriverSpecificOptions,
  ): Promise<Driver> {
    const mongo = await import("mongodb").catch(() => {
      throw new DriverNotFoundError("mongodb");
    });
    if (!mongo) {
      throw new DriverNotFoundError("mongodb");
    }

    return new MongoDriver(mongo, driverSpecificOptions);
  }
}
