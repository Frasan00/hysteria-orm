import { DataSourceType } from "../data_source";
import { Driver } from "./driver";
import {
  DriverSpecificOptions,
  DriverNotFoundError,
  RedisImport,
} from "./driver_constants";

export class RedisDriver extends Driver {
  override type: DataSourceType | "redis" = "postgres";
  override client: RedisImport;

  constructor(
    client: RedisImport,
    driverSpecificOptions?: DriverSpecificOptions,
  ) {
    super(driverSpecificOptions);
    this.client = client;
  }

  static async createDriver(
    driverSpecificOptions?: DriverSpecificOptions,
  ): Promise<Driver> {
    const redis = await import("ioredis").catch(() => {
      throw new DriverNotFoundError("ioredis");
    });
    if (!redis) {
      throw new DriverNotFoundError("ioredis");
    }

    return new RedisDriver(redis, driverSpecificOptions);
  }
}
