import { Driver } from "./driver";
import { DriverNotFoundError } from "./driver_constants";
import { DriverSpecificOptions, PgImport } from "./driver_types";

export class PgDriver extends Driver {
  override type = "postgres" as const;
  override client: PgImport;

  constructor(
    client: PgImport,
    driverSpecificOptions?: DriverSpecificOptions<"postgres">,
  ) {
    super(driverSpecificOptions);
    this.client = client;
  }

  static async createDriver(): Promise<Driver> {
    const pg = await import("pg").catch(() => {
      throw new DriverNotFoundError("pg");
    });
    if (!pg) {
      throw new DriverNotFoundError("pg");
    }

    return new PgDriver(pg.default);
  }
}
