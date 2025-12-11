import { Driver } from "./driver";
import { DriverNotFoundError } from "./driver_constants";
import { DriverSpecificOptions, Sqlite3Import } from "./driver_types";

export class Sqlite3Driver extends Driver {
  static sqlite3Client: Sqlite3Import | null = null;

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
    if (this.sqlite3Client) {
      return new Sqlite3Driver(this.sqlite3Client);
    }

    const sqliteModule = await import("sqlite3").catch(() => {
      throw new DriverNotFoundError("sqlite3");
    });

    this.sqlite3Client =
      (sqliteModule as { default?: Sqlite3Import }).default ?? sqliteModule;

    if (!this.sqlite3Client) {
      throw new DriverNotFoundError("sqlite3");
    }

    return new Sqlite3Driver(this.sqlite3Client);
  }
}
