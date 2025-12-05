import { Driver } from "./driver";
import { DriverNotFoundError } from "./driver_constants";
import { DriverSpecificOptions, Sqlite3Import } from "./driver_types";

export class Sqlite3Driver extends Driver {
  override type = "sqlite" as const;
  override client: Sqlite3Import;

  constructor(
    client: Sqlite3Import,
    driverSpecificOptions?: DriverSpecificOptions<"sqlite">,
  ) {
    super(driverSpecificOptions);
    this.client = client;
  }

  static async createDriver(): Promise<Driver> {
    const sqlite3 = await import("sqlite3").catch(() => {
      throw new DriverNotFoundError("sqlite3");
    });
    if (!sqlite3) {
      throw new DriverNotFoundError("sqlite3");
    }

    return new Sqlite3Driver(sqlite3.default);
  }
}
