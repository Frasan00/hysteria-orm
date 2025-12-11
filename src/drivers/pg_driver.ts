import { Driver } from "./driver";
import { DriverNotFoundError } from "./driver_constants";
import { DriverSpecificOptions, PgImport } from "./driver_types";

export class PgDriver extends Driver {
  static pgClient: PgImport | null = null;

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
    if (this.pgClient) {
      return new PgDriver(this.pgClient);
    }

    const pgModule = await import("pg").catch(() => {
      throw new DriverNotFoundError("pg");
    });

    this.pgClient = (pgModule as { default?: PgImport }).default ?? pgModule;

    if (!this.pgClient) {
      throw new DriverNotFoundError("pg");
    }

    return new PgDriver(this.pgClient);
  }
}
