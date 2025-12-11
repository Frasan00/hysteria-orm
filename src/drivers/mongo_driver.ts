import { Driver } from "./driver";
import { DriverNotFoundError } from "./driver_constants";
import { DriverSpecificOptions, MongoClientImport } from "./driver_types";

export class MongoDriver extends Driver {
  static mongoClient: MongoClientImport | null = null;

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
    if (this.mongoClient) {
      return new MongoDriver(this.mongoClient);
    }

    const mongoModule = await import("mongodb").catch(() => {
      throw new DriverNotFoundError("mongodb");
    });

    this.mongoClient =
      (mongoModule as { default?: MongoClientImport }).default ?? mongoModule;

    if (!this.mongoClient) {
      throw new DriverNotFoundError("mongodb");
    }

    return new MongoDriver(this.mongoClient);
  }
}
