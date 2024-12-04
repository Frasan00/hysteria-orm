import { DataSourceType } from "../data_source";
import { DriverImport, DriverSpecificOptions } from "./driver_constants";

export abstract class Driver {
  abstract type: DataSourceType | "redis";
  abstract client: DriverImport;
  options?: DriverSpecificOptions;

  constructor(driverSpecificOptions?: DriverSpecificOptions) {
    this.options = driverSpecificOptions;
  }

  static async createDriver(
    _driverSpecificOptions: DriverSpecificOptions,
  ): Promise<Driver> {
    throw new Error("Cannot be used by abstract class");
  }
}
