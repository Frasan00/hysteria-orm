import { Driver } from "./driver";
import { DriverNotFoundError } from "./driver_constants";
import { DriverSpecificOptions, OracleDBImport } from "./driver_types";

export class OracleDBDriver extends Driver {
  static oracledbClient: OracleDBImport | null = null;

  override type = "oracledb" as const;
  override client: OracleDBImport;

  constructor(
    client: OracleDBImport,
    driverSpecificOptions?: DriverSpecificOptions<"oracledb">,
  ) {
    super(driverSpecificOptions);
    this.client = client;
  }

  static async createDriver(): Promise<Driver> {
    if (this.oracledbClient) {
      return new OracleDBDriver(this.oracledbClient);
    }

    const oracledbModule = await import("oracledb").catch(() => {
      throw new DriverNotFoundError("oracledb");
    });

    this.oracledbClient =
      (oracledbModule as { default?: OracleDBImport }).default ??
      oracledbModule;

    if (!this.oracledbClient) {
      throw new DriverNotFoundError("oracledb");
    }

    return new OracleDBDriver(this.oracledbClient);
  }
}
