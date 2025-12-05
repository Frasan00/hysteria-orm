import { Driver } from "./driver";
import { DriverNotFoundError } from "./driver_constants";
import { DriverSpecificOptions, MongoClientImport } from "./driver_types";

export class MongoDriver extends Driver {
  override type = "mongo" as const;
  override client: MongoClientImport;

  constructor(
    client: MongoClientImport,
    driverSpecificOptions?: DriverSpecificOptions<"mongo">,
  ) {
    super(driverSpecificOptions);
    this.client = client;
  }

  static async createDriver(): Promise<Driver> {
    const mongo = await import("mongodb").catch(() => {
      throw new DriverNotFoundError("mongodb");
    });
    if (!mongo) {
      throw new DriverNotFoundError("mongodb");
    }

    return new MongoDriver(mongo);
  }
}
