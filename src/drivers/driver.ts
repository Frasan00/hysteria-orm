import type { DataSourceType } from "../data_source/data_source_types";
import { HysteriaError } from "../errors/hysteria_error";
import { DriverImport, DriverSpecificOptions } from "./driver_constants";

export abstract class Driver {
  abstract type: DataSourceType | "redis";
  abstract client: DriverImport;
  options?: DriverSpecificOptions<DataSourceType>;

  constructor(driverSpecificOptions?: DriverSpecificOptions<DataSourceType>) {
    this.options = driverSpecificOptions;
  }

  static async createDriver(
    _driverSpecificOptions: DriverSpecificOptions<DataSourceType>,
  ): Promise<Driver> {
    throw new HysteriaError(
      "Driver::createDriver This error should never happen. Please report it to the developers.",
      "DEVELOPMENT_ERROR",
    );
  }
}
