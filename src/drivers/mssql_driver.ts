import { Driver } from "./driver";
import { DriverNotFoundError } from "./driver_constants";
import { DriverSpecificOptions, MssqlImport } from "./driver_types";

export class MssqlDriver extends Driver {
  static mssqlClient: MssqlImport | null = null;

  override type = "mssql" as const;
  override client: MssqlImport;

  constructor(
    client: MssqlImport,
    driverSpecificOptions?: DriverSpecificOptions<"mssql">,
  ) {
    super(driverSpecificOptions);
    this.client = client;
  }

  static async createDriver(): Promise<Driver> {
    if (this.mssqlClient) {
      return new MssqlDriver(this.mssqlClient);
    }

    const mssqlModule = await import("mssql").catch(() => {
      throw new DriverNotFoundError("mssql");
    });

    this.mssqlClient =
      (mssqlModule as { default?: MssqlImport }).default ?? mssqlModule;

    if (!this.mssqlClient) {
      throw new DriverNotFoundError("mssql");
    }

    return new MssqlDriver(this.mssqlClient);
  }
}
