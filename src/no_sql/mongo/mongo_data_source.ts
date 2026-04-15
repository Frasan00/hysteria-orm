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
import { MongoQueryBuilder } from "./query_builder/mongo_query_builder";

type MongoClientInstance = InstanceType<MongoClientImport["MongoClient"]>;

import type { LoggerConfig } from "../../utils/logger";

export interface MongoDataSourceInput {
  url?: string;
  options?: MongoConnectionOptions;
  logs?: boolean | LoggerConfig;
  lazyLoad?: boolean;
}

export class MongoDataSource extends DataSource {
  declare url: string;
  declare isConnected: boolean;
  private mongoClient: MongoClientInstance | null = null;
  private mongoOptions?: MongoConnectionOptions;
  private lazyLoad: boolean;
  private connecting: Promise<void> | null = null;

  constructor(input?: MongoDataSourceInput) {
    super({ type: "mongo", url: input?.url, logs: input?.logs });
    this.isConnected = false;
    this.mongoOptions = input?.options;
    this.lazyLoad = input?.lazyLoad ?? false;

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
   * @description Ensures the connection is established. If lazyLoad is true and not connected, connects automatically.
   */
  async ensureConnected(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    if (!this.lazyLoad) {
      throw new HysteriaError(
        "MongoDataSource::ensureConnected",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    if (!this.connecting) {
      this.connecting = this.connect().finally(() => {
        this.connecting = null;
      });
    }

    await this.connecting;
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
   * @description Returns a CollectionManager for the given collection class,
   * providing query(), find(), findOne(), insert(), etc.
   * When a string is passed, returns a raw MongoQueryBuilder for the collection name.
   */
  from<T extends Collection>(
    collection: (new (...args: any[]) => T) & Record<string, any>,
    options?: { session?: InstanceType<MongoClientImport["ClientSession"]> },
  ): CollectionManager<T>;
  from(collectionName: string): MongoQueryBuilder<Collection>;
  from<T extends Collection>(
    collectionOrName:
      | ((new (...args: any[]) => T) & Record<string, any>)
      | string,
    options?: { session?: InstanceType<MongoClientImport["ClientSession"]> },
  ): CollectionManager<T> | MongoQueryBuilder<Collection> {
    if (!this.isConnected && !this.lazyLoad) {
      throw new HysteriaError(
        "MongoDataSource::from",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    if (typeof collectionOrName === "string") {
      const model = {
        _collection: collectionOrName,
        collection: collectionOrName,
        beforeInsert: undefined,
        beforeFetch: undefined,
        beforeUpdate: undefined,
        beforeDelete: undefined,
        afterFetch: undefined,
      } as unknown as typeof Collection;

      return this.getModelManager(model, this).query();
    }

    return this.getModelManager<T>(
      collectionOrName as unknown as typeof Collection,
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
