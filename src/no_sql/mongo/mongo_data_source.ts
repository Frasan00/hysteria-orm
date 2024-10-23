import { DataSource, DataSourceInput } from "../../data_source";
import * as mongodb from "mongodb";
import { CollectionManager } from "./mongo_models/mongo_collection_manager";
import dotenv from "dotenv";
import { Collection } from "./mongo_models/mongo_collection";

dotenv.config();

export type MongoDataSourceInput = Exclude<
  DataSourceInput,
  "pgOptions" | "mysqlOptions"
>;

export class MongoDataSource extends DataSource {
  url: string;
  isConnected: boolean;
  private mongoClient: mongodb.MongoClient;
  private static instance: MongoDataSource | null = null;

  private constructor(url: string, mongoClient: mongodb.MongoClient) {
    super({ type: "mongo" });
    this.url = url;
    this.isConnected = false;
    this.mongoClient = mongoClient;
  }

  /**
   * @description Returns the current connection to the mongo client to execute direct statements using the mongo client from `mongodb` package
   * @returns {mongodb.MongoClient} - returns the current connection to the mongo database
   */
  getCurrentConnection(): mongodb.MongoClient {
    return this.mongoClient;
  }

  /**
   * @description Connects to the mongo database using the provided url and options
   * @returns
   */
  static async connect(
    url?: string,
    options?: MongoDataSourceInput["mongoOptions"] & { logs?: boolean },
    cb?: () => void,
  ): Promise<MongoDataSource> {
    if (!url) {
      url = process.env.MONGO_URL;
      if (!url) {
        throw new Error(
          "url is required to connect to mongo database and was not provided in the options nor the environment variables",
        );
      }
    }

    const mongoClient = new mongodb.MongoClient(url, options);
    await mongoClient.connect();
    this.instance = new MongoDataSource(url, mongoClient);
    this.instance.isConnected = true;
    this.instance.logs =
      options?.logs || process.env.MONGO_LOGS === "true" || false;
    cb?.();
    return this.instance;
  }

  static getInstance(): MongoDataSource {
    if (!MongoDataSource.instance) {
      throw new Error("mongo database connection not established");
    }

    return MongoDataSource.instance;
  }

  /**
   * @description Starts a new session and transaction using the current connection
   * @returns {mongodb.ClientSession}
   */
  startSession(): mongodb.ClientSession {
    const session = this.mongoClient.startSession();
    session.startTransaction();
    return session;
  }

  /**
   * @description Disconnects from the mongo database using the current connection established by the `connect` method
   */
  static async disconnect(): Promise<void> {
    if (!this.instance) {
      throw new Error("mongo database connection not established");
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
  static async useConnection<T extends Collection>(
    this: typeof MongoDataSource,
    connectionDetails: {
      url: string;
      options?: MongoDataSourceInput["mongoOptions"];
    },
    cb: (mongoDataSource: MongoDataSource) => Promise<void>,
  ): Promise<void> {
    const mongoClient = new mongodb.MongoClient(
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

  getModelManager<T extends Collection>(
    model: typeof Collection,
    mongoDataSource: MongoDataSource,
    session?: mongodb.ClientSession,
  ): CollectionManager<T> {
    return new CollectionManager<T>(model, mongoDataSource, session, this.logs);
  }
}
