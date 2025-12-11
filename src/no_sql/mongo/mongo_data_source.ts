import { DataSource } from "../../data_source/data_source";
import type {
  MongoClientImport,
  MongoConnectionOptions,
} from "../../drivers/driver_types";
import { DriverFactory } from "../../drivers/drivers_factory";
import { env } from "../../env/env";
import { HysteriaError } from "../../errors/hysteria_error";
import { Collection } from "./mongo_models/mongo_collection";
import { CollectionManager } from "./mongo_models/mongo_collection_manager";

type MongoClientInstance = InstanceType<MongoClientImport["MongoClient"]>;

export interface MongoDataSourceInput {
  url?: string;
  options?: MongoConnectionOptions;
  logs?: boolean;
}

export class MongoDataSource extends DataSource {
  declare url: string;
  declare isConnected: boolean;
  private mongoClient: MongoClientInstance | null = null;
  private mongoOptions?: MongoConnectionOptions;
  private static instance: MongoDataSource | null = null;

  constructor(input?: MongoDataSourceInput) {
    super({ type: "mongo", url: input?.url, logs: input?.logs });
    this.isConnected = false;
    this.mongoOptions = input?.options;

    if (!this.url) {
      this.url = env.MONGO_URL as string;
    }
  }

  /**
   * @description Establishes the connection to MongoDB and sets this as the primary instance
   */
  async connect(): Promise<void> {
    if (!this.url) {
      throw new HysteriaError(
        "MongoDataSource::connect url is required to connect to mongo database and was not provided in the options nor the environment variables",
        "REQUIRED_VALUE_NOT_SET",
      );
    }

    const driver = (await DriverFactory.getDriver("mongo"))
      .client as MongoClientImport;
    this.mongoClient = new driver.MongoClient(this.url, this.mongoOptions);
    await this.mongoClient.connect();
    this.isConnected = true;
    MongoDataSource.instance = this;
  }

  /**
   * @description Establishes the connection without setting this as the primary instance
   */
  private async connectWithoutSettingPrimary(): Promise<void> {
    if (!this.url) {
      throw new HysteriaError(
        "MongoDataSource::connect url is required to connect to mongo database and was not provided in the options nor the environment variables",
        "REQUIRED_VALUE_NOT_SET",
      );
    }

    const driver = (await DriverFactory.getDriver("mongo"))
      .client as MongoClientImport;
    this.mongoClient = new driver.MongoClient(this.url, this.mongoOptions);
    await this.mongoClient.connect();
    this.isConnected = true;
  }

  /**
   * @description Returns the current connection to the mongo client to execute direct statements using the mongo client from `mongodb` package
   */
  getCurrentConnection(): MongoClientInstance {
    if (!this.mongoClient) {
      throw new HysteriaError(
        "MongoDataSource::getCurrentConnection mongo database connection not established",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }
    return this.mongoClient;
  }

  /**
   * @description Creates a secondary connection to MongoDB (does not become the primary instance)
   */
  static async connectToSecondarySource(
    input: MongoDataSourceInput,
  ): Promise<MongoDataSource> {
    const mongoDataSource = new MongoDataSource(input);
    await mongoDataSource.connectWithoutSettingPrimary();
    return mongoDataSource;
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
    if (!this.mongoClient) {
      throw new HysteriaError(
        "MongoDataSource::startSession mongo database connection not established",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }
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
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
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
   * @description Executes a callback function with the provided connection details, automatically closing the connection when done
   */
  static async useConnection(
    this: typeof MongoDataSource,
    input: MongoDataSourceInput,
    cb: (mongoDataSource: MongoDataSource) => Promise<void>,
  ): Promise<void> {
    const mongoDataSource = new MongoDataSource(input);
    await mongoDataSource.connectWithoutSettingPrimary();
    try {
      await cb(mongoDataSource);
    } finally {
      await mongoDataSource.disconnect();
    }
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
