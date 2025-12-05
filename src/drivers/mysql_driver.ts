import { Driver } from "./driver";
import { DriverNotFoundError } from "./driver_constants";
import { DriverSpecificOptions, Mysql2Import } from "./driver_types";

export class MysqlDriver extends Driver {
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
    const mysql2 = await import("mysql2/promise").catch(() => {
      throw new DriverNotFoundError("mysql2");
    });

    if (!mysql2) {
      throw new DriverNotFoundError("mysql");
    }

    return new MysqlDriver(mysql2.default);
  }
}
