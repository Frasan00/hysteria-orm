import type { MongoClientImport, MongoConnectionOptions } from "../../drivers/driver_constants";
import { DataSource } from "../../data_source/data_source";
import { CollectionManager } from "./mongo_models/mongo_collection_manager";
import { DriverFactory } from "../../drivers/drivers_factory";
import { HysteriaError } from "../../errors/hysteria_error";
import { Collection } from "./mongo_models/mongo_collection";
import { env } from "../../env/env";

type MongoClientInstance = InstanceType<MongoClientImport["MongoClient"]>;

export class MongoDataSource extends DataSource {
  declare url: string;
  declare isConnected: boolean;
  private mongoClient: MongoClientInstance;
  private static instance: MongoDataSource | null = null;

  private constructor(url: string, mongoClient: MongoClientInstance) {
    super({ type: "mongo" });
    this.url = url;
    this.isConnected = false;
    this.mongoClient = mongoClient;
  }

  /**
   * @description Returns the current connection to the mongo client to execute direct statements using the mongo client from `mongodb` package
   */
  getCurrentConnection(): MongoClientInstance {
    return this.mongoClient;
  }

  /**
   * @description Connects to the mongo database using the provided url and options
   */
  static async connect(
    url?: string,
    options?: Partial<MongoConnectionOptions> & { logs?: boolean },
    cb?: (mongoDataSource: MongoDataSource) => Promise<void> | void,
  ): Promise<MongoDataSource> {
    if (!url) {
      url = env.MONGO_URL;
      if (!url) {
        throw new HysteriaError(
          "MongoDataSource::connect url is required to connect to mongo database and was not provided in the options nor the environment variables",
          "REQUIRED_VALUE_NOT_SET",
        );
      }
    }

    const driver = (await DriverFactory.getDriver("mongo"))
      .client as MongoClientImport;
    const mongoClient = new driver.MongoClient(url, options);
    await mongoClient.connect();
    this.instance = new MongoDataSource(url, mongoClient);
    this.instance.isConnected = true;
    this.instance.logs = options?.logs || env.MONGO_LOGS || false;
    await cb?.(this.instance);
    return this.instance;
  }

  static getInstance(): MongoDataSource {
    if (!MongoDataSource.instance) {
      throw new HysteriaError(
        "MongoDataSource::getInstance mongo database connection not established",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    return MongoDataSource.instance;
  }

  /**
   * @description Starts a new session and transaction using the current connection
   */
  startSession(): InstanceType<MongoClientImport["ClientSession"]> {
    const session = this.mongoClient.startSession();
    session.startTransaction();
    return session;
  }

  /**
   * @description Disconnects from the mongo database using the current connection established by the `connect` method
   */
  static async disconnect(): Promise<void> {
    if (!this.instance) {
      throw new HysteriaError(
        "MongoDataSource::disconnect mongo database connection not established",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    await this.instance.disconnect();
  }

  /**
   * @description Disconnects from the mongo database
   */
  async disconnect(): Promise<void> {
    await this.mongoClient.close();
    this.isConnected = false;
  }

  /**
   * @description Closes the current connection to the mongo database
   * @alias disconnect
   */
  async closeConnection(): Promise<void> {
    await this.disconnect();
  }

  /**
   * @description Executes a callback function with the provided connection details
   * @alias disconnect
   */
  static async closeConnection(): Promise<void> {
    await this.disconnect();
  }

  /**
   * @description Executes a callback function with the provided connection details
   */
  static async useConnection(
    this: typeof MongoDataSource,
    connectionDetails: {
      url: string;
      options?: MongoConnectionOptions;
    },
    cb: (mongoDataSource: MongoDataSource) => Promise<void>,
  ): Promise<void> {
    const driver = (await DriverFactory.getDriver("mongo"))
      .client as MongoClientImport;
    const mongoClient = new driver.MongoClient(
      connectionDetails.url,
      connectionDetails.options,
    );
    await mongoClient.connect();
    const mongoDataSource = new MongoDataSource(
      connectionDetails.url,
      mongoClient,
    );
    await cb(mongoDataSource);
    await mongoClient.close();
  }

  static query(collection: string) {
    return this.getInstance().query(collection);
  }

  query(collection: string) {
    if (!this.isConnected) {
      throw new HysteriaError(
        "MongoDataSource::query",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    return this.getModelManager(
      { _collection: collection } as typeof Collection,
      this,
    ).query();
  }

  getModelManager<T extends Collection>(
    model: typeof Collection,
    mongoDataSource: MongoDataSource,
    session?: InstanceType<MongoClientImport["ClientSession"]>,
  ): CollectionManager<T> {
    return new CollectionManager<T>(model, mongoDataSource, session, this.logs);
  }
}
