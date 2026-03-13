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

import type { LoggerConfig } from "../../utils/logger";

export interface MongoDataSourceInput {
  url?: string;
  options?: MongoConnectionOptions;
  logs?: boolean | LoggerConfig;
}

export class MongoDataSource extends DataSource {
  declare url: string;
  declare isConnected: boolean;
  private mongoClient: MongoClientInstance | null = null;
  private mongoOptions?: MongoConnectionOptions;

  constructor(input?: MongoDataSourceInput) {
    super({ type: "mongo", url: input?.url, logs: input?.logs });
    this.isConnected = false;
    this.mongoOptions = input?.options;

    if (!this.url) {
      this.url = env.MONGO_URL as string;
    }
  }

  /**
   * @description Establishes the connection to MongoDB
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
   * @description Returns a raw MongoQueryBuilder for a collection name string
   */
  query(collectionName: string) {
    if (!this.isConnected) {
      throw new HysteriaError(
        "MongoDataSource::query",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    const model = {
      _collection: collectionName,
      collection: collectionName,
      beforeInsert: undefined,
      beforeFetch: undefined,
      beforeUpdate: undefined,
      beforeDelete: undefined,
      afterFetch: undefined,
    } as unknown as typeof Collection;

    return this.getModelManager(model, this).query();
  }

  /**
   * @description Returns a CollectionManager for the given collection class,
   * providing query(), find(), findOne(), insert(), etc.
   */
  from<T extends Collection>(
    collection: (new (...args: any[]) => T) & Record<string, any>,
    options?: { session?: InstanceType<MongoClientImport["ClientSession"]> },
  ): CollectionManager<T> {
    if (!this.isConnected) {
      throw new HysteriaError(
        "MongoDataSource::from",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    return this.getModelManager<T>(
      collection as unknown as typeof Collection,
      this,
      options?.session,
    );
  }

  getModelManager<T extends Collection>(
    model: typeof Collection,
    mongoDataSource: MongoDataSource,
    session?: InstanceType<MongoClientImport["ClientSession"]>,
  ): CollectionManager<T> {
    return new CollectionManager<T>(model, mongoDataSource, session, this.logs);
  }
}
