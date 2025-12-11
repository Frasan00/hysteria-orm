import { Driver } from "./driver";
import { DriverNotFoundError } from "./driver_constants";
import { DriverSpecificOptions, Mysql2Import } from "./driver_types";

export class MysqlDriver extends Driver {
  static mysqlClient: Mysql2Import | null = null;

  override type = "mysql" as const;
  override client: Mysql2Import;

  constructor(
    client: Mysql2Import,
    driverSpecificOptions?: DriverSpecificOptions<"mysql">,
  ) {
    super(driverSpecificOptions);
    this.client = client;
  }

  static async createDriver(): Promise<Driver> {
    if (this.mysqlClient) {
      return new MysqlDriver(this.mysqlClient);
    }

    const mysqlModule = await import("mysql2/promise").catch(() => {
      throw new DriverNotFoundError("mysql2");
    });

    this.mysqlClient =
      (mysqlModule as { default?: Mysql2Import }).default ?? mysqlModule;

    if (!this.mysqlClient) {
      throw new DriverNotFoundError("mysql2");
    }

    return new MysqlDriver(this.mysqlClient);
  }
}
