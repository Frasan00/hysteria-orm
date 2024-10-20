import { DataSource, DataSourceInput } from "../../data_source";
import * as mongodb from "mongodb";
import { MongoModelManager } from "./mongo_models/mongo_model_manager";
import dotenv from "dotenv";
import { MongoModel } from "./mongo_models/mongo_model";

dotenv.config();

export type MongoDataSourceInput = Exclude<
  DataSourceInput,
  "pgOptions" | "mysqlOptions"
>;

export class MongoDataSource extends DataSource {
  public url: string;
  public isConnected: boolean;
  private mongoClient: mongodb.MongoClient;
  private static instance: MongoDataSource | null = null;

  private constructor(url: string, mongoClient: mongodb.MongoClient) {
    super({ type: "mongo" });
    this.url = url;
    this.isConnected = false;
    this.mongoClient = mongoClient;
  }

  public getCurrentConnection(): mongodb.MongoClient {
    return this.mongoClient;
  }

  public static async connect(
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
      throw new Error("sql database connection not established");
    }

    return MongoDataSource.instance;
  }

  public async disconnect(): Promise<void> {
    await this.mongoClient.close();
    this.isConnected = false;
  }

  public getModelManager<T extends MongoModel>(
    model: typeof MongoModel,
    mongoDataSource: MongoDataSource,
  ): MongoModelManager<T> {
    return new MongoModelManager<T>(model, mongoDataSource, this.logs);
  }
}
