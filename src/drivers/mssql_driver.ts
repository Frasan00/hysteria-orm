import { Driver } from "./driver";
import { DriverNotFoundError } from "./driver_constants";
import { DriverSpecificOptions, MssqlImport } from "./driver_types";

export class MssqlDriver extends Driver {
  override type = "mssql" as const;
  override client: MssqlImport;

  constructor(
    client: MssqlImport,
    driverSpecificOptions?: DriverSpecificOptions<"mssql">
  ) {
    super(driverSpecificOptions);
    this.client = client;
  }

  static async createDriver(): Promise<Driver> {
    const { default: mssql } = await import("mssql").catch(() => {
      throw new DriverNotFoundError("mssql");
    });

    if (!mssql) {
      throw new DriverNotFoundError("mssql");
    }

    return new MssqlDriver(mssql);
  }
}
